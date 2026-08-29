"""Downscale the oversized politician art in assets/images/.

The source PNGs are 2048x2048 / 1.5-8 MB each; the app never shows them
larger than ~400 px. Loading + decoding all ~21 at once on a phone blows
iOS Safari's per-tab image-memory cap, so most render blank. This shrinks
portraits to 768 px and the welcome background to 1280 px, re-optimized,
with the same filenames (no data/code references change).

Run from the repo root:  python scripts/shrink-images.py

Idempotent-ish: re-running just re-encodes the already-small files.
Originals are recoverable via git.

Requires Pillow (`pip install pillow`).
"""
import glob
import os

from PIL import Image

IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
BG_NAME = "PradhanMantriBg.png"

tot_old = tot_new = 0
for path in sorted(glob.glob(os.path.join(IMAGES_DIR, "*.png"))):
    name = os.path.basename(path)
    cap = 1280 if name == BG_NAME else 768
    old = os.path.getsize(path)
    im = Image.open(path).convert("RGB")
    im.thumbnail((cap, cap), Image.LANCZOS)
    im.save(path, "PNG", optimize=True)
    new = os.path.getsize(path)
    tot_old += old
    tot_new += new
    print(f"{name:30} {str(im.size):12} {old // 1024:>6}K -> {new // 1024:>5}K")

print(f"\nTOTAL  {tot_old / 1048576:.1f} MB -> {tot_new / 1048576:.1f} MB")
