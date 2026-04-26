# CLAUDE.md — بول Urdu TTS: Complete Project Reference

> **FYP Poster / Documentation Guide** — Every fact about the system is here.
> GitHub: https://github.com/Bilal-Shinwari/FYP-Project  
> HF Space (live backend): https://huggingface.co/spaces/mbilalcr07/bol-backend  
> HF Model Repo (weights): https://huggingface.co/mbilalcr07/bol-urdu-tts  
> Live API URL: https://mbilalcr07-bol-backend.hf.space  

---

## 1. Project Overview

**بول** (Bol — Urdu for "speak") is an Urdu Text-to-Speech (TTS) and Voice Cloning system.  
It fine-tunes ResembleAI's ChatterBox TTS v0.1.2 on 20,000 Urdu audio samples to produce  
natural Urdu speech and cloned voices from a user-supplied audio reference.

**Three-tier architecture:**
```
React + Vite (Vercel CDN)  →  FastAPI (HF Spaces, Docker)  →  ChatterBox TTS inference engine
```

---

## 2. Dataset

| Property | Detail |
|----------|--------|
| Source | Mozilla Common Voice (Urdu) |
| Total samples | ~20,000 audio clips |
| Format | LJSpeech: `metadata.csv` (ID\|RawText\|NormText) + WAV files |
| Storage | Google Drive: `MyDrive/urdu_tts_training/dataset_processed/` |
| WAV dir | `dataset_processed/wavs/` — individual speaker recordings |
| Sample rate | 24,000 Hz (ChatterBox native) |
| Language | Urdu (Nastaliq script, RTL) |
| Preprocessing | Silence-trimmed via VAD; resampled to 24 kHz |
| Preprocessed dir | `MyTTSDataset/preprocess/` (cached mel spectrograms + tokens) |

---

## 3. Model Architecture

### Base Model: ChatterBox TTS v0.1.2 (ResembleAI)

ChatterBox uses a **two-stage architecture**:

| Stage | Component | Role |
|-------|-----------|------|
| Stage 1 | **T3** (Text-to-Tokens Transformer) | LLaMA-based autoregressive transformer; converts text tokens → speech tokens |
| Stage 2 | **S3Gen** (Speech-to-Spectrogram Generator) | Flow-matching decoder; converts speech tokens → mel spectrogram → waveform |
| Support | **VE** (Voice Encoder) | Extracts speaker embedding from reference audio (3-second prompt) |
| Tokenizer | Custom Urdu BPE tokenizer | Vocabulary size 2,454 for fine-tuned model |

### Fine-Tuning Strategy: Non-Turbo Mode

**`IS_TURBO = False`** — the project uses the **standard (non-Turbo) T3** model.

| Mode | Fine-tuned file | Extra param | Vocab size |
|------|----------------|-------------|------------|
| Normal (used) | `t3_finetuned.safetensors` | `cfg_weight` | 2,454 |
| Turbo (not used) | `t3_turbo_finetuned.safetensors` | — | 52,260 |

**Why non-Turbo?** Turbo removes the `cfg_weight` parameter and uses a larger shared vocabulary.  
Non-Turbo allows a small Urdu-only vocabulary (2,454 tokens) which trains faster with less data.

### Weight Files (stored in `pretrained_models/` and HF Model Repo)
```
pretrained_models/
├── ve.safetensors          # Voice Encoder weights
├── s3gen.safetensors       # S3Gen decoder weights
├── t3_cfg.safetensors      # Base T3 config weights (before fine-tuning)
├── tokenizer.json          # Base tokenizer
├── conds.pt                # Conditioning embeddings
└── [other base files]
t3_finetuned.safetensors    # Fine-tuned T3 weights — 2GB, the trained model
```

### Alignment Stream Analyzer (EOS detection)
The `AlignmentStreamAnalyzer` hooks into LLaMA attention layer 9 (head 2) to monitor  
text-speech alignment in real time. It forces EOS when:

- **`token_repetition`** — same token 4× in a row, after step 30 (guard prevents false positives)
- **`long_tail`** — model completed the text but activations linger on last 3 tokens for >5 frames (≈200ms)
- **`alignment_repetition`** — activations return to previous tokens after completion

