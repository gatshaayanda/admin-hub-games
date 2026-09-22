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

## Main-Branch Checkpoint & New-Chat Protocol

**Main is the shared source-of-truth checkpoint.** A dedicated development branch is an implementation workspace, not the final product checkpoint.

Every new chat/session working on this repository MUST:
1. Read `AGENTS.md` first.
2. Inspect the actual remote state, including `main`, the active development branch, and the files relevant to the task.
3. Continue from the current remote state. Do not reconstruct work from memory or assume an old branch is current.
4. Follow **START → BUILD → VERIFY → CHECKPOINT → CONTINUE / RECOVER** and stop on unexpected results to inspect reality.
5. When the user asks to **push, complete, checkpoint, or push the latest**, the default destination is **`main`** unless the user explicitly names another branch.
6. If implementation is done on a feature branch, finish the requested checkpoint by bringing the intended changes into `main` and report the resulting `main` commit SHA.
7. Do not leave completed requested work stranded on a feature branch merely because that branch was used for implementation.
8. Do not confuse a feature-branch push, PR, CI run, Vercel preview, or deployment with the requested `main` checkpoint.

### Execution discipline

When the user explicitly asks for a commit/push/checkpoint, execute that requested operation without adding unrelated work. Do not automatically start a Vercel investigation, deployment investigation, merge investigation, or repeated explanation unless needed to safely complete the requested main checkpoint.

When a feature branch conflicts with current `main`, **STOP and inspect both sides before changing anything**. Do not force-reset, overwrite newer `main` work, or blindly copy a stale feature branch over `main`. Reconcile only the intended changes against the current `main` state.

A meaningful completed task ends with one coherent checkpoint on `main`. The next chat starts from that `main` checkpoint.

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


## Game Catalog Direction — September 20, 2026

This section defines the current design briefs for the next three planned Admin Hub Games titles. These are product-development briefs layered onto the existing Admin Hub Games platform. Hall and the existing President's Shoes work are evidence of reusable foundations; inspect and reuse those foundations rather than treating these games as greenfield projects.

The three concepts share the same studio principle:

**PREP → PRESSURE → PERFORMANCE → CONSEQUENCE → RETURN**

A game should make the player's preparation meaningful, put them under pressure, reward practiced skill, produce understandable consequences, and give them a reason to play again.

### President's Shoes

**Core fantasy**  
Run a fictional presidency in a Botswana-inspired setting and experience the consequences of difficult decisions without controlling or representing real politicians.

**Why someone wants to play**  
To see whether they can manage competing priorities, limited resources, incomplete information and unexpected situations while building their own fictional presidential story.

**Core mechanic**  
Choose among competing responses to situations; choices alter tracked state such as trust, service and budget/reserve, leading to branching or reconverging situations and different outcomes.

**What they actually do**  
Read a situation, inspect the available options, choose a response, review the concrete consequence and state change, then decide what to do next.

**Skill — what gets better with practice**  
Decision-making under trade-offs: understanding consequences, protecting scarce resources, recognising patterns and planning several decisions ahead.

**Pressure — what makes it exciting**  
Limited resources, competing priorities, escalating situations, uncertain consequences and the possibility that an apparently helpful decision creates a later problem.

**Training — what prepares the player**  
Short onboarding decisions, readable explanations of state variables, low-stakes opening situations and replay/history that lets the player learn from previous runs.

**Progression — why they return**  
New story packs, new situations, different starting conditions, alternate outcomes, personal history and increasingly complex decision chains.

**Multiplayer — whether/how people compete**  
V1 should remain single-player. A later competitive layer could compare runs using transparent scenario scores or asynchronous challenges without requiring players to control the same fictional government simultaneously.

**Story engine — how new situations are generated**  
Data-driven local story packs: nodes, choices, state deltas, consequence text, conditions, reconvergence and endings. New scenarios should be content additions before engine rewrites.

**Educational angle — whether it can teach**  
Yes. It can teach trade-offs, budgeting, civic systems, resource allocation, consequences and structured decision-making when presented as fictional simulation rather than factual political instruction.

**B2B angle — whether a company could buy/customise it**  
Potentially. The same decision engine could support fictional leadership simulations, organisational decision scenarios, classroom exercises or branded scenario packs. Any real-world adaptation would require carefully verified content and clear separation between simulation and factual claims.

**Content engine — whether it produces shareable moments**  
Strong. Unexpected outcomes, dramatic final records, difficult choices and alternate endings can become screenshots, short clips, challenge scenarios and “what would you do?” content.

**Technical difficulty — what it actually requires**  
Medium. The hard part is a clean reusable story/state engine, save/resume, consequence presentation and content authoring structure rather than rendering complexity.

**Build target — next increment from the existing platform**  
Inspect the current President's Shoes implementation first. Preserve the existing PWA shell, localStorage/save model, JSON content/state patterns, Phaser/game architecture and shared Firebase/online-space architecture where already present. Extend the actual game from its current state toward a deeper complete decision loop; do not throw away working foundations to make a separate prototype.

**Expansion — what comes after**  
More story packs, additional systems, scenario modifiers, challenge runs, richer characters, optional asynchronous competition, analytics and carefully scoped educational/B2B packs.

**Monetisation — potential business model**  
Free browser entry with optional premium story packs; paid standalone editions; sponsored/commissioned scenario packs; educational licensing; B2B custom simulation work.

### Shooters Trigger

**Core fantasy**  
Experience a tense, competitive paintball match where movement, aim, tactics, pressure and teamwork determine whether the player completes the objective.

**Why someone wants to play**  
For the adrenaline of being under fire, the satisfaction of accurate shooting and movement, tactical decision-making, and the desire to beat another player or team.

**Core mechanic**  
Move, aim, shoot, take cover, manage equipment and pursue an objective such as capture-the-flag while hit detection and match rules determine the result.

**What they actually do**  
Control a character in a landscape arena, move deliberately, aim and fire, react to incoming shots, use terrain, collect or recover equipment where appropriate, and complete the objective.

**Skill — what gets better with practice**  
Aim control, movement, positioning, reaction time, target tracking, tactical awareness and controlling panic under pressure.

**Pressure — what makes it exciting**  
Incoming fire, limited visibility, objective timers, exposed movement, uncertain enemy positions and the fear of losing a life or objective.

**Training — what prepares the player**  
A safe shooting range, movement drills, aim targets, cover practice, reload/equipment practice and short AI scenarios before competitive matches.

**Progression — why they return**  
Improved player skill, character specialisations, tactical roles, new arenas, match records, tournament progression, seasonal challenges and personal statistics.

**Multiplayer — whether/how people compete**  
Core long-term opportunity. Start with local/single-device or simple online 1v1/AI-assisted testing as technically appropriate, then expand toward team matches, capture-the-flag, tournaments and shared standings.

**Story engine — how new situations are generated**  
Match scenarios, team compositions, arena conditions, objectives, character roles and tournament brackets. A future event system can introduce rotating challenges without requiring a new game build for every match.

**Educational angle — whether it can teach**  
Potentially. It can teach spatial reasoning, teamwork, communication, reaction control and tactical planning. Training should emphasise game skills rather than real-world weapon use.

**B2B angle — whether a company could buy/customise it**  
Very strong potential. A neutral base product could be branded for paintball operators with their logo, arena layouts, match modes, customer tournaments, event specials and promotional experiences.

**Content engine — whether it produces shareable moments**  
Very strong. Clutch captures, last-second flags, improbable shots, eliminations, comebacks, tournament brackets and player highlights naturally generate clips and competitive stories.

**Technical difficulty — what it actually requires**  
High. Responsive aiming and movement, hit detection, camera/landscape presentation, AI, animation, multiplayer networking, latency handling, match state, anti-cheat considerations and robust mobile controls are all significant.

**Build target — first playable from the existing platform**  
Use the existing PWA shell, localStorage/save model, JSON systems, Phaser architecture and shared Firebase/online-space architecture already established by Admin Hub Games. Build the smallest complete Shooters Trigger match loop inside that system, then expand controls, animation, AI and online play in controlled increments.

**Expansion — what comes after**  
Better animation, multiple character roles, capture-the-flag, 1v1, team modes, tournaments, online matchmaking, spectator/highlight systems, branded arenas and configurable operator experiences.

**Monetisation — potential business model**  
Free browser prototype; paid/custom branded operator versions; tournament/event packages; B2B licensing or revenue-share arrangements; optional premium competitive content.

### F1 Pedals

**Core fantasy**  
Become the driver and decision-maker inside a fictional elite open-wheel racing championship where driver skill, preparation, car development, money and race strategy all matter.

**Why someone wants to play**  
For the feeling of driving fast, improving lap times, beating rivals, building a competitive car/team and watching a season-long story develop around their performance.

**Core mechanic**  
Real-time driving control is combined with pre-race preparation: driver training, car setup/development, budget allocation, qualifying and race execution.

**What they actually do**  
Train the driver, spend limited money, configure/develop the car, qualify, drive races, react to conditions and rivals, manage the season and review the consequences.

**Skill — what gets better with practice**  
Driving lines, braking, throttle control, cornering, racecraft, consistency, situational awareness and eventually strategy.

**Pressure — what makes it exciting**  
Limited budgets, qualifying position, rival behaviour, mechanical trade-offs, race conditions, championship points and the possibility of wasting a season through poor preparation.

**Training — what prepares the player**  
Driving school, braking/corner drills, cornering practice, reaction exercises, setup tutorials and controlled test sessions before championship races.

**Progression — why they return**  
Driver development, car development, team finances, championship standings, qualifying progression, rival relationships, tournaments/seasons and unlockable scenarios.

**Multiplayer — whether/how people compete**  
Major long-term feature. Players can compete through time trials, asynchronous ghost racing, direct races, leagues, tournaments and eventually full online championship formats.

**Story engine — how new situations are generated**  
A fictional motorsport news/event system can turn changing team fortunes, weather, upgrades, rivalries, budget events and race-weekend developments into scenarios. Real motorsport can inspire generic themes, but the game should use fictional teams, drivers and events unless licensed.

**Educational angle — whether it can teach**  
Yes. It can introduce basic vehicle dynamics, physics concepts, budgeting, engineering trade-offs, probability, strategy and data interpretation.

**B2B angle — whether a company could buy/customise it**  
Potentially. Motorsport schools, karting operators, racing events, sponsors and educational programmes could use customised training/challenge versions. Commercial licensing would be required for third-party protected brands/assets.

**Content engine — whether it produces shareable moments**  
Extremely strong. Lap records, last-corner passes, crashes, qualifying surprises, budget gambles, championship comebacks and rival stories can become clips and season narratives.

**Technical difficulty — what it actually requires**  
Very high compared with the other concepts. The critical risk is driving feel: responsive controls, believable vehicle physics, camera behaviour, collision handling, track design, AI/rival behaviour, performance on mobile and eventually networked racing.

**Build target — first playable from the existing platform**  
Use the existing PWA shell, localStorage/save model, JSON systems, Phaser architecture and shared Firebase/online-space architecture already established by Admin Hub Games. Build driving feel as the first F1 Pedals gameplay slice, then layer training, car setup, budgets, qualifying, season progression and online competition.

**Expansion — what comes after**  
Driver training, car setup, upgrades, AI rivals, qualifying, race weekends, budgets, championship standings, fictional media/events, save checkpoints, tournaments, online time trials and eventually live multiplayer.

**Monetisation — potential business model**  
Free browser time trial; premium career/championship edition; cosmetic/content expansion; tournaments; branded motorsport/event experiences; educational or commercial licensing.

### Shared Studio Rule for These Three Games

Do not build all three simultaneously.

Each game must first prove its **core fun** before adding the surrounding systems.

PREP / CORE CONTROL OR DECISION
→ FEEDBACK
→ SMALL COMPLETE LOOP
→ SAVE / RETURN
→ PROGRESSION
→ MULTIPLAYER / SOCIAL
→ CONTENT ENGINE
→ B2B / MONETISATION
→ VISUAL EXPANSION

The shared Admin Hub Games platform should provide the shell, library, PWA foundation, shared identity/persistence capabilities where genuinely needed, and reusable infrastructure. Each game should own its gameplay, rules, content and presentation.

Do not create a separate Firebase project for any of these concepts merely because it is a separate game.

Do not add a game to the production library until its first playable prototype exists and passes the same Intro → Setup → Gameplay acceptance discipline used by existing games.

The immediate product question after these briefs are committed is **which existing game foundation to extend first**. This is not a greenfield prototype exercise. The product owner chooses the next game; agents must inspect the current implementation before changing architecture, and reuse the existing PWA, local persistence, JSON content systems, Phaser patterns and Firebase/shared-space patterns where they fit.
\n## Shooters Trigger — Phase A–E Mobile Combat Checkpoint — September 20, 2026

Shooters Trigger is an **IN DEVELOPMENT** game inside the shared Admin Hub Games platform.

### Product correction
The player enters their own name and joins the fixed fictional Green team:
- Player
- Operator 12
- The Heavy

The first real slice is a fictional paintball team-training scrimmage inspired by outdoor field movement, cover, teammates, opponents, getting tagged and returning to the starting point after a hit. It is arcade gameplay, not real-world weapons training.

### Authoritative mobile controls
Shooters Trigger uses **the same analog movement interaction model as Hall**.

Phone:
- fixed left analog joystick;
- generous touch region;
- centered knob with Hall-style drag feedback;
- dead zone and normalized X/Y vector;
- pointer capture;
- clean reset on release/cancel;
- fixed right FIRE action button;
- obvious FIRE pressed state;
- movement and FIRE can be held simultaneously with independent touch pointers;
- tap the playable field to establish or change aim;
- aim persists until the next aim tap;
- no second virtual aim stick;
- controls remain screen-fixed while the world/camera moves underneath;
- no keyboard is required.

Do not replace Hall-style analog movement with a D-pad or 4/8-direction button cluster.

### Mobile game loop
**Analog move → tap field to aim → hold FIRE → use cover → re-aim → reposition → react → get tagged → respawn → try a different route.**

The player should understand the interaction by playing, not by reading a manual.

### Visual composition
The phone is the primary design target. The opening view must read as a deliberate top-down pixel/arcade scene:
- two green field tones;
- thin white field boundaries;
- dark top banner;
- `GREEN BASE`;
- `TEAM TRAINING · MOVE WITH YOUR TEAM`;
- small radar upper-right;
- tree near/above the opening team;
- grey platform/cover to the team's right;
- small white field markers;
- three readable Green-team characters;
- Orange opponents deeper in the arena;
- players, cover and projectiles visually outrank decoration.

Do not fill the phone with competing status boxes or giant tactical labels.

### Character presentation
The current intermediate sprite system is procedural pixel-style arcade art with separate parts for:
- helmet and paintball mask/visor;
- vest/body silhouette;
- backpack/equipment where appropriate;
- arms;
- paintball marker;
- legs/boots;
- team accent;
- role silhouette;
- nameplate separate from the rotating body.

