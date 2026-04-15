import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ENV_COLORS: Record<string, string> = {
  idle: '#8899bb',
  active: '#3b82f6',
  heavy: '#8b5cf6',
  error: '#ef4444',
  complete: '#f59e0b',
  shutdown: '#334155',
};

interface LightingProps {
  swarmEnvironment: string;
}

// Neon tubes spread across the ceiling
const TUBE_POSITIONS: [number, number, number][] = [
  [-20, 25, -20],
  [20, 25, -20],
  [-20, 25, 20],
  [20, 25, 20],
  [0, 25, -30],
  [0, 25, 30],
  [-30, 25, 0],
  [30, 25, 0],
];

function NeonTube({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.8 + Math.sin(clock.elapsedTime * 3 + position[0]) * 0.2;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 3 + Math.sin(clock.elapsedTime * 3 + position[0]) * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 12, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Much bigger range so light actually reaches the floor */}
      <pointLight ref={lightRef} color={color} intensity={3} distance={60} decay={1.5} />
    </group>
  );
}

export function Lighting({ swarmEnvironment }: LightingProps) {
  const color = ENV_COLORS[swarmEnvironment] ?? ENV_COLORS.active;

  return (
    <>
      <ambientLight color="#94a7c6" intensity={0.34} />
      <hemisphereLight color="#dbe7ff" groundColor="#09101e" intensity={0.58} />
      <directionalLight position={[18, 28, 12]} intensity={1.15} color="#ecf3ff" />
      <directionalLight position={[-20, 14, -16]} intensity={0.48} color={color} />

      {TUBE_POSITIONS.map((pos, i) => (
        <NeonTube key={i} position={pos} color={color} />
      ))}

      <spotLight
        position={[0, 24, 10]}
        angle={0.6}
        penumbra={0.95}
        intensity={1.15}
        color="#f8fbff"
        distance={70}
        decay={1.35}
      />

      <pointLight position={[-15, 3, -15]} color="#1d4ed8" intensity={0.52} distance={28} decay={2} />
      <pointLight position={[15, 3, -15]} color="#0ea5e9" intensity={0.46} distance={28} decay={2} />
      <pointLight position={[-15, 3, 15]} color={color} intensity={0.44} distance={28} decay={2} />
      <pointLight position={[15, 3, 15]} color="#60a5fa" intensity={0.48} distance={28} decay={2} />
    </>
  );
}
