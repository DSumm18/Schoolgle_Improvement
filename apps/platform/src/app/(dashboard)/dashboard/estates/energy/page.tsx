"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Flame,
  Droplets,
  Wind,
  AlertTriangle,
  TrendingDown,
  Plus,
  BarChart3,
  Leaf,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";
import {
  ModulePageHeader,
  getModuleColors,
} from "@/components/ui/module-page-header";

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
}

interface MonthlyConsumption {
  month: string;
  electricity: number;
  gas: number;
}

interface Summary {
  total_monthly_cost: number;
  total_monthly_kwh: number;
  co2_tonnes: number;
  anomaly_count: number;
  floor_area_sqm: number;
  dec_kwh_per_sqm: number;
  dec_rating: string;
}

interface Anomaly {
  id: string;
  anomaly_type: string;
  title: string;
  description: string;
  detected_date: string;
  estimated_waste_kwh: number;
  estimated_waste_cost: number;
  estimated_annual_cost: number;
  meter_id: string;
  status: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const CARBON_FACTORS = {
  electricity: 0.233, // kgCO2/kWh (DESNZ 2025)
  gas: 0.184,
};

const DEC_BANDS: { rating: string; maxKwhPerSqm: number; colour: string }[] = [
  { rating: "A", maxKwhPerSqm: 25, colour: "bg-green-600" },
  { rating: "B", maxKwhPerSqm: 50, colour: "bg-green-500" },
  { rating: "C", maxKwhPerSqm: 75, colour: "bg-yellow-400" },
  { rating: "D", maxKwhPerSqm: 100, colour: "bg-yellow-500" },
  { rating: "E", maxKwhPerSqm: 125, colour: "bg-orange-400" },
  { rating: "F", maxKwhPerSqm: 150, colour: "bg-orange-500" },
  { rating: "G", maxKwhPerSqm: Infinity, colour: "bg-red-500" },
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

const ANOMALY_ICONS: Record<string, typeof AlertTriangle> = {
  weekend_usage: AlertTriangle,
  overnight_excess: TrendingDown,
  holiday_heating: Flame,
  baseload_increase: Search,
  spike: Zap,
  unusual_pattern: Info,
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
  return new Intl.NumberFormat("en-GB").format(n);
}

function getDECBand(kwhPerSqm: number) {
  return DEC_BANDS.find((b) => kwhPerSqm <= b.maxKwhPerSqm) ?? DEC_BANDS[6];
}

// ─── Page ────────────────────────────────────────────────────────────

export default function EnergyDashboardPage() {
  const colors = getModuleColors("estates");

  const [meters, setMeters] = useState<Meter[]>([]);
  const [monthly, setMonthly] = useState<MonthlyConsumption[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);

  // Add reading form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formMeterId, setFormMeterId] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formValue, setFormValue] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const [anomalyExpanded, setAnomalyExpanded] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [energyRes, anomalyRes] = await Promise.all([
        fetch("/api/estates/energy"),
        fetch("/api/estates/energy/anomalies"),
      ]);
      const energyData = await energyRes.json();
      const anomalyData = await anomalyRes.json();

