import type { CanvasNode } from '../hooks/useCanvasState';

/**
 * Choose an initial position for a new node, avoiding overlap with existing nodes.
 */
export function findInitialPosition(existing: CanvasNode[]): { x: number; y: number } {
  const startX = 80;
  const startY = 80;
  const step = 110;

  // Simple grid fill — rows of 3
  const index = existing.length;
  const col = index % 3;
  const row = Math.floor(index / 3);

  return {
    x: startX + col * (step * 1.5),
    y: startY + row * step,
  };
}

export function nodeCenter(node: CanvasNode): { x: number; y: number } {
  return {
    x: node.position.x + 90, // node width/2
    y: node.position.y + 40, // node height/2
  };
}
