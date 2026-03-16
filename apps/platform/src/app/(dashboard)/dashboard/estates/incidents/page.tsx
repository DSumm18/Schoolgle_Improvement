"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  Clock,
  FileWarning,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Activity,
  Flame,
  Eye,
  Users,
  Bug,
  Zap,
  Lock,
  Leaf,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  incident_date: string;
  incident_time: string | null;
  location: string;
  location_detail: string | null;
  injured_person_name: string | null;
  injured_person_type: string | null;
  title: string;
  description: string;
  first_aid_given: boolean;
  first_aid_details: string | null;
  first_aider_name: string | null;
  hospital_attendance: boolean;
  is_riddor_reportable: boolean;
  riddor_category: string | null;
  riddor_deadline: string | null;
  riddor_reference: string | null;
  investigation_required: boolean;
  investigation_lead: string | null;
  root_cause: string | null;
  corrective_actions: any[];
  linked_risk_id: string | null;
  status: string;
  reported_by_name: string;
  reviewed_by_name: string | null;
  closed_by_name: string | null;
  closed_at: string | null;
  closure_notes: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  open: number;
  closed: number;
  awaiting_riddor: number;
  riddor_reportable: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
  last_30_days: number;
  this_year: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  open: {
    label: "Open",
    color:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    icon: AlertCircle,
  },
  investigating: {
    label: "Investigating",
    color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    icon: Search,
  },
  awaiting_riddor: {
    label: "Awaiting RIDDOR",
    color: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    icon: FileWarning,
  },
  closed: {
    label: "Closed",
    color:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  closed_no_action: {
    label: "Closed (No Action)",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: CheckCircle2,
  },
};

