import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AgentCategory, type AnimationState } from '../types/agent';
import { AGENT_PALETTES } from './agentVisuals';

interface VoxelCharacterProps {
  category: AgentCategory;
  animationState: AnimationState;
  speedMultiplier?: number;
  seated?: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

function HeadMod({
  category,
  accent,
  glow,
}: {
  category: AgentCategory;
  accent: string;
  glow: string;
}) {
  const accentMat = (
    <meshStandardMaterial
      color={accent}
      emissive={glow}
      emissiveIntensity={0.45}
      roughness={0.35}
      metalness={0.45}
    />
  );

  switch (category) {
    case AgentCategory.Coder:
      return (
        <mesh position={[0, 0.16, 0.31]}>
          <boxGeometry args={[0.42, 0.08, 0.1]} />
          {accentMat}
        </mesh>
      );
    case AgentCategory.Reviewer:
      return (
        <group position={[0, 0.12, 0.29]}>
          <mesh>
            <boxGeometry args={[0.44, 0.06, 0.1]} />
            {accentMat}
          </mesh>
          <mesh position={[-0.12, -0.08, 0.04]}>
            <boxGeometry args={[0.08, 0.04, 0.02]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.65} />
          </mesh>
          <mesh position={[0.12, -0.08, 0.04]}>
            <boxGeometry args={[0.08, 0.04, 0.02]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.65} />
          </mesh>
        </group>
      );
    case AgentCategory.Planner:
      return (
        <group position={[0, 0.38, 0]}>
          <mesh>
            <boxGeometry args={[0.04, 0.28, 0.04]} />
            <meshStandardMaterial color={accent} roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={1.6} />
          </mesh>
        </group>
      );
    case AgentCategory.Security:
      return (
        <group>
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[0.66, 0.12, 0.66]} />
            {accentMat}
          </mesh>
          <mesh position={[0, 0.12, 0.3]}>
            <boxGeometry args={[0.34, 0.05, 0.08]} />
            <meshStandardMaterial color="#05070c" emissive={glow} emissiveIntensity={0.22} />
          </mesh>
        </group>
      );
    case AgentCategory.Researcher:
      return (
        <group position={[0, 0.12, 0.3]}>
          <mesh position={[-0.12, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.08, 10]} />
            {accentMat}
          </mesh>
          <mesh position={[0.12, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.08, 10]} />
            {accentMat}
          </mesh>
          <mesh>
            <boxGeometry args={[0.2, 0.03, 0.03]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.35} />
          </mesh>
        </group>
      );
    case AgentCategory.Coordinator:
      return (
        <group position={[0, 0.38, 0]}>
          <mesh>
            <boxGeometry args={[0.42, 0.05, 0.42]} />
            {accentMat}
          </mesh>
          {[-0.12, 0, 0.12].map((x, i) => (
            <mesh key={i} position={[x, 0.12, 0]}>
              <boxGeometry args={[0.04, 0.18, 0.04]} />
              <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      );
    case AgentCategory.Tester:
      return (
        <group>
          <mesh position={[0, 0.27, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.24, 0.02, 8, 18, Math.PI]} />
            {accentMat}
          </mesh>
          <mesh position={[-0.24, 0.08, 0.14]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.6} />
          </mesh>
        </group>
      );
    case AgentCategory.DevOps:
      return (
        <group position={[0, 0.36, 0]}>
          <mesh>
            <boxGeometry args={[0.48, 0.08, 0.48]} />
            {accentMat}
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.32, 0.08, 0.32]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.2} />
          </mesh>
        </group>
      );
    case AgentCategory.Debugger:
      return (
        <group position={[0.15, 0.12, 0.29]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1, 0.018, 8, 14]} />
            {accentMat}
          </mesh>
        </group>
      );
    case AgentCategory.Designer:
      return (
        <mesh position={[-0.08, 0.29, 0.03]} rotation={[0.1, 0, 0.24]}>
          <cylinderGeometry args={[0.28, 0.24, 0.1, 10]} />
          {accentMat}
        </mesh>
      );
    default:
      return null;
  }
}

interface ToolProps {
  category: AgentCategory;
  accent: string;
  glow: string;
  animationState: AnimationState;
  seated?: boolean;
}

interface ToolMotion {
  working: boolean;
  interacting: boolean;
  active: boolean;
  pulse: number;
  sweep: number;
  tap: number;
  bob: number;
  spin: number;
  glowLevel: number;
}

function getToolMotion(animationState: AnimationState, time: number): ToolMotion {
  const working = animationState === 'working';
  const interacting = animationState === 'interacting';
  const active = working || interacting;
  const speed = working ? 10 : interacting ? 6.5 : 2.2;

  return {
    working,
    interacting,
    active,
    pulse: Math.sin(time * speed) * 0.5 + 0.5,
    sweep: Math.sin(time * (active ? 3.4 : 1.2)),
    tap: Math.max(0, Math.sin(time * (working ? 14 : interacting ? 9 : 3))),
    bob: Math.sin(time * (active ? 4.4 : 1.8)),
    spin: time * (working ? 2.4 : interacting ? 1.5 : 0.45),
    glowLevel: interacting ? 0.92 : working ? 0.76 : 0.42,
  };
}

