# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: بول Urdu TTS

Urdu Text-to-Speech system with voice cloning. Fine-tuned ChatterBox TTS v0.1.2 on 20,000 Urdu audio samples. Three-tier architecture: React+Vite frontend → FastAPI backend → ChatterBox TTS inference engine.

## Running the Project

### Backend (FastAPI)
```bash
# Always use the fyp-backend conda env — it has all ML dependencies
conda run -n fyp-backend uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Run from: text-to-speech/tts-backend/
```

### Frontend (React + Vite)
```bash
npm run dev       # starts on localhost:5173
npm run build
npm run lint
# Run from: text-to-speech/voicegen-frontend/
```

**Note:** There is also a Next.js scaffold at `text-to-speech/` (root level). It is unused — the active frontend is `text-to-speech/voicegen-frontend/`.

## Architecture

### Directory Layout
```
FYP/
├── t3_finetuned_model/chatterbox-finetuning/   # ML inference repo (training + inference)
│   ├── t3_finetuned.safetensors                # Fine-tuned T3 weights (2GB, non-Turbo mode)
│   ├── pretrained_models/                      # Base ChatterBox weights (ve, s3gen, t3, tokenizer)
│   ├── speaker_reference/2.wav                 # Default voice prompt for TTS
│   ├── src/config.py                           # TrainConfig dataclass (paths, hyperparams)
│   └── inference.py                            # load_finetuned_engine(), PARAMS dict
└── text-to-speech/
    ├── tts-backend/                            # FastAPI app
    │   ├── main.py                             # All endpoints + model loading at startup
    │   ├── auth.py                             # JWT creation/verification, bcrypt hashing
    │   ├── models.py                           # SQLAlchemy ORM: User, History
    │   ├── schemas.py                          # Pydantic schemas
    │   ├── database.py                         # SQLite engine (tts_app.db)
    │   └── static/                             # Generated WAV files served here
    └── voicegen-frontend/                      # React + Vite (THE active frontend)
        └── src/
            ├── App.jsx                         # Router: public routes + protected /dashboard/*
            ├── context/AuthContext.jsx         # JWT storage, isAuthenticated, login/logout
            ├── layouts/DashboardLayout.jsx     # Sidebar nav wrapping dashboard pages
            ├── pages/                          # Home, Features, About, Login, Register
            └── pages/dashboard/               # TextToSpeech, VoiceCloning, History, Settings
```

### Request Flow
1. Frontend sends JWT Bearer token with every request
2. Backend `auth.get_current_user()` dependency validates token → resolves User ORM object
3. For TTS: `generate_audio_file()` splits text into sentences → iterates through ChatterBox engine → concatenates WAV chunks → saves to `static/`
4. Audio returned as `FileResponse` (WAV); frontend fetches blob URL for `<audio>` playback
5. Generation saved to `History` table with `user_id`, `input_text`, `audio_path`, `model_type`

### Model Loading (backend startup)
`main.py` appends the finetuning repo to `sys.path`, then overrides `inf_module.BASE_MODEL_DIR` and `inf_module.FINETUNED_WEIGHTS` before calling `load_finetuned_engine(device)`. The model runs in **non-Turbo mode** (`IS_TURBO=False`).

## Critical: Hardcoded Path Bug

`main.py:18` has the wrong path. The correct value is:
```python
FINETUNE_DIR = r"D:\FYP\FYP\t3_finetuned_model\chatterbox-finetuning"
```
Current value is missing the second `FYP` folder, causing model load failure at startup.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Create user account |
| POST | `/token` | No | Login → JWT access token |
| GET | `/users/me` | JWT | Current user info |
| POST | `/tts_simple` | JWT | TTS with default voice (form: `text`) |
| POST | `/clone` | JWT | Voice clone (form: `text`, `tau`, file: `ref`) |
| GET | `/history` | JWT | User generation history |

## Frontend Routes

| Path | Protection | Component |
|------|-----------|-----------|
| `/` | Public | Home |
| `/features` | Public | Features |
| `/about` | Public | About |
| `/login` | Public | Login |
| `/register` | Public | Register |
| `/dashboard/tts` | JWT required | TextToSpeech |
| `/dashboard/clone` | JWT required | VoiceCloning |
| `/dashboard/history` | JWT required | History |
| `/dashboard/settings` | JWT required | Settings |

## Conda Environment

Use `fyp-backend` for all Python work. It contains: `chatterbox-tts==0.1.2`, `resemble-perth==1.0.1`, `torch==2.6.0`, `torchaudio==2.6.0`, `conformer==0.3.2`, `diffusers==0.29.0`, `fastapi==0.136.0`, Python 3.11.

```bash
conda activate fyp-backend   # or: conda run -n fyp-backend <command>
```

## 3D Audio Visualization

The frontend uses `@react-three/fiber` + `three.js` (already installed). The `AudioVisualizer3D.jsx` component in `src/components/` handles real-time waveform display. It expects a Web Audio API `AnalyserNode` connected to the playing `<audio>` element.

## Key Design Decisions

- **Non-Turbo mode**: `IS_TURBO=False` in config → uses `t3_finetuned.safetensors` (2GB), `cfg_weight` param
- **Sentence-split inference**: Long texts are split on `.?!` and processed per-sentence, then concatenated with 0.2s silence gaps (prevents token repetition)
- **SQLite**: Single-file DB adequate for academic demo; upgrade path to PostgreSQL via SQLAlchemy
- **CORS**: Only `localhost:5173` allowed — update `allow_origins` in `main.py` for any other dev port
