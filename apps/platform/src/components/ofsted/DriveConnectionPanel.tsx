"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen,
  CloudOff,
  Scan,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  X,
  Lock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { clientAuthFetch } from "@/lib/auth/client-auth-fetch";

interface DriveConnection {
  id: string;
  provider: string;
  folder_id: string;
  folder_name: string | null;
  connected_at: string;
  last_scan_at: string | null;
  is_active: boolean;
  scan_frequency: string;
  scan_status: string;
  scan_error: string | null;
  total_files_scanned: number;
  total_folders_scanned?: number;
  total_evidence_found: number;
  connected_by: string | null;
  access_level?: string;
  source?: "schoolgle_connector" | "ofsted_drive_connection";
}

interface ScanProgress {
  message: string;
  filesScanned: number;
  filesTotal: number;
  evidenceFound: number;
}

interface DriveConnectionPanelProps {
  organizationId: string;
  onScanComplete?: () => void;
}

export default function DriveConnectionPanel({
  organizationId,
  onScanComplete,
}: DriveConnectionPanelProps) {
  const { organization } = useAuth();
  const [connection, setConnection] = useState<DriveConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin =
    organization?.role === "admin" ||
    organization?.role === "slt" ||
    !organization?.role; // Allow connection when role not yet loaded

  // Fetch existing connection on mount
  const fetchConnection = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await clientAuthFetch(
        supabase,
        `/api/ofsted/connections?organizationId=${organizationId}`,
      );
      if (res.ok) {
        const data = await res.json();
        const conn = data.connections?.find(
          (c: DriveConnection) => c.provider === "google" && c.is_active,
        );
        setConnection(conn || null);
        if (conn?.scan_status === "error") {
          setError(conn.scan_error || "Connection error");
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  // Disconnect
  const handleDisconnect = async () => {
    if (!isAdmin || !connection) return;
    try {
      const res = await clientAuthFetch(
        supabase,
        `/api/ofsted/connections?id=${connection.id}&organizationId=${organizationId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setConnection(null);
        setError(null);
      }
    } catch {
      setError("Failed to disconnect");
    }
  };

  // Trigger a scan
  const handleScan = async () => {
    if (!connection || scanning) return;
    setScanning(true);
    setScanProgress({
      message: "Starting scan...",
      filesScanned: 0,
      filesTotal: 0,
      evidenceFound: 0,
    });
    setError(null);

    try {
      const res = await clientAuthFetch(supabase, "/api/ofsted/connections/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          connectionId: connection.id,
          folderId: connection.folder_id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scan failed");
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === "progress" || event.type === "complete") {
                  setScanProgress({
                    message: event.message || "Scanning...",
                    filesScanned: event.filesScanned || 0,
                    filesTotal: event.filesTotal || 0,
                    evidenceFound: event.evidenceFound || 0,
                  });
                } else if (event.type === "error") {
                  throw new Error(event.message || "Scan error");
                }
              } catch (e: any) {
                if (e.message && e.message !== "Scan error") {
                  // JSON parse error, skip
                }
              }
            }
          }
        }
      }

      await fetchConnection();
      onScanComplete?.();
    } catch (err: any) {
      setError(err.message || "Scan failed");
    } finally {
      setScanning(false);
      setTimeout(() => setScanProgress(null), 5000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Checking drive connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not connected state — route through the secure Schoolgle Connector.
  if (!connection) {
    return (
      <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700">
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-6">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">
              Connect Ofsted evidence through Schoolgle Connector
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Use the secure connector to create or use the dedicated
              Schoolgle folder structure, then place inspection evidence in
              Schoolgle / Ofsted Readiness. Schoolgle scans only approved
              connector folders.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <Eye className="w-3.5 h-3.5" />
              OAuth connector
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <Lock className="w-3.5 h-3.5" />
              Dedicated Schoolgle folder
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              No public sharing required
            </div>
          </div>

          {isAdmin ? (
            <div className="mx-auto max-w-xl rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/20 dark:text-blue-100">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Secure folder connection</p>
                  <p className="mt-1">
                    Connect Google Drive once in Data Connections. The
                    connector creates the Schoolgle folder map and keeps Ofsted
                    evidence inside the approved vault boundary.
                  </p>
                  <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
                    <Link href="/dashboard/settings/data-connections">
                      Open Data Connections
                    </Link>
                  </Button>
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
          ) : (
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg text-center max-w-md mx-auto">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              Only admins can connect a Google Drive folder. Please ask your
              school admin to set this up.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Connected state
  const lastScanDate = connection.last_scan_at
    ? new Date(connection.last_scan_at)
    : null;
  const hasError = connection.scan_status === "error";
  const isSchoolgleConnector = connection.source === "schoolgle_connector";

  return (
    <Card
      className={
        hasError
          ? "border-red-200 bg-red-50/50 dark:bg-red-950/10"
          : "border-green-200 bg-green-50/50 dark:bg-green-900/10"
      }
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Connection info */}
          <div className="flex items-start gap-3 flex-1">
            <div
              className={`p-2 rounded-lg ${
                hasError
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-green-100 dark:bg-green-900/30"
              }`}
            >
              {hasError ? (
                <CloudOff className="w-6 h-6 text-red-500" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">
                  {hasError
                    ? "Folder Access Lost"
                    : isSchoolgleConnector
                      ? "Schoolgle Connector active"
                      : "Google Drive Connected"}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    hasError
                      ? "border-red-300 text-red-600"
                      : "border-green-300 text-green-600"
                  }`}
                >
                  {hasError ? "ERROR" : "ACTIVE"}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] border-slate-300 text-slate-500"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  READ-ONLY
                </Badge>
                {isSchoolgleConnector && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-blue-300 text-blue-600"
                  >
                    SHARED CONNECTOR
                  </Badge>
                )}
              </div>

              {connection.folder_name && (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  <FolderOpen className="w-3.5 h-3.5 inline mr-1" />
                  {connection.folder_name}
                </p>
              )}

              {hasError && connection.scan_error && (
                <p className="text-sm text-red-600 mb-2">
                  {connection.scan_error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Connected{" "}
                  {new Date(connection.connected_at).toLocaleDateString()}
                </span>
                {lastScanDate && (
                  <span className="flex items-center gap-1">
                    <Scan className="w-3 h-3" />
                    Last scan: {lastScanDate.toLocaleDateString()}{" "}
                    {lastScanDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {connection.total_files_scanned > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {connection.total_files_scanned} files
                    {isSchoolgleConnector && connection.total_folders_scanned ? (
                      <>
                        {" "}
                        &middot; {connection.total_folders_scanned} folders
                        scanned
                      </>
                    ) : (
                      <>
                        {" "}
                        &middot; {connection.total_evidence_found} evidence
                        matched
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Scan progress */}
              {scanProgress && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-700">
                      {scanProgress.message}
                    </span>
                  </div>
                  {scanProgress.filesTotal > 0 && (
                    <>
                      <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (scanProgress.filesScanned / scanProgress.filesTotal) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-blue-600">
                        <span>
                          {scanProgress.filesScanned}/{scanProgress.filesTotal}{" "}
                          files
                        </span>
                        <span>{scanProgress.evidenceFound} evidence found</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={async () => {
                if (hasError) {
                  // Clear the error state and retry
                  setError(null);
                  try {
                    await clientAuthFetch(supabase, "/api/ofsted/connections", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        organizationId,
                        action: "clear_error",
                      }),
                    });
                    // Even if PATCH fails, just reset locally and try scanning
                  } catch {}
                  await fetchConnection();
                  // After clearing, trigger scan
                  handleScan();
                } else {
                  handleScan();
                }
              }}
              disabled={scanning}
              size="sm"
              className={
                hasError
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {scanning ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Scan className="w-4 h-4 mr-1" />
              )}
              {scanning ? "Scanning..." : hasError ? "Retry Scan" : "Scan Now"}
            </Button>
            {isAdmin && !isSchoolgleConnector && (
              <Button
                onClick={handleDisconnect}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-red-500"
                title="Remove folder connection"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {error && !hasError && (
          <p className="text-sm text-red-600 mt-3">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
