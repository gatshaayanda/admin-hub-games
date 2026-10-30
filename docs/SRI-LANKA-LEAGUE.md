# Sri Lanka League — Birthday Edition

## Game promise
A small, cartoon-styled Botswana street-football challenge made as a birthday gift for Mosiro (Katso / Sri Lanka).

## First playable scope
- One controllable footballer named Sri Lanka.
- A compact Botswana neighbourhood street scene with simple houses, a tuckshop, roadside details and a few animated onlookers.
- One open goal made from two brick markers; deliberately no net or crossbar.
- One physical football with gravity, bounce, rolling friction, boundary collision, brick-post collision and valid goal-mouth detection.
- First to three goals wins.
- A game-specific pause/restart/return menu.
- No opponent team, career progression, online play, account, Firebase writes or new backend in this birthday slice.

## Controls
- Phone: left analogue stick to move; RUN to sprint; KICK to shoot.
- Desktop: WASD / arrow keys to move; Shift to sprint; Space to kick; P / Escape to pause.

## Technical design
- Three.js renders the low-poly/toon-shaded world in a dedicated overlay owned by the Phaser SriLankaLeagueGameScene.
- Phaser continues to own the shared publisher intro, game library and game-specific intro/setup handoff.
- Human movement is ground-plane only. The follow camera stays behind the player; there is no flight, thrust, altitude control or spacecraft movement.
- physics.ts is renderer-independent and deterministic. It owns ball integration, gravity, ground bounce, friction, boundary response, brick-post response and goal crossing.
- physics.test.ts covers bounce settling, valid/invalid goals and boundary reflection.
- The scene is isolated under src/games/sri-lanka-league/ and its own Phaser scenes. Existing games and the PWA install behaviour remain untouched.

## Known limitations / QA
- This is a solo target-shooting challenge, not a full 11-a-side match.
- The avatar and spectators are procedural low-poly characters; no third-party assets are required for the first slice.
- Real Android touch QA and a live deployment smoke test remain owner acceptance steps.
