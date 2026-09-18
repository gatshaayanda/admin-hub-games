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

The publisher intro is intentionally distinct from any individual game's environment. Its visual language is a clean, nocturnal fantasy-studio identity: deep indigo space, stars, restrained teal energy, warm gold accents, geometric medieval/futurist motifs, and a small travelling player figure. Individual games may then establish their own worlds, including the Botswana-inspired landscapes used by the Admin Hub meta-world.

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

The game uses Phaser's responsive Scale Manager with `RESIZE` so the canvas itself fills the available parent area on laptop and Android viewports. This deliberately avoids portrait letterboxing; the world camera and UI adapt to the actual viewport dimensions. citehttps://docs.phaser.io/phaser/concepts/scale-manager

Required controls:

- laptop: WASD / arrow keys + mouse/tap-to-walk
- phone: dynamic left-side virtual joystick + touch action buttons
- mobile controls are mounted only while `GameShellScene` is active; they must not appear over name entry or publisher intro; gameplay controls hide while a modal/Gamebook is open, while a contextual `BACK` escape handle remains available
- interaction modals use a dedicated Phaser Scene, not an in-place GameShell overlay
- phone: tap-to-walk remains available outside the joystick zone
- phone: no keyboard is required to start, enter the world, explore, or open the Gamebook
- controls must not make the world feel like a dashboard
- touch targets must remain large enough to use comfortably (48px minimum for modal/navigation actions)
- safe viewport behavior must be preserved through CSS `100dvh`, `touch-action: none`, and Phaser scaling

Mobile verification is a gameplay requirement. A successful Vercel build alone is not proof of phone usability. Full-viewport layout must be checked for portrait and landscape behavior, modal escape, control layering and real-device touch.

## World Layout / Level Design Direction

The first world is a **meta game about Admin Hub Games itself**. The first playable space is the **Systems Hall lobby**.

The Hall is deliberately one place rather than a collection of separate system houses. Its job is to be a safe, memorable home base where the player can wander, discover, think, write and plan the next game.

Inside the Hall are small functional landmarks rather than separate buildings:

- **IDEA WALL** — capture mechanics, questions, experiments and game ideas.
- **BUILD CHAMBER** — the development ritual: choose one small playable slice, build it, test it, push it, then return to the Hall.
- **GAME GATE** — the future entrances for finished Admin Hub Games titles.
- **PLAYER CAMP** — the player's small home/return point.
- **GAMEBOOK** — the private notebook and operating manual.

The intended lobby loop is:

```
WANDER
  ↓
DISCOVER
  ↓
THINK
  ↓
WRITE
  ↓
BUILD
  ↓
RETURN
  ↓
DISCOVER AGAIN
```

The Hall should reward curiosity without forcing a quest marker or checklist. Landmarks, paths, signs, lighting, small animations and changes to the environment should communicate what matters before the player opens a menu. This follows the useful hub-world principle that a hub should be worth inhabiting, not merely a level-select screen, and that environmental cues can teach players without stopping play. citehttps://www.bosnan.net/essays/hub-world-designhttps://create.roblox.com/docs/production/game-design/onboarding-techniques

As real games are created, the Hall becomes the visual history of the studio: the Game Gate gains entrances, the Build Chamber reflects active projects, and old development ideas can remain as environmental traces.

Individual games still get their own worlds. The Hall is the publisher's shared home, not a template that forces every game into one visual genre.

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
- authors can delete their own published notes with BANANA;
- other players cannot delete another player's note;
- any player can report a bad published note;
- founder/admin moderation can delete any published note and review the report stream;
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


## Mobile Full-Viewport / Handheld UI Checkpoint — September 2026

The current mobile presentation is intentionally **handheld-first**, not a webpage framed around a game canvas.

Implementation rules:
- Phaser uses `Phaser.Scale.RESIZE` so the Canvas fills the available parent space regardless of aspect ratio. Phaser documents `EXPAND` as retaining FIT-style aspect-ratio fitting, which can leave unused space; RESIZE is the deliberate choice for this project. citehttps://docs.phaser.io/phaser/concepts/scale-manager
- The Canvas is pinned to the application's top-left/full viewport through CSS. Do not reintroduce fixed-width wrappers, centered canvas margins, or a secondary dark footer around gameplay.
- The bottom joystick/action dock is a transparent overlay over the world. The camera should not reserve a separate band of world height for it.
- CSS uses `100dvh` and safe-area environment variables. Safe-area insets are the browser-provided values for keeping essential UI away from notches/rounded display edges. citehttps://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env
- Mobile discrete actions use native button semantics where possible. Continuous joystick movement remains pointer-driven because it is a real-time game control.
- Touch actions should not depend on tiny text labels. Navigation/action targets are deliberately at least 48px where practical; general web guidance recommends at least 44px CSS pixels for interactive targets. citehttps://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button
- Modal body copy must be bounded so long village descriptions cannot collide with the action row. Phaser Text supports fixed sizes and maximum line counts. citehttps://docs.phaser.io/api-documentation/class/gameobjects-text
- The native mobile name field must not automatically summon the keyboard merely because the Name Entry scene opened. The player chooses when to focus it.
- Orientation/viewport changes are real runtime states. Scenes containing responsive onboarding or modal UI should listen to Phaser's resize event and reposition their UI rather than assuming the first viewport dimensions remain valid. Phaser exposes a Scene resize event for this purpose. citehttps://docs.phaser.io/phaser/concepts/scenes

