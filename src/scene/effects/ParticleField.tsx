import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  color: string;
  count?: number;
  speed?: number;
}

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  phase: number;
}

const BOUNDS = { x: 30, yMin: 0.5, yMax: 13, z: 30 };

function createParticle(speed: number): ParticleData {
  return {
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 2 * BOUNDS.x,
      BOUNDS.yMin + Math.random() * (BOUNDS.yMax - BOUNDS.yMin),
      (Math.random() - 0.5) * 2 * BOUNDS.z,
    ),
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * speed,
      (0.2 + Math.random() * 0.6) * speed,
      (Math.random() - 0.5) * speed,
    ),
    scale: 0.5 + Math.random() * 1.5,
    phase: Math.random() * Math.PI * 2,
  };
}

function respawnAtBottom(p: ParticleData, speed: number): void {
  p.position.set(
    (Math.random() - 0.5) * 2 * BOUNDS.x,
    BOUNDS.yMin,
    (Math.random() - 0.5) * 2 * BOUNDS.z,
  );
  p.velocity.set(
    (Math.random() - 0.5) * speed,
    (0.2 + Math.random() * 0.6) * speed,
    (Math.random() - 0.5) * speed,
  );
  p.phase = Math.random() * Math.PI * 2;
}

export function ParticleField({
  color,
  count = 200,
  speed = 1,
}: ParticleFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useRef<ParticleData[]>([]);

  // Initialize particle data when count or speed changes
  useMemo(() => {
    particles.current = Array.from({ length: count }, () => createParticle(speed));
  }, [count, speed]);

  // Set initial instance matrices on mount
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < particles.current.length; i++) {
      const p = particles.current[i];
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, speed, dummy]);

  const geometry = useMemo(
    () => new THREE.SphereGeometry(0.03, 6, 6),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        emissive: new THREE.Color(color),
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.8,
        color: new THREE.Color(color),
      }),
    [color],
  );

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.elapsedTime;
    const clamped = Math.min(delta, 0.05);

    for (let i = 0; i < particles.current.length; i++) {
      const p = particles.current[i];

      // Integrate velocity
      p.position.x += p.velocity.x * clamped;
      p.position.y += p.velocity.y * clamped;
      p.position.z += p.velocity.z * clamped;

      // Gentle sine wander
      p.position.x += Math.sin(time + p.phase) * 0.02;
      p.position.z += Math.cos(time * 0.7 + p.phase) * 0.02;

      // Respawn if out of bounds
      if (
        p.position.y > BOUNDS.yMax ||
        Math.abs(p.position.x) > BOUNDS.x ||
        Math.abs(p.position.z) > BOUNDS.z
      ) {
        respawnAtBottom(p, speed);
      }

      // Compute instance matrix
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
