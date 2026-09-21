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
