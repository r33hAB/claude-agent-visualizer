import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InteractionEffectProps {
  active: boolean;
  phase: number; // 0-1
  color: string;
}

/**
 * Visual effect that plays during agent interactions:
 * - Glowing orb passes between agents (phase 0→0.4)
 * - Burst of particles at handoff point (phase 0.4→0.7)
 * - Confirmation ring expanding outward (phase 0.7→1.0)
 */
export function InteractionEffect({ active, phase, color }: InteractionEffectProps) {
  const orbRef = useRef<THREE.Mesh>(null);
  const burstRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const emissiveColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;

    // Phase 0-0.4: glowing orb rises and moves forward
    if (orbRef.current) {
      if (phase < 0.4) {
        const p = phase / 0.4; // 0-1 within this sub-phase
        orbRef.current.visible = true;
        orbRef.current.position.set(0, 1.5 + Math.sin(p * Math.PI) * 1.5, p * 1.5);
        orbRef.current.scale.setScalar(0.15 + p * 0.1);
        const mat = orbRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 2 + Math.sin(t * 8) * 0.5;
      } else {
        orbRef.current.visible = false;
      }
    }

    // Phase 0.3-0.7: particle burst
    if (burstRef.current) {
      if (phase > 0.3 && phase < 0.7) {
        burstRef.current.visible = true;
        const p = (phase - 0.3) / 0.4;
        burstRef.current.scale.setScalar(p * 2);
        burstRef.current.children.forEach((child, i) => {
          const mesh = child as THREE.Mesh;
          const angle = (i / 8) * Math.PI * 2;
          const r = p * 1.5;
          mesh.position.set(Math.cos(angle) * r, 2 + Math.sin(angle + t * 3) * 0.5, Math.sin(angle) * r);
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.opacity = 1 - p;
        });
      } else {
        burstRef.current.visible = false;
      }
    }

    // Phase 0.6-1.0: confirmation ring on ground
    if (ringRef.current) {
      if (phase > 0.6) {
        ringRef.current.visible = true;
        const p = (phase - 0.6) / 0.4;
        ringRef.current.scale.setScalar(1 + p * 4);
        const mat = ringRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = (1 - p) * 0.6;
      } else {
        ringRef.current.visible = false;
      }
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Glowing handoff orb */}
      <mesh ref={orbRef}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Particle burst */}
      <group ref={burstRef}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={3}
              transparent
              opacity={1}
            />
          </mesh>
        ))}
      </group>

      {/* Confirmation ring on ground */}
      <mesh ref={ringRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.04, 8, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}
