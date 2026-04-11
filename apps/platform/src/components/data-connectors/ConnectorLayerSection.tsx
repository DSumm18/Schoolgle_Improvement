"use client";

import { ConnectorCardV2 } from './ConnectorCardV2';
import type { Connector, ConnectorLayer } from '@/lib/data-connectors/types';

const LAYER_META: Record<ConnectorLayer, { title: string; subtitle: string; colour: string; emoji: string }> = {
  1: {
    title: 'Layer 1 — We-Control',
    subtitle: 'Auto-connected. Zero school effort. We are data controller. National benchmark layer.',
    colour: '#1d70b8',
    emoji: '🏛',
  },
  2: {
    title: 'Layer 2 — School-Control Pre-Built',
    subtitle: 'School authorises access. We are data processor. Common MIS and Drive systems.',
    colour: '#10b981',
    emoji: '🔐',
  },
  3: {
    title: 'Layer 3 — Bring Your Own (BYO)',
    subtitle: 'Plug in ANY data source. Name it. Map columns. Use it anywhere.',
    colour: '#a78bfa',
    emoji: '📑',
  },
  4: {
    title: 'Layer 4 — Derived Connectors',
    subtitle: 'Reports built by combining other layers become connectors themselves.',
    colour: '#f59e0b',
    emoji: '📊',
  },
};

interface Props {
  layer: ConnectorLayer;
  connectors: Connector[];
  extraAction?: React.ReactNode;
}

export function ConnectorLayerSection({ layer, connectors, extraAction }: Props) {
  const meta = LAYER_META[layer];

  return (
    <div className="mb-8">
      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-border">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${meta.colour}15`, border: `1.5px solid ${meta.colour}44` }}
        >
          {meta.emoji}
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-foreground">{meta.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
        </div>
        {extraAction}
      </div>

      {connectors.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
          No connectors in this layer yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {connectors.map(c => (
            <ConnectorCardV2 key={c.id} connector={c} />
          ))}
        </div>
      )}
    </div>
  );
}
