"""Convert the politician art and party logos to WebP.

The portraits are photographic RGB PNGs with no alpha channel — a lossless
codec for lossy content. Re-encoding the same pixels as WebP q80 takes
~19.7 MB down to ~2.1 MB (9.4x). PNG is already compressed, so GitHub Pages'
gzip does nothing for it; that 17.6 MB is real wire traffic on every cold
visit.

Two party-logo SVGs are auto-traced bitmaps (the TMC one is 895 KB of path
data across 130,474 coordinate points) rendered as ~30px badges. Coordinate
rounding only saves 13%, so they get rasterised instead.

Also caps dimensions, as the original version of this script did: portraits
at 768px (they render at 373x170 CSS px on a 3x screen, so this is already
conservative) and the welcome background at 1280px.

Run from the repo root:  python scripts/shrink-images.py

Writes .webp alongside the originals and leaves the source PNGs in place —
update data/politicians-data.json and index.html to point at the .webp files,
then delete the PNGs in a separate commit if you want them gone. Originals
are recoverable from git either way.

Requires Pillow (`pip install pillow`). SVG rasterisation additionally needs
cairosvg; it's skipped with a warning if unavailable.
"""
import glob
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
IMAGES_DIR = os.path.join(ROOT, "assets", "images")
ICONS_DIR = os.path.join(ROOT, "assets", "icons")

BG_NAME = "PradhanMantriBg.png"
PORTRAIT_CAP = 768
BG_CAP = 1280
QUALITY = 80

# Only these two are auto-traced bitmap exports; the other three party logos
# are real vector art in the 8-28 KB range and stay as SVG.
FAT_LOGOS = {
    "All_India_Trinamool_Congress_logo_(3).svg": 96,
    "Aam_Aadmi_Party_logo_(English).svg": 96,
}


def convert_images():
    """Re-encode every PNG in assets/images/ as WebP at the same dimensions.

    Returns:
        tuple[int, int]: total source bytes and total output bytes.
    """
    tot_old = tot_new = 0
    for path in sorted(glob.glob(os.path.join(IMAGES_DIR, "*.png"))):
        name = os.path.basename(path)
        cap = BG_CAP if name == BG_NAME else PORTRAIT_CAP
        out = os.path.splitext(path)[0] + ".webp"
        old = os.path.getsize(path)

        im = Image.open(path).convert("RGB")
        im.thumbnail((cap, cap), Image.LANCZOS)
        im.save(out, "WEBP", quality=QUALITY, method=6)

        new = os.path.getsize(out)
        tot_old += old
        tot_new += new
        print(f"  {name:34} {str(im.size):12} {old // 1024:>6}K -> {new // 1024:>5}K")
    return tot_old, tot_new


def convert_logos():
    """Rasterise the two oversized auto-traced party-logo SVGs to WebP.

    Returns:
        tuple[int, int]: total source bytes and total output bytes. Both are
        zero if cairosvg is unavailable.
    """
    try:
        import cairosvg
    except ImportError:
        print("  (skipped — `pip install cairosvg` to rasterise the party logos)")
        return 0, 0

    import io

    tot_old = tot_new = 0
    for name, size in FAT_LOGOS.items():
        path = os.path.join(ICONS_DIR, name)
        if not os.path.exists(path):
            continue
        out = os.path.splitext(path)[0] + ".webp"
        old = os.path.getsize(path)

        png_bytes = cairosvg.svg2png(url=path, output_width=size, output_height=size)
        # Keep alpha here — unlike the portraits, a logo badge sits on the card
        # background and its corners must stay transparent.
        Image.open(io.BytesIO(png_bytes)).convert("RGBA").save(
            out, "WEBP", quality=QUALITY, method=6
        )

        new = os.path.getsize(out)
        tot_old += old
        tot_new += new
        print(f"  {name:34} {size}x{size:<9} {old // 1024:>6}K -> {new // 1024:>5}K")
    return tot_old, tot_new


if __name__ == "__main__":
    print("portraits + welcome background:")
    img_old, img_new = convert_images()
    print("\nparty logos (auto-traced SVG -> raster):")
    logo_old, logo_new = convert_logos()

    old, new = img_old + logo_old, img_new + logo_new
    print(f"\nTOTAL  {old / 1048576:.2f} MB -> {new / 1048576:.2f} MB"
          f"  (saved {(old - new) / 1048576:.2f} MB)")
    print("\nNext: point data/politicians-data.json + mobile/index.html at the "
          ".webp files, then bump CACHE in mobile/sw.js.")
