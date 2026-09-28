#!/usr/bin/env python3
"""Build-time conversion of Wardrobe generated contact sheets into real-alpha Phaser assets."""
from collections import Counter, deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "public/assets/wardrobe/incoming"
OUT = ROOT / "public/assets/wardrobe/generated"
COLUMNS, ROWS, FRAME_SIZE = 8, 4, 256
TOLERANCE_SQ = 42 ** 2
MAX_FOREGROUND_RATIO = 0.82

def dist(a, b):
    return sum((a[i] - b[i]) ** 2 for i in range(3))

def background_mask(image):
    rgb = image.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    border = []
    for x in range(0, w, 4):
        border += [px[x, 0], px[x, h - 1]]
    for y in range(0, h, 4):
        border += [px[0, y], px[w - 1, y]]
    # Quantize the border into a small palette: enough for a baked checkerboard
    # or a flat matte, without the previous O(pixels x samples) scan.
    buckets = Counter((p[0] // 8, p[1] // 8, p[2] // 8) for p in border)
    palette = [((r * 8 + 4, g * 8 + 4, b * 8 + 4)) for (r, g, b), _ in buckets.most_common(6)]

    def is_bg(x, y):
        p = px[x, y]
        return any(dist(p, s) <= TOLERANCE_SQ for s in palette)

    seen = bytearray(w * h)
    q = deque()

    def seed(x, y):
        i = y * w + x
        if not seen[i] and is_bg(x, y):
            seen[i] = 1
            q.append(i)

    for x in range(w):
        seed(x, 0); seed(x, h - 1)
    for y in range(h):
        seed(0, y); seed(w - 1, y)

    while q:
        i = q.popleft()
        x, y = i % w, i // w
        if x: seed(x - 1, y)
        if x + 1 < w: seed(x + 1, y)
        if y: seed(x, y - 1)
        if y + 1 < h: seed(x, y + 1)
    return seen

def extract(sheet, index):
    sw, sh = sheet.size
    if sw % COLUMNS or sh % ROWS:
        raise RuntimeError(f"source {sw}x{sh} is not an 8x4 contact sheet")
    cw, ch = sw // COLUMNS, sh // ROWS
    col, row = index % COLUMNS, index // COLUMNS
    cell = sheet.crop((col*cw, row*ch, (col+1)*cw, (row+1)*ch)).convert("RGBA")
    mask = background_mask(cell)
    px = cell.load()
    xs, ys, xe, ye, fg = cell.width, cell.height, -1, -1, 0
    for y in range(cell.height):
        for x in range(cell.width):
            if mask[y*cell.width+x]:
                px[x, y] = (*px[x, y][:3], 0)
            else:
                px[x, y] = (*px[x, y][:3], 255)
                fg += 1; xs=min(xs,x); ys=min(ys,y); xe=max(xe,x); ye=max(ye,y)
    ratio = fg / (cell.width * cell.height)
    if fg == 0 or ratio > MAX_FOREGROUND_RATIO:
        raise RuntimeError(f"frame {index}: bad foreground ratio {ratio:.3f} in {cw}x{ch} cell")
    crop = cell.crop((xs, ys, xe+1, ye+1))
    scale = min((FRAME_SIZE*.82)/crop.width, (FRAME_SIZE*.82)/crop.height)
    crop = crop.resize((max(1,round(crop.width*scale)), max(1,round(crop.height*scale))), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0,0,0,0))
    out.alpha_composite(crop, ((FRAME_SIZE-crop.width)//2, FRAME_SIZE-crop.height))
    return out

def prepare(name, source):
    path = INCOMING / source
    sheet = Image.open(path)
    print(f"{source}: {sheet.size[0]}x{sheet.size[1]}")
    frames = [extract(sheet, i) for i in range(COLUMNS*ROWS)]
    OUT.mkdir(parents=True, exist_ok=True)
    atlas = Image.new("RGBA", (COLUMNS*FRAME_SIZE, ROWS*FRAME_SIZE), (0,0,0,0))
    for i, frame in enumerate(frames):
        atlas.alpha_composite(frame, ((i%COLUMNS)*FRAME_SIZE, (i//COLUMNS)*FRAME_SIZE))
        frame.save(OUT / f"{name}-{i:02d}.png", optimize=True)
    atlas.save(OUT / f"{name}-atlas.png", optimize=True)
    print(f"wrote {name}: 32 transparent PNG frames + atlas")

prepare("player", "1.jpg")
prepare("player-reference", "og.jpg")
