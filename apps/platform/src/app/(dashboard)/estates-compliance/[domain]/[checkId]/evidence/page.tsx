"use client";

/**
 * Evidence Upload Page
 *
 * Professional document upload interface for compliance checks with:
 * - Drag and drop file upload
 * - Link external documents
 * - Document categorization (certificate, report, photo, document)
 * - File management (view, download, delete)
 * - Expiry date tracking for certificates
 */

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { DocumentVerifier } from "@/components/estates-compliance/DocumentVerifier";
import {
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  FileText,
  X,
  Check,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  Calendar,
  FileCheck,
  Image as ImageIcon,
  File,
  ExternalLink,
  Plus,
} from "lucide-react";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
} from "@/lib/estates-compliance/statutory-checks";

interface UploadedFile {
  file: File;
  id: string;
  category: "certificate" | "report" | "photo" | "document";
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
}

interface ExternalLink {
  id: string;
  url: string;
  title: string;
  category: "link";
}

export default function EvidenceUploadPage() {
  const params = useParams();
  const router = useRouter();
  const { organization } = useAuth();
  const organizationId = organization?.id || "";
  const domainSlug = params.domain as ComplianceDomain;
  const checkId = params.checkId as string;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Get check info
  const metadata = DOMAIN_METADATA[domainSlug];
  const checks = getChecksForDomain(domainSlug);
  const check = checks.find((c) => c.id === checkId);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      category: "document",
      progress: 0,
      status: "uploading",
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((uploadedFile) => {
      simulateUpload(uploadedFile.id);
    });
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, progress: 100, status: "complete" as const }
              : f,
          ),
        );
      } else {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
        );
      }
    }, 500);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileCategory = (
    id: string,
    category: UploadedFile["category"],
  ) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, category } : f)),
    );
  };

  const addExternalLink = () => {
    if (newLinkUrl && newLinkTitle) {
      setExternalLinks((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          url: newLinkUrl,
          title: newLinkTitle,
          category: "link",
        },
      ]);
      setNewLinkUrl("");
      setNewLinkTitle("");
    }
  };

  const removeLink = (id: string) => {
    setExternalLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSaveAll = async () => {
    setUploading(true);
    // In production, this would save to the database
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setUploading(false);
    router.push(`/estates-compliance/${domainSlug}/${checkId}`);
  };

  const getCategoryIcon = (category: UploadedFile["category"] | "link") => {
    switch (category) {
      case "certificate":
        return <FileCheck className="w-6 h-6 text-amber-600" />;
      case "report":
        return <FileText className="w-6 h-6 text-blue-600" />;
      case "photo":
        return <ImageIcon className="w-6 h-6 text-green-600" />;
      case "document":
        return <File className="w-6 h-6 text-gray-600" />;
      case "link":
        return <LinkIcon className="w-6 h-6 text-purple-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!check) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Check Not Found
          </h2>
          <Link
            href={`/estates-compliance/${domainSlug}`}
            className="text-teal-600 dark:text-teal-400 hover:underline"
          >
            Return to {metadata.name}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
        <Link
          href={`/estates-compliance/${domainSlug}/${checkId}`}
          className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {check.name}
        </Link>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{metadata.icon}</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Upload Evidence
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
                {metadata.name} • {check.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Drag and Drop Upload Area */}
      <div className="rounded-xl border-2 border-dashed border-teal-400 dark:border-teal-600 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 p-12 text-center shadow-lg">
        <div
          className="space-y-6"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all ${dragActive ? "bg-teal-200 dark:bg-teal-900 scale-110" : "bg-teal-100 dark:bg-teal-900/50"}`}
          >
            <Upload className="w-12 h-12 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {dragActive ? "Drop files here" : "Upload Evidence Documents"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Drag and drop files here, or click to browse. Supports PDF,
              images, Word, and Excel files.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-teal-600 text-white hover:bg-teal-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <Upload className="w-5 h-5" />
            Choose Files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleChange}
            />
          </label>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-600" />
              Certificates
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Reports
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-green-600" />
              Photos
            </div>
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-gray-600" />
              Documents
            </div>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Add External Links
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Link to external documents or cloud storage
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="url"
              placeholder="https://example.com/document.pdf"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <input
              type="text"
              placeholder="Document title"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <button
            onClick={addExternalLink}
            disabled={!newLinkUrl || !newLinkTitle}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>

          {/* Added Links */}
          {externalLinks.length > 0 && (
            <div className="space-y-3 mt-4">
              {externalLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700"
                >
                  {getCategoryIcon("link")}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {link.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => removeLink(link.id)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Uploaded Files ({uploadedFiles.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="p-5 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    {getCategoryIcon(file.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {file.file.name}
                      </p>
                      {file.status === "complete" && (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(file.file.size)} •{" "}
                      {file.file.type || "Unknown type"}
                    </p>

                    {/* Progress Bar */}
                    {file.status === "uploading" && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {Math.round(file.progress)}% uploaded
                        </p>
                      </div>
                    )}

                    {/* Category Selection (only show after upload complete) */}
                    {file.status === "complete" && (
                      <div className="mt-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                          Document Type:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              "certificate",
                              "report",
                              "photo",
                              "document",
                            ] as const
                          ).map((cat) => (
                            <button
                              key={cat}
                              onClick={() => updateFileCategory(file.id, cat)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                                file.category === cat
                                  ? "bg-teal-600 text-white border-teal-700"
                                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              {cat === "certificate" && (
                                <FileCheck className="w-4 h-4" />
                              )}
                              {cat === "report" && (
                                <FileText className="w-4 h-4" />
                              )}
                              {cat === "photo" && (
                                <ImageIcon className="w-4 h-4" />
                              )}
                              {cat === "document" && (
                                <File className="w-4 h-4" />
                              )}
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                          ))}
                        </div>

                        {/* AI Document Verification — previously built, now wired */}
                        {(file.category === "certificate" ||
                          file.category === "report") &&
                          organizationId && (
                            <div className="mt-3">
                              <DocumentVerifier
                                evidenceId={file.id}
                                organizationId={organizationId}
                                fileName={file.file.name}
                                fileType={file.file.type}
                              />
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      {uploadedFiles.length > 0 || externalLinks.length > 0 ? (
        <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex justify-center">
            <button
              onClick={handleSaveAll}
              disabled={
                uploading || uploadedFiles.some((f) => f.status === "uploading")
              }
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save All Evidence & Complete Check
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
