# Shooters Trigger Online Server

This is the first two-player Online Arena server checkpoint.

## Run

```bash
npm install
npm start
```

The server listens on port 2567 by default.

Set the frontend's `VITE_COLYSEUS_URL` to the server URL. Local development can use:

```
VITE_COLYSEUS_URL=http://localhost:2567
```

For production, deploy this Node/Colyseus service to a WebSocket-capable Node host and use its HTTPS URL. Colyseus 0.18 provides authoritative rooms and the production server should run as a long-lived Node process.

## Current checkpoint

- maximum two players per room;
- existing Shooter Setup name is sent as the player's identity;
- player 1 is green, player 2 is red;
- room ID is the share code;
- synchronized movement;
- server-side body-hit test and first-to-3 score;
- same 2400×1400 coordinate space and Arena cover vocabulary.

Head/body distinction, lag compensation, prediction/reconciliation and full offline-Arena combat parity are deliberately the next checkpoint, not silently mixed into this connection test.
