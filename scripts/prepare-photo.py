"""Prepare the two offline sizes of an already reviewed and licensed dish photo."""
import argparse
from io import BytesIO
from pathlib import Path
import re

from PIL import Image, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument("recipe_id")
parser.add_argument("original", type=Path)
args = parser.parse_args()
if not re.fullmatch(r"[a-z0-9-]+", args.recipe_id):
    parser.error("Expected a recipe ID such as tomato-eggs")
target = Path(__file__).resolve().parents[1] / "public" / "dishes"

with Image.open(args.original) as original:
    view = ImageOps.exif_transpose(original).convert("RGB")
if min(view.size) < 192:
    parser.error("Use a larger original so the thumbnail stays sharp")
view.thumbnail((768, 768), Image.Resampling.LANCZOS)
thumb = ImageOps.fit(view, (224, 192), method=Image.Resampling.LANCZOS)

def compress(image, limit):
    for quality in (80, 76, 72, 68, 64, 60, 56, 52):
        buffer = BytesIO()
        image.save(buffer, "WEBP", quality=quality, method=6, exif=b"", icc_profile=b"")
        data = buffer.getvalue()
        if len(data) <= limit:
            return data
    raise ValueError("Image exceeds the budget; select a cleaner crop or original")

# Encode both before replacing existing assets so a failed budget check preserves them.
outputs = {"thumb": compress(thumb, 16 * 1024), "view": compress(view, 80 * 1024)}
target.mkdir(exist_ok=True, parents=True)
for size, data in outputs.items():
    (target / f"{args.recipe_id}-{size}.webp").write_bytes(data)
