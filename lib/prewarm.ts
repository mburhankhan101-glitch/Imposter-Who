import { getPartyHost } from "@/lib/partyHost";

/**
 * Best-effort "pre-open": as soon as the player commits to a room on the home
 * screen (before we navigate to the room page), open a throwaway WebSocket to
 * that room. This spins up the room's Cloudflare Durable Object so the *real*
 * connection a moment later — after the route change and page mount — connects
 * to an already-warm room instead of paying the cold-start on the critical path.
 *
 * It uses a random, one-off id and never sends a "join" message, so the server
 * registers no player for it (players are only created on an explicit join).
 * It closes itself shortly after, leaving zero trace on game state.
 */
export function prewarmRoom(code: string): void {
  if (typeof window === "undefined") return;
  const room = code.trim().toLowerCase();
  if (!room) return;

  const host = getPartyHost();
  const isLocal = /^(localhost|127\.|192\.168\.|10\.|\[)/.test(host);
  const proto = isLocal ? "ws" : "wss";
  const id = "prewarm-" + Math.random().toString(36).slice(2, 10);

  try {
    const ws = new WebSocket(`${proto}://${host}/parties/main/${room}?_pk=${id}`);
    const close = () => {
      try {
        ws.close();
      } catch {
        /* already closed */
      }
    };
    // Keep it just long enough to cover the navigation + real connect, then go.
    ws.addEventListener("open", () => setTimeout(close, 8000));
    ws.addEventListener("error", close);
  } catch {
    /* prewarm is best-effort — never let it break the join flow */
  }
}
