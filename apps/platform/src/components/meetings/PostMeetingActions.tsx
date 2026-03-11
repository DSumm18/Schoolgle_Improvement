"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  ListTodo,
  ClipboardList,
  ExternalLink,
  Loader2,
  Plus,
  Zap,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostMeetingActionsProps {
  meetingId: string;
  organizationId: string;
  attendeeName?: string;
  attendeeStaffId?: string;
  templateCategory?: string;
}

interface SuggestedAction {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  daysUntil: number;
  icon: React.ReactNode;
}

/**
 * Get smart action suggestions based on meeting template category/name
 */
function getSuggestedActions(templateCategory?: string): SuggestedAction[] {
  const category = (templateCategory || "").toLowerCase();

  if (
    category.includes("sickness") ||
    category.includes("absence") ||
    category.includes("return to work")
  ) {
    return [
      {
        title: "Schedule return to work meeting",
        description: "Arrange RTW interview within 48 hours of return",
        priority: "high",
        daysUntil: 2,
        icon: <Calendar size={14} className="text-blue-400" />,
      },
      {
        title: "Update sickness absence record",
        description: "Record outcome of meeting and any agreed adjustments",
        priority: "medium",
        daysUntil: 1,
        icon: <FileText size={14} className="text-purple-400" />,
      },
      {
        title: "Review Bradford Factor triggers",
        description: "Check if formal process thresholds have been breached",
        priority: "medium",
        daysUntil: 3,
        icon: <AlertTriangle size={14} className="text-amber-400" />,
      },
      {
        title: "Refer to Occupational Health",
        description: "If recurring absence, consider OH referral",
        priority: "low",
        daysUntil: 7,
        icon: <Zap size={14} className="text-green-400" />,
      },
    ];
  }

  if (category.includes("capability")) {
    return [
      {
        title: "Issue formal capability letter",
        description: "Generate and send appropriate stage letter with targets",
        priority: "high",
        daysUntil: 2,
        icon: <FileText size={14} className="text-red-400" />,
      },
      {
        title: "Set improvement targets",
        description: "Define measurable objectives with review timeline",
        priority: "high",
        daysUntil: 3,
        icon: <ListTodo size={14} className="text-amber-400" />,
      },
      {
        title: "Schedule review meeting",
        description: "Book follow-up review in 4-6 weeks",
        priority: "medium",
        daysUntil: 5,
        icon: <Calendar size={14} className="text-blue-400" />,
      },
    ];
  }

  if (category.includes("grievance")) {
    return [
      {
        title: "Issue grievance outcome letter",
        description: "Formally communicate the outcome within 5 working days",
        priority: "urgent",
        daysUntil: 5,
        icon: <FileText size={14} className="text-red-400" />,
      },
      {
        title: "Update grievance log",
        description: "Record outcome and any agreed actions",
        priority: "high",
        daysUntil: 1,
        icon: <ClipboardList size={14} className="text-purple-400" />,
      },
    ];
  }

  if (category.includes("probation")) {
    return [
      {
        title: "Issue probation review outcome letter",
        description: "Confirm whether probation is passed, extended, or failed",
        priority: "high",
        daysUntil: 3,
        icon: <FileText size={14} className="text-blue-400" />,
      },
      {
        title: "Update staff record",
        description: "Update employment status and NQT induction records",
        priority: "medium",
        daysUntil: 5,
        icon: <ListTodo size={14} className="text-green-400" />,
      },
    ];
  }

  if (category.includes("disciplinary")) {
    return [
      {
        title: "Issue disciplinary outcome letter",
        description: "Formal notification of warning level and right of appeal",
        priority: "urgent",
        daysUntil: 3,
        icon: <FileText size={14} className="text-red-400" />,
      },
      {
        title: "Log disciplinary record",
        description: "Record in staff file with expiry date for warning",
        priority: "high",
        daysUntil: 1,
        icon: <ClipboardList size={14} className="text-purple-400" />,
      },
      {
        title: "Schedule review meeting",
        description: "Book follow-up to check compliance with any conditions",
        priority: "medium",
        daysUntil: 14,
        icon: <Calendar size={14} className="text-blue-400" />,
      },
    ];
  }

  // Default suggestions for any other meeting type
  return [
    {
      title: "Send meeting follow-up letter",
      description: "Summarise key discussion points and agreed actions",
      priority: "medium",
      daysUntil: 3,
      icon: <FileText size={14} className="text-purple-400" />,
    },
    {
      title: "Create follow-up actions",
      description: "Record any agreed tasks with deadlines and owners",
      priority: "medium",
      daysUntil: 1,
      icon: <ListTodo size={14} className="text-green-400" />,
    },
  ];
}

