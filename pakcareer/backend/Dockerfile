FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (build-essential for compiling if needed, libgomp1 for xgboost OpenMP)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip to latest (avoids chunk drop hash mismatch on large wheel downloads)
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir --retries 10 --timeout 180 -r requirements.txt

# Install XGBoost without CUDA dependencies (nvidia-nccl-cu12 is 336MB and only needed for multi-GPU training)
RUN pip install --no-cache-dir --retries 10 --timeout 180 --no-deps xgboost

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
