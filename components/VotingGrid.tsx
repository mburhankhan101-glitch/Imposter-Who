import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { tallyVotes } from "@/lib/votes";
import type { ClientRoomState } from "@/party/types";

interface VotingGridProps {
  state: ClientRoomState;
  selfId: string;
  onVote: (targetId: string) => void;
  onRevealNow: () => void;
}

export function VotingGrid({ state, selfId, onVote, onRevealNow }: VotingGridProps) {
  const isHost = state.hostId === selfId;
  const myVote = state.votes[selfId];

  const { counts: tally, isTie } = tallyVotes(state.votes);
  const totalVotes = Object.keys(state.votes).length;
  const connectedCount = state.players.filter((p) => p.connected).length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div className="text-center">
        <p className="text-xl font-semibold">Who&apos;s the Imposter?</p>
        <p className="text-muted text-sm mt-1">
          {totalVotes} of {connectedCount} voted — you can change your vote anytime.
        </p>
        {isTie && (
          <p className="text-sm text-danger mt-1 font-medium">It&apos;s currently a tie!</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {state.players
          .filter((p) => p.id !== selfId)
          .map((p) => {
            const votes = tally.get(p.id) ?? 0;
            const selected = myVote === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onVote(p.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <PlayerAvatar name={p.name} size="lg" ringColor={selected ? "accent" : "none"} />
                <span className="text-sm font-medium truncate max-w-full">{p.name}</span>
                <span className="text-xs text-muted">
                  {votes > 0 ? `${votes} vote${votes === 1 ? "" : "s"}` : " "}
                </span>
              </button>
            );
          })}
      </div>

      {isHost && (
        <Card className="text-center">
          <p className="text-sm text-muted mb-3">
            As host, you decide when discussion is over.
          </p>
          <Button onClick={onRevealNow} variant="danger" className="w-full">
            Reveal the Imposter
          </Button>
        </Card>
      )}
    </div>
  );
}
