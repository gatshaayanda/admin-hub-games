import { defineRoom, defineServer } from "colyseus";
import { ShootersOnlineRoom } from "./rooms/ShootersOnlineRoom.js";

export const server = defineServer({
  rooms: {
    shooters_online: defineRoom(ShootersOnlineRoom),
  },
  express: (app) => {
    app.get("/", (_req, res) => {
      res.json({
        service: "admin-hub-games-online",
        room: "shooters_online",
        status: "ok",
      });
    });
  },
});
