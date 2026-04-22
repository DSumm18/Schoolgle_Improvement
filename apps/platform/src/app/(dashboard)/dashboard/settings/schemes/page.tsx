"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Check,
  Loader2,
  Trash2,
  Pencil,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

// ─── Subjects + schemes per subject ──────────────────────────────────

// The canonical set of primary subjects a school may adopt a scheme for.
// Ordered so related subjects are grouped visually.
const PRIMARY_SUBJECTS = [
  "Maths",
  "English",
  "Science",
  "Computing",
  "History",
  "Geography",
  "Art",
  "DT",
  "Music",
  "PE",
  "RE",
  "PSHE",
  "French",
] as const;

// Known scheme options per subject. Each entry is { id, name, publisher }.
// The id is what gets stored in organization_schemes.scheme_name; the name is
// what the HT sees in the dropdown.
interface SchemeOption {
  id: string;
  name: string;
  publisher: string;
}

const SCHEME_OPTIONS: Record<string, SchemeOption[]> = {
  Maths: [
    { id: "white-rose-maths", name: "White Rose Maths", publisher: "White Rose Education" },
    { id: "power-maths", name: "Power Maths", publisher: "Pearson" },
    { id: "maths-no-problem", name: "Maths — No Problem!", publisher: "Maths — No Problem!" },
    { id: "oak-maths", name: "Oak National Academy", publisher: "Oak National Academy" },
    { id: "twinkl-planit-maths", name: "Twinkl PlanIt Maths", publisher: "Twinkl" },
    { id: "nelson-maths", name: "Nelson International Mathematics", publisher: "Oxford University Press" },
  ],
  English: [
    { id: "read-write-inc", name: "Read Write Inc.", publisher: "Ruth Miskin / Oxford" },
    { id: "talk-for-writing", name: "Talk for Writing", publisher: "Pie Corbett" },
    { id: "literacy-tree", name: "The Literacy Tree", publisher: "The Literacy Tree" },
    { id: "pathways-to-write", name: "Pathways to Write", publisher: "The Literacy Company" },
    { id: "oak-english", name: "Oak National Academy", publisher: "Oak National Academy" },
  ],
  Science: [
    { id: "kapow-science", name: "Kapow Primary Science", publisher: "Kapow Primary" },
    { id: "pzaz", name: "PZAZ Science", publisher: "PZAZ" },
    { id: "developing-experts", name: "Developing Experts", publisher: "Developing Experts" },
    { id: "twinkl-planit-science", name: "Twinkl PlanIt Science", publisher: "Twinkl" },
    { id: "oak-science", name: "Oak National Academy", publisher: "Oak National Academy" },
  ],
  Computing: [
    { id: "teach-computing", name: "Teach Computing", publisher: "NCCE / Raspberry Pi Foundation" },
    { id: "kapow-computing", name: "Kapow Primary Computing", publisher: "Kapow Primary" },
    { id: "purple-mash", name: "Purple Mash Computing", publisher: "2Simple" },
  ],
  History: [
    { id: "kapow-history", name: "Kapow Primary History", publisher: "Kapow Primary" },
    { id: "opening-worlds", name: "Opening Worlds (History)", publisher: "Opening Worlds" },
    { id: "twinkl-planit-history", name: "Twinkl PlanIt History", publisher: "Twinkl" },
  ],
  Geography: [
    { id: "kapow-geography", name: "Kapow Primary Geography", publisher: "Kapow Primary" },
    { id: "oddizzi", name: "Oddizzi Geography", publisher: "Oddizzi" },
    { id: "twinkl-planit-geography", name: "Twinkl PlanIt Geography", publisher: "Twinkl" },
  ],
  Art: [
    { id: "kapow-art", name: "Kapow Primary Art & Design", publisher: "Kapow Primary" },
    { id: "access-art", name: "AccessArt", publisher: "AccessArt" },
  ],
  DT: [
    { id: "kapow-dt", name: "Kapow Primary D&T", publisher: "Kapow Primary" },
    { id: "projects-on-a-page", name: "Projects on a Page", publisher: "D&T Association" },
  ],
  Music: [
    { id: "charanga", name: "Charanga Musical School", publisher: "Charanga" },
    { id: "kapow-music", name: "Kapow Primary Music", publisher: "Kapow Primary" },
    { id: "sing-up", name: "Sing Up", publisher: "Sing Up" },
  ],
  PE: [
    { id: "real-pe", name: "Real PE", publisher: "Create Development" },
    { id: "kapow-pe", name: "Kapow Primary PE", publisher: "Kapow Primary" },
    { id: "get-set-4-pe", name: "Get Set 4 PE", publisher: "Get Set 4 PE" },
  ],
  RE: [
    { id: "understanding-christianity", name: "Understanding Christianity", publisher: "RE Today" },
    { id: "discovery-re", name: "Discovery RE", publisher: "Discovery RE" },
    { id: "kapow-re", name: "Kapow Primary RE", publisher: "Kapow Primary" },
    { id: "local-agreed-syllabus", name: "Local Agreed Syllabus", publisher: "Local SACRE" },
  ],
  PSHE: [
    { id: "jigsaw-pshe", name: "Jigsaw PSHE", publisher: "Jigsaw" },
    { id: "kapow-rshe", name: "Kapow Primary RSHE & PSHE", publisher: "Kapow Primary" },
    { id: "pshe-association", name: "PSHE Association Programme", publisher: "PSHE Association" },
  ],
  French: [
    { id: "language-angels", name: "Language Angels (French)", publisher: "Language Angels" },
    { id: "kapow-french", name: "Kapow Primary French", publisher: "Kapow Primary" },
    { id: "rising-stars-french", name: "Rising Stars Euro Stars (French)", publisher: "Rising Stars" },
  ],
};

