import * as THREE from "three";
import { TheatreRoom } from "../components/TheatreRoom";

function DecorativePoster({
  position,
  rotation,
  frameColor,
  panelColor,
  accentColor,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  frameColor: string;
  panelColor: string;
  accentColor: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.6, 3.8, 0.12]} />
        <meshStandardMaterial color={frameColor} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[2.2, 3.4]} />
        <meshStandardMaterial color={panelColor} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.82, 0.08]}>
        <planeGeometry args={[1.45, 0.28]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.35}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -0.1, 0.08]}>
        <circleGeometry args={[0.56, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.1, 0.09]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.38, 0.08, 10, 48]} />
        <meshStandardMaterial color={accentColor} metalness={0.35} roughness={0.3} />
      </mesh>
      {[-0.45, 0, 0.45].map((x, index) => (
        <mesh key={index} position={[x, -1.18, 0.08]}>
          <boxGeometry args={[0.22, 0.9 - index * 0.16, 0.04]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? accentColor : "#f6f0df"}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function CeilingFixtures() {
  const fixtures = [
    [-8, 14.4, -7],
    [0, 14.4, -7],
    [8, 14.4, -7],
    [-8, 14.4, 7],
    [0, 14.4, 7],
    [8, 14.4, 7],
  ] as const;

  return (
    <>
      {fixtures.map((position, index) => (
        <group key={index} position={position}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.95, 0.95, 0.18, 28]} />
            <meshStandardMaterial
              color="#f8efe2"
              emissive="#ffe9c8"
              emissiveIntensity={0.25}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.72, 0.72, 0.12, 28]} />
            <meshStandardMaterial
              color="#fff5de"
              emissive="#fff1cb"
              emissiveIntensity={0.4}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function Environment() {
  return (
    <>
      <TheatreRoom />
      <CeilingFixtures />

      <DecorativePoster
        position={[-12.35, 6.1, -5.6]}
        rotation={[0, Math.PI / 2, 0]}
        frameColor="#3b2f2f"
        panelColor="#22161a"
        accentColor="#f97316"
      />
      <DecorativePoster
        position={[-12.35, 6.1, 5.8]}
        rotation={[0, Math.PI / 2, 0]}
        frameColor="#2c3348"
        panelColor="#171923"
        accentColor="#38bdf8"
      />
      <DecorativePoster
        position={[12.35, 6.2, -5.8]}
        rotation={[0, -Math.PI / 2, 0]}
        frameColor="#3d3027"
        panelColor="#1b1611"
        accentColor="#f59e0b"
      />
      <DecorativePoster
        position={[12.35, 6.2, 5.7]}
        rotation={[0, -Math.PI / 2, 0]}
        frameColor="#263129"
        panelColor="#101614"
        accentColor="#34d399"
      />
      <DecorativePoster
        position={[0, 6.25, 12.35]}
        rotation={[0, Math.PI, 0]}
        frameColor="#2f273d"
        panelColor="#17111f"
        accentColor="#a78bfa"
      />

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[7.8, 9.2, 96]} />
        <meshStandardMaterial
          color="#12090a"
          emissive="#341112"
          emissiveIntensity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}
