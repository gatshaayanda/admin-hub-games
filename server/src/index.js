import { defineServer, defineRoom } from "colyseus";
import { OnlineArenaRoom } from "./OnlineArenaRoom.js";

const server = defineServer({
  rooms: {
    shooters_online: defineRoom(OnlineArenaRoom),
  },
});

server.listen(Number(process.env.PORT || 2567));
