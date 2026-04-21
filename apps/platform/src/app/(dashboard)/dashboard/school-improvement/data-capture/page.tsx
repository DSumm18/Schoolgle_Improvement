"use client";

// School Assessment Data Capture
// Spreadsheet-style grid where a school enters assessment data directly.
// Each capture is identified by a free-form date + name (e.g. "Autumn Term",
// "Easter half-term check", "Y6 writing moderation"), so schools on any cycle
// — termly, half-termly, monthly — can record snapshots.
//
// Tabs:
//   · Grid    — spreadsheet-style entry for the selected capture
//   · History — audit log of all captures + edits

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  COHORT_METRICS,
  SECTIONS,
  YEAR_GROUPS,
  YEAR_GROUP_METRICS,
  validateCell,
  type MetricDef,
  type YearGroup,
} from "@/lib/school-assessment/metrics-config";
import {
  Info, Lock, LockOpen, Plus, Save, AlertTriangle, CheckCircle2, Calendar, History, FileText, X, Clock,
} from "lucide-react";

type Capture = {
  id: string;
  capture_name: string;
  capture_date: string; // YYYY-MM-DD
  status: 'draft' | 'locked';
  notes: string | null;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
};

type Cell = { year_group: string; section: string; metric: string; value: number | null; updated_at?: string };
type CellMap = Record<string, string>;

