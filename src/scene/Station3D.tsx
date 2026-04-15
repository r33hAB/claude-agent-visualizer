import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AgentCategory, type AnimationState } from '../types/agent';
import { AGENT_PALETTES, type AgentPalette } from './agentVisuals';

interface Station3DProps {
  category: AgentCategory;
  progress: number;
  animationState: AnimationState;
}

const DESK_COLOR = '#1a1f2e';
const EQUIP_COLOR = '#2a2f3e';

function normalizeProgress(progress: number) {
  return THREE.MathUtils.clamp(progress / 100, 0, 1);
}

// ---------- Shared: Desk Material ----------

function DeskMat() {
  return <meshStandardMaterial color={DESK_COLOR} roughness={0.6} metalness={0.4} />;
}

function EquipMat() {
  return <meshStandardMaterial color={EQUIP_COLOR} roughness={0.5} metalness={0.4} />;
}

// ---------- Base Platform ----------

function BasePlatform({ colors, progress }: { colors: AgentPalette; progress: number }) {
  const accent = new THREE.Color(colors.glow);
  const surface = new THREE.Color(colors.accent);
  const rim = new THREE.Color(colors.surface);

  // Progress-based status light color
  let statusColor: string;
  if (progress < 30) statusColor = '#ef4444';
  else if (progress < 70) statusColor = '#eab308';
  else statusColor = '#22c55e';
  const statusC = new THREE.Color(statusColor);

  const edges: [number, number, number, number, number, number][] = [
    [0, 0.115, 1.52, 3.02, 0.024, 0.035],
    [0, 0.115, -1.52, 3.02, 0.024, 0.035],
    [1.52, 0.115, 0, 0.035, 0.024, 3.02],
    [-1.52, 0.115, 0, 0.035, 0.024, 3.02],
  ];
  const corners: [number, number, number][] = [
    [1.42, 0, 1.42], [-1.42, 0, 1.42],
    [1.42, 0, -1.42], [-1.42, 0, -1.42],
  ];

  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[3.55, 0.06, 3.55]} />
        <meshStandardMaterial color="#050913" roughness={0.88} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.095, 0]}>
        <boxGeometry args={[3.2, 0.08, 3.2]} />
        <meshStandardMaterial color="#0d1528" roughness={0.48} metalness={0.52} />
      </mesh>
      <mesh position={[0, 0.145, 0]}>
        <boxGeometry args={[2.62, 0.022, 2.62]} />
        <meshStandardMaterial color="#111c33" roughness={0.24} metalness={0.62} />
      </mesh>
      <mesh position={[0, 0.148, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.04, 1.18, 40]} />
        <meshStandardMaterial
          color={surface}
          emissive={accent}
          emissiveIntensity={0.24}
          transparent
          opacity={0.86}
        />
      </mesh>
      {edges.map(([px, py, pz, sx, sy, sz], i) => (
        <mesh key={`edge-${i}`} position={[px, py, pz]}>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color={surface} emissive={accent} emissiveIntensity={0.65} />
        </mesh>
      ))}
      {corners.map(([cx, , cz], i) => (
        <group key={`pylon-${i}`} position={[cx, 0.145, cz]}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.06, 0.24, 0.06]} />
            <meshStandardMaterial color="#182235" roughness={0.35} metalness={0.52} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshStandardMaterial color={rim} emissive={accent} emissiveIntensity={0.95} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.165, 1.55]}>
        <boxGeometry args={[0.42, 0.03, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.166, 1.58]}>
        <boxGeometry args={[0.28, 0.015, 0.02]} />
        <meshStandardMaterial color={statusC} emissive={statusC} emissiveIntensity={0.95} />
      </mesh>
    </group>
  );
}

interface StationMotion {
  active: boolean;
  working: boolean;
  interacting: boolean;
  celebrating: boolean;
  error: boolean;
  activity: number;
  pulse: number;
  sweep: number;
  hover: number;
  press: number;
  spin: number;
}

function getStationMotion(animationState: AnimationState, time: number): StationMotion {
  const working = animationState === 'working';
  const interacting = animationState === 'interacting';
  const celebrating = animationState === 'celebrating';
  const error = animationState === 'error';
  const active = working || interacting || celebrating || error;
  const activity = error ? 1 : celebrating ? 0.95 : working ? 1 : interacting ? 0.75 : 0.28;
  const pulseSpeed = error ? 10 : working ? 8.5 : interacting ? 5.5 : 2.5;

  return {
    active,
    working,
    interacting,
    celebrating,
    error,
    activity,
    pulse: Math.sin(time * pulseSpeed) * 0.5 + 0.5,
    sweep: Math.sin(time * (active ? 2.1 : 0.9)),
    hover: Math.sin(time * (active ? 3.4 : 1.4)),
    press: Math.max(0, Math.sin(time * (working ? 12 : interacting ? 8 : 3))),
    spin: time * (working ? 2.2 : interacting ? 1.5 : 0.45),
  };
}

// ---------- Monitor with flicker ----------

