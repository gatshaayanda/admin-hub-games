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
Personal world
        ↓
Shared world
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
- provides a touch-friendly **ENTER THE WORLD** button for phones
- stores the chosen name in Phaser's shared registry as `playerName`
- stores the chosen name locally on the device
- saves the player profile through anonymous Firebase Auth when available
- provides **RESET LOCAL GAME DATA** without deleting shared World Notes
- hands control to `GameShellScene`

The next game-specific chat should continue from this entry point rather than replacing the publisher opening with another abstract foundation screen.

## Responsive / Mobile Contract

Admin Hub Games is **phone-first capable, not merely desktop-scaled**.

The game uses Phaser's responsive Scale Manager with a fixed logical game size and `FIT` scaling so the same world remains legible across laptop and Android viewports. Phaser's documentation identifies `FIT` as the general-purpose mode for preserving aspect ratio while fitting the available parent area. citehttps://docs.phaser.io/phaser/concepts/scale-manager

Required controls:

- laptop: WASD / arrow keys + mouse/tap-to-walk
- phone: dynamic left-side virtual joystick + touch action buttons
- mobile controls are mounted only while `GameShellScene` is active; they must not appear over name entry, publisher intro, or modal scenes
- interaction modals use a dedicated Phaser Scene, not an in-place GameShell overlay
- phone: tap-to-walk remains available outside the joystick zone
- phone: no keyboard is required to start, enter the world, explore, or open the Gamebook
- controls must not make the world feel like a dashboard
- touch targets must remain large enough to use comfortably
- safe viewport behavior must be preserved through CSS `100dvh`, `touch-action: none`, and Phaser scaling

Mobile verification is a gameplay requirement. A successful Vercel build alone is not proof of phone usability.

## World Layout / Level Design Direction

The first world is a **meta game about Admin Hub Games itself**. It should borrow useful readability from classic tile/grid platform-game level design without becoming a Lode Runner clone.

The map should communicate at a glance:

- a central hub / Chess House
- branching paths to themed villages
- distinct readable zones
- places where a future actual game can physically appear
- a clear home/studio where the player's development history can grow

If a future level uses a compact tile/VGA-style or classic platform-game layout, its geometry, landmarks and visual language must still belong to Admin Hub Games. Do not copy another game's identity or simply paste an external level layout into the world.

The world should visually evolve as real games are created: an arcade area can become associated with the Lode Runner-style game, a strategy area can host Mhele, and future systems can grow into physical places. The world is the visual history of the games being made.

## Personal Gamebook vs Shared World Notes

These are intentionally different systems:

```text
MY GAMEBOOK
  ↓
private discoveries / ideas
  ↓
localStorage on the player's device
  ↓
not visible to other players

WORLD NOTES
  ↓
explicitly chosen “Leave in the world” notes
  ↓
Firestore
  ↓
visible to other players
  ↓
author can delete their own notes
```

Never silently turn a private Gamebook note into a public World Note.

World Notes use anonymous Firebase Auth so a player can choose an arbitrary display name without signup friction. The shared document shape is:

```text
worldNotes/{noteId}
  authorId
  authorName
  villageId
  text
  createdAt
```

Player profiles use:

```text
players/{uid}
  displayName
  updatedAt
```

The repository contains `firestore.rules` with narrow author-scoped write/delete rules. Do not replace these with public `allow read, write: if true` rules.

**Important:** Reset Local Game Data clears the local name and private Gamebook only. It must not delete World Notes.

Shared-world failures must degrade gracefully: the player should still be able to wander, use the private Gamebook, and play locally when Firebase/network access is unavailable.

## Interaction Modal State Contract

World interactions use `InteractionModalScene` as a dedicated Phaser overlay scene. The gameplay scene pauses while the modal is open and resumes when it closes. Phaser's scene lifecycle explicitly supports this pause/launch/resume modal pattern. citehttps://docs.phaser.io/phaser/concepts/scenes

The modal must provide real pointer/touch buttons for every action. Keyboard hints (`E`, `SPACE`, `ESC`) are optional desktop shortcuts, never the only way to dismiss or act on a modal. Interactive modal objects should stop propagation so a button tap cannot also trigger a backdrop close. Phaser's unified pointer API covers both mouse and touch. citehttps://docs.phaser.io/phaser/concepts/input

