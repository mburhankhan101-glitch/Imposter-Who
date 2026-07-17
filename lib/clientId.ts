const KEY = "imposter-who:clientId";

/** A per-browser id persisted in localStorage. Passed to PartySocket as the
 * connection id, so a page refresh mid-game reconnects as the SAME player
 * (the server sees the same conn.id) instead of dropping their seat. */
export function getClientId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
