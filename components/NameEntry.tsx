"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function NameEntry({ roomCode, onJoin }: { roomCode: string; onJoin: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <Card className="w-full max-w-sm text-center">
      <p className="text-muted text-sm mb-1">Joining room</p>
      <p className="text-2xl font-bold tracking-[0.2em] mb-4">{roomCode}</p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onJoin(name.trim())}
        placeholder="Your name"
        maxLength={20}
        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-center focus:outline-none focus:border-accent mb-3"
      />
      <Button onClick={() => name.trim() && onJoin(name.trim())} disabled={!name.trim()} className="w-full">
        Join Room
      </Button>
    </Card>
  );
}