export function PostMeetingActions({
  meetingId,
  organizationId,
  attendeeName,
  attendeeStaffId,
  templateCategory,
}: PostMeetingActionsProps) {
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [creatingActions, setCreatingActions] = useState<
    Record<number, boolean>
  >({});
  const [createdActions, setCreatedActions] = useState<Set<number>>(new Set());

  const suggestions = getSuggestedActions(templateCategory);

  useEffect(() => {
    if (!organizationId || !meetingId) return;
    setLoadingDocs(true);
    fetch(
      `/api/documents?organizationId=${organizationId}&contextType=meeting&contextId=${meetingId}&limit=3`,
    )
      .then((r) => r.json())
      .then((data) => setRecentDocs(data.documents || []))
      .catch(console.error)
      .finally(() => setLoadingDocs(false));
  }, [organizationId, meetingId]);

  const handleQuickCreateAction = async (
    index: number,
    suggestion: SuggestedAction,
  ) => {
    setCreatingActions((prev) => ({ ...prev, [index]: true }));
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + suggestion.daysUntil);

      const res = await fetch(`/api/meetings/${meetingId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority,
          dueDate: dueDate.toISOString().split("T")[0],
        }),
      });
      if (res.ok) {
        setCreatedActions((prev) => new Set([...prev, index]));
      }
    } catch (err) {
      console.error("Failed to create action:", err);
    } finally {
      setCreatingActions((prev) => ({ ...prev, [index]: false }));
    }
  };

  // Build the generate letter URL with meeting context
  const generateLetterUrl = `/dashboard/documents/new?meetingId=${meetingId}${attendeeStaffId ? `&staffId=${attendeeStaffId}` : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 size={18} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Meeting Complete
          </h2>
          {attendeeName && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {attendeeName}
            </p>
          )}
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href={generateLetterUrl}>
          <Button
            variant="outline"
            className="w-full h-auto py-3 rounded-xl border-slate-200 dark:border-slate-700 hover:border-purple-500/30 dark:hover:border-slate-600 flex flex-col items-center gap-1.5 transition-all"
          >
            <FileText size={18} className="text-purple-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Generate Letter
            </span>
          </Button>
        </Link>
        <button
          onClick={() => {
            const actionsSection = document.querySelector(
              '[data-section="meeting-actions"]',
            );
            if (actionsSection) {
              actionsSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="w-full h-auto py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-500/30 dark:hover:border-slate-600 flex flex-col items-center gap-1.5 transition-all bg-transparent"
        >
          <ListTodo size={18} className="text-green-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Create Follow-up Action
          </span>
        </button>
        <Link href={`/dashboard/hr/meetings/${meetingId}/minutes`}>
          <Button
            variant="outline"
            className="w-full h-auto py-3 rounded-xl border-slate-200 dark:border-slate-700 hover:border-blue-500/30 dark:hover:border-slate-600 flex flex-col items-center gap-1.5 transition-all"
          >
            <ClipboardList size={18} className="text-blue-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              View Minutes
            </span>
          </Button>
        </Link>
      </div>

      {/* Smart Action Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-amber-400" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Suggested Next Steps
            </p>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  createdActions.has(i)
                    ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30"
                    : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {createdActions.has(i) ? (
                    <CheckCircle2
                      size={14}
                      className="text-green-400 shrink-0"
                    />
                  ) : (
                    <div className="shrink-0">{suggestion.icon}</div>
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        createdActions.has(i)
                          ? "text-green-700 dark:text-green-300 line-through"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {suggestion.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      suggestion.priority === "urgent"
                        ? "bg-red-500/20 text-red-400"
                        : suggestion.priority === "high"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {suggestion.daysUntil}d
                  </span>
                  {!createdActions.has(i) && (
                    <button
                      onClick={() => handleQuickCreateAction(i, suggestion)}
                      disabled={creatingActions[i]}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      {creatingActions[i] ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Plus size={10} />
                      )}
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently generated documents */}
      {loadingDocs ? (
        <div className="py-3 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 size={12} className="animate-spin" />
          Loading documents...
        </div>
      ) : recentDocs.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Recent Documents
          </p>
          {recentDocs.map((doc: any) => (
            <Link
              key={doc.id}
              href={`/dashboard/documents/${doc.id}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-purple-500/30 dark:hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText
                  size={14}
                  className="text-slate-400 group-hover:text-purple-400 shrink-0"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {doc.subject || "Untitled"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    doc.status === "draft"
                      ? "bg-amber-500/20 text-amber-400"
                      : doc.status === "finalised"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {doc.status}
                </span>
                <ExternalLink
                  size={12}
                  className="text-slate-400 group-hover:text-purple-400"
                />
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Link to full document production and triggers */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
        <Link
          href={`/dashboard/documents?contextType=meeting&contextId=${meetingId}`}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
        >
          View all meeting documents &rarr;
        </Link>
        <Link
          href="/dashboard/documents/triggers"
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1"
        >
          <Zap size={10} />
          Set up auto-triggers
        </Link>
      </div>
    </motion.div>
  );
}
