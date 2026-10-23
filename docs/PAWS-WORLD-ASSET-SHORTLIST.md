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

The present canvas dog is still a procedural placeholder; the next visual gate is to inspect the imported dog PNGs and archive contents, choose a consistent overhead/three-quarter view, and replace the placeholder with correctly oriented animation frames. Do not stretch a side-view dog into a top-down character. Keep the archive and licence evidence with any selected production assets.

## Immediate asset audit shortlist

1. Preview `spritesheet_black.png`, `spritesheet_brown.png`, `spritesheet_white.png` and `Dog_medium.png` to identify dimensions, frame arrangement, direction and animation states.
2. Inspect `dog.zip`, `dogcharacterbystyloo.zip` and `CatnDog.zip`; extract only candidate art plus its readme/licence into a temporary audit area first.
3. Compare the dog art against the Kenney animal pack style before mixing sprites with the existing low-poly farm GLBs.
4. Record chosen source, exact licence, attribution and converted runtime paths in this document before shipping extracted art.
5. Verify idle, walk, turn, interact and rest animations at mobile portrait and landscape sizes, then verify offline caching for the assets actually used.

## QA status

- Repository asset import: committed.
- One nameable dog: implementation checkpoint committed; verify on the deployed preview.
- True imported dog sprites / frame animation: **not yet integrated**.
- Phone-device controls, browser console, and airplane-mode/offline gameplay: **not yet physically QA-tested**.
