"use client";

import React, { useState, useRef } from "react";
import {
  GraduationCap,
  Sparkles,
  Upload,
  Mic,
  MicOff,
  FileText,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { LessonPreview } from "./LessonPreview";
import { CurriculumCheckpointPanel } from "./CurriculumCheckpointPanel";

const SUBJECTS = [
  "Maths",
  "English",
  "Science",
  "History",
  "Geography",
  "Art",
  "Music",
  "PE",
  "Computing",
  "RE",
  "French",
  "DT",
  "PSHE",
] as const;

const YEAR_GROUPS = [
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
] as const;

export function LessonStudioTeacher() {
  // Form state
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [objective, setObjective] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState("");

  // Curriculum checkpoints
  const [checkedCodes, setCheckedCodes] = useState<string[]>([]);
  const [matchedCodes, setMatchedCodes] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10 MB.");
        return;
      }
      setError(null);
      setUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVoiceToggle = () => {
    // Placeholder — voice input integration point
    setIsRecording((prev) => !prev);
  };

  const handleToggleCheckpoint = (code: string) => {
    setCheckedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleGenerate = async () => {
    if (!description.trim() && !uploadedFile) {
      setError("Please enter a lesson description or upload a lesson plan PDF.");
      return;
    }
    if (!subject) {
      setError("Please select a subject.");
      return;
    }
    if (!yearGroup) {
      setError("Please select a year group.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    // Simulate generation (placeholder — will call /api/lesson-studio/generate)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Placeholder: simulate matched curriculum codes
      const simulatedMatches = checkedCodes.length > 0
        ? checkedCodes.slice(0, 2)
        : [];
      setMatchedCodes(simulatedMatches);
      setGeneratedTitle(
        description.trim().split("\n")[0].slice(0, 60) || "Generated Lesson",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = (description.trim() || uploadedFile) && subject && yearGroup;

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <ModulePageHeader
        moduleId="teaching-learning"
        icon={GraduationCap}
        label="Teaching & Learning"
        title="Lesson Studio"
        description="Create AI-powered lessons from a description, PDF upload, or voice input. Matched to National Curriculum objectives automatically."
      />

      {/* Main layout: form + preview + checkpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Input form */}
        <div className="lg:col-span-5 space-y-4">
          {/* Subject & Year Group */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Select subject…</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Year Group
              </label>
              <select
                value={yearGroup}
                onChange={(e) => setYearGroup(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Select year…</option>
                {YEAR_GROUPS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lesson description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Lesson Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want pupils to learn in this lesson. For example: 'Introduce fractions using visual models — halves and quarters of shapes and sets of objects. Include a practical activity with paper folding.'"
              rows={6}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-3 text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {/* Learning Objective (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Learning Objective <span className="text-slate-300 dark:text-slate-600 normal-case">(optional — AI will suggest one if blank)</span>
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. To recognise, find and name a half of a shape or quantity"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2.5 text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* PDF Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Upload Lesson Plan PDF
            </label>
            {uploadedFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/10 px-4 py-3">
                <FileText className="w-5 h-5 text-pink-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(uploadedFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
                >
                  <X className="w-4 h-4 text-pink-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-slate-800 px-4 py-6 text-center transition-all group"
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600 group-hover:text-pink-400 transition-colors" />
                <p className="text-sm text-slate-400 group-hover:text-pink-500 transition-colors">
                  Click to upload a PDF lesson plan
                </p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                  Max 10 MB
                </p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Voice input + Generate buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleVoiceToggle}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isRecording
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700"
              }`}
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Voice
                </>
              )}
            </button>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Lesson
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Centre column: Preview */}
        <div className="lg:col-span-4">
          <LessonPreview
            title={generatedTitle}
            subject={subject}
            yearGroup={yearGroup}
            objective={objective}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right column: Curriculum checkpoints */}
        <div className="lg:col-span-3">
          <CurriculumCheckpointPanel
            subject={subject}
            yearGroup={yearGroup}
            checkedCodes={checkedCodes}
            onToggle={handleToggleCheckpoint}
            matchedCodes={matchedCodes}
          />
        </div>
      </div>
    </div>
  );
}
