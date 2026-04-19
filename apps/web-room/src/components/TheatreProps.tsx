import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface PropProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  isActive: boolean;
  videoUrl?: string;
  isPlaying?: boolean;
  trailerTime?: number;
}

// ─── Reusable materials ────────────────────────────────────────────────────
const LEATHER_RED = "#8B1A1A";
const LEATHER_DARK = "#5C0E0E";
const GOLD = "#C9A84C";
const DARK_WOOD = "#2C1A0E";
const LIGHT_WOOD = "#6B3A2A";
const CHROME = "#AAAAAA";
const DARK_METAL = "#222222";
const CARPET_COLOR = "#1A0A0A";

// ─── BigTV ────────────────────────────────────────────────────────────────
export function BigTV({ position, rotation = [0, 0, 0], isActive }: PropProps) {
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);
  const stripRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const screenTarget = isActive ? 1.25 : 0.18;
    const stripTarget = isActive ? 1.75 : 0.15;
    const lightTarget = isActive ? 2.8 : 0.3;

    if (screenRef.current) {
      screenRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        screenRef.current.emissiveIntensity,
        screenTarget,
        1 - Math.exp(-delta * 4.5),
      );
    }

    if (stripRef.current) {
      stripRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        stripRef.current.emissiveIntensity,
        stripTarget,
        1 - Math.exp(-delta * 4.5),
      );
    }

    if (glowLightRef.current) {
      glowLightRef.current.intensity = THREE.MathUtils.lerp(
        glowLightRef.current.intensity,
        lightTarget,
        1 - Math.exp(-delta * 4.5),
      );
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Back panel */}
      <mesh position={[0, 4.0, -0.4]} castShadow>
        <boxGeometry args={[24.4, 13.4, 0.3]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      {/* Bezel */}
      <mesh position={[0, 4.0, -0.22]}>
        <boxGeometry args={[24.8, 13.8, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 4.0, -0.18]}>
        <boxGeometry args={[24, 13, 0.05]} />
        <meshStandardMaterial
          ref={screenRef}
          color={isActive ? "#1a1a3a" : "#050508"}
          emissive={isActive ? "#3a3aff" : "#080818"}
          emissiveIntensity={0.18}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={glowLightRef}
        position={[0, 4.0, 1]}
        color="#4444ff"
        intensity={0.3}
        distance={20}
        decay={2}
      />
      {/* Stand neck */}
      <mesh position={[0, -2.5, -0.3]} castShadow>
        <boxGeometry args={[1.2, 4, 0.4]} />
        <meshStandardMaterial
          color={DARK_METAL}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* Stand base */}
      <mesh position={[0, -4.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.3, 3]} />
        <meshStandardMaterial
          color={DARK_METAL}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* Gold trim top */}
      <mesh position={[0, 11.3, -0.2]}>
        <boxGeometry args={[24.8, 0.2, 0.3]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>
      {/* Gold trim bottom */}
      <mesh position={[0, -3.3, -0.2]}>
        <boxGeometry args={[24.8, 0.2, 0.3]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>
      {/* Active glow strip */}
      <mesh position={[0, -4.45, 0.8]}>
        <boxGeometry args={[27, 0.08, 0.1]} />
        <meshStandardMaterial
          ref={stripRef}
          color="#fff"
          emissive={isActive ? "#ff4a4a" : "#000"}
          emissiveIntensity={0.15}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─── Single cinema seat ───────────────────────────────────────────────────
function CinemaSeat({
  position,
  occupied = false,
  personColor = "#4287f5",
}: {
  position: [number, number, number];
  occupied?: boolean;
  personColor?: string;
}) {
  return (
    <group position={position}>
      {/* Seat base frame */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.9, 0.08, 0.9]} />
        <meshStandardMaterial
          color={DARK_METAL}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      {/* Seat cushion */}
      <mesh position={[0, 0.1, 0.05]} castShadow>
        <boxGeometry args={[0.78, 0.12, 0.75]} />
        <meshStandardMaterial color={LEATHER_RED} roughness={0.8} />
      </mesh>
      {/* Seat cushion top lip */}
      <mesh position={[0, 0.17, -0.32]}>
        <boxGeometry args={[0.78, 0.06, 0.08]} />
        <meshStandardMaterial color={LEATHER_DARK} roughness={0.8} />
      </mesh>
      {/* Backrest lower */}
      <mesh position={[0, 0.65, -0.38]} castShadow>
        <boxGeometry args={[0.78, 0.9, 0.12]} />
        <meshStandardMaterial color={LEATHER_RED} roughness={0.8} />
      </mesh>
      {/* Backrest upper */}
      <mesh position={[0, 1.25, -0.4]} castShadow>
        <boxGeometry args={[0.78, 0.4, 0.1]} />
        <meshStandardMaterial color={LEATHER_RED} roughness={0.8} />
      </mesh>
      {/* Headrest */}
      <mesh position={[0, 1.52, -0.36]}>
        <boxGeometry args={[0.65, 0.18, 0.14]} />
        <meshStandardMaterial color={LEATHER_DARK} roughness={0.7} />
      </mesh>
      {/* Left armrest */}
      <mesh position={[-0.44, 0.38, -0.05]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.72]} />
        <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.44, 0.42, -0.04]}>
        <boxGeometry args={[0.12, 0.06, 0.68]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.6} />
      </mesh>
      {/* Right armrest */}
      <mesh position={[0.44, 0.38, -0.05]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.72]} />
        <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.44, 0.42, -0.04]}>
        <boxGeometry args={[0.12, 0.06, 0.68]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.6} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.38, -0.35, 0.1]}>
        <cylinderGeometry args={[0.04, 0.05, 0.7, 8]} />
        <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.38, -0.35, 0.1]}>
        <cylinderGeometry args={[0.04, 0.05, 0.7, 8]} />
        <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Occupied person */}
      {occupied && (
        <group position={[0, 0.2, 0.05]}>
          {/* Body */}
          <mesh position={[0, 0.65, -0.1]} castShadow>
            <capsuleGeometry args={[0.18, 0.5, 8, 12]} />
            <meshStandardMaterial color={personColor} roughness={0.6} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 1.3, -0.05]} castShadow>
            <sphereGeometry args={[0.17, 16, 16]} />
            <meshStandardMaterial color="#F5CBA7" roughness={0.5} />
          </mesh>
          {/* Hair */}
          <mesh position={[0, 1.42, -0.06]}>
            <sphereGeometry args={[0.175, 16, 8]} />
            <meshStandardMaterial color="#2C1A0E" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─── ChairsAndPeople ──────────────────────────────────────────────────────
