"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Users,
  Loader2,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

type ImportState = "idle" | "preview" | "importing" | "complete" | "error";

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  errors: { row: number; pupil_id: string; error: string }[];
  warnings: string[];
  total_processed: number;
}

interface PreviewRow {
  pupil_id: string;
  first_name: string;
  last_name: string;
  year_group: string;
  class_name?: string;
  gender?: string;
  sen_status?: string;
  [key: string]: string | undefined;
}

export default function PupilUploadPage() {
  const { user, organizationId } = useAuth();
  const [state, setState] = useState<ImportState>("idle");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsePreview = useCallback((text: string) => {
    const lines = text
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("#"));
    if (lines.length < 2) {
      setErrorMsg("File must have a header row and at least one data row.");
      setState("error");
      return;
    }

    const hdrs = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/[\s-]/g, "_"));
    const required = ["pupil_id", "first_name", "last_name", "year_group"];
    const missing = required.filter((r) => !hdrs.includes(r));
    if (missing.length > 0) {
      setErrorMsg(
        `Missing required columns: ${missing.join(", ")}. Required: pupil_id, first_name, last_name, year_group`,
      );
      setState("error");
      return;
    }

    const rows: PreviewRow[] = [];
    for (let i = 1; i < Math.min(lines.length, 51); i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      hdrs.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row as PreviewRow);
    }

    setHeaders(hdrs);
    setPreviewRows(rows);
    setCsvText(text);
    setState("preview");
    setErrorMsg("");
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
          parsePreview(ev.target?.result as string);
        };
        reader.readAsText(file);
      }
    },
    [parsePreview],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
          parsePreview(ev.target?.result as string);
        };
        reader.readAsText(file);
      }
    },
    [parsePreview],
  );

  const handleImport = useCallback(async () => {
    if (!csvText || !organizationId) return;
    setState("importing");

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/pupils", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          csv: csvText,
          organizationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Import failed");
        setState("error");
        return;
      }

      setResult(data);
      setState("complete");
    } catch (err: any) {
      setErrorMsg(err.message || "Import failed");
      setState("error");
    }
  }, [csvText, organizationId, user]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/pupils", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ template: true }),
      });
      const data = await res.json();
      if (data.template) {
        const blob = new Blob([data.template], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || "pupil-import-template.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* empty */
    }
  }, [user]);

  const reset = () => {
    setState("idle");
    setCsvText("");
    setFileName("");
    setPreviewRows([]);
    setHeaders([]);
    setResult(null);
    setErrorMsg("");
  };

  const totalLines = csvText
    ? csvText.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"))
        .length - 1
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Connect Pupil Data
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Link your pupil roll from your MIS export or school records
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE STATE — Upload Zone */}
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-12 text-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
            >
              <Upload className="h-10 w-10 text-zinc-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                Connect a pupil data file
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Drop a CSV export here, or click to browse
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
                Accepts .csv exports from Arbor, SIMS, Bromcom, or any
                spreadsheet. Your school retains full control of this data.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Template Download */}
            <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Need a data format template?
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Download the expected column format with example data
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-emerald-300 transition-colors"
              >
                <Download size={14} />
                Download Template
              </button>
            </div>

            {/* Required Columns Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Required columns
              </p>
              <div className="flex flex-wrap gap-2">
                {["pupil_id", "first_name", "last_name", "year_group"].map(
                  (col) => (
                    <span
                      key={col}
                      className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-xs font-mono font-medium text-blue-700 dark:text-blue-300"
                    >
                      {col}
                    </span>
                  ),
                )}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Optional: class_name, gender, date_of_birth, sen_status,
                primary_need, is_pupil_premium, is_eal, fsm_eligible, ethnicity
              </p>
            </div>

            {/* Data Control Notice */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Your data, your control.
                </span>{" "}
                Schoolgle connects to the data sources you authorise. You can
                refresh, replace, or disconnect this source at any time.
                Connected pupil data powers attendance, SEND, and behaviour
                modules. You can connect additional sources later as they become
                available.
              </p>
            </div>
          </motion.div>
        )}

        {/* PREVIEW STATE */}
        {state === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* File Info */}
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    {fileName || "Pupil data"}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {totalLines} pupils found &middot; {headers.length} columns
                    detected
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Choose different file
              </button>
            </div>

            {/* Preview Table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                      <th className="px-3 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400">
                        #
                      </th>
                      {headers.slice(0, 8).map((h) => (
                        <th
                          key={h}
                          className={`px-3 py-2 text-left font-semibold ${
                            [
                              "pupil_id",
                              "first_name",
                              "last_name",
                              "year_group",
                            ].includes(h)
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                      {headers.length > 8 && (
                        <th className="px-3 py-2 text-left text-zinc-400">
                          +{headers.length - 8} more
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 10).map((row, i) => (
                      <tr
                        key={i}
                        className="border-t border-zinc-100 dark:border-zinc-800"
                      >
                        <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                        {headers.slice(0, 8).map((h) => (
                          <td
                            key={h}
                            className="px-3 py-2 text-zinc-700 dark:text-zinc-300"
                          >
                            {row[h] || (
                              <span className="text-zinc-300 dark:text-zinc-600">
                                —
                              </span>
                            )}
                          </td>
                        ))}
                        {headers.length > 8 && (
                          <td className="px-3 py-2 text-zinc-400">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalLines > 10 && (
                <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
                  Showing first 10 of {totalLines} rows
                </div>
              )}
            </div>

            {/* Import Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg"
              >
                <Upload size={16} />
                Connect {totalLines} Pupils
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            </div>
          </motion.div>
        )}

        {/* IMPORTING STATE */}
        {state === "importing" && (
          <motion.div
            key="importing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
              Connecting {totalLines} pupils...
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Validating and linking pupil records to your school
            </p>
          </motion.div>
        )}

        {/* COMPLETE STATE */}
        {state === "complete" && result && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Success Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                  Data Source Connected
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {result.imported}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Connected
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
                    {result.updated}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Updated
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-red-700 dark:text-red-300">
                    {result.errors.length}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Errors
                  </p>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Warnings
                  </p>
                </div>
                <ul className="space-y-1">
                  {result.warnings.map((w, i) => (
                    <li
                      key={i}
                      className="text-xs text-amber-700 dark:text-amber-400"
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                    {result.errors.length} row(s) could not be imported
                  </p>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p
                      key={i}
                      className="text-xs text-red-700 dark:text-red-400"
                    >
                      Row {err.row}
                      {err.pupil_id ? ` (${err.pupil_id})` : ""}: {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Upload size={14} />
                Connect Another Source
              </button>
              <a
                href="/dashboard/setup"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Users size={14} />
                Back to Setup
              </a>
            </div>
          </motion.div>
        )}

        {/* ERROR STATE */}
        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-bold text-red-800 dark:text-red-200">
                    Connection Error
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {errorMsg}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