// ─── Types ────────────────────────────────────────────────────────────

interface AdoptedScheme {
  subject: string;
  scheme_name: string;
  notes: string | null;
  adopted_at: string;
  updated_at: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function schemeDisplayName(subject: string, schemeId: string): string {
  const found = (SCHEME_OPTIONS[subject] || []).find((s) => s.id === schemeId);
  return found?.name ?? schemeId;
}

function schemePublisher(subject: string, schemeId: string): string {
  const found = (SCHEME_OPTIONS[subject] || []).find((s) => s.id === schemeId);
  return found?.publisher ?? "";
}

// ─── Main page ────────────────────────────────────────────────────────

export default function SchemesSettingsPage() {
  const { organizationId, organization } = useAuth();
  const [schemes, setSchemes] = useState<Record<string, AdoptedScheme>>({});
  const [loading, setLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [draftSchemeId, setDraftSchemeId] = useState<string>("");
  const [draftNotes, setDraftNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load adopted schemes
  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/organization/schemes", { headers });
      const json = await res.json();
      const list: AdoptedScheme[] = json?.data?.schemes ?? [];
      const map: Record<string, AdoptedScheme> = {};
      for (const s of list) map[s.subject] = s;
      setSchemes(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load schemes");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const startEditing = (subject: string) => {
    setEditingSubject(subject);
    const existing = schemes[subject];
    setDraftSchemeId(existing?.scheme_name ?? "");
    setDraftNotes(existing?.notes ?? "");
    setError(null);
  };

  const cancelEditing = () => {
    setEditingSubject(null);
    setDraftSchemeId("");
    setDraftNotes("");
    setError(null);
  };

  const saveScheme = async () => {
    if (!editingSubject || !draftSchemeId) {
      setError("Pick a scheme before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/organization/schemes", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          subject: editingSubject,
          scheme_name: draftSchemeId,
          notes: draftNotes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.error) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      const saved: AdoptedScheme = json?.data ?? {
        subject: editingSubject,
        scheme_name: draftSchemeId,
        notes: draftNotes || null,
        adopted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSchemes((prev) => ({ ...prev, [editingSubject]: saved }));
      cancelEditing();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save scheme");
    } finally {
      setSaving(false);
    }
  };

  const removeScheme = async (subject: string) => {
    if (!confirm(`Remove the school's adopted ${subject} scheme? Teachers will see "No scheme adopted" for ${subject} until a new one is chosen.`)) {
      return;
    }
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(
        `/api/organization/schemes?subject=${encodeURIComponent(subject)}`,
        { method: "DELETE", headers },
      );
      const json = await res.json();
      if (!res.ok || json?.error) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setSchemes((prev) => {
        const next = { ...prev };
        delete next[subject];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove scheme");
    }
  };

  const adoptedCount = useMemo(() => Object.keys(schemes).length, [schemes]);
  const totalSubjects = PRIMARY_SUBJECTS.length;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings"
          className="text-slate-400 hover:text-slate-600"
          aria-label="Back to Settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600" />
            Schemes of Work
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            One scheme per subject, adopted across the whole school.
            {organization?.name && ` ${organization.name} currently teaches from `}
            <span className="font-semibold text-slate-700">
              {adoptedCount}
            </span>{" "}
            of {totalSubjects} possible subject schemes.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex-shrink-0 flex items-center justify-center text-teal-700">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="text-sm text-slate-700">
          <p className="font-semibold mb-1">How this works</p>
          <p className="text-slate-600">
            Primary schools typically adopt one scheme per subject so progression
            between year groups stays coherent. Changing a scheme here updates
            every class across the school — you won't need to update individual
            class records. Teachers still generate lessons from their own
            timetable; the scheme drives the units and NC objectives.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          <span className="ml-2 text-sm text-slate-500">Loading schemes…</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {PRIMARY_SUBJECTS.map((subject) => {
            const adopted = schemes[subject];
            const isEditing = editingSubject === subject;
            const options = SCHEME_OPTIONS[subject] || [];

            return (
              <div key={subject} className="p-4">
                {!isEditing ? (
                  <div className="flex items-center gap-4">
                    <div className="w-24 flex-shrink-0">
                      <div className="text-sm font-semibold text-slate-800">
                        {subject}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {adopted ? (
                        <>
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {schemeDisplayName(subject, adopted.scheme_name)}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {schemePublisher(subject, adopted.scheme_name) &&
                              `${schemePublisher(subject, adopted.scheme_name)} · `}
                            Adopted {formatDate(adopted.adopted_at)}
                            {adopted.notes && (
                              <span className="text-slate-400"> · {adopted.notes}</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-400 italic">
                          No scheme adopted yet
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEditing(subject)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        {adopted ? "Change" : "Adopt scheme"}
                      </button>
                      {adopted && (
                        <button
                          onClick={() => removeScheme(subject)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-24 flex-shrink-0">
                        <div className="text-sm font-semibold text-slate-800">
                          {subject}
                        </div>
                      </div>
                      <div className="flex-1">
                        <select
                          value={draftSchemeId}
                          onChange={(e) => setDraftSchemeId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                          autoFocus
                        >
                          <option value="">Pick a scheme…</option>
                          {options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name} — {opt.publisher}
                            </option>
                          ))}
                          <option value="custom">School's own / bespoke</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 flex-shrink-0 text-xs text-slate-500">
                        Notes
                      </div>
                      <input
                        type="text"
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        placeholder="Optional — e.g. 'piloting for 2026-27', 'replaces Power Maths'"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveScheme}
                        disabled={saving || !draftSchemeId}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
        <div>
          Scheme changes apply immediately to every class for that subject.
        </div>
        <Link
          href="/dashboard/lesson-studio"
          className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
        >
          Open Lesson Studio
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
