import {
  AgentCategory,
  type AgentState,
  type InteractionEvent,
  type SwarmState,
  type SwarmEnvironmentState,
  type VisualizerState,
} from '../src/types/agent.js';
import { categorizeAgent } from './agent-categorizer.js';
import { detectEvents } from './event-detector.js';

export type ToolCaller = (
  toolName: string,
  args?: Record<string, unknown>,
) => Promise<unknown>;

const MOCK_AGENT_DEFS: Array<{ id: string; name: string; type: string; task: string }> = [
  { id: 'agent-001', name: 'Coordinator', type: 'hierarchical-coordinator', task: 'Orchestrating swarm execution' },
  { id: 'agent-002', name: 'MainCoder', type: 'coder', task: 'Implementing auth module' },
  { id: 'agent-003', name: 'Reviewer', type: 'reviewer', task: 'Code review pass on PR #42' },
  { id: 'agent-004', name: 'SecurityAudit', type: 'security-auditor', task: 'Scanning for vulnerabilities' },
  { id: 'agent-005', name: 'UnitTester', type: 'tester', task: 'Writing integration tests' },
  { id: 'agent-006', name: 'Researcher', type: 'researcher', task: 'Analyzing API docs' },
  { id: 'agent-007', name: 'ReleaseBot', type: 'release-manager', task: 'Preparing v2.1.0 release' },
  { id: 'agent-008', name: 'PerfAnalyzer', type: 'perf-analyzer', task: 'Benchmarking hot paths' },
];

const STATUS_NORMALIZE: Record<string, AgentState['status']> = {
  running: 'active', active: 'active', completed: 'complete', complete: 'complete',
  done: 'complete', failed: 'error', error: 'error', crashed: 'error',
  idle: 'idle', waiting: 'idle', pending: 'idle', spawning: 'spawning',
  starting: 'spawning', terminated: 'terminated', stopped: 'terminated', killed: 'terminated',
};

function normalizeStatus(raw: string): AgentState['status'] {
  return STATUS_NORMALIZE[raw.toLowerCase()] ?? 'idle';
}

function deriveSwarmEnvironment(agents: Map<string, AgentState>): SwarmEnvironmentState {
  let activeCount = 0, errorCount = 0, completeCount = 0;
  for (const agent of agents.values()) {
    if (agent.status === 'active') activeCount++;
    if (agent.status === 'error') errorCount++;
    if (agent.status === 'complete') completeCount++;
  }
  if (agents.size === 0) return 'idle';
  if (errorCount > 0) return 'error';
  if (completeCount === agents.size) return 'complete';
  if (activeCount > agents.size * 0.6) return 'heavy';
  if (activeCount > 0) return 'active';
  return 'idle';
}

// Scripted interaction events that fire on specific ticks for a lively demo
interface ScriptedInteraction {
  tick: number;
  sourceIdx: number;
  targetIdx: number;
  type: 'task_handoff' | 'review_request' | 'review_complete' | 'coordinator_delegation' | 'error_escalation';
}

const SCRIPTED_INTERACTIONS: ScriptedInteraction[] = [
  // Coordinator delegates to coder
  { tick: 5, sourceIdx: 0, targetIdx: 1, type: 'coordinator_delegation' },
  // Coder sends to reviewer
  { tick: 15, sourceIdx: 1, targetIdx: 2, type: 'review_request' },
  // Coordinator delegates to tester
  { tick: 20, sourceIdx: 0, targetIdx: 4, type: 'coordinator_delegation' },
  // Reviewer approves coder's work
  { tick: 30, sourceIdx: 2, targetIdx: 1, type: 'review_complete' },
  // Coder hands off to security
  { tick: 35, sourceIdx: 1, targetIdx: 3, type: 'task_handoff' },
  // Researcher delivers findings to coder
  { tick: 40, sourceIdx: 5, targetIdx: 1, type: 'task_handoff' },
  // Coordinator checks in with release bot
  { tick: 50, sourceIdx: 0, targetIdx: 6, type: 'coordinator_delegation' },
  // Tester reports to reviewer
  { tick: 55, sourceIdx: 4, targetIdx: 2, type: 'task_handoff' },
  // Security escalates issue to debugger
  { tick: 60, sourceIdx: 3, targetIdx: 7, type: 'error_escalation' },
  // Coordinator delegates again
  { tick: 70, sourceIdx: 0, targetIdx: 5, type: 'coordinator_delegation' },
  // Coder sends another review
  { tick: 80, sourceIdx: 1, targetIdx: 2, type: 'review_request' },
  // Release bot hands to tester for final check
  { tick: 85, sourceIdx: 6, targetIdx: 4, type: 'task_handoff' },
  // Reviewer approves
  { tick: 95, sourceIdx: 2, targetIdx: 1, type: 'review_complete' },
  // Coordinator final delegation
  { tick: 100, sourceIdx: 0, targetIdx: 6, type: 'coordinator_delegation' },
];

export class McpBridge {
  private toolCaller: ToolCaller | null;
  private previousAgents: Map<string, AgentState> = new Map();
  private mockTick = 0;
  private startTime = Date.now();
  private scriptedEventId = 0;

  constructor(toolCaller?: ToolCaller) {
    this.toolCaller = toolCaller ?? null;
  }

  async poll(): Promise<VisualizerState> {
    if (this.toolCaller) return this.pollLive();
    return this.pollMock();
  }

