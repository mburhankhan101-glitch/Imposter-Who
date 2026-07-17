"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { normalizeRoomCode } from "@/lib/roomCode";
import { NameEntry } from "@/components/NameEntry";
import { Card } from "@/components/ui/Card";
import { Lobby } from "@/components/Lobby";
import { WordReveal } from "@/components/WordReveal";
import { HintRound } from "@/components/HintRound";
import { VotingGrid } from "@/components/VotingGrid";
import { RevealAnimation } from "@/components/RevealAnimation";

export default function RoomPage() {
  return (
    <Suspense fallback={<main className="flex-1 flex items-center justify-center"><p className="text-muted">Loading…</p></main>}>
      <RoomPageInner />
    </Suspense>
  );
}

function RoomPageInner() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const roomCode = normalizeRoomCode(params.code ?? "");
  const nameFromQuery = searchParams.get("name")?.trim() ?? "";

  const { state, error, connected, selfId, join, startGame, beginHints, submitHint, castVote, revealNow, playAgain } =
    useRoom(roomCode);

  // The name we're trying to join with — either from the URL (coming from
  // the home page) or typed into NameEntry (direct link visit). Kept around
  // so we can auto-retry if the game was in progress when we first tried.
  const [pendingName, setPendingName] = useState(nameFromQuery);
  const autoJoined = useRef(false);

  const hasJoined = state?.players.some((p) => p.id === selfId) ?? false;

  useEffect(() => {
    if (connected && nameFromQuery && !autoJoined.current) {
      autoJoined.current = true;
      join(nameFromQuery);
    }
  }, [connected, nameFromQuery, join]);

  // If we tried to join while a game was already running, retry
  // automatically as soon as the room returns to the lobby — no need for
  // the player to re-type their name or refresh.
  useEffect(() => {
    if (!hasJoined && pendingName && state?.phase === "lobby") {
      join(pendingName);
    }
  }, [hasJoined, pendingName, state?.phase, join]);

  // `state` is never cleared once we've received it, so "have state but not
  // currently connected" reliably means "was connected, dropped, retrying" —
  // as opposed to the very first load, where `state` is still null.
  const isReconnecting = !connected && state !== null;
  const gameInProgress = state && !hasJoined && state.phase !== "lobby";

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-12">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-danger-soft text-danger text-sm px-4 py-2 rounded-xl border border-danger/20 z-10">
          {error}
        </div>
      )}
      {isReconnecting && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-accent-soft text-accent text-sm px-4 py-2 rounded-xl z-10">
          Reconnecting…
        </div>
      )}

      {!state ? (
        <p className="text-muted">Connecting…</p>
      ) : gameInProgress ? (
        <Card className="w-full max-w-sm text-center">
          <p className="text-lg font-semibold mb-2">A game is already in progress</p>
          <p className="text-muted text-sm">
            You&apos;ll join automatically as soon as the current round ends.
          </p>
        </Card>
      ) : !hasJoined ? (
        <NameEntry
          roomCode={roomCode}
          onJoin={(name) => {
            setPendingName(name);
            join(name);
          }}
        />
      ) : (
        <>
          {state.phase === "lobby" && (
            <Lobby state={state} selfId={selfId} onStart={startGame} />
          )}
          {state.phase === "reveal-word" && (
            <WordReveal state={state} selfId={selfId} onBeginHints={beginHints} />
          )}
          {state.phase === "hints" && (
            <HintRound state={state} selfId={selfId} onSubmitHint={submitHint} />
          )}
          {state.phase === "voting" && (
            <VotingGrid state={state} selfId={selfId} onVote={castVote} onRevealNow={revealNow} />
          )}
          {state.phase === "reveal-imposter" && (
            <RevealAnimation state={state} selfId={selfId} onPlayAgain={playAgain} />
          )}
        </>
      )}
    </main>
  );
}
