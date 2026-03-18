"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  X,
  Loader2,
  Lock,
  GraduationCap,
  UserPlus,
  Trash2,
  Check,
  ChevronDown,
  AlertTriangle,
  BookOpen,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

interface ClassAssignment {
  id: string;
  staff_id: string;
  user_id: string | null;
  staff_name: string;
  academic_year: string;
  year_group: number;
  registration_group: string | null;
  role: string;
  fte_for_class: number;
  term: string;
  is_primary_teacher: boolean;
  notes: string | null;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  role_category: string;
  is_active: boolean;
  user_id?: string;
}

const YEAR_GROUPS = [
  { value: -1, label: "Nursery", short: "N" },
  { value: 0, label: "Reception", short: "R" },
  { value: 1, label: "Year 1", short: "Y1" },
  { value: 2, label: "Year 2", short: "Y2" },
  { value: 3, label: "Year 3", short: "Y3" },
  { value: 4, label: "Year 4", short: "Y4" },
  { value: 5, label: "Year 5", short: "Y5" },
  { value: 6, label: "Year 6", short: "Y6" },
  { value: 7, label: "Year 7", short: "Y7" },
  { value: 8, label: "Year 8", short: "Y8" },
  { value: 9, label: "Year 9", short: "Y9" },
  { value: 10, label: "Year 10", short: "Y10" },
  { value: 11, label: "Year 11", short: "Y11" },
  { value: 12, label: "Year 12", short: "Y12" },
  { value: 13, label: "Year 13", short: "Y13" },
];

const ROLES = [
  "Class Teacher",
  "Job Share",
  "PPA Cover",
  "Teaching Assistant",
  "Teaching HT",
  "Supply",
  "HLTA",
  "1:1 Support",
];

const TERMS = [
  "All Year",
  "Autumn Only",
  "Spring Only",
  "Summer Only",
  "Autumn+Spring",
  "Spring+Summer",
];

const YEAR_GROUP_COLORS: Record<number, string> = {
  [-1]: "bg-slate-100 border-slate-300 dark:bg-slate-800",
  0: "bg-rose-50 border-rose-200 dark:bg-rose-950/20",
  1: "bg-orange-50 border-orange-200 dark:bg-orange-950/20",
  2: "bg-amber-50 border-amber-200 dark:bg-amber-950/20",
  3: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20",
  4: "bg-lime-50 border-lime-200 dark:bg-lime-950/20",
  5: "bg-green-50 border-green-200 dark:bg-green-950/20",
  6: "bg-teal-50 border-teal-200 dark:bg-teal-950/20",
  7: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20",
  8: "bg-sky-50 border-sky-200 dark:bg-sky-950/20",
  9: "bg-blue-50 border-blue-200 dark:bg-blue-950/20",
  10: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20",
  11: "bg-violet-50 border-violet-200 dark:bg-violet-950/20",
  12: "bg-purple-50 border-purple-200 dark:bg-purple-950/20",
  13: "bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-950/20",
};

// ─── Add Staff Modal ───────────────────────────────────────

