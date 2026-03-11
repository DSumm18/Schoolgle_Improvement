"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Image,
  File,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Eye,
  Send,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

type DocumentType =
  | "energy_bill"
  | "payroll_report"
  | "invoice"
  | "contractor_report"
  | "fms_report"
  | "dbs_certificate"
  | "fire_ra"
  | "condition_survey"
  | "insurance_cert"
  | "gas_cert"
  | "eicr"
  | "other";

interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  type: string;
  required: boolean;
  description: string;
}

interface CrossCheck {
  label: string;
  matched: boolean;
  detail: string;
}

interface ExtractionResponse {
  id: string;
  document_type: DocumentType;
  extraction_model: string;
  fields: Record<string, any>;
  confidence: Record<string, number>;
  overall_confidence: number;
  cross_checks: CrossCheck[];
  anomalies: string[];
  target_modules: string[];
  status: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const DOC_TYPES: {
  value: DocumentType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "energy_bill",
    label: "Energy Bill",
    icon: <Zap className="h-4 w-4 text-yellow-500" />,
  },
  {
    value: "invoice",
    label: "Invoice",
    icon: <FileText className="h-4 w-4 text-blue-500" />,
  },
  {
    value: "dbs_certificate",
    label: "DBS Certificate",
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
  },
  {
    value: "gas_cert",
    label: "Gas Safety Certificate",
    icon: <FileText className="h-4 w-4 text-orange-500" />,
  },
  {
    value: "insurance_cert",
    label: "Insurance Certificate",
    icon: <FileText className="h-4 w-4 text-purple-500" />,
  },
  {
    value: "eicr",
    label: "EICR (Electrical)",
    icon: <Zap className="h-4 w-4 text-sky-500" />,
  },
  {
    value: "payroll_report",
    label: "Payroll Report",
    icon: <FileSpreadsheet className="h-4 w-4 text-green-600" />,
  },
  {
    value: "contractor_report",
    label: "Contractor Report",
    icon: <FileText className="h-4 w-4 text-gray-600" />,
  },
  {
    value: "fms_report",
    label: "FMS Report",
    icon: <FileSpreadsheet className="h-4 w-4 text-indigo-500" />,
  },
  {
    value: "fire_ra",
    label: "Fire Risk Assessment",
    icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
  },
  {
    value: "condition_survey",
    label: "Condition Survey",
    icon: <Eye className="h-4 w-4 text-gray-500" />,
  },
  {
    value: "other",
    label: "Other",
    icon: <File className="h-4 w-4 text-gray-400" />,
  },
];

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/csv",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function confidenceColor(c: number) {
  if (c >= 80) return "text-green-600";
  if (c >= 60) return "text-amber-600";
  return "text-red-600";
}

