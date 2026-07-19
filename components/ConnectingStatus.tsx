"use client";

import { useEffect, useState } from "react";

/**
 * Shows "Connecting…" and, if the connection is taking a while, rotates through
 * increasingly reassuring lines so a slow first join feels alive rather than
 * stuck. The first joiner to a fresh room pays a brief one-time server spin-up;
 * these messages cover that gracefully.
 */
const STAGES: { after: number; text: string }[] = [
  { after: 0, text: "Connecting…" },
  { after: 3000, text: "Hang in there…" },
  { after: 6000, text: "Waking up the room…" },
  { after: 9000, text: "Almost there…" },
  { after: 13000, text: "Still trying — hold tight…" },
  { after: 18000, text: "Any second now…" },
];

export function ConnectingStatus({ className }: { className?: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Schedule a bump at each stage's threshold; clean them all up on unmount.
    const timers = STAGES.slice(1).map((s, idx) =>
      setTimeout(() => setStage(idx + 1), s.after),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return <p className={className}>{STAGES[stage].text}</p>;
}
