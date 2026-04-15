import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Lighting } from './Lighting';

function FreeCam() {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    euler.current.setFromQuaternion(camera.quaternion, 'YXZ');

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys.current.add(e.code.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code.toLowerCase());

    // Left-click drag to rotate camera
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };
    const onMouseUp = () => { isDragging.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.003;
      euler.current.y -= dx * sensitivity;
      euler.current.x -= dy * sensitivity;
      euler.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    const onWheel = (e: WheelEvent) => {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      camera.position.addScaledVector(forward, -e.deltaY * 0.05);
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    const dom = gl.domElement;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('contextmenu', onContextMenu);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('contextmenu', onContextMenu);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pressed = keys.current;
    if (pressed.size === 0) return;

    let speed = 15 * dt;
    if (pressed.has('shiftleft') || pressed.has('shiftright')) speed *= 3;
    const rotSpeed = 1.5 * dt;

    // Camera rotation via J/L (yaw) and I/K (pitch)
    let rotated = false;
    if (pressed.has('keyj') || pressed.has('arrowleft')) { euler.current.y += rotSpeed; rotated = true; }
    if (pressed.has('keyl') || pressed.has('arrowright')) { euler.current.y -= rotSpeed; rotated = true; }
    if (pressed.has('keyi')) { euler.current.x += rotSpeed; rotated = true; }
    if (pressed.has('keyk')) { euler.current.x -= rotSpeed; rotated = true; }
    if (rotated) {
      euler.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    }

    // Movement via WASD
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    if (pressed.has('keyw')) move.add(forward.clone().multiplyScalar(speed));
    if (pressed.has('keys')) move.add(forward.clone().multiplyScalar(-speed));
    if (pressed.has('keya')) move.add(right.clone().multiplyScalar(-speed));
    if (pressed.has('keyd')) move.add(right.clone().multiplyScalar(speed));
    if (pressed.has('space') || pressed.has('keye')) move.y += speed;
    if (pressed.has('keyq')) move.y -= speed;

    if (move.lengthSq() > 0) camera.position.add(move);
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
      camera={{ position: [30, 25, 40], fov: 65, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.3,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: '#0a0e1a' }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2('#0a0e1a', 0.002);
      }}
    >
      <FreeCam />
      <Lighting swarmEnvironment={swarmEnvironment} />
      {children}
    </Canvas>
  );
}
