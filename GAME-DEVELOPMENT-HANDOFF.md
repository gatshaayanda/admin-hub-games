# Admin Hub Games — Game Development Handoff

**Inspection date:** 2026-09-17  
**Repository:** `gatshaayanda/admin-hub-games`  
**Default branch:** `main`  
**Purpose:** hand this foundation to the next development conversation so game work can continue without rebuilding the setup.

## 1. Current state

The Admin Hub Games foundation is established and the project is ready to move into actual game/world development.

The foundation is intentionally **not tied to a first game**. Mhele is a future title/reference only.

Current stack:

- Vite 8
- TypeScript 6
- Phaser 4
- Vitest
- Firebase 12
- Vercel deployment target
- Browser-first / PWA-capable architecture
- 960 × 540 Phaser base canvas with `Phaser.Scale.FIT`

## 2. Opening user flow

Every normal application launch begins here:

```text
OPEN LINK / APP
      ↓
BootScene
      ↓
PublisherIntroScene
      ↓
living world fades in
      ↓
player character walks into the scene
      ↓
character arrives and pauses
      ↓
ADMIN HUB GAMES
presents
      ↓
publisher identity holds clearly
      ↓
publisher identity fades away
      ↓
NameEntryScene
      ↓
player enters name
      ↓
GameShellScene
```

This opening is a recurring publisher cinematic. It is **not one-time onboarding**.

## 3. Publisher intro contract

The publisher identity is a product requirement:

> **ADMIN HUB GAMES appears once, clearly, then gets out of the way and lets the game happen.**

The intro should feel like a real game opening, not a website splash screen.

Current implementation deliberately uses fixed timing so laptop and phone do not get different cinematic pacing from viewport dimensions or accidental input.

Current approximate sequence:

- dark/world fade: 1.0s
- character entrance: 4.2s
- arrival pause: 0.7s
- publisher reveal: 0.85s
- publisher identity hold: 3.4s
- publisher fade: 1.0s
- transition: 0.7s

The intro no longer installs keyboard/pointer skip handlers. This prevents a click used to open/focus the app from accidentally rushing through the publisher moment.

The prominent publisher card is responsive to the 960 × 540 canvas and uses `Math.min(width, height)` for type sizing, so the identity remains readable when the landscape canvas is fitted into a portrait phone viewport.

## 4. Visual direction

The current world is a warm, chunky 2D/top-down style with a Botswana-inspired sense of place:

- warm sky
- dry grass
- red earth
- simple compound/studio architecture
- utility/water tank
- scrub and acacia-like trees
- in-world Admin Hub Games sign
- small reusable player character

Creative principle:

**Start local → make it globally understandable.**

Do not replace this direction with a corporate splash screen or generic African visual stereotype.

## 5. Existing scenes

### `BootScene`
Immediately starts `PublisherIntroScene`.

### `PublisherIntroScene`
The current publisher/world opening cinematic. This is the main entry experience and should be preserved as the game foundation grows.

### `NameEntryScene`
Asks:

> What should we call you?

Accepts keyboard input, stores the result in Phaser registry as `playerName`, then transitions to `GameShellScene`.

### `GameShellScene`
Reusable baseline handoff. This is where the next actual game/world experience can begin.

## 6. Main Phaser bootstrap

`src/main.ts` configures:

```text
Phaser.AUTO
960 × 540
Scale.FIT
CENTER_BOTH
BootScene
PublisherIntroScene
NameEntryScene
GameShellScene
```

The project intentionally uses a landscape game canvas because the shared world/game direction is currently landscape-first. Portrait phones fit that canvas rather than changing the game coordinate system.

## 7. Firebase

Firebase is initialized centrally from `src/firebase/firebase.ts`.

The project is intended to use its dedicated Admin Hub Games Firebase project, not another game's Firebase project.

## 8. Web / PWA foundation

`index.html` currently contains:

- viewport configuration
- theme color
- description
- application name
- Apple mobile metadata
- favicon link
- manifest link
- page title

A favicon and manifest exist in the repository root.

### Follow-up verification item

The repository currently has `favicon.svg` and `manifest.webmanifest` at the repository root while Vite's normal static-public directory is `public/`. The connected GitHub file wrapper would not create nested `public/` files and returned a SHA-required error, so this was **not silently faked as complete**.

Before treating the PWA metadata as fully production-verified, the next development pass should confirm that `/favicon.svg` and `/manifest.webmanifest` are actually served by the deployed Vercel build, and if not, move/copy them into a Vite-served asset location or otherwise configure Vite correctly.

This does **not** block game development.

## 9. Git / checkpoint history

The latest publisher timing fix is:

`ae854273f0b44be25b407ec2947c368f79b0fd79`

`fix: make publisher intro timing deterministic`

The foundation documentation checkpoint is:

`e334c0021057ecc4ec48b4c32d5c4af5aad0cfdb`

`docs: lock publisher intro cinematic contract`

This handoff report is the subsequent documentation checkpoint.

## 10. Verification status

### Source inspection

Completed.

### Foundation wiring

Confirmed from repository source:

- Phaser bootstrap exists
- Firebase initialization is imported
- publisher intro is the first real scene after boot
- name-entry handoff exists
- game shell exists
- PWA metadata exists
- Vitest/build scripts exist

### Vercel connector verification

The connected Vercel tool was asked for project slug `admin-hub-games` under the known team and returned `404 Not Found`. Therefore the live production deployment was **not falsely marked as verified** in this report.

The repository remains the source of truth. The next chat should use the project's normal GitHub → Vercel workflow and visually verify the live deployment before declaring the next checkpoint complete.

## 11. What the next game-development chat should do

Do **not** rebuild the foundation.

Start from:

```text
Admin Hub Games publisher intro
        ↓
Name Entry
        ↓
Game Shell
        ↓
FIRST ACTUAL GAME / WORLD VERTICAL SLICE
```

The first game has deliberately not been selected yet. The next chat can decide what to build based on what is most enjoyable/useful, but it should preserve the publisher entry experience.

Good candidates already discussed include exploration/world wandering, a Lode Runner-inspired game, management/simulation, story/adventure, arcade, strategy, puzzle, chess-related experiences and other systems the owner personally wants to play.

The guiding principle is:

> **Make games, not infrastructure for infrastructure's sake.**

Build reusable systems only when an actual game needs them.

## 12. Architecture rule

Keep the conceptual separation:

```text
PLAYER INPUT
      ↓
GAME RULES / STATE
      ↓
PHASER RENDERS STATE
```

Do not turn the foundation into a giant custom engine prematurely.

## 13. User workflow preference

Owner workflow:

**START → BUILD → VERIFY → CHECKPOINT → CONTINUE / RECOVER**

- GitHub is source of truth.
- VS Code + Git Bash is the normal local workflow.
- Avoid PowerShell.
- Localhost is for development/debugging.
- For meaningful visual checkpoints, push to GitHub and review the Vercel deployment.
- Do not ask the owner for screenshots when browser/live verification can be performed another way.
- Unexpected results should stop the workflow rather than being patched blindly.

## 14. Handoff instruction

The next chat should read this report and `AGENTS.md` first, inspect the current repository state, then continue directly into game development.

**Do not ask the owner to repeat the foundation history.**
