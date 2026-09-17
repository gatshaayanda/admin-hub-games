# AGENTS.md — Admin Hub Games

## 1. Project Identity

**Project:** Admin Hub Games  
**Repository:** `gatshaayanda/admin-hub-games`  
**Owner:** Ayanda Gatsha / Admin Hub  
**Role:** Reusable game foundation and studio/publisher shell for future Admin Hub games.

Admin Hub Games is the game-development arm of Admin Hub. This repository is the foundation from which future games are built. It is not itself a single game.

The long-term creative direction is for Admin Hub Games to have a small, playable world that can become the front door to the studio's games: a place the player can enter, explore, discover ideas, and eventually encounter finished games. The foundation must support that direction without prematurely building the whole world.

## 2. Source of Truth

- GitHub is the source of truth.
- Local development uses VS Code + Git Bash.
- Do not use PowerShell for the normal development workflow.
- Changes should be made deliberately, verified locally, then committed and pushed.
- Avoid blind patches. Inspect the current implementation before changing architecture.

## 3. Development Workflow

Use this workflow for meaningful changes:

**START → BUILD → VERIFY → CHECKPOINT → CONTINUE / RECOVER**

### START
- Read this file.
- Inspect the current repository state.
- Confirm the current branch and working tree.
- Understand the relevant existing code before editing.

### BUILD
- Make the smallest coherent change that advances the product.
- Prefer simple reusable systems over speculative frameworks.
- Preserve working infrastructure unless there is a concrete reason to change it.

### VERIFY
- Run the relevant tests.
- Run the production build.
- Run the app locally when visual/gameplay behavior matters.
- Check browser console errors and obvious runtime failures.

### CHECKPOINT
- Review the diff.
- Confirm the repository is still coherent.
- Commit with a clear message.
- Push to GitHub when the checkpoint is ready.

### CONTINUE / RECOVER
- Continue only from a verified checkpoint.
- If the result is unexpected, stop and inspect rather than stacking another patch on top.

For visual checkpoints, the preferred review path is the live Vercel deployment after GitHub push. Localhost remains a development/debugging tool, not the required review surface.

## 4. Technology Baseline

The foundation uses:

- Vite
- TypeScript
- Phaser
- Vitest
- Firebase
- Node.js
- Git / GitHub
- VS Code + Git Bash
- Vercel where deployment is appropriate

The project should remain compatible with a lightweight, low-cost development model.

The browser is the primary runtime. The architecture should support PWA/mobile use and leave room for future Android / Google Play distribution without requiring that infrastructure immediately.

## 5. Foundation Principle

> **Make games, not infrastructure for infrastructure's sake.**

A reusable system belongs in the foundation when a real game experience proves that it should be reused.

Do not build a giant custom game engine before the games require one.

The foundation is built in this order:

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

There is **no designated first game at the foundation stage**. Mhele is a future game and may be built from the foundation when ready; it should not dictate the foundation prematurely.

## 6. Publisher / World Experience

Admin Hub Games should have a recognizable publisher identity inspired by classic game-company introductions, while remaining modern and lightweight.

The intro is a **character entering the actual game world**, not a corporate title card and not a separate “THE WORLD” title screen.

Current intended experience:

```text
black / quiet opening
      ↓
small living game scene appears
      ↓
player character enters the scene
      ↓
brief Admin Hub Games identity appears naturally
      ↓
character arrives
      ↓
player takes control
```

The intro should:

- be brief
- be memorable
- feel like a game opening
- use the same visual language as the game that follows
- avoid developer-facing language
- avoid “THE WORLD” as a player-facing title
- be skippable
- be lightweight
- hand directly into player control

The player should not be shown messages such as “reusable game shell ready” or other development-status copy.

The eventual world should be built as a small vertical slice first, not as a giant map.

## 7. Foundation Architecture

The first foundation milestone establishes a clean application/game shell rather than a giant engine.

Current foundation areas:

- Firebase initialization foundation
- Phaser bootstrap
- application/game shell
- configurable game metadata
- publisher intro scene
- initial scene structure
- reusable UI foundation as needed
- input abstraction as gameplay requires it
- testing setup
- documentation

Potential reusable systems, to be added only when justified by real game needs:

### Shared
- bootstrap
- scene management
- game state
- save/load
- settings
- audio
- pause
- menus
- HUD
- responsive layout
- keyboard controls
- touch controls
- gamepad support
- accessibility helpers
- analytics where justified

### Eventual World
- player/avatar state
- top-down or slightly angled movement
- collision and boundaries
- interactable objects
- locations/areas
- environmental storytelling
- discovery/progression
- notebook or Gamebook for discovered ideas
- gentle ambience/audio
- save state

The world systems should be introduced through a tiny playable slice: **intro → world → avatar → walk → find one thing → interact**.

These categories are a catalogue, not a commitment to implement all of them now.

## 8. Game Identity

Every game should feel like a game, not like a technology demo.

The foundation should handle common mechanics while allowing each game to have its own:

- title
- visual identity
- story
- characters
- rules
- pacing
- sound
- progression
- controls
- audience

Do not let the Admin Hub Games branding overwhelm the actual game.

## 9. Creative Direction

The eventual Admin Hub Games world can contain authentic Botswana details, settings, language, humor, environments, names, or cultural references where they improve the experience.

However:

> **Start local → make it globally understandable.**

A player should not need prior Botswana knowledge to understand the core objective or enjoy the game.

Local authenticity is an asset, not a restriction.

The current visual foundation uses a warm, chunky top-down pixel-game language with Botswana-inspired environmental cues such as dry grass, warm earth, low compounds, simple buildings, and indigenous-looking trees. It should feel like a specific place, not a generic “African” art direction.

