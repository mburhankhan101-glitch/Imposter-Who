import type * as Party from "partykit/server";
import { pickRandomWord } from "./words";
import {
  ClientMessage,
  ClientRoomState,
  HINT_ROUNDS,
  MIN_PLAYERS,
  Player,
  RoomState,
  ServerMessage,
} from "./types";

/** Safety cap on the auto-skip loop in `autoSkipDisconnectedTurns` — one
 * hint round can advance the turn pointer at most `players.length` times,
 * so this comfortably covers every round without allowing a runaway loop
 * if a future bug ever made `currentTurnPlayerId` stop advancing. */
const MAX_AUTO_SKIP_STEPS = 50;

/** One instance of this class = one game room, keyed by the room code in
 * the URL (party/room.ts is wired to the "main" party in partykit.json).
 * State lives in memory for the room's lifetime — that's the whole point
 * of a room-based party game, no database needed. */
export default class Room implements Party.Server {
  state: RoomState;

  constructor(readonly room: Party.Room) {
    this.state = {
      code: room.id,
      phase: "lobby",
      players: [],
      hostId: null,
      imposterId: null,
      word: null,
      category: null,
      turnOrder: [],
      round: 1,
      hints: [],
      votes: {},
      votesLocked: false,
      roundNumber: 0,
    };
  }

  // ---- connection lifecycle ----

  onConnect(conn: Party.Connection) {
    // If this id already belongs to a player (page refresh / network blip —
    // the client passes a persisted id, so PartyKit hands us the same
    // conn.id back), mark them connected again without waiting for a fresh
    // "join" message. This is what lets someone rejoin mid-game and keep
    // their seat, word, and turn-order position.
    const existing = this.state.players.find((p) => p.id === conn.id);
    if (existing) {
      existing.connected = true;
      this.broadcast();
    } else {
      this.sendTo(conn, this.state);
    }
  }

  onClose(conn: Party.Connection) {
    const player = this.state.players.find((p) => p.id === conn.id);
    if (!player) return;

    if (this.state.phase === "lobby") {
      // Safe to fully remove pre-game — nothing references their id yet.
      this.state.players = this.state.players.filter((p) => p.id !== conn.id);
      this.reassignHostIfNeeded();
    } else {
      // Mid-game: keep them in turnOrder/hints/votes so the round isn't
      // corrupted by a refresh — just mark disconnected.
      player.connected = false;
      this.reassignHostIfNeeded();
      if (this.state.phase === "hints") {
        this.autoSkipDisconnectedTurns();
      }
    }
    this.broadcast();
  }

  // ---- message handling ----

  onMessage(raw: string, sender: Party.Connection) {
    let message: ClientMessage;
    try {
      message = JSON.parse(raw);
    } catch {
      return this.sendError(sender, "Malformed message.");
    }

    switch (message.type) {
      case "join":
        return this.handleJoin(sender, message.name);
      case "start-game":
        return this.handleStartGame(sender);
      case "begin-hints":
        return this.handleBeginHints(sender);
      case "submit-hint":
        return this.handleSubmitHint(sender, message.text);
      case "cast-vote":
        return this.handleCastVote(sender, message.targetId);
      case "reveal-now":
        return this.handleRevealNow(sender);
      case "play-again":
        return this.handlePlayAgain(sender);
    }
  }

  // ---- handlers ----

  private handleJoin(sender: Party.Connection, rawName: string) {
    const name = rawName.trim().slice(0, 20);
    if (!name) return this.sendError(sender, "Name can't be empty.");

    const existing = this.state.players.find((p) => p.id === sender.id);
    if (existing) {
      existing.name = name;
      existing.connected = true;
    } else {
      if (this.state.phase !== "lobby") {
        return this.sendError(
          sender,
          "A game is already in progress — you'll be able to join once it starts a new round.",
        );
      }
      const isFirstPlayer = this.state.players.length === 0;
      const player: Player = {
        id: sender.id,
        name,
        connected: true,
        isHost: isFirstPlayer,
      };
      this.state.players.push(player);
      if (isFirstPlayer) this.state.hostId = sender.id;
    }
    this.broadcast();
  }

  private handleStartGame(sender: Party.Connection) {
    if (sender.id !== this.state.hostId) {
      return this.sendError(sender, "Only the host can start the game.");
    }
    if (this.state.phase !== "lobby") return;

    const connectedPlayers = this.state.players.filter((p) => p.connected);
    if (connectedPlayers.length < MIN_PLAYERS) {
      return this.sendError(sender, `Need at least ${MIN_PLAYERS} players to start.`);
    }

    const { category, word } = pickRandomWord();
    const imposter = connectedPlayers[Math.floor(Math.random() * connectedPlayers.length)];
    const shuffled = shuffle(connectedPlayers.map((p) => p.id));

    this.state = {
      ...this.state,
      phase: "reveal-word",
      word,
      category,
      imposterId: imposter.id,
      turnOrder: shuffled,
      round: 1,
      hints: [],
      votes: {},
      votesLocked: false,
      roundNumber: this.state.roundNumber + 1,
    };
    this.broadcast();
  }

  private handleBeginHints(sender: Party.Connection) {
    if (sender.id !== this.state.hostId) return;
    if (this.state.phase !== "reveal-word") return;
    this.state.phase = "hints";
    // In case whoever's first in turn order disconnected between the word
    // reveal and now (e.g. they closed the tab right after seeing it).
    this.autoSkipDisconnectedTurns();
    this.broadcast();
  }

