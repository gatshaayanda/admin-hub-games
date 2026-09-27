# Obssidian Adventurer 32x32 — 4-Way Mini Character Pack v2.2

Native pixel-art adventurer designed to work standalone or alongside **Universal Pixel UI & HUD Pack — Godot 4 Ready**.

## Included
- Native 32x32 RGBA sprites with transparent background.
- 4 directions: South, North, East, West.
- 7 action sets / 28 directional animations.
- **128 animation frames total.**
- Actions: Idle, Walk, Idle Blink, Hurt, Crouch, Jump, Death/KO.
- **Walk is the only locomotion animation; there is no Run animation.**
- Individual PNG frames.
- One atlas + JSON per action.
- Animated GIF previews for every action.
- Godot 4 SpriteFrames, character scene and standalone demo.
- Nearest-neighbor / pixel-perfect workflow.

## Technical
- Cell: 32x32 px
- Pivot: (16, 29)
- Palette: 22 colors
- Alpha: binary transparent
- East/West identity: exact mirror-derived.

## Jump integration
Jump PNGs encode **body pose only**. Move the character/node vertically in game code. The included Godot demo demonstrates this with a short jump arc so vertical motion is not baked twice into the sprite.

## Godot
Copy `Godot4/addons/` into the root of your project.

Demo controls: Arrow keys Walk, Space Jump, B Blink, C Crouch, H Hurt, K KO/Death, R Reset.
