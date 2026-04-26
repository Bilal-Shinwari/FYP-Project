FROM python:3.11-slim

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip uninstall -y torchvision || true

COPY --chown=user . /app

ENV ALLOW_ALL_ORIGINS=1
ENV HF_MODEL_REPO=mbilalcr07/bol-urdu-tts
ENV FINETUNE_DIR=/app/models

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
