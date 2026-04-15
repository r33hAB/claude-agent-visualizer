import type { AgentState, AnimationState, IsoPosition, ScreenPosition } from '../types/agent';
import { SpriteAnimator } from './SpriteAnimator';
import type { SpriteSheet } from './SpriteAnimator';
import { drawProgressRing } from './ProgressRing';
import { gridToScreen } from './IsometricEngine';

const STATUS_TO_ANIMATION: Record<AgentState['status'], AnimationState> = {
  active: 'working',
  idle: 'idle',
  complete: 'celebrating',
  error: 'error',
  spawning: 'entering',
  terminated: 'exiting',
};

const WALK_SPEED = 2; // grid units per second

export class AgentEntity {
  private state: AgentState;
  private position: IsoPosition;
  private animator: SpriteAnimator;
  private walkTarget: IsoPosition | null = null;
  private interpolatedX: number;
  private interpolatedY: number;

  constructor(state: AgentState, position: IsoPosition, sheet: SpriteSheet) {
    this.state = state;
    this.position = { ...position };
    this.interpolatedX = position.gridX;
    this.interpolatedY = position.gridY;
    this.animator = new SpriteAnimator(sheet);
    this.applyStateAnimation();
  }

  updateState(newState: AgentState): void {
    this.state = newState;
    if (!this.walkTarget) {
      this.applyStateAnimation();
    }
    this.updateSpeedMultiplier();
  }

  walkTo(target: IsoPosition): void {
    this.walkTarget = { ...target };
    const dx = target.gridX - this.interpolatedX;
    this.animator.setState(dx >= 0 ? 'walking_right' : 'walking_left');
  }

  isWalking(): boolean {
    return this.walkTarget !== null;
  }

  update(dtSeconds: number): void {
    this.animator.update(dtSeconds * 1000);

    if (this.walkTarget) {
      const dx = this.walkTarget.gridX - this.interpolatedX;
      const dy = this.walkTarget.gridY - this.interpolatedY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.05) {
        this.interpolatedX = this.walkTarget.gridX;
        this.interpolatedY = this.walkTarget.gridY;
        this.position = { ...this.walkTarget };
        this.walkTarget = null;
        this.applyStateAnimation();
      } else {
        const step = Math.min(WALK_SPEED * dtSeconds, dist);
        this.interpolatedX += (dx / dist) * step;
        this.interpolatedY += (dy / dist) * step;
      }
    }
  }

  getScreenPosition(canvasWidth: number, canvasHeight: number): ScreenPosition {
    if (this.walkTarget) {
      return gridToScreen(this.interpolatedX, this.interpolatedY, canvasWidth, canvasHeight);
    }
    return gridToScreen(this.position.gridX, this.position.gridY, canvasWidth, canvasHeight);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    time: number,
  ): void {
    const screen = this.getScreenPosition(canvasWidth, canvasHeight);
    const { x, y } = screen;

    // Progress ring above sprite
    const ringY = y - 40;
    drawProgressRing(ctx, x, ringY, 20, this.state.progress, time);

    // Sprite
    this.animator.draw(ctx, x, y);

    // Name label below sprite
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.state.name, x, y + 28);

    // Progress percentage
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    const progressText = this.state.progress < 0
      ? 'ERR'
      : `${Math.round(this.state.progress)}%`;
    ctx.fillText(progressText, x, y + 40);
    ctx.restore();
  }

  containsPoint(
    screenX: number,
    screenY: number,
    canvasWidth: number,
    canvasHeight: number,
  ): boolean {
    const screen = this.getScreenPosition(canvasWidth, canvasHeight);
    const dx = Math.abs(screenX - screen.x);
    const dy = screenY - screen.y;
    return dx <= 32 && dy >= -64 && dy <= 32;
  }

  getState(): AgentState {
    return this.state;
  }

  getPosition(): IsoPosition {
    return { ...this.position };
  }

  private applyStateAnimation(): void {
    const animState = STATUS_TO_ANIMATION[this.state.status];
    this.animator.setState(animState);
    this.updateSpeedMultiplier();
  }

  private updateSpeedMultiplier(): void {
    const multiplier = 0.5 + (this.state.progress / 100) * 1.5;
    this.animator.setSpeedMultiplier(multiplier);
  }
}