Animation communicates state rather than simple whole-body bobbing:
- idle breathing;
- alternating walk movement;
- role-specific rhythm;
- aim/facing rotation;
- fire recoil;
- muzzle flash;
- hit flash/stagger;
- paint contact burst;
- respawn return.

Operator/Runner are lighter/faster; Heavy/Anchor are broader/slower. Do not build character customisation or inventory before mobile combat feel is accepted.

### Character refinement checkpoint — September 20, 2026

The previous procedural pass was visually too mechanical and was rejected as the final character read.

The authoritative character rule is now:
- **Paintball soldier first:** normal human-proportioned top-down figure, not a robot, aircraft, swimming pose or rotating emblem.
- **Marker is carried normally:** held in front of the torso with both hands/forearms reading around the marker. It must never originate from or visually attach to the helmet/head.
- **Feet are the ground anchor:** the torso stays planted while walking; legs and boots alternate their placement underneath the body.
- **Walking is restrained:** no whole-body rocking, exaggerated pitch, airplane-like banking or swimming motion.
- **Aim changes the facing direction**, while the weapon remains correctly mounted to the chest/arms.
- **Idle is subtle:** breathing/equipment movement only.
- **Fire feedback is separate:** recoil and muzzle flash may move the marker briefly, but must not break the carry pose.
- **Hall remains the movement-input reference**, not a character-animation reference.
- **Arena ground follows Hall's visual language:** broad, quiet colour fields with simple readable decoration; Shooter Trigger owns its own trees, bunkers, concrete blocks and paintball-field details.

Phaser's current animation model supports frame-based directional character animation and sprite/atlas workflows; this project can move from the procedural template to authored directional sprite sheets without changing the gameplay-facing Actor role contract. See the official Phaser animation guidance: https://docs.phaser.io/phaser/concepts/animations

### Character template checkpoint — September 20, 2026

The Shooter Trigger character pass is now its own explicit contract.

Hall remains the reference for **analog movement input**, but Shooter Trigger characters must look and move as action-game characters rather than reusing Hall's two-pose flip.

Current character template:
- procedural pixel-style hard-edged silhouette;
- helmet + paintball mask/visor;
- torso/vest + belt/pouches;
- role-sized backpack/equipment;
- independently animated arms, shoulders, legs and boots;
- paintball marker + grip + muzzle flash;
- team accent;
- ground shadow;
- separate nameplate.

Role templates must remain visibly distinct:
- Player/Ayanda — balanced baseline;
- Operator 12 — compact/light tactical teammate;
- The Heavy — broad/heavy equipment and slower gait;
- Runner — lean/light opponent and faster gait;
- Anchor — broad defensive opponent and steadier gait.

Animation must communicate:
- idle breathing;
- alternating walk stride;
- arm counter-swing;
- role-specific gait;
- aim/facing direction;
- fire recoil/muzzle feedback;
- hit reaction/paint feedback;
- existing respawn return.

Do not replace this with a simple whole-body scale bob or a two-frame visibility flip.

Detailed character contract: `docs/shooters-trigger-character-template.md`.

The character system is intentionally procedural for this phase. Authored pixel sprite sheets are a later visual phase and must preserve the same gameplay-facing role contract.

### Arena / Phase E game feel
The arena must make positioning matter.

Required:
- field boundaries;
- tree/natural cover;
- grey concrete-like platform;
- secondary wooden/concrete bunkers;
- cylindrical obstacles;
- Green starting area;
- Orange opponent area;
- visible paintball travel;
- cover collision;
- teammate support;
- enemy pressure;
- hit → Green Base respawn;
- short five-point training result.

Tune in this order:
**movement → aim → fire → hit feedback → cover readability → enemy pressure → respawn timing → match duration.**

### Phase A — foundation cleanup
- removed the stale Shooter D-pad implementation;
- moved Shooter-specific mobile controls into a dedicated game module;
- left Hall's shared controls untouched;
- replaced the stale resize/UI path with a real responsive layout path;
- retained Intro → Setup → Training.

### Phase B — arena composition
The phone opening is now a readable training vignette: team cluster, tree and grey platform are placed together in the first camera composition. Additional cover, markers and the Orange side appear deeper in the arena. The field remains larger than the viewport so movement still discovers new routes.

### Phase C — character presentation
The character is assembled from independent body parts so legs, arms and marker animate separately. This is the lightweight intermediate art solution; authored sprite sheets remain a later visual phase.

### Phase D — mobile controls
The game-specific DOM layer provides:
- Hall-style analog movement on the left;
- fixed FIRE on the right;
- simultaneous multitouch;
- safe-area spacing;
- visible pressed feedback;
- tap-to-aim;
- responsive portrait/landscape sizing.

### Phase E — game feel
The local training slice now includes:
- analog player movement;
- aim-facing;
- visible paintball projectiles;
- cover collision;
- marker recoil/muzzle feedback;
- hit flashes and paint bursts;
- teammate support fire;
- Runner pressure;
- Anchor lane pressure;
- fast Green Base respawn;
- five-point training result.

### Boundaries
Do not add realtime multiplayer, matchmaking, complex inventory, large character rosters, server-authoritative networking or tournament infrastructure until this phone loop is accepted.

### Offline / PWA
This Phase A–E bundle changes the game code and its game-specific mobile-control module, so bump the service-worker cache at the release boundary.

True offline acceptance remains:
online launch → cached/installed app → disable network → reopen → enter Shooter Trigger → play training → restore network.

A GitHub checkpoint or build pass is not proof of device offline acceptance.

### Verification
Before production promotion:
1. inspect the branch and changed files;
2. production build passes;
3. Intro → Setup → Training works;
4. desktop WASD + pointer/Space works;
5. Samsung Android portrait works;
6. Samsung Android landscape works;
7. two-finger analog-move + FIRE works;
8. aim tap → movement → FIRE works;
9. cover blocks movement and paintballs;
10. hit → Green Base respawn works;
11. five-point result works;
12. offline PWA path works after a prior online launch;
13. Hall and President's Shoes remain unchanged in behaviour.

### Branch rule
Develop this pass on `shooters-trigger-hall-feel`. Do not merge or modify `main` unless the product owner explicitly asks for promotion.

### Research references
- Phaser Input: https://docs.phaser.io/phaser/concepts/input
- Phaser Pointer API: https://docs.phaser.io/api-documentation/class/input-pointer
- Rockstar Red Dead Redemption mobile touch layout: https://support.rockstargames.com/articles/CwtYAazPxaxyxtxy868jO/changing-touch-controls-layout-for-red-dead-redemption-on-android-and-ios
- Twin-stick / touch shooter usability: https://www.gamedeveloper.com/design/a-guide-to-ios-twin-stick-shooter-usability
- Mobile touch controls case study: https://www.gamedeveloper.com/design/the-challenges-of-developing-for-pc-and-mobile-part-1-controls


## Shooters Trigger — Hall-Feel Reset — September 21, 2026

The product owner deliberately reset the first Shooters Trigger gameplay slice to the smallest useful foundation.

### Current direction

Shooters Trigger is now a **single-player field-feel prototype**:
- the player is the named player themself;
- there is one player character only;
- no teammate roster;
- no enemy character roster;
- no role system;
- no AI combat layer;
- no score race or match result layer yet;
- paintball targets are static field objects, not characters.

The purpose of this slice is to make movement and presence feel right before rebuilding combat around it.

### Hall is the movement reference

For player movement, camera and walking feel, treat `GameShellScene` as the authoritative reference.

The Shooters Trigger player should preserve Hall's:
- world-scale feel;
- movement speed of 170;
- diagonal normalization;
- keyboard movement;
- mobile analog joystick behaviour;
- smooth camera follow;
- camera deadzone proportions;
- full-viewport responsive camera;
- grounded two-pose walking animation;
- alternating legs/boots rather than whole-body swimming, pitching or floating;
- player name floating above the character.

Do not redesign the movement feel while adding Shooters Trigger gameplay. If movement feels different from Hall, inspect Hall first.

### Shooters Trigger presentation boundary

The field is deliberately **not Hall copied visually**.

Keep Hall's quiet broad-field readability and grounded scale, but make the decoration paintball-specific:
- grass field;
- mown lanes;
- paintball bunkers;
- tire stacks;
- field flags;
- shooting-range targets;
- perimeter markers;
- natural trees used as cover.

The environment should evolve from this base rather than becoming a second fantasy village or a crowded tactical diagram.

### Historical control slice — superseded by Combat Presentation Refinement

The earlier Hall-Feel reset used click-to-walk and tap-to-aim. That experiment is retained as history only.

The current authoritative control slice is:
Desktop:
- WASD / arrow movement;
- mouse position = independent aim;
- left click = fire;
- Space = fire in the current aim direction;
- no click-to-walk.

Phone:
- Hall-style analog movement joystick;
- right-side drag = independent aim;
- dedicated FIRE control;
- no keyboard required;
- movement and aim can be simultaneous on separate touch pointers.

### Current gameplay slice

The player can:
1. enter the field;
2. walk around it;
3. move around/behind field cover;
4. aim;
5. fire paintballs;
6. hit static targets;
7. continue exploring.

Do not add multiplayer, team AI, character rosters, inventories, matchmaking, tournaments or server-authoritative networking until this single-player movement/presentation slice is explicitly accepted.

### Revision rule

When the next Shooters Trigger change is requested:

**Inspect Hall → preserve Hall movement feel → change only the Shooters Trigger layer → verify the field and player feel → checkpoint.**

Unexpected movement/camera behaviour = **STOP → inspect Hall and the Shooters Trigger diff → then act.**



## Shooters Trigger — Lobby + Phone Guidance Contract — September 21, 2026

The Home Field is an open-order physical lobby. The player may visit any destination at any time; the game does not hard-lock locations. The world should teach where places are, while the phone provides contextual guidance about what to do next.

### Physical lobby destinations

The lobby has four physical destinations:
1. **Shooting Range** — build shooting evidence.
2. **Evasion Yard** — build evasion, cover and survival evidence.
3. **Armory & Outfitter** — spend earned in-game budget on preparation.
4. **Arena** — open physical match field; preparation affects the match, not access.

There is **no physical Media Bureau** in the lobby. Media/coverage is a player-memory function delivered through the phone and result/coverage scenes. Do not add a media building, desk, camera station or fifth destination merely to justify narrative coverage.

### Phone guidance

The phone is the lobby's lightweight guidance and memory layer. It should behave like a personal message/notes device, not a tutorial wall.

For a new player:
- first message: welcome and recommend Shooting Range;
- after a shooting record: recommend Evasion Yard;
- after both training records: explain that Arena is open, with optional retraining/Armory preparation;
- after an Arena result: acknowledge the result and recommend retraining/preparation before another attempt.

The phone must explain **why** the next activity matters using the actual recorded state. It must not invent performance claims or expose hidden formulas.

The phone guidance is advisory. The player can close it and walk directly to any physical destination.

### Starting economy

A new player should begin with **no earned budget**. Arena outcomes create the first meaningful opportunity to earn budget. Existing saved budget must be preserved; do not silently reset returning players.

### Design loop

**ARRIVE → TRAIN → RECORD → PREPARE → ARENA → EARN → RETRAIN / UPGRADE → ARENA AGAIN**

The player's shooting/evasion evidence remains the source of progression. Do not replace the Good / Really Good / exceptional hit-quality model in the game contract with generic XP grinding.

## Shooters Trigger — Combat Presentation Refinement — September 21, 2026

This is the authoritative refinement layer for the current single-player Shooters Trigger slice. The objective is not merely to make the existing controls prettier; the objective is to make the player read as a believable paintball participant and make movement, aim, weapon handling and firing agree frame-by-frame.

### Character clothing / equipment contract

The player must visibly read as a **paintball player**, not a generic green blob or a head with a gun attached.

The procedural character should communicate:
- full-face paintball mask with visible visor/lens;
- helmet/mask shell;
- protective jersey/body layer;
- chest/shoulder protection;
- pod harness / equipment belt;
- gloves/hands;
- pants separated from torso;
- boots as the ground anchor;
- marker with stock, grip, hopper/loader, barrel, sight and air/tank detail;
- small team accent without turning the player into a mascot.

The body is layered. The torso, legs and feet remain the stable ground-facing mass; combat layers (arms, marker, recoil and muzzle flash) are allowed to respond to aim/fire independently.

### Aim truth

There are two valid aim states:

1. **Movement default:** before the player has supplied an explicit aim input, the current movement vector becomes the aim vector. Therefore diagonal movement produces diagonal facing and diagonal projectile travel instead of a permanently horizontal first shot.
2. **Explicit combat aim:** after mouse movement or the mobile right-side drag establishes aim, movement and aim become independent. The player can strafe, retreat, circle and fire in another direction.

The projectile, marker barrel, hands/forearms and reticle must all agree with the same normalized aim vector.

Never hard-code a left/right firing axis. Phaser's coordinate system uses radians with 0° pointing right, 90° down, 180° left and -90° up; use atan2(aim.y, aim.x) and the same vector for weapon rotation and projectile velocity.

### Weapon handling / firing animation

Firing is a short animation state, not just a new projectile:
- marker moves backward along its local barrel axis for a brief recoil pulse;
- braced forearms remain connected to the marker;
- muzzle flash appears at the actual muzzle;
- projectile spawns from that muzzle position;
- muzzle flash and recoil decay quickly so repeated fire remains readable;
- the character body does not spin or pitch with the weapon.

The current implementation uses procedural frame-like layers rather than a large authored sprite sheet. This is intentional: it gives us a cheap animation rig now while preserving a stable path to authored directional sprite sheets later. Phaser supports frame-based sprite-sheet/atlas animation when that art phase is justified.

### Animation quality bar

A believable top-down shooter character needs more than whole-body bobbing. Prioritize:
- grounded feet and alternating stride;
- stable upper body while aiming;
- arms/forearms braced around the marker;
- explicit fire/recoil state;
- visible muzzle feedback;
- restrained idle movement;
- future hit/stagger/reload states as separate additions.

Do not add a giant animation system or skeletal dependency prematurely. Layered procedural parts are the current production solution; authored 4/8-direction sprite sheets are the next visual phase only after this core is accepted.

### Verification scenarios for this refinement

The acceptance test must include all of these, not just “the player can shoot”:
- stand still and fire right;
- stand still and fire left;
- stand still and fire up;
- stand still and fire down;
- walk up-right and fire up-right before touching aim;
- walk down-left and fire down-left before touching aim;
- move diagonally while holding an explicit opposite aim;
- strafe while maintaining a fixed aim;
- fire repeatedly and visually confirm recoil/muzzle flash on every shot;
- confirm the paintball starts at the barrel muzzle rather than the character centre;
- confirm cover stops the projectile;
- phone: left joystick + right drag aim + FIRE simultaneously;
- phone: diagonal movement without explicit aim still produces diagonal default fire;
- phone: explicit aim overrides movement direction.

### Research basis