Doorway interactions must have an explicit proximity prompt and, where appropriate, a small automatic trigger when the player crosses the doorway threshold. Never require a physical keyboard key to advance a mobile-only flow.

## Roadmap

### Phase 1 — Personal World Foundation

- recurring publisher intro
- chosen display name
- anonymous Firebase identity
- local player-name persistence
- Reset Local Game Data
- private Gamebook
- top-down world, avatar, camera and movement
- village districts
- Chess House
- Home / Studio
- ambient audio
- desktop and mobile controls

Status: **substantially complete; now being exercised through real gameplay.**

### Phase 2 — Shared World

- deliberate private vs public note choice
- World Notes stored in Firestore
- public reading of shared notes
- chosen player name shown as author
- author-only deletion
- private Gamebook remains local/private
- Firebase failure handling
- narrow Firestore security rules

Status: **implementation checkpoint now pushed; Firebase rules still need to be deployed to the project if the console is still using the old locked rules.**

### Phase 3 — Alive World

- NPCs with dialogue
- characters who remember or react where justified
- interactable objects
- secrets and discoveries
- small quests
- visible development history
- more meaningful village spaces
- optional founder/admin-authored notes or interventions

### Phase 4 — Actual Games

Build real games from the world rather than expanding infrastructure indefinitely.

First planned directions:

1. **Mhele** — board/intersection game, connections, cows, mills, captures, turns, victory and bot.
2. **Lode Runner-style game** — compact levels, platforms, ladders, digging, treasure, enemies, timers and completion.

The Lode Runner-style game should be inspired by the genre's level readability and satisfying movement, while having an original Admin Hub Games identity and presentation.

### Phase 5 — Reusable Systems Extracted From Real Games

Only extract systems once multiple games justify them:

- grid/board
- collision
- turns
- inventory
- dialogue
- quests
- AI
- timer
- score
- resources
- progression
- level loading
- shared save/settings/audio

The rule remains: **smallest foundation that makes the next real game easier.**

### Phase 6 — Mobile / PWA Release Polish

- Android browser verification
- safe-area handling
- orientation behavior where useful
- installable PWA
- offline/local continuity
- Firebase reconnect/loading states
- performance checks
- touch target/accessibility pass
- save reliability

### Phase 7 — Studio / Publisher Layer

As real games exist, the world can become the place where the player discovers them:

- game areas physically appear in the world
- launch/enter points for finished games
- development milestones become visible landmarks
- shared/public notes become part of the community layer
- Admin Hub Games remains the publisher identity, not a dashboard UI

## System Boundaries / Surgical Changes

Use this mental model when building or modifying the project:

```text
FOUNDATION
    ↓
INPUT / STATE / RENDER
    ↓
REUSABLE SYSTEMS
    ↓
WORLD
    ↓
ACTUAL GAMES
```

When changing the game:
1. Identify the system being changed.
2. Identify dependencies affected by that system.
3. Change only the necessary layer(s).
4. Do not redesign unrelated systems.
5. Verify visual and interaction consequences.
6. Check mobile whenever the change touches input, UI, viewport, interaction or rendering.

The guiding principle is:

> **Build the system; graphics and controls are representations of that system.**

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
6. exercise the mobile path on a real Android device where possible

A successful build/deployment is not itself proof that the game experience is correct.

## Creative Direction

Admin Hub Games can contain Botswana details, names, environments, humor, language and everyday references where they improve the experience, while keeping the core experience understandable internationally.

Do not let publisher branding overwhelm the game. The player should feel they have entered a place and can play, not that they are viewing an Admin Hub website. The publisher identity gets one clear opening moment, then yields to the world.

Future game influences can include exploration, management, arcade, strategy, simulation, puzzle and story experiences. These are creative directions, not a requirement to implement all of them in the foundation.

## Current Status

Phase 1 — Admin Hub Games Foundation: **ready for real-world gameplay and continued game development.**

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
Responsive game shell     ✓
        ↓
Private Gamebook          ✓
        ↓
Shared World Notes        ✓ code checkpoint
        ↓
Actual games              → next product work
```

The next work should be driven by playing this foundation on laptop and Android, then building the first real game into it. Do not redesign the foundation merely because more features are possible.
