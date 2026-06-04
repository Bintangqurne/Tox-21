# Dockerfile untuk Hugging Face Spaces (free tier, 16GB RAM).
# Build context HARUS dari root project agar bisa COPY checkpoints/
# (lihat SETUP.md untuk instruksi push ke HF Space).
#
# Bisa juga dipakai untuk Railway, Fly.io, Google Cloud Run, dll.

FROM python:3.11-slim

# System dependencies untuk RDKit + DGL
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libxrender1 \
        libxext6 \
        libsm6 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements terlebih dahulu (leverage Docker layer cache)
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code + checkpoints model
COPY backend/ /app/
COPY checkpoints/ /app/checkpoints/

# Override CHECKPOINTS_PATH agar inference.py baca dari /app/checkpoints
ENV CHECKPOINTS_PATH=/app/checkpoints

# HuggingFace Spaces wajib expose port 7860. Render/Railway pakai $PORT env.
ENV PORT=7860
EXPOSE 7860

# Cache torch ke ephemeral disk
ENV TORCH_HOME=/tmp/torch_cache
ENV HF_HOME=/tmp/hf_cache

# Run uvicorn (single worker karena model singleton)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860} --workers 1"]
