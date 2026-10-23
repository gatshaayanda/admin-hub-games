# Paws World — imported asset inventory and next art gate

## What has landed in the repository

The downloaded source pack collection is committed under `public/assets/imported-packs/` so it is available with the repository and can be audited without another manual upload.

- **96 files, approximately 71.0 MB** at the current inventory checkpoint.
- 61 ZIP archives, 13 RAR archives, 1 7z archive, 19 PNG images, 1 DOCX guide and 1 PDF licence document.
- Dog-focused candidates include `CatnDog.zip`, `dog.zip`, `dogcharacterbystyloo.zip`, `Dog_medium.png`, `spritesheet_black.png`, `spritesheet_brown.png` and `spritesheet_white.png`.
- General animal packs include `kenney_animal-pack-remastered.zip` and `kenney_animalPackRedux.zip`.
- Existing environment assets remain under `public/assets/living-world/` and include the farm props and GLB models already referenced by the project.

**Important:** the imported archives are source material, not runtime-ready assets. The contents, animation frame layouts, view angles, licences and attribution requirements have not yet all been audited. Do not wire an uninspected archive into gameplay or claim its characters are animated just because a pack filename suggests it.

## Current playable direction

Paws World is now being simplified to **one player-named dog**. The player should be able to name their companion, explore the farm, care for them, move around on touch or keyboard, and work sheep/goats toward the pen. Wildlife can react to the dog, and the dog should show a little life even while idle.

The brown CC0 dog spritesheet is now integrated at `/assets/paws-world/dog-brown.png`. It renders animated idle, walking/stalking, and herding movement cycles, with a procedural fallback if the image fails to load. The row mapping is a practical interpretation of the sheet and still needs owner visual QA. Remaining imported archives are still source material: audit their contents and licences before integrating additional assets.

## Immediate asset audit shortlist

1. Preview `spritesheet_black.png`, `spritesheet_brown.png`, `spritesheet_white.png` and `Dog_medium.png` to identify dimensions, frame arrangement, direction and animation states.
2. Inspect `dog.zip`, `dogcharacterbystyloo.zip` and `CatnDog.zip`; extract only candidate art plus its readme/licence into a temporary audit area first.
3. Compare the dog art against the Kenney animal pack style before mixing sprites with the existing low-poly farm GLBs.
4. Record chosen source, exact licence, attribution and converted runtime paths in this document before shipping extracted art.
5. Verify idle, walk, turn, interact and rest animations at mobile portrait and landscape sizes, then verify offline caching for the assets actually used.

## Uploaded PNG visual audit (2026-10-23)

All 19 PNG entries in `public/assets/imported-packs/` were visually previewed. This is a visual suitability audit, not a full archive/licence audit.

- `spritesheet_brown.png`, `spritesheet_brown (1).png`, `spritesheet_black.png`, and `spritesheet_white.png`: compact six-column dog sprite sheets; brown is the chosen runtime sprite. The duplicated brown file is identical content.
- `Dog_medium.png`: side-facing dog animation sheet. It does not match the current overhead/three-quarter view, so it is not stretched or substituted.
- `WtbGHg.png`, `1DNf6A.png`, `2P2L_A.png`, `atcbw+.png`, and `be6RCX.png`: complete pixel-art map/world compositions, not isolated production-ready terrain tiles. Their palette and layouts differ from the current hand-built farm scene; do not use them as a scaled background without checking source/licence and tile resolution.
- `AnimationSheet.png`: small humanoid/character animation sheet, not a dog.
- `IsometricTRPGAssetPack_Entities.png`, `IsometricTRPGAssetPack_OutlinedEntities.png`, `IsometricTRPGAssetPack_MapIndicators.png`, `IsometricTRPGAssetPack_UI.png`, and `Isometric_MedievalFantasy_Tiles.png`: isometric fantasy/game UI assets, stylistically incompatible with the current top-down farm scene without a deliberate renderer/art-direction change.
- `endangered_animals_ilaria_lazzartotto.png`: side-view endangered wildlife sprites, not suitable substitutes for the overhead flock and companion.
- `assets_dungeon.png` and `desert-ruins.png`: dungeon/desert props unrelated to the farm setting.
- `1DNf6A.png`, `2P2L_A.png`, `WtbGHg.png`, `atcbw+.png`, and `be6RCX.png` are best retained as visual references until their originating packs/licences and reusable source layers are confirmed.

The ZIP/RAR/7z archives are still **not fully extracted or binary-audited** in this checkpoint. Their internal file lists, licences and attribution must be checked before integrating further assets. The production art improvement currently verified in source is the brown dog sprite; the rest of the farm and flock still use the existing canvas renderer. Do not describe the entire environment as asset-overhauled yet.

## Selected dog sprite — integrated

The production companion now uses the brown 96×80 pixel-art dog sheet from the imported pack, served as `/assets/paws-world/dog-brown.png`. The source sheet is six 16×16 frames across and five rows high; the renderer uses row 0 for idle, row 1 for walking/stalking, and row 2 for faster herding movement. It mirrors the sheet when the dog moves left. A two-frame idle variation and six-frame movement cycles are used. This frame-row mapping is a practical interpretation of the supplied sheet and needs owner visual QA; the source listing documents idle, walk, run, jump, fall and attack animations but does not publish a detailed row map.

- Source: Jason of GDN, [Dog Spritesheets on OpenGameArt](https://opengameart.org/content/dog-spritesheets)
- Licence: CC0, confirmed on the source page.
- Selected file: `spritesheet_brown.png` (96×80, 6×5 cells at 16×16 pixels).
- Runtime fallback: the existing canvas-drawn companion remains if the sprite fails to load.
- Other uploaded archives remain unintegrated until their contents and licences are individually checked.

## Mobile HUD checkpoint

The Paws World overlay now uses a responsive action grid with reserved space for the movement pad, viewport-safe-area padding, readable type scaling, keyboard focus states, a short-landscape layout, and additional vertical separation between the name row and status cards on small portrait screens. The world renderer and simulation are intentionally unchanged by this layout pass. The source archives still require a binary-level audit before any dog sprite can be selected safely; filenames alone do not establish frame layout, viewpoint or licence.

## QA status

- Repository asset import: committed.
- One nameable dog: implementation checkpoint committed; verify on the deployed preview.
- Imported dog sprite / frame animation: integrated; visual interpretation still needs owner QA.
- Phone-device controls, browser console, and airplane-mode/offline gameplay: **not yet physically QA-tested**.
