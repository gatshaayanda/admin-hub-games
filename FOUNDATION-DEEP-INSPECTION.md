# Admin Hub Games — Deep Inspection

Date: 2026-09-18
Checkpoint inspected: f56178823f362f7f319c09853b82373d6e338cc6

## ELI5

The foundation works, but a few parts are still temporary wiring.

1. The paperwork was stale: one handoff described FIT scaling and an old commit while the code uses RESIZE and a newer checkpoint.
2. Starting a game could wait for the internet because Firebase profile saving was awaited before entering the world.
3. Tapping a landmark could teleport the player, which fights the walk-and-discover idea.
4. Desktop lost part of its tap-to-walk area because a mobile-only bottom dock was reserved on desktop too.
5. Mobile had two Gamebook buttons.
6. Vitest was installed but there were no tests, so a new catalog title could fail its test command just for having zero tests.
7. The manifest needed to live in Vite's public static-asset path.
8. World Notes currently download the whole collection and filter it in the browser; that will not scale as the community grows.
9. Gamebook localStorage is parsed without validating the shape of the saved data.
10. Audio has an active global implementation plus older unused GameShell ambient methods.
11. The meta-world currently has no physical collision/path system. That is acceptable for the current free-roam slice but is not yet a reusable collision foundation.
12. Installable/offline PWA behavior is not finished; the manifest is only one part of that work.

## Fixed now

- Firebase profile persistence is best-effort and no longer blocks entry.
- landmark clicks no longer teleport the player.
- desktop tap-to-walk keeps the full viewport.
- mobile keeps one clear Gamebook control.
- zero-test Vitest runs no longer block a new title.
- browser theme color matches the publisher identity.
- the manifest is aligned with Vite public static assets.

## Next, in order

P0: finish the real-phone first-playthrough gate.

P1: better player animation, modal polish, more life, scoped Firestore reads, validated Gamebook state, audio consolidation and Firebase verification.

P2: service-worker/offline PWA behavior and catalog metadata.

P3: reusable collision, dialogue, quests, grid/board, inventory, score, progression and level systems only when actual games prove the need.

## Verification note

This was a deep source inspection, not a claim of phone testing. Real-device mobile verification remains a product gate.