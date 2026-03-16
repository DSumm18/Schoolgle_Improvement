"use client";

/**
 * Pupil Assessment Uploader
 *
 * Self-contained component that handles the ENTIRE privacy flow:
 *
 * 1. School drops CSV from Arbor/SIMS/Bromcom
 * 2. Component parses it IN THE BROWSER — school sees real names in preview
 * 3. Automatically pseudonymises (HMAC-SHA256) before any server call
 * 4. Sends ONLY hashed data to our API
 * 5. When results come back, re-maps hash IDs to real names ON SCREEN
 * 6. We NEVER see real names. School NEVER thinks about encryption.
 *
 * The lookup table (hash → name) lives in React state + localStorage.
 * It never leaves the browser.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import Papa from "papaparse";
import {
  pseudonymisePupilData,
  detectMISSystem,
  mapColumns,
  getOrCreateSalt,
  type PseudonymisedPupil,
  type LookupEntry,
  type PseudonymisationResult,
} from "@/lib/pupil-pseudonymiser";

// --- Types ---

interface UploadState {
  step:
    | "idle"
    | "parsing"
    | "preview"
    | "pseudonymising"
    | "uploading"
    | "analysing"
    | "results"
    | "error";
  error?: string;
}

interface RawPreview {
  headers: string[];
  rows: Record<string, string>[];
  detectedSystem: string;
  columnMapping: Record<string, string>;
  totalRows: number;
}

interface AnalysisResults {
  importId: string;
  summary: {
    totalPupils: number;
    yearGroups: number[];
    subjects: string[];
    overallProfile: string;
  };
  insights: {
    type: string;
    title: string;
    narrative: string;
    severity: string;
    yearGroup: number;
    subject: string;
    dataEvidence: string;
    eefRecommendation: string | null;
  }[];
  groupComparisons: {
    group1Label: string;
    group2Label: string;
    subject: string;
    yearGroup: number;
    group1Pct: number;
    group2Pct: number;
    gap: number;
    significance: string;
    narrative: string;
  }[];
  teacherAssessmentCheck: {
    overall: string;
    bySubject: {
      subject: string;
      accuracy: string;
      gapMagnitude: number;
      narrative: string;
    }[];
  };
  interventionRecommendations: {
    targetGroup: string;
    targetPupilHashes: string[];
    yearGroup: number;
    subject: string;
    eefStrategy: {
      name: string;
      monthsProgress: number;
      evidenceStrength: number;
      implementationTips: string[];
    };
    rationale: string;
    reviewPoint: string;
  }[];
}

interface PupilAssessmentUploaderProps {
  organizationId: string;
  academicYear?: number;
}

// --- Severity Config ---

const SEVERITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  critical: {
    label: "CRITICAL",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  concern: {
    label: "CONCERN",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  monitor: {
    label: "MONITOR",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  positive: {
    label: "POSITIVE",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  celebrating: {
    label: "CELEBRATING",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

// --- Component ---

export default function PupilAssessmentUploader({
  organizationId,
  academicYear,
}: PupilAssessmentUploaderProps) {
  const [state, setState] = useState<UploadState>({ step: "idle" });
  const [rawPreview, setRawPreview] = useState<RawPreview | null>(null);
  const [pseudoResult, setPseudoResult] =
    useState<PseudonymisationResult | null>(null);
  const [lookup, setLookup] = useState<LookupEntry[]>([]);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [assessmentPeriod, setAssessmentPeriod] = useState("autumn");
  const [selectedYearGroup, setSelectedYearGroup] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAcademicYear =
    academicYear ||
    new Date().getFullYear() - (new Date().getMonth() < 8 ? 1 : 0);

  // Load existing lookup from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        `schoolgle_pupil_lookup_${organizationId}`,
      );
      if (stored) {
        setLookup(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, [organizationId]);

  // Save lookup to localStorage whenever it changes
  useEffect(() => {
    if (lookup.length > 0) {
      localStorage.setItem(
        `schoolgle_pupil_lookup_${organizationId}`,
        JSON.stringify(lookup),
      );
    }
  }, [lookup, organizationId]);

  /**
   * Resolve a pupil hash to a display name using the local lookup
   */
  const resolveName = useCallback(
    (hash: string): string => {
      const entry = lookup.find((l) => l.pupil_hash === hash);
      return entry?.display_name || `Pupil ${hash.substring(0, 6)}`;
    },
    [lookup],
  );

  /**
   * Handle file drop/selection
   */
  const handleFile = useCallback((file: File) => {
    setState({ step: "parsing" });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields || [];
        const rows = result.data as Record<string, string>[];

        if (rows.length === 0) {
          setState({ step: "error", error: "CSV file is empty" });
          return;
        }

        const detectedSystem = detectMISSystem(headers);
        const columnMapping = mapColumns(headers);

        setRawPreview({
          headers,
          rows: rows.slice(0, 10), // Preview first 10 rows
          detectedSystem,
          columnMapping,
          totalRows: rows.length,
        });

        // Store full rows for pseudonymisation
        (
          window as unknown as {
            _fullRows: Record<string, string>[];
            _fullHeaders: string[];
          }
        )._fullRows = rows;
        (window as unknown as { _fullHeaders: string[] })._fullHeaders =
          headers;

        setState({ step: "preview" });
      },
      error: (err) => {
        setState({
          step: "error",
          error: `Failed to parse CSV: ${err.message}`,
        });
      },
    });
  }, []);

  /**
   * Run pseudonymisation and upload
   */
  const handleAnalyse = useCallback(async () => {
    setState({ step: "pseudonymising" });

    try {
      const win = window as unknown as {
        _fullRows: Record<string, string>[];
        _fullHeaders: string[];
      };
      const rows = win._fullRows;
      const headers = win._fullHeaders;

      if (!rows || !headers) {
        setState({ step: "error", error: "CSV data lost — please re-upload" });
        return;
      }

      // Get or create school salt (stays in localStorage)
      const salt = getOrCreateSalt(organizationId);

      // Pseudonymise everything
      const result = await pseudonymisePupilData(
        rows,
        headers,
        salt,
        currentAcademicYear,
        assessmentPeriod,
      );

      setPseudoResult(result);
      setLookup((prev) => {
        // Merge new lookup entries with existing
        const existing = new Map(prev.map((l) => [l.pupil_hash, l]));
        for (const entry of result.lookup) {
          existing.set(entry.pupil_hash, entry);
        }
        return Array.from(existing.values());
      });

      if (result.pupils.length === 0) {
        setState({
          step: "error",
          error: `Could not pseudonymise data. ${result.stats.warnings.join(". ")}`,
        });
        return;
      }

      // Upload pseudonymised data
      setState({ step: "uploading" });

      const response = await fetch("/api/intelligence/pupil-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId,
          source_system: rawPreview?.detectedSystem || "manual_csv",
          academic_year_start: currentAcademicYear,
          assessment_period: assessmentPeriod,
          year_groups: result.stats.yearGroupsFound,
          pupils: result.pupils,
          auto_analyse: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setState({ step: "error", error: err.error || "Upload failed" });
        return;
      }

      setState({ step: "analysing" });
      const data = await response.json();

      if (data.analysis) {
        setResults(data.analysis);
        setState({ step: "results" });
      } else {
        setState({ step: "results" });
      }

      // Clean up
      (win as any)._fullRows = undefined;
      (win as any)._fullHeaders = undefined;
    } catch (err) {
      setState({
        step: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [organizationId, currentAcademicYear, assessmentPeriod, rawPreview]);

  // --- Drag & Drop ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      handleFile(file);
    } else {
      setState({ step: "error", error: "Please upload a CSV file" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Privacy Banner */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-800">
              Zero-Knowledge Privacy
            </h3>
            <p className="mt-1 text-sm text-green-700">
              Pupil names are <strong>encrypted in your browser</strong> before
              any data leaves this device. Schoolgle never sees, stores, or
              processes real pupil names. Only your school can see who is who.
            </p>
            <p className="mt-1 text-xs text-green-600">
              GDPR Article 25 (Data Protection by Design) &bull; Article 32
              (Pseudonymisation) &bull; ICO Compliant
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {(state.step === "idle" || state.step === "error") && (
        <div className="space-y-4">
          {state.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {state.error}
              <button
                onClick={() => setState({ step: "idle" })}
                className="ml-2 underline"
              >
                Try again
              </button>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Assessment Period
              </label>
              <select
                value={assessmentPeriod}
                onChange={(e) => setAssessmentPeriod(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="baseline">Baseline</option>
                <option value="autumn">Autumn</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Academic Year
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
                {currentAcademicYear}/{currentAcademicYear + 1}
              </div>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 transition hover:border-blue-400 hover:bg-blue-50"
          >
            <svg
              className="mb-4 h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700">
              Drop your assessment CSV here
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Export from Arbor, SIMS, Bromcom, ScholarPack, Target Tracker, or
              any MIS
            </p>
            <p className="mt-3 text-xs text-gray-400">
              CSV file &bull; Pupil names will be encrypted before upload
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Step 2: Parsing */}
      {state.step === "parsing" && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">Reading CSV file...</span>
        </div>
      )}

      {/* Step 3: Preview */}
      {state.step === "preview" && rawPreview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Data Preview — {rawPreview.totalRows} pupils detected
              </h3>
              <p className="text-sm text-gray-500">
                Detected system:{" "}
                <span className="font-medium capitalize">
                  {rawPreview.detectedSystem.replace("_", " ")}
                </span>{" "}
                &bull; Fields mapped:{" "}
                {Object.keys(rawPreview.columnMapping).length}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
              Names visible to you only — will be encrypted before upload
            </div>
          </div>

          {/* Column mapping */}
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-2 text-xs font-medium uppercase text-gray-500">
              Detected Columns
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(rawPreview.columnMapping).map(
                ([field, header]) => (
                  <span
                    key={field}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      [
                        "upn",
                        "first_name",
                        "last_name",
                        "full_name",
                        "dob",
                      ].includes(field)
                        ? "bg-red-100 text-red-700"
                        : [
                              "attainment",
                              "scaled_score",
                              "teacher_assessment",
                              "progress",
                            ].includes(field)
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {field}: &ldquo;{header}&rdquo;
                    {[
                      "upn",
                      "first_name",
                      "last_name",
                      "full_name",
                      "dob",
                    ].includes(field) && " (will encrypt)"}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Data preview table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {rawPreview.headers.slice(0, 10).map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-medium text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                  {rawPreview.headers.length > 10 && (
                    <th className="px-3 py-2 text-gray-400">
                      +{rawPreview.headers.length - 10} more
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rawPreview.rows.map((row, i) => (
                  <tr key={i}>
                    {rawPreview.headers.slice(0, 10).map((h) => (
                      <td key={h} className="px-3 py-1.5 text-gray-700">
                        {row[h] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rawPreview.totalRows > 10 && (
              <div className="border-t bg-gray-50 px-3 py-2 text-xs text-gray-500">
                Showing 10 of {rawPreview.totalRows} rows
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setState({ step: "idle" });
                setRawPreview(null);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAnalyse}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Encrypt &amp; Analyse {rawPreview.totalRows} Pupils
            </button>
          </div>
        </div>
      )}

      {/* Step 4-5: Processing */}
      {(state.step === "pseudonymising" ||
        state.step === "uploading" ||
        state.step === "analysing") && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="mt-4 text-lg font-medium text-gray-700">
            {state.step === "pseudonymising" && "Encrypting pupil names..."}
            {state.step === "uploading" && "Uploading anonymised data..."}
            {state.step === "analysing" && "Running AI analysis..."}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {state.step === "pseudonymising" &&
              "Names are being replaced with secure hashes in your browser"}
            {state.step === "uploading" &&
              "Only encrypted data is being sent — no names leave this device"}
            {state.step === "analysing" &&
              "Comparing groups, checking teacher assessments, matching EEF strategies"}
          </p>
          {pseudoResult && state.step !== "pseudonymising" && (
            <div className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-xs text-green-700">
              {pseudoResult.stats.totalPupils} pupils encrypted &bull;{" "}
              {pseudoResult.stats.subjectsFound.join(", ")} &bull; Year
              {pseudoResult.stats.yearGroupsFound.length > 1 ? "s" : ""}{" "}
              {pseudoResult.stats.yearGroupsFound.join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Step 6: Results */}
      {state.step === "results" && results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Analysis Complete
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {results.summary.overallProfile}
            </p>

            {/* Year group tabs */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedYearGroup(null)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  selectedYearGroup === null
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Years
              </button>
              {results.summary.yearGroups.map((yg) => (
                <button
                  key={yg}
                  onClick={() => setSelectedYearGroup(yg)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    selectedYearGroup === yg
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Year {yg}
                </button>
              ))}
            </div>
          </div>

          {/* Teacher Assessment Accuracy */}
          {results.teacherAssessmentCheck.bySubject.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h4 className="font-semibold text-gray-900">
                Teacher Assessment Accuracy
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                Comparing teacher assessments against test results
              </p>
              <div className="mt-3 space-y-2">
                {results.teacherAssessmentCheck.bySubject.map((subj) => (
                  <div
                    key={subj.subject}
                    className={`rounded-lg p-3 ${
                      subj.accuracy === "accurate"
                        ? "bg-green-50 border border-green-200"
                        : subj.accuracy === "tends_over"
                          ? "bg-amber-50 border border-amber-200"
                          : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {subj.subject}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          subj.accuracy === "accurate"
                            ? "bg-green-100 text-green-700"
                            : subj.accuracy === "tends_over"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {subj.accuracy === "accurate"
                          ? "Well Calibrated"
                          : subj.accuracy === "tends_over"
                            ? "Over-Assessing"
                            : "Under-Assessing"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {subj.narrative}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group Comparisons */}
          {results.groupComparisons.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h4 className="font-semibold text-gray-900">Attainment Gaps</h4>
              <p className="mt-1 text-xs text-gray-500">
                Significant gaps between groups (FSM, SEND, Gender, Pupil
                Premium)
              </p>
              <div className="mt-3 space-y-2">
                {results.groupComparisons
                  .filter(
                    (gc) =>
                      selectedYearGroup === null ||
                      gc.yearGroup === selectedYearGroup,
                  )
                  .map((gc, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 ${
                        gc.significance === "significant"
                          ? "border-red-200 bg-red-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">
                          Y{gc.yearGroup} {gc.subject}: {gc.group1Label} vs{" "}
                          {gc.group2Label}
                        </span>
                        <span
                          className={`text-xs font-bold ${Math.abs(gc.gap) >= 20 ? "text-red-700" : "text-amber-700"}`}
                        >
                          {Math.abs(gc.gap)}pp gap
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{gc.group1Label}</span>
                            <span className="font-medium">{gc.group1Pct}%</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${gc.group1Pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{gc.group2Label}</span>
                            <span className="font-medium">{gc.group2Pct}%</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${gc.group2Pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {results.insights.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h4 className="font-semibold text-gray-900">Key Insights</h4>
              <div className="mt-3 space-y-3">
                {results.insights
                  .filter(
                    (ins) =>
                      selectedYearGroup === null ||
                      ins.yearGroup === selectedYearGroup,
                  )
                  .map((insight, i) => {
                    const config =
                      SEVERITY_CONFIG[insight.severity] ||
                      SEVERITY_CONFIG.monitor;
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-4 ${config.bg} ${config.border}`}
                      >
                        <div className="flex items-start justify-between">
                          <h5 className={`font-medium ${config.text}`}>
                            {insight.title}
                          </h5>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${config.text}`}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          {insight.narrative}
                        </p>
                        {insight.eefRecommendation && (
                          <p className="mt-2 text-xs text-blue-700">
                            EEF Recommendation: {insight.eefRecommendation}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Intervention Recommendations */}
          {results.interventionRecommendations.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h4 className="font-semibold text-gray-900">
                EEF Research-Backed Interventions
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                Specific strategies matched to identified needs, with evidence
                ratings
              </p>
              <div className="mt-3 space-y-4">
                {results.interventionRecommendations
                  .filter(
                    (ir) =>
                      selectedYearGroup === null ||
                      ir.yearGroup === selectedYearGroup,
                  )
                  .map((rec, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-blue-200 bg-blue-50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-blue-800">
                            {rec.eefStrategy.name}
                          </h5>
                          <p className="text-xs text-blue-600">
                            +{rec.eefStrategy.monthsProgress} months progress
                            &bull; Evidence: {rec.eefStrategy.evidenceStrength}
                            /5
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Y{rec.yearGroup} {rec.subject}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">
                        {rec.rationale}
                      </p>

                      {/* Show affected pupils (with local name resolution) */}
                      {rec.targetPupilHashes.length > 0 &&
                        rec.targetPupilHashes.length <= 20 && (
                          <div className="mt-2 rounded bg-white/50 p-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              Pupils needing this intervention (
                              {rec.targetPupilHashes.length}):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rec.targetPupilHashes.map((hash) => (
                                <span
                                  key={hash}
                                  className="inline-block rounded bg-white px-2 py-0.5 text-xs text-gray-700 border border-gray-200"
                                >
                                  {resolveName(hash)}
                                </span>
                              ))}
                            </div>
                            <p className="mt-1 text-xs text-green-600 italic">
                              Names visible to your school only — Schoolgle sees
                              encrypted IDs
                            </p>
                          </div>
                        )}

                      <div className="mt-2 text-xs text-gray-600">
                        <strong>Review:</strong> {rec.reviewPoint}
                      </div>

                      {rec.eefStrategy.implementationTips.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500">
                            Implementation tips:
                          </p>
                          <ul className="mt-1 list-disc pl-4 text-xs text-gray-600">
                            {rec.eefStrategy.implementationTips.map(
                              (tip, j) => (
                                <li key={j}>{tip}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* New Analysis Button */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setState({ step: "idle" });
                setRawPreview(null);
                setPseudoResult(null);
                setResults(null);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Upload New Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
