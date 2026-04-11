"use client";

import { useRef, useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ConnectorNode } from './ConnectorNode';
import { EdgeLayer } from './EdgeLayer';
import { OutputNode } from './OutputNode';
import { nodeCenter } from './lib/layout';
import type { CanvasNode, CanvasEdge } from './hooks/useCanvasState';
import type { ReportTemplate } from './lib/templates';

interface CanvasBoardProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  template: ReportTemplate;
  canGenerate: boolean;
  missing: string[];
  generating: boolean;
  onRemoveNode: (id: string) => void;
  onMoveNode: (id: string, position: { x: number; y: number }) => void;
  onGenerate: () => void;
}

export function CanvasBoard(props: CanvasBoardProps) {
  const { nodes, edges, template, canGenerate, missing, generating, onRemoveNode, onMoveNode, onGenerate } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 500 });

  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-board' });

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const outputPosition = { x: Math.max(size.width - 280, 400), y: 80 };
  const outputCenter = { x: outputPosition.x + 120, y: outputPosition.y + 80 };

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        setNodeRef(el);
      }}
      className={`relative flex-1 overflow-hidden transition-colors ${
        isOver ? 'bg-purple-500/5' : 'bg-background'
      }`}
      style={{
        backgroundImage: `radial-gradient(#27272a 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Empty state hint */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          <div>
            <div className="text-sm font-semibold text-muted-foreground mb-1">Drag connectors here</div>
            <div className="text-[11px] text-muted-foreground/60">
              Edges auto-draw when nodes share a join key (urn, postcode, pupil_hash…)
            </div>
          </div>
        </div>
      )}

      {/* Edges first (behind nodes) */}
      <EdgeLayer nodes={nodes} edges={edges} outputPosition={nodes.length > 0 ? outputCenter : undefined} />

      {/* Connector nodes */}
      {nodes.map((node) => (
        <ConnectorNode
          key={node.id}
          node={node}
          canvasWidth={size.width}
          canvasHeight={size.height}
          onRemove={() => onRemoveNode(node.id)}
          onDrag={(pos) => onMoveNode(node.id, pos)}
        />
      ))}

      {/* Output node */}
      <OutputNode
        template={template}
        position={outputPosition}
        canGenerate={canGenerate}
        missing={missing}
        generating={generating}
        onGenerate={onGenerate}
      />
    </div>
  );
}
