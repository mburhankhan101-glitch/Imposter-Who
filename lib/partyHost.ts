/** Resolves the room server host to connect to. Falls back to the local
 * dev server (`npm run server:dev`, default port 1999) when no env var is
 * set. Var name kept as NEXT_PUBLIC_PARTYKIT_HOST for continuity even
 * though the room server is no longer PartyKit-hosted (see server/index.ts). */
export function getPartyHost(): string {
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
}
