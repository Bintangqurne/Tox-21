# 🚀 SETUP & DEPLOY — Quick Start

Panduan singkat untuk deploy proyek **gratis** (~$0/bulan):
- **Backend** → Hugging Face Spaces (16GB RAM, gratis selamanya)
- **Frontend** → Vercel (gratis untuk hobby project)

Untuk panduan lengkap + alternatif Render berbayar, lihat [DEPLOY.md](DEPLOY.md).

---

## 📋 Pre-flight Checklist

Sebelum mulai, pastikan punya:

- [ ] Akun **GitHub** (untuk simpan kode)
- [ ] Akun **Hugging Face** — daftar gratis di https://huggingface.co/join
- [ ] Akun **Vercel** — daftar pakai GitHub di https://vercel.com/signup
- [ ] **Git** terinstall lokal (`git --version`)
- [ ] Tox21.ipynb sudah di-run sampai selesai (file `checkpoints/*.npz` dan `*.json` sudah ada)

Cek checkpoint lengkap:
```bash
ls checkpoints/
# Harus ada: gcn_best/  gat_best/  model_info.json  tasks.json  train_fingerprints.npz
```

Kalau `train_fingerprints.npz` BELUM ADA → buka `Tox21.ipynb` di Jupyter, jalankan **Run All**, tunggu selesai.

---

## 🔧 LANGKAH 0 — Push ke GitHub (sekali saja)

```bash
cd /home/qurne/Codingan/compBio

# Inisialisasi git (kalau belum)
git init
git branch -M main

# Stage semua file
git add .
git status   # cek dulu, pastikan checkpoints/ ikut tapi __pycache__ TIDAK

# Commit
git commit -m "Initial commit: Tox21 GNN predictor ready for deploy"

# Buat repo baru di github.com (mis. nama: compbio)
# Lalu push:
git remote add origin https://github.com/USERNAME/compbio.git
git push -u origin main
```

> ⚠️ **PENTING:** Folder `checkpoints/` (~2.5MB) HARUS ikut di-push. Cek di GitHub web — folder harus muncul. Kalau tidak muncul, ada masalah di `.gitignore`.

---

## 🤗 LANGKAH 1 — Deploy Backend ke Hugging Face Spaces

### 1a. Buat Space baru

1. Login ke https://huggingface.co
2. Klik **profile foto** → **"New Space"**
3. Isi form:
   - **Space name**: `tox21-api` (atau bebas, akan jadi bagian URL)
   - **License**: MIT
   - **SDK**: pilih **Docker**
   - **Template**: Blank
   - **Hardware**: CPU basic (free, 16GB RAM) — cukup banget
   - **Visibility**: Public
4. Klik **"Create Space"**

### 1b. Clone Space repo & isi dengan kode kita

Setelah Space dibuat, HF kasih instruksi git. Jalankan:

```bash
# Ganti USERNAME & NAMA-SPACE sesuai milikmu
git clone https://huggingface.co/spaces/USERNAME/tox21-api hf-space
cd hf-space

# Copy file dari proyek ke Space
cp -r ../compBio/backend/* .
cp -r ../compBio/checkpoints .

# Rename HF_SPACE_README.md jadi README.md (wajib untuk frontmatter HF)
mv HF_SPACE_README.md README.md

# Edit Dockerfile — karena di Space tidak ada subfolder backend/,
# semua file langsung di root. Ganti path COPY:
sed -i 's|COPY backend/requirements.txt|COPY requirements.txt|' Dockerfile
sed -i 's|COPY backend/ /app/|COPY . /app/|' Dockerfile
sed -i 's|COPY checkpoints/ /app/checkpoints/||' Dockerfile
# (checkpoints sudah ke-COPY oleh "COPY . /app/" karena ada di root Space)
```

### 1c. Commit & push ke HF

```bash
git add .
git commit -m "Initial deploy: Tox21 backend"
git push
```

HF akan otomatis mulai **build Docker image** — bisa lihat progress di tab **"Logs"** Space-mu. Build pertama ~10-15 menit.

### 1d. Verifikasi backend jalan

Setelah build sukses, URL Space-mu: `https://USERNAME-tox21-api.hf.space`

Test di terminal:
```bash
curl https://USERNAME-tox21-api.hf.space/api/health
# Expected: {"status":"ok","model_loaded":true,"device":"cpu",...}
```

Atau buka di browser: `https://USERNAME-tox21-api.hf.space/docs` — dapat Swagger UI interaktif.

> 💡 **HF Space cold start ~30 detik** setelah idle 48 jam. Untuk demo dosen, panaskan dulu dengan 1 curl 5 menit sebelumnya.

---

## ⚡ LANGKAH 2 — Deploy Frontend ke Vercel

### 2a. Import project di Vercel

