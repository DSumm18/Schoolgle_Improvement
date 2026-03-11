"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  File,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExtractedFact {
  label: string;
  value: string;
  source: string;
}

interface PrepData {
  summary: string;
  extracted_facts: ExtractedFact[];
  placeholder_replacements: Record<string, string>;
  concerns: string[];
  context_notes: string[];
  suggested_opening?: string;
}

interface Props {
  meetingId: string;
  organizationId: string;
  onPrepared?: (prepData: PrepData) => void;
  existingPrep?: PrepData | null;
}

export function MeetingDocUpload({
  meetingId,
  organizationId,
  onPrepared,
  existingPrep,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [prepData, setPrepData] = useState<PrepData | null>(
    existingPrep || null,
  );
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const allowed = ["pdf", "docx", "doc", "txt", "csv", "xlsx"];
    const valid = Array.from(newFiles).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ext && allowed.includes(ext);
    });
    setFiles((prev) => [...prev, ...valid]);
    setError(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("organizationId", organizationId);
      files.forEach((f) => formData.append("files", f));

      const res = await fetch(`/api/meetings/${meetingId}/prepare`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      setPrepData(data.preparation);
      onPrepared?.(data.preparation);
    } catch (err: any) {
      setError(err.message || "Failed to analyze documents");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Already prepared - show results
  if (prepData) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                AI Preparation Complete
              </h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 leading-relaxed">
                {prepData.summary}
              </p>
            </div>
          </div>

          {/* Extracted facts */}
          {prepData.extracted_facts.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-800/40 rounded-xl p-4 mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                Key Facts Extracted
              </h4>
              <div className="grid gap-2">
                {prepData.extracted_facts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      size={14}
                      className="text-emerald-500 mt-0.5 shrink-0"
                    />
                    <span className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {fact.label}:
                      </span>{" "}
                      {fact.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {prepData.concerns.length > 0 && (
            <div className="bg-amber-50/80 dark:bg-amber-900/20 rounded-xl p-4 mb-3 border border-amber-200 dark:border-amber-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Points to Note
              </h4>
              <ul className="space-y-1.5">
                {prepData.concerns.map((c, i) => (
                  <li
                    key={i}
                    className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2"
                  >
                    <span className="text-amber-400 mt-1">&bull;</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Context notes */}
          {prepData.context_notes.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-800/40 rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Info size={12} />
                Additional Context
              </h4>
              <ul className="space-y-1.5">
                {prepData.context_notes.map((n, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-slate-400 mt-1">&bull;</span>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setPrepData(null);
              setFiles([]);
            }}
            className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Upload different documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <Sparkles
              size={16}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              AI Meeting Preparation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload absence records, OH reports, or letters. AI will extract
              key facts and personalise your meeting script.
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]"
              : "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
              dragOver
                ? "bg-indigo-200 dark:bg-indigo-800"
                : "bg-indigo-100 dark:bg-indigo-900/50"
            }`}
          >
            <Upload
              size={20}
              className={
                dragOver
                  ? "text-indigo-600"
                  : "text-indigo-500 dark:text-indigo-400"
              }
            />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-indigo-500/70 dark:text-indigo-400/60 mt-1">
            PDF, DOCX, TXT, CSV supported · AI will extract key facts
            automatically
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.csv,.xlsx"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5"
              >
                <File size={16} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl gap-2 h-11 mt-2"
            >
              {analyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analysing documents...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analyse &amp; Prepare Meeting
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
