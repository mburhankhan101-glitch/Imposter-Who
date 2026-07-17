// Standalone room server — replaces PartyKit's shared hosting (which hit
// Cloudflare's org-wide 10,000-custom-domain quota on partykit.dev and can't
// be deployed to). Reuses the exact same game logic from `party/room.ts`
// unmodified: that class only needs an object shaped like `Party.Room`
// (`.id` + `.getConnections()`) and connections shaped like `Party.Connection`
// (`.id` + `.send()`), which `FakeRoom`/`FakeConnection` below provide over
// plain `ws`. The client (hooks/useRoom.ts via `partysocket`) is untouched —
// it just needs `NEXT_PUBLIC_PARTYKIT_HOST` pointed at wherever this server
// is deployed, since partysocket is a generic reconnecting-WebSocket client,
// not something that only talks to Cloudflare.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, type WebSocket } from "ws";
import RoomServer from "../party/room";

interface FakeConnection {
  id: string;
  send(data: string): void;
}

class FakeRoom {
  connections = new Map<string, FakeConnection>();
  constructor(public id: string) {}
  getConnections<T>(): Iterable<T> {
    return this.connections.values() as unknown as Iterable<T>;
  }
}

const rooms = new Map<string, { room: FakeRoom; server: RoomServer }>();

function getOrCreateRoom(code: string) {
  let entry = rooms.get(code);
  if (!entry) {
    const room = new FakeRoom(code);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const server = new RoomServer(room as any);
    entry = { room, server };
    rooms.set(code, entry);
  }
  return entry;
}

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("imposter-who room server is running");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws: WebSocket, req) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  // partysocket connects to /parties/<party>/<room> — party defaults to "main"
  const parts = url.pathname.split("/").filter(Boolean);
  const roomCode = (parts[2] ?? "").toLowerCase();
  const id = url.searchParams.get("_pk") ?? randomUUID();

  if (!roomCode) {
    ws.close();
    return;
  }

  const { room, server } = getOrCreateRoom(roomCode);
  const conn: FakeConnection = {
    id,
    send: (data: string) => {
      if (ws.readyState === ws.OPEN) ws.send(data);
    },
  };
  room.connections.set(id, conn);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.onConnect(conn as any);

  ws.on("message", (data) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.onMessage(data.toString(), conn as any);
  });

  ws.on("close", () => {
    // Only clear the map entry if it's still this connection — an id can
    // reconnect (new ws) before the old socket's close event fires.
    if (room.connections.get(id) === conn) {
      room.connections.delete(id);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.onClose(conn as any);
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 1999;
httpServer.listen(port, () => {
  console.log(`Room server listening on :${port}`);
});