const SEVERITY_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  critical: {
    label: "Critical",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    dot: "bg-red-500",
  },
  major: {
    label: "Major",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  moderate: {
    label: "Moderate",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  minor: {
    label: "Minor",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    dot: "bg-green-500",
  },
};

const TYPE_ICONS: Record<string, any> = {
  accident: AlertTriangle,
  near_miss: Eye,
  dangerous_occurrence: Zap,
  violence: Users,
  ill_health: Bug,
  fire: Flame,
  security: Lock,
  environmental: Leaf,
  other: HelpCircle,
};

const TYPE_LABELS: Record<string, string> = {
  accident: "Accident",
  near_miss: "Near Miss",
  dangerous_occurrence: "Dangerous Occurrence",
  violence: "Violence/Aggression",
  ill_health: "Ill Health",
  fire: "Fire",
  security: "Security",
  environmental: "Environmental",
  other: "Other",
};

type FilterTab =
  | "all"
  | "open"
  | "investigating"
  | "awaiting_riddor"
  | "closed";

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Investigating", value: "investigating" },
  { label: "RIDDOR", value: "awaiting_riddor" },
  { label: "Closed", value: "closed" },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatDate(d: string | null): string {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  subtext?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {value}
            </p>
            {subtext && (
              <p className="text-[11px] text-slate-400 mt-0.5">{subtext}</p>
            )}
          </div>
          <div
            className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewIncidentForm({
  onClose,
  onCreated,
  orgId,
}: {
  onClose: () => void;
  onCreated: () => void;
  orgId: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [riddorResult, setRiddorResult] = useState<any>(null);
  const [sopInfo, setSopInfo] = useState<{
    sop_auto_started: string | null;
    suggested_sops: string[];
  }>({ sop_auto_started: null, suggested_sops: [] });
  const [step, setStep] = useState(1); // Multi-step form: 1=basics, 2=injury, 3=treatment, 4=review
  const [form, setForm] = useState({
    incident_type: "accident",
    severity: "minor",
    incident_date: new Date().toISOString().split("T")[0],
    incident_time: "",
    location: "",
    location_detail: "",
    injured_person_name: "",
    injured_person_type: "",
    injured_person_role: "",
    injured_person_year_group: "",
    title: "",
    description: "",
    immediate_actions: "",
    // Injury detail
    injury_type: "",
    injury_body_part: "",
    injury_is_fracture_excluded: false,
    // Hospital
    first_aid_given: false,
    first_aid_details: "",
    first_aider_name: "",
    hospital_attendance: false,
    hospital_admission_type: "",
    hospital_name: "",
    hospital_details: "",
    // Work absence
    days_off_work: "",
    // Dangerous occurrence
    dangerous_occurrence_type: "",
    // Flags
    investigation_required: false,
    reported_by_name: "",
  });

  const update = (field: string, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        days_off_work: form.days_off_work
          ? parseInt(form.days_off_work as string)
          : null,
        hospital_admission_type: form.hospital_admission_type || null,
        injury_type: form.injury_type || null,
        dangerous_occurrence_type: form.dangerous_occurrence_type || null,
      };
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setRiddorResult(data.data?.riddor_detection || null);
        setSopInfo({
          sop_auto_started: data.data?.sop_auto_started || null,
          suggested_sops: data.data?.suggested_sops || [],
        });
        if (data.data?.riddor_detection?.is_reportable) {
          setStep(5); // Show RIDDOR result + SOP info
        } else {
          setStep(5); // Show SOP info even for non-RIDDOR
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  const labelCls =
    "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";
  const sectionCls =
    "bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4";
  const sectionTitle =
    "text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3";

  const showInjuryDetails =
    form.incident_type === "accident" || form.incident_type === "violence";
  const showDangerousOccurrence = form.incident_type === "dangerous_occurrence";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Accident / Incident Report Form
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step <= 4 ? `Step ${step} of 4` : "RIDDOR Assessment"}
              {step === 1 && " — Classification & Location"}
              {step === 2 && " — Injury & Person Details"}
              {step === 3 && " — Treatment & Response"}
              {step === 4 && " — Review & Submit"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 5: RIDDOR Detection Result */}
        {step === 5 && riddorResult && (
          <div className="p-5 space-y-5">
            <div
              className={`rounded-xl p-5 ${riddorResult.is_reportable ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800" : "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200"}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${riddorResult.is_reportable ? "bg-red-100 dark:bg-red-900/40" : "bg-emerald-100"}`}
                >
                  {riddorResult.is_reportable ? (
                    <FileWarning className="w-5 h-5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-base font-bold ${riddorResult.is_reportable ? "text-red-800 dark:text-red-400" : "text-emerald-800"}`}
                  >
                    {riddorResult.is_reportable
                      ? "RIDDOR REPORTABLE"
                      : "Not RIDDOR Reportable"}
                  </h3>
                  <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">
                    {riddorResult.reason}
                  </p>
                  {riddorResult.deadline && (
                    <p className="text-sm mt-2 font-semibold text-red-700 dark:text-red-400">
                      Deadline: {formatDate(riddorResult.deadline)} (
                      {riddorResult.urgency?.replace(/_/g, " ")})
                    </p>
                  )}
                  <p className="text-xs mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {riddorResult.guidance}
                  </p>
                  {riddorResult.confidence === "medium" && (
                    <p className="text-xs mt-2 text-amber-600 dark:text-amber-400 font-medium">
                      Note: This assessment needs confirmation. Please review
                      the details above.
                    </p>
                  )}
                </div>
              </div>
            </div>
            {riddorResult.is_reportable && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase mb-2">
                  What Happens Next
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1.5 list-disc pl-4">
                  <li>
                    Ed has pre-filled the HSE F2508 form with the information
                    you provided
                  </li>
                  <li>
                    Ask Ed: &ldquo;Show me the RIDDOR form for this
                    incident&rdquo; to review
                  </li>
                  <li>
                    You can submit to HSE online at hse.gov.uk/riddor or call
                    0345 300 9923
                  </li>
                  <li>
                    The incident is now tracked as &ldquo;Awaiting RIDDOR&rdquo;
                    until you confirm filing
                  </li>
                </ul>
              </div>
            )}
            {/* SOP Auto-Start Info */}
            {sopInfo.suggested_sops.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  Procedures Started
                </p>
                {sopInfo.sop_auto_started && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      SOP auto-started — go to{" "}
                      <a
                        href="/dashboard/sops"
                        className="underline font-medium hover:text-emerald-800"
                      >
                        Procedures
                      </a>{" "}
                      to follow the checklist
                    </span>
                  </div>
                )}
                {sopInfo.suggested_sops.length > 1 && (
                  <p className="text-xs text-slate-500">
                    Additional SOPs recommended:{" "}
                    {sopInfo.suggested_sops
                      .slice(1)
                      .map((s) => s.replace(/_/g, " "))
                      .join(", ")}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  onCreated();
                  onClose();
                }}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {step <= 4 && (
          <form
            onSubmit={
              step === 4
                ? handleSubmit
                : (e) => {
                    e.preventDefault();
                    setStep(step + 1);
                  }
            }
            className="p-5 space-y-5"
          >
            {/* STEP 1: Classification & Location */}
            {step === 1 && (
              <>
                <div className={sectionCls}>
                  <p className={sectionTitle}>
                    <AlertTriangle className="w-4 h-4" /> Incident
                    Classification
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Incident Type *</label>
                      <select
                        className={inputCls}
                        value={form.incident_type}
                        onChange={(e) =>
                          update("incident_type", e.target.value)
                        }
                      >
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Severity *</label>
                      <select
                        className={inputCls}
                        value={form.severity}
                        onChange={(e) => update("severity", e.target.value)}
                      >
                        <option value="minor">
                          Minor — First aid only, no time off
                        </option>
                        <option value="moderate">
                          Moderate — Medical attention, short absence
                        </option>
                        <option value="major">
                          Major — Hospital treatment, extended absence
                        </option>
                        <option value="critical">
                          Critical — Life-threatening or fatal
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className={sectionCls}>
                  <p className={sectionTitle}>
                    <Clock className="w-4 h-4" /> When & Where
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Date *</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={form.incident_date}
                        onChange={(e) =>
                          update("incident_date", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Time</label>
                      <input
                        type="time"
                        className={inputCls}
                        value={form.incident_time}
                        onChange={(e) =>
                          update("incident_time", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Location *</label>
                      <input
                        className={inputCls}
                        value={form.location}
                        onChange={(e) => update("location", e.target.value)}
                        placeholder="e.g. Playground, Kitchen, Corridor"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Specific Area</label>
                    <input
                      className={inputCls}
                      value={form.location_detail}
                      onChange={(e) =>
                        update("location_detail", e.target.value)
                      }
                      placeholder="e.g. Near climbing frame, by dishwasher"
                    />
                  </div>
                </div>
                <div className={sectionCls}>
                  <p className={sectionTitle}>
                    <Search className="w-4 h-4" /> What Happened
                  </p>
                  <div>
                    <label className={labelCls}>Summary Title *</label>
                    <input
                      className={inputCls}
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="Brief summary, e.g. 'Pupil fall from climbing frame'"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Full Description *</label>
                    <textarea
                      className={inputCls + " min-h-[100px]"}
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      placeholder="Describe exactly what happened, including events leading up to the incident, what the person was doing, and how the injury occurred..."
                      required
                    />
                  </div>
                </div>
                {showDangerousOccurrence && (
                  <div className={sectionCls}>
                    <p className={sectionTitle}>
                      <Zap className="w-4 h-4" /> Dangerous Occurrence Type
                    </p>
                    <select
                      className={inputCls}
                      value={form.dangerous_occurrence_type}
                      onChange={(e) =>
                        update("dangerous_occurrence_type", e.target.value)
                      }
                    >
                      <option value="">-- Select type --</option>
                      <option value="scaffolding_collapse">
                        Scaffolding/structure collapse
                      </option>
                      <option value="electrical_contact">
                        Electrical contact causing injury/fire
                      </option>
                      <option value="fire_serious">
                        Serious fire (evacuation or &gt;24hr closure)
                      </option>
                      <option value="structural_collapse">
                        Building structural failure (roof, floor, wall)
                      </option>
                      <option value="substance_release">
                        Substance release (chemical spill, leak)
                      </option>
                      <option value="gas_leak">Gas leak</option>
                      <option value="asbestos_disturbance">
                        Asbestos disturbance
                      </option>
                      <option value="pressure_equipment_failure">
                        Pressure equipment failure (boiler)
                      </option>
                      <option value="explosion">Explosion</option>
                      <option value="lifting_equipment_failure">
                        Lifting equipment failure
                      </option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: Injured Person & Injury Details */}
            {step === 2 && (
              <>
                <div className={sectionCls}>
                  <p className={sectionTitle}>
                    <Users className="w-4 h-4" /> Injured Person
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={form.injured_person_name}
                        onChange={(e) =>
                          update("injured_person_name", e.target.value)
                        }
                        placeholder="Full name (or 'Pupil A' for privacy)"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Person Type *</label>
                      <select
                        className={inputCls}
                        value={form.injured_person_type}
                        onChange={(e) =>
                          update("injured_person_type", e.target.value)
                        }
                      >
                        <option value="">-- Select --</option>
                        <option value="pupil">Pupil</option>
                        <option value="staff">Staff Member</option>
                        <option value="visitor">Visitor</option>
                        <option value="contractor">Contractor</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Role / Job Title</label>
                      <input
                        className={inputCls}
                        value={form.injured_person_role}
                        onChange={(e) =>
                          update("injured_person_role", e.target.value)
                        }
                        placeholder="e.g. Year 4 pupil, Site Manager"
                      />
                    </div>
                    {form.injured_person_type === "pupil" && (
                      <div>
                        <label className={labelCls}>Year Group</label>
                        <input
                          className={inputCls}
                          value={form.injured_person_year_group}
                          onChange={(e) =>
                            update("injured_person_year_group", e.target.value)
                          }
                          placeholder="e.g. Year 4"
                        />
                      </div>
                    )}
                  </div>
                </div>
                {showInjuryDetails && (
                  <div className={sectionCls}>
                    <p className={sectionTitle}>
                      <AlertTriangle className="w-4 h-4" /> Injury Details
                    </p>
                    <p className="text-xs text-slate-500 -mt-2 mb-2">
                      These details determine whether this is RIDDOR reportable
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Injury Type</label>
                        <select
                          className={inputCls}
                          value={form.injury_type}
                          onChange={(e) =>
                            update("injury_type", e.target.value)
                          }
                        >
                          <option value="">-- Select --</option>
                          <option value="bruise_sprain">
                            Bruise / Sprain / Strain
                          </option>
                          <option value="cut_graze">
                            Cut / Graze / Abrasion
                          </option>
                          <option value="fracture">
                            Fracture (broken bone)
                          </option>
                          <option value="amputation">Amputation</option>
                          <option value="loss_of_sight">Loss of Sight</option>
                          <option value="crush_injury">Crush Injury</option>
                          <option value="thermal_burns">Burns / Scalds</option>
                          <option value="loss_of_consciousness">
                            Loss of Consciousness
                          </option>
                          <option value="hypothermia">
                            Hypothermia / Heat Illness
                          </option>
                          <option value="head_injury">Head Injury</option>
                          <option value="bite_sting">Bite / Sting</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Body Part Affected</label>
                        <input
                          className={inputCls}
                          value={form.injury_body_part}
                          onChange={(e) =>
                            update("injury_body_part", e.target.value)
                          }
                          placeholder="e.g. left wrist, right leg, head"
                        />
                      </div>
                    </div>
                    {form.injury_type === "fracture" && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={form.injury_is_fracture_excluded}
                            onChange={(e) =>
                              update(
                                "injury_is_fracture_excluded",
                                e.target.checked,
                              )
                            }
                          />
                          <span className="text-amber-800 dark:text-amber-300">
                            This is a fracture of a finger, thumb, or toe only
                          </span>
                        </label>
                        <p className="text-[11px] text-amber-600 mt-1 ml-6">
                          Finger/thumb/toe fractures are NOT RIDDOR reportable.
                          All other fractures ARE.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {form.injured_person_type === "staff" && (
                  <div className={sectionCls}>
                    <p className={sectionTitle}>
                      <Clock className="w-4 h-4" /> Work Absence (Staff Only)
                    </p>
                    <div>
                      <label className={labelCls}>
                        Days Off Work (if known)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className={inputCls + " max-w-[200px]"}
                        value={form.days_off_work}
                        onChange={(e) =>
                          update("days_off_work", e.target.value)
                        }
                        placeholder="Number of consecutive days"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        If a worker is off for more than 7 consecutive days,
                        this becomes RIDDOR reportable. Update this later if the
                        absence extends.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 3: Treatment & Response */}
            {step === 3 && (
              <>
                <div className={sectionCls}>
                  <p className={sectionTitle}>
                    <Shield className="w-4 h-4" /> Immediate Actions
                  </p>
                  <div>
                    <label className={labelCls}>
                      What was done immediately?
                    </label>
                    <textarea
                      className={inputCls + " min-h-[60px]"}
                      value={form.immediate_actions}
                      onChange={(e) =>
                        update("immediate_actions", e.target.value)
                      }
                      placeholder="e.g. Area cordoned off, pupil moved to medical room, parent called..."
                    />
                  </div>
                </div>
                <div className={sectionCls}>
                  <p className={sectionTitle}>
                    <Activity className="w-4 h-4" /> First Aid
                  </p>
                  <label className="flex items-center gap-2 text-sm mb-3">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.first_aid_given}
                      onChange={(e) =>
                        update("first_aid_given", e.target.checked)
                      }
                    />
                    First aid was administered
                  </label>
                  {form.first_aid_given && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Treatment Given</label>
                        <input
                          className={inputCls}
                          value={form.first_aid_details}
                          onChange={(e) =>
                            update("first_aid_details", e.target.value)
                          }
                          placeholder="e.g. Cold compress, sling, cleaned wound"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>First Aider Name</label>
                        <input
                          className={inputCls}
                          value={form.first_aider_name}
                          onChange={(e) =>
                            update("first_aider_name", e.target.value)
                          }
                          placeholder="Name of person who gave first aid"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className={sectionCls}>
                  <p className={sectionTitle}>
                    <ExternalLink className="w-4 h-4" /> Hospital
                  </p>
                  <label className="flex items-center gap-2 text-sm mb-3">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.hospital_attendance}
                      onChange={(e) =>
                        update("hospital_attendance", e.target.checked)
                      }
                    />
                    Person attended hospital / A&E
                  </label>
                  {form.hospital_attendance && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelCls}>
                          Hospital Admission Status *
                        </label>
                        <select
                          className={inputCls}
                          value={form.hospital_admission_type}
                          onChange={(e) =>
                            update("hospital_admission_type", e.target.value)
                          }
                        >
                          <option value="">-- Select --</option>
                          <option value="admitted">
                            Admitted as in-patient (stayed in hospital)
                          </option>
                          <option value="treated_and_discharged">
                            Treated in A&E and sent home
                          </option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Important: For pupils/visitors, only hospital
                          ADMISSION (in-patient) triggers RIDDOR. A&E treatment
                          alone does not.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Hospital Name</label>
                          <input
                            className={inputCls}
                            value={form.hospital_name}
                            onChange={(e) =>
                              update("hospital_name", e.target.value)
                            }
                            placeholder="e.g. Royal Bolton Hospital"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Details</label>
                          <input
                            className={inputCls}
                            value={form.hospital_details}
                            onChange={(e) =>
                              update("hospital_details", e.target.value)
                            }
                            placeholder="e.g. X-ray confirmed fracture, cast applied"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className={sectionCls}>
                  <p className={sectionTitle}>
                    <Search className="w-4 h-4" /> Investigation
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.investigation_required}
                      onChange={(e) =>
                        update("investigation_required", e.target.checked)
                      }
                    />
                    Formal investigation required
                  </label>
                </div>
              </>
            )}

            {/* STEP 4: Review & Submit */}
            {step === 4 && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">
                    Review your report before submitting
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    The system will automatically assess whether this is RIDDOR
                    reportable based on the information you&apos;ve provided. If
                    it is, Ed will pre-fill the HSE F2508 form for you.
                  </p>
                </div>
                <div className={sectionCls}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <span className="text-slate-400 text-xs">Type:</span>{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {TYPE_LABELS[form.incident_type]}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Severity:</span>{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                        {form.severity}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Date:</span>{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formatDate(form.incident_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">Location:</span>{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {form.location}{" "}
                        {form.location_detail && `— ${form.location_detail}`}
                      </span>
                    </div>
                    {form.injured_person_name && (
                      <div>
                        <span className="text-slate-400 text-xs">Person:</span>{" "}
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {form.injured_person_name} ({form.injured_person_type}
                          )
                        </span>
                      </div>
                    )}
                    {form.injury_type && (
                      <div>
                        <span className="text-slate-400 text-xs">Injury:</span>{" "}
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {form.injury_type.replace(/_/g, " ")}{" "}
                          {form.injury_body_part &&
                            `— ${form.injury_body_part}`}
                        </span>
                      </div>
                    )}
                    {form.hospital_attendance && (
                      <div>
                        <span className="text-slate-400 text-xs">
                          Hospital:
                        </span>{" "}
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {form.hospital_admission_type === "admitted"
                            ? "Admitted"
                            : "A&E only"}{" "}
                          {form.hospital_name && `(${form.hospital_name})`}
                        </span>
                      </div>
                    )}
                    {form.first_aid_given && (
                      <div>
                        <span className="text-slate-400 text-xs">
                          First Aid:
                        </span>{" "}
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {form.first_aid_details || "Yes"} —{" "}
                          {form.first_aider_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold">{form.title}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                    {form.description}
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Your Name (Reporter) *</label>
                  <input
                    className={inputCls}
                    value={form.reported_by_name}
                    onChange={(e) => update("reported_by_name", e.target.value)}
                    placeholder="Who is completing this form?"
                    required
                  />
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                {step < 4 ? (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting
                      ? "Submitting & Checking RIDDOR..."
                      : "Submit & Check RIDDOR"}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function IncidentRow({
  incident,
  onClick,
}: {
  incident: Incident;
  onClick: () => void;
}) {
  const statusCfg = STATUS_CONFIG[incident.status] || STATUS_CONFIG.open;
  const severityCfg =
    SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.minor;
  const TypeIcon = TYPE_ICONS[incident.incident_type] || AlertTriangle;
  const StatusIcon = statusCfg.icon;
  const riddorDays = daysUntil(incident.riddor_deadline);
  const actions = incident.corrective_actions || [];
  const doneActions = actions.filter(
    (a: any) => a.status === "completed",
  ).length;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Date */}
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
        {formatDate(incident.incident_date)}
        {incident.incident_time && (
          <span className="text-xs text-slate-400 ml-1">
            {incident.incident_time.substring(0, 5)}
          </span>
        )}
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <TypeIcon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {TYPE_LABELS[incident.incident_type] || incident.incident_type}
          </span>
        </div>
      </td>

      {/* Title */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[280px]">
          {incident.title}
        </p>
        <p className="text-xs text-slate-400 truncate max-w-[280px]">
          {incident.location}
        </p>
      </td>

      {/* Severity */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${severityCfg.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${severityCfg.dot}`} />
          {severityCfg.label}
        </span>
      </td>

      {/* Person */}
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
        {incident.injured_person_name || "--"}
        {incident.injured_person_type && (
          <span className="text-[10px] text-slate-400 ml-1 capitalize">
            ({incident.injured_person_type})
          </span>
        )}
      </td>

      {/* RIDDOR */}
      <td className="px-4 py-3">
        {incident.is_riddor_reportable ? (
          <div className="flex items-center gap-1">
            <FileWarning className="w-3.5 h-3.5 text-red-500" />
            {incident.riddor_reference ? (
              <span className="text-[11px] font-medium text-emerald-600">
                {incident.riddor_reference}
              </span>
            ) : riddorDays !== null ? (
              <span
                className={`text-[11px] font-medium ${riddorDays <= 3 ? "text-red-600" : riddorDays <= 7 ? "text-amber-600" : "text-slate-500"}`}
              >
                {riddorDays <= 0 ? "OVERDUE" : `${riddorDays}d left`}
              </span>
            ) : (
              <span className="text-[11px] text-red-500">Pending</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">--</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusCfg.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {statusCfg.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {actions.length > 0 ? (
          <span className="text-xs text-slate-500">
            {doneActions}/{actions.length}
          </span>
        ) : (
          <span className="text-xs text-slate-400">--</span>
        )}
      </td>

      <td className="px-4 py-3">
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </td>
    </motion.tr>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function IncidentsPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const { organization } = useAuth();
  const orgId = organization?.id || "";

  const apiUrl = orgId
    ? filter === "all"
      ? `/api/incidents?organizationId=${orgId}`
      : filter === "closed"
        ? `/api/incidents?organizationId=${orgId}&status=closed`
        : `/api/incidents?organizationId=${orgId}&status=${filter}`
    : null;

  const { data, isLoading, mutate } = useSWR(apiUrl, fetcher);
  const incidents: Incident[] = data?.data?.incidents || [];
  const stats: Stats | null = data?.data?.stats || null;

  // Client-side search filter
  const filtered = incidents.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      (i.injured_person_name || "").toLowerCase().includes(q) ||
      i.reported_by_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between">
        <ModulePageHeader
          moduleId="estates"
          icon={AlertTriangle}
          label="Health & Safety"
          title="Incident & Near-Miss Reports"
          description="RIDDOR-compliant incident logging, investigation, and corrective actions"
        />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Report Incident
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard
            label="Total Incidents"
            value={stats.total}
            icon={Activity}
            color="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            subtext={`${stats.this_year} this year`}
          />
          <StatCard
            label="Open"
            value={stats.open}
            icon={AlertCircle}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            subtext={`${stats.last_30_days} last 30 days`}
          />
          <StatCard
            label="RIDDOR"
            value={stats.riddor_reportable}
            icon={FileWarning}
            color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            subtext={
              stats.awaiting_riddor > 0
                ? `${stats.awaiting_riddor} awaiting report`
                : "All reported"
            }
          />
          <StatCard
            label="Critical/Major"
            value={
              (stats.by_severity?.critical || 0) +
              (stats.by_severity?.major || 0)
            }
            icon={Shield}
            color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
          />
          <StatCard
            label="Near Misses"
            value={stats.by_type?.near_miss || 0}
            icon={Eye}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Closed"
            value={stats.closed}
            icon={CheckCircle2}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === tab.value
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 flex-1 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-teal-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              No incidents found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? "Try a different search term."
                : "Use the button above to report an incident or near miss."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Incident
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Person
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    RIDDOR
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((incident) => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    onClick={() => setSelectedIncident(incident)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Incident Detail Drawer */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/40"
            onClick={(e) =>
              e.target === e.currentTarget && setSelectedIncident(null)
            }
          >
            <motion.div
              initial={{ x: 480 }}
              animate={{ x: 0 }}
              exit={{ x: 480 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl"
            >
              <IncidentDetail
                incident={selectedIncident}
                onClose={() => setSelectedIncident(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Incident Form */}
      <AnimatePresence>
        {showForm && (
          <NewIncidentForm
            onClose={() => setShowForm(false)}
            onCreated={() => mutate()}
            orgId={orgId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Incident Detail Panel
// ---------------------------------------------------------------------------

function IncidentDetail({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const severityCfg =
    SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.minor;
  const statusCfg = STATUS_CONFIG[incident.status] || STATUS_CONFIG.open;
  const TypeIcon = TYPE_ICONS[incident.incident_type] || AlertTriangle;
  const actions = incident.corrective_actions || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TypeIcon className="w-5 h-5 text-slate-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">
              {TYPE_LABELS[incident.incident_type]}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {incident.title}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {formatDate(incident.incident_date)}{" "}
            {incident.incident_time
              ? `at ${incident.incident_time.substring(0, 5)}`
              : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${severityCfg.color}`}
        >
          <span className={`w-2 h-2 rounded-full ${severityCfg.dot}`} />
          {severityCfg.label}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusCfg.color}`}
        >
          {statusCfg.label}
        </span>
        {incident.is_riddor_reportable && (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <FileWarning className="w-3 h-3" />
            RIDDOR
          </span>
        )}
        {incident.hospital_attendance && (
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Hospital
          </span>
        )}
      </div>

      {/* Location */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase">
          Location
        </p>
        <p className="text-sm text-slate-800 dark:text-slate-200">
          {incident.location}
        </p>
        {incident.location_detail && (
          <p className="text-xs text-slate-500">{incident.location_detail}</p>
        )}
      </div>

      {/* Injured Person */}
      {incident.injured_person_name && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Injured Person
          </p>
          <p className="text-sm text-slate-800 dark:text-slate-200">
            {incident.injured_person_name}
            {incident.injured_person_type && (
              <span className="text-slate-400 ml-1 capitalize">
                ({incident.injured_person_type})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
          Description
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {incident.description}
        </p>
      </div>

      {/* First Aid */}
      {incident.first_aid_given && (
        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase">
            First Aid
          </p>
          {incident.first_aid_details && (
            <p className="text-sm text-green-800 dark:text-green-300">
              {incident.first_aid_details}
            </p>
          )}
          {incident.first_aider_name && (
            <p className="text-xs text-green-600">
              Administered by: {incident.first_aider_name}
            </p>
          )}
        </div>
      )}

      {/* RIDDOR */}
      {incident.is_riddor_reportable && (
        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">
            RIDDOR Reporting
          </p>
          {incident.riddor_category && (
            <p className="text-sm text-red-800 dark:text-red-300">
              Category: {incident.riddor_category.replace(/_/g, " ")}
            </p>
          )}
          {incident.riddor_deadline && (
            <p className="text-sm">
              <span className="text-red-600 font-medium">
                Deadline: {formatDate(incident.riddor_deadline)}
              </span>
              {(() => {
                const days = daysUntil(incident.riddor_deadline);
                if (days === null) return null;
                if (days <= 0)
                  return (
                    <span className="ml-2 text-red-700 font-bold">OVERDUE</span>
                  );
                return (
                  <span className="ml-2 text-red-500">
                    ({days} days remaining)
                  </span>
                );
              })()}
            </p>
          )}
          {incident.riddor_reference && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              HSE Reference: {incident.riddor_reference}
            </p>
          )}
        </div>
      )}

      {/* Investigation */}
      {incident.investigation_required && (
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">
            Investigation
          </p>
          {incident.investigation_lead && (
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Lead: {incident.investigation_lead}
            </p>
          )}
          {incident.root_cause && (
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Root Cause: {incident.root_cause}
            </p>
          )}
        </div>
      )}

      {/* Corrective Actions */}
      {actions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">
            Corrective Actions (
            {actions.filter((a: any) => a.status === "completed").length}/
            {actions.length} complete)
          </p>
          <div className="space-y-2">
            {actions.map((action: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  action.status === "completed"
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="mt-0.5">
                  {action.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${action.status === "completed" ? "text-emerald-700 dark:text-emerald-400 line-through" : "text-slate-800 dark:text-slate-200"}`}
                  >
                    {action.title}
                  </p>
                  {action.description && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {action.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    {action.assigned_to && (
                      <span>Assigned: {action.assigned_to}</span>
                    )}
                    {action.due_date && (
                      <span>Due: {formatDate(action.due_date)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closure Notes */}
      {incident.closure_notes && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
            Closure Notes
          </p>
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            {incident.closure_notes}
          </p>
          {incident.closed_by_name && (
            <p className="text-xs text-emerald-600">
              Closed by: {incident.closed_by_name} on{" "}
              {formatDate(incident.closed_at)}
            </p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-400">
        <p>Reported by: {incident.reported_by_name}</p>
        {incident.reviewed_by_name && (
          <p>Reviewed by: {incident.reviewed_by_name}</p>
        )}
        <p>Created: {formatDate(incident.created_at)}</p>
        {incident.linked_risk_id && (
          <p className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Linked to Risk Register
          </p>
        )}
      </div>
    </div>
  );
}
