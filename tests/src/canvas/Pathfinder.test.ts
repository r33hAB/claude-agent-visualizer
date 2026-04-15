import { describe, it, expect } from 'vitest';
import { findPath } from '../../../src/canvas/Pathfinder';
import type { IsoPosition } from '../../../src/types/agent';

describe('findPath', () => {
  it('returns direct path between adjacent cells', () => {
    const from: IsoPosition = { gridX: 0, gridY: 0 };
    const to: IsoPosition = { gridX: 1, gridY: 0 };
    const occupied = new Set<string>();
    const path = findPath(from, to, occupied);
    expect(path).toHaveLength(2);
    expect(path[0]).toEqual(from);
    expect(path[1]).toEqual(to);
  });

  it('navigates around obstacles', () => {
    const from: IsoPosition = { gridX: 0, gridY: 0 };
    const to: IsoPosition = { gridX: 2, gridY: 0 };
    const occupied = new Set(['1,0']);
    const path = findPath(from, to, occupied);
    expect(path.length).toBeGreaterThan(2);
    expect(path[path.length - 1]).toEqual(to);
    expect(path.some(p => p.gridX === 1 && p.gridY === 0)).toBe(false);
  });

  it('returns start only when already at destination', () => {
    const pos: IsoPosition = { gridX: 3, gridY: 3 };
    const path = findPath(pos, pos, new Set());
    expect(path).toHaveLength(1);
    expect(path[0]).toEqual(pos);
  });
});
