# Paws World scoped implementation rules

- The current playable slice has **one player-named dog**. Do not reintroduce the older Jackie/Tiger/Percy selector into this game.
- Preserve the existing local save key and legacy save recovery when changing care state or naming.
- Keep movement and gameplay available on narrow portrait screens and short landscape screens. Respect safe-area insets, avoid clipped actions, and keep touch targets comfortably tappable.
- Keep the simulation and positional flock behaviour intact when changing presentation. The HERD action must not teleport the flock.
- Do not claim imported sprite animation is implemented until the actual image/archive contents, frame layout, viewpoint and licence are inspected and the chosen frames are integrated.
- Preserve the shared Phaser shell and all other games. Do not replace the app root or detach the live Phaser canvas.
- Bump the service-worker cache version for shipped asset/UI changes. Build/test results are not a substitute for phone, browser-console and offline QA.
