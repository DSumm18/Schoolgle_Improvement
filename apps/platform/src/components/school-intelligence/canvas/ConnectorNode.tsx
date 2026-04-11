"use client";

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { CanvasNode } from './hooks/useCanvasState';

interface ConnectorNodeProps {
  node: CanvasNode;
  onRemove: () => void;
  onDrag: (position: { x: number; y: number }) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function ConnectorNode({ node, onRemove, onDrag, canvasWidth, canvasHeight }: ConnectorNodeProps) {
  const { connector, position } = node;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{
        left: 0,
        top: 0,
        right: canvasWidth - 180,
        bottom: canvasHeight - 80,
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onDragEnd={(_, info) => {
        onDrag({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y,
        });
      }}
      className="absolute group cursor-grab active:cursor-grabbing"
      style={{ width: 180 }}
    >
      <div
        className="rounded-xl border-2 bg-card shadow-xl p-3"
        style={{
          borderColor: connector.colour,
          backgroundColor: `${connector.colour}10`,
        }}
      >
        <div className="flex items-start gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
            style={{ backgroundColor: `${connector.colour}25`, border: `1px solid ${connector.colour}66` }}
          >
            {connector.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-foreground truncate">{connector.name}</div>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {connector.joinKeys.slice(0, 3).map((key) => (
                <span
                  key={key}
                  className="text-[8px] font-mono px-1 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30"
                >
                  {key}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-card hover:bg-red-500/20 hover:text-red-500 transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
