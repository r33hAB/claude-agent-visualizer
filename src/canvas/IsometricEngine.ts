import type { ScreenPosition, IsoPosition } from '../types/agent';

export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 64;

export interface Camera {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export type RenderCallback = (
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  dt: number,
) => void;

export function gridToScreen(
  gridX: number,
  gridY: number,
  canvasWidth: number,
  canvasHeight: number,
): ScreenPosition {
  const originX = canvasWidth / 2;
  const originY = canvasHeight / 3;
  return {
    x: originX + (gridX - gridY) * (TILE_WIDTH / 2),
    y: originY + (gridX + gridY) * (TILE_HEIGHT / 2),
  };
}

export function screenToGrid(
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
): IsoPosition {
  const originX = canvasWidth / 2;
  const originY = canvasHeight / 3;
  const dx = screenX - originX;
  const dy = screenY - originY;
  return {
    gridX: Math.round(dx / TILE_WIDTH + dy / TILE_HEIGHT),
    gridY: Math.round(dy / TILE_HEIGHT - dx / TILE_WIDTH),
  };
}

export class IsometricEngine {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera = { offsetX: 0, offsetY: 0, zoom: 1 };
  private renderCallback: RenderCallback | null = null;
  private animationFrameId: number | null = null;
  private lastTime = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;
  }

  setRenderCallback(cb: RenderCallback): void {
    this.renderCallback = cb;
  }

  start(): void {
    if (this.animationFrameId !== null) return;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  pan(dx: number, dy: number): void {
    this.camera.offsetX += dx;
    this.camera.offsetY += dy;
  }

  zoomTo(level: number): void {
    this.camera.zoom = Math.max(0.3, Math.min(3, level));
  }

  zoomBy(delta: number): void {
    this.zoomTo(this.camera.zoom + delta);
  }

  getCamera(): Camera {
    return { ...this.camera };
  }

  screenToWorld(x: number, y: number): ScreenPosition {
    return {
      x: (x - this.camera.offsetX) / this.camera.zoom,
      y: (y - this.camera.offsetY) / this.camera.zoom,
    };
  }

  worldToScreen(x: number, y: number): ScreenPosition {
    return {
      x: x * this.camera.zoom + this.camera.offsetX,
      y: y * this.camera.zoom + this.camera.offsetY,
    };
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  private loop(time: number): void {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.camera.offsetX, this.camera.offsetY);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    if (this.renderCallback) {
      this.renderCallback(this.ctx, this.getCamera(), dt);
    }

    this.ctx.restore();
    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }
}
