/**
 * Polls claude-flow state by shelling out to the CLI and parsing output.
 * Simpler and more reliable than MCP stdio for the visualizer use case.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const CLI = 'npx';
const CLI_ARGS = ['-y', '@claude-flow/cli@latest'];
const TIMEOUT = 8000;

interface RawAgent {
  id: string;
  name: string;
  type: string;
  status: string;
  task?: string;
  progress?: number;
  health?: number;
}

interface RawSwarm {
  active: boolean;
  agentCount: number;
  state: string;
}

async function runCli(...args: string[]): Promise<string> {
  try {
    const { stdout } = await exec(CLI, [...CLI_ARGS, ...args], { timeout: TIMEOUT });
    return stdout;
  } catch (err: any) {
    // CLI might exit non-zero for "no agents" etc — that's fine
    return err.stdout ?? '';
  }
}

/**
 * Parse the CLI "agent list" text output into structured data.
 * The CLI outputs a table like:
 *   | ID | Type            | Status | Created     | Last Acti... |
 *   |    | coder           | idle   | 11:55:14 AM | N/A          |
 * Note: ID column is often empty. We use type + index as fallback ID.
 */
function parseAgentList(output: string): RawAgent[] {
  const agents: RawAgent[] = [];
  const lines = output.split('\n');
  const typeCounts = new Map<string, number>();

  for (const line of lines) {
    if (!line.includes('|') || line.includes('---') || line.includes('+--')) continue;
    const parts = line.split('|').map(s => s.trim()).filter(s => s !== '');
    if (parts.length < 2) continue;
    // Skip header row
    if (parts[0] === 'ID' || parts[0] === 'Type') continue;
    if (parts[0].startsWith('+')) continue;

    // The columns are: ID, Type, Status, Created, Last Activity
    // ID is often empty, so detect by checking if first field looks like a type
    const knownTypes = ['coder','reviewer','tester','researcher','coordinator','architect',
      'analyst','optimizer','security-auditor','security-architect','memory-specialist',
      'swarm-specialist','performance-engineer','core-architect','test-architect'];

    let id = '';
    let type = '';
    let status = 'idle';

    if (knownTypes.some(t => parts[0].startsWith(t))) {
      // ID was empty — parts[0] is actually the type
      type = parts[0].replace('...', '');
      status = (parts[1] || 'idle').toLowerCase();
    } else if (parts[0] && parts.length >= 3) {
      // ID is present
      id = parts[0];
      type = parts[1].replace('...', '');
      status = (parts[2] || 'idle').toLowerCase();
    } else {
      continue;
    }

    // Generate unique ID from type if not present
    if (!id) {
      const count = (typeCounts.get(type) ?? 0) + 1;
      typeCounts.set(type, count);
      id = `${type}-${count}`;
    }

    // Reconstruct full type name from truncated
    if (type === 'security-aud') type = 'security-auditor';
    if (type === 'security-arc') type = 'security-architect';
    if (type === 'performance-') type = 'performance-engineer';

    agents.push({
      id,
      name: type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' '),
      type,
      status,
    });
  }

  return agents;
}

/**
 * Parse swarm status output
 */
function parseSwarmStatus(output: string): RawSwarm {
  const isActive = !output.includes('No active swarm') && !output.includes('not running');
  let agentCount = 0;
  let state = 'idle';

  // Try to find agent count and state from output
  const agentMatch = output.match(/agents?\s*[:|]\s*(\d+)/i);
  if (agentMatch) agentCount = parseInt(agentMatch[1]);

  const stateMatch = output.match(/state\s*[:|]\s*(\w+)/i) || output.match(/status\s*[:|]\s*(\w+)/i);
  if (stateMatch) state = stateMatch[1].toLowerCase();

  return { active: isActive, agentCount, state };
}

export async function pollAgents(): Promise<RawAgent[]> {
  const output = await runCli('agent', 'list');
  return parseAgentList(output);
}

export async function pollAgentStatus(agentId: string): Promise<Record<string, string>> {
  const output = await runCli('agent', 'status', agentId);
  const result: Record<string, string> = {};
  // Parse key: value lines
  for (const line of output.split('\n')) {
    const match = line.match(/^\s*([\w\s]+?)\s*[:|]\s*(.+)$/);
    if (match) {
      result[match[1].trim().toLowerCase()] = match[2].trim();
    }
    // Also parse table rows
    if (line.includes('|')) {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length >= 2 && parts[0] && !parts[0].startsWith('+') && !parts[0].startsWith('-')) {
        result[parts[0].toLowerCase()] = parts[1];
      }
    }
  }
  return result;
}

export async function pollSwarmStatus(): Promise<RawSwarm> {
  const output = await runCli('swarm', 'status');
  return parseSwarmStatus(output);
}

export async function pollTaskList(): Promise<Array<{ id: string; status: string; assignedTo?: string; description?: string }>> {
  const output = await runCli('task', 'list');
  const tasks: Array<{ id: string; status: string; assignedTo?: string; description?: string }> = [];

  for (const line of output.split('\n')) {
    if (!line.includes('|') || line.includes('---')) continue;
    const parts = line.split('|').map(s => s.trim());
    if (parts.length < 2) continue;
    if (parts[0] === 'ID' || parts[0] === 'Task' || !parts[0] || parts[0].startsWith('+')) continue;

    tasks.push({
      id: parts[0],
      status: (parts[1] || 'pending').toLowerCase(),
      assignedTo: parts[2] || undefined,
      description: parts[3] || undefined,
    });
  }

  return tasks;
}

/**
 * Check if claude-flow daemon is running
 */
export async function isDaemonRunning(): Promise<boolean> {
  try {
    const output = await runCli('mcp', 'status');
    return output.includes('Running');
  } catch {
    return false;
  }
}
