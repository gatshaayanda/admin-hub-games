# Godot 4 Quick Start

Copy `Godot4/addons/` into the root of your project.

Character scene:
`res://addons/obssidian_universal_pixel_ui/bonus_characters/obssidian_adventurer/adventurer.tscn`

Animations use `<action>_<direction>`, e.g. `walk_south`, `jump_north`, `death_west`.

Looping: idle, walk. One-shot: blink, hurt, crouch, jump, death.

There is intentionally no Run animation. Jump sprites contain pose changes only; move the character node vertically in your gameplay code. See `Godot4/Standalone_Demo/demo.gd`.