function AddStaffModal({
  yearGroup,
  staff,
  existingAssignments,
  onAdd,
  onClose,
}: {
  yearGroup: { value: number; label: string };
  staff: StaffMember[];
  existingAssignments: ClassAssignment[];
  onAdd: (data: {
    staffId: string;
    userId: string | null;
    staffName: string;
    role: string;
    registrationGroup: string;
    term: string;
    isPrimaryTeacher: boolean;
  }) => void;
  onClose: () => void;
}) {
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [role, setRole] = useState("Class Teacher");
  const [regGroup, setRegGroup] = useState("");
  const [term, setTerm] = useState("All Year");
  const [showStaffPicker, setShowStaffPicker] = useState(false);

  const assignedStaffIds = existingAssignments
    .filter((a) => a.year_group === yearGroup.value)
    .map((a) => a.staff_id);

  const availableStaff = staff.filter(
    (s) => s.is_active && !assignedStaffIds.includes(s.id),
  );

  const chosen = staff.find((s) => s.id === selectedStaff);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">
              Assign Staff to {yearGroup.label}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a staff member and their role
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Staff picker */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">
              Staff Member
            </label>
            <div className="relative">
              <button
                onClick={() => setShowStaffPicker(!showStaffPicker)}
                className="w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm bg-white dark:bg-slate-900 hover:border-slate-400 transition-colors"
              >
                <span className={chosen ? "" : "text-slate-400"}>
                  {chosen
                    ? `${chosen.first_name} ${chosen.last_name}`
                    : "Select staff member..."}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {showStaffPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {availableStaff.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      All staff are already assigned to this year group
                    </div>
                  ) : (
                    availableStaff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedStaff(s.id);
                          setShowStaffPicker(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm flex items-center justify-between"
                      >
                        <span>
                          {s.first_name} {s.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.job_title}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white dark:bg-slate-900"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Registration Group (class name) */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">
              Class / Registration Group{" "}
              <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={regGroup}
              onChange={(e) => setRegGroup(e.target.value)}
              placeholder='e.g. "Oak", "3B", "Maple"'
              className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white dark:bg-slate-900"
            />
          </div>

          {/* Term */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">
              Term
            </label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white dark:bg-slate-900"
            >
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedStaff}
            onClick={() => {
              if (!chosen) return;
              onAdd({
                staffId: chosen.id,
                userId: chosen.user_id || null,
                staffName: `${chosen.first_name} ${chosen.last_name}`,
                role,
                registrationGroup: regGroup,
                term,
                isPrimaryTeacher: role === "Class Teacher",
              });
              onClose();
            }}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Year Group Card ───────────────────────────────────────

function YearGroupCard({
  yg,
  assignments,
  onAddClick,
  onRemove,
}: {
  yg: { value: number; label: string; short: string };
  assignments: ClassAssignment[];
  onAddClick: () => void;
  onRemove: (id: string) => void;
}) {
  const cardColor =
    YEAR_GROUP_COLORS[yg.value] || "bg-slate-50 border-slate-200";
  const primary = assignments.find((a) => a.is_primary_teacher);
  const support = assignments.filter((a) => !a.is_primary_teacher);

  return (
    <div
      className={`${cardColor} border rounded-xl p-4 transition-all hover:shadow-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center font-bold text-sm">
            {yg.short}
          </div>
          <span className="font-bold text-sm">{yg.label}</span>
        </div>
        <button
          onClick={onAddClick}
          className="p-1.5 rounded-lg bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors"
          title="Assign staff"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-2">
          No staff assigned
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Primary teacher first */}
          {primary && (
            <div className="flex items-center justify-between bg-white/70 dark:bg-black/10 rounded-lg px-3 py-2 group">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {primary.staff_name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {primary.role}
                    </span>
                    {primary.registration_group && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {primary.registration_group}
                      </Badge>
                    )}
                    {primary.term !== "All Year" && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        <Clock className="w-2.5 h-2.5 mr-0.5" />
                        {primary.term}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemove(primary.id)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Remove assignment"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}

          {/* Support staff */}
          {support.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-white/40 dark:bg-black/5 rounded-lg px-3 py-1.5 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Users className="w-3 h-3 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate">
                    {a.staff_name}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {a.role}
                    {a.term !== "All Year" ? ` · ${a.term}` : ""}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemove(a.id)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Remove assignment"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function ClassAssignmentsPage() {
  const { user, organization } = useAuth();
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingToYG, setAddingToYG] = useState<{
    value: number;
    label: string;
  } | null>(null);

  const orgId = organization?.id;
  const userRole = organization?.role;
  const isSLT = ["admin", "headteacher", "slt"].includes(userRole || "");

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const [assignRes, staffRes] = await Promise.all([
        fetch(`/api/class-assignments?organizationId=${orgId}`, { headers }),
        fetch(`/api/staff?organizationId=${orgId}`, { headers }),
      ]);

      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.assignments || []);
      }
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data.staff || data.data || []);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (data: {
    staffId: string;
    userId: string | null;
    staffName: string;
    role: string;
    registrationGroup: string;
    term: string;
    isPrimaryTeacher: boolean;
  }) => {
    if (!addingToYG) return;
    setSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/class-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          organizationId: orgId,
          staffId: data.staffId,
          userId: data.userId,
          staffName: data.staffName,
          yearGroup: addingToYG.value,
          registrationGroup: data.registrationGroup || null,
          role: data.role,
          term: data.term,
          isPrimaryTeacher: data.isPrimaryTeacher,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/class-assignments?id=${id}&organizationId=${orgId}`,
        { method: "DELETE", headers },
      );
      if (!res.ok) throw new Error("Failed to remove");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Detect which year groups to show based on school phase
  // Default to primary (R-Y6), but show more if any assignments exist for higher year groups
  const maxAssigned = Math.max(6, ...assignments.map((a) => a.year_group));
  const visibleYGs = YEAR_GROUPS.filter(
    (yg) => yg.value >= -1 && yg.value <= Math.max(6, maxAssigned),
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading class assignments...</span>
        </div>
      </div>
    );
  }

  if (!isSLT) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold mb-1">
              Senior Leadership Access Only
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Class assignments are managed by your school&apos;s leadership
              team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignedCount = new Set(assignments.map((a) => a.staff_id)).size;
  const ygWithTeacher = new Set(
    assignments.filter((a) => a.is_primary_teacher).map((a) => a.year_group),
  ).size;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Class Assignments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Assign staff to year groups and classes. Teachers will see data
            filtered to their assigned classes.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline">{assignedCount} staff assigned</Badge>
          <Badge variant="outline">
            {ygWithTeacher}/{visibleYGs.length} classes covered
          </Badge>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 px-4 py-3 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* How it works */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200">
                How class assignments work
              </p>
              <ul className="mt-1.5 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                <li>
                  <Check className="w-3 h-3 inline mr-1" />
                  <strong>Teachers</strong> see attendance, behaviour, and
                  assessment data for their assigned classes only
                </li>
                <li>
                  <Check className="w-3 h-3 inline mr-1" />
                  <strong>SLT</strong> always see whole-school data
                </li>
                <li>
                  <Check className="w-3 h-3 inline mr-1" />
                  <strong>Ed</strong> filters responses based on who&apos;s
                  asking — a Y3 teacher asking &quot;how is my class
                  doing?&quot; gets Y3 data
                </li>
                <li>
                  <Check className="w-3 h-3 inline mr-1" />
                  <strong>Cover / support</strong> — assign staff to multiple
                  classes with different roles
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year Group Grid */}
      <div>
        <h2 className="text-lg font-bold mb-4">2025-26 Staffing Structure</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleYGs.map((yg) => (
            <YearGroupCard
              key={yg.value}
              yg={yg}
              assignments={assignments.filter((a) => a.year_group === yg.value)}
              onAddClick={() => setAddingToYG(yg)}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      {/* Unassigned staff */}
      {staff.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Unassigned Teaching Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const assignedIds = new Set(assignments.map((a) => a.staff_id));
              const teachingRoles = [
                "headteacher",
                "deputy_headteacher",
                "assistant_headteacher",
                "class_teacher",
                "subject_lead",
                "phase_lead",
                "sendco",
                "teaching_assistant",
              ];
              const unassigned = staff.filter(
                (s) =>
                  s.is_active &&
                  teachingRoles.includes(s.role_category) &&
                  !assignedIds.has(s.id),
              );

              if (unassigned.length === 0) {
                return (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    All teaching staff are assigned to classes
                  </p>
                );
              }

              return (
                <div className="flex flex-wrap gap-2">
                  {unassigned.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-full text-xs"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>
                        {s.first_name} {s.last_name}
                      </span>
                      <span className="text-muted-foreground">
                        ({s.job_title})
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Ed tip */}
      <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-lg px-4 py-3 border">
        <strong>Tip:</strong> You can also ask Ed to manage class assignments.
        Try: &quot;Assign Mrs Smith to Year 3&quot; or &quot;Show me which
        classes don&apos;t have a teacher yet&quot;.
      </div>

      {/* Add staff modal */}
      {addingToYG && (
        <AddStaffModal
          yearGroup={addingToYG}
          staff={staff}
          existingAssignments={assignments}
          onAdd={handleAdd}
          onClose={() => setAddingToYG(null)}
        />
      )}
    </div>
  );
}
