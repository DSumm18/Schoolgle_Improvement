"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Zap,
  Flame,
  Droplets,
  Wind,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Plus,
  BarChart3,
  Leaf,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Camera,
  Upload,
  Clock,
  Calendar,
  Moon,
  Sun,
  Activity,
  Eye,
  FileCheck,
  Thermometer,
  FileText,
  Sparkles,
  Car,
  Receipt,
} from "lucide-react";
import {
  ModulePageHeader,
  getModuleColors,
} from "@/components/ui/module-page-header";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  EnergyFilterBar,
  DEFAULT_FILTERS,
  type EnergyFilters,
} from "@/components/energy/EnergyFilterBar";
import { EnergyReportTab } from "@/components/energy/EnergyReportTab";
import { CarbonReportTab } from "@/components/energy/CarbonReportTab";
import { MileageClaimsTab } from "@/components/energy/MileageClaimsTab";
import { InvoiceDataTable } from "@/components/energy/InvoiceDataTable";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend,
  Cell,
  ComposedChart,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────

interface Meter {
  id: string;
  meter_type: string;
  label: string;
  location: string;
  latest_reading: number;
  latest_date: string;
  unit: string;
  monthly_cost: number;
  monthly_kwh: number;
  quarterly_costs?: number[];
}

interface MonthlyConsumption {
  month: string;
  electricity: number;
  gas: number;
  is_holiday?: boolean;
}

interface Summary {
  total_annual_cost: number;
  total_annual_kwh: number;
  total_monthly_cost: number;
  total_monthly_kwh: number;
  co2_tonnes: number;
  anomaly_count: number;
  anomaly_waste_cost: number;
  floor_area_sqm: number;
  dec_kwh_per_sqm: number;
  dec_rating: string;
}

interface Anomaly {
  id: string;
  anomaly_type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  detected_date: string;
  estimated_waste_kwh: number;
  estimated_waste_cost: number;
  estimated_annual_cost: number;
  meter_id: string;
  status: string;
}

interface HHSlot {
  hour: number;
  minute: number;
  kwh: number;
}

interface DayOfWeekProfile {
  day: string;
  slots: HHSlot[];
}

interface TermVsHoliday {
  term_avg_kwh: number;
  holiday_avg_kwh: number;
  savings_potential: number;
}

interface BaseloadEntry {
  meter_id: string;
  meter_label: string;
  meter_type: string;
  overnight_kwh: number;
  daytime_kwh: number;
  baseload_pct: number;
}

interface AnomalyTimelineEntry {
  id: string;
  date: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
}

interface HHAnalysis {
  day_of_week_profile: DayOfWeekProfile[];
  term_vs_holiday: TermVsHoliday;
  baseload_analysis: BaseloadEntry[];
  anomaly_timeline: AnomalyTimelineEntry[];
}

interface MeterReadingResult {
  reading_value: number;
  confidence: number;
  meter_type_guess: string;
  unit: string;
}

interface DailyTrendEntry {
  date: string;
  kwh: number;
  day_type: string;
  is_school_day: boolean;
}

interface TermDateRange {
  term_name: string;
  start: string;
  end: string;
}

interface HolidayPeriod {
  name: string;
  start: string;
  end: string;
}

interface SchoolEvent {
  name: string;
  days?: string[];
  time?: string;
  start?: string;
  end?: string;
}

interface DailyTrendData {
  daily: DailyTrendEntry[];
  term_dates: TermDateRange[];
  holidays: HolidayPeriod[];
  school_events: SchoolEvent[];
}

// ─── Constants ───────────────────────────────────────────────────────

const CARBON_FACTORS = {
  electricity: 0.233, // kgCO2/kWh (DESNZ 2025)
  gas: 0.184,
};

const DEC_BANDS: {
  rating: string;
  maxKwhPerSqm: number;
  colour: string;
  bg: string;
}[] = [
  { rating: "A", maxKwhPerSqm: 25, colour: "bg-green-600", bg: "#16a34a" },
  { rating: "B", maxKwhPerSqm: 50, colour: "bg-green-500", bg: "#22c55e" },
  { rating: "C", maxKwhPerSqm: 75, colour: "bg-yellow-400", bg: "#facc15" },
  { rating: "D", maxKwhPerSqm: 100, colour: "bg-yellow-500", bg: "#eab308" },
  { rating: "E", maxKwhPerSqm: 125, colour: "bg-orange-400", bg: "#fb923c" },
  { rating: "F", maxKwhPerSqm: 150, colour: "bg-orange-500", bg: "#f97316" },
  {
    rating: "G",
    maxKwhPerSqm: Infinity,
    colour: "bg-red-500",
    bg: "#ef4444",
  },
];

const METER_ICONS: Record<string, typeof Zap> = {
  electricity: Zap,
  gas: Flame,
  water: Droplets,
  solar_generation: Wind,
  solar_export: Wind,
  oil: Flame,
};

const METER_COLOURS: Record<string, string> = {
  electricity: "text-yellow-500",
  gas: "text-orange-500",
  water: "text-blue-500",
  solar_generation: "text-green-500",
  solar_export: "text-green-400",
};

const METER_BG: Record<string, string> = {
  electricity:
    "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800",
  gas: "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800",
  water: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800",
  solar_generation:
    "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800",
  solar_export:
    "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800",
};

const SEVERITY_STYLES: Record<
  string,
  { border: string; bg: string; dot: string; text: string }
> = {
  critical: {
    border: "border-red-300 dark:border-red-700",
    bg: "bg-red-50 dark:bg-red-900/20",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
  },
  high: {
    border: "border-orange-300 dark:border-orange-700",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    dot: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
  },
  medium: {
    border: "border-yellow-300 dark:border-yellow-700",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    dot: "bg-yellow-500",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  low: {
    border: "border-blue-300 dark:border-blue-700",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  detected: {
    label: "Detected",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  investigating: {
    label: "Investigating",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  accepted: {
    label: "Accepted",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Helpers ─────────────────────────────────────────────────────────

function fmtGBP(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat("en-GB").format(Math.round(n));
}

function fmtPct(n: number) {
  return `${Math.round(n)}%`;
}

function getDECBand(kwhPerSqm: number) {
  return DEC_BANDS.find((b) => kwhPerSqm <= b.maxKwhPerSqm) ?? DEC_BANDS[6];
}

function heatColor(value: number, max: number): string {
  if (max === 0) return "rgba(0,212,212,0.05)";
  const ratio = Math.min(value / max, 1);
  if (ratio < 0.25) return `rgba(0,212,212,${0.08 + ratio * 0.4})`;
  if (ratio < 0.5) return `rgba(234,179,8,${0.3 + (ratio - 0.25) * 1.2})`;
  if (ratio < 0.75) return `rgba(249,115,22,${0.4 + (ratio - 0.5) * 1.2})`;
  return `rgba(239,68,68,${0.5 + (ratio - 0.75) * 2})`;
}

// ─── Custom Tooltip Components ───────────────────────────────────────

function DailyTrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const date = new Date(d.date);
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    date.getUTCDay()
  ];
  const monthName = date.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div className="bg-slate-900 text-white rounded-lg px-4 py-3 shadow-2xl border border-slate-700 text-sm">
      <p className="font-semibold text-teal-300">
        {dayName} {monthName}
      </p>
      <div className="mt-1.5 space-y-1">
        <p className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span className="font-bold text-lg">{d.kwh?.toFixed(0) ?? "—"}</span>
          <span className="text-slate-400">kWh</span>
        </p>
        {d.day_type && (
          <p className="text-xs text-slate-400 capitalize">
            {d.is_school_day ? "School day" : d.day_type.replace(/_/g, " ")}
          </p>
        )}
        {d.movingAvg && (
          <p className="text-xs text-cyan-400">
            7-day avg: {d.movingAvg.toFixed(0)} kWh
          </p>
        )}
      </div>
    </div>
  );
}

function MonthlyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-4 py-3 shadow-2xl border border-slate-700 text-sm">
      <p className="font-semibold text-teal-300">{d.label}</p>
      <div className="mt-1.5 space-y-1">
        {d.electricity > 0 && (
          <p className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            Electricity: {fmtNumber(d.electricity)} kWh
          </p>
        )}
        {d.gas > 0 && (
          <p className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            Gas: {fmtNumber(d.gas)} kWh
          </p>
        )}
        <p className="text-xs text-slate-400 pt-1 border-t border-slate-700">
          Total: {fmtNumber((d.electricity ?? 0) + (d.gas ?? 0))} kWh
        </p>
      </div>
    </div>
  );
}

function HHProfileTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 shadow-2xl border border-slate-700 text-xs">
      <p className="font-semibold text-teal-300 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name}: {entry.value?.toFixed(2)} kWh
        </p>
      ))}
    </div>
  );
}

function MomYoyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-4 py-3 shadow-2xl border border-slate-700 text-sm">
      <p className="font-semibold text-teal-300">{d.label}</p>
      <div className="mt-1.5 space-y-1">
        <p className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          This year: {fmtNumber(d.kwh)} kWh
        </p>
        {d.prevYearKwh !== null && (
          <p className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Last year: {fmtNumber(d.prevYearKwh)} kWh
          </p>
        )}
        {d.prevYearKwh !== null && d.prevYearKwh > 0 && (
          <p className="text-xs text-slate-400 pt-1 border-t border-slate-700">
            YOY change:{" "}
            {(((d.kwh - d.prevYearKwh) / d.prevYearKwh) * 100).toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Animated KPI Card ───────────────────────────────────────────────

function KPICard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  trend,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  trend?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      {trend && <div className="mt-1.5">{trend}</div>}
    </motion.div>
  );
}

// ─── Animated Section Wrapper ────────────────────────────────────────

function Section({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function EnergyDashboardPage() {
  const colors = getModuleColors("estates");
  const { organizationId } = useAuth();

  const authFetch = useCallback(async (url: string, init?: RequestInit) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string>),
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return fetch(url, { ...init, headers });
  }, []);

  const [meters, setMeters] = useState<Meter[]>([]);
  const [monthly, setMonthly] = useState<MonthlyConsumption[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [hhAnalysis, setHHAnalysis] = useState<HHAnalysis | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendData | null>(null);

  // Meter reading state
  const [showMeterReader, setShowMeterReader] = useState(false);
  const [meterImage, setMeterImage] = useState<File | null>(null);
  const [meterImagePreview, setMeterImagePreview] = useState<string | null>(
    null,
  );
  const [meterReadingResult, setMeterReadingResult] =
    useState<MeterReadingResult | null>(null);
  const [meterReadingLoading, setMeterReadingLoading] = useState(false);
  const [selectedMeterId, setSelectedMeterId] = useState("");
  const [meterReadingSubmitting, setMeterReadingSubmitting] = useState(false);
  const [meterReadingSuccess, setMeterReadingSuccess] = useState(false);
  const [supplierEmailSent, setSupplierEmailSent] = useState(false);
  const [supplierEmailLoading, setSupplierEmailLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formMeterId, setFormMeterId] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formValue, setFormValue] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Main tabs
  const [mainTab, setMainTab] = useState<
    | "combined"
    | "electricity"
    | "gas"
    | "invoices"
    | "reports"
    | "carbon"
    | "mileage"
  >("combined");
  const [filters, setFilters] = useState<EnergyFilters>(DEFAULT_FILTERS);

  // View toggles
  const [showHolidayOverlay, setShowHolidayOverlay] = useState(true);
  const [showMovingAvg, setShowMovingAvg] = useState(true);
  const [trendView, setTrendView] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const [hhTab, setHHTab] = useState<
    "profile" | "heatmap" | "baseload" | "anomalies"
  >("profile");

  // ─── Data fetch ──────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    const qs = `?organizationId=${organizationId}`;
    setLoading(true);
    try {
      const [energyRes, anomalyRes, hhRes, dailyTrendRes] = await Promise.all([
        authFetch(`/api/estates/energy${qs}`),
        authFetch(`/api/estates/energy/anomalies${qs}`),
        authFetch(`/api/estates/energy/hh-analysis${qs}`).catch(() => null),
        authFetch(`/api/estates/energy/daily-trend${qs}&months=13`).catch(
          () => null,
        ),
      ]);
      const energyData = await energyRes.json();
      const anomalyData = await anomalyRes.json();
      const hhData = hhRes ? await hhRes.json() : null;
      const dailyTrendData = dailyTrendRes ? await dailyTrendRes.json() : null;
      if (dailyTrendData && !dailyTrendData.error) {
        setDailyTrend(dailyTrendData);
      }

      setMeters(energyData.meters ?? []);
      setMonthly(energyData.monthly_consumption ?? []);
      const s = energyData.summary;
      if (s) {
        setSummary({
          total_annual_cost: (s.total_monthly_cost ?? 0) * 12,
          total_annual_kwh: (s.total_monthly_kwh ?? 0) * 12,
          total_monthly_cost: s.total_monthly_cost ?? 0,
          total_monthly_kwh: s.total_monthly_kwh ?? 0,
          co2_tonnes: s.co2_tonnes ?? 0,
          anomaly_count: s.anomaly_count ?? 0,
          anomaly_waste_cost: anomalyData.anomalies
            ? anomalyData.anomalies.reduce(
                (sum: number, a: { estimated_waste_cost?: number }) =>
                  sum + (a.estimated_waste_cost ?? 0),
                0,
              )
            : 0,
          floor_area_sqm: s.floor_area_sqm ?? 3200,
          dec_kwh_per_sqm: s.dec_kwh_per_sqm ?? 0,
          dec_rating: s.dec_rating ?? "D",
        });
      }
      setIsDemo(energyData.demo === true);
      setAnomalies(anomalyData.anomalies ?? []);
      if (hhData && !hhData.error) {
        const dayMap = new Map<string, { day: string; totals: number[] }>();
        for (const d of hhData.day_of_week_profile ?? []) {
          const existing = dayMap.get(d.day);
          if (!existing) {
            dayMap.set(d.day, { day: d.day, totals: [...(d.slots ?? [])] });
          } else {
            (d.slots ?? []).forEach((v: number, i: number) => {
              existing.totals[i] = (existing.totals[i] ?? 0) + (v ?? 0);
            });
          }
        }
        const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const profile = dayOrder
          .filter((d) => dayMap.has(d))
          .map((d) => {
            const entry = dayMap.get(d)!;
            return {
              day: entry.day,
              slots: entry.totals.map((kwh: number, i: number) => ({
                hour: Math.floor(i / 2),
                minute: (i % 2) * 30,
                kwh: kwh ?? 0,
              })),
            };
          });

        const tvh = hhData.term_vs_holiday ?? [];
        const termTotal = tvh.reduce(
          (s: number, m: { term_avg_daily_kwh?: number }) =>
            s + (m.term_avg_daily_kwh ?? 0),
          0,
        );
        const holTotal = tvh.reduce(
          (s: number, m: { holiday_avg_daily_kwh?: number }) =>
            s + (m.holiday_avg_daily_kwh ?? 0),
          0,
        );
        const avgRate = (7.2 + 28.5) / 2;
        const savingsPotential =
          holTotal > termTotal * 0.3
            ? ((holTotal - termTotal * 0.3) * avgRate * 365) / 100 / 3
            : 0;

        const baseload = (hhData.baseload_analysis ?? []).map((b: any) => ({
          meter_id: b.meter_id,
          meter_label: b.meter_location ?? b.meter_id,
          meter_type: b.meter_type ?? "unknown",
          overnight_kwh: b.overnight_avg_kwh ?? 0,
          daytime_kwh: b.daytime_avg_kwh ?? 0,
          baseload_pct: b.baseload_ratio_pct ?? 0,
        }));

        const timeline = (hhData.anomaly_periods ?? []).map((a: any) => ({
          id: a.anomaly_id,
          date: a.detected_date ?? "",
          title: a.title ?? "",
          severity: a.anomaly_type === "spike" ? "critical" : "high",
        }));

        setHHAnalysis({
          day_of_week_profile: profile,
          term_vs_holiday: {
            term_avg_kwh: Math.round(termTotal),
            holiday_avg_kwh: Math.round(holTotal),
            savings_potential: Math.round(savingsPotential),
          },
          baseload_analysis: baseload,
          anomaly_timeline: timeline,
        });
      }
    } catch {
      // If API not available, page shows empty state
    } finally {
      setLoading(false);
    }
  }, [organizationId, authFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Meter reading handlers (unchanged) ──────────────────────────

  async function handleAddReading(e: React.FormEvent) {
    e.preventDefault();
    if (!formMeterId || !formValue) return;
    setFormSubmitting(true);
    try {
      await authFetch(`/api/estates/energy?organizationId=${organizationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_id: formMeterId,
          reading_date: formDate,
          reading_value: parseFloat(formValue),
          cost_amount: formCost ? parseFloat(formCost) : undefined,
        }),
      });
      setFormSuccess(true);
      setFormValue("");
      setFormCost("");
      setTimeout(() => setFormSuccess(false), 3000);
      fetchData();
    } catch {
      // silent
    } finally {
      setFormSubmitting(false);
    }
  }

  function handleFileSelect(file: File) {
    setMeterImage(file);
    setMeterReadingResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setMeterImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAnalyzeImage() {
    if (!meterImage || !meterImagePreview) return;
    setMeterReadingLoading(true);
    setMeterReadingResult(null);
    try {
      const base64 = meterImagePreview.split(",")[1] ?? meterImagePreview;
      const res = await authFetch(
        `/api/estates/energy/meter-reading?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            meters: meters.map((m) => ({
              id: m.id,
              reference: m.label,
              type: m.meter_type,
              location: m.location,
            })),
          }),
        },
      );
      const data = await res.json();
      if (data.reading !== undefined && data.reading !== null) {
        setMeterReadingResult({
          reading_value: data.reading,
          confidence: data.confidence ?? 0,
          meter_type_guess: data.meter_type ?? "unknown",
          unit: data.meter_type?.includes("gas") ? "m\u00b3" : "kWh",
        });
        if (data.matched_meter_id) {
          setSelectedMeterId(data.matched_meter_id);
        }
      }
    } catch {
      // silent
    } finally {
      setMeterReadingLoading(false);
    }
  }

  async function handleSubmitMeterReading() {
    if (!meterReadingResult || !selectedMeterId) return;
    setMeterReadingSubmitting(true);
    try {
      await authFetch(`/api/estates/energy?organizationId=${organizationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_id: selectedMeterId,
          reading_date: new Date().toISOString().slice(0, 10),
          reading_value: meterReadingResult.reading_value,
        }),
      });
      setMeterReadingSuccess(true);
      setTimeout(() => {
        setMeterReadingSuccess(false);
        setShowMeterReader(false);
        setMeterImage(null);
        setMeterImagePreview(null);
        setMeterReadingResult(null);
        setSelectedMeterId("");
        fetchData();
      }, 2000);
    } catch {
      // silent
    } finally {
      setMeterReadingSubmitting(false);
    }
  }

  async function handleSendToSupplier(meterId: string, readingValue: number) {
    setSupplierEmailLoading(true);
    try {
      const res = await authFetch(
        `/api/estates/energy/send-reading?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meter_id: meterId,
            reading_value: readingValue,
            reading_date: new Date().toISOString().slice(0, 10),
          }),
        },
      );
      const data = await res.json();
      if (data.message) {
        setSupplierEmailSent(true);
        setTimeout(() => setSupplierEmailSent(false), 4000);
      }
    } catch {
      // silent
    } finally {
      setSupplierEmailLoading(false);
    }
  }

  // ─── Derived data ────────────────────────────────────────────────

  const decBand = summary ? getDECBand(summary.dec_kwh_per_sqm) : null;
  const totalAnnualWaste = anomalies.reduce(
    (s, a) => s + (a.estimated_annual_cost ?? 0),
    0,
  );
  const activeAnomalies = anomalies.filter(
    (a) => a.status !== "resolved" && a.status !== "accepted",
  );

  // Build daily trend chart data with 7-day moving average
  // Apply filters to daily data
  const filteredDailyData = useMemo(() => {
    if (!dailyTrend?.daily?.length) return [];
    let data = [...dailyTrend.daily];

    // Day filter
    if (filters.dayFilter !== "all") {
      const dayMap: Record<string, number[]> = {
        weekdays: [1, 2, 3, 4, 5],
        weekends: [0, 6],
        mon: [1],
        tue: [2],
        wed: [3],
        thu: [4],
        fri: [5],
        sat: [6],
        sun: [0],
      };
      const allowedDays = dayMap[filters.dayFilter];
      if (allowedDays) {
        data = data.filter((d) => {
          const dow = new Date(d.date).getUTCDay();
          return allowedDays.includes(dow);
        });
      }
    }

    // Period filter
    if (filters.periodFilter === "term") {
      data = data.filter((d) => d.is_school_day);
    } else if (filters.periodFilter === "holiday") {
      data = data.filter((d) => !d.is_school_day);
    }

    return data;
  }, [dailyTrend, filters.dayFilter, filters.periodFilter]);

  const dailyChartData = useMemo(() => {
    if (!filteredDailyData.length) return [];
    const data = filteredDailyData.map((d, i, arr) => {
      // 7-day moving average
      const start = Math.max(0, i - 6);
      const window = arr.slice(start, i + 1);
      const movingAvg = window.reduce((s, w) => s + w.kwh, 0) / window.length;

      return {
        ...d,
        movingAvg: Math.round(movingAvg * 10) / 10,
        label: new Date(d.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
      };
    });
    return data;
  }, [filteredDailyData]);

  // Weekly aggregated data
  const weeklyChartData = useMemo(() => {
    if (!dailyChartData.length) return [];
    const weeks: Record<
      string,
      { dates: string[]; kwh: number; count: number }
    > = {};
    for (const d of dailyChartData) {
      const date = new Date(d.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      const key = weekStart.toISOString().slice(0, 10);
      if (!weeks[key]) {
        weeks[key] = { dates: [], kwh: 0, count: 0 };
      }
      weeks[key].dates.push(d.date);
      weeks[key].kwh += d.kwh;
      weeks[key].count++;
    }
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, data]) => ({
        date: weekStart,
        kwh: Math.round(data.kwh),
        avgDaily: Math.round(data.kwh / data.count),
        label: new Date(weekStart).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
      }));
  }, [dailyChartData]);

  // Monthly consumption chart data with labels
  const monthlyChartData = useMemo(() => {
    return monthly.map((m) => ({
      ...m,
      total: m.electricity + m.gas,
      label: (() => {
        const parts = m.month.split("-");
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
        return d.toLocaleDateString("en-GB", {
          month: "short",
          year: "2-digit",
        });
      })(),
    }));
  }, [monthly]);

  // ─── MOM / YOY Monthly Comparison (from daily trend data) ──────────
  const momYoyData = useMemo(() => {
    if (!filteredDailyData.length)
      return {
        chartData: [],
        momPct: null as number | null,
        yoyPct: null as number | null,
      };

    // Aggregate daily kWh into monthly buckets keyed by "YYYY-MM"
    const buckets: Record<string, number> = {};
    for (const d of filteredDailyData) {
      const key = d.date.slice(0, 7); // "YYYY-MM"
      buckets[key] = (buckets[key] ?? 0) + d.kwh;
    }

    // Sort months chronologically
    const sortedKeys = Object.keys(buckets).sort();

    // Build chart data: for each month, find the same calendar month from previous year
    const chartData = sortedKeys.map((key) => {
      const [yearStr, monthStr] = key.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const prevYearKey = `${year - 1}-${monthStr}`;
      const prevYearKwh = buckets[prevYearKey] ?? null;
      const label = new Date(year, month - 1).toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      });
      return {
        key,
        label,
        month,
        year,
        kwh: Math.round(buckets[key]),
        prevYearKwh: prevYearKwh !== null ? Math.round(prevYearKwh) : null,
      };
    });

    // Calculate MOM (last full month vs month before) and YOY (last full month vs same month last year)
    // The latest month may be partial, so use the second-to-last if we have enough data
    let momPct: number | null = null;
    let yoyPct: number | null = null;

    if (chartData.length >= 2) {
      const latest = chartData[chartData.length - 1];
      const previous = chartData[chartData.length - 2];
      if (previous.kwh > 0) {
        momPct = ((latest.kwh - previous.kwh) / previous.kwh) * 100;
      }
      if (latest.prevYearKwh && latest.prevYearKwh > 0) {
        yoyPct = ((latest.kwh - latest.prevYearKwh) / latest.prevYearKwh) * 100;
      }
    }

    return { chartData, momPct, yoyPct };
  }, [filteredDailyData]);

  // HH Profile chart data (weekday vs weekend overlay)
  const hhProfileData = useMemo(() => {
    if (!hhAnalysis?.day_of_week_profile?.length) return [];
    const weekdayDays = hhAnalysis.day_of_week_profile.filter((d) =>
      ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(d.day),
    );
    const weekendDays = hhAnalysis.day_of_week_profile.filter((d) =>
      ["Sat", "Sun"].includes(d.day),
    );

    return Array.from({ length: 48 }, (_, i) => {
      const h = Math.floor(i / 2);
      const m = (i % 2) * 30;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      const weekdayAvg =
        weekdayDays.length > 0
          ? weekdayDays.reduce((s, d) => s + (d.slots[i]?.kwh ?? 0), 0) /
            weekdayDays.length
          : 0;
      const weekendAvg =
        weekendDays.length > 0
          ? weekendDays.reduce((s, d) => s + (d.slots[i]?.kwh ?? 0), 0) /
            weekendDays.length
          : 0;

      return {
        time,
        weekday: Math.round(weekdayAvg * 100) / 100,
        weekend: Math.round(weekendAvg * 100) / 100,
      };
    });
  }, [hhAnalysis]);

  // HH Heatmap data
  const hhHeatmapMax = useMemo(() => {
    if (!hhAnalysis?.day_of_week_profile?.length) return 1;
    return Math.max(
      ...hhAnalysis.day_of_week_profile.flatMap((d) =>
        d.slots.map((s) => s.kwh),
      ),
      1,
    );
  }, [hhAnalysis]);

  // ─── Loading state ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"
              />
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <ModulePageHeader
          moduleId="estates"
          icon={Zap}
          label="Estates Management"
          title="Energy & Utilities"
          description="Monitor consumption, costs, anomalies and carbon footprint"
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setShowMeterReader(!showMeterReader);
              setShowAddForm(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            <Camera className="h-4 w-4" />
            Smart Reading
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowMeterReader(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-500 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Manual Entry
          </button>
        </div>
      </div>

      {/* ─── Demo Banner ──────────────────────────────────── */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300"
        >
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              Demo Mode — Connect your meters to see real data
            </p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-400">
              Showing sample data for a typical 2-form entry primary school
              (3,200 m{"\u00b2"}).
            </p>
          </div>
        </motion.div>
      )}

      {/* ─── Summary KPI Cards ────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<BarChart3 className="h-5 w-5" />}
            iconBg="bg-teal-100 dark:bg-teal-900/40"
            iconColor="text-teal-600 dark:text-teal-400"
            label="Annual Cost"
            value={fmtGBP(summary.total_annual_cost)}
            delay={0}
            trend={
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {fmtGBP(summary.total_monthly_cost)}/mo average
              </span>
            }
          />
          <KPICard
            icon={<Zap className="h-5 w-5" />}
            iconBg="bg-yellow-100 dark:bg-yellow-900/40"
            iconColor="text-yellow-600 dark:text-yellow-400"
            label="Annual kWh"
            value={fmtNumber(summary.total_annual_kwh)}
            delay={0.1}
            trend={
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {fmtNumber(summary.total_monthly_kwh)}/mo average
              </span>
            }
          />
          <KPICard
            icon={<Leaf className="h-5 w-5" />}
            iconBg="bg-green-100 dark:bg-green-900/40"
            iconColor="text-green-600 dark:text-green-400"
            label={`CO\u2082 Emissions`}
            value={`${summary.co2_tonnes.toFixed(1)}t`}
            delay={0.2}
            trend={
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {CARBON_FACTORS.electricity} kgCO{"\u2082"}/kWh
              </span>
            }
          />
          <KPICard
            icon={<AlertTriangle className="h-5 w-5" />}
            iconBg={
              activeAnomalies.length > 0
                ? "bg-red-100 dark:bg-red-900/40"
                : "bg-green-100 dark:bg-green-900/40"
            }
            iconColor={
              activeAnomalies.length > 0
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }
            label="Active Anomalies"
            value={String(activeAnomalies.length)}
            delay={0.3}
            trend={
              totalAnnualWaste > 0 ? (
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  {fmtGBP(totalAnnualWaste)}/yr potential waste
                </span>
              ) : (
                <span className="text-xs text-green-600 dark:text-green-400">
                  No waste detected
                </span>
              )
            }
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MAIN TABS                                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Section delay={0.15}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-3">
            {(
              [
                [
                  "combined",
                  "Combined",
                  BarChart3,
                  "text-teal-500",
                  "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
                ],
                [
                  "electricity",
                  "Electricity",
                  Zap,
                  "text-yellow-500",
                  "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/60",
                ],
                [
                  "gas",
                  "Gas",
                  Flame,
                  "text-orange-500",
                  "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60",
                ],
                [
                  "invoices",
                  "Invoices",
                  Receipt,
                  "text-indigo-500",
                  "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60",
                ],
                [
                  "reports",
                  "Reports",
                  FileText,
                  "text-blue-500",
                  "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
                ],
                [
                  "carbon",
                  "Carbon",
                  Leaf,
                  "text-emerald-500",
                  "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
                ],
                [
                  "mileage",
                  "Mileage",
                  Car,
                  "text-violet-500",
                  "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60",
                ],
              ] as [string, string, any, string, string][]
            ).map(([key, label, Icon, iconColor, activeClass]) => (
              <button
                key={key}
                onClick={() => setMainTab(key as typeof mainTab)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  mainTab === key
                    ? activeClass
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${mainTab === key ? "" : iconColor}`}
                />
                {label}
              </button>
            ))}
          </div>
          {/* Filter bar (not shown on Reports/Carbon/Mileage/Invoices tabs) */}
          {mainTab !== "reports" &&
            mainTab !== "carbon" &&
            mainTab !== "mileage" &&
            mainTab !== "invoices" && (
              <EnergyFilterBar filters={filters} onChange={setFilters} />
            )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* INVOICES TAB                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "invoices" && organizationId && (
        <Section delay={0.2}>
          <InvoiceDataTable organizationId={organizationId} />
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* REPORTS TAB                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "reports" && organizationId && (
        <Section delay={0.2}>
          <EnergyReportTab organizationId={organizationId} />
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CARBON TAB                                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "carbon" && (
        <Section delay={0.2}>
          <CarbonReportTab
            monthly={monthly}
            totalAnnualKwh={summary?.total_annual_kwh ?? 0}
            floorAreaSqm={summary?.floor_area_sqm ?? 2800}
            decKwhPerSqm={summary?.dec_kwh_per_sqm ?? 0}
          />
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MILEAGE TAB                                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "mileage" && (
        <Section delay={0.2}>
          <MileageClaimsTab />
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MOM / YOY COMPARISON CHART                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {(mainTab === "combined" || mainTab === "electricity") &&
        momYoyData.chartData.length > 1 && (
          <Section delay={0.18}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header with MOM / YOY badges */}
              <div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-teal-500" />
                    Month-on-Month &amp; Year-on-Year Comparison
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Monthly kWh with previous year overlay
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {momYoyData.momPct !== null && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        momYoyData.momPct <= 0
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {momYoyData.momPct <= 0 ? (
                        <TrendingDown className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5" />
                      )}
                      {momYoyData.momPct <= 0 ? "" : "+"}
                      {momYoyData.momPct.toFixed(1)}% MOM
                    </span>
                  )}
                  {momYoyData.yoyPct !== null && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        momYoyData.yoyPct <= 0
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {momYoyData.yoyPct <= 0 ? (
                        <TrendingDown className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5" />
                      )}
                      {momYoyData.yoyPct <= 0 ? "" : "+"}
                      {momYoyData.yoyPct.toFixed(1)}% YOY
                    </span>
                  )}
                </div>
              </div>

              {/* ComposedChart: Bars for current year, Line for previous year */}
              <div className="px-3 pb-4" style={{ height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={momYoyData.chartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="momBarGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#00D4D4"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="95%"
                          stopColor="#00D4D4"
                          stopOpacity={0.4}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                      className="dark:opacity-20"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickLine={false}
                      axisLine={false}
                      width={50}
                      label={{
                        value: "kWh",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          fontSize: 11,
                          fill: "#9ca3af",
                          textAnchor: "middle",
                        },
                      }}
                    />
                    <Tooltip content={<MomYoyTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    <Bar
                      dataKey="kwh"
                      name="This Year"
                      fill="url(#momBarGradient)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="prevYearKwh"
                      name="Previous Year"
                      stroke="#94a3b8"
                      strokeWidth={2.5}
                      strokeDasharray="6 3"
                      dot={{
                        r: 4,
                        fill: "#94a3b8",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#94a3b8",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      animationDuration={2000}
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Summary strip */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ background: "#00D4D4" }}
                  />
                  Current year monthly total
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0 border-t-2 border-dashed border-slate-400" />
                  Same month previous year
                </span>
                {momYoyData.chartData.length > 0 && (
                  <span className="ml-auto font-medium text-gray-700 dark:text-gray-300">
                    Latest:{" "}
                    {fmtNumber(
                      momYoyData.chartData[momYoyData.chartData.length - 1].kwh,
                    )}{" "}
                    kWh
                  </span>
                )}
              </div>
            </div>
          </Section>
        )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO CHART — 13-Month Daily Electricity Consumption          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab !== "reports" &&
        mainTab !== "gas" &&
        mainTab !== "carbon" &&
        mainTab !== "mileage" &&
        dailyChartData.length > 0 && (
          <Section delay={0.2}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Chart header with controls */}
              <div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Electricity Consumption
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    13-month trend with 7-day moving average
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* View toggle */}
                  <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
                    {(
                      [
                        ["daily", "Daily"],
                        ["weekly", "Weekly"],
                        ["monthly", "Monthly"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setTrendView(key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          trendView === key
                            ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {/* Overlay toggles */}
                  <button
                    onClick={() => setShowHolidayOverlay(!showHolidayOverlay)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      showHolidayOverlay
                        ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                        : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Holidays
                  </button>
                  {trendView === "daily" && (
                    <button
                      onClick={() => setShowMovingAvg(!showMovingAvg)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        showMovingAvg
                          ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300"
                          : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      7-day avg
                    </button>
                  )}
                </div>
              </div>

              {/* Main chart */}
              <div className="px-3 pb-4" style={{ height: 420 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {trendView === "daily" ? (
                    <ComposedChart
                      data={dailyChartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="dailyGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#00D4D4"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#00D4D4"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                        className="dark:opacity-20"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return d.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          });
                        }}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        interval={Math.max(
                          Math.floor(dailyChartData.length / 14),
                          1,
                        )}
                        minTickGap={40}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}`}
                        width={45}
                        label={{
                          value: "kWh",
                          angle: -90,
                          position: "insideLeft",
                          style: {
                            fontSize: 11,
                            fill: "#9ca3af",
                            textAnchor: "middle",
                          },
                        }}
                      />
                      <Tooltip content={<DailyTrendTooltip />} />

                      {/* Holiday overlay bands */}
                      {showHolidayOverlay &&
                        dailyTrend?.holidays?.map((h, i) => (
                          <ReferenceArea
                            key={`hol-${i}`}
                            x1={h.start}
                            x2={h.end}
                            fill="#a855f7"
                            fillOpacity={0.08}
                            stroke="#a855f7"
                            strokeOpacity={0.15}
                            strokeDasharray="4 4"
                            label={{
                              value: h.name,
                              position: "insideTopLeft",
                              style: {
                                fontSize: 10,
                                fill: "#a855f7",
                                fontWeight: 500,
                              },
                            }}
                          />
                        ))}

                      {/* Daily area */}
                      <Area
                        type="monotone"
                        dataKey="kwh"
                        stroke="#00D4D4"
                        strokeWidth={1.5}
                        fill="url(#dailyGradient)"
                        animationDuration={2000}
                        animationEasing="ease-out"
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: "#00D4D4",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />

                      {/* 7-day moving average line */}
                      {showMovingAvg && (
                        <Line
                          type="monotone"
                          dataKey="movingAvg"
                          stroke="#06b6d4"
                          strokeWidth={2.5}
                          dot={false}
                          strokeDasharray=""
                          animationDuration={2500}
                          animationEasing="ease-out"
                          name="7-day avg"
                        />
                      )}
                    </ComposedChart>
                  ) : trendView === "weekly" ? (
                    <BarChart
                      data={weeklyChartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="weeklyGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#00D4D4"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="95%"
                            stopColor="#00D4D4"
                            stopOpacity={0.5}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                        className="dark:opacity-20"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return d.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          });
                        }}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        interval={Math.floor(weeklyChartData.length / 12)}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        label={{
                          value: "kWh/week",
                          angle: -90,
                          position: "insideLeft",
                          style: {
                            fontSize: 11,
                            fill: "#9ca3af",
                            textAnchor: "middle",
                          },
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0]?.payload;
                          return (
                            <div className="bg-slate-900 text-white rounded-lg px-4 py-3 shadow-2xl border border-slate-700 text-sm">
                              <p className="font-semibold text-teal-300">
                                w/c {d.label}
                              </p>
                              <p className="mt-1">
                                <span className="text-lg font-bold">
                                  {fmtNumber(d.kwh)}
                                </span>{" "}
                                <span className="text-slate-400">
                                  kWh total
                                </span>
                              </p>
                              <p className="text-xs text-slate-400">
                                {d.avgDaily} kWh/day avg
                              </p>
                            </div>
                          );
                        }}
                      />

                      {showHolidayOverlay &&
                        dailyTrend?.holidays?.map((h, i) => (
                          <ReferenceArea
                            key={`hol-w-${i}`}
                            x1={h.start}
                            x2={h.end}
                            fill="#a855f7"
                            fillOpacity={0.08}
                            stroke="#a855f7"
                            strokeOpacity={0.15}
                          />
                        ))}

                      <Bar
                        dataKey="kwh"
                        fill="url(#weeklyGradient)"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  ) : (
                    <ComposedChart
                      data={monthlyChartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="elecGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#facc15"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#facc15"
                            stopOpacity={0.3}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gasGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#fb923c"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#fb923c"
                            stopOpacity={0.3}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                        className="dark:opacity-20"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        label={{
                          value: "kWh",
                          angle: -90,
                          position: "insideLeft",
                          style: {
                            fontSize: 11,
                            fill: "#9ca3af",
                            textAnchor: "middle",
                          },
                        }}
                      />
                      <Tooltip content={<MonthlyTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      />
                      <Bar
                        dataKey="electricity"
                        name="Electricity"
                        fill="url(#elecGradient)"
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                        animationDuration={1500}
                      />
                      <Bar
                        dataKey="gas"
                        name="Gas"
                        fill="url(#gasGradient)"
                        radius={[4, 4, 0, 0]}
                        stackId="a"
                        animationDuration={1500}
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Chart legend / summary strip */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                {trendView === "daily" && (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-teal-500 rounded" />
                      Daily consumption
                    </span>
                    {showMovingAvg && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-cyan-500 rounded" />
                        7-day moving average
                      </span>
                    )}
                    {showHolidayOverlay && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-purple-500/20 border border-purple-300 rounded-sm" />
                        School holidays
                      </span>
                    )}
                  </>
                )}
                {dailyChartData.length > 0 && (
                  <>
                    <span className="ml-auto font-medium text-gray-700 dark:text-gray-300">
                      Avg:{" "}
                      {Math.round(
                        dailyChartData.reduce((s, d) => s + d.kwh, 0) /
                          dailyChartData.length,
                      )}{" "}
                      kWh/day
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Peak:{" "}
                      {Math.round(
                        Math.max(...dailyChartData.map((d) => d.kwh)),
                      )}{" "}
                      kWh
                    </span>
                  </>
                )}
              </div>
            </div>
          </Section>
        )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DEC RATING + METERS ROW                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab !== "reports" &&
        mainTab !== "carbon" &&
        mainTab !== "mileage" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* DEC Rating */}
            {summary && decBand && (
              <Section delay={0.3}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-full">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    DEC Rating
                  </h2>
                  <div className="flex items-center gap-5">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: 0.4,
                      }}
                      className={`w-20 h-20 rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-lg ${decBand.colour}`}
                    >
                      {summary.dec_rating}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex gap-0.5 mb-3">
                        {DEC_BANDS.map((band) => {
                          const isActive = band.rating === summary.dec_rating;
                          return (
                            <div
                              key={band.rating}
                              className={`flex-1 h-7 flex items-center justify-center text-[10px] font-bold text-white rounded transition-all ${band.colour} ${
                                isActive
                                  ? "ring-2 ring-offset-1 ring-gray-800 dark:ring-white dark:ring-offset-slate-900 scale-110 shadow-md"
                                  : "opacity-35"
                              }`}
                            >
                              {band.rating}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {fmtNumber(Math.round(summary.dec_kwh_per_sqm))} kWh/m
                          {"\u00b2"}
                        </span>
                        /yr
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtNumber(summary.floor_area_sqm)} m{"\u00b2"} floor
                        area
                      </p>
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {/* Meters */}
            <Section delay={0.35} className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-full">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  Registered Meters
                </h2>
                {meters.length === 0 ? (
                  <div className="text-center py-8">
                    <Zap className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      No meters registered yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {meters.map((meter, idx) => {
                      const Icon = METER_ICONS[meter.meter_type] ?? Zap;
                      const colour =
                        METER_COLOURS[meter.meter_type] ?? "text-gray-500";
                      const bgStyle =
                        METER_BG[meter.meter_type] ??
                        "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700";
                      return (
                        <motion.div
                          key={meter.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + idx * 0.05 }}
                          className={`relative rounded-xl border p-4 transition-all hover:shadow-md ${bgStyle}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 ${colour}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {meter.label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {meter.location}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {fmtNumber(meter.latest_reading)}
                                <span className="text-xs text-gray-400 font-normal ml-1">
                                  {meter.unit}
                                </span>
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {meter.latest_date}
                              </p>
                            </div>
                            <div className="text-right">
                              {meter.monthly_cost !== 0 && (
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                  {fmtGBP(Math.abs(meter.monthly_cost))}
                                  <span className="font-normal text-gray-400">
                                    /mo
                                  </span>
                                </p>
                              )}
                              <button
                                onClick={() => {
                                  setShowMeterReader(true);
                                  setSelectedMeterId(meter.id);
                                }}
                                className="mt-1 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-md hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                              >
                                <Camera className="h-2.5 w-2.5" />
                                Reading
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SMART METER READER                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showMeterReader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-teal-200 dark:border-teal-800 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Camera className="h-5 w-5 text-teal-600" />
                  Smart Meter Reading
                </h2>
                <button
                  onClick={() => {
                    setShowMeterReader(false);
                    setMeterImage(null);
                    setMeterImagePreview(null);
                    setMeterReadingResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload area */}
                <div>
                  {!meterImagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 dark:hover:border-teal-600 transition-colors group"
                    >
                      <div className="w-16 h-16 mx-auto rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="h-8 w-8 text-teal-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Take a photo or upload meter image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG, HEIC supported. AI will read the display.
                      </p>
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium">
                          <Camera className="h-3.5 w-3.5" />
                          Camera
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">
                          <Upload className="h-3.5 w-3.5" />
                          Upload
                        </span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileSelect(f);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={meterImagePreview}
                        alt="Meter"
                        className="w-full h-64 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        onClick={() => {
                          setMeterImage(null);
                          setMeterImagePreview(null);
                          setMeterReadingResult(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {!meterReadingResult && !meterReadingLoading && (
                        <button
                          onClick={handleAnalyzeImage}
                          className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium shadow-lg"
                        >
                          <Eye className="h-4 w-4" />
                          Analyze Reading
                        </button>
                      )}
                      {meterReadingLoading && (
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg px-5 py-3 shadow-xl">
                            <div className="h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium">
                              Reading meter...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Result area */}
                <div className="flex flex-col justify-center">
                  {!meterReadingResult && !meterReadingLoading && (
                    <div className="text-center py-8">
                      <Thermometer className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">
                        Upload a meter photo and we will extract the reading
                        using AI
                      </p>
                    </div>
                  )}
                  {meterReadingResult && (
                    <div className="space-y-4">
                      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-5">
                        <p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
                          AI Reading Result
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {fmtNumber(meterReadingResult.reading_value)}
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            {meterReadingResult.unit}
                          </span>
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`h-2 w-2 rounded-full ${meterReadingResult.confidence > 0.9 ? "bg-green-500" : meterReadingResult.confidence > 0.7 ? "bg-yellow-500" : "bg-red-500"}`}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {fmtPct(meterReadingResult.confidence * 100)}{" "}
                              confidence
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          Confirm Meter
                        </label>
                        <select
                          value={selectedMeterId}
                          onChange={(e) => setSelectedMeterId(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Select meter...</option>
                          {meters.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label} ({m.location})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleSubmitMeterReading}
                        disabled={!selectedMeterId || meterReadingSubmitting}
                        className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {meterReadingSubmitting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : meterReadingSuccess ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Reading Saved
                          </>
                        ) : (
                          <>
                            <FileCheck className="h-4 w-4" />
                            Submit Reading
                          </>
                        )}
                      </button>
                      {meterReadingSuccess &&
                        selectedMeterId &&
                        meterReadingResult && (
                          <button
                            onClick={() =>
                              handleSendToSupplier(
                                selectedMeterId,
                                meterReadingResult.reading_value,
                              )
                            }
                            disabled={supplierEmailLoading || supplierEmailSent}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                          >
                            {supplierEmailLoading ? (
                              <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Sending to supplier...
                              </>
                            ) : supplierEmailSent ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Email sent to supplier
                              </>
                            ) : (
                              <>
                                <Activity className="h-4 w-4" />
                                Send Reading to Supplier
                              </>
                            )}
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Add Reading Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Manual Meter Reading
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={handleAddReading}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Meter
                  </label>
                  <select
                    value={formMeterId}
                    onChange={(e) => setFormMeterId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select meter...</option>
                    {meters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Reading (kWh / m{"\u00b3"})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    required
                    placeholder="e.g. 84500"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Cost ({"\u00a3"}){" "}
                    <span className="text-gray-400">optional</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    placeholder="e.g. 2847.50"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formSubmitting ? (
                      "Saving..."
                    ) : formSuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Saved
                      </>
                    ) : (
                      "Save Reading"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HALF-HOURLY ANALYSIS (Electricity tab or Combined)           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {hhAnalysis && (mainTab === "electricity" || mainTab === "combined") && (
        <Section delay={0.4}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-teal-500" />
                  Half-Hourly Analysis
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Detailed consumption patterns from smart meter data
                </p>
              </div>
              <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
                {(
                  [
                    ["profile", "Profile"],
                    ["heatmap", "Heatmap"],
                    ["baseload", "Baseload"],
                    ["anomalies", "Anomalies"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setHHTab(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      hhTab === key
                        ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 pb-4">
              {/* HH Profile — Weekday vs Weekend area chart */}
              {hhTab === "profile" && hhProfileData.length > 0 && (
                <div style={{ height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={hhProfileData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="weekdayFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#00D4D4"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#00D4D4"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="weekendFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#a855f7"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#a855f7"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                        className="dark:opacity-20"
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        interval={3}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                        label={{
                          value: "kWh",
                          angle: -90,
                          position: "insideLeft",
                          style: {
                            fontSize: 11,
                            fill: "#9ca3af",
                            textAnchor: "middle",
                          },
                        }}
                      />
                      <Tooltip content={<HHProfileTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      />

                      {/* School hours reference */}
                      <ReferenceArea
                        x1="08:30"
                        x2="15:30"
                        fill="#00D4D4"
                        fillOpacity={0.04}
                        label={{
                          value: "School hours",
                          position: "insideTopRight",
                          style: { fontSize: 10, fill: "#9ca3af" },
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="weekday"
                        name="Weekday"
                        stroke="#00D4D4"
                        strokeWidth={2.5}
                        fill="url(#weekdayFill)"
                        animationDuration={2000}
                        animationEasing="ease-out"
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: "#00D4D4",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="weekend"
                        name="Weekend"
                        stroke="#a855f7"
                        strokeWidth={2}
                        fill="url(#weekendFill)"
                        strokeDasharray="6 3"
                        animationDuration={2500}
                        animationEasing="ease-out"
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: "#a855f7",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Heatmap */}
              {hhTab === "heatmap" &&
                hhAnalysis.day_of_week_profile.length > 0 && (
                  <div className="px-3 py-2">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-[10px]">
                        <thead>
                          <tr>
                            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-1 pb-2 w-12">
                              Day
                            </th>
                            {Array.from({ length: 24 }, (_, h) => (
                              <th
                                key={h}
                                colSpan={2}
                                className="text-center font-normal text-gray-400 px-0 pb-2"
                              >
                                {String(h).padStart(2, "0")}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {hhAnalysis.day_of_week_profile.map((dayData) => (
                            <tr key={dayData.day}>
                              <td className="text-xs font-semibold text-gray-700 dark:text-gray-300 px-1 py-0.5">
                                {dayData.day}
                              </td>
                              {dayData.slots.map((slot, i) => (
                                <td
                                  key={i}
                                  className="px-0 py-0.5"
                                  title={`${dayData.day} ${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")} — ${slot.kwh.toFixed(1)} kWh`}
                                >
                                  <div
                                    className="w-full h-6 rounded-[2px] transition-colors"
                                    style={{
                                      backgroundColor: heatColor(
                                        slot.kwh,
                                        hhHeatmapMax,
                                      ),
                                      minWidth: 14,
                                    }}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>Low</span>
                      <div className="flex gap-0.5">
                        {[0.1, 0.3, 0.5, 0.7, 0.9].map((r) => (
                          <div
                            key={r}
                            className="w-5 h-3 rounded-sm"
                            style={{
                              backgroundColor: heatColor(
                                r * hhHeatmapMax,
                                hhHeatmapMax,
                              ),
                            }}
                          />
                        ))}
                      </div>
                      <span>High</span>
                      <span className="ml-2 text-gray-400">
                        Max: {hhHeatmapMax.toFixed(1)} kWh
                      </span>
                    </div>
                  </div>
                )}

              {/* Baseload */}
              {hhTab === "baseload" && (
                <div className="px-3 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Term vs Holiday */}
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-teal-100 dark:border-teal-800">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        Term vs Holiday
                      </h3>
                      <div className="flex items-end gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Term time</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {fmtNumber(hhAnalysis.term_vs_holiday.term_avg_kwh)}
                          </p>
                          <p className="text-xs text-gray-400">kWh/day avg</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Holidays</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {fmtNumber(
                              hhAnalysis.term_vs_holiday.holiday_avg_kwh,
                            )}
                          </p>
                          <p className="text-xs text-gray-400">kWh/day avg</p>
                        </div>
                        {hhAnalysis.term_vs_holiday.savings_potential > 0 && (
                          <div className="ml-auto text-right">
                            <p className="text-xs text-green-600">
                              Potential saving
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              {fmtGBP(
                                hhAnalysis.term_vs_holiday.savings_potential,
                              )}
                              /yr
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Baseload breakdown */}
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Moon className="h-4 w-4 text-blue-500" />
                        Overnight Baseload
                      </h3>
                      <div className="space-y-3">
                        {hhAnalysis.baseload_analysis.map((b) => (
                          <div key={b.meter_id}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {b.meter_label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {b.baseload_pct.toFixed(0)}% of daytime
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(b.baseload_pct, 100)}%`,
                                }}
                                transition={{
                                  duration: 1.5,
                                  ease: "easeOut",
                                }}
                                className={`h-full rounded-full ${
                                  b.baseload_pct > 40
                                    ? "bg-red-500"
                                    : b.baseload_pct > 25
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                              <span>
                                Night: {b.overnight_kwh.toFixed(1)} kWh
                              </span>
                              <span>Day: {b.daytime_kwh.toFixed(1)} kWh</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Anomalies */}
              {hhTab === "anomalies" && (
                <div className="px-3 py-4 space-y-3">
                  {anomalies.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No anomalies detected
                      </p>
                    </div>
                  ) : (
                    anomalies.map((a, i) => {
                      const style =
                        SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.low;
                      const badge =
                        STATUS_BADGES[a.status] ?? STATUS_BADGES.detected;
                      return (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`rounded-xl border p-4 ${style.border} ${style.bg}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {a.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                  {a.description}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs">
                                  <span className="text-gray-400">
                                    {a.detected_date}
                                  </span>
                                  {a.estimated_annual_cost > 0 && (
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                      {fmtGBP(a.estimated_annual_cost)}/yr waste
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* GAS TAB — Monthly gas consumption                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "gas" && monthlyChartData.length > 0 && (
        <Section delay={0.2}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Gas Consumption
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Monthly invoice data — gas meters are read monthly/quarterly (no
                half-hourly data)
              </p>
            </div>
            <div className="px-3 pb-4" style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyChartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="gasOnlyGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#fb923c"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                    className="dark:opacity-20"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    label={{
                      value: "kWh",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        fontSize: 11,
                        fill: "#9ca3af",
                        textAnchor: "middle",
                      },
                    }}
                  />
                  <Tooltip content={<MonthlyTooltip />} />
                  <Bar
                    dataKey="gas"
                    name="Gas"
                    fill="url(#gasOnlyGradient)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="gas"
                    stroke="#ea580c"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={2000}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Gas summary strip */}
            <div className="px-6 py-3 bg-orange-50 dark:bg-orange-900/10 border-t border-orange-100 dark:border-orange-900 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Total gas:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {fmtNumber(monthlyChartData.reduce((s, m) => s + m.gas, 0))}{" "}
                  kWh
                </span>
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Monthly avg:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {fmtNumber(
                    monthlyChartData.reduce((s, m) => s + m.gas, 0) /
                      Math.max(monthlyChartData.length, 1),
                  )}{" "}
                  kWh
                </span>
              </span>
              <span className="text-orange-600 dark:text-orange-400 ml-auto flex items-center gap-1">
                <Info className="h-3 w-3" />
                Gas is billed monthly — no half-hourly smart meter data
                available
              </span>
            </div>
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MONTHLY COMPARISON (fallback if no daily trend data)         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab !== "reports" &&
        mainTab !== "carbon" &&
        mainTab !== "mileage" &&
        !dailyChartData.length &&
        monthlyChartData.length > 0 && (
          <Section delay={0.2}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 pt-5 pb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal-500" />
                  Monthly Consumption
                </h2>
              </div>
              <div className="px-3 pb-4" style={{ height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={monthlyChartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="elecGradientFallback"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#facc15"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#facc15"
                          stopOpacity={0.3}
                        />
                      </linearGradient>
                      <linearGradient
                        id="gasGradientFallback"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#fb923c"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#fb923c"
                          stopOpacity={0.3}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                      className="dark:opacity-20"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickLine={false}
                      axisLine={false}
                      width={50}
                    />
                    <Tooltip content={<MonthlyTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    <Bar
                      dataKey="electricity"
                      name="Electricity"
                      fill="url(#elecGradientFallback)"
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                      animationDuration={1500}
                    />
                    <Bar
                      dataKey="gas"
                      name="Gas"
                      fill="url(#gasGradientFallback)"
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                      animationDuration={1500}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Section>
        )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SCHOOL EVENTS CONTEXT                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab !== "reports" &&
        mainTab !== "carbon" &&
        mainTab !== "mileage" &&
        dailyTrend?.school_events &&
        dailyTrend.school_events.length > 0 && (
          <Section delay={0.5}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                School Events Context
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                These events may explain usage anomalies — extra heating,
                lighting or equipment use outside normal hours.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dailyTrend.school_events.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-lg p-3"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.name}
                    </p>
                    {event.days && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.days.join(", ")}{" "}
                        {event.time && `| ${event.time}`}
                      </p>
                    )}
                    {event.start && event.end && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.start} to {event.end}{" "}
                        {event.time && `| ${event.time}`}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>
        )}
    </div>
  );
}
