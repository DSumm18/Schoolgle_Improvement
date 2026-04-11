"use client";

import { FileText, Clock, ChevronRight } from 'lucide-react';
import { TEMPLATES } from './lib/templates';

interface TemplatePickerStepProps {
  onPick: (templateId: string) => void;
}

export function TemplatePickerStep({ onPick }: TemplatePickerStepProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">Pick a report type</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose what you want Schoolgle to build for you. We handle the data, the LLM, and the privacy shield.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((t) => {
          const disabled = t.status === 'coming-soon';
          return (
            <button
              key={t.id}
              onClick={() => !disabled && onPick(t.id)}
              disabled={disabled}
              className={`text-left p-5 rounded-2xl border transition-all ${
                disabled
                  ? 'border-border bg-card opacity-50 cursor-not-allowed'
                  : 'border-border bg-card hover:border-purple-500/60 hover:bg-purple-500/5 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    disabled
                      ? 'bg-muted'
                      : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/40'
                  }`}
                >
                  {disabled ? (
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <FileText className="w-6 h-6 text-purple-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {t.description}
                  </p>
                </div>
                {!disabled && <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-border/50">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Uses:
                </span>
                {[...t.requiredConnectorIds, ...t.optionalConnectorIds].slice(0, 4).map((cid) => (
                  <span
                    key={cid}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border"
                  >
                    {cid}
                  </span>
                ))}
                {disabled && (
                  <span className="ml-auto text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                    Coming soon
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
