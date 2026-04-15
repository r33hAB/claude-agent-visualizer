import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AgentCategory, type AnimationState } from '../types/agent';

interface VoxelCharacterProps {
  category: AgentCategory;
  animationState: AnimationState;
  speedMultiplier?: number;
}

const CATEGORY_COLORS: Record<AgentCategory, { primary: string; accent: string; dark: string }> = {
  [AgentCategory.Coder]:       { primary: '#3b82f6', accent: '#60a5fa', dark: '#1e3a5f' },
  [AgentCategory.Reviewer]:    { primary: '#f59e0b', accent: '#fbbf24', dark: '#78500a' },
  [AgentCategory.Planner]:     { primary: '#8b5cf6', accent: '#a78bfa', dark: '#4c2d82' },
  [AgentCategory.Security]:    { primary: '#ef4444', accent: '#f87171', dark: '#7f1d1d' },
  [AgentCategory.Researcher]:  { primary: '#10b981', accent: '#34d399', dark: '#064e3b' },
  [AgentCategory.Coordinator]: { primary: '#ec4899', accent: '#f472b6', dark: '#831843' },
  [AgentCategory.Tester]:      { primary: '#14b8a6', accent: '#2dd4bf', dark: '#134e4a' },
  [AgentCategory.DevOps]:      { primary: '#f97316', accent: '#fb923c', dark: '#7c2d12' },
  [AgentCategory.Debugger]:    { primary: '#6366f1', accent: '#818cf8', dark: '#312e81' },
  [AgentCategory.Designer]:    { primary: '#d946ef', accent: '#e879f9', dark: '#701a75' },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

// Held props for each category — floating beside or in hand
function CategoryProp({ category, color, time }: { category: AgentCategory; color: string; time: number }) {
  const emissive = new THREE.Color(color);
  const bob = Math.sin(time * 2) * 0.1;

  switch (category) {
    case AgentCategory.Coder:
      // Floating holographic code panel
      return (
        <group position={[1.2, 1.5, 0.5]}>
          <mesh position={[0, bob, 0]}>
            <planeGeometry args={[0.8, 0.5]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1} transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    case AgentCategory.Reviewer:
      // Clipboard in hand
      return (
        <group position={[0.8, 0.8, 0.4]}>
          <mesh><boxGeometry args={[0.4, 0.5, 0.05]} /><meshStandardMaterial color="#f5f5dc" /></mesh>
          <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.25, 0.06, 0.08]} /><meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} /></mesh>
        </group>
      );
    case AgentCategory.Security:
      // Shield
      return (
        <group position={[-1, 0.6, 0.3]}>
          <mesh>
            <boxGeometry args={[0.6, 0.7, 0.08]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.15, 0.2, 0.03]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.3} />
          </mesh>
        </group>
      );
    case AgentCategory.Coordinator:
      // Floating command orb
      return (
        <group position={[0, 2.8, 0]}>
          <mesh position={[0, bob * 2, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={2} />
          </mesh>
          <pointLight color={color} intensity={1} distance={4} position={[0, bob * 2, 0]} />
        </group>
      );
    case AgentCategory.Researcher:
      // Magnifying glass
      return (
        <group position={[0.9, 1.2, 0.3]} rotation={[0, 0, -0.3]}>
          <mesh><torusGeometry args={[0.2, 0.03, 8, 16]} /><meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} /></mesh>
          <mesh position={[0, -0.35, 0]}><boxGeometry args={[0.05, 0.3, 0.05]} /><meshStandardMaterial color="#8B4513" /></mesh>
        </group>
      );
    case AgentCategory.Debugger:
      // Bug tool / probe
      return (
        <group position={[0.9, 0.9, 0.3]}>
          <mesh><cylinderGeometry args={[0.02, 0.02, 0.6, 6]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
          <mesh position={[0, 0.35, 0]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1} /></mesh>
        </group>
      );
    case AgentCategory.Designer:
      // Paint palette
      return (
        <group position={[-0.9, 0.8, 0.3]}>
          <mesh><cylinderGeometry args={[0.3, 0.3, 0.04, 8]} /><meshStandardMaterial color="#ddd" /></mesh>
          {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#d946ef'].map((c, i) => (
            <mesh key={i} position={[Math.cos(i * 1.2) * 0.15, 0.03, Math.sin(i * 1.2) * 0.15]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color={c} />
            </mesh>
          ))}
        </group>
      );
    case AgentCategory.DevOps:
      // Wrench
      return (
        <group position={[0.9, 0.9, 0.2]} rotation={[0, 0, -0.5]}>
          <mesh><boxGeometry args={[0.06, 0.5, 0.04]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
          <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.2, 0.1, 0.04]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
        </group>
      );
    case AgentCategory.Tester:
      // Test tube
      return (
        <group position={[0.8, 1.0, 0.3]}>
          <mesh><cylinderGeometry args={[0.06, 0.06, 0.4, 8]} /><meshStandardMaterial color="white" transparent opacity={0.4} /></mesh>
          <mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.055, 0.055, 0.15, 8]} /><meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} transparent opacity={0.8} /></mesh>
        </group>
      );
    case AgentCategory.Planner:
      // Holographic task card
      return (
        <group position={[1.0, 1.5, 0]}>
          <mesh position={[0, bob, 0]}>
            <boxGeometry args={[0.6, 0.4, 0.02]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.8} transparent opacity={0.6} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

function CategoryHeadModifier({ category, accent }: { category: AgentCategory; accent: string }) {
  const c = new THREE.Color(accent);

  switch (category) {
    case AgentCategory.Coder:
      // VR visor across eyes
      return (
        <mesh position={[0, 0.05, 0.45]}>
          <boxGeometry args={[0.8, 0.2, 0.15]} />
          <meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.8} />
        </mesh>
      );
    case AgentCategory.Reviewer:
      // Reading glasses
      return (
        <group position={[0, 0.05, 0.45]}>
          <mesh position={[-0.18, 0, 0]}><torusGeometry args={[0.1, 0.02, 6, 12]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.5} /></mesh>
          <mesh position={[0.18, 0, 0]}><torusGeometry args={[0.1, 0.02, 6, 12]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.5} /></mesh>
          <mesh position={[0, 0, 0]}><boxGeometry args={[0.08, 0.02, 0.02]} /><meshStandardMaterial color={accent} /></mesh>
        </group>
      );
    case AgentCategory.Planner:
      // Tall antenna with glowing tip
      return (
        <group position={[0, 0.5, 0]}>
          <mesh><boxGeometry args={[0.04, 0.4, 0.04]} /><meshStandardMaterial color={accent} /></mesh>
          <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={2} /></mesh>
        </group>
      );
    case AgentCategory.Security:
      // Full helmet with visor slit
      return (
        <group>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.9, 0.2, 0.85]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.3} /></mesh>
          <mesh position={[0, 0, 0.42]}><boxGeometry args={[0.6, 0.08, 0.05]} /><meshStandardMaterial color="black" emissive={c} emissiveIntensity={0.8} /></mesh>
        </group>
      );
    case AgentCategory.Researcher:
      // Large goggles
      return (
        <group position={[0, 0.05, 0.38]}>
          <mesh position={[-0.16, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 0.12, 8]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.4} /></mesh>
          <mesh position={[0.16, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 0.12, 8]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.4} /></mesh>
          <mesh><boxGeometry args={[0.06, 0.06, 0.06]} /><meshStandardMaterial color={accent} /></mesh>
        </group>
      );
    case AgentCategory.Coordinator:
      // Crown with 3 tall prongs
      return (
        <group position={[0, 0.4, 0]}>
          <mesh><boxGeometry args={[0.7, 0.08, 0.7]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.6} /></mesh>
          {[-0.2, 0, 0.2].map((x, i) => (
            <mesh key={i} position={[x, 0.18, 0]}><boxGeometry args={[0.06, 0.28, 0.06]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.8} /></mesh>
          ))}
        </group>
      );
    case AgentCategory.Tester:
      // Headset with mic
      return (
        <group>
          <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.35, 0.03, 8, 16, Math.PI]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.4} /></mesh>
          <mesh position={[-0.35, 0.1, 0.2]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.8} /></mesh>
          <mesh position={[-0.35, 0.1, 0.1]}><boxGeometry args={[0.03, 0.03, 0.15]} /><meshStandardMaterial color={accent} /></mesh>
        </group>
      );
    case AgentCategory.DevOps:
      // Hard hat
      return (
        <group position={[0, 0.38, 0]}>
          <mesh><boxGeometry args={[0.75, 0.1, 0.75]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.3} /></mesh>
          <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.55, 0.12, 0.55]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.3} /></mesh>
        </group>
      );
    case AgentCategory.Debugger:
      // Large monocle on right eye
      return (
        <group position={[0.18, 0.05, 0.4]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.14, 0.02, 8, 12]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.6} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 0.02, 8]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.3} transparent opacity={0.3} /></mesh>
        </group>
      );
    case AgentCategory.Designer:
      // Beret
      return (
        <mesh position={[-0.08, 0.35, 0.05]} rotation={[0.1, 0, THREE.MathUtils.degToRad(15)]}>
          <cylinderGeometry args={[0.35, 0.3, 0.12, 8]} />
          <meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.3} />
        </mesh>
      );
    default:
      return null;
  }
}

