# AGENTS.md — Admin Hub Games

## 1. Project Identity

**Project:** Admin Hub Games  
**Repository:** `gatshaayanda/admin-hub-games`  
**Owner:** Ayanda Gatsha / Admin Hub  
**Role:** Reusable game foundation and studio/publisher shell for future Admin Hub games.

Admin Hub Games is the game-development arm of Admin Hub. This repository is the foundation from which future games are built. It is not itself a single game.

The project exists to make it easier to build games that are enjoyable to play, technically solid, mobile-friendly, and capable of growing into real products.

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

## 6. Current Mission

The current mission is to transform the original Mhele Phaser/Vite seed into the first **Admin Hub Games Foundation**.

The original Mhele repository remains the seed/reference project:

`gatshaayanda/mhele`

The foundation repository is:

`gatshaayanda/admin-hub-games`

Future games should normally have their own repositories and consume/copy proven foundation patterns as appropriate.

## 7. Publisher / Studio Experience

Admin Hub Games should have a recognizable publisher identity inspired by classic game-company introductions, while remaining modern and lightweight.

Default publisher sequence:

```text
ADMIN HUB

GAMES

presents...

GAME TITLE
```

The intro should be:

- brief
- memorable
- skippable where appropriate
- lightweight
- reusable
- easy to configure per game
- subordinate to the game's own identity

The first user-flow milestone is to let the user actually enter this intro in the browser and experience the transition into the game shell.

## 8. Foundation Architecture

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

### Story
- dialogue
- characters
- choices
- branching
- consequences
- endings
- quests

### Adventure
- maps
- exploration
- collision
- interaction
- inventory
- items
- puzzles
- checkpoints

### Arcade
- player movement
- enemies
- collision
- score
- timer
- levels
- difficulty
- lives
- power-ups

### Management
- money
- resources
- employees
- customers
- schedules
- upgrades
- events
- progression

### Strategy
- turns
- actions
- resources
- cards
- territory
- opponents
- victory conditions

### Simulation
- needs
- relationships
- time
- events
- decisions
- progression
- persistent state

These categories are a catalogue, not a commitment to implement all of them now.

## 9. Game Identity

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

## 10. Creative Direction

Early games may contain authentic Botswana details, settings, language, humor, environments, names, or cultural references where they improve the experience.

However:

> **Start local → make it globally understandable.**

A player should not need prior Botswana knowledge to understand the core objective or enjoy the game.

Local authenticity is an asset, not a restriction.

## 11. Mobile-First Controls

Games should be designed with mobile play in mind even when desktop keyboard controls are also supported.

Prefer a shared input layer that can eventually map:

- keyboard
- mouse
- touch
- gamepad

Do not hard-code gameplay logic directly to one input device when a small abstraction can keep the game portable.

## 12. Testing

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

## 13. Performance

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

## 14. Firebase Foundation

Firebase is part of the Admin Hub Games foundation and uses the dedicated Firebase project:

- Project ID: `admin-hub-games`
- Auth domain: `admin-hub-games.firebaseapp.com`
- Storage bucket: `admin-hub-games.firebasestorage.app`

The Firebase client is initialized through the foundation rather than being scattered across individual scenes.

Firebase capabilities such as authentication, cloud saves, leaderboards, multiplayer/backend state, persistent profiles, and analytics should be added when the relevant game experience needs them.

Do not copy Mhele's Firebase project configuration into this repository.

Firebase web configuration values are client configuration, but production secrets and server credentials must never be committed to the repository.

## 15. Environment Variables

This repository is a Vite application, not a Next.js application.

Therefore Vite client-side environment variables use the `VITE_` prefix when accessed through `import.meta.env`.

Do not introduce `NEXT_PUBLIC_` variables unless a future framework migration specifically requires them.

Local environment files containing development configuration should not be committed when they contain machine-specific values. Maintain `.env.example` as the environment contract.

## 16. Deployment

Vercel is the preferred lightweight deployment target where appropriate.

Before considering a deployment complete:

1. verify the local production build
2. verify the deployed route
3. verify there are no obvious runtime errors
4. confirm environment configuration matches the intended project

A successful deployment is not the same thing as a verified game experience.

## 17. Repository Structure

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

## 18. Mhele Relationship

Mhele is a future Admin Hub Games title and the original seed/reference for this repository.

The intended relationship is:

1. Preserve the Mhele seed.
2. Establish Admin Hub Games Foundation here.
3. Build the reusable publisher/game shell.
4. Choose and build an actual game from the foundation when ready.
5. Use real game development to discover what should become reusable.
6. Promote genuinely reusable improvements back into the foundation.
7. Repeat for future titles.

Mhele must not be used as an excuse to prematurely hard-code Mhele-specific rules into the foundation.

## 19. Current Roadmap

### Phase 0 — Seed
- Mhele Vite/Phaser/Vitest seed: complete.
- Repository clone established: complete.
- Admin Hub Games GitHub repository established: complete.

### Phase 1 — Admin Hub Games Foundation
- Firebase foundation: established.
- replace the Vite starter surface
- establish Phaser bootstrap
- establish application/game shell
- establish configurable game metadata
- establish publisher intro
- establish initial scene structure
- establish reusable UI foundation
- establish input abstraction
- establish testing conventions
- update project documentation

### Phase 2 — Core Reusable Systems
Add only systems justified by upcoming game work.

### Phase 3 — First Actual Game
Choose the first title when the foundation is ready. Mhele is not required to be first.

### Phase 4 — Foundation Refinement
Promote genuinely reusable lessons from the first game back into the foundation.

### Phase 5 — Future Games
Build additional Admin Hub Games titles using the growing foundation.

## 20. Current Working Rule

At the current stage, do **not** jump straight into building a specific game.

First make this repository feel like Admin Hub Games.

The first meaningful visible milestone is:

> Opening the project in the browser feels like entering a real game studio/publisher experience, not a Vite starter page.

The immediate user flow is:

```text
Open app
   ↓
Admin Hub Games publisher intro
   ↓
Configured game title / handoff
   ↓
Reusable game shell
```

This flow should be simple enough to play through and review before more systems are added.

## 21. Current Checkpoint

The repository has been successfully separated from the original Mhele remote and pushed to:

`gatshaayanda/admin-hub-games`

The seed has been verified with `npm install` and `npm run build`, and Vercel deployment is already working.

The current implementation checkpoint is **Phase 1 — Admin Hub Games Foundation**, moving from the Vite starter toward:

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
```

Do not rewrite the project blindly. Inspect the seed, establish the foundation deliberately, verify it, then checkpoint.
