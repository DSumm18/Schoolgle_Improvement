"use client";

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { parseCsvString, type CsvParseResult } from '@/lib/data-connectors/byo/csv-parser';
import { buildColumnSchema } from '@/lib/data-connectors/byo/column-mapper';
import type { ConnectorFieldSchema, ColumnType } from '@/lib/data-connectors/types';
import { supabase } from '@/lib/supabase';

const COLUMN_TYPES: ColumnType[] = [
  'text', 'number', 'date', 'boolean',
  'urn', 'postcode', 'pupil_hash', 'staff_id', 'year_group', 'cohort', 'location_code',
];

const JOIN_KEY_TYPES = new Set<ColumnType>([
  'urn', 'postcode', 'pupil_hash', 'staff_id', 'year_group', 'cohort', 'location_code', 'date',
]);

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

type Step = 'upload' | 'preview' | 'map' | 'confirm';

export default function NewByoConnectorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [schema, setSchema] = useState<ConnectorFieldSchema | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large — maximum 10 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const result = parseCsvString(csv);
      if (result.headers.length === 0) {
        setError('Could not parse CSV — no headers detected');
        return;
      }
      setParsed(result);
      setSchema(buildColumnSchema(result.headers, result.rows));
      setName(file.name.replace(/\.csv$/i, '').replace(/[_-]/g, ' '));
      setError(null);
      setStep('preview');
    };
    reader.readAsText(file);
  }

  function updateColumnType(index: number, type: ColumnType) {
    if (!schema) return;
    const updated = {
      columns: schema.columns.map((col, i) =>
        i === index
          ? { ...col, type, is_join_key: JOIN_KEY_TYPES.has(type) }
          : col,
      ),
    };
    setSchema(updated);
  }

  async function handleSubmit() {
    if (!parsed || !schema || !name.trim()) return;
    setSubmitting(true);
    setError(null);

    const headers = await getAuthHeaders();
    const res = await fetch('/api/connectors/byo', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
        sourceType: 'csv',
        schema,
        rows: parsed.rows,
      }),
    });

    if (res.ok) {
      router.push('/dashboard/settings/connectors');
    } else {
      const body = await res.json();
      setError(body.error || 'Failed to create connector');
      setSubmitting(false);
    }
  }

  const joinKeyCount = schema?.columns.filter(c => c.is_join_key).length ?? 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <Link
        href="/dashboard/settings/connectors"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Connectors
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Add BYO Connector</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV to create a new connector. Map the columns, auto-detect join keys, and use it in any report.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {(['upload', 'preview', 'map', 'confirm'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                step === s
                  ? 'bg-purple-500 text-white'
                  : (['upload', 'preview', 'map', 'confirm'] as const).indexOf(step) > i
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {(['upload', 'preview', 'map', 'confirm'] as const).indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s}
            </span>
            {i < 3 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-semibold">Drop a CSV file here or click to browse</p>
          <p className="text-[11px] text-muted-foreground mt-1">Maximum 10 MB. First row should be column headers.</p>
          <label className="inline-block mt-4 px-5 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold cursor-pointer hover:bg-purple-600">
            Choose file
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      )}

      {step === 'preview' && parsed && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <FileText className="w-5 h-5 text-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {parsed.headerCount} columns · {parsed.rowCount} rows
              </p>
              <p className="text-[11px] text-muted-foreground">Preview shows first 10 rows</p>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  {parsed.headers.map(h => (
                    <th key={h} className="text-left py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.preview.map((row, i) => (
                  <tr key={i} className="border-t border-border/30">
                    {parsed.headers.map(h => (
                      <td key={h} className="py-2 px-3 text-foreground">
                        {row[h] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setStep('upload'); setParsed(null); setSchema(null); }}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('map')}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600"
            >
              Next — Map columns
            </button>
          </div>
        </div>
      )}

      {step === 'map' && schema && (
        <div className="space-y-4">
          <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-500 font-semibold">
              {joinKeyCount} join key{joinKeyCount !== 1 ? 's' : ''} auto-detected
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Join keys let you combine this data with other connectors. Change a column type to change its join key status.
            </p>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_180px_100px] bg-muted/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <div>Column</div>
              <div>Type</div>
              <div>Join Key</div>
            </div>
            {schema.columns.map((col, i) => (
              <div key={i} className="grid grid-cols-[1fr_180px_100px] items-center px-4 py-2 border-t border-border/30">
                <div className="text-sm font-mono text-foreground">{col.name}</div>
                <select
                  value={col.type}
                  onChange={e => updateColumnType(i, e.target.value as ColumnType)}
                  className="bg-card border border-border rounded px-2 py-1 text-xs"
                >
                  {COLUMN_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div>
                  {col.is_join_key ? (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      join key
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('preview')}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('confirm')}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600"
            >
              Next — Name & confirm
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && schema && parsed && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Connector Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Safeguarding Incidents Log"
              maxLength={100}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-card border border-border text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's in this data set? How is it used?"
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-card border border-border text-sm"
            />
          </div>

          <div className="rounded-lg p-3 bg-purple-500/10 border border-purple-500/30 text-xs">
            <p className="font-semibold text-purple-400 mb-1">Summary</p>
            <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>{parsed.rowCount} rows across {parsed.headerCount} columns</li>
              <li>{joinKeyCount} join key{joinKeyCount !== 1 ? 's' : ''} detected</li>
              <li>Stored in your organisation only (RLS-protected)</li>
              <li>You can delete this connector and all its data at any time</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('map')}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted/50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || submitting}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create Connector'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
