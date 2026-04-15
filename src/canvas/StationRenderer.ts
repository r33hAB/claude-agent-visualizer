import { TILE_WIDTH, TILE_HEIGHT } from './IsometricEngine';
import { AgentCategory } from '../types/agent';

interface StationConfig {
  baseColor: string;
  accentColor: string;
  drawDetails: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    progress: number,
    time: number,
  ) => void;
}

const HW = TILE_WIDTH / 2;
const HH = TILE_HEIGHT / 2;

function drawDiamondBase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  baseColor: string,
): void {
  ctx.beginPath();
  ctx.moveTo(x, y - HH);
  ctx.lineTo(x + HW, y);
  ctx.lineTo(x, y + HH);
  ctx.lineTo(x - HW, y);
  ctx.closePath();
  ctx.fillStyle = baseColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = parseInt(hex.replace('#', ''), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

// ── Category detail drawers ──────────────────────────────────────────

function drawCoderDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  time: number,
): void {
  const accent = '#3b82f6';
  const glow = Math.sin(time * 2) * 0.15 + 0.35;

  // Screen glow
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.fillStyle = accent;
  ctx.fillRect(x - 18, y - 22, 16, 12);
  ctx.fillRect(x + 2, y - 22, 16, 12);
  ctx.restore();

  // Monitor frames
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 18, y - 22, 16, 12);
  ctx.strokeRect(x + 2, y - 22, 16, 12);

  // Code lines based on progress
  const lines = Math.floor(progress * 6);
  ctx.fillStyle = accent;
  for (let i = 0; i < lines; i++) {
    const lx = i < 3 ? x - 16 : x + 4;
    const ly = y - 19 + (i % 3) * 3;
    const lw = 6 + Math.sin(i + time) * 3;
    ctx.fillRect(lx, ly, lw, 1.5);
  }
}

function drawReviewerDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  _time: number,
): void {
  const accent = '#f59e0b';
  const totalDocs = 5;
  const reviewed = Math.floor(progress * totalDocs);

  // Unreviewed pile (left, shrinks)
  for (let i = 0; i < totalDocs - reviewed; i++) {
    ctx.fillStyle = `rgba(245, 158, 11, ${0.3 + i * 0.1})`;
    ctx.fillRect(x - 20, y - 18 - i * 3, 14, 2);
  }

  // Reviewed pile (right, grows)
  for (let i = 0; i < reviewed; i++) {
    ctx.fillStyle = accent;
    ctx.fillRect(x + 6, y - 18 - i * 3, 14, 2);
  }

  // Checkmark on reviewed pile
  if (reviewed > 0) {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 14 - (reviewed - 1) * 3);
    ctx.lineTo(x + 13, y - 11 - (reviewed - 1) * 3);
    ctx.lineTo(x + 18, y - 17 - (reviewed - 1) * 3);
    ctx.stroke();
  }
}

function drawPlannerDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  _time: number,
): void {
  const accent = '#8b5cf6';

  // Whiteboard background
  ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
  ctx.fillRect(x - 20, y - 24, 40, 20);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 20, y - 24, 40, 20);

  // Diagram nodes
  const nodeCount = Math.floor(progress * 4) + 1;
  const nodes: Array<[number, number]> = [
    [x - 10, y - 18],
    [x + 10, y - 18],
    [x - 10, y - 10],
    [x + 10, y - 10],
    [x, y - 14],
  ];

  // Draw connections first
  ctx.strokeStyle = accent;
  ctx.lineWidth = 0.8;
  for (let i = 1; i < nodeCount && i < nodes.length; i++) {
    ctx.beginPath();
    ctx.moveTo(nodes[i - 1][0], nodes[i - 1][1]);
    ctx.lineTo(nodes[i][0], nodes[i][1]);
    ctx.stroke();
  }

  // Draw nodes
  for (let i = 0; i < nodeCount && i < nodes.length; i++) {
    ctx.beginPath();
    ctx.arc(nodes[i][0], nodes[i][1], 2.5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
  }
}

function drawSecurityDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _progress: number,
  time: number,
): void {
  const accent = '#ef4444';

  // Alert panel
  ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
  ctx.fillRect(x - 16, y - 22, 32, 16);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 16, y - 22, 32, 16);

  // Scanning line
  const scanY = y - 22 + ((time * 8) % 16);
  ctx.strokeStyle = `rgba(239, 68, 68, 0.6)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 15, scanY);
  ctx.lineTo(x + 15, scanY);
  ctx.stroke();

  // Shield icon
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x + 6, y - 23);
  ctx.lineTo(x + 6, y - 18);
  ctx.quadraticCurveTo(x, y - 14, x, y - 14);
  ctx.quadraticCurveTo(x, y - 14, x - 6, y - 18);
  ctx.lineTo(x - 6, y - 23);
  ctx.closePath();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawResearcherDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _progress: number,
  time: number,
): void {
  const accent = '#10b981';

  // Floating data screens
  const floatY = Math.sin(time * 1.5) * 2;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 18, y - 22 + floatY, 12, 8);
  ctx.strokeRect(x + 6, y - 20 + floatY * 0.7, 12, 8);

  // Feed lines inside screens
  ctx.fillStyle = accent;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x - 16, y - 20 + floatY + i * 2.5, 8, 1);
    ctx.fillRect(x + 8, y - 18 + floatY * 0.7 + i * 2.5, 8, 1);
  }

  // Book stack
  const bookColors = ['#10b981', '#059669', '#047857'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = bookColors[i];
    ctx.fillRect(x - 6, y - 6 - i * 3, 12, 2.5);
  }
}

function drawCoordinatorDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _progress: number,
  time: number,
): void {
  const accent = '#ec4899';

  // Elevated platform glow
  ctx.save();
  ctx.globalAlpha = 0.15 + Math.sin(time * 2) * 0.05;
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 22, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.restore();

  // Signal pulse rings
  const ringCount = 3;
  for (let i = 0; i < ringCount; i++) {
    const phase = ((time * 1.2 + i * 0.8) % 2) / 2;
    const radius = 8 + phase * 18;
    const alpha = (1 - phase) * 0.4;
    ctx.beginPath();
    ctx.arc(x, y - 14, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawTesterDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  time: number,
): void {
  // Test rig frame
  ctx.strokeStyle = '#14b8a6';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 20, y - 20, 40, 14);

  // 5 indicator lights
  const passed = Math.floor(progress * 5);
  for (let i = 0; i < 5; i++) {
    const lx = x - 16 + i * 8;
    const ly = y - 15;
    ctx.beginPath();
    ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);

    if (i < passed) {
      ctx.fillStyle = '#22c55e'; // green = passed
    } else if (i === passed && progress < 1) {
      // yellow flashing = current
      const flash = Math.sin(time * 6) > 0 ? 1 : 0.3;
      ctx.fillStyle = `rgba(234, 179, 8, ${flash})`;
    } else {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'; // dark = pending
    }
    ctx.fill();
  }
}

function drawDevOpsDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  time: number,
): void {
  const accent = '#f97316';

  // Pipeline tube
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 22, y - 14);
  ctx.lineTo(x + 22, y - 14);
  ctx.stroke();

  // Tube borders
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 22, y - 14);
  ctx.lineTo(x + 22, y - 14);
  ctx.stroke();

  // Package moving through pipeline
  const pkgX = x - 20 + progress * 40;
  ctx.fillStyle = accent;
  ctx.fillRect(pkgX - 3, y - 17, 6, 6);

  // Deploy button
  const btnGlow = Math.sin(time * 3) * 0.2 + 0.8;
  ctx.beginPath();
  ctx.arc(x, y - 4, 4, 0, Math.PI * 2);
  ctx.fillStyle =
    progress >= 1
      ? `rgba(34, 197, 94, ${btnGlow})`
      : `rgba(249, 115, 22, ${btnGlow * 0.5})`;
  ctx.fill();
}

function drawDebuggerDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  time: number,
): void {
  const accent = '#6366f1';

  // Magnifying glass
  const glassX = x - 8 + Math.sin(time * 1.5) * 8;
  ctx.beginPath();
  ctx.arc(glassX, y - 16, 5, 0, Math.PI * 2);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Handle
  ctx.beginPath();
  ctx.moveTo(glassX + 3.5, y - 12.5);
  ctx.lineTo(glassX + 7, y - 9);
  ctx.stroke();

  // Code fragments being scanned
  ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x - 18 + i * 10, y - 8, 7, 1.5);
  }

  // Lightbulb "aha!" at >80% progress
  if (progress > 0.8) {
    const bulbAlpha = Math.sin(time * 4) * 0.3 + 0.7;
    ctx.save();
    ctx.globalAlpha = bulbAlpha;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x + 14, y - 22, 4, 0, Math.PI * 2);
    ctx.fill();
    // Rays
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 0.8;
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x + 14 + Math.cos(angle) * 5, y - 22 + Math.sin(angle) * 5);
      ctx.lineTo(x + 14 + Math.cos(angle) * 7, y - 22 + Math.sin(angle) * 7);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawDesignerDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  _time: number,
): void {
  const accent = '#d946ef';

  // Canvas / drafting table
  ctx.fillStyle = 'rgba(217, 70, 239, 0.06)';
  ctx.fillRect(x - 18, y - 22, 36, 18);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 18, y - 22, 36, 18);

  // Color swatches
  const swatchColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#d946ef'];
  for (let i = 0; i < swatchColors.length; i++) {
    ctx.fillStyle = swatchColors[i];
    ctx.fillRect(x - 16 + i * 7, y - 2, 5, 5);
  }

  // Paint strokes appearing with progress
  const strokes = Math.floor(progress * 4);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < strokes; i++) {
    ctx.strokeStyle = swatchColors[i % swatchColors.length];
    ctx.beginPath();
    const sy = y - 19 + i * 4;
    ctx.moveTo(x - 14 + i * 3, sy);
    ctx.quadraticCurveTo(x - 4 + i * 2, sy - 2, x + 8 - i * 2, sy + 1);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

// ── Station configs ──────────────────────────────────────────────────

const STATION_CONFIGS: Record<AgentCategory, StationConfig> = {
  [AgentCategory.Coder]: {
    baseColor: '#1a2744',
    accentColor: '#3b82f6',
    drawDetails: drawCoderDetails,
  },
  [AgentCategory.Reviewer]: {
    baseColor: '#2d1f0e',
    accentColor: '#f59e0b',
    drawDetails: drawReviewerDetails,
  },
  [AgentCategory.Planner]: {
    baseColor: '#1e1040',
    accentColor: '#8b5cf6',
    drawDetails: drawPlannerDetails,
  },
  [AgentCategory.Security]: {
    baseColor: '#1f0a0a',
    accentColor: '#ef4444',
    drawDetails: drawSecurityDetails,
  },
  [AgentCategory.Researcher]: {
    baseColor: '#0a1f1a',
    accentColor: '#10b981',
    drawDetails: drawResearcherDetails,
  },
  [AgentCategory.Coordinator]: {
    baseColor: '#1f0a2e',
    accentColor: '#ec4899',
    drawDetails: drawCoordinatorDetails,
  },
  [AgentCategory.Tester]: {
    baseColor: '#0a1f1f',
    accentColor: '#14b8a6',
    drawDetails: drawTesterDetails,
  },
  [AgentCategory.DevOps]: {
    baseColor: '#1f1005',
    accentColor: '#f97316',
    drawDetails: drawDevOpsDetails,
  },
  [AgentCategory.Debugger]: {
    baseColor: '#0f0a2e',
    accentColor: '#6366f1',
    drawDetails: drawDebuggerDetails,
  },
  [AgentCategory.Designer]: {
    baseColor: '#1f0a20',
    accentColor: '#d946ef',
    drawDetails: drawDesignerDetails,
  },
};

// ── Public API ───────────────────────────────────────────────────────

export function drawStation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  category: AgentCategory,
  progress: number,
  time: number,
): void {
  const config = STATION_CONFIGS[category];
  if (!config) return;

  ctx.save();

  // Draw isometric diamond base
  drawDiamondBase(ctx, x, y, config.baseColor);

  // Accent border glow
  const { r, g, b } = hexToRgb(config.accentColor);
  ctx.beginPath();
  ctx.moveTo(x, y - HH);
  ctx.lineTo(x + HW, y);
  ctx.lineTo(x, y + HH);
  ctx.lineTo(x - HW, y);
  ctx.closePath();
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw category-specific details
  config.drawDetails(ctx, x, y, progress, time);

  ctx.restore();
}
