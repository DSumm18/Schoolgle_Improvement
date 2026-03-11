"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Thermometer,
  Plus,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
  Activity,
  FileText,
  BarChart3,
  PoundSterling,
  Target,
  Brain,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  REASON_CATEGORIES,
  FORMAL_STAGES,
  getBradfordLevel,
  getReasonLabel,
  getReasonColor,
  type AbsenceReasonCategory,
  type StaffSicknessSummary,
} from "@/lib/hr/sickness-types";

interface StaffOption {
  id: string;
  full_name: string;
  role: string | null;
}

type DashboardTab = "overview" | "analytics";

export default function SicknessAbsenceDashboard() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  // Data state
  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [bradfordMap, setBradfordMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  // Analytics data
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    staffMemberId: "",
    staffName: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    reasonCategory: "cold_flu" as AbsenceReasonCategory,
    reasonDetail: "",
    notes: "",
    reportedBy: "",
    selfCertified: true,
  });

  // Expanded staff rows
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [statsRes, recordsRes] = await Promise.all([
        fetch(`/api/hr/sickness/stats?organizationId=${organizationId}`),
        fetch(`/api/hr/sickness?organizationId=${organizationId}&limit=200`),
      ]);
      const statsData = await statsRes.json();
      const recordsData = await recordsRes.json();
      setStats(statsData);
      setRecords(recordsData.records || []);
      setBradfordMap(recordsData.bradford || {});
    } catch (err) {
      console.error("Failed to load sickness data:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const loadAnalytics = useCallback(async () => {
    if (!organizationId) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch(
        `/api/hr/sickness/analytics?organizationId=${organizationId}`,
      );
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "analytics" && !analytics) {
      loadAnalytics();
    }
  }, [activeTab, analytics, loadAnalytics]);

  // Load staff list for the modal
  useEffect(() => {
    if (!organizationId || !showModal) return;
    fetch(`/api/staff?organizationId=${organizationId}&status=active&limit=500`)
      .then((r) => r.json())
      .then((data) => {
        setStaffOptions(data.staff || data.data || []);
      })
      .catch(console.error);
  }, [organizationId, showModal]);

  // Build staff summary from records
  const staffSummaries: StaffSicknessSummary[] = (() => {
    const map: Record<string, StaffSicknessSummary> = {};
    for (const r of records) {
      if (!map[r.staff_id]) {
        const bf = bradfordMap[r.staff_id];
        map[r.staff_id] = {
          staff_id: r.staff_id,
          staff_name: r.staff_name || "Unknown",
          staff_role: r.staff_role || "",
          staff_department: r.staff_department || null,
          total_absences: 0,
          total_days: 0,
          bradford_factor: bf ? Number(bf.bradford_score) : 0,
          is_currently_absent: false,
          last_absence_date: null,
          triggers_breached: [],
          trigger_level: bf?.trigger_level || "none",
        };
      }
      const s = map[r.staff_id];
      s.total_absences++;
      if (r.working_days_lost) s.total_days += Number(r.working_days_lost);
      if (!r.end_date) s.is_currently_absent = true;
      if (!s.last_absence_date || r.start_date > s.last_absence_date) {
        s.last_absence_date = r.start_date;
      }
    }
    return Object.values(map).sort(
      (a, b) => b.bradford_factor - a.bradford_factor,
    );
  })();

  const filteredStaff = staffSummaries.filter(
    (s) =>
      !search ||
      s.staff_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.staff_role || "").toLowerCase().includes(search.toLowerCase()),
  );

  const toggleExpand = (staffId: string) => {
    setExpandedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.staffMemberId || !form.startDate || !form.reasonCategory) return;
    setSaving(true);
    try {
      const res = await fetch("/api/hr/sickness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          staffMemberId: form.staffMemberId,
          startDate: form.startDate,
          endDate: form.endDate || null,
          reasonCategory: form.reasonCategory,
          reasonDetail: form.reasonDetail || null,
          notes: form.notes || null,
          reportedBy: form.reportedBy || null,
          selfCertified: form.selfCertified,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({
          staffMemberId: "",
          staffName: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          reasonCategory: "cold_flu",
          reasonDetail: "",
          notes: "",
          reportedBy: "",
          selfCertified: true,
        });
        loadData();
        setAnalytics(null); // Force analytics refresh
      }
    } catch (err) {
      console.error("Failed to save absence:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredStaffOptions = staffOptions.filter(
    (s) =>
      !staffSearch ||
      s.full_name.toLowerCase().includes(staffSearch.toLowerCase()),
  );

  const maxTrend = Math.max(
    ...(stats?.monthly_trend?.map((m: any) => m.count) || [1]),
    1,
  );

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
            <Sparkles size={14} className="animate-pulse" />
            HR & People
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Sickness Absence Tracker
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor staff absence, Bradford Factors, and trigger alerts
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2"
        >
          <Plus size={16} />
          Record Absence
        </Button>
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {[
          { id: "overview" as const, label: "Overview", icon: Users },
          { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : activeTab === "overview" ? (
        <OverviewTab
          stats={stats}
          filteredStaff={filteredStaff}
          records={records}
          search={search}
          setSearch={setSearch}
          expandedStaff={expandedStaff}
          toggleExpand={toggleExpand}
          setShowModal={setShowModal}
          organizationId={organizationId}
          maxTrend={maxTrend}
        />
      ) : (
        <AnalyticsTab
          analytics={analytics}
          loading={analyticsLoading}
          stats={stats}
        />
      )}

      {/* Record Absence Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Record Absence
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Staff selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Staff Member *
                  </label>
                  {form.staffMemberId ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/5">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white flex-1">
                        {form.staffName}
                      </span>
                      <button
                        onClick={() =>
                          setForm({
                            ...form,
                            staffMemberId: "",
                            staffName: "",
                          })
                        }
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Search staff..."
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      {staffSearch && filteredStaffOptions.length > 0 && (
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                          {filteredStaffOptions.slice(0, 10).map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setForm({
                                  ...form,
                                  staffMemberId: s.id,
                                  staffName: s.full_name,
                                });
                                setStaffSearch("");
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 last:border-0"
                            >
                              <span className="font-semibold">
                                {s.full_name}
                              </span>
                              {s.role && (
                                <span className="text-slate-400 ml-2">
                                  {s.role}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      End Date
                      <span className="normal-case tracking-normal text-slate-500 ml-1">
                        (blank = ongoing)
                      </span>
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Reason Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Reason Category *
                  </label>
                  <select
                    value={form.reasonCategory}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        reasonCategory: e.target.value as AbsenceReasonCategory,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                  >
                    {REASON_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason detail */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Details
                  </label>
                  <input
                    type="text"
                    value={form.reasonDetail}
                    onChange={(e) =>
                      setForm({ ...form, reasonDetail: e.target.value })
                    }
                    placeholder="Additional details..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={2}
                    placeholder="Internal notes..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                  />
                </div>

                {/* Reported by */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Reported By
                  </label>
                  <input
                    type="text"
                    value={form.reportedBy}
                    onChange={(e) =>
                      setForm({ ...form, reportedBy: e.target.value })
                    }
                    placeholder="Name of person reporting..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                {/* Self certified checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.selfCertified}
                    onChange={(e) =>
                      setForm({ ...form, selfCertified: e.target.checked })
                    }
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Self-certified (no fit note required for 7 days or less)
                  </span>
                </label>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving || !form.staffMemberId || !form.startDate}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2"
                >
                  {saving ? (
                    <>
                      <Clock size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Record Absence
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======== OVERVIEW TAB ======== */
function OverviewTab({
  stats,
  filteredStaff,
  records,
  search,
  setSearch,
  expandedStaff,
  toggleExpand,
  setShowModal,
  organizationId,
  maxTrend,
}: {
  stats: any;
  filteredStaff: StaffSicknessSummary[];
  records: any[];
  search: string;
  setSearch: (v: string) => void;
  expandedStaff: Set<string>;
  toggleExpand: (id: string) => void;
  setShowModal: (v: boolean) => void;
  organizationId: string;
  maxTrend: number;
}) {
  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Currently Absent",
            value: stats?.currently_absent || 0,
            icon: Thermometer,
            accent: "text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
          },
          {
            label: "Absences This Year",
            value: stats?.total_absences_ytd || 0,
            icon: Calendar,
            accent: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Avg Days Lost",
            value: stats?.average_days_lost_per_staff || 0,
            icon: TrendingUp,
            accent: "text-cyan-400",
            bg: "bg-cyan-500/10 border-cyan-500/20",
          },
          {
            label: "Above Trigger",
            value: stats?.staff_above_trigger?.length || 0,
            icon: AlertTriangle,
            accent: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-5 border ${stat.bg}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={stat.accent} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Monthly Trend Chart */}
      {stats?.monthly_trend && stats.monthly_trend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-400" />
            Monthly Absence Trend
          </h2>
          <div className="flex items-end gap-2 h-32">
            {stats.monthly_trend.map((m: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-slate-400">
                  {m.count > 0 ? m.count : ""}
                </span>
                <div
                  className="w-full rounded-t-md bg-blue-500/80 transition-all duration-500"
                  style={{
                    height: `${Math.max((m.count / maxTrend) * 100, 4)}%`,
                    minHeight: m.count > 0 ? "8px" : "2px",
                    opacity: m.count > 0 ? 1 : 0.2,
                  }}
                />
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {m.month}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Staff Absence Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search staff by name or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Staff Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                Staff Absence Overview
              </h2>
            </div>

            {filteredStaff.length === 0 ? (
              <div className="p-12 text-center">
                <Thermometer
                  size={48}
                  className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                  No absence records
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Record your first staff absence to start tracking
                </p>
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2"
                >
                  <Plus size={16} />
                  Record Absence
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                  <div className="col-span-4">Staff</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-1 text-center">Spells</div>
                  <div className="col-span-2 text-center">Days Lost</div>
                  <div className="col-span-2 text-center">Bradford</div>
                  <div className="col-span-1" />
                </div>

                {filteredStaff.map((staff) => {
                  const bf = getBradfordLevel(staff.bradford_factor);
                  const isExpanded = expandedStaff.has(staff.staff_id);
                  const staffRecords = records.filter(
                    (r) => r.staff_id === staff.staff_id,
                  );

                  return (
                    <div key={staff.staff_id}>
                      <div
                        className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                        onClick={() => toggleExpand(staff.staff_id)}
                      >
                        <div className="col-span-4">
                          <Link
                            href={`/dashboard/hr/sickness/${staff.staff_id}?organizationId=${organizationId}`}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-500 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {staff.staff_name}
                          </Link>
                          <p className="text-xs text-slate-400">
                            {staff.staff_role}
                          </p>
                        </div>
                        <div className="col-span-2 text-center">
                          {staff.is_currently_absent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              Absent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                              Present
                            </span>
                          )}
                        </div>
                        <div className="col-span-1 text-center text-sm font-semibold text-slate-900 dark:text-white">
                          {staff.total_absences}
                        </div>
                        <div className="col-span-2 text-center text-sm font-semibold text-slate-900 dark:text-white">
                          {staff.total_days}
                        </div>
                        <div className="col-span-2 text-center">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-black"
                            style={{
                              color: bf.color,
                              backgroundColor: `${bf.color}15`,
                              border: `1px solid ${bf.color}30`,
                            }}
                          >
                            {Math.round(staff.bradford_factor)}
                          </span>
                        </div>
                        <div className="col-span-1 text-right">
                          {isExpanded ? (
                            <ChevronDown
                              size={16}
                              className="text-slate-400 ml-auto"
                            />
                          ) : (
                            <ChevronRight
                              size={16}
                              className="text-slate-400 ml-auto"
                            />
                          )}
                        </div>
                      </div>

                      {/* Expanded history */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-slate-50 dark:bg-slate-900/50"
                          >
                            <div className="px-5 py-3 space-y-2">
                              {staffRecords.length === 0 ? (
                                <p className="text-sm text-slate-400 py-2">
                                  No absence records
                                </p>
                              ) : (
                                staffRecords.map((r: any) => (
                                  <div
                                    key={r.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: getReasonColor(
                                          r.reason_category,
                                        ),
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                          {getReasonLabel(r.reason_category)}
                                        </span>
                                        {!r.end_date && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold">
                                            ONGOING
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-400">
                                        {new Date(
                                          r.start_date,
                                        ).toLocaleDateString("en-GB", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                        {r.end_date
                                          ? ` — ${new Date(r.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                                          : " — present"}
                                      </p>
                                    </div>
                                    {r.working_days_lost != null && (
                                      <span className="text-xs font-semibold text-slate-400">
                                        {r.working_days_lost}d
                                      </span>
                                    )}
                                  </div>
                                ))
                              )}
                              <Link
                                href={`/dashboard/hr/sickness/${staff.staff_id}?organizationId=${organizationId}`}
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold mt-1"
                              >
                                View full profile
                                <ChevronRight size={12} />
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Top Reasons */}
          {stats?.top_reasons && stats.top_reasons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={14} className="text-blue-400" />
                Top Reasons
              </h3>
              <div className="space-y-3">
                {stats.top_reasons.slice(0, 8).map((r: any) => {
                  const maxCount = stats.top_reasons[0]?.count || 1;
                  return (
                    <div key={r.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {getReasonLabel(r.category)}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {r.count}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(r.count / maxCount) * 100}%`,
                            backgroundColor: getReasonColor(r.category),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Trigger Alerts */}
          {stats?.staff_above_trigger &&
            stats.staff_above_trigger.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-500/30 p-5"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  Trigger Alerts
                </h3>
                <div className="space-y-3">
                  {stats.staff_above_trigger.map((s: any) => {
                    const bf = getBradfordLevel(s.bradford_factor);
                    return (
                      <Link
                        key={s.staff_id}
                        href={`/dashboard/hr/sickness/${s.staff_id}?organizationId=${organizationId}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {s.staff_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {s.trigger_level.replace("_", " ")} required
                          </p>
                        </div>
                        <span
                          className="text-sm font-black px-2 py-0.5 rounded-lg"
                          style={{
                            color: bf.color,
                            backgroundColor: `${bf.color}15`,
                          }}
                        >
                          {Math.round(s.bradford_factor)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
        </div>
      </div>
    </>
  );
}

/* ======== ANALYTICS TAB ======== */
function AnalyticsTab({
  analytics,
  loading,
  stats,
}: {
  analytics: any;
  loading: boolean;
  stats: any;
}) {
  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="text-sm text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const benchmarks = analytics.benchmarks;
  const benchmarkColor =
    benchmarks?.performance === "excellent"
      ? "#22c55e"
      : benchmarks?.performance === "good"
        ? "#3b82f6"
        : benchmarks?.performance === "average"
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="space-y-6">
      {/* Pattern Alerts */}
      {analytics.alerts && analytics.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {analytics.alerts.map((alert: any, i: number) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-2xl border ${
                alert.severity === "critical"
                  ? "bg-red-500/5 border-red-500/20"
                  : alert.severity === "warning"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-blue-500/5 border-blue-500/20"
              }`}
            >
              <Brain
                size={16}
                className={
                  alert.severity === "critical"
                    ? "text-red-400 mt-0.5 shrink-0"
                    : alert.severity === "warning"
                      ? "text-amber-400 mt-0.5 shrink-0"
                      : "text-blue-400 mt-0.5 shrink-0"
                }
              />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {alert.message}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">
                  {alert.type.replace(/_/g, " ")} pattern
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DfE Benchmark Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Gauge size={14} className="text-blue-400" />
            DfE National Benchmarks
          </h3>
          <div className="space-y-4">
            {/* Absence rate comparison */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-semibold">
                  Absence Rate
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-black"
                    style={{ color: benchmarkColor }}
                  >
                    {benchmarks.school_absence_rate}%
                  </span>
                  {benchmarks.school_absence_rate <=
                  benchmarks.national_average_rate ? (
                    <ArrowDownRight size={14} className="text-green-400" />
                  ) : (
                    <ArrowUpRight size={14} className="text-red-400" />
                  )}
                </div>
              </div>
              <div className="relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((benchmarks.school_absence_rate / 10) * 100, 100)}%`,
                    backgroundColor: benchmarkColor,
                  }}
                />
                {/* National average marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-slate-400"
                  style={{
                    left: `${(benchmarks.national_average_rate / 10) * 100}%`,
                  }}
                  title={`National avg: ${benchmarks.national_average_rate}%`}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400">0%</span>
                <span className="text-[10px] text-slate-400">
                  National avg: {benchmarks.national_average_rate}%
                </span>
                <span className="text-[10px] text-slate-400">10%</span>
              </div>
            </div>

            {/* Comparison table */}
            <div className="space-y-2 pt-2">
              {[
                {
                  label: "Avg days per staff",
                  school: benchmarks.school_avg_days_per_staff,
                  national: benchmarks.national_avg_days_per_teacher,
                },
                {
                  label: "Staff with absence",
                  school: `${benchmarks.school_pct_staff_absent}%`,
                  national: `${benchmarks.national_pct_teachers_absent}%`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <span className="text-xs text-slate-500">{row.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {row.school}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      vs {row.national}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="text-center py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
              style={{
                color: benchmarkColor,
                backgroundColor: `${benchmarkColor}10`,
              }}
            >
              {benchmarks.performance} performance
            </div>
          </div>
        </motion.div>

        {/* Day of Week Pattern */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={14} className="text-blue-400" />
            Day of Week Pattern
          </h3>
          <div className="flex items-end gap-3 h-36 px-2">
            {analytics.day_of_week_pattern
              ?.filter((d: any) => d.day !== "Sun" && d.day !== "Sat")
              .map((d: any) => {
                const maxDay = Math.max(
                  ...analytics.day_of_week_pattern
                    .filter((x: any) => x.day !== "Sun" && x.day !== "Sat")
                    .map((x: any) => x.count),
                  1,
                );
                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-xs font-bold text-slate-400">
                      {d.count > 0 ? d.count : ""}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        d.isSpike ? "bg-amber-500/80" : "bg-blue-500/60"
                      }`}
                      style={{
                        height: `${Math.max((d.count / maxDay) * 100, 6)}%`,
                        minHeight: d.count > 0 ? "12px" : "4px",
                      }}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        d.isSpike ? "text-amber-400" : "text-slate-500"
                      }`}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
          </div>
          {(analytics.monday_spike_pct > 20 ||
            analytics.friday_spike_pct > 20) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {analytics.monday_spike_pct > 20 && (
                <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-semibold">
                  Mon +{analytics.monday_spike_pct}% above avg
                </span>
              )}
              {analytics.friday_spike_pct > 20 && (
                <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-semibold">
                  Fri +{analytics.friday_spike_pct}% above avg
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Supply Cover Costs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <PoundSterling size={14} className="text-green-400" />
            Estimated Supply Cover Costs
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
              <p className="text-xs text-slate-400 font-semibold">
                Total Cost (12m)
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {"\u00A3"}
                {(
                  analytics.supply_costs?.estimated_total_cost || 0
                ).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 font-semibold">Days Lost</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {analytics.supply_costs?.total_days_lost || 0}
              </p>
            </div>
          </div>
          {/* Monthly cost mini chart */}
          <div className="flex items-end gap-1 h-16">
            {analytics.supply_costs?.monthly?.map((m: any, i: number) => {
              const maxCost = Math.max(
                ...analytics.supply_costs.monthly.map((x: any) => x.cost),
                1,
              );
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center"
                  title={`${m.month}: ${"\u00A3"}${m.cost.toLocaleString()}`}
                >
                  <div
                    className="w-full rounded-t-sm bg-green-500/50"
                    style={{
                      height: `${Math.max((m.cost / maxCost) * 100, 2)}%`,
                      minHeight: m.cost > 0 ? "4px" : "1px",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-400">
              {analytics.supply_costs?.monthly?.[0]?.month}
            </span>
            <span className="text-[9px] text-slate-400">
              {analytics.supply_costs?.monthly?.[11]?.month}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Based on {"\u00A3"}
            {analytics.supply_costs?.cost_per_day}/day average supply cost
          </p>
        </motion.div>

        {/* Formal Stage Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield size={14} className="text-purple-400" />
            Formal Stage Pipeline
          </h3>
          <div className="space-y-3">
            {analytics.formal_stage_pipeline?.map((stage: any) => {
              const stageConfig = FORMAL_STAGES.find(
                (s) =>
                  s.value === stage.stage ||
                  s.value ===
                    stage.stage.replace("informal_meeting", "informal"),
              );
              const color = stageConfig?.color || "#94a3b8";
              const totalInPipeline =
                analytics.formal_stage_pipeline?.reduce(
                  (s: number, p: any) => s + p.count,
                  0,
                ) || 1;

              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <span className="text-xs font-semibold" style={{ color }}>
                      {stage.label}
                    </span>
                  </div>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500 flex items-center justify-center"
                      style={{
                        width:
                          stage.count > 0
                            ? `${Math.max((stage.count / totalInPipeline) * 100, 10)}%`
                            : "0%",
                        backgroundColor: `${color}30`,
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      {stage.count > 0 && (
                        <span className="text-xs font-bold" style={{ color }}>
                          {stage.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {analytics.formal_stage_pipeline?.every(
            (s: any) => s.count === 0,
          ) && (
            <p className="text-xs text-slate-400 text-center mt-2">
              No staff currently in formal process
            </p>
          )}
        </motion.div>

        {/* Term Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Target size={14} className="text-cyan-400" />
            Term-by-Term Breakdown
          </h3>
          <div className="space-y-2">
            {analytics.term_breakdown?.map((term: any) => {
              const maxTermCount = Math.max(
                ...analytics.term_breakdown.map((t: any) => t.count),
                1,
              );
              return (
                <div key={term.term} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-20 shrink-0">
                    {term.term}
                  </span>
                  <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-cyan-500/40 transition-all duration-500"
                      style={{
                        width: `${Math.max((term.count / maxTermCount) * 100, 2)}%`,
                      }}
                    />
                  </div>
                  <div className="text-right shrink-0 w-20">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {term.count}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({term.days}d)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Department Clusters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={14} className="text-purple-400" />
            Department Clusters
          </h3>
          {analytics.department_clusters?.length > 0 ? (
            <div className="space-y-3">
              {analytics.department_clusters.slice(0, 6).map((dept: any) => (
                <div
                  key={dept.department}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {dept.department}
                    </p>
                    <p className="text-xs text-slate-400">
                      {dept.staffAffected} staff affected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {dept.absences} spells
                    </p>
                    <p className="text-xs text-slate-400">{dept.days}d lost</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center">
              No department data available
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
