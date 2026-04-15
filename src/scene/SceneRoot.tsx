import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Lighting } from './Lighting';

// WASD + QE camera movement overlaid on top of OrbitControls
function FreeCamControls() {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const moveSpeed = 15;

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys.current.add(e.code.toLowerCase());
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code.toLowerCase());
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const speed = moveSpeed * dt;
    const pressed = keys.current;

    if (pressed.size === 0) return;

    // Get camera's forward and right vectors (projected onto XZ plane)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();

    // WASD movement
    if (pressed.has('keyw') || pressed.has('arrowup')) move.add(forward.clone().multiplyScalar(speed));
    if (pressed.has('keys') || pressed.has('arrowdown')) move.add(forward.clone().multiplyScalar(-speed));
    if (pressed.has('keya') || pressed.has('arrowleft')) move.add(right.clone().multiplyScalar(-speed));
    if (pressed.has('keyd') || pressed.has('arrowright')) move.add(right.clone().multiplyScalar(speed));

    // QE for vertical
    if (pressed.has('keyq')) move.y -= speed;
    if (pressed.has('keye')) move.y += speed;

    // Shift for speed boost
    if (pressed.has('shiftleft') || pressed.has('shiftright')) move.multiplyScalar(2.5);

    if (move.lengthSq() > 0) {
      camera.position.add(move);
    }
  });

  return null;
}

interface SceneRootProps {
  swarmEnvironment: string;
  children: React.ReactNode;
}

export function SceneRoot({ swarmEnvironment, children }: SceneRootProps) {
  return (
    <Canvas
      camera={{ position: [20, 18, 20], fov: 50, near: 0.1, far: 500 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: '#0a0e1a' }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2('#0a0e1a', 0.008);
      }}
    >
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={100}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        enablePan
        panSpeed={1.5}
      />
      <FreeCamControls />
      <Lighting swarmEnvironment={swarmEnvironment} />
      {children}
    </Canvas>
  );
}
