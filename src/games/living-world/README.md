# Living World module

This directory is the isolated foundation for the Living World game. It starts with the shared simulation and persistence model, not the renderer or final animal assets.

Current stage: early IN DEVELOPMENT foundation. The Game Library entry launches an Intro → Setup → simulation dashboard with a local save, care actions and a time-advance test control. It is a management/simulation testbed, not the promised 3D animal game: there are no animated animal models, direct movement controls, herding AI or wildlife mode yet. Do not describe those as implemented.

Planned initial files:
- `types.ts` — versioned world and entity state.
- `simulation.ts` — deterministic elapsed-time advancement.
- `save.ts` — schema validation and local save/load (next gate).
- tests — time progression, repeated resume, clock rollback, needs/resource boundaries and save recovery.

Do not add placeholder geometry or route this module into the production catalog until it has a real end-to-end playable entry. Follow `docs/LIVING-WORLD-SIMULATION-ROADMAP.md` and `docs/LIVING-WORLD-ASSET-SHORTLIST.md`.
