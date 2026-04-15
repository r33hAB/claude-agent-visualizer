import { useRef, useMemo } from 'react';
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
const TUBULAR_SEGMENTS = 32;
const TUBE_RADIUS = 0.04;
const RADIAL_SEGMENTS = 6;
const SPHERE_RADIUS = 0.06;

export function InteractionBeam({
  from,
  to,
  color,
  life,
  maxLife,
}: InteractionBeamProps) {
  const sphereRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tubeRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const midX = (from[0] + to[0]) / 2;
    const midY = (from[1] + to[1]) / 2 + 3;
    const midZ = (from[2] + to[2]) / 2;
    const control = new THREE.Vector3(midX, midY, midZ);
    return new THREE.QuadraticBezierCurve3(start, control, end);
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, TUBULAR_SEGMENTS, TUBE_RADIUS, RADIAL_SEGMENTS, false);
  }, [curve]);

  const sphereGeometry = useMemo(() => {
    return new THREE.SphereGeometry(SPHERE_RADIUS, 8, 8);
  }, []);

  const opacity = Math.max(0, 1 - life / maxLife);

  const tubeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 2,
      transparent: true,
      opacity,
    });
  }, [color, opacity]);

  const sphereMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 3,
      transparent: true,
      opacity,
    });
  }, [color, opacity]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;

    // Update tube opacity
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 1 - life / maxLife);
    }

    // Animate particle spheres along the curve
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const mesh = sphereRefs.current[i];
      if (!mesh) continue;

      const t = (time * 2 + i * 0.2) % 1;
      const point = curve.getPoint(t);
      mesh.position.copy(point);

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 1 - life / maxLife);
    }
  });

  return (
    <group>
      {/* Energy beam tube */}
      <mesh ref={tubeRef} geometry={tubeGeometry} material={tubeMaterial} />

      {/* Particle spheres travelling along the beam */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <mesh
          key={`beam-particle-${i}`}
          ref={(el) => { sphereRefs.current[i] = el; }}
          geometry={sphereGeometry}
          material={sphereMaterial}
        />
      ))}
    </group>
  );
}
