"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flame,
  Lock,
  CloudRain,
  Siren,
  ArrowLeft,
  FileText,
  User,
  ChevronDown,
  Timer,
  BarChart3,
} from "lucide-react";

interface DrillSchedule {
  id: string;
  drill_type: string;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes: number;
  lead_person?: string;
  status: string;
  is_overdue?: boolean;
  completed_at?: string;
}

interface DrillReport {
  id: string;
  drill_type: string;
  drill_date: string;
  start_time: string;
  end_time?: string;
  evacuation_time_seconds?: number;
  total_acknowledged: number;
  total_headcount?: number;
  zones_covered: string[];
  issues_found?: string;
  actions_required?: string;
  weather_conditions?: string;
  was_announced: boolean;
  assessor_name?: string;
  assessor_notes?: string;
  compliance_rating?: string;
}

const DRILL_TYPES = [
  { value: "fire", label: "Fire Evacuation", icon: Flame, color: "text-red-600 bg-red-50" },
  { value: "lockdown", label: "Lockdown", icon: Lock, color: "text-gray-800 bg-gray-100" },
  { value: "shelter_in_place", label: "Shelter in Place", icon: CloudRain, color: "text-blue-600 bg-blue-50" },
  { value: "evacuation", label: "Off-Site Evacuation", icon: Siren, color: "text-orange-600 bg-orange-50" },
  { value: "bomb_threat", label: "Bomb Threat", icon: AlertTriangle, color: "text-red-700 bg-red-50" },
  { value: "invacuation", label: "Invacuation", icon: Shield, color: "text-violet-600 bg-violet-50" },
];

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  overdue: "bg-red-100 text-red-700",
};

const RATING_COLORS: Record<string, string> = {
  excellent: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  satisfactory: "bg-amber-100 text-amber-700",
  inadequate: "bg-red-100 text-red-700",
};

type Tab = "schedule" | "reports" | "compliance";

