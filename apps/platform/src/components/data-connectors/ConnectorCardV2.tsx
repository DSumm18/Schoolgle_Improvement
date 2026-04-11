"use client";

import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { Connector } from '@/lib/data-connectors/types';

interface ConnectorCardV2Props {
  connector: Connector;
  onClick?: () => void;
}

const STATUS_ICON = {
  active: CheckCircle2,
  'setup-needed': AlertCircle,
  planned: Clock,
};

const STATUS_COLOUR = {
  active: 'text-emerald-500 border-emerald-500/30',
  'setup-needed': 'text-amber-500 border-amber-500/30',
  planned: 'text-muted-foreground border-border opacity-60',
};

const SETUP_TAG_STYLE: Record<string, string> = {
  auto: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  oauth: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  upload: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  api: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  byo: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  planned: 'bg-muted text-muted-foreground border-border',
};

export function ConnectorCardV2({ connector, onClick }: ConnectorCardV2Props) {
  const StatusIcon = STATUS_ICON[connector.status];
  const statusClass = STATUS_COLOUR[connector.status];
  const setupTagClass = SETUP_TAG_STYLE[connector.setupType] ?? SETUP_TAG_STYLE.auto;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors ${statusClass} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${connector.colour}15`, border: `1px solid ${connector.colour}33` }}
        >
          {connector.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground truncate">{connector.name}</h3>
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">
            {connector.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3 pt-2 border-t border-border/30">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${setupTagClass}`}>
          {connector.setupType}
        </span>
        {connector.rowCount !== undefined && connector.rowCount > 0 && (
          <span className="text-[9px] text-muted-foreground">
            {connector.rowCount.toLocaleString()} rows
          </span>
        )}
        {connector.joinKeys.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            {connector.joinKeys.slice(0, 3).map(key => (
              <span
                key={key}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20"
              >
                {key}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
