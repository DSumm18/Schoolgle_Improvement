"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FolderOpen,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { clientAuthFetch } from "@/lib/auth/client-auth-fetch";
import type { AppConnectionStatus } from "@/lib/connectors/app-connection-status";
import { useAuth } from "@/context/SupabaseAuthContext";

type AppConnectionStatusCardProps = {
  appKey: string;
  title?: string;
  compact?: boolean;
};

export default function AppConnectionStatusCard({
  appKey,
  title = "Connected evidence source",
  compact = false,
}: AppConnectionStatusCardProps) {
  const { organization, organizationId: activeOrganizationId } = useAuth();
  const organizationId = activeOrganizationId || organization?.id || "";
  const [status, setStatus] = useState<AppConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await clientAuthFetch(
        supabase,
        `/api/data-connections/app-status?appKey=${encodeURIComponent(appKey)}&organizationId=${encodeURIComponent(organizationId)}`,
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not load connection status");
      }

      setStatus(payload.status || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection status failed");
    } finally {
      setLoading(false);
    }
  }, [appKey, organizationId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleScan = async () => {
    if (!organizationId || !status?.connectionId || scanning) return;

    setScanning(true);
    setError(null);
    setScanMessage(null);
    try {
      const appScanRoute =
        appKey === "ofsted-readiness"
          ? "/api/ofsted/connections/scan"
          : appKey === "siams-readiness"
            ? "/api/siams/connections/scan"
            : "/api/data-connections/scan";
      const usesStreamedScan =
        appKey === "ofsted-readiness" || appKey === "siams-readiness";
      const response = await clientAuthFetch(
        supabase,
        appScanRoute,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            connectionId: status.connectionId,
          }),
        },
      );

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Scan failed");
      }

      if (usesStreamedScan && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const event = JSON.parse(line.slice(6));
            if (event.type === "error") {
              throw new Error(event.message || "Scan failed");
            }
            if (event.message) setScanMessage(event.message);
          }
        }
      } else {
        await response.json();
      }

      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
      setTimeout(() => setScanMessage(null), 5000);
    }
  };

  if (!organizationId || loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {!organizationId
            ? "Waiting for school context..."
            : "Checking app connection..."}
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Could not confirm connector status
              </p>
              <p className="text-sm text-amber-800/80 dark:text-amber-100/70">
                {error || "Schoolgle could not load this app's connection map."}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const connected = status.connected;
  const lastScan = status.lastScanAt
    ? new Date(status.lastScanAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not scanned yet";
  const fileSummary = compact
    ? `${status.totalFiles} files in connector`
    : `${status.matchedFiles} relevant files`;

  return (
    <Card
      className={
        connected
          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/10"
          : "border-dashed border-slate-300 dark:border-slate-700"
      }
    >
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900">
                <FolderOpen className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {title}
                </p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {status.primaryPath}
                </h2>
              </div>
              <Badge
                className={
                  connected
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                }
              >
                {connected ? "Connected" : "Not connected"}
              </Badge>
              {connected && (
                <Badge variant="outline" className="border-emerald-300">
                  {status.provider}
                </Badge>
              )}
            </div>

            <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {fileSummary}
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                Last scan: {lastScan}
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" />
                Archive folders excluded
              </div>
            </div>
            {scanMessage && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {scanMessage}
              </p>
            )}

            {!compact && (
              <div className="grid gap-3 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-2">
                <div className="rounded-xl border border-white/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Source of truth
                  </div>
                  {status.sourceOfTruth}
                </div>
                <div className="rounded-xl border border-white/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                    <Database className="h-3.5 w-3.5" />
                    Schoolgle stores
                  </div>
                  {status.databaseStores}
                </div>
              </div>
            )}
          </div>

          <Button asChild variant={connected ? "outline" : "default"} size="sm">
            <Link href="/dashboard/settings/data-connections">
              {connected ? "Manage connector" : "Connect folder"}
            </Link>
          </Button>
          {connected && status.connectionId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Refresh scan
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
