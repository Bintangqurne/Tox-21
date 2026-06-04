"""FastAPI app untuk Tox21 GNN toxicity prediction."""
import csv
import io
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from endpoints_info import ENDPOINTS_INFO, ENDPOINT_CATEGORIES
from examples import EXAMPLE_MOLECULES
from inference import service
from molecule import render_svg, find_toxicophores
from schemas import (
    AtomImportanceRequest,
    AtomImportanceResponse,
    CategoryInfo,
    EndpointDetail,
    ExamplesResponse,
    HealthResponse,
    MetricsResponse,
    ModelInfo,
    ModelsResponse,
    PredictBatchRequest,
    PredictBatchResponse,
    PredictRequest,
    PredictResponse,
    TasksResponse,
    ToxicophoreMatch,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        service.load()
    except Exception as e:
        print(f"[WARN] Model load failed: {e}")
    yield


app = FastAPI(
    title="Tox21 GNN Toxicity Prediction API",
    description="Inference API untuk model GCN/GAT yang dilatih pada 12 endpoint Tox21",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration
# - Local dev: localhost:3000
# - Production: qurne.com + semua subdomain *.qurne.com
# - Preview: semua *.vercel.app (auto-generated preview deployments)
# - Tambahan: lewat env var ALLOWED_ORIGINS (comma-separated)
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://qurne.com",
    "https://www.qurne.com",
]
_extra_origins = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    # Regex: terima semua subdomain qurne.com dan semua preview *.vercel.app
    allow_origin_regex=r"https://([a-zA-Z0-9-]+\.)*qurne\.com|https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── Health & metadata ─────────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        model_loaded=service._loaded,
        device=str(service.device),
        best_model=service.best_model_name if service._loaded else "unloaded",
        loaded_models=list(service.models.keys()),
        n_tasks=len(service.tasks),
    )


@app.get("/api/tasks", response_model=TasksResponse)
def list_tasks():
    if not service._loaded:
        raise HTTPException(status_code=503, detail="Model belum siap")
    return TasksResponse(tasks=[
        {"name": t, "description": service.task_descriptions.get(t, "")}
        for t in service.tasks
    ])


@app.get("/api/models", response_model=ModelsResponse)
def list_models():
    """List semua model yang di-load beserta test AUC per model."""
    if not service._loaded:
        raise HTTPException(status_code=503, detail="Model belum siap")
    metrics = service.get_metrics()
    models = []
    for name in ["GCN", "GAT"]:
        if name in metrics:
            m = metrics[name]
            models.append(ModelInfo(
                name=name,
                loaded=True,
                test_auc=m.get("test_auc"),
                test_prc=m.get("test_prc"),
                per_task=m.get("per_task", {}),
                is_best=(name == service.best_model_name),
            ))
        elif name in [n.lower().upper() for n in service.model_info]:
            models.append(ModelInfo(name=name, loaded=False))
    return ModelsResponse(best_model=service.best_model_name, models=models)


@app.get("/api/metrics", response_model=MetricsResponse)
def get_metrics():
    """Per-model, per-task test ROC-AUC. Gunakan untuk tampilkan reliability di frontend."""
    if not service._loaded:
        raise HTTPException(status_code=503, detail="Model belum siap")
    metrics = service.get_metrics()
    return MetricsResponse(
        tasks=service.tasks,
        models={name: m.get("per_task", {}) for name, m in metrics.items()},
    )


# ─── Examples, categories, endpoints ──────────────────────────────────────────

@app.get("/api/examples", response_model=ExamplesResponse)
def list_examples():
    return ExamplesResponse(examples=EXAMPLE_MOLECULES)


@app.get("/api/endpoints", response_model=list[EndpointDetail])
def list_endpoints():
    return ENDPOINTS_INFO


@app.get("/api/categories", response_model=list[CategoryInfo])
def list_molecule_categories():
    from collections import Counter
    counts = Counter(m["category"] for m in EXAMPLE_MOLECULES)
    category_labels = {
        "drugs": "Obat-obatan Umum",
        "hormones": "Hormon & Steroid",
        "endocrine_disruptors": "Pengganggu Endokrin",
        "solvents": "Pelarut Industri",
        "pesticides": "Pestisida",
        "food_additives": "Aditif Makanan",
        "carcinogens": "Karsinogen Klasik",
        "natural": "Senyawa Alami",
    }
    return [
        CategoryInfo(slug=slug, name=label, count=counts.get(slug, 0))
        for slug, label in category_labels.items()
    ]


# ─── Prediction ────────────────────────────────────────────────────────────────