export default function VoxelCharacter({ category, animationState, speedMultiplier = 1 }: VoxelCharacterProps) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(animationState === 'entering' ? 0 : 1);
  const timeRef = useRef(0);

  const colors = CATEGORY_COLORS[category];
  const primaryColor = useMemo(() => new THREE.Color(colors.primary), [colors.primary]);
  const accentColor = useMemo(() => new THREE.Color(colors.accent), [colors.accent]);
  const darkColor = useMemo(() => new THREE.Color(colors.dark), [colors.dark]);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: primaryColor, emissive: primaryColor, emissiveIntensity: 0.4 }), [primaryColor]);
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.4 }), [accentColor]);
  const limbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: primaryColor, emissive: primaryColor, emissiveIntensity: 0.25 }), [primaryColor]);
  const shoeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: darkColor, emissive: darkColor, emissiveIntensity: 0.15 }), [darkColor]);
  const handMat = useMemo(() => new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.3 }), [accentColor]);
  const eyeWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white', emissive: 'white', emissiveIntensity: 0.8 }), []);
  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111', emissive: primaryColor, emissiveIntensity: 0.2 }), [primaryColor]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speedMultiplier;
    const dt = Math.min(clock.getDelta(), 0.05);
    timeRef.current = clock.elapsedTime;

    const root = rootRef.current;
    const head = headRef.current;
    const body = bodyRef.current;
    const lArm = leftArmRef.current;
    const rArm = rightArmRef.current;
    const lLeg = leftLegRef.current;
    const rLeg = rightLegRef.current;

    if (!root || !head || !body || !lArm || !rArm || !lLeg || !rLeg) return;

    // Phase for enter/exit
    if (animationState === 'entering') {
      phaseRef.current = Math.min(phaseRef.current + dt * 1.2, 1);
    } else if (animationState === 'exiting') {
      phaseRef.current = Math.max(phaseRef.current - dt * 1.2, 0);
    } else {
      phaseRef.current = Math.min(phaseRef.current + dt * 2, 1);
    }
    const phase = phaseRef.current;

    // Reset
    head.rotation.set(0, 0, 0);
    body.rotation.set(0, 0, 0);
    lArm.rotation.set(0, 0, 0);
    rArm.rotation.set(0, 0, 0);
    lLeg.rotation.set(0, 0, 0);
    rLeg.rotation.set(0, 0, 0);

    let rootY = 0;

    switch (animationState) {
      case 'idle':
        rootY = Math.sin(t * 1.2) * 0.1;
        head.rotation.y = Math.sin(t * 0.4) * 0.3;
        head.rotation.x = Math.sin(t * 0.6) * 0.05;
        body.rotation.y = Math.sin(t * 0.3) * 0.05;
        lArm.rotation.x = Math.sin(t * 0.8) * 0.12;
        rArm.rotation.x = -Math.sin(t * 0.8) * 0.12;
        lArm.rotation.z = -0.1;
        rArm.rotation.z = 0.1;
        // Slight weight shift
        lLeg.rotation.x = Math.sin(t * 0.5) * 0.03;
        rLeg.rotation.x = -Math.sin(t * 0.5) * 0.03;
        break;

      case 'working':
        rootY = Math.sin(t * 3) * 0.04;
        head.rotation.x = -0.3 + Math.sin(t * 2) * 0.08;
        body.rotation.x = -0.08;
        lArm.rotation.x = Math.sin(t * 8) * 0.6;
        rArm.rotation.x = -Math.sin(t * 8 + 0.5) * 0.6;
        lArm.rotation.z = -0.3;
        rArm.rotation.z = 0.3;
        break;

      case 'walking_left':
      case 'walking_right': {
        const walkT = t * 5;
        rootY = Math.abs(Math.sin(walkT)) * 0.15;
        body.rotation.y = animationState === 'walking_left' ? -0.3 : 0.3;
        head.rotation.y = animationState === 'walking_left' ? -0.5 : 0.5;
        lArm.rotation.x = Math.sin(walkT) * 0.8;
        rArm.rotation.x = -Math.sin(walkT) * 0.8;
        lLeg.rotation.x = -Math.sin(walkT) * 0.7;
        rLeg.rotation.x = Math.sin(walkT) * 0.7;
        // Arm swing
        lArm.rotation.z = -0.15;
        rArm.rotation.z = 0.15;
        break;
      }

      case 'interacting':
        head.rotation.y = Math.sin(t * 0.8) * 0.2;
        rArm.rotation.x = -1.0 + Math.sin(t * 2) * 0.15;
        rArm.rotation.z = 0.3;
        lArm.rotation.z = -0.1;
        body.rotation.y = 0.2;
        break;

      case 'celebrating':
        rootY = Math.abs(Math.sin(t * 4)) * 1.0;
        head.rotation.x = -0.4;
        head.rotation.z = Math.sin(t * 6) * 0.1;
        lArm.rotation.x = -2.2 + Math.sin(t * 5) * 0.3;
        rArm.rotation.x = -2.2 + Math.sin(t * 5 + 1) * 0.3;
        lArm.rotation.z = -0.4;
        rArm.rotation.z = 0.4;
        lLeg.rotation.z = -0.2;
        rLeg.rotation.z = 0.2;
        body.rotation.z = Math.sin(t * 4) * 0.05;
        break;

      case 'error':
        head.rotation.x = 0.25;
        head.rotation.y = Math.sin(t * 12) * 0.2;
        body.rotation.x = 0.15;
        lArm.rotation.x = 0.4;
        rArm.rotation.x = 0.4;
        lArm.rotation.z = -0.3;
        rArm.rotation.z = 0.3;
        // Shaking
        rootY = Math.sin(t * 15) * 0.03;
        // Error flicker
        bodyMat.emissiveIntensity = 0.2 + Math.abs(Math.sin(t * 8)) * 0.6;
        break;

      case 'entering':
        rootY = lerp(-3, 0, phase);
        head.rotation.x = lerp(-0.4, 0, phase);
        break;

      case 'exiting':
        rootY = lerp(0, -3, 1 - phase);
        head.rotation.x = lerp(0, 0.4, 1 - phase);
        bodyMat.emissiveIntensity = phase * 0.4;
        headMat.emissiveIntensity = phase * 0.4;
        limbMat.emissiveIntensity = phase * 0.25;
        break;
    }

    if (animationState !== 'exiting' && animationState !== 'error') {
      bodyMat.emissiveIntensity = 0.4;
      headMat.emissiveIntensity = 0.4;
      limbMat.emissiveIntensity = 0.25;
    }

    root.position.y = rootY;
  });

  // Scale everything 2x for visibility
  return (
    <group scale={2}>
      <group ref={rootRef}>
        {/* Body */}
        <group ref={bodyRef} position={[0, 0.65, 0]}>
          <mesh material={bodyMat}><boxGeometry args={[0.65, 0.85, 0.4]} /></mesh>
          {/* Belt/detail stripe */}
          <mesh position={[0, -0.3, 0.01]}>
            <boxGeometry args={[0.67, 0.08, 0.42]} />
            <meshStandardMaterial color={colors.dark} emissive={new THREE.Color(colors.dark)} emissiveIntensity={0.2} />
          </mesh>
        </group>

        {/* Head (neck pivot) */}
        <group ref={headRef} position={[0, 1.35, 0]}>
          <mesh material={headMat}><boxGeometry args={[0.6, 0.6, 0.6]} /></mesh>
          {/* Eyes */}
          <mesh position={[-0.14, 0.05, 0.31]} material={eyeWhiteMat}><boxGeometry args={[0.12, 0.1, 0.02]} /></mesh>
          <mesh position={[0.14, 0.05, 0.31]} material={eyeWhiteMat}><boxGeometry args={[0.12, 0.1, 0.02]} /></mesh>
          {/* Pupils */}
          <mesh position={[-0.14, 0.04, 0.33]} material={pupilMat}><boxGeometry args={[0.06, 0.06, 0.02]} /></mesh>
          <mesh position={[0.14, 0.04, 0.33]} material={pupilMat}><boxGeometry args={[0.06, 0.06, 0.02]} /></mesh>
          {/* Mouth */}
          <mesh position={[0, -0.12, 0.31]}>
            <boxGeometry args={[0.2, 0.04, 0.02]} />
            <meshStandardMaterial color={colors.dark} />
          </mesh>
          <CategoryHeadModifier category={category} accent={colors.accent} />
        </group>

        {/* Left arm (shoulder pivot) */}
        <group ref={leftArmRef} position={[-0.52, 0.95, 0]}>
          {/* Upper arm */}
          <mesh position={[0, -0.3, 0]} material={limbMat}><boxGeometry args={[0.22, 0.4, 0.22]} /></mesh>
          {/* Lower arm */}
          <mesh position={[0, -0.6, 0]} material={limbMat}><boxGeometry args={[0.2, 0.35, 0.2]} /></mesh>
          {/* Hand */}
          <mesh position={[0, -0.82, 0]} material={handMat}><boxGeometry args={[0.18, 0.14, 0.18]} /></mesh>
        </group>

        {/* Right arm (shoulder pivot) */}
        <group ref={rightArmRef} position={[0.52, 0.95, 0]}>
          <mesh position={[0, -0.3, 0]} material={limbMat}><boxGeometry args={[0.22, 0.4, 0.22]} /></mesh>
          <mesh position={[0, -0.6, 0]} material={limbMat}><boxGeometry args={[0.2, 0.35, 0.2]} /></mesh>
          <mesh position={[0, -0.82, 0]} material={handMat}><boxGeometry args={[0.18, 0.14, 0.18]} /></mesh>
        </group>

        {/* Left leg (hip pivot) */}
        <group ref={leftLegRef} position={[-0.18, 0.2, 0]}>
          {/* Upper leg */}
          <mesh position={[0, -0.25, 0]} material={limbMat}><boxGeometry args={[0.24, 0.4, 0.24]} /></mesh>
          {/* Lower leg */}
          <mesh position={[0, -0.55, 0]} material={limbMat}><boxGeometry args={[0.22, 0.3, 0.22]} /></mesh>
          {/* Foot/shoe */}
          <mesh position={[0, -0.73, 0.05]} material={shoeMat}><boxGeometry args={[0.24, 0.12, 0.32]} /></mesh>
        </group>

        {/* Right leg (hip pivot) */}
        <group ref={rightLegRef} position={[0.18, 0.2, 0]}>
          <mesh position={[0, -0.25, 0]} material={limbMat}><boxGeometry args={[0.24, 0.4, 0.24]} /></mesh>
          <mesh position={[0, -0.55, 0]} material={limbMat}><boxGeometry args={[0.22, 0.3, 0.22]} /></mesh>
          <mesh position={[0, -0.73, 0.05]} material={shoeMat}><boxGeometry args={[0.24, 0.12, 0.32]} /></mesh>
        </group>

        {/* Category prop */}
        <CategoryProp category={category} color={colors.accent} time={timeRef.current} />

        {/* Point light for character glow */}
        <pointLight color={colors.primary} intensity={1.5} distance={8} position={[0, 1.2, 0]} />
      </group>
    </group>
  );
}
