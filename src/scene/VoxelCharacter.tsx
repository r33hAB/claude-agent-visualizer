import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AgentCategory, type AnimationState } from '../types/agent';

interface VoxelCharacterProps {
  category: AgentCategory;
  animationState: AnimationState;
  speedMultiplier?: number;
}

const COLORS: Record<AgentCategory, { primary: string; accent: string; dark: string }> = {
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

function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.min(Math.max(t, 0), 1); }

/* ------------------------------------------------------------------ */
/*  Category head modifiers                                           */
/* ------------------------------------------------------------------ */
function HeadMod({ category, accent }: { category: AgentCategory; accent: string }) {
  const c = new THREE.Color(accent);
  const mat = <meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.6} />;

  switch (category) {
    case AgentCategory.Coder:
      return <mesh position={[0, 0.05, 0.45]}><boxGeometry args={[0.8, 0.2, 0.15]} />{mat}</mesh>;
    case AgentCategory.Reviewer:
      return (
        <group position={[0, 0.05, 0.45]}>
          <mesh position={[-0.18, 0, 0]}><torusGeometry args={[0.1, 0.02, 6, 12]} />{mat}</mesh>
          <mesh position={[0.18, 0, 0]}><torusGeometry args={[0.1, 0.02, 6, 12]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.6} /></mesh>
          <mesh><boxGeometry args={[0.08, 0.02, 0.02]} /><meshStandardMaterial color={accent} /></mesh>
        </group>
      );
    case AgentCategory.Planner:
      return (
        <group position={[0, 0.5, 0]}>
          <mesh><boxGeometry args={[0.04, 0.4, 0.04]} /><meshStandardMaterial color={accent} /></mesh>
          <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={2} /></mesh>
        </group>
      );
    case AgentCategory.Security:
      return (
        <group>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.9, 0.2, 0.85]} />{mat}</mesh>
          <mesh position={[0, 0, 0.42]}><boxGeometry args={[0.6, 0.08, 0.05]} /><meshStandardMaterial color="black" emissive={c} emissiveIntensity={0.8} /></mesh>
        </group>
      );
    case AgentCategory.Researcher:
      return (
        <group position={[0, 0.05, 0.38]}>
          <mesh position={[-0.16, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 0.12, 8]} />{mat}</mesh>
          <mesh position={[0.16, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 0.12, 8]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.6} /></mesh>
        </group>
      );
    case AgentCategory.Coordinator:
      return (
        <group position={[0, 0.4, 0]}>
          <mesh><boxGeometry args={[0.7, 0.08, 0.7]} />{mat}</mesh>
          {[-0.2, 0, 0.2].map((x, i) => (
            <mesh key={i} position={[x, 0.18, 0]}><boxGeometry args={[0.06, 0.28, 0.06]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.8} /></mesh>
          ))}
        </group>
      );
    case AgentCategory.Tester:
      return (
        <group>
          <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.35, 0.03, 8, 16, Math.PI]} />{mat}</mesh>
          <mesh position={[-0.35, 0.1, 0.2]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.8} /></mesh>
        </group>
      );
    case AgentCategory.DevOps:
      return (
        <group position={[0, 0.38, 0]}>
          <mesh><boxGeometry args={[0.75, 0.1, 0.75]} />{mat}</mesh>
          <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.55, 0.12, 0.55]} /><meshStandardMaterial color={accent} emissive={c} emissiveIntensity={0.3} /></mesh>
        </group>
      );
    case AgentCategory.Debugger:
      return (
        <group position={[0.18, 0.05, 0.4]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.14, 0.02, 8, 12]} />{mat}</mesh>
        </group>
      );
    case AgentCategory.Designer:
      return <mesh position={[-0.08, 0.35, 0.05]} rotation={[0.1, 0, 0.26]}><cylinderGeometry args={[0.35, 0.3, 0.12, 8]} />{mat}</mesh>;
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Category held props                                               */
/* ------------------------------------------------------------------ */
function Prop({ category, color, time }: { category: AgentCategory; color: string; time: number }) {
  const c = new THREE.Color(color);
  const bob = Math.sin(time * 2) * 0.1;
  switch (category) {
    case AgentCategory.Coder:
      return <group position={[1.2, 1.5, 0.5]}><mesh position={[0, bob, 0]}><planeGeometry args={[0.8, 0.5]} /><meshStandardMaterial color={color} emissive={c} emissiveIntensity={1} transparent opacity={0.7} side={THREE.DoubleSide} /></mesh></group>;
    case AgentCategory.Security:
      return <group position={[-1, 0.6, 0.3]}><mesh><boxGeometry args={[0.6, 0.7, 0.08]} /><meshStandardMaterial color={color} emissive={c} emissiveIntensity={0.4} metalness={0.8} /></mesh></group>;
    case AgentCategory.Coordinator:
      return <group position={[0, 2.8, 0]}><mesh position={[0, bob * 2, 0]}><sphereGeometry args={[0.2, 12, 12]} /><meshStandardMaterial color={color} emissive={c} emissiveIntensity={2} /></mesh><pointLight color={color} intensity={1} distance={4} position={[0, bob * 2, 0]} /></group>;
    case AgentCategory.Researcher:
      return <group position={[0.9, 1.2, 0.3]} rotation={[0, 0, -0.3]}><mesh><torusGeometry args={[0.2, 0.03, 8, 16]} /><meshStandardMaterial color={color} emissive={c} emissiveIntensity={0.5} /></mesh><mesh position={[0, -0.35, 0]}><boxGeometry args={[0.05, 0.3, 0.05]} /><meshStandardMaterial color="#8B4513" /></mesh></group>;
    case AgentCategory.Designer:
      return <group position={[-0.9, 0.8, 0.3]}><mesh><cylinderGeometry args={[0.3, 0.3, 0.04, 8]} /><meshStandardMaterial color="#ddd" /></mesh>{['#ef4444','#3b82f6','#10b981','#f59e0b','#d946ef'].map((cl,i)=><mesh key={i} position={[Math.cos(i*1.2)*0.15,0.03,Math.sin(i*1.2)*0.15]}><sphereGeometry args={[0.04,6,6]} /><meshStandardMaterial color={cl} /></mesh>)}</group>;
    case AgentCategory.DevOps:
      return <group position={[0.9, 0.9, 0.2]} rotation={[0, 0, -0.5]}><mesh><boxGeometry args={[0.06, 0.5, 0.04]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh><mesh position={[0, 0.3, 0]}><boxGeometry args={[0.2, 0.1, 0.04]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh></group>;
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main VoxelCharacter                                               */
/* ------------------------------------------------------------------ */
export default function VoxelCharacter({ category, animationState, speedMultiplier = 1 }: VoxelCharacterProps) {
  // Joint refs — FULL hierarchy with elbows, knees, wrists, ankles
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  // Left arm chain: shoulder → elbow → wrist
  const lShoulderRef = useRef<THREE.Group>(null);
  const lElbowRef = useRef<THREE.Group>(null);
  const lWristRef = useRef<THREE.Group>(null);
  // Right arm chain
  const rShoulderRef = useRef<THREE.Group>(null);
  const rElbowRef = useRef<THREE.Group>(null);
  const rWristRef = useRef<THREE.Group>(null);
  // Left leg chain: hip → knee → ankle
  const lHipRef = useRef<THREE.Group>(null);
  const lKneeRef = useRef<THREE.Group>(null);
  const lAnkleRef = useRef<THREE.Group>(null);
  // Right leg chain
  const rHipRef = useRef<THREE.Group>(null);
  const rKneeRef = useRef<THREE.Group>(null);
  const rAnkleRef = useRef<THREE.Group>(null);

  const phaseRef = useRef(animationState === 'entering' ? 0 : 1);
  const timeRef = useRef(0);

  const col = COLORS[category];
  const pCol = useMemo(() => new THREE.Color(col.primary), [col.primary]);
  const aCol = useMemo(() => new THREE.Color(col.accent), [col.accent]);
  const dCol = useMemo(() => new THREE.Color(col.dark), [col.dark]);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: pCol, emissive: pCol, emissiveIntensity: 0.4 }), [pCol]);
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color: aCol, emissive: aCol, emissiveIntensity: 0.4 }), [aCol]);
  const limbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: pCol, emissive: pCol, emissiveIntensity: 0.25 }), [pCol]);
  const jointMat = useMemo(() => new THREE.MeshStandardMaterial({ color: dCol, emissive: dCol, emissiveIntensity: 0.15 }), [dCol]);
  const handMat = useMemo(() => new THREE.MeshStandardMaterial({ color: aCol, emissive: aCol, emissiveIntensity: 0.3 }), [aCol]);
  const shoeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: dCol, emissive: dCol, emissiveIntensity: 0.15 }), [dCol]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime * speedMultiplier;
    const dt = Math.min(delta, 0.05);
    timeRef.current = clock.elapsedTime;

    // Gather all refs
    const root = rootRef.current;
    const body = bodyRef.current;
    const head = headRef.current;
    const lS = lShoulderRef.current; const lE = lElbowRef.current; const lW = lWristRef.current;
    const rS = rShoulderRef.current; const rE = rElbowRef.current; const rW = rWristRef.current;
    const lH = lHipRef.current; const lK = lKneeRef.current; const lA = lAnkleRef.current;
    const rH = rHipRef.current; const rK = rKneeRef.current; const rA = rAnkleRef.current;

    if (!root || !body || !head || !lS || !lE || !lW || !rS || !rE || !rW || !lH || !lK || !lA || !rH || !rK || !rA) return;

    // Phase
    if (animationState === 'entering') phaseRef.current = Math.min(phaseRef.current + dt * 1.2, 1);
    else if (animationState === 'exiting') phaseRef.current = Math.max(phaseRef.current - dt * 1.2, 0);
    else phaseRef.current = Math.min(phaseRef.current + dt * 2, 1);
    const phase = phaseRef.current;

    // Reset all joints
    [body, head, lS, lE, lW, rS, rE, rW, lH, lK, lA, rH, rK, rA].forEach(j => j.rotation.set(0, 0, 0));

    let rootY = 0;

    switch (animationState) {
      case 'idle': {
        rootY = Math.sin(t * 1.2) * 0.08;
        head.rotation.y = Math.sin(t * 0.4) * 0.3;
        head.rotation.x = Math.sin(t * 0.6) * 0.05;
        body.rotation.y = Math.sin(t * 0.3) * 0.04;
        // Arms: gentle swing at shoulder, slight elbow bend
        lS.rotation.x = Math.sin(t * 0.8) * 0.1;
        rS.rotation.x = -Math.sin(t * 0.8) * 0.1;
        lS.rotation.z = -0.08;
        rS.rotation.z = 0.08;
        lE.rotation.x = -0.15 + Math.sin(t * 0.7) * 0.05; // slight bend
        rE.rotation.x = -0.15 - Math.sin(t * 0.7) * 0.05;
        // Legs: weight shift
        lH.rotation.x = Math.sin(t * 0.5) * 0.03;
        rH.rotation.x = -Math.sin(t * 0.5) * 0.03;
        lK.rotation.x = 0.02;
        rK.rotation.x = 0.02;
        break;
      }

      case 'working': {
        rootY = Math.sin(t * 3) * 0.03;
        head.rotation.x = -0.3 + Math.sin(t * 2) * 0.08;
        body.rotation.x = -0.06;
        // Typing: shoulders forward, elbows bent, wrists flick
        lS.rotation.x = -0.6;
        rS.rotation.x = -0.6;
        lS.rotation.z = -0.25;
        rS.rotation.z = 0.25;
        lE.rotation.x = -1.2 + Math.sin(t * 10) * 0.15;
        rE.rotation.x = -1.2 + Math.sin(t * 10 + 1.5) * 0.15;
        lW.rotation.x = Math.sin(t * 12) * 0.2;
        rW.rotation.x = Math.sin(t * 12 + 0.8) * 0.2;
        break;
      }

      case 'walking_left':
      case 'walking_right': {
        const w = t * 5;
        rootY = Math.abs(Math.sin(w)) * 0.12;
        body.rotation.y = animationState === 'walking_left' ? -0.3 : 0.3;
        head.rotation.y = animationState === 'walking_left' ? -0.5 : 0.5;
        // Arm swing: shoulder drives, elbow follows with secondary motion
        lS.rotation.x = Math.sin(w) * 0.7;
        rS.rotation.x = -Math.sin(w) * 0.7;
        lE.rotation.x = -0.4 - Math.max(0, -Math.sin(w)) * 0.5; // bends more on back-swing
        rE.rotation.x = -0.4 - Math.max(0, Math.sin(w)) * 0.5;
        lS.rotation.z = -0.1;
        rS.rotation.z = 0.1;
        // Leg walk: hip drives, knee bends on lift, ankle compensates
        lH.rotation.x = -Math.sin(w) * 0.6;
        rH.rotation.x = Math.sin(w) * 0.6;
        lK.rotation.x = Math.max(0, Math.sin(w)) * 0.8; // bend knee when leg lifts
        rK.rotation.x = Math.max(0, -Math.sin(w)) * 0.8;
        lA.rotation.x = Math.sin(w) * 0.15; // ankle flex
        rA.rotation.x = -Math.sin(w) * 0.15;
        break;
      }

      case 'interacting': {
        head.rotation.y = Math.sin(t * 0.8) * 0.2;
        body.rotation.y = 0.15;
        // Right arm reaching out
        rS.rotation.x = -1.2 + Math.sin(t * 2) * 0.1;
        rS.rotation.z = 0.25;
        rE.rotation.x = -0.3;
        rW.rotation.x = -0.2 + Math.sin(t * 3) * 0.1;
        // Left arm at side
        lS.rotation.z = -0.08;
        lE.rotation.x = -0.2;
        break;
      }

      case 'celebrating': {
        rootY = Math.abs(Math.sin(t * 4)) * 0.8;
        head.rotation.x = -0.4;
        head.rotation.z = Math.sin(t * 6) * 0.1;
        body.rotation.z = Math.sin(t * 4) * 0.05;
        // Arms up and waving
        lS.rotation.x = -2.5 + Math.sin(t * 5) * 0.3;
        rS.rotation.x = -2.5 + Math.sin(t * 5 + 1) * 0.3;
        lS.rotation.z = -0.4;
        rS.rotation.z = 0.4;
        lE.rotation.x = -0.5 + Math.sin(t * 7) * 0.3;
        rE.rotation.x = -0.5 + Math.sin(t * 7 + 0.5) * 0.3;
        lW.rotation.z = Math.sin(t * 8) * 0.4;
        rW.rotation.z = -Math.sin(t * 8) * 0.4;
        // Legs spread
        lH.rotation.z = -0.15;
        rH.rotation.z = 0.15;
        lK.rotation.x = 0.1;
        rK.rotation.x = 0.1;
        break;
      }

      case 'error': {
        head.rotation.x = 0.2;
        head.rotation.y = Math.sin(t * 12) * 0.2;
        body.rotation.x = 0.12;
        // Droopy arms
        lS.rotation.x = 0.3;
        rS.rotation.x = 0.3;
        lS.rotation.z = -0.25;
        rS.rotation.z = 0.25;
        lE.rotation.x = -0.6;
        rE.rotation.x = -0.6;
        lW.rotation.x = -0.3;
        rW.rotation.x = -0.3;
        // Shaking
        rootY = Math.sin(t * 15) * 0.03;
        bodyMat.emissiveIntensity = 0.2 + Math.abs(Math.sin(t * 8)) * 0.6;
        break;
      }

      case 'entering': {
        rootY = lerp(-3, 0, phase);
        head.rotation.x = lerp(-0.4, 0, phase);
        lS.rotation.z = lerp(-0.5, 0, phase);
        rS.rotation.z = lerp(0.5, 0, phase);
        break;
      }

      case 'exiting': {
        rootY = lerp(0, -3, 1 - phase);
        head.rotation.x = lerp(0, 0.4, 1 - phase);
        bodyMat.emissiveIntensity = phase * 0.4;
        headMat.emissiveIntensity = phase * 0.4;
        limbMat.emissiveIntensity = phase * 0.25;
        break;
      }
    }

    if (animationState !== 'exiting' && animationState !== 'error') {
      bodyMat.emissiveIntensity = 0.4;
      headMat.emissiveIntensity = 0.4;
      limbMat.emissiveIntensity = 0.25;
    }

    root.position.y = rootY;
  });

  /*
   * SKELETON LAYOUT — proper joint hierarchy:
   *
   * root (Y position animation)
   *   body (torso pivot — lean/twist)
   *     torso mesh
   *     head (neck joint — nod/turn)
   *       head mesh + eyes + head mod
   *     L shoulder (joint)
   *       upper arm mesh
   *       L elbow (joint)
   *         forearm mesh
   *         L wrist (joint)
   *           hand mesh
   *     R shoulder → R elbow → R wrist (same)
   *     L hip (joint)
   *       thigh mesh
   *       L knee (joint)
   *         shin mesh
   *         L ankle (joint)
   *           foot mesh
   *     R hip → R knee → R ankle (same)
   */
  return (
    <group scale={3}>
      <group ref={rootRef}>
        {/* === BODY (torso pivot) === */}
        <group ref={bodyRef} position={[0, 0.65, 0]}>
          {/* Torso */}
          <mesh material={bodyMat}><boxGeometry args={[0.65, 0.85, 0.4]} /></mesh>
          <mesh position={[0, -0.3, 0.01]}><boxGeometry args={[0.67, 0.08, 0.42]} /><meshStandardMaterial color={col.dark} emissive={dCol} emissiveIntensity={0.2} /></mesh>

          {/* === HEAD (neck joint) === */}
          <group ref={headRef} position={[0, 0.7, 0]}>
            {/* Neck */}
            <mesh position={[0, -0.12, 0]} material={jointMat}><boxGeometry args={[0.2, 0.12, 0.2]} /></mesh>
            {/* Head */}
            <mesh position={[0, 0.18, 0]} material={headMat}><boxGeometry args={[0.6, 0.6, 0.6]} /></mesh>
            {/* Eyes */}
            <mesh position={[-0.14, 0.22, 0.31]}><boxGeometry args={[0.12, 0.1, 0.02]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.8} /></mesh>
            <mesh position={[0.14, 0.22, 0.31]}><boxGeometry args={[0.12, 0.1, 0.02]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.8} /></mesh>
            <mesh position={[-0.14, 0.21, 0.33]}><boxGeometry args={[0.06, 0.06, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
            <mesh position={[0.14, 0.21, 0.33]}><boxGeometry args={[0.06, 0.06, 0.02]} /><meshStandardMaterial color="#111" /></mesh>
            {/* Mouth */}
            <mesh position={[0, 0.05, 0.31]}><boxGeometry args={[0.2, 0.04, 0.02]} /><meshStandardMaterial color={col.dark} /></mesh>
            <HeadMod category={category} accent={col.accent} />
          </group>

          {/* === LEFT ARM: shoulder → elbow → wrist === */}
          <group ref={lShoulderRef} position={[-0.48, 0.3, 0]}>
            {/* Shoulder joint ball */}
            <mesh material={jointMat}><sphereGeometry args={[0.1, 8, 8]} /></mesh>
            {/* Upper arm */}
            <mesh position={[0, -0.22, 0]} material={limbMat}><boxGeometry args={[0.22, 0.32, 0.22]} /></mesh>
            {/* Elbow joint */}
            <group ref={lElbowRef} position={[0, -0.4, 0]}>
              <mesh material={jointMat}><sphereGeometry args={[0.08, 8, 8]} /></mesh>
              {/* Forearm */}
              <mesh position={[0, -0.2, 0]} material={limbMat}><boxGeometry args={[0.2, 0.28, 0.2]} /></mesh>
              {/* Wrist joint */}
              <group ref={lWristRef} position={[0, -0.38, 0]}>
                <mesh material={jointMat}><sphereGeometry args={[0.06, 6, 6]} /></mesh>
                {/* Hand */}
                <mesh position={[0, -0.08, 0]} material={handMat}><boxGeometry args={[0.18, 0.12, 0.18]} /></mesh>
              </group>
            </group>
          </group>

          {/* === RIGHT ARM: shoulder → elbow → wrist === */}
          <group ref={rShoulderRef} position={[0.48, 0.3, 0]}>
            <mesh material={jointMat}><sphereGeometry args={[0.1, 8, 8]} /></mesh>
            <mesh position={[0, -0.22, 0]} material={limbMat}><boxGeometry args={[0.22, 0.32, 0.22]} /></mesh>
            <group ref={rElbowRef} position={[0, -0.4, 0]}>
              <mesh material={jointMat}><sphereGeometry args={[0.08, 8, 8]} /></mesh>
              <mesh position={[0, -0.2, 0]} material={limbMat}><boxGeometry args={[0.2, 0.28, 0.2]} /></mesh>
              <group ref={rWristRef} position={[0, -0.38, 0]}>
                <mesh material={jointMat}><sphereGeometry args={[0.06, 6, 6]} /></mesh>
                <mesh position={[0, -0.08, 0]} material={handMat}><boxGeometry args={[0.18, 0.12, 0.18]} /></mesh>
              </group>
            </group>
          </group>

          {/* === LEFT LEG: hip → knee → ankle === */}
          <group ref={lHipRef} position={[-0.18, -0.45, 0]}>
            <mesh material={jointMat}><sphereGeometry args={[0.1, 8, 8]} /></mesh>
            {/* Thigh */}
            <mesh position={[0, -0.22, 0]} material={limbMat}><boxGeometry args={[0.24, 0.32, 0.24]} /></mesh>
            {/* Knee joint */}
            <group ref={lKneeRef} position={[0, -0.4, 0]}>
              <mesh material={jointMat}><sphereGeometry args={[0.09, 8, 8]} /></mesh>
              {/* Shin */}
              <mesh position={[0, -0.2, 0]} material={limbMat}><boxGeometry args={[0.22, 0.28, 0.22]} /></mesh>
              {/* Ankle joint */}
              <group ref={lAnkleRef} position={[0, -0.38, 0]}>
                <mesh material={jointMat}><sphereGeometry args={[0.06, 6, 6]} /></mesh>
                {/* Foot */}
                <mesh position={[0, -0.05, 0.06]} material={shoeMat}><boxGeometry args={[0.24, 0.1, 0.34]} /></mesh>
              </group>
            </group>
          </group>

          {/* === RIGHT LEG: hip → knee → ankle === */}
          <group ref={rHipRef} position={[0.18, -0.45, 0]}>
            <mesh material={jointMat}><sphereGeometry args={[0.1, 8, 8]} /></mesh>
            <mesh position={[0, -0.22, 0]} material={limbMat}><boxGeometry args={[0.24, 0.32, 0.24]} /></mesh>
            <group ref={rKneeRef} position={[0, -0.4, 0]}>
              <mesh material={jointMat}><sphereGeometry args={[0.09, 8, 8]} /></mesh>
              <mesh position={[0, -0.2, 0]} material={limbMat}><boxGeometry args={[0.22, 0.28, 0.22]} /></mesh>
              <group ref={rAnkleRef} position={[0, -0.38, 0]}>
                <mesh material={jointMat}><sphereGeometry args={[0.06, 6, 6]} /></mesh>
                <mesh position={[0, -0.05, 0.06]} material={shoeMat}><boxGeometry args={[0.24, 0.1, 0.34]} /></mesh>
              </group>
            </group>
          </group>
        </group>

        {/* Category prop */}
        <Prop category={category} color={col.accent} time={timeRef.current} />
        {/* Character glow */}
        <pointLight color={col.primary} intensity={1.5} distance={8} position={[0, 1.2, 0]} />
      </group>
    </group>
  );
}
