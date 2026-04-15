import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import getPort from 'get-port';
import open from 'open';
import { McpBridge, type ToolCaller } from './mcp-bridge.js';
import { categorizeAgent } from './agent-categorizer.js';
import { pollAgents, pollAgentStatus, pollSwarmStatus, isDaemonRunning } from './cli-poller.js';
import type { AgentState, InteractionEvent } from '../src/types/agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PREFERRED_PORT = 3847;
const POLL_INTERVAL_MS = 1500;

const isLive = process.argv.includes('--live');

// ─── Push-based agent registry (for Claude Code subagents) ──────────
const pushedAgents = new Map<string, AgentState>();
const agentStartTimes = new Map<string, number>(); // tracks when each agent was registered
const pushedInteractions: InteractionEvent[] = [];
let interactionIdCounter = 0;

function serializeState(state: Awaited<ReturnType<McpBridge['poll']>>): string {
  // Merge polled agents with pushed agents, computing live elapsed time
  const now = Date.now();
  const mergedAgents = new Map(state.agents);
  for (const [id, agent] of pushedAgents) {
    const startTime = agentStartTimes.get(id) ?? now;
    mergedAgents.set(id, { ...agent, elapsedMs: now - startTime });
  }

  // Merge interactions
  const mergedInteractions = [...state.interactions, ...pushedInteractions];

  return JSON.stringify({
    agents: Object.fromEntries(mergedAgents),
    interactions: mergedInteractions,
    swarm: {
      ...state.swarm,
      totalAgents: mergedAgents.size,
      activeAgents: [...mergedAgents.values()].filter(a => a.status === 'active').length,
    },
  });
}

