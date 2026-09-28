#!/usr/bin/env python3
"""Build-time conversion of Wardrobe generated contact sheets into real-alpha Phaser assets."""
from collections import Counter
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "public/assets/wardrobe/incoming"
OUT = ROOT / "public/assets/wardrobe/generated"
COLUMNS, ROWS, FRAME_SIZE = 8, 4, 256
TOLERANCE_SQ = 38 ** 2
MAX_FOREGROUND_RATIO = 0.88

def dist(a, b):
    return sum((a[i] - b[i]) ** 2 for i in range(3))

def background_palette(image):
    rgb = image.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    samples = []
    for x in range(0, w, 2):
        samples += [px[x, 0], px[x, h - 1]]
    for y in range(0, h, 2):
        samples += [px[0, y], px[w - 1, y]]
    buckets = Counter((p[0] // 8, p[1] // 8, p[2] // 8) for p in samples)
    return [(r * 8 + 4, g * 8 + 4, b * 8 + 4) for (r, g, b), _ in buckets.most_common(4)]

def extract(sheet, index):
    sw, sh = sheet.size
    if sw % COLUMNS or sh % ROWS:
        raise RuntimeError(f"source {sw}x{sh} is not an 8x4 contact sheet")
    cw, ch = sw // COLUMNS, sh // ROWS
    col, row = index % COLUMNS, index // COLUMNS
    cell = sheet.crop((col*cw, row*ch, (col+1)*cw, (row+1)*ch)).convert("RGBA")
    palette = background_palette(cell)
    px = cell.load()
    xs, ys, xe, ye, fg = cell.width, cell.height, -1, -1, 0

    for y in range(cell.height):
        for x in range(cell.width):
            rgb = px[x, y][:3]
            is_background = any(dist(rgb, sample) <= TOLERANCE_SQ for sample in palette)
            if is_background:
                px[x, y] = (*rgb, 0)
            else:
                px[x, y] = (*rgb, 255)
                fg += 1
                xs, ys = min(xs, x), min(ys, y)
                xe, ye = max(xe, x), max(ye, y)

    ratio = fg / (cell.width * cell.height)
    if fg == 0 or ratio > MAX_FOREGROUND_RATIO:
        raise RuntimeError(
            f"frame {index}: background separation failed; foreground ratio {ratio:.3f} "
            f"in {cw}x{ch} cell"
        )

    crop = cell.crop((xs, ys, xe + 1, ye + 1))
    scale = min((FRAME_SIZE * .82) / crop.width, (FRAME_SIZE * .82) / crop.height)
    crop = crop.resize(
        (max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
        Image.Resampling.LANCZOS,
    )
    out = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    out.alpha_composite(crop, ((FRAME_SIZE - crop.width)//2, FRAME_SIZE - crop.height))
    return out

def prepare(name, source):
    path = INCOMING / source
    sheet = Image.open(path).convert("RGB")
    print(f"{source}: {sheet.size[0]}x{sheet.size[1]}")
    frames = [extract(sheet, i) for i in range(COLUMNS * ROWS)]
    OUT.mkdir(parents=True, exist_ok=True)
    atlas = Image.new("RGBA", (COLUMNS * FRAME_SIZE, ROWS * FRAME_SIZE), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        atlas.alpha_composite(frame, ((i % COLUMNS) * FRAME_SIZE, (i // COLUMNS) * FRAME_SIZE))
        frame.save(OUT / f"{name}-{i:02d}.png", optimize=True)
    atlas.save(OUT / f"{name}-atlas.png", optimize=True)
    print(f"wrote {name}: 32 transparent PNG frames + atlas")

prepare("player", "1.jpg")
prepare("player-reference", "og.jpg")
