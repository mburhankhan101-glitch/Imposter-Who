/** Resolves the PartyKit host to connect to. Falls back to the local
 * `partykit dev` server (default port 1999) when no env var is set. */
export function getPartyHost(): string {
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
}
