# Shooters Trigger — Character Template

## Purpose

Shooters Trigger characters are not meant to reuse Hall's two-pose player animation. Hall remains the movement reference for the **analog input model**, but Shooter Trigger characters use a richer character presentation built for an action game.

The current implementation is an intentionally lightweight procedural pixel-style character system. It keeps each character assembled from independently animated parts so the game can improve movement feel before committing to authored sprite sheets.

## Shared character template

Every character uses the same readable top-down structure:

- hard-edged pixel-style silhouette;
- helmet;
- paintball mask and visor;
- torso/vest;
- belt and pouches;
- backpack/equipment;
- independently animated arms;
- independently animated legs and boots;
- paintball marker;
- muzzle flash;
- team accent;
- ground shadow;
- separate nameplate.

The body remains a Phaser container with a stable ground anchor. The upper combat layers (arms, marker, recoil and muzzle flash) rotate toward aim independently; the torso/legs do not spin with the weapon. Before explicit aim input, movement supplies the default facing/shot vector, including diagonals.

## Role templates

### Player / Ayanda

Balanced baseline.

- medium silhouette;
- readable green team accent;
- normal backpack;
- responsive walk cycle;
- aim/facing is the clearest visual reference for the player.

### Operator 12

Light tactical teammate.

- slightly compact body;
- smaller equipment profile;
- quick but controlled stride;
- clean silhouette that remains readable beside the player.

### The Heavy

Heavy support teammate.

- widest silhouette;
- larger backpack;
- broader shoulders;
- slower gait amplitude/rhythm;
- visibly heavier equipment without becoming a separate character system.

### Runner

Fast opponent.

- smallest/leanest silhouette;
- reduced backpack;
- narrower limbs;
- fastest walk rhythm;
- should read as the agile opponent immediately.

### Anchor

Heavy defensive opponent.

- broad silhouette;
- larger equipment profile;
- slower, steadier movement;
- designed to visually communicate a planted defensive role.

## Animation contract

### Idle

- subtle breathing;
- tiny equipment/body motion;
- no whole-character bobbing as the only animation.

### Walk

Legs alternate independently.

Boots follow the leg stride.

Arms counter-swing.

Shoulders move subtly against the stride.

Heavy roles use a slower/reduced gait; Runner uses a quicker/lighter gait.

### Aim / facing

The feet/torso remain grounded while the combat-facing vector controls the marker and braced arms. Before explicit aim, the normalized movement vector is used so diagonal travel naturally produces diagonal firing. After explicit aim, movement and aim are independent.

### Fire

The marker provides:

- short backward recoil along its own barrel axis;
- braced two-arm connection;
- hopper/loader and air/tank detail;
- muzzle flash at the actual muzzle;
- projectile departure from the same muzzle/vector;
- a restrained fire pulse that returns to the ready pose.

Fire feedback must remain visually connected to the character rather than relying on a detached HUD marker.

### Hit

Existing hit feedback remains:

- character flash;
- paint burst;
- player hit overlay/camera reaction;
- eventual stagger treatment can be expanded without replacing the character template.

### Respawn

The existing Green Base reset remains the gameplay contract. A later pass can add an authored respawn entrance, but respawn must not require a new character architecture.

## What this deliberately does not do

Do not add:

- a character creator;
- cosmetic inventory;
- dozens of character classes;
- skeletal animation;
- a large sprite-sheet pipeline;
- online character synchronisation;
- separate art engines.

First prove that the small set of characters feels good on a Samsung phone.

## Next visual phase

After the current procedural template is accepted:

1. replace the procedural shapes with authored pixel sprite sheets while preserving the same role contract;
2. add explicit 4/8-direction frames;
3. add separate idle/walk/aim/fire/hit/respawn frames;
4. add equipment silhouettes and paint-contact effects;
5. preserve the same gameplay-facing API so art can improve without rewriting movement/combat.

## Acceptance

A character pass is accepted when:

- all five roles are visually distinguishable;
- the player can read facing direction immediately;
- walking looks like alternating movement rather than a two-frame flip;
- Heavy and Runner visibly move differently;
- arms/legs contribute to the walk;
- firing reads from the character;
- the character remains readable at phone scale;
- Hall's analog joystick remains the movement interaction reference;
- no character pass changes Hall behaviour.

## Refinement checkpoint — September 20, 2026

The first procedural character pass was too mechanical. The accepted direction is now explicitly human paintball-soldier presentation:

- The marker is carried from the chest with both hands; it must not appear attached to the helmet/head.
- The figure has readable head, torso, arms, legs and boots with a stable ground anchor.
- Walking uses alternating leg/boot placement under a planted torso. Avoid swimming, airplane, banking or whole-body rocking.
- Aim rotates the character toward the aim vector, while the carry pose remains coherent.
- Idle breathing is restrained.
- Fire recoil/muzzle feedback is short and local to the marker.
- Hall's broad, simple ground treatment is the visual reference for the grass; Shooter Trigger uses different field decoration on top of that language.

Phaser's standard path for a later authored version is directional frame animation via sprite sheets/texture atlases. The current procedural actor API should remain the stable gameplay-facing contract while the art implementation can later move to authored directional walk/idle/fire/hit frames.

## Refinement checkpoint — September 21, 2026

The player presentation was deepened from a simple procedural silhouette into a layered paintball participant. The current procedural body communicates a full-face mask/visor, protective jersey, shoulder/chest protection, pod harness, gloves, pants and boots. The marker communicates a hopper/loader, body, barrel, sight, grip, stock and air/tank detail.

The animation model is now explicitly layered:

- feet and legs remain the ground anchor;
- torso remains stable while aiming;
- arms rotate with the marker and converge on the weapon;
- movement provides the default aim vector before explicit aim;
- explicit mouse/right-drag aim overrides movement while preserving independent strafe/retreat;
- recoil shifts the marker backward along its local barrel axis;
- muzzle flash is attached to the weapon's actual muzzle;
- projectile origin uses the same muzzle location and aim vector.

This is intentionally a procedural animation rig, not a fake promise of a full sprite-sheet system. Phaser supports authored frame/atlas animation later, and the gameplay-facing character contract should remain stable when that visual upgrade arrives.

### Acceptance examples

The player must visibly and mechanically support right, left, up, down and diagonal shots. Test both diagonal movement/default aim and explicit opposite-direction aim. Fire repeatedly and confirm each shot produces marker recoil and a muzzle flash without moving the torso off its feet.
