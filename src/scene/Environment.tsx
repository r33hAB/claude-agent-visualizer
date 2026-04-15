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

const ROOM_SIZE = 160;
const WALL_HEIGHT = 40;
const CEILING_Y = 35;

export function Environment({ swarmEnvironment }: EnvironmentProps) {
  const color = ENV_COLORS[swarmEnvironment] ?? ENV_COLORS.active;
  const half = ROOM_SIZE / 2;

  return (
    <group>
      <FloorGrid gridColor={color} pulseSpeed={swarmEnvironment === 'heavy' ? 3 : 1} />

      {/* Walls */}
      <mesh position={[0, WALL_HEIGHT / 2, -half]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, 0.5]} />
        <meshStandardMaterial color="#0d1117" roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[0, WALL_HEIGHT / 2, half]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, 0.5]} />
        <meshStandardMaterial color="#0d1117" roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[-half, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.5, WALL_HEIGHT, ROOM_SIZE]} />
        <meshStandardMaterial color="#0d1117" roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[half, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.5, WALL_HEIGHT, ROOM_SIZE]} />
        <meshStandardMaterial color="#0d1117" roughness={0.8} metalness={0.3} />
      </mesh>

      {/* Neon wall strips — left/right walls */}
      {[-half, half].map((x) =>
        [5, 15, 25].map((y, i) => (
          <mesh key={`strip-x-${x}-${i}`} position={[x + (x > 0 ? -0.3 : 0.3), y, 0]}>
            <boxGeometry args={[0.05, 0.1, ROOM_SIZE - 20]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
        )),
      )}
      {/* Neon wall strips — front/back walls */}
      {[-half, half].map((z) =>
        [5, 15, 25].map((y, i) => (
          <mesh key={`strip-z-${z}-${i}`} position={[0, y, z + (z > 0 ? -0.3 : 0.3)]}>
            <boxGeometry args={[ROOM_SIZE - 20, 0.1, 0.05]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
        )),
      )}

      {/* Ceiling */}
      <mesh position={[0, CEILING_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial color="#030408" side={THREE.DoubleSide} />
      </mesh>

      {/* Holographic displays on walls */}
      <HoloDisplay position={[-(half - 0.5), 12, -30]} rotation={[0, Math.PI / 2, 0]} color={color} width={5} height={3} />
      <HoloDisplay position={[-(half - 0.5), 12, 0]} rotation={[0, Math.PI / 2, 0]} color={color} width={5} height={3} />
      <HoloDisplay position={[-(half - 0.5), 12, 30]} rotation={[0, Math.PI / 2, 0]} color={color} width={5} height={3} />
      <HoloDisplay position={[(half - 0.5), 12, -30]} rotation={[0, -Math.PI / 2, 0]} color={color} width={5} height={3} />
      <HoloDisplay position={[(half - 0.5), 12, 0]} rotation={[0, -Math.PI / 2, 0]} color={color} width={5} height={3} />
      <HoloDisplay position={[(half - 0.5), 12, 30]} rotation={[0, -Math.PI / 2, 0]} color={color} width={5} height={3} />
      <HoloDisplay position={[-30, 12, -(half - 0.5)]} rotation={[0, 0, 0]} color={color} width={5} height={3} />
      <HoloDisplay position={[30, 12, -(half - 0.5)]} rotation={[0, 0, 0]} color={color} width={5} height={3} />
    </group>
  );
}