export function ChairsAndPeople({
  position,
  rotation = [0, 0, 0],
  isActive,
}: PropProps) {
  const ringRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        ringRef.current.emissiveIntensity,
        isActive ? 1.9 : 0.25,
        1 - Math.exp(-delta * 4.5),
      );
    }

    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        isActive ? 1.2 : 0.18,
        1 - Math.exp(-delta * 4.5),
      );
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Raised platform */}
      <mesh position={[0, -0.9, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[4.2, 4.4, 0.18, 32]} />
        <meshStandardMaterial color="#1C1008" roughness={0.9} />
      </mesh>
      {/* Carpet on platform */}
      <mesh position={[0, -0.81, 0]} receiveShadow>
        <cylinderGeometry args={[3.9, 3.9, 0.02, 32]} />
        <meshStandardMaterial color={CARPET_COLOR} roughness={1} />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, -0.9, 0]}>
        <torusGeometry args={[4.3, 0.05, 8, 64]} />
        <meshStandardMaterial
          ref={ringRef}
          color="#fff"
          emissive={isActive ? "#ff4a4a" : "#330000"}
          emissiveIntensity={0.25}
          toneMapped={false}
        />
      </mesh>

      {/* 3 cinema seats in a slight arc */}
      <CinemaSeat position={[-1.6, -0.8, 0.2]} occupied personColor="#4287f5" />
      <CinemaSeat position={[0, -0.8, 0]} occupied personColor="#42f584" />
      <CinemaSeat position={[1.6, -0.8, 0.2]} occupied personColor="#f5b942" />

      {/* Ambient glow underneath when active */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        color="#ff4a4a"
        intensity={0.18}
        distance={8}
        decay={2}
      />
    </group>
  );
}