Current top-down/twin-stick references reinforce independent movement and aim as the core combat interaction, with left-side movement and right-side aiming on touch devices. Current character-animation guidance also emphasizes stable upper-body aiming, connected weapon/hand placement, layered body parts, and small readable firing reactions rather than a giant full-body animation. Phaser's documented transform model supports keeping the player container stable while rotating child combat layers and using frame-based sprite animation later.

Reference sources:
- Phaser Containers: https://docs.phaser.io/phaser/concepts/gameobjects/container
- Phaser rotation / transform: https://docs.phaser.io/phaser/concepts/actions
- Phaser frame animations: https://docs.phaser.io/phaser/concepts/animations
- KIDA twin-stick fundamentals: https://www.kidastudios.com/apps/captain-star/guides/twin-stick-space-shooter-tips.html
- GameDeveloper mobile twin-stick usability: https://www.gamedeveloper.com/design/a-guide-to-ios-twin-stick-shooter-usability
- Charios top-down shooter animation: https://charios.com/blog/top-down-shooter-character-animation-guide
- Paintball equipment reference: https://sportsfoundation.org/paintball-equipment-list/

### Revision rule

When a player-facing combat problem is reported, inspect the actual rendered relationship between feet → torso → arms → marker → muzzle → projectile → reticle before adding another control or visual effect. Fix the shared source of truth rather than patching one direction or one device.

Unexpected direction, animation or weapon alignment = **STOP → inspect vector, transform parent, muzzle origin and rendered layer order → simplify/fix → build → verify all four cardinal directions + diagonals → checkpoint.**


## Shooters Trigger — Combat Feel Refinement — September 21, 2026

The next refinement preserves the accepted Hall movement foundation but makes Shooter controls and weapon presentation follow established top-down shooter conventions.

### Input contract

**Desktop**
- WASD / arrows = movement.
- Mouse = independent aim.
- Left click = fire.
- Space = fire using the current aim.
- Do not use click-to-walk in the shooter. Hall's movement *feel* is the reference; shooter combat requires movement and aim to remain independent.

**Phone**
- Left virtual joystick = movement.
- Right-side drag zone = independent aim.
- FIRE button = firing.
- Do not use a world tap as an additional aim control.
- The right aim gesture should begin under the player's thumb (floating-origin behaviour), then preserve its direction while dragged.
- Avoid requiring players to look down at a collection of tiny controls.

This follows the established twin-stick principle: movement and aim are independent, allowing retreating, strafing and circling while maintaining fire. Current control research describes left-stick movement + right-stick aim as the standard mobile pattern, while mouse-aim + keyboard movement is a common desktop pattern. See references in the implementation research log if this changes again.

### Character / weapon contract

The player body and weapon are separate render layers.

The body:
- remains grounded and readable;
- keeps Hall's two-pose walk rhythm;
- has visible helmet, face/visor, vest, arms, separate legs and boots;
- must not rotate the whole character to follow the weapon.

The weapon:
- rotates continuously toward the independent aim vector;
- has a stock, grip, marker body, barrel, sight and two hand connection points;
- muzzle position is the source of the projectile spawn;
- must visually agree with the projectile direction.

This prevents the old failure where the character appeared to hold a weapon in the walking direction while the projectile travelled somewhere else.

### Aiming presentation

The aim reticle is deliberately restrained:
- thin crosshair;
- no permanent centre dot;
- no oversized target circle;
- it should help confirm aim without becoming a second gameplay object.

The weapon itself is the primary directional feedback. If the muzzle and projectile disagree, treat that as a bug.

### Projectile contract

Paintballs/projectiles must originate from the weapon muzzle, not from an arbitrary point in front of the player's body.

A fire action must:
1. use the current aim vector;
2. position the projectile at the muzzle;
3. travel on that same vector;
4. use a visible but restrained projectile;
5. respect cooldown;
6. stop at field cover.

### Refinement rule

When improving Shooter Trigger visuals, prefer **small readable sprite layers and animation states** over making the entire character more complicated.

Useful future states:
- idle;
- walk A/B;
- aim;
- fire recoil;
- hit;
- reload;
- crouch/cover if gameplay eventually needs it.

Do not add all states at once. Add one, verify it, then checkpoint.

### Control-quality rule

If a control can be removed without reducing expressive gameplay, remove it.

Unexpected ambiguity = **STOP → inspect the input path and rendered direction → simplify → verify → checkpoint.**


## Shooters Trigger — Person + Aim-First Control Refinement — September 21, 2026

The current refinement makes two product-owner decisions authoritative:

### The player is a person wearing paintball gear

The character must read as a simple human first, paintball player second:
- visible head/face/skin silhouette;
- helmet and full-face paintball mask worn around the head;
- visible neck and shoulders;
- recognizable torso and hips;
- separate legs and boots;
- protective jersey/chest gear and pod harness layered over the body;
- marker held by visible arms/hands rather than floating beside or above the body.

Do not solve “paintball player” by adding more equipment to an ambiguous silhouette. If the character reads like invisible equipment, simplify the gear and strengthen the human anatomy.

### Aim drives fire

The current shooter uses an aim-first combat contract:
- movement joystick / WASD controls movement only;
- mouse position / phone right-side drag controls aim;
- the current normalized aim vector is the firing direction;
- firing never silently changes direction because the player is walking;
- movement and aim remain independent so the player can strafe, retreat or circle while continuing to shoot in the chosen direction;
- before the first explicit aim input, keep the stable initial aim rather than deriving aim from movement.

This is the intended top-down/twin-stick relationship: independent movement and aim are the core interaction, and the firing system consumes the aim vector.

### Mobile firing control

The mobile firing control is now icon-led rather than text-led:
- no persistent word “FIRE” inside the button;
- use a compact target/shoot icon;
- keep the button large, obvious and thumb-friendly;
- accessibility label may still describe the action as “Shoot”;
- hint copy is “MOVE · AIM · SHOOT”.

### Acceptance test for this refinement

- stand still, aim right, shoot right;
- stand still, aim left/up/down, shoot in the selected direction;
- walk diagonally while holding a different aim direction; shots must continue along the aim direction;
- walk/strafe without changing aim; shots must not snap toward movement;
- phone: left joystick + right aim drag + shoot button simultaneously;
- verify the player reads as a human in paintball equipment at normal phone scale;
- verify the marker is held by the person and not attached to the head;
- verify recoil/muzzle flash remain aligned to the marker and projectile;
- verify Hall and President's Shoes remain unchanged.

### Revision rule

If the player looks like gear without a person, stop adding equipment. Inspect the head → neck → shoulders → torso → hips → legs → boots silhouette first, then re-layer the paintball equipment around that human base.


## Shooters Trigger — Fire-Button Aim Contract — September 21, 2026

The mobile controls are intentionally simple:
- **Left MOVE stick:** movement only. It must never change aim.
- **Right FIRE control:** aim + shoot. The player presses/drags from the fire control; drag direction sets the aim vector and holding the control fires along that vector.
- The separate large right-side AIM zone is no longer the authoritative aiming input.
- The marker, muzzle flash and projectile must all consume the same aim vector produced by the fire control.
- Releasing the fire control stops firing; movement continues independently.
- The fire control should remain icon-led, with no persistent “FIRE” word.

Acceptance test:
- left stick only = player moves, marker direction does not change;
- press/drag fire control right = marker aims right and fires right;
- press/drag fire control up-left = marker aims up-left and fires up-left;
- hold fire while moving diagonally = player moves diagonally while continuing to aim/fire from the fire control direction;
- releasing fire stops shooting without stopping movement.


## Shooters Trigger — Training Targets + Paint Persistence — September 21, 2026

The training field now uses **shootable static targets** rather than enemies or character opponents.

### Target contract
- The range contains a mix of upright dummy targets and paintball bottles.
- Targets are shootable field objects and do not become AI characters.
- A successful hit leaves a visible paint splatter **on the target**; the splatter remains after the projectile disappears so the player can see accumulated shooting evidence.
- Targets do not need to disappear for a hit to count. This is a training range, so persistent paint marks are the intended feedback.
- The player remains the only character in this slice.

### Character readability contract
The player must read as a visible human wearing paintball gear, not as an equipment silhouette:
- human head/face area is visually separated from helmet and mask;
- jersey/torso, pants and boots use distinct visual layers and values;
- gloves/arms connect the person to the marker;
- marker remains held in the hands and aligned with the aim vector;
- equipment should support the human silhouette, not hide it.

### Acceptance test
- enter the shooting range;
- fire at a dummy: it visibly receives paint and keeps the splatter;
- fire at a bottle: it visibly receives paint and keeps the splatter;
- hit multiple targets and confirm previous splatters remain;
- confirm no target becomes a character/enemy;
- confirm the player remains clearly readable as a person at normal phone scale;
- confirm left MOVE never changes aim;
- confirm the right FIRE control both aims and shoots;
- confirm releasing FIRE stops firing while movement continues.

## Shooters Trigger — Full Game Direction Lock — September 21, 2026

The product owner has now completed a real phone playtest of the current live/main Shooter slice. The current field shooting foundation is accepted as a good basis: movement, independent aiming/fire, paintball projectiles, targets and persistent paint feedback are enjoyable enough to build the actual game around. The next pass is therefore **not a controls rewrite** and not a generic mobile-shooter feature dump. It is the completion of a small, replayable, narrative paintball training-to-arena game.

### Product promise

Shooters Trigger is a **phone-first paintball field story about becoming good enough to win through training, positioning, evasion, cover, shooting discipline and decisions**.

The player should feel:
- “I am the player being trained.”
- “The field taught me something.”
- “My training changed my strengths and weaknesses.”
- “The media coverage remembers what I did.”
- “The arena match tests what I learned.”
- “My result is explained by my actions, not a random score.”

Do not turn the game into Call of Duty, a loot shooter, a generic military game, or an online-first multiplayer project.

### Four-location / four-scene game structure

The intended complete single-player journey is:

```
GAME INTRO
   ↓
ENTER / SETUP
   ↓
LOBBY / HOME FIELD
   ↓
SHOOTING LOCATION
   ↓
EVASION CAMP
   ↓
MEDIA COVERAGE CENTER
   ↓
ARENA
   ↓
MEDIA COVERAGE / RESULT
   ↓
REPLAY / RETRAIN / RESET
```

The four game locations are:
1. **Shooting Location** — learn and establish shooting skill.
2. **Evasion Camp** — learn movement, cover, survival and field positioning.
3. **Media Coverage Center** — narrative/statistical interpretation, budgets, preparation and pre-match statements.
4. **Arena Location** — 3v3 culmination where the player's training and choices are tested.

The existing Admin Hub publisher intro and Game Library remain shared infrastructure. Do not duplicate or bypass them.

### Scene ownership and progression

The current Shooter Intro → Setup → Training path is only the first slice. The final game must preserve the product flow principle:

```
Publisher Intro → Game Library → Shooters Trigger Intro
→ Shooter Setup
→ Lobby
→ Shooting Training
→ Lobby / latest stats
→ Evasion Training
→ Lobby / latest stats
→ Media Coverage
→ Arena
→ Media Coverage / Results
```

Training must produce durable player state. Returning to the lobby must visibly acknowledge the latest training result and make the next location available.

### Player progression is skill-based, not level-grinding

The core player model should be a small set of understandable attributes derived from what the player actually did.

At minimum:
- **Shooting:** hit quality, body/center-mass accuracy, weapon-hand hits and misses/scrapes.
- **Evasion:** survival, movement under pressure, cover usage, escapes and damage avoided.
- **Cover / positioning:** how often the player used cover effectively and how often shots struck cover instead of the player.
- **Combat discipline:** shots fired, meaningful hits, ineffective shots and wasted exposure.
- **Arena record:** match actions and result, kept separate from raw training skill.

Avoid a single opaque “power” number. The player should be able to understand why each stat moved.

### Shooting model

The shooting training should evolve the current dummy/bottle range rather than discard it.

The game should distinguish hit locations/effects as a readable skill ladder:
- **scrape / peripheral contact:** common and acceptable at lower skill;
- **gun/marker-hand hit:** meaningful intermediate success;
- **center-mass body hit:** strong hit;
- **two center-mass body hits:** elimination threshold in the intended arena model;
- **headshot:** exceptional precision and immediate elimination in the intended arena model.

These are gameplay abstractions, not claims about real-world paintball rules. Keep them readable and consistent.

A training session should record enough evidence to calculate:
- shots fired;
- shots that miss completely;
- shots that hit cover;
- peripheral/body scrapes;
- marker-hand hits;
- center-mass hits;
- exceptional/head hits;
- hit rate / accuracy;
- time under pressure where relevant.

The important design principle is **quality of hits**, not simply number of projectiles fired.

### Weapon-hand / body hit presentation

The player's body is the source of readable combat feedback.

When a shot lands:
- peripheral/body scrape should look and sound different from a strong hit;
- a marker-hand hit should visibly communicate that the player lost control/was compromised;
- a strong body hit should create a clear combat consequence;
- exceptional hits should be rare, highly readable and satisfying.

Do not use gore. Paint, equipment reaction, stagger, marker drop/disable, paint splat and short hit feedback are enough.

### Cover is directional gameplay

Tyre stacks, bunkers/barracks and similar field structures are not just decoration.

They should provide **directional protection**:
- standing in front of cover does not automatically protect the player;
- the player must move behind the useful face of the object;
- incoming shots should be blocked by the physical cover;
- the result should teach the player to read angles and reposition.

This creates the central tactical loop:

```
SEE THREAT → MOVE → GET BEHIND COVER → PEEK / AIM → SHOOT → REPOSITION
```

Do not replace this with a universal shield bubble.

### Evasion training

The second training location is a survival/positioning test.

The intended first challenge is **1 player vs 3 opposing characters** for approximately one minute.

The player succeeds by:
- surviving the full duration; or
- learning from the number/quality of incoming shots and how effectively they were avoided.

The result should account for:
- bullets/paintballs fired at the player;
- shots that miss completely;
- peripheral scrapes;
- stronger hits;
- cover hits/blocked shots;
- time survived;
- effective cover use;
- escape/reposition behaviour.

The user's proposed bonus for shots hitting cover is retained as a design direction: repeated cover interception is evidence that the player understood positioning. Balance it so players cannot farm score by deliberately standing behind one object forever.

### Training-to-arena character model

The eventual 3v3 arena should not be a random enemy generator.

The first three opposing characters should be connected to the player's training history. Re-training should alter their readiness:
- one opponent trains well;
- one trains moderately;
- one trains less effectively.

The player's own two teammates should be **neutral/supportive**, not hidden stat advantages. They should be useful enough to make a 3v3 match readable, but the player's own skill must remain the decisive agency.

This means the player is never simply handed a guaranteed team advantage.

### Media Coverage is the connective tissue

Media Coverage is not a cosmetic news screen.

It is the game's **memory and explanation layer**.

