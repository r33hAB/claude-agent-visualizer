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

const DESK_COLOR = '#1e293b';
const DESK_ROUGHNESS = 0.6;
const DESK_METALNESS = 0.4;

// ---------- Shared: Base Platform ----------

function BasePlatform({ accentColor }: { accentColor: string }) {
  const accent = new THREE.Color(accentColor);
  const edgePositions: [number, number, number, number, number, number][] = [
    [0, 0.12, 1.48, 3, 0.04, 0.04],   // front edge
    [0, 0.12, -1.48, 3, 0.04, 0.04],  // back edge
    [1.48, 0.12, 0, 0.04, 0.04, 3],   // right edge
    [-1.48, 0.12, 0, 0.04, 0.04, 3],  // left edge
  ];
  const corners: [number, number, number][] = [
    [1.4, 0.13, 1.4],
    [-1.4, 0.13, 1.4],
    [1.4, 0.13, -1.4],
    [-1.4, 0.13, -1.4],
  ];

  return (
    <group>
      {/* Main platform surface */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[3, 0.1, 3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Edge strips */}
      {edgePositions.map(([px, py, pz, sx, sy, sz], i) => (
        <mesh key={`edge-${i}`} position={[px, py, pz]}>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      {/* Corner dots */}
      {corners.map(([cx, cy, cz], i) => (
        <mesh key={`corner-${i}`} position={[cx, cy, cz]}>
          <boxGeometry args={[0.1, 0.06, 0.1]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Desk Material Helper ----------

function DeskMaterial() {
  return (
    <meshStandardMaterial
      color={DESK_COLOR}
      roughness={DESK_ROUGHNESS}
      metalness={DESK_METALNESS}
    />
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
    <mesh ref={ref} position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---------- Category Equipment ----------

function CoderStation({ accent, time }: { accent: THREE.Color; time: number }) {
  return (
    <group position={[0, 0.1, 0]}>
      {/* L-shaped desk: main part */}
      <mesh position={[-0.15, 0.3, 0.5]}>
        <boxGeometry args={[1.2, 0.6, 0.5]} />
        <DeskMaterial />
      </mesh>
      {/* L-shaped desk: side part */}
      <mesh position={[0.7, 0.3, 0.15]}>
        <boxGeometry args={[0.5, 0.6, 0.8]} />
        <DeskMaterial />
      </mesh>
      {/* Monitor 1 */}
      <Monitor
        position={[-0.35, 0.85, 0.7]}
        rotation={[-0.2, 0, 0]}
        size={[0.6, 0.4]}
        color={accent}
        time={time}
      />
      {/* Monitor 2 */}
      <Monitor
        position={[0.35, 0.85, 0.7]}
        rotation={[-0.2, 0, 0]}
        size={[0.6, 0.4]}
        color={accent}
        time={time}
      />
      {/* Keyboard */}
      <mesh position={[-0.1, 0.62, 0.35]}>
        <boxGeometry args={[0.4, 0.02, 0.2]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

function ReviewerStation({
  accent,
  progress,
  time,
}: {
  accent: THREE.Color;
  progress: number;
  time: number;
}) {
  const stackCount = 3 + Math.floor(progress * 2); // 3-5 docs based on progress
  return (
    <group position={[0, 0.1, 0]}>
      {/* Desk */}
      <mesh position={[0, 0.3, 0.3]}>
        <boxGeometry args={[1.2, 0.6, 0.6]} />
        <DeskMaterial />
      </mesh>
      {/* Document stack */}
      {Array.from({ length: stackCount }).map((_, i) => (
        <mesh
          key={`doc-${i}`}
          position={[0.2 + i * 0.02, 0.62 + i * 0.025, 0.3 + i * 0.01]}
        >
          <boxGeometry args={[0.3, 0.02, 0.4]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#e2e8f0' : '#cbd5e1'}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}
      {/* Green checkmark box when progress > 80% */}
      {progress > 0.8 && (
        <mesh position={[-0.35, 0.65, 0.3]}>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive={new THREE.Color('#22c55e')}
            emissiveIntensity={0.6}
          />
        </mesh>
      )}
      {/* Monitor */}
      <Monitor
        position={[0, 0.85, 0.58]}
        rotation={[-0.15, 0, 0]}
        size={[0.5, 0.35]}
        color={accent}
        time={time}
      />
    </group>
  );
}

function PlannerStation({ accent, time }: { accent: THREE.Color; time: number }) {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Standing desk */}
      <mesh position={[0, 0.45, 0.4]}>
        <boxGeometry args={[0.8, 0.9, 0.4]} />
        <DeskMaterial />
      </mesh>
      {/* Whiteboard */}
      <group position={[0, 1.3, 0.65]}>
        {/* Whiteboard surface */}
        <mesh>
          <planeGeometry args={[1, 0.7]} />
          <meshStandardMaterial
            color="#f8fafc"
            emissive={accent}
            emissiveIntensity={0.15}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Whiteboard edges */}
        {/* Top */}
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[1.04, 0.03, 0.02]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
        {/* Bottom */}
        <mesh position={[0, -0.36, 0]}>
          <boxGeometry args={[1.04, 0.03, 0.02]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
        {/* Left */}
        <mesh position={[-0.52, 0, 0]}>
          <boxGeometry args={[0.03, 0.75, 0.02]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
        {/* Right */}
        <mesh position={[0.52, 0, 0]}>
          <boxGeometry args={[0.03, 0.75, 0.02]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
      </group>
      {/* Monitor on desk */}
      <Monitor
        position={[0, 1.05, 0.55]}
        rotation={[-0.1, 0, 0]}
        size={[0.5, 0.35]}
        color={accent}
        time={time}
      />
    </group>
  );
}

function SecurityStation({ accent, time }: { accent: THREE.Color; time: number }) {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Reinforced desk (thicker) */}
      <mesh position={[0, 0.35, 0.3]}>
        <boxGeometry args={[1.4, 0.7, 0.6]} />
        <DeskMaterial />
      </mesh>
      {/* 3 small monitors */}
      <Monitor
        position={[-0.4, 0.85, 0.58]}
        rotation={[-0.15, 0.15, 0]}
        size={[0.35, 0.25]}
        color={accent}
        time={time}
      />
      <Monitor
        position={[0, 0.9, 0.58]}
        rotation={[-0.15, 0, 0]}
        size={[0.35, 0.25]}
        color={accent}
        time={time}
      />
      <Monitor
        position={[0.4, 0.85, 0.58]}
        rotation={[-0.15, -0.15, 0]}
        size={[0.35, 0.25]}
        color={accent}
        time={time}
      />
      {/* Shield rack */}
      <mesh position={[-0.8, 0.6, -0.2]}>
        <boxGeometry args={[0.08, 0.8, 0.3]} />
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Shield shape on rack */}
      <mesh position={[-0.8, 0.75, -0.05]}>
        <boxGeometry args={[0.04, 0.35, 0.25]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

function ResearcherStation({
  accent,
  time,
}: {
  accent: THREE.Color;
  progress: number;
  time: number;
}) {
  const sphere1Ref = useRef<THREE.Mesh>(null);
  const sphere2Ref = useRef<THREE.Mesh>(null);
  const sphere3Ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (sphere1Ref.current) {
      sphere1Ref.current.position.y = 1.0 + Math.sin(time * 2) * 0.08;
    }
    if (sphere2Ref.current) {
      sphere2Ref.current.position.y = 1.0 + Math.sin(time * 2 + 2.1) * 0.08;
    }
    if (sphere3Ref.current) {
      sphere3Ref.current.position.y = 1.0 + Math.sin(time * 2 + 4.2) * 0.08;
    }
  });

  const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea'];

  return (
    <group position={[0, 0.1, 0]}>
      {/* Round table */}
      <mesh position={[0, 0.25, 0.2]}>
        <cylinderGeometry args={[0.6, 0.6, 0.5, 16]} />
        <DeskMaterial />
      </mesh>
      {/* Floating emissive spheres */}
      <mesh ref={sphere1Ref} position={[-0.25, 1.0, 0.1]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={sphere2Ref} position={[0.0, 1.0, 0.35]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={sphere3Ref} position={[0.25, 1.0, 0.1]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
      </mesh>
      {/* Book pile */}
      {bookColors.map((color, i) => (
        <mesh key={`book-${i}`} position={[0.5, 0.55 + i * 0.06, -0.3]}>
          <boxGeometry args={[0.2, 0.05, 0.28]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function CoordinatorStation({ accent, time }: { accent: THREE.Color; time: number }) {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Elevated platform */}
      <mesh position={[0, 0.175, 0]}>
        <boxGeometry args={[2, 0.15, 2]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Torus console */}
      <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.05, 8, 24]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      {/* Radar sphere */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.6 + Math.sin(time * 2) * 0.2}
        />
      </mesh>
    </group>
  );
}

function TesterStation({
  accent,
  progress,
  time,
}: {
  accent: THREE.Color;
  progress: number;
  time: number;
}) {
  const currentIdx = Math.floor(progress * 5);
  const indicatorRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    // Flash the current indicator cube
    for (let i = 0; i < 5; i++) {
      const mesh = indicatorRefs.current[i];
      if (!mesh) continue;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (i < currentIdx) {
        mat.emissiveIntensity = 0.7;
      } else if (i === currentIdx) {
        mat.emissiveIntensity = 0.4 + Math.sin(time * 5) * 0.4;
      } else {
        mat.emissiveIntensity = 0.05;
      }
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* Bench */}
      <mesh position={[0, 0.25, 0.3]}>
        <boxGeometry args={[1.2, 0.5, 0.5]} />
        <DeskMaterial />
      </mesh>
      {/* 5 indicator cubes */}
      {Array.from({ length: 5 }).map((_, i) => {
        let color: string;
        if (i < currentIdx) {
          color = '#22c55e'; // green
        } else if (i === currentIdx) {
          color = '#eab308'; // yellow
        } else {
          color = '#374151'; // dark gray
        }
        const c = new THREE.Color(color);
        return (
          <mesh
            key={`ind-${i}`}
            ref={(el) => { indicatorRefs.current[i] = el; }}
            position={[-0.36 + i * 0.18, 0.56, 0.3]}
          >
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshStandardMaterial
              color={c}
              emissive={c}
              emissiveIntensity={i < currentIdx ? 0.7 : 0.05}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function DevOpsStation({
  accent,
  progress,
  time,
}: {
  accent: THREE.Color;
  progress: number;
  time: number;
}) {
  const buttonRef = useRef<THREE.Mesh>(null);
  const isDeployed = progress > 0.9;

  useFrame(() => {
    if (!buttonRef.current) return;
    const mat = buttonRef.current.material as THREE.MeshStandardMaterial;
    if (isDeployed) {
      mat.emissiveIntensity = 0.6 + Math.sin(time * 4) * 0.3;
    } else {
      mat.emissiveIntensity = 0.2;
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* Pipeline: 3 cylinders connected horizontally */}
      {[-0.4, 0, 0.4].map((xOff, i) => (
        <mesh
          key={`pipe-${i}`}
          position={[xOff, 0.4, 0.3]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.06, 0.06, 0.35, 8]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
      {/* Connectors between pipes */}
      {[-0.2, 0.2].map((xOff, i) => (
        <mesh key={`conn-${i}`} position={[xOff, 0.4, 0.3]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
      {/* Deploy button pedestal */}
      <mesh position={[0.7, 0.3, -0.2]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <DeskMaterial />
      </mesh>
      {/* Deploy button sphere */}
      <mesh ref={buttonRef} position={[0.7, 0.55, -0.2]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color={isDeployed ? '#22c55e' : '#6b7280'}
          emissive={new THREE.Color(isDeployed ? '#22c55e' : '#6b7280')}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function DebuggerStation({ accent, time }: { accent: THREE.Color; time: number }) {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Workbench */}
      <mesh position={[0, 0.25, 0.3]}>
        <boxGeometry args={[1, 0.5, 0.6]} />
        <DeskMaterial />
      </mesh>
      {/* Magnifying lamp stem */}
      <mesh position={[0.55, 0.7, 0.2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Magnifying lamp head (cone) */}
      <mesh position={[0.55, 1.05, 0.2]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.15, 8]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Spot light from lamp */}
      <spotLight
        position={[0.55, 1.0, 0.2]}
        target-position={[0.3, 0.5, 0.3]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.5}
        color={accent}
        distance={2}
      />
      {/* Circuit board (flat textured box) */}
      <mesh position={[-0.15, 0.52, 0.25]}>
        <boxGeometry args={[0.5, 0.03, 0.35]} />
        <meshStandardMaterial
          color="#065f46"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      {/* Circuit traces on board */}
      {[[-0.3, 0.54, 0.2], [-0.1, 0.54, 0.3], [0.05, 0.54, 0.15]].map(
        ([x, y, z], i) => (
          <mesh key={`trace-${i}`} position={[x, y, z]}>
            <boxGeometry args={[0.15, 0.005, 0.01]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={0.3}
            />
          </mesh>
        ),
      )}
      {/* Monitor */}
      <Monitor
        position={[0, 0.75, 0.58]}
        rotation={[-0.15, 0, 0]}
        size={[0.5, 0.35]}
        color={accent}
        time={time}
      />
    </group>
  );
}

function DesignerStation({ accent, time }: { accent: THREE.Color; time: number }) {
  const paletteColors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#a855f7'];

  return (
    <group position={[0, 0.1, 0]}>
      {/* Angled drafting table */}
      <mesh position={[0, 0.45, 0.3]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.7]} />
        <DeskMaterial />
      </mesh>
      {/* Table legs (simplified as a box base) */}
      <mesh position={[0, 0.2, 0.2]}>
        <boxGeometry args={[0.8, 0.3, 0.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Palette cubes */}
      {paletteColors.map((color, i) => (
        <mesh key={`pal-${i}`} position={[-0.55 + i * 0.12, 0.15, -0.5]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial
            color={color}
            emissive={new THREE.Color(color)}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
      {/* Canvas easel - vertical plane */}
      <group position={[-0.7, 0.7, -0.2]}>
        {/* Easel legs */}
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.04, 0.5, 0.04]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} metalness={0.1} />
        </mesh>
        {/* Canvas */}
        <mesh position={[0, 0.15, 0]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshStandardMaterial
            color="#fafafa"
            emissive={accent}
            emissiveIntensity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {/* Monitor */}
      <Monitor
        position={[0.6, 0.75, 0.55]}
        rotation={[-0.15, -0.2, 0]}
        size={[0.45, 0.3]}
        color={accent}
        time={time}
      />
    </group>
  );
}

// ---------- Main Component ----------

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
      <BasePlatform accentColor={colors.accent} />
      {equipment}
    </group>
  );
}
