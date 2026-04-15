export enum AgentCategory {
  Coder = 'coder',
  Reviewer = 'reviewer',
  Planner = 'planner',
  Security = 'security',
  Researcher = 'researcher',
  Coordinator = 'coordinator',
  Tester = 'tester',
  DevOps = 'devops',
  Debugger = 'debugger',
  Designer = 'designer',
}

export const CORE_CATEGORIES: AgentCategory[] = [
  AgentCategory.Coder, AgentCategory.Reviewer, AgentCategory.Planner,
  AgentCategory.Security, AgentCategory.Researcher, AgentCategory.Coordinator,
];

export const EXTENDED_CATEGORIES: AgentCategory[] = [
  AgentCategory.Tester, AgentCategory.DevOps, AgentCategory.Debugger, AgentCategory.Designer,
];

export const ALL_CATEGORIES: AgentCategory[] = [...CORE_CATEGORIES, ...EXTENDED_CATEGORIES];

export type AnimationState =
  | 'idle' | 'working' | 'walking_left' | 'walking_right'
  | 'interacting' | 'celebrating' | 'error' | 'entering' | 'exiting';

export interface IsoPosition { gridX: number; gridY: number; }
export interface ScreenPosition { x: number; y: number; }

export interface AgentState {
  id: string;
  name: string;
  type: string;
  category: AgentCategory;
  status: 'active' | 'idle' | 'complete' | 'error' | 'spawning' | 'terminated';
  progress: number;
  taskDescription: string;
  elapsedMs: number;
  logs: string[];
  dependencies: string[];
  dependents: string[];
}

export type InteractionType =
  | 'task_handoff' | 'review_request' | 'review_complete'
  | 'coordinator_delegation' | 'error_escalation'
  | 'status_update' | 'memory_sharing' | 'coordination_sync' | 'heartbeat';

export type InteractionPriority = 'physical' | 'beam';

export interface InteractionEvent {
  id: string;
  type: InteractionType;
  priority: InteractionPriority;
  sourceAgentId: string;
  targetAgentId: string;
  timestamp: number;
  payload?: string;
}

export type SwarmEnvironmentState = 'idle' | 'active' | 'heavy' | 'error' | 'complete' | 'shutdown';

export interface SwarmState {
  environment: SwarmEnvironmentState;
  totalAgents: number;
  activeAgents: number;
  errorCount: number;
  elapsedMs: number;
}

export interface VisualizerState {
  agents: Map<string, AgentState>;
  interactions: InteractionEvent[];
  swarm: SwarmState;
}

export const PROGRESS_COLORS = {
  low: '#3b82f6',
  mid: '#22d3ee',
  high: '#10b981',
  complete: '#f59e0b',
  error: '#ef4444',
} as const;
