"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { YarnThread } from './YarnThread';
import { DataSourceNode } from './DataSourceNode';
import type { SourceConnectionStatus } from '@/lib/smart-connectors/types';

interface ConnectionMapProps {
  schoolName: string;
  schoolInitials: string;
  sources: SourceConnectionStatus[];
}

const NODE_POSITIONS = [
  { angle: -90, radius: 140 },
  { angle: -30, radius: 140 },
  { angle: 30, radius: 140 },
  { angle: 90, radius: 140 },
  { angle: 150, radius: 140 },
  { angle: 210, radius: 140 },
];

const CX = 250;
const CY = 200;

export function ConnectionMap({ schoolName, schoolInitials, sources }: ConnectionMapProps) {
  const [hoveredSource, setHoveredSource] = useState<SourceConnectionStatus | null>(null);

  const nodeCoords = NODE_POSITIONS.map((pos) => ({
    x: CX + pos.radius * Math.cos((pos.angle * Math.PI) / 180),
    y: CY + pos.radius * Math.sin((pos.angle * Math.PI) / 180),
  }));

  const connectedCount = sources.filter(s => s.connected).length;

  return (
    <div className="relative">
      <svg
        viewBox="0 0 500 400"
        className="w-full max-w-[600px] mx-auto"
        role="img"
        aria-label={`Data connection map for ${schoolName}`}
      >
        {/* Orbital rings */}
        <circle cx={CX} cy={CY} r={140} fill="none" stroke="#27272a" strokeWidth={1} strokeDasharray="4 8" opacity={0.5} />
        <circle cx={CX} cy={CY} r={90} fill="none" stroke="#27272a" strokeWidth={1} strokeDasharray="2 6" opacity={0.3} />

        {/* Yarn threads */}
        {sources.map((source, i) => (
          <YarnThread
            key={source.source.id}
            startX={CX}
            startY={CY}
            endX={nodeCoords[i].x}
            endY={nodeCoords[i].y}
            colour={source.source.colour}
            delay={i * 0.2}
            connected={source.connected}
          />
        ))}

        {/* Source nodes */}
        {sources.map((source, i) => (
          <DataSourceNode
            key={source.source.id}
            status={source}
            x={nodeCoords[i].x}
            y={nodeCoords[i].y}
            delay={0.3 + i * 0.15}
            onHover={setHoveredSource}
          />
        ))}

        {/* Centre school node */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <defs>
            <radialGradient id="schoolGradient" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6366f1" />
            </radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r={45} fill="url(#schoolGradient)" />
          <text x={CX} y={CY - 6} textAnchor="middle" fill="white" fontSize={16} fontWeight={800}>
            {schoolInitials}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fill="white" fontSize={7} opacity={0.8}>
            {connectedCount}/{sources.length} connected
          </text>
        </motion.g>
      </svg>

      {/* Hover tooltip */}
      {hoveredSource && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl p-4 shadow-xl max-w-xs z-10"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredSource.source.colour }} />
            <span className="text-sm font-bold text-foreground">{hoveredSource.source.name}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              hoveredSource.connected
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-zinc-500/15 text-zinc-400'
            }`}>
              {hoveredSource.connected ? 'Connected' : 'No data'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{hoveredSource.source.description}</p>
          {hoveredSource.connected && (
            <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
              <span>{hoveredSource.rowCount.toLocaleString()} rows</span>
              {hoveredSource.yearRange && <span>{hoveredSource.yearRange}</span>}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
