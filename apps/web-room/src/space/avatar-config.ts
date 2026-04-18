import { useGLTF } from "@react-three/drei";

export type AvatarModelConfig = {
  url: string;
  scale: number;
  rotationY: number;
  floorOffset: number;
  fallbackColor: string;
};

export const avatarModelMap: Record<string, AvatarModelConfig> = {
  "neo-scout": {
    url: "../../public/models/Adventurer.glb",
    scale: 1.15,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#60a5fa",
  },
  "quantum-noir": {
    url: "../../public/models/Scifi.glb",
    scale: 1.12,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#38bdf8",
  },
  "signal-rider": {
    url: "../../public/models/Witch.glb",
    scale: 1.12,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#4ade80",
  },
  "void-caster": {
    url: "../../public/models/King.glb",
    scale: 1.12,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#f472b6",
  }
};

const preloadedUrls = new Set<string>();

export function getAvatarConfig(avatarId?: string | null) {
  return avatarModelMap[avatarId || ""] || avatarModelMap.default;
}

export function preloadAvatarModel(avatarId?: string | null) {
  const config = getAvatarConfig(avatarId);
  if (!config.url || preloadedUrls.has(config.url)) return;
  preloadedUrls.add(config.url);
  useGLTF.preload(config.url);
}