function RightHandTool({
  category,
  accent,
  glow,
  animationState,
  seated,
}: ToolProps) {
  const rootRef = useRef<THREE.Group>(null);
  const primaryRef = useRef<THREE.Mesh>(null);
  const secondaryRef = useRef<THREE.Mesh>(null);
  const detailRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    if (seated) return;
    const root = rootRef.current;
    if (!root) return;

    const t = clock.elapsedTime;
    const motion = getToolMotion(animationState, t);

    switch (category) {
      case AgentCategory.Coder:
        root.position.set(0, 0.02 + motion.bob * 0.008, 0.18);
        root.rotation.set(-0.46 - motion.sweep * 0.04, 0.18 + motion.sweep * 0.08, 0.04 + motion.sweep * 0.08);
        if (primaryRef.current) {
          const mat = primaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.35 + motion.glowLevel * 0.5;
        }
        detailRefs.current.forEach((line, i) => {
          if (!line) return;
          const mat = line.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.15 + (i === Math.floor(motion.pulse * detailRefs.current.length) ? 0.45 : 0.08);
        });
        break;
      case AgentCategory.Reviewer:
        root.position.set(0, -0.02 - motion.tap * 0.03, 0.12);
        root.rotation.set(0.18 + motion.tap * 0.12, 0.12, 1.55 + motion.sweep * 0.05);
        if (primaryRef.current) {
          const mat = primaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.22 + motion.glowLevel * 0.85;
        }
        break;
      case AgentCategory.Planner:
        root.position.set(0, 0.1 + motion.bob * 0.01, 0.06);
        root.rotation.set(0.04 + motion.tap * 0.04, 0, 0.04 + motion.sweep * 0.14);
        if (primaryRef.current) {
          primaryRef.current.scale.y = 0.88 + motion.glowLevel * 0.4;
          primaryRef.current.position.y = 0.31 + motion.glowLevel * 0.04;
          const mat = primaryRef.current.material as THREE.MeshStandardMaterial;
          mat.opacity = 0.08 + motion.glowLevel * 0.22;
          mat.emissiveIntensity = 0.18 + motion.glowLevel * 0.35;
        }
        if (secondaryRef.current) {
          const mat = secondaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.4 + motion.glowLevel * 1.0;
        }
        break;
      case AgentCategory.Researcher:
        root.position.set(0, 0.03 + motion.bob * 0.01, 0.14);
        root.rotation.set(0.26 + motion.sweep * 0.08, 0.2 + motion.sweep * 0.14, -0.14 + motion.sweep * 0.04);
        if (primaryRef.current) {
          primaryRef.current.rotation.z = motion.spin;
          const mat = primaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.2 + motion.glowLevel * 0.7;
        }
        if (secondaryRef.current) {
          const mat = secondaryRef.current.material as THREE.MeshStandardMaterial;
          mat.opacity = 0.24 + motion.glowLevel * 0.18;
        }
        break;
      case AgentCategory.Coordinator:
        root.position.set(0, 0.18 + motion.bob * 0.012, 0.02);
        root.rotation.set(0, motion.sweep * 0.12, 0);
        if (primaryRef.current) {
          const mat = primaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.45 + motion.glowLevel * 0.95;
        }
        if (secondaryRef.current) {
          secondaryRef.current.rotation.set(Math.PI / 2 + motion.spin * 0.6, 0.6 + motion.spin, motion.sweep * 0.2);
          const mat = secondaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.18 + motion.glowLevel * 0.62;
        }
        break;
      case AgentCategory.Tester:
        root.position.set(0, -0.02 - motion.tap * 0.016, 0.12);
        root.rotation.set(-0.25 + motion.tap * 0.08, 0, -0.1 + motion.sweep * 0.06);
        if (secondaryRef.current) {
          const mat = secondaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.12 + motion.glowLevel * 0.35;
        }
        if (detailRefs.current[0]) {
          detailRefs.current[0].position.x = motion.sweep * 0.045;
          const mat = detailRefs.current[0].material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.3 + motion.glowLevel * 0.6;
        }
        break;
      case AgentCategory.DevOps:
        root.position.set(0, -0.04 - motion.tap * 0.014, 0.08);
        root.rotation.set(0.1 + motion.tap * 0.05, 0.2 + motion.sweep * 0.08, -0.35 + (motion.tap - 0.35) * 0.28);
        if (primaryRef.current) {
          primaryRef.current.rotation.x = motion.sweep * 0.18;
        }
        if (secondaryRef.current) {
          const mat = secondaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.12 + motion.glowLevel * 0.5;
        }
        break;
      case AgentCategory.Debugger:
        root.position.set(0, 0.02 + motion.bob * 0.008, 0.14);
        root.rotation.set(0.18 + motion.sweep * 0.06, 0.12 + motion.sweep * 0.14, -0.1 + motion.sweep * 0.04);
        if (primaryRef.current) {
          const mat = primaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.24 + motion.glowLevel * 0.9;
        }
        if (secondaryRef.current) {
          const mat = secondaryRef.current.material as THREE.MeshStandardMaterial;
          mat.opacity = 0.22 + motion.glowLevel * 0.18;
        }
        break;
      case AgentCategory.Designer:
        root.position.set(0, -0.02 - motion.tap * 0.026, 0.12);
        root.rotation.set(0.05 + motion.tap * 0.04, 0.12 + motion.sweep * 0.08, 0.85 + motion.sweep * 0.06);
        if (primaryRef.current) {
          const mat = primaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.32 + motion.glowLevel * 0.85;
        }
        break;
      default:
        break;
    }
  });

  if (seated && (animationState === 'working' || animationState === 'idle')) return null;

  switch (category) {
    case AgentCategory.Coder:
      if (animationState === 'working') return null;
      return (
        <group ref={rootRef} position={[0, 0.02, 0.18]} rotation={[-0.46, 0.18, 0.04]}>
          <mesh position={[0, 0, -0.015]}>
            <boxGeometry args={[0.38, 0.24, 0.03]} />
            <meshStandardMaterial color="#08111e" roughness={0.18} metalness={0.75} />
          </mesh>
          <mesh ref={primaryRef} position={[0, 0, 0.004]}>
            <boxGeometry args={[0.34, 0.2, 0.01]} />
            <meshStandardMaterial
              color={accent}
              emissive={glow}
              emissiveIntensity={0.45}
              transparent
              opacity={0.68}
            />
          </mesh>
          {[-0.06, 0.0, 0.06].map((y, i) => (
            <mesh key={i} ref={(el) => { detailRefs.current[i] = el; }} position={[-0.03 + i * 0.03, y, 0.012]}>
              <boxGeometry args={[0.14 - i * 0.02, 0.015, 0.01]} />
              <meshStandardMaterial color="#dbeafe" emissive={glow} emissiveIntensity={0.28} />
            </mesh>
          ))}
        </group>
      );
    case AgentCategory.Reviewer:
      return (
        <group ref={rootRef} position={[0, -0.02, 0.12]} rotation={[0.18, 0.12, 1.55]}>
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.16, 0.12, 0.14]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.3} metalness={0.38} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.16, 6]} />
            <meshStandardMaterial color="#d97706" roughness={0.36} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.1, 0.05, 0.1]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.42} metalness={0.18} />
          </mesh>
          <mesh ref={primaryRef} position={[0, -0.09, 0.055]}>
            <boxGeometry args={[0.11, 0.02, 0.02]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.4} />
          </mesh>
        </group>
      );
    case AgentCategory.Planner:
      return (
        <group ref={rootRef} position={[0, 0.1, 0.06]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.018, 0.34, 6]} />
            <meshStandardMaterial color={accent} roughness={0.3} metalness={0.58} />
          </mesh>
          <mesh ref={secondaryRef} position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.55} />
          </mesh>
          <mesh ref={primaryRef} position={[0, 0.31, 0]}>
            <cylinderGeometry args={[0.02, 0.06, 0.18, 10, 1, true]} />
            <meshStandardMaterial
              color={accent}
              emissive={glow}
              emissiveIntensity={0.2}
              transparent
              opacity={0.14}
            />
          </mesh>
        </group>
      );
    case AgentCategory.Researcher:
      return (
        <group ref={rootRef} position={[0, 0.03, 0.14]} rotation={[0.26, 0.2, -0.14]}>
          <mesh ref={primaryRef}>
            <torusGeometry args={[0.11, 0.018, 8, 18]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.45} />
          </mesh>
          <mesh ref={secondaryRef} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.01, 18]} />
            <meshStandardMaterial color="#bfdbfe" transparent opacity={0.28} roughness={0.08} metalness={0.12} />
          </mesh>
          <mesh position={[0, -0.17, 0]}>
            <boxGeometry args={[0.03, 0.22, 0.03]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.76} metalness={0.1} />
          </mesh>
        </group>
      );
    case AgentCategory.Coordinator:
      return (
        <group ref={rootRef} position={[0, 0.18, 0.02]}>
          <mesh ref={primaryRef} position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.95} />
          </mesh>
          <mesh ref={secondaryRef} rotation={[Math.PI / 2, 0.6, 0]}>
            <torusGeometry args={[0.14, 0.012, 8, 18]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.6} />
          </mesh>
          <pointLight color={glow} intensity={0.65} distance={2.5} position={[0, 0.02, 0]} />
        </group>
      );
    case AgentCategory.Tester:
      return (
        <group ref={rootRef} position={[0, -0.02, 0.12]} rotation={[-0.25, 0, -0.1]}>
          <mesh>
            <boxGeometry args={[0.08, 0.22, 0.08]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.28} metalness={0.58} />
          </mesh>
          <mesh ref={secondaryRef} position={[0, 0.14, 0.02]}>
            <boxGeometry args={[0.15, 0.06, 0.12]} />
            <meshStandardMaterial color="#0f172a" emissive={glow} emissiveIntensity={0.18} roughness={0.2} metalness={0.72} />
          </mesh>
          <mesh ref={(el) => { detailRefs.current[0] = el; }} position={[0, 0.14, 0.08]}>
            <boxGeometry args={[0.03, 0.015, 0.012]} />
            <meshStandardMaterial color="#f8fafc" emissive={glow} emissiveIntensity={0.42} />
          </mesh>
          <mesh position={[0, 0.14, 0.08]}>
            <boxGeometry args={[0.1, 0.015, 0.01]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.36} />
          </mesh>
        </group>
      );
    case AgentCategory.DevOps:
      return (
        <group ref={rootRef} position={[0, -0.04, 0.08]} rotation={[0.1, 0.2, -0.35]}>
          <mesh ref={primaryRef}>
            <boxGeometry args={[0.03, 0.24, 0.03]} />
            <meshStandardMaterial color="#8a8f9c" metalness={0.85} roughness={0.24} />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <boxGeometry args={[0.13, 0.05, 0.03]} />
            <meshStandardMaterial color="#8a8f9c" metalness={0.85} roughness={0.24} />
          </mesh>
          <mesh ref={secondaryRef} position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.012, 6, 10, Math.PI]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.22} roughness={0.3} metalness={0.7} />
          </mesh>
        </group>
      );
    case AgentCategory.Debugger:
      return (
        <group ref={rootRef} position={[0, 0.02, 0.14]} rotation={[0.18, 0.12, -0.1]}>
          <mesh>
            <torusGeometry args={[0.09, 0.014, 8, 16]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.24} metalness={0.72} />
          </mesh>
          <mesh ref={secondaryRef} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.01, 16]} />
            <meshStandardMaterial color="#dbeafe" transparent opacity={0.25} roughness={0.06} metalness={0.12} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <boxGeometry args={[0.03, 0.2, 0.03]} />
            <meshStandardMaterial color="#64748b" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh ref={primaryRef} position={[0.09, 0, 0]}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.45} />
          </mesh>
        </group>
      );
    case AgentCategory.Designer:
      return (
        <group ref={rootRef} position={[0, -0.02, 0.12]} rotation={[0.05, 0.12, 0.85]}>
          <mesh>
            <cylinderGeometry args={[0.01, 0.014, 0.22, 6]} />
            <meshStandardMaterial color="#d4d4d8" roughness={0.24} metalness={0.55} />
          </mesh>
          <mesh ref={primaryRef} position={[0, 0.11, 0]}>
            <coneGeometry args={[0.015, 0.05, 6]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.48} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

function LeftHandTool({
  category,
  accent,
  glow,
  animationState,
  seated,
}: ToolProps) {
  const rootRef = useRef<THREE.Group>(null);
  const primaryRef = useRef<THREE.Mesh>(null);
  const detailRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    if (seated) return;
    const root = rootRef.current;
    if (!root) return;

    const t = clock.elapsedTime;
    const motion = getToolMotion(animationState, t);

    switch (category) {
      case AgentCategory.Reviewer:
        root.position.set(0, 0.0 + motion.bob * 0.008, 0.14);
        root.rotation.set(-0.55 + motion.sweep * 0.06, 0.05, -0.02 - motion.sweep * 0.04);
        detailRefs.current.forEach((line, i) => {
          if (!line) return;
          const mat = line.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.08 + (i === Math.floor(motion.pulse * detailRefs.current.length) ? 0.34 : 0.06);
        });
        break;
      case AgentCategory.Security:
        root.position.set(0, 0.04 + motion.bob * 0.006, 0.18);
        root.rotation.set(0.08, -0.08 + motion.sweep * 0.16, 0);
        if (primaryRef.current) {
          const mat = primaryRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.22 + motion.glowLevel * 0.45 + motion.pulse * 0.2;
        }
        if (detailRefs.current[0]) {
          detailRefs.current[0].position.y = motion.sweep * 0.08;
          const mat = detailRefs.current[0].material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.18 + motion.glowLevel * 0.5;
        }
        break;
      case AgentCategory.Designer:
        root.position.set(0, 0.02 + motion.bob * 0.006, 0.12);
        root.rotation.set(-0.2 + motion.sweep * 0.04, 0.05, 0.5 - motion.sweep * 0.08);
        detailRefs.current.forEach((dot, i) => {
          if (!dot) return;
          const mat = dot.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.12 + (i === Math.floor(motion.pulse * detailRefs.current.length) ? 0.34 : 0.08);
        });
        break;
      default:
        break;
    }
  });

  if (seated && (animationState === 'working' || animationState === 'idle')) return null;

  switch (category) {
    case AgentCategory.Reviewer:
      return (
        <group ref={rootRef} position={[0, 0.0, 0.14]} rotation={[-0.55, 0.05, -0.02]}>
          <mesh>
            <boxGeometry args={[0.28, 0.36, 0.03]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.46} metalness={0.06} />
          </mesh>
          {[-0.09, -0.01, 0.07].map((y, i) => (
            <mesh key={i} ref={(el) => { detailRefs.current[i] = el; }} position={[0, y, 0.018]}>
              <boxGeometry args={[0.18 - i * 0.02, 0.012, 0.01]} />
              <meshStandardMaterial color={i === 1 ? '#22c55e' : '#94a3b8'} emissive={glow} emissiveIntensity={0.14} />
            </mesh>
          ))}
        </group>
      );
    case AgentCategory.Security:
      return (
        <group ref={rootRef} position={[0, 0.04, 0.18]} rotation={[0.08, 0, 0]}>
          <mesh ref={primaryRef}>
            <boxGeometry args={[0.24, 0.34, 0.06]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.32} metalness={0.72} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.16, 0.22, 0.01]} />
            <meshStandardMaterial color="#0f172a" roughness={0.24} metalness={0.62} />
          </mesh>
          <mesh ref={(el) => { detailRefs.current[0] = el; }} position={[0, 0, 0.036]}>
            <boxGeometry args={[0.12, 0.02, 0.01]} />
            <meshStandardMaterial color={accent} emissive={glow} emissiveIntensity={0.24} />
          </mesh>
        </group>
      );
    case AgentCategory.Designer:
      return (
        <group ref={rootRef} position={[0, 0.02, 0.12]} rotation={[-0.2, 0.05, 0.5]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.16, 0.03, 10]} />
            <meshStandardMaterial color="#ddd0b4" roughness={0.7} metalness={0.08} />
          </mesh>
          {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#d946ef'].map((color, i) => (
            <mesh
              key={i}
              ref={(el) => { detailRefs.current[i] = el; }}
              position={[Math.cos(i * 1.2) * 0.07, 0.03, Math.sin(i * 1.2) * 0.07]}
            >
              <sphereGeometry args={[0.02, 6, 6]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12 + i * 0.04} />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}

