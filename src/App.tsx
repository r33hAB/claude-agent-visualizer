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
import KeybindsOverlay from './components/KeybindsOverlay';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_POSITIONS: [number, number, number][] = [
  [0, 0, 0],
  [-10, 0, -8],
  [10, 0, -8],
  [-14, 0, 4],
  [14, 0, 4],
  [0, 0, 12],
  [-8, 0, -16],
  [8, 0, -16],
  [-18, 0, 0],
  [18, 0, 0],
  [-10, 0, 14],
  [10, 0, 14],
  [0, 0, -12],
  [-16, 0, -12],
  [16, 0, -12],
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

interface WalkInfo {
  targetPosition: [number, number, number];
  color: string;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function assignPosition(index: number): [number, number, number] {
  if (index < AGENT_POSITIONS.length) return AGENT_POSITIONS[index];
  const ring = Math.ceil(Math.sqrt(index - AGENT_POSITIONS.length + 1));
  const angle = ((index - AGENT_POSITIONS.length) / 6) * Math.PI * 2;
  const radius = ring * 8;
  return [Math.round(Math.cos(angle) * radius), 0, Math.round(Math.sin(angle) * radius)];
}

export function App() {
  const { agents, interactions, swarm, connected } = useAgentData();
  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [activeBeams, setActiveBeams] = useState<ActiveBeam[]>([]);
  const [walkCommands, setWalkCommands] = useState<Map<string, WalkInfo>>(new Map());

  const agentPositions = useRef(new Map<string, [number, number, number]>());
  const processedInteractionIds = useRef(new Set<string>());

  // Assign positions
  const agentArray = Array.from(agents.values());
  let nextIndex = agentPositions.current.size;
  for (const agent of agentArray) {
    if (!agentPositions.current.has(agent.id)) {
      agentPositions.current.set(agent.id, assignPosition(nextIndex));
      nextIndex++;
    }
  }

  // Keep selectedAgent in sync
  useEffect(() => {
    if (selectedAgent) {
      const updated = agents.get(selectedAgent.id);
      if (updated) setSelectedAgent(updated);
      else setSelectedAgent(null);
    }
  }, [agents]); // eslint-disable-line react-hooks/exhaustive-deps

  // Convert interactions → beams + walk commands
  useEffect(() => {
    if (interactions.length === 0) return;

    const newBeams: ActiveBeam[] = [];
    const newWalks = new Map(walkCommands);

    for (const event of interactions) {
      if (processedInteractionIds.current.has(event.id)) continue;
      processedInteractionIds.current.add(event.id);

      const fromPos = agentPositions.current.get(event.sourceAgentId);
      const toPos = agentPositions.current.get(event.targetAgentId);

      // Create beam
      newBeams.push({
        id: event.id,
        sourceAgentId: event.sourceAgentId,
        targetAgentId: event.targetAgentId,
        color: BEAM_COLORS[event.type] ?? '#60a5fa',
        life: 0,
        maxLife: 4, // longer beams so you can see them
        startTime: Date.now(),
      });

      // Physical interactions → source agent walks to target
      if (event.priority === 'physical' && toPos) {
        newWalks.set(event.sourceAgentId, {
          targetPosition: toPos,
          color: BEAM_COLORS[event.type] ?? '#60a5fa',
        });
      }
    }

    if (newBeams.length > 0) {
      setActiveBeams(prev => [...prev, ...newBeams]);
    }
    if (newWalks.size !== walkCommands.size) {
      setWalkCommands(newWalks);
    }
  }, [interactions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Beam lifecycle
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBeams(prev => {
        const now = Date.now();
        const next: ActiveBeam[] = [];
        for (const beam of prev) {
          const elapsed = (now - beam.startTime) / 1000;
          if (elapsed < beam.maxLife) next.push({ ...beam, life: elapsed });
        }
        return next.length === prev.length ? prev : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Handle walk completion — remove the walk command for that agent
  const handleWalkComplete = useCallback((agentId: string) => {
    setWalkCommands(prev => {
      const next = new Map(prev);
      next.delete(agentId);
      return next;
    });
  }, []);

  const envColor = ENV_COLORS[swarm.environment] ?? ENV_COLORS.active;

  const handleFilterChange = useCallback((_categories: Set<AgentCategory>) => {}, []);

  return (
    <div className="w-screen h-screen relative">
      <SceneRoot swarmEnvironment={swarm.environment}>
        <PerformanceProvider>
          <Environment swarmEnvironment={swarm.environment} />
          <ParticleField color={envColor} count={200} />

          {agentArray.map((agent) => {
            const pos = agentPositions.current.get(agent.id)!;
            const walkInfo = walkCommands.get(agent.id);
            return (
              <AgentNode
                key={agent.id}
                agentState={agent}
                position={pos}
                walkTarget={walkInfo?.targetPosition ?? null}
                interactionColor={walkInfo?.color}
                onSelect={setSelectedAgent}
                onWalkComplete={() => handleWalkComplete(agent.id)}
              />
            );
          })}

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
      <KeybindsOverlay />
    </div>
  );
}
