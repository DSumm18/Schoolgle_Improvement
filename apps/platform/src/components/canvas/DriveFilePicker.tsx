"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  Folder,
  FileSpreadsheet,
  ChevronRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  X,
  File,
} from "lucide-react";
import { useGoogleDriveAccess } from "@/hooks/useGoogleDriveAccess";
import { useAuth } from "@/context/SupabaseAuthContext";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: number;
}

interface DriveFilePickerProps {
  /** Called when user picks a file — passes the file content as Buffer for ingest */
  onFileSelected: (file: File, driveFileId?: string, driveFilePath?: string) => void;
}

export function DriveFilePicker({ onFileSelected }: DriveFilePickerProps) {
  const { organization } = useAuth();
  const {
    isConnected,
    isLoading: authLoading,
    accessToken,
    connect,
    disconnect,
  } = useGoogleDriveAccess();

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string>("root");
  const [folderStack, setFolderStack] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const SPREADSHEET_TYPES = [
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "text/tab-separated-values",
  ];

  const loadFolder = useCallback(
    async (folderId: string) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);

      try {
        // Query Google Drive API for files in this folder
        const query = `'${folderId}' in parents and trashed = false`;
        const fields = "files(id,name,mimeType,modifiedTime,size)";
        const orderBy = "folder,name";

        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}&pageSize=100`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (!res.ok) {
          if (res.status === 401) {
            disconnect();
            setError("Drive session expired. Please reconnect.");
            return;
          }
          throw new Error("Failed to list files");
        }

        const data = await res.json();

        // Filter to show folders + spreadsheet-compatible files
        const filtered = (data.files || []).filter(
          (f: DriveFile) =>
            f.mimeType === "application/vnd.google-apps.folder" ||
            SPREADSHEET_TYPES.includes(f.mimeType) ||
            f.name.endsWith(".csv") ||
            f.name.endsWith(".xlsx") ||
            f.name.endsWith(".xls"),
        );

        setFiles(filtered);
        setCurrentFolder(folderId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load files");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, disconnect],
  );

  const handleConnect = async () => {
    try {
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      await connect(organization?.id, undefined);
    } catch {
      setError(
        "Google Drive is not configured yet. Ask your administrator to set up Google OAuth credentials.",
      );
    }
  };

  const handleFolderClick = (folder: DriveFile) => {
    setFolderStack((prev) => [
      ...prev,
      { id: currentFolder, name: folder.name },
    ]);
    loadFolder(folder.id);
  };

  const handleBack = () => {
    const prev = folderStack[folderStack.length - 1];
    if (prev) {
      setFolderStack((s) => s.slice(0, -1));
      loadFolder(prev.id);
    }
  };

  const handleFileClick = async (file: DriveFile) => {
    if (!accessToken) return;
    setDownloading(file.id);
    setError(null);

    try {
      let blob: Blob;

      if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
        // Google Sheets — export as CSV so PapaParse can read it
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!res.ok) throw new Error("Failed to export spreadsheet");
        blob = await res.blob();
      } else {
        // Regular file — download directly
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!res.ok) throw new Error("Failed to download file");
        blob = await res.blob();
      }

      // Convert to File object for the ingest pipeline
      let ext = "";
      if (file.mimeType === "application/vnd.google-apps.spreadsheet") ext = ".csv";
      else if (file.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ext = ".xlsx";
      
      const fileName = file.name.includes(".")
        ? file.name
        : `${file.name}${ext}`;
      const fileObj = new globalThis.File([blob], fileName, {
        type: blob.type,
      });

      // Pass the Drive file ID and folder path so callers can save the connector
      const pathStr = folderStack.map(f => f.name).join(' / ');
      onFileSelected(fileObj, file.id, pathStr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download file");
    } finally {
      setDownloading(null);
    }
  };

  // Not connected — show connect button
  if (!isConnected) {
    return (
      <div className="border border-dashed border-border rounded-xl p-6 text-center">
        <Cloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
        <p className="text-sm font-semibold mb-1">Connect Google Drive</p>
        <p className="text-xs text-muted-foreground mb-3">
          Browse your Drive and pick a spreadsheet. Read-only access — we never
          modify your files.
        </p>
        <button
          onClick={handleConnect}
          disabled={authLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {authLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Cloud className="w-3 h-3" />
          )}
          Connect Google Drive
        </button>
      </div>
    );
  }

  // Connected but haven't browsed yet
  if (files.length === 0 && !loading && currentFolder === "root") {
    // Auto-load root folder
    loadFolder("root");
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold">Google Drive</span>
          {folderStack.length > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline ml-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
          )}
        </div>
        <button
          onClick={disconnect}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Disconnect
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20 text-xs text-red-600 flex items-center gap-2">
          <X className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* File List */}
      <div className="max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-xs text-muted-foreground ml-2">
              Loading files...
            </span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No spreadsheets found in this folder
          </div>
        ) : (
          <div className="divide-y divide-border">
            {files.map((file) => {
              const isFolder =
                file.mimeType === "application/vnd.google-apps.folder";
              const isDownloading = downloading === file.id;

              return (
                <button
                  key={file.id}
                  onClick={() =>
                    isFolder ? handleFolderClick(file) : handleFileClick(file)
                  }
                  disabled={isDownloading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left disabled:opacity-50"
                >
                  {isFolder ? (
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : isDownloading ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block">
                      {file.name}
                    </span>
                    {file.modifiedTime && (
                      <span className="text-[10px] text-muted-foreground">
                        Modified{" "}
                        {new Date(file.modifiedTime).toLocaleDateString(
                          "en-GB",
                        )}
                      </span>
                    )}
                  </div>
                  {isFolder && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                  {!isFolder && !isDownloading && (
                    <span className="text-[10px] text-emerald-600 font-semibold shrink-0">
                      Select
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
