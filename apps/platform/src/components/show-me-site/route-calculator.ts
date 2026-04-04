/**
 * Route Calculator for QR Wayfinding
 *
 * Calculates paths between rooms using corridor midpoints.
 * MVP: room centre → corridor junction → corridor junction → room centre
 */

import { ROOM_OUTLINES, type RoomOutline } from './grove-house-3d-data';

export interface RoutePoint {
  x: number;
  z: number;
}

export interface Route {
  from: RoomOutline;
  to: RoomOutline;
  points: RoutePoint[];
  distance: number;          // metres (world units ≈ metres)
  estimatedWalkTime: number; // seconds (assume ~1.2 m/s walking speed indoors)
}

/**
 * Corridor junction nodes — key waypoints in the building's internal corridors.
 * Routes go: room centre → nearest junction → junctions → nearest junction → room centre
 */
const CORRIDOR_JUNCTIONS: { id: string; x: number; z: number; connections: string[] }[] = [
  // Main spine corridor (east-west through Blocks 1 & 2)
  { id: 'J-B12-S', x: -15.9, z: -4.6, connections: ['J-B12-N', 'J-B2-S'] },
  { id: 'J-B12-N', x: -15.9, z: 0.0, connections: ['J-B12-S', 'J-B3-W', 'J-B2-N'] },
  { id: 'J-B2-S',  x: -25.4, z: -4.6, connections: ['J-B12-S', 'J-B2-N', 'J-2001-E'] },
  { id: 'J-B2-N',  x: -25.4, z: 0.0, connections: ['J-B2-S', 'J-B12-N', 'J-2001-E'] },

  // 2001 Building corridor
  { id: 'J-2001-E', x: -30.5, z: 8.1, connections: ['J-B2-S', 'J-B2-N', 'J-2001-N'] },
  { id: 'J-2001-N', x: -40.9, z: 12.0, connections: ['J-2001-E'] },

  // Central junction (connecting Blocks 1/2 to Block 3)
  { id: 'J-B3-W', x: -10.7, z: 8.0, connections: ['J-B12-N', 'J-B3-E', 'J-B4-S'] },
  { id: 'J-B3-E', x: -0.5, z: 8.0, connections: ['J-B3-W', 'J-ENT'] },

  // Main entrance junction
  { id: 'J-ENT', x: -5.0, z: -3.0, connections: ['J-B3-E', 'J-B12-N'] },

  // Block 4 corridor
  { id: 'J-B4-S', x: -4.0, z: 19.4, connections: ['J-B3-W', 'J-B4-N'] },
  { id: 'J-B4-N', x: -4.0, z: 23.2, connections: ['J-B4-S', 'J-2017'] },

  // 2017 Building corridor
  { id: 'J-2017', x: -5.0, z: 27.4, connections: ['J-B4-N'] },
];

/** Find the nearest corridor junction to a room */
function nearestJunction(room: RoomOutline): string {
  const cx = room.x + room.w / 2;
  const cz = room.z + room.d / 2;
  let best = CORRIDOR_JUNCTIONS[0].id;
  let bestDist = Infinity;

  for (const j of CORRIDOR_JUNCTIONS) {
    const d = Math.hypot(j.x - cx, j.z - cz);
    if (d < bestDist) {
      bestDist = d;
      best = j.id;
    }
  }
  return best;
}

/** BFS shortest path through junction graph */
function findJunctionPath(fromId: string, toId: string): string[] | null {
  if (fromId === toId) return [fromId];

  const junctionMap = new Map(CORRIDOR_JUNCTIONS.map(j => [j.id, j]));
  const visited = new Set<string>();
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];
  visited.add(fromId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = junctionMap.get(current.id);
    if (!node) continue;

    for (const neighbour of node.connections) {
      if (neighbour === toId) {
        return [...current.path, toId];
      }
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push({ id: neighbour, path: [...current.path, neighbour] });
      }
    }
  }
  return null;
}

/** Calculate distance along a series of points */
function pathDistance(points: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
  }
  return Math.round(total * 10) / 10; // round to 1dp
}

/** Room centre point */
function roomCentre(room: RoomOutline): RoutePoint {
  return { x: room.x + room.w / 2, z: room.z + room.d / 2 };
}

/**
 * Calculate a route between two rooms by systemId.
 * Returns null if either room ID is invalid.
 */
export function calculateRoute(fromId: string, toId: string): Route | null {
  const fromRoom = ROOM_OUTLINES.find(r => r.systemId === fromId);
  const toRoom = ROOM_OUTLINES.find(r => r.systemId === toId);

  if (!fromRoom || !toRoom) return null;

  const fromCentre = roomCentre(fromRoom);
  const toCentre = roomCentre(toRoom);

  // Same room
  if (fromId === toId) {
    return {
      from: fromRoom,
      to: toRoom,
      points: [fromCentre],
      distance: 0,
      estimatedWalkTime: 0,
    };
  }

  // Find nearest junctions and path between them
  const fromJunction = nearestJunction(fromRoom);
  const toJunction = nearestJunction(toRoom);
  const junctionPath = findJunctionPath(fromJunction, toJunction);
  const junctionMap = new Map(CORRIDOR_JUNCTIONS.map(j => [j.id, j]));

  // Build point list: room → junctions → room
  const points: RoutePoint[] = [fromCentre];

  if (junctionPath) {
    for (const jId of junctionPath) {
      const j = junctionMap.get(jId);
      if (j) points.push({ x: j.x, z: j.z });
    }
  } else {
    // Fallback: direct line via midpoint
    points.push({
      x: (fromCentre.x + toCentre.x) / 2,
      z: (fromCentre.z + toCentre.z) / 2,
    });
  }

  points.push(toCentre);

  const distance = pathDistance(points);
  const estimatedWalkTime = Math.ceil(distance / 1.2); // ~1.2 m/s walking

  return {
    from: fromRoom,
    to: toRoom,
    points,
    distance,
    estimatedWalkTime,
  };
}
