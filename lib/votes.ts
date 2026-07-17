export interface VoteTally {
  counts: Map<string, number>;
  maxVotes: number;
  leaders: string[]; // player ids tied for the most votes
  isTie: boolean; // true when 2+ players are tied for the lead
}

export function tallyVotes(votes: Record<string, string>): VoteTally {
  const counts = new Map<string, number>();
  for (const targetId of Object.values(votes)) {
    counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
  }
  const maxVotes = Math.max(0, ...counts.values());
  const leaders = [...counts.entries()]
    .filter(([, count]) => count === maxVotes && maxVotes > 0)
    .map(([id]) => id);

  return { counts, maxVotes, leaders, isTie: leaders.length > 1 };
}
