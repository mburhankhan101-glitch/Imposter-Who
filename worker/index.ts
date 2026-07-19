// Cloudflare Worker + Durable Object host for the Imposter-Who room server.
//
// Why this exists: PartyKit's shared hosting is unavailable, and Fly/Render now
// require a credit card. The Cloudflare Workers *free* plan includes Durable
// Objects (SQLite-backed) with no card and no cold-start sleep — and it's the
// same tech PartyKit runs on. Our Node `ws` server (server/index.ts) can't run
// on the Workers runtime, so this adapts the SAME game logic in party/room.ts
// to a Durable Object.
//
// One Durable Object instance == one game room, keyed by the room code (like
// party/room.ts's design). Room state lives in the DO's memory for the room's
// lifetime — no database needed. The client (partysocket) is unchanged; it just
// needs NEXT_PUBLIC_PARTYKIT_HOST pointed at the deployed *.workers.dev host.
import Room from "../party/room";

interface Conn {
  id: string;
  send(data: string): void;
}

/** Durable Object: holds the live connections + one Room game-logic instance. */
export class RoomDO {
  private conns = new Map<string, Conn>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private room: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(_state: any, _env: any) {}

  /** Lazily build the Room once we know the room code (from the URL path). */
  private ensureRoom(code: string) {
    if (this.room) return;
    const self = this;
    // party/room.ts only needs `{ id, getConnections() }` from Party.Room.
    const fakeRoom = {
      id: code,
      getConnections: () => self.conns.values(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room = new Room(fakeRoom as any);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    // partysocket connects to /parties/<party>/<room>; party defaults to "main".
    const parts = url.pathname.split("/").filter(Boolean);
    const code = (parts[2] ?? "").toLowerCase();
    if (!code) return new Response("missing room", { status: 400 });
    this.ensureRoom(code);

    // partysocket passes the persisted client id as `_pk` — this is what lets a
    // player reconnect mid-game and keep their seat (party/room.ts matches on it).
    const id = url.searchParams.get("_pk") ?? crypto.randomUUID();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pair = new (globalThis as any).WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    const conn: Conn = {
      id,
      send: (data: string) => {
        try {
          server.send(data);
        } catch {
          /* socket already closed */
        }
      },
    };
    this.conns.set(id, conn);
    this.room.onConnect(conn);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.addEventListener("message", (event: any) => {
      const data =
        typeof event.data === "string"
          ? event.data
          : new TextDecoder().decode(event.data as ArrayBuffer);
      this.room.onMessage(data, conn);
    });

    const handleClose = () => {
      // Only drop the map entry if it's still this connection — an id can
      // reconnect (new socket) before the old socket's close event fires.
      if (this.conns.get(id) === conn) this.conns.delete(id);
      this.room.onClose(conn);
    };
    server.addEventListener("close", handleClose);
    server.addEventListener("error", handleClose);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(null, { status: 101, webSocket: client } as any);
  }
}

export default {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetch(request: Request, env: any): Promise<Response> {
    const upgrade = request.headers.get("Upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      // Plain HTTP hit (health check / browser) — not a WebSocket handshake.
      return new Response("imposter-who room server is running");
    }
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const code = (parts[2] ?? "").toLowerCase();
    if (!code) return new Response("missing room", { status: 400 });

    // Route every connection for a room code to the SAME Durable Object.
    const id = env.ROOMS.idFromName(code);
    const stub = env.ROOMS.get(id);
    return stub.fetch(request);
  },
};
