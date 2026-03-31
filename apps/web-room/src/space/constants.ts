export const GRID_HALF = 13;
export const PLAYER_Y = 1.6;
export const ZONE_DISTANCE = 4.5;

const COLLISION_RECTS = [
  { label: "north-tv", minX: -13, maxX: 13, minZ: -13, maxZ: -10.5 },
  { label: "south-door", minX: -2.5, maxX: 2.5, minZ: 10.5, maxZ: 13 },
  { label: "west-chairs", minX: -13, maxX: -10.5, minZ: -4, maxZ: 4 },
  { label: "east-cupbds", minX: 10.5, maxX: 13, minZ: -4, maxZ: 4 },
];

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function isInsideAnyCollider(x: number, z: number) {
  return COLLISION_RECTS.some(
    (rect) => x > rect.minX && x < rect.maxX && z > rect.minZ && z < rect.maxZ,
  );
}

export function isTypingElement(target: EventTarget | null) {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}
