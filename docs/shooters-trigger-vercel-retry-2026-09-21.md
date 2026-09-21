# Shooters Trigger — Vercel Retry Checkpoint

Vercel hit a deployment limit while processing the previous main build.

The TypeScript build fixes are already present in main. This checkpoint intentionally changes documentation only so GitHub receives a fresh main push and Vercel can retry the deployment.

Build fixes present:
- Arena update parameters typed as numbers.
- Evasion update parameters typed as numbers.
- Media scene unused create data renamed to `_data`.

Previous source-fix commits:
- 201ba50cfbd7b324cae8c8d761bd0e1e037dfaf9
- 0d4778f4678286059443b571550e89e9b509401e
- 7a987deda4e8a1a0243597dd6ec8b59ce0e4a650
