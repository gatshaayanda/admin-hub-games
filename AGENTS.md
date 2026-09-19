# AGENTS.md — Admin Hub Games

## Identity
**Project:** Admin Hub Games  
**Repository:** `gatshaayanda/admin-hub-games`  
**Owner:** Ayanda Gatsha / Admin Hub  
**Role:** canonical game portal and reusable foundation for Admin Hub Games.

This repository contains the Admin Hub Games publisher shell and the games that actually exist here. Do not add placeholder games or describe planned/unimplemented titles as built.

## Source of Truth & Workflow
- GitHub is the source of truth.
- Local development: VS Code + Git Bash.
- Workflow: **START → BUILD → VERIFY → CHECKPOINT → CONTINUE / RECOVER**.
- Golden rule: **unexpected result = STOP → inspect reality → then act.**
- Inspect the actual repo, Git state and this contract before changing code.
- Make one controlled change at a time; review the diff; run locally; verify the affected flow; build; commit; push.
- A meaningful task ends with one coherent checkpoint on `main`.
- VS Code is the local workspace, terminal, file-inspection, Git-review and human-control layer.
- Do not assume a route, file, service worker, deployment or feature exists. Inspect it.

## Technology Baseline
- Vite + TypeScript
- Phaser
- Vitest
- Firebase
- Node.js
- Git / GitHub
- Vercel
- Browser-first, PWA/mobile-capable

Keep the foundation lightweight. Build games, not infrastructure for infrastructure's sake.

## Canonical Player Flow

The Admin Hub Games shell owns the opening and library:

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
that game's Setup / Name Entry
      ↓
that game's Gameplay
```

**Ownership rule:** Publisher Intro and Game Library are shared Admin Hub Games infrastructure. Everything after selecting a game belongs to that game.

### Critical handoff rule
A game-specific Intro hands off to that game's Setup. A game-specific Setup hands off directly to that game's Gameplay.

**A Setup scene must not decide whether to replay its own Intro.** Once the Intro has handed control to Setup, Setup must never route back to the Intro unless the product explicitly defines a user-selected replay action.

Hall's currently proven flow is:

```
Publisher Intro → Game Library → Hall Intro → Name Entry → GameShell
```

Do not change this working Hall flow merely to accommodate another game.

Do not add a direct `/hall` bypass around Publisher Intro → Game Library.

## Adding the Next Real Game

A new game should be added to the existing Game Library and then own its own:
- intro
- setup/name entry where needed
- rules and state
- gameplay scenes
- assets
- game-specific UI
- local save/state

The target is simple:

```
Game Library
     ↓ click new game
New Game Intro
     ↓
New Game Setup
     ↓
New Game
```

Do not rewrite Hall to make the new game fit.

Shared systems may be changed only when the new game genuinely requires them. If a new game proves a reusable improvement, bring that improvement back to this canonical base deliberately after verification.

## Shared Backend
Use the existing shared Firebase project for Admin Hub Games when shared persistence is genuinely required. Do not create a separate Firebase project merely because another game exists.

Do not add Firebase reads/writes merely because a game exists. Static game content should remain local/static unless there is a real reason for server persistence.

Client Firebase configuration is not a secret. Server credentials and production secrets must never be committed.

## Offline / PWA Contract

The installed application is intended to be a real local-first/offline-capable game, not merely an installable manifest.

Required foundation:
- `public/sw.js` must exist.
- The service worker precaches the application shell.
- Same-origin scripts, styles, images, fonts, audio, JSON and manifest resources are runtime-cacheable.
- Offline navigation falls back to the cached `/` shell.
- Cache versions change at every production app release/update boundary. For this repository, bump the `CACHE_NAME` version in `public/sw.js` when shipping a new app version so installed PWAs get a fresh service worker and the existing update notice can offer the user a reload.
- The service worker accepts `SKIP_WAITING` from the existing update notice.
- `registerPwa()` must never block Phaser startup or scene routing.
- PWA installation/update UI must not become a game-flow gate.
- LocalStorage/IndexedDB-backed gameplay must continue without Firebase.
- Firebase-dependent features must degrade gracefully offline and sync through the existing local/outbox logic when connectivity returns.
- When a new game ships, its static assets must pass through the service worker's normal caching strategy before offline play is claimed.

### PWA acceptance gate

Do **not** claim full offline verification from a successful GitHub/Vercel build alone.

The real release sequence is:

```
install while online
      ↓
