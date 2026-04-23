import sys, os, traceback

FINETUNE_DIR = r"D:\FYP\FYP\t3_finetuned_model\chatterbox-finetuning"
sys.path.append(FINETUNE_DIR)

import torch
from inference import load_finetuned_engine
import inference as inf_module

inf_module.BASE_MODEL_DIR = os.path.join(FINETUNE_DIR, "pretrained_models")
inf_module.FINETUNED_WEIGHTS = os.path.join(FINETUNE_DIR, "t3_finetuned.safetensors")

print("IS_TURBO:", inf_module.IS_TURBO)
print("Weights file exists:", os.path.exists(inf_module.FINETUNED_WEIGHTS))
print("Pretrained dir exists:", os.path.exists(inf_module.BASE_MODEL_DIR))
print()
print("Starting model load on cpu...")

try:
    engine = load_finetuned_engine("cpu")
    print("SUCCESS - engine loaded:", type(engine).__name__)
    print("Sample rate:", engine.sr)

    print("\nGenerating test audio...")
    import numpy as np
    wav = engine.generate(
        text="ٹیسٹ",
        audio_prompt_path=os.path.join(FINETUNE_DIR, "speaker_reference", "2.wav"),
        **inf_module.PARAMS
    )
    print("Audio shape:", wav.shape)
    print("Duration:", round(wav.shape[-1] / engine.sr, 2), "seconds")
    print("\nALL TESTS PASSED")

except Exception as e:
    print("FAILED:", e)
    traceback.print_exc()
