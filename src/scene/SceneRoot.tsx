import { useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Lighting } from './Lighting';

// True freecam: right-drag to look, WASD to move, scroll to change speed
function FreeCam() {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const isPointerLocked = useRef(false);
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const moveSpeed = useRef(15);

  useEffect(() => {
    // Initialize euler from current camera rotation
    euler.current.setFromQuaternion(camera.quaternion, 'YXZ');

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys.current.add(e.code.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code.toLowerCase());
    };

    const onMouseDown = (e: MouseEvent) => {
      // Right-click to start looking
      if (e.button === 2) {
        gl.domElement.requestPointerLock();
      }
    };

    const onPointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === gl.domElement;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;
      const sensitivity = 0.002;
      euler.current.y -= e.movementX * sensitivity;
      euler.current.x -= e.movementY * sensitivity;
      // Clamp vertical look
      euler.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    const onWheel = (e: WheelEvent) => {
      // Scroll to zoom/move forward-back
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      camera.position.addScaledVector(forward, -e.deltaY * 0.05);
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    const domElement = gl.domElement;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    domElement.addEventListener('mousedown', onMouseDown);
    domElement.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      domElement.removeEventListener('mousedown', onMouseDown);
      domElement.removeEventListener('mousemove', onMouseMove);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pressed = keys.current;
    if (pressed.size === 0) return;

    let speed = moveSpeed.current * dt;
    if (pressed.has('shiftleft') || pressed.has('shiftright')) speed *= 3;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();

    if (pressed.has('keyw') || pressed.has('arrowup')) move.add(forward.clone().multiplyScalar(speed));
    if (pressed.has('keys') || pressed.has('arrowdown')) move.add(forward.clone().multiplyScalar(-speed));
    if (pressed.has('keya') || pressed.has('arrowleft')) move.add(right.clone().multiplyScalar(-speed));
    if (pressed.has('keyd') || pressed.has('arrowright')) move.add(right.clone().multiplyScalar(speed));
    if (pressed.has('space')) move.y += speed;
    if (pressed.has('keyq') || pressed.has('controlright') || pressed.has('controlleft')) move.y -= speed;
    if (pressed.has('keye')) move.y += speed;

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
      camera={{ position: [25, 20, 25], fov: 60, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: '#0a0e1a' }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2('#0a0e1a', 0.004);
      }}
    >
      <FreeCam />
      <Lighting swarmEnvironment={swarmEnvironment} />
      {children}
    </Canvas>
  );
}
