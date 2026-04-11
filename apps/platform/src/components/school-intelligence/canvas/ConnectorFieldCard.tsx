"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, Database, CheckCircle2 } from 'lucide-react';
import type { Connector } from '@/lib/data-connectors/types';
import { getFieldGroup, formatSampleValue } from './lib/field-manifest';
import { supabase } from '@/lib/supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

interface ConnectorFieldCardProps {
  connector: Connector;
  urn: number;
  required: boolean;
  initiallyExpanded?: boolean;
}

export function ConnectorFieldCard({ connector, urn, required, initiallyExpanded = true }: ConnectorFieldCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [sampleRow, setSampleRow] = useState<Record<string, unknown> | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  const fieldGroup = getFieldGroup(connector.id);

  useEffect(() => {
    if (!fieldGroup || !expanded || sampleRow) return;
    let cancelled = false;
    async function loadSample() {
      setLoadingSample(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `/api/data-connectors/sample-values?table=${fieldGroup!.table}&urn=${urn}`,
          { headers },
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setSampleRow(data.data?.row ?? null);
        }
      } catch {
        // swallow — sample values are best-effort
      } finally {
        if (!cancelled) setLoadingSample(false);
      }
    }
    loadSample();
    return () => { cancelled = true; };
  }, [fieldGroup, expanded, urn, sampleRow]);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-colors"
      style={{
        borderColor: `${connector.colour}55`,
        backgroundColor: `${connector.colour}08`,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-card/30"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{
            backgroundColor: `${connector.colour}20`,
            border: `1px solid ${connector.colour}66`,
          }}
        >
          {connector.icon}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground truncate">{connector.name}</h3>
            {required && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                REQUIRED
              </span>
            )}
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{connector.description}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && fieldGroup && (
        <div className="border-t border-border/40 p-4 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Database className="w-3 h-3 text-muted-foreground" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              {fieldGroup.fields.length} fields from {fieldGroup.table}
            </span>
            {loadingSample && (
              <span className="text-[9px] text-muted-foreground italic">· loading live sample...</span>
            )}
          </div>
          <div className="space-y-1.5">
            {fieldGroup.fields.map((field) => {
              const value = sampleRow ? sampleRow[field.id] : undefined;
              const sample = formatSampleValue(value, field.format);
              return (
                <div
                  key={field.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-card/50 border border-border/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-foreground">{field.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">{field.description}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      Grove House
                    </div>
                    <div
                      className={`text-xs font-bold font-mono ${
                        sample === '—' ? 'text-muted-foreground' : 'text-purple-400'
                      }`}
                    >
                      {sample}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expanded && !fieldGroup && (
        <div className="border-t border-border/40 p-4 text-[11px] text-muted-foreground italic">
          Field details for this connector aren&apos;t documented yet.
        </div>
      )}
    </div>
  );
}
