import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AgentCategory, type AnimationState } from '../types/agent';

interface VoxelCharacterProps {
  category: AgentCategory;
  animationState: AnimationState;
  speedMultiplier?: number;
}

const CATEGORY_COLORS: Record<AgentCategory, { primary: string; accent: string }> = {
  [AgentCategory.Coder]:       { primary: '#3b82f6', accent: '#60a5fa' },
  [AgentCategory.Reviewer]:    { primary: '#f59e0b', accent: '#fbbf24' },
  [AgentCategory.Planner]:     { primary: '#8b5cf6', accent: '#a78bfa' },
  [AgentCategory.Security]:    { primary: '#ef4444', accent: '#f87171' },
  [AgentCategory.Researcher]:  { primary: '#10b981', accent: '#34d399' },
  [AgentCategory.Coordinator]: { primary: '#ec4899', accent: '#f472b6' },
  [AgentCategory.Tester]:      { primary: '#14b8a6', accent: '#2dd4bf' },
  [AgentCategory.DevOps]:      { primary: '#f97316', accent: '#fb923c' },
  [AgentCategory.Debugger]:    { primary: '#6366f1', accent: '#818cf8' },
  [AgentCategory.Designer]:    { primary: '#d946ef', accent: '#e879f9' },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

function CategoryHeadModifier({ category, accent }: { category: AgentCategory; accent: string }) {
  const accentColor = new THREE.Color(accent);

  switch (category) {
    case AgentCategory.Coder:
      return (
        <mesh position={[0, 0, 0.3]}>
          <boxGeometry args={[0.5, 0.1, 0.1]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
        </mesh>
      );

    case AgentCategory.Reviewer:
      return (
        <mesh position={[0, 0, 0.3]}>
          <boxGeometry args={[0.4, 0.05, 0.15]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
        </mesh>
      );

    case AgentCategory.Planner:
      return (
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.05, 0.2, 0.05]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} />
        </mesh>
      );

    case AgentCategory.Security:
      // Security uses a larger head — handled in the head mesh itself
      return null;

    case AgentCategory.Researcher:
      return (
        <group position={[0, 0, 0.3]}>
          <mesh position={[-0.1, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1, 8]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.1, 8]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
          </mesh>
        </group>
      );

    case AgentCategory.Coordinator:
      return (
        <group>
          <mesh position={[-0.12, 0.35, 0]}>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0.12, 0.35, 0]}>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} />
          </mesh>
        </group>
      );

    case AgentCategory.Tester:
      return (
        <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.22, 0.03, 8, 16, Math.PI]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
        </mesh>
      );

    case AgentCategory.DevOps:
      return (
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.5]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.4} />
        </mesh>
      );

    case AgentCategory.Debugger:
      return (
        <mesh position={[0.1, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
        </mesh>
      );

    case AgentCategory.Designer:
      return (
        <mesh position={[-0.05, 0.28, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(15)]}>
          <boxGeometry args={[0.4, 0.1, 0.35]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
        </mesh>
      );

    default:
      return null;
  }
}

export default function VoxelCharacter({
  category,
  animationState,
  speedMultiplier = 1,
}: VoxelCharacterProps) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(animationState === 'entering' ? 0 : 1);
  const emissiveIntensityRef = useRef(0.3);

  const colors = CATEGORY_COLORS[category];
  const primaryColor = useMemo(() => new THREE.Color(colors.primary), [colors.primary]);
  const accentColor = useMemo(() => new THREE.Color(colors.accent), [colors.accent]);

  const bodyMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: primaryColor,
      emissive: primaryColor,
      emissiveIntensity: 0.3,
    }),
    [primaryColor],
  );

  const headMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.3,
    }),
    [accentColor],
  );

  const limbMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: primaryColor,
      emissive: primaryColor,
      emissiveIntensity: 0.2,
    }),
    [primaryColor],
  );

  const eyeMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: 'white',
      emissive: 'white',
      emissiveIntensity: 0.6,
    }),
    [],
  );

  const isSecurityHead = category === AgentCategory.Security;
  const headSize: [number, number, number] = isSecurityHead
    ? [0.6, 0.65, 0.6]
    : [0.55, 0.55, 0.55];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speedMultiplier;
    const dt = clock.getDelta();

    const root = rootRef.current;
    const head = headRef.current;
    const lArm = leftArmRef.current;
    const rArm = rightArmRef.current;
    const lLeg = leftLegRef.current;
    const rLeg = rightLegRef.current;

    if (!root || !head || !lArm || !rArm || !lLeg || !rLeg) return;

    // Update phase for entering/exiting transitions
    if (animationState === 'entering') {
      phaseRef.current = Math.min(phaseRef.current + dt * 1.2, 1);
    } else if (animationState === 'exiting') {
      phaseRef.current = Math.max(phaseRef.current - dt * 1.2, 0);
    } else {
      phaseRef.current = Math.min(phaseRef.current + dt * 2, 1);
    }

    const phase = phaseRef.current;

    // Reset rotations each frame
    head.rotation.set(0, 0, 0);
    lArm.rotation.set(0, 0, 0);
    rArm.rotation.set(0, 0, 0);
    lLeg.rotation.set(0, 0, 0);
    rLeg.rotation.set(0, 0, 0);

    let rootY = 0;

    switch (animationState) {
      case 'idle':
        rootY = Math.sin(t * 1.5) * 0.08;
        head.rotation.y = Math.sin(t * 0.5) * 0.25;
        lArm.rotation.x = Math.sin(t) * 0.08;
        rArm.rotation.x = -Math.sin(t) * 0.08;
        break;

      case 'working':
        rootY = Math.sin(t * 2) * 0.05;
        head.rotation.x = -0.25 + Math.sin(t * 4) * 0.1;
        lArm.rotation.x = Math.sin(t * 6) * 0.5;
        rArm.rotation.x = -Math.sin(t * 6) * 0.5;
        break;

      case 'walking_left':
      case 'walking_right':
        rootY = Math.sin(t * 4) * 0.12;
        head.rotation.y = animationState === 'walking_left' ? -0.4 : 0.4;
        lArm.rotation.x = Math.sin(t * 4) * 0.65;
        rArm.rotation.x = -Math.sin(t * 4) * 0.65;
        lLeg.rotation.x = -Math.sin(t * 4) * 0.6;
        rLeg.rotation.x = Math.sin(t * 4) * 0.6;
        break;

      case 'interacting':
        rootY = 0;
        head.rotation.y = Math.sin(t * 0.8) * 0.15;
        rArm.rotation.x = -0.8;
        break;

      case 'celebrating':
        rootY = Math.abs(Math.sin(t * 5)) * 0.8;
        head.rotation.x = -0.3;
        lArm.rotation.x = -1.2 + Math.sin(t * 6) * 0.3;
        rArm.rotation.x = -1.2 + Math.sin(t * 6) * 0.3;
        lLeg.rotation.z = -0.2;
        rLeg.rotation.z = 0.2;
        break;

      case 'error':
        rootY = 0;
        head.rotation.x = 0.2;
        head.rotation.y = Math.sin(t * 10) * 0.15;
        lArm.rotation.x = 0.3;
        rArm.rotation.x = 0.3;
        break;

      case 'entering':
        rootY = lerp(-2, 0, phase);
        head.rotation.x = lerp(-0.3, 0, phase);
        break;

      case 'exiting':
        rootY = lerp(0, -2, 1 - phase);
        head.rotation.x = lerp(0, 0.3, 1 - phase);
        // Fade emissive during exit
        emissiveIntensityRef.current = phase * 0.3;
        bodyMaterial.emissiveIntensity = emissiveIntensityRef.current;
        headMaterial.emissiveIntensity = emissiveIntensityRef.current;
        limbMaterial.emissiveIntensity = emissiveIntensityRef.current * 0.66;
        break;
    }

    // Restore emissive when not exiting
    if (animationState !== 'exiting') {
      bodyMaterial.emissiveIntensity = 0.3;
      headMaterial.emissiveIntensity = 0.3;
      limbMaterial.emissiveIntensity = 0.2;
    }

    root.position.y = rootY;
  });

  return (
    <group ref={rootRef}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]} material={bodyMaterial}>
        <boxGeometry args={[0.6, 0.8, 0.4]} />
      </mesh>

      {/* Head group (neck pivot) */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        <mesh material={headMaterial}>
          <boxGeometry args={headSize} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.1, 0, 0.28]} material={eyeMaterial}>
          <boxGeometry args={[0.08, 0.08, 0.05]} />
        </mesh>
        <mesh position={[0.1, 0, 0.28]} material={eyeMaterial}>
          <boxGeometry args={[0.08, 0.08, 0.05]} />
        </mesh>

        {/* Category head modifier */}
        <CategoryHeadModifier category={category} accent={colors.accent} />
      </group>

      {/* Left arm (left shoulder pivot) */}
      <group ref={leftArmRef} position={[-0.45, 0.7, 0]}>
        <mesh position={[0, -0.35, 0]} material={limbMaterial}>
          <boxGeometry args={[0.25, 0.65, 0.25]} />
        </mesh>
      </group>

      {/* Right arm (right shoulder pivot) */}
      <group ref={rightArmRef} position={[0.45, 0.7, 0]}>
        <mesh position={[0, -0.35, 0]} material={limbMaterial}>
          <boxGeometry args={[0.25, 0.65, 0.25]} />
        </mesh>
      </group>

      {/* Left leg (left hip pivot) */}
      <group ref={leftLegRef} position={[-0.15, 0, 0]}>
        <mesh position={[0, -0.35, 0]} material={limbMaterial}>
          <boxGeometry args={[0.25, 0.65, 0.25]} />
        </mesh>
      </group>

      {/* Right leg (right hip pivot) */}
      <group ref={rightLegRef} position={[0.15, 0, 0]}>
        <mesh position={[0, -0.35, 0]} material={limbMaterial}>
          <boxGeometry args={[0.25, 0.65, 0.25]} />
        </mesh>
      </group>

      {/* Point light */}
      <pointLight color={colors.primary} intensity={0.8} distance={5} />
    </group>
  );
}
