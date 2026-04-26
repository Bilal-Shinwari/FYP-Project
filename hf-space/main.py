import os as _os
_MODEL_REPO   = _os.environ.get("HF_MODEL_REPO", "")
_FINETUNE_DIR = _os.environ.get("FINETUNE_DIR", "/app/models")
if _MODEL_REPO and not _os.path.exists(f"{_FINETUNE_DIR}/t3_finetuned.safetensors"):
    print(f"Downloading models from {_MODEL_REPO}...")
    from huggingface_hub import snapshot_download
    snapshot_download(repo_id=_MODEL_REPO, local_dir=_FINETUNE_DIR, repo_type="model")
    print("Models downloaded.")
import sys
import os
import time
import uuid
import numpy as np
import soundfile as sf
import re
from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta

import models, schemas, auth, database

# FINETUNE_DIR can be overridden via env var (e.g. in Google Colab)
FINETUNE_DIR = os.environ.get(
    "FINETUNE_DIR",
    r"D:\FYP\FYP\t3_finetuned_model\chatterbox-finetuning"
)
sys.path.append(FINETUNE_DIR)

try:
    import torch
    from src.utils import trim_silence_with_vad
    from inference import load_finetuned_engine
    import inference as inf_module
except ImportError as e:
    print(f"Warning: Could not import Chatterbox modules. Error: {e}")
    torch = None

app = FastAPI(title="Urdu TTS & Voice Cloning API")

# ALLOW_ALL_ORIGINS=1 enables wildcard CORS for Colab/ngrok deployments
_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.environ.get("ALLOW_ALL_ORIGINS") == "1" else _origins,
    allow_credentials=os.environ.get("ALLOW_ALL_ORIGINS") != "1",
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

STATIC_DIR = "/data/static" if os.path.isdir("/data") else "/tmp/static"
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

tts_engine = None
device = "cuda" if (torch and torch.cuda.is_available()) else "cpu"

@app.on_event("startup")
async def startup_event():
    global tts_engine
    if torch is None:
        print("Model loading skipped due to missing dependencies.")
        return

    print(f"Loading Chatterbox model on {device}...")
    try:
        inf_module.BASE_MODEL_DIR = os.path.join(FINETUNE_DIR, "pretrained_models")
        inf_module.FINETUNED_WEIGHTS = os.path.join(FINETUNE_DIR, "t3_finetuned.safetensors")
        if inf_module.IS_TURBO:
            inf_module.FINETUNED_WEIGHTS = os.path.join(FINETUNE_DIR, "t3_turbo_finetuned.safetensors")

        tts_engine = load_finetuned_engine(device)
        print("Model loaded successfully!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error loading model: {e}")


# --- AUTH ENDPOINTS ---
@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if auth.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if auth.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# Generation params — defined here so they don't depend on the HF model repo's inference.py
BASE_PARAMS = {
    "temperature": 1.0,       # higher = less likely to repeat tokens
    "exaggeration": 0.5,
    "cfg_weight": 0.5,
    "repetition_penalty": 1.3,
}

# --- GENERATION HELPERS ---
def generate_audio_file(text: str, prompt_path: str, param_overrides: dict = None):
    if tts_engine is None:
        raise HTTPException(status_code=503, detail="TTS Engine is not loaded. Check server logs.")

    sentences = re.split(r'(?<=[.?!])\s+', text.strip())
    sentences = [s for s in sentences if s.strip()]
    if not sentences:
        raise HTTPException(status_code=422, detail="No valid text provided.")

    params = dict(BASE_PARAMS)
    if param_overrides:
        params.update(param_overrides)

    all_chunks = []
    sample_rate = 24000

    for sent in sentences:
        try:
            wav_tensor = tts_engine.generate(text=sent, audio_prompt_path=prompt_path, **params)
            wav_np = wav_tensor.squeeze().cpu().numpy()
            trimmed_wav = trim_silence_with_vad(wav_np, tts_engine.sr)
            if len(trimmed_wav) > 0:
                all_chunks.append(trimmed_wav)
                sample_rate = tts_engine.sr
                all_chunks.append(np.zeros(int(tts_engine.sr * 0.2), dtype=np.float32))
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Generation error for sentence '{sent[:40]}': {e}")

    if not all_chunks:
        raise HTTPException(status_code=500, detail="Audio generation produced no output. Check model logs.")

    final_audio = np.concatenate(all_chunks)
    filename = f"generated_{uuid.uuid4().hex}.wav"
    filepath = os.path.join(STATIC_DIR, filename)
    sf.write(filepath, final_audio, sample_rate)
    return filepath


# --- GENERATION ENDPOINTS ---
@app.post("/tts_simple")
async def tts_simple(
    text: str = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    default_prompt = os.path.join(FINETUNE_DIR, "speaker_reference", "2.wav")
    audio_path = generate_audio_file(text, default_prompt)

    db.add(models.History(user_id=current_user.id, input_text=text, audio_path=audio_path, model_type="TTS"))
    db.commit()

    return FileResponse(audio_path, media_type="audio/wav")


@app.post("/clone")
async def clone_voice(
    text: str = Form(...),
    tau: float = Form(0.9),
    ref: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    temp_ref_path = os.path.join(STATIC_DIR, f"temp_ref_{uuid.uuid4().hex}.wav")
    try:
        with open(temp_ref_path, "wb") as f:
            f.write(await ref.read())

        # tau (0.1–1.0) from the UI maps to exaggeration — controls voice similarity to reference
        audio_path = generate_audio_file(text, temp_ref_path, param_overrides={"exaggeration": tau})

        db.add(models.History(user_id=current_user.id, input_text=text, audio_path=audio_path, model_type="clone"))
        db.commit()

        return FileResponse(audio_path, media_type="audio/wav")
    finally:
        if os.path.exists(temp_ref_path):
            os.remove(temp_ref_path)


@app.get("/history", response_model=list[schemas.History])
def get_history(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return (
        db.query(models.History)
        .filter(models.History.user_id == current_user.id)
        .order_by(models.History.created_at.desc())
        .all()
    )