export default function DrillSchedulerPage() {
  const [tab, setTab] = useState<Tab>("schedule");
  const [drills, setDrills] = useState<DrillSchedule[]>([]);
  const [reports, setReports] = useState<DrillReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReport, setShowReport] = useState<string | null>(null);

  // New drill form
  const [newDrill, setNewDrill] = useState({
    drill_type: "fire",
    title: "",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: 15,
    lead_person: "",
    description: "",
  });

  // Report form
  const [reportForm, setReportForm] = useState({
    evacuation_time_seconds: "",
    total_headcount: "",
    issues_found: "",
    actions_required: "",
    weather_conditions: "dry",
    was_announced: false,
    assessor_name: "",
    assessor_notes: "",
    compliance_rating: "good",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/emergency/drill-schedule?view=all")
        .then((r) => r.json())
        .catch(() => ({ drills: [] })),
      fetch("/api/emergency/drill-schedule?view=reports")
        .then((r) => r.json())
        .catch(() => ({ reports: [] })),
    ]).then(([drillData, reportData]) => {
      setDrills(drillData.drills || []);
      setReports(reportData.reports || []);
      setLoading(false);
    });
  }, []);

  const handleScheduleDrill = useCallback(async () => {
    if (!newDrill.drill_type || !newDrill.scheduled_date) return;
    const res = await fetch("/api/emergency/drill-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newDrill,
        title: newDrill.title || `${newDrill.drill_type.replace(/_/g, " ")} drill`,
        duration_minutes: Number(newDrill.duration_minutes) || 15,
      }),
    });
    const data = await res.json();
    setDrills((prev) => [...prev, data]);
    setShowSchedule(false);
    setNewDrill({ drill_type: "fire", title: "", scheduled_date: "", scheduled_time: "", duration_minutes: 15, lead_person: "", description: "" });
  }, [newDrill]);

  const handleCompleteDrill = useCallback(async (drillId: string) => {
    const drill = drills.find((d) => d.id === drillId);
    if (!drill) return;

    await fetch("/api/emergency/drill-schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drill_id: drillId,
        report: {
          drill_type: drill.drill_type,
          evacuation_time_seconds: Number(reportForm.evacuation_time_seconds) || undefined,
          total_headcount: Number(reportForm.total_headcount) || undefined,
          issues_found: reportForm.issues_found || undefined,
          actions_required: reportForm.actions_required || undefined,
          weather_conditions: reportForm.weather_conditions,
          was_announced: reportForm.was_announced,
          assessor_name: reportForm.assessor_name || undefined,
          assessor_notes: reportForm.assessor_notes || undefined,
          compliance_rating: reportForm.compliance_rating,
        },
      }),
    });

    setDrills((prev) => prev.map((d) => d.id === drillId ? { ...d, status: "completed" } : d));
    setShowReport(null);
    setReportForm({ evacuation_time_seconds: "", total_headcount: "", issues_found: "", actions_required: "", weather_conditions: "dry", was_announced: false, assessor_name: "", assessor_notes: "", compliance_rating: "good" });
  }, [drills, reportForm]);

  const handleCancelDrill = async (drillId: string) => {
    await fetch("/api/emergency/drill-schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drill_id: drillId, action: "cancel" }),
    });
    setDrills((prev) => prev.map((d) => d.id === drillId ? { ...d, status: "cancelled" } : d));
  };

  const scheduledDrills = drills.filter((d) => d.status === "scheduled");
  const overdueDrills = scheduledDrills.filter((d) => d.is_overdue);
  const completedDrills = drills.filter((d) => d.status === "completed");

  // Compliance stats
  const thisYear = new Date().getFullYear();
  const thisYearReports = reports.filter((r) => new Date(r.drill_date).getFullYear() === thisYear);
  const fireThisYear = thisYearReports.filter((r) => r.drill_type === "fire" || r.drill_type === "fire_evacuation").length;
  const lockdownThisYear = thisYearReports.filter((r) => r.drill_type === "lockdown").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/emergency-broadcast"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Emergency Broadcast
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            Emergency Drill Scheduler
          </h1>
          <p className="text-gray-500 mt-1">Schedule, conduct, and report on emergency drills</p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
        >
          <Plus className="w-5 h-5" />
          Schedule Drill
        </button>
      </div>

      {/* Compliance banner */}
      {overdueDrills.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-800">
              {overdueDrills.length} overdue drill{overdueDrills.length !== 1 ? "s" : ""}
            </h3>
            <p className="text-sm text-red-600">
              These drills are past their scheduled date and need to be completed or rescheduled.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {[
          { id: "schedule" as Tab, label: "Schedule", icon: Calendar },
          { id: "reports" as Tab, label: "Reports", icon: FileText },
          { id: "compliance" as Tab, label: "Compliance", icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
              tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading drills...</div>
      ) : (
        <>
          {/* Schedule Tab */}
          {tab === "schedule" && (
            <div className="space-y-4">
              {drills.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">No drills scheduled</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Schools must conduct fire drills termly and lockdown drills annually
                  </p>
                </div>
              ) : (
                drills
                  .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                  .map((drill) => {
                    const typeInfo = DRILL_TYPES.find((t) => t.value === drill.drill_type) || DRILL_TYPES[0];
                    const Icon = typeInfo.icon;
                    const effectiveStatus = drill.is_overdue ? "overdue" : drill.status;

                    return (
                      <div key={drill.id} className={`bg-white border rounded-2xl p-5 ${drill.is_overdue ? "border-red-300" : "border-gray-200"}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${typeInfo.color}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{drill.title}</h3>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(drill.scheduled_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                                </span>
                                {drill.scheduled_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {drill.scheduled_time}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3.5 h-3.5" />
                                  {drill.duration_minutes} min
                                </span>
                                {drill.lead_person && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {drill.lead_person}
                                  </span>
                                )}
                              </div>
                              {drill.description && (
                                <p className="text-sm text-gray-500 mt-1">{drill.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[effectiveStatus] || "bg-gray-100 text-gray-600"}`}>
                              {effectiveStatus === "overdue" ? "OVERDUE" : drill.status.toUpperCase()}
                            </span>
                            {drill.status === "scheduled" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setShowReport(drill.id)}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleCancelDrill(drill.id)}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* Reports Tab */}
          {tab === "reports" && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">No drill reports yet</p>
                  <p className="text-sm text-gray-400 mt-1">Complete a scheduled drill to generate a report</p>
                </div>
              ) : (
                reports.map((report) => {
                  const typeInfo = DRILL_TYPES.find((t) => t.value === report.drill_type) || DRILL_TYPES[0];
                  const Icon = typeInfo.icon;
                  return (
                    <div key={report.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-xl ${typeInfo.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 capitalize">
                              {report.drill_type.replace(/_/g, " ")} Drill Report
                            </h3>
                            {report.compliance_rating && (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${RATING_COLORS[report.compliance_rating] || "bg-gray-100"}`}>
                                {report.compliance_rating.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{new Date(report.drill_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                            {report.evacuation_time_seconds && (
                              <span className="font-semibold text-gray-700">
                                {Math.floor(report.evacuation_time_seconds / 60)}m {report.evacuation_time_seconds % 60}s evacuation
                              </span>
                            )}
                            {report.total_headcount && (
                              <span>{report.total_acknowledged}/{report.total_headcount} accounted</span>
                            )}
                            <span>{report.was_announced ? "Announced" : "Unannounced"}</span>
                          </div>
                          {report.issues_found && (
                            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-sm text-amber-800">
                              <strong>Issues:</strong> {report.issues_found}
                            </div>
                          )}
                          {report.actions_required && (
                            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-sm text-blue-800">
                              <strong>Actions:</strong> {report.actions_required}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Compliance Tab */}
          {tab === "compliance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`border rounded-2xl p-5 ${fireThisYear >= 3 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <Flame className={`w-8 h-8 mb-2 ${fireThisYear >= 3 ? "text-green-600" : "text-red-600"}`} />
                  <div className="text-3xl font-black">{fireThisYear}/3</div>
                  <div className="text-sm font-medium text-gray-600">Fire Drills This Year</div>
                  <div className={`text-xs mt-1 font-semibold ${fireThisYear >= 3 ? "text-green-600" : "text-red-600"}`}>
                    {fireThisYear >= 3 ? "Compliant — termly requirement met" : `${3 - fireThisYear} more needed this academic year`}
                  </div>
                </div>

                <div className={`border rounded-2xl p-5 ${lockdownThisYear >= 1 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                  <Lock className={`w-8 h-8 mb-2 ${lockdownThisYear >= 1 ? "text-green-600" : "text-amber-600"}`} />
                  <div className="text-3xl font-black">{lockdownThisYear}/1</div>
                  <div className="text-sm font-medium text-gray-600">Lockdown Drills This Year</div>
                  <div className={`text-xs mt-1 font-semibold ${lockdownThisYear >= 1 ? "text-green-600" : "text-amber-600"}`}>
                    {lockdownThisYear >= 1 ? "Compliant — annual requirement met" : "Annual lockdown drill recommended"}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <BarChart3 className="w-8 h-8 mb-2 text-indigo-600" />
                  <div className="text-3xl font-black">{reports.length}</div>
                  <div className="text-sm font-medium text-gray-600">Total Drill Reports</div>
                  <div className="text-xs mt-1 text-gray-400">Across all drill types</div>
                </div>
              </div>

              {/* Statutory Requirements */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">Statutory Requirements</h3>
                <div className="space-y-3">
                  {[
                    { requirement: "Fire evacuation drills must be conducted at least once per term (3x per year)", met: fireThisYear >= 3, source: "Regulatory Reform (Fire Safety) Order 2005" },
                    { requirement: "Fire drills should be recorded with date, time, and observations", met: reports.some((r) => r.drill_type === "fire" || r.drill_type === "fire_evacuation"), source: "HM Government Fire Safety Risk Assessment" },
                    { requirement: "Lockdown procedures should be practised at least annually", met: lockdownThisYear >= 1, source: "DfE Keeping Children Safe in Education" },
                    { requirement: "All staff must know the evacuation procedure for their area", met: true, source: "Health and Safety at Work Act 1974" },
                    { requirement: "Drill records must be available for inspection by fire authority", met: reports.length > 0, source: "Regulatory Reform (Fire Safety) Order 2005, Article 9" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      {item.met ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.requirement}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Schedule Drill Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Schedule Drill</h2>
              <button onClick={() => setShowSchedule(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Drill Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {DRILL_TYPES.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setNewDrill((p) => ({ ...p, drill_type: value }))}
                      className={`p-3 rounded-xl border text-center transition ${
                        newDrill.drill_type === value
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${newDrill.drill_type === value ? "text-red-600" : "text-gray-400"}`} />
                      <div className="text-xs font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={newDrill.title}
                  onChange={(e) => setNewDrill((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder={`e.g. Spring term ${newDrill.drill_type.replace(/_/g, " ")} drill`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDrill.scheduled_date}
                    onChange={(e) => setNewDrill((p) => ({ ...p, scheduled_date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Time (optional)</label>
                  <input
                    type="time"
                    value={newDrill.scheduled_time}
                    onChange={(e) => setNewDrill((p) => ({ ...p, scheduled_time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={newDrill.duration_minutes}
                    onChange={(e) => setNewDrill((p) => ({ ...p, duration_minutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                    min="5"
                    max="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lead Person</label>
                  <input
                    type="text"
                    value={newDrill.lead_person}
                    onChange={(e) => setNewDrill((p) => ({ ...p, lead_person: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                    placeholder="e.g. Mrs Carter"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowSchedule(false)} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
              <button
                onClick={handleScheduleDrill}
                disabled={!newDrill.scheduled_date}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Schedule Drill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Drill Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Complete Drill Report</h2>
              <button onClick={() => setShowReport(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Evacuation Time (seconds)</label>
                  <input
                    type="number"
                    value={reportForm.evacuation_time_seconds}
                    onChange={(e) => setReportForm((p) => ({ ...p, evacuation_time_seconds: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                    placeholder="e.g. 180"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Total Headcount</label>
                  <input
                    type="number"
                    value={reportForm.total_headcount}
                    onChange={(e) => setReportForm((p) => ({ ...p, total_headcount: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                    placeholder="e.g. 287"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Weather</label>
                  <select
                    value={reportForm.weather_conditions}
                    onChange={(e) => setReportForm((p) => ({ ...p, weather_conditions: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  >
                    <option value="dry">Dry</option>
                    <option value="wet">Wet/Rain</option>
                    <option value="cold">Cold</option>
                    <option value="hot">Hot</option>
                    <option value="windy">Windy</option>
                    <option value="snow">Snow/Ice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                  <select
                    value={reportForm.compliance_rating}
                    onChange={(e) => setReportForm((p) => ({ ...p, compliance_rating: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="satisfactory">Satisfactory</option>
                    <option value="inadequate">Inadequate</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={reportForm.was_announced}
                  onChange={(e) => setReportForm((p) => ({ ...p, was_announced: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Drill was pre-announced to staff
              </label>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Issues Found</label>
                <textarea
                  value={reportForm.issues_found}
                  onChange={(e) => setReportForm((p) => ({ ...p, issues_found: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="Any issues observed during the drill..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Actions Required</label>
                <textarea
                  value={reportForm.actions_required}
                  onChange={(e) => setReportForm((p) => ({ ...p, actions_required: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="Follow-up actions needed..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assessor Name</label>
                <input
                  type="text"
                  value={reportForm.assessor_name}
                  onChange={(e) => setReportForm((p) => ({ ...p, assessor_name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  placeholder="e.g. Mrs Carter (Head)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={reportForm.assessor_notes}
                  onChange={(e) => setReportForm((p) => ({ ...p, assessor_notes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  placeholder="Additional observations..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowReport(null)} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
              <button
                onClick={() => handleCompleteDrill(showReport)}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
