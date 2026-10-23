# Living World — Curated Asset Download Shortlist

**Purpose:** Build one cohesive, mobile-friendly 3D animal world for care, goat herding and wildlife exploration. This is a shortlist to download and inspect, not a statement that any external pack has been integrated.

**Art direction recommendation:** stylized, warm, grounded 3D (not voxel/pixel art). Prioritize rigged quadrupeds with authored walk/trot/run/idle/eat animations, readable silhouettes, consistent scale and compact textures. Start with one goat and one small environment set. Avoid downloading everything.

## Download first: animal candidates

### A. Low Poly Farm Animals Pack — reodesuxz (itch.io)
https://reodesuxz.itch.io/low-poly-farm-animals-pack

Advertised as a multi-animal pack with goat and farm props, formats including GLB/FBX/OBJ/Blend and permission for personal/commercial projects. This is a strong candidate to inspect first because it may provide a goat and environment pieces together. Before adopting: inspect the downloaded archive's actual licence, model rig/skeleton, animation clips, materials, polygon count, scale and file size. Do not assume that the presence of a model means it has usable locomotion animations.

### B. Low Poly Winter Farm Pack — reodesuxz (itch.io)
https://reodesuxz.itch.io/low-poly-winter-farm-pack

Advertises separate goat/farm animal, building and prop models in GLB/FBX/OBJ/Blend and permission for personal/commercial use. The winter theme is not our target art direction, but individual animals/props may be useful if they match the selected set. Check the actual licence and included files before use.

### C. Quaternius — Farm Animal Pack
https://quaternius.com/packs/farmanimal.html

Useful as a potential source for companion farm animals. The currently documented set includes cow, sheep, horse, pig, llama, pug and zebra; do **not** rely on it for a goat unless the live pack contents have changed. Check each pack's own licence and available formats. Quaternius' current general licence terms: https://quaternius.com/license.html

### D. Kenney Animal Pack Redux (2D fallback / UI illustration reference)
https://kenney.nl/assets/animal-pack-redux

CC0 2D animal artwork. Use only if we deliberately decide to build a 2D/2.5D version or need UI/illustration assets; do not mix it into the 3D world as if it were an animated 3D animal.

## Environment and world assets

### E. Kenney Nature Kit
https://kenney.nl/assets/nature-kit

CC0 nature props, including trees, rocks and foliage, in 3D formats. Good lightweight starting point, but inspect scale and visual density against the chosen animal set. These props are stylized and relatively simple; decide whether they are the final look or only distant filler before mixing them with more detailed models.

### F. Vula's existing farm asset packs — audit before downloading duplicates
https://github.com/gatshaayanda/vulas-car-wash/tree/main/game-assets/source-zips

The repository already includes:
- `kenney_tiny-farm.zip`
- `kenney_pixel-platformer-farm-expansion.zip`
- `kenney_pixel-platformer-food-expansion.zip`
- `kenney_mini-characters.zip`
- `kenney_digital-audio.zip`
- other Kenney environment/UI packs

Inspect the contents first. Pixel-art farm expansions may be useful for ideas or a deliberate 2D version, but they are not automatically compatible with the intended 3D style. Do not copy the whole racing pack or unrelated assets into the new game.

### G. Poly Haven — models, materials and HDRIs
https://polyhaven.com/
Licence: https://polyhaven.com/license

Poly Haven publishes CC0 models, PBR textures and HDRI lighting environments. Use selectively for ground/wood/stone materials and lighting, not as a substitute for the main animal character set. Choose mobile-appropriate resolutions (usually 1K/2K textures rather than 4K/8K by default).

### H. ambientCG — terrain and material textures
https://ambientcg.com/

CC0 PBR materials can provide grass/soil/rock/wood surface textures. Check each download's resolution and texture-map set. Avoid huge tiled ground textures until the performance budget is measured.

## Sound and ambience

### I. Kenney Digital Audio (already in Vula's asset ZIP library)
Start with the existing `kenney_digital-audio.zip` and inspect its contents before sourcing duplicates. It may provide generic UI/game sounds, but do not assume it includes convincing goat bleats, hoof sounds or a full outdoor ambience set.

### J. Freesound — targeted sound search
https://freesound.org/

Search for goat bleats, hoof steps on dirt, water trough, grazing, wind, birds and rural ambience. Freesound uploads have different licences; verify the licence of every individual sound before shipping. Record the source URL, creator, licence and any attribution text in the asset register. Do not treat “free download” as permission for commercial redistribution.

## Technical tools and compatibility

### K. Blender (inspect, scale and convert)
https://www.blender.org/download/

Use Blender to preview FBX/Blend/GLB models, inspect rigs and animation clips, normalize scale, reduce unnecessary geometry, and export a clean glTF/GLB where the licence permits. Keep the original source archive and licence file for provenance.

### L. Three.js glTF loader and animation docs
https://threejs.org/docs/#examples/en/loaders/GLTFLoader
https://threejs.org/manual/#animation-system

Use these as the implementation references if the renderer spike confirms a dedicated Three.js/WebGL scene. Do not replace the existing Phaser platform globally. The simulation module must remain renderer-independent.

## Asset acceptance checklist

For each downloaded pack, record:
- source URL, author/publisher, download date and exact licence file/page;
- whether commercial game use and modification are permitted;
- model format and whether it loads cleanly in Blender / GLB viewer;
- rigged or static; list the actual animation clips available;
- approximate polygon count, dimensions/scale, material and texture sizes;
- visual match with the chosen art direction;
- mobile performance impact and total download size;
- any required attribution and exact attribution text.

**Do not commit a downloaded asset until it passes the checklist.** Keep source ZIPs outside production bundles; ship only optimized, used files. Never resell or redistribute source asset packs as standalone packs.

## First download order

1. Download and inspect **Low Poly Farm Animals Pack**; confirm goat quality, rig and animation clips.
2. Inspect Vula's existing farm/food/audio ZIPs.
3. Download **Kenney Nature Kit** only if its style and scale fit the selected animal pack.
4. Add only the missing ground materials/lighting from Poly Haven or ambientCG.
5. Add animal-specific audio from Freesound only after verifying each individual licence.
6. Put provenance in `docs/LIVING-WORLD-ASSET-REGISTER.md` and build the first asset preview sheet before implementation expands.

The aim is not the largest asset library. It is the smallest consistent set that lets us build and QA a convincing living world quickly.