function createCliToolCaller(): ToolCaller {
  return async (toolName: string, args?: Record<string, unknown>): Promise<unknown> => {
    switch (toolName) {
      case 'agent_list': return pollAgents();
      case 'agent_status': {
        const agentId = String(args?.agent_id ?? args?.agentId ?? '');
        if (!agentId) return {};
        const status = await pollAgentStatus(agentId);
        return {
          status: status['status'] ?? 'active',
          progress: parseFloat(status['progress'] ?? '0') || 0,
          task: status['task'] ?? status['description'] ?? '',
          elapsed_ms: parseFloat(status['elapsed'] ?? '0') || 0,
          logs: [], dependencies: [], dependents: [],
        };
      }
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
  app.use(express.json());

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[ws] Client connected (${clients.size} total)`);
    ws.on('close', () => { clients.delete(ws); console.log(`[ws] Client disconnected (${clients.size} total)`); });
    ws.on('error', (err) => { console.error('[ws] Client error:', err.message); clients.delete(ws); });
  });

  // Initialize bridge
  let bridge: McpBridge;
  if (isLive) {
    console.log('[server] LIVE MODE — connecting to claude-flow daemon...');
    const daemonUp = await isDaemonRunning();
    if (daemonUp) {
      bridge = new McpBridge(createCliToolCaller());
      console.log('[server] Connected to claude-flow daemon.');
    } else {
      console.log('[server] No daemon running. Using push-only mode (agents via REST API).');
      bridge = new McpBridge(); // mock fallback, but pushed agents will override
    }
  } else {
    console.log('[server] MOCK MODE — simulated agents.');
    bridge = new McpBridge();
  }

  // ─── REST API for pushing agent state from Claude Code ──────────

  // Register or update an agent (incremental — only provided fields are changed)
  // POST /api/agent { id, name?, type?, status?, progress?, task?, log?, dependencies?, dependents? }
  // - First call with an id creates the agent
  // - Subsequent calls patch only the fields you send
  // - "log" (string) appends a single log line; "logs" (array) replaces all logs
  app.post('/api/agent', (req, res) => {
    const { id, name, type, status, progress, task, log, logs, dependencies, dependents } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = pushedAgents.get(id);

    if (existing) {
      // Incremental update — only patch provided fields
      if (name !== undefined) existing.name = name;
      if (type !== undefined) { existing.type = type; existing.category = categorizeAgent(type); }
      if (status !== undefined) existing.status = status;
      if (progress !== undefined) existing.progress = progress;
      if (task !== undefined) existing.taskDescription = task;
      if (dependencies !== undefined) existing.dependencies = dependencies;
      if (dependents !== undefined) existing.dependents = dependents;
      // "log" appends a single line with timestamp
      if (typeof log === 'string') {
        existing.logs.push(`[${new Date().toLocaleTimeString()}] ${log}`);
        // Keep last 50 log lines
        if (existing.logs.length > 50) existing.logs = existing.logs.slice(-50);
      }
      // "logs" replaces all logs
      if (Array.isArray(logs)) existing.logs = logs;

      console.log(`[api] Agent updated: ${id} (${status ?? existing.status}, ${progress ?? existing.progress}%)`);
      res.json({ ok: true, agent: id, action: 'updated' });
    } else {
      // New agent registration
      const agentType = type || 'coder';
      const agent: AgentState = {
        id,
        name: name || id,
        type: agentType,
        category: categorizeAgent(agentType),
        status: status || 'active',
        progress: progress ?? 0,
        taskDescription: task || '',
        elapsedMs: 0,
        logs: typeof log === 'string'
          ? [`[${new Date().toLocaleTimeString()}] ${log}`]
          : (logs || []),
        dependencies: dependencies || [],
        dependents: dependents || [],
      };
      pushedAgents.set(id, agent);
      agentStartTimes.set(id, Date.now());
      console.log(`[api] Agent registered: ${id} (${agentType}, ${status || 'active'}) — "${task || ''}" `);
      res.json({ ok: true, agent: id, action: 'created' });
    }
  });

  // Remove an agent
  // DELETE /api/agent/:id
  app.delete('/api/agent/:id', (req, res) => {
    const { id } = req.params;
    if (pushedAgents.has(id)) {
      pushedAgents.delete(id);
      agentStartTimes.delete(id);
      console.log(`[api] Agent removed: ${id}`);
      res.json({ ok: true });
    } else {
      res.status(404).json({ error: 'Agent not found' });
    }
  });

  // Push an interaction event
  // POST /api/interaction { sourceAgentId, targetAgentId, type }
  app.post('/api/interaction', (req, res) => {
    const { sourceAgentId, targetAgentId, type } = req.body;
    if (!sourceAgentId || !targetAgentId) {
      return res.status(400).json({ error: 'sourceAgentId and targetAgentId required' });
    }
    const event: InteractionEvent = {
      id: `push_${interactionIdCounter++}`,
      type: type || 'task_handoff',
      priority: 'physical',
      sourceAgentId,
      targetAgentId,
      timestamp: Date.now(),
    };
    pushedInteractions.push(event);
    // Clean old interactions (keep last 20)
    while (pushedInteractions.length > 20) pushedInteractions.shift();
    console.log(`[api] Interaction: ${sourceAgentId} → ${targetAgentId} (${type || 'task_handoff'})`);
    res.json({ ok: true, id: event.id });
  });

  // List all pushed agents
  app.get('/api/agents', (_req, res) => {
    res.json(Object.fromEntries(pushedAgents));
  });

  // Clear all pushed agents
  app.delete('/api/agents', (_req, res) => {
    pushedAgents.clear();
    agentStartTimes.clear();
    console.log('[api] All pushed agents cleared');
    res.json({ ok: true });
  });

  // ─── Poll loop ──────────────────────────────────────────────────
  const pollLoop = setInterval(async () => {
    try {
      const state = await bridge.poll();
      const payload = serializeState(state);
      for (const ws of clients) {
        if (ws.readyState === ws.OPEN) ws.send(payload);
      }
    } catch (err) {
      console.error('[poll] Error:', err);
    }
  }, POLL_INTERVAL_MS);

  // ─── Static files + health ──────────────────────────────────────
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      mode: isLive ? 'live' : 'mock',
      clients: clients.size,
      pushedAgents: pushedAgents.size,
    });
  });

  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });

  httpServer.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('');
    console.log(`  Agent Visualizer running at ${url}`);
    console.log(`  Mode: ${isLive ? 'LIVE (daemon + push API)' : 'MOCK (demo data + push API)'}`);
    console.log('');
    console.log('  Push API:');
    console.log(`    POST   ${url}/api/agent         — register/update agent`);
    console.log(`    DELETE ${url}/api/agent/:id      — remove agent`);
    console.log(`    POST   ${url}/api/interaction    — push interaction event`);
    console.log(`    GET    ${url}/api/agents         — list pushed agents`);
    console.log('');
    open(url).catch(() => {});
  });

  const shutdown = () => {
    console.log('\n[server] Shutting down...');
    clearInterval(pollLoop);
    for (const ws of clients) ws.close();
    clients.clear();
    httpServer.close(() => { console.log('[server] Goodbye.'); process.exit(0); });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => { console.error('[server] Fatal:', err); process.exit(1); });
