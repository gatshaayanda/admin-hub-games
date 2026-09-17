# AGENTS.md — Admin Hub Games

## Identity

**Project:** Admin Hub Games  
**Repository:** `gatshaayanda/admin-hub-games`  
**Owner:** Ayanda Gatsha / Admin Hub  
**Role:** reusable game foundation and studio/publisher shell for future Admin Hub games.

Admin Hub Games is not one designated game. It is the foundation from which future games are built. Mhele is a future title/reference, not the foundation's first-game requirement.

## Source of Truth & Workflow

- GitHub is the source of truth.
- Local development: VS Code + Git Bash.
- Do not use PowerShell for the normal workflow.
- Workflow: **START → BUILD → VERIFY → CHECKPOINT → CONTINUE / RECOVER**.
- Inspect before changing. Prefer coherent full-file changes over blind patches.
- For visual checkpoints, push to GitHub and review the live Vercel deployment. Localhost is for development/debugging.

## Technology Baseline

- Vite + TypeScript
- Phaser
- Vitest
- Firebase
- Node.js
- Git / GitHub
- Vercel
- Browser-first, PWA/mobile-capable

Keep the foundation lightweight. Do not build a custom engine before real games justify it.

## Foundation Order

```text
Admin Hub Games
        ↓
Firebase foundation
        ↓
Phaser foundation
        ↓
Publisher intro
        ↓
Reusable game shell
        ↓
Actual games
        ↓
Foundation refinement from real use
```

The rule is: **make games, not infrastructure for infrastructure's sake.**

## Publisher / World Experience

The publisher intro is a recurring opening cinematic. It runs from the beginning every time the app/game is opened or the publisher entry scene is started. It is not a one-time onboarding screen.

The opening contract is:

```text
quiet / dark opening
      ↓
world fades in and settles
      ↓
player character walks into the scene
      ↓
character arrives and pauses
      ↓
ADMIN HUB GAMES
presents
      ↓
publisher identity holds clearly and deliberately
      ↓
identity fades away
      ↓
name entry
      ↓
actual game takes over
```

**Publisher timing is part of the product identity. Do not rush it.** The laptop and phone must experience the same deliberate sequence. Timing must not depend on viewport dimensions, pointer events, keyboard events, or incidental interaction. The publisher reveal should not be accidentally skipped by a click used to open/focus the app.

The intended publisher treatment is prominent but restrained: **ADMIN HUB GAMES appears once, clearly, then gets out of the way and lets the game happen.** It is not a permanent website header and it is not a disposable tiny label.

The character is the player's entry point. The intro should feel like the beginning of a game, not a website splash screen. There is no player-facing “THE WORLD” title screen.

The visual language established here is a warm, chunky 2D/top-down pixel-game style with a specific Botswana-inspired sense of place: warm sky, dry grass, red earth, simple compound/studio architecture, utility tank, scrub and acacia-like trees. It should feel authentic and specific rather than a generic “African” art direction.

Creative principle:

> **Start local → make it globally understandable.**

The same hero/world language used for the intro should be reusable by the actual game rather than treated as disposable intro art.

## Current Intro Checkpoint

`PublisherIntroScene` now:

- fades into a living game scene
- animates the player character entering from outside the world
- uses fixed cinematic timing independent of viewport size
- pauses after the character arrives
- presents a large, centered `ADMIN HUB GAMES` / `presents` publisher beat
- holds the publisher identity long enough to register on laptop and phone
- does not let incidental keyboard/pointer input skip the opening
- transitions into the reusable name-entry handoff
- places a smaller Admin Hub Games identity on an in-world sign/environmental landmark

`NameEntryScene` now:

- asks the player what to call them
- accepts keyboard text input
- stores the chosen name in Phaser's shared registry as `playerName`
- hands control to `GameShellScene`

The next game-specific chat should continue from this entry point rather than replacing the publisher opening with another abstract foundation screen.

## Game Architecture

Keep the conceptual separation:

```text
PLAYER INPUT
      ↓
GAME RULES / STATE
      ↓
PHASER RENDERS STATE
```

Reusable foundation systems should be added when justified by actual games:

- scene management
- input abstraction
- game state
- save/load
- settings
- audio
- pause/menus/HUD
- responsive layout
- touch/gamepad controls
- accessibility
- analytics where justified

Eventual shared-world systems may include avatar state, movement, collision, interactables, locations, environmental storytelling, discovery/progression, notebook/Gamebook and ambience.

Do not prematurely implement the entire world. Grow it through a tiny playable vertical slice and real games.

## Firebase

Firebase is part of the foundation and is initialized centrally.

Dedicated project:

- Project ID: `admin-hub-games`
- Auth domain: `admin-hub-games.firebaseapp.com`
- Storage bucket: `admin-hub-games.firebasestorage.app`

Do not copy another game's Firebase project configuration into this repository.

Client configuration is not a secret; server credentials and production secrets must never be committed.

## Web / PWA Foundation

The app is browser-first and intended to support installable/mobile use.

`index.html` owns the application metadata, theme color, description, title and manifest link. The repository includes an Admin Hub Games favicon and web manifest. Verify that static metadata assets are actually served by Vite/Vercel rather than assuming repository-root files are public assets.

Keep Vite environment variables under the `VITE_` prefix.

## Testing & Verification

Vitest is the baseline for deterministic logic. Visual/gameplay behavior is verified in a browser.

Before a meaningful checkpoint:

1. run tests
2. run the production build
3. inspect runtime behavior
4. push to GitHub
5. verify the Vercel deployment

A successful build/deployment is not itself proof that the game experience is correct.

## Creative Direction

Admin Hub Games can contain Botswana details, names, environments, humor, language and everyday references where they improve the experience, while keeping the core experience understandable internationally.

Do not let publisher branding overwhelm the game. The player should feel they have entered a place and can play, not that they are viewing an Admin Hub website. The publisher identity gets one clear opening moment, then yields to the world.

Future game influences can include exploration, management, arcade, strategy, simulation, puzzle and story experiences. These are creative directions, not a requirement to implement all of them in the foundation.

## Current Status

Phase 1 — Admin Hub Games Foundation: **ready for game development handoff**.

```text
Admin Hub Games
        ↓
Firebase foundation       ✓
        ↓
Phaser foundation         ✓
        ↓
Recurring publisher intro ✓
        ↓
Name-entry handoff        ✓
        ↓
Reusable game shell       ✓ baseline
        ↓
Actual game               → next product work
```

The next work should build the actual game/world from this entry point. Do not redesign the foundation merely because the first game has not yet been selected.