function cellKey(yg: string, section: string, metric: string) {
  return `${yg}:${section}:${metric}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Tab = 'grid' | 'history';

export default function DataCapturePage() {
  const { organizationId, accessToken } = useAuth();
  const authHeaders = useMemo<HeadersInit>(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
    return h;
  }, [accessToken]);

  const [tab, setTab] = useState<Tab>('grid');
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [activeCaptureId, setActiveCaptureId] = useState<string | null>(null);
  const [cells, setCells] = useState<CellMap>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  // "New capture" modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(todayISO());
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const activeCapture = captures.find((c) => c.id === activeCaptureId) ?? null;
  const isLocked = activeCapture?.status === 'locked';

  const loadCaptures = useCallback(async () => {
    if (!organizationId || !accessToken) return;
    const res = await fetch(`/api/school-assessment/captures?organizationId=${organizationId}`, { headers: authHeaders });
    if (!res.ok) return;
    const list = (await res.json()) as Capture[];
    setCaptures(list);
    if (list.length > 0 && !activeCaptureId) setActiveCaptureId(list[0].id);
  }, [organizationId, accessToken, authHeaders, activeCaptureId]);

  useEffect(() => { loadCaptures(); }, [loadCaptures]);

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

  const createCapture = useCallback(async () => {
    if (!organizationId) return;
    if (!newName.trim()) { setSaveError('Give this capture a name (e.g. "Autumn Term" or "Easter half-term").'); return; }
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) { setSaveError('Pick a valid date.'); return; }

    setCreating(true); setSaveError(null);
    const res = await fetch('/api/school-assessment/captures', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        organizationId,
        captureName: newName.trim(),
        captureDate: newDate,
        notes: newNotes.trim() || null,
      }),
    });
    setCreating(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSaveError(err?.error || 'Failed to create capture');
      return;
    }
    const newCapture = (await res.json()) as Capture;
    setCaptures((prev) => [newCapture, ...prev].sort((a, b) => b.capture_date.localeCompare(a.capture_date)));
    setActiveCaptureId(newCapture.id);
    setShowNewModal(false);
    setNewName(''); setNewDate(todayISO()); setNewNotes('');
    setSaveOk('Capture created — start filling in the grid');
  }, [organizationId, newName, newDate, newNotes, authHeaders]);

  const saveDraft = useCallback(async () => {
    if (!activeCaptureId || isLocked) return;
    setSaving(true); setSaveError(null); setSaveOk(null);

    const cohortByYg = new Map<string, number>();
    for (const k of Object.keys(cells)) {
      const [yg, section, metric] = k.split(':');
      if (section === 'cohort' && metric === 'number_in_cohort' && cells[k] !== '') {
        cohortByYg.set(yg, Number(cells[k]));
      }
    }

    const payload: Array<{ year_group: string; section: string; metric: string; value: number | null }> = [];
    for (const k of dirtyKeys) {
      const [yg, section, metric] = k.split(':');
      const raw = cells[k] ?? '';
      const def = (section === 'cohort'
        ? COHORT_METRICS.find(m => m.key === metric)
        : YEAR_GROUP_METRICS[yg as YearGroup]?.find(m => m.key === metric));
      if (!def) continue;
      const err = validateCell(def, raw || null, cohortByYg.get(yg));
      if (err) { setSaveError(`${yg} / ${def.label}: ${err}`); setSaving(false); return; }
      const value = raw === '' ? null : Number(String(raw).replace(/[%,\s]/g, ''));
      payload.push({ year_group: yg, section, metric, value });
    }

    if (payload.length === 0) {
      setSaveOk('No changes to save');
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/school-assessment/captures/${activeCaptureId}/cells`, {
      method: 'PUT', headers: authHeaders, body: JSON.stringify({ cells: payload }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSaveError(err?.error || 'Save failed');
      return;
    }
    setSaveOk(`Saved ${payload.length} cell${payload.length === 1 ? '' : 's'}`);
    setDirtyKeys(new Set());
    loadCaptures();
  }, [activeCaptureId, cells, dirtyKeys, authHeaders, isLocked, loadCaptures]);

  const lockCapture = useCallback(async () => {
    if (!activeCaptureId) return;
    if (!confirm('Lock this capture? Once locked, no further edits are possible and this capture feeds the report as-is.')) return;
    const res = await fetch(`/api/school-assessment/captures/${activeCaptureId}/lock`, { method: 'POST', headers: authHeaders });
    if (!res.ok) { setSaveError('Lock failed'); return; }
    setCaptures((prev) => prev.map(c => c.id === activeCaptureId ? { ...c, status: 'locked', locked_at: new Date().toISOString() } : c));
    setSaveOk('Capture locked');
  }, [activeCaptureId, authHeaders]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Assessment Data Capture</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your school&apos;s assessment snapshot directly in Schoolgle. Every capture has a date and a name you choose — use
          &ldquo;Autumn Term&rdquo; if that&apos;s your cycle, or &ldquo;Easter half-term&rdquo;, &ldquo;Pre-SATs practice&rdquo;, whatever you call them.
          Backdate captures to load your historical data so the report has proper context.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <TabButton active={tab === 'grid'} onClick={() => setTab('grid')} icon={<FileText size={14} />} label="Grid" />
        <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<History size={14} />} label={`History (${captures.length})`} />
      </div>

      {/* GRID TAB */}
      {tab === 'grid' && (
        <>
          {/* Capture selector */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
            <Calendar size={16} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Capture:</label>
            <select
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white min-w-[280px]"
              value={activeCaptureId ?? ''}
              onChange={(e) => setActiveCaptureId(e.target.value || null)}
            >
              <option value="">
                {captures.length === 0 ? '— no captures yet, click New Capture —' : '— select a capture —'}
              </option>
              {captures.map((c) => (
                <option key={c.id} value={c.id}>
                  {fmtDate(c.capture_date)} — {c.capture_name} {c.status === 'locked' ? '🔒' : '· draft'}
                </option>
              ))}
            </select>
            <div className="flex-1" />
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus size={14} /> New Capture
            </button>
          </div>

          {/* Action bar */}
          {activeCapture && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{activeCapture.capture_name}</span>
                <span className="mx-2 text-gray-400">·</span>
                <span className="text-gray-600">{fmtDate(activeCapture.capture_date)}</span>
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
                  <button onClick={lockCapture} disabled={saving} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900">
                    <Lock size={14} /> Lock capture
                  </button>
                )}
              </div>
            </div>
          )}

          {!activeCaptureId && captures.length === 0 && (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
              <FileText size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-600 font-medium mb-1">No captures yet</p>
              <p className="text-xs text-gray-500 mb-4">Every capture is a named, dated snapshot of your assessment data. Create your first one to get started.</p>
              <button onClick={() => setShowNewModal(true)} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                <Plus size={14} /> Create first capture
              </button>
            </div>
          )}

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
        </>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <HistoryTable captures={captures} onOpen={(id) => { setActiveCaptureId(id); setTab('grid'); }} />
      )}

      {/* NEW CAPTURE MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">New capture</h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Autumn Term, Easter half-term, Y6 writing moderation"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <p className="text-[11px] text-gray-500 mt-1">Whatever you call this round of assessment — termly, half-termly, monthly, one-off moderation, whatever suits your cycle.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">When this snapshot was taken. Backdate historical captures so the report has trend data to work with.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Any context — e.g. first full moderation after new assessment framework"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              {saveError && <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1.5 rounded flex items-center gap-1"><AlertTriangle size={12} />{saveError}</div>}
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setShowNewModal(false)} className="text-sm px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
              <button
                onClick={createCapture}
                disabled={creating || !newName.trim() || !newDate}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                {creating ? 'Creating…' : 'Create capture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
    >
      {icon} {label}
    </button>
  );
}

function HistoryTable({ captures, onOpen }: { captures: Capture[]; onOpen: (id: string) => void }) {
  if (captures.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
        <History size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No captures yet — when you create one it&apos;ll appear here with a full audit trail.</p>
      </div>
    );
  }
  const sorted = [...captures].sort((a, b) => b.capture_date.localeCompare(a.capture_date));
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Capture log</h3>
        <p className="text-xs text-gray-500 mt-0.5">Every snapshot this school has recorded, newest first. Click any row to open it.</p>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Capture date</th>
            <th className="px-4 py-2 text-left font-medium">Name</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
            <th className="px-4 py-2 text-left font-medium">Created</th>
            <th className="px-4 py-2 text-left font-medium">Last edit</th>
            <th className="px-4 py-2 text-left font-medium">Locked at</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id} onClick={() => onOpen(c.id)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
              <td className="px-4 py-2 text-gray-900 font-medium">{fmtDate(c.capture_date)}</td>
              <td className="px-4 py-2 text-gray-700">{c.capture_name}</td>
              <td className="px-4 py-2">
                {c.status === 'locked' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><Lock size={8} /> Locked</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full"><LockOpen size={8} /> Draft</span>
                )}
              </td>
              <td className="px-4 py-2 text-gray-500 text-xs"><Clock size={10} className="inline mr-1" />{fmtDateTime(c.created_at)}</td>
              <td className="px-4 py-2 text-gray-500 text-xs">{fmtDateTime(c.updated_at)}</td>
              <td className="px-4 py-2 text-gray-500 text-xs">{fmtDateTime(c.locked_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
        <p className="text-xs text-gray-500">Cohort counts on the left · attainment % on the right · All Pupils / FSM6 / Not FSM6 stacked</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 sticky left-0 bg-gray-50 border-r border-gray-200">Section</th>
              {COHORT_METRICS.map((m) => <HeaderCell key={m.key} def={m} />)}
              <th className="px-1 border-l-2 border-gray-300" />
              {attainmentMetrics.map((m) => <HeaderCell key={m.key} def={m} />)}
            </tr>
          </thead>
          <tbody>
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
              {attainmentMetrics.map((m) => <td key={m.key} className="bg-gray-50/50" />)}
            </tr>
            {SECTIONS.map((sec) => (
              <tr key={sec.key} className="border-b border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 whitespace-nowrap" title={sec.help}>{sec.label}</td>
                {COHORT_METRICS.map((m) => <td key={m.key} className="bg-gray-50/50" />)}
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
