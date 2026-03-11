"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  Megaphone,
  GraduationCap,
  Compass,
  Swords,
  Waves,
  PoundSterling,
  BarChart3,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Printer,
  Download,
  Info,
  Target,
  Activity,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────

interface Strategy {
  id: string;
  organization_id: string;
  academic_year: string;
  total_funding: number;
  base_funding: number;
  per_pupil_funding: number;
  pupil_count: number;
  headteacher_name: string;
  pe_lead_name: string;
  swimming_25m_percent: number;
  swimming_strokes_percent: number;
  swimming_self_rescue_percent: number;
  publication_date: string;
  review_date: string;
  status: string;
  sustainability_statement: string;
  _demo?: boolean;
}

interface SpendItem {
  id: string;
  strategy_id: string;
  indicator: number;
  activity: string;
  description: string;
  budgeted_cost: number;
  actual_cost: number;
  impact_notes: string;
  sustainability: string;
  evidence: string;
  status: string;
}

interface IndicatorSummary {
  number: number;
  name: string;
  short_name: string;
  budgeted: number;
  actual: number;
  item_count: number;
  status: string;
}

interface SwimmingData {
  year_group: number;
  cohort_size: number;
  swim_25m_percent: number;
  range_of_strokes_percent: number;
  self_rescue_percent: number;
  national_average_25m: number;
  actions_taken?: string;
}

interface FundingSummary {
  total: number;
  budgeted: number;
  actual_spent: number;
  remaining: number;
  percent_spent: number;
}

interface ImpactSummary {
  total_items: number;
  completed: number;
  in_progress: number;
  planned: number;
  key_achievements: string[];
  areas_for_development: string[];
}

interface DashboardData {
  strategy: Strategy;
  funding: FundingSummary;
  indicators: IndicatorSummary[];
  swimming: SwimmingData;
  impact_summary: ImpactSummary;
  _demo?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────

const INDICATOR_CONFIG = [
  {
    number: 1,
    label: "Engagement",
    fullLabel: "Engagement of all pupils in regular physical activity",
    icon: Users,
    color: "#22c55e",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    description:
      "The percentage of pupils regularly participating in physical activity, including before school, lunchtime, and after-school activities.",
  },
  {
    number: 2,
    label: "Profile",
    fullLabel: "The profile of PE and sport is raised across the school",
    icon: Megaphone,
    color: "#3b82f6",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    description:
      "How PE and sport are promoted and celebrated across the whole school community, including assemblies, displays, and communication.",
  },
  {
    number: 3,
    label: "Staff Knowledge",
    fullLabel:
      "Increased confidence, knowledge and skills of all staff in teaching PE and sport",
    icon: GraduationCap,
    color: "#a855f7",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    description:
      "CPD, coaching support, and training that increases teacher confidence and competence in delivering high-quality PE lessons.",
  },
  {
    number: 4,
    label: "Broader Experience",
    fullLabel:
      "Broader experience of a range of sports and activities offered to all pupils",
    icon: Compass,
    color: "#f59e0b",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    description:
      "New or additional sports and activities introduced, including swimming, outdoor education, and activities that pupils may not otherwise access.",
  },
  {
    number: 5,
    label: "Competition",
    fullLabel: "Increased participation in competitive sport",
    icon: Swords,
    color: "#ef4444",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    description:
      "Inter-school and intra-school competitions, School Games participation, and opportunities for all pupils to compete.",
  },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  completed: {
    label: "Completed",
    color: "text-green-600",
    icon: CheckCircle2,
  },
  in_progress: { label: "In Progress", color: "text-blue-600", icon: Clock },
  planned: { label: "Planned", color: "text-amber-600", icon: CalendarDays },
};

// ─── Helper Functions ─────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getProgressColor(percent: number): string {
  if (percent >= 90) return "bg-green-500";
  if (percent >= 70) return "bg-blue-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getSwimmingColor(percent: number, national: number): string {
  if (percent >= national) return "bg-green-500";
  if (percent >= national - 10) return "bg-amber-500";
  return "bg-red-500";
}

// ─── Tab Type ─────────────────────────────────────────────────────────

type Tab = "overview" | "indicators" | "swimming" | "spend" | "report";

