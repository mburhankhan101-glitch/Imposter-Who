"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { HINT_ROUNDS } from "@/party/types";
import type { ClientRoomState } from "@/party/types";

interface HintRoundProps {
  state: ClientRoomState;
  selfId: string;
  onSubmitHint: (text: string) => void;
}

export function HintRound({ state, selfId, onSubmitHint }: HintRoundProps) {
  const [text, setText] = useState("");

  const currentTurnId = state.turnOrder.find(
    (id) => !state.hints.some((h) => h.playerId === id && h.round === state.round),
  );
  const isYourTurn = currentTurnId === selfId;
  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name ?? "Someone";

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmitHint(trimmed);
    setText("");
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div className="text-center">
        <p className="text-muted text-sm">
          Round {state.round} of {HINT_ROUNDS}
        </p>
        <p className="text-xl font-semibold mt-1">One word or phrase — no giving it away</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 justify-center">
          {state.turnOrder.map((id) => {
            const submitted = state.hints.some((h) => h.playerId === id && h.round === state.round);
            const isTurn = id === currentTurnId;
            return (
              <div key={id} className="flex flex-col items-center gap-1 w-16">
                <PlayerAvatar
                  name={nameOf(id)}
                  size="sm"
                  ringColor={isTurn ? "accent" : "none"}
                  dimmed={submitted && !isTurn}
                />
                <span className="text-xs text-muted truncate w-full text-center">
                  {nameOf(id)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {isYourTurn ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Your hint…"
            maxLength={60}
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-accent"
          />
          <Button onClick={handleSubmit} disabled={!text.trim()}>
            Submit
          </Button>
        </div>
      ) : (
        <p className="text-center text-muted text-sm">
          Waiting for <span className="font-medium text-foreground">{nameOf(currentTurnId ?? "")}</span> to give a hint…
        </p>
      )}

      {state.hints.length > 0 && (
        <Card>
          <p className="text-sm font-medium text-muted mb-3">Hints so far</p>
          <div className="flex flex-col gap-2">
            {state.hints
              .slice()
              .reverse()
              .map((h, i) => (
                <div key={i} className="flex items-baseline gap-2 text-sm">
                  <span className="font-medium">{nameOf(h.playerId)}:</span>
                  <span className="text-muted">&ldquo;{h.text}&rdquo;</span>
                  <span className="text-xs text-muted ml-auto">R{h.round}</span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
