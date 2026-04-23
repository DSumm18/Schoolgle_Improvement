"use client";

/**
 * EvidenceManager Component
 *
 * Upload evidence (documents, photos, links)
 * Link to Google Drive documents
 * Link to existing evidence_items
 * Categorize evidence type (certificate, report, photo, log)
 * Show evidence linked to specific checks
 */

import { useState, useRef } from "react";
import {
  EvidenceType,
  EvidenceSource,
  EstatesEvidence,
} from "@/types/estates-compliance";

interface EvidenceManagerProps {
  organizationId: string;
  userId: string;
  // Link to specific entities
  complianceDomain?: string;
  assetId?: string;
  taskId?: string;
  contractorId?: string;
  contractId?: string;
  // Existing evidence linked to this entity
  existingEvidence?: EstatesEvidence[];
  // Callbacks
  onEvidenceAdded?: (evidence: EstatesEvidence) => void;
  onEvidenceDeleted?: (evidenceId: string) => void;
}

const evidenceTypes: { value: EvidenceType; label: string; icon: string }[] = [
  { value: "certificate", label: "Certificate", icon: "📜" },
  { value: "report", label: "Report", icon: "📄" },
  { value: "photo", label: "Photo", icon: "📷" },
  { value: "log", label: "Log/Record", icon: "📋" },
  { value: "document", label: "Document", icon: "📁" },
  { value: "video", label: "Video", icon: "🎥" },
  { value: "other", label: "Other", icon: "📎" },
];

const complianceDomains = [
  { value: "fire", label: "Fire Safety" },
  { value: "legionella", label: "Legionella" },
  { value: "asbestos", label: "Asbestos" },
  { value: "electrical", label: "Electrical" },
  { value: "gas", label: "Gas Safety" },
  { value: "lifting", label: "Lifting Operations" },
  { value: "playground", label: "Playground Safety" },
  { value: "accessibility", label: "Accessibility" },
  { value: "water", label: "Water Hygiene" },
];

