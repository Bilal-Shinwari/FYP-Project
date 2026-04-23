from huggingface_hub import hf_hub_download
import os

REPO_ID = "ResembleAI/chatterbox"

save_dir = "./pretrained_models"
os.makedirs(save_dir, exist_ok=True)

files_needed = [
    "ve.safetensors",
    "s3gen.safetensors",
    "conds.pt",
    "tokenizer.json",

    # ✅ ADD THESE TWO:
    "t3.safetensors",
    "t3_cfg.safetensors"
]

print("⬇️ Downloading FULL pretrained Chatterbox files...\n")

for file in files_needed:
    hf_hub_download(
        repo_id=REPO_ID,
        filename=file,
        local_dir=save_dir,
        local_dir_use_symlinks=False
    )
    print(f"✅ Downloaded: {file}")

print("\n🎉 Done! All pretrained files saved in:")
print(save_dir)
