import { useEffect, useRef } from 'react';
import type { AgentState } from '../types/agent';

interface DetailPanelProps {
  agent: AgentState | null;
  onClose: () => void;
}

const STATUS_COLORS: Record<AgentState['status'], string> = {
  active: 'bg-blue-500',
  idle: 'bg-gray-400',
  complete: 'bg-green-500',
  error: 'bg-red-500',
  spawning: 'bg-yellow-400',
  terminated: 'bg-gray-500',
};

const STATUS_TEXT_COLORS: Record<AgentState['status'], string> = {
  active: 'text-blue-400',
  idle: 'text-gray-400',
  complete: 'text-green-400',
  error: 'text-red-400',
  spawning: 'text-yellow-400',
  terminated: 'text-gray-500',
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export default function DetailPanel({ agent, onClose }: DetailPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent?.logs]);

  if (!agent) return null;

  const progressBarColor = agent.status === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="fixed right-0 top-0 w-80 h-full bg-lab-panel/90 backdrop-blur-md border-l border-lab-border z-50 animate-slide-in flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-lab-border">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{agent.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{agent.type}</p>
          <span
            className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${STATUS_COLORS[agent.status]} text-white`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'animate-pulse' : ''} bg-white/40`} />
            {agent.status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors p-1 -mr-1 -mt-1"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 border-b border-lab-border">
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <span className="text-gray-400">Progress</span>
          <span className={STATUS_TEXT_COLORS[agent.status]}>{Math.round(agent.progress)}%</span>
        </div>
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
            style={{ width: `${Math.min(agent.progress, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1.5">
          Elapsed: {formatElapsed(agent.elapsedMs)}
        </p>
      </div>

      {/* Task */}
      <div className="px-4 py-3 border-b border-lab-border">
        <h3 className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Task</h3>
        <p className="text-xs text-gray-300 leading-relaxed">{agent.taskDescription}</p>
      </div>

      {/* Connections */}
      {(agent.dependencies.length > 0 || agent.dependents.length > 0) && (
        <div className="px-4 py-3 border-b border-lab-border">
          <h3 className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Connections</h3>
          {agent.dependencies.length > 0 && (
            <p className="text-[10px] text-gray-300 mb-1">
              <span className="text-gray-500">Waits on:</span>{' '}
              {agent.dependencies.join(', ')}
            </p>
          )}
          {agent.dependents.length > 0 && (
            <p className="text-[10px] text-gray-300">
              <span className="text-gray-500">Feeds:</span>{' '}
              {agent.dependents.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Logs */}
      <div className="flex-1 flex flex-col min-h-0 px-4 py-3">
        <h3 className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Logs</h3>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-0.5 scrollbar-thin">
          {agent.logs.length === 0 ? (
            <p className="italic text-gray-600">No logs yet</p>
          ) : (
            agent.logs.map((log, i) => (
              <p key={i} className="leading-snug break-all">{log}</p>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
