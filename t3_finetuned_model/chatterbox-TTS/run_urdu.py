import soundfile as sf
from safetensors.torch import load_file
from chatterbox.tts import ChatterboxTTS

print("Loading pretrained model...")
tts = ChatterboxTTS.from_pretrained(device="cpu")

print("Loading fine-tuned weights...")
state = load_file("t3_finetuned.safetensors")
tts.t3.load_state_dict(state, strict=False)

print("Generating Urdu speech...")
audio = tts.generate(
    "یہ میرا اردو ٹیکسٹ ٹو اسپیچ ماڈل ہے۔",
    audio_prompt_path="speaker_reference/2.wav"
)

sf.write("urdu_output.wav", audio.squeeze().numpy(), tts.sr)

print("Done! Saved urdu_output.wav")
