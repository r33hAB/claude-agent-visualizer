import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import getPort from 'get-port';
import open from 'open';
import { McpBridge, type ToolCaller } from './mcp-bridge.js';
import { pollAgents, pollAgentStatus, pollSwarmStatus, isDaemonRunning } from './cli-poller.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PREFERRED_PORT = 3847;
const POLL_INTERVAL_MS = 1500;

const isLive = process.argv.includes('--live');

function serializeState(state: Awaited<ReturnType<McpBridge['poll']>>): string {
  return JSON.stringify({
    agents: Object.fromEntries(state.agents),
    interactions: state.interactions,
    swarm: state.swarm,
  });
}

/**
 * Build a ToolCaller that shells out to the claude-flow CLI.
 * Maps MCP tool names to CLI commands.
 */
function createCliToolCaller(): ToolCaller {
  return async (toolName: string, args?: Record<string, unknown>): Promise<unknown> => {
    switch (toolName) {
      case 'agent_list': {
        const agents = await pollAgents();
        return agents;
      }
      case 'agent_status': {
        const agentId = String(args?.agent_id ?? args?.agentId ?? '');
        if (!agentId) return {};
        const status = await pollAgentStatus(agentId);
        return {
          status: status['status'] ?? 'active',
          progress: parseFloat(status['progress'] ?? '0') || 0,
          task: status['task'] ?? status['description'] ?? '',
          elapsed_ms: parseFloat(status['elapsed'] ?? '0') || 0,
          logs: [],
          dependencies: [],
          dependents: [],
        };
      }
      case 'swarm_status': {
        const swarm = await pollSwarmStatus();
        return {
          state: swarm.state,
          totalAgents: swarm.agentCount,
          environment: swarm.active ? 'active' : 'idle',
        };
      }
      default:
        return {};
    }
  };
}

async function main(): Promise<void> {
  const port = await getPort({ port: PREFERRED_PORT });
  const app = express();
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[ws] Client connected (${clients.size} total)`);
    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[ws] Client disconnected (${clients.size} total)`);
    });
    ws.on('error', (err) => {
      console.error('[ws] Client error:', err.message);
      clients.delete(ws);
    });
  });

  // Initialize bridge
  let bridge: McpBridge;

  if (isLive) {
    console.log('[server] LIVE MODE — connecting to claude-flow daemon...');
    const daemonUp = await isDaemonRunning();
    if (!daemonUp) {
      console.warn('[server] WARNING: claude-flow daemon not running. Starting it...');
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const exec = promisify(execFile);
      try {
        await exec('npx', ['-y', '@claude-flow/cli@latest', 'daemon', 'start'], { timeout: 10000 });
        console.log('[server] Daemon started.');
      } catch (err) {
        console.error('[server] Failed to start daemon. Falling back to mock mode.');
        bridge = new McpBridge();
        startServer();
        return;
      }
    }
    const toolCaller = createCliToolCaller();
    bridge = new McpBridge(toolCaller);
    console.log('[server] Connected to claude-flow. Polling live agent data.');
  } else {
    console.log('[server] MOCK MODE — using simulated agent data.');
    console.log('[server] Use --live flag to connect to a running claude-flow session.');
    bridge = new McpBridge();
  }

  function startServer() {
    // Poll loop
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

    // Serve built frontend
    const distPath = join(__dirname, '..', 'dist');
    app.use(express.static(distPath));

    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', mode: isLive ? 'live' : 'mock', clients: clients.size });
    });

    app.get('/{*splat}', (_req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });

    httpServer.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.log(`[server] Listening on ${url}`);
      console.log(`[server] Mode: ${isLive ? 'LIVE' : 'MOCK'}`);
      console.log(`[server] WebSocket: ws://localhost:${port}/ws`);
      open(url).catch(() => {});
    });

    const shutdown = () => {
      console.log('\n[server] Shutting down...');
      clearInterval(pollLoop);
      for (const ws of clients) ws.close();
      clients.clear();
      httpServer.close(() => {
        console.log('[server] Goodbye.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  startServer();
}

main().catch((err) => {
  console.error('[server] Fatal error:', err);
  process.exit(1);
});
