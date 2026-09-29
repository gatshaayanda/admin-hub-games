from pathlib import Path
from PIL import Image
import json

SOURCE = Path("public/assets/wardrobe/incoming/2.jpg")
OUT = Path("public/assets/wardrobe/generated-v2")
CELL_W, CELL_H = 176, 192
COLS, ROWS = 8, 4

# The Gemini sheet is a fixed 8x4 contact sheet at 1408x768 (176x192 cells).
# The production step deliberately converts the JPG's baked checkerboard into real alpha.
BODY_CELLS = list(range(16)) + [16, 17, 18, 19, 24, 25, 26, 27]
REGIONS = {
    "arms": (4 * CELL_W, 2 * CELL_H, 6 * CELL_W, 3 * CELL_H),
    "weapon": (6 * CELL_W, 2 * CELL_H, 8 * CELL_W, 3 * CELL_H),
    "muzzle": (4 * CELL_W, 3 * CELL_H, 8 * CELL_W, 4 * CELL_H),
}

def foreground_mask(im):
    rgb = im.convert("RGB")
    px = rgb.load()
    mask = Image.new("1", rgb.size, 0)
    out = mask.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            c = px[x, y]
            # Gemini's baked checkerboard is pale and nearly neutral. Keep
            # saturated/dark artwork and discard pale neutral source pixels.
            neutral = max(c) - min(c) < 52
            pale = min(c) > 108
            if not (neutral and pale):
                out[x, y] = 1
    return mask

def largest_central_component(mask):
    w, h = mask.size
    src = mask.load()
    seen = bytearray(w * h)
    components = []
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if seen[idx] or not src[x, y]:
                continue
            q = [(x, y)]
            seen[idx] = 1
            pts = []
            touches_edge = False
            while q:
                cx, cy = q.pop()
                pts.append((cx, cy))
                if cx == 0 or cy == 0 or cx == w - 1 or cy == h - 1:
                    touches_edge = True
                for nx, ny in ((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        ni = ny * w + nx
                        if not seen[ni] and src[nx, ny]:
                            seen[ni] = 1
                            q.append((nx, ny))
            if len(pts) >= 12:
                xs = [p[0] for p in pts]
                ys = [p[1] for p in pts]
                bbox = (min(xs), min(ys), max(xs)+1, max(ys)+1)
                cx = (bbox[0] + bbox[2]) / 2
                cy = (bbox[1] + bbox[3]) / 2
                central = 0.22 * w < cx < 0.78 * w and cy > 0.20 * h
                components.append((len(pts), central, touches_edge, pts, bbox))
    candidates = [c for c in components if c[1] and not c[2]]
    if not candidates:
        candidates = [c for c in components if not c[2]]
    if not candidates:
        return Image.new("L", (w, h), 0), (0, 0, w, h)
    chosen = max(candidates, key=lambda c: c[0])
    alpha = Image.new("L", (w, h), 0)
    ap = alpha.load()
    for x, y in chosen[3]:
        ap[x, y] = 255
    return alpha, chosen[4]

def clean_cell(sheet, index):
    x = (index % COLS) * CELL_W
    y = (index // COLS) * CELL_H
    cell = sheet.crop((x, y, x + CELL_W, y + CELL_H)).convert("RGB")
    alpha, bbox = largest_central_component(foreground_mask(cell))
    rgba = cell.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba

def crop_region(sheet, box):
    region = sheet.crop(box).convert("RGB")
    alpha = foreground_mask(region)
    # Remove label/grid components by retaining components that do not touch
    # the region border and are below the top label band.
    clean, bbox = largest_central_component(alpha)
    rgba = region.convert("RGBA")
    rgba.putalpha(clean)
    if bbox != (0, 0, region.width, region.height):
        rgba = rgba.crop(bbox)
    return rgba

def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing source: {SOURCE}")
    sheet = Image.open(SOURCE).convert("RGB")
    if sheet.size != (COLS * CELL_W, ROWS * CELL_H):
        raise SystemExit(f"Unexpected Gemini sheet size {sheet.size}; expected {(COLS*CELL_W, ROWS*CELL_H)}")

    OUT.mkdir(parents=True, exist_ok=True)

    atlas = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    for i in BODY_CELLS:
        frame = clean_cell(sheet, i)
        x = (i % COLS) * CELL_W
        y = (i // COLS) * CELL_H
        atlas.alpha_composite(frame, (x, y))
    atlas.save(OUT / "player-body-atlas.png", optimize=True)

    # These are intentionally separate layers: Phaser can rotate them with
    # the independent aim vector instead of baking weapon direction into body.
    for name, box in REGIONS.items():
        layer = crop_region(sheet, box)
        layer.save(OUT / f"player-{name}.png", optimize=True)

    weapon_path = OUT / "player-weapon.png"
    muzzle_path = OUT / "player-muzzle.png"
    with Image.open(weapon_path) as weapon_image:
        weapon_w, weapon_h = weapon_image.size
    with Image.open(muzzle_path) as muzzle_image:
        muzzle_w, muzzle_h = muzzle_image.size

    # Attachment geometry is expressed in source pixels, not Phaser display pixels.
    # The grip calibration is the point where the extracted artwork meets the
    # authored hand; the muzzle is the forward edge of the weapon on that same
    # centerline. Runtime Phaser code derives scale/rotation from these values.
    grip_x = round(weapon_w * 0.22, 2)
    grip_y = round(weapon_h * 0.52, 2)
    muzzle_x = float(weapon_w)
    muzzle_y = grip_y

    manifest = {
        "source": "public/assets/wardrobe/incoming/2.jpg",
        "grid": {"columns": COLS, "rows": ROWS, "cellWidth": CELL_W, "cellHeight": CELL_H},
        "bodyCells": BODY_CELLS,
        "layers": {k: f"player-{k}.png" for k in REGIONS},
        "rig": {
            "body": {
                "armsAnchor": {"x": -7, "y": -40, "units": "bodyScale"},
                "weaponGripAnchor": {"x": 7, "y": -37, "units": "bodyScale"}
            },
            "weapon": {
                "sourceWidth": weapon_w,
                "sourceHeight": weapon_h,
                "displayWidth": 50,
                "grip": {"x": grip_x, "y": grip_y, "units": "sourcePixels"},
                "muzzle": {"x": muzzle_x, "y": muzzle_y, "units": "sourcePixels"}
            },
            "muzzleLayer": {
                "sourceWidth": muzzle_w,
                "sourceHeight": muzzle_h,
                "origin": {"x": 0, "y": 0.5}
            }
        },
        "note": "Generated production candidate. Rig attachment geometry is stored in source pixels so Phaser can derive the display transform without hardcoded weapon offsets."
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
