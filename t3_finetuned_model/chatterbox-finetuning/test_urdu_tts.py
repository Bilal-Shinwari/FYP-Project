import torch
import soundfile as sf
from pathlib import Path

from src.chatterbox_.tts import ChatterboxTTS


# ==========================================================
# PATH CONFIGURATION
# ==========================================================

# Base directory (where chatterbox-finetuning repo is located)
BASE_DIR = Path("D:/t3_finetuned_model/chatterbox-finetuning")

# Pretrained components folder
PRETRAINED_DIR = BASE_DIR / "pretrained_models"

# Your fine-tuned model file
FINETUNED_MODEL = BASE_DIR / "t3_finetuned.safetensors"

# Output file
OUTPUT_WAV = BASE_DIR / "urdu_output.wav"


# ==========================================================
# LOAD MODEL
# ==========================================================

print("✅ Loading Chatterbox Base Model...")
tts = ChatterboxTTS.from_local(PRETRAINED_DIR, device="cpu")

print("✅ Loading Fine-Tuned T3 weights...")
state_dict = torch.load(FINETUNED_MODEL, map_location="cpu")
tts.t3.load_state_dict(state_dict)

print("🎉 Model loaded successfully!")


# ==========================================================
# PREPARE CONDITIONING (IMPORTANT)
# ==========================================================

# If conds.pt exists, it will auto-load.
# If not, we must manually prepare conditionals using a reference voice.

if tts.conds is None:
    print("⚠ No built-in voice found. Preparing conditioning...")
    
    # Use any reference wav from speaker_reference folder
    reference_wav = BASE_DIR / "speaker_reference" / "2.wav"
    
    tts.prepare_conditionals(
        wav_fpath=str(reference_wav),
        exaggeration=0.5
    )


# ==========================================================
# GENERATE URDU SPEECH
# ==========================================================

urdu_text = "یہ میرا اردو ٹیکسٹ ٹو اسپیچ ماڈل ہے۔"

print("🗣 Generating Urdu audio...")
audio_tensor = tts.generate(urdu_text)

audio_np = audio_tensor.squeeze().cpu().numpy()


# ==========================================================
# SAVE OUTPUT
# ==========================================================

print("💾 Saving audio file...")
sf.write(
    str(OUTPUT_WAV),
    audio_np,
    samplerate=tts.sr
)

print("✅ Done!")
print(f"🎧 Audio saved at: {OUTPUT_WAV}")