> **Key fix applied:** original threshold was 2× repetition (too aggressive for Urdu phonemes  
> which legitimately repeat adjacent tokens). Changed to 4× + minimum 30-step guard.

---

## 4. Training Configuration (`src/config.py`)

```python
# Training hyperparameters used for the Urdu fine-tune:
batch_size       = 8          # per GPU/step
grad_accum       = 4          # effective batch size = 32
learning_rate    = 1e-4       # higher than default (1e-5) for faster convergence
num_epochs       = 15         # sufficient for 20K samples
save_steps       = 200        # checkpoint every 200 steps
warmup_steps     = 100        # gradual LR warmup
weight_decay     = 0.01       # L2 regularization
gradient_clip    = 1.0        # prevents gradient explosion

# Text / speech constraints:
max_text_len     = 256        # maximum input tokens (Urdu characters/subwords)
max_speech_len   = 850        # maximum audio frames (truncates very long clips)
prompt_duration  = 3.0        # seconds of reference audio used for voice embedding

# Vocabulary
new_vocab_size   = 2454       # Urdu custom tokenizer (non-Turbo)
```

---

## 5. Inference Parameters (Production)

Defined in `hf-space/main.py` as `BASE_PARAMS` (overrides whatever is in the HF model repo):

```python
BASE_PARAMS = {
    "temperature":        1.0,   # higher = more varied, less repetitive (raised from 0.8)
    "exaggeration":       0.5,   # speaker similarity to reference (0.1 = stable, 1.0 = creative)
    "cfg_weight":         0.5,   # classifier-free guidance strength (non-Turbo only)
    "repetition_penalty": 1.3,   # penalizes repeated tokens (raised from 1.2)
}
```

### Input Constraints

| Constraint | Limit | Notes |
|-----------|-------|-------|
| Max text tokens | 256 | Hard limit from `max_text_len` in config |
| Practical character limit | ~200 Urdu chars | Depends on tokenizer subword count |
| Language | Urdu only | Nastaliq script, RTL |
| Text splitting | Automatic | Splits on `.?!` boundaries before inference |

### Voice Cloning Reference Audio

| Property | Recommendation |
|----------|----------------|
| Duration | 10–30 seconds |
| Format | WAV (preferred) or MP3 (auto-converted to WAV in frontend) |
| Quality | Clear speech, minimal background noise |
| Internal crop | Model uses first 3.0s for speaker embedding |
| `tau` slider | 0.1–1.0 → maps to `exaggeration` parameter |

### Output Audio

| Property | Value |
|----------|-------|
| Format | WAV |
| Sample rate | 24,000 Hz |
| Channels | Mono |
| Post-processing | VAD silence trimming, 0.2s inter-sentence padding |
| File naming | `generated_<uuid>.wav` |

### Inference Speed

| Device | Token generation | Model load time | Notes |
|--------|-----------------|-----------------|-------|
| CPU (HF Spaces free tier) | ~7–8 tokens/sec | ~3–5 minutes | T3 runs on CPU |
| T4 GPU (Colab) | ~30–50 tokens/sec | ~1 minute | Recommended for demos |
| Local CPU (Intel Iris Xe) | ~7–8 tokens/sec | ~3–5 minutes | Same as HF Spaces |

A typical short Urdu sentence (≈15 words) generates in **~20–30 seconds on CPU**.

---

## 6. Backend — Local Development

### Directory
```
text-to-speech/tts-backend/
├── main.py       # All API endpoints + startup model load
├── auth.py       # JWT (HS256, 7-day expiry), bcrypt password hashing
├── models.py     # SQLAlchemy ORM: User, History tables
├── schemas.py    # Pydantic v2 request/response schemas
├── database.py   # SQLite engine: tts_app.db
└── static/       # Generated WAV files (gitignored)
```

### Running Locally
```bash
# From: text-to-speech/tts-backend/
conda run -n fyp-backend uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Model loads at startup. Wait for: "Model loaded successfully!"
```

### Conda Environment
```
Name: fyp-backend
Python: 3.11
Key packages: chatterbox-tts==0.1.2, torch==2.6.0, torchaudio==2.6.0, fastapi==0.136.0
```

