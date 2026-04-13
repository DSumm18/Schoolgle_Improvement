"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, FileImage, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface WorkUploadZoneProps {
  lessonPlanId: string;
  pupils: Array<{ id: string; display_name_encrypted: string; pupil_ref: string }>;
  onUploadComplete: () => void;
}

interface UploadFile {
  file: File;
  matchedPupilId: string | null;
  matchedPupilName: string | null;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "application/pdf"];

function matchFileToPupil(
  filename: string,
  pupils: WorkUploadZoneProps["pupils"],
): { id: string; name: string } | null {
  const lower = filename.toLowerCase();
  for (const p of pupils) {
    if (p.pupil_ref && lower.includes(p.pupil_ref.toLowerCase())) {
      return { id: p.id, name: p.display_name_encrypted || p.pupil_ref };
    }
  }
  return null;
}

export function WorkUploadZone({ lessonPlanId, pupils, onUploadComplete }: WorkUploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming).filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (arr.length === 0) return;

      const mapped: UploadFile[] = arr.map((file, idx) => {
        const match = matchFileToPupil(file.name, pupils);
        return {
          file,
          matchedPupilId: match?.id ?? (idx < pupils.length ? pupils[idx].id : null),
          matchedPupilName:
            match?.name ??
            (idx < pupils.length
              ? pupils[idx].display_name_encrypted || pupils[idx].pupil_ref
              : null),
          status: "queued",
        };
      });

      setFiles((prev) => [...prev, ...mapped]);
    },
    [pupils],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const processAll = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "done") continue;
      setCurrentIndex(i);
      setFiles((prev) =>
        prev.map((f, j) => (j === i ? { ...f, status: "uploading" } : f)),
      );

      try {
        const fd = new FormData();
        fd.append("lessonPlanId", lessonPlanId);
        if (files[i].matchedPupilId) fd.append("pupilId", files[i].matchedPupilId!);
        fd.append("file", files[i].file);

        const res = await fetch("/api/lesson-studio/assess", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Upload failed (${res.status})`);
        }

        setFiles((prev) =>
          prev.map((f, j) => (j === i ? { ...f, status: "done" } : f)),
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f, j) =>
            j === i
              ? { ...f, status: "error", error: err instanceof Error ? err.message : "Unknown error" }
              : f,
          ),
        );
      }
    }

    setProcessing(false);
    onUploadComplete();
  };

  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const hasQueued = files.some((f) => f.status === "queued");

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !processing && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors duration-150 ${
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Upload className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              Drop worksheets here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG, HEIC, or PDF. Files with pupil ref in the name are auto-matched.
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white divide-y divide-gray-50">
          {files.map((f, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
              <FileImage className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {f.file.name}
                </p>
                {f.matchedPupilName && (
                  <p className="text-[10px] text-gray-400 truncate">
                    Matched to {f.matchedPupilName}
                  </p>
                )}
                {f.error && (
                  <p className="text-[10px] text-red-500">{f.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {f.status === "queued" && (
                  <span className="text-[10px] text-gray-400">Queued</span>
                )}
                {f.status === "uploading" && (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                )}
                {f.status === "done" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                )}
                {f.status === "error" && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                )}
                {f.status === "queued" && !processing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {processing
              ? `Processing ${currentIndex + 1} of ${files.length}...`
              : `${files.length} file${files.length !== 1 ? "s" : ""} selected`}
            {doneCount > 0 && !processing && (
              <span className="text-emerald-500 ml-2">
                {doneCount} done
              </span>
            )}
            {errorCount > 0 && !processing && (
              <span className="text-red-400 ml-2">
                {errorCount} failed
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!processing && (
              <button
                onClick={() => setFiles([])}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
            {hasQueued && (
              <button
                onClick={processAll}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    Process All
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {processing && (
        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / files.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
