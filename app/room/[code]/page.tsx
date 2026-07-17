"use client";

import { Suspense, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { normalizeRoomCode } from "@/lib/roomCode";
import { NameEntry } from "@/components/NameEntry";
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

  const autoJoined = useRef(false);
  useEffect(() => {
    if (connected && nameFromQuery && !autoJoined.current) {
      autoJoined.current = true;
      join(nameFromQuery);
    }
  }, [connected, nameFromQuery, join]);

  const hasJoined = state?.players.some((p) => p.id === selfId) ?? false;

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-12">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-danger-soft text-danger text-sm px-4 py-2 rounded-xl border border-danger/20 z-10">
          {error}
        </div>
      )}

      {!connected || !state ? (
        <p className="text-muted">Connecting…</p>
      ) : !hasJoined ? (
        <NameEntry roomCode={roomCode} onJoin={join} />
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
