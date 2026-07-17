function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

interface PlayerAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  ringColor?: "accent" | "danger" | "none";
  dimmed?: boolean;
}

const SIZE_CLASSES = {
  sm: "w-9 h-9 text-xs",
  md: "w-14 h-14 text-base",
  lg: "w-20 h-20 text-xl",
};

const RING_CLASSES = {
  accent: "ring-4 ring-accent",
  danger: "ring-4 ring-danger",
  none: "",
};

export function PlayerAvatar({ name, size = "md", ringColor = "none", dimmed = false }: PlayerAvatarProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} ${RING_CLASSES[ringColor]} rounded-full bg-accent-soft text-accent flex items-center justify-center font-semibold transition-opacity ${
        dimmed ? "opacity-30" : "opacity-100"
      }`}
    >
      {initials(name)}
    </div>
  );
}
