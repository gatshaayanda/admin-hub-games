# 4.jpg Cell-by-Cell Audit

Source inspected: archived 4.jpg at commit 9a1973c5977dc4a68fabd549f02f56a0dd902701.

## Geometry

- 1408 × 768
- 8 columns × 6 rows
- 176 × 128 per cell
- 48 cells total

## Body cells

| Cells | Interpretation |
|---|---|
| 0–3 | DOWN/front walking sequence A |
| 4–7 | UP/back walking sequence A |
| 8–15 | RIGHT walking sequence, 8 authored frames |
| 16–19 | DOWN/front walking sequence B |
| 20–23 | UP/back walking sequence B |
| 24–31 | LEFT walking sequence, 8 authored frames |

Therefore the body is not four simple rows of one direction each. The front/back groups are split across rows 0 and 2.

Runtime groups:

- DOWN = 0,1,2,3,16,17,18,19
- UP = 4,5,6,7,20,21,22,23
- RIGHT = 8–15
- LEFT = 24–31

## Combat cells

The bottom two rows contain isolated arms + paintball-marker artwork. They are visually separate from the body.

| Frame | Observed barrel presentation |
|---:|---|
| 32 | approximately DOWN |
| 33 | approximately DOWN-RIGHT |
| 34 | approximately UP-RIGHT |
| 35 | approximately RIGHT |
| 36 | approximately RIGHT |
| 37 | approximately UP-RIGHT |
| 38 | approximately UP |
| 39 | approximately UP-LEFT |
| 40 | approximately DOWN-LEFT |
| 41 | approximately LEFT |
| 42 | approximately DOWN-LEFT |
| 43 | approximately LEFT |
| 44 | approximately LEFT |
| 45 | approximately DOWN-LEFT |
| 46 | approximately LEFT |
| 47 | approximately DOWN-LEFT |

## Exact conclusion

The lower 16 are NOT a 16-sector aim atlas.

They contain repeated barrel directions and do not progress monotonically around the aim circle. They also do not expose a verified common grip/muzzle pivot.

Therefore:

BODY = production candidate

LOWER 16 COMBAT POSES = audit/reference only

Phaser can technically rotate a Sprite or Container, but rotation capability does not manufacture a correct pixel-art pivot or correct hand/weapon relationship. The Phaser texture system supports adding indexed frames to a source image, while Containers propagate transforms to children. Those are useful for the eventual rig once the artwork supplies the required semantic anchors.

## What Wardrobe now does

1. Loads the exact 4.jpg source.
2. Registers all 48 mixed-layout frames explicitly.
3. Uses the manifest body groups for DOWN/UP/LEFT/RIGHT.
4. Keeps the body grounded using alpha-derived visible bounds.
5. Displays the lower 16 combat cells in a dedicated audit panel.
6. Does not invent weapon rotation, grip coordinates or muzzle coordinates.
7. Does not fire projectiles from 4.jpg until those anchors exist.

This is the deliberate stopping point for this asset. The next generated combat sheet can become runtime-ready by supplying named aim sectors plus grip/muzzle anchors instead of forcing Phaser to guess them.
