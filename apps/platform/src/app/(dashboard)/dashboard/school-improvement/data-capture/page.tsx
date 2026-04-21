"use client";

// School Assessment Data Capture
// Spreadsheet-style grid that lets a school enter (or paste) assessment data
// directly into Schoolgle. Owned data-entry path — no spreadsheet parser, no
// ambiguous filenames. Replaces (long term) the trust-spreadsheet upload
// for schools that go direct.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  COHORT_METRICS,
  SECTIONS,
  YEAR_GROUPS,
  YEAR_GROUP_METRICS,
  validateCell,
  type MetricDef,
  type SectionKey,
  type YearGroup,
} from "@/lib/school-assessment/metrics-config";
import { Info, Lock, LockOpen, Plus, Save, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";

type Capture = {
  id: string;
  capture_period: 'autumn_term' | 'mid_year' | 'end_of_year';
  academic_year: string;
  status: 'draft' | 'locked';
  notes: string | null;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
};

type Cell = { year_group: string; section: string; metric: string; value: number | null };
type CellMap = Record<string, string>; // key = `${yg}:${section}:${metric}` → string value (keep strings for input state)

const PERIOD_LABELS: Record<Capture['capture_period'], string> = {
  autumn_term: 'Autumn Term',
  mid_year: 'Mid-Year',
  end_of_year: 'End of Year',
};

function cellKey(yg: string, section: string, metric: string) {
  return `${yg}:${section}:${metric}`;
}

function currentAcademicYear(): string {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const endShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}/${endShort}`;
}

export default function DataCapturePage() {
  const { organizationId, accessToken } = useAuth();
  const authHeaders = useMemo<HeadersInit>(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
    return h;
  }, [accessToken]);

  const [captures, setCaptures] = useState<Capture[]>([]);
  const [activeCaptureId, setActiveCaptureId] = useState<string | null>(null);
  const [cells, setCells] = useState<CellMap>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const activeCapture = captures.find((c) => c.id === activeCaptureId) ?? null;
  const isLocked = activeCapture?.status === 'locked';

  // Load capture list
  useEffect(() => {
    if (!organizationId || !accessToken) return;
    (async () => {
      const res = await fetch(`/api/school-assessment/captures?organizationId=${organizationId}`, { headers: authHeaders });
      if (!res.ok) return;
      const list = (await res.json()) as Capture[];
      setCaptures(list);
      if (list.length > 0 && !activeCaptureId) setActiveCaptureId(list[0].id);
    })();
  }, [organizationId, accessToken, authHeaders, activeCaptureId]);

  // Load cells when active capture changes
  useEffect(() => {
    if (!activeCaptureId) { setCells({}); return; }
    setLoading(true);
    (async () => {
      const res = await fetch(`/api/school-assessment/captures/${activeCaptureId}`, { headers: authHeaders });
      if (!res.ok) { setLoading(false); return; }
      const payload = await res.json();
      const mapped: CellMap = {};
      for (const c of (payload.cells ?? []) as Cell[]) {
        mapped[cellKey(c.year_group, c.section, c.metric)] = c.value === null ? '' : String(c.value);
      }
      setCells(mapped);
      setDirtyKeys(new Set());
      setLoading(false);
    })();
  }, [activeCaptureId, authHeaders]);

  // Auto-clear toasts
  useEffect(() => {
    if (!saveOk && !saveError) return;
    const t = setTimeout(() => { setSaveOk(null); setSaveError(null); }, 3500);
    return () => clearTimeout(t);
  }, [saveOk, saveError]);

  const onCellChange = useCallback((yg: string, section: string, metric: string, raw: string) => {
    const k = cellKey(yg, section, metric);
    setCells((prev) => ({ ...prev, [k]: raw }));
    setDirtyKeys((prev) => { const n = new Set(prev); n.add(k); return n; });
  }, []);

  const createNewCapture = useCallback(async (period: Capture['capture_period']) => {
    if (!organizationId) return;
    setSaveError(null);
    const res = await fetch('/api/school-assessment/captures', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ organizationId, capturePeriod: period, academicYear: currentAcademicYear() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSaveError(err?.error || 'Failed to create capture');
      return;
    }
    const newCapture = (await res.json()) as Capture;
    setCaptures((prev) => [newCapture, ...prev]);
    setActiveCaptureId(newCapture.id);
  }, [organizationId, authHeaders]);

  const saveDraft = useCallback(async () => {
    if (!activeCaptureId || isLocked) return;
    setSaving(true); setSaveError(null); setSaveOk(null);

    // Build payload — every changed cell, plus validate counts fit within cohort size.
    const payload: Array<{ year_group: string; section: string; metric: string; value: number | null }> = [];
    const cohortByYg = new Map<string, number>();
    for (const k of Object.keys(cells)) {
      const [yg, section, metric] = k.split(':');
      if (section === 'cohort' && metric === 'number_in_cohort' && cells[k] !== '') {
        cohortByYg.set(yg, Number(cells[k]));
      }
    }
    for (const k of dirtyKeys) {
      const [yg, section, metric] = k.split(':');
      const raw = cells[k] ?? '';
      const def = (section === 'cohort'
        ? COHORT_METRICS.find(m => m.key === metric)
        : YEAR_GROUP_METRICS[yg as YearGroup]?.find(m => m.key === metric));
      if (!def) continue;
      const err = validateCell(def, raw || null, cohortByYg.get(yg));
      if (err) {
        setSaveError(`${yg} / ${def.label}: ${err}`);
        setSaving(false);
        return;
      }
      const value = raw === '' ? null : Number(String(raw).replace(/[%,\s]/g, ''));
      payload.push({ year_group: yg, section, metric, value });
    }

    if (payload.length === 0) {
      setSaveOk('No changes to save');
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/school-assessment/captures/${activeCaptureId}/cells`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ cells: payload }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSaveError(err?.error || 'Save failed');
      return;
    }
    setSaveOk(`Saved ${payload.length} cell${payload.length === 1 ? '' : 's'}`);
    setDirtyKeys(new Set());
  }, [activeCaptureId, cells, dirtyKeys, authHeaders, isLocked]);

  const lockCapture = useCallback(async () => {
    if (!activeCaptureId) return;
    if (!confirm('Lock this capture? Once locked, no further edits are possible and this capture will feed reports as-is.')) return;
    const res = await fetch(`/api/school-assessment/captures/${activeCaptureId}/lock`, {
      method: 'POST', headers: authHeaders,
    });
    if (!res.ok) { setSaveError('Lock failed'); return; }
    setCaptures((prev) => prev.map(c => c.id === activeCaptureId ? { ...c, status: 'locked', locked_at: new Date().toISOString() } : c));
    setSaveOk('Capture locked');
  }, [activeCaptureId, authHeaders]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Assessment Data Capture</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your school&apos;s termly assessment snapshot directly in Schoolgle. Same layout as the trust spreadsheet — no upload required.
          Save drafts as you go; lock the capture when you&apos;re ready for it to feed the report.
        </p>
      </div>

      {/* Capture selector / creator */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <Calendar size={16} className="text-gray-400" />
        <label className="text-sm font-medium text-gray-700">Capture:</label>
        <select
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          value={activeCaptureId ?? ''}
          onChange={(e) => setActiveCaptureId(e.target.value || null)}
        >
          <option value="">— select —</option>
          {captures.map((c) => (
            <option key={c.id} value={c.id}>
              {c.academic_year} · {PERIOD_LABELS[c.capture_period]} {c.status === 'locked' ? '🔒' : '· draft'}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {(['autumn_term', 'mid_year', 'end_of_year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => createNewCapture(p)}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <Plus size={12} /> New {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Action bar */}
      {activeCapture && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{activeCapture.academic_year}</span> · {PERIOD_LABELS[activeCapture.capture_period]}
            {isLocked
              ? <span className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Lock size={10} /> Locked</span>
              : <span className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><LockOpen size={10} /> Draft — editable</span>
            }
            {dirtyKeys.size > 0 && !isLocked && (
              <span className="ml-3 text-xs text-amber-700">· {dirtyKeys.size} unsaved change{dirtyKeys.size === 1 ? '' : 's'}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saveError && <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded flex items-center gap-1"><AlertTriangle size={12} />{saveError}</span>}
            {saveOk && <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 size={12} />{saveOk}</span>}
            <button
              onClick={saveDraft}
              disabled={saving || isLocked || dirtyKeys.size === 0}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save draft'}
            </button>
            {!isLocked && (
              <button
                onClick={lockCapture}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900"
              >
                <Lock size={14} /> Lock capture
              </button>
            )}
          </div>
        </div>
      )}

      {!activeCaptureId && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          <p className="text-sm">No captures yet. Click <strong>New Autumn Term</strong> (or Mid-Year / End of Year) above to start.</p>
        </div>
      )}

      {/* Year-group grids */}
      {activeCapture && !loading && YEAR_GROUPS.map((yg) => (
        <YearGroupGrid
          key={yg}
          yearGroup={yg}
          cells={cells}
          onCellChange={onCellChange}
          isLocked={isLocked}
        />
      ))}

      {loading && <div className="text-center py-6 text-sm text-gray-400">Loading…</div>}
    </div>
  );
}

function YearGroupGrid({ yearGroup, cells, onCellChange, isLocked }: {
  yearGroup: YearGroup;
  cells: CellMap;
  onCellChange: (yg: string, section: string, metric: string, raw: string) => void;
  isLocked: boolean;
}) {
  const attainmentMetrics = YEAR_GROUP_METRICS[yearGroup];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{yearGroup}</h3>
        <p className="text-xs text-gray-500">
          Cohort counts on the left · attainment % on the right · All Pupils / FSM6 / Not FSM6 stacked
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 sticky left-0 bg-gray-50 border-r border-gray-200">Section</th>
              {COHORT_METRICS.map((m) => (
                <HeaderCell key={m.key} def={m} />
              ))}
              <th className="px-1 border-l-2 border-gray-300" />
              {attainmentMetrics.map((m) => (
                <HeaderCell key={m.key} def={m} />
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Cohort row — only filled once per year group (not per section) */}
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 whitespace-nowrap">Cohort</td>
              {COHORT_METRICS.map((m) => (
                <GridCell
                  key={m.key}
                  def={m}
                  value={cells[cellKey(yearGroup, 'cohort', m.key)] ?? ''}
                  onChange={(raw) => onCellChange(yearGroup, 'cohort', m.key, raw)}
                  isLocked={isLocked}
                />
              ))}
              <td className="px-1 border-l-2 border-gray-300" />
              {attainmentMetrics.map(() => (
                <td key={Math.random()} className="bg-gray-50/50" />
              ))}
            </tr>

            {/* Attainment rows — one per section */}
            {SECTIONS.map((sec) => (
              <tr key={sec.key} className="border-b border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 whitespace-nowrap" title={sec.help}>
                  {sec.label}
                </td>
                {COHORT_METRICS.map(() => (
                  <td key={Math.random()} className="bg-gray-50/50" />
                ))}
                <td className="px-1 border-l-2 border-gray-300" />
                {attainmentMetrics.map((m) => (
                  <GridCell
                    key={m.key}
                    def={m}
                    value={cells[cellKey(yearGroup, sec.key, m.key)] ?? ''}
                    onChange={(raw) => onCellChange(yearGroup, sec.key, m.key, raw)}
                    isLocked={isLocked}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderCell({ def }: { def: MetricDef }) {
  const [open, setOpen] = useState(false);
  return (
    <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap relative">
      <div className="flex items-center gap-1">
        <span>{def.label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="text-gray-400 hover:text-blue-600"
          type="button"
          aria-label={`About ${def.label}`}
        >
          <Info size={11} />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 normal-case tracking-normal">
          <div className="font-semibold mb-1">{def.longLabel}</div>
          <div className="text-gray-200 mb-2 leading-snug">{def.help}</div>
          <div className="text-[10px] text-gray-400 border-t border-gray-700 pt-2">Feeds: {def.feeds}</div>
        </div>
      )}
    </th>
  );
}

function GridCell({ def, value, onChange, isLocked }: {
  def: MetricDef;
  value: string;
  onChange: (raw: string) => void;
  isLocked: boolean;
}) {
  const err = value ? validateCell(def, value) : null;
  const suffix = def.type === 'pct' ? '%' : '';
  return (
    <td className="px-1 py-1">
      <div className={`relative flex items-center ${err ? 'ring-1 ring-red-400 rounded' : ''}`}>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLocked}
          className="w-20 px-2 py-1 text-sm text-right border border-gray-200 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          aria-label={def.longLabel}
        />
        {suffix && <span className="text-xs text-gray-400 ml-0.5">{suffix}</span>}
      </div>
      {err && <div className="text-[9px] text-red-600 mt-0.5 max-w-[90px]">{err}</div>}
    </td>
  );
}