launch online
      ↓
Publisher Intro
      ↓
Game Library
      ↓
Hall Intro
      ↓
Name Entry
      ↓
Hall gameplay
      ↓
local/private data
      ↓
close
      ↓
airplane mode
      ↓
reopen installed PWA
      ↓
continue playing
      ↓
restore network
      ↓
verify queued shared changes sync
```

A real Android/device test is the acceptance proof.

## Hall Protection

Hall is the current known-good game and the reference for the shell-to-game handoff.

Protect:
- Publisher Intro
- Game Library overlay
- Hall Intro cinematic
- Name Entry → GameShell handoff
- Hall gameplay
- mobile controls
- existing local Gamebook/World Notes behavior

Do not refactor these while adding another game unless an actual demonstrated bug requires it.

## Mobile Contract

Admin Hub Games is phone-first capable, not merely desktop-scaled.

Required:
- Phaser responsive `RESIZE` canvas
- edge-to-edge viewport
- touch-friendly controls
- native mobile name input where needed
- no keyboard requirement for mobile gameplay
- modal actions with large touch targets
- reliable modal escape
- orientation/resize handling
- real Android verification for release candidates

A successful production build is not proof of mobile usability.

## Private Gamebook vs Shared World Notes

```
MY GAMEBOOK
  ↓
private player data
  ↓
IndexedDB / local storage compatibility
  ↓
never silently public

WORLD NOTES
  ↓
explicit shared notes
  ↓
local-first + Firebase synchronization
  ↓
visible to other players
```

Never silently turn a private Gamebook note into a public World Note.

Reset Local Game Data clears the local name/private Gamebook only. It must not delete shared World Notes.

Existing World Note ownership/moderation rules remain authoritative. Do not weaken Firestore security rules to solve a UI problem.

## Verification

For a meaningful checkpoint:
1. inspect actual source and contract;
2. implement the smallest necessary change;
3. review the resulting diff;
4. run tests where available;
5. run the production build;
6. exercise the affected browser flow;
7. exercise mobile/PWA when the change affects those layers;
8. push to GitHub;
9. verify the deployed result where tooling permits;
10. record the checkpoint.

Never confuse “build passed” with “player flow verified.”

### Production promotion gate

A game is not considered promoted merely because a branch, PR, or Vercel preview was promoted. Before telling the product owner that a new game is live on the normal Admin Hub Games URL:
- verify the game is actually present in `main`;
- verify the shared Game Library source on `main` contains the new game's real playable entry;
- verify `main` also contains every scene/registration file required to launch that entry;
- verify the production deployment is built from the expected `main` commit (or explicitly verify the promoted deployment contains that commit);
- open the normal production URL and confirm the Game Library visibly shows the new game;
- click the new card and verify the game's Intro → Setup → Gameplay handoff;
- only then call the game live.

**Do not assume promotion, merge, or deployment means the production menu updated.** A source-of-truth check and one real production smoke test are mandatory after every new-game promotion.

If the production menu is missing a newly promoted game, STOP. Inspect `main`, the deployed commit, and the catalog before changing Firebase, routing, caching, or unrelated game code.

## Architecture Principle

```
Admin Hub Games shell
        ↓
Game Library
        ↓
independent game
        ↓