---

## 7. Backend — HF Spaces Deployment (Live)

### Repository
| Property | Value |
|----------|-------|
| HF Space name | `mbilalcr07/bol-backend` |
| Space URL | https://huggingface.co/spaces/mbilalcr07/bol-backend |
| Live API base | https://mbilalcr07-bol-backend.hf.space |
| HF Space git remote | `https://huggingface.co/spaces/mbilalcr07/bol-backend` |
| Local folder | `hf-space/` |
| Runtime | Docker (python:3.11-slim) |
| Port | 7860 |
| Compute | CPU (free tier) |

### Deployment Files
```
hf-space/
├── Dockerfile           # Container build: install deps, set env vars, CMD uvicorn
├── requirements.txt     # fastapi, uvicorn, sqlalchemy, passlib, bcrypt==4.0.1,
│                        # python-jose, soundfile, huggingface_hub, chatterbox-tts==0.1.2
├── main.py              # Production FastAPI app
├── auth.py              # bcrypt compat patch + JWT logic
├── database.py          # Persistent SQLite: /data/tts_app.db
├── models.py            # ORM models
├── schemas.py           # Pydantic schemas
└── src/chatterbox_/     # Forked ChatterBox source (includes alignment fix)
    └── models/t3/inference/alignment_stream_analyzer.py
```

### Dockerfile Summary
```dockerfile
FROM python:3.11-slim
RUN useradd -m -u 1000 user   # HF Spaces requires non-root
ENV ALLOW_ALL_ORIGINS=1        # wildcard CORS for Spaces
ENV HF_MODEL_REPO=mbilalcr07/bol-urdu-tts   # model weights to download
ENV FINETUNE_DIR=/app/models   # where weights are saved inside container
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### Persistent Storage
HF Spaces provides a `/data` volume that survives container rebuilds:
- **Database**: `/data/tts_app.db` (users + history — persists across deploys)
- **Generated audio**: `/data/static/` (WAV files served at `/static/`)
- **Fallback** (local dev): `/tmp/tts_app.db` and `/tmp/static/`

### Model Download at Startup
`main.py` downloads model weights from HF Hub on first start:
```python
snapshot_download(repo_id="mbilalcr07/bol-urdu-tts", local_dir="/app/models")
# Downloads 8 files: t3_finetuned.safetensors + pretrained_models/* (~5GB total)
```

### HF Model Repository
| Property | Value |
|----------|-------|
| Repo ID | `mbilalcr07/bol-urdu-tts` |
| URL | https://huggingface.co/mbilalcr07/bol-urdu-tts |
| Files | 8 files: `t3_finetuned.safetensors` (~2GB) + `pretrained_models/` (~3GB) |
| Type | Model repository (not a Space) |

### Deploying to HF Space (CI/CD)
```bash
# The hf-space/ folder is a separate git repo pointing to HF Spaces:
cd hf-space/
git add .
git commit -m "your message"
git push origin main
# HF Spaces auto-detects the push → rebuilds the Docker container → redeploys
# Build logs visible at: huggingface.co/spaces/mbilalcr07/bol-backend/logs
```
**There is no GitHub Actions CI/CD for HF Space** — it's a direct push to the HF git remote.

### Known Fixes Applied to HF Space
1. **bcrypt 4.x / passlib 1.7.4 incompatibility** — `bcrypt.__about__` module missing.  
   Fix: monkey-patch in `auth.py` before passlib imports + pin `bcrypt==4.0.1`.
2. **SQLite in /tmp wiped on rebuild** — users disappeared after every deploy.  
   Fix: use `/data/tts_app.db` (persistent volume).
3. **Static files in /tmp** — generated WAVs lost on rebuild.  
   Fix: use `/data/static/` (persistent volume).
4. **Wildcard CORS** — required for HF Spaces URL patterns.  
   Fix: `ALLOW_ALL_ORIGINS=1` env var in Dockerfile.

---

## 8. API Endpoints

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/register` | None | JSON: `username`, `email`, `password` | User object |
| POST | `/token` | None | Form: `username`, `password` | `{access_token, token_type}` |
| GET | `/users/me` | JWT | — | User object |
| POST | `/tts_simple` | JWT | Form: `text` | WAV audio (FileResponse) |
| POST | `/clone` | JWT | Form: `text`, `tau`; File: `ref` (WAV) | WAV audio (FileResponse) |
| GET | `/history` | JWT | — | List of History objects |
| GET | `/static/{filename}` | None | — | WAV file |

