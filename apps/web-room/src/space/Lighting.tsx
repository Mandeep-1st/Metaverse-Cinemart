import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ZoneId } from "./types";

function SmoothedPointLight({
  position,
  color,
  idleIntensity,
  activeIntensity,
  active,
  distance,
}: {
  position: [number, number, number];
  color: string;
  idleIntensity: number;
  activeIntensity: number;
  active: boolean;
  distance: number;
}) {
  const ref = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const target = active ? activeIntensity : idleIntensity;
    ref.current.intensity = THREE.MathUtils.lerp(
      ref.current.intensity,
      target,
      1 - Math.exp(-delta * 4.5),
    );
  });

  return (
    <pointLight
      ref={ref}
      position={position}
      color={color}
      intensity={idleIntensity}
      distance={distance}
      decay={2}
    />
  );
}

export function Lighting({ activeZone }: { activeZone: ZoneId | null }) {
  const ceilingLights: Array<[number, number, number]> = [
    [-8, 11.8, -7],
    [0, 11.8, -7],
    [8, 11.8, -7],
    [-8, 11.8, 7],
    [0, 11.8, 7],
    [8, 11.8, 7],
  ];

  return (
    <>
      <ambientLight intensity={0.52} color="#ffe7cf" />
      <hemisphereLight color="#57739a" groundColor="#120a08" intensity={0.9} />
      <directionalLight
        position={[3.5, 10, 4]}
        intensity={0.85}
        color="#fff3df"
        castShadow
      />

      {ceilingLights.map((position, index) => (
        <SmoothedPointLight
          key={`ceiling-${index}`}
          position={position}
          color={index % 2 === 0 ? "#fff2de" : "#f8d2aa"}
          idleIntensity={1.35}
          activeIntensity={1.55}
          active={false}
          distance={18}
        />
      ))}

      <SmoothedPointLight
        position={[0, 12.4, 0]}
        color="#fff4e5"
        idleIntensity={2.1}
        activeIntensity={2.35}
        active={false}
        distance={34}
      />

      <SmoothedPointLight
        position={[0, 6, -8.5]}
        color="#ffdfb5"
        idleIntensity={0.5}
        activeIntensity={0.95}
        active={activeZone === "north"}
        distance={14}
      />
      <SmoothedPointLight
        position={[-8.6, 3.2, 0]}
        color="#ff8a65"
        idleIntensity={0.35}
        activeIntensity={1.05}
        active={activeZone === "west"}
        distance={11}
      />
      <SmoothedPointLight
        position={[8.6, 3.2, 0]}
        color="#ffd699"
        idleIntensity={0.35}
        activeIntensity={1.05}
        active={activeZone === "east"}
        distance={11}
      />
      <SmoothedPointLight
        position={[0, 3.5, 8.4]}
        color="#7aa2ff"
        idleIntensity={0.35}
        activeIntensity={1.05}
        active={activeZone === "south"}
        distance={12}
      />

      {[
        [-11, 0.4, -11],
        [11, 0.4, -11],
        [-11, 0.4, 11],
        [11, 0.4, 11],
      ].map((position, index) => (
        <pointLight
          key={`floor-${index}`}
          position={position as [number, number, number]}
          color={index < 2 ? "#311826" : "#18243a"}
          intensity={0.55}
          distance={8}
          decay={2}
        />
      ))}
    </>
  );
}
