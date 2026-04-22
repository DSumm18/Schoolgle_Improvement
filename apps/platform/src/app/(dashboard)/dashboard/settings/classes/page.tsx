"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  X,
  Loader2,
  Check,
  Trash2,
  Users,
  AlertTriangle,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────

interface StaffChip {
  id: string;
  ls_class_id: string | null;
  staff_id: string;
  staff_name: string;
  role: string;
  is_primary_teacher: boolean | null;
  term: string | null;
}

interface ClassSummary {
  id: string;
  organization_id: string;
  year_group: string;
  class_name: string;
  key_stage: string;
  room: string | null;
  academic_year: string;
  pupil_count: number;
  slot_count: number;
  staff: StaffChip[];
}

interface NewClassDraft {
  year_group: string;
  class_name: string;
  room: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const YEAR_GROUPS = [
  "Nursery",
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
  "Year 13",
];

const KEY_STAGES = ["EYFS", "KS1", "KS2", "KS3", "KS4", "KS5"];

function inferKeyStage(yearGroup: string): string {
  const s = yearGroup.toLowerCase();
  if (s === "nursery" || s === "reception") return "EYFS";
  const m = s.match(/year\s*(\d+)/);
  if (!m) return "EYFS";
  const n = parseInt(m[1], 10);
  if (n <= 2) return "KS1";
  if (n <= 6) return "KS2";
  if (n <= 9) return "KS3";
  if (n <= 11) return "KS4";
  return "KS5";
}

function yearGroupOrder(label: string): number {
  const s = label.toLowerCase();
  if (s === "nursery") return -1;
  if (s === "reception") return 0;
  const m = s.match(/year\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 99;
}

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

// ─── Role pill colours ──────────────────────────────────────────────

function roleColor(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("teacher") && !r.includes("cover") && !r.includes("assistant"))
    return "bg-teal-50 text-teal-700 border-teal-200";
  if (r.includes("cover") || r.includes("supply"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (r.includes("ta") || r.includes("assistant"))
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (r.includes("1:1"))
    return "bg-purple-50 text-purple-700 border-purple-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function ClassesSettingsPage() {
  const { organizationId } = useAuth();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [unlinkedCount, setUnlinkedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ClassSummary>>({});
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<NewClassDraft>({
    year_group: "Year 1",
    class_name: "",
    room: "",
  });
  const [savingRow, setSavingRow] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/lesson-studio/classes/summary", {
        headers,
      });
      if (!res.ok) {
        setError(`Failed to load: ${res.status}`);
        return;
      }
      const body = await res.json();
      const list = (body?.classes || []) as ClassSummary[];
      list.sort(
        (a, b) =>
          yearGroupOrder(a.year_group) - yearGroupOrder(b.year_group) ||
          a.class_name.localeCompare(b.class_name),
      );
      setClasses(list);
      setUnlinkedCount(body?.unlinked_assignment_count || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (c: ClassSummary) => {
    setEditingId(c.id);
    setEditDraft({
      year_group: c.year_group,
      class_name: c.class_name,
      key_stage: c.key_stage,
      room: c.room ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const saveEdit = async (id: string) => {
    setSavingRow(id);
    try {
      const headers = {
        ...(await authHeaders()),
        "Content-Type": "application/json",
      };
      const body = {
        ...editDraft,
        key_stage:
          editDraft.key_stage ||
          inferKeyStage(editDraft.year_group ?? "Year 1"),
      };
      const res = await fetch(`/api/lesson-studio/classes/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Save failed (${res.status})`);
        return;
      }
      await load();
      setEditingId(null);
      setEditDraft({});
      setError(null);
    } finally {
      setSavingRow(null);
    }
  };

  const deleteClass = async (c: ClassSummary) => {
    if (
      !confirm(
        `Delete "${c.year_group} — ${c.class_name}"?\n\nThis removes the class record but keeps all staff profiles and pupil data.`,
      )
    )
      return;
    setSavingRow(c.id);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/lesson-studio/classes/${c.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Delete failed (${res.status})`);
        return;
      }
      await load();
      setError(null);
    } finally {
      setSavingRow(null);
    }
  };

  const createClass = async () => {
    if (!newDraft.class_name.trim()) {
      setError("Class name is required");
      return;
    }
    setSavingRow("new");
    try {
      const headers = {
        ...(await authHeaders()),
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/lesson-studio/classes", {
        method: "POST",
        headers,
        body: JSON.stringify({
          year_group: newDraft.year_group,
          class_name: newDraft.class_name.trim(),
          key_stage: inferKeyStage(newDraft.year_group),
          room: newDraft.room.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Create failed (${res.status})`);
        return;
      }
      await load();
      setAdding(false);
      setNewDraft({ year_group: "Year 1", class_name: "", room: "" });
      setError(null);
    } finally {
      setSavingRow(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Settings
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-teal-600" />
            Classes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define your school&apos;s classes. Staff and pupils are assigned to classes from here.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      {unlinkedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-amber-900">
              {unlinkedCount} staff assignment{unlinkedCount === 1 ? "" : "s"} aren&apos;t yet linked to a class.
            </span>{" "}
            <Link
              href="/dashboard/settings/class-assignments"
              className="text-amber-700 underline hover:text-amber-900"
            >
              Review in Class Assignments →
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 w-36">Year group</th>
                <th className="px-4 py-3">Class name</th>
                <th className="px-4 py-3 w-24">Stage</th>
                <th className="px-4 py-3 w-32">Room</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3 w-24 text-right">Pupils</th>
                <th className="px-4 py-3 w-28 text-right">Timetable</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : classes.length === 0 && !adding ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                    No classes yet.{" "}
                    <button
                      onClick={() => setAdding(true)}
                      className="text-teal-600 hover:underline font-medium"
                    >
                      Add your first class
                    </button>
                  </td>
                </tr>
              ) : (
                classes.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={
                        isEditing ? "bg-teal-50/40" : "hover:bg-slate-50/50"
                      }
                    >
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <select
                            value={editDraft.year_group as string}
                            onChange={(e) => {
                              const yg = e.target.value;
                              setEditDraft({
                                ...editDraft,
                                year_group: yg,
                                key_stage: inferKeyStage(yg),
                              });
                            }}
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                          >
                            {YEAR_GROUPS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-medium text-slate-700">
                            {c.year_group}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDraft.class_name as string}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                class_name: e.target.value,
                              })
                            }
                            placeholder="e.g. Oaks"
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {c.class_name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <select
                            value={editDraft.key_stage as string}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                key_stage: e.target.value,
                              })
                            }
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                          >
                            {KEY_STAGES.map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {c.key_stage}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <input
                            type="text"
                            value={(editDraft.room as string) ?? ""}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                room: e.target.value,
                              })
                            }
                            placeholder="Room"
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                          />
                        ) : (
                          <span className="text-slate-500">{c.room || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {c.staff.length === 0 ? (
                          <Link
                            href={`/dashboard/settings/class-assignments?year_group=${yearGroupOrder(c.year_group)}`}
                            className="text-xs text-amber-700 hover:text-amber-900 underline inline-flex items-center gap-1"
                          >
                            <Users className="w-3 h-3" />
                            No staff assigned
                          </Link>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {c.staff.map((s) => (
                              <span
                                key={s.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${roleColor(s.role)}`}
                                title={`${s.role}${s.term && s.term !== "All Year" ? ` · ${s.term}` : ""}`}
                              >
                                {s.staff_name}
                                <span className="opacity-60">· {s.role}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        {c.pupil_count === 0 ? (
                          <Link
                            href="/dashboard/pupils"
                            className="text-xs text-amber-700 hover:text-amber-900 underline"
                          >
                            0
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-700">
                            {c.pupil_count}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        {c.slot_count === 0 ? (
                          <Link
                            href="/dashboard/teaching-learning/lesson-studio"
                            className="text-xs text-amber-700 hover:text-amber-900 underline"
                          >
                            Set up
                          </Link>
                        ) : (
                          <span className="text-slate-600">{c.slot_count} slots</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(c.id)}
                                disabled={savingRow === c.id}
                                className="p-1.5 rounded-md hover:bg-teal-100 text-teal-700 disabled:opacity-50"
                                title="Save"
                              >
                                {savingRow === c.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(c)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteClass(c)}
                                disabled={savingRow === c.id}
                                className="p-1.5 rounded-md hover:bg-red-50 text-red-500 disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {adding && (
                <tr className="bg-teal-50/40">
                  <td className="px-4 py-3">
                    <select
                      value={newDraft.year_group}
                      onChange={(e) =>
                        setNewDraft({ ...newDraft, year_group: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                    >
                      {YEAR_GROUPS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      autoFocus
                      value={newDraft.class_name}
                      onChange={(e) =>
                        setNewDraft({ ...newDraft, class_name: e.target.value })
                      }
                      placeholder="e.g. Oaks"
                      className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {inferKeyStage(newDraft.year_group)}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={newDraft.room}
                      onChange={(e) =>
                        setNewDraft({ ...newDraft, room: e.target.value })
                      }
                      placeholder="Room"
                      className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    Add staff after saving
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">—</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">—</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={createClass}
                        disabled={savingRow === "new"}
                        className="p-1.5 rounded-md hover:bg-teal-100 text-teal-700 disabled:opacity-50"
                        title="Save"
                      >
                        {savingRow === "new" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setAdding(false);
                          setNewDraft({
                            year_group: "Year 1",
                            class_name: "",
                            room: "",
                          });
                        }}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-500 leading-relaxed">
        Staff are assigned to classes in{" "}
        <Link
          href="/dashboard/settings/class-assignments"
          className="text-teal-700 underline hover:text-teal-900"
        >
          Class Assignments
        </Link>
        . Pupils are imported from your MIS or CTF files in{" "}
        <Link
          href="/dashboard/pupils"
          className="text-teal-700 underline hover:text-teal-900"
        >
          Pupils
        </Link>
        .
      </div>
    </div>
  );
}
