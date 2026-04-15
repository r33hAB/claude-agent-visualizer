import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AgentCategory } from '../types/agent';

interface Station3DProps {
  category: AgentCategory;
  progress: number;
  time: number;
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

const DESK_COLOR = '#1a1f2e';
const EQUIP_COLOR = '#2a2f3e';

// ---------- Shared: Desk Material ----------

function DeskMat() {
  return <meshStandardMaterial color={DESK_COLOR} roughness={0.6} metalness={0.4} />;
}

function EquipMat() {
  return <meshStandardMaterial color={EQUIP_COLOR} roughness={0.5} metalness={0.4} />;
}

// ---------- Base Platform ----------

function BasePlatform({ accentColor, progress }: { accentColor: string; progress: number }) {
  const accent = new THREE.Color(accentColor);

  // Progress-based status light color
  let statusColor: string;
  if (progress < 0.3) statusColor = '#ef4444';
  else if (progress < 0.7) statusColor = '#eab308';
  else statusColor = '#22c55e';
  const statusC = new THREE.Color(statusColor);

  const edges: [number, number, number, number, number, number][] = [
    [0, 0.08, 1.95, 4, 0.03, 0.04],
    [0, 0.08, -1.95, 4, 0.03, 0.04],
    [1.95, 0.08, 0, 0.04, 0.03, 4],
    [-1.95, 0.08, 0, 0.04, 0.03, 4],
  ];
  const corners: [number, number, number][] = [
    [1.85, 0, 1.85], [-1.85, 0, 1.85],
    [1.85, 0, -1.85], [-1.85, 0, -1.85],
  ];

  return (
    <group>
      {/* Main platform */}
      <mesh position={[0, 0.075, 0]}>
        <boxGeometry args={[4, 0.15, 4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Subtle height variation ridge */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[3.6, 0.02, 3.6]} />
        <meshStandardMaterial color="#131b2e" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Edge strips */}
      {edges.map(([px, py, pz, sx, sy, sz], i) => (
        <mesh key={`edge-${i}`} position={[px, py, pz]}>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* Corner pylons */}
      {corners.map(([cx, , cz], i) => (
        <group key={`pylon-${i}`} position={[cx, 0.15, cz]}>
          {/* Pylon body */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.08]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Glowing tip */}
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.0} />
          </mesh>
        </group>
      ))}
      {/* Status light on front */}
      <mesh position={[0, 0.12, 1.98]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={statusC} emissive={statusC} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ---------- Monitor with flicker ----------

function Monitor({
  position,
  rotation,
  size,
  color,
  time,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number];
  color: THREE.Color;
  time: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.5 + Math.sin(time * 3 + position[0] * 10) * 0.1;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Flip monitor to face -Z (toward the character behind the desk) */}
      <group rotation={[0, Math.PI, 0]}>
        {/* Monitor bezel */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[size[0] + 0.06, size[1] + 0.06, 0.03]} />
          <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Screen */}
        <mesh ref={ref} position={[0, 0, 0.01]}>
          <boxGeometry args={[size[0], size[1], 0.01]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
          />
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

// ========== CODER STATION ==========

function CoderStation({ accent, time }: { accent: THREE.Color; time: number }) {
  return (
    <group position={[0, 0.15, 0]}>
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
      <Monitor position={[0, 0.88, 0.65]} rotation={[-0.15, 0, 0]} size={[1.2, 0.7]} color={accent} time={time} />
      {/* Left side monitor */}
      <Monitor position={[-0.75, 0.82, 0.55]} rotation={[-0.15, 0.3, 0]} size={[0.5, 0.35]} color={accent} time={time} />
      {/* Right side monitor */}
      <Monitor position={[0.75, 0.82, 0.55]} rotation={[-0.15, -0.3, 0]} size={[0.5, 0.35]} color={accent} time={time} />
      {/* Keyboard */}
      <mesh position={[-0.1, 0.49, 0.2]}>
        <boxGeometry args={[0.5, 0.015, 0.18]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Key rows */}
      {[0, 1, 2].map((row) => (
        <mesh key={`keys-${row}`} position={[-0.1, 0.5, 0.14 + row * 0.05]}>
          <boxGeometry args={[0.44, 0.006, 0.03]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}
      {/* Mouse */}
      <mesh position={[0.3, 0.49, 0.2]}>
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

function ReviewerStation({ accent, progress, time }: { accent: THREE.Color; progress: number; time: number }) {
  const stackCount = 1 + Math.floor(progress * 4);
  return (
    <group position={[0, 0.15, 0]}>
      {/* Desk */}
      <mesh position={[0, 0.45, 0.3]}>
        <boxGeometry args={[1.4, 0.06, 0.8]} />
        <DeskMat />
      </mesh>
      {/* Desk legs */}
      {[[-0.6, 0.65], [0.6, 0.65], [-0.6, -0.05], [0.6, -0.05]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.22, z]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* Document organizer: 3 vertical dividers */}
      {[-0.12, 0, 0.12].map((xOff, i) => (
        <mesh key={`div-${i}`} position={[0.5 + xOff, 0.56, 0.15]}>
          <boxGeometry args={[0.01, 0.18, 0.2]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* Documents in slots */}
      {Array.from({ length: stackCount }).map((_, i) => (
        <mesh key={`doc-${i}`} position={[0.44 + i * 0.1, 0.52, 0.15]}>
          <boxGeometry args={[0.08, 0.14, 0.18]} />
          <meshStandardMaterial
            color={['#e2e8f0', '#cbd5e1', '#fef3c7', '#dbeafe'][i % 4]}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}
      {/* Main monitor */}
      <Monitor position={[0, 0.88, 0.65]} rotation={[-0.15, 0, 0]} size={[0.8, 0.5]} color={accent} time={time} />
      {/* Green diff stripe on monitor (thin box, not plane) */}
      <mesh position={[0.15, 0.88, 0.66]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.06, 0.3, 0.01]} />
        <meshStandardMaterial color="#22c55e" emissive={new THREE.Color('#22c55e')} emissiveIntensity={0.4} />
      </mesh>
      {/* Red diff stripe on monitor (thin box, not plane) */}
      <mesh position={[0.23, 0.88, 0.66]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.06, 0.3, 0.01]} />
        <meshStandardMaterial color="#ef4444" emissive={new THREE.Color('#ef4444')} emissiveIntensity={0.4} />
      </mesh>
      {/* Red stamp pad */}
      <mesh position={[-0.5, 0.49, 0.15]}>
        <boxGeometry args={[0.15, 0.03, 0.1]} />
        <meshStandardMaterial color="#dc2626" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Desk lamp stem */}
      <mesh position={[-0.55, 0.62, 0.5]}>
        <cylinderGeometry args={[0.015, 0.02, 0.3, 6]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Desk lamp head */}
      <mesh position={[-0.55, 0.8, 0.5]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.08, 0.1, 8]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[-0.55, 0.75, 0.5]} color={accent.getStyle()} intensity={0.3} distance={1.5} />
      {/* Pencil holder */}
      <mesh position={[-0.3, 0.52, 0.0]}>
        <cylinderGeometry args={[0.035, 0.03, 0.08, 8]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Pencils */}
      {[[-0.005, 0.04], [0.005, -0.03], [0.01, 0.01]].map(([xOff, zOff], i) => (
        <mesh key={`pencil-${i}`} position={[-0.3 + xOff, 0.6 + i * 0.01, 0.0 + zOff]} rotation={[0.05 * (i - 1), 0, 0.03 * (i - 1)]}>
          <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
          <meshStandardMaterial color={['#eab308', '#ef4444', '#3b82f6'][i]} roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ========== PLANNER STATION ==========

function PlannerStation({ accent, time }: { accent: THREE.Color; time: number }) {
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
            <planeGeometry args={[0.2, 0.2]} />
            <meshStandardMaterial color={note.col} emissive={new THREE.Color(note.col)} emissiveIntensity={0.2} side={THREE.DoubleSide} />
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
      <mesh position={[0.3, 0.8, 0.25]}>
        <coneGeometry args={[0.15, 0.35, 8, 1, true]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Monitor on desk */}
      <Monitor position={[-0.2, 0.82, 0.5]} rotation={[-0.1, 0, 0]} size={[0.5, 0.35]} color={accent} time={time} />
    </group>
  );
}

// ========== SECURITY STATION ==========

function SecurityStation({ accent, time }: { accent: THREE.Color; time: number }) {
  const warningRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (warningRef.current) {
      warningRef.current.rotation.y = time * 1.5;
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
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
          time={time}
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
            emissiveIntensity={0.8 + Math.sin(time * 4 + i * 1.5) * 0.2}
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
        <mesh>
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

function ResearcherStation({ accent, time }: { accent: THREE.Color; progress: number; time: number }) {
  const orb1 = useRef<THREE.Mesh>(null);
  const orb2 = useRef<THREE.Mesh>(null);
  const orb3 = useRef<THREE.Mesh>(null);
  const orb4 = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (orb1.current) orb1.current.position.y = 1.1 + Math.sin(time * 2) * 0.1;
    if (orb2.current) orb2.current.position.y = 1.2 + Math.sin(time * 2 + 1.5) * 0.1;
    if (orb3.current) orb3.current.position.y = 1.0 + Math.sin(time * 2 + 3.0) * 0.1;
    if (orb4.current) orb4.current.position.y = 1.15 + Math.sin(time * 2 + 4.5) * 0.1;
  });

  const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#f59e0b'];

  return (
    <group position={[0, 0.15, 0]}>
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
      <mesh position={[-0.4, 0.48, 0.3]}>
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

function CoordinatorStation({ accent, time }: { accent: THREE.Color; time: number }) {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y = time * 0.5;
      sphereRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
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
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} side={THREE.DoubleSide} />
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
              emissiveIntensity={0.8 + Math.sin(time * 3 + i * 2) * 0.2}
            />
          </mesh>
        </group>
      ))}
      {/* Circular console rail (torus) */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.04, 8, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Status display */}
      <mesh position={[-0.5, 0.85, 0.6]} rotation={[-0.2, 0.3, 0]}>
        <planeGeometry args={[0.5, 0.35]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} side={THREE.DoubleSide} />
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

function TesterStation({ accent, progress, time }: { accent: THREE.Color; progress: number; time: number }) {
  const currentIdx = Math.floor(progress * 6);
  const indicatorRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    for (let i = 0; i < 6; i++) {
      const mesh = indicatorRefs.current[i];
      if (!mesh) continue;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (i < currentIdx) {
        mat.emissiveIntensity = 0.7;
      } else if (i === currentIdx) {
        mat.emissiveIntensity = 0.3 + Math.sin(time * 5) * 0.4;
      } else {
        mat.emissiveIntensity = 0.05;
      }
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
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
        if (i < currentIdx) color = '#22c55e';
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
        <group key={`probe-${i}`}>
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

function DevOpsStation({ accent, progress, time }: { accent: THREE.Color; progress: number; time: number }) {
  const buttonRef = useRef<THREE.Mesh>(null);
  const fanRef = useRef<THREE.Mesh>(null);
  const isDeployed = progress > 0.9;

  useFrame(() => {
    if (buttonRef.current) {
      const mat = buttonRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isDeployed
        ? 0.6 + Math.sin(time * 4) * 0.3
        : 0.15 + Math.sin(time * 2) * 0.1;
    }
    if (fanRef.current) {
      fanRef.current.rotation.y = time * 8;
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
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
                emissiveIntensity={0.5 + Math.sin(time * 3 + i * 2 + j * 1.3) * 0.5}
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
        <mesh key={`arrow-${i}`} position={[xOff, 0.3, -0.06]} rotation={[0, 0, -Math.PI / 2]}>
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
        <planeGeometry args={[0.5, 0.35]} />
        <meshStandardMaterial color="#022c22" emissive={new THREE.Color('#22c55e')} emissiveIntensity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Terminal bezel */}
      <mesh position={[-0.7, 0.55, -0.31]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.54, 0.39, 0.02]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Terminal text lines */}
      {[0.08, 0.02, -0.04].map((yOff, i) => (
        <mesh key={`tline-${i}`} position={[-0.7, 0.55 + yOff, -0.295]} rotation={[0, 0.3, 0]}>
          <planeGeometry args={[0.35 - i * 0.05, 0.015]} />
          <meshStandardMaterial color="#22c55e" emissive={new THREE.Color('#22c55e')} emissiveIntensity={0.5} side={THREE.DoubleSide} />
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

function DebuggerStation({ accent, time }: { accent: THREE.Color; time: number }) {
  return (
    <group position={[0, 0.15, 0]}>
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
      <mesh position={[0.4, 1.05, 0.1]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.3} roughness={0.1} metalness={0.2} />
      </mesh>
      <mesh position={[0.4, 1.05, 0.1]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.08, 0.012, 8, 16]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.7} />
      </mesh>
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
      <mesh position={[0.22, 0.48, 0.33]} rotation={[0, 0.5, Math.PI / 2]}>
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
        <mesh key={`trace-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, 0.004, d]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Monitor */}
      <Monitor position={[0, 0.82, 0.6]} rotation={[-0.15, 0, 0]} size={[0.5, 0.35]} color={accent} time={time} />
    </group>
  );
}

// ========== DESIGNER STATION ==========

function DesignerStation({ accent, time }: { accent: THREE.Color; time: number }) {
  return (
    <group position={[0, 0.15, 0]}>
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
          <planeGeometry args={[0.6, 0.5]} />
          <meshStandardMaterial color="#fafafa" emissive={accent} emissiveIntensity={0.05} side={THREE.DoubleSide} />
        </mesh>
        {/* Colorful splashes on canvas */}
        {[
          { pos: [-0.1, 0.2, 0.01] as [number, number, number], col: '#ef4444', s: 0.08 },
          { pos: [0.15, 0.1, 0.01] as [number, number, number], col: '#3b82f6', s: 0.1 },
          { pos: [-0.05, -0.05, 0.01] as [number, number, number], col: '#eab308', s: 0.06 },
          { pos: [0.1, 0.25, 0.01] as [number, number, number], col: '#22c55e', s: 0.07 },
        ].map((splash, i) => (
          <mesh key={`splash-${i}`} position={splash.pos}>
            <planeGeometry args={[splash.s, splash.s]} />
            <meshStandardMaterial color={splash.col} emissive={new THREE.Color(splash.col)} emissiveIntensity={0.3} side={THREE.DoubleSide} />
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
      <mesh position={[0.55, 0.48, 0.15]} rotation={[0.15, -0.2, 0]}>
        <planeGeometry args={[0.4, 0.28]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Stylus */}
      <mesh position={[0.8, 0.47, 0.1]} rotation={[0, 0.3, Math.PI / 6]}>
        <cylinderGeometry args={[0.006, 0.01, 0.18, 6]} />
        <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Inspiration board behind */}
      <group position={[0.6, 0.95, 0.75]}>
        <mesh>
          <planeGeometry args={[0.6, 0.45]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.3} side={THREE.DoubleSide} />
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
            <planeGeometry args={[0.08, 0.08]} />
            <meshStandardMaterial color={pin.col} emissive={new THREE.Color(pin.col)} emissiveIntensity={0.2} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ========== MAIN COMPONENT ==========

export default function Station3D({ category, progress, time }: Station3DProps) {
  const colors = CATEGORY_COLORS[category];
  const accent = new THREE.Color(colors.accent);

  const equipment = (() => {
    switch (category) {
      case AgentCategory.Coder:
        return <CoderStation accent={accent} time={time} />;
      case AgentCategory.Reviewer:
        return <ReviewerStation accent={accent} progress={progress} time={time} />;
      case AgentCategory.Planner:
        return <PlannerStation accent={accent} time={time} />;
      case AgentCategory.Security:
        return <SecurityStation accent={accent} time={time} />;
      case AgentCategory.Researcher:
        return <ResearcherStation accent={accent} progress={progress} time={time} />;
      case AgentCategory.Coordinator:
        return <CoordinatorStation accent={accent} time={time} />;
      case AgentCategory.Tester:
        return <TesterStation accent={accent} progress={progress} time={time} />;
      case AgentCategory.DevOps:
        return <DevOpsStation accent={accent} progress={progress} time={time} />;
      case AgentCategory.Debugger:
        return <DebuggerStation accent={accent} time={time} />;
      case AgentCategory.Designer:
        return <DesignerStation accent={accent} time={time} />;
      default:
        return null;
    }
  })();

  return (
    <group>
      <BasePlatform accentColor={colors.accent} progress={progress} />
      {equipment}
    </group>
  );
}
