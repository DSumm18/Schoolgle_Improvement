"use client";

import { Shield } from 'lucide-react';
import { TEMPLATES } from './lib/templates';

interface SettingsPanelProps {
  selectedTemplateId: string;
  onTemplateChange: (id: string) => void;
  placedCount: number;
}

export function SettingsPanel({ selectedTemplateId, onTemplateChange, placedCount }: SettingsPanelProps) {
  return (
    <div className="h-full flex flex-col bg-card/50 border-l border-border overflow-hidden">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Report Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Template
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border border-border bg-card text-xs"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id} disabled={t.status === 'coming-soon'}>
                {t.title} {t.status === 'coming-soon' ? '(soon)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Visualisation
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {['📄 Narrative', '📊 Dashboard', '📈 Chart', '🗺 Map'].map((label, i) => (
              <button
                key={label}
                className={`px-2 py-1.5 rounded-md border text-[10px] ${
                  i === 0
                    ? 'border-purple-500/50 bg-purple-500/15 text-purple-400'
                    : 'border-border bg-card text-muted-foreground cursor-not-allowed opacity-60'
                }`}
                disabled={i !== 0}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Time Period
          </label>
          <select className="w-full px-2 py-1.5 rounded-md border border-border bg-card text-xs">
            <option>Last 5 years</option>
            <option>Last 3 years</option>
            <option>Current year only</option>
          </select>
        </div>

        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Audience
          </label>
          <select className="w-full px-2 py-1.5 rounded-md border border-border bg-card text-xs">
            <option>Governors</option>
            <option>SLT</option>
            <option>Ofsted</option>
          </select>
        </div>

        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Format
          </label>
          <select className="w-full px-2 py-1.5 rounded-md border border-border bg-card text-xs">
            <option>Markdown Narrative</option>
          </select>
        </div>

        <div className="mt-4 p-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/25">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Privacy Shield Active</div>
          </div>
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            All data passes through SchoolDataGuardian before Gemini sees it. Public school info is allowlisted.
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-card border border-border">
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Canvas</div>
          <div className="text-xs text-foreground font-semibold">{placedCount} connector{placedCount !== 1 ? 's' : ''} placed</div>
        </div>
      </div>
    </div>
  );
}
