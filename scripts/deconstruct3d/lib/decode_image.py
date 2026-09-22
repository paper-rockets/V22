"""Decodes an image file to a raw RGBA8 buffer for the deconstructor.

Usage: python decode_image.py <input> <output.rgba> <max_size>
Prints "<width> <height>" on stdout.
"""
import sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

src, dst, max_size = sys.argv[1], sys.argv[2], int(sys.argv[3])
img = Image.open(src)
img = img.convert("RGBA")
if max_size > 0 and max(img.size) > max_size:
    scale = max_size / max(img.size)
    # LANCZOS keeps small painted details (panel lines, eyes) from smearing.
    img = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)
with open(dst, "wb") as f:
    f.write(img.tobytes())
print(f"{img.width} {img.height}")
