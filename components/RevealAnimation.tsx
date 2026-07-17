"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { tallyVotes } from "@/lib/votes";
import type { ClientRoomState } from "@/party/types";

interface RevealAnimationProps {
  state: ClientRoomState;
  selfId: string;
  onPlayAgain: () => void;
}

export function RevealAnimation({ state, selfId, onPlayAgain }: RevealAnimationProps) {
  const [stage, setStage] = useState<"dim" | "spotlight" | "label">("dim");
  const isHost = state.hostId === selfId;

  useEffect(() => {
    const t1 = setTimeout(() => setStage("spotlight"), 400);
    const t2 = setTimeout(() => setStage("label"), 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const { leaders, isTie } = tallyVotes(state.votes);
  const votedOutId = !isTie && leaders.length === 1 ? leaders[0] : null;
  const nameOf = (id: string | null) =>
    id ? state.players.find((p) => p.id === id)?.name ?? "Someone" : null;

  const correct = votedOutId === state.imposterId;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md items-center">
      <div className="grid grid-cols-3 gap-5 py-4">
        {state.players.map((p) => {
          const isImposter = p.id === state.imposterId;
          const spotlightOn = stage !== "dim";
          return (
            <div key={p.id} className="flex flex-col items-center gap-2">
              <PlayerAvatar
                name={p.name}
                size="lg"
                ringColor={spotlightOn && isImposter ? "danger" : "none"}
                dimmed={spotlightOn && !isImposter}
              />
              <span
                className={`text-sm font-medium transition-opacity ${
                  spotlightOn && !isImposter ? "opacity-30" : ""
                }`}
              >
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className={`text-center transition-all duration-500 ${
          stage === "label" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <p className="text-2xl font-bold text-danger">
          {nameOf(state.imposterId)} was the Imposter!
        </p>
        <p className="text-muted mt-2">
          The word was <span className="font-semibold text-foreground">{state.yourWord ?? "—"}</span>
          {state.category ? ` (${state.category})` : ""}
        </p>

        <Card className="mt-4 text-left">
          {isTie ? (
            <p className="text-sm">
              🤝 The vote was tied — no one was voted out this round.
            </p>
          ) : (
            <p className="text-sm">
              {correct ? "✅ " : "❌ "}
              The group voted out{" "}
              <span className="font-medium">{nameOf(votedOutId)}</span>
              {correct ? " — correct!" : " — not the imposter."}
            </p>
          )}
        </Card>
      </div>

      {stage === "label" &&
        (isHost ? (
          <Button onClick={onPlayAgain} className="w-full">
            Play Again
          </Button>
        ) : (
          <p className="text-muted text-sm">Waiting for the host to start a new round…</p>
        ))}
    </div>
  );
}
