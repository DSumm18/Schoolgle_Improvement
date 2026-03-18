"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw, Loader2 } from "lucide-react";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { useAuth } from "@/context/SupabaseAuthContext";
import GovernorsReportPack, {
  generateDemoReportData,
  type GovernorsReportData,
} from "@/components/governors/GovernorsReportPack";

export default function GovernorsReportPackPage() {
  const { organization, token } = useAuth();
  const [reportData, setReportData] = useState<GovernorsReportData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);

  const organizationId = organization?.id || "";

  const fetchReport = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/governance/report-pack?organizationId=${organizationId}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (res.ok) {
        const json = await res.json();
        setReportData(json);
        setUsingDemo(false);
      } else {
        // Fall back to demo data if API fails or returns insufficient data
        setReportData(generateDemoReportData());
        setUsingDemo(true);
      }
    } catch {
      // Fall back to demo data on network error
      setReportData(generateDemoReportData());
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, [organizationId, token]);

  useEffect(() => {
    if (organizationId) {
      fetchReport();
    } else {
      // No org yet, show demo
      setReportData(generateDemoReportData());
      setUsingDemo(true);
      setLoading(false);
    }
  }, [organizationId, fetchReport]);

  const handleExport = () => {
    // Future: POST to /api/documents/generate to create a PDF via the document engine
    window.print();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between print:hidden">
        <ModulePageHeader
          moduleId="governance"
          icon={FileText}
          label="Governors"
          title="Report Pack"
        />

        <div className="flex items-center gap-3">
          {usingDemo && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-medium">
              Demo Data
            </span>
          )}
          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {loading && !reportData ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generating governors report pack...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      ) : reportData ? (
        <GovernorsReportPack data={reportData} onExport={handleExport} />
      ) : null}
    </div>
  );
}
