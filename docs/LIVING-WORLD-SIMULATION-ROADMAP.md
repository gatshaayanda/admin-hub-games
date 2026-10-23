# Living World — Shared Simulation Roadmap

**Status:** Approved direction and implementation roadmap. Not yet a playable game or production library entry.
**Platform:** Admin Hub Games, `gatshaayanda/admin-hub-games`
**Core decision:** Build one living-world simulation first. Animal care, goat herding/farm management, and wildlife exploration/tracking (with hunting considered later) are modes over the same persistent world.

## Product promise

The world should feel like it has a life beyond the current play session. A player can leave for hours or days and return to meaningful changes: animals have eaten, rested, grown or moved; water and grazing resources changed; plants advanced through growth stages; weather and season shifted; and the return report explains the important events. The world must not punish ordinary absences unfairly.

## Architecture boundaries

```
Admin Hub Games shell (protected)
  └── Living World game module
       ├── Simulation core (pure TypeScript; deterministic and tested)
       ├── Versioned save / migration / offline clock
       ├── Ecology: animals, herd, food, water, plants, weather, seasons
       ├── Event log and return report
       ├── Mode rules: care | herding/farm | wildlife
       └── Presentation adapter: 3D renderer, camera, controls, audio, UI
```

The simulation core must not import Phaser, Three.js, DOM APIs, Firebase or rendering assets. Renderers read state and submit player actions; the core applies rules and returns the next state/events. This separation allows a renderer choice to change without rewriting the ecology or save format.

## Phase 0 — inspect and curate assets

- Inventory all ZIPs in Vula's `game-assets/source-zips/`; do not infer contents from filenames alone.
- Extract candidates into a temporary audit location, not into production assets immediately.
- Preview models in Blender or a GLTF viewer. Record file format, triangle count, scale, materials, textures, skeleton/rig, animation clips, file size and licence.
- Select one consistent stylized art direction. Prefer real animated animal models over geometric placeholders.
- Prototype one animal plus a small terrain patch before committing to a renderer.
- Existing candidate packs: `kenney_tiny-farm.zip`, `kenney_pixel-platformer-farm-expansion.zip`, `kenney_pixel-platformer-food-expansion.zip`, `kenney_mini-characters.zip`, and `kenney_digital-audio.zip`. These may be useful for props/audio or 2D references; inspect their actual contents and do not assume they contain a suitable animated 3D goat.

**Gate:** asset evidence sheet with previews, licence notes and one recommended art set.

## Phase 1 — world-state model

Create a dedicated `src/games/living-world/` module. Suggested first files:

- `types.ts`: versioned WorldState, AnimalState, HerdState, PlantPatchState, WaterSourceState, WeatherState, SeasonState and WorldEvent.
- `simulation.ts`: deterministic bounded time advancement and ecological rules.
- `clock.ts`: timestamp handling and elapsed-time policy.
- `save.ts`: local save/load, validation, migration and recovery.
- `return-report.ts`: concise summary of changes since last visit.
- `*.test.ts`: deterministic tests for rules and save/resume cases.

Start with a small number of entities, not hundreds. A first world may contain a handful of goats, one herd, a few grazing patches, one water trough, shade/shelter and a handful of plant patches. No rendering is needed to prove the model.

**Gate:** unit tests prove deterministic results for the same initial state/actions/elapsed time; invalid state cannot corrupt the save.

## Phase 2 — time and persistence

- Store the last simulated timestamp and a schema version.
- On resume, compute elapsed time once and advance bounded simulation steps; persist the new timestamp only after a successful state update.
- Avoid double-applying elapsed time on repeated refreshes/restarts.
- Handle a device clock moving backwards, very long absence, malformed save data, migrations and duplicate sync safely.
- Local-first save is required. Cloud sync is deferred until local state and conflict policy are proven.
- If sync is later added, define ownership and conflict semantics explicitly; never blindly overwrite a newer world state.

**Gate:** test close/reopen, repeated resume, clock rollback, long absence, corrupted JSON and offline operation.

## Phase 3 — ecological progression

