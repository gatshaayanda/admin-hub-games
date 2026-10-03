import { Client, Room } from "colyseus";
import { MapSchema, Schema, type } from "@colyseus/schema";

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1400;
const PLAYER_RADIUS = 42;
const MOVE_SPEED = 170;
const TICK_RATE = 20;

export class PlayerState extends Schema {
  @type("string") name = "PLAYER";
  @type("number") x = 360;
  @type("number") y = 1040;
  @type("number") aimX = 1;
  @type("number") aimY = 0;
  @type("number") color = 0x2f6b4e;
  @type("boolean") firing = false;
}

export class ShootersOnlineState extends Schema {
  @type("string") status = "WAITING";
  @type("string") roomCode = "";
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}

type InputMessage = {
  moveX?: unknown;
  moveY?: unknown;
  aimX?: unknown;
  aimY?: unknown;
  fire?: unknown;
};

export class ShootersOnlineRoom extends Room<ShootersOnlineState> {
  maxClients = 2;

  private inputs = new Map<string, { moveX: number; moveY: number; aimX: number; aimY: number; fire: boolean }>();

  onCreate() {
    this.setState(new ShootersOnlineState());
    this.state.roomCode = this.roomId;

    this.onMessage("input", (client, raw: InputMessage) => {
      const moveX = this.numberOrZero(raw?.moveX);
      const moveY = this.numberOrZero(raw?.moveY);
      const aimX = this.numberOrZero(raw?.aimX);
      const aimY = this.numberOrZero(raw?.aimY);
      const fire = raw?.fire === true;
      const aimLength = Math.hypot(aimX, aimY);

      this.inputs.set(client.sessionId, {
        moveX: Math.max(-1, Math.min(1, moveX)),
        moveY: Math.max(-1, Math.min(1, moveY)),
        aimX: aimLength > 0.05 ? aimX / aimLength : 1,
        aimY: aimLength > 0.05 ? aimY / aimLength : 0,
        fire,
      });
    });

    this.setSimulationInterval(() => this.tick(), 1000 / TICK_RATE);
  }

  onJoin(client: Client, options: { name?: unknown }) {
    const slot = this.state.players.size;
    const player = new PlayerState();
    player.name = this.safeName(options?.name);
    player.x = slot === 0 ? 360 : WORLD_WIDTH - 360;
    player.y = slot === 0 ? 1040 : 430;
    player.color = slot === 0 ? 0x2f6b4e : 0x9b3f3f;

    this.state.players.set(client.sessionId, player);
    this.inputs.set(client.sessionId, { moveX: 0, moveY: 0, aimX: 1, aimY: 0, fire: false });

    if (this.state.players.size === 2) {
      this.state.status = "LIVE";
    }
  }

  onLeave(client: Client) {
    this.inputs.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
    if (this.state.players.size < 2) this.state.status = "WAITING";
  }

  private tick() {
    for (const [sessionId, player] of this.state.players) {
      const input = this.inputs.get(sessionId);
      if (!input) continue;

      const length = Math.hypot(input.moveX, input.moveY);
      if (length > 0.001) {
        const step = MOVE_SPEED / TICK_RATE;
        player.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_WIDTH - PLAYER_RADIUS, player.x + (input.moveX / length) * step));
        player.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_HEIGHT - PLAYER_RADIUS, player.y + (input.moveY / length) * step));
      }

      player.aimX = input.aimX;
      player.aimY = input.aimY;
      player.firing = input.fire && this.state.status === "LIVE";
    }
  }

  private numberOrZero(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }

  private safeName(value: unknown) {
    if (typeof value !== "string") return "PLAYER";
    const name = value.trim().slice(0, 18);
    return name || "PLAYER";
  }
}