### Authentication
- **Algorithm**: HS256 JWT
- **Expiry**: 7 days (`ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7`)
- **Storage (client)**: `localStorage` — key `token`
- **Header**: `Authorization: Bearer <token>`

### Database Schema (SQLite)
```sql
users:   id, username (unique), email (unique), hashed_password, is_active
history: id, user_id (FK→users), input_text, audio_path, model_type ('TTS'|'clone'), created_at
```

---

## 9. Frontend

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.0 |
| Build tool | Vite | 7.2.4 |
| Routing | React Router DOM | 7.13.0 |
| 3D visualization | Three.js | 0.184.0 |
| 3D React bindings | @react-three/fiber | 9.6.0 |
| 3D helpers | @react-three/drei | 10.7.7 |
| Icons | lucide-react | 0.563.0 |
| Styling | Custom CSS + CSS Variables | — |
| HTTP | Native `fetch` | — |
| Audio | Web Audio API + MediaRecorder API | Browser native |

### Directory Structure
```
text-to-speech/voicegen-frontend/src/
├── config.js                    # API_BASE — reads localStorage or defaults to HF Space URL
├── App.jsx                      # Router: public routes + ProtectedRoute wrapper
├── index.css                    # Global CSS variables + dark mode overrides
├── context/
│   └── AuthContext.jsx          # JWT in localStorage, isAuthenticated, login/logout
├── components/
│   ├── Header.jsx               # Public pages nav
│   ├── Footer.jsx               # Public pages footer
│   └── AudioVisualizer3D.jsx    # Three.js audio-reactive 3D blob visualizer
│       AudioVisualizer3D.css
├── layouts/
│   ├── DashboardLayout.jsx      # Sidebar nav + dark mode toggle
│   └── DashboardLayout.css
└── pages/
    ├── Home.jsx                 # Landing page
    ├── Features.jsx             # Features showcase
    ├── About.jsx                # About page
    ├── Login.jsx                # Login form
    ├── Register.jsx             # Registration form
    └── dashboard/
        ├── TextToSpeech.jsx     # Urdu textarea → TTS → 3D visualizer
        ├── VoiceCloning.jsx     # File upload / mic record → clone → visualizer
        ├── History.jsx          # Past generations (audio + download)
        ├── Settings.jsx         # Account info + sign out
        └── DashboardComponents.css
```

### Design System (CSS Variables)
```css
--navy-primary: #1e3a8a    /* Royal Blue — primary brand */
--navy-medium:  #2563eb    /* Vibrant Blue */
--navy-light:   #3b82f6    /* Bright Blue */
--navy-accent:  #60a5fa    /* Soft Accent Blue */
--white:        #ffffff
--gray-50:      #f8fafc
--gray-200:     #e2e8f0
--text-primary: #0f172a
--text-secondary: #475569
```

**Dark Mode:** `document.documentElement.setAttribute('data-theme', 'dark')` — CSS variable  
overrides under `[data-theme="dark"]` switch all backgrounds and text colours.  
Persisted in `localStorage` under key `theme`.

### Dashboard Layout
- **Sidebar** (268px fixed): gradient accent bar at top, logo, user profile mini, nav items, theme toggle, sign out
- **Content area**: `margin-left: 268px`, `padding: 2.5rem 3rem`, light gray background
- **Mobile**: sidebar slides in off-canvas (`transform: translateX(-100%)` → `translateX(0)`)
- **Active nav item**: `background-color: var(--navy-primary); color: white`

### Feature Pages

#### Text-to-Speech (`/dashboard/tts`)
1. Urdu textarea (RTL, Noto Nastaliq Urdu font, direction: rtl)
2. Generate Speech button → POST `/tts_simple`
3. Response blob → `URL.createObjectURL()` → `AudioVisualizer3D`

