"""Encode an attributed offline dish photo without storing the original in the app."""
import argparse
from io import BytesIO
from pathlib import Path
import re
import json

from PIL import Image, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument("recipe_id")
parser.add_argument("original", type=Path)
parser.add_argument("--full-frame", action="store_true", help="Use a single complete image in the list and detail view")
args = parser.parse_args()
if not re.fullmatch(r"[a-z0-9-]+", args.recipe_id):
    parser.error("Expected a recipe ID such as tomato-eggs")
target = Path(__file__).resolve().parents[1] / "public" / "dishes"

with Image.open(args.original) as original:
    view = ImageOps.exif_transpose(original).convert("RGB")
if min(view.size) < 192:
    parser.error("Use a larger original so the thumbnail stays sharp")
def compress(image, limit):
    for quality in (80, 76, 72, 68, 64, 60, 56, 52):
        buffer = BytesIO()
        image.save(buffer, "WEBP", quality=quality, method=6, exif=b"", icc_profile=b"")
        data = buffer.getvalue()
        if len(data) <= limit:
            return data
    raise ValueError("Image exceeds the budget; select a cleaner crop or original")

# Encode both before replacing existing assets so a failed budget check preserves them.
root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "src/dish-photos.json").read_text())
if args.full_frame or manifest.get(args.recipe_id, {}).get("fullFrame"):
    for edge in (640, 600, 560, 520, 480, 448, 420, 384, 356):
        rendition = view.copy()
        rendition.thumbnail((edge, edge), Image.Resampling.LANCZOS)
        try:
            outputs = {"photo": compress(rendition, 22 * 1024)}
            break
        except ValueError:
            continue
    else:
        raise ValueError("Use a clearer original that fits the mobile budget")
else:
    view.thumbnail((768, 768), Image.Resampling.LANCZOS)
    thumb = ImageOps.fit(view, (224, 192), method=Image.Resampling.LANCZOS)
    outputs = {"thumb": compress(thumb, 16 * 1024), "view": compress(view, 80 * 1024)}
target.mkdir(exist_ok=True, parents=True)
for size, data in outputs.items():
    (target / f"{args.recipe_id}-{size}.webp").write_bytes(data)
