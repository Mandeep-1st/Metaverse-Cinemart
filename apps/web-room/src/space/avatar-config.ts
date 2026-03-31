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
    url: "/models/neo-scout.glb",
    scale: 1.15,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#60a5fa",
  },
  "quantum-noir": {
    url: "/models/quantum-noir.glb",
    scale: 1.12,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#38bdf8",
  },
  "signal-rider": {
    url: "/models/signal-rider.glb",
    scale: 1.12,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#4ade80",
  },
  "void-caster": {
    url: "/models/void-caster.glb",
    scale: 1.12,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#f472b6",
  },
  "reel-drifter": {
    url: "/models/reel-drifter.glb",
    scale: 1.12,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#fbbf24",
  },
  "echo-pilot": {
    url: "/models/echo-pilot.glb",
    scale: 1.12,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#a78bfa",
  },
  default: {
    url: "/models/default.glb",
    scale: 1.12,
    rotationY: Math.PI,
    floorOffset: 0,
    fallbackColor: "#f87171",
  },
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
