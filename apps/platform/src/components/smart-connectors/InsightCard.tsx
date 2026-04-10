"use client";

import { SourceBadge } from './SourceBadge';
import type { InsightData } from '@/lib/smart-connectors/types';

const CATEGORY_STYLES: Record<InsightData['category'], { colour: string; label: string }> = {
  strength: { colour: '#10b981', label: 'STRENGTH' },
  watch: { colour: '#f59e0b', label: 'WATCH' },
  inspector_flag: { colour: '#ef4444', label: 'INSPECTOR FLAG' },
  positive: { colour: '#10b981', label: 'POSITIVE' },
  data_quality: { colour: '#06b6d4', label: 'DATA QUALITY' },
};

export function InsightCard({ insight }: { insight: InsightData }) {
  const style = CATEGORY_STYLES[insight.category];

  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors">
      <div className="text-[9px] font-bold tracking-wider mb-1" style={{ color: style.colour }}>
        {style.label}
      </div>
      <div className="text-lg font-extrabold text-foreground mb-1" style={{ color: style.colour }}>
        {insight.stat}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
        {insight.detail}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {insight.sources.map((src, i) => (
          <SourceBadge key={i} name={src.table} colour={src.colour} verified={src.verified} />
        ))}
      </div>
    </div>
  );
}
