"use client";

import type { CanvasNode, CanvasEdge } from './hooks/useCanvasState';
import { nodeCenter } from './lib/layout';

interface EdgeLayerProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  outputPosition?: { x: number; y: number };
}

export function EdgeLayer({ nodes, edges, outputPosition }: EdgeLayerProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#a78bfa" opacity="0.7" />
        </marker>
      </defs>

      {/* Join edges between connector nodes */}
      {edges.map((edge) => {
        const src = nodes.find((n) => n.id === edge.sourceNodeId);
        const tgt = nodes.find((n) => n.id === edge.targetNodeId);
        if (!src || !tgt) return null;

        const sc = nodeCenter(src);
        const tc = nodeCenter(tgt);
        const midX = (sc.x + tc.x) / 2;
        const midY = (sc.y + tc.y) / 2;

        const colour = src.connector.colour;

        return (
          <g key={edge.id}>
            <line
              x1={sc.x}
              y1={sc.y}
              x2={tc.x}
              y2={tc.y}
              stroke={colour}
              strokeOpacity={0.5}
              strokeWidth={2}
              strokeDasharray="6 3"
            />
            <rect
              x={midX - 22}
              y={midY - 8}
              width={44}
              height={16}
              rx={8}
              fill="#0a0a0f"
              stroke={colour}
              strokeOpacity={0.6}
            />
            <text
              x={midX}
              y={midY + 3}
              textAnchor="middle"
              fontSize="9"
              fontFamily="monospace"
              fill={colour}
              fontWeight="600"
            >
              {edge.sharedKey}
            </text>
          </g>
        );
      })}

      {/* Thick glow edges from every connector node to the output */}
      {outputPosition &&
        nodes.map((node) => {
          const nc = nodeCenter(node);
          return (
            <line
              key={`out-${node.id}`}
              x1={nc.x}
              y1={nc.y}
              x2={outputPosition.x}
              y2={outputPosition.y}
              stroke="url(#outputGradient)"
              strokeOpacity={0.3}
              strokeWidth={1.5}
            />
          );
        })}

      <defs>
        <linearGradient id="outputGradient" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
