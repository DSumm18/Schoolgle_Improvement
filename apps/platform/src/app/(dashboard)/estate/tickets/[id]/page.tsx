"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  Shield,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HelpdeskTicket,
  HelpdeskActivity,
  HelpdeskComment,
  TicketPriority,
  TicketStatus,
} from "@/types/estates-compliance";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TicketDetailData {
  ticket: HelpdeskTicket;
  comments: HelpdeskComment[];
  activity: HelpdeskActivity[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadgeClass(status: TicketStatus): string {
  const map: Record<TicketStatus, string> = {
    open: "bg-blue-100 text-blue-800",
    assigned: "bg-indigo-100 text-indigo-800",
    in_progress: "bg-amber-100 text-amber-800",
    awaiting_parts: "bg-orange-100 text-orange-800",
    awaiting_contractor: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-700",
    reopened: "bg-red-100 text-red-800",
    on_hold: "bg-purple-100 text-purple-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

function priorityBadgeClass(priority: TicketPriority): string {
  const map: Record<TicketPriority, string> = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };
  return map[priority] ?? "bg-gray-100 text-gray-700";
}

function humanLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

// Workflow transitions
const NEXT_STATUSES: Partial<Record<TicketStatus, TicketStatus[]>> = {
  open: ["in_progress", "closed"],
  assigned: ["in_progress", "closed"],
  in_progress: ["resolved", "awaiting_parts", "awaiting_contractor", "on_hold"],
  awaiting_parts: ["in_progress", "closed"],
  awaiting_contractor: ["in_progress", "closed"],
  on_hold: ["in_progress", "closed"],
  resolved: ["closed", "reopened"],
  reopened: ["in_progress"],
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EstateTicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { organizationId } = useAuth();

  const apiUrl = `/api/estates/helpdesk/${id}`;
  const { data, error, isLoading } = useSWR<TicketDetailData>(apiUrl, fetcher);

  const ticket = data?.ticket;
  const comments = data?.comments ?? [];
  const activity = data?.activity ?? [];

  // Local state
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status change with note
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  // Combined timeline
  const timeline = useMemo(() => {
    type TimelineItem =
      | { type: "comment"; data: HelpdeskComment; at: string }
      | { type: "activity"; data: HelpdeskActivity; at: string };
    const items: TimelineItem[] = [];
    comments.forEach((c) => items.push({ type: "comment", data: c, at: c.created_at }));
    activity.forEach((a) => items.push({ type: "activity", data: a, at: a.created_at }));
    return items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [comments, activity]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const patchTicket = useCallback(
    async (body: Record<string, unknown>) => {
      const headers = await authHeaders();
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Update failed");
      }
      await mutate(apiUrl);
      return res.json();
    },
    [apiUrl],
  );

  async function handleStatusChange(newStatus: TicketStatus) {
    if (newStatus === "resolved" || newStatus === "closed") {
      setPendingStatus(newStatus);
      return;
    }
    try {
      await patchTicket({ status: newStatus });
      toast.success(`Status updated to ${humanLabel(newStatus)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleConfirmStatusChange() {
    if (!pendingStatus) return;
    try {
      setChangingStatus(true);
      await patchTicket({
        status: pendingStatus,
        resolution: pendingStatus === "resolved" ? statusNote : undefined,
      });
      toast.success(`Ticket marked as ${humanLabel(pendingStatus)}`);
      setPendingStatus(null);
      setStatusNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const headers = await authHeaders();
      const res = await fetch(`${apiUrl}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ comment: commentText, is_internal: isInternal }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      setCommentText("");
      setIsInternal(false);
      await mutate(apiUrl);
      toast.success("Comment added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading ticket...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Link
          href="/estate/tickets"
          className="inline-flex items-center gap-1 text-sm text-[#9F1239] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tickets
        </Link>
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="font-medium text-gray-900">Ticket not found</p>
            <p className="text-sm text-gray-500 mt-1">
              {error?.message ?? "This ticket could not be loaded."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextStatuses = NEXT_STATUSES[ticket.status] ?? [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/estate" className="hover:text-[#9F1239] transition-colors font-medium">
          Estate
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          href="/estate/tickets"
          className="hover:text-[#9F1239] transition-colors font-medium"
        >
          Tickets
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium font-mono">
          #{ticket.ticket_number}
        </span>
      </nav>

      {/* Ticket header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-gray-400">
                  {ticket.ticket_number}
                </span>
                <Badge className={`text-xs px-2 py-0.5 ${statusBadgeClass(ticket.status)}`}>
                  {humanLabel(ticket.status)}
                </Badge>
                <Badge
                  className={`text-xs px-2 py-0.5 font-semibold ${priorityBadgeClass(ticket.priority)}`}
                >
                  {humanLabel(ticket.priority)}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {humanLabel(ticket.category)}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            </div>

            {/* Status action buttons */}
            {nextStatuses.length > 0 && !pendingStatus && (
              <div className="flex flex-wrap gap-2 shrink-0">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === "resolved" || s === "closed" ? "default" : "outline"}
                    className={
                      s === "resolved"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : s === "closed"
                          ? "bg-gray-600 hover:bg-gray-700 text-white"
                          : "border-[#9F1239] text-[#9F1239] hover:bg-[#9F1239]/5"
                    }
                    onClick={() => handleStatusChange(s)}
                  >
                    {humanLabel(s)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status change confirmation with note */}
      {pendingStatus && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-800">
              Confirm: Mark as {humanLabel(pendingStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder={
                pendingStatus === "resolved"
                  ? "What was done to resolve this issue?"
                  : "Add a note about this status change (optional)"
              }
              rows={3}
              className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-[#9F1239] hover:bg-[#881030] text-white gap-2"
                disabled={changingStatus}
                onClick={handleConfirmStatusChange}
              >
                {changingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <CheckCircle className="w-3.5 h-3.5" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPendingStatus(null);
                  setStatusNote("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {ticket.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Resolution (if resolved/closed) */}
          {(ticket.status === "resolved" || ticket.status === "closed") &&
            ticket.resolution && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-5">
                  <h2 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" /> Resolution
                  </h2>
                  <p className="text-sm whitespace-pre-wrap">{ticket.resolution}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                    {ticket.resolved_by && (
                      <span>Resolved by: {ticket.resolved_by}</span>
                    )}
                    {ticket.resolved_at && (
                      <span>on {formatDateTime(ticket.resolved_at)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Activity timeline + comments */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#9F1239]" /> Activity
              </h2>

              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-gray-200 pl-4 py-1"
                    >
                      {item.type === "comment" ? (
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-1">
                            <MessageSquare className="w-3 h-3" />
                            <span className="font-medium text-gray-600">
                              {item.data.author_id}
                            </span>
                            <span>{formatDateTime(item.at)}</span>
                            {item.data.is_internal && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 gap-0.5"
                              >
                                <Shield className="w-2.5 h-2.5" /> Internal
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap text-gray-800">
                            {item.data.comment}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <Activity className="w-3 h-3" />
                          <span>
                            {item.data.description ??
                              humanLabel(item.data.activity_type)}
                          </span>
                          {item.data.from_value && item.data.to_value && (
                            <>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0"
                              >
                                {humanLabel(item.data.from_value)}
                              </Badge>
                              <span>&rarr;</span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0"
                              >
                                {humanLabel(item.data.to_value)}
                              </Badge>
                            </>
                          )}
                          <span>{formatDateTime(item.at)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment */}
              <div className="border-t pt-4 space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F1239]/50 resize-none"
                />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    Internal note
                  </label>
                  <Button
                    size="sm"
                    className="bg-[#9F1239] hover:bg-[#881030] text-white gap-2"
                    disabled={!commentText.trim() || submittingComment}
                    onClick={handleAddComment}
                  >
                    {submittingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Details</h2>
              <div className="space-y-3 text-sm">
                <DetailRow label="Status">
                  <Badge className={`text-xs ${statusBadgeClass(ticket.status)}`}>
                    {humanLabel(ticket.status)}
                  </Badge>
                </DetailRow>
                <DetailRow label="Priority">
                  <Badge
                    className={`text-xs font-semibold ${priorityBadgeClass(ticket.priority)}`}
                  >
                    {humanLabel(ticket.priority)}
                  </Badge>
                </DetailRow>
                <DetailRow label="Category">
                  <span>{humanLabel(ticket.category)}</span>
                </DetailRow>
                {ticket.subcategory && (
                  <DetailRow label="Subcategory">
                    <span>{humanLabel(ticket.subcategory)}</span>
                  </DetailRow>
                )}
                <DetailRow label="Raised by">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {ticket.raised_by || "-"}
                  </span>
                </DetailRow>
                <DetailRow label="Assigned to">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#9F1239]" />
                    {ticket.assigned_to || "Unassigned"}
                  </span>
                </DetailRow>
                <DetailRow label="Created">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(ticket.created_at)}
                  </span>
                </DetailRow>
                <DetailRow label="Updated">
                  <span className="text-gray-500 text-xs">
                    {formatDateTime(ticket.updated_at)}
                  </span>
                </DetailRow>
                {ticket.module && (
                  <DetailRow label="Module">
                    <span>{humanLabel(ticket.module)}</span>
                  </DetailRow>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block text-xs text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </span>
      <div className="text-gray-800">{children}</div>
    </div>
  );
}