#### Voice Cloning (`/dashboard/clone`)
1. **File upload**: accepts any audio; frontend auto-converts to WAV using `AudioContext.decodeAudioData()` + custom PCM encoder
2. **Mic recording**: `MediaRecorder` API → webm/ogg → auto-converted to WAV; live timer display
3. Urdu textarea
4. Similarity slider (tau: 0.1–1.0) → maps to `exaggeration` parameter
5. Generate button → POST `/clone` (multipart: text + tau + ref WAV file)
6. Response blob → `AudioVisualizer3D`

#### History (`/dashboard/history`)
- Fetches `GET /history` on mount
- Each item shows: badge (TTS/Voice Clone), date, text snippet, audio player, download link
- Audio URLs: `${API_BASE}/static/${filename}`

#### Settings (`/dashboard/settings`)
- Shows username, email, plan (Free Tier)
- Sign out button

### 3D Audio Visualizer (`AudioVisualizer3D.jsx`)
Three-layered Three.js scene inside a dark radial-gradient container:

| Layer | Component | Behaviour when playing |
|-------|-----------|----------------------|
| Core | `BlobSphere` — MeshDistortMaterial sphere | Scales up with bass frequency, distorts with mid-range, emissive glow increases with volume |
| Orbit | Two `Torus` rings | Spin faster with audio energy |
| Outer | `Particles` — 100-point ring | Rotate faster, higher opacity with audio energy |

**Audio reactivity**: Web Audio API `AnalyserNode` (fftSize=64, smoothing=0.75).  
Initialized in `onPlay` callback (required user gesture for AudioContext).  
`createMediaElementSource` → `AnalyserNode` → `destination` (audio still plays through speakers).  
`analyserRef` passed to R3F scene; `useFrame` calls `getByteFrequencyData()` 60× per second.

**Canvas setup**: `gl={{ alpha: true }}` for transparent background; dark background comes  
from the `.av-wrapper` CSS `radial-gradient(ellipse, #0f2040 → #020817 → #00000f)`.

### API URL Configuration
```js
// src/config.js
export const API_BASE = localStorage.getItem('api_base')
    || 'https://mbilalcr07-bol-backend.hf.space';
```
Override from browser DevTools without rebuilding:
```js
localStorage.setItem('api_base', 'https://xxxx.ngrok-free.app')
```

---

## 10. Frontend Deployment — Vercel

### Repository Connection
- **GitHub repo**: `Bilal-Shinwari/FYP-Project`
- **Root directory** (Vercel project setting): `text-to-speech/voicegen-frontend`
- **Build command**: `npm run build` (Vite)
- **Output directory**: `dist`
- **Framework preset**: Vite

### `vercel.json`
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```
This routes all paths to `index.html` so React Router handles client-side navigation.

### CI/CD Pipeline — Frontend
```
Developer pushes to GitHub main branch (Bilal-Shinwari/FYP-Project)
    ↓
Vercel webhook fires (connected to GitHub repo)
    ↓
Vercel pulls the repo, runs `npm run build` inside voicegen-frontend/
    ↓
Static assets deployed to Vercel CDN (global edge network)
    ↓
