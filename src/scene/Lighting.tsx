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
      {/* Strong ambient so nothing is pitch black */}
      <ambientLight color="#aabbcc" intensity={0.6} />

      {/* Hemisphere gives directional ambient — sky above, dark below */}
      <hemisphereLight color="#bbccdd" groundColor="#223344" intensity={0.4} />

      {/* Main overhead directional — illuminates everything evenly */}
      <directionalLight position={[15, 40, 15]} intensity={0.8} color="#ccddee" />
      <directionalLight position={[-15, 40, -15]} intensity={0.4} color="#aabbcc" />

      {/* Neon ceiling tubes */}
      {TUBE_POSITIONS.map((pos, i) => (
        <NeonTube key={i} position={pos} color={color} />
      ))}

      {/* Wide center spotlight flooding the main area */}
      <spotLight
        position={[0, 30, 0]}
        angle={1.2}
        penumbra={0.8}
        intensity={1.5}
        color="#ddeeff"
        distance={80}
        decay={1.5}
      />

      {/* 4 ground-level fill lights at the agent area corners */}
      <pointLight position={[-15, 3, -15]} color="#4466aa" intensity={1} distance={30} decay={2} />
      <pointLight position={[15, 3, -15]} color="#4466aa" intensity={1} distance={30} decay={2} />
      <pointLight position={[-15, 3, 15]} color="#4466aa" intensity={1} distance={30} decay={2} />
      <pointLight position={[15, 3, 15]} color="#4466aa" intensity={1} distance={30} decay={2} />
    </>
  );
}
