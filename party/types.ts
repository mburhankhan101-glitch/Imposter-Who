// Shared types between the PartyKit room server (party/room.ts) and the
// Next.js client (hooks/useRoom.ts and friends). Keeping these in one file
// means client and server can never silently drift out of sync.

export type GamePhase =
  | "lobby"
  | "reveal-word" // players privately see their word / imposter status
  | "hints" // 3 rounds of one hint per player, in turn order
  | "voting"
  | "reveal-imposter";

export interface Player {
  id: string; // PartyKit connection id
  name: string;
  connected: boolean;
  isHost: boolean;
}

export interface Hint {
  playerId: string;
  round: number; // 1, 2, or 3
  text: string;
}

export interface RoomState {
  code: string;
  phase: GamePhase;
  players: Player[];
  hostId: string | null;

  // Set only once a round starts; never sent to clients in a way that
  // leaks who the imposter is (see toClientState in room.ts).
  imposterId: string | null;
  word: string | null;
  category: string | null;

  turnOrder: string[]; // player ids, shuffled once per round
  round: number; // current hint round, 1-3
  hints: Hint[];

  votes: Record<string, string>; // voterId -> targetId, overwritable
  votesLocked: boolean;

  roundNumber: number; // increments each "Play Again", for React keys/reset
}

/** What's actually sent to a given client — never includes the word for the
 * imposter, and never reveals who the imposter is before the reveal phase. */
export type ClientRoomState = Omit<RoomState, "imposterId" | "word"> & {
  /** This client's own word — null if you ARE the imposter. */
  yourWord: string | null;
  /** True only once phase is "reveal-imposter". */
  imposterId: string | null;
  /** True if this connection is the imposter (told privately, so the UI can
   * show "You're the Imposter" during reveal-word without a word). */
  youAreImposter: boolean;
};

// ---- Client -> Server messages ----

export type ClientMessage =
  | { type: "join"; name: string }
  | { type: "start-game" }
  | { type: "begin-hints" }
  | { type: "submit-hint"; text: string }
  | { type: "cast-vote"; targetId: string }
  | { type: "reveal-now" }
  | { type: "play-again" };

// ---- Server -> Client messages ----

export type ServerMessage =
  | { type: "state"; state: ClientRoomState }
  | { type: "error"; message: string };

export const MIN_PLAYERS = 3;
export const HINT_ROUNDS = 3;
