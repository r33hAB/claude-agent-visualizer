import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import getPort from 'get-port';
import open from 'open';
import { McpBridge, type ToolCaller } from './mcp-bridge.js';
import { categorizeAgent } from './agent-categorizer.js';
import { pollAgents, pollSwarmStatus, isDaemonRunning } from './cli-poller.js';
import type { AgentState, InteractionEvent, SwarmEnvironmentState } from '../src/types/agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREFERRED_PORT = 3847;
const POLL_INTERVAL_MS = 1500;
const MAX_PUSHED_AGENTS = 100;
const MAX_INTERACTIONS = 30;
const AGENT_ID_PATTERN = /^[a-zA-Z0-9_.-]+$/;
const AGENT_TTL_MS = 5000; // Time before completed/errored agents are removed
const AGENT_EXIT_DELAY_MS = 3000; // Delay before transitioning to 'terminated'

const mode = process.argv.includes('--live') ? 'live'
  : process.argv.includes('--push') ? 'push'
  : 'mock';

// ─── Push-based agent registry ──────────────────────────────────────
const pushedAgents = new Map<string, AgentState>();
const agentStartTimes = new Map<string, number>();
const agentRemovalTimers = new Map<string, NodeJS.Timeout>();
const pushedInteractions: InteractionEvent[] = [];
let interactionIdCounter = 0;

/** Schedule an agent for walk-off and removal after TTL */
function scheduleAgentRemoval(id: string): void {
  // Don't double-schedule
  if (agentRemovalTimers.has(id)) return;

  // After AGENT_EXIT_DELAY_MS, transition to 'terminated' (triggers exit animation)
  const timer = setTimeout(() => {
    const agent = pushedAgents.get(id);
    if (agent && (agent.status === 'complete' || agent.status === 'error')) {
      agent.status = 'terminated';
    }
    // After remaining time, remove entirely
    setTimeout(() => {
      pushedAgents.delete(id);
      agentStartTimes.delete(id);
      agentRemovalTimers.delete(id);
      console.log(`[ttl] Removed ${id} from stage`);
    }, AGENT_TTL_MS - AGENT_EXIT_DELAY_MS);
  }, AGENT_EXIT_DELAY_MS);

  agentRemovalTimers.set(id, timer);
}

/** Cancel a pending removal (e.g. if agent is reactivated) */
function cancelAgentRemoval(id: string): void {
  const timer = agentRemovalTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    agentRemovalTimers.delete(id);
  }
}

function validateAgentId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length < 128 && AGENT_ID_PATTERN.test(id);
}

function buildSwarmState(): { environment: SwarmEnvironmentState; totalAgents: number; activeAgents: number; errorCount: number; elapsedMs: number } {
  const agents = [...pushedAgents.values()];
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const errorCount = agents.filter(a => a.status === 'error').length;
  const completeCount = agents.filter(a => a.status === 'complete').length;

  let environment: SwarmEnvironmentState = 'idle';
  if (agents.length === 0) environment = 'idle';
  else if (errorCount > 0) environment = 'error';
  else if (completeCount === agents.length) environment = 'complete';
  else if (activeAgents > agents.length * 0.6) environment = 'heavy';
  else if (activeAgents > 0) environment = 'active';

  return { environment, totalAgents: agents.length, activeAgents, errorCount, elapsedMs: 0 };
}

function serializePushOnly(): string {
  const now = Date.now();
  const agents: Record<string, AgentState> = {};
  for (const [id, agent] of pushedAgents) {
    const startTime = agentStartTimes.get(id) ?? now;
    agents[id] = { ...agent, elapsedMs: now - startTime };
  }
  // Clean old interactions
  const cutoff = now - 10000;
  const activeInteractions = pushedInteractions.filter(i => i.timestamp > cutoff);

  return JSON.stringify({
    agents,
    interactions: activeInteractions,
    swarm: buildSwarmState(),
  });
}

function serializeMerged(bridgeState: Awaited<ReturnType<McpBridge['poll']>>): string {
  const now = Date.now();
  const agents: Record<string, AgentState> = {};

  // Bridge agents first (daemon)
  for (const [id, agent] of bridgeState.agents) {
    agents[id] = agent;
  }
  // Pushed agents override — they have richer data (logs, elapsed, progress)
  for (const [id, agent] of pushedAgents) {
    const startTime = agentStartTimes.get(id) ?? now;
    agents[id] = { ...agent, elapsedMs: now - startTime };
  }

  const cutoff = now - 10000;
  const interactions = [
    ...bridgeState.interactions,
    ...pushedInteractions.filter(i => i.timestamp > cutoff),
  ];

  const allAgents = Object.values(agents);
  const activeAgents = allAgents.filter(a => a.status === 'active').length;
  const errorCount = allAgents.filter(a => a.status === 'error').length;

  return JSON.stringify({
    agents,
    interactions,
    swarm: {
      ...bridgeState.swarm,
      totalAgents: allAgents.length,
      activeAgents,
      errorCount,
    },
  });
}