It should cover:
- training performances;
- strengths and weaknesses;
- opponent readiness;
- map/field familiarity;
- budget;
- equipment preparation;
- pre-match thoughts/feelings;
- arena actions;
- final result;
- which preparation choices mattered.

Before entering the Evasion and Arena scenes, each relevant player should be able to state a short thought/feeling/preparation line. These statements become part of the match narrative and result coverage.

After each training session, the coverage should say what changed without exposing hidden formulas.

After the arena, the coverage should reconstruct what happened from the recorded match data.

Do not fabricate “journalism” detached from gameplay state.

### Odds / predictions

Media coverage may present **contextual odds or expectations** derived from documented in-game training evidence.

The presentation must be:
- clearly fictional/in-game;
- based on the current player/opponent state;
- explainable;
- not a hidden random winner selector.

Use phrases such as “field expectation”, “readiness”, “projected edge” or similar game-native language rather than presenting fake real-world certainty.

The player should be able to see why an expectation changed after retraining.

### Budget and equipment

Training performance generates an in-game budget/reward.

Budget is part of the story:
- better training outcomes can lead to more resources;
- resources can be spent before the arena;
- purchases must have understandable effects;
- equipment can improve a shooting or evasion attribute or provide a limited special move;
- special moves should be limited per match rather than becoming permanent button spam.

Examples:
- shooting gear → modest shooting improvement;
- movement/evasion gear → modest evasion improvement;
- one special offensive action;
- one special defensive/counter action.

The important loop is:

```
TRAIN → EARN → CHOOSE HOW TO SPEND → MATCH → DISCOVER WHETHER IT HELPED
```

The player's exact special-use outcome should be revealed in the match/results coverage rather than advertised as a guaranteed win.

Do not introduce currencies, shops, monetisation or grind systems unless explicitly requested. This is an in-game budget/story mechanic.

### Retraining and replayability

Retraining is a first-class loop.

The player can:
- repeat shooting training;
- repeat evasion training;
- improve or worsen recorded performance;
- change media coverage;
- change opponent readiness;
- change budget;
- change arena preparation;
- replay the arena with a different preparation state.

This creates replayability through **mastery and experimentation**, not artificial energy limits or daily timers.

### Psychology / engagement principles

The game should use a tight feedback loop:

```
ACTION → IMMEDIATE FEEDBACK → UNDERSTANDING → ADJUSTMENT → RETRY
```

Research on flow and game-system learning emphasizes concrete goals, appropriately challenging tasks, timely feedback and reduced distraction. Feedback close to the action helps players connect their action to its result.

Apply that directly:
- shooting hit feedback appears immediately;
- evasion feedback is immediate enough to understand why a shot was avoided or landed;
- training summaries explain the change;
- media coverage gives the longer-term interpretation;
- the next challenge increases complexity gradually.

Use **mastery** rather than grind:
- “Can I hit center mass more consistently?”
- “Can I survive longer?”
- “Can I use the bunker correctly?”
- “Can I beat the same opponent after they improve?”
- “Can I win with less equipment spending?”

Avoid clutter. Mobile action research repeatedly emphasizes independent movement/aim and keeping controls expressive without forcing the player to stare at the interface.

### Mobile-first combat presentation

Preserve the accepted phone control model:
- left MOVE joystick;
- right FIRE control that establishes aim and fires;
- simultaneous movement + aim/fire;
- no keyboard dependency;
- no giant HUD;
- no collection of tiny action buttons.

The player should watch the field, not the controls.

The current accepted shooting feel should be protected while the game loop is built around it.

### Character animation / directional depth

The player requested more depth when firing inward, outward and at diagonal angles.

This is a presentation priority, not permission to rotate the whole body.

The intended model:
- stable grounded human body;
- upper-body/arms/marker combat layer follows aim;
- weapon orientation changes continuously;
- marker/arms can use directional offsets;
- inward/outward/diagonal aim can alter the apparent side, overlap and depth of the marker/arms;
- recoil/muzzle flash originate from the actual barrel;
- future 4/8-direction authored sprite sheets remain an option if procedural layers hit their quality ceiling.

The test is visual truth: **feet → body → arms → marker → muzzle → projectile** must agree.

### Four scene design language

Use the lessons already present in the other Admin Hub Games:

**Hall**
- establishes the value of a place/lobby;
- movement and exploration can make a location feel like a world;
- keep its proven movement/camera feel as reference, not as Shooter art.

**President's Shoes**
- demonstrates structured setup;
- stateful progression;
- consequences;
- readable stats;
- narrative result screens;
- replay and saved local state.

**Shooters Trigger**
- combines those lessons with action:
  place → train → record → interpret → prepare → compete → report → replay.

Do not copy Hall's fantasy-world presentation or President's Shoes' decision-story mechanics literally. Reuse the structural lessons.

### Persistence / offline-first contract

Shooter state must be local-first.

Persist enough to survive:
- app close/reopen;
- retraining;
- returning to the lobby;
- offline play.

Firebase should be used when shared/cloud persistence genuinely adds value:
- training records;
- media coverage/history;
- arena results;
- syncable player progress where appropriate.

When offline:
- gameplay must continue;
- results must save locally;
- pending shared writes go to the existing outbox/sync mechanism;
- when connectivity returns, queued records sync;
- duplicate sync must not create duplicate match/training records.

Do not create a new Firebase project.

### Data model direction

Keep a compact explicit state model. Prefer versioned records over scattered localStorage keys.

A future Shooter save should conceptually contain:
- player identity;
- training attempts;
- current shooting skill breakdown;
- current evasion/cover skill breakdown;
- budget;
- equipment choices;
- opponent readiness;
- teammate neutral state;
- pre-match statements;
- arena match record;
- media coverage entries;
- schema/version metadata.

Training attempts should remain auditable enough to explain later coverage.

### Completion boundary for the first real game

The first complete Shooters Trigger release does **not** require:
- online multiplayer;
- matchmaking;
- accounts;
- server-authoritative combat;
- large weapon inventories;
- cosmetics store;
- currencies for monetisation;
- dozens of maps;
- giant AI armies.

It **does** require:
1. four locations/scenes;
2. working shooting training;
3. working evasion/cover training;
4. persistent player stats;
5. meaningful training results;
6. media coverage before/after the arena;
7. budget/equipment preparation;
8. a readable 3v3 arena simulation/gameplay layer;
9. final match results grounded in recorded actions;
10. local-first persistence and eventual Firebase sync;
11. replay/retraining;
12. real phone verification.

### Build order after this direction lock

Do not jump straight to the 3v3 arena.

Use this controlled sequence:

```
1. LOCK current shooting feel
2. Build shooting-training state + results
3. Build lobby return + persistent latest stats
4. Build evasion/cover training
5. Build media coverage state + pre-scene statements
6. Build budget + limited equipment choices
7. Build arena 3v3 from recorded training state
8. Build post-match media/results
9. Add retraining/replay loop
10. Full phone + offline + regression verification
```

At every stage:
**Inspect → one controlled change → review → run → verify → checkpoint.**

### What is explicitly out of scope until the above works

Do not add:
- online multiplayer;
- matchmaking;
- team management systems;
- large weapon/loadout trees;
- cosmetic economy;
- social accounts;
- live PvP infrastructure;
- procedural content generators;
- excessive HUD controls.

### Research basis for this direction

The mobile control foundation is consistent with established twin-stick design: independent movement and shooting, left-side movement/right-side aiming, forgiving touch interaction and minimizing the need to look at the controls.

Game-design research also supports the intended engagement loop: clear goals, challenge matched to skill, immediate feedback, low distraction, learning through repeated system feedback, and meaningful player agency.

Paintball itself provides a useful conceptual foundation for body/equipment hits, cover and close-range positional play, but Shooter Trigger's hit thresholds are fictional game rules and should remain internally consistent rather than pretending to simulate tournament regulations.

### Direction-lock rule

This section is the current product direction for completing Shooters Trigger.

If a proposed feature does not strengthen:
**shoot → move → cover → train → learn → prepare → compete → understand → retrain**, 
it should not enter the first complete release without explicit product-owner approval.

## Shooters Trigger — Lobby / Location Architecture Lock — September 21, 2026

The Shooters Trigger foundation is now explicitly built around the **Hall-style place/lobby model**, not a menu pretending to be a world.

### Lobby rule
After Shooters Trigger Setup, the player enters **SHOOTERS TRIGGER · HOME FIELD** and can physically walk around the field. The lobby is the player's unarmed home base.

**Critical presentation rule:** the player is **unarmed in the lobby**. The paintball marker/weapon exists only inside action gameplay scenes. Do not put a weapon in the lobby player sprite merely because the action player has one.

The lobby contains the five real locations:
1. **Shooting Location** — AIM · HIT QUALITY · REWARD
2. **Evasion Camp** — MOVE · COVER · SURVIVE
3. **Media Coverage Center** — STATS · THOUGHTS · EQUIPMENT
4. **Arena Location** — 3v3 · FIRST TO 3 KILLS
5. **Equipment Store** — BUY UPGRADES · SPEND BUDGET

The four locations are part of the actual game world, not four buttons on a static home menu.

### Structural model

    Shooter Intro
       ↓
    Shooter Setup / player name
       ↓
    Shooter Home Field / Lobby
       ↓
    walk to a physical location
       ↓
    location-specific scene
       ↓
    action OR information / decision interaction
       ↓
    record result/state
       ↓
    return to Home Field
       ↓
    latest state is visible in Media Coverage / preparation

**Hall lesson:** the lobby should be enjoyable to walk around and should make the locations feel like places.

**President's Shoes lesson:** non-action locations should use readable scene transitions, information panels, inputs and explicit choices rather than forcing everything into gameplay.

### Scene classification

**Action scenes** use the accepted Shooter combat controls and field presentation:
- Shooting Location;
- Evasion Camp;
- Arena.
- Equipment Store: a non-action purchasing scene/interaction.

**Information / preparation scenes:**
- Media Coverage Center.

Buying equipment, choosing preparation, reading stats, entering a thought/feeling, and reviewing coverage are **not action gameplay**. Equipment purchases happen in the physical Equipment Store and spend the player's persistent budget. They should use the President's Shoes-style scene/panel structure: clear information, input where needed, explicit confirmation, then return to the field.

### Training result contract

Shooting and evasion sessions must end with an explicit completion/result action. Do not silently throw the player back into another scene.

A completed action session must:
1. calculate the session evidence;
2. save it locally;
3. update the player's persistent skill breakdown/budget where applicable;
4. show a readable result/coverage summary;
5. provide a clear **CLOSE / RETURN TO HOME FIELD** action;
6. make the new state available to Media Coverage and later Arena preparation.

The next implementation pass must connect the current shooting range's real hit evidence into this contract rather than replacing the accepted shooting feel.

### Current implementation checkpoint

The current main branch now contains the structural Shooter flow:

    Intro → Setup → Home Field Lobby
                         ↓
            ┌────────────┼─────────────┐
            ↓            ↓             ↓
       Shooting      Evasion        Media
            ↓            ↓             ↓
            └────────────┼─────────────┘
                         ↓
                       Arena

The current action scenes are still an evolving V1 slice. Do not treat placeholder result math, opponent behaviour or arena logic as final. The next controlled work is to connect the existing accepted shooting mechanics and real session evidence to persistent state/results, make Evasion use the same action foundation as Shooting with movement + cover + incoming bots, then deepen the Equipment Store, media preparation and arena combat without destroying the lobby.

### Improvement-over-destruction rule

When continuing Shooters Trigger:
- preserve the current working shooting feel;
- preserve the Hall game unchanged;
- preserve the existing Intro → Setup handoff;
- improve one scene/contract at a time;
- never replace the lobby with a static menu just because scene navigation is easier;
- never arm the lobby player;
- never add a weapon/fire control to non-action scenes;
- never throw away working controls to implement a new feature;
- if an unexpected result appears, STOP → inspect reality → then act.

The intended player experience is:

**walk → discover → enter → act or decide → understand → close → return → see what changed → prepare → act again.**


### External design check — September 21, 2026

The lobby → focused activity → immediate result → return/review loop is consistent with established game-UX guidance: clear goals, timely feedback, progressive introduction of mechanics, and visible long-term progress help players connect actions to outcomes and learn systems. The Shooter implementation should therefore keep the world/lobby exploratory while keeping each training/combat scene focused on one teachable task, then use Media Coverage as the longer-term interpretation layer.

Research reference: GameDeveloper discussions on cognitive flow and feedback, tutorial progression, player agency/context, and gameplay flow were reviewed while locking this architecture. These are design references, not hard rules; actual player testing remains the acceptance authority.


## Shooters Trigger — Persistent Performance, Budget & Equipment Contract — September 21, 2026

The Shooter player's persistent state is **performance-driven**, not decorative.

### Performance changes the player
Shooting and Evasion results must feed back into the player's persistent state:
- shooting accuracy/hit-quality evidence influences shooting skill;
- movement, survival, cover and incoming-shot evidence influences evasion/cover skill;
- meaningful performance can change the player's earned budget/reward;
- retraining can improve or worsen the recorded state depending on actual results;
- Media Coverage must explain what changed in player-readable language.

Do not treat training results as numbers that disappear after the result screen. The point of training is to change the player's preparation for the next activity.

### Training → Arena connection

The Arena must use recorded preparation state to make the match meaningfully different.

A player's accumulated:
- shooting skill;
- evasion/cover skill;
- equipment;
- preparation;
- training history

must influence the player's effectiveness in the 3v3 Arena.

This should create an understandable engagement loop:

```
TRAIN
  ↓
PERFORM
  ↓
EARN / IMPROVE
  ↓
SPEND / EQUIP
  ↓
ENTER ARENA
  ↓
FEEL THE DIFFERENCE
  ↓
RESULT
  ↓
RETRAIN
```

The player should become **better prepared through demonstrated performance**, not through an arbitrary level-up button.

### Evasion evidence

Evasion training must record useful evidence including:
- survival time;
- incoming shots;
- complete misses;
- peripheral scrapes;
- stronger hits;
- shots intercepted by cover;
- effective cover usage;
- reposition/escape behaviour.

That evidence must feed the player's evasion/cover preparation and later Arena effectiveness.

### Equipment / weapon effects

Equipment is part of the persistent preparation state.

Weapons and other equipment must have understandable gameplay effects on relevant attributes. This applies to:
- the player;
- Arena opponents/bots;
- opponent preparation/budget where the game model gives them equipment.

Equipment should therefore affect actual match behaviour/stats rather than being cosmetic labels.

The player's Equipment Store purchase must:
1. show the cost and understandable effect;
2. require explicit confirmation;
3. deduct persistent budget;
4. persist the selected equipment;
5. affect the appropriate player attribute/behaviour in later action;
6. be visible to Media Coverage where useful.

Bots/opponents should use the same broad preparation logic where appropriate: their training/readiness, budget and equipment contribute to their effective match state. Do not create arbitrary hidden advantages just to force an outcome.

### Engagement principle

