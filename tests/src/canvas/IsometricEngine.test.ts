import { describe, it, expect } from 'vitest';
import { gridToScreen, screenToGrid, TILE_WIDTH, TILE_HEIGHT } from '../../../src/canvas/IsometricEngine';

describe('IsometricEngine coordinate transforms', () => {
  it('converts grid origin to screen center', () => {
    const screen = gridToScreen(0, 0, 800, 600);
    expect(screen.x).toBe(400);
    expect(screen.y).toBe(200);
  });

  it('converts grid (1,0) to correct screen position', () => {
    const screen = gridToScreen(1, 0, 800, 600);
    expect(screen.x).toBe(400 + TILE_WIDTH / 2);
    expect(screen.y).toBe(200 + TILE_HEIGHT / 2);
  });

  it('converts grid (0,1) to correct screen position', () => {
    const screen = gridToScreen(0, 1, 800, 600);
    expect(screen.x).toBe(400 - TILE_WIDTH / 2);
    expect(screen.y).toBe(200 + TILE_HEIGHT / 2);
  });

  it('round-trips grid -> screen -> grid', () => {
    const original = { gridX: 3, gridY: 2 };
    const screen = gridToScreen(original.gridX, original.gridY, 800, 600);
    const back = screenToGrid(screen.x, screen.y, 800, 600);
    expect(back.gridX).toBe(original.gridX);
    expect(back.gridY).toBe(original.gridY);
  });

  it('handles negative grid coords', () => {
    const screen = gridToScreen(-1, -1, 800, 600);
    expect(typeof screen.x).toBe('number');
    expect(typeof screen.y).toBe('number');
    const back = screenToGrid(screen.x, screen.y, 800, 600);
    expect(back.gridX).toBe(-1);
    expect(back.gridY).toBe(-1);
  });
});
