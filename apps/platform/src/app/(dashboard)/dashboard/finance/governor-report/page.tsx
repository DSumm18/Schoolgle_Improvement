"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  FileText,
  Landmark,
  Lightbulb,
  Printer,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import {
  buildGovernorFinanceReport,
  GovernorReportConfidence,
  GovernorReportExpectedIncome,
  GovernorReportLine,
  GovernorReportMonitor,
} from "@/lib/budget-engine/governor-report";

interface MonitorData extends GovernorReportMonitor {
  budget_cycle: "la" | "academy";
  projected_year_end?: number;
  data_source?: "demo" | "supabase";
  available_years?: string[];
}

interface ExpectedIncomeApiItem {
  id: string;
  description: string;
  cfr_code?: string;
  offset_cfr_code?: string;
  total_expected: number | string;
  amount_received?: number | string;
  amount_outstanding?: number | string;
  confidence: GovernorReportConfidence;
  expected_dates?: Array<{ date: string; amount?: number; status?: string }>;
  source?: string;
  source_reference?: string;
  status?: string;
}

interface ExpectedIncomeApiResponse {
  data?: {
    items: ExpectedIncomeApiItem[];
  };
}

interface BrandingResponse {
  data?: {
    settings?: {
      logo_url?: string;
      primary_color?: string;
      secondary_color?: string;
      accent_color?: string;
    };
  };
  settings?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  };
}

const SAMPLE_EXPECTED_INCOME: GovernorReportExpectedIncome[] = [
  {
    id: "ei-1",
    description: "Pupil Premium Grant (Spring)",
    amount: 42_350,
    confidence: "confirmed",
    expected_date: "2026-04-15",
    source: "DfE via LA",
    cfr_code: "I05",
  },
  {
    id: "ei-2",
    description: "SEN Top-up Funding (3 pupils)",
    amount: 18_600,
    confidence: "highly_likely",
    expected_date: "2026-03-28",
    source: "LA SEND Team",
    cfr_code: "I03",
  },
  {
    id: "ei-3",
    description: "Staff secondment recharge (Q3)",
    amount: 12_400,
    confidence: "confirmed",
    expected_date: "2026-04-01",
    source: "Seconding school",
    cfr_code: "I07",
    offset_cfr_code: "E01",
  },
  {
    id: "ei-4",
    description: "Lettings income (Spring term)",
    amount: 3_200,
    confidence: "likely",
    expected_date: "2026-04-30",
    source: "Community lettings",
    cfr_code: "I08a",
  },
  {
    id: "ei-5",
    description: "Insurance claim settlement",
    amount: 8_750,
    confidence: "uncertain",
    expected_date: "2026-05-15",
    source: "RPA / insurer",
    cfr_code: "I10",
  },
  {
    id: "ei-6",
    description: "PE & Sport Premium (remaining)",
    amount: 9_250,
    confidence: "highly_likely",
    expected_date: "2026-04-01",
    source: "DfE via LA",
    cfr_code: "I06",
  },
];

const CONFIDENCE_STYLE: Record<GovernorReportConfidence, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  highly_likely: "bg-blue-100 text-blue-700 border-blue-200",
  likely: "bg-amber-100 text-amber-700 border-amber-200",
  uncertain: "bg-slate-100 text-slate-700 border-slate-200",
};