The purpose of this system is not to make the game grindy. It is to make preparation **matter**.

The player should be able to notice:

> “I trained better, earned more, bought better equipment, and now I can actually feel the difference in the Arena.”

The difference must remain understandable and skill-driven. Training/equipment can improve readiness, but they must not turn the Arena into an automatic win.

This is now a locked product contract for the first complete Shooters Trigger release.

## Shooters Trigger — Location Entry Control Checkpoint — September 21, 2026

The Home Field lobby must expose an obvious contextual interaction control when the player reaches a physical location.

Required behavior:
- walk/joystick the unarmed player toward a location;
- show a large touch-friendly contextual action button near the bottom of the phone viewport;
- keep keyboard **E** as the desktop/keyboard equivalent;
- hide the action when the player is not close enough;
- label the action with the actual location, e.g. **ENTER ARENA LOCATION**;
- Equipment Store must open an explicit purchase confirmation rather than spending budget merely because the player arrived;
- action scenes must expose their mobile movement controls through the shared Shooter mobile-control layer;
- Evasion is movement/cover only and must not show a fire button;
- Arena and Shooting expose movement plus aim/fire controls;
- action sessions must have an explicit close/save or exit path so a playthrough cannot dead-end.

This is part of the acceptance loop:
**walk → see location → enter/confirm → play/decide → save/exit → return to Home Field**.


## Shooters Trigger — Git Checkpoint — September 21, 2026

The current Shooter Trigger implementation checkpoint is committed on `main`. The latest source checkpoint includes the mobile location-entry controls, shared action-scene controls, explicit session close/save paths, Arena exit/movement controls, Evasion touch movement/close control, and explicit Equipment Store purchase confirmation. The build-fix for the malformed training source is also part of this history.

Current source-of-truth HEAD: `42202e8cf508e2cd0e39432f1af2136db47063e8`.

When continuing from here, treat this as the recovery point and continue with controlled gameplay improvements rather than recreating these changes.

## Shooters Trigger — Open Home Field / Guest-Style Player Agency Lock — September 21, 2026

The Home Field is an **open preparation space**, not a mandatory checklist.

After Shooter Intro → Setup → Home Field, the player should feel like a guest arriving at a real training facility: they can walk around, discover places, choose what interests them, and decide how much preparation they want before entering the Arena.

### Freedom of order

The underlying product progression remains intentional:

```
discover → train / review / prepare → compete → understand → retrain
```

But the player-facing order should remain flexible.

From Home Field, the player may choose to:
- go straight to Shooting;
- go straight to Evasion;
- visit Media Coverage first;
- visit the Equipment Store;
- enter the Arena with little or no preparation;
- train repeatedly before competing;
- spend budget aggressively;
- conserve budget;
- return to previous activities after seeing Arena results.

Do **not** turn these into hard sequential gates unless a specific gameplay rule genuinely requires one.

### Consequences instead of arbitrary gates

The game should normally **show consequences rather than block choices**.

For example, if the player enters Arena with little training, the game can communicate:
- limited training history;
- lower demonstrated readiness;
- basic equipment;
- weaker preparation context;
- relevant opponent readiness.

It should still let the player enter when the product rules allow it.

Likewise, good preparation should be visible through stronger demonstrated readiness and later match effects. The player learns the system by experiencing the difference.

Use readable state such as:

```
ARENA READINESS
Training history: 0
Shooting: Basic
Evasion: Basic
Equipment: Basic
Preparation: Low
ENTER ARENA
```

Do not expose hidden formulas merely to justify the result. Media Coverage and result screens should explain the meaningful causes in player-readable language.

### Guest feeling

The intended emotional structure is:

```
ARRIVE
  ↓
LOOK AROUND
  ↓
WHAT DO I WANT TO DO?
  ↓
CHOOSE A PLACE
  ↓
ACT / LEARN / PREPARE
  ↓
SEE WHAT CHANGED
  ↓
DECIDE WHAT TO DO NEXT
```

The player should not feel that the game is saying:

> “You must complete Training A, then Training B, then buy Item C, then you may play.”

Instead, it should feel like:

> “This place is open. I decide how I prepare. The game remembers what I did.”

### Design constraint

Freedom does **not** mean removing structure.

The underlying state model, performance-driven progression, budget/equipment effects, opponent preparation and Arena consequences remain locked. What changes is the **presentation of progression**: the world remains open while the player's preparation history determines what happens.

When implementing a new Home Field activity:
- make it discoverable from the physical world;
- do not add a menu-only shortcut as the primary interaction;
- do not require unrelated activities first;
- preserve explicit save/close/return behavior;
- make the resulting state visible through Media Coverage and later activities;
- let the player choose when to return and what to do next.

The core principle is:

**The world is open; preparation determines what happens inside it.**

### Acceptance test

A phone playtest should allow a player to:
1. enter Home Field;
2. wander without being forced into a tutorial checklist;
3. choose any available physical location;
4. enter Arena before full preparation if the current product rules permit it;
5. return to training afterward;
6. retrain and change preparation;
7. notice meaningful differences in later activity;
8. understand those differences through results/Media Coverage.

If a new feature requires a hard sequence, document the actual gameplay reason in the code change rather than adding a gate for convenience.

## Shooters Trigger — Current Source Checkpoint — September 21, 2026

The latest documented Shooter Trigger checkpoints include:

- `9864f52` — `fix: make shooters lobby location entry physical`
- `4d3b1eeeca1be981d01527fd8259960195fdaf22` — `docs: lock shooter performance progression contract`
- `1826bdbb20e70ed7acd27d517bac2277e5ddadd1` — deployment-rate-limit retry documentation
- `39f3806` — `fix: move shooters lobby text alpha to game object`

The physical location-entry checkpoint is authoritative for the current Home Field interaction model: contextual entry appears when the player reaches a real location zone, rather than treating the lobby as a list of menu buttons.

The performance/progression checkpoint is authoritative for the relationship between training evidence, skill, budget, equipment, Media Coverage and Arena effectiveness.

Do not overwrite these contracts with a linear mission/checklist flow. Future implementation should deepen the existing open Home Field model while preserving the player's freedom to choose the order of activities.



## Shooters Trigger — Current Product Contract (September 21, 2026)

Shooters Trigger is a **mobile-first, top-down paintball game built around a physical field hub**. The player arrives as a guest, can walk anywhere, trains to build an evidence-based performance profile, prepares, competes in the Arena, earns budget and returns to improve.

### Step 3 — Home Field is open-order preparation

The authoritative route is:

```
Shooters Trigger Setup
      ↓
Home Field / Field HQ
      ↓
Shooting Range · Evasion Yard · Armory & Outfitter · Arena
      ↓
training / preparation / competition in the order the player chooses
```

The phone provides a recommended next step, but it never becomes a mission checklist or access gate.

### Location ownership

- **Shooting Range** — build shooting evidence: scrapes, marker-hand hits, center-mass hits, exceptional/head hits, misses and accuracy.
- **Evasion Yard** — build movement, cover, survival, escapes and damage-avoidance evidence.
- **Armory & Outfitter** — inspect/spend earned in-game budget on preparation.
- **Arena** — open physical match field. Preparation affects the match, not access.
- **Phone** — personal guidance, training reminders, performance interpretation and narrative/coverage messages. It is UI, not a fifth physical location.

There is no physical Media Bureau in the Home Field. Media/coverage should remember and interpret actual gameplay through the phone and dedicated result/coverage scenes.

### Flow rules

1. The player may visit any physical destination in any order.
2. Training saves durable evidence and returns the player to Home Field.
3. The Armory never silently spends budget or teleports the player.
4. The Arena is never gated by Media review or a loadout requirement.
5. The contextual action appears only near the corresponding physical destination and uses one normal rectangular button above the mobile controls.
6. The phone is available as a small fixed UI affordance and gives the most useful next recommendation from actual saved state.
7. There is no persistent floating Arena shortcut and no menu replacement for the physical world.

### Recommended learning route

The phone should naturally recommend:

**WELCOME → SHOOTING → EVASION → OPTIONAL ARMORY → ARENA → RETRAIN / PREPARE → ARENA AGAIN**

This is guidance, not a lock. A player who walks directly to Arena is allowed to try it.

### Starting economy

A new player begins with **0 earned budget**. Arena outcomes create the first meaningful opportunity to earn. Existing saved budget is preserved; do not silently reset returning players.

### Current checkpoint

The Home Field must feel like a small physical paintball facility: central Field HQ, clear sightlines, four real destinations, grounded objects and a readable walking route. The phone supplies context without turning the lobby into a list of buttons.

Unexpected result = STOP → inspect the actual phone playtest and changed source → then act.


## Shooters Trigger — Home Field Wayfinding Correction — September 21, 2026

The previous Step 3 town description was too literal about chronological progression and led to hard location locks and an incorrect Armory spawn. That implementation direction is superseded. The authoritative Home Field model is now **open-world preparation with strong spatial wayfinding**.

### Player arrival and town geometry

After Shooter Setup, the player arrives at a neutral **Field Town arrival square**. Never spawn the player at the Armory or another service location merely because it is geographically central.

The first useful destination, Shooting Range, should be visible from the arrival area. The main street should make the rest of the town legible without requiring a tutorial checklist:

```text
                 ARENA
                     ↑
              MEDIA    ARMORY
                →        ←
                     ↑
               EVASION YARD
                     ↑
              SHOOTING RANGE
                     ↑
               ARRIVAL SQUARE
                    YOU
```

This is a **recommended learning route, not a locked quest chain**. The town should feel like a small place the player can walk around, not a horizontal row of level-select buttons.

### Open-order rule

The player is a guest in the field town. From Home Field, the player may choose what to do and in what order when the game rules allow it.

Do not hard-lock:
- Evasion behind a Shooting result;
- Armory behind Evasion;
- Media behind an upgrade;
- Arena behind Media review.

The persistent performance system still matters. Training history, shooting/evasion skill, budget, equipment and readiness should determine consequences **inside** activities and the Arena. The world answers **where can I go?**; persistent state answers **what happens because of what I have done?**

### Wayfinding principles

Keep the town compact and readable:
- one dominant main street;
- one central arrival square;
- five purposeful locations;
- strong sightlines;
- in-world numbered signs;
- restrained scenery for atmosphere;
- no arbitrary western attractions;
- no giant navigation HUD;
- no minimap unless real phone playtesting proves the world needs one.

The Westworld reference means the ease of understanding the place, not a literal Westworld recreation.

### Contextual entry

Use the Hall convention for interactions:
- no entry button when the player is far from a destination;
- when close to a destination, show one normal rectangular contextual button;
- label it with the actual destination;
- keep it above the mobile movement dock;
- never cover MOVE/AIM/FIRE controls;
- keep keyboard `E` as the desktop equivalent.

All five locations use the same interaction language. Armory arrival opens the purchase/inspection interaction; it does not silently spend budget or teleport the player. Arena is a physical destination and must not be exposed as a persistent shortcut from Media.

### Acceptance playtest

Before another town redesign, test the live phone build and answer:
1. Do I know where I am immediately?
2. Can I see the first useful destination?
3. Can I walk there naturally?
4. Can I understand the other destinations without a tutorial checklist?
5. Can I choose another destination instead?
6. Does the contextual button feel like a normal Hall-style interaction?
7. Does any UI obstruct movement?
8. Does Arena feel like a destination rather than a menu shortcut?
9. After returning from an activity, does the town make the next choice feel natural?

Playtesting is the acceptance authority. Do not add decoration or systems just because the town can support them.

**Correction principle:** the recommended sequence is visible in the world; player agency remains open.


## Shooters Trigger — Home Field visual contract (September 21, 2026)

The previous house-style Field Town and five-location Media layout are retired. The authoritative lobby is a **single shared paintball field headquarters** with four physical destinations plus a phone UI.

### Non-negotiables
- Lobby and Shooting Training share the same grounded field vocabulary and world scale.
- Do not build western-town houses, decorative landmarks, floating entrances or a physical Media Bureau.
- Do not use generic circles, squares or dots as the default representation of destinations.
- The player arrives at the Field HQ staging area around the established start position.
- The lobby player remains a grounded human with a visible walking step and no weapon.
- Physical destinations must be recognizable through shelters, equipment, lanes, cover, signs and actual field geometry.
- The contextual ENTER button remains a normal rectangular UI element above the mobile controls and appears only near the corresponding destination.
- The player remains free to visit Shooting, Evasion, Armory and Arena in any order.

### Destination intent

01 SHOOTING RANGE = target stands and a distinct firing lane.

02 EVASION YARD = irregular cover, tires and a movement-course layout.

03 ARMORY & OUTFITTER = equipment shelter, rack and crates; no house facade.

04 ARENA = open physical arena field; no gate, doorway or artificial threshold.

### Phone instead of Media

Media/coverage is delivered through the phone and result/coverage scenes. The phone should feel like the player's private field device: short messages, current status and a clear recommended next step based on saved training records. It should never require the player to visit a physical Media location.

The world answers **where?**; the phone answers **what next?**; actual gameplay evidence answers **how good am I?**


## Shooters Trigger — Home Field Physicality & Lobby Layout Lock — September 21, 2026

The Home Field is now a **physical field headquarters**, not a copy of the Shooting Training arrangement.

### Permanent physical-world rule

Unless the product owner explicitly says otherwise, Shooters Trigger world objects must be represented as grounded physical things:

- the player must visibly stand and walk on the ground; preserve the current walking-step treatment rather than reverting to a sliding/floating character;
- locations must occupy believable physical space;
- tents, shelters, racks, benches, gates, fences, targets, cameras, crates, signs and field equipment should be actual environmental objects;
- do not use generic circles, squares, dots or floating markers as the default representation of a physical destination;
- geometric shapes are acceptable only when they are genuinely part of the physical object or field marking;
- contextual entry remains UI and may be rectangular, but it must correspond to the real nearby object/location.

### Lobby layout contract

The lobby uses the same grounded visual vocabulary and player treatment as Shooting Training, but has its own arrangement and purpose:

- **Central staging / Field HQ** — arrival, benches, crates and a physical field information board.
- **01 Shooting Range** — target stands, firing lane and field boundary; this is the shooting-specific area.
- **02 Evasion Yard** — irregular cover, tires and movement-course fencing; this is the evasion-specific area.
- **03 Armory & Outfitter** — equipment shelter, rack and crates; no house/building facade.
- **04 Media Bureau** — media shelter, results desk and physical camera/reporting setup.
- **05 ARENA** — physical gate and visible arena field beyond it.

These areas should be connected by readable ground space and sightlines so the player can understand the facility by walking through it. The lobby must not simply reproduce the Shooting Training target/bunker arrangement.

### Direction principle

The environment should answer **“where is this?”** through physical landmarks and spatial layout. HUD should answer **“what can I do here?”** only when the player is actually close enough to interact.

The intended relationship is:

**player → ground → physical destination → contextual action**

not:

**player → floating marker → menu button**.

