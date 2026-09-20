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
Develop this pass on `shooters-trigger-phone-offline`. Do not merge or modify `main` unless the product owner explicitly asks for promotion.

### Research references
- Phaser Input: https://docs.phaser.io/phaser/concepts/input
- Phaser Pointer API: https://docs.phaser.io/api-documentation/class/input-pointer
- Rockstar Red Dead Redemption mobile touch layout: https://support.rockstargames.com/articles/CwtYAazPxaxyxtxy868jO/changing-touch-controls-layout-for-red-dead-redemption-on-android-and-ios
- Twin-stick / touch shooter usability: https://www.gamedeveloper.com/design/a-guide-to-ios-twin-stick-shooter-usability
- Mobile touch controls case study: https://www.gamedeveloper.com/design/the-challenges-of-developing-for-pc-and-mobile-part-1-controls