## 10. Mobile-First Controls

Games should be designed with mobile play in mind even when desktop keyboard controls are also supported.

Prefer a shared input layer that can eventually map:

- keyboard
- mouse
- touch
- gamepad

Do not hard-code gameplay logic directly to one input device when a small abstraction can keep the game portable.

## 11. Testing

Vitest is part of the baseline.

Test deterministic logic rather than trying to test every visual frame.

Good candidates include:

- game rules
- state transitions
- scoring
- inventory calculations
- progression
- save/load serialization
- dialogue branching
- configuration validation
- utility functions

Visual/gameplay verification should happen by running the game in a browser.

## 12. Performance

The foundation should remain lightweight.

Avoid unnecessary dependencies and large assets.

Prefer:

- small bundles
- lazy loading where useful
- efficient game loops
- simple state management
- optimized assets
- browser-native capabilities where practical

Do not add a service merely because a future game might need it.

## 13. Firebase Foundation

Firebase is part of the Admin Hub Games foundation and uses the dedicated Firebase project:

- Project ID: `admin-hub-games`
- Auth domain: `admin-hub-games.firebaseapp.com`
- Storage bucket: `admin-hub-games.firebasestorage.app`

The Firebase client is initialized through the foundation rather than being scattered across individual scenes.

Firebase capabilities such as authentication, cloud saves, leaderboards, multiplayer/backend state, persistent profiles, and analytics should be added when the relevant game experience needs them.

Do not copy Mhele's Firebase project configuration into this repository.

Firebase web configuration values are client configuration, but production secrets and server credentials must never be committed to the repository.

## 14. Environment Variables

This repository is a Vite application, not a Next.js application.

Therefore Vite client-side environment variables use the `VITE_` prefix when accessed through `import.meta.env`.

Do not introduce `NEXT_PUBLIC_` variables unless a future framework migration specifically requires them.

Local environment files containing development configuration should not be committed when they contain machine-specific values. Maintain `.env.example` as the environment contract.

## 15. Deployment

Vercel is the preferred lightweight deployment target where appropriate.

Before considering a deployment complete:

1. verify the local production build
2. verify the deployed route
3. verify there are no obvious runtime errors
4. confirm environment configuration matches the intended project

A successful deployment is not the same thing as a verified game experience.

## 16. Repository Structure

The structure should evolve with the foundation. Avoid creating empty directories simply to represent future architecture.

Current direction:

```text
src/
  main.ts
  firebase/
  game/
  scenes/
  ui/
  systems/
  input/
  tests/
```

Only introduce a directory when it has an actual purpose.

## 17. Mhele Relationship

Mhele is a future Admin Hub Games title and the original seed/reference for this repository.

The intended relationship is:

1. Preserve the Mhele seed.
2. Establish Admin Hub Games Foundation here.
3. Build the reusable publisher/game shell.
4. Build the small Admin Hub Games world slice when the shell is ready.
5. Choose and build an actual game when ready.
6. Use real game development to discover what should become reusable.
7. Promote genuinely reusable improvements back into the foundation.
8. Repeat for future titles.

Mhele must not be used as an excuse to prematurely hard-code Mhele-specific rules into the foundation.

## 18. Current Roadmap

### Phase 0 — Seed
- Mhele Vite/Phaser/Vitest seed: complete.
- Repository clone established: complete.
- Admin Hub Games GitHub repository established: complete.

### Phase 1 — Admin Hub Games Foundation
- Firebase foundation: established.
- replace the Vite starter surface: complete.
- establish Phaser bootstrap: complete.
- establish application/game shell: complete enough for first playable world entry.
- establish configurable game metadata: established.
- establish publisher intro: world-entry version established.
- establish initial scene structure: established.
- establish reusable UI foundation: as needed.
- establish input abstraction: as gameplay requires it.
- establish testing conventions: baseline established.

### Phase 2 — Small World Slice
Build only enough of the eventual world to validate the experience:

```text
Intro
  ↓
World
  ↓
Avatar
  ↓
Walk
  ↓
Look around
  ↓
Find one thing
  ↓
Interact
```

The first checkpoint is intentionally small: a character enters a recognizable, cohesive world and then becomes directly controllable. This is the start of the actual world, not a mock shell screen.

### Phase 3 — First Actual Game
Choose the first title when the foundation/world entry experience is ready. Mhele is not required to be first.

### Phase 4 — Foundation Refinement
Promote genuinely reusable lessons from actual game development back into the foundation.

### Phase 5 — Future Games
Build additional Admin Hub Games titles using the growing foundation.

## 19. Current Working Rule

At the current stage, do **not** jump straight into building a specific game.

First make this repository feel like Admin Hub Games.

The first meaningful visible milestone is:

> Opening the project in the browser feels like entering a real game, published by Admin Hub Games, rather than entering a developer dashboard or Vite starter page.

The immediate review flow is:

```text
Open app
   ↓
character enters the Admin Hub Games environment
   ↓
brief publisher identity
   ↓
character arrives
   ↓
player control begins
```

The next product milestone is to expand this same playable environment, not replace it with another abstract foundation screen.

## 20. Current Checkpoint

The repository has been successfully separated from the original Mhele remote and pushed to:

`gatshaayanda/admin-hub-games`

The seed has been verified with `npm install` and `npm run build`, and Vercel deployment is already working.

The current implementation checkpoint is **Phase 1 — Admin Hub Games Foundation**, moving into the first playable world entry:

```text
Admin Hub Games
        ↓
Firebase foundation
        ↓
Phaser foundation
        ↓
Character-entry intro
        ↓
Controllable world
        ↓
Small playable world slice
```

Do not rewrite the project blindly. Inspect the seed, establish the foundation deliberately, verify it, then checkpoint.
