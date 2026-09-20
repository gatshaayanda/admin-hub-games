# Shooters Trigger — Mobile Controls & Character Animation Direction

## Why the control model changed

The first phone pass used a dynamic drag-anywhere movement/aim model. It worked technically, but it did not feel like a deliberate game control scheme.

The new mobile foundation uses **fixed, pressable controls plus contextual aiming**:

- **Left D-pad:** hold one of eight directions to move.
- **Right FIRE button:** press/hold to fire the current aim direction.
- **Field tap:** tap the arena to change the player's aim direction.
- **Simultaneous input:** the movement pointer and fire pointer are independent.
- **Aim persists:** the player does not have to keep a thumb on the arena after choosing a direction.
- **Desktop remains:** WASD + mouse/Space continue to work.

This is intentionally closer to the control language of a mobile game with a persistent action layout than to a mouse-control surface.

Rockstar's current Red Dead Redemption mobile support exposes editable touch-control presets, including position, size and opacity changes. The lesson for Shooters Trigger is not to copy its 3D controls; it is to treat touch controls as a real HUD layer that is deliberately placed, pressable and configurable rather than as invisible mouse emulation.

## Mobile acceptance target

A Samsung Android player should be able to:

1. Hold a direction on the left D-pad.
2. Tap somewhere in the field to face that direction.
3. Hold FIRE with the other thumb.
4. Continue moving while firing.
5. Release either control independently.
6. Tap a different point in the field to change aim.
7. Use cover without losing control of movement or firing.

The arena must remain readable behind the controls. Controls are intentionally translucent and screen-fixed while the camera follows the player.

## Character animation phase

### Phase 1 — implemented

- Fictional suited paintball player silhouette.
- Helmet/cap.
- Paintball mask/goggles.
- Protective vest.
- Trousers and boots.
- Team-colour accents.
- Role silhouette differences.
- Aim-facing rotation.
- Idle breathing/bob.
- Movement bob/scale rhythm.
- Hit flash and player hit reaction.
- Paintball muzzle/projectile feedback.

### Phase 2 — next

Build a proper small sprite/animation system without introducing a heavy asset pipeline prematurely:

- 4-direction or 8-direction movement poses.
- Idle, walk and run states.
- Separate arm/weapon pose for aiming.
- Distinct Heavy walk cycle.
- Operator/Runner faster movement cycle.
- Hit/stagger pose.
- Respawn entrance pose.
- Short fire/recoil pose.
- Team-colour variants from the same base sprite construction.

### Phase 3 — later

Only after the phone combat loop feels good:

- Proper authored pixel-art sprite sheets.
- Directional animation frames.
- Equipment silhouettes that communicate role without becoming inventory simulation.
- Paint splatter/contact effects.
- Cover interaction poses.
- Better animation transitions.
- Optional cosmetic character packs for B2B/operator branding.

## Product boundary

Do not turn this into a character-customisation or inventory project yet. Characters exist to make movement, teamwork, pressure and tactical choices readable.

The priority remains:

**move → cover → aim → fire → react → reposition → support team → get tagged → reset → try a different route.**

## Verification

The product owner must test this pass on the Samsung Android phone, because desktop emulation cannot establish whether the control hit areas and thumb reach feel correct on the actual device.

Test both:
- portrait;
- landscape;
- two-finger simultaneous movement + fire;
- aim tap followed by movement;
- hit → respawn;
- offline after the PWA has installed the new cache.

## Research references

- Phaser input/multi-touch: https://docs.phaser.io/phaser/concepts/input
- Phaser Pointer API: https://docs.phaser.io/api-documentation/class/input-pointer
- Apple touch-game design guidance: https://developer.apple.com/videos/play/wwdc2024/10085/
- Apple 2026 touch guidance: https://developer.apple.com/videos/play/wwdc2026/358/
- Rockstar Red Dead Redemption mobile touch layout support: https://support.rockstargames.com/articles/CwtYAazPxaxyxtxtxtxtxt
