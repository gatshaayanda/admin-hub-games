# AGENTS.md — Admin Hub Games

## 1. Project Identity

**Project:** Admin Hub Games
**Repository:** `gatshaayanda/admin-hub-games`
**Owner:** Ayanda Gatsha / Admin Hub
**Role:** Reusable game foundation and studio/publisher shell for future Admin Hub games.

Admin Hub Games is the game-development arm of Admin Hub. This repository is not Mhele itself. It is the foundation from which Mhele and future games can be built.

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

The foundation currently uses:

- Vite
- TypeScript
- Phaser
- Vitest
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

The foundation should grow through actual games:

1. Build the foundation.
2. Build Mhele.
3. Notice what was genuinely reusable.
4. Improve the foundation.
5. Build the next game.
6. Repeat.

## 6. Current Mission

The current mission is to transform the original Mhele Phaser/Vite seed into the first **Admin Hub Games Foundation**.

The original Mhele repository remains the seed/reference project:

`gatshaayanda/mhele`

The foundation repository is:

`gatshaayanda/admin-hub-games`

Mhele should not be built directly inside this foundation repository unless the project structure explicitly calls for it. Future games should normally have their own repositories and consume/copy the proven foundation patterns as appropriate.

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

The foundation should make this a reusable experience rather than hard-coding it into one game.

## 8. Foundation Architecture

The first foundation milestone should establish a clean application/game shell rather than a giant engine.

Expected areas include:

- Phaser bootstrap
- application/game shell
- configurable game metadata
- scene structure
- publisher intro
- reusable UI foundation
- input abstraction
- pause/menu foundations where justified
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

## 14. Firebase / Backend Policy

Firebase is available for the Admin Hub Games ecosystem, but it is **not required by the foundation**.

Firebase should be introduced when a real game requires features such as:

- authentication
- cloud saves
- leaderboards
- multiplayer/backend state
- persistent player profiles
- analytics that cannot be handled locally

The foundation must remain usable without Firebase.

Firebase project for this foundation:

- Project ID: `admin-hub-games`
- Auth domain: `admin-hub-games.firebaseapp.com`
- Storage bucket: `admin-hub-games.firebasestorage.app`

Do not copy Mhele's Firebase project configuration into this repository.

## 15. Environment Variables

This repository is a Vite application, not a Next.js application.

Therefore Vite client-side environment variables should use the `VITE_` prefix when accessed through `import.meta.env`.

Do not introduce `NEXT_PUBLIC_` variables unless a future framework migration specifically requires them.

Local environment files containing development configuration should not be committed when they contain machine-specific values. Maintain a safe `.env.example` when environment documentation is useful.

Firebase web configuration values are client configuration, but production secrets and server credentials must never be committed to the repository.

## 16. Deployment

Vercel is the preferred lightweight deployment target where appropriate.

Before considering a deployment complete:

1. verify the local production build
2. verify the deployed route
3. verify there are no obvious runtime errors
4. confirm environment configuration matches the intended project

Do not confuse a successful deployment with a verified game experience.

## 17. Repository Structure

The structure should evolve with the foundation. Avoid creating empty directories simply to represent future architecture.

A likely direction is:

```text
src/
  main.ts
  app/
  game/
  scenes/
  systems/
  ui/
  input/
  config/
  tests/
```

Only introduce a directory when it has an actual purpose.

## 18. Mhele Relationship

Mhele is Game #1 in the Admin Hub Games journey.

The original `mhele` repository is preserved as the seed/reference.

The intended sequence is:

1. Preserve the Mhele seed.
2. Establish Admin Hub Games Foundation here.
3. Build the reusable publisher/game shell.
4. Create Mhele from the proven foundation.
5. Build and play-test Mhele.
6. Extract only genuinely reusable improvements.
7. Use those improvements for future games.

Mhele should improve because of the foundation, and the foundation should improve because of Mhele.

## 19. Current Roadmap

### Phase 0 — Seed
- Mhele Vite/Phaser/Vitest seed: complete.
- Repository clone established: complete.
- Admin Hub Games GitHub repository established: complete.

### Phase 1 — Admin Hub Games Foundation
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

### Phase 3 — Mhele
Build the first actual game using the foundation.

### Phase 4 — Foundation Refinement
Promote genuinely reusable lessons from Mhele back into the foundation.

### Phase 5 — Future Games
Build additional Admin Hub Games titles using the growing foundation.

## 20. Current Working Rule

At the current stage, do **not** jump straight into building all of Mhele.

First make this repository feel like Admin Hub Games.

The first meaningful visible milestone should be:

> Opening the project in the browser feels like entering a real game studio/publisher experience, not a Vite starter page.

Then we build the systems needed to make the first real game efficiently.

## 21. Current Checkpoint

The repository has been successfully separated from the original Mhele remote and pushed to:

`gatshaayanda/admin-hub-games`

Current seed commits remain intentionally intact:

- `c01b357` — `chore: add Phaser and Vitest`
- `ca0d26a` — `chore: initialize Mhele Phaser project`

The next implementation checkpoint is **Phase 1 — Admin Hub Games Foundation**.

Do not rewrite the project blindly. Inspect the seed, establish the foundation deliberately, verify it, then checkpoint.
