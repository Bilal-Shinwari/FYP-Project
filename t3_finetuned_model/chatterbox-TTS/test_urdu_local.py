import soundfile as sf
from safetensors.torch import load_file

# IMPORTANT: import path may differ depending on repo
# Try this first:
from chatterbox.tts import ChatterboxTTS

tts = ChatterboxTTS(device="cpu")

# Load your fine-tuned T3 weights
state = load_file("t3_finetuned.safetensors")
tts.t3.load_state_dict(state, strict=False)

text = "یہ میرا اردو ٹیکسٹ ٹو اسپیچ ماڈل ہے۔"
audio = tts.generate(text)

sf.write("urdu_output.wav", audio.squeeze().numpy(), tts.sr)
print("✅ Saved: urdu_output.wav")