type RigJoints = {
  body: THREE.Group;
  head: THREE.Group;
  lS: THREE.Group;
  lE: THREE.Group;
  lW: THREE.Group;
  rS: THREE.Group;
  rE: THREE.Group;
  rW: THREE.Group;
  lH: THREE.Group;
  lK: THREE.Group;
  lA: THREE.Group;
  rH: THREE.Group;
  rK: THREE.Group;
  rA: THREE.Group;
};

type AmbientOffsets = {
  x: number;
  y: number;
  z: number;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
};

type RoleMotion = {
  t: number;
  sway: number;
  sweep: number;
  pulse: number;
  bounce: number;
  liftL: number;
  liftR: number;
  reach: number;
  look: number;
  settle: number;
};

function getRoleMotion(category: AgentCategory, time: number): RoleMotion {
  let speed = 1;
  let phase = 0;

  switch (category) {
    case AgentCategory.Coder:
      speed = 1.12;
      phase = 0.2;
      break;
    case AgentCategory.Reviewer:
      speed = 0.96;
      phase = 1.1;
      break;
    case AgentCategory.Planner:
      speed = 0.9;
      phase = 2.3;
      break;
    case AgentCategory.Security:
      speed = 0.88;
      phase = 0.75;
      break;
    case AgentCategory.Researcher:
      speed = 1.04;
      phase = 1.9;
      break;
    case AgentCategory.Coordinator:
      speed = 0.86;
      phase = 2.8;
      break;
    case AgentCategory.Tester:
      speed = 1.06;
      phase = 1.45;
      break;
    case AgentCategory.DevOps:
      speed = 1.14;
      phase = 2.05;
      break;
    case AgentCategory.Debugger:
      speed = 0.98;
      phase = 0.55;
      break;
    case AgentCategory.Designer:
      speed = 0.92;
      phase = 2.55;
      break;
  }

  const t = time * speed + phase;

  return {
    t,
    sway: Math.sin(t * 1.15),
    sweep: Math.sin(t * 2.05),
    pulse: Math.sin(t * 4.1),
    bounce: Math.abs(Math.sin(t * 1.55)),
    liftL: Math.max(0, Math.sin(t * 1.45)),
    liftR: Math.max(0, Math.sin(t * 1.45 + Math.PI)),
    reach: Math.max(0, Math.sin(t * 2.6 + 0.4)),
    look: Math.sin(t * 0.72 + 0.8),
    settle: Math.sin(t * 0.48 + 1.15),
  };
}

