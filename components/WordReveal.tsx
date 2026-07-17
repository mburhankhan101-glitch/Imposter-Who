"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ClientRoomState } from "@/party/types";

interface WordRevealProps {
  state: ClientRoomState;
  selfId: string;
  onBeginHints: () => void;
}

export function WordReveal({ state, selfId, onBeginHints }: WordRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const isHost = state.hostId === selfId;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md items-center">
      <Card
        className={`w-full text-center cursor-pointer select-none transition-colors ${
          state.youAreImposter ? "border-danger" : ""
        }`}
        onClick={() => setRevealed((r) => !r)}
      >
        {!revealed ? (
          <p className="text-muted py-6">Tap to reveal your word</p>
        ) : state.youAreImposter ? (
          <div className="py-4">
            <p className="text-danger text-2xl font-bold mb-2">You&apos;re the Imposter</p>
            <p className="text-muted text-sm">
              You don&apos;t know the word. Listen closely and blend in with your hints.
            </p>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-muted text-sm mb-1">{state.category}</p>
            <p className="text-3xl font-bold">{state.yourWord}</p>
          </div>
        )}
      </Card>
      <p className="text-muted text-sm text-center">
        Keep your screen private — this is only for your eyes.
      </p>

      {isHost ? (
        <Button onClick={onBeginHints} className="w-full">
          Everyone&apos;s seen their word — Begin Hints
        </Button>
      ) : (
        <p className="text-muted text-sm">Waiting for the host to begin the hint rounds…</p>
      )}
    </div>
  );
}
