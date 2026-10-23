# Living World module

This directory is the isolated foundation for the Living World game. It starts with the shared simulation and persistence model, not the renderer or final animal assets.

Current stage: foundation setup. The module is not yet registered in the Game Library and is not a playable or deployed game.

Planned initial files:
- `types.ts` — versioned world and entity state.
- `simulation.ts` — deterministic elapsed-time advancement.
- `save.ts` — schema validation and local save/load (next gate).
- tests — time progression, repeated resume, clock rollback, needs/resource boundaries and save recovery.

Do not add placeholder geometry or route this module into the production catalog until it has a real end-to-end playable entry. Follow `docs/LIVING-WORLD-SIMULATION-ROADMAP.md` and `docs/LIVING-WORLD-ASSET-SHORTLIST.md`.