### Handheld visual language
Do not copy Game Boy Advance or Nintendo DS branding. Use their useful interaction principles:
- world-first presentation
- chunky readable controls
- strong hierarchy
- clear pressed states
- dedicated interaction zones

Admin Hub Games keeps its own visual identity:
- warm sky
- dry grass
- red earth
- dark brown/charcoal UI
- warm cream text
- amber/terracotta accents
- restrained teal as a secondary action accent

### Verification gate for future mobile UI changes
Before calling a mobile presentation change complete:
1. confirm canvas fills portrait width and height with no letterbox/frame;
2. confirm onboarding is edge-to-edge and the native name field aligns with its Phaser field;
3. confirm publisher intro remains cinematic and is not accidentally skippable;
4. confirm modal action buttons remain reachable and readable in portrait;
5. confirm modal/Gamebook can always be exited by touch;
6. confirm joystick, EXPLORE and BOOK do not block modal buttons;
7. confirm safe-area spacing on devices with browser UI/notches;
8. confirm Vercel production build succeeds;
9. exercise the deployed build on a real Android device where possible.

The principle remains:

> **The game should feel like a game that happens to run in a browser, not a website that happens to contain a game.**


## First Playthrough Quality Gate — September 2026

Before adding another village, actual game, or major feature, the opening player journey is the primary vertical slice:

```
BOOT
 ↓
publisher cinematic
 ↓
name entry
 ↓
first touch / movement
 ↓
world orientation
 ↓
first discovery
 ↓
first modal
 ↓
modal exit
 ↓
continued wandering
 ↓
Gamebook
```

The first playthrough must feel intentional from boot to first exploration. Do not move on because individual systems technically work.

Quality gates:
- no visible letterboxing or framed webpage around the game;
- publisher reveal is cinematic, responsive and cannot be accidentally skipped;
- first user gesture can establish the persistent audio session without breaking the opening;
- name entry is obvious, touch-friendly and does not summon the keyboard unexpectedly;
- ENTER THE WORLD produces a clean handoff into gameplay;
- the first world view is immediately readable on phone and laptop;
- movement controls feel like game controls, not website widgets;
- first interaction is discoverable without requiring a keyboard;
- every modal action has a large touch target and a reliable escape path;
- orientation changes do not leave stale UI or hitboxes;
- returning from a modal/gamebook never loses player control;
- persistent music does not restart between Phaser scenes;
- PWA/mobile behavior remains part of the game experience rather than an afterthought.

**Do not expand the world until this loop has been exercised as one continuous playthrough.**


## First-Playthrough Fix Checkpoint — September 2026

