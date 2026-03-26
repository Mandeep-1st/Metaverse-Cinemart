import { Html } from "@react-three/drei";

interface PropProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  isActive: boolean;
  videoUrl?: string;
}

export function BigTV({ position, rotation = [0, 0, 0], isActive, videoUrl }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* TV Mount / Back */}
      <mesh position={[0, 4.0, -0.4]} castShadow>
        <boxGeometry args={[24.4, 13.4, 0.3]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* TV Screen */}
      <mesh position={[0, 4.0, -0.2]} castShadow>
        <boxGeometry args={[24, 13, 0.1]} />
        <meshStandardMaterial 
          color={isActive ? "#fff" : "#050505"} 
          emissive={isActive ? "#aaaaee" : "#000"} 
          emissiveIntensity={isActive ? 0.8 : 0} 
        />
        {videoUrl && (
          <Html transform position={[0, 0, 0.06]} scale={0.02}>
            <div style={{ width: 1200, height: 650, background: '#000', borderRadius: '8px', overflow: 'hidden', pointerEvents: 'none' }}>
              <iframe
                title="TV Trailer"
                width="1200"
                height="650"
                src={`${videoUrl}?autoplay=1&mute=1&controls=0&loop=1`}
                allow="autoplay; encrypted-media"
                style={{ border: 'none', pointerEvents: 'none' }}
              />
            </div>
          </Html>
        )}
      </mesh>
      {/* TV Stand / Console below it */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[26, 1, 1.5]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Glowing base to show it's active */}
      <mesh position={[0, -0.85, 0]}>
        <boxGeometry args={[27, 0.1, 2.0]} />
        <meshStandardMaterial color="#fff" emissive={isActive ? "#ff4a4a" : "#000"} emissiveIntensity={isActive ? 1 : 0} />
      </mesh>
    </group>
  );
}

function Person({ position, color }: { position: [number, number, number], color: string }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 1, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f0d0b0" roughness={0.4} />
      </mesh>
    </group>
  );
}

function Chair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Seat */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
        <meshStandardMaterial color="#8b0000" roughness={0.9} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 1, -0.35]} castShadow>
        <boxGeometry args={[0.8, 0.9, 0.1]} />
        <meshStandardMaterial color="#8b0000" roughness={0.9} />
      </mesh>
      {/* Armrests */}
      <mesh position={[0.35, 0.8, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-0.35, 0.8, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Base leg */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.3, 0.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

export function ChairsAndPeople({ position, rotation = [0, 0, 0], isActive }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Platform/Carpet for Comments Area */}
      <mesh position={[0, -0.85, 0]} receiveShadow>
        <cylinderGeometry args={[3, 3, 0.1, 32]} />
        <meshStandardMaterial color="#222" emissive={isActive ? "#ff4a4a" : "#000"} emissiveIntensity={isActive ? 0.3 : 0} />
      </mesh>

      <Chair position={[-1.2, -0.8, 0]} />
      <Person position={[-1.2, -0.6, 0.1]} color="#4287f5" />
      
      <Chair position={[0, -0.8, 0]} />
      <Person position={[0, -0.6, 0.1]} color="#42f584" />
      
      <Chair position={[1.2, -0.8, 0]} />
      <Person position={[1.2, -0.6, 0.1]} color="#f5b942" />
    </group>
  );
}

export function Cupboards({ position, rotation = [0, 0, 0], isActive }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Glowing base/mat for the info area */}
      <mesh position={[0, -0.85, 0]}>
        <boxGeometry args={[6, 0.1, 2]} />
        <meshStandardMaterial color="#222" emissive={isActive ? "#ff4a4a" : "#000"} emissiveIntensity={isActive ? 0.5 : 0} />
      </mesh>

      {/* Left Cupboard */}
      <group position={[-1.6, 0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 2.8, 1]} />
          <meshStandardMaterial color="#4a3018" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 0, 0.52]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#aaa" />
        </mesh>
      </group>

      {/* Middle Cupboard */}
      <group position={[0, 0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 2.8, 1]} />
          <meshStandardMaterial color="#3a2210" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 0, 0.52]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#aaa" />
        </mesh>
      </group>

      {/* Right Cupboard */}
      <group position={[1.6, 0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 2.8, 1]} />
          <meshStandardMaterial color="#4a3018" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 0, 0.52]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color="#aaa" />
        </mesh>
      </group>
    </group>
  );
}

export function AIDoor({ position, rotation = [0, 0, 0], isActive }: PropProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Glowing entrance mat */}
      <mesh position={[0, -0.85, 1.2]} receiveShadow>
        <boxGeometry args={[4, 0.1, 2.4]} />
        <meshStandardMaterial color="#111" emissive={isActive ? "#ff4a4a" : "#000"} emissiveIntensity={isActive ? 0.8 : 0} />
      </mesh>

      {/* Frame Left */}
      <mesh position={[-1.75, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 4.8, 0.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Frame Right */}
      <mesh position={[1.75, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 4.8, 0.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Frame Top */}
      <mesh position={[0, 3.65, 0]} castShadow>
        <boxGeometry args={[4, 0.5, 0.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* The Door itself */}
      <mesh position={[0, 1.5, -0.1]} castShadow>
        <boxGeometry args={[3, 4.3, 0.2]} />
        <meshStandardMaterial color="#112233" roughness={0.2} metalness={0.8} emissive={isActive ? "#112244" : "#000"} emissiveIntensity={isActive ? 0.6 : 0} />
      </mesh>
      {/* Doorknob */}
      <mesh position={[1.2, 1.5, 0.05]} castShadow>
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial color="#fff" metalness={1} roughness={0.1} />
      </mesh>
    </group>
  );
}