// ─── Main Component ───────────────────────────────────────────────────

export default function SportsPremiumPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [spendItems, setSpendItems] = useState<SpendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndicator, setExpandedIndicator] = useState<number | null>(
    null,
  );
  const [showAddSpend, setShowAddSpend] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2025-26");
  const [addSpendIndicator, setAddSpendIndicator] = useState(1);

  const isDemo = dashboardData?._demo === true;

  // ─── Data Fetching ──────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sports-premium/dashboard?year=${selectedYear}`,
      );
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error("[Sports Premium] Dashboard fetch error:", err);
      setError(err.message);
      toast.error("Failed to load Sports Premium data");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  const fetchSpendItems = useCallback(async () => {
    if (!dashboardData?.strategy?.id) return;
    try {
      const res = await fetch(
        `/api/sports-premium/strategies/${dashboardData.strategy.id}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setSpendItems(data.spend_items || []);
    } catch (err) {
      console.error("[Sports Premium] Spend fetch error:", err);
      toast.error("Failed to load spend items");
    }
  }, [dashboardData?.strategy?.id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchSpendItems();
  }, [fetchSpendItems]);

  // ─── Computed Values ────────────────────────────────────────────────

  const spendByIndicator = useMemo(() => {
    const grouped: Record<number, SpendItem[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };
    spendItems.forEach((item) => {
      if (grouped[item.indicator]) {
        grouped[item.indicator].push(item);
      }
    });
    return grouped;
  }, [spendItems]);

  const totalBudgeted = useMemo(
    () => spendItems.reduce((sum, item) => sum + (item.budgeted_cost || 0), 0),
    [spendItems],
  );

  const totalActual = useMemo(
    () => spendItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0),
    [spendItems],
  );

  // ─── Tab Config ─────────────────────────────────────────────────────

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: BarChart3 },
    { id: "indicators" as Tab, label: "5 Key Indicators", icon: Target },
    { id: "swimming" as Tab, label: "Swimming", icon: Waves },
    { id: "spend" as Tab, label: "Spend Items", icon: PoundSterling },
    { id: "report" as Tab, label: "DfE Report", icon: FileText },
  ];

  // ─── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <span className="ml-3 text-muted-foreground">
            Loading Sports Premium data...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">
              Failed to load data
            </p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <button
              onClick={fetchDashboard}
              className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { strategy, funding, indicators, swimming, impact_summary } =
    dashboardData;

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#FFB6C1" }}
          >
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-pink-500">
                Teaching & Learning
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-medium">
                DfE Statutory
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              PE & Sport Premium
            </h1>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium"
          >
            <option value="2025-26">2025-26</option>
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
          </select>
        </div>
      </div>

      {/* Demo Banner */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
        >
          <Info className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Demo Mode
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Showing sample data for a 210-pupil primary school. Create your
              own strategy to start tracking real spend and impact.
            </p>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            Create Strategy
          </button>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-muted/60 dark:bg-slate-800/60 backdrop-blur-sm p-1 rounded-xl w-fit border border-border/50 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sportsPremiumTab"
                  className="absolute inset-0 bg-card dark:bg-slate-900 rounded-lg shadow-sm border border-border/50"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              strategy={strategy}
              funding={funding}
              indicators={indicators}
              swimming={swimming}
              impact={impact_summary}
              spendItems={spendItems}
            />
          )}
          {activeTab === "indicators" && (
            <IndicatorsTab
              indicators={indicators}
              spendByIndicator={spendByIndicator}
              expandedIndicator={expandedIndicator}
              setExpandedIndicator={setExpandedIndicator}
              funding={funding}
            />
          )}
          {activeTab === "swimming" && <SwimmingTab swimming={swimming} />}
          {activeTab === "spend" && (
            <SpendTab
              spendItems={spendItems}
              totalBudgeted={totalBudgeted}
              totalActual={totalActual}
              funding={funding}
              showAddSpend={showAddSpend}
              setShowAddSpend={setShowAddSpend}
              addSpendIndicator={addSpendIndicator}
              setAddSpendIndicator={setAddSpendIndicator}
            />
          )}
          {activeTab === "report" && (
            <ReportTab
              strategy={strategy}
              funding={funding}
              indicators={indicators}
              swimming={swimming}
              impact={impact_summary}
              spendItems={spendItems}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════

function OverviewTab({
  strategy,
  funding,
  indicators,
  swimming,
  impact,
  spendItems,
}: {
  strategy: Strategy;
  funding: FundingSummary;
  indicators: IndicatorSummary[];
  swimming: SwimmingData;
  impact: ImpactSummary;
  spendItems: SpendItem[];
}) {
  return (
    <div className="space-y-6">
      {/* Funding Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FundingCard
          title="Total Funding"
          value={formatCurrency(funding.total)}
          subtitle={`${strategy.pupil_count} pupils x ${formatCurrency(strategy.per_pupil_funding)}/pupil + ${formatCurrency(strategy.base_funding)} base`}
          icon={PoundSterling}
          color="#22c55e"
        />
        <FundingCard
          title="Spent to Date"
          value={formatCurrency(funding.actual_spent)}
          subtitle={`${funding.percent_spent}% of total funding`}
          icon={TrendingUp}
          color="#3b82f6"
        />
        <FundingCard
          title="Remaining"
          value={formatCurrency(funding.remaining)}
          subtitle={`${100 - funding.percent_spent}% available`}
          icon={PoundSterling}
          color={funding.remaining < 0 ? "#ef4444" : "#f59e0b"}
        />
        <FundingCard
          title="Spend Items"
          value={String(impact.total_items)}
          subtitle={`${impact.completed} done, ${impact.in_progress} active, ${impact.planned} planned`}
          icon={Activity}
          color="#a855f7"
        />
      </div>

      {/* Budget Allocation Bar */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Budget Allocation by Key Indicator
        </h3>
        <div className="space-y-3">
          {indicators.map((ind) => {
            const config = INDICATOR_CONFIG.find(
              (c) => c.number === ind.number,
            )!;
            const percent =
              funding.total > 0
                ? Math.round((ind.budgeted / funding.total) * 100)
                : 0;
            return (
              <div key={ind.number} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <config.icon
                      className="w-4 h-4"
                      style={{ color: config.color }}
                    />
                    <span className="font-medium text-foreground">
                      {config.label}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(ind.budgeted)} ({percent}%)
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, delay: ind.number * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">Total Budgeted</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(indicators.reduce((s, i) => s + i.budgeted, 0))}
          </span>
        </div>
      </div>

      {/* Quick Glance: Swimming + Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Swimming Quick View */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Waves className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Year 6 Swimming Attainment
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium ml-auto">
              Statutory
            </span>
          </div>
          <div className="space-y-4">
            <SwimmingBar
              label="Swim 25m unaided"
              percent={swimming.swim_25m_percent}
              national={swimming.national_average_25m}
            />
            <SwimmingBar
              label="Range of strokes"
              percent={swimming.range_of_strokes_percent}
              national={swimming.national_average_25m}
            />
            <SwimmingBar
              label="Water safety / self-rescue"
              percent={swimming.self_rescue_percent}
              national={swimming.national_average_25m}
            />
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Key Achievements
            </h3>
          </div>
          <div className="space-y-2">
            {impact.key_achievements.slice(0, 5).map((achievement, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{achievement}</span>
              </div>
            ))}
          </div>
          {impact.areas_for_development.length > 0 && (
            <>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                  Areas for Development
                </p>
                <div className="space-y-2">
                  {impact.areas_for_development.map((area, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Strategy Meta */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Strategy Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <MetaItem label="Academic Year" value={strategy.academic_year} />
          <MetaItem label="Headteacher" value={strategy.headteacher_name} />
          <MetaItem label="PE Lead" value={strategy.pe_lead_name} />
          <MetaItem
            label="Number of Pupils"
            value={String(strategy.pupil_count)}
          />
          <MetaItem
            label="Publication Date"
            value={strategy.publication_date || "Not set"}
          />
          <MetaItem
            label="Review Date"
            value={strategy.review_date || "Not set"}
          />
          <MetaItem
            label="Status"
            value={strategy.status === "active" ? "Active" : strategy.status}
          />
          <MetaItem
            label="Funding Formula"
            value={`${formatCurrency(strategy.base_funding)} + ${formatCurrency(strategy.per_pupil_funding)}/pupil`}
          />
        </div>
        {strategy.sustainability_statement && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Sustainability Statement
            </p>
            <p className="text-sm text-muted-foreground">
              {strategy.sustainability_statement}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INDICATORS TAB
// ═══════════════════════════════════════════════════════════════════════

function IndicatorsTab({
  indicators,
  spendByIndicator,
  expandedIndicator,
  setExpandedIndicator,
  funding,
}: {
  indicators: IndicatorSummary[];
  spendByIndicator: Record<number, SpendItem[]>;
  expandedIndicator: number | null;
  setExpandedIndicator: (n: number | null) => void;
  funding: FundingSummary;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            5 DfE Key Indicators
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Schools must show how they spend sports premium funding against
            these 5 key indicators set by the Department for Education.
          </p>
        </div>
      </div>

      {INDICATOR_CONFIG.map((config) => {
        const indicator = indicators.find((i) => i.number === config.number);
        const items = spendByIndicator[config.number] || [];
        const isExpanded = expandedIndicator === config.number;
        const budgeted = indicator?.budgeted || 0;
        const actual = indicator?.actual || 0;
        const spendPercent =
          budgeted > 0
            ? Math.min(100, Math.round((actual / budgeted) * 100))
            : 0;

        return (
          <motion.div
            key={config.number}
            layout
            className={`bg-card rounded-xl border ${config.borderColor} overflow-hidden`}
          >
            {/* Card Header */}
            <button
              onClick={() =>
                setExpandedIndicator(isExpanded ? null : config.number)
              }
              className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: config.color + "20" }}
              >
                <config.icon
                  className="w-5 h-5"
                  style={{ color: config.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: config.color }}
                  >
                    Indicator {config.number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                  {config.fullLabel}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    Budgeted: <strong>{formatCurrency(budgeted)}</strong>
                  </span>
                  <span>
                    Actual: <strong>{formatCurrency(actual)}</strong>
                  </span>
                  <span>{spendPercent}% spent</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Mini progress ring */}
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      className="text-muted/30"
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={config.color}
                      strokeWidth="4"
                      strokeDasharray={`${(spendPercent / 100) * 125.6} 125.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                    {spendPercent}%
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-border/50">
                    {/* Description */}
                    <p className="text-xs text-muted-foreground mt-4 mb-4">
                      {config.description}
                    </p>

                    {/* Spend Items */}
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">
                          No spend items for this indicator yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item) => (
                          <SpendItemCard
                            key={item.id}
                            item={item}
                            config={config}
                          />
                        ))}
                      </div>
                    )}

                    {/* Indicator Budget vs Actual Summary */}
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Indicator Total
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          Budget:{" "}
                          <strong className="text-foreground">
                            {formatCurrency(budgeted)}
                          </strong>
                        </span>
                        <span className="text-muted-foreground">
                          Actual:{" "}
                          <strong className="text-foreground">
                            {formatCurrency(actual)}
                          </strong>
                        </span>
                        <span
                          className={`font-semibold ${actual > budgeted ? "text-red-600" : "text-green-600"}`}
                        >
                          {actual > budgeted ? "Over" : "Under"} by{" "}
                          {formatCurrency(Math.abs(budgeted - actual))}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SWIMMING TAB
