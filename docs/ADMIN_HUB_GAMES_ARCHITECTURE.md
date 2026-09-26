# Admin Hub Games — Product Architecture

## Purpose

Admin Hub Games is a shared game platform, not one giant game.

The platform owns the common shell:

```
Admin Hub Games
    ↓
Publisher Intro
    ↓
Game Library
    ↓
selected game
    ↓
that game's Intro
    ↓
that game's Setup
    ↓
that game's Gameplay
```

After selection, the game owns its rules, state, presentation and progression.

## Golden Playthrough — Shooters Trigger

This is the protected reference implementation for the reusable shooter/action foundation:

```
Field
  ↓
Training
  ↓
Evasion
  ↓
Break
  ↓
Shooting
  ↓
Phone
  ↓
Arena
  ↓
Result
```

The protected shooter spine is:

- movement
- aim
- projectile creation
- swept projectile collision
- cover / obstacles
- head / body / scrape hit classification
- elimination
- recovery / respawn
- local player state
- mobile movement + aim/fire input

The Golden Playthrough is a **Shooters Trigger contract**, not a mandatory flow for every future game.

Unexpected changes to this path are a STOP → inspect → reconcile event.

## Engine Boundaries

Future games should reuse proven systems deliberately rather than forcing unrelated genres into one giant engine.

### Shared platform

Reusable across games when genuinely applicable:

- Publisher Intro
- Game Library
- PWA / service worker
- responsive Phaser boot
- local persistence primitives
- player identity primitives
- common audio support
- common result / progression primitives where semantics match

### Shooter / action core

Reference implementation: Shooters Trigger.

Potential consumers:

- Shooters Trigger
- Outlaw Country
- Galactic Bounty
- Last Shelter
- selected fantasy combat games

Do not extract large scene implementations merely because two scenes look similar. First isolate small pure helpers, prove them with tests, then migrate one scene at a time.

### Platformer / exploration core

Potential systems:

- platform physics
- grid / ladder movement
- traps
- collectibles
- level transitions
- pursuit AI

Potential consumer:

- Vault Runner

This is a separate engine family from the shooter core.

### Sports / fighting / physics core

Potential systems:

- ball physics
- possession
- scoring
- fighting hitboxes
- grapples / state transitions
- match rules

Potential consumers:

- Deathball
- Ring Kings
- Street Eleven

Do not make Shooters Trigger responsible for these rules.

## Game Roadmap

The roadmap is intentionally experimental. A title is not considered built until it exists as a real playable entry in the Game Library.

### 1. Outlaw Country — quick-draw prototype

Original Wild West game.

Prototype target:

- frontier / ranch home screen
- one rival gunslinger
- short quick-draw duel
- reaction / timing window
- aim + fire
- win / loss result
- simple bounty reward
- local progression

The prototype should reuse the shooter foundation where behaviour genuinely matches it, while keeping western rules and progression game-specific.

The first prototype should prove the duel feel before attempting a large western world, horse system, ranch economy or long story.

### 2. Deathball — arcade physics prototype

Prototype target:

- small arena
- player movement
- ball physics
- possession
- opponent
- goal
- short match
- result

This is a test of a new physics family, not a FIFA-scale simulation.

### 3. Dragonbound — flight prototype

Prototype target:

- one rider
- one dragon
- directional flight
- altitude / stamina
- one aerial opponent
- projectile attack
- hit / defeat / recovery

Flight gets its own movement model. Shooter projectile behaviour can be reused only where its semantics remain correct.

### 4. Starborn — original anime-inspired combat prototype

Prototype target:

- one warrior
- movement
- melee
- energy projectile
- guard / evade
- one rival
- power / transformation state

The game must use original characters, names, worldbuilding and art. It may be inspired by the broad appeal of classic transformation-based anime combat without copying protected characters or settings.

### 5. Vault Runner — platformer foundation

Prototype target:

- grid / platform movement
- ladders
- treasure
- enemy pursuit
- trap
- exit
- one compact level

This establishes the platformer engine family.

## Development Order

Do not build five games simultaneously.

The safe sequence is:

1. Protect Shooters Trigger Golden Playthrough.
2. Add small shooter-core pure helpers and real regression tests.
3. Prototype Outlaw Country's quick-draw duel.
4. Verify the western prototype without destabilising Shooters Trigger.
5. Only then decide whether the western game deserves a larger progression layer.
6. Prototype the next engine family only after its smallest playable loop is understood.

## Architecture Rule

```
Admin Hub Games shell
        ↓
Game Library
        ↓
independent game
        ↓
game-specific state / rules / rendering
```

The goal is not maximum abstraction.

The goal is:

**smallest shared foundation that makes the next real game easier without making the current games less safe.**

## Safety Rules

- Never rewrite Hall merely to add another game.
- Never revive the legacy standalone Shooters Trigger Evasion scene as a shortcut.
- Do not call a branch, preview or build a production game.
- Do not add Firebase just because a new game exists.
- Keep static game content local unless a real product requirement needs server persistence.
- Every new playable game must have its own Intro → Setup → Gameplay handoff.
- Every new-game checkpoint must verify the affected flow and confirm the existing known-good games still launch.
