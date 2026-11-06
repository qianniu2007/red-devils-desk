"""Renders the raster favicons from the same geometry as assets/img/favicon.svg.

    python tools/make-favicons.py

Writes favicon-32.png (tabs, 32 px) and favicon-180.png (iOS home screen).
The SVG is the primary icon; these two exist only because Safari and iOS still
prefer a bitmap.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"

RED = (200, 16, 46, 255)
CREAM = (243, 238, 228, 255)
GOLD = (230, 199, 120, 255)

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\georgiab.ttf",
    r"C:\Windows\Fonts\georgia.ttf",
    r"C:\Windows\Fonts\timesbd.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_icon(size: int) -> Image.Image:
    scale = 4  # draw big, then downsample for clean edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    radius = int(s * 0.09)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=radius, fill=RED)

    inset = int(s * 0.11)
    d.rectangle(
        (inset, inset, s - inset - 1, s - inset - 1),
        outline=(243, 238, 228, 140),
        width=max(1, int(s * 0.023)),
    )

    font = load_font(int(s * 0.38))
    text = "RD"
    box = d.textbbox((0, 0), text, font=font)
    tw, th = box[2] - box[0], box[3] - box[1]
    d.text(((s - tw) / 2 - box[0], (s - th) / 2 - box[1] - s * 0.05), text, font=font, fill=CREAM)

    bar_w, bar_h = int(s * 0.30), max(1, int(s * 0.031))
    d.rectangle(
        ((s - bar_w) / 2, s * 0.735, (s + bar_w) / 2, s * 0.735 + bar_h),
        fill=GOLD,
    )

    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    for px, name in ((32, "favicon-32.png"), (180, "favicon-180.png")):
        draw_icon(px).save(OUT / name)
        print("wrote", OUT / name)
