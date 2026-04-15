import type { SwarmState, SwarmEnvironmentState } from '../types/agent';

interface SwarmOverviewProps {
  swarm: SwarmState;
  connected: boolean;
}

const ENV_LABELS: Record<SwarmEnvironmentState, string> = {
  idle: 'IDLE',
  active: 'ACTIVE',
  heavy: 'HEAVY LOAD',
  error: 'ERROR',
  complete: 'COMPLETE',
  shutdown: 'SHUTTING DOWN',
};

const ENV_COLORS: Record<SwarmEnvironmentState, string> = {
  idle: 'text-gray-400',
  active: 'text-blue-400',
  heavy: 'text-yellow-400',
  error: 'text-red-400',
  complete: 'text-green-400',
  shutdown: 'text-orange-400',
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SwarmOverview({ swarm, connected }: SwarmOverviewProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-10 bg-lab-panel/80 backdrop-blur-md border-b border-lab-border z-40 flex items-center px-4 gap-4 text-xs">
      {/* Connection status */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
          }`}
        />
        <span className={`font-medium uppercase tracking-wider text-[10px] ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? 'LIVE' : 'DISCONNECTED'}
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-lab-border" />

      {/* Swarm state */}
      <span className={`font-medium text-[10px] uppercase tracking-wider ${ENV_COLORS[swarm.environment]}`}>
        {ENV_LABELS[swarm.environment]}
      </span>

      {/* Separator */}
      <div className="w-px h-4 bg-lab-border" />

      {/* Agent counts */}
      <span className="font-mono text-gray-300">
        Agents: <span className="text-white">{swarm.activeAgents}</span>
        <span className="text-gray-500">/{swarm.totalAgents}</span>
      </span>

      {/* Error count */}
      {swarm.errorCount > 0 && (
        <>
          <div className="w-px h-4 bg-lab-border" />
          <span className="text-red-400 font-mono">
            Errors: {swarm.errorCount}
          </span>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Elapsed time */}
      <span className="font-mono text-gray-400">
        {formatElapsed(swarm.elapsedMs)}
      </span>

      {/* Separator */}
      <div className="w-px h-4 bg-lab-border" />

      {/* Title */}
      <span className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
        Agent Visualizer
      </span>
    </div>
  );
}
