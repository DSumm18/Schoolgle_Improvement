"use client";

import { ArrowLeft, Sparkles, Shield, Loader2 } from 'lucide-react';
import { ConnectorFieldCard } from './ConnectorFieldCard';
import type { ReportTemplate } from './lib/templates';
import type { Connector } from '@/lib/data-connectors/types';

interface ConfigureStepProps {
  template: ReportTemplate;
  allConnectors: Connector[];
  urn: number;
  timePeriod: string;
  audience: string;
  onTimePeriodChange: (v: string) => void;
  onAudienceChange: (v: string) => void;
  onBack: () => void;
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
}

export function ConfigureStep(props: ConfigureStepProps) {
  const {
    template,
    allConnectors,
    urn,
    timePeriod,
    audience,
    onTimePeriodChange,
    onAudienceChange,
    onBack,
    onGenerate,
    generating,
    error,
  } = props;

  const requiredConnectors = template.requiredConnectorIds
    .map((id) => allConnectors.find((c) => c.id === id))
    .filter((c): c is Connector => c !== undefined);
  const optionalConnectors = template.optionalConnectorIds
    .map((id) => allConnectors.find((c) => c.id === id))
    .filter((c): c is Connector => c !== undefined);

  return (
    <div>
      {/* Header + back */}
      <div className="mb-4 flex items-start gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-border bg-card hover:bg-muted/50 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Step 2 of 3 · Configure
          </div>
          <h2 className="text-lg font-bold text-foreground">{template.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: what data the report uses */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Data the report will use
            </h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              Every field below is a live data source. The sample values come straight from your school&apos;s DfE data.
            </p>
            <div className="space-y-3">
              {requiredConnectors.map((c) => (
                <ConnectorFieldCard key={c.id} connector={c} urn={urn} required />
              ))}
            </div>
          </div>

          {optionalConnectors.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Adds richness if available
              </h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                These connectors are optional — your report will use them if Schoolgle has the data, or call them out as gaps if not.
              </p>
              <div className="space-y-3">
                {optionalConnectors.map((c) => (
                  <ConnectorFieldCard key={c.id} connector={c} urn={urn} required={false} initiallyExpanded={false} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: settings + generate */}
        <div>
          <div className="sticky top-4 space-y-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                Report Settings
              </h3>

              <div className="mb-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Time Period
                </label>
                <select
                  value={timePeriod}
                  onChange={(e) => onTimePeriodChange(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-xs"
                >
                  <option>Last 5 years</option>
                  <option>Last 3 years</option>
                  <option>Current year only</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => onAudienceChange(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-xs"
                >
                  <option>Governors</option>
                  <option>SLT</option>
                  <option>Ofsted</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Format
                </label>
                <select className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-xs">
                  <option>Narrative Document</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                  Privacy Shield Active
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Every data point passes through SchoolDataGuardian before reaching Gemini. Public school info is allowlisted.
              </p>
            </div>

            <button
              onClick={onGenerate}
              disabled={generating}
              className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                generating
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/20'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-[11px] text-red-400">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
