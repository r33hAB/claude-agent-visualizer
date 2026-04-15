import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloorGridProps {
  gridColor: string;
  pulseSpeed?: number;
}

export function FloorGrid({ gridColor, pulseSpeed = 1 }: FloorGridProps) {
  const gridRef = useRef<THREE.InstancedMesh>(null);
  const lineCount = 42; // 21 lines per axis

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const matrices = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    // X-direction lines (running along Z axis)
    for (let i = 0; i <= 20; i++) {
      const x = -40 + i * 4;
      const mat4 = new THREE.Matrix4();
      mat4.makeTranslation(x, 0.01, 0);
      m.push(mat4);
    }
    // Z-direction lines (running along X axis, rotated 90 degrees)
    for (let i = 0; i <= 20; i++) {
      const z = -40 + i * 4;
      const mat4 = new THREE.Matrix4();
      mat4.compose(
        new THREE.Vector3(0, 0.01, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
        new THREE.Vector3(1, 1, 1),
      );
      m.push(mat4);
    }
    return m;
  }, []);

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
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Grid lines */}
      <instancedMesh ref={gridRef} args={[undefined, undefined, lineCount]}>
        <boxGeometry args={[0.03, 0.02, 80]} />
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
