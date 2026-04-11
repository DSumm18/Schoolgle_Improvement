"use client";

import { useDraggable } from '@dnd-kit/core';
import type { Connector } from '@/lib/data-connectors/types';

const LAYER_SECTIONS = [
  { layer: 1, title: 'DfE Data (we-control)' },
  { layer: 2, title: 'School Data (live)' },
  { layer: 3, title: 'Your Uploads (BYO)' },
  { layer: 4, title: 'Derived Reports' },
];

interface ConnectorShelfProps {
  connectors: Connector[];
  placedIds: string[];
}

function DraggableConnector({ connector, placed }: { connector: Connector; placed: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `shelf-${connector.id}`,
    data: { connector },
    disabled: placed || connector.status === 'planned',
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 rounded-lg border transition-all mb-1.5 ${
        placed
          ? 'border-border/40 bg-card/40 opacity-40 cursor-not-allowed'
          : connector.status === 'planned'
            ? 'border-border/40 bg-card/40 opacity-50 cursor-not-allowed'
            : isDragging
              ? 'border-purple-500 bg-purple-500/20 cursor-grabbing scale-105'
              : 'border-border bg-card hover:border-purple-500/50 hover:bg-purple-500/5 cursor-grab'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-sm flex-shrink-0"
          style={{ backgroundColor: `${connector.colour}20`, border: `1px solid ${connector.colour}55` }}
        >
          {connector.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-foreground truncate">{connector.name}</div>
          <div className="text-[9px] text-muted-foreground truncate">
            {connector.joinKeys.length > 0 ? connector.joinKeys.slice(0, 3).join(' · ') : '—'}
          </div>
        </div>
        {placed && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      </div>
    </div>
  );
}

export function ConnectorShelf({ connectors, placedIds }: ConnectorShelfProps) {
  return (
    <div className="h-full flex flex-col bg-card/50 border-r border-border overflow-hidden">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Your Connectors</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">Drag onto the canvas →</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {LAYER_SECTIONS.map((section) => {
          const sectionConnectors = connectors.filter((c) => c.layer === section.layer);
          if (sectionConnectors.length === 0) return null;
          return (
            <div key={section.layer} className="mb-4">
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                {section.title}
              </div>
              {sectionConnectors.map((c) => (
                <DraggableConnector
                  key={c.id}
                  connector={c}
                  placed={placedIds.includes(c.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
