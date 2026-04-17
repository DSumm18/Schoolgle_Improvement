"use client";

import { useState } from 'react';
import { Brain, Sparkles, LayoutDashboard, Activity } from 'lucide-react';
import Link from 'next/link';
import { DocumentTemplateCard, type DocumentTemplate } from '@/components/data-connectors/DocumentTemplateCard';
import { supabase } from '@/lib/supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

const GROVE_HOUSE_URN = 148201;

interface StoryResult {
  documentId: string;
  title: string;
  narrative: string;
  sourceConnectors: string[];
  missingConnectors: { id: string; name: string; reason: string }[];
  llmModel: string;
  llmTokensUsed: number;
}

export default function SchoolIntelligencePage() {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [result, setResult] = useState<StoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const templates: DocumentTemplate[] = [
    {
      id: 'attendance-story',
      title: 'Attendance Story for Governors',
      description: 'Plain-English attendance narrative with trends, context, and suggested actions. Built from DfE historic + census data.',
      requiredConnectors: [
        { id: 'dfe-attendance', name: 'DfE Attendance', available: true },
        { id: 'dfe-census', name: 'DfE Census', available: true },
        { id: 'contextual-factors', name: 'Contextual Factors', available: false },
      ],
      status: 'ready',
    },
    {
      id: 'sef-section',
      title: 'SEF Section Draft',
      description: 'Draft an Ofsted SEF section from your connected evidence and data.',
      requiredConnectors: [
        { id: 'google-drive', name: 'Google Drive', available: true },
        { id: 'dfe-ks2-results', name: 'DfE KS2', available: true },
      ],
      status: 'coming-soon',
    },
    {
      id: 'finance-governor-report',
      title: 'Finance Governor Report',
      description: 'Monthly finance summary from a connected BYO finance sheet.',
      requiredConnectors: [
        { id: 'byo-finance', name: 'BYO Finance Sheet', available: false },
      ],
      status: 'coming-soon',
    },
    {
      id: 'ofsted-answer',
      title: 'Ofsted Question Answer',
      description: 'Answer any question an Ofsted inspector might ask, with evidence.',
      requiredConnectors: [
        { id: 'google-drive', name: 'Google Drive', available: true },
        { id: 'dfe-attendance', name: 'DfE Attendance', available: true },
      ],
      status: 'coming-soon',
    },
  ];

  async function handleTry(templateId: string) {
    if (templateId !== 'attendance-story') return;
    setGeneratingId(templateId);
    setResult(null);
    setError(null);

    const headers = await getAuthHeaders();
    try {
      const res = await fetch('/api/documents/attendance-story', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ urn: GROVE_HOUSE_URN }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.data);
      } else {
        const body = await res.json();
        setError(body.error ?? 'Generation failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-foreground">School Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Generate reports from your connected data. The more connectors you have, the richer the reports become.
          </p>
        </div>
        <Link
          href="/dashboard/school-intelligence/canvas"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-foreground text-sm font-bold hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/20 transition-all"
        >
          <LayoutDashboard className="w-4 h-4" />
          Open Canvas →
        </Link>
        <Link
          href="/dashboard/school-intelligence/shadow-diffs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-200 text-sm font-semibold hover:bg-purple-500/20 transition-all"
        >
          <Activity className="w-4 h-4" />
          Shadow Monitor
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h2 className="text-base font-bold text-foreground">Generate a Report</h2>
          <span className="text-[10px] text-muted-foreground">
            Every number in every report comes from a live data source — never hardcoded
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {templates.map(t => (
            <DocumentTemplateCard
              key={t.id}
              template={t}
              onTry={handleTry}
              loading={generatingId === t.id}
            />
          ))}
        </div>
      </div>

      {generatingId === 'attendance-story' && !result && !error && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 text-sm text-purple-400">
          Fetching Grove House data from DfE Attendance and Census connectors, then calling Gemini 2.5 Flash via the Guardian...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{result.title}</h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                Generated by <span className="font-mono text-purple-400">{result.llmModel}</span>
                {' · '}
                {result.llmTokensUsed} tokens
                {' · via Guardian'}
              </p>
            </div>
          </div>

          <div className="mb-4 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-[11px] font-semibold text-emerald-500 mb-1">Based on these connectors:</p>
            <p className="text-[11px] text-muted-foreground">{result.sourceConnectors.join(' · ')}</p>
          </div>

          <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {result.narrative}
          </div>

          {result.missingConnectors.length > 0 && (
            <div className="mt-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-[11px] font-bold text-amber-500 mb-2">Want a richer report? Add these connectors:</p>
              <ul className="space-y-1">
                {result.missingConnectors.map(m => (
                  <li key={m.id} className="text-[11px] text-muted-foreground">
                    • <strong className="text-foreground">{m.name}</strong> — {m.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