@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not service._loaded:
        raise HTTPException(status_code=503, detail="Model belum siap - cek /api/health")
    try:
        result = service.predict_one(req.smiles, model_name=req.model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@app.post("/api/predict/batch", response_model=PredictBatchResponse)
def predict_batch(req: PredictBatchRequest):
    if not service._loaded:
        raise HTTPException(status_code=503, detail="Model belum siap")
    results = service.predict_many(req.smiles_list, model_name=req.model)
    return PredictBatchResponse(
        model=service.best_model_name if not req.model else req.model,
        count=len(results),
        results=results,
    )


@app.post("/api/predict/csv", response_model=PredictBatchResponse)
async def predict_csv(file: UploadFile = File(...)):
    """Upload CSV dengan kolom 'smiles' untuk batch prediction."""
    if not service._loaded:
        raise HTTPException(status_code=503, detail="Model belum siap")
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File harus berformat .csv")

    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File harus UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV kosong atau tidak punya header")

    smiles_col = next((c for c in reader.fieldnames if c.lower().strip() == "smiles"), None)
    if smiles_col is None:
        raise HTTPException(
            status_code=400,
            detail=f"CSV harus punya kolom 'smiles'. Kolom ditemukan: {reader.fieldnames}",
        )

    smiles_list = [row[smiles_col].strip() for row in reader if row.get(smiles_col, "").strip()]
    if not smiles_list:
        raise HTTPException(status_code=400, detail="Tidak ada SMILES valid di CSV")
    if len(smiles_list) > 200:
        raise HTTPException(status_code=400, detail="Batch maksimum 200 SMILES per upload")

    results = service.predict_many(smiles_list)
    return PredictBatchResponse(
        model=service.best_model_name,
        count=len(results),
        results=results,
    )


# ─── Interpretability ─────────────────────────────────────────────────────────

@app.post("/api/atom-importance", response_model=AtomImportanceResponse)
def atom_importance(req: AtomImportanceRequest):
    """
    Hitung atom importance via occlusion untuk satu task.
    Mungkin lambat (~1-2s) untuk molekul besar — hasil di-cache per (smiles, task, model).
    """
    if not service._loaded:
        raise HTTPException(status_code=503, detail="Model belum siap")
    try:
        result = service.atom_importance(req.smiles, req.task, model_name=req.model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return AtomImportanceResponse(**result)


@app.get("/api/toxicophores")
def get_toxicophores(
    smiles: str = Query(..., min_length=1, max_length=1000),
) -> list[ToxicophoreMatch]:
    """Deteksi toxicophore SMARTS yang match di molekul."""
    from molecule import parse_smiles
    if parse_smiles(smiles) is None:
        raise HTTPException(status_code=400, detail=f"SMILES tidak valid: {smiles!r}")
    matches = find_toxicophores(smiles)
    return [ToxicophoreMatch(**m) for m in matches]


# ─── Molecule SVG (extended with highlight) ────────────────────────────────────

@app.get("/api/molecule/svg")
def molecule_svg(
    smiles: str = Query(..., min_length=1, max_length=1000),
    width: int = Query(400, ge=100, le=1000),
    height: int = Query(300, ge=100, le=1000),
    highlight: str = Query("none", description="'none' | 'toxicophore' | 'importance'"),
    task: str = Query("", description="Task untuk importance highlight"),
    model: str = Query("", description="Model untuk importance highlight"),
):
    """
    Render struktur molekul 2D sebagai SVG.
    Opsional: highlight=toxicophore (warna gugus reaktif)
              highlight=importance&task=NR-AR (warna berdasarkan atom importance)
    """
    from molecule import parse_smiles as _parse

    if _parse(smiles) is None:
        raise HTTPException(status_code=400, detail=f"SMILES tidak valid: {smiles!r}")

    atom_colors: dict[int, tuple[float, float, float]] = {}
    bond_colors: dict[int, tuple[float, float, float]] = {}
    radii: dict[int, float] = {}

    if highlight == "toxicophore":
        matches = find_toxicophores(smiles)
        for match in matches:
            color = tuple(match["color"])  # type: ignore
            for ai in match["atom_indices"]:
                atom_colors[ai] = color
                radii[ai] = 0.35
            for bi in match["bond_indices"]:
                bond_colors[bi] = color

    elif highlight == "importance" and task and service._loaded:
        try:
            imp_data = service.atom_importance(smiles, task, model_name=model or None)
            importance = imp_data["importance"]
            if importance:
                max_abs = max(abs(v) for v in importance) or 1.0
                for i, imp in enumerate(importance):
                    norm = imp / max_abs  # -1 to 1
                    if norm > 0:
                        # Merah — atom mendorong toksisitas
                        r, g, b = 1.0, 1.0 - norm * 0.9, 1.0 - norm * 0.9
                    elif norm < 0:
                        # Biru — atom menurunkan toksisitas
                        r, g, b = 1.0 + norm * 0.9, 1.0 + norm * 0.9, 1.0
                    else:
                        continue
                    atom_colors[i] = (r, g, b)
                    radii[i] = 0.3 + abs(norm) * 0.25
        except Exception:
            pass  # Fallback ke normal render

    svg = render_svg(
        smiles,
        width=width,
        height=height,
        highlight_atoms=atom_colors or None,
        highlight_bonds=bond_colors or None,
        highlight_radii=radii or None,
    )
    if svg is None:
        raise HTTPException(status_code=400, detail=f"Render gagal: {smiles!r}")
    return Response(content=svg, media_type="image/svg+xml")
