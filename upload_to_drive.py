"""
upload_to_drive.py
------------------
Uploads all FYP model files to Google Drive automatically.

Run once:
    conda run -n fyp-backend python upload_to_drive.py

What it does:
  1. Opens your browser for Google sign-in (one time only)
  2. Creates  MyDrive/FYP_Models/ folder structure
  3. Uploads all model weights + speaker reference
  4. Prints a confirmation when done

Requirements (auto-installed below):
    pip install pydrive2 tqdm
"""

import subprocess, sys, os

# ── Auto-install dependencies ───────────────────────────────────────────────
def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

try:
    from pydrive2.auth import GoogleAuth
    from pydrive2.drive import GoogleDrive
except ImportError:
    print("Installing pydrive2...")
    install("pydrive2")
    from pydrive2.auth import GoogleAuth
    from pydrive2.drive import GoogleDrive

try:
    from tqdm import tqdm
except ImportError:
    install("tqdm")
    from tqdm import tqdm

# ── Paths ────────────────────────────────────────────────────────────────────
BASE = r"D:\FYP\FYP\t3_finetuned_model\chatterbox-finetuning"

FILES_TO_UPLOAD = {
    # (local_path, drive_subfolder)
    "t3_finetuned.safetensors": (
        os.path.join(BASE, "t3_finetuned.safetensors"),
        "FYP_Models"
    ),
    "conds.pt": (
        os.path.join(BASE, "pretrained_models", "conds.pt"),
        "FYP_Models/pretrained_models"
    ),
    "s3gen.safetensors": (
        os.path.join(BASE, "pretrained_models", "s3gen.safetensors"),
        "FYP_Models/pretrained_models"
    ),
    "t3_cfg.safetensors": (
        os.path.join(BASE, "pretrained_models", "t3_cfg.safetensors"),
        "FYP_Models/pretrained_models"
    ),
    "tokenizer.json": (
        os.path.join(BASE, "pretrained_models", "tokenizer.json"),
        "FYP_Models/pretrained_models"
    ),
    "ve.safetensors": (
        os.path.join(BASE, "pretrained_models", "ve.safetensors"),
        "FYP_Models/pretrained_models"
    ),
    "2.wav": (
        os.path.join(BASE, "speaker_reference", "2.wav"),
        "FYP_Models/speaker_reference"
    ),
}

# ── Google Auth ──────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  FYP Model Uploader → Google Drive")
print("="*60)
print("\nStep 1: Opening browser for Google sign-in...")
print("  → Sign in with your Google account")
print("  → Click 'Allow' to grant Drive access\n")

gauth = GoogleAuth()

# Use local webserver auth (opens browser automatically)
gauth.LocalWebserverAuth()

drive = GoogleDrive(gauth)
print("✅ Signed in successfully!\n")

# ── Helper: get or create folder ─────────────────────────────────────────────
_folder_cache = {}

def get_or_create_folder(name: str, parent_id: str = "root") -> str:
    """Returns the Drive folder ID, creating it if it doesn't exist."""
    cache_key = f"{parent_id}/{name}"
    if cache_key in _folder_cache:
        return _folder_cache[cache_key]

    query = (
        f"title='{name}' and "
        f"'{parent_id}' in parents and "
        f"mimeType='application/vnd.google-apps.folder' and "
        f"trashed=false"
    )
    existing = drive.ListFile({"q": query}).GetList()

    if existing:
        folder_id = existing[0]["id"]
    else:
        folder = drive.CreateFile({
            "title": name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [{"id": parent_id}],
        })
        folder.Upload()
        folder_id = folder["id"]
        print(f"  📁 Created folder: {name}")

    _folder_cache[cache_key] = folder_id
    return folder_id


def resolve_folder_path(path: str) -> str:
    """Resolves a slash-separated folder path and returns its Drive ID."""
    parts = path.strip("/").split("/")
    parent_id = "root"
    for part in parts:
        parent_id = get_or_create_folder(part, parent_id)
    return parent_id


def file_exists_in_folder(filename: str, folder_id: str) -> bool:
    """Returns True if file already exists in the folder on Drive."""
    query = (
        f"title='{filename}' and "
        f"'{folder_id}' in parents and "
        f"trashed=false"
    )
    return len(drive.ListFile({"q": query}).GetList()) > 0


# ── Upload ────────────────────────────────────────────────────────────────────
print("Step 2: Creating folder structure and uploading files...\n")

total_files = len(FILES_TO_UPLOAD)
uploaded = 0
skipped = 0

for filename, (local_path, drive_folder_path) in FILES_TO_UPLOAD.items():
    size_mb = os.path.getsize(local_path) / (1024 * 1024)
    print(f"[{uploaded + skipped + 1}/{total_files}] {filename}  ({size_mb:.1f} MB)")

    if not os.path.exists(local_path):
        print(f"  ⚠ SKIPPED — file not found: {local_path}")
        skipped += 1
        continue

    folder_id = resolve_folder_path(drive_folder_path)

    if file_exists_in_folder(filename, folder_id):
        print(f"  ✓ Already on Drive — skipping")
        skipped += 1
        continue

    print(f"  ⬆ Uploading...")
    gfile = drive.CreateFile({
        "title": filename,
        "parents": [{"id": folder_id}]
    })
    gfile.SetContentFile(local_path)
    gfile.Upload()
    print(f"  ✅ Done")
    uploaded += 1

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print(f"  Upload complete!")
print(f"  Uploaded : {uploaded} file(s)")
print(f"  Skipped  : {skipped} file(s) (already on Drive)")
print("="*60)
print("\nYour Google Drive now has:")
print("  MyDrive/FYP_Models/")
print("    ├── t3_finetuned.safetensors")
print("    ├── pretrained_models/")
print("    │   ├── conds.pt")
print("    │   ├── s3gen.safetensors")
print("    │   ├── t3_cfg.safetensors")
print("    │   ├── tokenizer.json")
print("    │   └── ve.safetensors")
print("    └── speaker_reference/")
print("        └── 2.wav")
print("\n✅ You can now run FYP_Colab_Backend.ipynb in Google Colab!")
