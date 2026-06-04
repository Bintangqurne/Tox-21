# Tox21 Toxicity Predictor — Frontend

Next.js 16.2 + React 19 dashboard untuk memprediksi toksisitas molekul dengan model GNN dari `../Tox21.ipynb` via backend FastAPI di `../backend/`.

## Prasyarat

1. Backend FastAPI harus jalan di `http://localhost:8000`. Lihat [../backend/README.md](../backend/README.md).
2. `.env.local` berisi `NEXT_PUBLIC_API_URL=http://localhost:8000` (sudah dibuat default).

## Setup

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Fitur

- **Single prediction**: input SMILES, lihat probabilitas 12 endpoint Tox21 + struktur 2D
- **Molekul contoh**: Aspirin, Caffeine, Paracetamol, dll — klik untuk auto-fill
- **Batch CSV**: upload CSV dengan kolom `smiles` untuk prediksi banyak molekul
- **Health badge**: status backend + model terlihat di header

## Struktur

```
app/
├── page.tsx                    Dashboard utama
├── layout.tsx                  Root layout + font + metadata
├── globals.css                 Tailwind + theme
├── lib/api.ts                  Typed fetch client untuk backend
└── components/
    ├── SmilesInput.tsx         Textarea input + submit button
    ├── ExampleMolecules.tsx    Grid molekul preset
    ├── MoleculeStructure.tsx   Render SVG struktur dari backend
    ├── PredictionTable.tsx     Tabel 12 endpoint + bar visual
    ├── BatchUpload.tsx         CSV upload + tabel hasil
    └── HealthBadge.tsx         Status backend di header
```