Frontend live at: [vercel-assigned-url].vercel.app
```
**Zero manual steps needed** — every `git push origin main` auto-deploys the frontend.

---

## 11. Full CI/CD Summary

| Component | Trigger | Pipeline | Time |
|-----------|---------|----------|------|
| Frontend | `git push` to GitHub main | GitHub → Vercel webhook → `npm run build` → CDN | ~1 min |
| Backend (HF Space) | `git push` to HF Space remote (from `hf-space/`) | HF git → Docker build → container restart | ~5–10 min |
| Model weights | One-time upload via `FYP_Upload_Models.ipynb` | Google Drive → `huggingface_hub.upload_file` → HF Hub | One-time |

---

## 12. Google Colab GPU Backend

For fast GPU inference during demos (HF Spaces CPU is slow):

### Notebooks
| Notebook | Purpose |
|----------|---------|
| `FYP_Upload_Models.ipynb` | One-time: uploads ~5GB model weights from local → Google Drive |
| `FYP_Colab_Backend.ipynb` | Each session: T4 GPU backend via ngrok tunnel |

### Colab Session Flow
```
Cell 1: nvidia-smi (verify T4 GPU)
Cell 2: pip install dependencies + uninstall torchvision (CRITICAL — version conflict with chatterbox)
Cell 3: Mount Google Drive
Cell 4: git clone Bilal-Shinwari/FYP-Project from GitHub
Cell 5: Copy model weights from Drive → /content/models/
Cell 6: Set NGROK_TOKEN (raw token only, NOT the full CLI command)
Cell 7: ngrok.set_auth_token(NGROK_TOKEN)
Cell 8: Kill any existing process on port 8000
Cell 9: Start FastAPI + open ngrok tunnel → prints localStorage.setItem(...) command
```

### Critical Bug: torchvision Conflict
`chatterbox-tts==0.1.2` installs `torch==2.6.0`, but Colab T4 pre-installs `torchvision==0.25.0+cu128`  
which requires `torch==2.10.0`. Fix: `!pip uninstall -y torchvision` (TTS has no CV dependency).

---

## 13. Local Development Setup

### Backend
```bash
# Prerequisites: conda, Python 3.11 env named fyp-backend
conda run -n fyp-backend uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Wait for: "Model loaded successfully!" (3-5 min on CPU)
```

### Frontend
```bash
cd text-to-speech/voicegen-frontend/
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run lint     # ESLint check
```

### Environment Variables (backend)

| Variable | Default | Purpose |
|----------|---------|---------|
| `FINETUNE_DIR` | `D:\FYP\FYP\t3_finetuned_model\chatterbox-finetuning` | Local ML repo path — override in Colab |
| `ALLOW_ALL_ORIGINS` | unset (local) / `1` (HF Space) | Set to `1` for wildcard CORS |
| `HF_MODEL_REPO` | `mbilalcr07/bol-urdu-tts` | HF Hub model to download at startup |
| `DATABASE_URL` | `sqlite:////data/tts_app.db` | Override for PostgreSQL on paid tier |

---

## 14. Request / Response Flow (End-to-End)

```
User types Urdu text in browser
    ↓
React fetches POST /tts_simple with { text } + Authorization: Bearer JWT
    ↓
FastAPI: auth.get_current_user() validates JWT → returns User ORM object
    ↓
generate_audio_file(text, prompt_path, param_overrides):
    1. Split text on [.?!] boundaries into sentences
    2. For each sentence:
       a. tts_engine.generate(text, audio_prompt_path, **BASE_PARAMS)
       b. T3 generates speech tokens (LLaMA autoregressive, ~7-8 tok/s on CPU)
       c. AlignmentStreamAnalyzer monitors tokens; forces EOS on long_tail/repetition
       d. S3Gen decodes speech tokens → mel → waveform (Flow Matching)
       e. VE reads reference prompt → speaker embedding (used by S3Gen)
       f. VAD silence trimming
    3. Concatenate chunks with 0.2s silence padding
    4. sf.write(filepath, audio, 24000) → /data/static/generated_<uuid>.wav
    ↓
FileResponse(wav) returned to frontend
    ↓
Frontend: blob = await res.blob() → URL.createObjectURL(blob) → audioUrl
    ↓
AudioVisualizer3D renders: 3D scene + <audio autoPlay src={audioUrl} />
    ↓
AudioContext created on onPlay → AnalyserNode drives 3D animation in useFrame
    ↓
History record saved: { user_id, input_text, audio_path, model_type: 'TTS' }
```

---

## 15. Technologies Summary (for Poster / Presentation)

### Machine Learning
| Technology | Version | Role |
|-----------|---------|------|
| ChatterBox TTS | 0.1.2 | Base TTS model (ResembleAI) |
| PyTorch | 2.6.0 | Deep learning framework |
| torchaudio | 2.6.0 | Audio processing |
| safetensors | — | Model weight serialization |
| soundfile | — | WAV I/O |
| omegaconf | — | Config management |
| pyloudnorm | — | Loudness normalization |
| NumPy | — | Audio array manipulation |

