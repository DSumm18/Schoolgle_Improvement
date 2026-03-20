"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { DataFreshnessBadge } from "@/components/ui/DataSourceBadge";

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
          <div>
            {CATEGORY_CONNECT_ACTIONS[category] && (
              <div className="px-5 py-2.5 bg-blue-50/50 dark:bg-blue-950/10 border-b text-xs text-blue-700 dark:text-blue-400">
                Click a file to preview it, then connect it to{" "}
                <strong>
                  {CATEGORY_CONNECT_ACTIONS[category].moduleLabel}
                </strong>
              </div>
            )}
            <div className="divide-y">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onPreviewFile(file)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left group"
                >
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                    <FileTypeIcon
                      mimeType={file.mimeType}
                      className="w-4 h-4"
                    />
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
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Preview &amp; connect
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              ))}
            </div>
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

const CATEGORY_CONNECT_ACTIONS: Record<
  string,
  { label: string; moduleLabel: string; href: string; apiAction?: string }
> = {
  staff: {
    label: "Connect to Staff Directory",
    moduleLabel: "Staff Directory",
    href: "/dashboard/hr/people",
    apiAction: "staff",
  },
  pupils: {
    label: "Connect to Pupil Data",
    moduleLabel: "Pupils",
    href: "/dashboard/pupils",
    apiAction: "pupils",
  },
  fms: {
    label: "Connect to Finance",
    moduleLabel: "Finance",
    href: "/dashboard/finance",
    apiAction: "finance",
  },
  attendance: {
    label: "Connect to Attendance",
    moduleLabel: "Attendance",
    href: "/dashboard/attendance",
    apiAction: "attendance",
  },
  behaviour: {
    label: "Connect to Behaviour",
    moduleLabel: "Behaviour",
    href: "/dashboard/behaviour",
    apiAction: "behaviour",
  },
  assessments: {
    label: "Connect to Intelligence",
    moduleLabel: "Intelligence",
    href: "/dashboard/intelligence",
  },
  documents: {
    label: "Connect to Compliance",
    moduleLabel: "Compliance",
    href: "/dashboard/compliance",
  },
};

