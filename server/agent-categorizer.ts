import { AgentCategory } from '../src/types/agent.js';

/**
 * Exact mapping from known agent type strings to their visual category.
 * Covers 45+ agent types from claude-flow and common naming conventions.
 */
const EXACT_MAP: Record<string, AgentCategory> = {
  // Coder
  'coder': AgentCategory.Coder,
  'sparc-coder': AgentCategory.Coder,
  'backend-dev': AgentCategory.Coder,
  'ml-developer': AgentCategory.Coder,
  'mobile-dev': AgentCategory.Coder,

  // Reviewer
  'reviewer': AgentCategory.Reviewer,
  'code-reviewer': AgentCategory.Reviewer,
  'code-review-swarm': AgentCategory.Reviewer,
  'analyst': AgentCategory.Reviewer,
  'code-analyzer': AgentCategory.Reviewer,

  // Planner
  'planner': AgentCategory.Planner,
  'task-orchestrator': AgentCategory.Planner,
  'sparc-coord': AgentCategory.Planner,
  'goal-planner': AgentCategory.Planner,
  'sublinear-goal-planner': AgentCategory.Planner,
  'sparc-orchestrator': AgentCategory.Planner,

  // Security
  'security-architect': AgentCategory.Security,
  'security-auditor': AgentCategory.Security,
  'pii-detector': AgentCategory.Security,
  'aidefence-guardian': AgentCategory.Security,
  'security-manager': AgentCategory.Security,
  'security-architect-aidefence': AgentCategory.Security,
  'injection-analyst': AgentCategory.Security,
  'claims-authorizer': AgentCategory.Security,

  // Researcher
  'researcher': AgentCategory.Researcher,
  'explore': AgentCategory.Researcher,
  'specification': AgentCategory.Researcher,
  'reasoningbank-learner': AgentCategory.Researcher,

  // Coordinator
  'hierarchical-coordinator': AgentCategory.Coordinator,
  'mesh-coordinator': AgentCategory.Coordinator,
  'adaptive-coordinator': AgentCategory.Coordinator,
  'swarm-init': AgentCategory.Coordinator,
  'collective-intelligence-coordinator': AgentCategory.Coordinator,
  'smart-agent': AgentCategory.Coordinator,
  'sync-coordinator': AgentCategory.Coordinator,

  // Tester
  'tester': AgentCategory.Tester,
  'tdd-london-swarm': AgentCategory.Tester,
  'production-validator': AgentCategory.Tester,

  // DevOps
  'release-manager': AgentCategory.DevOps,
  'cicd-engineer': AgentCategory.DevOps,
  'workflow-automation': AgentCategory.DevOps,
  'release-swarm': AgentCategory.DevOps,

  // Debugger
  'perf-analyzer': AgentCategory.Debugger,
  'performance-benchmarker': AgentCategory.Debugger,
  'performance-engineer': AgentCategory.Debugger,

  // Designer
  'frontend-design': AgentCategory.Designer,
  'ui-ux-pro-max': AgentCategory.Designer,
};

/**
 * Keyword fallback rules, checked in priority order.
 * First match wins, so more specific keywords come first.
 */
const KEYWORD_MAP: Array<[string, AgentCategory]> = [
  ['security', AgentCategory.Security],
  ['coordinator', AgentCategory.Coordinator],
  ['review', AgentCategory.Reviewer],
  ['test', AgentCategory.Tester],
  ['debug', AgentCategory.Debugger],
  ['perf', AgentCategory.Debugger],
  ['deploy', AgentCategory.DevOps],
  ['release', AgentCategory.DevOps],
  ['cicd', AgentCategory.DevOps],
  ['pipeline', AgentCategory.DevOps],
  ['design', AgentCategory.Designer],
  ['ui', AgentCategory.Designer],
  ['ux', AgentCategory.Designer],
  ['figma', AgentCategory.Designer],
  ['plan', AgentCategory.Planner],
  ['orchestrat', AgentCategory.Planner],
  ['research', AgentCategory.Researcher],
  ['explor', AgentCategory.Researcher],
  ['spec', AgentCategory.Researcher],
  ['code', AgentCategory.Coder],
  ['dev', AgentCategory.Coder],
  ['build', AgentCategory.Coder],
];

/**
 * Categorizes an agent type string into one of 10 visual categories.
 *
 * Uses two-tier matching:
 * 1. Exact match against known agent type names (case-insensitive)
 * 2. Keyword substring matching as fallback
 * 3. Defaults to Coder if nothing matches
 */
export function categorizeAgent(agentType: string): AgentCategory {
  const lower = agentType.toLowerCase();

  // Tier 1: exact match
  const exact = EXACT_MAP[lower];
  if (exact !== undefined) {
    return exact;
  }

  // Tier 2: keyword fallback
  for (const [keyword, category] of KEYWORD_MAP) {
    if (lower.includes(keyword)) {
      return category;
    }
  }

  // Default
  return AgentCategory.Coder;
}
