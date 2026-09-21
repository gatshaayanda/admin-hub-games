# Shooters Trigger build fix — 2026-09-21

Fixed the Vercel TypeScript build failure in `ShootersTriggerLobbyScene.ts`.

The Phaser text style was using `alpha` inside the `add.text` style object, but this project's Phaser TypeScript definitions reject that property there. The lobby instruction now uses a valid typed text style.

Source fix commit: `968bd8c380c82b45b1859771472e9feae642c291`.

The reported failure was:
`TS2353: Object literal may only specify known properties, and 'alpha' does not exist in type 'TextStyle'.`