function applyCategoryPose(
  category: AgentCategory,
  animationState: AnimationState,
  time: number,
  rig: RigJoints,
  seated: boolean,
) {
  const { body, head, lS, lE, lW, rS, rE, rW, lH, lK, rH, rK } = rig;
  const motion = getRoleMotion(category, time);
  const isIdle = animationState === 'idle';
  const isWorking = animationState === 'working';
  const isInteracting = animationState === 'interacting';
  const isWalking = animationState === 'walking_left' || animationState === 'walking_right';
  const mark = Math.sin(motion.t * 14);
  const sweep = Math.sin(motion.t * 0.8);
  const brush = Math.sin(motion.t * 8);
  const cue = Math.sin(motion.t * 4);

  switch (category) {
    case AgentCategory.Coder:
      if (seated && (isIdle || isWorking || isInteracting)) {
        body.rotation.x = isWorking ? -0.16 : -0.08;
        head.rotation.x = isWorking ? -0.12 : -0.06;
        head.rotation.y = Math.sin(motion.t * 0.8) * (isWorking ? 0.22 : 0.14);
        lS.rotation.z = -0.15;
        rS.rotation.z = 0.15;
        if (isWorking) {
          lS.rotation.x = -0.92;
          rS.rotation.x = -0.92;
          lE.rotation.x = -0.58 + mark * 0.06;
          rE.rotation.x = -0.58 - mark * 0.06;
          lW.rotation.x = mark * 0.1;
          rW.rotation.x = -mark * 0.1;
        } else {
          lS.rotation.x = -0.72;
          rS.rotation.x = -0.72;
          lE.rotation.x = -0.48 + mark * 0.02;
          rE.rotation.x = -0.48 - mark * 0.02;
        }
      } else if (isIdle || isWorking) {
        body.rotation.x = isWorking ? -0.18 : -0.08;
        head.rotation.x = isWorking ? -0.16 : -0.06;
        lS.rotation.x = isWorking ? -0.88 : -0.35;
        rS.rotation.x = isWorking ? -0.94 : -0.42;
        lS.rotation.z = -0.22;
        rS.rotation.z = 0.22;
        lE.rotation.x = (isWorking ? -1.25 : -0.9) + mark * 0.06;
        rE.rotation.x = (isWorking ? -1.28 : -0.95) - mark * 0.06;
        lW.rotation.x = mark * 0.16;
        rW.rotation.x = -mark * 0.16;
      } else if (isInteracting) {
        body.rotation.x = -0.1;
        rS.rotation.x = -0.9;
        rS.rotation.z = 0.18;
        rE.rotation.x = -0.72;
        rW.rotation.x = 0.12;
        lS.rotation.x = -0.28;
        lE.rotation.x = -0.5;
      } else if (isWalking) {
        body.rotation.z += 0.04;
      }
      break;
    case AgentCategory.Reviewer:
      if (seated && (isIdle || isWorking || isInteracting)) {
        body.rotation.x = isWorking ? -0.06 : 0.0;
        head.rotation.y += sweep * 0.22;
        head.rotation.x = -0.08;
        // Left hand on desk or supporting chin
        lS.rotation.x = isWorking ? -0.75 : -0.62;
        lS.rotation.z = -0.12;
        lE.rotation.x = isWorking ? -0.55 : -0.48;
        lW.rotation.x = 0.08;
        // Right hand on mouse (sweep for scanning docs)
        rS.rotation.x = isWorking ? -0.85 : -0.68;
        rS.rotation.z = 0.18;
        rE.rotation.x = -0.52 + sweep * 0.06;
        rW.rotation.x = sweep * 0.08;
      } else if (isIdle || isWorking) {
        body.rotation.x = isWorking ? -0.04 : 0.02;
        head.rotation.y += sweep * 0.18;
        lS.rotation.x = isWorking ? -0.72 : -0.52;
        lS.rotation.z = -0.12;
        lE.rotation.x = isWorking ? -1.2 : -1.0;
        lW.rotation.x = 0.12;
        rS.rotation.x = isWorking ? -0.92 : -0.18;
        rS.rotation.z = 0.22;
        rE.rotation.x = (isWorking ? -1.15 : -0.75) + mark * 0.22;
        rW.rotation.x = mark * 0.2;
      } else if (isInteracting) {
        lS.rotation.x = -0.6;
        lS.rotation.z = -0.08;
        lE.rotation.x = -1.05;
        rS.rotation.x = -0.35;
        rS.rotation.z = 0.28;
        rE.rotation.x = -0.82;
      }
      break;
    case AgentCategory.Planner:
      if (isIdle || isWorking || isInteracting) {
        body.rotation.y = sweep * (isWorking ? 0.22 : 0.14);
        head.rotation.y = sweep * 0.28;
        rS.rotation.x = isWorking ? -1.08 + cue * 0.08 : -0.82;
        rS.rotation.z = 0.2;
        rE.rotation.x = -0.18;
        lS.rotation.x = isWorking ? -0.34 : -0.18;
        lS.rotation.z = -0.44;
        lE.rotation.x = -0.48;
        lW.rotation.z = cue * 0.25;
      }
      break;
    case AgentCategory.Security:
      if (seated && (isIdle || isWorking || isInteracting)) {
        body.rotation.x = -0.04;
        head.rotation.y = Math.sin(motion.t * 1.2) * 0.35;
        head.rotation.x = -0.06;
        // Hands resting on desk/keyboard
        lS.rotation.x = -0.78;
        lS.rotation.z = -0.16;
        lE.rotation.x = -0.52;
        rS.rotation.x = -0.78;
        rS.rotation.z = 0.16;
        rE.rotation.x = -0.52;
        if (isWorking) {
          rE.rotation.x = -0.52 + mark * 0.04;
          lE.rotation.x = -0.52 - mark * 0.04;
        }
      } else if (isIdle || isWorking || isInteracting) {
        body.rotation.x = isWorking || isInteracting ? 0.08 : 0.04;
        body.rotation.y = isWorking || isInteracting ? 0.15 : 0;
        head.rotation.y = Math.sin(motion.t * 1.6) * 0.26;
        lS.rotation.x = isWorking || isInteracting ? -1.05 : -0.62;
        lS.rotation.z = -0.22;
        lE.rotation.x = -0.18;
        rS.rotation.x = isWorking || isInteracting ? -0.08 : 0.2;
        rS.rotation.z = 0.42;
        rE.rotation.x = -1.05;
        lH.rotation.z = -0.08;
        rH.rotation.z = 0.08;
        lK.rotation.x = 0.05;
        rK.rotation.x = 0.05;
      }
      break;
    case AgentCategory.Researcher:
      if (seated && (isIdle || isWorking || isInteracting)) {
        body.rotation.x = isWorking ? -0.18 : -0.1;
        head.rotation.x = -0.14;
        head.rotation.y = sweep * 0.2;
        // Right hand reaching toward data display
        rS.rotation.x = isWorking ? -0.88 : -0.72;
        rS.rotation.z = 0.14;
        rE.rotation.x = isWorking ? -0.55 + mark * 0.06 : -0.48;
        rW.rotation.x = -0.12 + mark * 0.08;
        // Left hand on desk
        lS.rotation.x = -0.7;
        lS.rotation.z = -0.12;
        lE.rotation.x = -0.46;
      } else if (isIdle || isWorking || isInteracting) {
        body.rotation.x = isWorking ? -0.22 : -0.14;
        head.rotation.x = -0.22;
        head.rotation.y = sweep * 0.18;
        rS.rotation.x = isWorking ? -0.78 : -0.64;
        rS.rotation.z = 0.18;
        rE.rotation.x = isWorking ? -1.2 : -1.08;
        rW.rotation.x = -0.5 + mark * 0.12;
        lS.rotation.x = -0.1;
        lE.rotation.x = -0.34;
      }
      break;
    case AgentCategory.Coordinator:
      if (isIdle || isWorking || isInteracting) {
        body.rotation.y = sweep * (isWorking ? 0.22 : 0.15);
        body.rotation.x = isWorking ? -0.04 : 0;
        head.rotation.y = sweep * 0.3;
        lS.rotation.x = -0.24 + cue * 0.05;
        lS.rotation.z = -0.52;
        lE.rotation.x = -0.52;
        rS.rotation.x = isInteracting ? -0.72 : -0.24 - cue * 0.05;
        rS.rotation.z = 0.52;
        rE.rotation.x = isInteracting ? -0.22 : -0.52;
        lW.rotation.z = cue * 0.4;
        rW.rotation.z = -cue * 0.4;
      }
      break;
    case AgentCategory.Tester:
      if (seated && (isIdle || isWorking || isInteracting)) {
        body.rotation.x = isWorking ? -0.1 : -0.04;
        head.rotation.x = -0.1;
        head.rotation.y = sweep * 0.12;
        // Right hand probing
        rS.rotation.x = isWorking ? -0.86 : -0.72;
        rS.rotation.z = 0.14;
        rE.rotation.x = -0.52 + mark * 0.08;
        rW.rotation.x = -0.08 + mark * 0.1;
        // Left hand steadying
        lS.rotation.x = -0.74;
        lS.rotation.z = -0.14;
        lE.rotation.x = -0.48;
      } else if (isIdle || isWorking || isInteracting) {
        body.rotation.x = isWorking ? -0.1 : -0.03;
        head.rotation.x = -0.06;
        lS.rotation.x = -0.2;
        lS.rotation.z = -0.18;
        lE.rotation.x = -0.5;
        rS.rotation.x = isWorking ? -0.7 : -0.42;
        rS.rotation.z = 0.18;
        rE.rotation.x = isWorking ? -0.95 : -0.88;
        rW.rotation.x = -0.14 + mark * 0.16;
      }
      break;
    case AgentCategory.DevOps:
      if (seated && (isIdle || isWorking || isInteracting)) {
        body.rotation.x = isWorking ? -0.1 : -0.02;
        head.rotation.y = sweep * 0.18;
        // Typing at terminal
        rS.rotation.x = isWorking ? -0.88 : -0.72;
        rS.rotation.z = 0.14;
        rE.rotation.x = -0.54 + (isWorking ? mark * 0.06 : 0);
        rW.rotation.z = isWorking ? mark * 0.08 : 0;
        lS.rotation.x = isWorking ? -0.88 : -0.68;
        lS.rotation.z = -0.14;
        lE.rotation.x = -0.54 + (isWorking ? -mark * 0.06 : 0);
      } else if (isIdle || isWorking || isInteracting) {
        body.rotation.x = isWorking ? -0.08 : 0.02;
        head.rotation.y = sweep * 0.16;
        rS.rotation.x = isWorking ? -0.76 : -1.12;
        rS.rotation.z = isWorking ? 0.18 : 0.26;
        rE.rotation.x = isWorking ? -0.92 + mark * 0.18 : -0.25;
        rW.rotation.z = isWorking ? -0.18 + mark * 0.35 : -0.55;
        lS.rotation.x = isWorking ? -0.52 : -0.02;
        lS.rotation.z = -0.18;
        lE.rotation.x = isWorking ? -1.18 : -0.3;
      }
      break;
    case AgentCategory.Debugger:
      if (seated && (isIdle || isWorking || isInteracting)) {
        body.rotation.x = isWorking ? -0.2 : -0.12;
        body.rotation.y = sweep * 0.08;
        head.rotation.x = -0.18;
        head.rotation.y = Math.sin(motion.t * 1.4) * 0.18;
        // Right hand examining/probing
        rS.rotation.x = isWorking ? -0.9 : -0.76;
        rS.rotation.z = 0.12;
        rE.rotation.x = -0.54 + (isWorking ? mark * 0.08 : 0);
        rW.rotation.x = -0.1 + mark * 0.06;
        // Left hand on desk
        lS.rotation.x = -0.72;
        lS.rotation.z = -0.12;
        lE.rotation.x = -0.48;
      } else if (isIdle || isWorking || isInteracting) {
        body.rotation.x = isWorking ? -0.24 : -0.18;
        body.rotation.y = sweep * 0.1;
        head.rotation.x = -0.24;
        head.rotation.y = Math.sin(motion.t * 1.8) * 0.16;
        rS.rotation.x = isWorking ? -0.82 : -0.72;
        rS.rotation.z = 0.12;
        rE.rotation.x = isWorking ? -1.18 : -1.08;
        rW.rotation.x = -0.58 + mark * 0.14;
        lS.rotation.x = -0.14;
        lE.rotation.x = -0.32;
        lH.rotation.x = 0.06;
      }
      break;
    case AgentCategory.Designer:
      if (seated && (isIdle || isWorking || isInteracting)) {
        body.rotation.z = isWorking ? -0.1 : -0.06;
        body.rotation.y = sweep * 0.1;
        head.rotation.z = 0.08;
        head.rotation.y = sweep * 0.14;
        // Left hand holding reference/palette on desk
        lS.rotation.x = -0.72;
        lS.rotation.z = -0.18;
        lE.rotation.x = -0.48;
        // Right hand drawing/designing
        rS.rotation.x = isWorking ? -0.88 : -0.72;
        rS.rotation.z = 0.16;
        rE.rotation.x = isWorking ? -0.54 + brush * 0.06 : -0.48;
        rW.rotation.x = isWorking ? brush * 0.1 : 0.04;
      } else if (isIdle || isWorking || isInteracting) {
        body.rotation.z = isWorking ? -0.16 : -0.1;
        body.rotation.y = sweep * 0.14;
        head.rotation.z = 0.12;
        head.rotation.y = sweep * 0.18;
        lS.rotation.x = -0.34;
        lS.rotation.z = -0.52;
        lE.rotation.x = -0.92;
        rS.rotation.x = isWorking ? -0.72 : -0.3;
        rS.rotation.z = 0.24;
        rE.rotation.x = isWorking ? -1.14 + brush * 0.12 : -0.68;
        rW.rotation.x = isWorking ? brush * 0.22 : 0.14;
      }
      break;
  }
}