This is the default visual/interaction rule for future Shooters Trigger world-building unless the product owner explicitly overrides it.


## Shooters Trigger — Open Arena / No Gate Correction — September 21, 2026

The Arena is an **open physical play field**, not a gated building or locked destination.

Permanent rules:
- Do not draw a gate, doorway, fence opening, or artificial threshold for the Arena; the open field itself is the destination.
- The Arena itself is the destination: a recognizable open field with real playing-space objects.
- The contextual action appears only when the player is physically near the Arena field.
- The Arena may be visited in any order permitted by the open Home Field contract; preparation affects the match, not access.
- Do not call the location **ARENA** anywhere in the lobby. Use **ARENA**.
- Do not create world objects solely to support a UI button. The physical place must exist first; UI only describes what can be done there.

### Corrected Home Field composition

The player's first view should read as a central field headquarters with:
- Arena ahead;
- Shooting and Evasion as distinct left/right training wings;
- Armory and Media as support areas around the rear/sides of Field HQ;
- clear walking space connecting all five areas.

The layout must be judged from the **phone camera's initial viewport**, not from the full-map diagram alone. The first screen should establish the hub and its major directions without presenting an accidental cluster of destinations.

The permanent visual rule remains:

**physical place first → contextual action second.**


## Shooters Trigger — Phone-First Home Field Composition Lock — September 21, 2026

The previous coordinate patch was insufficient because a 2400×1400 world map is not the same thing as a good first phone viewport. This is now the authoritative composition rule.

### Initial phone view
- Player starts at approximately **(1180,1040)** inside the central **FIELD HQ** staging area.
- The initial camera should primarily show **Field HQ + open space immediately around it**.
- Do not place a destination directly on top of the player's first camera view merely to make it visible.
- **ARENA is ahead/upfield**, reached by walking north from HQ; it becomes legible as the player moves toward it.
- **SHOOTING RANGE** and **EVASION YARD** are distinct left/right training wings around the upper half of the field.
- **ARMORY** and **MEDIA** are rear-side support stations around HQ.
- The first screen should read as a headquarters/staging area first, not five destinations at once.

### Authoritative spatial layout
```
                         OPEN ARENA
                            ↑
                  SHOOTING       EVASION
                     ↗             ↖
                         FIELD HQ
                       PLAYER START
                    ↙               ↘
                ARMORY             MEDIA
```

This is a spatial relationship, not a locked sequence. Every location remains freely visitable.

### Arena rule
**ARENA is an open field.** There is no gate, doorway, locked threshold, or artificial entrance object. Never add one just to justify an interaction button.

### Camera acceptance rule
For every lobby layout change, inspect the actual camera follow/deadzone and judge the composition from a representative phone viewport. Do not validate the layout only from world coordinates or a full-map diagram.

The permanent visual rule remains:

**physical place first → contextual action second.**


## Shooters Trigger — Authoritative Source Correction — September 22, 2026

The older Shooter Trigger sections above contain historical town layouts and economy experiments. They are **not** the current implementation contract.

The authoritative implementation is now:
- Home Field has exactly four physical destinations: Shooting Range, Evasion Yard, Armory & Outfitter, Arena.
- There is no physical Media Bureau in the lobby.
- Arena is an open physical field with no gate or threshold.
- Player starts with 0 budget. Shooting and Evasion create performance evidence only; they do not award cash.
- Arena wins award 25 budget; Arena losses award 0.
- Phone replaces the physical Media location and is a right-side fixed utility control positioned above the mobile movement/combat dock.
- Phone guidance is state-driven and recommends WELCOME → SHOOTING → EVASION → ARENA → ARMORY/UPGRADE → RETRAIN/RETURN, while preserving open-order access.
- Phone shows readiness, Shooting/Evasion skill labels, budget, Arena result and available training evidence.
- Shooting records distinguish available target evidence (center-mass/dummy hits and exceptional/bottle hits), misses and cover hits; do not invent body-part categories that the current simulation does not actually detect.
- Returning players' existing budget is preserved. No training activity silently creates money.
- Any future change must inspect the actual source and live phone playtest before claiming implementation.

This correction supersedes conflicting historical Shooter Trigger descriptions earlier in this file.


## Shooter Trigger — Mandatory Future-Chat / Implementation Discipline — September 22, 2026

This section exists because previous Shooter Trigger work repeatedly created avoidable implementation and workflow mistakes. It is authoritative for **how future work must be handled**, not just what the game should look like.

### 1. Inspect reality before proposing or changing anything

For every Shooter Trigger task, the first step is to inspect the current repository state:

1. Read this `AGENTS.md`.
2. Inspect the actual current `main` commit and Git state.
3. Inspect the actual Shooter Trigger source files involved.
4. Inspect the current registration/routing and PWA/deployment path when relevant.
5. If the user reports a visual or gameplay problem, inspect the actual current implementation before designing a fix.
6. If the user says they are testing live, treat the live result as evidence that may contradict assumptions. **STOP → inspect reality → then act.**

Never design from an old screenshot, old commit, remembered implementation, or historical section of this document when current source can be inspected.

### 2. Historical contract sections are not permission to resurrect old designs

This document contains historical Shooter Trigger sections because they record how the product evolved. They are not automatically current requirements.

The latest **Authoritative Source Correction** and later corrections override older Shooter Trigger layout, economy, Media, gate, town and destination descriptions.

Before changing Shooter Trigger, identify the newest authoritative section and reconcile older text against it. If two sections conflict, use the newest correction and the actual source. Do not copy an older section into implementation merely because it appears earlier or is more detailed.

### 3. Do not turn product work into unnecessary workflow ceremony

The required workflow is deliberately small:

**INSPECT → PLAN → ONE CONTROLLED CHANGE → VERIFY → CHECKPOINT**

That means:

- Do not invent a giant DevOps process.
- Do not create unnecessary branches, PRs, tickets, deployment gymnastics, or documentation work when the task does not require them.
- Do not make multiple speculative changes before the user can test the first meaningful change.
- Do not push documentation-only commits as if they were implementation.
- Do not substitute an `AGENTS.md` description for the actual code change.
- Do not tell the user to tolerate a workflow because “the process requires it.” The product owner's requested outcome is the priority.
- If the user asks for a direct fix and the current tooling permits it, make the smallest real fix and push it.
- If a task genuinely requires multiple changes, group them into one coherent implementation checkpoint rather than manufacturing ceremony.

The workflow is a control system, not a performance ritual.

### 4. Source change ≠ GitHub push ≠ Vercel deployment ≠ live verification

These are four different states and must never be conflated:

**SOURCE IMPLEMENTED** — the actual relevant code changed.

**PUSHED** — the changed commit exists on the intended GitHub branch.

**DEPLOYED** — Vercel built/deployed the intended commit successfully.

**LIVE VERIFIED** — the actual production URL was opened and the affected user flow was exercised successfully.

Only claim the state that has actually been established.

A successful build does **not** prove the UI is correct. A GitHub push does **not** prove Vercel deployed it. A Vercel deployment does **not** prove the production URL contains the expected game state. A successful page load does **not** prove the affected gameplay flow works.

When live visual access is unavailable, say so plainly and do not manufacture a live-verification claim.

### 5. “Implemented” means implemented in the actual source

Never say a feature is implemented merely because:

- it is described in `AGENTS.md`;
- a plan says it should exist;
- a screenshot shows it;
- a coordinate/layout proposal exists;
- a commit message claims it;
- a deployment succeeded.

For every requested feature, identify the actual source file/function/state path that implements it. If the implementation is missing, change the implementation. If the source already contains it, verify that it is actually wired into the current route/scene and reachable during play.

### 6. Visual/gameplay claims require the appropriate evidence

For Shooter Trigger, acceptance is player experience first.

When the task changes:
- **layout/camera/UI:** inspect a real phone-sized viewport or live handset result when available;
- **controls:** actually exercise touch controls;
- **gameplay:** play the affected interaction;
- **state/economy:** perform the relevant sequence and inspect saved state/result;
- **PWA:** test the relevant installed/offline behavior;
- **deployment:** verify the expected commit/deployment relationship before calling it deployed.

Do not infer a successful phone experience from TypeScript/build success.

### 7. Preserve the user's locked decisions

Do not reopen decisions the product owner has already settled unless current evidence shows the implementation contradicts them.

Current locked Shooter Trigger principles include:
- mobile-first;
- grounded walking player;
- physical destinations first, UI second;
- no generic floating destination markers;
- open-order Home Field;
- phone guidance instead of a physical Media Bureau;
- no Arena gate;
- 0 starting budget;
- training creates evidence, not cash;
- Arena wins create the cash source;
- performance evidence affects consequences without replacing player agency.

If current source conflicts with a locked decision, fix the source rather than asking the user to re-decide a settled product choice.

### 8. Do not overstate what the current simulation measures

The current Shooting simulation does **not** automatically detect every real-world body-part hit category. Current available evidence must be read from the actual implementation.

Do not claim headshots, marker-hand hits, limb hits, or other detailed outcomes unless the current source actually detects and stores them.

If a richer hit-quality model is requested, implement the measurement first, then expose it in the phone/results. Do not fabricate evidence labels from generic target hits.

### 9. Before a future Shooter Trigger checkpoint, answer these internally

- What is the current source of truth?
- What exact files implement the requested behavior?
- What is actually changing?
- What existing behavior must remain untouched?
- What is the smallest controlled change?
- How will the affected player flow be verified?
- What can honestly be claimed after the push?

If those questions cannot be answered from current evidence, inspect more before editing.

### 10. Recovery rule

If the user says **“that did not change,” “it is still the same,” “you did not implement it,”** or gives a live result that contradicts the claimed change:

**STOP. Do not argue from the previous plan or commit message.**

Immediately:
1. inspect the current branch/source;
2. identify whether the requested change is actually present;
3. identify whether the deployed build contains that commit;
4. identify whether caching/routing/registration could explain the result;
5. make the smallest correction;
6. verify again;
7. report exactly what was established.

The live player result outranks assumptions.

### 11. User communication rule

For Shooter Trigger work, report in plain language:

- **Changed:** what actually changed in source.
- **Pushed:** commit/branch.
- **Deployed:** only if confirmed.
- **Verified:** exactly what was actually tested.
- **Not verified:** anything that could not be tested.

Do not bury a simple implementation task under workflow narration. Do not claim certainty where the evidence only supports a partial state.

**Core rule: reality first, smallest real change, honest verification.**


## Shooters Trigger — Arena Relational Rival Contract — September 22, 2026

The Arena is now the combat continuation of the Shooting Range, not a separate simplified mini-game.

### Arena field

- Arena uses the Shooting Training field's world scale, ground treatment, lanes, perimeter, trees, bunkers and tire stacks.
- The player uses the same grounded human presentation, walking-step animation, weapon presentation, aim/fire controls and mobile control relationship as Shooting Training.
- Arena removes the target stands and bottles/dummies. The only combat opponent is one rival operator.
- Decoration may be minimally different so the field reads as competition space, but do not redesign it into a different game.

### Rival selection

Each Arena entry randomly selects exactly one of three relational rival profiles:

| Operator | Profile | Relative behaviour |
|---|---|---|
| OPERATOR 12 | MARKSMAN | Better shooting than the player's current shooting evidence; lower movement pressure. |
| OPERATOR 07 | RUNNER | Better movement/evasion than the player's current evidence; less accurate shooting. |
| OPERATOR 21 | ALL-ROUNDER | Balanced improvement over the player's combined shooting and movement evidence. |

These are NOT Easy / Medium / Hard settings.

The rival is generated from the player's actual saved Shooting and Evasion evidence. The better the player trains, the stronger the relational opponent becomes. The three profiles differ by where they are stronger, not by an arbitrary difficulty selector.

### Rival skill inputs

Current Arena derives player evidence from:
- Shooting accuracy;
- Evasion survival time;
- Evasion cover blocks;
- Evasion scrapes.

The selected rival receives relational values for:
- shooting;
- movement;
- pressure;
- cover use.

The rival's behaviour must express the selected profile rather than simply changing HP or projectile speed.

### Arena hit rules

The Arena now measures actual combat hit zones rather than inventing target evidence:

- Head hit: immediate round point.
- Body hit: removes one of two body-hit points.
- Two body hits: round point.
- Misses are recorded separately.
- Player and rival headshots/body hits/misses are stored in shooters-trigger:last-arena.
- Match remains first to 3 rounds.
- Arena win earns 25 budget.
- Arena loss earns 0 budget.
- Training continues to create evidence, not cash.

Headshot skill is therefore an actual gameplay mechanic: the player's training evidence influences the opponent's shooting ability, while the player's own headshots are determined by where the player actually aims and hits the rival.

### Arena result record

A completed match records:
- result;
- score;
- selected operator;
- selected profile;
- rival shooting/movement/pressure/cover-use values;
- player's shooting/movement evidence;
- player/rival headshots;
- player/rival body hits;
- player/rival misses;
- match duration;
- budget earned.

The phone can use this evidence for subsequent state guidance and future Arena balancing.

### Acceptance intent

The intended player experience is:

TRAIN → BUILD EVIDENCE → ENTER OPEN ARENA → RANDOM RIVAL → FIGHT A RELATIONAL OPPONENT → EARN CASH ON WIN → UPGRADE → TRAIN/FIGHT AGAIN

The player should never need to choose a difficulty level. The opponent is the difficulty.



## Shooters Trigger — Arena Reliability & Battlefield Polish Contract — September 22, 2026

The September 22 Arena playtest confirmed that the existing first-to-3 combat loop is fun and must be preserved. Future Arena work should improve reliability, readability and tactical depth without replacing the current controls, field scale, rival model or core combat.

### Reliability is now part of the Arena contract

- A final hit must resolve exactly once. Guard against duplicate round/match resolution while a hit is being processed.
- On a final round point, combat stops immediately: firing, movement and active projectiles are cleared before the result state is shown.
- A completed match must enter a stable **MATCH WON / MATCH LOST** result state instead of leaving the combat scene running underneath a result overlay.
- The result state must offer both **FIGHT AGAIN** and **RETURN TO HOME FIELD**.
- Scene shutdown must remove Arena DOM controls and result/pause panels so stale UI cannot survive a scene change.
- Do not rely on a successful build as proof that the match-end flow works; final-hit and scene-transition playtesting are required.

### Pause contract

- Arena has a small upper-right pause control that does not occupy the movement or aim/fire control zones.
- Pause freezes the Phaser Arena scene, clears held fire/movement input, and presents a mobile-safe overlay over the current field.
- Pause offers **RESUME MATCH**, **RESTART MATCH**, and **LEAVE ARENA**.
- Resume clears stale held input before gameplay continues.
- Pause cannot interrupt an active round-resolution transition or an already completed match.

### Round-flow contract

- The existing first-to-3 structure remains unchanged.
- A non-final round now has a short, explicit transition: round winner/score feedback, then reset positions and continue.
- At 2–2, the HUD/status should identify the next round as the **FINAL ROUND**.
- No round transition should allow movement, firing or AI combat during the reset window.

