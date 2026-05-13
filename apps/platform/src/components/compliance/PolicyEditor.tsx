"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Save,
  Send,
  Eye,
  History,
  X,
  ArrowLeft,
  Tag,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ApprovalWorkflow from "./ApprovalWorkflow";
import StatusBadge from "./StatusBadge";
import {
  ComplianceItem,
  ComplianceVersion,
  PolicyCategory,
  ConfidentialityLevel,
  CATEGORY_LABELS,
  CONFIDENTIALITY_LABELS,
} from "@/lib/compliance/types";

interface PolicyEditorProps {
  organizationId: string;
  itemId?: string;
  templateId?: string;
  onClose: () => void;
}

export default function PolicyEditor({
  organizationId,
  itemId,
  templateId,
  onClose,
}: PolicyEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const [metadata, setMetadata] = useState({
    title: "",
    category: "school_custom" as PolicyCategory,
    confidentiality_level: "public_internal" as ConfidentialityLevel,
    owner_user_id: "",
    tags: [] as string[],
    tagInput: "",
  });

  const [content, setContent] = useState("");
  const [versions, setVersions] = useState<ComplianceVersion[]>([]);
  const [item, setItem] = useState<ComplianceItem | null>(null);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);

  useEffect(() => {
    if (itemId) {
      loadPolicy();
    } else if (templateId) {
      loadTemplate();
    } else {
      setLoading(false);
    }
  }, [itemId, templateId]);

  const loadPolicy = async () => {
    try {
      const response = await fetch(
        `/api/compliance/items/${itemId}?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setItem(data.item);
        setMetadata({
          title: data.item.title,
          category: data.item.category || "school_custom",
          confidentiality_level:
            data.item.confidentiality_level || "public_internal",
          owner_user_id: data.item.owner_user_id || "",
          tags: data.item.tags || [],
          tagInput: "",
        });
        if (data.item.current_version) {
          setContent(
            data.item.current_version.content_html ||
              data.item.current_version.content_md ||
              "",
          );
        }
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error("Failed to load policy:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async () => {
    try {
      const response = await fetch(
        `/api/compliance/templates/${templateId}?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setMetadata((prev) => ({
          ...prev,
          title: data.template.name,
          category: data.template.is_statutory ? "statutory" : "school_custom",
        }));
        setContent(data.template.content_html || "");
        if (data.template.json_schema?.required_fields) {
          setTemplateVariables(data.template.json_schema.required_fields);
        }
      }
    } catch (error) {
      console.error("Failed to load template:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (submit?: boolean) => {
    setSaving(true);
    setError(null);

    try {
      const url = itemId
        ? `/api/compliance/items/${itemId}`
        : "/api/compliance/items";

      const response = await fetch(url, {
        method: itemId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          type: "policy",
          title: metadata.title,
          category: metadata.category,
          confidentiality_level: metadata.confidentiality_level,
          owner_user_id: metadata.owner_user_id || undefined,
          tags: metadata.tags,
          content_html: content,
          template_id: templateId,
          submit_for_approval: submit,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      if (!itemId) {
        const data = await response.json();
        // Redirect to the created item or close
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/compliance/items/${itemId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish");
      }

      loadPolicy();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (
      metadata.tagInput.trim() &&
      !metadata.tags.includes(metadata.tagInput.trim())
    ) {
      setMetadata((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }));
    }
  };

  const removeTag = (tag: string) => {
    setMetadata((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {itemId ? "Edit Policy" : "New Policy"}
          </h2>
          {item && <StatusBadge status={item.status} />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-1" />
            {showPreview ? "Edit" : "Preview"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullPreview(true)}
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            Full Screen
          </Button>
          {itemId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersions(!showVersions)}
            >
              <History className="w-4 h-4 mr-1" />
              Versions ({versions.length})
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metadata form */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Policy Title *</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) =>
                    setMetadata({ ...metadata, title: e.target.value })
                  }
                  placeholder="e.g. Safeguarding and Child Protection Policy"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={metadata.category}
                    onValueChange={(v) =>
                      setMetadata({
                        ...metadata,
                        category: v as PolicyCategory,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Confidentiality</Label>
                  <Select
                    value={metadata.confidentiality_level}
                    onValueChange={(v) =>
                      setMetadata({
                        ...metadata,
                        confidentiality_level: v as ConfidentialityLevel,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONFIDENTIALITY_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Input
                    id="owner"
                    value={metadata.owner_user_id}
                    onChange={(e) =>
                      setMetadata({
                        ...metadata,
                        owner_user_id: e.target.value,
                      })
                    }
                    placeholder="User ID or name"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={metadata.tagInput}
                    onChange={(e) =>
                      setMetadata({ ...metadata, tagInput: e.target.value })
                    }
                    placeholder="Add a tag..."
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                  >
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {metadata.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs gap-1"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content editor / preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                {showPreview ? "Preview" : "Content"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert min-h-[300px] p-4 border rounded-lg bg-white dark:bg-slate-950"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter policy content here. You can use HTML formatting."
                  rows={20}
                  className="font-mono text-sm"
                />
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={saving}
              variant="outline"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4 mr-1" />
              Submit for Approval
            </Button>
            {item?.status === "approved" && (
              <Button
                onClick={handlePublish}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Publish
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Approval workflow */}
          {itemId && (
            <ApprovalWorkflow
              organizationId={organizationId}
              itemId={itemId}
              onApprovalChange={loadPolicy}
            />
          )}

          {/* Template variables */}
          {templateVariables.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Required Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">
                  These placeholders from the template need to be filled in:
                </p>
                <div className="space-y-1">
                  {templateVariables.map((v) => (
                    <div
                      key={v}
                      className="text-xs font-mono p-2 bg-slate-50 dark:bg-slate-900 rounded"
                    >
                      {`{{${v}}}`}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Version history */}
          {showVersions && versions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="p-2 border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          v{v.version_number}
                        </span>
                        <span className="text-slate-400">
                          {new Date(v.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      {v.change_summary && (
                        <p className="text-slate-500 mt-1">
                          {v.change_summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showFullPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-950"
          >
            <div className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-600 dark:text-purple-300">
                  Policy document preview
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                  {metadata.title || "Untitled policy"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Clean reading view for leadership review, approval and publication checks.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowFullPreview(false)}>
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>
            <div className="p-6">
              <div
                className="prose prose-slate max-w-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:prose-invert dark:border-slate-800 dark:bg-slate-950"
                dangerouslySetInnerHTML={{
                  __html:
                    content ||
                    "<p>This policy has no document content yet. Create or import a managed draft first.</p>",
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
