# Wardrobe Generated Shooter Trigger Player — Gemini Artwork Brief

Use the attached repository source images as references:
- `public/assets/wardrobe/incoming/1.jpg` — primary character identity/action reference.
- `public/assets/wardrobe/incoming/og.jpg` — secondary directional/walking reference for the same character.

These are ONE character, not two production characters.

## Non-negotiable target

Create artwork that Phaser 4 can assemble as:

Character container
- BODY
- ARMS
- WEAPON
- MUZZLE

Do NOT create another finished character with the gun permanently attached.

The existing Shooter Trigger Arena system is the mechanical source of truth and will continue controlling:
- movement and speed;
- movement-based body facing;
- idle/walk timing;
- independent aim vector;
- arms/weapon rotation;
- muzzle position;
- projectile origin;
- firing;
- desktop controls;
- mobile shooter controls.

The body must NEVER rotate toward the weapon.

## BODY

Produce clean transparent body artwork with the arms and gun removed.

Required genuine directional coverage:
- DOWN
- UP
- LEFT
- RIGHT
- DOWN-RIGHT
- UP-RIGHT

The most important missing artwork is genuine:
- UP walking;
- DOWN walking;
- LEFT walking.

Do not turn the right-facing RUN sequence into fake UP or DOWN walking.
Do not silently substitute mirrored artwork for a missing front/back direction.
Mirroring may be used only where it is genuinely safe for horizontal symmetry.

Preserve exactly:
- character identity;
- clothing;
- colours;
- proportions;
- silhouette;
- visual style.

Use 1.jpg as the primary identity source. Use og.jpg only to reconstruct missing directional/body information for that same identity.

Every body frame must have:
- transparent background;
- identical frame dimensions;
- stable visible height;
- stable feet/ground baseline;
- stable horizontal placement;
- consistent proportions.

Provide genuine idle and walking coverage for every required direction. Do not reduce a missing walking direction to a single fake pose.

## ARMS

Provide separate transparent arms/forearms artwork.

Arms must be independently positionable and rotatable by Phaser from the aim vector.

Do not bake arms into body frames.

## WEAPON

Provide separate transparent weapon artwork.

It must be independently rotatable by Phaser from the aim vector.

Do not attach it to the body.

## MUZZLE

Provide a separate muzzle/firing-point relationship.

If muzzle flash artwork is supplied, keep it separate from body and weapon.

## Reference findings — do not ignore

1.jpg is an 8x4 / 32-cell source. It contains useful:
- DOWN/front;
- DOWN-RIGHT;
- RIGHT;
- UP-RIGHT;
- four right-facing RUN frames;
- LEFT;
- alternate DOWN/LEFT;
- aim/ready/shoot/recoil/muzzle;
- hit/headshot;
- death;
- dodge;
- respawn.

It does NOT contain a genuine complete four-direction walking set. In particular there is no dedicated pure-UP, pure-DOWN or pure-LEFT walk sequence.

og.jpg provides broader directional/walking reference, but its arms/weapon are baked into the artwork.

Before final output, explicitly identify:
1. which requested frames/components are directly present in 1.jpg;
2. which are supported by og.jpg;
3. which are reconstructed;
4. which use safe mirroring.

Do not silently invent or redesign anything.

## Phaser assembly target

PHASER
|
+-- CHARACTER BODY
|   +-- DOWN
|   +-- UP
|   +-- LEFT
|   +-- RIGHT
|   +-- DOWN-RIGHT
|   +-- UP-RIGHT
|
+-- AIM SYSTEM
    +-- ARMS
    +-- WEAPON
    +-- MUZZLE
            |
         PROJECTILE

The existing Arena geometric fighter remains the mechanical/reference comparison. Do not change Shooter Trigger combat, collision, projectile, AI, movement or controls to accommodate this artwork.

## Preferred deliverables

Separate transparent PNG frames or a transparent atlas plus a clear manifest for:

body/down/
body/up/
body/left/
body/right/
body/down-right/
body/up-right/
arms/
weapon/
muzzle/

No JPEG checkerboard, white/grey matte, source-cell rectangle, halo or baked background.

## Acceptance

The artwork must be suitable for Wardrobe to verify:
- DOWN, UP, LEFT, RIGHT and diagonal movement;
- idle and walking;
- stable grounding;
- movement-based horizontal facing;
- independent aim;
- arms alignment;
- weapon alignment;
- muzzle alignment;
- projectile origin relationship;
- body remaining unrotated while aim changes;
- desktop controls;
- mobile movement + drag-to-aim/hold-fire.

Do not add a second body.
Do not bake the gun into the body.
Do not bake the arms into the body.
Do not create a new character design.