### Battlefield polish contract

The Arena battlefield remains the Shooting Range clone already approved by the product owner. Do not redesign it into a different game.

Permitted improvements are small, physical and gameplay-readable:
- clearer field/lane markings;
- subtle staging or boundary details;
- existing bunkers, tires and trees remaining meaningful as cover;
- restrained physical dressing that makes the Arena read as a competition field;
- no floating destination markers or decorative UI objects masquerading as world objects;
- no unnecessary new weapons, abilities, enemy swarms or progression systems until the current combat loop has been validated further.

### Combat-feel direction

Keep and deepen the existing rules:
- head hit = immediate round point;
- body hit = one of two body-hit points;
- two body hits = round point;
- first to 3 rounds;
- Arena win = 25 budget;
- Arena loss = 0 budget;
- player evidence continues to shape the relational rival rather than creating a difficulty selector.

Future polish should make hits, round transitions, cover use and rival identity more legible without changing these rules unless the product owner explicitly requests a rules change.

### Current implementation checkpoint

The Arena source now contains:
- guarded round/match resolution;
- explicit projectile cleanup;
- a real pause/resume/restart/leave flow;
- stable match result actions including rematch;
- scene-shutdown cleanup for Arena DOM UI;
- short round transitions and final-round feedback;
- restrained physical field/lane detail layered onto the existing battlefield.

The next acceptance test is a real phone match, with special attention to: taking the second body hit, reaching the third round-ending hit, pausing/resuming mid-fight, restarting from pause, rematching after the result screen, and returning to the Home Field without stale controls.

## Shooters Trigger — Arena Top-Down Readability & Rematch Reliability Contract — September 22, 2026

The Arena has now been inspected as a top-down mobile combat game itself, rather than as part of the wider application. Current top-down shooter patterns commonly use a tactical minimap/radar for macro enemy position and an edge-direction marker for an off-screen threat. citeturn2search0turn2search1

### Required Arena locator

The Arena now provides two complementary layers:
- a compact top-right tactical locator showing the full field, player position/facing, rival position and meaningful cover;
- an off-screen RIVAL edge indicator that points toward the rival and includes field distance;
- when the rival is already on-screen, the edge indicator disappears so it does not compete with the actual opponent;
- the locator is informational only and does not aim, fire or move the player automatically;
- the locator remains outside the movement and aim/fire touch zones.

This is intentional: the player should be able to find the opponent quickly without turning the battlefield into a wall of floating markers.

### Mobile combat readability

The Arena remains a twin-stick-style mobile experience: left movement, right aim/fire, with pause kept away from those controls. Current mobile shooter references similarly emphasize dedicated touch movement/aim/fire and readable combat spaces. citeturn2search4turn0search7

Do not replace the existing combat controls with a different control scheme unless explicitly requested.

### Rematch reliability

FIGHT AGAIN must fully leave the completed Arena scene before starting a fresh Arena scene.

The rematch path must:
1. clear result/pause/locator DOM;
2. stop the completed Arena scene;
3. start a fresh Arena scene on the next task turn;
4. recreate mobile controls, HUD, locator and fighter state from scratch.

A rematch must never reuse a completed scene's matchOver, roundTransition, resolvingRound, held-input or DOM state.

### Acceptance

The next phone acceptance test must specifically verify:
1. finish a match;
2. tap FIGHT AGAIN;
3. fresh Arena loads and the player can move/fire immediately;
4. rival is visible on the tactical locator even before it enters the camera view;
5. when rival moves off-screen, the edge indicator points toward it;
6. when rival comes back on-screen, the edge indicator disappears;
7. pause/resume still works;
8. returning home leaves no stale locator or controls.

The current combat rules, first-to-3 structure, relational rival profiles, grounded player, field scale and economy are unchanged.


## Shooters Trigger — Arena Paint Evidence, Hit Highlights & Field Reporting Contract — September 22, 2026

The Arena combat loop is intentionally gaining **evidence**, not new combat complexity. Current shooter-design references emphasize immediate hit/headshot/kill feedback and persistent combat consequences because players need to understand what their shots actually accomplished. Paintball itself also makes visible marks a natural part of the fiction.

### Paint and impact feedback

- Confirmed body/head hits create restrained paint splatter in the physical Arena.
- Near-miss shots that pass close to a fighter count as **SCRAPE** evidence and leave a smaller ground mark.
- Headshots, paint hits and scrapes receive short world-space combat highlights.
- Player and rival feedback is directional in wording: the player can tell whether the event was caused by their shot or happened to them.
- Effects are deliberately brief and local; they must not become full-screen VFX noise or obscure the mobile controls.

### Respawn / round cleanup

A completed round cleans the Arena's accumulated paint before both fighters are reset. This creates a visible before/after combat story without permanently dirtying the field or changing the existing first-to-3 structure.

Final match results still preserve the evidence in local state for the Field Phone.

### Field Phone / coverage

The Arena result now records:
- player/rival headshots;
- player/rival body hits;
- player/rival scrapes;
- player/rival paint-hit counts;
- misses;
- score and reward.

The Field Phone is the persistent **field report**: after an Arena result changes, the phone alert points the player back to the report. The phone can show the combat evidence rather than only WIN/LOSS, so the player can understand what happened and use it to decide whether to retrain, upgrade or fight again.

### Creative design principle

The Arena should feel like a place that remembers a fight briefly, while the player's phone remembers the evidence longer. Do not add persistent progression, new weapons, extra enemies or new match rules merely to create spectacle. First make the existing one-on-one fight increasingly readable, tactile and consequential.


## Shooters Trigger — Arena Damage-State & Atomic Elimination Contract — September 22, 2026

The Arena keeps its current two body-hit rule for now, but the combat loop must communicate damage as visible fighter states rather than as an invisible HP counter.

### Body-hit state model

- Fresh fighter = READY.
- First confirmed body hit = WOUNDED: one body-hit point remains, persistent paint remains visibly on the fighter, a short hit reaction plays, and the fighter continues fighting.
- Wounded fighters have a subtle 8% movement reduction. This is a tactical consequence, not a hard stun or accuracy penalty.
- Second confirmed body hit = DOWNED / ELIMINATED: the fighter receives a stronger final reaction, becomes visually disabled/tilted, weapon effects stop, and the round resolves immediately.
- Headshot remains an immediate elimination and does not require a prior wounded state.
- Do not add a conventional HP bar unless explicitly requested. Paint, fighter state and combat reactions are the primary immediate health evidence.

### Combat feedback

- First body hit must read as damage, not merely as another splatter particle.
- Persistent paint/damage state remains on the fighter until the round reset.
- Final body hit must read differently from an ordinary hit: ELIMINATED and ROUND POINT are distinct from PAINT HIT.
- A downed fighter cannot continue moving, firing or accepting additional hits.
- Existing field-report evidence is preserved exactly: headshots, body hits, scrapes, paint-hit counts, misses, score and reward remain recorded.

### Atomic round resolution

- The first confirmed final hit owns the round.
- Once a fighter becomes downed or roundPoint() begins, remaining projectiles cannot award another point in that round.
- Active shots are cleared before the next round or match result.
- Existing 700ms clean-field respawn transition remains.
- Respawn must reset both fighters to READY, restore weapons/labels, clear persistent fighter paint and preserve match score/evidence.
- Do not change two-hit body combat to three hits merely because the number is larger. First validate whether the new WOUNDED → DOWNED experience creates the intended tension on a real phone. A later hit-count change requires a separate gameplay decision.

### Scope lock

This checkpoint changes Arena combat readability and reliability only. Do not add new weapons, enemies, progression systems, health bars, new match rules or unrelated Home Field/Phone changes as part of this contract.

### Acceptance test

On a real phone, verify:
1. clean fighter takes body hit → visible persistent paint + WOUNDED feedback;
2. wounded fighter remains controllable but moves slightly slower;
3. second body hit → fighter visibly becomes DOWNED, weapons stop, ELIMINATED/ROUND POINT appears;
4. simultaneous/in-flight shots cannot reverse or double-award the round;
5. 700ms transition cleans the field and both fighters return READY at their normal spawns;
6. headshot still immediately ends the round;
7. final Field Phone report remains unchanged and still receives the match evidence.


## Shooters Trigger — Arena Neutral Baseline, Distance Combat & Marker Recovery Contract — September 22, 2026

This is the current authoritative Arena test baseline. It intentionally supersedes the earlier relational-rival behaviour for the current validation phase.

### Neutral baseline
- Arena currently runs in NEUTRAL mode.
- Previous Shooting/Evasion records, upgrade level and other preparation evidence do not modify Arena fighter combat values while this baseline is active.
- Player and rival use the same base movement speed, firing cadence and 50-point baseline skill.
- Rival identity remains randomized among OPERATOR 12 / 07 / 21 for presentation, but their combat values are equal in this baseline.
- Training/Evasion/Armory integration is deliberately deferred until the neutral fight is validated on a real phone.
- The purpose is to establish whether the underlying fight is fun, readable, reliable and tactically coherent before progression modifies it.

### Distance and shooting
- Shot accuracy is distance-sensitive for both player and rival.
- Close range is easier to connect than medium range; long range introduces more angular spread.
- Player and rival use the same distance-spread model at neutral skill.
- This is the foundation for a later Shooting skill system: training should improve measurable shot behaviour rather than simply granting arbitrary damage or HP bonuses.
- Distance changes the difficulty of placing the projectile, not its damage.

### Combat reliability
- Projectile iteration stops immediately after a hit begins round resolution.
- roundPoint() is atomic: the first confirmed final hit owns the round, clears active projectiles and prevents another projectile from awarding a point.
- Downed fighters cannot move, fire or receive additional hits.
- Round reset remains 700ms, clears field splatter, resets fighter state and returns both players to their normal spawns.
- Headshot remains instant elimination.
- Body hits remain two-stage: first hit = WOUNDED, second = DOWNED/ELIMINATED.
- Persistent paint/damage state remains until round reset; no conventional HP bar.

### Marker / gun recovery
- Each fighter has a physical dropped marker state.
- A precise hit on the opponent's marker/grip area knocks the marker out without consuming a body-hit point.
- The knocked-out marker is placed physically on the field and the fighter's weapon presentation disappears.
- An unarmed player must walk over the dropped marker to recover it before firing again.
- An unarmed rival moves toward its dropped marker and must recover it before firing again.
- A player can therefore be temporarily exposed while recovering the marker and can be shot/eliminated before recovering it.
- Marker knockout/recovery counts are stored in the Arena result for the Field Phone.
- Dropped markers are cleared on round reset and scene shutdown.

### Field Phone
- Phone content before a completed Arena match is player-centric: the player's training/evasion/arena state, records, readiness and next guidance.
- Rival intelligence is post-match only.
- After a completed match, the phone may show the selected rival operator/profile, combat values and comparison evidence, including marker knockouts.
- Do not expose live rival stats as phone news before a match result exists.
- The Field Phone remains the persistent memory of the player's own field evidence and post-match rival report.

### Current acceptance sequence
1. Enter Arena after previous training/evasion data exists and confirm the match still behaves as a neutral baseline.
2. Fight at close, medium and long distances and compare how reliably shots connect.
3. Land a marker/grip hit and verify the gun visibly drops.
4. Try firing while unarmed; it must not fire.
5. Walk over the marker and verify recovery.
6. While a marker is down, allow the armed opponent to pressure the recovery.
7. Verify first body hit produces WOUNDED state and persistent paint.
8. Verify second body hit produces DOWNED/ELIMINATED and one round point.
9. Verify simultaneous/in-flight shots cannot double-award the round or crash.
10. Verify 700ms reset clears paint and dropped markers and restores both fighters.
11. Complete a match and verify the phone shows player news plus rival intelligence only after the match.
12. Verify FIGHT AGAIN creates a clean neutral Arena.

## Shooters Trigger — Arena Ammo Discipline & Mobile Gun Feel Contract — September 22, 2026

The neutral Arena validation now includes limited ammunition and a physical refill decision. This is a tactical extension of the existing fight, not a new weapon/progression system.

### Ammo rules
- Each fighter starts each round with **8 shots**.
- Every fired shot consumes one round.
- When the player reaches 0 ammo, the gun cannot fire until ammunition is restored.
- The player must physically move to the marked **AMMO** station and remain inside it for **2.2 seconds** to refill.
- Leaving the station before the timer completes cancels the refill progress.
- The player remains vulnerable while standing at the refill station.
- The rival follows the same ammo economy and retreats to the same physical station when empty, so the rule applies to both sides.
- Ammo resets to a full 8 at the start of every round.
- The Arena result records shots fired for both sides alongside the existing hit/miss/weapon-knockout evidence.
- Do not add magazines, inventory screens, ammo pickups, multiple ammo types or new weapons until this simple ammo/refill loop has been phone-tested.

### Gun / marker reliability
- Player-facing language uses **GUN**, not MARKER.
- A gun knockout is detected across the projectile's travelled segment rather than only at its final frame position.
- The dropped gun is physically visible on the field, noticeably larger on phone, briefly moves away from the fighter, and must still be physically reached before firing resumes.
- An unarmed fighter remains vulnerable during recovery.
- The existing first-to-3, cover, headshot, two-body-hit and round-reset rules remain unchanged.

### Mobile gun feel
- The right-side aim/fire control remains the authoritative mobile control.
- Small aim drags are accepted at a lower threshold so the player's gun responds without requiring an exaggerated thumb movement.
- Fire cadence is shortened from the previous 520ms neutral cadence to 360ms while keeping ammo scarcity as the counterweight.
- The player starts each round able to fire immediately; there is no artificial initial half-second wait.

### Acceptance test
On a real phone, verify:
1. aim responds to small right-control drags and the gun visibly follows;
2. repeated firing consumes 8 rounds and stops at 0;
3. moving into the AMMO station starts a visible refill timer;
4. leaving early cancels the refill;
5. remaining exposed for the full 2.2 seconds is tactically vulnerable;
6. completing the refill restores 8 rounds and firing resumes;
7. an opponent can hit the player while refilling;
8. a gun hit visibly knocks the gun down and the player must walk over it before firing;
9. a round reset restores both fighters' ammo and guns;
10. completed Arena evidence includes shots fired without breaking existing phone reporting.


## Shooters Trigger — Arena Ammo & Gun-Drop Reliability Contract — September 22, 2026

- Neutral Arena magazines contain 12 shots per round; empty ammunition disables firing until the ammo station is reached.
- Refilling requires holding position for 2.5 seconds. The player is vulnerable during refill.
- The rival must travel to refill when empty and must not permanently stall against cover; blocked paths may slide around cover.
- Ammo resets on round reset. No reserve inventory or extra reload system is part of this baseline.
- A confirmed gun/grip hit uses the projectile segment and a phone-readable hit zone.
- On gun hit, the held gun/arms/muzzle disappear immediately. The dropped gun becomes a separate world object, lands beside the fighter, and stays fixed there until physical pickup.
- The gun never follows the fighter after it lands, and the fighter cannot fire while unarmed.
- The armed opponent can continue firing during recovery.
- Player-facing terminology is **GUN**, not **MARKER**.

