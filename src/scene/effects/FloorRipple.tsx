import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloorRippleProps {
  position: [number, number, number];
  color: string;
  active: boolean;
}

const ANIMATION_DURATION = 1.5;
const INITIAL_RADIUS = 0.5;
const TUBE_RADIUS = 0.03;
const MAX_SCALE = 15;
const INITIAL_OPACITY = 0.8;
const Y_OFFSET = 0.06;

export function FloorRipple({ position, color, active }: FloorRippleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = useRef(0);
  const isAnimating = useRef(false);
  const prevActive = useRef(false);

  // Detect rising edge of active prop
  useEffect(() => {
    if (active && !prevActive.current) {
      phase.current = 0;
      isAnimating.current = true;
    }
    prevActive.current = active;
  }, [active]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!isAnimating.current) {
      mesh.visible = false;
      return;
    }

    const clamped = Math.min(delta, 0.05);
    phase.current += clamped / ANIMATION_DURATION;

    if (phase.current >= 1) {
      phase.current = 0;
      isAnimating.current = false;
      mesh.visible = false;
      return;
    }

    mesh.visible = true;

    const t = phase.current;
    const scale = 1 + (MAX_SCALE - 1) * t;
    mesh.scale.setScalar(scale);

    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.opacity = INITIAL_OPACITY * (1 - t);
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], Y_OFFSET, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    >
      <torusGeometry args={[INITIAL_RADIUS, TUBE_RADIUS, 8, 48]} />
      <meshStandardMaterial
        color={new THREE.Color(color)}
        emissive={new THREE.Color(color)}
        emissiveIntensity={2}
        transparent
        opacity={INITIAL_OPACITY}
      />
    </mesh>
  );
}
