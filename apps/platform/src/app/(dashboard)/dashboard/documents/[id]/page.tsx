"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Send,
  Download,
  Edit3,
  CheckCircle2,
  Clock,
  Mail,
  Archive,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";

interface DocumentDetail {
  id: string;
  title: string;
  template_name: string;
  template_id: string;
  status: "draft" | "finalised" | "sent" | "archived";
  body_html?: string;
  recipient_name?: string;
  recipient_email?: string;
  field_values?: Record<string, string>;
  created_at: string;
  updated_at: string;
  finalised_at?: string;
  sent_at?: string;
  created_by_name?: string;
}

interface TimelineEvent {
  label: string;
  timestamp: string;
  icon: React.ElementType;
  color: string;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string; icon: React.ElementType }
> = {
  draft: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    label: "Draft",
    icon: Edit3,
  },
  finalised: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    label: "Finalised",
    icon: FileCheck,
  },
  sent: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    label: "Sent",
    icon: Send,
  },
  archived: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    label: "Archived",
    icon: Archive,
  },
};

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const { user, organization } = useAuth();
  const organizationId = organization?.id || "";

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId || !organizationId) return;
    setLoading(true);
    fetch(`/api/documents/${documentId}?organizationId=${organizationId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Document not found");
        return r.json();
      })
      .then((data) => setDocument(data.document || null))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [documentId, organizationId]);

  const handleAction = async (action: "finalise" | "send" | "download") => {
    if (!document) return;
    setActionLoading(action);

    try {
      if (action === "download") {
        const res = await fetch(
          `/api/documents/${document.id}/download?organizationId=${organizationId}`,
        );
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = window.document.createElement("a");
          a.href = url;
          a.download = `${document.title.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
        return;
      }

      const res = await fetch(`/api/documents/${document.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (res.ok) {
        const data = await res.json();
        setDocument(data.document || document);
      }
    } catch (err) {
      console.error(`Failed to ${action} document:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const buildTimeline = (doc: DocumentDetail): TimelineEvent[] => {
    const events: TimelineEvent[] = [
      {
        label: "Created",
        timestamp: doc.created_at,
        icon: FileText,
        color: "text-slate-400",
      },
    ];

    if (doc.finalised_at) {
      events.push({
        label: "Finalised",
        timestamp: doc.finalised_at,
        icon: CheckCircle2,
        color: "text-blue-400",
      });
    }

    if (doc.sent_at) {
      events.push({
        label: "Sent",
        timestamp: doc.sent_at,
        icon: Send,
        color: "text-green-400",
      });
    }

    return events;
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Document
          </h1>
        </div>
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin" />
          Loading document...
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Document
          </h1>
        </div>
        <div className="p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
            Document not found
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {error || "The requested document could not be loaded."}
          </p>
          <Link href="/dashboard/documents">
            <Button variant="outline" className="rounded-xl gap-2">
              <ArrowLeft size={14} />
              Back to documents
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[document.status] || STATUS_STYLES.draft;
  const StatusIcon = statusStyle.icon;
  const timeline = buildTimeline(document);

  return (
    <div className="p-6 md:p-8 min-h-screen max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon" className="rounded-xl mt-1">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
              <Sparkles size={14} className="animate-pulse" />
              Document Production
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {document.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {document.template_name}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusStyle.bg} ${statusStyle.text} font-semibold text-sm`}
        >
          <StatusIcon size={16} />
          {statusStyle.label}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Document Preview
              </h2>
            </div>
            <div className="p-6">
              {document.body_html ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none bg-white text-slate-900 rounded-xl p-8 border border-slate-200 shadow-sm"
                  dangerouslySetInnerHTML={{ __html: document.body_html }}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText
                    size={48}
                    className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                  />
                  <p className="text-sm text-slate-500">
                    No preview available for this document.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recipient Info */}
          {(document.recipient_name || document.recipient_email) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Recipient
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/10 text-purple-400">
                  <User size={20} />
                </div>
                <div>
                  {document.recipient_name && (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {document.recipient_name}
                    </p>
                  )}
                  {document.recipient_email && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Mail size={12} />
                      {document.recipient_email}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {document.status === "draft" && (
              <>
                <Link
                  href={`/dashboard/documents/new?templateId=${document.template_id}`}
                >
                  <Button
                    variant="outline"
                    className="rounded-xl gap-2 border-slate-200 dark:border-slate-700"
                  >
                    <Edit3 size={14} />
                    Edit
                  </Button>
                </Link>
                <Button
                  onClick={() => handleAction("finalise")}
                  disabled={actionLoading === "finalise"}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2"
                >
                  {actionLoading === "finalise" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Finalise
                </Button>
              </>
            )}

            {document.status === "finalised" && (
              <Button
                onClick={() => handleAction("send")}
                disabled={actionLoading === "send"}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
              >
                {actionLoading === "send" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Send
              </Button>
            )}

            <Button
              onClick={() => handleAction("download")}
              disabled={actionLoading === "download"}
              variant="outline"
              className="rounded-xl gap-2 border-slate-200 dark:border-slate-700"
            >
              {actionLoading === "download" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Download
            </Button>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Timeline
            </h2>
            <div className="space-y-0">
              {timeline.map((event, idx) => {
                const EventIcon = event.icon;
                return (
                  <div
                    key={idx}
                    className="relative flex items-start gap-3 pb-6 last:pb-0"
                  >
                    {/* Connector line */}
                    {idx < timeline.length - 1 && (
                      <div className="absolute left-[11px] top-7 w-px h-[calc(100%-16px)] bg-slate-200 dark:bg-slate-700" />
                    )}
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shrink-0 z-10`}
                    >
                      <EventIcon size={12} className={event.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {event.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(event.timestamp).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <FileText size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">
                  Template:
                </span>
                <span className="text-slate-900 dark:text-white font-medium truncate">
                  {document.template_name}
                </span>
              </div>
              {document.created_by_name && (
                <div className="flex items-center gap-3 text-sm">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400">
                    Author:
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium truncate">
                    {document.created_by_name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">
                  Last updated:
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {new Date(document.updated_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