function confidenceBg(c: number) {
  if (c >= 80) return "bg-green-100 text-green-800";
  if (c >= 60) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

// ─── Component ───────────────────────────────────────────────────────

export default function DocumentUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<"upload" | "preview" | "results">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [selectedType, setSelectedType] = useState<DocumentType | "auto">(
    "auto",
  );
  const [extracting, setExtracting] = useState(false);
  const [textLoading, setTextLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── File handling ────────────────────────────────────────────────

  const handleFileDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) await processFile(droppedFile);
    },
    [],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) await processFile(selected);
    },
    [],
  );

  async function processFile(f: File) {
    setFile(f);
    setError(null);
    setResult(null);
    setTextLoading(true);

    try {
      // For text/CSV files, read directly
      if (f.type === "text/plain" || f.type === "text/csv") {
        const text = await f.text();
        setExtractedText(text);
        setStep("preview");
        setTextLoading(false);
        return;
      }

      // For PDFs and images, we need server-side extraction
      // Send the raw file to get text first
      const formData = new FormData();
      formData.append("file", f);

      // Use a simple text extraction endpoint or read client-side for now
      // For MVP: if it is a text-like file we can handle it, otherwise show the filename
      // and let the extraction API handle it from the text
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        // For binary files, show a placeholder and pass to AI extraction
        if (f.type.startsWith("image/") || f.type === "application/pdf") {
          setExtractedText(
            `[Binary file: ${f.name} (${(f.size / 1024).toFixed(1)} KB)]\n\nText extraction will be performed by the AI extraction engine.\nYou can also paste the document text manually below.`,
          );
        } else {
          setExtractedText(content);
        }
        setStep("preview");
        setTextLoading(false);
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setTextLoading(false);
      };

      if (f.type.startsWith("image/") || f.type === "application/pdf") {
        reader.readAsArrayBuffer(f);
        // Reset to show placeholder
        setExtractedText(
          `[Binary file: ${f.name} (${(f.size / 1024).toFixed(1)} KB)]\n\nText extraction will be performed by the AI extraction engine.\nYou can also paste the document text manually below.`,
        );
        setStep("preview");
        setTextLoading(false);
      } else {
        reader.readAsText(f);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process file");
      setTextLoading(false);
    }
  }

  // ─── Extraction ───────────────────────────────────────────────────

  async function runExtraction() {
    if (!extractedText.trim()) {
      setError("No text to extract from. Please paste the document text.");
      return;
    }

    setExtracting(true);
    setError(null);

    try {
      const res = await fetch("/api/documents/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extractedText,
          documentType: selectedType === "auto" ? undefined : selectedType,
          fileName: file?.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Extraction failed (${res.status})`);
      }

      const data: ExtractionResponse = await res.json();
      setResult(data);
      setStep("results");
    } catch (err: any) {
      setError(err.message || "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  // ─── Reset ─────────────────────────────────────────────────────────

  function reset() {
    setStep("upload");
    setFile(null);
    setExtractedText("");
    setSelectedType("auto");
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Upload className="h-7 w-7 text-sky-600" />
            Upload Document
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload a document for AI-powered data extraction and validation.
          </p>
        </div>
        <Link
          href="/dashboard/data-validation"
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </Link>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {["upload", "preview", "results"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step === s
                  ? "bg-sky-600 text-white"
                  : ["upload", "preview", "results"].indexOf(step) > i
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {["upload", "preview", "results"].indexOf(step) > i ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                step === s ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {s === "upload"
                ? "Upload"
                : s === "preview"
                  ? "Preview"
                  : "Results"}
            </span>
            {i < 2 && <ArrowRight className="mx-1 h-4 w-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 underline hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Step 1: Upload ─────────────────────────────────────────── */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition hover:border-sky-400 hover:bg-sky-50/30"
          >
            {textLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
                <p className="text-sm text-gray-500">Processing file...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-3 text-sm font-medium text-gray-700">
                  Drag and drop a file, or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  PDF, images (PNG/JPG), CSV, DOCX, XLSX
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileSelect}
            />
          </div>

          {/* Or paste text */}
          <div className="text-center text-sm text-gray-400">
            or paste document text directly
          </div>
          <textarea
            placeholder="Paste the document text here..."
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            rows={6}
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
          />
          {extractedText.trim().length > 20 && (
            <div className="flex justify-end">
              <button
                onClick={() => setStep("preview")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Supported document types */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Supported Document Types
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {DOC_TYPES.filter((d) => d.value !== "other").map((d) => (
                <div
                  key={d.value}
                  className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700"
                >
                  {d.icon}
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 2: Preview ────────────────────────────────────────── */}
      {step === "preview" && (
        <div className="space-y-6">
          {/* File info */}
          {file && (
            <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
              <FileText className="h-5 w-5 text-sky-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={reset}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Remove
              </button>
            </div>
          )}

          {/* Document type selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Document Type
            </label>
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as DocumentType | "auto")
              }
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            >
              <option value="auto">Auto-detect</option>
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Auto-detect uses keyword matching. Override if you know the
              document type.
            </p>
          </div>

          {/* Text preview / editor */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Eye className="h-4 w-4" />
              Extracted Text Preview
            </label>
            <textarea
              className="w-full rounded-xl border bg-white px-4 py-3 font-mono text-xs text-gray-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              rows={14}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">
              You can edit the text before extraction. For binary files
              (PDF/images), paste the text content here.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("upload")}
              className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={runExtraction}
              disabled={extracting || extractedText.trim().length < 20}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract Data
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Results ────────────────────────────────────────── */}
      {step === "results" && result && (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-gray-500">Document Type</p>
              <p className="mt-1 font-semibold capitalize text-gray-900">
                {result.document_type.replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-gray-500">Overall Confidence</p>
              <p
                className={`mt-1 text-xl font-bold ${confidenceColor(result.overall_confidence)}`}
              >
                {result.overall_confidence}%
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-gray-500">Extraction Method</p>
              <p className="mt-1 font-semibold text-gray-900">
                {result.extraction_model === "regex"
                  ? "Pattern Match"
                  : "AI Model"}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-gray-500">Target Modules</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {result.target_modules.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium capitalize text-sky-700"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Anomalies */}
          {result.anomalies.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Anomalies Detected ({result.anomalies.length})
              </h3>
              <ul className="space-y-1">
                {result.anomalies.map((a, i) => (
                  <li key={i} className="text-sm text-red-600">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Extracted fields */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Extracted Fields
              </h3>
              <div className="overflow-hidden rounded-xl border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Value</th>
                      <th className="px-3 py-2 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.fields).map(([name, value]) => (
                      <tr key={name} className="border-t">
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-700">
                          {name.replace(/_/g, " ")}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {value !== null && value !== undefined ? (
                            String(value)
                          ) : (
                            <span className="text-gray-300">--</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {result.confidence[name] !== undefined ? (
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${confidenceBg(result.confidence[name])}`}
                            >
                              {result.confidence[name]}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross checks */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Cross Checks
              </h3>
              {result.cross_checks.length === 0 ? (
                <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-400">
                  No cross-checks for this document type.
                </div>
              ) : (
                <div className="space-y-2">
                  {result.cross_checks.map((cc, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-xl border bg-white p-3"
                    >
                      {cc.matched ? (
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium capitalize text-gray-700">
                          {cc.label}
                        </p>
                        <p className="text-xs text-gray-500">{cc.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between rounded-xl border bg-green-50 p-4">
            <div>
              <p className="text-sm font-medium text-green-800">
                Data has been sent to the review queue.
              </p>
              <p className="text-xs text-green-600">
                A reviewer can confirm, edit, or reject the extracted data
                before it flows to target modules.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
              >
                <Upload className="h-4 w-4" />
                Upload Another
              </button>
              <Link
                href="/dashboard/data-validation"
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Send className="h-4 w-4" />
                Go to Review Queue
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
