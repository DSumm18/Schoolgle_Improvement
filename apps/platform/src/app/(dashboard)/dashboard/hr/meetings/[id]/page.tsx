"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  FileText,
  Calendar,
  MapPin,
  User,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  MeetingStatusBadge,
  MeetingPreparationPack,
  MeetingDocUpload,
} from "@/components/meetings";
import { PostMeetingActions } from "@/components/meetings";
import type {
  Meeting,
  MeetingTemplate,
  MeetingChecklistItem,
  MeetingAction,
  MeetingAttendee,
} from "@/lib/meetings";

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [template, setTemplate] = useState<MeetingTemplate | null>(null);
  const [checklistItems, setChecklistItems] = useState<MeetingChecklistItem[]>(
    [],
  );
  const [minutes, setMinutes] = useState<any>(null);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [prepContext, setPrepContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [generatingMinutes, setGeneratingMinutes] = useState(false);

  // Documents & Actions state
  const [meetingDocuments, setMeetingDocuments] = useState<any[]>([]);
  const [meetingActions, setMeetingActions] = useState<MeetingAction[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [actionForm, setActionForm] = useState({
    title: "",
    description: "",
    assigneeName: "",
    assigneeId: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });

  useEffect(() => {
    if (!organizationId || !meetingId) return;
    fetch(`/api/meetings/${meetingId}?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => {
        setMeeting(data.meeting);
        setTemplate(data.template);
        setChecklistItems(data.checklist_items || []);
        setAttendees(data.attendees || []);
        setMinutes(data.minutes);
        setPrepContext(data.meeting?.prep_context || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId, meetingId]);

  // Fetch documents generated for this meeting
  useEffect(() => {
    if (!organizationId || !meetingId) return;
    setLoadingDocs(true);
    fetch(
      `/api/documents?organizationId=${organizationId}&contextType=meeting&contextId=${meetingId}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setMeetingDocuments(data.documents || []);
      })
      .catch(console.error)
      .finally(() => setLoadingDocs(false));
  }, [organizationId, meetingId]);

  // Fetch actions linked to this meeting
  useEffect(() => {
    if (!organizationId || !meetingId) return;
    setLoadingActions(true);
    fetch(`/api/meetings/${meetingId}/actions?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => {
        setMeetingActions(data.actions || []);
      })
      .catch(console.error)
      .finally(() => setLoadingActions(false));
  }, [organizationId, meetingId]);

  const handleStartMeeting = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        router.push(`/dashboard/hr/meetings/${meetingId}/live`);
      }
    } catch (err) {
      console.error("Failed to start meeting:", err);
    } finally {
      setStarting(false);
    }
  };

  const handleGenerateMinutes = async () => {
    setGeneratingMinutes(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/minutes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        router.push(`/dashboard/hr/meetings/${meetingId}/minutes`);
      }
    } catch (err) {
      console.error("Failed to generate minutes:", err);
    } finally {
      setGeneratingMinutes(false);
    }
  };

  // Create a new action linked to this meeting
  const handleCreateAction = async () => {
    if (!actionForm.title.trim()) return;
    setSavingAction(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: actionForm.title,
          description: actionForm.description || undefined,
          assigneeId: actionForm.assigneeId || undefined,
          assigneeName: actionForm.assigneeName || undefined,
          dueDate: actionForm.dueDate || undefined,
          priority: actionForm.priority,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMeetingActions((prev) => [data.action, ...prev]);
        setActionForm({
          title: "",
          description: "",
          assigneeName: "",
          assigneeId: "",
          dueDate: "",
          priority: "medium",
        });
        setShowActionForm(false);
      }
    } catch (err) {
      console.error("Failed to create action:", err);
    } finally {
      setSavingAction(false);
    }
  };

  // Get letter template suggestions based on meeting template name
  const getLetterSuggestions = (): {
    label: string;
    templateSlug: string;
  }[] => {
    if (!template)
      return [
        { label: "Meeting Invitation", templateSlug: "meeting-invitation" },
      ];
    const name = template.name.toLowerCase();

    if (
      name.includes("sickness") ||
      name.includes("absence") ||
      name.includes("return to work")
    ) {
      return [
        { label: "Absence Warning", templateSlug: "absence-warning" },
        { label: "Return to Work", templateSlug: "return-to-work" },
        { label: "OH Referral", templateSlug: "oh-referral" },
      ];
    }
    if (name.includes("capability")) {
      return [
        { label: "Capability Warning", templateSlug: "capability-warning" },
      ];
    }
    if (name.includes("grievance")) {
      return [
        { label: "Grievance Outcome", templateSlug: "grievance-outcome" },
      ];
    }
    if (name.includes("probation")) {
      return [
        {
          label: "Probation Review Outcome",
          templateSlug: "probation-review-outcome",
        },
      ];
    }
    return [
      { label: "Meeting Invitation", templateSlug: "meeting-invitation" },
    ];
  };

  // Find the first staff attendee for linking to document generation
  const staffAttendee = attendees.find((a) => a.staff_id);

  const priorityColors: Record<string, string> = {
    low: "bg-slate-500/20 text-slate-300",
    medium: "bg-blue-500/20 text-blue-300",
    high: "bg-amber-500/20 text-amber-300",
    urgent: "bg-red-500/20 text-red-300",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock size={14} className="text-slate-400" />,
    in_progress: <Loader2 size={14} className="text-blue-400 animate-spin" />,
    completed: <CheckCircle2 size={14} className="text-green-400" />,
    overdue: <AlertCircle size={14} className="text-red-400" />,
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">Loading meeting...</div>
    );
  }

  if (!meeting || !template) {
    return (
      <div className="p-12 text-center text-slate-400">Meeting not found</div>
    );
  }

  const tickedCount = checklistItems.filter((i) => i.manually_ticked).length;
  const totalCount = checklistItems.length;

  return (
    <div className="p-6 md:p-8 min-h-screen max-w-[1000px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/hr/meetings">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {template.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <MeetingStatusBadge status={meeting.status} />
            {meeting.compliance_score !== null && (
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {meeting.compliance_score}% compliance
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meeting info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <User size={16} className="text-slate-400" />
            <span className="font-semibold">Attendee:</span>
            {meeting.attendee_name}
            {meeting.attendee_role && ` (${meeting.attendee_role})`}
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Calendar size={16} className="text-slate-400" />
            <span className="font-semibold">Date:</span>
            {new Date(meeting.scheduled_at).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {meeting.location && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <MapPin size={16} className="text-slate-400" />
              <span className="font-semibold">Location:</span>
              {meeting.location}
            </div>
          )}
          {meeting.purpose && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <FileText size={16} className="text-slate-400" />
              <span className="font-semibold">Purpose:</span>
              {meeting.purpose}
            </div>
          )}
        </div>

        {/* Checklist summary for completed meetings */}
        {meeting.status === "completed" && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Checklist: {tickedCount}/{totalCount} items covered
              </span>
              <div className="w-32 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{
                    width: `${totalCount > 0 ? (tickedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Actions based on status */}
      {meeting.status === "scheduled" && (
        <>
          {/* Preparation pack */}
          <MeetingPreparationPack
            guide={template.preparation_guide}
            templateName={template.name}
          />

          {/* AI Document Analysis */}
          <MeetingDocUpload
            meetingId={meetingId}
            organizationId={organizationId}
            onPrepared={(data) => setPrepContext(data)}
            existingPrep={prepContext}
          />

          {/* Start meeting button */}
          <Button
            onClick={handleStartMeeting}
            disabled={starting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl gap-2 w-full h-14 text-lg shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.99]"
          >
            {starting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play size={20} />
                Start Meeting
              </>
            )}
          </Button>
        </>
      )}

      {meeting.status === "in_progress" && (
        <Link href={`/dashboard/hr/meetings/${meetingId}/live`}>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl gap-2 w-full h-14 text-lg">
            <Play size={20} />
            Continue Meeting
          </Button>
        </Link>
      )}

      {meeting.status === "completed" && (
        <div className="flex gap-3">
          {minutes ? (
            <Link
              href={`/dashboard/hr/meetings/${meetingId}/minutes`}
              className="flex-1"
            >
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2 w-full h-12">
                <FileText size={18} />
                View Minutes
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleGenerateMinutes}
              disabled={generatingMinutes}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2 h-12"
            >
              {generatingMinutes ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FileText size={18} />
                  Generate Minutes
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Post-meeting actions component for completed meetings */}
      {meeting.status === "completed" && (
        <PostMeetingActions
          meetingId={meetingId}
          organizationId={organizationId}
          attendeeName={meeting.attendee_name}
          attendeeStaffId={staffAttendee?.staff_id || undefined}
          templateCategory={template?.name}
        />
      )}

      {/* ─── Documents Section ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-purple-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Documents
            </h2>
          </div>
        </div>

        {/* Letter template suggestions */}
        {(staffAttendee || meeting.attendee_name) && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Generate Letter
            </p>
            <div className="flex flex-wrap gap-2">
              {getLetterSuggestions().map((suggestion) => (
                <Link
                  key={suggestion.templateSlug}
                  href={`/dashboard/documents/new?templateId=${suggestion.templateSlug}&meetingId=${meetingId}${staffAttendee?.staff_id ? `&staffId=${staffAttendee.staff_id}` : ""}`}
                >
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors border border-purple-500/20 hover:border-purple-500/30">
                    <FileText size={12} />
                    {suggestion.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Generated documents list */}
        {loadingDocs ? (
          <div className="py-4 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading documents...
          </div>
        ) : meetingDocuments.length > 0 ? (
          <div className="space-y-2">
            {meetingDocuments.map((doc: any) => (
              <Link
                key={doc.id}
                href={`/dashboard/documents/${doc.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-purple-500/30 dark:hover:border-slate-600 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText
                    size={16}
                    className="text-slate-400 group-hover:text-purple-400 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {doc.subject || "Untitled Document"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      doc.status === "draft"
                        ? "bg-amber-500/20 text-amber-400"
                        : doc.status === "finalised"
                          ? "bg-green-500/20 text-green-400"
                          : doc.status === "sent"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {doc.status}
                  </span>
                  <ExternalLink
                    size={14}
                    className="text-slate-400 group-hover:text-purple-400"
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
            No documents generated for this meeting yet.
          </p>
        )}
      </motion.div>

      {/* ─── Actions & Follow-ups Section ──────────────────────────── */}
      <motion.div
        data-section="meeting-actions"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Actions & Follow-ups
            </h2>
          </div>
          <button
            onClick={() => setShowActionForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/20"
          >
            {showActionForm ? (
              <>
                <ChevronUp size={12} />
                Cancel
              </>
            ) : (
              <>
                <Plus size={12} />
                Add Action
              </>
            )}
          </button>
        </div>

        {/* Inline action form */}
        {showActionForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3"
          >
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                Title *
              </label>
              <input
                type="text"
                value={actionForm.title}
                onChange={(e) =>
                  setActionForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g. Schedule follow-up review meeting"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                Description
              </label>
              <textarea
                value={actionForm.description}
                onChange={(e) =>
                  setActionForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={2}
                placeholder="Optional details..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Assignee
                </label>
                <select
                  value={actionForm.assigneeName}
                  onChange={(e) => {
                    const selected = attendees.find(
                      (a) => a.name === e.target.value,
                    );
                    setActionForm((prev) => ({
                      ...prev,
                      assigneeName: e.target.value,
                      assigneeId: selected?.staff_id || "",
                    }));
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/40"
                >
                  <option value="">Unassigned</option>
                  <option value={meeting?.attendee_name || ""}>
                    {meeting?.attendee_name}
                  </option>
                  {attendees
                    .filter((a) => a.name !== meeting?.attendee_name)
                    .map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Due Date
                </label>
                <input
                  type="date"
                  value={actionForm.dueDate}
                  onChange={(e) =>
                    setActionForm((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Priority
                </label>
                <select
                  value={actionForm.priority}
                  onChange={(e) =>
                    setActionForm((prev) => ({
                      ...prev,
                      priority: e.target.value as any,
                    }))
                  }
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/40"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCreateAction}
                disabled={!actionForm.title.trim() || savingAction}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl gap-2 h-9 text-sm disabled:opacity-50"
              >
                {savingAction ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={14} />
                    Create Action
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Actions list */}
        {loadingActions ? (
          <div className="py-4 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading actions...
          </div>
        ) : meetingActions.length > 0 ? (
          <div className="space-y-2">
            {meetingActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {statusIcons[action.status] || statusIcons.pending}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {action.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {action.assignee_name && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {action.assignee_name}
                        </span>
                      )}
                      {action.due_date && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Due{" "}
                          {new Date(action.due_date).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    priorityColors[action.priority || "medium"] ||
                    priorityColors.medium
                  }`}
                >
                  {action.priority || "medium"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
            No actions created for this meeting yet.
          </p>
        )}
      </motion.div>
    </div>
  );
}
