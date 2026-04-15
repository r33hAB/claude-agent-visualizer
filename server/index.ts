import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import getPort from 'get-port';
import open from 'open';
import { McpBridge } from './mcp-bridge.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PREFERRED_PORT = 3847;
const POLL_INTERVAL_MS = 1500;

/**
 * Serializes VisualizerState for JSON transport.
 * Converts the agents Map into a plain object keyed by agent ID.
 */
function serializeState(state: Awaited<ReturnType<McpBridge['poll']>>): string {
  return JSON.stringify({
    agents: Object.fromEntries(state.agents),
    interactions: state.interactions,
    swarm: state.swarm,
  });
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

  const bridge = new McpBridge(); // dev mode — no toolCaller → mock data

  // Poll loop
  const pollLoop = setInterval(async () => {
    try {
      const state = await bridge.poll();
      const payload = serializeState(state);

      for (const ws of clients) {
        if (ws.readyState === ws.OPEN) {
          ws.send(payload);
        }
      }
    } catch (err) {
      console.error('[poll] Error:', err);
    }
  }, POLL_INTERVAL_MS);

  // Serve built frontend in production mode
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // Health endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', clients: clients.size });
  });

  // SPA fallback (Express 5 requires named param for wildcard)
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });

  httpServer.listen(port, () => {
    const wsUrl = `ws://localhost:${port}/ws`;
    const httpUrl = `http://localhost:${port}`;

    console.log(`[server] HTTP server listening on ${httpUrl}`);
    console.log(`[server] WebSocket endpoint: ${wsUrl}`);
    console.log(`[server] Health check: ${httpUrl}/health`);

    open(httpUrl).catch(() => {
      // Browser open is best-effort
    });
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[server] Shutting down...');
    clearInterval(pollLoop);
    for (const ws of clients) {
      ws.close();
    }
    clients.clear();
    httpServer.close(() => {
      console.log('[server] Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[server] Fatal error:', err);
  process.exit(1);
});
