import { describe, it, expect } from 'vitest';
import { categorizeAgent } from '../../server/agent-categorizer';
import { AgentCategory } from '../../src/types/agent';

describe('categorizeAgent', () => {
  it('maps coder types to Coder', () => {
    expect(categorizeAgent('coder')).toBe(AgentCategory.Coder);
    expect(categorizeAgent('sparc-coder')).toBe(AgentCategory.Coder);
    expect(categorizeAgent('backend-dev')).toBe(AgentCategory.Coder);
    expect(categorizeAgent('ml-developer')).toBe(AgentCategory.Coder);
  });

  it('maps reviewer types to Reviewer', () => {
    expect(categorizeAgent('reviewer')).toBe(AgentCategory.Reviewer);
    expect(categorizeAgent('code-reviewer')).toBe(AgentCategory.Reviewer);
    expect(categorizeAgent('code-review-swarm')).toBe(AgentCategory.Reviewer);
    expect(categorizeAgent('analyst')).toBe(AgentCategory.Reviewer);
  });

  it('maps planner types to Planner', () => {
    expect(categorizeAgent('planner')).toBe(AgentCategory.Planner);
    expect(categorizeAgent('task-orchestrator')).toBe(AgentCategory.Planner);
    expect(categorizeAgent('sparc-coord')).toBe(AgentCategory.Planner);
    expect(categorizeAgent('goal-planner')).toBe(AgentCategory.Planner);
  });

  it('maps security types to Security', () => {
    expect(categorizeAgent('security-architect')).toBe(AgentCategory.Security);
    expect(categorizeAgent('security-auditor')).toBe(AgentCategory.Security);
    expect(categorizeAgent('pii-detector')).toBe(AgentCategory.Security);
    expect(categorizeAgent('aidefence-guardian')).toBe(AgentCategory.Security);
  });

  it('maps researcher types to Researcher', () => {
    expect(categorizeAgent('researcher')).toBe(AgentCategory.Researcher);
    expect(categorizeAgent('Explore')).toBe(AgentCategory.Researcher);
    expect(categorizeAgent('specification')).toBe(AgentCategory.Researcher);
  });

  it('maps coordinator types to Coordinator', () => {
    expect(categorizeAgent('hierarchical-coordinator')).toBe(AgentCategory.Coordinator);
    expect(categorizeAgent('mesh-coordinator')).toBe(AgentCategory.Coordinator);
    expect(categorizeAgent('adaptive-coordinator')).toBe(AgentCategory.Coordinator);
    expect(categorizeAgent('swarm-init')).toBe(AgentCategory.Coordinator);
  });

  it('maps tester types to Tester', () => {
    expect(categorizeAgent('tester')).toBe(AgentCategory.Tester);
    expect(categorizeAgent('tdd-london-swarm')).toBe(AgentCategory.Tester);
    expect(categorizeAgent('production-validator')).toBe(AgentCategory.Tester);
  });

  it('maps devops types to DevOps', () => {
    expect(categorizeAgent('release-manager')).toBe(AgentCategory.DevOps);
    expect(categorizeAgent('cicd-engineer')).toBe(AgentCategory.DevOps);
    expect(categorizeAgent('workflow-automation')).toBe(AgentCategory.DevOps);
  });

  it('maps debugger types to Debugger', () => {
    expect(categorizeAgent('perf-analyzer')).toBe(AgentCategory.Debugger);
  });

  it('maps designer types to Designer', () => {
    expect(categorizeAgent('frontend-design')).toBe(AgentCategory.Designer);
    expect(categorizeAgent('ui-ux-pro-max')).toBe(AgentCategory.Designer);
  });

  it('falls back to keyword matching for unknown types', () => {
    expect(categorizeAgent('my-custom-coder-agent')).toBe(AgentCategory.Coder);
    expect(categorizeAgent('security-scanner-v2')).toBe(AgentCategory.Security);
    expect(categorizeAgent('test-runner')).toBe(AgentCategory.Tester);
  });

  it('defaults to Coder for completely unknown types', () => {
    expect(categorizeAgent('xyzzy-unknown-thing')).toBe(AgentCategory.Coder);
  });
});
