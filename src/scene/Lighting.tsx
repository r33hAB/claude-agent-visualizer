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

const TUBE_POSITIONS: [number, number, number][] = [
  [-8, 12, -8],
  [8, 12, -8],
  [-8, 12, 8],
  [8, 12, 8],
];

function NeonTube({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const flicker = 0.8 + Math.sin(clock.elapsedTime * 3 + position[0]) * 0.2;
      mat.emissiveIntensity = flicker;
    }
    if (lightRef.current) {
      const flicker = 1.5 + Math.sin(clock.elapsedTime * 3 + position[0]) * 0.5;
      lightRef.current.intensity = flicker;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
        />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={2} distance={25} decay={2} />
    </group>
  );
}

export function Lighting({ swarmEnvironment }: LightingProps) {
  const color = ENV_COLORS[swarmEnvironment] ?? ENV_COLORS.active;

  return (
    <>
      <ambientLight color="#4466aa" intensity={0.15} />
      <hemisphereLight color="#4466aa" groundColor="#1a0a2e" intensity={0.1} />
      <directionalLight position={[5, 15, 5]} intensity={0.3} color="#aabbdd" />
      {TUBE_POSITIONS.map((pos, i) => (
        <NeonTube key={i} position={pos} color={color} />
      ))}
      <spotLight
        position={[0, 14, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={0.5}
        color={color}
        distance={30}
        decay={2}
      />
    </>
  );
}
