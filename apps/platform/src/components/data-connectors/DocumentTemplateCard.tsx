"use client";

import { FileText, Clock, Check } from 'lucide-react';

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  requiredConnectors: { id: string; name: string; available: boolean }[];
  status: 'ready' | 'coming-soon';
}

interface Props {
  template: DocumentTemplate;
  onTry?: (templateId: string) => void;
  loading?: boolean;
}

export function DocumentTemplateCard({ template, onTry, loading }: Props) {
  const disabled = template.status === 'coming-soon';
  const availableCount = template.requiredConnectors.filter(c => c.available).length;
  const totalCount = template.requiredConnectors.length;

  return (
    <div className="min-w-[280px] max-w-[320px] p-4 rounded-xl border border-border bg-card hover:border-purple-500/40 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
          <FileText className="w-5 h-5 text-purple-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">{template.title}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{template.description}</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {template.requiredConnectors.map(c => (
          <div key={c.id} className="flex items-center gap-1.5 text-[10px]">
            {c.available ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Clock className="w-3 h-3 text-amber-500" />
            )}
            <span className={c.available ? 'text-foreground' : 'text-muted-foreground'}>
              {c.name}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => !disabled && !loading && onTry?.(template.id)}
        disabled={disabled || loading}
        className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
          disabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-70'
        }`}
      >
        {disabled
          ? 'Coming soon'
          : loading
            ? 'Generating...'
            : `Try it (${availableCount}/${totalCount} connectors)`}
      </button>
    </div>
  );
}
