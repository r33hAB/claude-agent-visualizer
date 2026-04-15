import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PROGRESS_COLORS } from '../types/agent';

function getProgressColor(progress: number): string {
  if (progress < 0) return PROGRESS_COLORS.error;
  if (progress <= 30) return PROGRESS_COLORS.low;
  if (progress <= 60) return PROGRESS_COLORS.mid;
  if (progress <= 90) return PROGRESS_COLORS.high;
  return PROGRESS_COLORS.complete;
}

interface ProgressRing3DProps {
  progress: number; // 0-100, negative for error
}

const RING_RADIUS = 5;
const TUBE_RADIUS = 0.08;
const RADIAL_SEGMENTS = 16;
const TUBULAR_SEGMENTS = 64;
const TICK_COUNT = 24;

export default function ProgressRing3D({ progress }: ProgressRing3DProps) {
  const progressMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const dotMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const tickMeshRef = useRef<THREE.InstancedMesh>(null);

  const clampedProgress = Math.min(Math.max(progress, -1), 100);
  const normalizedProgress = Math.abs(clampedProgress) / 100;
  const progressColor = getProgressColor(clampedProgress);
  const shouldPulse = clampedProgress > 90 || clampedProgress < 0;

  const prevGeomRef = useRef<THREE.TorusGeometry | null>(null);
  const arcGeometry = useMemo(() => {
    // Dispose previous geometry to prevent GPU memory leak
    if (prevGeomRef.current) prevGeomRef.current.dispose();
    const thetaLength = normalizedProgress * Math.PI * 2;
    if (thetaLength <= 0) { prevGeomRef.current = null; return null; }
    const geom = new THREE.TorusGeometry(
      RING_RADIUS,
      TUBE_RADIUS,
      RADIAL_SEGMENTS,
      TUBULAR_SEGMENTS,
      thetaLength,
    );
    prevGeomRef.current = geom;
    return geom;
  }, [normalizedProgress]);

  const dotPosition = useMemo(() => {
    const angle = normalizedProgress * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(angle) * RING_RADIUS,
      0,
      Math.sin(angle) * RING_RADIUS,
    );
  }, [normalizedProgress]);

  const tickBoxGeo = useMemo(
    () => new THREE.BoxGeometry(0.02, 0.02, 0.06),
    [],
  );

  // Set up tick mark instance transforms and colors
  useMemo(() => {
    const mesh = tickMeshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    const filledColor = new THREE.Color(progressColor);
    const dimColor = new THREE.Color('#444444');
    const filledCount = Math.floor((normalizedProgress) * TICK_COUNT);

    for (let i = 0; i < TICK_COUNT; i++) {
      const angle = (i / TICK_COUNT) * Math.PI * 2;
      dummy.position.set(
        Math.cos(angle) * RING_RADIUS,
        0,
        Math.sin(angle) * RING_RADIUS,
      );
      dummy.lookAt(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, i < filledCount ? filledColor : dimColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedProgress, progressColor, tickMeshRef.current]);

  // Pulse animation for completion or error states
  useFrame(({ clock }) => {
    if (!shouldPulse) return;
    const t = Math.sin(clock.elapsedTime * 3) * 0.5 + 0.5; // 0..1
    const intensity = 1.5 + t * 1.5; // 1.5..3.0

    if (progressMatRef.current) {
      progressMatRef.current.emissiveIntensity = intensity;
    }
    if (dotMatRef.current) {
      dotMatRef.current.emissiveIntensity = intensity + 0.5;
    }
  });

  return (
    <group position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Background ring */}
      <mesh>
        <torusGeometry args={[RING_RADIUS, TUBE_RADIUS, RADIAL_SEGMENTS, TUBULAR_SEGMENTS]} />
        <meshStandardMaterial
          color="#333333"
          emissive="#333333"
          emissiveIntensity={0.1}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Progress arc */}
      {arcGeometry && (
        <mesh geometry={arcGeometry}>
          <meshStandardMaterial
            ref={progressMatRef}
            color={progressColor}
            emissive={progressColor}
            emissiveIntensity={2}
          />
        </mesh>
      )}

      {/* Leading dot at arc tip */}
      {normalizedProgress > 0 && (
        <mesh position={dotPosition}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            ref={dotMatRef}
            color={progressColor}
            emissive={progressColor}
            emissiveIntensity={3}
          />
        </mesh>
      )}

      {/* Tick marks */}
      <instancedMesh
        ref={tickMeshRef}
        args={[tickBoxGeo, undefined, TICK_COUNT]}
      >
        <meshStandardMaterial
          emissive="#ffffff"
          emissiveIntensity={0.5}
        />
      </instancedMesh>
    </group>
  );
}
