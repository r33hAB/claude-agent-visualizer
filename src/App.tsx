import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentState, AgentCategory } from './types/agent';
import { useAgentData } from './hooks/useAgentData';
import { SceneRoot } from './scene/SceneRoot';
import { Environment } from './scene/Environment';
import { PerformanceProvider } from './scene/PerformanceMonitor';
import AgentNode from './scene/AgentNode';
import { InteractionBeam } from './scene/InteractionBeam';
import { ParticleField } from './scene/effects/ParticleField';
import { PostProcessing } from './scene/PostProcessing';
import DetailPanel from './components/DetailPanel';
import SwarmOverview from './components/SwarmOverview';
import Controls from './components/Controls';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_POSITIONS: [number, number, number][] = [
  [0, 0, 0],       // 0: center (coordinator)
  [-8, 0, -6],     // 1
  [8, 0, -6],      // 2
  [-10, 0, 4],     // 3
  [10, 0, 4],      // 4
  [0, 0, 10],      // 5
  [-6, 0, -12],    // 6
  [6, 0, -12],     // 7
  [-14, 0, 0],     // 8
  [14, 0, 0],      // 9
  [-8, 0, 12],     // 10
  [8, 0, 12],      // 11
  [0, 0, -10],     // 12
  [-12, 0, -10],   // 13
  [12, 0, -10],    // 14
];

const BEAM_COLORS: Record<string, string> = {
  task_handoff: '#3b82f6',
  review_request: '#f59e0b',
  review_complete: '#22c55e',
  coordinator_delegation: '#ec4899',
  error_escalation: '#ef4444',
  status_update: '#60a5fa',
  memory_sharing: '#22d3ee',
  coordination_sync: '#ec4899',
  heartbeat: '#334155',
};

const ENV_COLORS: Record<string, string> = {
  idle: '#8899bb',
  active: '#3b82f6',
  heavy: '#8b5cf6',
  error: '#ef4444',
  complete: '#f59e0b',
  shutdown: '#334155',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActiveBeam {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  color: string;
  life: number;
  maxLife: number;
  startTime: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assignPosition(index: number): [number, number, number] {
  if (index < AGENT_POSITIONS.length) {
    return AGENT_POSITIONS[index];
  }
  // Fallback: place in a ring beyond the predefined positions
  const ring = Math.ceil(Math.sqrt(index - AGENT_POSITIONS.length + 1));
  const angle =
    ((index - AGENT_POSITIONS.length) / 6) * Math.PI * 2;
  const radius = ring * 6;
  return [
    Math.round(Math.cos(angle) * radius),
    0,
    Math.round(Math.sin(angle) * radius),
  ];
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  const { agents, interactions, swarm, connected } = useAgentData();
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [activeBeams, setActiveBeams] = useState<ActiveBeam[]>([]);

  // Stable map from agent id -> world position
  const agentPositions = useRef(new Map<string, [number, number, number]>());

  // Track which interaction event ids we have already converted to beams
  const processedInteractionIds = useRef(new Set<string>());

  // --------------------------------------------------
  // Assign positions to agents (stable across renders)
  // --------------------------------------------------
  const agentArray = Array.from(agents.values());
  let nextIndex = agentPositions.current.size;
  for (const agent of agentArray) {
    if (!agentPositions.current.has(agent.id)) {
      agentPositions.current.set(agent.id, assignPosition(nextIndex));
      nextIndex++;
    }
  }

  // --------------------------------------------------
  // Keep selectedAgent in sync with latest data
  // --------------------------------------------------
  useEffect(() => {
    if (selectedAgent) {
      const updated = agents.get(selectedAgent.id);
      if (updated) {
        setSelectedAgent(updated);
      } else {
        setSelectedAgent(null);
      }
    }
  }, [agents]); // eslint-disable-line react-hooks/exhaustive-deps

  // --------------------------------------------------
  // Convert interaction events into timed beams
  // --------------------------------------------------
  useEffect(() => {
    if (interactions.length === 0) return;

    const newBeams: ActiveBeam[] = [];
    for (const event of interactions) {
      if (processedInteractionIds.current.has(event.id)) continue;
      processedInteractionIds.current.add(event.id);

      newBeams.push({
        id: event.id,
        sourceAgentId: event.sourceAgentId,
        targetAgentId: event.targetAgentId,
        color: BEAM_COLORS[event.type] ?? '#60a5fa',
        life: 0,
        maxLife: 1.5,
        startTime: Date.now(),
      });
    }

    if (newBeams.length > 0) {
      setActiveBeams((prev) => [...prev, ...newBeams]);
    }
  }, [interactions]);

  // --------------------------------------------------
  // Beam lifecycle: age beams and remove expired ones
  // --------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBeams((prev) => {
        const now = Date.now();
        const next: ActiveBeam[] = [];
        for (const beam of prev) {
          const elapsed = (now - beam.startTime) / 1000;
          if (elapsed < beam.maxLife) {
            next.push({ ...beam, life: elapsed });
          }
        }
        return next.length === prev.length ? prev : next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------
  // Derived values
  // --------------------------------------------------
  const envColor = ENV_COLORS[swarm.environment] ?? ENV_COLORS.active;

  // --------------------------------------------------
  // Filter change handler
  // --------------------------------------------------
  const handleFilterChange = useCallback(
    // Filtering is a future enhancement; orbit controls handle zoom natively.
    (_categories: Set<AgentCategory>) => {},
    [],
  );

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="w-screen h-screen relative">
      <SceneRoot swarmEnvironment={swarm.environment}>
        <PerformanceProvider>
          <Environment swarmEnvironment={swarm.environment} />
          <ParticleField color={envColor} count={200} />

          {/* Agent nodes */}
          {agentArray.map((agent) => {
            const pos = agentPositions.current.get(agent.id)!;
            return (
              <AgentNode
                key={agent.id}
                agentState={agent}
                position={pos}
                onSelect={setSelectedAgent}
              />
            );
          })}

          {/* Interaction beams */}
          {activeBeams.map((beam) => {
            const fromPos = agentPositions.current.get(beam.sourceAgentId);
            const toPos = agentPositions.current.get(beam.targetAgentId);
            if (!fromPos || !toPos) return null;
            return (
              <InteractionBeam
                key={beam.id}
                from={fromPos}
                to={toPos}
                color={beam.color}
                life={beam.life}
                maxLife={beam.maxLife}
              />
            );
          })}

          <PostProcessing />
        </PerformanceProvider>
      </SceneRoot>

      {/* HTML overlays */}
      <SwarmOverview swarm={swarm} connected={connected} />
      <Controls
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onResetView={() => {}}
        onFilterChange={handleFilterChange}
      />
      <DetailPanel
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
}