function applyAmbientMotion(
  category: AgentCategory,
  animationState: AnimationState,
  time: number,
  rig: RigJoints,
  seated: boolean,
): AmbientOffsets {
  const { body, head, lS, lE, lW, rS, rE, rW, lH, lK, lA, rH, rK, rA } = rig;
  const motion = getRoleMotion(category, time);
  const breath = Math.sin(motion.t * 1.7) * 0.03 + Math.sin(motion.t * 0.83 + 1.2) * 0.015;
  const idle = animationState === 'idle';
  const working = animationState === 'working';
  const interacting = animationState === 'interacting';
  const active = idle || working || interacting;
  const amp = working ? 0.58 : interacting ? 0.64 : idle ? 0.48 : 0.4;
  // When seated, reduce body sway and lock legs
  const legAmp = seated ? 0 : amp;
  const bodyAmp = seated ? amp * 0.6 : amp;

  if (active) {
    switch (category) {
      case AgentCategory.Coder:
        body.rotation.x -= 0.05 * bodyAmp + motion.bounce * 0.08 * bodyAmp;
        body.rotation.y += motion.sway * 0.16 * bodyAmp;
        body.rotation.z += motion.settle * 0.03 * bodyAmp;
        head.rotation.x += breath * 0.28;
        head.rotation.y += motion.look * 0.14 * amp;
        head.rotation.z += motion.sweep * 0.03 * amp;
        lS.rotation.y += motion.pulse * 0.06 * amp;
        rS.rotation.y -= motion.pulse * 0.06 * amp;
        lE.rotation.x += motion.liftL * 0.16 * amp;
        rE.rotation.x += motion.liftR * 0.16 * amp;
        lW.rotation.z += motion.pulse * 0.11 * amp;
        rW.rotation.z -= motion.pulse * 0.11 * amp;
        lH.rotation.x -= motion.sway * 0.18 * legAmp;
        rH.rotation.x += motion.sway * 0.18 * legAmp;
        lK.rotation.x += motion.liftL * 0.24 * legAmp;
        rK.rotation.x += motion.liftR * 0.24 * legAmp;
        lA.rotation.x -= motion.sway * 0.04 * legAmp;
        rA.rotation.x += motion.sway * 0.04 * legAmp;
        return {
          x: motion.sway * 0.03 * bodyAmp,
          y: motion.bounce * 0.035 * bodyAmp,
          z: -0.012 + motion.settle * 0.012 * bodyAmp,
          tiltX: motion.bounce * 0.01 * bodyAmp,
          tiltY: motion.settle * 0.018 * bodyAmp,
          tiltZ: motion.sway * 0.012 * bodyAmp,
        };
      case AgentCategory.Reviewer:
        body.rotation.y += motion.sway * 0.18 * bodyAmp;
        body.rotation.z += motion.settle * 0.08 * bodyAmp;
        head.rotation.x += motion.reach * 0.05 * amp;
        head.rotation.y -= motion.look * 0.18 * amp;
        lS.rotation.x -= motion.liftL * 0.14 * amp;
        lE.rotation.x -= motion.liftL * 0.16 * amp;
        lW.rotation.z += motion.pulse * 0.08 * amp;
        rS.rotation.x -= motion.reach * 0.22 * amp;
        rE.rotation.x += motion.reach * 0.18 * amp;
        rW.rotation.z += motion.pulse * 0.15 * amp;
        lH.rotation.z -= motion.sway * 0.09 * legAmp;
        rH.rotation.z += motion.sway * 0.09 * legAmp;
        lK.rotation.x += motion.liftR * 0.18 * legAmp;
        rK.rotation.x += motion.liftL * 0.18 * legAmp;
        return {
          x: motion.sway * 0.028 * bodyAmp,
          y: motion.bounce * 0.028 * bodyAmp,
          z: -0.008 + motion.reach * 0.015 * bodyAmp,
          tiltX: breath * 0.008,
          tiltY: motion.settle * 0.022 * bodyAmp,
          tiltZ: motion.sway * 0.016 * bodyAmp,
        };
      case AgentCategory.Planner:
        body.rotation.y += motion.sway * 0.26 * bodyAmp;
        body.rotation.z += motion.sweep * 0.08 * bodyAmp;
        head.rotation.x += breath * 0.2;
        head.rotation.y += motion.look * 0.2 * amp;
        lS.rotation.z -= motion.sweep * 0.18 * amp;
        lE.rotation.z -= motion.sway * 0.12 * amp;
        lW.rotation.y += motion.pulse * 0.16 * amp;
        rS.rotation.x += motion.reach * 0.2 * amp;
        rE.rotation.z += motion.reach * 0.18 * amp;
        rW.rotation.z += motion.pulse * 0.1 * amp;
        lH.rotation.x -= motion.sway * 0.12 * legAmp;
        rH.rotation.x += motion.sway * 0.12 * legAmp;
        lK.rotation.x += motion.liftL * 0.12 * legAmp;
        rK.rotation.x += motion.liftR * 0.12 * legAmp;
        return {
          x: motion.sway * 0.032 * bodyAmp,
          y: motion.bounce * 0.03 * bodyAmp,
          z: 0.01 + motion.settle * 0.012 * bodyAmp,
          tiltX: breath * 0.01,
          tiltY: motion.sway * 0.026 * bodyAmp,
          tiltZ: motion.sweep * 0.014 * bodyAmp,
        };
      case AgentCategory.Security:
        body.rotation.x += motion.bounce * 0.04 * bodyAmp;
        body.rotation.y += motion.look * 0.22 * bodyAmp;
        head.rotation.x += motion.reach * 0.04 * amp;
        head.rotation.y += motion.sway * 0.32 * amp;
        head.rotation.z += motion.settle * 0.03 * amp;
        lS.rotation.y -= motion.look * 0.08 * amp;
        lE.rotation.z -= motion.pulse * 0.1 * amp;
        rS.rotation.y += motion.look * 0.08 * amp;
        rE.rotation.z += motion.pulse * 0.08 * amp;
        lH.rotation.z -= (0.06 + motion.sway * 0.06) * legAmp;
        rH.rotation.z += (0.06 + motion.sway * 0.06) * legAmp;
        lK.rotation.x += motion.liftL * 0.16 * legAmp;
        rK.rotation.x += motion.liftR * 0.16 * legAmp;
        return {
          x: motion.sway * 0.018 * bodyAmp,
          y: motion.bounce * 0.025 * bodyAmp,
          z: 0.012 + motion.reach * 0.008 * bodyAmp,
          tiltX: breath * 0.006,
          tiltY: motion.look * 0.016 * bodyAmp,
          tiltZ: motion.sway * 0.01 * bodyAmp,
        };
      case AgentCategory.Researcher:
        body.rotation.x -= motion.bounce * 0.09 * bodyAmp;
        body.rotation.y += motion.settle * 0.12 * bodyAmp;
        head.rotation.x += motion.reach * 0.06 * amp;
        head.rotation.y += motion.look * 0.18 * amp;
        rS.rotation.z += motion.sweep * 0.14 * amp;
        rW.rotation.z += motion.pulse * 0.16 * amp;
        lS.rotation.x += motion.sway * 0.08 * amp;
        lE.rotation.x += motion.settle * 0.1 * amp;
        lH.rotation.x -= motion.bounce * 0.14 * legAmp;
        rH.rotation.x -= motion.bounce * 0.14 * legAmp;
        lK.rotation.x += motion.bounce * 0.2 * legAmp;
        rK.rotation.x += motion.bounce * 0.2 * legAmp;
        return {
          x: motion.sway * 0.02 * bodyAmp,
          y: motion.bounce * 0.032 * bodyAmp,
          z: -0.016 + motion.settle * 0.012 * bodyAmp,
          tiltX: motion.bounce * 0.012 * bodyAmp,
          tiltY: motion.look * 0.014 * bodyAmp,
          tiltZ: motion.sway * 0.01 * bodyAmp,
        };
      case AgentCategory.Coordinator:
        body.rotation.y += motion.sway * 0.28 * bodyAmp;
        body.rotation.z += motion.sweep * 0.1 * bodyAmp;
        head.rotation.x += breath * 0.18;
        head.rotation.y += motion.look * 0.22 * amp;
        lS.rotation.x += motion.reach * 0.18 * amp;
        lS.rotation.z -= motion.sway * 0.2 * amp;
        lE.rotation.z += motion.pulse * 0.18 * amp;
        rS.rotation.x -= motion.reach * 0.1 * amp;
        rS.rotation.z += motion.sway * 0.2 * amp;
        rE.rotation.z -= motion.pulse * 0.18 * amp;
        lH.rotation.z -= motion.sway * 0.1 * legAmp;
        rH.rotation.z += motion.sway * 0.1 * legAmp;
        lK.rotation.x += motion.liftL * 0.12 * legAmp;
        rK.rotation.x += motion.liftR * 0.12 * legAmp;
        return {
          x: motion.sway * 0.034 * bodyAmp,
          y: motion.bounce * 0.03 * bodyAmp,
          z: motion.settle * 0.012 * bodyAmp,
          tiltX: breath * 0.008,
          tiltY: motion.sway * 0.03 * bodyAmp,
          tiltZ: motion.sweep * 0.016 * bodyAmp,
        };
      case AgentCategory.Tester:
        body.rotation.x -= motion.bounce * 0.06 * bodyAmp;
        body.rotation.y += motion.settle * 0.08 * bodyAmp;
        head.rotation.x += breath * 0.16;
        head.rotation.y += motion.look * 0.14 * amp;
        lS.rotation.x += motion.sway * 0.05 * amp;
        lW.rotation.z += motion.pulse * 0.08 * amp;
        rS.rotation.x -= motion.reach * 0.2 * amp;
        rE.rotation.x -= motion.reach * 0.12 * amp;
        rW.rotation.z -= motion.pulse * 0.14 * amp;
        lH.rotation.x -= motion.sway * 0.12 * legAmp;
        rH.rotation.x += motion.sway * 0.12 * legAmp;
        lK.rotation.x += motion.liftL * 0.18 * legAmp;
        rK.rotation.x += motion.liftR * 0.18 * legAmp;
        return {
          x: motion.sway * 0.02 * bodyAmp,
          y: motion.bounce * 0.022 * bodyAmp,
          z: -0.01 + motion.reach * 0.012 * bodyAmp,
          tiltX: motion.bounce * 0.01 * bodyAmp,
          tiltY: motion.settle * 0.014 * bodyAmp,
          tiltZ: motion.sway * 0.009 * bodyAmp,
        };
      case AgentCategory.DevOps:
        body.rotation.x -= motion.bounce * 0.05 * bodyAmp;
        body.rotation.y += motion.sway * 0.18 * bodyAmp;
        body.rotation.z += motion.pulse * 0.08 * bodyAmp;
        head.rotation.y += motion.look * 0.16 * amp;
        lS.rotation.x += motion.sway * 0.12 * amp;
        lE.rotation.x -= motion.bounce * 0.18 * amp;
        rS.rotation.x -= motion.reach * 0.22 * amp;
        rE.rotation.x -= motion.reach * 0.2 * amp;
        rW.rotation.z -= motion.pulse * 0.24 * amp;
        lH.rotation.x -= motion.bounce * 0.12 * legAmp;
        rH.rotation.x -= motion.bounce * 0.12 * legAmp;
        lK.rotation.x += motion.bounce * 0.22 * legAmp;
        rK.rotation.x += motion.bounce * 0.22 * legAmp;
        lA.rotation.x += motion.pulse * 0.04 * legAmp;
        rA.rotation.x -= motion.pulse * 0.04 * legAmp;
        return {
          x: motion.sway * 0.024 * bodyAmp,
          y: motion.bounce * 0.036 * bodyAmp,
          z: -0.006 + motion.settle * 0.01 * bodyAmp,
          tiltX: motion.bounce * 0.014 * bodyAmp,
          tiltY: motion.sway * 0.018 * bodyAmp,
          tiltZ: motion.pulse * 0.012 * bodyAmp,
        };
      case AgentCategory.Debugger:
        body.rotation.x -= motion.bounce * 0.07 * bodyAmp;
        body.rotation.y += motion.sway * 0.1 * bodyAmp;
        head.rotation.x += breath * 0.18;
        head.rotation.y += motion.look * 0.2 * amp;
        head.rotation.z += motion.pulse * 0.03 * amp;
        lS.rotation.x += motion.sway * 0.06 * amp;
        lE.rotation.x += motion.settle * 0.08 * amp;
        rS.rotation.x -= motion.reach * 0.18 * amp;
        rE.rotation.x -= motion.reach * 0.16 * amp;
        rW.rotation.z += motion.pulse * 0.18 * amp;
        lH.rotation.x -= motion.bounce * 0.08 * legAmp;
        rH.rotation.x -= motion.bounce * 0.08 * legAmp;
        lK.rotation.x += motion.bounce * 0.16 * legAmp;
        rK.rotation.x += motion.bounce * 0.16 * legAmp;
        return {
          x: motion.sway * 0.022 * bodyAmp,
          y: motion.bounce * 0.028 * bodyAmp,
          z: -0.012 + motion.look * 0.008 * bodyAmp,
          tiltX: motion.bounce * 0.012 * bodyAmp,
          tiltY: motion.look * 0.018 * bodyAmp,
          tiltZ: motion.sway * 0.01 * bodyAmp,
        };
      case AgentCategory.Designer:
        body.rotation.y += motion.settle * 0.12 * bodyAmp;
        body.rotation.z += motion.sway * 0.14 * bodyAmp;
        head.rotation.x += motion.reach * 0.05 * amp;
        head.rotation.y += motion.look * 0.16 * amp;
        lS.rotation.z -= motion.sway * 0.18 * amp;
        lE.rotation.z += motion.pulse * 0.14 * amp;
        rS.rotation.x -= motion.reach * 0.2 * amp;
        rE.rotation.x -= motion.reach * 0.18 * amp;
        rW.rotation.z += motion.pulse * 0.22 * amp;
        lH.rotation.z -= motion.sway * 0.08 * legAmp;
        rH.rotation.z += motion.sway * 0.08 * legAmp;
        lK.rotation.x += motion.liftL * 0.14 * legAmp;
        rK.rotation.x += motion.liftR * 0.14 * legAmp;
        return {
          x: motion.sway * 0.03 * bodyAmp,
          y: motion.bounce * 0.026 * bodyAmp,
          z: -0.006 + motion.settle * 0.01 * bodyAmp,
          tiltX: breath * 0.008,
          tiltY: motion.settle * 0.014 * bodyAmp,
          tiltZ: motion.sway * 0.022 * bodyAmp,
        };
    }
  }

  switch (animationState) {
    case 'celebrating':
      body.rotation.y += motion.pulse * 0.1;
      head.rotation.y += motion.settle * 0.12;
      lE.rotation.z += motion.pulse * 0.1;
      rE.rotation.z -= motion.pulse * 0.1;
      lH.rotation.x += motion.pulse * 0.08;
      rH.rotation.x -= motion.pulse * 0.08;
      return {
        x: motion.sway * 0.05,
        y: breath * 0.22,
        z: motion.pulse * 0.04,
        tiltX: breath * 0.015,
        tiltY: motion.settle * 0.05,
        tiltZ: motion.sway * 0.04,
      };
    case 'error':
      body.rotation.z += Math.sin(motion.t * 9.5) * 0.08;
      head.rotation.z += Math.sin(motion.t * 11.2) * 0.07;
      lW.rotation.z += Math.sin(motion.t * 10.5) * 0.08;
      rW.rotation.z -= Math.sin(motion.t * 10.5) * 0.08;
      return {
        x: Math.sin(motion.t * 12.5) * 0.03,
        y: breath * 0.08,
        z: 0,
        tiltX: 0,
        tiltY: 0,
        tiltZ: Math.sin(motion.t * 8.5) * 0.05,
      };
    case 'walking_left':
    case 'walking_right':
      return {
        x: 0,
        y: 0,
        z: 0,
        tiltX: 0,
        tiltY: 0,
        tiltZ: 0,
      };
    case 'entering':
    case 'exiting':
    default:
      return {
        x: motion.sway * 0.015,
        y: breath * 0.18,
        z: 0,
        tiltX: 0,
        tiltY: 0,
        tiltZ: motion.sway * 0.015,
      };
  }
}

