import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { PointerLockControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  GRID_HALF,
  PLAYER_Y,
  ZONE_DISTANCE,
  clamp,
  isInsideAnyCollider,
  isTypingElement,
} from "./constants";
import type { ControlsApiRef, PlayerSnapshot, ZoneId } from "./types";

type MovementControlsProps = {
  movementEnabled: boolean;
  overlayOpen: boolean;
  onZoneKey: (zone: ZoneId) => void;
  onCloseOverlay: () => void;
  controlsApiRef: ControlsApiRef;
  playerRef: MutableRefObject<PlayerSnapshot>;
  nearZoneRef: MutableRefObject<ZoneId | null>;
  onNearZoneChange: (zone: ZoneId | null) => void;
  tvOverlayRef: MutableRefObject<HTMLDivElement | null>;
};

export function MovementControls({
  movementEnabled,
  overlayOpen,
  onZoneKey,
  onCloseOverlay,
  controlsApiRef,
  playerRef,
  nearZoneRef,
  onNearZoneChange,
  tvOverlayRef,
}: MovementControlsProps) {
  const controlsRef = useRef<any>(null);
  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const tvCorners = useMemo(
    () => [
      new THREE.Vector3(-12, 11.4, -12.2),
      new THREE.Vector3(12, 11.4, -12.2),
      new THREE.Vector3(12, -1.6, -12.2),
      new THREE.Vector3(-12, -1.6, -12.2),
    ],
    [],
  );
  const tvProj = useMemo(
    () => tvCorners.map(() => new THREE.Vector3()),
    [tvCorners],
  );

  useEffect(() => {
    controlsApiRef.current = controlsRef.current;
  }, [controlsApiRef]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === "escape") {
        event.preventDefault();
        onCloseOverlay();
        return;
      }

      if (!movementEnabled || overlayOpen) return;

      const near = nearZoneRef.current;
      if (near) {
        if (key === "t" && near === "north") return onZoneKey("north");
        if (key === "c" && near === "west") return onZoneKey("west");
        if (key === "i" && near === "east") return onZoneKey("east");
        if (key === "a" && near === "south") return onZoneKey("south");
      }

      if (key === "w") keysRef.current.w = true;
      if (key === "a") keysRef.current.a = true;
      if (key === "s") keysRef.current.s = true;
      if (key === "d") keysRef.current.d = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "w") keysRef.current.w = false;
      if (key === "a") keysRef.current.a = false;
      if (key === "s") keysRef.current.s = false;
      if (key === "d") keysRef.current.d = false;
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown as any);
      window.removeEventListener("keyup", onKeyUp as any);
    };
  }, [movementEnabled, nearZoneRef, onCloseOverlay, onZoneKey, overlayOpen]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const object = controls.getObject?.();
    if (!object) return;

    if (object.position.x === 0 && object.position.z === 0) {
      object.position.set(0, PLAYER_Y, 0);
    }

    const px = object.position.x;
    const pz = object.position.z;
    const zoneCandidates: Array<{ id: ZoneId; x: number; z: number }> = [
      { id: "north", x: 0, z: -12 },
      { id: "south", x: 0, z: 12 },
      { id: "west", x: -12, z: 0 },
      { id: "east", x: 12, z: 0 },
    ];

    let nextNear: ZoneId | null = null;
    for (const zone of zoneCandidates) {
      if (Math.hypot(px - zone.x, pz - zone.z) < ZONE_DISTANCE) {
        nextNear = zone.id;
        break;
      }
    }

    nearZoneRef.current = nextNear;
    onNearZoneChange(nextNear);

    if (!movementEnabled || overlayOpen || !controls.isLocked) return;

    state.camera.getWorldDirection(forward);
    const dir = forward.clone();
    dir.y = 0;
    dir.normalize();
    right.crossVectors(dir, up).normalize();

    let vx = 0;
    let vz = 0;
    if (keysRef.current.w) {
      vx += dir.x;
      vz += dir.z;
    }
    if (keysRef.current.s) {
      vx -= dir.x;
      vz -= dir.z;
    }
    if (keysRef.current.a) {
      vx -= right.x;
      vz -= right.z;
    }
    if (keysRef.current.d) {
      vx += right.x;
      vz += right.z;
    }

    const len = Math.hypot(vx, vz);
    if (len > 0) {
      vx /= len;
      vz /= len;
    }

    const speed = 8;
    const rawX = clamp(
      object.position.x + vx * speed * delta,
      -GRID_HALF,
      GRID_HALF,
    );
    const rawZ = clamp(
      object.position.z + vz * speed * delta,
      -GRID_HALF,
      GRID_HALF,
    );

    if (!isInsideAnyCollider(rawX, rawZ)) {
      object.position.x = rawX;
      object.position.z = rawZ;
    } else if (!isInsideAnyCollider(rawX, object.position.z)) {
      object.position.x = rawX;
    } else if (!isInsideAnyCollider(object.position.x, rawZ)) {
      object.position.z = rawZ;
    }

    object.position.y = PLAYER_Y;

    playerRef.current = {
      x: object.position.x,
      y: PLAYER_Y,
      z: object.position.z,
      yaw: object.rotation.y,
    };

    if (!tvOverlayRef.current) return;

    const element = tvOverlayRef.current;
    const xs: number[] = [];
    const ys: number[] = [];

    tvCorners.forEach((corner, index) => {
      tvProj[index].copy(corner).project(state.camera);
      xs.push(((tvProj[index].x + 1) / 2) * state.size.width);
      ys.push(((-tvProj[index].y + 1) / 2) * state.size.height);
    });

    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const width = Math.max(...xs) - left;
    const height = Math.max(...ys) - top;
    const behindCamera = tvProj.some((vector) => vector.z > 1);

    if (behindCamera) {
      element.style.opacity = "0";
      return;
    }

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.opacity = "1";
  });

  return <PointerLockControls ref={controlsRef} />;
}