1. Login ke https://vercel.com → klik **"Add New..."** → **"Project"**
2. Pilih GitHub repo `compbio` yang tadi di-push
3. **Configure Project:**
   | Field | Value |
   |-------|-------|
   | Framework Preset | Next.js (auto-detected ✓) |
   | Root Directory | **`compbio`** ← klik "Edit" lalu pilih folder ini |
   | Build Command | `npm run build` (default, jangan diubah) |
   | Output Directory | `.next` (default) |
   | Install Command | `npm install` (default) |

### 2b. Environment Variables

Di bagian **Environment Variables**, tambah:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://USERNAME-tox21-api.hf.space` | All (Production, Preview, Development) |

> ⚠️ Ganti `USERNAME` dengan username HF kamu. URL harus persis sama dengan URL Space.

### 2c. Deploy

Klik **"Deploy"**. Tunggu ~2 menit.

Dapat URL: `https://compbio-xxxx.vercel.app` — buka di browser, test prediksi molekul.

---

## 🌐 LANGKAH 3 — Pasang Custom Domain `qurne.com` (opsional)

Kalau punya domain `qurne.com` atau subdomain-nya:

1. Vercel project → **Settings → Domains** → **"Add"**
2. Masukkan domain, mis: `tox21.qurne.com`
3. Vercel kasih instruksi DNS:
   - Tambah **CNAME** record di DNS provider (Cloudflare/Namecheap/dll):
     ```
     Type:  CNAME
     Name:  tox21
     Value: cname.vercel-dns.com
     ```
4. Tunggu propagasi DNS (5-30 menit), Vercel auto-issue SSL cert
5. **TIDAK perlu update apa-apa di backend** — CORS sudah pre-configured terima semua `*.qurne.com`

---

## ✅ LANGKAH 4 — Final Check

Setelah semua deploy, test end-to-end:

- [ ] Buka `https://tox21.qurne.com` (atau URL Vercel)
- [ ] Health badge di header tampil **hijau** (artinya backend connected)
- [ ] Input SMILES `CC(=O)Oc1ccccc1C(=O)O` → klik Prediksi
- [ ] Tabel 12 endpoint muncul dengan probabilitas
- [ ] Klik tombol 🔍 di salah satu task → struktur 2D switch ke mode atom importance
- [ ] Klik chip "Gugus Reaktif" → kalau ada toxicophore, ke-highlight
- [ ] Buka `/endpoints` → 12 endpoint guide tampil
- [ ] Buka `/compare` → bisa input 2 SMILES, lihat diff
- [ ] Buka DevTools (F12) → Console → **tidak ada error CORS**

---

## 🔄 Update Selanjutnya

### Update frontend
```bash
# Edit kode di compbio/, lalu:
git add .
git commit -m "Update FE: tambah fitur X"
git push
# Vercel auto-deploy dalam 1-2 menit
```

### Update backend
```bash
# Edit kode di backend/, lalu:
git add .
git commit -m "Update BE: fix bug Y"
git push origin main

# Lalu sync ke HF Space:
cd hf-space
cp -r ../compBio/backend/* .
git add .
git commit -m "Sync from main repo"
git push
# HF Space rebuild ~5-10 menit
```

> 💡 **Tip:** bisa juga setup HF Space sebagai git remote tambahan dari repo utama (`git remote add hf https://huggingface.co/...`) supaya 1x push ke 2 destination. Tapi ribet kalau struktur folder beda.

---

## 🆘 Troubleshooting Cepat

| Gejala | Solusi |
|--------|--------|
| HF Space build gagal "out of memory" | Naik ke CPU upgrade ($0.03/jam) — tapi biasanya CPU basic cukup |
| Frontend: "Network Error" | Cek `NEXT_PUBLIC_API_URL` di Vercel env, harus persis sama URL HF Space |
| Browser console: CORS error | Cek URL frontend ada di whitelist (qurne.com / *.vercel.app). Restart HF Space setelah update env |
| HF Space lambat banget | Cold start normal. Buka `/api/health` 1x untuk wake up |
| Model_loaded: false | Folder `checkpoints/` tidak ke-copy ke Space. Cek di Space "Files" tab |
| Build error "ResolutionImpossible" pip | Versi torch/deepchem konflik. Edit `requirements.txt` |

---

## 💰 Total Biaya

| Item | Cost |
|------|------|
| Hugging Face Spaces (CPU basic) | **$0/bulan** |
| Vercel Hobby | **$0/bulan** |
| Domain `qurne.com` (kalau sudah punya) | $0 (sudah dibayar) |
| **TOTAL** | **$0/bulan** 🎉 |

---

## 📚 Referensi Lengkap

- **[DEPLOY.md](DEPLOY.md)** — opsi alternatif (Render, Railway, Fly.io) + troubleshooting detail
- **[backend/README.md](backend/README.md)** — dokumentasi API + cara run lokal
- **[compbio/README.md](compbio/README.md)** — dokumentasi frontend + komponen
- **Hugging Face Spaces docs** — https://huggingface.co/docs/hub/spaces
- **Vercel docs** — https://vercel.com/docs/frameworks/nextjs