game-specific state/rules/rendering
```

The shell should make adding the next real game easier without making every game share one giant scene or one giant conditional flow.

**Smallest foundation that makes the next real game easier.**

## Safety Checkpoint

**Known rollback / safety anchor:** commit `7bb573eeb115b3d77561db13239f8a0d3c39e146` — `fix: use the Hall intro completion key consistently`.

This commit is an explicit recovery reference. Do not force-reset or rewrite `main` casually. The commits after this anchor add the current foundation improvements (the final Hall setup handoff fix, the project contract, the PWA service worker and generic PWA update wording). If a future change unexpectedly damages the platform, stop and compare against this anchor before attempting further fixes.

**Current development rule:** new games are developed from the current known-good `main` foundation, preferably on a dedicated branch first. Hall remains protected. Do not roll back the foundation merely to add a game.

## President's Shoes — First New Game

President's Shoes is the next actual game to integrate. It is a fictional, branching narrative game set in Botswana. It is not presidential training, political advocacy, a news simulator, or a representation of real politicians' actions.

Target flow:

```
Publisher Intro
      ↓
Game Library
      ↓
President's Shoes Intro
      ↓
President's Shoes Setup
      ↓
President's Shoes Gameplay
```

### President's Shoes Intro

Own the game's identity and premise. Establish the Botswana setting, the fictional nature of the story, the responsibility of making decisions, and the game's tone. It must hand directly to President's Shoes Setup.

### President's Shoes Setup

Initial V1 setup is deliberately small:

```
Choose fictional presidential name
      ↓
Confirm
      ↓
Start story
```

The setup stores the fictional player identity locally and starts gameplay directly. It must not route back through the intro automatically.

### President's Shoes Gameplay

Use a data-driven story model rather than embedding the whole story inside one giant Phaser scene. The first playable story should be small but complete: roughly 5–8 scenes/nodes, 3 meaningful decision points, visible consequences, multiple endings, completion state, replay and local history/save state.

Use fictional names and fictional scenarios. Real-world news or public discussion may inspire a story, but fictional actions and reactions must not be presented as facts about real people, parties, governments or citizens. Gameplay should remain playable offline and should not require live news retrieval.

The story engine should support:
- scene/node progression;
- choices;
- state/consequences;
- branching and useful reconvergence;
- multiple endings;
- replay;
- local save/resume;
- local completion history.

Keep story content separate from rendering and platform infrastructure. A lightweight static data structure under `src/games/presidents-shoes/` is sufficient for V1; do not create Firebase persistence just for this game.

### President's Shoes Integration Rules

- Add one real, playable library card. No placeholder or Coming Soon card.
- Do not modify Hall's scene logic to launch President's Shoes.
- Shared shell changes should be limited to the library selection and Phaser scene registration needed to launch the new game.
- President's Shoes owns its Intro, Setup, Gameplay, story state and game UI after selection.
- Do not create a separate Firebase project.
- Do not add live-news APIs or server dependencies to the first playable story.
- Keep the game compatible with the existing PWA/service-worker caching strategy.
- Before claiming offline play, ensure the game's requested static resources have been cached by a prior online launch.

### New Game Acceptance Gate

Before calling President's Shoes integrated, verify the complete path:

```
Publisher Intro
 ↓
Game Library
 ↓
President's Shoes card
 ↓
President's Shoes Intro
 ↓
Setup
 ↓
Story
 ↓
choice
 ↓
consequence
 ↓
next scene
 ↓
ending
 ↓
replay / return
```

Also verify Hall still follows its existing proven path unchanged.

## Current Foundation Status — September 2026

Hall is currently the working production game.

The intended next development task is to add another **actual** game to the library without disturbing Hall:

```
existing Publisher Intro
        ↓
existing Game Library
        ↓
new game entry
        ↓
new game's Intro
        ↓
new game's Setup
        ↓
new game's Gameplay
```

The current repository also contains the service-worker foundation required for the PWA. Full offline readiness remains a device-verification gate, not an assumption.
