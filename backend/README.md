# Backend API — Tox21 GNN Toxicity Prediction

FastAPI service yang membungkus model GCN/GAT terlatih dari `../Tox21.ipynb` untuk dipakai oleh frontend di `../compbio/`.

## Prasyarat

1. **Notebook sudah dijalankan minimal sekali** sampai cell `cell-export-artifacts`. Ini akan menghasilkan:
   - `../checkpoints/gcn_best/`
   - `../checkpoints/gat_best/`
   - `../checkpoints/tasks.json`
   - `../checkpoints/model_info.json`

2. **PyTorch + DGL CUDA** sudah terinstal (sudah ada di env notebook). Backend reuse env yang sama.

## Setup

```bash
pip install -r requirements.txt
```

`deepchem`, `torch`, `dgl`, `rdkit` biasanya sudah terinstal jika notebook sudah pernah jalan.

## Jalankan

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Akses Swagger UI di http://localhost:8000/docs

## Endpoints

| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/health` | Status service + apakah model loaded |
| GET | `/api/tasks` | Daftar 12 endpoint Tox21 + deskripsi |
| GET | `/api/examples` | Preset molekul untuk demo |
| POST | `/api/predict` | Prediksi single SMILES, body `{"smiles": "..."}` |
| POST | `/api/predict/batch` | Batch prediksi, body `{"smiles_list": [...]}` |
| POST | `/api/predict/csv` | Upload CSV (kolom `smiles`) |
| GET | `/api/molecule/svg?smiles=...` | Render struktur 2D sebagai SVG |

## Contoh

```bash
curl -X POST http://localhost:8000/api/predict \
     -H 'Content-Type: application/json' \
     -d '{"smiles":"CC(=O)Oc1ccccc1C(=O)O"}'
```
