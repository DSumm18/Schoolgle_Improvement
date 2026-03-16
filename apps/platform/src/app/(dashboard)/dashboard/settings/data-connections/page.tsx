"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  Cloud,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  Users,
  GraduationCap,
  Shield,
  Eye,
  Lock,
  Link as LinkIcon,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Copy,
  X,
  BookOpen,
  ClipboardList,
  PoundSterling,
  BarChart3,
  Database,
  File,
  FileText,
  FileImage,
  FileVideo,
  Clock,
  ArrowLeft,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

interface DataConnection {
  id: string;
  provider: string;
  folder_id: string;
  folder_name: string | null;
  connected_at: string;
  last_scan_at: string | null;
  is_active: boolean;
  scan_status: string;
  scan_error: string | null;
  detected_folders: Record<
    string,
    { category: string; files: number; folderId: string }
  >;
  total_files: number;
  total_folders: number;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  folderPath?: string;
  category?: string;
}

// Category display config
const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  pupils: {
    label: "Pupil Data",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  attendance: {
    label: "Attendance",
    icon: ClipboardList,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
  },
  assessments: {
    label: "Assessments",
    icon: GraduationCap,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  behaviour: {
    label: "Behaviour",
    icon: BookOpen,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800",
  },
  staff: {
    label: "Staff & HR",
    icon: Users,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  fms: {
    label: "Finance (FMS)",
    icon: PoundSterling,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  payroll: {
    label: "Payroll",
    icon: FileSpreadsheet,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  dfe: {
    label: "DfE Data",
    icon: BarChart3,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  documents: {
    label: "Documents",
    icon: FileSpreadsheet,
    color: "text-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-900",
    borderColor: "border-slate-200 dark:border-slate-800",
  },
  unknown: {
    label: "Other Files",
    icon: FolderOpen,
    color: "text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900",
    borderColor: "border-slate-200 dark:border-slate-800",
  },
};

const EXPECTED_FOLDERS = [
  {
    name: "MIS Exports",
    icon: Database,
    color: "text-blue-600",
    children: [
      {
        name: "Pupil Data",
        description: "Pupil roll, SEN register",
        category: "pupils",
      },
      {
        name: "Attendance",
        description: "Termly attendance exports",
        category: "attendance",
      },
      {
        name: "Assessments",
        description: "Statutory results, tracker exports",
        category: "assessments",
      },
      {
        name: "Behaviour",
        description: "Behaviour incident logs",
        category: "behaviour",
      },
      {
        name: "Staff & HR",
        description: "Staff list, teacher history",
        category: "staff",
      },
    ],
  },
  {
    name: "Finance Exports",
    icon: PoundSterling,
    color: "text-amber-600",
    children: [
      {
        name: "Budget Reports",
        description: "FMS Detailed Cost Centre reports",
        category: "fms",
      },
    ],
  },
  {
    name: "DfE & External Data",
    icon: BarChart3,
    color: "text-green-600",
    children: [],
  },
];

function extractFolderId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return "";
  const b = parseInt(bytes, 10);
  if (isNaN(b)) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Provider Logos ──────────────────────────────────────

function GoogleDriveLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 87.3 78"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z"
        fill="#0066DA"
      />
      <path
        d="M43.65 25.15L29.9 1.35c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.2c-.8 1.4-1.2 2.95-1.2 4.5h27.5l16.15-27.55z"
        fill="#00AC47"
      />
      <path
        d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8L53.9 64.5l-6.25 12.3h12.25c3-.05 5.8-.7 8.2-2l5.45 2z"
        fill="#EA4335"
      />
      <path
        d="M43.65 25.15L57.4 1.35C56.05.55 54.5 0 52.8 0H34.5c-1.7 0-3.35.55-4.6 1.35l13.75 23.8z"
        fill="#00832D"
      />
      <path
        d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.6 1.2h36.6c1.7 0 3.35-.45 4.85-1.2L59.8 53z"
        fill="#2684FC"
      />
      <path
        d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25.15 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z"
        fill="#FFBA00"
      />
    </svg>
  );
}

function OneDriveLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.5 7.5C11.4 5.8 13.2 4.7 15.2 4.7c1.1 0 2.1.3 3 .8C19 3.4 20.9 2 23.2 2c3.2 0 5.8 2.6 5.8 5.8 0 .3 0 .6-.1.9C27.5 8.3 26.5 8 25.4 8c-3.5 0-6.3 2.8-6.3 6.3 0 .4 0 .8.1 1.2H9.6c-3 0-5.4-2.4-5.4-5.4 0-2.5 1.7-4.6 4-5.2.6-1.2 1.6-2.2 2.8-2.8"
        fill="#0364B8"
        transform="scale(0.8) translate(1,3)"
      />
      <path
        d="M10.5 7.5c-.3.6-.5 1.2-.6 1.9-2.3.6-4 2.7-4 5.2 0 3 2.4 5.4 5.4 5.4h9.6c-.1-.4-.1-.8-.1-1.2 0-3.5 2.8-6.3 6.3-6.3 1.1 0 2.1.3 3 .8.1-.3.1-.6.1-.9 0-3.2-2.6-5.8-5.8-5.8-2.3 0-4.2 1.4-5 3.3-.9-.5-1.9-.8-3-.8-2 0-3.8 1.1-4.7 2.8-.4-.1-.8-.2-1.2-.2"
        fill="#0078D4"
        transform="scale(0.8) translate(1,3)"
      />
    </svg>
  );
}

// ─── File Type Icon ──────────────────────────────────────

/** Maps mimeType to a recognisable icon + colour so users can instantly
 *  see whether a file is a Google Doc, Excel spreadsheet, PDF, etc. */
function FileTypeIcon({
  mimeType,
  className = "w-4 h-4",
}: {
  mimeType: string;
  className?: string;
}) {
  // Google Workspace native types
  if (mimeType === "application/vnd.google-apps.document") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#4285F4" />
        <path
          d="M7 7h10M7 10.5h10M7 14h7"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#0F9D58" />
        <rect
          x="5"
          y="5"
          width="14"
          height="14"
          rx="1"
          fill="white"
          fillOpacity="0.3"
        />
        <line x1="5" y1="10" x2="19" y2="10" stroke="white" strokeWidth="1.2" />
        <line x1="5" y1="14" x2="19" y2="14" stroke="white" strokeWidth="1.2" />
        <line x1="10" y1="5" x2="10" y2="19" stroke="white" strokeWidth="1.2" />
        <line x1="15" y1="5" x2="15" y2="19" stroke="white" strokeWidth="1.2" />
      </svg>
    );
  }
  if (mimeType === "application/vnd.google-apps.presentation") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#F4B400" />
        <rect
          x="5"
          y="6"
          width="14"
          height="12"
          rx="1.5"
          fill="white"
          fillOpacity="0.4"
        />
        <rect x="8" y="9" width="8" height="5" rx="0.5" fill="white" />
      </svg>
    );
  }
  if (mimeType === "application/vnd.google-apps.form") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#7248B9" />
        <path
          d="M7 8h10M7 12h10M7 16h6"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="17" cy="16" r="2" fill="white" />
      </svg>
    );
  }

  // Microsoft / standard formats
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#217346" />
        <path
          d="M8 7l3.5 5L8 17M16 7v10M13 12h5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#2B579A" />
        <path
          d="M7 7l2 10 3-7 3 7 2-10"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-powerpoint"
  ) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#D24726" />
        <path
          d="M9 7v10M9 7h4a3.5 3.5 0 010 7H9"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // PDF
  if (mimeType === "application/pdf") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#E53935" />
        <path
          d="M7 8h2.5a2 2 0 010 4H7v4M14 8v8M14 8h2.5a2 2 0 010 4H14"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // CSV
  if (mimeType === "text/csv" || mimeType === "text/tab-separated-values") {
    return <FileSpreadsheet className={`${className} text-teal-600`} />;
  }

  // Images
  if (mimeType.startsWith("image/")) {
    return <FileImage className={`${className} text-pink-500`} />;
  }

  // Video
  if (mimeType.startsWith("video/")) {
    return <FileVideo className={`${className} text-purple-500`} />;
  }

  // Plain text / markdown
  if (mimeType.startsWith("text/")) {
    return <FileText className={`${className} text-slate-500`} />;
  }

  // Fallback
  return <File className={`${className} text-slate-400`} />;
}

