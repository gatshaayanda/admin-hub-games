#!/usr/bin/env python3
"""Prepare Wardrobe generated-player artwork for Phaser.

This runs outside the game runtime. It converts the generated JPEG contact sheets
into real-alpha PNG frame atlases with fixed 256x256 frame cells.
"""

from pathlib import Path
from collections import deque
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "public/assets/wardrobe/incoming"
OUT = ROOT / "public/assets/wardrobe/generated"
COLUMNS, ROWS = 8, 4
FRAME_SIZE = 256
BACKGROUND_TOLERANCE = 42
MIN_FOREGROUND_RATIO = 0.002
MAX_FOREGROUND_RATIO = 0.82


def rgb_distance_sq(a, b):
    return sum((int(a[i]) - int(b[i])) ** 2 for i in range(3))


def background_mask(image):
    rgb = image.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    samples = []
    for x in range(0, w, 4):
        samples.extend((px[x, 0], px[x, h - 1]))
    for y in range(1, h - 1, 4):
        samples.extend((px[0, y], px[w - 1, y]))

    def is_bg(x, y):
        p = px[x, y]
        return any(rgb_distance_sq(p, s) < BACKGROUND_TOLERANCE ** 2 for s in samples)

    seen = bytearray(w * h)
    q = deque()

    def seed(x, y):
        i = y * w + x
        if seen[i] or not is_bg(x, y):
            return
        seen[i] = 1
        q.append(i)

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        i = q.popleft()
        x, y = i % w, i // w
        if x:
            seed(x - 1, y)
        if x + 1 < w:
            seed(x + 1, y)
        if y:
            seed(x, y - 1)
        if y + 1 < h:
            seed(x, y + 1)
    return seen


def extract_frame(sheet, col, row):
    w, h = sheet.size
    if w % COLUMNS or h % ROWS:
        raise RuntimeError(f"source dimensions {w}x{h} are not divisible by {COLUMNS}x{ROWS}")
    cw, ch = w // COLUMNS, h // ROWS
    cell = sheet.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch)).convert("RGBA")
    mask = background_mask(cell)
    pixels = cell.load()
    min_x, min_y, max_x, max_y = cell.width, cell.height, -1, -1
    foreground = 0

    for y in range(cell.height):
        for x in range(cell.width):
            if not mask[y * cell.width + x]:
                pixels[x, y] = (*pixels[x, y][:3], 255)
                foreground += 1
                min_x, min_y = min(min_x, x), min(min_y, y)
                max_x, max_y = max(max_x, x), max(max_y, y)
            else:
                pixels[x, y] = (*pixels[x, y][:3], 0)

    ratio = foreground / (cell.width * cell.height)
    if not (MIN_FOREGROUND_RATIO <= ratio <= MAX_FOREGROUND_RATIO):
        raise RuntimeError(
            f"frame {row * COLUMNS + col}: suspicious foreground ratio {ratio:.5f} "
            f"for source cell {cell.width}x{cell.height}"
        )
    if max_x < 0:
        raise RuntimeError(f"frame {row * COLUMNS + col}: no foreground detected")

    cropped = cell.crop((min_x, min_y, max_x + 1, max_y + 1))
    scale = min((FRAME_SIZE * 0.82) / cropped.width, (FRAME_SIZE * 0.82) / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )

    out = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    x = (FRAME_SIZE - resized.width) // 2
    y = FRAME_SIZE - resized.height
    out.alpha_composite(resized, (x, y))
    return out


def prepare(name, source_name):
    source_path = INCOMING / source_name
    if not source_path.exists():
        raise RuntimeError(f"missing source: {source_path}")
    sheet = Image.open(source_path)
    if sheet.format not in {"JPEG", "PNG", "WEBP"}:
        raise RuntimeError(f"{source_name}: unsupported format {sheet.format}")
    frames = [extract_frame(sheet, c, r) for r in range(ROWS) for c in range(COLUMNS)]

    atlas = Image.new("RGBA", (COLUMNS * FRAME_SIZE, ROWS * FRAME_SIZE), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        atlas.alpha_composite(frame, ((i % COLUMNS) * FRAME_SIZE, (i // COLUMNS) * FRAME_SIZE))

    OUT.mkdir(parents=True, exist_ok=True)
    atlas_path = OUT / f"{name}-atlas.png"
    atlas.save(atlas_path, optimize=True)
    for i, frame in enumerate(frames):
        frame.save(OUT / f"{name}-{i:02d}.png", optimize=True)

    print(f"{source_name}: {sheet.size[0]}x{sheet.size[1]} -> {len(frames)} transparent frames")
    print(f"atlas: {atlas_path}")


if __name__ == "__main__":
    prepare("player", "1.jpg")
    prepare("player-reference", "og.jpg")
