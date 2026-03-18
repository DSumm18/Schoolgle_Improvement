"use client";

import { useMemo } from "react";
import {
  Leaf,
  Factory,
  Zap,
  Flame,
  TrendingDown,
  TrendingUp,
  Info,
  Award,
  Target,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────

interface MonthlyConsumption {
  month: string;
  electricity: number;
  gas: number;
  is_holiday?: boolean;
}

interface CarbonReportTabProps {
  monthly: MonthlyConsumption[];
  totalAnnualKwh: number;
  floorAreaSqm: number;
  decKwhPerSqm: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const CARBON_FACTORS = {
  electricity: 0.23314, // kgCO2e/kWh — DESNZ 2025
  gas: 0.18316, // kgCO2e/kWh — DESNZ 2025
  electricity_td: 0.01879, // Transmission & distribution losses
};

const PUPILS = 420;
const DEFAULT_FLOOR_AREA = 2800; // m² GIA

const DEC_BANDS: {
  rating: string;
  maxKwhPerSqm: number;
  colour: string;
  bg: string;
  textColour: string;
}[] = [
  {
    rating: "A",
    maxKwhPerSqm: 25,
    colour: "bg-green-600",
    bg: "#16a34a",
    textColour: "text-white",
  },
  {
    rating: "B",
    maxKwhPerSqm: 50,
    colour: "bg-green-500",
    bg: "#22c55e",
    textColour: "text-white",
  },
  {
    rating: "C",
    maxKwhPerSqm: 75,
    colour: "bg-yellow-400",
    bg: "#facc15",
    textColour: "text-gray-900",
  },
  {
    rating: "D",
    maxKwhPerSqm: 100,
    colour: "bg-yellow-500",
    bg: "#eab308",
    textColour: "text-gray-900",
  },
  {
    rating: "E",
    maxKwhPerSqm: 125,
    colour: "bg-orange-400",
    bg: "#fb923c",
    textColour: "text-white",
  },
  {
    rating: "F",
    maxKwhPerSqm: 150,
    colour: "bg-orange-500",
    bg: "#f97316",
    textColour: "text-white",
  },
  {
    rating: "G",
    maxKwhPerSqm: Infinity,
    colour: "bg-red-500",
    bg: "#ef4444",
    textColour: "text-white",
  },
];

// UK government target: 78% reduction by 2035 from 1990 baseline
// Typical 1990 primary school: ~120 tCO2e
const BASELINE_1990_TCO2E = 120;
const TARGET_2035_REDUCTION = 0.78;
const TARGET_2035_TCO2E = BASELINE_1990_TCO2E * (1 - TARGET_2035_REDUCTION);

// ─── Helpers ─────────────────────────────────────────────────────────

function fmtNumber(n: number) {
  return new Intl.NumberFormat("en-GB").format(Math.round(n));
}

function getDECBand(kwhPerSqm: number) {
  return DEC_BANDS.find((b) => kwhPerSqm <= b.maxKwhPerSqm) ?? DEC_BANDS[6];
}

// ─── Custom Tooltips ─────────────────────────────────────────────────

function YearlyTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-4 py-3 shadow-2xl border border-slate-700 text-sm">
      <p className="font-semibold text-teal-300">{d.year}</p>
      <div className="mt-1.5 space-y-1">
        <p className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          Scope 1 (Gas): {d.scope1.toFixed(1)} tCO2e
        </p>
        <p className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          Scope 2 (Electricity): {d.scope2.toFixed(1)} tCO2e
        </p>
        <p className="text-xs text-slate-400 pt-1 border-t border-slate-700">
          Total: {d.total.toFixed(1)} tCO2e
        </p>
        {d.changePct !== null && (
          <p
            className={`text-xs ${d.changePct <= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {d.changePct <= 0 ? "" : "+"}
            {d.changePct.toFixed(1)}% vs previous year
          </p>
        )}
      </div>
    </div>
  );
}

function MonthlyTrendTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-4 py-3 shadow-2xl border border-slate-700 text-sm">
      <p className="font-semibold text-teal-300">{d.label}</p>
      <div className="mt-1.5 space-y-1">
        {d.scope1Current !== undefined && (
          <p className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            Scope 1: {d.scope1Current.toFixed(2)} tCO2e
          </p>
        )}
        {d.scope2Current !== undefined && (
          <p className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            Scope 2: {d.scope2Current.toFixed(2)} tCO2e
          </p>
        )}
        {d.scope1Prev !== undefined && d.scope1Prev > 0 && (
          <p className="text-xs text-slate-400 pt-1 border-t border-slate-700">
            Previous year total: {(d.scope1Prev + d.scope2Prev).toFixed(2)}{" "}
            tCO2e
          </p>
        )}
      </div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────

function CarbonKPI({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  subtitle,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  subtitle?: string;
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
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export function CarbonReportTab({
  monthly,
  totalAnnualKwh,
  floorAreaSqm,
  decKwhPerSqm,
}: CarbonReportTabProps) {
  const floor = floorAreaSqm || DEFAULT_FLOOR_AREA;

  // Calculate annual totals by fuel type
  const annualElecKwh = useMemo(
    () => monthly.reduce((s, m) => s + m.electricity, 0),
    [monthly],
  );
  const annualGasKwh = useMemo(
    () => monthly.reduce((s, m) => s + m.gas, 0),
    [monthly],
  );

  // Scope 1 & 2 calculations
  const scope1 = useMemo(
    () => (annualGasKwh * CARBON_FACTORS.gas) / 1000,
    [annualGasKwh],
  );
  const scope2 = useMemo(
    () =>
      (annualElecKwh *
        (CARBON_FACTORS.electricity + CARBON_FACTORS.electricity_td)) /
      1000,
    [annualElecKwh],
  );
  const totalCarbon = scope1 + scope2;
  const perPupil = totalCarbon / PUPILS;
  const perSqm = (totalCarbon * 1000) / floor; // kgCO2e/m²

  // Year-on-year data (group monthly by year)
  const yearlyData = useMemo(() => {
    const years: Record<string, { elec: number; gas: number }> = {};
    for (const m of monthly) {
      const year = m.month.split("-")[0];
      if (!years[year]) years[year] = { elec: 0, gas: 0 };
      years[year].elec += m.electricity;
      years[year].gas += m.gas;
    }
    const sortedYears = Object.keys(years).sort();
    return sortedYears.map((year, i) => {
      const s1 = (years[year].gas * CARBON_FACTORS.gas) / 1000;
      const s2 =
        (years[year].elec *
          (CARBON_FACTORS.electricity + CARBON_FACTORS.electricity_td)) /
        1000;
      const total = s1 + s2;
      let changePct: number | null = null;
      if (i > 0) {
        const prevYear = sortedYears[i - 1];
        const prevS1 = (years[prevYear].gas * CARBON_FACTORS.gas) / 1000;
        const prevS2 =
          (years[prevYear].elec *
            (CARBON_FACTORS.electricity + CARBON_FACTORS.electricity_td)) /
          1000;
        const prevTotal = prevS1 + prevS2;
        if (prevTotal > 0) changePct = ((total - prevTotal) / prevTotal) * 100;
      }
      return { year, scope1: s1, scope2: s2, total, changePct };
    });
  }, [monthly]);

  // Monthly carbon trend (current year vs previous year)
  const monthlyTrend = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const byYearMonth: Record<string, { elec: number; gas: number }> = {};
    for (const m of monthly) {
      byYearMonth[m.month] = { elec: m.electricity, gas: m.gas };
    }

    const years = [
      ...new Set(monthly.map((m) => m.month.split("-")[0])),
    ].sort();
    if (years.length === 0) return [];

    const currentYear = years[years.length - 1];
    const prevYear = years.length > 1 ? years[years.length - 2] : null;

    return monthNames.map((name, i) => {
      const monthNum = String(i + 1).padStart(2, "0");
      const curKey = `${currentYear}-${monthNum}`;
      const prevKey = prevYear ? `${prevYear}-${monthNum}` : null;

      const cur = byYearMonth[curKey];
      const prev = prevKey ? byYearMonth[prevKey] : null;

      return {
        label: name,
        scope1Current: cur ? (cur.gas * CARBON_FACTORS.gas) / 1000 : 0,
        scope2Current: cur
          ? (cur.elec *
              (CARBON_FACTORS.electricity + CARBON_FACTORS.electricity_td)) /
            1000
          : 0,
        scope1Prev: prev ? (prev.gas * CARBON_FACTORS.gas) / 1000 : 0,
        scope2Prev: prev
          ? (prev.elec *
              (CARBON_FACTORS.electricity + CARBON_FACTORS.electricity_td)) /
            1000
          : 0,
        totalCurrent: cur
          ? (cur.gas * CARBON_FACTORS.gas +
              cur.elec *
                (CARBON_FACTORS.electricity + CARBON_FACTORS.electricity_td)) /
            1000
          : 0,
        totalPrev: prev
          ? (prev.gas * CARBON_FACTORS.gas +
              prev.elec *
                (CARBON_FACTORS.electricity + CARBON_FACTORS.electricity_td)) /
            1000
          : 0,
      };
    });
  }, [monthly]);

  // DEC Rating
  const actualKwhPerSqm =
    decKwhPerSqm || (totalAnnualKwh > 0 ? totalAnnualKwh / floor : 0);
  const decBand = getDECBand(actualKwhPerSqm);

  return (
    <div className="space-y-6">
      {/* ═══ Scope 1 & 2 KPI Cards ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <CarbonKPI
            icon={<Flame className="h-5 w-5" />}
            iconBg="bg-orange-100 dark:bg-orange-900/30"
            iconColor="text-orange-600 dark:text-orange-400"
            label="Scope 1 (Direct)"
            value={`${scope1.toFixed(1)} tCO2e`}
            subtitle={`Gas: ${fmtNumber(annualGasKwh)} kWh`}
            delay={0}
          />
          <CarbonKPI
            icon={<Zap className="h-5 w-5" />}
            iconBg="bg-yellow-100 dark:bg-yellow-900/30"
            iconColor="text-yellow-600 dark:text-yellow-400"
            label="Scope 2 (Indirect)"
            value={`${scope2.toFixed(1)} tCO2e`}
            subtitle={`Electricity: ${fmtNumber(annualElecKwh)} kWh`}
            delay={0.05}
          />
          <CarbonKPI
            icon={<Leaf className="h-5 w-5" />}
            iconBg="bg-teal-100 dark:bg-teal-900/30"
            iconColor="text-teal-600 dark:text-teal-400"
            label="Total Footprint"
            value={`${totalCarbon.toFixed(1)} tCO2e`}
            subtitle="Annual carbon footprint"
            delay={0.1}
          />
          <CarbonKPI
            icon={<Target className="h-5 w-5" />}
            iconBg="bg-cyan-100 dark:bg-cyan-900/30"
            iconColor="text-cyan-600 dark:text-cyan-400"
            label="Per Pupil"
            value={`${(perPupil * 1000).toFixed(0)} kgCO2e`}
            subtitle={`${PUPILS} pupils on roll`}
            delay={0.15}
          />
          <CarbonKPI
            icon={<Factory className="h-5 w-5" />}
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
            label="Per m\u00B2"
            value={`${perSqm.toFixed(1)} kgCO2e`}
            subtitle={`${fmtNumber(floor)} m\u00B2 GIA`}
            delay={0.2}
          />
        </div>
      </motion.div>

      {/* ═══ Year-on-Year Comparison ═══ */}
      {yearlyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal-500" />
                  Year-on-Year Carbon Emissions
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Scope 1 + Scope 2 emissions by year (stacked)
                </p>
              </div>
              {yearlyData.length >= 2 && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const latest = yearlyData[yearlyData.length - 1];
                    if (latest.changePct === null) return null;
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          latest.changePct <= 0
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {latest.changePct <= 0 ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5" />
                        )}
                        {latest.changePct <= 0 ? "" : "+"}
                        {latest.changePct.toFixed(1)}% YOY
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="px-3 pb-4" style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearlyData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="scope1Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.9} />
                      <stop
                        offset="95%"
                        stopColor="#fb923c"
                        stopOpacity={0.5}
                      />
                    </linearGradient>
                    <linearGradient id="scope2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#facc15" stopOpacity={0.9} />
                      <stop
                        offset="95%"
                        stopColor="#facc15"
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
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    label={{
                      value: "tCO2e",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 11, fill: "#9ca3af" },
                    }}
                  />
                  <Tooltip content={<YearlyTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <ReferenceLine
                    y={TARGET_2035_TCO2E}
                    stroke="#14b8a6"
                    strokeDasharray="6 4"
                    strokeWidth={2}
                    label={{
                      value: `2035 Target: ${TARGET_2035_TCO2E.toFixed(1)}t`,
                      position: "right",
                      style: { fontSize: 10, fill: "#14b8a6", fontWeight: 600 },
                    }}
                  />
                  <Bar
                    dataKey="scope1"
                    name="Scope 1 (Gas)"
                    fill="url(#scope1Grad)"
                    stackId="carbon"
                    radius={[0, 0, 0, 0]}
                    animationDuration={1500}
                  />
                  <Bar
                    dataKey="scope2"
                    name="Scope 2 (Electricity)"
                    fill="url(#scope2Grad)"
                    stackId="carbon"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Monthly Carbon Trend ═══ */}
      {monthlyTrend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-teal-500" />
                Monthly Carbon Trend
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Scope 1 and Scope 2 emissions by month — current vs previous
                year
              </p>
            </div>
            <div className="px-3 pb-4" style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyTrend}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                    className="dark:opacity-20"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    label={{
                      value: "tCO2e",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 11, fill: "#9ca3af" },
                    }}
                  />
                  <Tooltip content={<MonthlyTrendTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scope1Current"
                    name="Scope 1 (Current Year)"
                    stroke="#fb923c"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#fb923c" }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="scope2Current"
                    name="Scope 2 (Current Year)"
                    stroke="#facc15"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#facc15" }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="scope1Prev"
                    name="Scope 1 (Previous Year)"
                    stroke="#fb923c"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    dot={false}
                    opacity={0.5}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="scope2Prev"
                    name="Scope 2 (Previous Year)"
                    stroke="#facc15"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    dot={false}
                    opacity={0.5}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ DEC Rating Calculator & Conversion Factors ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DEC Rating */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-teal-500" />
              Display Energy Certificate (DEC) Rating
            </h2>

            {/* Rating badge */}
            <div className="flex items-center gap-6 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                className="relative"
              >
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: decBand.bg }}
                >
                  <span className={`text-5xl font-black ${decBand.textColour}`}>
                    {decBand.rating}
                  </span>
                </div>
              </motion.div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {actualKwhPerSqm.toFixed(0)} kWh/m&sup2;
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Actual energy use intensity
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Based on {fmtNumber(floor)} m&sup2; gross internal area
                </p>
              </div>
            </div>

            {/* Rating bands scale */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                DEC Rating Bands (kWh/m&sup2;)
              </p>
              {DEC_BANDS.map((band) => {
                const isActive = band.rating === decBand.rating;
                const maxLabel =
                  band.maxKwhPerSqm === Infinity
                    ? "150+"
                    : `${band.maxKwhPerSqm}`;
                const minLabel =
                  DEC_BANDS.indexOf(band) === 0
                    ? "0"
                    : `${DEC_BANDS[DEC_BANDS.indexOf(band) - 1].maxKwhPerSqm + 1}`;
                return (
                  <motion.div
                    key={band.rating}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + DEC_BANDS.indexOf(band) * 0.04 }}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? "ring-2 ring-teal-500 dark:ring-teal-400 bg-teal-50/50 dark:bg-teal-900/20"
                        : "opacity-60"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shadow-sm"
                      style={{ backgroundColor: band.bg }}
                    >
                      <span className={band.textColour}>{band.rating}</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            backgroundColor: band.bg,
                            width: isActive
                              ? `${Math.min((actualKwhPerSqm / (band.maxKwhPerSqm === Infinity ? 200 : band.maxKwhPerSqm)) * 100, 100)}%`
                              : "100%",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-16 text-right">
                      {minLabel}–{maxLabel}
                    </span>
                    {isActive && (
                      <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                        ← You
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Conversion Factors Panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-teal-500" />
              BEIS/DESNZ Conversion Factors
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              UK Government GHG Conversion Factors 2025 — used for all carbon
              calculations on this page.
            </p>

            <div className="space-y-4">
              {[
                {
                  label: "Electricity (Grid Average)",
                  value: `${CARBON_FACTORS.electricity} kgCO2e/kWh`,
                  scope: "Scope 2",
                  icon: <Zap className="h-4 w-4 text-yellow-500" />,
                  detail:
                    "UK grid average emission factor for purchased electricity",
                },
                {
                  label: "Electricity T&D Losses",
                  value: `${CARBON_FACTORS.electricity_td} kgCO2e/kWh`,
                  scope: "Scope 3",
                  icon: <Zap className="h-4 w-4 text-yellow-400" />,
                  detail: "Transmission and distribution losses on the grid",
                },
                {
                  label: "Natural Gas",
                  value: `${CARBON_FACTORS.gas} kgCO2e/kWh`,
                  scope: "Scope 1",
                  icon: <Flame className="h-4 w-4 text-orange-500" />,
                  detail: "Direct combustion of natural gas on-site",
                },
              ].map((factor, i) => (
                <motion.div
                  key={factor.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {factor.icon}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {factor.label}
                      </span>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                      {factor.scope}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-teal-600 dark:text-teal-400 font-mono">
                    {factor.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {factor.detail}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800">
              <p className="text-xs text-teal-700 dark:text-teal-400 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Source: UK Government GHG Conversion Factors for Company
                Reporting (DESNZ, 2025). Updated annually — factors reflect the
                decarbonisation of the UK electricity grid.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
