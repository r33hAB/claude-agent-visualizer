import { PROGRESS_COLORS } from '../types/agent';

export function getProgressColor(progress: number): string {
  if (progress < 0) return PROGRESS_COLORS.error;
  if (progress <= 30) return PROGRESS_COLORS.low;
  if (progress <= 60) return PROGRESS_COLORS.mid;
  if (progress <= 90) return PROGRESS_COLORS.high;
  return PROGRESS_COLORS.complete;
}

export function drawProgressRing(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  progress: number,
  time: number,
): void {
  const color = getProgressColor(progress);
  const startAngle = -Math.PI / 2;
  const clampedProgress = Math.max(0, Math.min(100, Math.abs(progress)));
  const endAngle = startAngle + (clampedProgress / 100) * Math.PI * 2;

  // Background ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Progress arc
  const isPulsing = progress >= 91 || progress < 0;
  let alpha = 1;
  let lineWidth = 3;

  if (isPulsing) {
    alpha = 0.6 + 0.4 * Math.sin(time * 4);
    lineWidth = 3 + 2 * Math.sin(time * 4);
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // Glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  ctx.stroke();
  ctx.restore();
}
