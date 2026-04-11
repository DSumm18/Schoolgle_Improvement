"use client";

import { useState, useCallback, useMemo } from 'react';
import type { Connector, JoinKey } from '@/lib/data-connectors/types';
import { findInitialPosition } from '../lib/layout';

export interface CanvasNode {
  id: string;
  connector: Connector;
  position: { x: number; y: number };
  joinKeys: JoinKey[];
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sharedKey: JoinKey;
}

export function useCanvasState() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);

  const addConnector = useCallback((connector: Connector, position?: { x: number; y: number }) => {
    setNodes((current) => {
      // Prevent duplicates
      if (current.some((n) => n.connector.id === connector.id)) {
        return current;
      }
      const node: CanvasNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        connector,
        position: position ?? findInitialPosition(current),
        joinKeys: connector.joinKeys,
      };
      return [...current, node];
    });
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setNodes((current) => current.filter((n) => n.id !== nodeId));
  }, []);

  const moveNode = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes((current) => current.map((n) => (n.id === nodeId ? { ...n, position } : n)));
  }, []);

  const clear = useCallback(() => setNodes([]), []);

  // Auto-compute edges from shared join keys
  const edges: CanvasEdge[] = useMemo(() => {
    const result: CanvasEdge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const shared = a.joinKeys.filter((k) => b.joinKeys.includes(k));
        for (const key of shared) {
          result.push({
            id: `${a.id}-${b.id}-${key}`,
            sourceNodeId: a.id,
            targetNodeId: b.id,
            sharedKey: key,
          });
        }
      }
    }
    return result;
  }, [nodes]);

  const placedConnectorIds = useMemo(() => nodes.map((n) => n.connector.id), [nodes]);

  return {
    nodes,
    edges,
    placedConnectorIds,
    addConnector,
    removeNode,
    moveNode,
    clear,
  };
}
