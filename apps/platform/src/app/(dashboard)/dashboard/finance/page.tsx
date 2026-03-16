"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PoundSterling,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Zap,
  BarChart3,
  Shield,
  Users,
  Building2,
  GraduationCap,
  Sparkles,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Pause,
  Ban,
  Eye,
  Send,
  ThumbsUp,
  Leaf,
  FileText,
  Package,
  Upload,
  Download,
  Info,
} from "lucide-react";
import {
  calculateBudgetPosition,
  generateDecisionCards,
  generateStaffComms,
  DEPARTMENT_INITIATIVES,
} from "@/lib/budget-engine/engine";
import {
  parseBudgetCSV,
  generateSampleCSV,
  type ParseResult,
} from "@/lib/budget-engine/parser";
import {
  parseTransactionCSV,
  analyseTransactions,
  generateSampleTransactionCSV,
  type TransactionAnalysis,
} from "@/lib/budget-engine/transactions";
import type {
  BudgetPlan,
  BudgetLine,
  BudgetPosition,
  DecisionCard,
  BudgetIssue,
  StockAlert,
  ICFPMetrics,
  CFRCode,
  SavingInitiative,
  StaffCommunication,
} from "@/lib/budget-engine/types";
import { CFR_EXPENDITURE } from "@/lib/budget-engine/types";

// =====================================================
// DEMO DATA — would come from Supabase in production
// =====================================================

function createDemoBudgetPlan(): BudgetPlan {
  const lines: BudgetLine[] = [
    makeLine("E01", "Teaching staff", 820000, 520000, 15000, 0.78),
    makeLine("E02", "Supply teaching", 35000, 28000, 2000, 0.91),
    makeLine("E03", "Education support", 180000, 108000, 5000, 0.72),
    makeLine("E04", "Premises staff", 65000, 42000, 0, 0.78),
    makeLine("E05", "Admin staff", 95000, 59000, 3000, 0.76),
    makeLine("E06", "Catering staff", 45000, 27000, 0, 0.72),
    makeLine("E12", "Building maintenance", 40000, 32000, 5000, 1.12),
    makeLine("E14", "Cleaning & caretaking", 25000, 15000, 1000, 0.77),
    makeLine("E16", "Energy", 42000, 31000, 0, 0.89),
    makeLine("E19", "Learning resources", 28000, 19000, 2000, 0.9),
    makeLine("E22", "Admin supplies", 12000, 8500, 500, 0.9),
    makeLine("E25", "Catering supplies", 18000, 11000, 800, 0.79),
  ];

  return {
    id: "demo-plan-2025",
    organization_id: "demo-org",
    school_id: "demo-school",
    financial_year: "2025/26",
    budget_cycle: "la",
    fy_start: "2025-04-01",
    fy_end: "2026-03-31",
    total_income: 1450000,
    total_expenditure_planned: 1405000,
    planned_surplus_deficit: 45000,
    status: "approved",
    approved_by: "Jane Smith (Head Teacher)",
    approved_date: "2025-03-15",
    lines,
    strategic_priorities: [
      {
        id: "sp-1",
        title: "New reading programme (Y3-Y6)",
        source: "sip",
        planned_spend: 15000,
        actual_spend: 8000,
        status: "on_track",
      },
      {
        id: "sp-2",
        title: "Toilet refurbishment block B",
        source: "estates_strategy",
        planned_spend: 25000,
        actual_spend: 0,
        status: "on_track",
      },
      {
        id: "sp-3",
        title: "Staff wellbeing programme",
        source: "hr_plan",
        planned_spend: 5000,
        actual_spend: 2000,
        status: "on_track",
      },
    ],
    created_at: "2025-03-01T00:00:00Z",
    updated_at: "2026-03-06T00:00:00Z",
  };
}

function makeLine(
  code: CFRCode,
  category: string,
  planned: number,
  actual: number,
  committed: number,
  ratio: number,
): BudgetLine {
  const available = planned - actual - committed;
  const variance = ((actual + committed) / planned - ratio) * 100;
  return {
    cfr_code: code,
    category,
    planned_amount: planned,
    actual_ytd: actual,
    committed,
    available,
    projected_outturn: planned * ratio,
    variance_percent: variance,
    rag: ratio > 0.95 ? "red" : ratio > 0.85 ? "amber" : "green",
    monthly_profile: [],
    frozen: false,
  };
}

const DEMO_ISSUES: BudgetIssue[] = [
  {
    id: "issue-boiler",
    school_id: "demo-school",
    source_module: "estates",
    title: "Boiler failure — Hall heating system",
    description:
      "The main hall boiler has failed and needs emergency replacement. Three quotes received. Cheapest option: £8,500 (Greentech Heating). Must be completed before winter term.",
    financial_impact: 8500,
    impact_type: "cost",
    cfr_codes_affected: ["E12", "E16"],
    severity: "critical",
    status: "new",
    affected_priorities: ["sp-2"],
    raised_date: "2026-03-04",
  },
];

const DEMO_STOCK_ALERTS: StockAlert[] = [
  {
    stock_id: "stock-paper",
    alert_type: "order_blocked",
    message:
      "A4 Paper: 48 reams in stock (12 weeks supply). Enough until budget renewal.",
    suggested_action: "No new orders needed. Budget renews 1 April 2026.",
  },
];

// =====================================================
// COMPONENT
// =====================================================