export default function VoxelCharacter({
  category,
  animationState,
  speedMultiplier = 1,
  seated = false,
}: VoxelCharacterProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const lShoulderRef = useRef<THREE.Group>(null);
  const lElbowRef = useRef<THREE.Group>(null);
  const lWristRef = useRef<THREE.Group>(null);
  const rShoulderRef = useRef<THREE.Group>(null);
  const rElbowRef = useRef<THREE.Group>(null);
  const rWristRef = useRef<THREE.Group>(null);
  const lHipRef = useRef<THREE.Group>(null);
  const lKneeRef = useRef<THREE.Group>(null);
  const lAnkleRef = useRef<THREE.Group>(null);
  const rHipRef = useRef<THREE.Group>(null);
  const rKneeRef = useRef<THREE.Group>(null);
  const rAnkleRef = useRef<THREE.Group>(null);

  const phaseRef = useRef(animationState === 'entering' ? 0 : 1);
  const seatPhaseRef = useRef(seated ? 1 : 0);
  const palette = AGENT_PALETTES[category];
  const primary = useMemo(() => new THREE.Color(palette.primary), [palette.primary]);
  const accent = useMemo(() => new THREE.Color(palette.accent), [palette.accent]);
  const surface = useMemo(() => new THREE.Color(palette.surface), [palette.surface]);
  const glow = useMemo(() => new THREE.Color(palette.glow), [palette.glow]);
  const dark = useMemo(() => new THREE.Color(palette.dark), [palette.dark]);

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: primary,
      emissive: primary,
      emissiveIntensity: 0.1,
      roughness: 0.52,
      metalness: 0.18,
    }),
    [primary],
  );
  const plateMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: surface,
      emissive: glow,
      emissiveIntensity: 0.08,
      roughness: 0.24,
      metalness: 0.58,
    }),
    [surface, glow],
  );
  const headMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.12,
      roughness: 0.38,
      metalness: 0.25,
    }),
    [accent],
  );
  const faceMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#09111f',
      emissive: glow,
      emissiveIntensity: 0.18,
      roughness: 0.16,
      metalness: 0.72,
    }),
    [glow],
  );
  const limbMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: primary.clone().multiplyScalar(0.92),
      emissive: primary,
      emissiveIntensity: 0.05,
      roughness: 0.56,
      metalness: 0.16,
    }),
    [primary],
  );
  const jointMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: dark,
      emissive: dark,
      emissiveIntensity: 0.02,
      roughness: 0.32,
      metalness: 0.6,
    }),
    [dark],
  );
  const handMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: surface,
      emissive: glow,
      emissiveIntensity: 0.08,
      roughness: 0.28,
      metalness: 0.35,
    }),
    [surface, glow],
  );
  const shoeMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: dark,
      emissive: dark,
      emissiveIntensity: 0.02,
      roughness: 0.48,
      metalness: 0.28,
    }),
    [dark],
  );
  const glowMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: surface,
      emissive: glow,
      emissiveIntensity: 1.0,
      roughness: 0.12,
      metalness: 0.28,
    }),
    [surface, glow],
  );

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime * speedMultiplier;
    const dt = Math.min(delta, 0.05);

    const root = rootRef.current;
    const body = bodyRef.current;
    const head = headRef.current;
    const lS = lShoulderRef.current;
    const lE = lElbowRef.current;
    const lW = lWristRef.current;
    const rS = rShoulderRef.current;
    const rE = rElbowRef.current;
    const rW = rWristRef.current;
    const lH = lHipRef.current;
    const lK = lKneeRef.current;
    const lA = lAnkleRef.current;
    const rH = rHipRef.current;
    const rK = rKneeRef.current;
    const rA = rAnkleRef.current;

    if (!root || !body || !head || !lS || !lE || !lW || !rS || !rE || !rW || !lH || !lK || !lA || !rH || !rK || !rA) {
      return;
    }

    if (animationState === 'entering') phaseRef.current = Math.min(phaseRef.current + dt * 1.2, 1);
    else if (animationState === 'exiting') phaseRef.current = Math.max(phaseRef.current - dt * 1.2, 0);
    else phaseRef.current = Math.min(phaseRef.current + dt * 2, 1);
    const phase = phaseRef.current;

    // Smooth sit/stand transition
    const seatTarget = seated ? 1 : 0;
    seatPhaseRef.current = lerp(seatPhaseRef.current, seatTarget, Math.min(dt * 2.5, 1));
    const sp = seatPhaseRef.current;

    [body, head, lS, lE, lW, rS, rE, rW, lH, lK, lA, rH, rK, rA].forEach((joint) => joint.rotation.set(0, 0, 0));
    root.rotation.set(0, 0, 0);
    root.position.x = 0;
    root.position.z = 0;

    let rootY = 0;
    const SEATED_ROOT_Y = -0.55;

    switch (animationState) {
      case 'idle':
        if (sp > 0.01) {
          // Seated idle: blend between standing and seated
          const standY = 0.012 + Math.sin(t * 1.2) * 0.012;
          rootY = lerp(standY, SEATED_ROOT_Y, sp);
          head.rotation.y = Math.sin(t * 0.4) * 0.18;
          head.rotation.x = lerp(Math.sin(t * 0.6) * 0.04, -0.08, sp);
          body.rotation.y = Math.sin(t * 0.3) * 0.04;
          body.rotation.x = lerp(0, -0.06, sp);
          // Arms: blend from hanging to resting on desk
          lS.rotation.x = lerp(Math.sin(t * 0.8) * 0.1, -0.72, sp);
          rS.rotation.x = lerp(-Math.sin(t * 0.8) * 0.1, -0.72, sp);
          lS.rotation.z = lerp(-0.08, -0.12, sp);
          rS.rotation.z = lerp(0.08, 0.12, sp);
          lE.rotation.x = lerp(-0.15 + Math.sin(t * 0.7) * 0.05, -0.48 + Math.sin(t * 0.7) * 0.02, sp);
          rE.rotation.x = lerp(-0.15 - Math.sin(t * 0.7) * 0.05, -0.48 - Math.sin(t * 0.7) * 0.02, sp);
          // Legs: blend to seated
          lH.rotation.x = lerp(Math.sin(t * 0.5) * 0.03, -1.57, sp);
          rH.rotation.x = lerp(-Math.sin(t * 0.5) * 0.03, -1.57, sp);
          lK.rotation.x = lerp(0.02, 1.57, sp);
          rK.rotation.x = lerp(0.02, 1.57, sp);
          lA.rotation.x = lerp(0, 0.1, sp);
          rA.rotation.x = lerp(0, 0.1, sp);
        } else {
          rootY = 0.012 + Math.sin(t * 1.2) * 0.012;
          head.rotation.y = Math.sin(t * 0.4) * 0.24;
          head.rotation.x = Math.sin(t * 0.6) * 0.04;
          body.rotation.y = Math.sin(t * 0.3) * 0.04;
          lS.rotation.x = Math.sin(t * 0.8) * 0.1;
          rS.rotation.x = -Math.sin(t * 0.8) * 0.1;
          lS.rotation.z = -0.08;
          rS.rotation.z = 0.08;
          lE.rotation.x = -0.15 + Math.sin(t * 0.7) * 0.05;
          rE.rotation.x = -0.15 - Math.sin(t * 0.7) * 0.05;
          lH.rotation.x = Math.sin(t * 0.5) * 0.03;
          rH.rotation.x = -Math.sin(t * 0.5) * 0.03;
          lK.rotation.x = 0.02;
          rK.rotation.x = 0.02;
        }
        break;
      case 'working':
        if (sp > 0.01) {
          // Seated working: typing at keyboard
          rootY = lerp(0.01, SEATED_ROOT_Y, sp);
          head.rotation.x = -0.15 + Math.sin(t * 2) * 0.05;
          head.rotation.y = Math.sin(t * 0.8) * 0.2;
          body.rotation.x = lerp(-0.06, -0.12, sp);
          // Arms targeting keyboard
          lS.rotation.x = lerp(-0.58, -0.9, sp);
          rS.rotation.x = lerp(-0.58, -0.9, sp);
          lS.rotation.z = lerp(-0.22, -0.15, sp);
          rS.rotation.z = lerp(0.22, 0.15, sp);
          lE.rotation.x = lerp(-1.15 + Math.sin(t * 10) * 0.15, -0.6 + Math.sin(t * 10) * 0.08, sp);
          rE.rotation.x = lerp(-1.15 + Math.sin(t * 10 + 1.5) * 0.15, -0.6 + Math.sin(t * 10 + 1.5) * 0.08, sp);
          lW.rotation.x = lerp(Math.sin(t * 12) * 0.18, Math.sin(t * 12) * 0.1, sp);
          rW.rotation.x = lerp(Math.sin(t * 12 + 0.8) * 0.18, Math.sin(t * 12 + 0.8) * 0.1, sp);
          // Seated legs
          lH.rotation.x = lerp(0, -1.57, sp);
          rH.rotation.x = lerp(0, -1.57, sp);
          lK.rotation.x = lerp(0, 1.57, sp);
          rK.rotation.x = lerp(0, 1.57, sp);
          lA.rotation.x = lerp(0, 0.1, sp);
          rA.rotation.x = lerp(0, 0.1, sp);
        } else {
          rootY = 0.01 + Math.sin(t * 2.4) * 0.008;
          head.rotation.x = -0.28 + Math.sin(t * 2) * 0.08;
          body.rotation.x = -0.06;
          lS.rotation.x = -0.58;
          rS.rotation.x = -0.58;
          lS.rotation.z = -0.22;
          rS.rotation.z = 0.22;
          lE.rotation.x = -1.15 + Math.sin(t * 10) * 0.15;
          rE.rotation.x = -1.15 + Math.sin(t * 10 + 1.5) * 0.15;
          lW.rotation.x = Math.sin(t * 12) * 0.18;
          rW.rotation.x = Math.sin(t * 12 + 0.8) * 0.18;
        }
        break;
      case 'walking_left':
      case 'walking_right': {
        const walk = t * 5;
        rootY = 0.018 + Math.abs(Math.sin(walk)) * 0.05;
        body.rotation.x = -0.05;
        body.rotation.y = animationState === 'walking_left' ? -0.26 : 0.26;
        head.rotation.y = animationState === 'walking_left' ? -0.36 : 0.36;
        lS.rotation.x = Math.sin(walk) * 0.72;
        rS.rotation.x = -Math.sin(walk) * 0.72;
        lE.rotation.x = -0.38 - Math.max(0, -Math.sin(walk)) * 0.45;
        rE.rotation.x = -0.38 - Math.max(0, Math.sin(walk)) * 0.45;
        lS.rotation.z = -0.1;
        rS.rotation.z = 0.1;
        lH.rotation.x = -Math.sin(walk) * 0.62;
        rH.rotation.x = Math.sin(walk) * 0.62;
        lK.rotation.x = Math.max(0, Math.sin(walk)) * 0.76;
        rK.rotation.x = Math.max(0, -Math.sin(walk)) * 0.76;
        lA.rotation.x = Math.sin(walk) * 0.12;
        rA.rotation.x = -Math.sin(walk) * 0.12;
        break;
      }
      case 'interacting':
        if (sp > 0.01) {
          rootY = lerp(0.012, SEATED_ROOT_Y, sp);
          body.rotation.x = lerp(-0.04, -0.1, sp);
          head.rotation.y = Math.sin(t * 0.8) * 0.18;
          body.rotation.y = lerp(0.12, 0.06, sp);
          rS.rotation.x = lerp(-1.12 + Math.sin(t * 2) * 0.1, -0.85 + Math.sin(t * 2) * 0.06, sp);
          rS.rotation.z = lerp(0.22, 0.14, sp);
          rE.rotation.x = lerp(-0.26, -0.52, sp);
          rW.rotation.x = -0.2 + Math.sin(t * 3) * 0.08;
          lS.rotation.x = lerp(0, -0.72, sp);
          lS.rotation.z = lerp(-0.08, -0.12, sp);
          lE.rotation.x = lerp(-0.2, -0.48, sp);
          // Seated legs
          lH.rotation.x = lerp(0, -1.57, sp);
          rH.rotation.x = lerp(0, -1.57, sp);
          lK.rotation.x = lerp(0, 1.57, sp);
          rK.rotation.x = lerp(0, 1.57, sp);
        } else {
          rootY = 0.012;
          body.rotation.x = -0.04;
          head.rotation.y = Math.sin(t * 0.8) * 0.18;
          body.rotation.y = 0.12;
          rS.rotation.x = -1.12 + Math.sin(t * 2) * 0.1;
          rS.rotation.z = 0.22;
          rE.rotation.x = -0.26;
          rW.rotation.x = -0.2 + Math.sin(t * 3) * 0.08;
          lS.rotation.z = -0.08;
          lE.rotation.x = -0.2;
        }
        break;
      case 'celebrating':
        rootY = 0.05 + Math.abs(Math.sin(t * 4)) * 0.16;
        head.rotation.x = -0.36;
        head.rotation.z = Math.sin(t * 6) * 0.08;
        body.rotation.z = Math.sin(t * 4) * 0.05;
        lS.rotation.x = -2.45 + Math.sin(t * 5) * 0.3;
        rS.rotation.x = -2.45 + Math.sin(t * 5 + 1) * 0.3;
        lS.rotation.z = -0.36;
        rS.rotation.z = 0.36;
        lE.rotation.x = -0.46 + Math.sin(t * 7) * 0.28;
        rE.rotation.x = -0.46 + Math.sin(t * 7 + 0.5) * 0.28;
        lW.rotation.z = Math.sin(t * 8) * 0.34;
        rW.rotation.z = -Math.sin(t * 8) * 0.34;
        lH.rotation.z = -0.12;
        rH.rotation.z = 0.12;
        lK.rotation.x = 0.1;
        rK.rotation.x = 0.1;
        break;
      case 'error':
        head.rotation.x = 0.18;
        head.rotation.y = Math.sin(t * 12) * 0.18;
        body.rotation.x = 0.1;
        lS.rotation.x = 0.3;
        rS.rotation.x = 0.3;
        lS.rotation.z = -0.22;
        rS.rotation.z = 0.22;
        lE.rotation.x = -0.55;
        rE.rotation.x = -0.55;
        lW.rotation.x = -0.24;
        rW.rotation.x = -0.24;
        rootY = 0.008 + Math.sin(t * 15) * 0.012;
        break;
      case 'entering':
        rootY = lerp(-3, 0, phase);
        head.rotation.x = lerp(-0.35, 0, phase);
        lS.rotation.z = lerp(-0.45, 0, phase);
        rS.rotation.z = lerp(0.45, 0, phase);
        break;
      case 'exiting':
        rootY = lerp(0, -3, 1 - phase);
        head.rotation.x = lerp(0, 0.35, 1 - phase);
        break;
    }

    applyCategoryPose(category, animationState, t, {
      body,
      head,
      lS,
      lE,
      lW,
      rS,
      rE,
      rW,
      lH,
      lK,
      lA,
      rH,
      rK,
      rA,
    }, sp > 0.5);

    const ambient = applyAmbientMotion(category, animationState, t, {
      body,
      head,
      lS,
      lE,
      lW,
      rS,
      rE,
      rW,
      lH,
      lK,
      lA,
      rH,
      rK,
      rA,
    }, sp > 0.5);
    rootY += ambient.y;
    root.position.x = ambient.x;
    root.position.z = ambient.z;
    root.rotation.x = ambient.tiltX;
    root.rotation.y = ambient.tiltY;
    root.rotation.z = ambient.tiltZ;

    if (animationState === 'error') {
      const pulse = 0.35 + Math.abs(Math.sin(t * 8)) * 0.85;
      bodyMat.emissiveIntensity = 0.18 + pulse * 0.18;
      plateMat.emissiveIntensity = 0.14 + pulse * 0.22;
      headMat.emissiveIntensity = 0.18 + pulse * 0.16;
      faceMat.emissiveIntensity = 0.28 + pulse * 0.28;
      glowMat.emissiveIntensity = 1.1 + pulse * 1.15;
      limbMat.emissiveIntensity = 0.1 + pulse * 0.1;
    } else if (animationState === 'exiting') {
      const fade = phase;
      bodyMat.emissiveIntensity = 0.1 * fade;
      plateMat.emissiveIntensity = 0.08 * fade;
      headMat.emissiveIntensity = 0.12 * fade;
      faceMat.emissiveIntensity = 0.18 * fade;
      glowMat.emissiveIntensity = 1.0 * fade;
      limbMat.emissiveIntensity = 0.05 * fade;
    } else {
      bodyMat.emissiveIntensity = 0.1;
      plateMat.emissiveIntensity = 0.08;
      headMat.emissiveIntensity = 0.12;
      faceMat.emissiveIntensity = 0.18;
      glowMat.emissiveIntensity = 1.0;
      limbMat.emissiveIntensity = 0.05;
    }

    root.position.y = rootY;
  });

  return (
    <group scale={2.75}>
      <group ref={rootRef}>
        <group ref={bodyRef} position={[0, 0.72, 0]}>
          <mesh material={bodyMat}>
            <boxGeometry args={[0.72, 0.82, 0.42]} />
          </mesh>
          <mesh position={[0, 0.08, 0.18]} material={plateMat}>
            <boxGeometry args={[0.5, 0.34, 0.08]} />
          </mesh>
          <mesh position={[0, 0.0, 0.225]} material={glowMat}>
            <boxGeometry args={[0.12, 0.18, 0.025]} />
          </mesh>
          <mesh position={[0, -0.26, 0.02]} material={jointMat}>
            <boxGeometry args={[0.76, 0.12, 0.46]} />
          </mesh>
          <mesh position={[0, 0.04, -0.2]} material={jointMat}>
            <boxGeometry args={[0.28, 0.44, 0.1]} />
          </mesh>
          <mesh position={[-0.42, 0.22, 0]} material={plateMat}>
            <boxGeometry args={[0.16, 0.16, 0.22]} />
          </mesh>
          <mesh position={[0.42, 0.22, 0]} material={plateMat}>
            <boxGeometry args={[0.16, 0.16, 0.22]} />
          </mesh>
          <mesh position={[0, -0.44, 0]} material={jointMat}>
            <boxGeometry args={[0.56, 0.18, 0.32]} />
          </mesh>

          <group ref={headRef} position={[0, 0.8, 0.01]}>
            <mesh position={[0, -0.14, -0.02]} material={jointMat}>
              <boxGeometry args={[0.16, 0.14, 0.16]} />
            </mesh>
            <mesh position={[0, 0.16, 0]} material={headMat}>
              <boxGeometry args={[0.56, 0.56, 0.56]} />
            </mesh>
            <mesh position={[0, 0.16, 0.24]} material={faceMat}>
              <boxGeometry args={[0.42, 0.22, 0.07]} />
            </mesh>
            <mesh position={[-0.12, 0.18, 0.29]} material={glowMat}>
              <boxGeometry args={[0.08, 0.08, 0.02]} />
            </mesh>
            <mesh position={[0.12, 0.18, 0.29]} material={glowMat}>
              <boxGeometry args={[0.08, 0.08, 0.02]} />
            </mesh>
            <mesh position={[0, 0.28, 0.28]} material={jointMat}>
              <boxGeometry args={[0.32, 0.02, 0.02]} />
            </mesh>
            <mesh position={[0, 0.07, 0.29]}>
              <boxGeometry args={[0.14, 0.02, 0.02]} />
              <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.5} />
            </mesh>
            <HeadMod category={category} accent={palette.accent} glow={palette.glow} />
          </group>

          <group ref={lShoulderRef} position={[-0.47, 0.22, 0]}>
            <mesh material={jointMat}>
              <boxGeometry args={[0.15, 0.15, 0.15]} />
            </mesh>
            <mesh position={[0, -0.22, 0]} material={limbMat}>
              <boxGeometry args={[0.18, 0.36, 0.18]} />
            </mesh>
            <group ref={lElbowRef} position={[0, -0.43, 0]}>
              <mesh material={jointMat}>
                <boxGeometry args={[0.12, 0.12, 0.12]} />
              </mesh>
              <mesh position={[0, -0.18, 0]} material={limbMat}>
                <boxGeometry args={[0.16, 0.28, 0.16]} />
              </mesh>
              <group ref={lWristRef} position={[0, -0.34, 0]}>
                <mesh material={jointMat}>
                  <boxGeometry args={[0.1, 0.1, 0.1]} />
                </mesh>
                <mesh position={[0, -0.08, 0]} material={handMat}>
                  <boxGeometry args={[0.16, 0.1, 0.16]} />
                </mesh>
                <LeftHandTool category={category} accent={palette.accent} glow={palette.glow} animationState={animationState} seated={seated} />
              </group>
            </group>
          </group>

          <group ref={rShoulderRef} position={[0.47, 0.22, 0]}>
            <mesh material={jointMat}>
              <boxGeometry args={[0.15, 0.15, 0.15]} />
            </mesh>
            <mesh position={[0, -0.22, 0]} material={limbMat}>
              <boxGeometry args={[0.18, 0.36, 0.18]} />
            </mesh>
            <group ref={rElbowRef} position={[0, -0.43, 0]}>
              <mesh material={jointMat}>
                <boxGeometry args={[0.12, 0.12, 0.12]} />
              </mesh>
              <mesh position={[0, -0.18, 0]} material={limbMat}>
                <boxGeometry args={[0.16, 0.28, 0.16]} />
              </mesh>
              <group ref={rWristRef} position={[0, -0.34, 0]}>
                <mesh material={jointMat}>
                  <boxGeometry args={[0.1, 0.1, 0.1]} />
                </mesh>
                <mesh position={[0, -0.08, 0]} material={handMat}>
                  <boxGeometry args={[0.16, 0.1, 0.16]} />
                </mesh>
                <RightHandTool category={category} accent={palette.accent} glow={palette.glow} animationState={animationState} seated={seated} />
              </group>
            </group>
          </group>

          <group ref={lHipRef} position={[-0.18, -0.52, 0]}>
            <mesh material={jointMat}>
              <boxGeometry args={[0.16, 0.16, 0.16]} />
            </mesh>
            <mesh position={[0, -0.22, 0]} material={limbMat}>
              <boxGeometry args={[0.22, 0.36, 0.22]} />
            </mesh>
            <group ref={lKneeRef} position={[0, -0.42, 0]}>
              <mesh material={jointMat}>
                <boxGeometry args={[0.14, 0.14, 0.14]} />
              </mesh>
              <mesh position={[0, -0.19, 0]} material={limbMat}>
                <boxGeometry args={[0.2, 0.3, 0.2]} />
              </mesh>
              <group ref={lAnkleRef} position={[0, -0.36, 0]}>
                <mesh material={jointMat}>
                  <boxGeometry args={[0.1, 0.1, 0.1]} />
                </mesh>
                <mesh position={[0, -0.06, 0.05]} material={shoeMat}>
                  <boxGeometry args={[0.22, 0.1, 0.3]} />
                </mesh>
              </group>
            </group>
          </group>

          <group ref={rHipRef} position={[0.18, -0.52, 0]}>
            <mesh material={jointMat}>
              <boxGeometry args={[0.16, 0.16, 0.16]} />
            </mesh>
            <mesh position={[0, -0.22, 0]} material={limbMat}>
              <boxGeometry args={[0.22, 0.36, 0.22]} />
            </mesh>
            <group ref={rKneeRef} position={[0, -0.42, 0]}>
              <mesh material={jointMat}>
                <boxGeometry args={[0.14, 0.14, 0.14]} />
              </mesh>
              <mesh position={[0, -0.19, 0]} material={limbMat}>
                <boxGeometry args={[0.2, 0.3, 0.2]} />
              </mesh>
              <group ref={rAnkleRef} position={[0, -0.36, 0]}>
                <mesh material={jointMat}>
                  <boxGeometry args={[0.1, 0.1, 0.1]} />
                </mesh>
                <mesh position={[0, -0.06, 0.05]} material={shoeMat}>
                  <boxGeometry args={[0.22, 0.1, 0.3]} />
                </mesh>
              </group>
            </group>
          </group>
        </group>

        <pointLight color={palette.glow} intensity={0.8} distance={6.5} position={[0, 1.12, 0]} />
      </group>
    </group>
  );
}