export function EvidenceManager({
  organizationId,
  userId,
  complianceDomain,
  assetId,
  taskId,
  contractorId,
  contractId,
  existingEvidence = [],
  onEvidenceAdded,
  onEvidenceDeleted,
}: EvidenceManagerProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "link" | "existing">(
    "upload",
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    evidence_type: "document" as EvidenceType,
    compliance_domain: complianceDomain || "",
    document_number: "",
    issuing_body: "",
    issued_date: "",
    expiry_date: "",
    tags: "",
  });

  // Link form state
  const [linkForm, setLinkForm] = useState({
    title: "",
    description: "",
    url: "",
    evidence_type: "document" as EvidenceType,
    compliance_domain: complianceDomain || "",
  });

  // Existing evidence link state
  const [existingLinkForm, setExistingLinkForm] = useState({
    existing_evidence_id: "",
    title: "",
  });

  // Errors
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fileInputRef.current?.files?.[0]) {
      setError("Please select a file to upload");
      return;
    }

    if (!uploadForm.title) {
      setError("Title is required");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("organizationId", organizationId);
      formData.append("user_id", userId);
      formData.append("source_type", "upload");
      formData.append("file", fileInputRef.current.files[0]);
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("evidence_type", uploadForm.evidence_type);
      if (uploadForm.compliance_domain) {
        formData.append("compliance_domain", uploadForm.compliance_domain);
      }
      if (assetId) formData.append("asset_id", assetId);
      if (taskId) formData.append("task_id", taskId);
      if (contractorId) formData.append("contractor_id", contractorId);
      if (contractId) formData.append("contract_id", contractId);
      if (uploadForm.document_number) {
        formData.append("document_number", uploadForm.document_number);
      }
      if (uploadForm.issuing_body) {
        formData.append("issuing_body", uploadForm.issuing_body);
      }
      if (uploadForm.issued_date) {
        formData.append("issued_date", uploadForm.issued_date);
      }
      if (uploadForm.expiry_date) {
        formData.append("expiry_date", uploadForm.expiry_date);
      }
      if (uploadForm.tags) {
        formData.append("tags", uploadForm.tags);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/estates/evidence", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const { data } = await response.json();
      setSuccess("Evidence uploaded successfully");
      onEvidenceAdded?.(data);

      // Reset form
      setUploadForm({
        title: "",
        description: "",
        evidence_type: "document",
        compliance_domain: complianceDomain || "",
        document_number: "",
        issuing_body: "",
        issued_date: "",
        expiry_date: "",
        tags: "",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload evidence",
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!linkForm.url) {
      setError("URL is required");
      return;
    }

    if (!linkForm.title) {
      setError("Title is required");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("organizationId", organizationId);
      formData.append("user_id", userId);
      formData.append("source_type", "link");
      formData.append("title", linkForm.title);
      formData.append("description", linkForm.description);
      formData.append("file_url", linkForm.url);
      formData.append("evidence_type", linkForm.evidence_type);
      if (linkForm.compliance_domain) {
        formData.append("compliance_domain", linkForm.compliance_domain);
      }
      if (assetId) formData.append("asset_id", assetId);
      if (taskId) formData.append("task_id", taskId);
      if (contractorId) formData.append("contractor_id", contractorId);
      if (contractId) formData.append("contract_id", contractId);

      const response = await fetch("/api/estates/evidence", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Link failed");
      }

      const { data } = await response.json();
      setSuccess("Evidence linked successfully");
      onEvidenceAdded?.(data);

      // Reset form
      setLinkForm({
        title: "",
        description: "",
        url: "",
        evidence_type: "document",
        compliance_domain: complianceDomain || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link evidence");
    } finally {
      setUploading(false);
    }
  };

  /*
   * Google Drive Picker Integration
   *
   * TODO: Implement Google Drive Picker API
   * Steps:
   * 1. Load Google Picker API script
   * 2. Initialize OAuth token
   * 3. Create and show Picker
   * 4. Handle selected documents
   *
   * Example:
   *
   * const handleGoogleDrivePicker = () => {
   *   const picker = new google.picker.PickerBuilder()
   *     .addView(google.picker.ViewId.DOCUMENTS)
   *     .setOAuthToken(oauthToken)
   *     .setCallback(pickerCallback)
   *     .build();
   *   picker.setVisible(true);
   * };
   *
   * const pickerCallback = (data: any) => {
   *   if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
   *     const doc = data[google.picker.Response.DOCUMENTS][0];
   *     const driveFileId = doc[google.picker.Document.ID];
   *     const driveUrl = doc[google.picker.Document.URL];
   *     const driveName = doc[google.picker.Document.NAME];
   *     // Submit to API with source_type='google_drive'
   *   }
   * };
   */
  const handleGoogleDrivePicker = () => {
    // Placeholder for Google Drive Picker integration
    setError("Google Drive integration coming soon");
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm("Are you sure you want to delete this evidence?")) {
      return;
    }

    try {
      const response = await fetch(`/api/estates/evidence/${evidenceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete evidence");
      }

      setSuccess("Evidence deleted successfully");
      onEvidenceDeleted?.(evidenceId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete evidence",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab("link")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "link"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Link URL
          </button>
          <button
            onClick={() => setActiveTab("existing")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "existing"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Link Existing
          </button>
        </nav>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          {success}
          <button
            onClick={() => setSuccess(null)}
            className="ml-4 text-green-600 hover:text-green-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Select File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, DOC, DOCX, JPG, PNG up to 50MB
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                required
                value={uploadForm.title}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, title: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Certificate of Fire Safety"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Evidence Type
              </label>
              <select
                value={uploadForm.evidence_type}
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    evidence_type: e.target.value as EvidenceType,
                  })
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {evidenceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={uploadForm.description}
              onChange={(e) =>
                setUploadForm({ ...uploadForm, description: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={2}
              placeholder="Optional description..."
            />
          </div>

          {!complianceDomain && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Compliance Domain
              </label>
              <select
                value={uploadForm.compliance_domain}
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    compliance_domain: e.target.value,
                  })
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Select domain...</option>
                {complianceDomains.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Certificate specific fields */}
          {uploadForm.evidence_type === "certificate" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Certificate Number
                </label>
                <input
                  type="text"
                  value={uploadForm.document_number}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      document_number: e.target.value,
                    })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="CERT-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Issuing Body
                </label>
                <input
                  type="text"
                  value={uploadForm.issuing_body}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      issuing_body: e.target.value,
                    })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={uploadForm.issued_date}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      issued_date: e.target.value,
                    })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={uploadForm.expiry_date}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      expiry_date: e.target.value,
                    })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              value={uploadForm.tags}
              onChange={(e) =>
                setUploadForm({ ...uploadForm, tags: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="fire, safety, annual (comma-separated)"
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Evidence"}
          </button>
        </form>
      )}

      {/* Link URL Tab */}
      {activeTab === "link" && (
        <form onSubmit={handleLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL *</label>
            <input
              type="url"
              required
              value={linkForm.url}
              onChange={(e) =>
                setLinkForm({ ...linkForm, url: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="https://docs.google.com/document/d/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                required
                value={linkForm.title}
                onChange={(e) =>
                  setLinkForm({ ...linkForm, title: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Fire Safety Inspection Report"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Evidence Type
              </label>
              <select
                value={linkForm.evidence_type}
                onChange={(e) =>
                  setLinkForm({
                    ...linkForm,
                    evidence_type: e.target.value as EvidenceType,
                  })
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {evidenceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={linkForm.description}
              onChange={(e) =>
                setLinkForm({ ...linkForm, description: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={2}
              placeholder="Optional description..."
            />
          </div>

          {!complianceDomain && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Compliance Domain
              </label>
              <select
                value={linkForm.compliance_domain}
                onChange={(e) =>
                  setLinkForm({
                    ...linkForm,
                    compliance_domain: e.target.value,
                  })
                }
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Select domain...</option>
                {complianceDomains.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? "Linking..." : "Link Evidence"}
            </button>

            <button
              type="button"
              onClick={handleGoogleDrivePicker}
              className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Select from Google Drive
            </button>
          </div>
        </form>
      )}

      {/* Link Existing Tab */}
      {activeTab === "existing" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="space-y-4"
        >
          <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
            <p className="text-muted-foreground">
              Select existing evidence from the library to link to this{" "}
              {assetId
                ? "asset"
                : taskId
                  ? "task"
                  : contractorId
                    ? "contractor"
                    : "item"}
              .
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use the Evidence Library to browse and select evidence.
            </p>
          </div>
        </form>
      )}

      {/* Existing Evidence List */}
      {existingEvidence.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">
            Linked Evidence ({existingEvidence.length})
          </h3>
          <div className="space-y-2">
            {existingEvidence.map((evidence) => (
              <div
                key={evidence.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {evidenceTypes.find(
                      (t) => t.value === evidence.evidence_type,
                    )?.icon || "📎"}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{evidence.title}</div>
                    {evidence.description && (
                      <div className="text-xs text-muted-foreground">
                        {evidence.description}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1">
                      {evidence.compliance_domain && (
                        <span className="text-xs rounded bg-muted px-1.5 py-0.5">
                          {evidence.compliance_domain}
                        </span>
                      )}
                      <span className="text-xs rounded bg-muted px-1.5 py-0.5 capitalize">
                        {evidence.evidence_type}
                      </span>
                      <span
                        className={`text-xs rounded px-1.5 py-0.5 ${
                          evidence.status === "verified"
                            ? "bg-green-100 text-green-800"
                            : evidence.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {evidence.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {evidence.file_url && (
                    <a
                      href={evidence.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteEvidence(evidence.id)}
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
