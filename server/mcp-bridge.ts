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

/**
 * A tool caller function that invokes MCP tools by name.
 * In live mode, this would be provided by the MCP client SDK.
 */
export type ToolCaller = (
  toolName: string,
  args?: Record<string, unknown>,
) => Promise<unknown>;

const MOCK_AGENT_DEFS: Array<{ id: string; name: string; type: string; task: string }> = [
  { id: 'agent-001', name: 'Coordinator', type: 'hierarchical-coordinator', task: 'Orchestrating swarm execution' },
  { id: 'agent-002', name: 'MainCoder', type: 'coder', task: 'Implementing core module' },
  { id: 'agent-003', name: 'Reviewer', type: 'reviewer', task: 'Code review pass' },
  { id: 'agent-004', name: 'SecurityAudit', type: 'security-auditor', task: 'Scanning for vulnerabilities' },
  { id: 'agent-005', name: 'UnitTester', type: 'tester', task: 'Writing unit tests' },
  { id: 'agent-006', name: 'Researcher', type: 'researcher', task: 'Gathering API documentation' },
  { id: 'agent-007', name: 'ReleaseBot', type: 'release-manager', task: 'Preparing release artifacts' },
  { id: 'agent-008', name: 'PerfAnalyzer', type: 'perf-analyzer', task: 'Benchmarking hot paths' },
];

const STATUS_NORMALIZE: Record<string, AgentState['status']> = {
  running: 'active',
  active: 'active',
  completed: 'complete',
  complete: 'complete',
  done: 'complete',
  failed: 'error',
  error: 'error',
  crashed: 'error',
  idle: 'idle',
  waiting: 'idle',
  pending: 'idle',
  spawning: 'spawning',
  starting: 'spawning',
  terminated: 'terminated',
  stopped: 'terminated',
  killed: 'terminated',
};

function normalizeStatus(raw: string): AgentState['status'] {
  return STATUS_NORMALIZE[raw.toLowerCase()] ?? 'idle';
}

function deriveSwarmEnvironment(agents: Map<string, AgentState>): SwarmEnvironmentState {
  let activeCount = 0;
  let errorCount = 0;
  let completeCount = 0;

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

export class McpBridge {
  private toolCaller: ToolCaller | null;
  private previousAgents: Map<string, AgentState> = new Map();
  private mockTick = 0;
  private startTime = Date.now();

  constructor(toolCaller?: ToolCaller) {
    this.toolCaller = toolCaller ?? null;
  }

  async poll(): Promise<VisualizerState> {
    if (this.toolCaller) {
      return this.pollLive();
    }
    return this.pollMock();
  }

  private pollMock(): VisualizerState {
    this.mockTick++;

    // Gradually introduce agents: start with 3, add one every 3 ticks up to 8
    const agentCount = Math.min(3 + Math.floor(this.mockTick / 3), MOCK_AGENT_DEFS.length);
    const agents = new Map<string, AgentState>();

    for (let i = 0; i < agentCount; i++) {
      const def = MOCK_AGENT_DEFS[i];
      const offset = i * 12;
      const rawProgress = (this.mockTick * 3 + offset) % 110;
      const progress = Math.min(rawProgress, 100);
      const status: AgentState['status'] = rawProgress >= 100 ? 'complete' : 'active';

      const dependencies: string[] = [];
      if (i > 0) {
        dependencies.push(MOCK_AGENT_DEFS[i - 1].id);
      }

      const dependents: string[] = [];
      if (i < agentCount - 1) {
        dependents.push(MOCK_AGENT_DEFS[i + 1].id);
      }

      agents.set(def.id, {
        id: def.id,
        name: def.name,
        type: def.type,
        category: categorizeAgent(def.type),
        status,
        progress,
        taskDescription: def.task,
        elapsedMs: Date.now() - this.startTime,
        logs: [`[tick ${this.mockTick}] Progress: ${progress}%`],
        dependencies,
        dependents,
      });
    }

    const interactions = detectEvents(this.previousAgents, agents);
    this.previousAgents = new Map(agents);

    const activeAgents = [...agents.values()].filter(a => a.status === 'active').length;
    const errorCount = [...agents.values()].filter(a => a.status === 'error').length;

    const swarm: SwarmState = {
      environment: deriveSwarmEnvironment(agents),
      totalAgents: agents.size,
      activeAgents,
      errorCount,
      elapsedMs: Date.now() - this.startTime,
    };

    return { agents, interactions, swarm };
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
        try {
          statusRaw = await this.toolCaller!('agent_status', { agent_id: id });
        } catch {
          statusRaw = {};
        }

        const statusObj = (typeof statusRaw === 'object' && statusRaw !== null ? statusRaw : {}) as Record<string, unknown>;

        agents.set(id, {
          id,
          name: (entry.name as string) ?? id,
          type,
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
    } catch (err) {
      console.error('[McpBridge] Failed to fetch agent list:', err);
    }

    const interactions = detectEvents(this.previousAgents, agents);
    this.previousAgents = new Map(agents);

    let swarmRaw: Record<string, unknown> = {};
    try {
      const result = await this.toolCaller!('swarm_status', {});
      swarmRaw = (typeof result === 'object' && result !== null ? result : {}) as Record<string, unknown>;
    } catch {
      // swarm may not be active
    }

    const activeAgents = [...agents.values()].filter(a => a.status === 'active').length;
    const errorCount = [...agents.values()].filter(a => a.status === 'error').length;

    const swarm: SwarmState = {
      environment: (swarmRaw.environment as SwarmEnvironmentState) ?? deriveSwarmEnvironment(agents),
      totalAgents: agents.size,
      activeAgents,
      errorCount,
      elapsedMs: Number(swarmRaw.elapsed_ms ?? Date.now() - this.startTime),
    };

    return { agents, interactions, swarm };
  }
}
