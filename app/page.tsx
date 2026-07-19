"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { generateRoomCode, normalizeRoomCode } from "@/lib/roomCode";
import { prewarmRoom } from "@/lib/prewarm";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");

  const goToRoom = (code: string) => {
    // Spin up the room's server now, so it's warm by the time the room page's
    // real connection opens a moment later.
    prewarmRoom(code);
    router.push(`/room/${code}?name=${encodeURIComponent(name.trim())}`);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    goToRoom(generateRoomCode());
  };

  const handleJoin = () => {
    const code = normalizeRoomCode(joinCode);
    if (!name.trim() || !code) return;
    goToRoom(code);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Imposter Who</h1>
        <p className="text-muted mt-2">One of you doesn&apos;t know the word. Find them.</p>
      </div>

      <Card className="w-full max-w-sm">
        <label className="block text-sm font-medium text-muted mb-2">Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sam"
          maxLength={20}
          className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:border-accent mb-5"
        />

        <div className="flex gap-2 mb-5 bg-background rounded-xl p-1 border border-border">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "create" ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "join" ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            Join Room
          </button>
        </div>

        {mode === "create" ? (
          <Button onClick={handleCreate} disabled={!name.trim()} className="w-full">
            Create Room
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Room code"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-center tracking-[0.2em] uppercase focus:outline-none focus:border-accent"
            />
            <Button onClick={handleJoin} disabled={!name.trim() || !joinCode.trim()} className="w-full">
              Join Room
            </Button>
          </div>
        )}
      </Card>

      <p className="text-muted text-xs max-w-sm text-center">
        Minimum 3 players. Everyone but the imposter sees the same secret word —
        give one-word hints, then vote out who you think doesn&apos;t know it.
      </p>
    </main>
  );
}
