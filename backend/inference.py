"""Load model GCN/GAT dari checkpoint dan jalankan inference.

Fitur:
- Load KEDUA model (GCN + GAT) jika checkpoint tersedia
- atom_importance() via occlusion-based method
- Cache atom importance per (smiles, task, model_name)
"""
import json
import os
from pathlib import Path
from typing import Any

import numpy as np

os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")

import deepchem as dc
import torch
from rdkit import Chem

from molecule import parse_smiles

PROJECT_ROOT = Path(__file__).resolve().parent.parent
# Default: ../checkpoints relatif terhadap backend/. Bisa di-override via env var
# untuk deployment Docker (mis. HuggingFace Spaces set ke /app/checkpoints).
CHECKPOINTS_DIR = Path(os.environ.get("CHECKPOINTS_PATH", str(PROJECT_ROOT / "checkpoints")))


class ModelService:
    """
    Wrapper untuk semua model Tox21 (GCN + GAT).
    Load sekali saat startup, reuse untuk semua request.
    """

    def __init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.featurizer = dc.feat.MolGraphConvFeaturizer(use_edges=True)
        self.tasks: list[str] = []
        self.task_descriptions: dict[str, str] = {}
        self.model_info: dict = {}
        self.best_model_name: str = "GCN"

        # Dual-model support
        self.models: dict[str, Any] = {}  # {"GCN": gcn_model, "GAT": gat_model}
        self.per_task_scores: dict[str, dict[str, float]] = {}  # {"GCN": {"NR-AR": 0.81, ...}}

        # Occlusion importance cache (smiles, task, model_name) -> importance_dict
        self._importance_cache: dict[tuple, dict] = {}

        self._loaded = False

    # ─── Internal helpers ─────────────────────────────────────────────────────

    def _instantiate(self, model_name: str, hp: dict):
        """Buat instance model sesuai nama + hyperparameter."""
        n = len(self.tasks)
        if model_name == "GCN":
            return dc.models.GCNModel(
                n_tasks=n,
                graph_conv_layers=hp["graph_conv_layers"],
                dropout=hp["dropout"],
                learning_rate=hp["learning_rate"],
                batch_size=hp["batch_size"],
                mode="classification",
                device=self.device,
            )
        else:  # GAT
            return dc.models.GATModel(
                n_tasks=n,
                n_attention_heads=hp["n_attention_heads"],
                dropout=hp["dropout"],
                learning_rate=hp["learning_rate"],
                batch_size=hp["batch_size"],
                mode="classification",
                device=self.device,
            )

    def _featurize_and_predict(self, smiles: str, model_name: str) -> np.ndarray:
        """Featurize satu SMILES dan return probabilitas [n_tasks]. Raise ValueError jika invalid."""
        mol = parse_smiles(smiles)
        if mol is None:
            raise ValueError(f"SMILES tidak valid: {smiles!r}")

        features = self.featurizer.featurize([smiles])
        if len(features) == 0 or features[0] is None:
            raise ValueError(f"Featurizer gagal: {smiles!r}")
        try:
            if features[0].num_nodes == 0:
                raise ValueError(f"Molekul tidak punya atom: {smiles!r}")
        except AttributeError:
            raise ValueError(f"Featurizer gagal: {smiles!r}")

        dataset = dc.data.NumpyDataset(
            X=features,
            y=np.zeros((1, len(self.tasks))),
            ids=[smiles],
        )
        m = self.models[model_name]
        preds = m.predict(dataset)  # [1, n_tasks, 2]
        return preds[0, :, 1].astype(float)  # [n_tasks] — probabilitas kelas positif

    # ─── Public API ───────────────────────────────────────────────────────────

    def load(self) -> None:
        """Baca metadata + restore weights. Idempotent."""
        if self._loaded:
            return

        tasks_path = CHECKPOINTS_DIR / "tasks.json"
        info_path = CHECKPOINTS_DIR / "model_info.json"

        if not tasks_path.exists() or not info_path.exists():
            raise RuntimeError(
                f"Metadata tidak ditemukan di {CHECKPOINTS_DIR}. "
                "Jalankan Tox21.ipynb sampai cell 'cell-export-artifacts' selesai."
            )

        with open(tasks_path) as f:
            payload = json.load(f)
            self.tasks = payload["tasks"]
            self.task_descriptions = payload["descriptions"]

        with open(info_path) as f:
            self.model_info = json.load(f)

        self.best_model_name = self.model_info["best_model"]

        # Load semua model yang checkpointnya ada
        for name in ["GCN", "GAT"]:
            cfg = self.model_info.get(name.lower())
            if not cfg:
                continue
            # Gunakan CHECKPOINTS_DIR sebagai base agar path benar di Docker
            # cfg["checkpoint_dir"] = "checkpoints/gcn_best", ambil nama folder saja
            ckpt_name = Path(cfg["checkpoint_dir"]).name  # "gcn_best" atau "gat_best"
            ckpt = CHECKPOINTS_DIR / ckpt_name
            if not ckpt.exists():
                print(f"[ModelService] {name} checkpoint tidak ditemukan di {ckpt}, skip")
                continue
            try:
                model = self._instantiate(name, cfg["hyperparameters"])
                model.restore(model_dir=str(ckpt))
                self.models[name] = model
                self.per_task_scores[name] = cfg.get("per_task_test_scores", {})
                print(f"[ModelService] {name} loaded from {ckpt} on {self.device}")
            except Exception as e:
                print(f"[ModelService] WARNING: gagal load {name}: {e}")

        if not self.models:
            raise RuntimeError("Tidak ada model yang berhasil di-load.")

        # Pastikan best_model_name konsisten dengan model yang loaded
        if self.best_model_name not in self.models:
            self.best_model_name = next(iter(self.models))

        self._loaded = True

    def predict_one(self, smiles: str, model_name: str | None = None) -> dict:
        """Prediksi 12 task untuk satu SMILES. Return dict siap jadi PredictResponse."""
        if not self._loaded:
            raise RuntimeError("Model belum di-load")

        m_name = model_name if (model_name and model_name in self.models) else self.best_model_name
        probs = self._featurize_and_predict(smiles, m_name)

        predictions = []
        for task, prob in zip(self.tasks, probs):
            predictions.append({
                "task": task,
                "probability": float(prob),
                "description": self.task_descriptions.get(task, ""),
                "flagged": float(prob) > 0.5,
            })

        highest = max(predictions, key=lambda p: p["probability"])
        return {
            "smiles": smiles,
            "model": m_name,
            "predictions": predictions,
            "highest_risk_task": highest["task"],
            "highest_risk_probability": highest["probability"],
        }

    def predict_many(self, smiles_list: list[str], model_name: str | None = None) -> list[dict]:
        """Prediksi batch dengan per-item error handling."""
        results = []
        m_name = model_name if (model_name and model_name in self.models) else self.best_model_name
        for smi in smiles_list:
            try:
                pred = self.predict_one(smi, model_name=m_name)
                results.append({
                    "smiles": smi,
                    "success": True,
                    "predictions": pred["predictions"],
                    "highest_risk_task": pred["highest_risk_task"],
                    "highest_risk_probability": pred["highest_risk_probability"],
                })
            except (ValueError, RuntimeError) as e:
                results.append({
                    "smiles": smi,
                    "success": False,
                    "error": str(e),
                })
        return results

    def atom_importance(
        self,
        smiles: str,
        task: str,
        model_name: str | None = None,
    ) -> dict:
        """
        Occlusion-based atom importance untuk satu task.

        Untuk tiap atom i, hapus atom itu (buat SMILES tanpa atom i) dan
        hitung baseline_prob - masked_prob. Nilai positif = atom mendorong
        prediksi toksik; negatif = atom menurunkan prediksi toksik.
        """
        if not self._loaded:
            raise RuntimeError("Model belum di-load")

        m_name = model_name if (model_name and model_name in self.models) else self.best_model_name

        # Cek cache
        cache_key = (smiles, task, m_name)
        if cache_key in self._importance_cache:
            return self._importance_cache[cache_key]

        if task not in self.tasks:
            raise ValueError(f"Task tidak dikenal: {task!r}")
        task_idx = self.tasks.index(task)

        mol = parse_smiles(smiles)
        if mol is None:
            raise ValueError(f"SMILES tidak valid: {smiles!r}")

        # Baseline prediction
        baseline_probs = self._featurize_and_predict(smiles, m_name)
        baseline_prob = float(baseline_probs[task_idx])

        # Occlusion per atom
        n_atoms = mol.GetNumAtoms()
        importance = []

        for atom_idx in range(n_atoms):
            try:
                rw = Chem.RWMol(mol)
                rw.RemoveAtom(atom_idx)
                masked_mol = rw.GetMol()
                if masked_mol is None or masked_mol.GetNumAtoms() == 0:
                    importance.append(0.0)
                    continue
                masked_smiles = Chem.MolToSmiles(masked_mol)
                if not masked_smiles:
                    importance.append(0.0)
                    continue
                masked_probs = self._featurize_and_predict(masked_smiles, m_name)
                masked_prob = float(masked_probs[task_idx])
                imp = baseline_prob - masked_prob
            except Exception:
                imp = 0.0
            importance.append(imp)

        result = {
            "task": task,
            "model": m_name,
            "atom_indices": list(range(n_atoms)),
            "importance": importance,
            "baseline_probability": baseline_prob,
            "smiles": smiles,
        }

        # Simpan ke cache (limit cache size)
        if len(self._importance_cache) > 200:
            oldest = next(iter(self._importance_cache))
            del self._importance_cache[oldest]
        self._importance_cache[cache_key] = result
        return result

    def get_metrics(self) -> dict:
        """Return per-model dan per-task test scores dari model_info."""
        result = {}
        for name in ["GCN", "GAT"]:
            cfg = self.model_info.get(name.lower())
            if not cfg or name not in self.models:
                continue
            result[name] = {
                "test_auc": cfg.get("test_roc_auc"),
                "test_prc": cfg.get("test_prc_auc"),
                "per_task": cfg.get("per_task_test_scores", {}),
                "loaded": True,
            }
        return result

    @property
    def model(self):
        """Best model (compat)."""
        return self.models.get(self.best_model_name)


# Singleton diakses oleh main.py
service = ModelService()
