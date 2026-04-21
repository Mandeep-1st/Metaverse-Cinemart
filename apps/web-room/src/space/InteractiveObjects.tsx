import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  AIDoor,
  BigTV,
  ChairsAndPeople,
  Cupboards,
} from "../components/TheatreProps";
import type { ZoneId } from "./types";

function PropAccentLight({
  position,
  color,
  active,
}: {
  position: [number, number, number];
  color: string;
  active: boolean;
}) {
  const pointRef = useRef<THREE.PointLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);

  useFrame((_, delta) => {
    const pointTarget = active ? 1.6 : 0.35;
    const spotTarget = active ? 2.2 : 0.5;

    if (pointRef.current) {
      pointRef.current.intensity = THREE.MathUtils.lerp(
        pointRef.current.intensity,
        pointTarget,
        1 - Math.exp(-delta * 4.5),
      );
    }

    if (spotRef.current) {
      spotRef.current.intensity = THREE.MathUtils.lerp(
        spotRef.current.intensity,
        spotTarget,
        1 - Math.exp(-delta * 4.5),
      );
    }
  });

  return (
    <>
      <pointLight
        ref={pointRef}
        position={position}
        color={color}
        intensity={0.35}
        distance={8}
        decay={2}
      />
      <spotLight
        ref={spotRef}
        position={[position[0], position[1] + 1.5, position[2] + 0.3]}
        angle={0.46}
        penumbra={0.5}
        color={color}
        intensity={0.5}
        distance={12}
        decay={2}
      />
    </>
  );
}

export function InteractiveObjects({
  activeZone,
}: {
  activeZone: ZoneId | null;
}) {
  return (
    <>
      <BigTV position={[0, 0.9, -12]} isActive={activeZone === "north"} />
      <ChairsAndPeople
        position={[-12, 0.9, 0]}
        rotation={[0, Math.PI / 2, 0]}
        isActive={activeZone === "west"}
      />
      <Cupboards
        position={[12, 0.9, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        isActive={activeZone === "east"}
      />
      <AIDoor
        position={[0, 0.9, 12]}
        rotation={[0, Math.PI, 0]}
        isActive={activeZone === "south"}
      />

      <PropAccentLight
        position={[0, 4.8, -10.3]}
        color="#9fb3ff"
        active={activeZone === "north"}
      />
      <PropAccentLight
        position={[-10.4, 2.4, 0]}
        color="#ff8662"
        active={activeZone === "west"}
      />
      <PropAccentLight
        position={[10.6, 2.7, 0]}
        color="#ffd28f"
        active={activeZone === "east"}
      />
      <PropAccentLight
        position={[0, 2.7, 10.4]}
        color="#7aa2ff"
        active={activeZone === "south"}
      />
    </>
  );
}