function money(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}£${Math.abs(Math.round(value)).toLocaleString("en-GB")}`;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function inferOffsetCode(item: ExpectedIncomeApiItem) {
  const text = `${item.description} ${item.source || ""}`.toLowerCase();
  if (item.offset_cfr_code) return item.offset_cfr_code;
  if (text.includes("secondment") || text.includes("teacher")) return "E01";
  if (text.includes("send") || text.includes("sen")) return "E03";
  if (text.includes("letting")) return "E18";
  return undefined;
}

function mapExpectedIncome(item: ExpectedIncomeApiItem): GovernorReportExpectedIncome {
  const amount =
    Number(item.amount_outstanding ?? item.total_expected ?? 0) ||
    Number(item.total_expected || 0) - Number(item.amount_received || 0);
  const expectedDate = item.expected_dates?.[0]?.date || new Date().toISOString();

  return {
    id: item.id,
    description: item.description,
    amount,
    confidence: item.confidence,
    expected_date: expectedDate,
    source: item.source_reference || item.source || "School finance note",
    cfr_code: item.cfr_code,
    offset_cfr_code: inferOffsetCode(item),
    status: item.status,
  };
}

function groupTotals(lines: GovernorReportLine[]) {
  return lines.reduce<Record<string, { budget: number; actual: number; committed: number; variance: number }>>(
    (acc, line) => {
      const key = line.group || "Other";
      acc[key] ||= { budget: 0, actual: 0, committed: 0, variance: 0 };
      acc[key].budget += line.budget;
      acc[key].actual += line.actual;
      acc[key].committed += line.committed;
      acc[key].variance += line.variance;
      return acc;
    },
    {},
  );
}

function GovernorReportSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="mx-auto max-w-6xl animate-pulse space-y-4">
        <div className="h-12 w-72 rounded-2xl bg-slate-200" />
        <div className="h-96 rounded-[2rem] bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-36 rounded-3xl bg-slate-200" />
          <div className="h-36 rounded-3xl bg-slate-200" />
          <div className="h-36 rounded-3xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function GovernorFinanceReportPage() {
  const { organization } = useAuth();
  const searchParams = useSearchParams();
  const requestedYear = searchParams.get("financial_year");
  const orgId = organization?.id;
  const fyParam = requestedYear ? `&financial_year=${requestedYear}` : "";

  const { data: monitorResponse, isLoading, error } = useSWR<
    MonitorData | { data: MonitorData }
  >(
    orgId ? `/api/finance/monitor?organizationId=${orgId}${fyParam}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  );
  const monitor =
    (monitorResponse as { data?: MonitorData } | undefined)?.data ??
    (monitorResponse as MonitorData | undefined);
  const { data: expectedResponse } = useSWR<ExpectedIncomeApiResponse>(
    orgId && monitor
      ? `/api/finance/expected-income?organizationId=${orgId}&financial_year=${monitor.financial_year}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  );
  const { data: brandingResponse } = useSWR<BrandingResponse>(
    orgId ? `/api/settings/branding?organizationId=${orgId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const expectedIncome = useMemo(() => {
    const apiItems =
      expectedResponse?.data?.items ||
      (expectedResponse as unknown as { items?: ExpectedIncomeApiItem[] })?.items ||
      [];
    return apiItems.length > 0 ? apiItems.map(mapExpectedIncome) : SAMPLE_EXPECTED_INCOME;
  }, [expectedResponse]);

  const report = useMemo(() => {
    if (!monitor) return null;
    return buildGovernorFinanceReport({
      monitor,
      expectedIncome,
      schoolName: organization?.name || monitor.school_name,
    });
  }, [expectedIncome, monitor, organization?.name]);

  if (error || !monitor?.lines) {
    if (isLoading || (!monitor && !error)) return <GovernorReportSkeleton />;

    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f3f6fb] p-6">
        <div className="max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-2xl font-black text-slate-900">
            Report data is not ready
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Schoolgle could not load the finance monitor data for this report. Return to
            Budget Monitor and try again after the latest import has finished.
          </p>
          <Link
            href="/dashboard/finance/monitor"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Budget Monitor
          </Link>
        </div>
      </div>
    );
  }

  if (!report) return <GovernorReportSkeleton />;

  const branding = brandingResponse?.data?.settings || brandingResponse?.settings;
  const logoUrl = branding?.logo_url;
  const primary = branding?.primary_color || "#1f2937";
  const totalsByGroup = groupTotals(monitor.lines);
  const expenditureGroups = Object.entries(totalsByGroup).filter(([group]) => group !== "Income");
  const generatedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <div className="sticky top-14 z-40 border-b border-slate-200/80 bg-white/90 px-6 py-3 shadow-sm backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link
            href="/dashboard/finance/monitor"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Budget Monitor
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline">
              Generated from live budget position
            </span>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
              style={{ background: primary }}
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-6 p-6 print:max-w-none print:p-0">
        <section
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:rounded-none print:shadow-none"
        >
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: primary }} />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${organization?.name || monitor.school_name} logo`} className="h-full w-full object-contain" />
                  ) : (
                    <Landmark className="h-8 w-8 text-slate-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Governor finance report</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{organization?.name || monitor.school_name}</p>
                </div>
              </div>
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <FileText className="h-3.5 w-3.5" />
                  Draft summary for governors
                </div>
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  Income and Expenditure Summary
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
                  This report summarises the current budget position using the school budget, posted transactions, commitments and expected income. It is designed to help governors understand whether the school is on track, what needs checking, and what actions are proposed.
                </p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Financial year</p>
                  <p className="mt-1 font-semibold text-slate-900">{monitor.financial_year}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Reporting point</p>
                  <p className="mt-1 font-semibold text-slate-900">{report.reportingPoint}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">Generated</p>
                  <p className="mt-1 font-semibold text-slate-900">{generatedDate}</p>
                </div>
              </div>
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current summary</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{money(report.truePosition)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Estimated position after expected income and holding items.</p>
                <div className="mt-5 grid gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-white p-3">
                    <span>FMS remaining</span>
                    <strong>{money(monitor.remaining)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white p-3">
                    <span>Cautious position</span>
                    <strong>{money(report.cautiousPosition)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white p-3">
                    <span>Projected year end</span>
                    <strong>{money(monitor.projected_surplus_deficit)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4 print:grid-cols-4">
          {[
            ["Annual budget", money(monitor.total_budget), "Approved expenditure budget"],
            ["Actual spend", money(monitor.total_spend), "Transactions posted to date"],
            ["Commitments", money(monitor.total_committed), "Known costs and holding items"],
            ["Expected income", money(expectedIncome.reduce((sum, item) => sum + item.amount, 0)), "Income not yet posted"],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
              <p className="mt-2 text-sm text-slate-500">{detail}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Summary for Governors</h2>
                <p className="text-sm text-slate-500">What the current figures indicate.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {report.sections.map((section) => (
                <article key={section.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{section.summary}</p>
                  <ul className="mt-3 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2 text-sm leading-6 text-slate-700">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Are We On Track?</h2>
                  <p className="text-sm text-slate-500">Main variances requiring explanation.</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Area</th>
                      <th className="px-4 py-3 text-right">Variance</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.keyVariances.map((line) => (
                      <tr key={`${line.cfr_code}-${line.description}`} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{line.cfr_code}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{line.description}</p>
                          <p className="text-xs text-slate-500">{line.group}</p>
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${line.variance >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {money(line.variance)}
                          <span className="ml-1 text-xs">({line.variance_percent.toFixed(1)}%)</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                              line.rag === "red"
                                ? "bg-red-100 text-red-700"
                                : line.rag === "amber"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {line.rag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">What Are We Doing About It?</h2>
                  <p className="text-sm text-slate-500">Suggested actions for the school to confirm or amend.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {report.recommendedActions.map((action, index) => (
                  <div key={action} className="flex gap-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-700">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Income Still To Be Posted</h2>
                <p className="text-sm text-slate-500">Items expected but not yet visible in the LA/FMS ledger.</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {expectedIncome.length} tracked item{expectedIncome.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Codes</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Expected</th>
                  <th className="px-4 py-3 text-left">Assurance</th>
                </tr>
              </thead>
              <tbody>
                {report.holdingItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{item.description}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.narrative}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      <p>Income: {expectedIncome.find((x) => x.id === item.id)?.cfr_code || "TBC"}</p>
                      <p>Offset: {expectedIncome.find((x) => x.id === item.id)?.offset_cfr_code || "Not linked"}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900">{money(item.amount)}</td>
                    <td className="px-4 py-4 text-slate-600">{dateLabel(item.expected_date)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${CONFIDENCE_STYLE[item.confidence]}`}>
                        {item.confidence.replace("_", " ")}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">{item.source}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Income and Expenditure Summary</h2>
                <p className="text-sm text-slate-500">Summary view to support the detailed budget table.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {expenditureGroups.map(([group, total]) => (
                <div key={group} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{group}</p>
                      <p className="text-xs text-slate-500">Budget {money(total.budget)} · Actual {money(total.actual)} · Committed {money(total.committed)}</p>
                    </div>
                    <p className={`font-black ${total.variance >= 0 ? "text-red-600" : "text-emerald-600"}`}>{money(total.variance)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Three-Year Budget View</h2>
                <p className="text-sm text-slate-500">Prepared for the next workbook import.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                [monitor.financial_year, "Current approved budget", money(monitor.projected_surplus_deficit)],
                ["Year 2", "Awaiting three-year budget tab", "To import"],
                ["Year 3", "Awaiting three-year budget tab", "To import"],
              ].map(([year, label, value]) => (
                <div key={year} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <p className="font-bold text-slate-900">{year}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                  </div>
                  <p className="font-black text-slate-900">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Next iteration: import the school’s three-year budget assumptions from the shared workbook and show movement by staffing, energy, premises and income.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Closing Position</h2>
          <p className="mt-3 max-w-5xl text-base leading-7 text-slate-600">
            Governors are asked to note the current ledger position, the expected income still awaiting posting, and the actions identified to protect a balanced budget. The report should be reviewed alongside the detailed finance workbook and updated each month as new transactions, commitments and recharge income are confirmed.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
              <p className="text-xs font-bold uppercase">Assurance</p>
              <p className="mt-2 text-sm">Budget narrative links back to CFR lines and known holding items.</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 text-amber-900">
              <p className="text-xs font-bold uppercase">Risk</p>
              <p className="mt-2 text-sm">Late LA postings and unposted invoices can distort the FMS view.</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-900">
              <p className="text-xs font-bold uppercase">Next Step</p>
              <p className="mt-2 text-sm">Update the commitments and expected income tab before the next report.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