Add these in small verified slices:
1. animal hunger/thirst/energy/comfort and autonomous seeking of available food, water, shade and safety;
2. grazing depletion and plant recovery;
3. plant growth stages and seasonal modifiers;
4. weather and temperature/heat pressure;
5. herd cohesion, leader/follower relationships, fear/stress and movement intent;
6. age/life stages, trust/personality and later breeding cooldowns/offspring;
7. a clear event log and return summary.

Offline simulation does not animate every frame while the browser is closed. It advances world state from elapsed time and summarizes what happened. Use bounded time and sensible rate limits. The default mode should not casually kill animals because the player missed a few days.

**Gate:** known elapsed-time scenarios produce expected state transitions and understandable events.

## Phase 4 — first playable world integration

Only after Phases 1–3 pass, add the game to the shared catalog with its own Intro → Setup → Gameplay flow. Until that point, do not publish a non-functional placeholder card. The first catalog entry must launch a real playable foundation, even if the content is intentionally small and marked IN DEVELOPMENT.

- Keep Hall, President's Shoes, Shooters Trigger and Wardrobe unchanged.
- Register only the new game's scenes and catalog identifier needed for launch.
- Do not change shared shell flows or Firebase rules as a shortcut.
- The world should be viewable, saveable and resumable, with a visible return report.

**Gate:** normal production URL shows the new entry only after it is present on main and a production smoke test confirms Intro → Setup → Gameplay; existing game launch paths still work.

## Phase 5 — real 3D animals and interaction

Evaluate a dedicated Three.js/WebGL renderer beside the existing Phaser platform. Do not replace Phaser globally. Import glTF/GLB assets where possible and verify that the model has useful authored locomotion animations. FBX/Blend sources may need a deliberate conversion step.

- Camera: comfortable third-person/over-the-shoulder or elevated follow camera; responsive touch framing.
- Animal locomotion: walk/trot/run/idle/eat/drink/turn/rest, with grounded feet and speed-matched animation.
- Controls: mobile joystick, context actions and optional direct animal control.
- Collision: player, terrain, fences, gates and obstacles use collision/constraints; do not treat a visual fence as solid without collision.
- AI: wander, seek food/water/shade, follow, flee, avoid obstacles, cohesion/separation and gate approach.
- Performance: cap herd counts and update rates; use LOD/instancing only when justified; monitor texture memory and load times.

**Gate:** real phone QA verifies movement, camera, collisions, animation transitions, gate traversal, performance and pause/resume.

## Phase 6 — gameplay modes over shared ecology

### Animal life / Tamagotchi
Name and bond with animals; feed, water, groom/train, observe growth, health, trust and relationships. Offline return events create a reason to revisit without manipulative punishment.

### Goat herding / farm
Move a herd through gates and back to a kraal, manage grazing rotation and water, work with a herding dog or human avatar, and respond to individual animal personalities. Herding is about positioning and pressure, not tapping a teleport target.

### Wildlife exploration
Reuse habitats, time, weather, plants, animal perception, tracks and flee behaviour. Start with observation, photography and tracking. Consider hunting only as a later deliberate mode; do not build a separate ecosystem.

**Gate:** each mode has one complete, enjoyable objective and uses the same persisted world state.

## Phase 7 — release hardening

- Update service-worker cache/version strategy for all shipped model, texture, animation, audio and environment files.
- Verify a prior online load makes required assets available for offline launch.
- Test installed Android PWA offline, local save recovery and reconnect behaviour.
- Test small and large screens, safe areas, touch controls, pause/visibility changes and low-memory devices.
- Measure initial download size; compress textures/audio and load optional assets only when needed.
- Record asset provenance and licence in `docs/LIVING-WORLD-ASSET-REGISTER.md`.
- Protect other game flows with smoke tests and real production QA.

## Non-negotiable verification protocol

START → inspect current main and relevant source → implement one controlled slice → review diff → test → production build → browser/device QA appropriate to the slice → checkpoint on main → report commit and exactly what passed.

Unexpected result = STOP → inspect actual state and first failure → fix only the proven cause → verify again. Do not bundle unrelated refactors. A successful build is not proof that the game feels good, the save resumes correctly or the installed PWA works offline.