// ─── Display shelf unit ───────────────────────────────────────────────────
function DisplayShelf({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[1.6, 3.2, 0.9]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.7} />
      </mesh>
      {/* Glass door overlay */}
      <mesh position={[0, 0, 0.46]}>
        <boxGeometry args={[1.4, 3.0, 0.04]} />
        <meshStandardMaterial
          color="#aaddff"
          transparent
          opacity={0.18}
          roughness={0}
          metalness={0.1}
        />
      </mesh>
      {/* 3 shelves */}
      {[-0.8, 0, 0.8].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[1.5, 0.05, 0.85]} />
          <meshStandardMaterial color={LIGHT_WOOD} roughness={0.6} />
        </mesh>
      ))}
      {/* Door handle */}
      <mesh position={[0.55, 0, 0.5]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>
      {/* Decorative items on shelves */}
      {/* Trophy */}
      <mesh position={[-0.3, 0.12, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.22, 12]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>
      {/* Film reel on middle shelf */}
      <mesh position={[0.2, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.18, 0.04, 8, 24]} />
        <meshStandardMaterial
          color={DARK_METAL}
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
      {/* Books on top shelf */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.92, 0]} rotation={[0, (i % 2) * 0.1, 0]}>
          <boxGeometry args={[0.12, 0.38, 0.22]} />
          <meshStandardMaterial
            color={["#8B1A1A", "#1A3A8B", "#1A8B3A", "#8B6A1A"][i]}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Cupboards ────────────────────────────────────────────────────────────
export function Cupboards({
  position,
  rotation = [0, 0, 0],
  isActive,
}: PropProps) {
  const baseGlowRef = useRef<THREE.MeshStandardMaterial>(null);
  const underCabinetRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (baseGlowRef.current) {
      baseGlowRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        baseGlowRef.current.emissiveIntensity,
        isActive ? 1.8 : 0.18,
        1 - Math.exp(-delta * 4.5),
      );
    }

    if (underCabinetRef.current) {
      underCabinetRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        underCabinetRef.current.emissiveIntensity,
        isActive ? 1.45 : 0.12,
        1 - Math.exp(-delta * 4.5),
      );
    }

    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        isActive ? 1.4 : 0.18,
        1 - Math.exp(-delta * 4.5),
      );
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Floor mat */}
      <mesh position={[0, -0.88, 0]} receiveShadow>
        <boxGeometry args={[7.5, 0.04, 2.5]} />
        <meshStandardMaterial color="#0D0808" roughness={1} />
      </mesh>
      {/* Glow strip at base */}
      <mesh position={[0, -0.88, 1.2]}>
        <boxGeometry args={[7.5, 0.04, 0.06]} />
        <meshStandardMaterial
          ref={baseGlowRef}
          color="#fff"
          emissive={isActive ? "#ff4a4a" : "#110000"}
          emissiveIntensity={0.18}
          toneMapped={false}
        />
      </mesh>

      {/* Three display shelves */}
      <DisplayShelf position={[-2.2, 0.7, 0]} />
      <DisplayShelf position={[0, 0.7, 0]} />
      <DisplayShelf position={[2.2, 0.7, 0]} />

      {/* Top valance connecting all units */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <boxGeometry args={[7.2, 0.25, 0.95]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.7} />
      </mesh>
      {/* Gold cornice strip */}
      <mesh position={[0, 2.48, 0.48]}>
        <boxGeometry args={[7.2, 0.06, 0.06]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>

      {/* Under-cabinet LED strip */}
      <mesh position={[0, -0.52, 0.46]}>
        <boxGeometry args={[7.0, 0.04, 0.04]} />
        <meshStandardMaterial
          ref={underCabinetRef}
          color="#fff"
          emissive={isActive ? "#ffddaa" : "#221100"}
          emissiveIntensity={0.12}
          toneMapped={false}
        />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, 1, 1.5]}
        color="#ffddaa"
        intensity={0.18}
        distance={8}
        decay={2}
      />
    </group>
  );
}

