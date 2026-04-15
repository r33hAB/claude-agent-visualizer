import { AgentCategory } from '../types/agent';

export interface AgentPalette {
  primary: string;
  accent: string;
  surface: string;
  glow: string;
  dark: string;
}

export const AGENT_PALETTES: Record<AgentCategory, AgentPalette> = {
  [AgentCategory.Coder]: {
    primary: '#3875d9',
    accent: '#74b8ff',
    surface: '#b7ddff',
    glow: '#47c2ff',
    dark: '#11213d',
  },
  [AgentCategory.Reviewer]: {
    primary: '#d28d1e',
    accent: '#f5c34f',
    surface: '#ffe3a3',
    glow: '#ffcf61',
    dark: '#50340e',
  },
  [AgentCategory.Planner]: {
    primary: '#8660df',
    accent: '#b89bff',
    surface: '#dccbff',
    glow: '#aa81ff',
    dark: '#2f2358',
  },
  [AgentCategory.Security]: {
    primary: '#d45159',
    accent: '#ff8c92',
    surface: '#ffc6c4',
    glow: '#ff6e79',
    dark: '#4b1621',
  },
  [AgentCategory.Researcher]: {
    primary: '#16a97b',
    accent: '#64d9b1',
    surface: '#bdf4df',
    glow: '#43e3bc',
    dark: '#0b3d31',
  },
  [AgentCategory.Coordinator]: {
    primary: '#da5d9f',
    accent: '#f58cc2',
    surface: '#ffc6df',
    glow: '#ff74c8',
    dark: '#531735',
  },
  [AgentCategory.Tester]: {
    primary: '#149f9e',
    accent: '#63dfda',
    surface: '#bcf8f3',
    glow: '#45eedf',
    dark: '#123f42',
  },
  [AgentCategory.DevOps]: {
    primary: '#d16f26',
    accent: '#ffae68',
    surface: '#ffd2ae',
    glow: '#ff9550',
    dark: '#4f260b',
  },
  [AgentCategory.Debugger]: {
    primary: '#5d71db',
    accent: '#94a9ff',
    surface: '#cad4ff',
    glow: '#7b8eff',
    dark: '#1f2557',
  },
  [AgentCategory.Designer]: {
    primary: '#c35bdb',
    accent: '#f29aff',
    surface: '#ffd4ff',
    glow: '#ff82ec',
    dark: '#4d1458',
  },
};
