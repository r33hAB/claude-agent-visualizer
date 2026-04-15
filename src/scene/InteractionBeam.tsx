import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InteractionBeamProps {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  life: number;
  maxLife: number;
}

const PARTICLE_COUNT = 5;
const SPHERE_RADIUS = 0.06;

export function InteractionBeam({ from, to, color, life, maxLife }: InteractionBeamProps) {
  const sphereRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tubeRef = useRef<THREE.Mesh>(null);
  const tubeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const sphereMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const emissiveColor = useMemo(() => new THREE.Color(color), [color]);

  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = new THREE.Vector3(
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 3,
      (from[2] + to[2]) / 2,
    );
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 32, 0.04, 6, false);
  }, [curve]);

  // Dispose old geometry on cleanup
  useEffect(() => {
    return () => { tubeGeometry.dispose(); };
  }, [tubeGeometry]);

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(SPHERE_RADIUS, 8, 8), []);

  // Update opacity via refs every frame — no new materials
  useFrame(({ clock }) => {
    const opacity = Math.max(0, 1 - life / maxLife);
    const time = clock.elapsedTime;

    if (tubeMaterialRef.current) tubeMaterialRef.current.opacity = opacity;
    if (sphereMaterialRef.current) sphereMaterialRef.current.opacity = opacity;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const mesh = sphereRefs.current[i];
      if (!mesh) continue;
      const t = (time * 2 + i * 0.2) % 1;
      mesh.position.copy(curve.getPoint(t));
    }
  });

  return (
    <group>
      <mesh ref={tubeRef} geometry={tubeGeometry}>
        <meshStandardMaterial
          ref={tubeMaterialRef}
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={2}
          transparent
          opacity={1}
        />
      </mesh>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { sphereRefs.current[i] = el; }}
          geometry={sphereGeometry}
        >
          <meshStandardMaterial
            ref={i === 0 ? sphereMaterialRef : undefined}
            color={emissiveColor}
            emissive={emissiveColor}
            emissiveIntensity={3}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
}
