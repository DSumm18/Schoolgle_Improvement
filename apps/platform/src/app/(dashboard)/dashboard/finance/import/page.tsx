"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

type ImportMode = "dry_run" | "import";

interface ImportResult {
  dry_run?: boolean;
  can_import?: boolean;
  reason?: string;
  validation?: {
    issues?: Array<{ severity?: string; message?: string }>;
    summary?: Record<string, unknown>;
    reversals?: unknown[];
  };
  import_id?: string;
  rows_imported?: number;
  transactions_imported?: number;
  budget_lines_upserted?: number;
  suppliers_upserted?: number;
}

const currentFinancialYear = (() => {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
})();

function unwrapResponse(json: any): ImportResult {
  return json?.data ?? json;
}

export default function FinanceImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [financialYear, setFinancialYear] = useState(currentFinancialYear);
  const [isUploading, setIsUploading] = useState<ImportMode | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [incomeStatus, setIncomeStatus] = useState<string | null>(null);
  const [incomeError, setIncomeError] = useState<string | null>(null);

  const issues = result?.validation?.issues ?? [];
  const blockingIssues = useMemo(
    () => issues.filter((issue) => issue.severity === "error"),
    [issues],
  );

  async function submitFinanceFile(mode: ImportMode) {
    if (!file) {
      setError("Choose an FMS, SIMS, Sage, Access or LA spreadsheet first.");
      return;
    }

    setError(null);
    setResult(null);
    setIsUploading(mode);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("financial_year", financialYear);
      formData.append("dry_run", mode === "dry_run" ? "true" : "false");

      const headers = await getAuthHeaders();
      const response = await fetch("/api/finance/import", {
        method: "POST",
        headers,
        body: formData,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || json.message || "Finance import failed");
      }

      setResult(unwrapResponse(json));
    } catch (err: any) {
      setError(err.message || "Finance import failed");
    } finally {
      setIsUploading(null);
    }
  }

  async function addSecondmentIncome(formData: FormData) {
    setIncomeStatus(null);
    setIncomeError(null);

    const description = String(formData.get("description") || "").trim();
    const totalExpected = Number(formData.get("total_expected") || 0);
    const expectedDate = String(formData.get("expected_date") || "").trim();

    if (!description || !totalExpected || !expectedDate) {
      setIncomeError("Description, amount and expected date are required.");
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/finance/expected-income", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          financial_year: financialYear,
          description,
          category: "staff_recharge",
          cfr_code: "I07",
          total_expected: totalExpected,
          amount_received: Number(formData.get("amount_received") || 0),
          confidence: formData.get("confidence") || "confirmed",
          source: formData.get("source") || "Seconding school via LA",
          source_reference: formData.get("source_reference") || null,
          status: "expected",
          staff_name: formData.get("staff_name") || null,
          recharge_destination: formData.get("recharge_destination") || null,
          expected_dates: [
            {
              date: expectedDate,
              amount: totalExpected,
              status: "pending",
            },
          ],
          notes:
            "Holding income: service provided but recharge has not yet appeared in the ledger.",
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || json.message || "Could not add expected income");
      }
      setIncomeStatus("Expected income added to the true-position tracker.");
    } catch (err: any) {
      setIncomeError(err.message || "Could not add expected income");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#FFAA4C]/10 p-2.5">
            <FileSpreadsheet className="h-6 w-6 text-[#FFAA4C]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Finance Import
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload an FMS export, validate it, then light up the Budget Monitor.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/finance/monitor"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          View Budget Monitor
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Upload ledger export
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Works best with SIMS FMS detailed cost-centre transaction reports. CSV and Excel files are accepted.
            </p>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center hover:border-[#FFAA4C]/60 dark:border-gray-700 dark:bg-gray-950/40">
            <Upload className="mb-3 h-8 w-8 text-[#FFAA4C]" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {file ? file.name : "Choose spreadsheet"}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              .xlsx, .xls, .csv or .txt
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Financial year
              </span>
              <input
                value={financialYear}
                onChange={(event) => setFinancialYear(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#FFAA4C] focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </label>
            <button
              onClick={() => submitFinanceFile("dry_run")}
              disabled={!file || isUploading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
            >
              {isUploading === "dry_run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Validate
            </button>
            <button
              onClick={() => submitFinanceFile("import")}
              disabled={!file || isUploading !== null || blockingIssues.length > 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFAA4C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e99a3f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {result.dry_run ? "Validation complete" : "Import complete"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {result.reason || "Finance data is ready for the dashboard."}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {result.can_import === false ? "Needs review" : "Ready"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Rows" value={result.rows_imported ?? "-"} />
                <Metric label="Transactions" value={result.transactions_imported ?? "-"} />
                <Metric label="Budget lines" value={result.budget_lines_upserted ?? "-"} />
                <Metric label="Suppliers" value={result.suppliers_upserted ?? "-"} />
              </div>

              {issues.length > 0 && (
                <div className="mt-4 space-y-2">
                  {issues.slice(0, 5).map((issue, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                    >
                      {issue.message || JSON.stringify(issue)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Banknote className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Add expected income
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track recharges owed before the LA posts them.
              </p>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              addSecondmentIncome(new FormData(event.currentTarget));
            }}
            className="space-y-3"
          >
            <Input name="description" label="Description" defaultValue="Staff secondment recharge" />
            <Input name="staff_name" label="Staff member" placeholder="Mrs Smith" />
            <Input name="recharge_destination" label="Due from" placeholder="Other school / LA" />
            <Input name="total_expected" label="Amount expected" type="number" defaultValue="12000" />
            <Input name="amount_received" label="Received so far" type="number" defaultValue="0" />
            <Input name="expected_date" label="Expected date" type="date" />
            <Input name="source_reference" label="Reference" placeholder="Agreement / invoice ref" />
            <label>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Confidence
              </span>
              <select
                name="confidence"
                defaultValue="confirmed"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="confirmed">Confirmed</option>
                <option value="highly_likely">Highly likely</option>
                <option value="likely">Likely</option>
                <option value="uncertain">Uncertain</option>
              </select>
            </label>
            <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700">
              Add holding income
            </button>
          </form>

          {incomeStatus && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              {incomeStatus}
            </p>
          )}
          {incomeError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {incomeError}
            </p>
          )}
        </section>
      </div>

      {result && !result.dry_run && (
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/dashboard/finance/monitor")}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 dark:bg-white dark:text-gray-900"
          >
            Open visual dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-900">
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
        {label}
      </span>
      <input
        {...props}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#FFAA4C] focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
      />
    </label>
  );
}
