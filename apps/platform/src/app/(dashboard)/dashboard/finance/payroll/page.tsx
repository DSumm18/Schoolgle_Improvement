"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Users,
  PoundSterling,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";
import {
  parsePayrollCSV,
  summarisePayroll,
  SAMPLE_PAYROLL_CSV,
  type ParsedStaffMember,
  type PayrollSummary,
  type StaffCategory,
} from "@/lib/payroll-parser";

// ─── Category Display Config ──────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  StaffCategory,
  { label: string; color: string; bgColor: string }
> = {
  leadership: {
    label: "Leadership",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  teacher: {
    label: "Teacher",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  teaching_assistant: {
    label: "Teaching Assistant",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  support_staff: {
    label: "Support Staff",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  admin: {
    label: "Admin",
    color: "text-slate-700",
    bgColor: "bg-slate-100",
  },
  caretaker: {
    label: "Caretaker/Site",
    color: "text-teal-700",
    bgColor: "bg-teal-100",
  },
  other: {
    label: "Other",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
};

// ─── Currency Formatter ───────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ─── Main Component ───────────────────────────────────────────────────

export default function PayrollParserPage() {
  const [staff, setStaff] = useState<ParsedStaffMember[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [schoolIncome, setSchoolIncome] = useState<string>("");
  const [showAllRows, setShowAllRows] = useState(false);
  const [savingToICFP, setSavingToICFP] = useState(false);
  const [savedToICFP, setSavedToICFP] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCSV = useCallback(
    (csvText: string, name?: string) => {
      setError(null);
      setSavedToICFP(false);

      try {
        const parsed = parsePayrollCSV(csvText);

        if (parsed.length === 0) {
          setError(
            "No valid staff records found. Ensure the CSV has columns for role/job title and salary.",
          );
          return;
        }

        const income = schoolIncome ? parseFloat(schoolIncome) : undefined;
        const summaryData = summarisePayroll(parsed, income);

        setStaff(parsed);
        setSummary(summaryData);
        setFileName(name || "Pasted data");
      } catch (err: any) {
        setError(err.message || "Failed to parse CSV");
      }
    },
    [schoolIncome],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (
        !file.name.endsWith(".csv") &&
        !file.name.endsWith(".tsv") &&
        !file.name.endsWith(".txt")
      ) {
        setError("Please upload a CSV, TSV, or TXT file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        processCSV(text, file.name);
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsText(file);
    },
    [processCSV],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleSampleData = useCallback(() => {
    processCSV(SAMPLE_PAYROLL_CSV, "sample-payroll.csv");
  }, [processCSV]);

  const handleSaveToICFP = useCallback(async () => {
    if (!summary) return;
    setSavingToICFP(true);

    try {
      const res = await fetch("/api/icfp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "payroll-import",
          metrics: {
            teacher_fte: summary.teacherFTE,
            total_staff_fte: summary.totalFTE,
            leadership_fte: summary.leadershipFTE,
            leadership_cost: summary.totalLeadershipCost,
            average_teacher_cost: summary.averageTeacherCost,
            total_staff_cost: summary.totalStaffCost,
            total_teaching_cost: summary.totalTeachingCost,
            total_support_cost: summary.totalSupportCost,
            staffing_percent: summary.staffingPercent,
          },
        }),
      });

      if (res.ok) {
        setSavedToICFP(true);
      } else {
        setError(
          "Failed to save to ICFP. The endpoint may not be configured yet.",
        );
      }
    } catch {
      setError(
        "Failed to save to ICFP. The endpoint may not be configured yet.",
      );
    } finally {
      setSavingToICFP(false);
    }
  }, [summary]);

  const handleIncomeUpdate = useCallback(() => {
    if (staff.length > 0) {
      const income = schoolIncome ? parseFloat(schoolIncome) : undefined;
      setSummary(summarisePayroll(staff, income));
    }
  }, [staff, schoolIncome]);

  const displayedStaff = showAllRows ? staff : staff.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Import</h1>
          <p className="mt-1 text-gray-500">
            Upload your payroll CSV to extract ICFP workforce metrics.
            Auto-detects pay scales, classifies roles, and calculates on-costs.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <strong>Privacy-first:</strong> Payroll data is parsed locally in
            your browser. When using the API, data is processed in memory and
            never stored permanently. Staff names are not retained.
          </div>
        </div>

        {/* Upload Zone */}
        {staff.length === 0 && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                isDragging
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-300 bg-white hover:border-amber-300 hover:bg-amber-50/50"
              }`}
            >
              <Upload
                className={`mx-auto h-12 w-12 ${isDragging ? "text-amber-500" : "text-gray-400"}`}
              />
              <p className="mt-4 text-lg font-medium text-gray-700">
                Drop your payroll CSV here
              </p>
              <p className="mt-1 text-sm text-gray-500">
                or click to browse. Supports CSV, TSV, and TXT files.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-400">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              onClick={handleSampleData}
              className="mx-auto flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Try with sample data
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Results */}
        {summary && (
          <>
            {/* File Info Bar */}
            <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summary.totalStaff} staff members parsed
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStaff([]);
                  setSummary(null);
                  setFileName(null);
                  setError(null);
                  setSavedToICFP(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Upload different file
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={Users}
                label="Total Staff"
                value={`${summary.totalStaff} (${summary.totalFTE} FTE)`}
                detail={`Teaching: ${summary.teacherFTE} FTE | Support: ${summary.supportFTE} FTE`}
                color="blue"
              />
              <SummaryCard
                icon={PoundSterling}
                label="Total Staff Cost"
                value={formatCurrency(summary.totalStaffCost)}
                detail={`Teaching: ${formatCurrency(summary.totalTeachingCost)} | Support: ${formatCurrency(summary.totalSupportCost)}`}
                color="amber"
              />
              <SummaryCard
                icon={TrendingUp}
                label="Avg Teacher Cost"
                value={formatCurrency(summary.averageTeacherCost)}
                detail={`Inc. on-costs at ${formatPercent(summary.onCostsRate * 100)}`}
                color="green"
              />
              <SummaryCard
                icon={PoundSterling}
                label="Staffing %"
                value={
                  summary.staffingPercent
                    ? formatPercent(summary.staffingPercent)
                    : "—"
                }
                detail={
                  summary.staffingPercent
                    ? summary.staffingPercent > 80
                      ? "Above recommended 78% threshold"
                      : summary.staffingPercent > 75
                        ? "Within acceptable range"
                        : "Below typical range"
                    : "Enter school income below to calculate"
                }
                color={
                  summary.staffingPercent
                    ? summary.staffingPercent > 80
                      ? "red"
                      : "green"
                    : "gray"
                }
              />
            </div>

            {/* School Income Input */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Total School Income (optional)
                  </label>
                  <p className="mb-2 text-xs text-gray-500">
                    Enter your total income to calculate staffing percentage.
                    ICFP recommends max 78%.
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      £
                    </span>
                    <input
                      type="text"
                      value={schoolIncome}
                      onChange={(e) =>
                        setSchoolIncome(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      placeholder="e.g. 1500000"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>
                <button
                  onClick={handleIncomeUpdate}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                >
                  Update
                </button>
              </div>
            </div>

            {/* ICFP Metrics Panel */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    ICFP Metrics
                  </h2>
                  <p className="text-sm text-gray-500">
                    Key metrics for Integrated Curriculum and Financial Planning
                  </p>
                </div>
                <button
                  onClick={handleSaveToICFP}
                  disabled={savingToICFP || savedToICFP}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    savedToICFP
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                  }`}
                >
                  {savingToICFP ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : savedToICFP ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {savedToICFP ? "Saved to ICFP" : "Save to ICFP"}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricRow
                  label="Teacher FTE"
                  value={summary.teacherFTE.toString()}
                />
                <MetricRow
                  label="Leadership FTE"
                  value={summary.leadershipFTE.toString()}
                />
                <MetricRow
                  label="Total Staff FTE"
                  value={summary.totalFTE.toString()}
                />
                <MetricRow
                  label="Leadership Cost"
                  value={formatCurrency(summary.totalLeadershipCost)}
                />
                <MetricRow
                  label="Avg Teacher Cost"
                  value={formatCurrency(summary.averageTeacherCost)}
                />
                <MetricRow
                  label="Staffing %"
                  value={
                    summary.staffingPercent
                      ? formatPercent(summary.staffingPercent)
                      : "N/A"
                  }
                  warning={
                    summary.staffingPercent
                      ? summary.staffingPercent > 80
                      : false
                  }
                />
              </div>
            </div>

            {/* Staff Table */}
            <div className="rounded-lg bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Parsed Staff ({staff.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Name
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Role
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Category
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Pay Scale
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">
                        FTE
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">
                        Gross Salary
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">
                        On-Costs
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">
                        Total Cost
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Contract
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStaff.map((s, i) => {
                      const cat = CATEGORY_CONFIG[s.category];
                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-50 transition hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {s.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{s.role}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.bgColor} ${cat.color}`}
                            >
                              {cat.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.payPoint || s.payScale}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {s.fte}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {formatCurrency(s.grossSalary)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {formatCurrency(s.onCosts)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(s.totalCost)}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {s.contractType || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {staff.length > 10 && (
                <div className="border-t border-gray-100 px-6 py-3 text-center">
                  <button
                    onClick={() => setShowAllRows(!showAllRows)}
                    className="flex items-center gap-1 mx-auto text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    {showAllRows ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show fewer
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show all {staff.length} rows
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              <div className="text-xs text-gray-500">
                <p>
                  <strong>Pay scales:</strong> Based on 2024/25 England &amp;
                  Wales scales. MPS: M1 (£30,000) &ndash; M6 (£41,333). UPS: U1
                  (£43,266) &ndash; U3 (£46,525). Leadership: L1 (£47,185)
                  &ndash; L43 (£131,056).
                </p>
                <p className="mt-1">
                  <strong>On-costs:</strong> Calculated at 28.68% of gross
                  (employer NI + Teachers&apos; Pension Scheme contribution).
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    gray: "bg-gray-100 text-gray-400",
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorMap[color] || colorMap.gray}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`text-sm font-semibold ${warning ? "text-red-600" : "text-gray-900"}`}
      >
        {value}
        {warning && (
          <AlertCircle className="ml-1 inline h-3.5 w-3.5 text-red-500" />
        )}
      </span>
    </div>
  );
}
