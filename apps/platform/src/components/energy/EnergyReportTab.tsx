"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Sparkles,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Report {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  created_by: string;
  category: string;
}

interface ReportData {
  title: string;
  period: string;
  executive_summary: string;
  dec_rating?: {
    current_rating: string;
    kwh_per_sqm: number;
    benchmark_comparison: string;
    trend: string;
  };
  recommendations?: Array<{
    priority: number;
    title: string;
    description: string;
    estimated_saving: string;
    implementation: string;
  }>;
}

export function EnergyReportTab({
  organizationId,
}: {
  organizationId: string;
}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

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

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `/api/estates/energy/report?organizationId=${organizationId}`,
      );
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  }, [organizationId, authFetch]);

  // Load on first render
  if (!loadedOnce && !loading) {
    fetchReports();
  }

  const generateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await authFetch(
        `/api/estates/energy/report?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period_months: 12 }),
        },
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      if (data.html) {
        setPreviewHtml(data.html);
        setPreviewTitle(data.title ?? "Energy Report");
      }
      fetchReports();
    } catch (err: any) {
      setError(err.message ?? "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const viewReport = async (reportId: string) => {
    try {
      // Fetch the report HTML from generated_documents
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // Use direct Supabase query since we have service role access via API
      const res = await authFetch(
        `/api/estates/energy/report/${reportId}?organizationId=${organizationId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setPreviewHtml(data.body_html ?? data.html ?? "");
        setPreviewTitle(data.subject ?? "Energy Report");
      }
    } catch {
      // Try getting it from the list data
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate button + intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-500" />
            Energy Reports
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            AI-generated trustee-quality reports for governors. Auto-linked to
            the governance document suite.
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all text-sm font-medium disabled:opacity-50 shadow-md"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Energy Report
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Generation progress */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-teal-600 animate-pulse" />
                </div>
                <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Analysing energy data...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  AI is reviewing consumption, anomalies, costs and generating
                  recommendations. This takes 15-30 seconds.
                </p>
              </div>
            </div>
            {/* Progress steps */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                "Gathering data",
                "Analysing patterns",
                "Finding savings",
                "Writing report",
              ].map((step, i) => (
                <div key={step} className="text-center">
                  <div
                    className={`h-1.5 rounded-full mb-1 ${i === 0 ? "bg-teal-500" : "bg-gray-200 dark:bg-gray-700"} transition-all`}
                    style={{
                      animation: `progressStep 12s ease-in-out infinite`,
                      animationDelay: `${i * 3}s`,
                    }}
                  />
                  <span className="text-[10px] text-gray-500">{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report preview */}
      <AnimatePresence>
        {previewHtml && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {previewTitle}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Draft — review before sharing with governors
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([previewHtml], {
                      type: "text/html",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${previewTitle.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={() => setPreviewHtml(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
            <div
              className="p-6 max-h-[600px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous reports list */}
      {loadedOnce && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Previous Reports
            </h4>
          </div>
          {reports.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                No reports generated yet. Click Generate to create your first
                energy report.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                      <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.subject}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(report.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            report.status === "draft"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : report.status === "approved" ||
                                  report.status === "finalised"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {report.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewReport(report.id)}
                      className="px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/50"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
