# Wardrobe Character Pipeline

This is the fast path for turning generated character artwork into a Phaser-ready
Shooter Trigger character without rewriting gameplay.

## Pipeline

```
generated artwork
  -> inspect
  -> normalise/extract
  -> manifest
  -> Wardrobe Lab
  -> acceptance matrix
  -> Shooter Trigger
```

## Current proven baseline

### 3.jpg

- 1376 × 768 source
- 8 × 4 grid
- 172 × 192 cells
- 32 body frames
- current known-good movement baseline
- four authored body directions

### 1.jpg

- 1408 × 768 source
- 8 × 4 grid
- 176 × 192 cells
- integrated character/combat artwork
- useful as a visual reference/fallback
- not a clean continuously-rotatable weapon layer

### og.jpg

- secondary directional/walking reference
- weapon/arms are baked into the character
- useful for body-direction reconstruction/reference
- not an independent combat rig

### 4.jpg candidate

The previously inspected candidate is:

- 1408 × 768 source
- 8 × 6 grid
- 176 × 128 cells
- rows 0–3: 32 body frames
- rows 4–5: 16 isolated arms/paintball-marker frames

The 16 isolated frames are **not yet assigned a semantic meaning**. Do not assume
they are 16 aim directions. They must first be inspected and labelled as
directional poses, animation phases, or another sequence.

## Structural inspection

Example for the 4.jpg candidate:

```bash
python scripts/wardrobe/inspect-generated-character.py \
  --source public/assets/wardrobe/incoming/4.jpg 8 6 176 128
```

For the current 3.jpg baseline:

```bash
python scripts/wardrobe/inspect-generated-character.py \
  --source public/assets/wardrobe/incoming/3.jpg 8 4 172 192 \
  --manifest public/assets/wardrobe/generated-v2/manifest.json
```

The inspector checks objective structure: source dimensions, grid dimensions,
frame occupancy, empty frames, visible-height spread and baseline spread.

It intentionally does **not** claim that a frame is DOWN/UP/LEFT/RIGHT or that
a weapon pose is a particular aim sector. Those are visual-semantic decisions.

## Runtime contract

A future character should resolve to:

```
Character
├── BODY
├── ARMS
├── WEAPON
└── MUZZLE
```

when—and only when—the artwork really supports those independent layers.

The gameplay API remains stable:

- movement vector is continuous;
- aim vector is continuous;
- visual aim can use authored discrete sectors;
- body remains grounded and movement-facing;
- weapon follows its grip/pivot;
- muzzle is the authoritative visible firing point;
- projectile origin is derived from that muzzle;
- recoil follows the weapon's local barrel axis.

## Why discrete aim sectors are preferred for generated pixel art

Phaser can rotate sprites and Containers, and it supports configurable sprite
origins. That is a transform capability, not a guarantee that the source pixels
will look correct under arbitrary rotation.

For pixel-art characters, authored directional aim frames usually preserve
hands, weapon, silhouette and pixel readability better than continuously rotating
a single raster layer.

Therefore:

- if a generated sheet contains authored aim sectors, use them as sectors;
- if it contains one genuinely neutral weapon layer designed to rotate, rotation
  is acceptable;
- if the weapon is baked into a full character frame, keep it integrated or
  generate a proper independent layer;
- never make arbitrary rotation the default fix for missing artwork.

## Acceptance gate

A candidate is ready for Shooter Trigger only after Wardrobe verifies:

1. DOWN / UP / LEFT / RIGHT movement;
2. diagonal movement;
3. stable feet/grounding;
4. stationary cardinal and diagonal aim;
5. movement and aim can disagree;
6. body does not rotate with aim;
7. hands remain connected to the weapon;
8. visible muzzle and projectile origin agree;
9. repeated fire and recoil remain coherent;
10. no duplicate body, extra arm, floating gun or spinning silhouette;
11. touch movement, drag-to-aim and hold-fire work on phone;
12. Arena reference behaviour remains unchanged.

If a candidate fails, change the artwork contract or character adapter first.
Do not change Arena combat to make the generated artwork appear correct.

## Future-character rule

A new character should normally require:

- new asset files;
- one manifest;
- one character definition/configuration.

It should **not** require a new combat system, new projectile rules, new hit
logic, or a bespoke Phaser scene.

The Wardrobe Lab is the gatekeeper. Shooter Trigger receives only a character
that has already passed the visual/mechanical contract.