  private handleSubmitHint(sender: Party.Connection, rawText: string) {
    if (this.state.phase !== "hints") return;

    const text = rawText.trim().slice(0, 60);
    if (!text) return this.sendError(sender, "Hint can't be empty.");

    const whoseTurn = this.currentTurnPlayerId();
    if (whoseTurn !== sender.id) {
      return this.sendError(sender, "It's not your turn yet.");
    }

    this.state.hints.push({ playerId: sender.id, round: this.state.round, text });
    this.advanceRoundIfComplete();
    this.autoSkipDisconnectedTurns();
    this.broadcast();
  }

  private handleCastVote(sender: Party.Connection, targetId: string) {
    if (this.state.phase !== "voting") return;
    if (targetId === sender.id) return this.sendError(sender, "You can't vote for yourself.");
    if (!this.state.players.some((p) => p.id === targetId)) return;

    // Overwritable — this is exactly what lets someone change their vote.
    this.state.votes[sender.id] = targetId;
    this.broadcast();
  }

  private handleRevealNow(sender: Party.Connection) {
    if (sender.id !== this.state.hostId) {
      return this.sendError(sender, "Only the host can end voting.");
    }
    if (this.state.phase !== "voting") return;
    this.state.votesLocked = true;
    this.state.phase = "reveal-imposter";
    this.broadcast();
  }

  private handlePlayAgain(sender: Party.Connection) {
    if (sender.id !== this.state.hostId) return;
    if (this.state.phase !== "reveal-imposter") return;

    this.state = {
      ...this.state,
      phase: "lobby",
      imposterId: null,
      word: null,
      category: null,
      turnOrder: [],
      round: 1,
      hints: [],
      votes: {},
      votesLocked: false,
    };
    this.broadcast();
  }

  // ---- helpers ----

  /** Id of the player whose turn it is in the current hint round, or null
   * if everyone in turnOrder has already submitted for this round. */
  private currentTurnPlayerId(): string | null {
    for (const id of this.state.turnOrder) {
      const hasHint = this.state.hints.some(
        (h) => h.playerId === id && h.round === this.state.round,
      );
      if (!hasHint) return id;
    }
    return null;
  }

  /** If everyone in turnOrder has a hint for the current round, advances to
   * the next round or into voting once round 3 is done. */
  private advanceRoundIfComplete() {
    if (this.currentTurnPlayerId() !== null) return;
    if (this.state.round < HINT_ROUNDS) {
      this.state.round += 1;
    } else {
      this.state.phase = "voting";
    }
  }

  /** Auto-fills a placeholder hint for any disconnected player whenever
   * it's their turn, so one dropped connection doesn't stall the whole
   * game waiting for a hint that's never coming. Stops as soon as it's a
   * connected player's turn (or the round/game has moved past hints). */
  private autoSkipDisconnectedTurns() {
    for (let i = 0; i < MAX_AUTO_SKIP_STEPS; i++) {
      if (this.state.phase !== "hints") return;
      const turnId = this.currentTurnPlayerId();
      if (turnId === null) {
        this.advanceRoundIfComplete();
        continue;
      }
      const player = this.state.players.find((p) => p.id === turnId);
      if (!player || player.connected) return; // real player's turn — wait for them

      this.state.hints.push({
        playerId: turnId,
        round: this.state.round,
        text: "(offline — turn skipped)",
        skipped: true,
      });
      this.advanceRoundIfComplete();
    }
  }

  /** Promotes another connected player to host if the current host is
   * missing or disconnected — otherwise host-gated actions (start, begin
   * hints, reveal, play again) would strand the whole room. */
  private reassignHostIfNeeded() {
    const currentHost = this.state.players.find((p) => p.id === this.state.hostId);
    if (currentHost?.connected) return;

    const nextHost = this.state.players.find((p) => p.connected);
    this.state.hostId = nextHost?.id ?? null;
    this.setHost(this.state.hostId);
  }

  private setHost(id: string | null) {
    this.state.players = this.state.players.map((p) => ({ ...p, isHost: p.id === id }));
  }

  private sendError(conn: Party.Connection, message: string) {
    const payload: ServerMessage = { type: "error", message };
    conn.send(JSON.stringify(payload));
  }

  private sendTo(conn: Party.Connection, state: RoomState) {
    const payload: ServerMessage = { type: "state", state: toClientState(state, conn.id) };
    conn.send(JSON.stringify(payload));
  }

  private broadcast() {
    for (const conn of this.room.getConnections<Party.Connection>()) {
      this.sendTo(conn, this.state);
    }
  }
}

/** Strips/reshapes server state into what a specific connection is allowed
 * to see — the imposter never sees the word; nobody sees who the imposter
 * is before the reveal phase. */
function toClientState(state: RoomState, viewerId: string): ClientRoomState {
  const { imposterId, word, ...rest } = state;
  const youAreImposter = imposterId === viewerId;
  // The imposter never learns the word during play, but once the round is
  // over there's nothing left to hide — and part of the payoff is the
  // imposter finding out what they were bluffing about.
  const revealPhase = state.phase === "reveal-imposter";

  return {
    ...rest,
    yourWord: youAreImposter && !revealPhase ? null : word,
    youAreImposter,
    imposterId: revealPhase ? imposterId : null,
  };
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
