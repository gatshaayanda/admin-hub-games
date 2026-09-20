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

The body remains a Phaser container so the whole character can face the movement/aim direction while the limbs animate independently.

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

The whole character faces the current movement/aim direction.

The facing vector is stored separately from movement so the gameplay layer can keep the character looking where the player intends to shoot.

### Fire

The marker provides:

- short recoil;
- muzzle flash;
- projectile departure.

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
