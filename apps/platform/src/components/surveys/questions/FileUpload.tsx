"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SurveyQuestion } from "@/lib/surveys/types";

interface QuestionComponentProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  preview?: boolean;
}

interface FileEntry {
  name: string;
  size: number;
  type: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileTypes = question.settings?.file_types ?? [];
  const maxFileSize = question.settings?.max_file_size ?? 10; // MB
  const maxFiles = question.settings?.max_files ?? 5;

  const files: FileEntry[] =
    value && typeof value === "object" && Array.isArray(value.files)
      ? value.files
      : [];

  const acceptStr = fileTypes.length > 0 ? fileTypes.join(",") : undefined;

  const addFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles || disabled) return;

      const added: FileEntry[] = [];
      for (let i = 0; i < newFiles.length; i++) {
        const f = newFiles[i];
        if (f.size > maxFileSize * 1024 * 1024) continue;
        if (files.length + added.length >= maxFiles) break;
        added.push({ name: f.name, size: f.size, type: f.type });
      }

      if (added.length > 0) {
        onChange({ files: [...files, ...added] });
      }
    },
    [disabled, files, maxFileSize, maxFiles, onChange],
  );

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    onChange({ files: updated });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
          dragOver
            ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30"
            : "border-muted-foreground/30 hover:border-muted-foreground/50",
          error && "border-red-500/50",
          disabled && "cursor-not-allowed opacity-50",
        )}
        role="button"
        aria-label="Upload files"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">Click to upload</span>{" "}
          or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          {fileTypes.length > 0
            ? `Accepted: ${fileTypes.join(", ")}`
            : "All file types accepted"}
          {" | "}Max {maxFileSize}MB per file{" | "}Up to {maxFiles} file
          {maxFiles !== 1 ? "s" : ""}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        multiple={maxFiles > 1}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      {/* File list */}
      <AnimatePresence>
        {files.map((file, index) => (
          <motion.div
            key={`${file.name}-${index}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
