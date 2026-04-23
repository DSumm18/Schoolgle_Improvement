"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  User,
  Shield,
  Heart,
  Eye,
  Ear,
  Brain,
  BookOpen,
  AlertTriangle,
  Star,
  Globe,
  Stethoscope,
  Activity,
  ChevronDown,
  ChevronRight,
  Search,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { useAuth } from "@/context/SupabaseAuthContext";

// Extended pupil type with MIS enrichment fields
interface PupilRecord {
  id: string;
  pupil_ref: string;
  display_name_encrypted: string;
  year_group: string;
  gender: string;
  has_ehcp: boolean;
  has_send_support: boolean;
  send_primary_need: string | null;
  send_secondary_need: string | null;
  is_pupil_premium: boolean;
  is_eal: boolean;
  eal_stage: string | null;
  is_looked_after: boolean;
  accessibility_needs: string[];
  attainment_reading: string | null;
  attainment_writing: string | null;
  attainment_maths: string | null;
  attainment_science: string | null;
  standardised_score_reading: number | null;
  standardised_score_maths: number | null;
  reading_age: string | null;
  spelling_age: string | null;
  medical_conditions: string | null;
  communication_method: string | null;
  ehcp_provisions: string | null;
  key_worker: string | null;
  external_agencies: string | null;
  provision_description: string | null;
  ehcp_start_date: string | null;
  next_annual_review: string | null;
  funding: string | null;
  _source?: string;
}

interface ClassRecord {
  id: string;
  year_group: string;
  class_name: string;
  key_stage: string;
  pupil_count: number;
  teacher_name?: string;
  _source?: string;
}

