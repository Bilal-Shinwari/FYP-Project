import soundfile as sf
from safetensors.torch import load_file
from src.chatterbox_.tts import ChatterboxTTS
from pathlib import Path

BASE = Path("D:/t3_finetuned_model/chatterbox-finetuning")

# Load model from local pretrained folder
tts = ChatterboxTTS.from_local(BASE / "pretrained_models", device="cpu")

# Load your fine-tuned weights
state = load_file(BASE / "t3_finetuned.safetensors")
tts.t3.load_state_dict(state, strict=False)

# Prepare voice conditioning
tts.prepare_conditionals(
    wav_fpath=str(BASE / "speaker_reference/2.wav")
)

# Generate
audio = tts.generate("یہ میرا اردو ٹیکسٹ ٹو اسپیچ ماڈل ہے۔")

sf.write("urdu_output.wav", audio.squeeze().numpy(), tts.sr)

print("Done")