function Monitor({
  position,
  rotation,
  size,
  color,
  activity = 0.4,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number];
  color: THREE.Color;
  activity?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    const t = clock.elapsedTime;
    mat.emissiveIntensity = 0.28 + activity * 0.45 + Math.sin(t * (2.8 + activity * 4) + position[0] * 6) * 0.08;
    ref.current.position.z = 0.01 + Math.sin(t * (4 + activity * 3) + position[0] * 4) * 0.002;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Flip monitor to face -Z (toward the character) */}
      <group rotation={[0, Math.PI, 0]}>
        {/* Monitor bezel */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[size[0] + 0.06, size[1] + 0.06, 0.03]} />
          <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Screen */}
        <mesh ref={ref} position={[0, 0, 0.01]}>
          <boxGeometry args={[size[0], size[1], 0.01]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        {/* Monitor stand */}
        <mesh position={[0, -(size[1] / 2) - 0.08, -0.04]}>
          <boxGeometry args={[0.06, 0.12, 0.06]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- Chair ----------

function Chair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Seat */}
      <mesh position={[0, 0.10, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.4]} />
        <meshStandardMaterial color="#16192a" roughness={0.5} metalness={0.45} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.3, -0.18]}>
        <boxGeometry args={[0.36, 0.38, 0.04]} />
        <meshStandardMaterial color="#16192a" roughness={0.5} metalness={0.45} />
      </mesh>
      {/* Legs */}
      {[[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].map(([x, z], i) => (
        <mesh key={`cleg-${i}`} position={[x, -0.08, z]}>
          <boxGeometry args={[0.04, 0.32, 0.04]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* Armrests */}
      <mesh position={[-0.22, 0.18, 0.02]}>
        <boxGeometry args={[0.04, 0.04, 0.28]} />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0.22, 0.18, 0.02]}>
        <boxGeometry args={[0.04, 0.04, 0.28]} />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ========== CODER STATION ==========

function CoderStation({
  accent,
  animationState,
}: {
  accent: THREE.Color;
  animationState: AnimationState;
}) {
  const keyRefs = useRef<(THREE.Mesh | null)[]>([]);
  const mouseRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const motion = getStationMotion(animationState, clock.elapsedTime);
    for (let i = 0; i < keyRefs.current.length; i++) {
      const mesh = keyRefs.current[i];
      if (!mesh) continue;
      mesh.position.y = 0.5 - motion.press * (0.004 + i * 0.001);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive = accent;
      mat.emissiveIntensity = 0.05 + motion.activity * 0.2 + (i === Math.floor(motion.pulse * 3) ? 0.15 : 0);
    }
    if (mouseRef.current) {
      mouseRef.current.position.z = 0.2 + motion.sweep * 0.025;
      mouseRef.current.rotation.y = motion.sweep * 0.12;
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
      <Chair position={[0, 0, -0.3]} />
      {/* L-shaped desk: main surface */}
      <mesh position={[0, 0.45, 0.3]}>
        <boxGeometry args={[1.8, 0.06, 0.8]} />
        <DeskMat />
      </mesh>
      {/* L-shaped desk: side wing */}
      <mesh position={[1.05, 0.45, -0.2]}>
        <boxGeometry args={[0.6, 0.06, 1.2]} />
        <DeskMat />
      </mesh>
      {/* Desk legs */}
      {[[-0.85, 0, -0.05], [0.85, 0, -0.05], [-0.85, 0, 0.65], [0.85, 0, 0.65]].map(([x, , z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.22, z]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* Main wide monitor */}
      <Monitor position={[0, 0.88, 0.65]} rotation={[-0.15, 0, 0]} size={[1.2, 0.7]} color={accent} activity={1} />
      {/* Left side monitor */}
      <Monitor position={[-0.75, 0.82, 0.55]} rotation={[-0.15, 0.3, 0]} size={[0.5, 0.35]} color={accent} activity={0.8} />
      {/* Right side monitor */}
      <Monitor position={[0.75, 0.82, 0.55]} rotation={[-0.15, -0.3, 0]} size={[0.5, 0.35]} color={accent} activity={0.8} />
      {/* Keyboard */}
      <mesh position={[-0.1, 0.49, 0.2]}>
        <boxGeometry args={[0.5, 0.015, 0.18]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Key rows */}
      {[0, 1, 2].map((row) => (
        <mesh
          key={`keys-${row}`}
          ref={(el) => { keyRefs.current[row] = el; }}
          position={[-0.1, 0.5, 0.14 + row * 0.05]}
        >
          <boxGeometry args={[0.44, 0.006, 0.03]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}
      {/* Mouse */}
      <mesh ref={mouseRef} position={[0.3, 0.49, 0.2]}>
        <boxGeometry args={[0.08, 0.02, 0.12]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Coffee mug */}
      <mesh position={[0.7, 0.52, 0.0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Mug handle */}
      <mesh position={[0.75, 0.52, 0.0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.025, 0.008, 6, 8, Math.PI]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Under-desk tower */}
      <mesh position={[1.1, 0.3, -0.5]}>
        <boxGeometry args={[0.2, 0.5, 0.4]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Tower LED lights */}
      {[0.1, 0.15, 0.2].map((yOff, i) => (
        <mesh key={`led-${i}`} position={[1.21, 0.15 + i * 0.12, -0.5]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial
            color={i === 0 ? '#22c55e' : accent}
            emissive={new THREE.Color(i === 0 ? '#22c55e' : accent.getStyle())}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ========== REVIEWER STATION ==========

function ReviewerStation({
  accent,
  progress,
  animationState,
}: {
  accent: THREE.Color;
  progress: number;
  animationState: AnimationState;
}) {
  const progressRatio = normalizeProgress(progress);
  const docCount = 1 + Math.floor(progressRatio * 4);
  const stampRef = useRef<THREE.Mesh>(null);
  const topDocRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const motion = getStationMotion(animationState, clock.elapsedTime);
    if (stampRef.current) {
      stampRef.current.position.y = 0.49 + motion.press * 0.045;
      stampRef.current.rotation.z = motion.working ? motion.sweep * 0.06 : 0;
    }
    if (topDocRef.current) {
      topDocRef.current.rotation.z = -0.03 + motion.sweep * 0.035;
      topDocRef.current.position.x = -0.45 + motion.press * 0.015;
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
      <Chair position={[0, 0, -0.2]} />
      {/* Desk surface */}
      <mesh position={[0, 0.45, 0.3]}>
        <boxGeometry args={[1.4, 0.06, 0.8]} />
        <DeskMat />
      </mesh>
      {/* 4 desk legs */}
      {[[-0.6, 0.65], [0.6, 0.65], [-0.6, -0.05], [0.6, -0.05]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.22, z]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
      {/* Monitor */}
      <Monitor position={[0, 0.88, 0.55]} rotation={[-0.1, 0, 0]} size={[0.8, 0.5]} color={accent} activity={0.7} />
      {Array.from({ length: docCount }).map((_, i) => (
        <mesh
          key={`doc-${i}`}
          ref={i === docCount - 1 ? topDocRef : undefined}
          position={[-0.45, 0.50 + i * 0.015, 0.2]}
        >
          <boxGeometry args={[0.3, 0.01, 0.4]} />
          <meshStandardMaterial
            color={['#f5f5dc', '#e2e8f0', '#fef3c7', '#dbeafe', '#fce7f3'][i % 5]}
          />
        </mesh>
      ))}
      {/* Red stamp on desk */}
      <mesh ref={stampRef} position={[0.45, 0.49, 0.2]}>
        <boxGeometry args={[0.12, 0.04, 0.08]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      {/* Green "approved" stamp mark on top doc */}
      {progressRatio > 0.7 && (
        <mesh position={[-0.45, 0.50 + docCount * 0.015, 0.2]}>
          <boxGeometry args={[0.15, 0.005, 0.08]} />
          <meshStandardMaterial color="#22c55e" emissive={new THREE.Color('#22c55e')} emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ========== PLANNER STATION ==========

function PlannerStation({
  accent,
  animationState,
}: {
  accent: THREE.Color;
  animationState: AnimationState;
}) {
  const projectorRef = useRef<THREE.Mesh>(null);
  const cursorRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const motion = getStationMotion(animationState, clock.elapsedTime);
    if (projectorRef.current) {
      projectorRef.current.scale.setScalar(0.9 + motion.activity * 0.12 + motion.pulse * 0.06);
      const mat = projectorRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.08 + motion.activity * 0.1;
    }
    if (cursorRef.current) {
      cursorRef.current.position.x = motion.sweep * 0.75;
      const mat = cursorRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.45 + motion.activity * 0.4;
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
      {/* Standing desk (taller) */}
      <mesh position={[0, 0.55, 0.3]}>
        <boxGeometry args={[1.0, 0.06, 0.5]} />
        <DeskMat />
      </mesh>
      {/* Tall desk legs */}
      {[[-0.45, 0.52], [0.45, 0.52], [-0.45, 0.08], [0.45, 0.08]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.27, z]}>
          <boxGeometry args={[0.05, 0.54, 0.05]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* Large whiteboard */}
      <group position={[0, 1.2, 0.85]}>
        {/* Whiteboard surface (thin box to avoid razor-line from side) */}
        <mesh>
          <boxGeometry args={[2, 1.5, 0.03]} />
          <meshStandardMaterial
            color="#f8fafc"
            emissive={accent}
            emissiveIntensity={0.08}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Whiteboard frame - top */}
        <mesh position={[0, 0.76, 0]}>
          <boxGeometry args={[2.06, 0.04, 0.03]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
        {/* Frame bottom */}
        <mesh position={[0, -0.76, 0]}>
          <boxGeometry args={[2.06, 0.04, 0.03]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
        {/* Frame left */}
        <mesh position={[-1.02, 0, 0]}>
          <boxGeometry args={[0.04, 1.56, 0.03]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
        {/* Frame right */}
        <mesh position={[1.02, 0, 0]}>
          <boxGeometry args={[0.04, 1.56, 0.03]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
        {/* Sticky notes on whiteboard */}
        {[
          { pos: [-0.5, 0.35, 0.01] as [number, number, number], col: '#fde047' },
          { pos: [0.3, 0.4, 0.01] as [number, number, number], col: '#f472b6' },
          { pos: [-0.2, -0.1, 0.01] as [number, number, number], col: '#60a5fa' },
          { pos: [0.55, -0.2, 0.01] as [number, number, number], col: '#4ade80' },
        ].map((note, i) => (
          <mesh key={`note-${i}`} position={note.pos} rotation={[0, 0, (i - 1.5) * 0.08]}>
            <boxGeometry args={[0.2, 0.2, 0.02]} />
            <meshStandardMaterial color={note.col} emissive={new THREE.Color(note.col)} emissiveIntensity={0.2} />
          </mesh>
        ))}
        {/* Timeline bar below whiteboard */}
        <mesh position={[0, -0.88, 0]}>
          <boxGeometry args={[1.8, 0.06, 0.03]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} />
        </mesh>
      </group>
      {/* Holographic projector on desk */}
      <mesh position={[0.3, 0.6, 0.25]}>
        <cylinderGeometry args={[0.06, 0.08, 0.06, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Projection cone of light */}
      <mesh ref={projectorRef} position={[0.3, 0.8, 0.25]}>
        <coneGeometry args={[0.15, 0.35, 8, 1, true]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh ref={cursorRef} position={[0, 0.32, 0.865]}>
        <boxGeometry args={[0.1, 0.04, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} />
      </mesh>
      {/* Monitor on desk */}
      <Monitor position={[-0.2, 0.82, 0.5]} rotation={[-0.1, 0, 0]} size={[0.5, 0.35]} color={accent} activity={0.65} />
    </group>
  );
}

// ========== SECURITY STATION ==========

function SecurityStation({
  accent,
  animationState,
}: {
  accent: THREE.Color;
  animationState: AnimationState;
}) {
  const warningRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const motion = getStationMotion(animationState, clock.elapsedTime);
    if (warningRef.current) {
      warningRef.current.rotation.y = motion.spin * (motion.active ? 1.8 : 0.8);
      const mat = warningRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + motion.activity * 0.6;
    }
    if (shieldRef.current) {
      const mat = shieldRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.2 + motion.activity * 0.35 + motion.pulse * 0.25;
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
      <Chair position={[0, 0, -0.3]} />
      {/* Reinforced desk (thicker, darker) */}
      <mesh position={[0, 0.42, 0.3]}>
        <boxGeometry args={[1.6, 0.1, 0.8]} />
        <meshStandardMaterial color="#111317" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Desk legs - thick */}
      {[[-0.7, 0.65], [0.7, 0.65], [-0.7, -0.05], [0.7, -0.05]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.2, z]}>
          <boxGeometry args={[0.08, 0.4, 0.08]} />
          <meshStandardMaterial color="#0f1117" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* 4 monitor array in curved arrangement */}
      {[-0.5, -0.17, 0.17, 0.5].map((xOff, i) => (
        <Monitor
          key={`mon-${i}`}
          position={[xOff, 0.82, 0.55 + Math.abs(xOff) * 0.15]}
          rotation={[-0.15, -xOff * 0.3, 0]}
          size={[0.3, 0.22]}
          color={accent}
          activity={0.6}
        />
      ))}
      {/* Warning light pole */}
      <mesh position={[0.9, 0.6, -0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 6]} />
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Rotating warning cylinder */}
      <mesh ref={warningRef} position={[0.9, 1.0, -0.4]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 8]} />
        <meshStandardMaterial color="#ef4444" emissive={new THREE.Color('#ef4444')} emissiveIntensity={0.8} />
      </mesh>
      {/* Server rack behind desk */}
      <mesh position={[-0.8, 0.75, -0.5]}>
        <boxGeometry args={[0.4, 1.2, 0.3]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Server rack LEDs */}
      {[0.3, 0.5, 0.7, 0.9].map((yOff, i) => (
        <mesh key={`sled-${i}`} position={[-0.6, yOff, -0.5]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial
            color={['#22c55e', '#22c55e', '#eab308', '#22c55e'][i]}
            emissive={new THREE.Color(['#22c55e', '#22c55e', '#eab308', '#22c55e'][i])}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      {/* Barrier rails */}
      <mesh position={[1.2, 0.35, 0]}>
        <boxGeometry args={[0.04, 0.5, 2.5]} />
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.35, -1.0]}>
        <boxGeometry args={[2.5, 0.5, 0.04]} />
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Shield on stand */}
      <group position={[-0.3, 0.8, -0.6]}>
        {/* Shield body (pentagon-like from overlapping shapes) */}
        <mesh ref={shieldRef}>
          <boxGeometry args={[0.25, 0.3, 0.03]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <coneGeometry args={[0.125, 0.15, 4]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
        </mesh>
        {/* Shield emissive trim */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.2, 0.25, 0.005]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// ========== RESEARCHER STATION ==========

function ResearcherStation({
  accent,
  animationState,
}: {
  accent: THREE.Color;
  animationState: AnimationState;
}) {
  const orb1 = useRef<THREE.Mesh>(null);
  const orb2 = useRef<THREE.Mesh>(null);
  const orb3 = useRef<THREE.Mesh>(null);
  const orb4 = useRef<THREE.Mesh>(null);
  const microscopeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const motion = getStationMotion(animationState, t);
    if (orb1.current) orb1.current.position.y = 1.05 + Math.sin(t * (2 + motion.activity)) * 0.1;
    if (orb2.current) orb2.current.position.y = 1.16 + Math.sin(t * (2 + motion.activity) + 1.5) * 0.1;
    if (orb3.current) orb3.current.position.y = 0.98 + Math.sin(t * (2 + motion.activity) + 3.0) * 0.1;
    if (orb4.current) orb4.current.position.y = 1.12 + Math.sin(t * (2 + motion.activity) + 4.5) * 0.1;
    if (microscopeRef.current) {
      microscopeRef.current.rotation.z = -0.16 + motion.sweep * 0.06;
    }
  });

  const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#f59e0b'];

  return (
    <group position={[0, 0.15, 0]}>
      <Chair position={[0, 0, -0.25]} />
      {/* Round table */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.06, 20]} />
        <DeskMat />
      </mesh>
      {/* Table pedestal */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 0.3, 12]} />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Floating holographic data orbs */}
      <mesh ref={orb1} position={[-0.3, 1.1, -0.2]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} transparent opacity={0.8} />
      </mesh>
      <mesh ref={orb2} position={[0.25, 1.2, 0.15]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} transparent opacity={0.7} />
      </mesh>
      <mesh ref={orb3} position={[0.0, 1.0, -0.35]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} transparent opacity={0.75} />
      </mesh>
      <mesh ref={orb4} position={[-0.2, 1.15, 0.3]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.85} transparent opacity={0.7} />
      </mesh>
      {/* Book pile on table */}
      {bookColors.map((color, i) => (
        <mesh key={`book-${i}`} position={[0.35 - i * 0.02, 0.42 + i * 0.04, -0.2 + i * 0.01]} rotation={[0, i * 0.15, 0]}>
          <boxGeometry args={[0.22 - i * 0.015, 0.035, 0.16]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
      {/* Microscope body */}
      <mesh ref={microscopeRef} position={[-0.4, 0.48, 0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Microscope eyepiece */}
      <mesh position={[-0.4, 0.6, 0.3]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Globe */}
      <group position={[-0.5, 0.55, -0.35]}>
        {/* Globe sphere (wireframe) */}
        <mesh>
          <sphereGeometry args={[0.1, 12, 8]} />
          <meshStandardMaterial color={accent} wireframe transparent opacity={0.6} />
        </mesh>
        {/* Globe stand (torus) */}
        <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.01, 6, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Globe base */}
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.03, 8]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>
      {/* Filing cabinet */}
      <mesh position={[0.8, 0.35, -0.4]}>
        <boxGeometry args={[0.35, 0.55, 0.3]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Drawer lines */}
      {[0.15, 0.3, 0.45].map((yOff, i) => (
        <mesh key={`drawer-${i}`} position={[0.8, yOff, -0.24]}>
          <boxGeometry args={[0.3, 0.01, 0.005]} />
          <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ========== COORDINATOR STATION ==========

function CoordinatorStation({
  accent,
  animationState,
}: {
  accent: THREE.Color;
  animationState: AnimationState;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const railRef = useRef<THREE.Mesh>(null);
  const displayRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const motion = getStationMotion(animationState, t);
    if (sphereRef.current) {
      sphereRef.current.rotation.y = motion.spin;
      sphereRef.current.rotation.x = Math.sin(t * 0.7) * 0.1;
      const mat = sphereRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.45 + motion.activity * 0.4;
    }
    if (railRef.current) {
      const mat = railRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.2 + motion.activity * 0.25 + motion.pulse * 0.2;
    }
    if (displayRef.current) {
      const mat = displayRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.2 + motion.activity * 0.3;
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
      {/* Elevated circular platform */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[1.5, 1.6, 0.15, 24]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Central holographic command sphere */}
      <mesh ref={sphereRef} position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.7}
          transparent
          opacity={0.8}
          wireframe
        />
      </mesh>
      {/* Inner sphere */}
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
      </mesh>
      {/* Radar dish cone */}
      <mesh position={[0.7, 0.7, -0.5]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.15, 0.25, 12, 1, true]} />
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Radar dish stick */}
      <mesh position={[0.7, 0.5, -0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* 3 communication antennas at different heights */}
      {[
        { pos: [-0.8, 0, 0.5] as [number, number, number], h: 0.8 },
        { pos: [-0.6, 0, -0.7] as [number, number, number], h: 1.0 },
        { pos: [0.9, 0, 0.3] as [number, number, number], h: 0.6 },
      ].map((ant, i) => (
        <group key={`ant-${i}`} position={ant.pos}>
          <mesh position={[0, ant.h / 2 + 0.42, 0]}>
            <cylinderGeometry args={[0.012, 0.018, ant.h, 6]} />
            <meshStandardMaterial color="#4b5563" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Glowing tip */}
          <mesh position={[0, ant.h + 0.42, 0]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}
      {/* Circular console rail (torus) */}
      <mesh ref={railRef} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.04, 8, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Status display */}
      <mesh ref={displayRef} position={[-0.5, 0.85, 0.6]} rotation={[-0.2, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} />
      </mesh>
      {/* Display bezel */}
      <mesh position={[-0.5, 0.85, 0.59]} rotation={[-0.2, 0.3, 0]}>
        <boxGeometry args={[0.54, 0.39, 0.02]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ========== TESTER STATION ==========

function TesterStation({
  accent,
  progress,
  animationState,
}: {
  accent: THREE.Color;
  progress: number;
  animationState: AnimationState;
}) {
  const progressRatio = normalizeProgress(progress);
  const currentIdx = progressRatio >= 1 ? -1 : Math.min(5, Math.floor(progressRatio * 6));
  const indicatorRefs = useRef<(THREE.Mesh | null)[]>([]);
  const probeRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    const motion = getStationMotion(animationState, clock.elapsedTime);
    for (let i = 0; i < 6; i++) {
      const mesh = indicatorRefs.current[i];
      if (!mesh) continue;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (currentIdx === -1 || i < currentIdx) {
        mat.emissiveIntensity = 0.4 + motion.activity * 0.3;
      } else if (i === currentIdx) {
        mat.emissiveIntensity = 0.25 + motion.activity * 0.25 + motion.pulse * 0.4;
      } else {
        mat.emissiveIntensity = 0.05;
      }
    }
    probeRefs.current.forEach((probe, i) => {
      if (!probe) return;
      probe.position.y = 0.52 + motion.hover * 0.02 * (i === 0 ? 1 : -1);
    });
  });

  return (
    <group position={[0, 0.15, 0]}>
      <Chair position={[0, 0, -0.2]} />
      {/* Testing bench */}
      <mesh position={[0, 0.42, 0.3]}>
        <boxGeometry args={[1.4, 0.06, 0.7]} />
        <DeskMat />
      </mesh>
      {/* Bench legs */}
      {[[-0.6, 0.6], [0.6, 0.6], [-0.6, 0.0], [0.6, 0.0]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.2, z]}>
          <boxGeometry args={[0.06, 0.38, 0.06]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* Equipment rack behind */}
      <mesh position={[0, 0.7, 0.7]}>
        <boxGeometry args={[1.2, 0.5, 0.06]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* 6 indicator lights in a row */}
      {Array.from({ length: 6 }).map((_, i) => {
        let color: string;
        if (currentIdx === -1 || i < currentIdx) color = '#22c55e';
        else if (i === currentIdx) color = '#eab308';
        else color = '#374151';
        const c = new THREE.Color(color);
        return (
          <mesh
            key={`ind-${i}`}
            ref={(el) => { indicatorRefs.current[i] = el; }}
            position={[-0.45 + i * 0.18, 0.5, 0.25]}
          >
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i < currentIdx ? 0.7 : 0.05} />
          </mesh>
        );
      })}
      {/* Oscilloscope box */}
      <mesh position={[0.5, 0.55, 0.55]}>
        <boxGeometry args={[0.3, 0.2, 0.15]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Oscilloscope sine wave line */}
      <mesh position={[0.5, 0.55, 0.47]}>
        <boxGeometry args={[0.22, 0.02, 0.005]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} />
      </mesh>
      {/* Test probes */}
      {[[-0.4, '#ef4444'], [-0.25, '#3b82f6']].map(([xOff, col], i) => (
        <group key={`probe-${i}`} ref={(el) => { probeRefs.current[i] = el; }}>
          <mesh position={[xOff as number, 0.52, 0.55]}>
            <cylinderGeometry args={[0.01, 0.01, 0.2, 6]} />
            <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[xOff as number, 0.63, 0.55]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color={col as string} emissive={new THREE.Color(col as string)} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      {/* Pass/fail counter displays */}
      <mesh position={[-0.55, 0.55, 0.15]}>
        <boxGeometry args={[0.12, 0.1, 0.08]} />
        <meshStandardMaterial color="#22c55e" emissive={new THREE.Color('#22c55e')} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[-0.55, 0.55, 0.3]}>
        <boxGeometry args={[0.12, 0.1, 0.08]} />
        <meshStandardMaterial color="#ef4444" emissive={new THREE.Color('#ef4444')} emissiveIntensity={0.4} />
      </mesh>
      {/* Cables (thin stretched boxes) */}
      {[
        { from: [-0.3, 0.46, 0.4], to: [0.3, 0.46, 0.5] },
        { from: [-0.2, 0.46, 0.15], to: [0.4, 0.46, 0.45] },
      ].map((cable, i) => {
        const mx = ((cable.from[0] as number) + (cable.to[0] as number)) / 2;
        const mz = ((cable.from[2] as number) + (cable.to[2] as number)) / 2;
        const dx = (cable.to[0] as number) - (cable.from[0] as number);
        const dz = (cable.to[2] as number) - (cable.from[2] as number);
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        return (
          <mesh key={`cable-${i}`} position={[mx, cable.from[1] as number, mz]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.01, 0.01, len]} />
            <meshStandardMaterial color={['#eab308', '#6366f1'][i]} roughness={0.6} metalness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

// ========== DEVOPS STATION ==========

function DevOpsStation({
  accent,
  progress,
  animationState,
}: {
  accent: THREE.Color;
  progress: number;
  animationState: AnimationState;
}) {
  const buttonRef = useRef<THREE.Mesh>(null);
  const fanRef = useRef<THREE.Mesh>(null);
  const arrowRefs = useRef<(THREE.Mesh | null)[]>([]);
  const isDeployed = normalizeProgress(progress) > 0.9;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const motion = getStationMotion(animationState, t);
    if (buttonRef.current) {
      const mat = buttonRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isDeployed
        ? 0.55 + motion.pulse * 0.35
        : 0.12 + motion.activity * 0.18;
    }
    if (fanRef.current) {
      fanRef.current.rotation.y = motion.spin * 4;
    }
    arrowRefs.current.forEach((arrow, i) => {
      if (!arrow) return;
      arrow.position.z = -0.06 + ((motion.pulse + i * 0.3) % 1) * 0.08;
    });
  });

  return (
    <group position={[0, 0.15, 0]}>
      <Chair position={[0, 0, -0.3]} />
      {/* Server rack cluster: 3 tall boxes side by side */}
      {[-0.35, 0, 0.35].map((xOff, i) => (
        <group key={`rack-${i}`}>
          <mesh position={[xOff, 0.65, 0.7]}>
            <boxGeometry args={[0.3, 1.0, 0.25]} />
            <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Blinking LEDs on each rack */}
          {[0.35, 0.55, 0.75, 0.95].map((yOff, j) => (
            <mesh key={`led-${i}-${j}`} position={[xOff + 0.16, yOff, 0.58]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshStandardMaterial
                color="#22c55e"
                emissive={new THREE.Color('#22c55e')}
                emissiveIntensity={0.75}
              />
            </mesh>
          ))}
        </group>
      ))}
      {/* Pipeline tubes: 3 connected cylinders */}
      {[[-0.5, 0.3, 0], [0, 0.3, 0], [0.5, 0.3, 0]].map(([x, y, z], i) => (
        <mesh key={`pipe-${i}`} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.45, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
      ))}
      {/* Arrow triangles showing flow direction */}
      {[-0.25, 0.25].map((xOff, i) => (
        <mesh
          key={`arrow-${i}`}
          ref={(el) => { arrowRefs.current[i] = el; }}
          position={[xOff, 0.3, -0.06]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <coneGeometry args={[0.04, 0.08, 3]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Deploy button pedestal */}
      <mesh position={[0.8, 0.25, -0.5]}>
        <cylinderGeometry args={[0.08, 0.1, 0.3, 8]} />
        <EquipMat />
      </mesh>
      {/* Deploy button sphere */}
      <mesh ref={buttonRef} position={[0.8, 0.45, -0.5]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color={isDeployed ? '#22c55e' : '#ef4444'}
          emissive={new THREE.Color(isDeployed ? '#22c55e' : '#ef4444')}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Terminal screen */}
      <mesh position={[-0.7, 0.55, -0.3]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
        <meshStandardMaterial color="#022c22" emissive={new THREE.Color('#22c55e')} emissiveIntensity={0.15} />
      </mesh>
      {/* Terminal bezel */}
      <mesh position={[-0.7, 0.55, -0.31]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.54, 0.39, 0.02]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Terminal text lines */}
      {[0.08, 0.02, -0.04].map((yOff, i) => (
        <mesh key={`tline-${i}`} position={[-0.7, 0.55 + yOff, -0.295]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.35 - i * 0.05, 0.015, 0.02]} />
          <meshStandardMaterial color="#22c55e" emissive={new THREE.Color('#22c55e')} emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Cooling fan */}
      <mesh ref={fanRef} position={[0, 0.7, 0.4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 6]} />
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ========== DEBUGGER STATION ==========

function DebuggerStation({
  accent,
  animationState,
}: {
  accent: THREE.Color;
  animationState: AnimationState;
}) {
  const lensGroupRef = useRef<THREE.Group>(null);
  const tipRef = useRef<THREE.Mesh>(null);
  const traceRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const motion = getStationMotion(animationState, clock.elapsedTime);
    if (lensGroupRef.current) {
      lensGroupRef.current.position.x = 0.4 + motion.sweep * 0.08;
      lensGroupRef.current.position.y = 1.02 + motion.hover * 0.03;
    }
    if (tipRef.current) {
      const mat = tipRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.35 + motion.activity * 0.3 + motion.pulse * 0.25;
    }
    traceRefs.current.forEach((trace, i) => {
      if (!trace) return;
      const mat = trace.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.12 + motion.activity * 0.12 + (i === Math.floor(motion.pulse * traceRefs.current.length) ? 0.25 : 0);
    });
  });

  return (
    <group position={[0, 0.15, 0]}>
      <Chair position={[0, 0, -0.3]} />
      {/* Messy workbench (slightly rotated) */}
      <mesh position={[0, 0.42, 0.25]} rotation={[0, 0.03, 0]}>
        <boxGeometry args={[1.3, 0.06, 0.7]} />
        <DeskMat />
      </mesh>
      {/* Bench legs */}
      {[[-0.55, 0.55], [0.55, 0.55], [-0.55, -0.05], [0.55, -0.05]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.2, z]}>
          <boxGeometry args={[0.06, 0.38, 0.06]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* Large magnifying glass on articulated arm */}
      {/* Arm base */}
      <mesh position={[0.6, 0.48, 0.1]}>
        <boxGeometry args={[0.1, 0.06, 0.1]} />
        <meshStandardMaterial color="#4b5563" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Arm segment 1 */}
      <mesh position={[0.6, 0.65, 0.1]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.025, 0.35, 0.025]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Arm segment 2 (angled) */}
      <mesh position={[0.5, 0.9, 0.1]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.025, 0.25, 0.025]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Magnifying lens (sphere + torus) */}
      <group ref={lensGroupRef} position={[0.4, 1.05, 0.1]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#bfdbfe" transparent opacity={0.3} roughness={0.1} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.08, 0.012, 8, 16]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
      {/* Oscilloscope-like monitor */}
      <mesh position={[-0.3, 0.58, 0.5]}>
        <boxGeometry args={[0.35, 0.25, 0.15]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Waveform on oscilloscope */}
      <mesh position={[-0.3, 0.58, 0.425]}>
        <boxGeometry args={[0.25, 0.02, 0.005]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} />
      </mesh>
      {/* "Bug" representations - tiny dark spheres with crosses */}
      {[
        [0.1, 0.47, 0.15],
        [-0.15, 0.47, 0.0],
        [0.3, 0.47, -0.05],
      ].map(([x, y, z], i) => (
        <group key={`bug-${i}`} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} metalness={0.2} />
          </mesh>
          {/* Cross legs */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.04, 0.004, 0.004]} />
            <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.04, 0.004, 0.004]} />
            <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Soldering iron */}
      <mesh position={[0.15, 0.48, 0.4]} rotation={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.008, 0.015, 0.2, 6]} />
        <meshStandardMaterial color="#78716c" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Soldering iron tip (glowing orange) */}
      <mesh ref={tipRef} position={[0.22, 0.48, 0.33]} rotation={[0, 0.5, Math.PI / 2]}>
        <coneGeometry args={[0.008, 0.04, 6]} />
        <meshStandardMaterial color="#f97316" emissive={new THREE.Color('#f97316')} emissiveIntensity={0.8} />
      </mesh>
      {/* Circuit board */}
      <mesh position={[-0.05, 0.47, 0.1]}>
        <boxGeometry args={[0.4, 0.025, 0.3]} />
        <meshStandardMaterial color="#065f46" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Circuit traces */}
      {[
        [-0.15, 0.485, 0.05, 0.18, 0.01],
        [0.05, 0.485, 0.15, 0.12, 0.01],
        [-0.1, 0.485, 0.2, 0.15, 0.01],
        [0.1, 0.485, 0.0, 0.01, 0.15],
        [-0.05, 0.485, -0.02, 0.01, 0.12],
      ].map(([x, y, z, w, d], i) => (
        <mesh key={`trace-${i}`} ref={(el) => { traceRefs.current[i] = el; }} position={[x, y, z]}>
          <boxGeometry args={[w, 0.004, d]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Monitor */}
      <Monitor position={[0, 0.82, 0.6]} rotation={[-0.15, 0, 0]} size={[0.5, 0.35]} color={accent} activity={0.7} />
    </group>
  );
}

// ========== DESIGNER STATION ==========

function DesignerStation({
  accent,
  animationState,
}: {
  accent: THREE.Color;
  animationState: AnimationState;
}) {
  const stylusRef = useRef<THREE.Mesh>(null);
  const tabletRef = useRef<THREE.Mesh>(null);
  const canvasSplashRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const motion = getStationMotion(animationState, clock.elapsedTime);
    if (stylusRef.current) {
      stylusRef.current.position.x = 0.8 + motion.sweep * 0.06;
      stylusRef.current.position.z = 0.1 + motion.press * 0.04;
    }
    if (tabletRef.current) {
      const mat = tabletRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.16 + motion.activity * 0.18 + motion.pulse * 0.08;
    }
    canvasSplashRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.12 + (i === Math.floor(motion.pulse * canvasSplashRefs.current.length) ? 0.26 : 0.06);
    });
  });

  return (
    <group position={[0, 0.15, 0]}>
      <Chair position={[0, 0, -0.3]} />
      {/* Tilted drafting table */}
      <mesh position={[0, 0.5, 0.2]} rotation={[0.26, 0, 0]}>
        <boxGeometry args={[1.0, 0.05, 0.7]} />
        <DeskMat />
      </mesh>
      {/* Table support frame */}
      <mesh position={[0, 0.25, 0.1]}>
        <boxGeometry args={[0.9, 0.4, 0.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Large canvas/easel behind */}
      <group position={[-0.7, 0.8, 0.7]}>
        {/* Easel legs */}
        <mesh position={[-0.05, -0.3, 0]}>
          <boxGeometry args={[0.03, 0.6, 0.03]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} metalness={0.1} />
        </mesh>
        <mesh position={[0.05, -0.3, 0]}>
          <boxGeometry args={[0.03, 0.6, 0.03]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} metalness={0.1} />
        </mesh>
        {/* Canvas */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.6, 0.5, 0.02]} />
          <meshStandardMaterial color="#fafafa" emissive={accent} emissiveIntensity={0.05} />
        </mesh>
        {/* Colorful splashes on canvas */}
        {[
          { pos: [-0.1, 0.2, 0.01] as [number, number, number], col: '#ef4444', s: 0.08 },
          { pos: [0.15, 0.1, 0.01] as [number, number, number], col: '#3b82f6', s: 0.1 },
          { pos: [-0.05, -0.05, 0.01] as [number, number, number], col: '#eab308', s: 0.06 },
          { pos: [0.1, 0.25, 0.01] as [number, number, number], col: '#22c55e', s: 0.07 },
        ].map((splash, i) => (
          <mesh key={`splash-${i}`} ref={(el) => { canvasSplashRefs.current[i] = el; }} position={splash.pos}>
            <boxGeometry args={[splash.s, splash.s, 0.02]} />
            <meshStandardMaterial color={splash.col} emissive={new THREE.Color(splash.col)} emissiveIntensity={0.3} />
          </mesh>
        ))}
      </group>
      {/* Paint palette */}
      <mesh position={[0.6, 0.48, -0.2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
        <meshStandardMaterial color="#d4c5a9" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Paint dots on palette */}
      {[
        { a: 0, col: '#ef4444' }, { a: 1.05, col: '#f59e0b' }, { a: 2.1, col: '#3b82f6' },
        { a: 3.14, col: '#22c55e' }, { a: 4.19, col: '#a855f7' }, { a: 5.24, col: '#ec4899' },
      ].map((dot, i) => (
        <mesh key={`pdot-${i}`} position={[0.6 + Math.cos(dot.a) * 0.07, 0.5, -0.2 + Math.sin(dot.a) * 0.07]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color={dot.col} roughness={0.8} metalness={0.0} />
        </mesh>
      ))}
      {/* Pantone fan: stack of thin rectangles fanned out */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={`pant-${i}`} position={[0.35, 0.5, -0.5]} rotation={[0, 0, -0.08 * i]}>
          <boxGeometry args={[0.04, 0.18, 0.005]} />
          <meshStandardMaterial
            color={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'][i]}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
      ))}
      {/* Tablet/pen display */}
      <mesh ref={tabletRef} position={[0.55, 0.48, 0.15]} rotation={[0.15, -0.2, 0]}>
        <boxGeometry args={[0.4, 0.28, 0.02]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
      </mesh>
      {/* Stylus */}
      <mesh ref={stylusRef} position={[0.8, 0.47, 0.1]} rotation={[0, 0.3, Math.PI / 6]}>
        <cylinderGeometry args={[0.006, 0.01, 0.18, 6]} />
        <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Inspiration board behind */}
      <group position={[0.6, 0.95, 0.75]}>
        <mesh>
          <boxGeometry args={[0.6, 0.45, 0.02]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Tiny colored squares pinned to board */}
        {[
          { pos: [-0.15, 0.12, 0.01] as [number, number, number], col: '#f472b6' },
          { pos: [0.1, 0.1, 0.01] as [number, number, number], col: '#60a5fa' },
          { pos: [-0.08, -0.08, 0.01] as [number, number, number], col: '#fbbf24' },
          { pos: [0.18, -0.1, 0.01] as [number, number, number], col: '#34d399' },
          { pos: [0.0, 0.15, 0.01] as [number, number, number], col: '#c084fc' },
        ].map((pin, i) => (
          <mesh key={`pin-${i}`} position={pin.pos}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color={pin.col} emissive={new THREE.Color(pin.col)} emissiveIntensity={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ========== MAIN COMPONENT ==========

export default function Station3D({ category, progress, animationState }: Station3DProps) {
  const colors = AGENT_PALETTES[category];
  const accent = new THREE.Color(colors.accent);

  const equipment = (() => {
    switch (category) {
      case AgentCategory.Coder:
        return <CoderStation accent={accent} animationState={animationState} />;
      case AgentCategory.Reviewer:
        return <ReviewerStation accent={accent} progress={progress} animationState={animationState} />;
      case AgentCategory.Planner:
        return <PlannerStation accent={accent} animationState={animationState} />;
      case AgentCategory.Security:
        return <SecurityStation accent={accent} animationState={animationState} />;
      case AgentCategory.Researcher:
        return <ResearcherStation accent={accent} animationState={animationState} />;
      case AgentCategory.Coordinator:
        return <CoordinatorStation accent={accent} animationState={animationState} />;
      case AgentCategory.Tester:
        return <TesterStation accent={accent} progress={progress} animationState={animationState} />;
      case AgentCategory.DevOps:
        return <DevOpsStation accent={accent} progress={progress} animationState={animationState} />;
      case AgentCategory.Debugger:
        return <DebuggerStation accent={accent} animationState={animationState} />;
      case AgentCategory.Designer:
        return <DesignerStation accent={accent} animationState={animationState} />;
      default:
        return null;
    }
  })();

  return (
    <group>
      <BasePlatform colors={colors} progress={progress} />
      {equipment}
    </group>
  );
}
