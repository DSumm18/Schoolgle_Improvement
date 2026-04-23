"use client";

// CapturesPanel — the in-app capture manager. Renders above or inside any
// school-scoped report to show:
//   - the list of existing captures for this school
//   - a "+ New capture" button
//   - a full-screen modal with the CaptureGrid when a capture is selected
//
// Lives inside the report (Trust Assessor per-school view), so there's no
// page navigation: you click a capture, the grid opens as a modal, you
// close it and you're back in the report.

import { useCallback, useEffect, useMemo, useState } from "react";
import { CaptureGrid } from "./CaptureGrid";
import { Plus, Lock, LockOpen, X, AlertTriangle, Calendar, FileText, ChevronRight } from "lucide-react";

type Capture = {
  id: string;
  capture_name: string;
  capture_date: string;
  status: 'draft' | 'locked';
  notes: string | null;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
};

export interface CapturesPanelProps {
  organizationId: string;
  schoolName?: string;
  authHeaders: HeadersInit;
  compact?: boolean;  // when true, render as a horizontal strip; when false, full panel
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CapturesPanel({ organizationId, schoolName, authHeaders, compact = false }: CapturesPanelProps) {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCaptureId, setOpenCaptureId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const loadCaptures = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const res = await fetch(`/api/school-assessment/captures?organizationId=${organizationId}`, { headers: authHeaders });
    if (!res.ok) { setLoading(false); return; }
    const list = (await res.json()) as Capture[];
    setCaptures(list);
    setLoading(false);
  }, [organizationId, authHeaders]);

  useEffect(() => { loadCaptures(); }, [loadCaptures]);

  const openCapture = captures.find((c) => c.id === openCaptureId) ?? null;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-gray-400" />
            <h3 className="font-semibold text-gray-900 text-sm">
              Data captures{schoolName ? ` — ${schoolName}` : ''}
            </h3>
            <span className="text-xs text-gray-500">({captures.length})</span>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus size={12} /> New capture
          </button>
        </div>

        {loading && (
          <div className="px-5 py-6 text-center text-xs text-gray-400">Loading captures…</div>
        )}

        {!loading && captures.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-gray-500">
            No captures yet. Click <strong>New capture</strong> to add your school&apos;s first snapshot.
            You can backdate captures to load historical data.
          </div>
        )}

        {!loading && captures.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {captures.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setOpenCaptureId(c.id)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-sm text-gray-900 min-w-[110px]">{fmtDate(c.capture_date)}</span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{c.capture_name}</span>
                  {c.status === 'locked'
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex-shrink-0"><Lock size={9} /> Locked</span>
                    : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0"><LockOpen size={9} /> Draft</span>
                  }
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Capture Grid modal (view / edit existing) */}
      {openCapture && (
        <CaptureGridModal
          capture={openCapture}
          authHeaders={authHeaders}
          onClose={() => { setOpenCaptureId(null); loadCaptures(); }}
        />
      )}

      {/* New capture modal */}
      {showNewModal && (
        <NewCaptureModal
          organizationId={organizationId}
          authHeaders={authHeaders}
          onClose={() => setShowNewModal(false)}
          onCreated={(id) => { setShowNewModal(false); loadCaptures(); setOpenCaptureId(id); }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modals

function CaptureGridModal({ capture, authHeaders, onClose }: {
  capture: Capture;
  authHeaders: HeadersInit;
  onClose: () => void;
}) {
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'locked'>(capture.status);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-auto p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1400px] my-6">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Edit capture</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[80vh] overflow-auto">
          <CaptureGrid
            captureId={capture.id}
            captureName={capture.capture_name}
            captureDate={capture.capture_date}
            status={currentStatus}
            authHeaders={authHeaders}
            onLocked={() => setCurrentStatus('locked')}
          />
        </div>
      </div>
    </div>
  );
}

function NewCaptureModal({ organizationId, authHeaders, onClose, onCreated }: {
  organizationId: string;
  authHeaders: HeadersInit;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async () => {
    if (!name.trim()) { setError('Give this capture a name.'); return; }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError('Pick a valid date.'); return; }
    setCreating(true); setError(null);
    const res = await fetch('/api/school-assessment/captures', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ organizationId, captureName: name.trim(), captureDate: date, notes: notes.trim() || null }),
    });
    setCreating(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err?.error || 'Failed to create capture');
      return;
    }
    const newCapture = (await res.json()) as { id: string };
    onCreated(newCapture.id);
  }, [organizationId, name, date, notes, authHeaders, onCreated]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">New capture</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Autumn Term, Easter half-term, Y6 writing moderation"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <p className="text-[11px] text-gray-500 mt-1">Whatever you call this round of assessment.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">Backdate historical captures so the report has trend data.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context — e.g. first moderation after new framework"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1.5 rounded flex items-center gap-1"><AlertTriangle size={12} />{error}</div>}
        </div>
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
          <button
            onClick={create}
            disabled={creating || !name.trim() || !date}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {creating ? 'Creating…' : 'Create capture'}
          </button>
        </div>
      </div>
    </div>
  );
}
