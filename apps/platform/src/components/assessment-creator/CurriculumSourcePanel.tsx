"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpenCheck, ExternalLink, FileSearch, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";

interface CurriculumSourceResponse {
  hasWebsiteScan: boolean;
  session: {
    websiteUrl: string;
    status: string;
    scrapeCompletedAt: string | null;
    createdAt: string;
  } | null;
  harvest: {
    sourceCount: number;
    usableSourceCount: number;
    highConfidenceCount: number;
    reviewRequiredCount: number;
    subjects: string[];
    yearGroups: string[];
    terms: string[];
    recommendedNextAction: string;
    sources: Array<{
      id: string;
      kind: "website_page" | "website_document";
      title: string;
      url: string;
      sourceLabel: string;
      scannedAt: string | null;
      confidence: number;
      reviewStatus: "ready_for_review" | "needs_more_evidence" | "not_curriculum";
      subjects: string[];
      yearGroups: string[];
      terms: string[];
      curriculumSignals: string[];
      topicSignals: string[];
      sourceNote: string;
    }>;
  };
  sourceSummary?: {
    pageSource?: string;
    documentSource?: string;
    sourceRule?: string;
  };
}

export function CurriculumSourcePanel() {
  const { organizationId, session } = useAuth();
  const [payload, setPayload] = useState<CurriculumSourceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSources() {
    if (!organizationId) {
      setLoading(false);
      setError("Waiting for organisation context before loading curriculum sources.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/assessment-creator/curriculum-sources?organizationId=${encodeURIComponent(organizationId)}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Could not load curriculum sources");
      }
      const data = await response.json();
      setPayload(data.data ?? data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load curriculum sources");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, session?.access_token]);

  const topSources = useMemo(() => payload?.harvest.sources.slice(0, 5) ?? [], [payload]);
  const hasSources = Boolean(payload?.harvest.sourceCount);

  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
            <BookOpenCheck size={17} />
            Curriculum source map
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Website curriculum evidence for assessment generation</h2>
          <p className="mt-1 max-w-4xl text-sm text-slate-700">
            Assessment Support uses curriculum sources detected from the school website scan, then asks a curriculum lead to approve them before teachers generate papers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSources()}
          className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && <div className="mt-4 rounded-md border border-blue-100 bg-white p-3 text-sm text-slate-600">Checking the latest website scan for curriculum pages and documents…</div>}

      {error && (
        <div className="mt-4 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && payload && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Curriculum sources" value={payload.harvest.sourceCount} helper={payload.hasWebsiteScan ? "from latest website scan" : "no scan yet"} />
            <Metric label="High confidence" value={payload.harvest.highConfidenceCount} helper="likely usable after review" />
            <Metric label="Subjects found" value={payload.harvest.subjects.length} helper={listOrDash(payload.harvest.subjects)} />
            <Metric label="Year groups found" value={payload.harvest.yearGroups.length} helper={listOrDash(payload.harvest.yearGroups)} />
          </div>

          <div className="rounded-md border border-blue-100 bg-white p-4">
            <div className="flex gap-2 text-sm text-slate-800">
              {hasSources ? <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-600" /> : <FileSearch size={17} className="mt-0.5 shrink-0 text-amber-600" />}
              <div>
                <p className="font-semibold">Recommended next action</p>
                <p className="mt-1 text-slate-700">{payload.harvest.recommendedNextAction}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Source rule: {payload.sourceSummary?.sourceRule || "Original website files stay as source of truth; Schoolgle stores source metadata, extracted signals and review status."}
                </p>
              </div>
            </div>
          </div>

          {topSources.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">Top curriculum candidates</h3>
                <span className="text-xs text-slate-500">Needs curriculum-lead approval before live teacher use</span>
              </div>
              {topSources.map((source) => (
                <article key={source.id} className="rounded-md border border-blue-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{source.sourceLabel}</span>
                        <span className={confidenceClass(source.confidence)}>{source.confidence}% confidence</span>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{reviewLabel(source.reviewStatus)}</span>
                      </div>
                      <h4 className="mt-2 text-sm font-semibold text-slate-950">{source.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{source.sourceNote}</p>
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Source
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {[...source.subjects, ...source.yearGroups, ...source.terms, ...source.curriculumSignals.slice(0, 3), ...source.topicSignals.slice(0, 4)].map((signal) => (
                      <span key={signal} className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                        {signal}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-md border border-blue-100 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function listOrDash(values: string[]) {
  return values.length ? values.join(", ") : "none detected";
}

function confidenceClass(confidence: number) {
  if (confidence >= 75) return "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700";
  if (confidence >= 55) return "rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700";
  return "rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700";
}

function reviewLabel(status: CurriculumSourceResponse["harvest"]["sources"][number]["reviewStatus"]) {
  if (status === "ready_for_review") return "Ready for review";
  if (status === "needs_more_evidence") return "Needs more evidence";
  return "Not curriculum";
}
