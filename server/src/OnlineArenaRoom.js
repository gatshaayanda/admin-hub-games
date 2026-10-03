import { Room } from "colyseus";
import { OnlinePlayer, OnlineState } from "./state.js";

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1400;
const SPEED = 170;
const BODY_HITS = 2;

const COVERS = [
  [690, 360, 190, 72],
  [1470, 350, 230, 76],
  [520, 760, 250, 70],
  [1570, 760, 220, 68],
  [850, 1030, 260, 74],
  [1420, 1080, 240, 72],
  [1080, 300, 90, 70],
  [1900, 650, 90, 70],
  [730, 1170, 90, 70],
  [294, 294, 12, 52],
  [2044, 314, 12, 46],
  [344, 1128, 12, 46],
  [2064, 1114, 12, 52],
];

function blocked(x, y, padding = 14) {
  return COVERS.some(([cx, cy, width, height]) =>
    x >= cx - padding &&
    x <= cx + width + padding &&
    y >= cy - padding &&
    y <= cy + height + padding
  );
}

function clampPlayer(x, y) {
  return {
    x: Math.max(42, Math.min(WORLD_WIDTH - 42, x)),
    y: Math.max(90, Math.min(WORLD_HEIGHT - 50, y)),
  };
}

export class OnlineArenaRoom extends Room {
  maxClients = 2;
  state = new OnlineState();

  onCreate() {
    this.state.status = "WAITING";
    this.state.winner = "";
    this.state.roomCode = this.roomId;

    this.onMessage("input", (client, input) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || this.state.status === "FINISHED") return;

      const moveX = Number(input?.moveX) || 0;
      const moveY = Number(input?.moveY) || 0;
      const length = Math.hypot(moveX, moveY) || 1;

      if (moveX || moveY) {
        const next = clampPlayer(
          player.x + (moveX / length) * SPEED * 0.05,
          player.y + (moveY / length) * SPEED * 0.05,
        );
        if (!blocked(next.x, next.y)) {
          player.x = next.x;
          player.y = next.y;
        }
        player.facing = moveX < -0.08 ? -1 : moveX > 0.08 ? 1 : player.facing;
        player.moving = true;
      } else {
        player.moving = false;
      }

      if (input?.fire) {
        this.resolveShot(client.sessionId, Number(input.aimX) || 0, Number(input.aimY) || 0);
      }
    });
  }

  onJoin(client, options) {
    if (this.state.players.size >= 2) {
      throw new Error("ONLINE ARENA IS FULL");
    }

    const slot = this.state.players.size;
    const player = new OnlinePlayer();
    player.name = String(options?.name || "PLAYER").trim().slice(0, 24) || "PLAYER";
    player.color = slot === 0 ? 0x2f6b4e : 0x9b3f3f;
    player.x = slot === 0 ? 360 : 2040;
    player.y = slot === 0 ? 1040 : 430;
    player.facing = slot === 0 ? 1 : -1;
    player.moving = false;
    player.alive = true;
    player.score = 0;
    player.bodyHits = 0;
    this.state.players.set(client.sessionId, player);

    if (this.state.players.size === 2) {
      this.state.status = "LIVE";
    }
  }

  onLeave(client) {
    this.state.players.delete(client.sessionId);
    if (this.state.players.size < 2 && this.state.status === "LIVE") {
      this.state.status = "WAITING";
    }
  }

  resolveShot(attackerId, aimX, aimY) {
    if (this.state.status !== "LIVE") return;

    const attacker = this.state.players.get(attackerId);
    const targetEntry = [...this.state.players.entries()].find(([id]) => id !== attackerId);
    if (!attacker || !targetEntry) return;

    const [, target] = targetEntry;
    const length = Math.hypot(aimX, aimY);
    if (length < 0.2) return;

    const dx = aimX / length;
    const dy = aimY / length;
    const toX = target.x - attacker.x;
    const toY = target.y - attacker.y;
    const projection = toX * dx + toY * dy;
    if (projection < 0 || projection > 720) return;

    const closestX = attacker.x + dx * projection;
    const closestY = attacker.y + dy * projection;
    const distance = Math.hypot(target.x - closestX, target.y - closestY);

    // V1 online checkpoint: server-authoritative body hit only.
    // Head/body/cover parity with the offline Arena remains the next combat
    // checkpoint; this keeps the two-device connection test deliberately small.
    if (distance > 34) return;
    if (this.segmentBlocked(attacker.x, attacker.y, target.x, target.y)) return;

    target.bodyHits += 1;
    if (target.bodyHits >= BODY_HITS) {
      target.alive = false;
      attacker.score += 1;
      target.bodyHits = 0;
      target.alive = true;

      if (attacker.score >= 3) {
        this.state.status = "FINISHED";
        this.state.winner = attacker.name;
        return;
      }

      // Reset the round positions without destroying the room.
      const players = [...this.state.players.values()];
      players[0].x = 360;
      players[0].y = 1040;
      players[0].facing = 1;
      players[1].x = 2040;
      players[1].y = 430;
      players[1].facing = -1;
      players.forEach((p) => { p.alive = true; p.bodyHits = 0; p.moving = false; });
    }
  }

  segmentBlocked(x1, y1, x2, y2) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 18);
    for (let index = 1; index < steps; index += 1) {
      const t = index / steps;
      if (blocked(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 0)) return true;
    }
    return false;
  }
}