export default function FinancePage() {
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mode, setMode] = useState<"upload" | "dashboard">("upload");

  const handleParsed = useCallback((result: ParseResult) => {
    setParseResult(result);
    if (result.success && result.plan) {
      setBudgetPlan(result.plan);
      setMode("dashboard");
    }
  }, []);

  const handleLoadDemo = useCallback(() => {
    setBudgetPlan(createDemoBudgetPlan());
    setParseResult(null);
    setMode("dashboard");
  }, []);

  const handleReset = useCallback(() => {
    setBudgetPlan(null);
    setParseResult(null);
    setMode("upload");
  }, []);

  if (mode === "upload" || !budgetPlan) {
    return (
      <BudgetUploadView
        onParsed={handleParsed}
        onLoadDemo={handleLoadDemo}
        parseResult={parseResult}
      />
    );
  }

  return (
    <BudgetDashboard
      plan={budgetPlan}
      parseResult={parseResult}
      onReset={handleReset}
    />
  );
}

// =====================================================
// UPLOAD VIEW
// =====================================================

function BudgetUploadView({
  onParsed,
  onLoadDemo,
  parseResult,
}: {
  onParsed: (result: ParseResult) => void;
  onLoadDemo: () => void;
  parseResult: ParseResult | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [budgetCycle, setBudgetCycle] = useState<"la" | "academy">("la");

  const processFile = useCallback(
    async (file: File) => {
      setProcessing(true);
      try {
        const text = await file.text();
        const result = parseBudgetCSV(text, { budget_cycle: budgetCycle });
        onParsed(result);
      } catch {
        onParsed({
          success: false,
          plan: null,
          warnings: [],
          errors: ["Failed to read file. Please check it is a valid CSV."],
          rows_parsed: 0,
          rows_skipped: 0,
          detected_format: "unknown",
          unmapped_codes: [],
        });
      } finally {
        setProcessing(false);
      }
    },
    [budgetCycle, onParsed],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDownloadTemplate = useCallback(() => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budget-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="p-6 lg:p-8 min-h-screen max-w-[900px] mx-auto flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-800">
          <Sparkles size={14} />
          Budget Decision Engine
        </div>
        <h1 className="text-4xl lg:text-5xl font-black text-foreground tracking-tight">
          Upload your budget report
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Drop in your school's budget CSV and the AI engine analyses spend,
          flags risks, generates decision cards, and suggests savings — all
          automatically.
        </p>
      </motion.div>

      {/* Budget Cycle Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center gap-3"
      >
        <span className="text-sm text-muted-foreground">Budget cycle:</span>
        <div className="flex bg-muted p-1 rounded-xl">
          <button
            onClick={() => setBudgetCycle("la")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              budgetCycle === "la"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            LA (April - March)
          </button>
          <button
            onClick={() => setBudgetCycle("academy")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              budgetCycle === "academy"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Academy (Sept - Aug)
          </button>
        </div>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20 scale-[1.02]"
            : "border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/10"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        {processing ? (
          <div className="space-y-3">
            <div className="w-10 h-10 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Parsing budget report...
            </p>
          </div>
        ) : (
          <>
            <Upload
              size={40}
              className={`mx-auto mb-4 ${dragOver ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}
            />
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              Drag & drop your budget CSV here
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              or click to browse &middot; Accepts .csv files from any UK school
              finance system
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400">
              <span>PS Financials</span>
              <span>&middot;</span>
              <span>Sage</span>
              <span>&middot;</span>
              <span>Access</span>
              <span>&middot;</span>
              <span>Xero</span>
              <span>&middot;</span>
              <span>CFR Standard</span>
            </div>
          </>
        )}
      </motion.div>

      {/* Parse Errors */}
      {parseResult && !parseResult.success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-5 space-y-2"
        >
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold">
            <AlertTriangle size={16} />
            Could not parse budget report
          </div>
          {parseResult.errors.map((err, i) => (
            <p key={i} className="text-sm text-red-600 dark:text-red-400">
              {err}
            </p>
          ))}
          <p className="text-xs text-red-500 mt-2">
            Try downloading our template below and filling it in, or check your
            CSV has headers like: Code, Description, Budget, Actual.
          </p>
        </motion.div>
      )}

      {/* Template Download + Demo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <Download size={16} />
          Download CSV template
        </button>
        <button
          onClick={onLoadDemo}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
        >
          <Sparkles size={16} />
          Try with demo data
        </button>
      </motion.div>

      {/* What gets analysed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
          <Info size={16} className="text-amber-500" />
          What happens when you upload
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            {
              icon: BarChart3,
              text: "Auto-detects CFR codes and maps every line",
            },
            {
              icon: AlertTriangle,
              text: "Flags overspend and underspend by category",
            },
            {
              icon: Users,
              text: "Calculates ICFP metrics (staffing %, contact ratio)",
            },
            {
              icon: Target,
              text: "Generates decision cards when issues are found",
            },
            {
              icon: Leaf,
              text: "Suggests department saving initiatives with CO2 tags",
            },
            {
              icon: Send,
              text: "Auto-drafts staff communications from decisions",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 text-muted-foreground"
            >
              <item.icon size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================
// BUDGET DASHBOARD (after upload or demo)
// =====================================================

function BudgetDashboard({
  plan,
  parseResult,
  onReset,
}: {
  plan: BudgetPlan;
  parseResult: ParseResult | null;
  onReset: () => void;
}) {
  const position = useMemo(() => calculateBudgetPosition(plan), [plan]);
  const decisionCards = useMemo(
    () => generateDecisionCards(position, DEMO_ISSUES, DEMO_STOCK_ALERTS, plan),
    [position, plan],
  );

  const [activeTab, setActiveTab] = useState<
    "overview" | "decisions" | "icfp" | "initiatives" | "comms" | "transactions"
  >("overview");
  const [decidedCards, setDecidedCards] = useState<
    Record<string, { option: number; comms?: StaffCommunication[] }>
  >({});
  const [txnAnalysis, setTxnAnalysis] = useState<TransactionAnalysis | null>(
    null,
  );

  function handleDecision(cardId: string, optionIndex: number) {
    const card = decisionCards.find((c) => c.id === cardId);
    if (!card) return;
    const option = card.options[optionIndex];
    const comms = generateStaffComms(card, option);
    setDecidedCards((prev) => ({
      ...prev,
      [cardId]: { option: optionIndex, comms },
    }));
  }

  const pendingCount = decisionCards.filter((c) => !decidedCards[c.id]).length;
  const totalAlerts = position.alerts.length;
  const criticalAlerts = position.alerts.filter(
    (a) => a.severity === "critical",
  ).length;

  const tabs = [
    { id: "overview" as const, label: "Budget Overview", icon: BarChart3 },
    {
      id: "decisions" as const,
      label: `Decisions${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
      icon: Target,
    },
    { id: "icfp" as const, label: "ICFP Analysis", icon: Users },
    { id: "initiatives" as const, label: "Saving Ideas", icon: Leaf },
    { id: "comms" as const, label: "Staff Comms", icon: Send },
    {
      id: "transactions" as const,
      label: txnAnalysis
        ? `Transactions (${txnAnalysis.summary.flagged_count} flagged)`
        : "Transactions",
      icon: FileText,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/10 border border-amber-200/50 dark:border-amber-800/30 p-8"
      >
        <div className="absolute top-4 right-4 opacity-10">
          <PoundSterling size={180} className="text-amber-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles size={14} />
            Budget Decision Engine
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Finance
          </h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              {plan.financial_year} &middot;{" "}
              {plan.budget_cycle === "la" ? "LA Maintained" : "Academy Trust"}
              {parseResult && (
                <>
                  {" "}
                  &middot; {parseResult.detected_format} &middot;{" "}
                  {parseResult.rows_parsed} lines parsed
                </>
              )}
              {!parseResult && plan.approved_date && <> &middot; Demo data</>}
            </p>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <Upload size={12} />
              Upload new report
            </button>
          </div>
        </div>

        {/* Parse warnings */}
        {parseResult && parseResult.warnings.length > 0 && (
          <div className="relative z-10 mt-4 flex flex-wrap gap-2">
            {parseResult.warnings.map((w, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full"
              >
                <AlertTriangle size={10} />
                {w}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Budget"
          value={`£${(plan.total_expenditure_planned / 1000).toFixed(0)}k`}
          sub={`of £${(plan.total_income / 1000).toFixed(0)}k income`}
          icon={PoundSterling}
          color="amber"
        />
        <KPICard
          label="Spent + Committed"
          value={`£${((position.total_expenditure_ytd + position.total_committed) / 1000).toFixed(0)}k`}
          sub={`${position.burn_rate_percent}% burn rate`}
          icon={position.burn_rate === "over" ? TrendingUp : TrendingDown}
          color={
            position.burn_rate === "over"
              ? "red"
              : position.burn_rate === "under"
                ? "blue"
                : "green"
          }
          trend={
            position.burn_rate === "over"
              ? "up"
              : position.burn_rate === "under"
                ? "down"
                : undefined
          }
        />
        <KPICard
          label="Available"
          value={`£${(position.available_budget / 1000).toFixed(0)}k`}
          sub={`${position.months_remaining} months remaining`}
          icon={Clock}
          color="blue"
        />
        <KPICard
          label="Alerts"
          value={`${totalAlerts}`}
          sub={criticalAlerts > 0 ? `${criticalAlerts} critical` : "All clear"}
          icon={criticalAlerts > 0 ? AlertTriangle : CheckCircle2}
          color={criticalAlerts > 0 ? "red" : "green"}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <OverviewTab position={position} plan={plan} />
          )}
          {activeTab === "decisions" && (
            <DecisionsTab
              cards={decisionCards}
              decidedCards={decidedCards}
              onDecision={handleDecision}
            />
          )}
          {activeTab === "icfp" && <ICFPTab icfp={position.icfp} />}
          {activeTab === "initiatives" && <InitiativesTab />}
          {activeTab === "comms" && <CommsTab decidedCards={decidedCards} />}
          {activeTab === "transactions" && (
            <TransactionsTab
              analysis={txnAnalysis}
              onAnalysis={setTxnAnalysis}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// KPI CARD
// =====================================================

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  trend?: "up" | "down";
}) {
  const colorMap: Record<string, string> = {
    amber:
      "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800",
    green:
      "from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800",
    red: "from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800",
    blue: "from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200 dark:border-blue-800",
  };
  const iconColorMap: Record<string, string> = {
    amber: "text-amber-600 dark:text-amber-400",
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-5`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <Icon size={18} className={iconColorMap[color]} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <span
            className={`mb-1 ${trend === "up" ? "text-red-500" : "text-emerald-500"}`}
          >
            {trend === "up" ? (
              <ArrowUpRight size={18} />
            ) : (
              <ArrowDownRight size={18} />
            )}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
    </motion.div>
  );
}

// =====================================================
// OVERVIEW TAB
// =====================================================

function OverviewTab({
  position,
  plan,
}: {
  position: BudgetPosition;
  plan: BudgetPlan;
}) {
  return (
    <div className="space-y-6">
      {/* Budget Lines Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Budget Lines by CFR Code
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {Math.round(position.year_progress * 100)}% through financial year
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  Code
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  Category
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  Budget
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  Spent
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  Committed
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  Available
                </th>
                <th className="text-center px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  % Used
                </th>
                <th className="text-center px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {plan.lines.map((line, i) => {
                const usedPercent =
                  line.planned_amount > 0
                    ? Math.round(
                        ((line.actual_ytd + line.committed) /
                          line.planned_amount) *
                          100,
                      )
                    : 0;
                return (
                  <motion.tr
                    key={line.cfr_code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-bold text-slate-400">
                      {line.cfr_code}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                      {line.category}
                      {line.frozen && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                          <Ban size={10} /> Frozen
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {fmt(line.planned_amount)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {fmt(line.actual_ytd)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-400">
                      {fmt(line.committed)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {fmt(line.available)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              usedPercent > 90
                                ? "bg-red-500"
                                : usedPercent > 75
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(usedPercent, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-500 w-8 text-right">
                          {usedPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <RAGBadge rag={line.rag} />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-800 font-bold">
                <td className="px-5 py-3" colSpan={2}>
                  Total
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {fmt(plan.lines.reduce((s, l) => s + l.planned_amount, 0))}
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {fmt(plan.lines.reduce((s, l) => s + l.actual_ytd, 0))}
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {fmt(plan.lines.reduce((s, l) => s + l.committed, 0))}
                </td>
                <td className="px-5 py-3 text-right font-mono text-slate-900 dark:text-white">
                  {fmt(plan.lines.reduce((s, l) => s + l.available, 0))}
                </td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Alerts */}
      {position.alerts.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5 space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Budget Alerts
          </h2>
          {position.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl p-4 border ${
                alert.severity === "critical"
                  ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  : alert.severity === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                    : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 ${
                    alert.severity === "critical"
                      ? "text-red-500"
                      : alert.severity === "warning"
                        ? "text-amber-500"
                        : "text-blue-500"
                  }`}
                >
                  {alert.severity === "critical" ? (
                    <AlertTriangle size={16} />
                  ) : alert.severity === "info" ? (
                    <TrendingDown size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </span>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    {alert.message}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {alert.detail}
                  </p>
                  {alert.suggested_action && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 italic">
                      Suggested: {alert.suggested_action}
                    </p>
                  )}
                </div>
                <span className="ml-auto text-xs font-mono text-slate-400">
                  {alert.cfr_code}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strategic Priorities */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5 space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target size={18} className="text-amber-500" />
          Strategic Priorities (from SIP/SEF)
        </h2>
        <div className="grid gap-3">
          {plan.strategic_priorities.map((sp) => (
            <div
              key={sp.id}
              className="flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div
                className={`w-2 h-10 rounded-full ${
                  sp.status === "on_track"
                    ? "bg-emerald-500"
                    : sp.status === "paused"
                      ? "bg-amber-500"
                      : sp.status === "at_risk"
                        ? "bg-red-500"
                        : "bg-slate-300"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  {sp.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Source: {sp.source.toUpperCase()} &middot;{" "}
                  {fmt(sp.actual_spend)} of {fmt(sp.planned_spend)} spent
                </p>
              </div>
              <StatusBadge status={sp.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// DECISIONS TAB
// =====================================================

function DecisionsTab({
  cards,
  decidedCards,
  onDecision,
}: {
  cards: DecisionCard[];
  decidedCards: Record<
    string,
    { option: number; comms?: StaffCommunication[] }
  >;
  onDecision: (cardId: string, optionIndex: number) => void;
}) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
        <p className="text-lg font-semibold">No decisions pending</p>
        <p className="text-sm">The budget is on track. Well done!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cards.map((card, i) => {
        const decided = decidedCards[card.id];
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl border overflow-hidden ${
              decided
                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10"
                : card.trigger_type === "emergency"
                  ? "border-red-200 dark:border-red-800 bg-white dark:bg-slate-800/50"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
            }`}
          >
            {/* Card Header */}
            <div
              className={`p-5 border-b ${
                decided
                  ? "border-emerald-100 dark:border-emerald-900"
                  : card.trigger_type === "emergency"
                    ? "border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
                    : "border-slate-100 dark:border-slate-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <DecisionTypeIcon type={card.trigger_type} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {card.title}
                    </h3>
                    {decided && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} />
                        Decided
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line">
                    {card.situation}
                  </p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="p-5 space-y-3">
              {/* AI Recommendation */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900">
                <Sparkles
                  size={16}
                  className="text-purple-500 mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    AI Recommendation
                  </p>
                  <p className="text-sm text-purple-900 dark:text-purple-300 mt-0.5">
                    {card.ai_reasoning}
                  </p>
                </div>
              </div>

              {/* Option Cards */}
              <div className="grid gap-3 lg:grid-cols-2">
                {card.options.map((option) => {
                  const isRecommended = option.index === card.ai_recommendation;
                  const isChosen = decided?.option === option.index;

                  return (
                    <div
                      key={option.index}
                      className={`relative rounded-xl border p-4 transition-all ${
                        isChosen
                          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                          : decided
                            ? "border-slate-100 dark:border-slate-800 opacity-50"
                            : isRecommended
                              ? "border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {isRecommended && !decided && (
                        <div className="absolute -top-2.5 left-3 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
                          AI RECOMMENDED
                        </div>
                      )}
                      {isChosen && (
                        <div className="absolute -top-2.5 left-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={10} /> CHOSEN
                        </div>
                      )}

                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-1">
                        {option.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {option.description}
                      </p>

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <RiskBadge level={option.risk_level} />
                        {option.financial_impact !== 0 && (
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                            {option.financial_impact < 0
                              ? `Saves ${fmt(Math.abs(option.financial_impact))}`
                              : `Costs ${fmt(option.financial_impact)}`}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {option.implementation}
                        </span>
                      </div>

                      {/* Actions preview */}
                      <div className="mt-3 space-y-1">
                        {option.actions.slice(0, 3).map((action, ai) => (
                          <div
                            key={ai}
                            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
                          >
                            <ActionIcon type={action.type} />
                            <span>{action.description}</span>
                          </div>
                        ))}
                        {option.actions.length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{option.actions.length - 3} more actions
                          </span>
                        )}
                      </div>

                      {/* Auto-updates preview */}
                      {option.actions.some(
                        (a) => a.auto_updates.length > 0,
                      ) && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Auto-updates
                          </p>
                          {option.actions
                            .flatMap((a) => a.auto_updates)
                            .slice(0, 3)
                            .map((u, ui) => (
                              <div
                                key={ui}
                                className="flex items-center gap-1.5 text-xs text-slate-400"
                              >
                                <ArrowRight size={10} />
                                <span className="font-mono text-[10px]">
                                  {u.target}
                                </span>
                                <span>{u.description}</span>
                              </div>
                            ))}
                        </div>
                      )}

                      {!decided && (
                        <button
                          onClick={() => onDecision(card.id, option.index)}
                          className={`mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                            isRecommended
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          Choose this option
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cross-module impacts */}
              {card.cross_module_impacts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Cross-module impacts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {card.cross_module_impacts.map((impact, ii) => (
                      <div
                        key={ii}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                          impact.impact_type === "negative"
                            ? "border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
                            : impact.impact_type === "positive"
                              ? "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <ModuleIcon module={impact.module} />
                        {impact.module}: {impact.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// =====================================================
// ICFP TAB
// =====================================================

function ICFPTab({ icfp }: { icfp: ICFPMetrics }) {
  const metrics = [
    {
      key: "staffing_percent",
      label: "Total Staffing % of Income",
      value: icfp.staffing_percent,
      target: "75-78%",
      max: 78,
      redLine: 80,
      format: (v: number) => `${v.toFixed(1)}%`,
      detail:
        "DfE recommends staffing costs should not exceed 78% of total income. Above 80% is a red flag.",
    },
    {
      key: "teacher_contact_ratio",
      label: "Teacher Contact Ratio",
      value: icfp.teacher_contact_ratio || 0.78,
      target: "0.78",
      max: 0.85,
      redLine: 0.85,
      format: (v: number) => v.toFixed(2),
      detail:
        "Proportion of teacher time spent teaching. ~10% PPA, ~10% management, ~2% margin.",
    },
    {
      key: "pupil_teacher_ratio",
      label: "Pupil:Teacher Ratio",
      value: icfp.pupil_teacher_ratio || 22.4,
      target: "Compare to similar schools",
      max: 35,
      redLine: 30,
      format: (v: number) => v.toFixed(1),
      detail:
        "Number of pupils per teacher. Compared against 30 similar schools.",
    },
    {
      key: "average_class_size",
      label: "Average Class Size",
      value: icfp.average_class_size || 27.2,
      target: "Compare to similar schools",
      max: 35,
      redLine: 32,
      format: (v: number) => v.toFixed(1),
      detail: "Total pupil periods divided by total teaching periods.",
    },
    {
      key: "average_teacher_cost",
      label: "Average Teacher Cost",
      value: icfp.average_teacher_cost || 48500,
      target: "Compare to similar schools",
      max: 65000,
      redLine: 60000,
      format: (v: number) => `£${(v / 1000).toFixed(1)}k`,
      detail:
        "Total teacher pay divided by FTE teachers. Includes TLRs and SEN allowances.",
    },
    {
      key: "leadership_percent",
      label: "Senior Leadership % of Income",
      value: icfp.leadership_percent || 8.2,
      target: "Compare to similar schools",
      max: 15,
      redLine: 12,
      format: (v: number) => `${v.toFixed(1)}%`,
      detail: "Leadership pay as a proportion of total grant income.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <Users size={18} className="text-indigo-500" />
          ICFP &mdash; The Magnificent Seven
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          DfE Integrated Curriculum and Financial Planning metrics. These
          compare your school to 30 similar schools nationally.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          {metrics.map((m) => {
            const pct =
              m.key === "average_teacher_cost"
                ? (m.value / m.max) * 100
                : m.key === "staffing_percent" || m.key === "leadership_percent"
                  ? (m.value / m.max) * 100
                  : (m.value / m.max) * 100;
            const isRed =
              m.key === "staffing_percent" || m.key === "leadership_percent"
                ? m.value > m.redLine
                : m.value > m.redLine;
            const isAmber =
              !isRed &&
              ((m.key === "staffing_percent" && m.value > 75) ||
                (m.key !== "staffing_percent" && pct > 75));

            return (
              <div
                key={m.key}
                className="rounded-xl border border-slate-100 dark:border-slate-700 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {m.label}
                  </h3>
                  <span
                    className={`text-lg font-black ${
                      isRed
                        ? "text-red-600"
                        : isAmber
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {m.format(m.value)}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isRed
                        ? "bg-red-500"
                        : isAmber
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                  {/* Red line marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-red-400"
                    style={{
                      left: `${(m.redLine / m.max) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">
                    Target: {m.target}
                  </span>
                  <span className="text-[10px] text-red-400">
                    Red line:{" "}
                    {m.key === "average_teacher_cost"
                      ? `£${(m.redLine / 1000).toFixed(0)}k`
                      : m.redLine}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {m.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// INITIATIVES TAB
// =====================================================

function InitiativesTab() {
  const [expandedDept, setExpandedDept] = useState<string | null>("Premises");

  const departments = Object.entries(DEPARTMENT_INITIATIVES);
  const totalSaving = departments.reduce(
    (sum, [, initiatives]) =>
      sum + initiatives.reduce((s, i) => s + i.estimated_saving, 0),
    0,
  );
  const climateCount = departments.reduce(
    (sum, [, initiatives]) =>
      sum + initiatives.filter((i) => i.climate_action).length,
    0,
  );
  const totalCO2 = departments.reduce(
    (sum, [, initiatives]) =>
      sum + initiatives.reduce((s, i) => s + (i.co2_saving_kg || 0), 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 p-5 text-center">
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
            {fmt(totalSaving)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold">
            Potential annual saving
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 border border-green-200 dark:border-green-800 p-5 text-center">
          <p className="text-3xl font-black text-green-700 dark:text-green-400">
            {climateCount}
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 font-semibold">
            Climate action initiatives
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border border-teal-200 dark:border-teal-800 p-5 text-center">
          <p className="text-3xl font-black text-teal-700 dark:text-teal-400">
            {(totalCO2 / 1000).toFixed(1)}t
          </p>
          <p className="text-xs text-teal-600 dark:text-teal-500 font-semibold">
            Potential CO2 reduction
          </p>
        </div>
      </div>

      {/* Department Accordions */}
      <div className="space-y-3">
        {departments.map(([dept, initiatives]) => {
          const isExpanded = expandedDept === dept;
          const deptSaving = initiatives.reduce(
            (s, i) => s + i.estimated_saving,
            0,
          );
          const deptClimate = initiatives.filter(
            (i) => i.climate_action,
          ).length;

          return (
            <div
              key={dept}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden"
            >
              <button
                onClick={() => setExpandedDept(isExpanded ? null : dept)}
                className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <DeptIcon dept={dept} />
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {dept}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {initiatives.length} initiatives &middot; {fmt(deptSaving)}
                    /yr saving &middot; {deptClimate} climate actions
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className={`text-slate-400 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-3">
                      {initiatives.map((initiative) => (
                        <InitiativeCard
                          key={initiative.id}
                          initiative={initiative}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InitiativeCard({ initiative }: { initiative: SavingInitiative }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-700 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
              {initiative.title}
            </h4>
            {initiative.climate_action && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                <Leaf size={10} />
                {initiative.climate_category?.replace("_", " ")}
              </span>
            )}
            <EffortBadge effort={initiative.effort} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {initiative.description}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {initiative.implementation}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {fmt(initiative.estimated_saving)}
          </p>
          <p className="text-[10px] text-slate-400">
            /{initiative.saving_period}
          </p>
          {initiative.co2_saving_kg && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              -{initiative.co2_saving_kg}kg CO2
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// COMMS TAB
// =====================================================

function CommsTab({
  decidedCards,
}: {
  decidedCards: Record<
    string,
    { option: number; comms?: StaffCommunication[] }
  >;
}) {
  const allComms = Object.values(decidedCards).flatMap((d) => d.comms || []);

  if (allComms.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500">
        <Send size={48} className="mx-auto mb-4" />
        <p className="text-lg font-semibold">No communications yet</p>
        <p className="text-sm">
          Make a decision on the Decisions tab to auto-generate staff
          communications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        These communications were auto-generated from your decisions. Review and
        approve before sending.
      </p>
      {allComms.map((comm) => (
        <div
          key={comm.id}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <AudienceBadge audience={comm.audience} />
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                {comm.subject}
              </p>
              <p className="text-xs text-slate-400">
                Tone: {comm.tone} &middot; Status: {comm.status}
              </p>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 transition-colors flex items-center gap-1">
                <ThumbsUp size={12} />
                Approve
              </button>
              <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors flex items-center gap-1">
                <FileText size={12} />
                Edit
              </button>
            </div>
          </div>
          <div className="p-5">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
              {comm.body}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// TRANSACTIONS TAB
// =====================================================

function TransactionsTab({
  analysis,
  onAnalysis,
}: {
  analysis: TransactionAnalysis | null;
  onAnalysis: (a: TransactionAnalysis) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">(
    "all",
  );
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const txns = parseTransactionCSV(text);
      const result = analyseTransactions(txns);
      onAnalysis(result);
    },
    [onAnalysis],
  );

  const handleLoadDemo = useCallback(() => {
    const csv = generateSampleTransactionCSV();
    const txns = parseTransactionCSV(csv);
    const result = analyseTransactions(txns);
    onAnalysis(result);
  }, [onAnalysis]);

  // Upload prompt if no analysis yet
  if (!analysis) {
    return (
      <div className="space-y-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
          }}
          onClick={() => fileRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
              : "border-slate-200 dark:border-slate-700 hover:border-amber-300"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
            className="hidden"
          />
          <Upload
            size={32}
            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
          />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Upload transaction data to analyse
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Bank statement, purchase ledger, or card statement CSV
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
          >
            <Sparkles size={16} />
            Try with demo transactions
          </button>
          <p className="text-xs text-slate-400 mt-2">
            Includes 3 kettles, weekly biscuits, split transactions, and
            auto-renewing subscriptions
          </p>
        </div>
      </div>
    );
  }

  const { summary, duplicate_groups, recurring, transactions, flags } =
    analysis;
  const filteredFlags =
    filter === "all" ? flags : flags.filter((f) => f.severity === filter);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniKPI
          label="Transactions"
          value={summary.total_transactions.toString()}
          color="slate"
        />
        <MiniKPI
          label="Total Spend"
          value={fmt(summary.total_spend)}
          color="amber"
        />
        <MiniKPI
          label="Flagged"
          value={`${summary.flagged_count}`}
          sub={`£${summary.flagged_spend.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`}
          color="red"
        />
        <MiniKPI
          label="Potential Savings"
          value={fmt(summary.potential_savings)}
          color="green"
        />
        <MiniKPI
          label="Non-Essential"
          value={fmt(summary.non_essential_total)}
          color="orange"
        />
      </div>

      {/* Duplicate Groups (the kettles etc) */}
      {duplicate_groups.length > 0 && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800/50 overflow-hidden">
          <div className="p-4 border-b border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <h3 className="font-bold text-red-900 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Duplicate / Repeat Purchases — Challenge These
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {duplicate_groups.map((group) => {
              const isExpanded = expandedGroup === group.item_description;
              return (
                <div key={group.item_description}>
                  <button
                    onClick={() =>
                      setExpandedGroup(
                        isExpanded ? null : group.item_description,
                      )
                    }
                    className="w-full flex items-center gap-4 p-4 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-700 dark:text-red-400 font-black text-sm">
                      {group.transactions.length}x
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">
                        {group.item_description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {group.challenge}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">
                      {fmt(group.total_spend)}
                    </span>
                    <ChevronRight
                      size={16}
                      className={`text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-2">
                          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-800 dark:text-red-300">
                            {group.challenge}
                          </div>
                          {group.transactions.map((txn) => (
                            <div
                              key={txn.id}
                              className="flex items-center gap-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 p-3"
                            >
                              <span className="text-slate-400 font-mono w-20">
                                {txn.date}
                              </span>
                              <span className="text-slate-600 dark:text-slate-400 flex-1">
                                {txn.supplier}
                              </span>
                              <span className="text-slate-500 flex-1">
                                {txn.description}
                              </span>
                              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                                {fmt(txn.amount)}
                              </span>
                              {!txn.approved_by && (
                                <span className="text-red-500 text-[10px] font-bold">
                                  NO APPROVAL
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recurring / Subscriptions */}
      {recurring.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Recurring Payments & Subscriptions
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recurring.map((rec, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div
                  className={`w-2 h-10 rounded-full ${rec.essential ? "bg-emerald-400" : "bg-amber-400"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {rec.supplier}
                    </p>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                      {rec.frequency}
                    </span>
                    {!rec.essential && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        REVIEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {rec.description}
                    {rec.review_reason && (
                      <span className="block text-amber-600 dark:text-amber-400 mt-0.5">
                        {rec.review_reason}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-sm text-slate-900 dark:text-white">
                    ~{fmt(rec.average_amount)}/
                    {rec.frequency === "monthly" ? "mo" : rec.frequency}
                  </p>
                  <p className="text-xs text-slate-400">
                    {fmt(rec.total_ytd)} YTD ({rec.transaction_count} payments)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Flags */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 flex-wrap">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye size={16} className="text-indigo-500" />
            All Flags
          </h3>
          <div className="flex gap-1 ml-auto">
            {(["all", "critical", "warning", "info"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === f
                    ? f === "critical"
                      ? "bg-red-100 text-red-700"
                      : f === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : f === "info"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-700"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f === "all"
                  ? `All (${flags.length})`
                  : `${f} (${summary.by_severity[f] || 0})`}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
          {filteredFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <FlagIcon type={flag.type} severity={flag.severity} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  {flag.message}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {flag.detail}
                </p>
              </div>
              {flag.potential_saving && flag.potential_saving > 0 && (
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  Save {fmt(flag.potential_saving)}
                </span>
              )}
            </div>
          ))}
          {filteredFlags.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No flags at this severity level
            </div>
          )}
        </div>
      </div>

      {/* Top Suppliers */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-amber-500" />
          Top Suppliers by Spend
        </h3>
        <div className="space-y-2">
          {summary.top_suppliers.slice(0, 8).map((supplier) => {
            const pct = (supplier.total / summary.total_spend) * 100;
            return (
              <div key={supplier.name} className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-40 truncate">
                  {supplier.name}
                </span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct > 20 ? "bg-red-500" : pct > 10 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-500 w-20 text-right">
                  {fmt(supplier.total)}
                </span>
                <span className="text-xs text-slate-400 w-12 text-right">
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload new */}
      <div className="text-center">
        <button
          onClick={() => onAnalysis(null as unknown as TransactionAnalysis)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Upload different transaction file
        </button>
      </div>
    </div>
  );
}

function MiniKPI({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    slate: "border-slate-200 dark:border-slate-700",
    amber: "border-amber-200 dark:border-amber-800",
    red: "border-red-200 dark:border-red-800",
    green: "border-emerald-200 dark:border-emerald-800",
    orange: "border-orange-200 dark:border-orange-800",
  };
  return (
    <div className={`rounded-xl border ${colors[color]} p-3 text-center`}>
      <p className="text-lg font-black text-slate-900 dark:text-white">
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
        {label}
      </p>
    </div>
  );
}

function FlagIcon({ type, severity }: { type: string; severity: string }) {
  const iconMap: Record<string, React.ElementType> = {
    duplicate_purchase: Package,
    repeat_similar: Package,
    non_essential: Ban,
    split_transaction: AlertTriangle,
    unusual_timing: Clock,
    supplier_concentration: Users,
    round_number: PoundSterling,
    auto_renewal: Clock,
    quantity_anomaly: Package,
    price_anomaly: TrendingUp,
    budget_year_rush: TrendingUp,
    no_approval: Shield,
    exceeds_threshold: AlertTriangle,
  };
  const colorMap: Record<string, string> = {
    critical: "text-red-500 bg-red-50 dark:bg-red-950/20",
    warning: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
    info: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
  };
  const Icon = iconMap[type] || Eye;
  return (
    <div
      className={`p-1.5 rounded-lg shrink-0 ${colorMap[severity] || colorMap.info}`}
    >
      <Icon size={14} />
    </div>
  );
}

// =====================================================
// SHARED COMPONENTS
// =====================================================

function RAGBadge({ rag }: { rag: "red" | "amber" | "green" }) {
  const styles = {
    red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    amber:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    green:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[rag]}`}
    >
      {rag}
    </span>
  );
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const styles = {
    low: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    medium:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    high: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[level]}`}
    >
      <Shield size={10} />
      {level} risk
    </span>
  );
}

function EffortBadge({ effort }: { effort: "low" | "medium" | "high" }) {
  const styles = {
    low: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
    medium: "text-amber-600 bg-amber-50 dark:bg-amber-950/20",
    high: "text-red-600 bg-red-50 dark:bg-red-950/20",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[effort]}`}
    >
      {effort} effort
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    on_track:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    at_risk: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    paused:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    deferred:
      "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
    completed:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || map.deferred}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function DecisionTypeIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: React.ElementType; color: string }> = {
    emergency: { icon: AlertTriangle, color: "text-red-500" },
    overspend: { icon: TrendingUp, color: "text-amber-500" },
    benchmark_flag: { icon: Users, color: "text-indigo-500" },
    stock_alert: { icon: Package, color: "text-teal-500" },
    opportunity: { icon: Sparkles, color: "text-purple-500" },
    compliance: { icon: Shield, color: "text-blue-500" },
    strategic_review: { icon: Target, color: "text-orange-500" },
  };
  const config = icons[type] || icons.strategic_review;
  const Icon = config.icon;
  return <Icon size={20} className={`${config.color} shrink-0`} />;
}

function ActionIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    pause: Pause,
    cut: Ban,
    defer: Clock,
    reallocate: ArrowRight,
    approve: CheckCircle2,
    block_orders: Ban,
    reduce: TrendingDown,
    monitor: Eye,
  };
  const Icon = icons[type] || ArrowRight;
  return <Icon size={12} className="shrink-0" />;
}

function ModuleIcon({ module }: { module: string }) {
  const icons: Record<string, React.ElementType> = {
    hr: Users,
    estates: Building2,
    teaching: GraduationCap,
    finance: PoundSterling,
    compliance: Shield,
  };
  const Icon = icons[module] || Zap;
  return <Icon size={12} />;
}

function DeptIcon({ dept }: { dept: string }) {
  const icons: Record<string, { icon: React.ElementType; color: string }> = {
    Premises: {
      icon: Building2,
      color: "text-teal-500 bg-teal-50 dark:bg-teal-950/20",
    },
    Teaching: {
      icon: GraduationCap,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
    },
    Office: {
      icon: FileText,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
    },
    ICT: {
      icon: Zap,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
    },
    Catering: {
      icon: Package,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
    },
  };
  const config = icons[dept] || icons.Office;
  const Icon = config.icon;
  return (
    <div className={`p-2 rounded-xl ${config.color}`}>
      <Icon size={18} />
    </div>
  );
}

function AudienceBadge({ audience }: { audience: string }) {
  const map: Record<string, { label: string; color: string }> = {
    all_staff: {
      label: "All Staff",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    },
    slt: {
      label: "SLT",
      color:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    },
    department_heads: {
      label: "Dept Heads",
      color:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    },
    governors: {
      label: "Governors",
      color:
        "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
    },
  };
  const config = map[audience] || map.all_staff;
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function fmt(n: number): string {
  return `£${n.toLocaleString("en-GB")}`;
}
