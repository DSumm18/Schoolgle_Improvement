"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";

// ─── Inner component reads search params ─────────────────────────────────────

function ScanPageInner() {
  const params = useSearchParams();
  const planId = params.get("plan");
  const pupilId = params.get("pupil");
  const { session, organizationId } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !planId || !pupilId) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("lessonPlanId", planId);
    formData.append("pupilId", pupilId);
    if (organizationId) formData.append("organizationId", organizationId);

    const headers: HeadersInit = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};

    try {
      const res = await fetch("/api/lesson-studio/assess", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Upload failed (${res.status})`);
      }

      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  // ─── Missing params guard ──────────────────────────────────────────────
  if (!planId || !pupilId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">Invalid scan link</h1>
        <p className="text-slate-500 text-sm text-center max-w-xs">
          This QR code is missing pupil or plan information. Please print a fresh worksheet and try again.
        </p>
      </div>
    );
  }

  // ─── Success state ─────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Work Uploaded!</h1>
        <p className="text-slate-500 text-sm text-center max-w-xs">
          AI is now grading this work. Check the Assessment tab in Lesson Studio for the results.
        </p>
      </div>
    );
  }

  // ─── Uploading / grading state ─────────────────────────────────────────
  if (uploading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
        <p className="text-slate-600 font-medium">Uploading and grading...</p>
        <p className="text-slate-400 text-sm">This usually takes a few seconds.</p>
      </div>
    );
  }

  // ─── Capture UI ────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center justify-center p-6"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <div className="text-center max-w-sm w-full">
        <Camera className="w-16 h-16 text-teal-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Scan Pupil Work</h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Take a photo of the completed worksheet. It will be automatically linked to the right pupil and graded by AI.
        </p>

        {/* Primary: camera capture */}
        <label className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-teal-600 text-white font-semibold rounded-2xl hover:bg-teal-700 cursor-pointer transition-colors shadow-sm mb-3">
          <Camera className="w-5 h-5" />
          Take Photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            className="hidden"
          />
        </label>

        {/* Secondary: file upload */}
        <label className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors text-sm">
          <Upload className="w-4 h-4" />
          Upload Existing Photo
          <input
            type="file"
            accept="image/*"
            onChange={handleCapture}
            className="hidden"
          />
        </label>

        {/* Error message */}
        {uploadError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">{uploadError}</p>
            <p className="text-xs text-red-400 mt-1">Please try again or speak to your IT administrator.</p>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-6">
          Pupil ref: <span className="font-mono">{pupilId.replace(/-/g, "").slice(0, 8).toUpperCase()}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Page wrapper with Suspense boundary for useSearchParams ─────────────────

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
        </div>
      }
    >
      <ScanPageInner />
    </Suspense>
  );
}
