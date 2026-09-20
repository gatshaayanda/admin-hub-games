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

Use a data-driven story model rather than embedding the whole story inside one giant Phaser scene. The first playable story should be small but complete: a compact but replayable story pack with multiple decision points, visible consequences after each choice, multiple endings/outcomes, completion state, replay and local history/save state.

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


## President's Shoes — Development Boundary & Revision Contract

President's Shoes is now an integrated, playable game in the shared library. From this point forward, treat it as an **independent game product inside the Admin Hub Games platform**, not as a reason to refactor the platform or Hall.

### What President's Shoes currently is

- Library id: `presidents-shoes`
- Genre: fictional branching decision/narrative game
- Setting: fictional Botswana first week in office
- Current story: **The Water Week**
- Current story model: data-driven JSON story pack in `src/games/presidents-shoes/botswana-water-week.json`, typed/loaded by `src/games/presidents-shoes/story.ts`
- Current state variables: `trust`, `service`, `budget`, `decisions`, plus a pending consequence handoff so choices do not instantly skip to the next scene
- Current flow: Intro → Setup → Story → choices/consequences → outcome → replay/history
- Current persistence: local player identity and local save/history; no Firebase requirement
- Current story is deliberately fictional. It must not attribute invented actions, statements or events to real politicians, parties, governments, institutions or citizens.
- Country identity is data-driven through `src/games/presidents-shoes/countries.json`. The current available pack is Botswana. New countries should arrive as their own verified story/content packs, not by relabelling the Botswana story.
- Country branding uses country metadata (name and palette) rather than hard-coding one country's identity into the game engine. Official national emblems/flags should not be copied into the game without checking the applicable use requirements.

The current story uses a fictional water-service crisis as the first scenario. It is a small decision tree with several choices that reconverge before the final outcome. The ending is calculated from accumulated state rather than from a single fixed “correct” choice.

### President's Shoes change boundary

For revisions and updates, default to changing **only** files under:

```
src/games/presidents-shoes/**
src/scenes/PresidentsShoesIntroScene.ts
src/scenes/PresidentsShoesSetupScene.ts
src/scenes/PresidentsShoesGameScene.ts
```

A change outside that boundary requires an explicit reason because it may affect the shared platform or another game.

Shared files that may be touched only when genuinely required:

- `src/catalog.ts` — only for the President's Shoes library entry/routing.
- `src/main.ts` — only for President's Shoes scene registration/bootstrapping.
- `src/style.css` — only for a demonstrated shared styling problem or a clearly scoped President's Shoes UI need that cannot stay game-local.
- `public/sw.js` / PWA files — only when a release actually introduces assets or caching requirements that need a platform-level update.
- Firebase/security/config — only when a demonstrated product requirement needs server persistence or shared multiplayer/social functionality.

**Never modify Hall to improve President's Shoes.** If President's Shoes needs something Hall does not, implement it inside the President's Shoes boundary first. If it later proves reusable, extract the smallest shared improvement as a separate, reviewed foundation change.

### President's Shoes branch rule

Future President's Shoes work should normally begin from the latest known-good `main` on a dedicated branch named with the game, for example:

```
presidents-shoes/<short-task-name>
```

Do not develop President's Shoes directly on `main` for multi-file gameplay/story changes.

A President's Shoes checkpoint should contain only:
- the intended President's Shoes changes;
- any explicitly justified shared integration change;
- verification that Hall still follows its existing path;
- a production build;
- the relevant President's Shoes flow test.

### Revision order

When revising President's Shoes, use this order:

1. **Story first** — inspect `story.ts` and decide what narrative/state actually needs changing.
2. **Game engine second** — change `PresidentsShoesGameScene.ts` only if the story model cannot express the revision.
3. **Game-specific presentation third** — change Intro/Setup/game UI only where the player experience requires it.
4. **Shared shell last** — touch catalog/main/style/PWA only if the game genuinely requires a platform change.
5. **Verify isolation** — confirm Hall and the Game Library still work before checkpointing.

Do not solve a story problem by changing shared routing. Do not solve a game-specific visual problem by rewriting the global shell.

### President's Shoes content rules

The game may explore civic decisions, trade-offs, public administration and consequences. It must remain clearly fictional.

