"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Car,
  Download,
  FileSpreadsheet,
  Leaf,
  Loader2,
  PoundSterling,
  Route,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

interface MileageClaimsTabProps {
  organizationId: string;
}

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
  vehicle_type: string;
  status: string;
  co2_kg: number;
}

interface MileageResponse {
  claims: MileageClaim[];
  table_available: boolean;
  message?: string;
  summary: {
    total_miles: number;
    total_cost_gbp: number;
    total_co2_kg: number;
    claims_count: number;
  };
}

function fmtGBP(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(Math.round(value));
}

function fmtDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MileageClaimsTab({ organizationId }: MileageClaimsTabProps) {
  const [data, setData] = useState<MileageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authFetch = useCallback(async (url: string, init?: RequestInit) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string>),
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    return fetch(url, { ...init, headers });
  }, []);

  const loadMileage = useCallback(
    async (cancelledRef?: { current: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch(
          `/api/estates/energy/mileage?organizationId=${organizationId}`,
        );
        const payload = await response.json();
        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Failed to load mileage claims");
        }
        if (!cancelledRef?.current) setData(payload);
      } catch (loadError) {
        if (!cancelledRef?.current) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load mileage claims",
          );
        }
      } finally {
        if (!cancelledRef?.current) setLoading(false);
      }
    },
    [authFetch, organizationId],
  );

  useEffect(() => {
    const cancelledRef = { current: false };

    loadMileage(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  }, [loadMileage]);

  const downloadTemplate = () => {
    const csv = [
      "Date,Staff,From,To,Miles,Purpose,Rate,Vehicle",
      "2026-04-28,Jane Smith,School,Trust HQ,18.5,Heads meeting,45p,car",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "schoolgle-mileage-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCsvFile = async (file: File) => {
    setImporting(true);
    setImportMessage(null);
    setError(null);
    try {
      const csvText = await file.text();
      const response = await authFetch(
        `/api/estates/energy/mileage/import?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText }),
        },
      );
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to import mileage CSV");
      }
      const warning =
        payload.errors?.length > 0
          ? ` ${payload.errors.length} row warning${
              payload.errors.length === 1 ? "" : "s"
            }.`
          : "";
      setImportMessage(`${payload.message || "Mileage imported."}${warning}`);
      await loadMileage();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Failed to import mileage CSV",
      );
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const staffSummary = useMemo(() => {
    const staff = new Map<string, { miles: number; cost: number; claims: number }>();
    for (const claim of data?.claims ?? []) {
      const current = staff.get(claim.staff_name) ?? {
        miles: 0,
        cost: 0,
        claims: 0,
      };
      current.miles += claim.miles;
      current.cost += claim.amount;
      current.claims += 1;
      staff.set(claim.staff_name, current);
    }
    return Array.from(staff.entries())
      .map(([name, values]) => ({ name, ...values }))
      .sort((left, right) => right.miles - left.miles);
  }, [data?.claims]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-slate-900">
        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        Loading mileage claims...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <AlertTriangle className="h-5 w-5" />
        {error || "No mileage data available."}
      </div>
    );
  }

  const importControls = (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) importCsvFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
      >
        {importing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Import mileage CSV
      </button>
      <button
        type="button"
        onClick={downloadTemplate}
        className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
      >
        <Download className="h-4 w-4" />
        Download template
      </button>
    </div>
  );

  if (data.claims.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 p-8 text-center">
        <FileSpreadsheet className="mx-auto h-10 w-10 text-violet-500" />
        <h3 className="mt-3 text-lg font-semibold text-gray-900">
          No mileage claims imported yet
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
          Mileage is needed for Scope 3 business travel. The backend API is now
          ready for real claims; next we should add CSV import from finance
          exports or connect this to the finance expenses workflow.
        </p>
        <div className="mt-5 flex justify-center">{importControls}</div>
        {importMessage && (
          <p className="mt-3 text-sm font-medium text-green-700">
            {importMessage}
          </p>
        )}
        {!data.table_available && (
          <p className="mt-3 text-xs font-medium text-amber-700">
            {data.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Mileage import</h3>
          <p className="text-sm text-gray-600">
            Import finance mileage exports to feed Scope 3 carbon reporting and
            SECR readiness.
          </p>
          {importMessage && (
            <p className="mt-1 text-sm font-medium text-green-700">
              {importMessage}
            </p>
          )}
        </div>
        {importControls}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
          <Car className="h-5 w-5 text-violet-500" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Claims
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.claims_count}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
          <Route className="h-5 w-5 text-cyan-500" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Miles
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {fmtNumber(data.summary.total_miles)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
          <PoundSterling className="h-5 w-5 text-emerald-500" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Cost
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {fmtGBP(data.summary.total_cost_gbp)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
          <Leaf className="h-5 w-5 text-green-500" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            CO₂e
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(data.summary.total_co2_kg / 1000).toFixed(2)} t
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-900">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Mileage claims
            </h3>
            <p className="text-sm text-gray-500">
              Live rows from finance mileage claims, used for Scope 3 carbon.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3">Journey</th>
                  <th className="px-4 py-3">Miles</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">CO₂e</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.claims.map((claim) => (
                  <tr key={claim.id}>
                    <td className="px-4 py-3">{fmtDate(claim.date)}</td>
                    <td className="px-4 py-3 font-medium">{claim.staff_name}</td>
                    <td className="px-4 py-3">
                      <div>{claim.from} → {claim.to}</div>
                      <div className="text-xs text-gray-500">{claim.purpose}</div>
                    </td>
                    <td className="px-4 py-3">{claim.miles.toFixed(1)}</td>
                    <td className="px-4 py-3">{fmtGBP(claim.amount)}</td>
                    <td className="px-4 py-3">{claim.co2_kg.toFixed(1)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Highest mileage staff
          </h3>
          <div className="mt-4 space-y-3">
            {staffSummary.slice(0, 8).map((staff) => (
              <div key={staff.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{staff.name}</span>
                  <span>{fmtNumber(staff.miles)} mi</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-violet-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (staff.miles / Math.max(staffSummary[0]?.miles || 1, 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
