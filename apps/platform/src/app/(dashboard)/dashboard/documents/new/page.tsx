"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileCheck,
  ChevronRight,
  Loader2,
  Search,
  LayoutTemplate,
  Plus,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  module: string;
  document_type: string;
  subject_template: string;
  body_template: string;
  available_placeholders: string[];
  data_sources?: string[];
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

function NewDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");
  const meetingIdParam = searchParams.get("meetingId");
  const staffIdParam = searchParams.get("staffId");

  const { user, organization } = useAuth();
  const organizationId = organization?.id || "";
  const userId = user?.id || "";

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [direction, setDirection] = useState(1);
  const [showEditor, setShowEditor] = useState(false);

  // Document editor state
  const [title, setTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Meeting context state
  const [meetingContext, setMeetingContext] = useState<{
    meetingName: string;
    attendeeName: string;
  } | null>(null);

  // Load template if templateId is in URL
  useEffect(() => {
    if (!templateIdParam || !organizationId) return;
    setLoadingTemplate(true);
    fetch(
      `/api/documents/templates/${templateIdParam}?organizationId=${organizationId}`,
    )
      .then((r) => r.json())
      .then((data) => {
        const template = data.template || data;
        if (template?.id) {
          setSelectedTemplate(template);
          setTitle(template.name);
          setShowEditor(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingTemplate(false));
  }, [templateIdParam, organizationId]);

  // Auto-resolve placeholders when coming from a meeting context
  useEffect(() => {
    if (!templateIdParam || !organizationId) return;
    if (!meetingIdParam && !staffIdParam) return;

    // Fetch meeting context for the banner
    if (meetingIdParam) {
      fetch(`/api/meetings/${meetingIdParam}?organizationId=${organizationId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.meeting && data.template) {
            setMeetingContext({
              meetingName: data.template.name,
              attendeeName: data.meeting.attendee_name || "",
            });
            if (data.meeting.attendee_name && !recipientName) {
              setRecipientName(data.meeting.attendee_name);
            }
          }
        })
        .catch(console.error);
    }

    // Resolve placeholders from meeting and staff context
    fetch("/api/documents/placeholders/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: templateIdParam,
        organizationId,
        meetingId: meetingIdParam || undefined,
        staffId: staffIdParam || undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.placeholders) {
          setFieldValues((prev) => ({ ...data.placeholders, ...prev }));
          if (data.placeholders.recipient_name && !recipientName) {
            setRecipientName(data.placeholders.recipient_name);
          }
          if (data.placeholders.recipient_email && !recipientEmail) {
            setRecipientEmail(data.placeholders.recipient_email);
          }
        }
      })
      .catch(console.error);
  }, [templateIdParam, meetingIdParam, staffIdParam, organizationId]);

  // Fetch all templates for browser
  useEffect(() => {
    if (!organizationId) return;
    setLoadingTemplates(true);
    fetch(`/api/documents/templates?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) =>
        setTemplates(
          Array.isArray(data) ? data : data.templates || data.data || [],
        ),
      )
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, [organizationId]);

  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.name);
    setFieldValues({});
    setDirection(1);
    setShowEditor(true);
  };

  const handleSave = async (asDraft: boolean) => {
    if (!selectedTemplate || !title) return;
    setSaving(true);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          userId,
          templateId: selectedTemplate.id,
          title,
          recipient_name: recipientName || undefined,
          recipient_email: recipientEmail || undefined,
          field_values: fieldValues,
          status: asDraft ? "draft" : "finalised",
          context_type: meetingIdParam ? "meeting" : undefined,
          context_id: meetingIdParam || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.document) {
        router.push(`/dashboard/documents/${data.document.id}`);
      }
    } catch (err) {
      console.error("Failed to save document:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredTemplates = templates.filter((tmpl) => {
    return (
      !templateSearch ||
      tmpl.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (tmpl.description || "")
        .toLowerCase()
        .includes(templateSearch.toLowerCase()) ||
      (tmpl.category || "").toLowerCase().includes(templateSearch.toLowerCase())
    );
  });

  // Loading state for direct template link
  if (loadingTemplate) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1000px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              New Document
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading template...
            </p>
          </div>
        </div>
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin" />
          Loading template...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            New Document
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {!showEditor
              ? "Select a template to get started"
              : `Editing — ${selectedTemplate?.name || "Document"}`}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {/* Template Browser */}
        {!showEditor && (
          <motion.div
            key="template-browser"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-5"
          >
            {/* Search */}
            <div className="relative max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            {loadingTemplates ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Loading templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-12 text-center">
                <LayoutTemplate
                  size={48}
                  className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {templates.length === 0
                    ? "No templates available"
                    : "No matching templates"}
                </h3>
                <p className="text-sm text-slate-500">
                  {templates.length === 0
                    ? "Templates will appear here once configured by your administrator"
                    : "Try adjusting your search criteria"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="group w-full text-left rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5 hover:border-purple-500/40 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                          <FileCheck size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                              {template.description}
                            </p>
                          )}
                          {template.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                              {template.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-400 dark:text-slate-600 mt-1 group-hover:text-purple-400 dark:group-hover:text-slate-400 transition-colors shrink-0"
                      />
                    </div>
                  </button>
                ))}

                {/* Blank document option */}
                <button
                  onClick={() => {
                    setSelectedTemplate({
                      id: "",
                      name: "Blank Document",
                      description: "",
                      category: "custom",
                      module: "",
                      document_type: "",
                      subject_template: "",
                      body_template: "",
                      available_placeholders: [],
                    });
                    setTitle("");
                    setFieldValues({});
                    setDirection(1);
                    setShowEditor(true);
                  }}
                  className="w-full text-left rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-5 hover:border-purple-400 dark:hover:border-slate-500 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Start from scratch
                      </h3>
                      <p className="text-xs text-slate-500">
                        Create a blank document without a template
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Document Editor */}
        {showEditor && selectedTemplate && (
          <motion.div
            key="editor"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-5 max-w-2xl mx-auto"
          >
            <button
              onClick={() => {
                setDirection(-1);
                setShowEditor(false);
              }}
              className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to templates
            </button>

            {/* Meeting context banner */}
            {meetingContext && (
              <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-blue-400" />
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-blue-300">
                    Generating from meeting:
                  </span>{" "}
                  <span className="text-slate-300">
                    {meetingContext.meetingName}
                  </span>
                  {meetingContext.attendeeName && (
                    <>
                      {" "}
                      <span className="text-slate-500">&mdash;</span>{" "}
                      <span className="text-slate-300">
                        {meetingContext.attendeeName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Template summary */}
            {selectedTemplate.name !== "Blank Document" && (
              <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <FileText size={14} className="text-purple-400" />
                  {selectedTemplate.name}
                </div>
                {selectedTemplate.description && (
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>
            )}

            {/* Form */}
            <div className="space-y-5 bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  <FileText size={14} className="text-purple-400" />
                  Document Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Return to Work Letter — Jane Smith"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. jane.smith@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Placeholder Fields */}
              {selectedTemplate.available_placeholders &&
                selectedTemplate.available_placeholders.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                      Template Placeholders
                    </h3>
                    {selectedTemplate.available_placeholders.map(
                      (key: string) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </label>
                          {key.includes("date") ? (
                            <input
                              type="date"
                              value={fieldValues[key] || ""}
                              onChange={(e) =>
                                setFieldValues((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          ) : key.includes("text") ||
                            key.includes("reason") ||
                            key.includes("measures") ||
                            key.includes("purpose") ? (
                            <textarea
                              value={fieldValues[key] || ""}
                              onChange={(e) =>
                                setFieldValues((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              rows={3}
                              placeholder={`Enter ${key.replace(/_/g, " ")}...`}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            />
                          ) : (
                            <input
                              type="text"
                              value={fieldValues[key] || ""}
                              onChange={(e) =>
                                setFieldValues((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              placeholder={`Enter ${key.replace(/_/g, " ")}...`}
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleSave(true)}
                disabled={!title || saving}
                variant="outline"
                className="flex-1 rounded-xl gap-2 h-12 text-base font-semibold border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>Save as Draft</>
                )}
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={!title || saving}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl gap-2 h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Finalise Document
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NewDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-8 min-h-screen max-w-[1000px] mx-auto">
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 size={20} className="animate-spin" />
            Loading...
          </div>
        </div>
      }
    >
      <NewDocumentContent />
    </Suspense>
  );
}
