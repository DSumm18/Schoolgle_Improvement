"use client";

import { useMemo } from "react";
import {
  Car,
  Leaf,
  MapPin,
  Calendar,
  TrendingUp,
  Info,
  PoundSterling,
  Route,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────

interface MileageClaim {
  id: string;
  date: string;
  staff_name: string;
  from: string;
  to: string;
  miles: number;
  purpose: string;
  rate: number;
  amount: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const HMRC_RATE_FIRST_10K = 0.45; // 45p/mile
const HMRC_RATE_AFTER_10K = 0.25; // 25p/mile
const CAR_CO2_PER_MILE = 0.27; // kgCO2e/mile (average car)

// ─── Demo Data ───────────────────────────────────────────────────────

const DEMO_CLAIMS: MileageClaim[] = [
  {
    id: "mc-001",
    date: "2026-03-14",
    staff_name: "Sarah Mitchell",
    from: "School",
    to: "County Hall, Norwich",
    miles: 28,
    purpose: "SEND panel meeting",
    rate: HMRC_RATE_FIRST_10K,
    amount: 12.6,
  },
  {
    id: "mc-002",
    date: "2026-03-13",
    staff_name: "James Thornton",
    from: "School",
    to: "St Mary's Primary",
    miles: 12,
    purpose: "Moderation visit",
    rate: HMRC_RATE_FIRST_10K,
    amount: 5.4,
  },
  {
    id: "mc-003",
    date: "2026-03-12",
    staff_name: "Sarah Mitchell",
    from: "School",
    to: "Safeguarding Hub",
    miles: 18,
    purpose: "MASH referral follow-up",
    rate: HMRC_RATE_FIRST_10K,
    amount: 8.1,
  },
  {
    id: "mc-004",
    date: "2026-03-11",
    staff_name: "David Chen",
    from: "School",
    to: "Training Centre",
    miles: 35,
    purpose: "NPQ Leadership module",
    rate: HMRC_RATE_FIRST_10K,
    amount: 15.75,
  },
  {
    id: "mc-005",
    date: "2026-03-10",
    staff_name: "Emily Watson",
    from: "School",
    to: "Diocese Office",
    miles: 22,
    purpose: "SIAMS preparation meeting",
    rate: HMRC_RATE_FIRST_10K,
    amount: 9.9,
  },
  {
    id: "mc-006",
    date: "2026-03-07",
    staff_name: "James Thornton",
    from: "School",
    to: "Oakwood Academy",
    miles: 8,
    purpose: "Sports partnership meeting",
    rate: HMRC_RATE_FIRST_10K,
    amount: 3.6,
  },
  {
    id: "mc-007",
    date: "2026-03-06",
    staff_name: "Sarah Mitchell",
    from: "School",
    to: "Family Home (visit)",
    miles: 6,
    purpose: "Home visit — attendance concern",
    rate: HMRC_RATE_FIRST_10K,
    amount: 2.7,
  },
  {
    id: "mc-008",
    date: "2026-03-04",
    staff_name: "Rachel Kumar",
    from: "School",
    to: "Teaching School Hub",
    miles: 42,
    purpose: "ECT mentor training",
    rate: HMRC_RATE_FIRST_10K,
    amount: 18.9,
  },
  {
    id: "mc-009",
    date: "2026-02-28",
    staff_name: "David Chen",
    from: "School",
    to: "LA Offices",
    miles: 30,
    purpose: "Headteacher briefing",
    rate: HMRC_RATE_FIRST_10K,
    amount: 13.5,
  },
  {
    id: "mc-010",
    date: "2026-02-26",
    staff_name: "Emily Watson",
    from: "School",
    to: "Conference Centre",
    miles: 55,
    purpose: "RE curriculum network day",
    rate: HMRC_RATE_FIRST_10K,
    amount: 24.75,
  },
  {
    id: "mc-011",
    date: "2026-02-24",
    staff_name: "Sarah Mitchell",
    from: "School",
    to: "County Hall, Norwich",
    miles: 28,
    purpose: "Exclusion panel",
    rate: HMRC_RATE_FIRST_10K,
    amount: 12.6,
  },
  {
    id: "mc-012",
    date: "2026-02-20",
    staff_name: "James Thornton",
    from: "School",
    to: "Riverside Primary",
    miles: 15,
    purpose: "Phonics moderation",
    rate: HMRC_RATE_FIRST_10K,
    amount: 6.75,
  },
  {
    id: "mc-013",
    date: "2026-02-17",
    staff_name: "Rachel Kumar",
    from: "School",
    to: "University campus",
    miles: 48,
    purpose: "PGCE student placement visit",
    rate: HMRC_RATE_FIRST_10K,
    amount: 21.6,
  },
  {
    id: "mc-014",
    date: "2026-02-14",
    staff_name: "David Chen",
    from: "School",
    to: "Trust HQ",
    miles: 20,
    purpose: "Trust heads meeting",
    rate: HMRC_RATE_FIRST_10K,
    amount: 9.0,
  },
  {
    id: "mc-015",
    date: "2026-01-30",
    staff_name: "Emily Watson",
    from: "School",
    to: "Cathedral",
    miles: 10,
    purpose: "Collective worship planning",
    rate: HMRC_RATE_FIRST_10K,
    amount: 4.5,
  },
  {
    id: "mc-016",
    date: "2026-01-27",
    staff_name: "Sarah Mitchell",
    from: "School",
    to: "Community Centre",
    miles: 5,
    purpose: "Multi-agency meeting",
    rate: HMRC_RATE_FIRST_10K,
    amount: 2.25,
  },
  {
    id: "mc-017",
    date: "2026-01-22",
    staff_name: "James Thornton",
    from: "School",
    to: "Swimming Pool",
    miles: 4,
    purpose: "Venue risk assessment",
    rate: HMRC_RATE_FIRST_10K,
    amount: 1.8,
  },
  {
    id: "mc-018",
    date: "2026-01-15",
    staff_name: "Rachel Kumar",
    from: "School",
    to: "SEN Resource Base",
    miles: 25,
    purpose: "Provision mapping review",
    rate: HMRC_RATE_FIRST_10K,
    amount: 11.25,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function fmtGBP(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat("en-GB").format(Math.round(n));
}

// ─── Custom Tooltip ──────────────────────────────────────────────────

function MonthlyMileageTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-slate-900 text-white rounded-lg px-4 py-3 shadow-2xl border border-slate-700 text-sm">
      <p className="font-semibold text-teal-300">{d.label}</p>
      <div className="mt-1.5 space-y-1">
        <p className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          Miles: {fmtNumber(d.miles)}
        </p>
        <p className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          Cost: {fmtGBP(d.cost)}
        </p>
        <p className="text-xs text-slate-400 pt-1 border-t border-slate-700">
          CO2e: {d.co2.toFixed(1)} kg ({d.claims} claim
          {d.claims !== 1 ? "s" : ""})
        </p>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export function MileageClaimsTab() {
  const claims = DEMO_CLAIMS;

  const totalMiles = useMemo(
    () => claims.reduce((s, c) => s + c.miles, 0),
    [claims],
  );
  const totalCost = useMemo(
    () => claims.reduce((s, c) => s + c.amount, 0),
    [claims],
  );
  const totalCO2 = useMemo(() => totalMiles * CAR_CO2_PER_MILE, [totalMiles]);

  // Monthly breakdown
  const monthlyData = useMemo(() => {
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
    const buckets: Record<
      string,
      { miles: number; cost: number; claims: number }
    > = {};
    for (const c of claims) {
      const key = c.date.slice(0, 7);
      if (!buckets[key]) buckets[key] = { miles: 0, cost: 0, claims: 0 };
      buckets[key].miles += c.miles;
      buckets[key].cost += c.amount;
      buckets[key].claims += 1;
    }
    return Object.keys(buckets)
      .sort()
      .map((key) => {
        const [year, month] = key.split("-");
        const monthIdx = parseInt(month) - 1;
        return {
          key,
          label: `${monthNames[monthIdx]} ${year.slice(2)}`,
          miles: buckets[key].miles,
          cost: buckets[key].cost,
          claims: buckets[key].claims,
          co2: buckets[key].miles * CAR_CO2_PER_MILE,
        };
      });
  }, [claims]);

  // Staff breakdown
  const staffSummary = useMemo(() => {
    const staff: Record<
      string,
      { miles: number; cost: number; trips: number }
    > = {};
    for (const c of claims) {
      if (!staff[c.staff_name])
        staff[c.staff_name] = { miles: 0, cost: 0, trips: 0 };
      staff[c.staff_name].miles += c.miles;
      staff[c.staff_name].cost += c.amount;
      staff[c.staff_name].trips += 1;
    }
    return Object.entries(staff)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.miles - a.miles);
  }, [claims]);

  return (
    <div className="space-y-6">
      {/* ═══ KPI Cards ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                <Route className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Miles
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {fmtNumber(totalMiles)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {claims.length} claims this period
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                <PoundSterling className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Cost
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {fmtGBP(totalCost)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              HMRC rate: {(HMRC_RATE_FIRST_10K * 100).toFixed(0)}p/mile
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Carbon from Travel
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalCO2.toFixed(1)} kgCO2e
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Scope 3 emissions
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Car className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Avg Trip
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {claims.length > 0 ? (totalMiles / claims.length).toFixed(0) : 0}{" "}
              miles
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {staffSummary.length} staff claiming
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══ Scope 3 Callout ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl border border-teal-200 dark:border-teal-800 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 shrink-0">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                Scope 3 Emissions from Staff Travel
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Staff mileage claims contribute{" "}
                <span className="font-bold text-teal-700 dark:text-teal-400">
                  {totalCO2.toFixed(1)} kgCO2e
                </span>{" "}
                ({(totalCO2 / 1000).toFixed(3)} tCO2e) to your Scope 3 emissions
                this period. At the current rate, annual travel emissions would
                be approximately{" "}
                <span className="font-bold">
                  {((totalCO2 * 12) / monthlyData.length / 1000).toFixed(2)}{" "}
                  tCO2e
                </span>
                .
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Factor: {CAR_CO2_PER_MILE} kgCO2e/mile (average passenger car,
                DESNZ 2025)
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Monthly Bar Chart & Claims Table ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-500" />
                Monthly Mileage
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Miles driven per month for school business
              </p>
            </div>
            <div className="px-3 pb-4" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="mileageGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.9} />
                      <stop
                        offset="95%"
                        stopColor="#14b8a6"
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
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<MonthlyMileageTooltip />} />
                  <Bar
                    dataKey="miles"
                    name="Miles"
                    fill="url(#mileageGrad)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Staff breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Car className="h-5 w-5 text-teal-500" />
              Staff Breakdown
            </h2>
            <div className="space-y-3">
              {staffSummary.map((staff, i) => {
                const pct =
                  totalMiles > 0 ? (staff.miles / totalMiles) * 100 : 0;
                return (
                  <motion.div
                    key={staff.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                    className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {staff.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {staff.trips} trip{staff.trips !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.06 }}
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white w-16 text-right">
                        {fmtNumber(staff.miles)} mi
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
                        {fmtGBP(staff.cost)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ Recent Claims Table ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-500" />
                Recent Mileage Claims
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Staff business travel claims at HMRC approved rates
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <Info className="h-3.5 w-3.5" />
              Demo data
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50">
                  <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Miles
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="text-right px-6 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim, i) => (
                  <motion.tr
                    key={claim.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.02 }}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(claim.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {claim.staff_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <span className="text-xs">
                        {claim.from} → {claim.to}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                      {claim.purpose}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                      {claim.miles}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">
                      {(claim.rate * 100).toFixed(0)}p
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {fmtGBP(claim.amount)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800/50">
                  <td
                    colSpan={4}
                    className="px-6 py-3 font-semibold text-gray-900 dark:text-white"
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-gray-900 dark:text-white">
                    {fmtNumber(totalMiles)}
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-6 py-3 text-right font-bold text-teal-600 dark:text-teal-400">
                    {fmtGBP(totalCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ═══ HMRC Rates Info ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-teal-500" />
            HMRC Approved Mileage Rates (2025/26)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                First 10,000 miles
              </p>
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-mono">
                45p
                <span className="text-sm font-normal text-gray-400">/mile</span>
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                After 10,000 miles
              </p>
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                25p
                <span className="text-sm font-normal text-gray-400">/mile</span>
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Carbon Factor
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                0.27
                <span className="text-sm font-normal text-gray-400">
                  {" "}
                  kgCO2e/mi
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
