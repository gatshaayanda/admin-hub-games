# Shooters Trigger — Mobile Controls, Character Animation & Phase E

## Authoritative control direction

Shooters Trigger now uses **Hall's analog movement model**.

The left side is a fixed analog joystick with:
- a generous touch region;
- a centered knob;
- a dead zone;
- normalized X/Y vector output;
- pointer capture;
- reset on pointer release/cancel.

The right side is a **fixed FIRE button**.

Mobile combat is therefore:

**MOVE with the left analog stick → tap the arena to aim → hold FIRE to shoot → release either control independently.**

This is intentionally simpler than a full twin-stick shooter. The player is not required to drag a second virtual stick around the screen just to keep a firing angle.

## Why this is the current V1 model

The Hall control was already proven in the shared game platform. Reusing its analog interaction removes an unnecessary new control language.

Phaser's input system supports unified mouse/touch events and multiple active pointers, allowing the movement pointer and FIRE pointer to remain independent. https://docs.phaser.io/phaser/concepts/input

Current mobile-shooter usability research also supports broad left-side movement input, right-side action input and keeping the number of simultaneous actions manageable. https://www.gamedeveloper.com/design/a-guide-to-ios-twin-stick-shooter-usability

Rockstar's Red Dead Redemption mobile controls are useful as a HUD reference because the controls are treated as explicit touch buttons with deliberate size, position and opacity rather than as invisible desktop-mouse replacements. https://support.rockstargames.com/articles/CwtYAazPxaxyxtxy868jO/changing-touch-controls-layout-for-red-dead-redemption-on-android-and-ios

## Phase A — Foundation cleanup

Implemented in this checkpoint:
- stale D-pad code removed;
- obsolete Phaser-rendered mobile button graphics removed;
- game-specific mobile controls moved into a dedicated module;
- stale `updateUiPositions()`/resize dependency removed and replaced by a real responsive HUD layout path;
- Hall remains untouched.

## Phase B — Arena composition

The opening view is deliberately readable:
- vertically split green grass tones;
- white field boundaries;
- dark `GREEN BASE` / training banner;
- radar in the upper-right;
- tree near the team;
- grey platform immediately to the team's right;
- secondary wooden/concrete cover deeper in the field;
- small white field markers;
- orange team starts farther away.

The arena remains larger than the phone viewport so the player can move into pressure and discover additional cover, but the first camera view is composed as a small training vignette rather than a giant empty field.

## Phase C — Character presentation

Actors are built from small, aligned procedural pixel-style parts so the presentation stays lightweight while still reading as authored arcade characters.

The character system now separates:
- legs/boots;
- torso/vest;
- arms;
- helmet/mask/visor;
- backpack;
- paintball marker;
- muzzle flash.

Animation includes:
- idle breathing;
- alternating walk movement;
- role-specific rhythm;
- directional facing;
- marker/arm movement;
- fire recoil;
- muzzle flash;
- hit flash;
- paint contact burst;
- respawn entrance.

The Heavy and Anchor are intentionally broader and slower. Operator and Runner use a lighter/faster silhouette.

This is the intermediate Phase C solution. A true authored sprite-sheet pipeline is still a later visual phase, not a prerequisite for testing combat feel.

## Phase D — Mobile controls

The game-specific DOM control layer has:
- Hall-style analog movement on the left;
- fixed FIRE button on the right;
- visible pressed state;
- large touch targets;
- separate pointer capture for movement and firing;
- safe-area spacing;
- portrait/landscape responsive sizing.

Canvas taps in the playable area set aim.

The camera/world does not move the controls.

## Phase E — Game feel

The current local training loop now tunes the actual gameplay experience rather than only the control plumbing:

**move → aim → fire → hit feedback → cover → enemy pressure → respawn → continue.**

Specific Phase E behaviour:
- movement remains analog on mobile;
- desktop keeps WASD + pointer/Space;
- player and AI use the same paintball projectile system;
- cover blocks movement and paintballs;
- projectiles travel visibly;
- firing has recoil/muzzle feedback;
- hits produce paint bursts;
- player hits briefly flash/shake the screen and return the player to Green Base;
- teammates follow and contribute fire;
- Runner advances while Anchor pressures from a held lane;
- five team points ends the short training match.

## Acceptance

This branch is ready for the next real device test, not a claim of final release quality.

On Samsung Android test:
1. enter Shooter Trigger;
2. enter player name;
3. reach Team Training;
4. hold the left analog stick and move;
5. tap the arena to change aim;
6. hold FIRE with the other thumb;
7. release movement while continuing FIRE, then release FIRE;
8. use cover;
9. get hit;
10. confirm fast respawn at Green Base;
11. play until a five-point result;
12. repeat in portrait and landscape;
13. after an online launch/update, disable the network and confirm the training loop still loads.

## Later visual phase

After phone combat is accepted:
- authored pixel sprite sheets;
- true directional frame sets;
- stronger impact/paint splat effects;
- cover interaction poses;
- optional B2B cosmetic variants.

Do not create multiplayer, matchmaking, complex inventory or large character customisation before the Phase E phone feel is accepted.

## References

- Phaser Input: https://docs.phaser.io/phaser/concepts/input
- Phaser Pointer API: https://docs.phaser.io/api-documentation/class/input-pointer
- Rockstar Red Dead Redemption mobile touch controls: https://support.rockstargames.com/articles/CwtYAazPxaxyxtxy868jO/changing-touch-controls-layout-for-red-dead-redemption-on-android-and-ios
- Twin-stick shooter usability: https://www.gamedeveloper.com/design/a-guide-to-ios-twin-stick-shooter-usability
