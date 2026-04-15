import { describe, it, expect } from 'vitest';
import {
  AgentCategory,
  CORE_CATEGORIES,
  EXTENDED_CATEGORIES,
  ALL_CATEGORIES,
  type AgentState,
  type InteractionEvent,
  type SwarmEnvironmentState,
  type AnimationState,
} from '../../../src/types/agent';

describe('AgentCategory', () => {
  it('has 6 core categories', () => {
    expect(CORE_CATEGORIES).toHaveLength(6);
    expect(CORE_CATEGORIES).toContain(AgentCategory.Coder);
    expect(CORE_CATEGORIES).toContain(AgentCategory.Reviewer);
    expect(CORE_CATEGORIES).toContain(AgentCategory.Planner);
    expect(CORE_CATEGORIES).toContain(AgentCategory.Security);
    expect(CORE_CATEGORIES).toContain(AgentCategory.Researcher);
    expect(CORE_CATEGORIES).toContain(AgentCategory.Coordinator);
  });

  it('has 4 extended categories', () => {
    expect(EXTENDED_CATEGORIES).toHaveLength(4);
    expect(EXTENDED_CATEGORIES).toContain(AgentCategory.Tester);
    expect(EXTENDED_CATEGORIES).toContain(AgentCategory.DevOps);
    expect(EXTENDED_CATEGORIES).toContain(AgentCategory.Debugger);
    expect(EXTENDED_CATEGORIES).toContain(AgentCategory.Designer);
  });

  it('all categories is core + extended = 10', () => {
    expect(ALL_CATEGORIES).toHaveLength(10);
  });
});

describe('AnimationState', () => {
  it('contains all required states', () => {
    const states: AnimationState[] = [
      'idle', 'working', 'walking_left', 'walking_right',
      'interacting', 'celebrating', 'error', 'entering', 'exiting',
    ];
    expect(states).toHaveLength(9);
  });
});
