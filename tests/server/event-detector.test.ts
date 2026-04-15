import { describe, it, expect } from 'vitest';
import { detectEvents } from '../../server/event-detector';
import { AgentCategory, type AgentState, type InteractionEvent } from '../../src/types/agent';

function makeAgent(overrides: Partial<AgentState> & { id: string }): AgentState {
  return {
    name: overrides.id,
    type: 'coder',
    category: AgentCategory.Coder,
    status: 'active',
    progress: 50,
    taskDescription: 'test task',
    elapsedMs: 1000,
    logs: [],
    dependencies: [],
    dependents: [],
    ...overrides,
  };
}

describe('detectEvents', () => {
  it('returns empty array when nothing changed', () => {
    const prev = new Map([['a1', makeAgent({ id: 'a1' })]]);
    const next = new Map([['a1', makeAgent({ id: 'a1' })]]);
    expect(detectEvents(prev, next)).toEqual([]);
  });

  it('detects task handoff when dependency changes', () => {
    const prev = new Map([
      ['a1', makeAgent({ id: 'a1', dependents: [] })],
      ['a2', makeAgent({ id: 'a2', dependencies: [] })],
    ]);
    const next = new Map([
      ['a1', makeAgent({ id: 'a1', dependents: ['a2'] })],
      ['a2', makeAgent({ id: 'a2', dependencies: ['a1'] })],
    ]);
    const events = detectEvents(prev, next);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('task_handoff');
    expect(events[0].sourceAgentId).toBe('a1');
    expect(events[0].targetAgentId).toBe('a2');
  });

  it('detects review request when reviewer gets new dependency from coder', () => {
    const prev = new Map([
      ['a1', makeAgent({ id: 'a1', type: 'coder', category: AgentCategory.Coder })],
      ['a2', makeAgent({ id: 'a2', type: 'reviewer', category: AgentCategory.Reviewer, dependencies: [] })],
    ]);
    const next = new Map([
      ['a1', makeAgent({ id: 'a1', type: 'coder', category: AgentCategory.Coder, dependents: ['a2'] })],
      ['a2', makeAgent({ id: 'a2', type: 'reviewer', category: AgentCategory.Reviewer, dependencies: ['a1'] })],
    ]);
    const events = detectEvents(prev, next);
    expect(events[0].type).toBe('review_request');
  });

  it('detects error escalation when agent enters error state', () => {
    const prev = new Map([
      ['a1', makeAgent({ id: 'a1', status: 'active' })],
      ['a2', makeAgent({ id: 'a2', category: AgentCategory.Debugger })],
    ]);
    const next = new Map([
      ['a1', makeAgent({ id: 'a1', status: 'error' })],
      ['a2', makeAgent({ id: 'a2', category: AgentCategory.Debugger })],
    ]);
    const events = detectEvents(prev, next);
    const escalation = events.find(e => e.type === 'error_escalation');
    expect(escalation).toBeDefined();
    expect(escalation!.sourceAgentId).toBe('a1');
    expect(escalation!.targetAgentId).toBe('a2');
  });

  it('assigns physical priority to major events', () => {
    const prev = new Map([
      ['a1', makeAgent({ id: 'a1', dependents: [] })],
      ['a2', makeAgent({ id: 'a2', dependencies: [] })],
    ]);
    const next = new Map([
      ['a1', makeAgent({ id: 'a1', dependents: ['a2'] })],
      ['a2', makeAgent({ id: 'a2', dependencies: ['a1'] })],
    ]);
    const events = detectEvents(prev, next);
    expect(events[0].priority).toBe('physical');
  });
});
