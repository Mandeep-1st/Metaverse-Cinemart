export type AvatarOption = {
  id: string;
  title: string;
  accent: string;
  description: string;
};

export const avatarCatalog: AvatarOption[] = [
  {
    id: "neo-scout",
    title: "Neo Scout",
    accent: "from-red-500 to-orange-400",
    description: "A sharp-eyed navigator for midnight premieres and hidden gems.",
  },
  {
    id: "quantum-noir",
    title: "Quantum Noir",
    accent: "from-sky-500 to-cyan-300",
    description: "Built for sleek sci-fi picks, moody thrillers, and future classics.",
  },
  {
    id: "signal-rider",
    title: "Signal Rider",
    accent: "from-emerald-500 to-lime-400",
    description: "A social screenwalker who keeps every watch party in perfect sync.",
  },
  {
    id: "void-caster",
    title: "Void Caster",
    accent: "from-fuchsia-500 to-pink-400",
    description: "A dramatic persona with a taste for surreal worlds and sharp twists.",
  },
  {
    id: "reel-drifter",
    title: "Reel Drifter",
    accent: "from-amber-500 to-yellow-300",
    description: "A bright cinephile profile tuned for comfort rewatches and crowd-pleasers.",
  },
  {
    id: "echo-pilot",
    title: "Echo Pilot",
    accent: "from-violet-500 to-indigo-300",
    description: "A calm command presence for epics, noir, and after-hours discoveries.",
  },
];