  private pollMock(): VisualizerState {
    this.mockTick++;
    const tick = this.mockTick;

    // All 8 agents from the start
    const agentCount = MOCK_AGENT_DEFS.length;
    const agents = new Map<string, AgentState>();

    for (let i = 0; i < agentCount; i++) {
      const def = MOCK_AGENT_DEFS[i];

      // Each agent progresses at a different rate and phase
      const rates = [1.5, 2.5, 1.8, 1.2, 2.0, 1.6, 0.8, 2.2];
      const phases = [0, 20, 45, 10, 55, 30, 70, 15];
      const rawProgress = (tick * rates[i] + phases[i]) % 130;
      const progress = Math.min(Math.max(rawProgress, 0), 100);

      // Varied statuses — not everyone is "active"
      let status: AgentState['status'];
      if (rawProgress >= 110) {
        status = 'complete'; // completed, celebrating
      } else if (rawProgress >= 100) {
        status = 'idle'; // finished task, waiting for next
      } else if (i === 3 && tick >= 58 && tick <= 72) {
        status = 'error'; // security finds a bug for a while
      } else {
        status = 'active';
      }

      // Dynamic dependencies based on current scripted interactions
      const dependencies: string[] = [];
      const dependents: string[] = [];

      // Coordinator always has dependents
      if (i === 0) {
        for (let j = 1; j < agentCount; j++) {
          dependents.push(MOCK_AGENT_DEFS[j].id);
        }
      } else {
        dependencies.push(MOCK_AGENT_DEFS[0].id); // everyone depends on coordinator
      }

      // Coder ↔ Reviewer dependency
      if (i === 1) dependents.push('agent-003');
      if (i === 2) dependencies.push('agent-002');

      const logMessages = [
        `[tick ${tick}] Progress: ${Math.round(progress)}%`,
        status === 'error' ? `[WARN] Vulnerability detected in auth module` : '',
        status === 'complete' ? `[DONE] Task completed successfully` : '',
        status === 'active' ? `Working on: ${def.task}` : '',
      ].filter(Boolean);

      agents.set(def.id, {
        id: def.id,
        name: def.name,
        type: def.type,
        category: categorizeAgent(def.type),
        status,
        progress: status === 'complete' ? 100 : progress,
        taskDescription: def.task,
        elapsedMs: Date.now() - this.startTime,
        logs: logMessages,
        dependencies,
        dependents,
      });
    }

    // Generate interactions from both the event detector AND scripted events
    const detectedInteractions = detectEvents(this.previousAgents, agents);

    // Add scripted interactions that fire on this tick (loop every 110 ticks)
    const loopedTick = tick % 110;
    const scriptedInteractions: InteractionEvent[] = [];

    for (const script of SCRIPTED_INTERACTIONS) {
      if (script.tick === loopedTick && script.sourceIdx < agentCount && script.targetIdx < agentCount) {
        scriptedInteractions.push({
          id: `scripted_${this.scriptedEventId++}`,
          type: script.type,
          priority: 'physical',
          sourceAgentId: MOCK_AGENT_DEFS[script.sourceIdx].id,
          targetAgentId: MOCK_AGENT_DEFS[script.targetIdx].id,
          timestamp: Date.now(),
        });
      }
    }

    const interactions = [...detectedInteractions, ...scriptedInteractions];
    this.previousAgents = new Map(agents);

    const activeAgents = [...agents.values()].filter(a => a.status === 'active').length;
    const errorCount = [...agents.values()].filter(a => a.status === 'error').length;

    return {
      agents,
      interactions,
      swarm: {
        environment: deriveSwarmEnvironment(agents),
        totalAgents: agents.size,
        activeAgents,
        errorCount,
        elapsedMs: Date.now() - this.startTime,
      },
    };
  }

  private async pollLive(): Promise<VisualizerState> {
    const agents = new Map<string, AgentState>();
    try {
      const agentListRaw = await this.toolCaller!('agent_list', {});
      const agentList = Array.isArray(agentListRaw) ? agentListRaw : [];
      for (const entry of agentList) {
        const id = entry.id ?? entry.name ?? 'unknown';
        const type = entry.type ?? 'coder';
        let statusRaw: unknown;
        try { statusRaw = await this.toolCaller!('agent_status', { agent_id: id }); } catch { statusRaw = {}; }
        const statusObj = (typeof statusRaw === 'object' && statusRaw !== null ? statusRaw : {}) as Record<string, unknown>;
        agents.set(id, {
          id, name: (entry.name as string) ?? id, type,
          category: categorizeAgent(type),
          status: normalizeStatus(String(statusObj.status ?? entry.status ?? 'idle')),
          progress: Number(statusObj.progress ?? entry.progress ?? 0),
          taskDescription: String(statusObj.task ?? entry.task ?? ''),
          elapsedMs: Number(statusObj.elapsed_ms ?? 0),
          logs: Array.isArray(statusObj.logs) ? statusObj.logs.map(String) : [],
          dependencies: Array.isArray(entry.dependencies) ? entry.dependencies.map(String) : [],
          dependents: Array.isArray(entry.dependents) ? entry.dependents.map(String) : [],
        });
      }
    } catch (err) { console.error('[McpBridge] Failed to fetch agent list:', err); }

    const interactions = detectEvents(this.previousAgents, agents);
    this.previousAgents = new Map(agents);

    let swarmRaw: Record<string, unknown> = {};
    try { const result = await this.toolCaller!('swarm_status', {}); swarmRaw = (typeof result === 'object' && result !== null ? result : {}) as Record<string, unknown>; } catch {}

    const activeAgents = [...agents.values()].filter(a => a.status === 'active').length;
    const errorCount = [...agents.values()].filter(a => a.status === 'error').length;

    return {
      agents, interactions,
      swarm: {
        environment: (swarmRaw.environment as SwarmEnvironmentState) ?? deriveSwarmEnvironment(agents),
        totalAgents: agents.size, activeAgents, errorCount,
        elapsedMs: Number(swarmRaw.elapsed_ms ?? Date.now() - this.startTime),
      },
    };
  }
}