Online research can be used as **background/reference material** for understanding institutions, terminology, civic systems, historical context or game mechanics. Research must not be used to make real people appear to have taken fictional actions.

For any current political claim, real office-holder, party, election, legislation or live event, use current reliable sources and keep the presentation factual and attributed. Do not turn research into political persuasion, candidate ranking, endorsement, election prediction or a claim that the fictional game outcome represents real-world political truth.

### President's Shoes acceptance gate for every meaningful revision

Before merging a President's Shoes change:

```
President's Shoes branch
        ↓
story / game-specific change
        ↓
typecheck + production build
        ↓
play Intro
        ↓
Setup
        ↓
make a choice
        ↓
verify consequence/state change
        ↓
reach outcome
        ↓
verify replay/save behavior
        ↓
verify Hall path remains intact
        ↓
checkpoint
```

If a revision unexpectedly changes Hall, the shared library, routing, Firebase behavior or PWA behavior, **STOP** and inspect the diff before continuing.

### Current President's Shoes reference point

As of this contract update, the authoritative baseline is the version of President's Shoes already present on `main`. Future changes should be compared against that baseline rather than against old feature branches or screenshots.

The current live library description is:

> A fictional Botswana decision story. Choose, respond to consequences and see where your first week leads.


## Current Foundation Status — September 2026

Hall is currently the working production game and President's Shoes is the second real playable game in the library.

The platform remains shared, but each game is independently owned after library selection. President's Shoes revisions should stay inside its development boundary unless a demonstrated shared-platform requirement exists.

Full offline readiness remains a device-verification gate, not an assumption.


### President's Shoes — Content Pack Contract

President's Shoes is intentionally being prepared as a content-driven game rather than a hard-coded one-off story.

country selector → country metadata → story pack JSON → shared President's Shoes engine

A future pack should provide its own country identity and story data while the engine continues to handle choices, state, consequence feedback, endings, save/resume and history.

For V1:
- `countries.json` is the country registry.
- `botswana-water-week.json` is the first real story pack.
- The engine must never silently show the Botswana story under another country's branding.
- Adding another country requires a real story pack or a clearly compatible content pack; do not create a fake country option just to populate the selector.
- Country branding should prefer verified colours/typography/content over copying official government marks.
- Story JSON is static/local and must remain offline-capable.


### President's Shoes — September 20, 2026 Revision Checkpoint

The current direction is intentionally player-facing and content-driven:

- **Country choice is real data, not decoration.** The selected country controls the country identity and selects a matching story pack. Never show the Botswana story under another country's identity.
- **Story content is JSON.** New countries/stories should be added as local static packs that the same engine can load offline. Do not create fake country options just to populate the selector.
- **Every choice must have a visible consequence beat.** Choice → consequence screen → Continue → next situation. Do not collapse this back into instant scene-to-scene progression.
- **Consequences must be concrete.** Show the written consequence plus the actual state deltas (Trust / Service / Reserve) so the player can understand what their decision changed.
- **The ending must feel like an ending.** It should clearly state the player's fictional presidential status/mandate and explain how the accumulated record produced that outcome. Do not leave the player to infer whether the run succeeded.
- **Pacing is player-controlled.** No automatic rapid slide progression after a decision. The player explicitly advances from the consequence screen.
- **Readability beats density.** Use strong text/background contrast, clear hierarchy, generous spacing and large touch targets. These choices follow established game-accessibility guidance on readable text, contrast, player-controlled text progression and touch targets.
- **Fiction boundary remains firm.** President's Shoes is a fictional civic decision game. Do not use current real politicians, parties, elections or live events as fictional characters/events.
- **Do not solve this game's UX by changing Hall.** Keep the revision boundary inside President's Shoes unless a demonstrated shared-platform requirement exists.

#### Revision acceptance path

```
Country selection
  ↓
fictional name
  ↓
story scene
  ↓
choice
  ↓
visible consequence + state delta
  ↓
player-controlled Continue
  ↓
next situation
  ↓
explicit presidential outcome
  ↓
replay / library
```

The September 20 revision is a product-quality checkpoint, not permission to add infrastructure for its own sake. Future story expansion should add meaningful situations and consequences through JSON before changing the engine.
