
export function TheatreRoom() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#7a6a6a" roughness={0.8} />
      </mesh>
      
      {/* North Wall */}
      <mesh position={[0, 7.5, -13]} receiveShadow>
        <boxGeometry args={[26, 15, 1]} />
        <meshStandardMaterial color="#6a6a7a" roughness={0.8} />
      </mesh>
      {/* South Wall */}
      <mesh position={[0, 7.5, 13]} receiveShadow>
        <boxGeometry args={[26, 15, 1]} />
        <meshStandardMaterial color="#6a6a7a" roughness={0.8} />
      </mesh>
      {/* East Wall */}
      <mesh position={[13, 7.5, 0]} receiveShadow>
        <boxGeometry args={[1, 15, 26]} />
        <meshStandardMaterial color="#6a6a7a" roughness={0.8} />
      </mesh>
      {/* West Wall */}
      <mesh position={[-13, 7.5, 0]} receiveShadow>
        <boxGeometry args={[1, 15, 26]} />
        <meshStandardMaterial color="#6a6a7a" roughness={0.8} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation-x={Math.PI / 2} position={[0, 15, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#3a3a4a" />
      </mesh>

      {/* Decorative strip lights along the floor edges */}
      <mesh position={[0, 0.1, -12.4]}>
        <boxGeometry args={[26, 0.2, 0.2]} />
        <meshStandardMaterial color="#ff2a2a" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0, 0.1, 12.4]}>
        <boxGeometry args={[26, 0.2, 0.2]} />
        <meshStandardMaterial color="#ff2a2a" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>
      <mesh position={[12.4, 0.1, 0]}>
        <boxGeometry args={[0.2, 0.2, 26]} />
        <meshStandardMaterial color="#ff2a2a" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-12.4, 0.1, 0]}>
        <boxGeometry args={[0.2, 0.2, 26]} />
        <meshStandardMaterial color="#ff2a2a" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}
