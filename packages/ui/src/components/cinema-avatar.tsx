import { cn } from "../lib/utils";

type CinemaAvatarProps = {
  name: string;
  avatarId?: string | null;
  profilePhoto?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap: Record<NonNullable<CinemaAvatarProps["size"]>, string> = {
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

const accentMap = [
  "from-red-500 to-orange-400",
  "from-sky-500 to-cyan-300",
  "from-emerald-500 to-lime-400",
  "from-fuchsia-500 to-pink-400",
  "from-amber-500 to-yellow-300",
  "from-violet-500 to-indigo-300",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function hashSeed(seed: string) {
  return Array.from(seed).reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

export function CinemaAvatar({
  name,
  avatarId,
  profilePhoto,
  className,
  size = "md",
}: CinemaAvatarProps) {
  if (profilePhoto) {
    return (
      <img
        src={profilePhoto}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-1 ring-white/10",
          sizeMap[size],
          className,
        )}
      />
    );
  }

  const accent = accentMap[hashSeed(avatarId || name) % accentMap.length];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br font-black uppercase tracking-tight text-white shadow-lg ring-1 ring-white/10",
        accent,
        sizeMap[size],
        className,
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
