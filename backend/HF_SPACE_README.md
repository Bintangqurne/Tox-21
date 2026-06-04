---
title: Tox21 GNN Toxicity Predictor API
emoji: 🧪
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: GNN-based prediction of molecular toxicity (12 Tox21 endpoints)
---

# Tox21 GNN Toxicity Predictor — Backend API

Backend FastAPI yang menyajikan prediksi toksisitas molekul menggunakan model **GCN/GAT** yang dilatih pada dataset Tox21 (12 endpoint).

## Endpoint Utama

- `GET /api/health` — status model & device
- `POST /api/predict` — prediksi 12 endpoint untuk satu SMILES
- `POST /api/predict/batch` — prediksi batch (max 200 SMILES)
- `POST /api/predict/csv` — upload CSV dengan kolom `smiles`
- `POST /api/atom-importance` — visualisasi atom importance (occlusion)
- `POST /api/applicability-domain` — cek reliabilitas via Tanimoto similarity ke training set
- `GET /api/toxicophores?smiles=...` — deteksi gugus reaktif (SMARTS pattern)
- `GET /api/molecule/svg` — render struktur 2D dengan optional highlight
- `GET /api/endpoints` — knowledge base 12 endpoint Tox21
- `GET /api/models`, `GET /api/metrics` — info model + per-task ROC-AUC

## Dokumentasi Interaktif

Buka `/docs` untuk Swagger UI: https://USERNAME-tox21-api.hf.space/docs

## Stack

- FastAPI + Uvicorn
- DeepChem 2.8 + PyTorch 2.4 (CPU-only)
- DGL 2.4 (graph backend)
- RDKit (cheminformatics)

## Repositori Source Code

Lihat repositori lengkap (frontend Next.js + notebook training): [GitHub link kamu]
