import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HoloDisplayProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  width?: number;
  height?: number;
}

const CODE_LINES = [
  'const agent = spawn({',
  '  type: "coder",',
  '  task: "implement",',
  '});',
  '',
  'await swarm.init({',
  '  topology: "mesh",',
  '  maxAgents: 15,',
  '});',
  '',
  'for (const task of queue) {',
  '  const result = await',
  '    agent.execute(task);',
  '  memory.store(result);',
  '}',
  '',
  'swarm.coordinate({',
  '  strategy: "adaptive"',
  '});',
  '',
  '// Performance: 60fps',
  '// Agents: 8/15 active',
  '// Memory: 256MB used',
];

export function HoloDisplay({
  position,
  rotation = [0, 0, 0],
  color = '#3b82f6',
  width = 3,
  height = 2,
}: HoloDisplayProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scrollOffset = useRef(0);

  const { canvas, texture } = useMemo(() => {
    const cvs = document.createElement('canvas');
    cvs.width = 256;
    cvs.height = 192;
    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearFilter;
    return { canvas: cvs, texture: tex };
  }, []);

  useFrame(({ clock }) => {
    scrollOffset.current += 0.3;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = 'rgba(10, 14, 26, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Code text
    ctx.font = '10px monospace';
    ctx.fillStyle = color;

    const lineHeight = 12;
    const startLine = Math.floor(scrollOffset.current / lineHeight) % CODE_LINES.length;
    const yOffset = -(scrollOffset.current % lineHeight);

    for (let i = 0; i < 20; i++) {
      const lineIdx = (startLine + i) % CODE_LINES.length;
      ctx.globalAlpha = 0.4 + Math.sin(clock.elapsedTime * 2 + i * 0.3) * 0.1;
      ctx.fillText(CODE_LINES[lineIdx], 8, 14 + i * lineHeight + yOffset);
    }
    ctx.globalAlpha = 1;

    // Border
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    ctx.globalAlpha = 1;

    texture.needsUpdate = true;

    // Floating animation
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <boxGeometry args={[width, height, 0.02]} />
      <meshStandardMaterial
        map={texture}
        emissive={color}
        emissiveIntensity={0.2}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}
