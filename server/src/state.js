import { schema, t } from "@colyseus/schema";

export const OnlinePlayer = schema({
  name: t.string(),
  color: t.number(),
  x: t.number(),
  y: t.number(),
  facing: t.number(),
  moving: t.boolean(),
  alive: t.boolean(),
  score: t.number(),
  bodyHits: t.number(),
});

export const OnlineState = schema({
  players: t.map(OnlinePlayer),
  status: t.string(),
  roomCode: t.string(),
  winner: t.string(),
}, "OnlineState");
