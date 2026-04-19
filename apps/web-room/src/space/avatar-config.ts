import { useGLTF } from "@react-three/drei";

export type AvatarModelConfig = {
  url: string;
  scale: number;
  rotationY: number;
  floorOffset: number;
  fallbackColor: string;
};

export const avatarModelMap: Record<string, AvatarModelConfig> = {
  "Adventurer": {
    url: "/models/Adventurer.glb",
    scale: 1,
    rotationY: Math.PI,
    floorOffset: 0.1,
    fallbackColor: "#60a5fa",
  },
  "Astronaut": {
    url: "/models/Astronaut.glb",
    scale: 1,
    rotationY: Math.PI,
    floorOffset: 0.1,
    fallbackColor: "#38bdf8",
  },
  "Witch": {
    url: "/models/Witch.glb",
    scale: 1,
    rotationY: Math.PI,
    floorOffset: 0.1,
    fallbackColor: "#4ade80",
  },
  "King": {
    url: "/models/King.glb",
    scale: 1,
    rotationY: Math.PI,
    floorOffset: 0.1,
    fallbackColor: "#f472b6",
  },
  "Punk": {
    url: "/models/Punk.glb",
    scale: 1,
    rotationY: Math.PI,
    floorOffset: 0.1,
    fallbackColor: "#fbbf24",
  },
  "Sci-fi": {
    url: "/models/Scifi.glb",
    scale: 1,
    rotationY: Math.PI,
    floorOffset: 0.1,
    fallbackColor: "#a78bfa",
  },
  default: {
    url: "/models/Hoodie.glb",
    scale: 1,
    rotationY: Math.PI,
    floorOffset: 0.1,
    fallbackColor: "#f87171",
  },
};

const preloadedUrls = new Set<string>();

export function getAvatarConfig(avatarId?: string | null) {
  const matchedConfig = avatarId ? avatarModelMap[avatarId] : undefined;
  return matchedConfig || avatarModelMap.default;
}

export function preloadAvatarModel(avatarId?: string | null) {
  const config = getAvatarConfig(avatarId);
  if (!config.url || preloadedUrls.has(config.url)) return;
  preloadedUrls.add(config.url);
  useGLTF.preload(config.url);
}