### Backend
| Technology | Version | Role |
|-----------|---------|------|
| Python | 3.11 | Runtime |
| FastAPI | 0.136.0 | REST API framework |
| uvicorn | — | ASGI server |
| SQLAlchemy | — | ORM (SQLite) |
| passlib + bcrypt | 1.7.4 + 4.0.1 | Password hashing |
| python-jose | — | JWT tokens |
| Docker | — | Container (HF Spaces) |
| HuggingFace Hub | — | Model weight hosting + download |

### Frontend
| Technology | Version | Role |
|-----------|---------|------|
| React | 19.2.0 | UI framework |
| Vite | 7.2.4 | Build tool + dev server |
| React Router | 7.13.0 | Client-side routing |
| Three.js | 0.184.0 | 3D WebGL rendering |
| @react-three/fiber | 9.6.0 | React bindings for Three.js |
| @react-three/drei | 10.7.7 | Three.js helpers (Sphere, Torus, etc.) |
| lucide-react | 0.563.0 | Icon library |
| Web Audio API | Browser native | Audio analysis (AnalyserNode) |
| MediaRecorder API | Browser native | Microphone recording |
| CSS Variables | — | Design system + dark mode |

### Infrastructure / DevOps
| Technology | Role |
|-----------|------|
| GitHub (`Bilal-Shinwari/FYP-Project`) | Source control |
| HuggingFace Spaces (`mbilalcr07/bol-backend`) | Backend hosting (Docker, CPU) |
| HuggingFace Hub (`mbilalcr07/bol-urdu-tts`) | Model weight storage (5GB) |
| Vercel | Frontend hosting (CDN, auto-deploy) |
| Google Colab (T4 GPU) | GPU inference during demos |
| Google Drive | Model weight backup + training data |
| ngrok | Colab → public tunnel |

---

## 16. Project Repository Structure

```
FYP/  (GitHub: Bilal-Shinwari/FYP-Project)
├── CLAUDE.md                              # This file
├── hf-space/                              # HF Spaces backend (own git → HF remote)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                            # Production FastAPI app
│   ├── auth.py                            # JWT + bcrypt
│   ├── models.py                          # SQLAlchemy ORM
│   ├── schemas.py                         # Pydantic v2
│   ├── database.py                        # SQLite: /data/tts_app.db
│   ├── inference.py                       # load_finetuned_engine(), PARAMS
│   └── src/chatterbox_/                   # Forked ChatterBox source
│       └── models/t3/inference/
│           └── alignment_stream_analyzer.py  # EOS fix (4x threshold)
├── text-to-speech/
│   ├── tts-backend/                       # Local FastAPI (dev only)
│   │   ├── main.py
│   │   ├── auth.py, models.py, schemas.py, database.py
│   │   └── static/                        # Generated WAVs (gitignored)
│   └── voicegen-frontend/                 # React + Vite frontend
│       ├── vercel.json                    # Vercel SPA rewrite rule
│       ├── package.json
│       └── src/
│           ├── config.js                  # API_BASE (HF Space URL default)
│           ├── App.jsx                    # Router
│           ├── index.css                  # CSS design system + dark mode
│           ├── context/AuthContext.jsx
│           ├── components/AudioVisualizer3D.jsx
│           ├── layouts/DashboardLayout.jsx
│           └── pages/dashboard/           # TTS, VoiceCloning, History, Settings
├── t3_finetuned_model/
│   └── chatterbox-finetuning/             # Training + local inference
│       ├── inference.py                   # load_finetuned_engine()
│       ├── src/config.py                  # TrainConfig dataclass
│       ├── speaker_reference/2.wav        # Default voice prompt
│       ├── t3_finetuned.safetensors       # 2GB fine-tuned weights (gitignored)
│       └── pretrained_models/             # Base weights (gitignored)
├── FYP_Colab_Backend.ipynb                # Colab T4 GPU backend notebook
└── FYP_Upload_Models.ipynb                # One-time model upload to Drive/HF Hub
```

---

## 17. Running the Project (Quick Start)

### Option A: Local backend + local frontend (CPU, slow)
```bash
# Terminal 1 — backend
conda run -n fyp-backend uvicorn main:app --reload --host 0.0.0.0 --port 8000
# (from text-to-speech/tts-backend/)

# Terminal 2 — frontend
cd text-to-speech/voicegen-frontend/
npm run dev    # opens http://localhost:5173
# Frontend defaults to HF Space API — change config.js to use localhost:8000 for local backend
```