// ═══════════════════════════════════════════════════════════════════════

function SwimmingTab({ swimming }: { swimming: SwimmingData }) {
  const measures = [
    {
      key: "25m",
      label:
        "Swim competently, confidently and proficiently over a distance of at least 25 metres",
      percent: swimming.swim_25m_percent,
      statutory: true,
      description:
        "Pupils should be able to swim at least 25 metres unaided using a recognisable stroke. This is a national curriculum requirement and must be reported on the school website.",
    },
    {
      key: "strokes",
      label:
        "Use a range of strokes effectively (e.g. front crawl, backstroke, breaststroke)",
      percent: swimming.range_of_strokes_percent,
      statutory: true,
      description:
        "Pupils should be confident using more than one stroke and demonstrate effective technique. Schools must report the percentage meeting this standard.",
    },
    {
      key: "rescue",
      label: "Perform safe self-rescue in different water-based situations",
      percent: swimming.self_rescue_percent,
      statutory: true,
      description:
        "Pupils should know how to float, tread water, and perform basic self-rescue skills. This is a water safety requirement linked to drowning prevention.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Swimming & Water Safety
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Schools must publish swimming data for Year 6 pupils on their website
          as part of the PE and sport premium reporting requirements. These
          three measures are set by the national curriculum.
        </p>
      </div>

      {/* Statutory Notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Statutory Reporting Requirement
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            The PE and sport premium conditions of grant require schools to
            publish the percentage of Year 6 pupils meeting each of the three
            swimming and water safety national curriculum requirements on their
            school website. If schools do not meet this requirement, they must
            explain what steps they are taking to achieve it.
          </p>
        </div>
      </div>

      {/* Swimming Measures */}
      <div className="grid grid-cols-1 gap-4">
        {measures.map((measure) => {
          const meetsTarget = measure.percent >= swimming.national_average_25m;
          return (
            <div
              key={measure.key}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-start gap-4">
                {/* Percentage Circle */}
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      className="text-muted/20"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke={meetsTarget ? "#22c55e" : "#ef4444"}
                      strokeWidth="8"
                      strokeDasharray={`${(measure.percent / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 251.2" }}
                      animate={{
                        strokeDasharray: `${(measure.percent / 100) * 251.2} 251.2`,
                      }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-foreground">
                      {measure.percent}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      of Y6
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {measure.statutory && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                        Statutory
                      </span>
                    )}
                    {meetsTarget ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Meets national average
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Below national average ({swimming.national_average_25m}
                        %)
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {measure.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {measure.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${measure.percent}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${meetsTarget ? "bg-green-500" : "bg-red-500"}`}
                      />
                      {/* National average marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white"
                        style={{
                          left: `${swimming.national_average_25m}%`,
                        }}
                        title={`National average: ${swimming.national_average_25m}%`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>0%</span>
                      <span>
                        National avg: {swimming.national_average_25m}%
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions Taken */}
      {swimming.actions_taken && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Actions Taken to Improve Swimming
          </h3>
          <p className="text-sm text-muted-foreground">
            {swimming.actions_taken}
          </p>
        </div>
      )}

      {/* Cohort Summary */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Year 6 Cohort Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetaItem label="Year Group" value={String(swimming.year_group)} />
          <MetaItem
            label="Cohort Size"
            value={`${swimming.cohort_size} pupils`}
          />
          <MetaItem
            label="Best Measure"
            value={`${Math.max(swimming.swim_25m_percent, swimming.range_of_strokes_percent, swimming.self_rescue_percent)}% (Self-rescue)`}
          />
          <MetaItem
            label="Weakest Measure"
            value={`${Math.min(swimming.swim_25m_percent, swimming.range_of_strokes_percent, swimming.self_rescue_percent)}% (Strokes)`}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SPEND TAB
// ═══════════════════════════════════════════════════════════════════════

function SpendTab({
  spendItems,
  totalBudgeted,
  totalActual,
  funding,
  showAddSpend,
  setShowAddSpend,
  addSpendIndicator,
  setAddSpendIndicator,
}: {
  spendItems: SpendItem[];
  totalBudgeted: number;
  totalActual: number;
  funding: FundingSummary;
  showAddSpend: boolean;
  setShowAddSpend: (v: boolean) => void;
  addSpendIndicator: number;
  setAddSpendIndicator: (v: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Spend Items</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Detailed breakdown of all PE and sport premium expenditure.
          </p>
        </div>
        <button
          onClick={() => setShowAddSpend(true)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Spend Item
        </button>
      </div>

      {/* Add Spend Form */}
      <AnimatePresence>
        {showAddSpend && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AddSpendForm
              indicator={addSpendIndicator}
              setIndicator={setAddSpendIndicator}
              onClose={() => setShowAddSpend(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Total Budgeted
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {formatCurrency(totalBudgeted)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {funding.total > 0
              ? `${Math.round((totalBudgeted / funding.total) * 100)}% of funding allocated`
              : "No funding set"}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Actual Spend
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {formatCurrency(totalActual)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalBudgeted > 0
              ? `${Math.round((totalActual / totalBudgeted) * 100)}% of budget spent`
              : "No budget set"}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Variance
          </p>
          <p
            className={`text-xl font-bold mt-1 ${totalBudgeted - totalActual >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(totalBudgeted - totalActual)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalBudgeted - totalActual >= 0 ? "Under budget" : "Over budget"}
          </p>
        </div>
      </div>

      {/* Spend Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Activity
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Indicator
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Budgeted
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Actual
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Impact
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Sustainability
                </th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {spendItems.map((item, idx) => {
                const config = INDICATOR_CONFIG.find(
                  (c) => c.number === item.indicator,
                );
                const status =
                  STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                const StatusIcon = status.icon;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {item.activity}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: (config?.color || "#666") + "15",
                          color: config?.color || "#666",
                        }}
                      >
                        {config && <config.icon className="w-3 h-3" />}
                        {config?.label || `#${item.indicator}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      {formatCurrency(item.budgeted_cost)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      {formatCurrency(item.actual_cost)}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {item.impact_notes || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.sustainability || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Total Row */}
            <tfoot>
              <tr className="bg-muted/40 border-t-2 border-border">
                <td
                  className="px-4 py-3 text-sm font-bold text-foreground"
                  colSpan={2}
                >
                  Total ({spendItems.length} items)
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
                  {formatCurrency(totalBudgeted)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
                  {formatCurrency(totalActual)}
                </td>
                <td className="px-4 py-3" colSpan={3}>
                  <span
                    className={`text-xs font-semibold ${totalBudgeted - totalActual >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    Variance: {formatCurrency(totalBudgeted - totalActual)}
                    {totalBudgeted - totalActual >= 0
                      ? " under budget"
                      : " over budget"}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// REPORT TAB
// ═══════════════════════════════════════════════════════════════════════

function ReportTab({
  strategy,
  funding,
  indicators,
  swimming,
  impact,
  spendItems,
}: {
  strategy: Strategy;
  funding: FundingSummary;
  indicators: IndicatorSummary[];
  swimming: SwimmingData;
  impact: ImpactSummary;
  spendItems: SpendItem[];
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            DfE Report Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Auto-generated report template for your school website. Schools must
            publish this information to comply with the conditions of grant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg transition-colors text-sm font-medium opacity-50 cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export PDF (Coming Soon)
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div
        className="bg-white dark:bg-slate-950 rounded-xl border border-border p-8 print:p-0 print:border-0 print:shadow-none"
        id="sports-premium-report"
      >
        {/* Report Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            PE and Sport Premium Strategy Statement
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Academic Year {strategy.academic_year}
          </p>
        </div>

        {/* School Details */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b-2 border-pink-500 pb-1 mb-3">
            School Details
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <ReportRow label="Academic Year" value={strategy.academic_year} />
              <ReportRow
                label="Total Funding"
                value={formatCurrency(funding.total)}
              />
              <ReportRow
                label="Headteacher"
                value={strategy.headteacher_name}
              />
              <ReportRow label="PE Lead" value={strategy.pe_lead_name} />
              <ReportRow
                label="Date of Publication"
                value={strategy.publication_date || "TBC"}
              />
              <ReportRow
                label="Date of Next Review"
                value={strategy.review_date || "TBC"}
              />
            </tbody>
          </table>
        </div>

        {/* Funding Breakdown */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b-2 border-pink-500 pb-1 mb-3">
            Funding Breakdown
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <ReportRow
                label="Base funding (all schools)"
                value={formatCurrency(strategy.base_funding)}
              />
              <ReportRow
                label="Per pupil funding"
                value={`${strategy.pupil_count} pupils x ${formatCurrency(strategy.per_pupil_funding)} = ${formatCurrency(strategy.pupil_count * strategy.per_pupil_funding)}`}
              />
              <ReportRow
                label="Total allocation"
                value={formatCurrency(funding.total)}
                bold
              />
              <ReportRow
                label="Total expenditure"
                value={formatCurrency(funding.actual_spent)}
              />
              <ReportRow
                label="Remaining"
                value={formatCurrency(funding.remaining)}
              />
            </tbody>
          </table>
        </div>

        {/* Spend by Indicator */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b-2 border-pink-500 pb-1 mb-3">
            Expenditure by Key Indicator
          </h2>

          {INDICATOR_CONFIG.map((config) => {
            const indItems = spendItems.filter(
              (s) => s.indicator === config.number,
            );
            const indBudgeted = indItems.reduce(
              (sum, i) => sum + i.budgeted_cost,
              0,
            );
            const indActual = indItems.reduce(
              (sum, i) => sum + i.actual_cost,
              0,
            );

            return (
              <div key={config.number} className="mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Key Indicator {config.number}: {config.fullLabel}
                </h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="text-left px-2 py-1.5 border border-slate-200 dark:border-slate-700 font-semibold">
                        Activity / Action
                      </th>
                      <th className="text-right px-2 py-1.5 border border-slate-200 dark:border-slate-700 font-semibold w-20">
                        Cost
                      </th>
                      <th className="text-left px-2 py-1.5 border border-slate-200 dark:border-slate-700 font-semibold">
                        Impact / Evidence
                      </th>
                      <th className="text-left px-2 py-1.5 border border-slate-200 dark:border-slate-700 font-semibold w-36">
                        Sustainability
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {indItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-2 py-2 border border-slate-200 dark:border-slate-700 text-center text-slate-500"
                        >
                          No items recorded for this indicator.
                        </td>
                      </tr>
                    ) : (
                      indItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 align-top">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {item.activity}
                            </p>
                            {item.description && (
                              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-right align-top font-medium">
                            {formatCurrency(
                              item.actual_cost || item.budgeted_cost,
                            )}
                          </td>
                          <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 align-top text-slate-600 dark:text-slate-300">
                            {item.impact_notes || "Impact to be assessed"}
                          </td>
                          <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 align-top text-slate-600 dark:text-slate-300">
                            {item.sustainability || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Subtotal */}
                    <tr className="bg-slate-50 dark:bg-slate-900 font-semibold">
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700">
                        Indicator {config.number} Total
                      </td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-right">
                        {formatCurrency(indActual)}
                      </td>
                      <td
                        colSpan={2}
                        className="px-2 py-1.5 border border-slate-200 dark:border-slate-700"
                      >
                        Budget: {formatCurrency(indBudgeted)} | Variance:{" "}
                        {formatCurrency(indBudgeted - indActual)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Grand Total */}
          <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg border border-pink-200 dark:border-pink-800">
            <div className="flex items-center justify-between text-sm font-bold text-pink-800 dark:text-pink-200">
              <span>Total Premium Expenditure</span>
              <span>{formatCurrency(funding.actual_spent)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-pink-600 dark:text-pink-400 mt-1">
              <span>Total Allocation: {formatCurrency(funding.total)}</span>
              <span>Remaining: {formatCurrency(funding.remaining)}</span>
            </div>
          </div>
        </div>

        {/* Swimming Data */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b-2 border-pink-500 pb-1 mb-3">
            Swimming and Water Safety (Year 6)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            Meeting national curriculum requirements for swimming and water
            safety. Schools must report the percentage of their current Year 6
            cohort meeting each of the following:
          </p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 border border-slate-200 dark:border-slate-700 font-semibold">
                  National Curriculum Requirement
                </th>
                <th className="text-center px-3 py-2 border border-slate-200 dark:border-slate-700 font-semibold w-32">
                  % of Y6 Meeting
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                  Swim competently, confidently and proficiently over a distance
                  of at least 25 metres
                </td>
                <td className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-center font-bold">
                  {swimming.swim_25m_percent}%
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                  Use a range of strokes effectively (e.g. front crawl,
                  backstroke, breaststroke)
                </td>
                <td className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-center font-bold">
                  {swimming.range_of_strokes_percent}%
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                  Perform safe self-rescue in different water-based situations
                </td>
                <td className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-center font-bold">
                  {swimming.self_rescue_percent}%
                </td>
              </tr>
            </tbody>
          </table>
          {swimming.actions_taken && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">
                Actions to improve swimming provision:
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {swimming.actions_taken}
              </p>
            </div>
          )}
        </div>

        {/* Sustainability */}
        {strategy.sustainability_statement && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b-2 border-pink-500 pb-1 mb-3">
              Sustainability and Next Steps
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {strategy.sustainability_statement}
            </p>
          </div>
        )}

        {/* Key Achievements */}
        {impact.key_achievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b-2 border-pink-500 pb-1 mb-3">
              Key Achievements
            </h2>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {impact.key_achievements.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400">
            This report was generated using Schoolgle PE & Sport Premium Module.
            It should be reviewed by the headteacher and PE lead before
            publication.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Published: {strategy.publication_date || "Date TBC"} | Next Review:{" "}
            {strategy.review_date || "Date TBC"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function FundingCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof PoundSterling;
  color: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + "15" }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {title}
          </p>
          <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function SwimmingBar({
  label,
  percent,
  national,
}: {
  label: string;
  percent: number;
  national: number;
}) {
  const meetsTarget = percent >= national;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={`font-bold ${meetsTarget ? "text-green-600" : "text-red-600"}`}
        >
          {percent}%
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full rounded-full ${meetsTarget ? "bg-green-500" : "bg-red-500"}`}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
          style={{ left: `${national}%` }}
        />
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function SpendItemCard({
  item,
  config,
}: {
  item: SpendItem;
  config: (typeof INDICATOR_CONFIG)[number];
}) {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
  const StatusIcon = status.icon;
  const variance = item.budgeted_cost - item.actual_cost;

  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              {item.activity}
            </h4>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground uppercase tracking-wider font-medium">
            Budgeted
          </p>
          <p className="font-semibold text-foreground mt-0.5">
            {formatCurrency(item.budgeted_cost)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider font-medium">
            Actual
          </p>
          <p className="font-semibold text-foreground mt-0.5">
            {formatCurrency(item.actual_cost)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider font-medium">
            Variance
          </p>
          <p
            className={`font-semibold mt-0.5 ${variance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(Math.abs(variance))}{" "}
            {variance >= 0 ? "under" : "over"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider font-medium">
            Spend %
          </p>
          <p className="font-semibold text-foreground mt-0.5">
            {item.budgeted_cost > 0
              ? Math.round((item.actual_cost / item.budgeted_cost) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {item.impact_notes && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
            Impact / Evidence
          </p>
          <p className="text-xs text-foreground">{item.impact_notes}</p>
        </div>
      )}

      {item.sustainability && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
            Sustainability
          </p>
          <p className="text-xs text-foreground">{item.sustainability}</p>
        </div>
      )}

      {item.evidence && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
            Supporting Evidence
          </p>
          <p className="text-xs text-muted-foreground italic">
            {item.evidence}
          </p>
        </div>
      )}
    </div>
  );
}

function ReportRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      <td
        className={`py-2 pr-4 text-slate-600 dark:text-slate-400 ${bold ? "font-bold" : ""}`}
      >
        {label}
      </td>
      <td
        className={`py-2 text-slate-900 dark:text-white ${bold ? "font-bold" : ""}`}
      >
        {value}
      </td>
    </tr>
  );
}

function AddSpendForm({
  indicator,
  setIndicator,
  onClose,
}: {
  indicator: number;
  setIndicator: (v: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Add Spend Item
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Activity Name *
          </label>
          <input
            type="text"
            placeholder="e.g. After-school sports club"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Key Indicator *
          </label>
          <select
            value={indicator}
            onChange={(e) => setIndicator(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            {INDICATOR_CONFIG.map((c) => (
              <option key={c.number} value={c.number}>
                {c.number}. {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Budgeted Cost
          </label>
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Actual Cost
          </label>
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Description
        </label>
        <textarea
          rows={2}
          placeholder="Describe the activity and its intended outcomes..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Impact / Evidence
          </label>
          <textarea
            rows={2}
            placeholder="What impact has this had? What evidence do you have?"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Sustainability Plan
          </label>
          <textarea
            rows={2}
            placeholder="How will this continue after funding ends?"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          disabled
          className="px-4 py-2 bg-pink-600 text-white rounded-lg transition-colors text-sm font-medium opacity-50 cursor-not-allowed"
        >
          Add Item (Coming Soon)
        </button>
      </div>
    </div>
  );
}
