import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { MIN_PLAYERS } from "@/party/types";
import type { ClientRoomState } from "@/party/types";

interface LobbyProps {
  state: ClientRoomState;
  selfId: string;
  onStart: () => void;
}

export function Lobby({ state, selfId, onStart }: LobbyProps) {
  const isHost = state.hostId === selfId;
  const connectedCount = state.players.filter((p) => p.connected).length;
  const canStart = connectedCount >= MIN_PLAYERS;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <Card className="text-center">
        <p className="text-muted text-sm mb-1">Room code</p>
        <p className="text-4xl font-bold tracking-[0.3em]">{state.code}</p>
        <p className="text-muted text-sm mt-2">Share this code so friends can join</p>
      </Card>

      <Card>
        <p className="text-sm font-medium text-muted mb-4">
          Players ({connectedCount})
        </p>
        <div className="flex flex-col gap-3">
          {state.players.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <PlayerAvatar name={p.name} size="sm" dimmed={!p.connected} />
              <span className={p.connected ? "" : "text-muted line-through"}>{p.name}</span>
              {p.isHost && (
                <span className="text-xs bg-accent-soft text-accent px-2 py-0.5 rounded-full">
                  Host
                </span>
              )}
              {p.id === selfId && (
                <span className="text-xs text-muted">(you)</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {isHost ? (
        <Button onClick={onStart} disabled={!canStart}>
          {canStart
            ? "Start Game"
            : `Need ${MIN_PLAYERS - connectedCount} more player${MIN_PLAYERS - connectedCount === 1 ? "" : "s"}`}
        </Button>
      ) : (
        <p className="text-center text-muted text-sm">
          Waiting for the host to start the game…
        </p>
      )}
    </div>
  );
}
