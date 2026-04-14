"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Link2,
  PenLine,
  School,
  Check,
  ChevronRight,
  Trash2,
  RefreshCw,
  Loader2,
  BookOpen,
  X,
  AlertCircle,
} from "lucide-react";
import type { LSSchemeMapping, LSSchemeProgression, LSSchemeStep } from "@/types/lesson-studio";
import { useAuth } from "@/context/SupabaseAuthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SchemeManagerProps {
  classId: string;
  yearGroup: string;
  onSchemeConnected: () => void;
}

interface ParsedProgression {
  term: string;
  unitName: string;
  unitOrder: number;
  steps: LSSchemeStep[];
  ncCodes: string[];
}

type ConnectMode = null | "pdf" | "oak" | "paste" | "custom";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SchemeManager({ classId, yearGroup, onSchemeConnected }: SchemeManagerProps) {
  const { organizationId, session } = useAuth();
  const authHeaders: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const [schemes, setSchemes] = useState<(LSSchemeMapping & { progressions?: LSSchemeProgression[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectMode, setConnectMode] = useState<ConnectMode>(null);
  const [parsedProgressions, setParsedProgressions] = useState<ParsedProgression[]>([]);
  const [parsedName, setParsedName] = useState("");
  const [parsedSubject, setParsedSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  // Oak connector state
  const [oakSubject, setOakSubject] = useState("Mathematics");
  const [oakKeyStage, setOakKeyStage] = useState("KS2");
  const [oakResults, setOakResults] = useState<{ id: string; title: string; snippet: string }[]>([]);
  const [oakSearching, setOakSearching] = useState(false);

  // Paste state
  const [pasteText, setPasteText] = useState("");
  const [pasteSubject, setPasteSubject] = useState("Mathematics");

  // Custom upload state
  const [customDescription, setCustomDescription] = useState("");
  const [customSubject, setCustomSubject] = useState("Mathematics");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customFileRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Fetch existing schemes
  // ---------------------------------------------------------------------------

  const fetchSchemes = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await fetch(
        `/api/lesson-studio/schemes?classId=${classId}&organizationId=${organizationId}`,
        { headers: authHeaders },
      );
      const json = await res.json();
      setSchemes(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [classId, organizationId]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // ---------------------------------------------------------------------------
  // PDF Upload handler
  // ---------------------------------------------------------------------------

  const handlePdfUpload = async (file: File) => {
    setError(null);
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classId", classId);
      formData.append("organizationId", organizationId ?? "");

      const res = await fetch("/api/lesson-studio/schemes", {
        method: "POST",
        headers: { ...authHeaders, "X-Parse-Only": "true" },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to parse PDF");

      setParsedName(json.data.schemeName ?? file.name.replace(/\.pdf$/i, ""));
      setParsedSubject(json.data.subject ?? "Unknown");
      setParsedProgressions(json.data.progressions ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse PDF");
    } finally {
      setParsing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Paste objectives handler
  // ---------------------------------------------------------------------------

  const handleParseObjectives = async () => {
    if (!pasteText.trim()) return;
    setError(null);
    setParsing(true);
    try {
      const res = await fetch("/api/lesson-studio/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          action: "parse-text",
          text: pasteText,
          subject: pasteSubject,
          yearGroup,
          classId,
          organizationId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to parse objectives");

      setParsedName(json.data.schemeName ?? `${pasteSubject} Objectives`);
      setParsedSubject(json.data.subject ?? pasteSubject);
      setParsedProgressions(json.data.progressions ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse objectives");
    } finally {
      setParsing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Confirm & Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!organizationId || parsedProgressions.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-studio/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          action: "save",
          classId,
          subject: parsedSubject,
          schemeName: parsedName,
          schemeConfig: { current_unit: parsedProgressions[0]?.unitName, current_step: 0 },
          progressions: parsedProgressions,
          organizationId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save scheme");

      // Reset and refresh
      setParsedProgressions([]);
      setParsedName("");
      setParsedSubject("");
      setConnectMode(null);
      setPasteText("");
      await fetchSchemes();
      onSchemeConnected();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Disconnect
  // ---------------------------------------------------------------------------

  const handleDisconnect = async (schemeId: string) => {
    try {
      await fetch(`/api/lesson-studio/schemes?id=${schemeId}&organizationId=${organizationId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setSchemes((prev) => prev.filter((s) => s.id !== schemeId));
    } catch {
      // silent
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const SUBJECTS = [
    "Mathematics", "English", "Science", "History", "Geography",
    "Computing", "Art", "Music", "PE", "RE", "PSHE", "DT", "French",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Scheme of Work</h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect your scheme and we will superpower every lesson
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm text-red-700">{error}</div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connected schemes */}
      {schemes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Connected Schemes</h3>
          {schemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{scheme.scheme_name}</div>
                  <div className="text-xs text-gray-500">{scheme.subject}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedScheme(expandedScheme === scheme.id ? null : scheme.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {expandedScheme === scheme.id ? "Hide" : "View Progression"}
                  </button>
                  <button
                    onClick={() => handleDisconnect(scheme.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded progression view */}
              {expandedScheme === scheme.id && scheme.progressions && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                  {scheme.progressions.map((prog, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {prog.term}
                        </span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-sm font-medium text-gray-900">{prog.unit_name}</span>
                      </div>
                      <div className="space-y-1.5">
                        {prog.steps?.map((step: LSSchemeStep, j: number) => (
                          <div key={j} className="flex items-start gap-2 text-xs">
                            <span className="text-gray-400 font-mono w-5 text-right flex-shrink-0">
                              {step.step}
                            </span>
                            <span className="text-gray-700 flex-1">{step.title}</span>
                            {step.nc_codes.length > 0 && (
                              <div className="flex gap-1 flex-shrink-0">
                                {step.nc_codes.map((code, k) => (
                                  <span
                                    key={k}
                                    className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-mono"
                                  >
                                    {code}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Parsed progressions confirmation */}
      {parsedProgressions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Confirm Parsed Progression</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {parsedName} -- {parsedSubject}
            </p>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {parsedProgressions.map((prog, i) => (
              <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {prog.term}
                  </span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-sm font-medium text-gray-900">{prog.unitName}</span>
                </div>
                <div className="space-y-1.5">
                  {prog.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs">
                      <span className="text-gray-400 font-mono w-5 text-right flex-shrink-0">
                        {step.step}
                      </span>
                      <span className="text-gray-700 flex-1">{step.title}</span>
                      {step.nc_codes.length > 0 && (
                        <div className="flex gap-1 flex-shrink-0">
                          {step.nc_codes.map((code, k) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-mono"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {prog.ncCodes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-1">
                    {prog.ncCodes.map((code, k) => (
                      <span
                        key={k}
                        className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-medium"
                      >
                        NC: {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirm and Save
            </button>
            <button
              onClick={() => {
                setParsedProgressions([]);
                setParsedName("");
                setParsedSubject("");
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add scheme section */}
      {parsedProgressions.length === 0 && (
        <>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add a scheme</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ConnectCard
                icon={<Upload className="w-5 h-5" />}
                title="Upload PDF"
                description="Upload a White Rose, Hamilton Trust, Twinkl, or school plan PDF"
                active={connectMode === "pdf"}
                onClick={() => setConnectMode(connectMode === "pdf" ? null : "pdf")}
              />
              <ConnectCard
                icon={<Link2 className="w-5 h-5" />}
                title="Oak National"
                description="Connect to Oak National Academy lessons"
                active={connectMode === "oak"}
                onClick={() => setConnectMode(connectMode === "oak" ? null : "oak")}
              />
              <ConnectCard
                icon={<PenLine className="w-5 h-5" />}
                title="Paste objectives"
                description="Manually paste your term's learning objectives"
                active={connectMode === "paste"}
                onClick={() => setConnectMode(connectMode === "paste" ? null : "paste")}
              />
              <ConnectCard
                icon={<School className="w-5 h-5" />}
                title="School's own"
                description="Upload your school's custom planning documents"
                active={connectMode === "custom"}
                onClick={() => setConnectMode(connectMode === "custom" ? null : "custom")}
              />
            </div>
          </div>

          {/* PDF upload panel */}
          {connectMode === "pdf" && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type === "application/pdf") handlePdfUpload(file);
                }}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
              >
                {parsing ? (
                  <div className="space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
                    <p className="text-sm text-gray-500">Parsing scheme PDF...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600 font-medium">
                      Drop your scheme PDF here, or click to browse
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports White Rose Maths, Hamilton Trust, Twinkl, PlanBee, and generic formats
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Oak National panel */}
          {connectMode === "oak" && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={oakSubject}
                    onChange={(e) => setOakSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Key Stage</label>
                  <select
                    value={oakKeyStage}
                    onChange={(e) => setOakKeyStage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  >
                    <option value="KS1">KS1</option>
                    <option value="KS2">KS2</option>
                    <option value="KS3">KS3</option>
                    <option value="KS4">KS4</option>
                  </select>
                </div>
              </div>
              <button
                onClick={async () => {
                  setOakSearching(true);
                  try {
                    const res = await fetch(
                      `/api/lesson-studio/schemes?action=oak-search&subject=${encodeURIComponent(oakSubject)}&keyStage=${oakKeyStage}&organizationId=${organizationId}`,
                      { headers: authHeaders },
                    );
                    const json = await res.json();
                    setOakResults(json.data ?? []);
                  } catch {
                    setError("Failed to search Oak National");
                  } finally {
                    setOakSearching(false);
                  }
                }}
                disabled={oakSearching}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {oakSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Search Units
              </button>
              {oakResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {oakResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        setParsedName(`Oak: ${result.title}`);
                        setParsedSubject(oakSubject);
                        setParsedProgressions([
                          {
                            term: "Term",
                            unitName: result.title,
                            unitOrder: 1,
                            steps: [{ step: 1, title: result.title, nc_codes: [] }],
                            ncCodes: [],
                          },
                        ]);
                      }}
                      className="w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{result.title}</div>
                      <div className="text-xs text-gray-500">{result.snippet}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paste objectives panel */}
          {connectMode === "paste" && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={pasteSubject}
                  onChange={(e) => setPasteSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Learning objectives (one per line, or paste from your plan)
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={8}
                  placeholder={"Week 1: Place value - Read and write numbers to 1,000,000\nWeek 2: Place value - Determine the value of each digit\nWeek 3: Addition - Add whole numbers with more than 4 digits..."}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none font-mono"
                />
              </div>
              <button
                onClick={handleParseObjectives}
                disabled={parsing || !pasteText.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Parse Objectives
              </button>
            </div>
          )}

          {/* Custom upload panel */}
          {connectMode === "custom" && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="e.g. School maths overview 2026"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  />
                </div>
              </div>
              <input
                ref={customFileRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
              />
              <div
                onClick={() => customFileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file) handlePdfUpload(file);
                }}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
              >
                {parsing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto" />
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">Drop file here or click to browse</p>
                    <p className="text-xs text-gray-400">PDF, DOCX, XLSX, or CSV</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: ConnectCard
// ---------------------------------------------------------------------------

function ConnectCard({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all ${
        active
          ? "border-teal-400 bg-teal-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            active ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500"
          }`}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</div>
        </div>
      </div>
    </button>
  );
}
