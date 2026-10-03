#!/usr/bin/env python3
"""Structural inspection gate for Wardrobe generated character sheets.

This tool deliberately does NOT decide whether a frame is semantically
DOWN/UP/LEFT/RIGHT or whether an isolated layer looks good. It reports
objective structure so Phaser code is never written against guessed dimensions.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from statistics import mean, pstdev

from PIL import Image


def bbox_from_alpha(frame: Image.Image):
    alpha = frame.getchannel("A")
    return alpha.getbbox()


def inspect_sheet(path: Path, columns: int, rows: int, cell_width: int, cell_height: int):
    im = Image.open(path)
    expected = (columns * cell_width, rows * cell_height)
    result = {
        "path": str(path),
        "format": im.format,
        "mode": im.mode,
        "size": list(im.size),
        "expectedSize": list(expected),
        "sizePass": im.size == expected,
        "grid": {
            "columns": columns,
            "rows": rows,
            "cellWidth": cell_width,
            "cellHeight": cell_height,
        },
        "frames": [],
    }

    if im.size != expected:
        return result

    rgba = im.convert("RGBA")
    for index in range(columns * rows):
        x = (index % columns) * cell_width
        y = (index // columns) * cell_height
        frame = rgba.crop((x, y, x + cell_width, y + cell_height))
        bbox = bbox_from_alpha(frame)
        if bbox:
            left, top, right, bottom = bbox
            visible_width = right - left
            visible_height = bottom - top
            baseline = bottom
        else:
            visible_width = visible_height = baseline = 0

        result["frames"].append({
            "index": index,
            "empty": bbox is None,
            "bbox": list(bbox) if bbox else None,
            "visibleWidth": visible_width,
            "visibleHeight": visible_height,
            "baseline": baseline,
        })

    occupied = [f for f in result["frames"] if not f["empty"]]
    heights = [f["visibleHeight"] for f in occupied]
    baselines = [f["baseline"] for f in occupied]
    result["summary"] = {
        "frameCount": len(result["frames"]),
        "nonEmptyFrames": len(occupied),
        "emptyFrames": len(result["frames"]) - len(occupied),
        "visibleHeight": {
            "min": min(heights) if heights else 0,
            "max": max(heights) if heights else 0,
            "mean": round(mean(heights), 2) if heights else 0,
            "pstdev": round(pstdev(heights), 2) if len(heights) > 1 else 0,
        },
        "baseline": {
            "min": min(baselines) if baselines else 0,
            "max": max(baselines) if baselines else 0,
            "mean": round(mean(baselines), 2) if baselines else 0,
            "pstdev": round(pstdev(baselines), 2) if len(baselines) > 1 else 0,
        },
        "alpha": im.mode in ("RGBA", "LA", "PA"),
    }
    return result


def inspect_manifest(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    combat = data.get("combat") or {}
    poses = combat.get("poses") or {}
    failures = []
    frame_w = int(combat.get("frameWidth", 0) or 0)
    frame_h = int(combat.get("frameHeight", 0) or 0)
    for name, pose in poses.items():
        frame = pose.get("frame")
        muzzle = pose.get("muzzle") or {}
        if not isinstance(frame, int) or frame < 0:
            failures.append(f"combat pose {name}: invalid frame")
        if not (0 <= float(muzzle.get("x", -1)) <= frame_w and 0 <= float(muzzle.get("y", -1)) <= frame_h):
            failures.append(f"combat pose {name}: muzzle outside frame")
    sectors = combat.get("aimSectors") or []
    if len(sectors) < 5:
        failures.append("combat contract: fewer than five visual aim sectors")
    return {
        "path": str(path),
        "grid": data.get("grid"),
        "bodyCells": len(data.get("bodyCells", [])),
        "layers": data.get("layers"),
        "combat": combat,
        "rig": data.get("rig"),
        "combatContractFailures": failures,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", action="append", nargs=5, metavar=("PATH", "COLS", "ROWS", "CELL_W", "CELL_H"))
    parser.add_argument("--manifest")
    args = parser.parse_args()

    if not args.source and not args.manifest:
        parser.error("provide --source PATH COLS ROWS CELL_W CELL_H and/or --manifest PATH")

    report = {}
    if args.source:
        report["sheets"] = [
            inspect_sheet(Path(path), int(cols), int(rows), int(cell_w), int(cell_h))
            for path, cols, rows, cell_w, cell_h in args.source
        ]
    if args.manifest:
        report["manifest"] = inspect_manifest(Path(args.manifest))

    print(json.dumps(report, indent=2))

    failures = []
    for sheet in report.get("sheets", []):
        if not sheet["sizePass"]:
            failures.append(f"{sheet['path']}: source dimensions do not match declared grid")
        summary = sheet.get("summary")
        if summary and summary["nonEmptyFrames"] == 0:
            failures.append(f"{sheet['path']}: all frames are empty")
    for failure in report.get("manifest", {}).get("combatContractFailures", []):
        failures.append(f"manifest: {failure}")

    if failures:
        print("\nFAIL")
        for failure in failures:
            print(f" - {failure}")
        raise SystemExit(1)

    print("\nSTRUCTURE PASS")
    print("Semantic direction/aim mapping still requires human visual inspection.")
    

if __name__ == "__main__":
    main()
