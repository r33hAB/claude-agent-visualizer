import {
  AgentCategory,
  type AgentState,
  type InteractionEvent,
  type InteractionType,
  type InteractionPriority,
} from '../src/types/agent.js';

let eventCounter = 0;

function createEventId(): string {
  return `evt_${Date.now()}_${eventCounter++}`;
}

const PHYSICAL_TYPES: Set<InteractionType> = new Set([
  'task_handoff',
  'review_request',
  'review_complete',
  'coordinator_delegation',
  'error_escalation',
]);

function priorityFor(type: InteractionType): InteractionPriority {
  return PHYSICAL_TYPES.has(type) ? 'physical' : 'beam';
}

function classifyDependencyEvent(
  sourceCategory: AgentCategory,
  targetCategory: AgentCategory,
): InteractionType {
  if (
    sourceCategory === AgentCategory.Coder &&
    targetCategory === AgentCategory.Reviewer
  ) {
    return 'review_request';
  }
  if (
    sourceCategory === AgentCategory.Coordinator ||
    targetCategory === AgentCategory.Coordinator
  ) {
    return 'coordinator_delegation';
  }
  return 'task_handoff';
}

/**
 * Compares two snapshots of agent state and returns interaction events
 * representing what changed between them.
 */
export function detectEvents(
  prev: Map<string, AgentState>,
  next: Map<string, AgentState>,
): InteractionEvent[] {
  const events: InteractionEvent[] = [];
  const timestamp = Date.now();

  for (const [agentId, nextAgent] of next) {
    const prevAgent = prev.get(agentId);

    // Detect new dependencies (added since prev snapshot)
    const prevDeps = new Set(prevAgent?.dependencies ?? []);
    for (const dep of nextAgent.dependencies) {
      if (!prevDeps.has(dep)) {
        const sourceAgent = next.get(dep);
        if (!sourceAgent) continue;

        const type = classifyDependencyEvent(
          sourceAgent.category,
          nextAgent.category,
        );

        events.push({
          id: createEventId(),
          type,
          priority: priorityFor(type),
          sourceAgentId: dep,
          targetAgentId: agentId,
          timestamp,
        });
      }
    }

    // Detect lost dependencies (review_complete)
    if (prevAgent && prevAgent.category === AgentCategory.Reviewer) {
      const nextDeps = new Set(nextAgent.dependencies);
      for (const dep of prevAgent.dependencies) {
        if (!nextDeps.has(dep)) {
          const type: InteractionType = 'review_complete';
          events.push({
            id: createEventId(),
            type,
            priority: priorityFor(type),
            sourceAgentId: agentId,
            targetAgentId: dep,
            timestamp,
          });
        }
      }
    }

    // Detect error escalation
    if (
      prevAgent &&
      prevAgent.status !== 'error' &&
      nextAgent.status === 'error'
    ) {
      // Find a debugger agent to escalate to
      for (const [otherId, otherAgent] of next) {
        if (otherAgent.category === AgentCategory.Debugger) {
          const type: InteractionType = 'error_escalation';
          events.push({
            id: createEventId(),
            type,
            priority: priorityFor(type),
            sourceAgentId: agentId,
            targetAgentId: otherId,
            timestamp,
          });
          break;
        }
      }
    }
  }

  return events;
}
