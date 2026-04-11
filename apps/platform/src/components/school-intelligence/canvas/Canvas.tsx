"use client";

import { useState } from 'react';
import { TemplatePickerStep } from './TemplatePickerStep';
import { ConfigureStep } from './ConfigureStep';
import { ResultPanel } from './ResultPanel';
import { TEMPLATES, getTemplate } from './lib/templates';
import type { Connector } from '@/lib/data-connectors/types';
import { getAllConnectors } from '@/lib/data-connectors/registry';
import { supabase } from '@/lib/supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

const GROVE_HOUSE_URN = 148201;

interface GenerationResult {
  documentId: string;
  title: string;
  narrative: string;
  sourceConnectors: string[];
  missingConnectors: { id: string; name: string; reason: string }[];
  llmModel: string;
  llmTokensUsed: number;
  guardianCategoriesDetected: string[];
}

type Step = 'pick' | 'configure';

export function Canvas() {
  const [step, setStep] = useState<Step>('pick');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);

  const [timePeriod, setTimePeriod] = useState('Last 5 years');
  const [audience, setAudience] = useState('Governors');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allConnectors: Connector[] = getAllConnectors();
  const template = getTemplate(selectedTemplateId) ?? TEMPLATES[0];

  function handlePick(templateId: string) {
    setSelectedTemplateId(templateId);
    setStep('configure');
    setError(null);
    setResult(null);
  }

  async function handleGenerate() {
    if (template.id !== 'attendance-story') {
      setError('Only Attendance Story is currently wired to a real generator. More coming soon.');
      return;
    }
    setGenerating(true);
    setError(null);
    setResult(null);

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
        setResultOpen(true);
      } else {
        const body = await res.json().catch(() => ({ error: 'Non-JSON response' }));
        setError(body.error ?? `Generation failed (HTTP ${res.status})`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <div className="max-w-[1400px] mx-auto">
        {step === 'pick' && <TemplatePickerStep onPick={handlePick} />}
        {step === 'configure' && (
          <ConfigureStep
            template={template}
            allConnectors={allConnectors}
            urn={GROVE_HOUSE_URN}
            timePeriod={timePeriod}
            audience={audience}
            onTimePeriodChange={setTimePeriod}
            onAudienceChange={setAudience}
            onBack={() => setStep('pick')}
            onGenerate={handleGenerate}
            generating={generating}
            error={error}
          />
        )}
      </div>

      <ResultPanel open={resultOpen} onClose={() => setResultOpen(false)} result={result} />
    </>
  );
}