### Option B: HF Space backend + Vercel frontend (live, CPU)
- Frontend deployed on Vercel auto-connects to `https://mbilalcr07-bol-backend.hf.space`
- No setup needed — just open the Vercel URL

### Option C: Colab T4 GPU backend + local/Vercel frontend (demo-quality speed)
```bash
# 1. Open FYP_Colab_Backend.ipynb in Colab (T4 runtime)
# 2. Run all cells — Cell 9 prints:
#    localStorage.setItem('api_base', 'https://xxxx.ngrok-free.app')
# 3. Paste that into browser DevTools console → refresh
```

---

## 18. Key Design Decisions (for FYP Defence)

1. **ChatterBox over alternatives (Tortoise, XTTS, Coqui)**: ChatterBox's two-stage T3+S3Gen architecture separates text alignment from waveform synthesis, making fine-tuning faster — only the T3 text-understanding stage needs retraining, not the vocoder.

2. **Non-Turbo mode**: Smaller Urdu-only vocabulary (2,454 tokens vs 52,260) — trains faster on limited data, better fits the Urdu phoneme space.

3. **Sentence-split inference**: Long Urdu texts caused token repetition loops. Splitting on `.?!` and generating per sentence (then concatenating) eliminates this at the cost of slight pause artifacts.

4. **HF Spaces for backend**: Free, persistent Docker hosting with a `/data` volume. No EC2/GCP costs for FYP. Tradeoff: CPU-only → slow inference (~25s/sentence).

5. **SQLite over PostgreSQL**: Zero-config for FYP. Persistent on HF `/data` volume. Upgradeable via `DATABASE_URL` env var if needed.

6. **JWT in localStorage**: Simpler than httpOnly cookies for a SPA demo. Not production-grade (XSS risk) but acceptable for FYP scope.

7. **Vercel for frontend**: Zero config for Vite+React. Auto-deploys on GitHub push. The `vercel.json` rewrite rule handles SPA routing.

8. **Web Audio API for visualization**: `AnalyserNode` initialized only on user play gesture (browser autoplay policy). `createMediaElementSource` connects the audio element to both the analyser and speakers — visualization and audio are in sync.

---

## 19. Colab Notebook Bug History (April 2026)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `torchvision::nms` RuntimeError | Colab torchvision 0.25.0 requires torch 2.10, but chatterbox installs torch 2.6 | `!pip uninstall -y torchvision` (TTS has no CV dependency) |
| Model weights not found | `DRIVE_MODELS` path had spurious `/pretrained_models` suffix | Fixed to `'MyDrive/FYP/t3_finetuned_model/chatterbox-finetuning'` |
| ngrok auth failed | `NGROK_TOKEN` contained the full CLI command, not just the token | Set to raw token string only |
| Extra cell crash | Experimental torchvision reinstall cell left between Cell 2 and Cell 3 | Delete that cell before running |

---

## 20. Alignment Analyzer Fix Detail (Technical)

**File:** `hf-space/src/chatterbox_/models/t3/inference/alignment_stream_analyzer.py`

**Problem:** Original code forced EOS after seeing the same token **2× in a row**:
```python
# BEFORE (too aggressive — Urdu phonemes legitimately repeat)
token_repetition = len(set(self.generated_tokens[-2:])) == 1
```
This caused generation to stop at step ~30 (≈4 seconds), producing 1-second silent audio.

**Fix:** Raised threshold to **4× in a row**, plus minimum 30-step guard:
```python
# AFTER
token_repetition = (
    self.curr_frame_pos >= 30 and           # don't fire in first 30 steps
    len(self.generated_tokens) >= 5 and
    len(set(self.generated_tokens[-4:])) == 1  # same token 4x
)
```

**`long_tail` behavior (correct, no change needed):** At step ~164, `long_tail=True` fires  
because the model completed the text and then lingered on the last tokens for >5 frames (≈200ms).  
This is correct — it prevents reverb/echo artifacts at the end of speech.