function DataPreviewPanel({
  file,
  orgId,
  category,
  onClose,
  onConnect,
  schoolName,
}: {
  file: DriveFile;
  orgId: string;
  category?: string;
  onClose: () => void;
  onConnect?: (category: string, fileContent: string) => void;
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

      {/* Connect Action Bar */}
      {category &&
        CATEGORY_CONNECT_ACTIONS[category] &&
        !loading &&
        !error &&
        (data || textContent) && (
          <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                <span className="font-semibold">{file.name}</span> can be
                connected to{" "}
                <span className="font-semibold">
                  {CATEGORY_CONNECT_ACTIONS[category].moduleLabel}
                </span>
              </p>
            </div>
            {CATEGORY_CONNECT_ACTIONS[category].apiAction &&
            onConnect &&
            ["staff", "pupils", "fms", "attendance", "behaviour"].includes(
              category,
            ) ? (
              <button
                onClick={() => {
                  if (data) {
                    // Convert table data to CSV for the import API
                    const csvHeader = columns.join(",");
                    const csvRows = (data as Record<string, unknown>[]).map(
                      (row) =>
                        columns
                          .map((col) => {
                            const val = String(row[col] ?? "");
                            return val.includes(",") || val.includes('"')
                              ? `"${val.replace(/"/g, '""')}"`
                              : val;
                          })
                          .join(","),
                    );
                    onConnect(category, [csvHeader, ...csvRows].join("\n"));
                  } else if (textContent) {
                    onConnect(category, textContent);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Cloud className="w-3.5 h-3.5" />
                {CATEGORY_CONNECT_ACTIONS[category].label}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-[220px]">
                  {category === "attendance" || category === "behaviour"
                    ? "Enter data directly in the module, or connect via MIS."
                    : "Open the module to use this data."}
                </p>
                <a
                  href={CATEGORY_CONNECT_ACTIONS[category].href}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
                >
                  Open {CATEGORY_CONNECT_ACTIONS[category].moduleLabel}
                  <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

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
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [lastDisconnectedFolder, setLastDisconnectedFolder] = useState<
    string | null
  >(null);

  // Folder browsing state
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [connectingModule, setConnectingModule] = useState<string | null>(null);
  const [connectResult, setConnectResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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
    // Save folder info for reconnect shortcut
    const folderName = connection.folder_name;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(
        `/api/data-connections?id=${connection.id}&organizationId=${orgId}`,
        { method: "DELETE", headers: authHeaders },
      );
      if (res.ok) {
        setLastDisconnectedFolder(folderName);
        setConnection(null);
        setError(null);
        setOpenCategory(null);
        setPreviewFile(null);
        setConnectResult(null);
      }
    } catch {
      setError("Failed to disconnect");
    }
  };

  const handleConnectFileToModule = async (
    category: string,
    csvContent: string,
  ) => {
    if (!orgId) return;
    setConnectingModule(category);
    setConnectResult(null);

    try {
      const authHeaders = await getAuthHeaders();
      let endpoint = "";
      let body: any = {};

      if (category === "staff") {
        endpoint = "/api/staff/import";
        body = { organizationId: orgId, csvData: csvContent };
      } else if (category === "pupils") {
        endpoint = "/api/pupils";
        body = { csv: csvContent, organizationId: orgId };
      } else if (category === "fms") {
        endpoint = "/api/finance/import";
        body = { csv: csvContent, organizationId: orgId, dry_run: false };
      } else if (category === "attendance") {
        // Parse CSV into attendance marks format and POST
        endpoint = "/api/attendance/registers";
        // Parse the CSV rows into marks grouped by date+session
        const lines = csvContent.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          setConnectResult({
            success: false,
            message: "No data rows found in attendance file",
          });
          setConnectingModule(null);
          return;
        }
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().toLowerCase().replace(/[\s-]/g, "_"));
        const pupilIdCol = headers.findIndex(
          (h) => h.includes("pupil") || h.includes("student") || h === "id",
        );
        const codeCol = headers.findIndex(
          (h) =>
            h.includes("mark") ||
            h.includes("code") ||
            h.includes("attendance"),
        );
        const dateCol = headers.findIndex((h) => h.includes("date"));
        const sessionCol = headers.findIndex(
          (h) => h.includes("session") || h.includes("am") || h.includes("pm"),
        );

        if (pupilIdCol < 0 || codeCol < 0) {
          setConnectResult({
            success: false,
            message:
              "Could not detect pupil ID and attendance code columns. Expected columns containing 'pupil'/'student' and 'mark'/'code'.",
          });
          setConnectingModule(null);
          return;
        }

        const marks = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(",").map((v) => v.trim());
          if (vals[pupilIdCol]) {
            marks.push({
              pupil_id: vals[pupilIdCol],
              code: vals[codeCol] || "/",
              minutes_late: null,
              notes: null,
            });
          }
        }

        const today = new Date().toISOString().split("T")[0];
        body = {
          organizationId: orgId,
          date:
            dateCol >= 0
              ? lines[1].split(",")[dateCol]?.trim() || today
              : today,
          session:
            sessionCol >= 0
              ? lines[1].split(",")[sessionCol]?.trim() || "AM"
              : "AM",
          marks,
        };
      } else if (category === "behaviour") {
        // Parse CSV into behaviour incidents and POST one by one
        const lines = csvContent.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          setConnectResult({
            success: false,
            message: "No data rows found in behaviour file",
          });
          setConnectingModule(null);
          return;
        }
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().toLowerCase().replace(/[\s-]/g, "_"));

        let importedCount = 0;
        let errorCount = 0;
        const authHeaders = await getAuthHeaders();

        for (let i = 1; i < Math.min(lines.length, 201); i++) {
          const vals = lines[i].split(",").map((v) => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = vals[idx] || "";
          });

          const incidentBody = {
            organizationId: orgId,
            pupil_name:
              row.pupil_name ||
              row.student_name ||
              row.name ||
              `${row.first_name || ""} ${row.last_name || ""}`.trim(),
            pupil_id: row.pupil_id || row.student_id || undefined,
            year_group:
              parseInt(row.year_group || row.year || "0") || undefined,
            type: (row.type || "negative").toLowerCase().includes("pos")
              ? "positive"
              : "negative",
            category: row.category || row.behaviour_category || "other",
            description: row.description || row.notes || row.details || "",
            location: row.location || undefined,
            reported_by:
              row.reported_by || row.recorded_by || row.teacher || undefined,
          };

          if (!incidentBody.pupil_name) continue;

          try {
            const incRes = await fetch("/api/behaviour/incidents", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders },
              body: JSON.stringify(incidentBody),
            });
            if (incRes.ok) importedCount++;
            else errorCount++;
          } catch {
            errorCount++;
          }
        }

        setConnectResult({
          success: importedCount > 0,
          message: `Connected ${importedCount} behaviour record${importedCount !== 1 ? "s" : ""}${errorCount > 0 ? ` (${errorCount} could not be connected)` : ""}.`,
        });
        setConnectingModule(null);
        return;
      } else {
        setConnectResult({
          success: true,
          message: `Navigate to ${CATEGORY_CONNECT_ACTIONS[category]?.moduleLabel || category} to connect this data.`,
        });
        setConnectingModule(null);
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        setConnectResult({
          success: false,
          message: result.error || "Connection failed",
        });
      } else {
        const count =
          result.imported ||
          result.total_processed ||
          result.transactions_imported ||
          0;
        const errors = result.errors?.length || 0;
        setConnectResult({
          success: true,
          message: `Connected ${count} record${count !== 1 ? "s" : ""} to ${CATEGORY_CONNECT_ACTIONS[category]?.moduleLabel || category}${errors > 0 ? ` (${errors} error${errors !== 1 ? "s" : ""})` : ""}.`,
        });
      }
    } catch (err: any) {
      setConnectResult({
        success: false,
        message: err.message || "Connection failed",
      });
    } finally {
      setConnectingModule(null);
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

  // Track journey step for progress stepper
  type JourneyStep = "connect" | "browse" | "preview" | "connecting" | "done";
  const journeyStep: JourneyStep = connectResult
    ? "done"
    : connectingModule
      ? "connecting"
      : previewFile
        ? "preview"
        : openCategory
          ? "browse"
          : "connect";

  // Progress stepper component
  const JOURNEY_STEPS = [
    { key: "connect" as const, label: "Connect" },
    { key: "browse" as const, label: "Browse" },
    { key: "preview" as const, label: "Preview" },
    { key: "connecting" as const, label: "Connecting" },
    { key: "done" as const, label: "Done" },
  ];
  const stepIndex = JOURNEY_STEPS.findIndex((s) => s.key === journeyStep);

  const JourneyStepper = () => {
    if (!connection) return null; // Only show after first connection
    return (
      <div className="flex items-center gap-1 mb-6">
        {JOURNEY_STEPS.map((step, i) => {
          const isActive = i === stepIndex;
          const isPast = i < stepIndex;
          return (
            <React.Fragment key={step.key}>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : isPast
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {isPast ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-300 dark:bg-zinc-600 text-white"
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
                {step.label}
              </div>
              {i < JOURNEY_STEPS.length - 1 && (
                <div
                  className={`w-4 h-0.5 rounded ${isPast ? "bg-emerald-300 dark:bg-emerald-700" : "bg-zinc-200 dark:bg-zinc-700"}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

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
        <JourneyStepper />
        <DataPreviewPanel
          file={previewFile}
          orgId={orgId}
          category={openCategory || undefined}
          onClose={() => setPreviewFile(null)}
          onConnect={handleConnectFileToModule}
          schoolName={organization?.name || "School"}
        />
        {/* Connection Result */}
        {connectResult && (
          <div
            className={`rounded-xl border p-4 ${
              connectResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {connectResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <p
                className={`text-sm font-semibold ${connectResult.success ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200"}`}
              >
                {connectResult.success
                  ? "Data source connected"
                  : "Connection issue"}
              </p>
              <button
                onClick={() => setConnectResult(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p
              className={`text-sm mt-1 ml-8 ${connectResult.success ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}
            >
              {connectResult.message}
            </p>
            {connectResult.success &&
              openCategory &&
              CATEGORY_CONNECT_ACTIONS[openCategory] && (
                <div className="mt-3 ml-8 flex items-center gap-3">
                  <a
                    href={CATEGORY_CONNECT_ACTIONS[openCategory].href}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    View in {CATEGORY_CONNECT_ACTIONS[openCategory].moduleLabel}
                    <ChevronRight className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => {
                      setConnectResult(null);
                      setPreviewFile(null);
                    }}
                    className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    Connect another file
                  </button>
                </div>
              )}
          </div>
        )}
        {connectingModule && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Connecting data to{" "}
              {CATEGORY_CONNECT_ACTIONS[connectingModule]?.moduleLabel ||
                connectingModule}
              ...
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─── File Browser View ──────────────────────────────────
  if (openCategory && connection && orgId) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <JourneyStepper />
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
        <h1 className="text-2xl font-bold">Connected Data Sources</h1>
        <p className="text-muted-foreground mt-1">
          Link your school&apos;s data sources so Schoolgle can power your
          modules. You stay in control — connect, refresh, or disconnect at any
          time.
        </p>
      </div>

      <JourneyStepper />

      {/* How It Works — visual steps (shown only when no connection) */}
      {!connection && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-4">
            How connecting works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Share your folder",
                desc: "Share your school data folder in Google Drive with a view-only link",
              },
              {
                step: "2",
                title: "Schoolgle reads it",
                desc: "We detect your files by type — staff, pupils, finance, attendance — and show you what we found",
              },
              {
                step: "3",
                title: "Connect to modules",
                desc: "Preview any file and connect it to the right module with one click. Refresh anytime.",
              },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    {s.title}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          <Eye className="w-3.5 h-3.5" /> Read-only — we never change your files
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          <Lock className="w-3.5 h-3.5" /> Your data stays in your Drive
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          <Shield className="w-3.5 h-3.5" /> Disconnect anytime — your choice
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
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  To connect your Google Drive:
                </p>
                <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    Open Google Drive and find your school data folder
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    Right-click the folder → <strong>Share</strong> → set to{" "}
                    <strong>&quot;Anyone with the link&quot;</strong> (Viewer)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    Copy the link and paste it below
                  </li>
                </ol>
              </div>

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
                    placeholder="Paste your Google Drive folder link here..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                  {connecting ? "Checking..." : "Connect"}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-600 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Schoolgle will read the folder structure to detect your school
                data files. We only look — we never modify, move, or delete
                anything in your Drive.
              </p>

              {/* Reconnect shortcut */}
              {lastDisconnectedFolder && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <RefreshCw className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Previously connected to{" "}
                    <strong>{lastDisconnectedFolder}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setLastDisconnectedFolder(null);
                    }}
                    className="text-[10px] text-blue-500 hover:text-blue-700 ml-auto shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {connection.total_files || 0} files in{" "}
                      {connection.total_folders || 0} folders
                      {connection.last_scan_at &&
                        ` · Last scanned ${formatDate(connection.last_scan_at)}`}
                    </p>
                    <DataFreshnessBadge lastUpdated={connection.last_scan_at} />
                  </div>
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
                  onClick={() => setShowDisconnectConfirm(true)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-500"
                  title="Disconnect data source"
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

      {/* Stale Data Warning */}
      {connection &&
        connection.last_scan_at &&
        (() => {
          const daysSince = Math.floor(
            (Date.now() - new Date(connection.last_scan_at).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysSince <= 7) return null;
          return (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Connected data may be out of date
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Your data source was last scanned {daysSince} days ago. Rescan
                  to check for updated files from your school systems.
                </p>
                <Button
                  onClick={handleRescan}
                  disabled={scanning}
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  {scanning ? "Scanning..." : "Rescan Now"}
                </Button>
              </div>
            </div>
          );
        })()}

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
          <h2 className="text-lg font-bold mb-1">Your Connected Data</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These data sources were detected in your Drive. Click any category
            to browse files, preview contents, and connect them to Schoolgle
            modules.
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
                  {CATEGORY_CONNECT_ACTIONS[category] && (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                      → {CATEGORY_CONNECT_ACTIONS[category].moduleLabel}
                    </p>
                  )}
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
      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Disconnect data source?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {connection?.folder_name || "Google Drive"}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                If you disconnect this source:
              </p>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">&#8226;</span>
                  Schoolgle will stop reading new files from this folder
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-0.5">&#8226;</span>
                  Data already connected to modules will remain
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-0.5">&#8226;</span>
                  You can reconnect a source at any time
                </li>
              </ul>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                <strong>Modules affected:</strong> Staff Directory, Attendance,
                SEND, Behaviour, Finance, and Intelligence may no longer receive
                updated data from this source.
              </p>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisconnectConfirm(false)}
              >
                Keep Connected
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  await handleDisconnect();
                  setShowDisconnectConfirm(false);
                }}
              >
                Disconnect Source
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