### Acceptance
1. Empty the magazine and confirm firing stops.
2. Reach the station and hold for 2.5 seconds while vulnerable.
3. Confirm the rival can reach and refill without getting stuck.
4. Land a gun/grip hit and confirm the gun visibly leaves the fighter.
5. Confirm it stays at its landing spot.
6. Walk over it to recover it while the opponent can still fire.
7. Confirm round reset restores full ammo and the held gun.


## Shooters Trigger — Arena Combat Reliability & Refill Contract — September 22, 2026

The current neutral Arena baseline has been tightened around readable phone combat:

- **Ammo capacity:** 16 shots per gun. This is intentionally higher than the previous 12-shot baseline so a player has room to maneuver and fight before being forced to refill.
- **Recharge stations:** exactly **one** ammo station in the Arena. It remains a deliberate exposed tactical objective rather than a distributed convenience system.
- **Refill:** 2.5 seconds. The player cannot fire or move while the refill is active; leaving the station cancels the refill. The rival also remains committed to the station while refilling.
- **Vulnerability:** refill is a genuine commitment. The opponent can continue shooting, so reaching the station is not a safe reset.
- **Hit registration:** player/rival paint hits use swept projectile-line checks against readable head/body hit circles rather than relying only on the projectile's final frame position. Body hits are intentionally easier to register than the previous scrape-heavy threshold. Headshots remain instant eliminations.
- **Scrapes:** near misses remain recorded as scrapes, but a projectile crossing the body hit zone must resolve as a confirmed body hit.
- **Arena HUD:** one ammo readout only. The top row is reserved for title, score and ammo; the second row carries rival profile/status. Do not stack duplicate ammo/status text in the same top-right area.
- **Round reset:** confirmed elimination still awards the round, and the next round resets fighters after 700ms. 700ms means **0.7 seconds**.
- **Do not add more ammo stations or reserve ammo by default.** The current test target is whether the 16-shot magazine plus one dangerous refill station produces meaningful bullet discipline and positioning.


## Shooters Trigger — Arena Movement, Ammo & HUD Pass — September 22, 2026

This is the current Arena tuning checkpoint after phone playtesting:
- **Ammo capacity:** 24 shots per gun. The neutral baseline now gives enough firing room for movement, misses, cover fights and gun-drop recovery before a refill becomes necessary.
- **Ammo station:** exactly one station remains at the existing central/lower-central field position. It is a tactical destination, not a safe reset. Refill remains 2.5 seconds; the player cannot move or fire while committed.
- **Rival movement:** normal movement, refill travel and dropped-gun recovery now share obstacle-avoidance steering. The rival tests multiple steering angles plus cardinal escape directions when a preferred vector is blocked, so it must not remain welded to a bunker/barrier.
- **HUD:** persistent Arena HUD is reduced to match title, score and gun/ammo. Rival profile stats and control instructions are no longer permanent top-row text; contextual combat messages remain temporary/world-space.
- **Design intent:** preserve fire → move → cover → decide when to refill → survive the exposed refill → re-enter the fight, while reducing forced downtime and AI deadlocks.
- **Phone acceptance:** confirm the rival keeps moving around barriers, 24 shots feels like enough fighting without removing ammo discipline, the single station still creates a meaningful risky decision, and the top HUD stays readable during combat.


## Shooters Trigger — Arena 1v1 Combat, Reload Routes & Stealth Contract — September 22, 2026

The Arena is a 1v1-first combat experience. It must create positional fights and opportunities rather than a continuous circle around one resource point.

- Use **two mirrored side/rear ammo stations**, not a central reload station. Each station is a tactical route: reachable, exposed on approach, and never a safe zone.
- Keep **24 rounds** and **2.5s refill** for this checkpoint. Refilling locks the player in place and remains vulnerable to incoming paint.
- Cover must create real fights: peek/snap, retreat, change angle, push a vulnerable opponent, and relocate. Do not let the rival solve combat by endlessly orbiting the player.
- Rival movement must be purpose-driven: engage, reposition, use cover, pressure vulnerable states, recover a dropped gun, or route to the nearest refill. Obstacle avoidance prevents wedging but is not itself the combat AI.
- **Stealth/concealment:** trees provide temporary concealment. A player who is inside concealment, has not fired recently, and is not recovering a dropped weapon is hidden from direct rival targeting. Firing/recovering/revealing breaks stealth; the rival searches from the last known position instead of magically tracking the player.
- **Gun-drop contract:** a weapon hit must visibly knock the gun down, leave it at a fixed nearby ground position, remove the fighter's active weapon, and require physically walking over it to recover it. A fighter without a gun cannot fire.
- **Shot reliability:** projectile collision must use the swept projectile segment against weapon/head/body hit circles so a fast projectile cannot skip a target between frames. Weapon hit is resolved before body/head hit; body/head hits resolve damage and round points normally. Phaser's documented line/circle intersection APIs are the intended basis for this collision contract.
- A 1v1 round should feel like: **find position → snap/engage → move/change angle → exploit vulnerability → recover/reload → re-engage**, with a 60-second-style urgency rather than a stationary duel.
- Acceptance on phone: the rival does not permanently circle the player or ammo; reload routes pull combat sideways; cover creates opportunities to break line of sight; a hidden player can reposition before reappearing; deliberate shots produce visible hit feedback, gun drops, wounds, and eliminations.


## Shooters Trigger — Arena Single-Hit Elimination & Dead-Fighter Respawn Contract — September 22, 2026

This is the authoritative Arena combat contract for the current phone playtest. It supersedes the earlier two-body-hit/WOUNDED→DOWNED contract and the mistaken later interpretation that both fighters respawn together.

### Real match feel
- The Arena is a paintball 1v1 fight scored by eliminations.
- One confirmed body paint hit eliminates the target for that life. A confirmed headshot also eliminates immediately.
- Elimination visibly stops only the hit fighter, awards exactly one point to the shooter, clears active shots, and starts a short 700ms respawn transition.
- **Only the eliminated/dead fighter respawns.** The surviving shooter does not reset, teleport, lose their position, lose their gun, or refill their ammo.
- The eliminated fighter respawns back at that fighter's own side/spawn with full ammo, a held gun, clean paint and READY state.
- After the respawn, the fight continues. It is not a simultaneous round reset and not a return of both fighters to their starting sides.
- A fighter cannot continue exchanging paint after being eliminated; there must be no post-death splattering.

### Gun-drop distinction
- A gun/grip hit is a separate non-elimination event. It removes the held gun and forces physical recovery.
- The gun hit zone is deliberately smaller than the fighter body zone so ordinary body shots do not automatically count as gun shots.
- The dropped gun is a separate, high-visibility world object, lands beside the fighter, remains fixed there, and cannot follow the fighter.
- The fighter cannot fire while unarmed and must physically walk over the dropped gun to recover it.
- The armed opponent remains able to fire while the other fighter is recovering.

### Acceptance test
1. Shoot the opponent's body once: visible PAINT HIT → ELIMINATED → one point → only the eliminated fighter respawns at their side after 0.7s.
2. Confirm the surviving shooter remains where they were, with their current gun/ammo/state intact.
3. Confirm no second/in-flight projectile can award another point during the respawn transition.
4. Hit the opponent's gun deliberately: held gun visibly disappears and the dropped gun is clearly visible on the ground.
5. Confirm the opponent cannot fire until physically recovering the gun.
6. Confirm an ordinary body shot does not automatically become a gun knockout.
7. Confirm the respawned fighter returns with full ammo/gun while the survivor does not get reset.
8. Repeat from the opponent's side: the bot can be eliminated and respawned correctly when the player's hit lands.

## Shooters Trigger — Neutral Arena Combat Baseline & Tactical Opening — September 22, 2026

The Arena must be enjoyable as a paintball fight **before** training, equipment, or progression advantages are applied.

### Neutral baseline
- Both fighters start with the same base movement speed, firing cooldown, ammo capacity and neutral skill values.
- Arena combat must not silently apply Shooting Training or Evasion Camp performance bonuses while the neutral baseline is active.
- A confirmed body paint hit eliminates the target for that life; a headshot also eliminates immediately. The prior two-body-hit/wounded trading behavior is not an Arena rule.
- Only the eliminated fighter respawns on their own side. The surviving fighter keeps their position, gun, ammo and current state.
- A gun hit is a separate recovery event: the weapon drops visibly and the unarmed fighter must physically reach it before firing again.

### Tactical opening
- Do not spawn the player and rival in the same firing lane or at the same central coordinate.
- The player and rival begin on opposite sides of the field with substantial separation so the player has time to move, read the field and choose cover.
- The rival has a short opening-fire delay after the match starts and after its own respawn; this is an opening window, not a player power-up or invulnerability mechanic.
- The rival may fire only when it has a valid line of sight to the player and is inside the Arena engagement range. Solid bunkers/cover must therefore break the firing solution.
- The opening should create an actual positional fight: movement, cover, line-of-sight breaks, flanking/repositioning and deliberate shots should matter before the first elimination.
- Do not solve poor combat feel by increasing player damage, accuracy, armour or hidden progression. Fix spawn geometry, AI pressure, sight lines and cover interaction first.

### Arena acceptance test
1. Enter a fresh neutral Arena and confirm neither fighter is immediately in the other's direct firing lane.
2. Confirm the rival does not fire during the short opening window.
3. Move to cover and confirm solid cover blocks the rival's firing solution.
4. Leave cover/reposition and confirm the rival can reacquire and pressure the player.
5. Confirm one body hit eliminates immediately and no post-death paint exchange occurs.
6. Confirm only the eliminated fighter respawns on their own side while the survivor remains in place with their current gun/ammo.
7. Confirm gun-hit recovery remains separate from body elimination.
8. Repeat multiple rounds and verify the field remains a tactical fight rather than a spawn-to-spawn firing lane or endless paint exchange.


## Shooters Trigger — Arena Damage Levels, Scrapes & Stealth Finish Contract — September 22, 2026

This is the latest Arena combat tuning contract. It supersedes the earlier **single body hit = elimination** wording for the neutral Arena while preserving the rule that there must never be endless post-hit paint trading.

### Hit levels
- **SCRAPE:** a near-miss/grazing projectile around the fighter that does not enter the core body hit zone. It records as a scrape, gives light visual feedback, and does not consume a life or create a wounded state.
- **SOLID BODY HIT:** a confirmed core body hit removes one body-hit level. The first solid body hit wounds the fighter and visibly marks them; a second solid body hit eliminates them.
- **CLOSE IMPACT:** a core body hit at close engagement range is decisive and eliminates immediately. This makes a successful close/stealth attack materially more dangerous without creating automatic multi-shot splatter.
- **HEADSHOT:** the head hit zone is deliberately smaller than the body zone and is always an immediate elimination. Higher shooting skill affects spread/precision, so skilled players are more likely to land the difficult head or gun zones rather than receiving hidden damage bonuses.
- **GUN HIT:** a deliberate gun/grip hit is a separate disarm event. The gun drops visibly and the fighter must recover it physically. A follow-up body hit while unarmed is decisive; a follow-up headshot is the explicit **GUN DOWN + HEADSHOT** finish.
- A fighter who is wounded is slower and visibly marked, but is still dangerous. There is no automatic paint-trading loop: every projectile produces at most one scrape, disarm, wound, or elimination event and then disappears.

### Close-range and stealth intent
- Close distance is not a reason to spray paint repeatedly. It is a tactical risk/reward change: a clean core hit at close range is decisive, so a successful flank or ambush can end a life quickly.
- Trees now provide both **concealment and a small solid trunk cover zone**. Concealment hides the player from direct rival targeting while the player remains quiet; firing or the recent reveal window breaks stealth.
- A concealed player may move through the concealment zone and reposition. The rival searches from the player's last known position rather than tracking the hidden player directly.
- The Arena must contain practical stealth routes: side trees/natural concealment, hard cover transitions, and alternate approaches around the main firing lanes. Stealth should create an opportunity to change angle and set up a close decisive shot, not become permanent invisibility.
- The enemy locator may show the rival, but it must not reveal a concealed player's position to the rival AI.

### Combat acceptance
1. Near miss around the fighter records **SCRAPE** without damaging the life state.
2. First solid core body hit produces **WOUNDED** and leaves the fighter alive.
3. Second solid body hit eliminates; there is no third/fourth/fifth-shot paint exchange.
4. A clean close-range core hit can eliminate immediately.
5. A headshot can eliminate immediately from any legal range.
6. A gun hit drops the weapon; walking over it recovers it; gun-down plus a follow-up body/head hit can finish decisively.
7. Entering tree concealment after breaking sight prevents the rival from directly targeting the player; leaving concealment or firing reveals the player again.
8. Repositioning through concealment can produce a flank/ambush rather than forcing a head-on duel.
9. Only the eliminated fighter respawns; the survivor keeps their position, gun, ammo and state.
10. Repeat the fight at neutral baseline before testing any progression or equipment advantages.


## Shooters Trigger — Arena Stealth Readability & HUD Clean-up Contract — September 22, 2026

The Arena must communicate stealth without covering the fight in interface clutter.

### Stealth readability
- Natural concealment spots are marked in the world with a restrained **HIDE** cue when the player approaches them.
- Entering an active concealment zone changes that cue to **HIDDEN**, making the player's tactical state obvious without exposing the player to the rival AI.
- The cue is proximity-based rather than a permanent map overlay, so the field remains readable.
- Stealth routes should use natural trees/concealment plus hard-cover transitions and alternate approaches. Online paintball strategy references reviewed September 22, 2026 distinguish concealment from hard cover and describe concealment as useful for flanking/ambushes, with firing breaking concealment.

### HUD discipline
- Arena HUD is intentionally minimal: **score**, **ammo**, and a small **pause** control.
- Remove the large tactical locator/map overlay from the Arena HUD. The player should read the field itself and use cover/concealment rather than fight through a second map layer.
- Do not place the pause control over the map or beside another large overlay.
- Do not maintain a separate always-visible EXIT button; leaving is available through the pause panel.
- Combat callouts remain transient world feedback, not permanent HUD panels.
- Any future Arena HUD addition must justify itself against the core rule: the player should be looking at the paintball fight, not at interface furniture.

### Acceptance
1. On a phone, the pause button is isolated and does not sit on top of a tactical map.
2. Score/ammo remain readable without crowding the top edge.
3. No permanent enemy locator/map widget is present.
4. Approaching a tree/concealment route visibly communicates **HIDE**.
5. While concealed, the nearby cue communicates **HIDDEN**.
6. The player can still see and use the actual field, cover, flanking routes and opponent without HUD obstruction.
7. Playtest specifically checks that a scrape/hit/respawn is not caused by accidental interaction with an overlapping HUD control.
