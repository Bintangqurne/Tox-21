# Panduan Deploy — Backend (Render) + Frontend (Vercel)

Panduan ini menjelaskan cara men-deploy proyek Tox21 Toxicity Predictor ke:
- **Backend FastAPI** → [Render](https://render.com)
- **Frontend Next.js** → [Vercel](https://vercel.com)

---

## ⚠️ Hal yang Perlu Diketahui Dulu

### Backend stack berat — free tier Render TIDAK CUKUP

Backend menggunakan **DeepChem + PyTorch + DGL + RDKit** yang totalnya:
- **~1.5 GB disk** (CPU-only build, sudah dipangkas dari ~3GB CUDA build)
- **~800 MB RAM** saat runtime (PyTorch + 2 model + train fingerprints)

Konsekuensinya:

| Render Plan | RAM | Bisa? | Catatan |
|-------------|-----|-------|---------|
| Free        | 512 MB | ❌ | OOM saat import DeepChem |
| Starter ($7/mo) | 512 MB | ❌ | Sama saja |
| Standard ($25/mo) | 2 GB | ✅ | Pilihan minimum yang reliable |
| Pro ($85/mo)    | 4 GB | ✅ | Overkill, tapi sangat cepat |

**Alternatif gratis** kalau tidak mau bayar:
- **Hugging Face Spaces** (free, 16GB RAM untuk ML apps, support Docker)
- **Railway.app** (free trial $5 credit, 8GB RAM)
- **Fly.io** (free tier 3 vm × 256MB — masih kurang untuk stack ini)
- Self-host di VPS kecil (Hetzner CX22 €4/mo, 2GB RAM)

### Frontend ringan — Vercel free tier cukup

Next.js + React di Vercel hampir tidak ada batasan untuk hobby project. Tidak perlu bayar.

---

## 📦 Bagian 1: Persiapan Repo

### 1.1. Pastikan semua file ada

```bash
# Dari root proyek
ls backend/requirements.txt   # ✓ harus ada (sudah di-update untuk CPU-only)
ls backend/render.yaml         # ✓ harus ada
ls checkpoints/model_info.json # ✓ wajib
ls checkpoints/tasks.json      # ✓ wajib
ls checkpoints/gcn_best/       # ✓ folder weights GCN
ls checkpoints/gat_best/       # ✓ folder weights GAT (opsional kalau hanya GCN)
ls checkpoints/train_fingerprints.npz  # ⚠ opsional (untuk fitur Applicability Domain)
ls compbio/vercel.json         # ✓ harus ada
```

Kalau `train_fingerprints.npz` belum ada → run ulang `Tox21.ipynb` (cell `cell-export-artifacts`).

### 1.2. Git LFS untuk checkpoint (kalau total >50MB)

Total checkpoint saat ini hanya **~2.5 MB** → aman langsung commit ke Git biasa. Tidak perlu LFS.

```bash
# Cek ukuran
du -sh checkpoints/
```

Kalau ke depannya bobot model jadi besar (>50MB per file), pakai Git LFS:

```bash
git lfs install
git lfs track "*.pt" "*.npz" "checkpoints/**/*"
git add .gitattributes
```

### 1.3. Push ke GitHub

```bash
git init  # kalau belum
git add .
git commit -m "Initial deploy: Tox21 GNN predictor"
git remote add origin git@github.com:USERNAME/compbio.git
git push -u origin main
```

---

## 🚀 Bagian 2: Deploy Backend ke Render

### 2.1. Buat akun & connect repo

1. Daftar di https://render.com (login pakai GitHub paling gampang)
2. Klik **"New +"** → **"Blueprint"**
3. Pilih repository GitHub yang sudah di-push
4. Render akan otomatis baca [`backend/render.yaml`](backend/render.yaml) dan setup service

### 2.2. Setting yang perlu dicek

Setelah blueprint dimuat, verifikasi:

| Field | Value |
|-------|-------|
| Name | `tox21-api` (atau bebas) |
| Region | `singapore` (terdekat untuk Indonesia; bisa juga `oregon`) |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | `Python 3.11` |
| Build Command | `pip install --upgrade pip && pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Plan | **Standard ($25/mo)** — wajib! |

### 2.3. Environment Variables

Di dashboard Render → Service → **Environment**:

| Key | Value | Wajib? |
|-----|-------|--------|
| `PYTHON_VERSION` | `3.11` | ✅ |
| `ALLOWED_ORIGINS` | (kosong, atau domain non-qurne tambahan) | optional |
| `TORCH_HOME` | `/tmp/torch_cache` | optional |

> 💡 **Catatan CORS — sudah pre-configured untuk:**
> - `https://qurne.com` + **semua subdomain** `*.qurne.com` (mis. `tox21.qurne.com`, `app.qurne.com`)
> - Semua `*.vercel.app` (preview deployments otomatis)
> - `http://localhost:3000` (development lokal)
>
> Jadi kalau frontend deploy ke Vercel atau ke subdomain `qurne.com`, **tidak perlu setting `ALLOWED_ORIGINS`**. Env var ini hanya dipakai kalau ada domain lain (misal staging server custom).

### 2.4. Deploy

Klik **"Create Web Service"** atau **"Apply Blueprint"**.

Build pertama akan **lama (~10-15 menit)** karena harus install PyTorch + DeepChem + DGL. Build selanjutnya akan lebih cepat karena pip cache.

### 2.5. Cek deployment

Setelah build sukses, dapat URL seperti `https://tox21-api.onrender.com`. Test:

```bash
curl https://tox21-api.onrender.com/api/health
# Expected: {"status":"ok","model_loaded":true,"device":"cpu","best_model":"GCN",...}

curl -X POST https://tox21-api.onrender.com/api/predict \
  -H 'Content-Type: application/json' \
  -d '{"smiles":"CC(=O)Oc1ccccc1C(=O)O"}'
# Expected: JSON dengan 12 prediksi task
```

### 2.6. Troubleshooting umum

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Out of memory` | RAM tidak cukup | Upgrade ke Standard plan |
| `Cannot find module 'dgl'` | DGL install gagal | Tambah `dgl==2.4.0` di requirements |
| `Model load failed: Metadata tidak ditemukan` | `checkpoints/` tidak ke-push | Pastikan `.gitignore` tidak meng-exclude `checkpoints/` |
| `Health check failed` | Model belum loaded saat health check pertama | Tambah `healthCheckTimeout: 300` di render.yaml |
| Cold start ~30s | Render Free/Starter sleep | Upgrade ke Standard (no sleep) |

---

## 🎨 Bagian 3: Deploy Frontend ke Vercel

### 3.1. Connect repo

1. Buka https://vercel.com → **"Add New..."** → **"Project"**
2. Pilih GitHub repo yang sama
3. Vercel auto-detect Next.js — **TAPI** kita perlu set root directory karena monorepo:

| Field | Value |
|-------|-------|
| Framework Preset | Next.js (auto-detected) |
| Root Directory | **`compbio`** ← penting! |
| Build Command | `npm run build` (default) |
| Output Directory | `.next` (default) |
| Install Command | `npm install` (default) |

### 3.2. Environment Variables

Di Vercel project → **Settings → Environment Variables**:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://tox21-api.onrender.com` (dari step 2.5) | Production, Preview, Development |

> ⚠️ **Wajib pakai prefix `NEXT_PUBLIC_`** karena dipakai di client component (browser perlu akses).

### 3.3. Deploy

Klik **"Deploy"**. Build pertama ~2 menit.

Dapat URL seperti `https://compbio-xxxx.vercel.app`. Test:
1. Buka di browser
2. Klik tab Single Molecule → input SMILES → klik Prediksi
3. Lihat ada tabel prediksi 12 endpoint?

### 3.4. Update CORS di backend

Setelah dapat URL Vercel final, kembali ke Render dashboard:
- **Environment** → ubah `ALLOWED_ORIGINS` ke URL Vercel kamu
- Klik **"Manual Deploy"** untuk apply

### 3.5. Custom domain `qurne.com`

Backend sudah pre-configured menerima request dari `qurne.com` dan semua subdomainnya. Jadi tinggal setup di Vercel:

1. Vercel project → **Settings → Domains** → **Add Domain**
2. Masukkan domain yang diinginkan, mis:
   - `tox21.qurne.com` (subdomain — recommended)
   - `qurne.com` (apex/root)
   - `app.qurne.com`
3. Vercel akan kasih instruksi DNS record:
   - **Subdomain** (mis. `tox21.qurne.com`): tambah CNAME record di DNS provider → `cname.vercel-dns.com`
   - **Apex** (`qurne.com`): tambah A record → IP Vercel (biasanya `76.76.21.21`)
4. Tunggu propagasi DNS (5–30 menit), Vercel auto-provision SSL cert (Let's Encrypt)

**Tidak perlu update CORS di Render** karena `qurne.com` + semua `*.qurne.com` sudah di-whitelist via regex di [`backend/main.py`](backend/main.py).

> 💡 **Verifikasi CORS bekerja:** Setelah domain aktif, buka `https://tox21.qurne.com` → buka DevTools → Network → klik request ke `*.onrender.com`. Pastikan tidak ada error CORS di Console.

---

## 🔄 Bagian 4: Update / Redeploy

### Backend
Setiap push ke `main` → Render auto-rebuild + redeploy (kalau ada perubahan di `backend/`).

### Frontend
Setiap push ke `main` → Vercel auto-rebuild + redeploy.

Vercel juga generate **preview deployment** untuk setiap PR — useful untuk testing fitur sebelum merge.

---

## 💰 Estimasi Biaya Bulanan

| Komponen | Provider | Plan | Cost |
|----------|----------|------|------|
| Backend  | Render | Standard | **$25/mo** |
| Frontend | Vercel | Hobby (free) | $0 |
| Domain (opsional) | Namecheap/Cloudflare | .com | ~$10/yr |
| **Total** | | | **~$25/mo** |

### Cara hemat (tradeoff)

**Opsi A: Self-host backend (~$5/mo)**
- VPS Hetzner CX22 (€4.5/mo, 2GB RAM) → install Docker + jalankan FastAPI manual
- Pakai Cloudflare Tunnel untuk HTTPS gratis
- Lebih ribet tapi 5x lebih murah dari Render Standard

**Opsi B: Hugging Face Spaces (gratis)**
- Buat Space dengan SDK Docker
- Push backend folder ke HF
- Endpoint URL: `https://USERNAME-tox21.hf.space`
- Limitasi: spin-down setelah idle, cold start ~1 menit, tapi 16GB RAM tersedia

**Opsi C: Pindahkan inference ke Vercel Edge / Cloudflare Workers** (advanced)
- Convert PyTorch model ke ONNX
- Run inference di Edge Functions (gratis sampai limit tertentu)
- Backend FastAPI hanya untuk metadata / RDKit (lebih ringan)
- Effort tinggi tapi gratis sepenuhnya

---

## 📋 Checklist Akhir

Sebelum announce ke teman/dosen:

- [ ] `/api/health` return `model_loaded: true`
- [ ] Prediksi single molecule jalan dari FE
- [ ] Batch CSV upload jalan
- [ ] Applicability Domain badge tampil (perlu `train_fingerprints.npz`)
- [ ] Atom importance & toxicophore highlighting jalan
- [ ] Compare 2 molecules route (`/compare`) jalan
- [ ] Endpoint guide (`/endpoints`) tampil semua 12 task
- [ ] Theme konsisten light mode di semua halaman
- [ ] Cold start backend < 30 detik (Standard plan)
- [ ] CORS tidak error di browser console
- [ ] Mobile view tidak rusak

---

## 🆘 Kalau Mentok

- **Render docs**: https://render.com/docs/deploy-fastapi
- **Vercel docs**: https://vercel.com/docs/frameworks/nextjs
- **DeepChem deploy issues**: https://github.com/deepchem/deepchem/discussions
- **Issue di proyek ini**: buka issue di GitHub repo

---

> 🎓 **Catatan untuk final project:**
> Kalau ini untuk presentasi tugas akhir dan budget terbatas, pilihan **paling realistis** adalah:
> 1. Backend di **Hugging Face Spaces** (gratis, RAM cukup)
> 2. Frontend di **Vercel** (gratis selamanya)
>
> Total: **$0/bulan**. Tradeoff: cold start lebih lama. Tapi untuk demo, jauh dari deal breaker.
