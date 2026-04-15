import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FLOOR_SIZE = 160;
const GRID_SPACING = 4;
const LINES_PER_AXIS = Math.floor(FLOOR_SIZE / GRID_SPACING) + 1;
const TOTAL_LINES = LINES_PER_AXIS * 2;

interface FloorGridProps {
  gridColor: string;
  pulseSpeed?: number;
}

export function FloorGrid({ gridColor, pulseSpeed = 1 }: FloorGridProps) {
  const gridRef = useRef<THREE.InstancedMesh>(null);
  const half = FLOOR_SIZE / 2;

  const matrices = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    for (let i = 0; i < LINES_PER_AXIS; i++) {
      const pos = -half + i * GRID_SPACING;
      // X-direction line
      const mat4 = new THREE.Matrix4();
      mat4.makeTranslation(pos, 0.01, 0);
      m.push(mat4);
    }
    for (let i = 0; i < LINES_PER_AXIS; i++) {
      const pos = -half + i * GRID_SPACING;
      const mat4 = new THREE.Matrix4();
      mat4.compose(
        new THREE.Vector3(0, 0.01, pos),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
        new THREE.Vector3(1, 1, 1),
      );
      m.push(mat4);
    }
    return m;
  }, [half]);

  useEffect(() => {
    if (!gridRef.current) return;
    for (let i = 0; i < matrices.length; i++) {
      gridRef.current.setMatrixAt(i, matrices[i]);
    }
    gridRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  useFrame(({ clock }) => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(clock.elapsedTime * pulseSpeed) * 0.2;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.8} />
      </mesh>

      <instancedMesh ref={gridRef} args={[undefined, undefined, TOTAL_LINES]} frustumCulled={false}>
        <boxGeometry args={[0.03, 0.02, FLOOR_SIZE]} />
        <meshStandardMaterial
          color={gridColor}
          emissive={gridColor}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
        />
      </instancedMesh>
    </group>
  );
}
