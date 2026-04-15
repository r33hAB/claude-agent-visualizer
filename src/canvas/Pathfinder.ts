import type { IsoPosition } from '../types/agent';

interface AStarNode {
  pos: IsoPosition;
  g: number;
  f: number;
  parent: string | null;
}

const DIRECTIONS: [number, number, number][] = [
  [1, 0, 1],    [-1, 0, 1],   [0, 1, 1],    [0, -1, 1],
  [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414],
];

function posKey(x: number, y: number): string {
  return `${x},${y}`;
}

function heuristic(a: IsoPosition, b: IsoPosition): number {
  return Math.abs(a.gridX - b.gridX) + Math.abs(a.gridY - b.gridY);
}

export function findPath(
  from: IsoPosition,
  to: IsoPosition,
  occupied: Set<string>,
  maxSteps = 100,
): IsoPosition[] {
  if (from.gridX === to.gridX && from.gridY === to.gridY) {
    return [{ gridX: from.gridX, gridY: from.gridY }];
  }

  const startKey = posKey(from.gridX, from.gridY);
  const goalKey = posKey(to.gridX, to.gridY);

  const open = new Map<string, AStarNode>();
  const closed = new Set<string>();
  const allNodes = new Map<string, AStarNode>();

  const startNode: AStarNode = {
    pos: { gridX: from.gridX, gridY: from.gridY },
    g: 0,
    f: heuristic(from, to),
    parent: null,
  };

  open.set(startKey, startNode);
  allNodes.set(startKey, startNode);

  let steps = 0;

  while (open.size > 0 && steps < maxSteps) {
    steps++;

    // Find node with lowest f in open set
    let bestKey: string | null = null;
    let bestF = Infinity;
    for (const [key, node] of open) {
      if (node.f < bestF) {
        bestF = node.f;
        bestKey = key;
      }
    }

    if (bestKey === null) break;

    const current = open.get(bestKey)!;
    open.delete(bestKey);
    closed.add(bestKey);

    // Goal reached — reconstruct path
    if (bestKey === goalKey) {
      const path: IsoPosition[] = [];
      let traceKey: string | null = bestKey;
      while (traceKey !== null) {
        const node = allNodes.get(traceKey)!;
        path.push({ gridX: node.pos.gridX, gridY: node.pos.gridY });
        traceKey = node.parent;
      }
      path.reverse();
      return path;
    }

    // Expand neighbors
    for (const [dx, dy, cost] of DIRECTIONS) {
      const nx = current.pos.gridX + dx;
      const ny = current.pos.gridY + dy;
      const nKey = posKey(nx, ny);

      if (occupied.has(nKey) || closed.has(nKey)) continue;

      const tentativeG = current.g + cost;
      const existing = open.get(nKey);

      if (existing && tentativeG >= existing.g) continue;

      const neighbor: AStarNode = {
        pos: { gridX: nx, gridY: ny },
        g: tentativeG,
        f: tentativeG + heuristic({ gridX: nx, gridY: ny }, to),
        parent: bestKey,
      };

      open.set(nKey, neighbor);
      allNodes.set(nKey, neighbor);
    }
  }

  // No path found — return direct line
  return [
    { gridX: from.gridX, gridY: from.gridY },
    { gridX: to.gridX, gridY: to.gridY },
  ];
}
