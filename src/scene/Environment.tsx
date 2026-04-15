import * as THREE from 'three';
import { FloorGrid } from './FloorGrid';
import { HoloDisplay } from './effects/HoloDisplay';

const ENV_COLORS: Record<string, string> = {
  idle: '#8899bb',
  active: '#3b82f6',
  heavy: '#8b5cf6',
  error: '#ef4444',
  complete: '#f59e0b',
  shutdown: '#334155',
};

interface EnvironmentProps {
  swarmEnvironment: string;
}

export function Environment({ swarmEnvironment }: EnvironmentProps) {
  const color = ENV_COLORS[swarmEnvironment] ?? ENV_COLORS.active;

  return (
    <group>
      <FloorGrid gridColor={color} pulseSpeed={swarmEnvironment === 'heavy' ? 3 : 1} />

      {/* Back wall (-Z) */}
      <mesh position={[0, 7.5, -40]}>
        <boxGeometry args={[80, 15, 0.5]} />
        <meshStandardMaterial color="#0d1117" roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Front wall (+Z) */}
      <mesh position={[0, 7.5, 40]}>
        <boxGeometry args={[80, 15, 0.5]} />
        <meshStandardMaterial color="#0d1117" roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Left wall (-X) */}
      <mesh position={[-40, 7.5, 0]}>
        <boxGeometry args={[0.5, 15, 80]} />
        <meshStandardMaterial color="#0d1117" roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Right wall (+X) */}
      <mesh position={[40, 7.5, 0]}>
        <boxGeometry args={[0.5, 15, 80]} />
        <meshStandardMaterial color="#0d1117" roughness={0.8} metalness={0.3} />
      </mesh>

      {/* Neon wall strips on left/right walls */}
      {[-40, 40].map((x) =>
        [3, 8, 12].map((y, i) => (
          <mesh key={`strip-x-${x}-${i}`} position={[x + (x > 0 ? -0.3 : 0.3), y, 0]}>
            <boxGeometry args={[0.05, 0.08, 60]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
        )),
      )}
      {/* Neon wall strips on front/back walls */}
      {[-40, 40].map((z) =>
        [3, 8, 12].map((y, i) => (
          <mesh key={`strip-z-${z}-${i}`} position={[0, y, z + (z > 0 ? -0.3 : 0.3)]}>
            <boxGeometry args={[60, 0.08, 0.05]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
        )),
      )}

      {/* Ceiling */}
      <mesh position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#050810" side={THREE.DoubleSide} />
      </mesh>

      {/* Holographic displays on walls */}
      <HoloDisplay position={[-39.5, 6, -15]} rotation={[0, Math.PI / 2, 0]} color={color} />
      <HoloDisplay position={[-39.5, 6, 15]} rotation={[0, Math.PI / 2, 0]} color={color} />
      <HoloDisplay position={[39.5, 6, -15]} rotation={[0, -Math.PI / 2, 0]} color={color} />
      <HoloDisplay position={[39.5, 6, 15]} rotation={[0, -Math.PI / 2, 0]} color={color} />
      <HoloDisplay position={[-15, 6, -39.5]} rotation={[0, 0, 0]} color={color} />
      <HoloDisplay position={[15, 6, -39.5]} rotation={[0, 0, 0]} color={color} />
    </group>
  );
}
