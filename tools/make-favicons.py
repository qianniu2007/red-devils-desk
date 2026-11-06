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

RED_TOP = (255, 59, 82, 255)
RED_BOTTOM = (125, 12, 26, 255)
WHITE = (255, 255, 255, 255)

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\georgiab.ttf",
    r"C:\Windows\Fonts\georgia.ttf",
    r"C:\Windows\Fonts\timesbd.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
]


def gradient(size: int) -> Image.Image:
    """Diagonal red gradient, same stops as the SVG icon."""
    img = Image.new("RGBA", (size, size), RED_BOTTOM)
    top = RED_TOP
    bottom = RED_BOTTOM
    for y in range(size):
        for_x = y / max(size - 1, 1)
        row = tuple(int(top[i] + (bottom[i] - top[i]) * for_x) for i in range(4))
        ImageDraw.Draw(img).line([(0, y), (size, y)], fill=row)
    return img


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_icon(size: int) -> Image.Image:
    scale = 4  # draw big, then downsample for clean edges
    s = size * scale

    img = gradient(s)
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.235), fill=255)
    img.putalpha(mask)

    d = ImageDraw.Draw(img)

    font = load_font(int(s * 0.36))
    text = "MU"
    box = d.textbbox((0, 0), text, font=font)
    tw, th = box[2] - box[0], box[3] - box[1]
    d.text(((s - tw) / 2 - box[0], (s - th) / 2 - box[1] - s * 0.04), text, font=font, fill=WHITE)

    bar_w, bar_h = int(s * 0.34), max(1, int(s * 0.028))
    d.rectangle(
        ((s - bar_w) / 2, s * 0.72, (s + bar_w) / 2, s * 0.72 + bar_h),
        fill=(255, 255, 255, 155),
    )

    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    for px, name in ((32, "favicon-32.png"), (180, "favicon-180.png")):
        draw_icon(px).save(OUT / name)
        print("wrote", OUT / name)