      setMeters(energyData.meters ?? []);
      setMonthly(energyData.monthly_consumption ?? []);
      setSummary(energyData.summary ?? null);
      setIsDemo(energyData.demo === true);
      setAnomalies(anomalyData.anomalies ?? []);
    } catch {
      // If API not available, page shows empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddReading(e: React.FormEvent) {
    e.preventDefault();
    if (!formMeterId || !formValue) return;
    setFormSubmitting(true);
    try {
      await fetch("/api/estates/energy", {
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
    } catch {
      // silent in demo
    } finally {
      setFormSubmitting(false);
    }
  }

  const maxConsumption = Math.max(
    ...monthly.map((m) => m.electricity + m.gas),
    1,
  );
  const decBand = summary ? getDECBand(summary.dec_kwh_per_sqm) : null;
  const totalAnnualWaste = anomalies.reduce(
    (s, a) => s + (a.estimated_annual_cost ?? 0),
    0,
  );

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"
              />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <ModulePageHeader
          moduleId="estates"
          icon={Zap}
          label="Estates Management"
          title="Energy & Utilities"
          description="Monitor consumption, costs, anomalies and carbon footprint"
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Reading
        </button>
      </div>

      {/* ─── Demo Banner ─────────────────────────────────────── */}
      {isDemo && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300">
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
        </div>
      )}

      {/* ─── Summary Cards ───────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={
              <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            }
            label="Monthly Cost"
            value={fmtGBP(summary.total_monthly_cost)}
            sub="All utilities combined"
            accent="border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20"
          />
          <SummaryCard
            icon={
              <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            }
            label="kWh This Month"
            value={fmtNumber(summary.total_monthly_kwh)}
            sub="Electricity + gas"
            accent="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
          />
          <SummaryCard
            icon={
              <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
            }
            label={`CO\u2082 This Month`}
            value={`${summary.co2_tonnes.toFixed(2)} t`}
            sub={`Elec: ${CARBON_FACTORS.electricity} | Gas: ${CARBON_FACTORS.gas} kgCO\u2082/kWh`}
            accent="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
          />
          <SummaryCard
            icon={
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            }
            label="Anomalies"
            value={String(summary.anomaly_count)}
            sub={
              totalAnnualWaste > 0
                ? `Est. ${fmtGBP(totalAnnualWaste)}/yr waste`
                : "No waste detected"
            }
            accent="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
          />
        </div>
      )}

      {/* ─── DEC Rating ──────────────────────────────────────── */}
      {summary && decBand && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Display Energy Certificate (DEC) Rating Indicator
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold ${decBand.colour}`}
              >
                {summary.dec_rating}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current
              </span>
            </div>
            <div className="flex-1">
              <div className="flex gap-1 mb-2">
                {DEC_BANDS.map((band) => (
                  <div
                    key={band.rating}
                    className={`flex-1 h-7 flex items-center justify-center text-xs font-bold text-white rounded ${band.colour} ${
                      band.rating === summary.dec_rating
                        ? "ring-2 ring-offset-1 ring-gray-800 dark:ring-white dark:ring-offset-slate-900"
                        : "opacity-50"
                    }`}
                  >
                    {band.rating}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {fmtNumber(Math.round(summary.dec_kwh_per_sqm))} kWh/m{"\u00b2"}
                /year across {fmtNumber(summary.floor_area_sqm)} m{"\u00b2"}{" "}
                floor area. Schools typically range C to E.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Meters ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Registered Meters
        </h2>
        {meters.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No meters registered yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {meters.map((meter) => {
              const Icon = METER_ICONS[meter.meter_type] ?? Zap;
              const colour = METER_COLOURS[meter.meter_type] ?? "text-gray-500";
              return (
                <div
                  key={meter.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                >
                  <div className={`mt-0.5 ${colour}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {meter.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {meter.location}
                    </p>
                    <div className="flex items-baseline gap-4 mt-1">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {fmtNumber(meter.latest_reading)}{" "}
                        <span className="text-xs text-gray-400 font-normal">
                          {meter.unit}
                        </span>
                      </span>
                      {meter.monthly_cost !== 0 && (
                        <span
                          className={`text-sm font-medium ${
                            meter.monthly_cost < 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {meter.monthly_cost < 0 ? "Saves " : ""}
                          {fmtGBP(Math.abs(meter.monthly_cost))}/mo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last read: {meter.latest_date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Add Reading Form ────────────────────────────────── */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Meter Reading
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
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
      )}

      {/* ─── Monthly Consumption Chart ───────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Monthly Consumption (Last 12 Months)
        </h2>
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded bg-yellow-400 inline-block" />
            Electricity (kWh)
          </span>
          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded bg-orange-400 inline-block" />
            Gas (kWh)
          </span>
        </div>
        {monthly.length > 0 ? (
          <div className="flex items-end gap-1.5" style={{ height: "200px" }}>
            {monthly.map((m) => {
              const total = m.electricity + m.gas;
              const elecPct = (m.electricity / maxConsumption) * 100;
              const gasPct = (m.gas / maxConsumption) * 100;
              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center group"
                  style={{ height: "100%" }}
                >
                  <div className="w-full flex flex-col justify-end flex-1">
                    <div
                      className="w-full bg-yellow-400 dark:bg-yellow-500 rounded-t transition-all group-hover:bg-yellow-500 dark:group-hover:bg-yellow-400"
                      style={{ height: `${elecPct}%` }}
                      title={`Electricity: ${fmtNumber(m.electricity)} kWh`}
                    />
                    <div
                      className="w-full bg-orange-400 dark:bg-orange-500 rounded-b transition-all group-hover:bg-orange-500 dark:group-hover:bg-orange-400"
                      style={{ height: `${gasPct}%` }}
                      title={`Gas: ${fmtNumber(m.gas)} kWh`}
                    />
                  </div>
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                    {fmtNumber(total)} kWh
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 whitespace-nowrap">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">
            No consumption data yet.
          </p>
        )}
      </div>

      {/* ─── Anomalies ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setAnomalyExpanded(!anomalyExpanded)}
          className="w-full flex items-center justify-between p-5"
        >
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Anomalies &amp; Waste Detection
            {anomalies.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold">
                {anomalies.length}
              </span>
            )}
          </h2>
          {anomalyExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {anomalyExpanded && (
          <div className="px-5 pb-5 space-y-3">
            {totalAnnualWaste > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                <TrendingDown className="h-4 w-4 flex-shrink-0" />
                Estimated total annual waste:{" "}
                <span className="font-bold">{fmtGBP(totalAnnualWaste)}</span>
              </div>
            )}

            {anomalies.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No anomalies detected. Looking good!
              </p>
            ) : (
              anomalies.map((anomaly) => {
                const AIcon =
                  ANOMALY_ICONS[anomaly.anomaly_type] ?? AlertTriangle;
                const badge =
                  STATUS_BADGES[anomaly.status] ?? STATUS_BADGES.detected;
                return (
                  <div
                    key={anomaly.id}
                    className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                  >
                    <div className="text-red-400 mt-0.5 flex-shrink-0">
                      <AIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {anomaly.title}
                        </p>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {anomaly.description}
                      </p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          Date:{" "}
                          <span className="font-medium">
                            {anomaly.detected_date}
                          </span>
                        </span>
                        {anomaly.estimated_waste_kwh > 0 && (
                          <span>
                            Waste:{" "}
                            <span className="font-medium">
                              {fmtNumber(anomaly.estimated_waste_kwh)} kWh
                            </span>
                          </span>
                        )}
                        <span>
                          Cost:{" "}
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {fmtGBP(anomaly.estimated_waste_cost)}
                          </span>
                        </span>
                        <span>
                          Annual est:{" "}
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {fmtGBP(anomaly.estimated_annual_cost)}/yr
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ─── Carbon Conversion Reference ─────────────────────── */}
      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">
          Carbon conversion factors (UK 2025)
        </p>
        <div className="flex flex-wrap gap-6">
          <span>
            Electricity:{" "}
            <span className="font-mono">{CARBON_FACTORS.electricity}</span> kgCO
            {"\u2082"}/kWh
          </span>
          <span>
            Gas: <span className="font-mono">{CARBON_FACTORS.gas}</span> kgCO
            {"\u2082"}/kWh
          </span>
          <span>Source: DESNZ GHG Conversion Factors 2025</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
