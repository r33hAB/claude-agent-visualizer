/**
 * Lightweight MCP client that spawns the claude-flow CLI as a child process
 * and communicates via JSON-RPC over stdio.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface, type Interface } from 'node:readline';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export class McpClient {
  private proc: ChildProcess | null = null;
  private rl: Interface | null = null;
  private requestId = 0;
  private pending = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
  }>();
  private ready = false;
  private buffer = '';

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.proc = spawn('npx', ['-y', '@claude-flow/cli@latest'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env },
        });

        this.proc.on('error', (err) => {
          console.error('[mcp-client] Process error:', err.message);
          reject(err);
        });

        this.proc.on('exit', (code) => {
          console.log(`[mcp-client] Process exited with code ${code}`);
          this.ready = false;
        });

        // Read JSON-RPC responses from stdout
        if (this.proc.stdout) {
          this.proc.stdout.on('data', (chunk: Buffer) => {
            this.buffer += chunk.toString();
            // Try to parse complete JSON objects
            const lines = this.buffer.split('\n');
            this.buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('{')) continue;
              try {
                const msg = JSON.parse(trimmed) as JsonRpcResponse;
                if (msg.id !== undefined && this.pending.has(msg.id)) {
                  const p = this.pending.get(msg.id)!;
                  this.pending.delete(msg.id);
                  if (msg.error) {
                    p.reject(new Error(msg.error.message));
                  } else {
                    p.resolve(msg.result);
                  }
                }
              } catch {
                // Not JSON, ignore
              }
            }
          });
        }

        // Log stderr
        if (this.proc.stderr) {
          this.proc.stderr.on('data', (chunk: Buffer) => {
            // Suppress noisy stderr
          });
        }

        // Send initialize
        this.ready = true;
        // Give it a moment to start
        setTimeout(() => resolve(), 2000);
      } catch (err) {
        reject(err);
      }
    });
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.ready || !this.proc?.stdin) {
      throw new Error('MCP client not connected');
    }

    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name, arguments: args },
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Timeout calling ${name}`));
        }
      }, 5000);

      this.proc!.stdin!.write(JSON.stringify(request) + '\n');
    });
  }

  disconnect(): void {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
    this.ready = false;
    // Reject all pending
    for (const [id, p] of this.pending) {
      p.reject(new Error('Client disconnected'));
    }
    this.pending.clear();
  }

  isConnected(): boolean {
    return this.ready && this.proc !== null && !this.proc.killed;
  }
}