Phone playthrough remains the release gate. This checkpoint removes the modal resize/restart freeze path, prevents duplicate modal actions, makes the native mobile name field visually authoritative instead of competing with Phaser text, and adds two idle/two walking procedural player poses with facing direction. Do not call the experience PWA-ready until the deployed phone flow is pleasant from name entry through first exploration and modal return.
\n\n## Canonical Game Base Rule — September 2026\n\nThis repository is the **Admin Hub Games game base**. When starting a new Admin Hub game, clone this repository rather than creating a fresh Vite/Phaser project from scratch.\n\nThe base is responsible for the shared experience that should make every Admin Hub game immediately feel like an Admin Hub game:\n\nBOOT\n ↓\npublisher intro\n ↓\nname / player identity\n ↓\nclean transition into the title's first playable state\n ↓\nshared input / mobile / audio / save foundations\n ↓\nTHE GAME\n\n A new title should change the game layer, not casually replace the publisher identity, responsive shell, input conventions, player handoff, or foundational rules. New systems are added only when the actual game needs them.\n\n### The Admin Hub Flag\n\nThe publisher intro is the studio flag: a short, repeatable ritual that says **this is an Admin Hub Games title** before getting out of the player's way.\n\nThe intended psychology is:\n- establish place and identity before asking the player to do anything;\n- give the player a small human-scale character to follow into the world;\n- make the publisher name memorable without turning it into an advertisement;\n- hand control to the player quickly enough that anticipation becomes action;\n- make the transition from intro to first control feel like entering a game, not loading a website.\n\nThe current intro is deliberately responsive to viewport changes. Its timing is state-driven rather than dependent on pointer/keyboard input or viewport dimensions, and it must remain skippable only by finishing its intended sequence—not by incidental taps.\n\n### New Game Loop\n\nAfter cloning this base:\n\n1. inspect the repository and read AGENTS.md;\n2. identify the new game's rules, state, scenes and assets;\n3. preserve the Admin Hub publisher/hand-off contract unless there is a documented product reason to change it;\n4. build the smallest playable vertical slice;\n5. test the first control flow on desktop and phone;\n6. run tests and the production build;\n7. push the checkpoint to GitHub;\n8. verify the live Vercel deployment;\n9. continue the loop: **START → BUILD → VERIFY → CHECKPOINT → CONTINUE / RECOVER**.\n\nThe repository is therefore both a playable Admin Hub Games world and the template for the next game. The goal is not to build one generic engine first; the goal is to make the next real Admin Hub game easier to create without losing the identity established here.
## Canonical Clone Contract

THIS REPOSITORY IS THE CANONICAL ADMIN HUB GAMES GAME BASE.

When starting a new catalog game, clone this repository at its latest meaningful production checkpoint. Do not start a blank Vite/Phaser project and do not clone an individual game as the base.

The clone inherits the publisher intro, player/name handoff, responsive Phaser shell, mobile input conventions, optional Firebase hooks, Gamebook foundation, audio foundation and GitHub/Vercel workflow. The cloned repository is then the actual new game.

### New-game clone protocol

1. Clone the latest production checkpoint of this repository.
2. Rename repository/package/app metadata and the new game's identity.
3. Create a separate Firebase project only if the new game actually needs Firebase. Never inherit another title's Firebase project.
4. Rewrite AGENTS.md immediately so it becomes the new game's own project contract. Preserve the Admin Hub Games foundation contract, but replace the identity, game rules, state, scenes, controls, assets, save model, Firebase needs, current vertical slice and release target with the new game's actual facts.
5. Keep the publisher intro unless there is a deliberate product reason to change the shared publisher identity.
6. Treat the cloned foundation as already production-proven. Do not create a test/build ceremony before starting creative implementation.
7. Build the actual first complete playable game. Run tests/builds when a release candidate is ready, when foundation or dependencies change, or when a bug needs deterministic verification.
8. Push through the normal GitHub to Vercel path and record the production checkpoint in the new game's AGENTS.md.
9. If a new game proves a reusable improvement, bring that improvement back to this canonical repository deliberately.

### Required starting prompt after cloning

START. This repository was cloned from the Admin Hub Games canonical base. Read AGENTS.md and GAME-CLONE-PROTOCOL.md first. Inspect the actual clone and Git state. Then rewrite AGENTS.md into the project-specific contract for [GAME TITLE]. Preserve the Admin Hub Games publisher foundation and START to BUILD to VERIFY to CHECKPOINT to CONTINUE or RECOVER workflow. Document the new game's rules, core loop, scenes, controls, assets, save model, Firebase needs, current slice and production target. Do not create a new engine or restart from Vite. Do not run a test/build ceremony before the first playable implementation. Build the actual game first. Unexpected result = STOP, inspect reality, then act.

The goal is catalog throughput without foundation drift: clone a known-good base, write the new game's contract, build the real game, then feed proven reusable lessons back into the canonical base.

## Systems Hall / Shared Notes Checkpoint

The first meaningful landmark after the player's home is the **SYSTEMS HALL** at the center of the world. It is the crossroads for the other system villages.

The Hall lists the current system villages and is the deliberate place for shared-world writing.

Shared note ritual:
- write the note;
- enter **APPLE** to confirm publication to Firestore;
- the published note enters the shared world for other players to see;
- the author can later use **BANANA** to delete their own published note;
- other players cannot delete someone else's note, but they can report it;
- the founder/admin identity can use **BANANA** to moderate any published note;
- the admin report stream records what players are flagging so the game can be understood and moderated over time;
- APPLE and BANANA are workflow confirmations, not security credentials;
- Firestore rules remain authoritative: authors can delete their own notes, while cross-player deletion and report review require a real Firebase `admin` claim.

The Systems Hall is part of the canonical lobby foundation and should survive future game cloning unless a new title deliberately replaces the world layer.