function createCliToolCaller(): ToolCaller {
  return async (toolName: string, _args?: Record<string, unknown>): Promise<unknown> => {
    switch (toolName) {
      case 'agent_list': return pollAgents();
      case 'swarm_status': {
        const swarm = await pollSwarmStatus();
        return { state: swarm.state, totalAgents: swarm.agentCount, environment: swarm.active ? 'active' : 'idle' };
      }
      default: return {};
    }
  };
}

async function main(): Promise<void> {
  const port = await getPort({ port: PREFERRED_PORT });
  const app = express();
  // SECURITY: limit body size
  app.use(express.json({ limit: '16kb' }));

  const httpServer = createServer(app);
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    maxPayload: 1024 * 64, // 64KB max message
  });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[ws] Client connected (${clients.size} total)`);
    ws.on('close', () => { clients.delete(ws); });
    ws.on('error', (err) => { console.error('[ws] error:', err.message); clients.delete(ws); });
  });

  // ─── Bridge setup ─────────────────────────────────────────────────
  let bridge: McpBridge | null = null;

  if (mode === 'live') {
    console.log('[server] LIVE mode — daemon polling + push API');
    const daemonUp = await isDaemonRunning();
    if (daemonUp) {
      bridge = new McpBridge(createCliToolCaller());
      console.log('[server] Daemon connected.');
    } else {
      console.log('[server] No daemon — push-only mode (agents via REST API).');
    }
  } else if (mode === 'mock') {
    console.log('[server] MOCK mode — demo agents + push API');
    bridge = new McpBridge(); // mock data
  } else {
    console.log('[server] PUSH mode — agents via REST API only');
  }

  // ─── Auto-seed demo agents if no bridge and no pushed agents ──────
  if (!bridge && pushedAgents.size === 0) {
    const seeds = [
      { id: 'demo-coder', name: 'MainCoder', type: 'coder', task: 'Implementing feature module' },
      { id: 'demo-reviewer', name: 'CodeReviewer', type: 'reviewer', task: 'Reviewing pull request' },
      { id: 'demo-security', name: 'SecAuditor', type: 'security-auditor', task: 'Scanning for vulnerabilities' },
      { id: 'demo-coordinator', name: 'SwarmCoord', type: 'coordinator', task: 'Orchestrating sprint tasks' },
      { id: 'demo-tester', name: 'IntegTester', type: 'tester', task: 'Running integration tests' },
      { id: 'demo-researcher', name: 'DocResearcher', type: 'researcher', task: 'Gathering API documentation' },
    ];
    const now = Date.now();
    for (const s of seeds) {
      pushedAgents.set(s.id, {
        id: s.id, name: s.name, type: s.type,
        category: categorizeAgent(s.type),
        status: 'active', progress: Math.floor(Math.random() * 80) + 10,
        taskDescription: s.task, elapsedMs: 0,
        logs: [`[${new Date().toLocaleTimeString()}] Agent started`],
        dependencies: [], dependents: [],
      });
      agentStartTimes.set(s.id, now - Math.floor(Math.random() * 60000));
    }
    console.log(`[server] Seeded ${seeds.length} demo agents.`);
  }

  // ─── REST API ─────────────────────────────────────────────────────

  app.post('/api/agent', (req, res) => {
    const { id, name, type, status, progress, task, log, logs, dependencies, dependents } = req.body;
    if (!validateAgentId(id)) {
      return res.status(400).json({ error: 'Invalid id. Use alphanumeric, hyphens, underscores, dots. Max 128 chars.' });
    }

    // SECURITY: validate types
    const validStatuses = ['active', 'idle', 'complete', 'error', 'spawning', 'terminated'];
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
      return res.status(400).json({ error: 'progress must be a number 0-100' });
    }

    const existing = pushedAgents.get(id);

    if (existing) {
      if (name !== undefined) existing.name = String(name);
      if (type !== undefined) { existing.type = String(type); existing.category = categorizeAgent(String(type)); }
      if (status !== undefined) {
        existing.status = status;
        // Schedule removal for completed/errored agents
        if (status === 'complete' || status === 'error') {
          scheduleAgentRemoval(id);
        } else if (status === 'active' || status === 'idle' || status === 'spawning') {
          // Agent reactivated — cancel any pending removal
          cancelAgentRemoval(id);
        }
      }
      if (progress !== undefined) existing.progress = progress;
      if (task !== undefined) existing.taskDescription = String(task);
      if (dependencies !== undefined && Array.isArray(dependencies)) existing.dependencies = dependencies.map(String);
      if (dependents !== undefined && Array.isArray(dependents)) existing.dependents = dependents.map(String);
      if (typeof log === 'string' && log.length < 500) {
        existing.logs.push(`[${new Date().toLocaleTimeString()}] ${log}`);
        if (existing.logs.length > 50) existing.logs = existing.logs.slice(-50);
      }
      if (Array.isArray(logs)) existing.logs = logs.slice(0, 50).map(String);
      res.json({ ok: true, agent: id, action: 'updated' });
    } else {
      if (pushedAgents.size >= MAX_PUSHED_AGENTS) {
        return res.status(429).json({ error: `Max ${MAX_PUSHED_AGENTS} agents. Remove some first.` });
      }
      const agentType = String(type || 'coder');
      pushedAgents.set(id, {
        id: String(id),
        name: String(name || id),
        type: agentType,
        category: categorizeAgent(agentType),
        status: status || 'active',
        progress: progress ?? 0,
        taskDescription: String(task || ''),
        elapsedMs: 0,
        logs: typeof log === 'string' ? [`[${new Date().toLocaleTimeString()}] ${log}`] : (Array.isArray(logs) ? logs.slice(0, 50).map(String) : []),
        dependencies: Array.isArray(dependencies) ? dependencies.map(String) : [],
        dependents: Array.isArray(dependents) ? dependents.map(String) : [],
      });
      agentStartTimes.set(id, Date.now());
      // If created already complete/error, schedule removal
      const initialStatus = status || 'active';
      if (initialStatus === 'complete' || initialStatus === 'error') {
        scheduleAgentRemoval(String(id));
      }
      console.log(`[api] + ${id} (${agentType}) "${task || ''}"`);
      res.json({ ok: true, agent: id, action: 'created' });
    }
  });

  app.delete('/api/agent/:id', (req, res) => {
    const { id } = req.params;
    if (pushedAgents.has(id)) {
      cancelAgentRemoval(id);
      pushedAgents.delete(id);
      agentStartTimes.delete(id);
      res.json({ ok: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  app.post('/api/interaction', (req, res) => {
    const { sourceAgentId, targetAgentId, type } = req.body;
    if (!validateAgentId(sourceAgentId) || !validateAgentId(targetAgentId)) {
      return res.status(400).json({ error: 'Invalid agent IDs' });
    }
    if (pushedInteractions.length >= MAX_INTERACTIONS) pushedInteractions.shift();
    pushedInteractions.push({
      id: `push_${interactionIdCounter++}`,
      type: type || 'task_handoff',
      priority: 'physical',
      sourceAgentId: String(sourceAgentId),
      targetAgentId: String(targetAgentId),
      timestamp: Date.now(),
    });
    res.json({ ok: true });
  });

  app.get('/api/agents', (_req, res) => res.json(Object.fromEntries(pushedAgents)));

  app.delete('/api/agents', (_req, res) => {
    for (const id of agentRemovalTimers.keys()) cancelAgentRemoval(id);
    pushedAgents.clear();
    agentStartTimes.clear();
    pushedInteractions.length = 0;
    res.json({ ok: true });
  });

  // ─── Poll loop ────────────────────────────────────────────────────
  const pollLoop = setInterval(async () => {
    try {
      let payload: string;
      if (bridge) {
        const state = await bridge.poll();
        payload = serializeMerged(state);
      } else {
        payload = serializePushOnly();
      }
      for (const ws of clients) {
        if (ws.readyState === ws.OPEN) ws.send(payload);
      }
    } catch (err) {
      console.error('[poll] Error:', err);
    }
  }, POLL_INTERVAL_MS);

  // ─── Static + health ──────────────────────────────────────────────
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode, clients: clients.size, agents: pushedAgents.size });
  });
  app.get('/{*splat}', (_req, res) => res.sendFile(join(distPath, 'index.html')));

  httpServer.listen(port, () => {
    console.log('');
    console.log(`  DevStage: http://localhost:${port}`);
    console.log(`  Mode: ${mode.toUpperCase()}`);
    console.log(`  API:  POST http://localhost:${port}/api/agent`);
    console.log('');
    open(`http://localhost:${port}`).catch(() => {});
  });

  const shutdown = () => {
    clearInterval(pollLoop);
    for (const id of agentRemovalTimers.keys()) cancelAgentRemoval(id);
    for (const ws of clients) ws.close();
    httpServer.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => { console.error('[server] Fatal:', err); process.exit(1); });