const ATTAINMENT_COLOURS: Record<string, string> = {
  GDS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  EXS: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  WTS: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  PKF: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  PKE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  BLW: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function AttainmentBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-slate-400 text-xs">—</span>;
  const base = level.replace(/[+-]$/, "");
  const colour = ATTAINMENT_COLOURS[base] || "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${colour}`}
    >
      {level}
    </span>
  );
}

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (!score) return null;
  const colour =
    score >= 115
      ? "text-indigo-700 dark:text-indigo-300"
      : score >= 100
        ? "text-green-700 dark:text-green-300"
        : score >= 85
          ? "text-amber-700 dark:text-amber-300"
          : "text-red-700 dark:text-red-300";
  return (
    <div className="text-center">
      <div className={`text-sm font-bold ${colour}`}>{score}</div>
      <div className="text-[9px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}

function FlagPill({ label, colour }: { label: string; colour: string }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colour}`}
    >
      {label}
    </span>
  );
}

function PupilCard({
  pupil,
  expanded,
  onToggle,
}: {
  pupil: PupilRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const name = pupil.display_name_encrypted?.startsWith("enc:")
    ? pupil.display_name_encrypted.slice(4)
    : pupil.display_name_encrypted || pupil.pupil_ref;

  const flags: { label: string; colour: string }[] = [];
  if (pupil.has_ehcp)
    flags.push({
      label: `EHCP — ${pupil.send_primary_need}`,
      colour:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    });
  else if (pupil.has_send_support)
    flags.push({
      label: `SEN K — ${pupil.send_primary_need}`,
      colour:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    });
  if (pupil.is_pupil_premium)
    flags.push({
      label: "PP",
      colour:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    });
  if (pupil.is_eal)
    flags.push({
      label: `EAL${pupil.eal_stage ? ` ${pupil.eal_stage}` : ""}`,
      colour:
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    });
  if (pupil.is_looked_after)
    flags.push({
      label: "LAC",
      colour:
        "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    });
  if (pupil.medical_conditions)
    flags.push({
      label: "Medical",
      colour:
        "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <User className="w-4 h-4 text-teal-700 dark:text-teal-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            {name}
          </div>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {flags.map((f, i) => (
              <FlagPill key={i} {...f} />
            ))}
            {flags.length === 0 && (
              <span className="text-[10px] text-slate-400">
                No additional flags
              </span>
            )}
          </div>
        </div>

        {/* Attainment summary */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="text-center">
            <AttainmentBadge level={pupil.attainment_reading} />
            <div className="text-[8px] text-slate-400 mt-0.5">R</div>
          </div>
          <div className="text-center">
            <AttainmentBadge level={pupil.attainment_writing} />
            <div className="text-[8px] text-slate-400 mt-0.5">W</div>
          </div>
          <div className="text-center">
            <AttainmentBadge level={pupil.attainment_maths} />
            <div className="text-[8px] text-slate-400 mt-0.5">M</div>
          </div>
        </div>

        {/* Standardised scores */}
        <div className="hidden md:flex items-center gap-2">
          <ScoreBadge score={pupil.standardised_score_reading} label="Rd" />
          <ScoreBadge score={pupil.standardised_score_maths} label="Ma" />
        </div>

        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
          {/* Row 1: Attainment detail */}
          <div className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["reading", "writing", "maths", "science"] as const).map(
              (subj) => {
                const att = pupil[`attainment_${subj}` as keyof PupilRecord] as
                  | string
                  | null;
                return (
                  <div
                    key={subj}
                    className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2"
                  >
                    <div className="text-[10px] text-slate-500 uppercase font-medium">
                      {subj}
                    </div>
                    <div className="mt-1">
                      <AttainmentBadge level={att} />
                    </div>
                  </div>
                );
              },
            )}
          </div>

          {/* Row 2: Scores & ages */}
          {(pupil.standardised_score_reading || pupil.reading_age) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pupil.standardised_score_reading && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">
                    Std Reading
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {pupil.standardised_score_reading}
                  </div>
                </div>
              )}
              {pupil.standardised_score_maths && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">
                    Std Maths
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {pupil.standardised_score_maths}
                  </div>
                </div>
              )}
              {pupil.reading_age && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">
                    Reading Age
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {pupil.reading_age}
                  </div>
                </div>
              )}
              {pupil.spelling_age && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">
                    Spelling Age
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {pupil.spelling_age}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Row 3: SEND detail */}
          {(pupil.has_ehcp || pupil.has_send_support) && (
            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-800 dark:text-purple-300">
                <Shield className="w-4 h-4" />
                SEND Information
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Status:</span>{" "}
                  <span className="font-medium">
                    {pupil.has_ehcp ? "EHCP" : "SEN Support"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Primary Need:</span>{" "}
                  <span className="font-medium">
                    {pupil.send_primary_need || "—"}
                  </span>
                </div>
                {pupil.send_secondary_need && (
                  <div>
                    <span className="text-slate-500">Secondary:</span>{" "}
                    <span className="font-medium">
                      {pupil.send_secondary_need}
                    </span>
                  </div>
                )}
                {pupil.key_worker && (
                  <div>
                    <span className="text-slate-500">Key Worker:</span>{" "}
                    <span className="font-medium">{pupil.key_worker}</span>
                  </div>
                )}
                {pupil.funding && (
                  <div>
                    <span className="text-slate-500">Funding:</span>{" "}
                    <span className="font-medium">{pupil.funding}</span>
                  </div>
                )}
                {pupil.provision_description && (
                  <div>
                    <span className="text-slate-500">Provision:</span>{" "}
                    <span className="font-medium">
                      {pupil.provision_description}
                    </span>
                  </div>
                )}
              </div>
              {pupil.external_agencies && (
                <div className="text-xs">
                  <span className="text-slate-500">External Agencies:</span>{" "}
                  <span className="font-medium">{pupil.external_agencies}</span>
                </div>
              )}
              {pupil.ehcp_provisions && (
                <div className="mt-2">
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase mb-1">
                    EHCP Provisions
                  </div>
                  <ul className="space-y-0.5">
                    {pupil.ehcp_provisions.split(";").map((p, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1"
                      >
                        <span className="text-purple-400 mt-0.5">•</span>{" "}
                        {p.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pupil.next_annual_review && (
                <div className="text-xs text-slate-500">
                  Annual Review:{" "}
                  <span className="font-medium">
                    {new Date(pupil.next_annual_review).toLocaleDateString(
                      "en-GB",
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Row 4: Medical */}
          {pupil.medical_conditions && (
            <div className="bg-pink-50 dark:bg-pink-900/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-pink-800 dark:text-pink-300">
                <Stethoscope className="w-4 h-4" />
                Medical
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                {pupil.medical_conditions}
              </div>
            </div>
          )}

          {/* Row 5: Accessibility */}
          {pupil.accessibility_needs &&
            pupil.accessibility_needs.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
                  <Eye className="w-4 h-4" />
                  Accessibility Needs
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {pupil.accessibility_needs.map((n, i) => (
                    <span
                      key={i}
                      className="inline-block px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-[10px]"
                    >
                      {n.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Row 6: Communication */}
          {pupil.communication_method &&
            pupil.communication_method !== "Verbal" && (
              <div className="bg-cyan-50 dark:bg-cyan-900/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-800 dark:text-cyan-300">
                  <Brain className="w-4 h-4" />
                  Communication
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  {pupil.communication_method}
                </div>
              </div>
            )}

          {/* Source indicator */}
          <div className="text-[10px] text-slate-400 text-right">
            Data source:{" "}
            {pupil._source === "mis" ? "MIS (live)" : "Schoolgle database"} •
            Ref: {pupil.pupil_ref}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PupilRecordsPage() {
  const { organizationId, session } = useAuth();
  const authHeaders: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const [viewAll, setViewAll] = useState(false);
  const [pupils, setPupils] = useState<PupilRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPupils, setLoadingPupils] = useState(false);
  const [expandedPupil, setExpandedPupil] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "ehcp" | "sen" | "pp" | "eal" | "medical"
  >("all");

  // Load classes
  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/lesson-studio/classes?organizationId=${organizationId}`, {
      headers: authHeaders,
    })
      .then((r) => r.json())
      .then((res) => {
        const data = res.data ?? [];
        setClasses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [organizationId]);

  // Load pupils when class selected or "All Pupils" is clicked
  useEffect(() => {
    if (!organizationId) {
      setPupils([]);
      return;
    }

    // If viewing all pupils or no class selected
    if (viewAll || !selectedClass) {
      if (!viewAll) {
        setPupils([]);
        return;
      }
      setLoadingPupils(true);
      setExpandedPupil(null);
      fetch(`/api/all-pupils?organizationId=${organizationId}`, {
        headers: authHeaders,
      })
        .then((r) => r.json())
        .then((res) => {
          setPupils(res.data ?? []);
          setLoadingPupils(false);
        })
        .catch(() => setLoadingPupils(false));
    } else {
      // Load pupils for selected class
      setLoadingPupils(true);
      setExpandedPupil(null);
      fetch(
        `/api/lesson-studio/pupils?classId=${selectedClass.id}&organizationId=${organizationId}`,
        { headers: authHeaders },
      )
        .then((r) => r.json())
        .then((res) => {
          setPupils(res.data ?? []);
          setLoadingPupils(false);
        })
        .catch(() => setLoadingPupils(false));
    }
  }, [selectedClass, viewAll, organizationId]);

  // Filter + search
  const filtered = pupils.filter((p) => {
    const name = (p.display_name_encrypted || p.pupil_ref).toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (filter === "ehcp") return p.has_ehcp;
    if (filter === "sen") return p.has_send_support || p.has_ehcp;
    if (filter === "pp") return p.is_pupil_premium;
    if (filter === "eal") return p.is_eal;
    if (filter === "medical") return !!p.medical_conditions;
    return true;
  });

  // Class stats
  const classStats = (selectedClass || viewAll)
    ? {
        total: pupils.length,
        ehcp: pupils.filter((p) => p.has_ehcp).length,
        senK: pupils.filter((p) => p.has_send_support && !p.has_ehcp).length,
        pp: pupils.filter((p) => p.is_pupil_premium).length,
        eal: pupils.filter((p) => p.is_eal).length,
        medical: pupils.filter((p) => p.medical_conditions).length,
      }
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModulePageHeader
        moduleId="teaching-learning"
        icon={Users}
        label="Teaching & Learning"
        title="Pupil Records"
        description="View class profiles and individual pupil data from your MIS. Names are resolved client-side — no pupil names are stored on our servers."
      />

      {/* Class selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Select a class
          </div>
          <button
            onClick={() => {
              setViewAll(true);
              setSelectedClass(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewAll
                ? "bg-teal-600 text-white"
                : "border border-slate-200 dark:border-slate-600 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {viewAll ? "✓ All Pupils" : "All Pupils"}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => {
                setSelectedClass(cls);
                setViewAll(false);
              }}
              className={`px-3 py-2.5 rounded-xl text-left transition-all ${
                selectedClass?.id === cls.id
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                  : "border border-slate-200 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-600"
              }`}
            >
              <div className="font-bold text-sm">{cls.class_name}</div>
              <div
                className={`text-xs ${selectedClass?.id === cls.id ? "text-teal-100" : "text-slate-500"}`}
              >
                {cls.year_group} • {cls.pupil_count}
              </div>
              {cls.teacher_name && (
                <div
                  className={`text-[10px] mt-0.5 ${selectedClass?.id === cls.id ? "text-teal-200" : "text-slate-400"}`}
                >
                  {cls.teacher_name}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Class overview + pupil list */}
      {selectedClass && (
        <>
          {/* Stats bar */}
          {classStats && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                {
                  label: "Total",
                  value: classStats.total,
                  icon: Users,
                  colour: "text-slate-700 dark:text-slate-300",
                },
                {
                  label: "EHCP",
                  value: classStats.ehcp,
                  icon: Shield,
                  colour: "text-purple-700 dark:text-purple-300",
                },
                {
                  label: "SEN K",
                  value: classStats.senK,
                  icon: Shield,
                  colour: "text-blue-700 dark:text-blue-300",
                },
                {
                  label: "PP",
                  value: classStats.pp,
                  icon: Star,
                  colour: "text-amber-700 dark:text-amber-300",
                },
                {
                  label: "EAL",
                  value: classStats.eal,
                  icon: Globe,
                  colour: "text-cyan-700 dark:text-cyan-300",
                },
                {
                  label: "Medical",
                  value: classStats.medical,
                  icon: Stethoscope,
                  colour: "text-pink-700 dark:text-pink-300",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center"
                >
                  <s.icon className={`w-4 h-4 mx-auto ${s.colour}`} />
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {s.value}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search pupils..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(["all", "ehcp", "sen", "pp", "eal", "medical"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === f
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {f === "all" ? "All" : f.toUpperCase()}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Pupil list */}
          {loadingPupils ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.length === 0 && !loadingPupils && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {search
                    ? "No pupils match your search"
                    : viewAll
                      ? "No pupils found"
                      : "No pupils found for this class"}
                </div>
              )}
              {filtered.map((p) => (
                <PupilCard
                  key={p.id}
                  pupil={p}
                  expanded={expandedPupil === p.id}
                  onToggle={() =>
                    setExpandedPupil(expandedPupil === p.id ? null : p.id)
                  }
                />
              ))}
            </div>
          )}

          {/* GDPR notice */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-xs text-slate-500 flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Privacy:</span> Pupil names are
              resolved from your MIS connection client-side only. No pupil names
              are stored on Schoolgle servers. Our database references pupils by
              anonymised reference codes only. Your school remains the data
              controller — Schoolgle is the data processor.
            </div>
          </div>
        </>
      )}

      {!selectedClass && !viewAll && (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <div className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Select a class or click "All Pupils" to view pupil records
          </div>
          <div className="text-sm mt-1">
            {classes.length > 0 ? `${classes.length} classes available` : "Data is loaded from your MIS connection"}
          </div>
        </div>
      )}
    </div>
  );
}
