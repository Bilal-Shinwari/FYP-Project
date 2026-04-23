# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: بول Urdu TTS

Urdu Text-to-Speech system with voice cloning. Fine-tuned ChatterBox TTS v0.1.2 on 20,000 Urdu audio samples. Three-tier architecture: React+Vite frontend → FastAPI backend → ChatterBox TTS inference engine.

## Running the Project

### Backend (FastAPI)
```bash
# Run from: text-to-speech/tts-backend/
# Always use the fyp-backend conda env — it has all ML dependencies
conda run -n fyp-backend uvicorn main:app --reload --host 0.0.0.0 --port 8000

# The 2GB model loads at startup. On CPU (no NVIDIA GPU) this takes 3–5 minutes.
# Server is ready when logs show: "Model loaded successfully!"

# Verify model files and paths before starting:
conda run -n fyp-backend python test_model_load.py   # run from repo root
```

### Frontend (React + Vite)
```bash
# Run from: text-to-speech/voicegen-frontend/
npm run dev       # http://localhost:5173
npm run build
npm run lint
```

**Note:** There is a dead Next.js scaffold at `text-to-speech/` (root level). Ignore it — the active frontend is `text-to-speech/voicegen-frontend/`.

## Architecture

### Directory Layout
```
FYP/
├── t3_finetuned_model/chatterbox-finetuning/   # ML training + inference
│   ├── t3_finetuned.safetensors                # Fine-tuned T3 weights (2GB) — gitignored
│   ├── pretrained_models/                      # Base weights (ve, s3gen, t3_cfg, tokenizer, conds) — gitignored
│   ├── speaker_reference/2.wav                 # Default voice prompt
│   ├── src/config.py                           # TrainConfig dataclass
│   └── inference.py                            # load_finetuned_engine(), PARAMS dict, IS_TURBO flag
├── text-to-speech/
│   ├── tts-backend/                            # FastAPI app
│   │   ├── main.py                             # All endpoints + startup model load
│   │   ├── auth.py                             # JWT (HS256, 7-day expiry), bcrypt
│   │   ├── models.py                           # SQLAlchemy ORM: User, History
│   │   ├── schemas.py                          # Pydantic v2 schemas
│   │   ├── database.py                         # SQLite: tts_app.db
│   │   └── static/                             # Generated WAV files served here
│   └── voicegen-frontend/
│       └── src/
│           ├── config.js                       # API_BASE — reads localStorage or defaults to localhost:8000
│           ├── App.jsx                         # Router: public routes + ProtectedRoute /dashboard/*
│           ├── context/AuthContext.jsx         # JWT in localStorage, isAuthenticated, login/logout
│           ├── layouts/DashboardLayout.jsx     # Sidebar nav
│           ├── pages/                          # Home, Features, About, Login, Register
│           └── pages/dashboard/               # TextToSpeech, VoiceCloning, History, Settings
├── FYP_Colab_Backend.ipynb                     # Run backend on free Colab T4 GPU
└── FYP_Upload_Models.ipynb                     # One-time upload of model weights to Google Drive
```

### Request Flow
1. Frontend reads `API_BASE` from `src/config.js` (localStorage-overridable for Colab)
2. Every request sends `Authorization: Bearer <JWT>`
3. Backend `auth.get_current_user()` dependency validates token → returns User ORM object
4. `generate_audio_file(text, prompt_path, param_overrides)` splits on `.?!` → runs ChatterBox per sentence → concatenates with 0.2s silence → saves to `static/`
5. Returns `FileResponse(wav)`; frontend creates blob URL for `<audio>` and `AudioVisualizer3D`
6. Generation saved to `History` table

### Model Loading (backend startup)
`main.py` reads `FINETUNE_DIR` from the `FINETUNE_DIR` env var (default: `D:\FYP\FYP\t3_finetuned_model\chatterbox-finetuning`), appends it to `sys.path`, overrides `inf_module.BASE_MODEL_DIR` and `inf_module.FINETUNED_WEIGHTS`, then calls `load_finetuned_engine(device)`. Runs in **non-Turbo mode** (`IS_TURBO=False`) using `t3_finetuned.safetensors` and `cfg_weight` param.

### Generation Parameters
`inference.py` defines the module-level `PARAMS` dict:
```python
PARAMS = {"temperature": 0.8, "exaggeration": 0.5, "cfg_weight": 0.5, "repetition_penalty": 1.2}
```
`generate_audio_file()` accepts an optional `param_overrides` dict that is merged over `PARAMS`. The VoiceCloning page's `tau` slider (0.1–1.0) maps to `exaggeration` via this mechanism.

## API Endpoints

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/register` | No | JSON: `username`, `email`, `password` |
| POST | `/token` | No | Form: `username`, `password` → JWT |
| GET | `/users/me` | JWT | — |
| POST | `/tts_simple` | JWT | Form: `text` |
| POST | `/clone` | JWT | Form: `text`, `tau` (float); File: `ref` (WAV) |
| GET | `/history` | JWT | — |

## Conda Environment

```bash
conda activate fyp-backend   # or: conda run -n fyp-backend <command>
# Python 3.11 — chatterbox-tts==0.1.2, torch==2.6.0, torchaudio==2.6.0, fastapi==0.136.0
```

## Environment Variables (backend)

| Variable | Default | Purpose |
|----------|---------|---------|
| `FINETUNE_DIR` | `D:\FYP\FYP\t3_finetuned_model\chatterbox-finetuning` | Path to ML repo — override in Colab |
| `ALLOW_ALL_ORIGINS` | unset | Set to `1` to allow `*` CORS (required for ngrok/Colab) |

## Frontend API URL

All API calls go through `src/config.js`:
```js
export const API_BASE = localStorage.getItem('api_base') || 'http://localhost:8000';
```
To point the running frontend at a Colab/ngrok backend without rebuilding:
```js
// In browser DevTools console:
localStorage.setItem('api_base', 'https://xxxx.ngrok-free.app')
// then refresh
```

## Google Colab GPU Deployment

The machine has only an Intel Iris Xe (integrated GPU) — no CUDA. For demo/testing with fast inference use Colab:
1. **One-time**: run `FYP_Upload_Models.ipynb` to upload ~5GB of model weights to `MyDrive/FYP_Models/`
2. **Each session**: run `FYP_Colab_Backend.ipynb` (T4 GPU runtime) — it clones the repo, loads weights from Drive, starts uvicorn, opens an ngrok tunnel, and prints the `localStorage.setItem(...)` command for the frontend

## Key Design Decisions

- **Non-Turbo mode**: `IS_TURBO=False` → uses `t3_finetuned.safetensors` and `cfg_weight` param. Turbo mode uses different weight files and no `cfg_weight`.
- **Sentence-split inference**: Prevents token repetition on long texts. Each sentence is generated independently then concatenated with 0.2s silence padding.
- **SQLite**: Single-file DB at `tts-backend/tts_app.db` — gitignored. Upgrade path via SQLAlchemy `DATABASE_URL` env var.
- **JWT expiry**: 7 days (`ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7` in `auth.py`). `SECRET_KEY` is hardcoded — replace before any non-local deployment.
- **Static files**: Generated WAVs accumulate in `tts-backend/static/` — gitignored. No cleanup implemented.