// ─── File Browser Panel ───────────────────────────────────

function FileBrowserPanel({
  category,
  connection,
  orgId,
  onClose,
  onPreviewFile,
}: {
  category: string;
  connection: DataConnection;
  orgId: string;
  onClose: () => void;
  onPreviewFile: (file: DriveFile) => void;
}) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.unknown;
  const Icon = config.icon;

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `/api/data-connections/files?organizationId=${orgId}&category=${category}`,
          { headers },
        );
        if (!res.ok) throw new Error("Failed to load files");
        const data = await res.json();
        setFiles(data.files || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [category, orgId]);

  return (
    <Card className={`border-2 ${config.borderColor} overflow-hidden`}>
      {/* Header */}
      <div
        className={`${config.bgColor} px-5 py-4 border-b ${config.borderColor}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Icon className={`w-5 h-5 ${config.color}`} />
            <div>
              <h3 className="font-bold text-sm">{config.label}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {files.length} file{files.length !== 1 ? "s" : ""} in
                <GoogleDriveLogo className="w-3 h-3 inline" />
                Google Drive
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            <Eye className="w-3 h-3 mr-1" /> READ-ONLY
          </Badge>
        </div>
      </div>

      {/* File List */}
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading files...
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
          </div>
        ) : files.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No files in this folder yet.</p>
            <p className="text-xs mt-1">
              Export from your MIS and drop into Google Drive.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => onPreviewFile(file)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left group"
              >
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                  <FileTypeIcon mimeType={file.mimeType} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {file.modifiedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(file.modifiedTime)}
                      </span>
                    )}
                    {file.size && <span>{formatFileSize(file.size)}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Data Preview Panel ───────────────────────────────────

/** Check if a mimeType is a spreadsheet-like format we can render as a table */
function isSpreadsheetMime(mime: string): boolean {
  return [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.google-apps.spreadsheet",
    "text/csv",
    "text/tab-separated-values",
  ].includes(mime);
}

/** Check if a mimeType is a text/document format we can render as prose */
function isTextMime(mime: string): boolean {
  return [
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.form",
    "text/plain",
    "text/markdown",
    "text/html",
  ].includes(mime);
}

function DataPreviewPanel({
  file,
  orgId,
  onClose,
  schoolName,
}: {
  file: DriveFile;
  orgId: string;
  onClose: () => void;
  schoolName: string;
}) {
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAndParse() {
      setLoading(true);
      setError(null);
      setTextContent(null);
      setData(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/data-connections/files", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            organizationId: orgId,
            fileId: file.id,
            parse: true,
            mimeType: file.mimeType,
          }),
        });
        if (!res.ok) throw new Error("Failed to download file");
        const result = await res.json();

        const contentType = result.contentType || file.mimeType;

        if (
          contentType === "text/plain" ||
          contentType === "text/markdown" ||
          contentType === "text/html" ||
          isTextMime(file.mimeType)
        ) {
          // Text-based content (Google Docs, plain text, etc.)
          const decoded = atob(result.content);
          // Handle UTF-8 properly
          const bytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
          const text = new TextDecoder("utf-8").decode(bytes);
          setTextContent(text);
        } else {
          // Spreadsheet content (xlsx, csv, Google Sheets exported as xlsx)
          const XLSX = await import("xlsx");
          const buffer = Uint8Array.from(atob(result.content), (c) =>
            c.charCodeAt(0),
          );
          const workbook = XLSX.read(buffer, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, {
            defval: "",
          }) as Record<string, unknown>[];

          if (rows.length > 0) {
            setColumns(Object.keys(rows[0]));
          }
          setData(rows.slice(0, 100));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAndParse();
  }, [file.id, file.mimeType, orgId]);

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Branded header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {schoolName}
              </p>
              <h3 className="font-bold text-sm">{file.name}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/10 rounded">
              <FileTypeIcon mimeType={file.mimeType} className="w-4 h-4" />
            </div>
            {data ? (
              <>
                <Badge className="bg-white/10 text-white border-white/20 text-[10px]">
                  <Table2 className="w-3 h-3 mr-1" />
                  {data.length}
                  {data.length >= 100 ? "+" : ""} rows
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 text-[10px]">
                  {columns.length} columns
                </Badge>
              </>
            ) : textContent ? (
              <Badge className="bg-white/10 text-white border-white/20 text-[10px]">
                <FileText className="w-3 h-3 mr-1" />
                {textContent.split("\n").length} lines
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Data table */}
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading and parsing file...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
          </div>
        ) : textContent ? (
          <div className="max-h-[500px] overflow-y-auto p-6">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-slate-700 dark:text-slate-300">
              {textContent}
            </pre>
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-slate-500 border-b w-10">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left font-bold text-slate-500 border-b whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    <td className="px-3 py-1.5 text-slate-400 border-b font-mono">
                      {i + 1}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-1.5 border-b whitespace-nowrap max-w-[200px] truncate"
                        title={String(row[col] ?? "")}
                      >
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length >= 100 && (
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-xs text-muted-foreground text-center border-t">
                Showing first 100 rows. Full data is processed in analysis.
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <File className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No data found in this file.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function DataConnectionsPage() {
  const { user, organization } = useAuth();
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [folderLink, setFolderLink] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMISInstructions, setShowMISInstructions] = useState(false);
  const [showFinanceInstructions, setShowFinanceInstructions] = useState(false);

  // Folder browsing state
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);

  const orgId = organization?.id;

  const fetchConnection = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/data-connections?organizationId=${orgId}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const conn = data.connections?.find((c: DataConnection) => c.is_active);
        setConnection(conn || null);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  const handleConnect = async () => {
    setError(null);
    const folderId = extractFolderId(folderLink);
    if (!folderId) {
      setError("Please paste a valid Google Drive folder link");
      return;
    }
    setConnecting(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/data-connections/link", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          organizationId: orgId,
          folderId,
          connectedBy: user?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to connect");
        return;
      }
      setConnection(data.connection);
      setFolderLink("");
    } catch (err: any) {
      setError(err.message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const handleRescan = async () => {
    if (!connection || scanning) return;
    setScanning(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/data-connections/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          organizationId: orgId,
          connectionId: connection.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scan failed");
      }
      await fetchConnection();
    } catch (err: any) {
      setError(err.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(
        `/api/data-connections?id=${connection.id}&organizationId=${orgId}`,
        { method: "DELETE", headers: authHeaders },
      );
      if (res.ok) {
        setConnection(null);
        setError(null);
        setOpenCategory(null);
        setPreviewFile(null);
      }
    } catch {
      setError("Failed to disconnect");
    }
  };

  const copyFolderStructure = () => {
    const structure = `${organization?.name || "Your School"}\n├── MIS Exports\n│   ├── Pupil Data\n│   ├── Attendance\n│   ├── Assessments\n│   ├── Behaviour\n│   └── Staff & HR\n├── Finance Exports\n│   └── Budget Reports\n└── DfE & External Data`;
    navigator.clipboard.writeText(structure);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Count detected categories
  const detectedCategories = connection?.detected_folders
    ? Object.values(connection.detected_folders).reduce(
        (acc, f) => {
          acc[f.category] = (acc[f.category] || 0) + f.files;
          return acc;
        },
        {} as Record<string, number>,
      )
    : {};

  // Role guard — SLT+ only
  const userRole = organization?.role;
  const isSLT = ["admin", "headteacher", "slt"].includes(userRole || "");

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading data connections...</span>
        </div>
      </div>
    );
  }

  if (!isSLT) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold mb-1">
              Senior Leadership Access Only
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Data connections are managed by your school&apos;s admin team.
              You&apos;ll see the data relevant to your classes in the main
              dashboard and module pages.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Data Preview View ──────────────────────────────────
  if (previewFile && orgId) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <DataPreviewPanel
          file={previewFile}
          orgId={orgId}
          onClose={() => setPreviewFile(null)}
          schoolName={organization?.name || "School"}
        />
      </div>
    );
  }

  // ─── File Browser View ──────────────────────────────────
  if (openCategory && connection && orgId) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <FileBrowserPanel
          category={openCategory}
          connection={connection}
          orgId={orgId}
          onClose={() => setOpenCategory(null)}
          onPreviewFile={(file) => setPreviewFile(file)}
        />
      </div>
    );
  }

  // ─── Main Connection View ───────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Connect Your School Data</h1>
        <p className="text-muted-foreground mt-1">
          Connect your school&apos;s cloud storage and Schoolgle will
          automatically read your MIS exports, finance reports, and school
          documents. We never store your data — it&apos;s processed in memory
          and stays under your control.
        </p>
      </div>

      {/* Security badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          <Eye className="w-3.5 h-3.5" /> Read-only access
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          <Lock className="w-3.5 h-3.5" /> No documents stored
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          <Shield className="w-3.5 h-3.5" /> GDPR compliant — revoke anytime
        </div>
      </div>

      {/* Connection status + connect UI */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GoogleDriveLogo className="w-5 h-5" />
            Google Drive Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!connection ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Right-click your school data folder in Google Drive &rarr;{" "}
                <strong>Share</strong> &rarr; Change to{" "}
                <strong>&quot;Anyone with the link&quot;</strong> (Viewer)
                &rarr;
                <strong> Copy link</strong> and paste below.
              </p>
              <div className="flex gap-2 max-w-xl">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={folderLink}
                    onChange={(e) => {
                      setFolderLink(e.target.value);
                      setError(null);
                    }}
                    placeholder="Paste Google Drive folder link here..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  />
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={connecting || !folderLink.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GoogleDriveLogo className="w-4 h-4 mr-1.5" />
                  )}
                  {connecting ? "Connecting..." : "Connect"}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <GoogleDriveLogo className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {connection.folder_name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-green-600 border-green-300"
                    >
                      ACTIVE
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-slate-500"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      READ-ONLY
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {connection.total_files || 0} files in{" "}
                    {connection.total_folders || 0} folders
                    {connection.last_scan_at &&
                      ` · Last scanned ${formatDate(connection.last_scan_at)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRescan}
                  disabled={scanning}
                  size="sm"
                  variant="outline"
                >
                  {scanning ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  {scanning ? "Scanning..." : "Rescan"}
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          {error && connection && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* OneDrive / SharePoint Connection */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <OneDriveLogo className="w-5 h-5" />
            Microsoft OneDrive / SharePoint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <OneDriveLogo className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Connect your school&apos;s OneDrive or SharePoint site to
                  import MIS exports, finance reports, and documents.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Uses Microsoft 365 sign-in — your IT admin may need to approve
                  the connection.
                </p>
              </div>
            </div>
            <Button variant="outline" disabled className="shrink-0 gap-2">
              <OneDriveLogo className="w-4 h-4" />
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Cards — clickable when connected */}
      {connection && Object.keys(detectedCategories).length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Your School Data</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Click a category to browse files and preview data.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(detectedCategories).map(([category, count]) => {
              const config =
                CATEGORY_CONFIG[category] || CATEGORY_CONFIG.unknown;
              const Icon = config.icon;
              return (
                <button
                  key={category}
                  onClick={() => setOpenCategory(category)}
                  className={`${config.bgColor} border ${config.borderColor} rounded-xl p-4 text-left hover:shadow-md hover:scale-[1.02] transition-all group cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-2 rounded-lg bg-white/60 dark:bg-black/20`}
                    >
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />
                  </div>
                  <h3 className="font-bold text-sm mb-0.5">{config.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {count} file{count !== 1 ? "s" : ""} detected
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when connected but no data */}
      {connection && Object.keys(detectedCategories).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold mb-1">No data files detected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add your MIS and finance exports to the folder structure below,
              then click Rescan to detect them.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Folder structure guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Expected Folder Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border font-mono text-sm">
            {EXPECTED_FOLDERS.map((folder, i) => (
              <div key={folder.name} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    {i === EXPECTED_FOLDERS.length - 1 ? "└──" : "├──"}
                  </span>
                  <folder.icon className={`w-4 h-4 ${folder.color}`} />
                  <span className="font-semibold">{folder.name}</span>
                  {connection &&
                    folder.children.some(
                      (c) => detectedCategories[c.category],
                    ) && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-green-600 border-green-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Connected
                      </Badge>
                    )}
                </div>
                {folder.children.map((child, j) => {
                  const fileCount = detectedCategories[child.category] || 0;
                  return (
                    <div
                      key={child.name}
                      className="ml-8 flex items-center gap-2 mt-1"
                    >
                      <span className="text-slate-400">
                        {j === folder.children.length - 1 ? "└──" : "├──"}
                      </span>
                      <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{child.name}</span>
                      <span className="text-xs text-slate-400">
                        — {child.description}
                      </span>
                      {fileCount > 0 && (
                        <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">
                          {fileCount} file{fileCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={copyFolderStructure}>
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-1.5 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 mr-1.5" />
              )}
              {copied ? "Copied!" : "Copy folder names"}
            </Button>
          </div>

          {/* Expandable instructions */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => setShowMISInstructions(!showMISInstructions)}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${showMISInstructions ? "rotate-90" : ""}`}
              />
              What MIS exports do I need?
            </button>
            {showMISInstructions && (
              <div className="ml-5 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 text-sm space-y-2">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  From your MIS (Arbor, SIMS, Bromcom):
                </p>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>
                    <strong>Pupil Data/</strong> — Pupil roll (demographics,
                    SEN, FSM, PP flags)
                  </li>
                  <li>
                    <strong>Attendance/</strong> — Termly attendance summary
                  </li>
                  <li>
                    <strong>Assessments/</strong> — Statutory results + tracker
                    exports
                  </li>
                  <li>
                    <strong>Behaviour/</strong> — Behaviour incident log
                  </li>
                  <li>
                    <strong>Staff & HR/</strong> — Staff list + teacher class
                    assignments
                  </li>
                </ul>
                <p className="text-xs text-blue-600 pt-1 border-t border-blue-200">
                  Export as .xlsx or .csv. Re-export termly to keep data fresh.
                </p>
              </div>
            )}
          </div>
          <div className="mt-2 space-y-2">
            <button
              onClick={() =>
                setShowFinanceInstructions(!showFinanceInstructions)
              }
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${showFinanceInstructions ? "rotate-90" : ""}`}
              />
              What finance exports do I need?
            </button>
            {showFinanceInstructions && (
              <div className="ml-5 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 text-sm space-y-2">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  From FMS (SIMS FMS, Access Finance, Bromcom):
                </p>
                <ul className="space-y-1 text-amber-700 dark:text-amber-300">
                  <li>
                    <strong>Budget Reports/</strong> — &quot;Detailed Cost
                    Centre Transaction Report&quot; for current financial year
                  </li>
                  <li>Export as .xlsx and drop into Budget Reports folder</li>
                  <li>
                    For multi-year analysis, also export previous year&apos;s
                    report
                  </li>
                </ul>
                <p className="text-xs text-amber-600 pt-1 border-t border-amber-200">
                  Re-export monthly for up-to-date budget tracking.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What happens next */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            What happens next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Database className="w-5 h-5 text-blue-600 mb-2" />
              <h4 className="font-medium text-sm mb-1">MIS Analysis</h4>
              <p className="text-xs text-muted-foreground">
                Ed reads your pupil data, attendance, assessments, and behaviour
                — cohort tracking, PP gaps, teacher performance patterns, SEND
                progress.
              </p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <PoundSterling className="w-5 h-5 text-amber-600 mb-2" />
              <h4 className="font-medium text-sm mb-1">Budget Position</h4>
              <p className="text-xs text-muted-foreground">
                Ed parses your FMS reports to show the TRUE budget position —
                including expected income the LA hasn&apos;t posted yet.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600 mb-2" />
              <h4 className="font-medium text-sm mb-1">
                Cross-Module Intelligence
              </h4>
              <p className="text-xs text-muted-foreground">
                Ed cross-references everything — supply teacher dips, attendance
                vs behaviour correlations, and more.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