// ─── AIDoor ───────────────────────────────────────────────────────────────
export function AIDoor({
  position,
  rotation = [0, 0, 0],
  isActive,
}: PropProps) {
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const t = clock.getElapsedTime();
    glowRef.current.emissiveIntensity = isActive
      ? 0.6 + Math.sin(t * 3) * 0.3
      : 0;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Entrance mat */}
      <mesh position={[0, -0.86, 1.2]} receiveShadow>
        <boxGeometry args={[4.5, 0.03, 2.8]} />
        <meshStandardMaterial color="#0A0A14" roughness={1} />
      </mesh>
      {/* Mat glow border */}
      <mesh position={[0, -0.85, 1.2]}>
        <boxGeometry args={[4.6, 0.02, 2.9]} />
        <meshStandardMaterial
          ref={glowRef}
          color="#000"
          emissive="#4444ff"
          emissiveIntensity={isActive ? 0.8 : 0}
          toneMapped={false}
        />
      </mesh>

      {/* Frame Left */}
      <mesh position={[-1.85, 1.5, 0]} castShadow>
        <boxGeometry args={[0.45, 5.0, 0.5]} />
        <meshStandardMaterial color="#111122" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Frame Right */}
      <mesh position={[1.85, 1.5, 0]} castShadow>
        <boxGeometry args={[0.45, 5.0, 0.5]} />
        <meshStandardMaterial color="#111122" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Frame Top */}
      <mesh position={[0, 3.75, 0]} castShadow>
        <boxGeometry args={[4.2, 0.5, 0.5]} />
        <meshStandardMaterial color="#111122" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Gold frame trim */}
      <mesh position={[-1.85, 1.5, 0.26]}>
        <boxGeometry args={[0.06, 5.0, 0.02]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[1.85, 1.5, 0.26]}>
        <boxGeometry args={[0.06, 5.0, 0.02]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 3.75, 0.26]}>
        <boxGeometry args={[4.2, 0.06, 0.02]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>

      {/* Door panel */}
      <mesh position={[0, 1.7, -0.12]} castShadow>
        <boxGeometry args={[3.2, 4.5, 0.18]} />
        <meshStandardMaterial
          color="#0a0a1a"
          roughness={0.1}
          metalness={0.9}
          emissive={isActive ? "#112244" : "#000"}
          emissiveIntensity={isActive ? 0.5 : 0}
        />
      </mesh>
      {/* Door panel inset */}
      <mesh position={[0, 1.7, -0.02]}>
        <boxGeometry args={[2.8, 4.0, 0.05]} />
        <meshStandardMaterial
          color="#050510"
          roughness={0.05}
          metalness={1}
          emissive={isActive ? "#2233aa" : "#000"}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>

      {/* AI logo panel */}
      <mesh position={[0, 2.2, 0.02]}>
        <boxGeometry args={[1.2, 0.5, 0.04]} />
        <meshStandardMaterial
          color="#000"
          emissive={isActive ? "#aaaaff" : "#222244"}
          emissiveIntensity={isActive ? 2 : 0.3}
          toneMapped={false}
        />
      </mesh>

      {/* Door handle */}
      <mesh position={[1.2, 1.7, 0.06]}>
        <cylinderGeometry args={[0.04, 0.04, 0.35, 12]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.1} />
      </mesh>
      {/* Handle back plate */}
      <mesh position={[1.2, 1.7, 0.02]}>
        <boxGeometry args={[0.12, 0.5, 0.04]} />
        <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Side wall sconces */}
      {[-2.8, 2.8].map((x, i) => (
        <group key={i} position={[x, 2.5, 0.3]}>
          <mesh>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial
              color={DARK_METAL}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial
              color="#fff"
              emissive={isActive ? "#ffeeaa" : "#221100"}
              emissiveIntensity={isActive ? 2 : 0.1}
              toneMapped={false}
            />
          </mesh>
          {isActive && (
            <pointLight
              position={[0, 0.4, 0]}
              color="#ffeeaa"
              intensity={1}
              distance={5}
              decay={2}
            />
          )}
        </group>
      ))}

      {isActive && (
        <pointLight
          position={[0, 2, 1]}
          color="#4444ff"
          intensity={2}
          distance={10}
          decay={2}
        />
      )}
    </group>
  );
}
