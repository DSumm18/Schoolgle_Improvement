"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { fetcher } from "@/lib/fetchers";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  HelpdeskTicket,
  HelpdeskComment,
  HelpdeskActivity,
  TicketStatus,
  TicketPriority,
} from "@/types/estates-compliance";
import { PhotoCapture } from "@/components/estates-compliance/PhotoCapture";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Clock,
  User,
  Tag,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Activity,
  Camera,
  Send,
  Shield,
  ChevronUp,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_parts", label: "Awaiting Parts" },
  { value: "awaiting_contractor", label: "Awaiting Contractor" },
  { value: "on_hold", label: "On Hold" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "reopened", label: "Reopened" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function statusColor(status: TicketStatus): string {
  const map: Record<TicketStatus, string> = {
    open: "bg-blue-100 text-blue-800",
    assigned: "bg-indigo-100 text-indigo-800",
    in_progress: "bg-amber-100 text-amber-800",
    awaiting_parts: "bg-orange-100 text-orange-800",
    awaiting_contractor: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
    reopened: "bg-red-100 text-red-800",
    on_hold: "bg-purple-100 text-purple-800",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

function priorityColor(priority: TicketPriority): string {
  const map: Record<TicketPriority, string> = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };
  return map[priority] || "bg-gray-100 text-gray-600";
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

function labelFor(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Types for API response
// ---------------------------------------------------------------------------

interface TicketDetailData {
  ticket: HelpdeskTicket;
  comments: HelpdeskComment[];
  activity: HelpdeskActivity[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HelpdeskTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const ticketId = params.ticketId as string;

  const apiUrl = `/api/estates/helpdesk/${ticketId}`;
  const { data, error, isLoading } = useSWR<TicketDetailData>(apiUrl, fetcher);

  // Local state
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submittingResolve, setSubmittingResolve] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [photos, setPhotos] = useState<
    Array<{ id: string; url: string; timestamp: Date; caption?: string }>
  >([]);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);

  const ticket = data?.ticket;
  const comments = data?.comments || [];
  const activity = data?.activity || [];

  // Combined timeline: comments + activity sorted chronologically
  const timeline = useMemo(() => {
    const items: Array<
      | { type: "comment"; data: HelpdeskComment; at: string }
      | { type: "activity"; data: HelpdeskActivity; at: string }
    > = [];
    comments.forEach((c) =>
      items.push({ type: "comment", data: c, at: c.created_at }),
    );
    activity.forEach((a) =>
      items.push({ type: "activity", data: a, at: a.created_at }),
    );
    items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    return items;
  }, [comments, activity]);

  // Patch ticket helper
  async function patchTicket(body: Record<string, unknown>) {
    setPatchError(null);
    const headers = await authHeaders();
    const res = await fetch(apiUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setPatchError(err.error || "Update failed");
      return null;
    }
    await mutate(apiUrl);
    return res.json();
  }

  // Handlers
  async function handleStatusChange(newStatus: string) {
    if (newStatus === "resolved") {
      setShowResolve(true);
      return;
    }
    await patchTicket({ status: newStatus });
  }

  async function handlePriorityChange(newPriority: string) {
    await patchTicket({ priority: newPriority });
  }

  async function handleResolve() {
    setSubmittingResolve(true);
    await patchTicket({ status: "resolved", resolution: resolutionNotes });
    setSubmittingResolve(false);
    setShowResolve(false);
    setResolutionNotes("");
  }

  async function handleEscalate() {
    await patchTicket({ priority: "critical" });
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    const headers = await authHeaders();
    const res = await fetch(`${apiUrl}/comments`, {
      method: "POST",
      headers,
      body: JSON.stringify({ comment: commentText, is_internal: isInternal }),
    });
    if (res.ok) {
      setCommentText("");
      setIsInternal(false);
      await mutate(apiUrl);
    }
    setSubmittingComment(false);
  }

  async function handleSavePhotos() {
    if (!ticket || photos.length === 0) return;
    setSavingPhotos(true);
    const existingUrls = ticket.attachment_urls || [];
    const newUrls = photos.map((p) => p.url);
    await patchTicket({ attachment_urls: [...existingUrls, ...newUrls] });
    setPhotos([]);
    setShowPhotos(false);
    setSavingPhotos(false);
  }

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link
          href="/estates-compliance/helpdesk"
          className="inline-flex items-center gap-1 text-sm text-teal-600 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Helpdesk
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="text-lg font-medium">Ticket not found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {error?.message || "The ticket could not be loaded."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/estates-compliance/helpdesk"
        className="inline-flex items-center gap-1 text-sm text-teal-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Helpdesk
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-muted-foreground">
              {ticket.ticket_number}
            </span>
            <Badge className={statusColor(ticket.status)}>
              {labelFor(ticket.status)}
            </Badge>
            <Badge className={priorityColor(ticket.priority)}>
              {labelFor(ticket.priority)}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold">{ticket.title}</h1>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {ticket.status !== "resolved" && ticket.status !== "closed" && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowResolve(true)}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Mark Resolved
            </Button>
          )}
          {ticket.priority !== "critical" &&
            ticket.status !== "resolved" &&
            ticket.status !== "closed" && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={handleEscalate}
              >
                <ChevronUp className="h-4 w-4 mr-1" /> Escalate
              </Button>
            )}
        </div>
      </div>

      {patchError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          {patchError}
        </div>
      )}

      {/* Resolve dialog */}
      {showResolve && (
        <Card className="border-green-200">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-green-800">Resolve Ticket</h3>
            <Textarea
              placeholder="Resolution notes - what was done to resolve this issue?"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={submittingResolve || !resolutionNotes.trim()}
                onClick={handleResolve}
              >
                {submittingResolve ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Confirm Resolution
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowResolve(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content (left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {ticket.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Photos / Evidence */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-teal-600" /> Photos &amp;
                  Evidence
                </h2>
                {!showPhotos && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPhotos(true)}
                  >
                    Add Photos
                  </Button>
                )}
              </div>

              {/* Existing attachment images */}
              {ticket.attachment_urls && ticket.attachment_urls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ticket.attachment_urls.map((url, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={url}
                        alt={`Attachment ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {(!ticket.attachment_urls ||
                ticket.attachment_urls.length === 0) &&
                !showPhotos && (
                  <p className="text-sm text-muted-foreground">
                    No photos attached yet.
                  </p>
                )}

              {/* PhotoCapture for adding new photos */}
              {showPhotos && (
                <div className="space-y-3">
                  <PhotoCapture
                    photos={photos}
                    onPhotosChange={setPhotos}
                    maxPhotos={10}
                    label="Add Evidence Photos"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                      disabled={photos.length === 0 || savingPhotos}
                      onClick={handleSavePhotos}
                    >
                      {savingPhotos ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Save {photos.length} Photo{photos.length !== 1 ? "s" : ""}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowPhotos(false);
                        setPhotos([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution (if resolved) */}
          {(ticket.status === "resolved" || ticket.status === "closed") &&
            ticket.resolution && (
              <Card className="border-green-200">
                <CardContent className="p-5 space-y-2">
                  <h2 className="font-semibold text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Resolution
                  </h2>
                  <p className="text-sm whitespace-pre-wrap">
                    {ticket.resolution}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {ticket.resolved_by && (
                      <span>Resolved by: {ticket.resolved_by}</span>
                    )}
                    {ticket.resolved_at && (
                      <span>
                        Resolved: {formatDateTime(ticket.resolved_at)}
                      </span>
                    )}
                  </div>
                  {ticket.satisfaction_rating && (
                    <div className="text-sm">
                      Satisfaction:{" "}
                      <span className="font-medium">
                        {ticket.satisfaction_rating}/5
                      </span>
                      {ticket.satisfaction_feedback && (
                        <span className="text-muted-foreground ml-2">
                          - {ticket.satisfaction_feedback}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Timeline */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600" /> Activity Timeline
              </h2>

              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-gray-200 pl-4 py-1"
                    >
                      {item.type === "comment" ? (
                        <div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <MessageSquare className="h-3 w-3" />
                            <span className="font-medium text-gray-700">
                              {item.data.author_id}
                            </span>
                            <span>{formatDateTime(item.at)}</span>
                            {item.data.is_internal && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0"
                              >
                                <Shield className="h-2.5 w-2.5 mr-0.5" />{" "}
                                Internal
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {item.data.comment}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          <span>
                            {item.data.description ||
                              `${labelFor(item.data.activity_type)}`}
                          </span>
                          {item.data.from_value && item.data.to_value && (
                            <span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0"
                              >
                                {labelFor(item.data.from_value)}
                              </Badge>
                              {" -> "}
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0"
                              >
                                {labelFor(item.data.to_value)}
                              </Badge>
                            </span>
                          )}
                          <span>{formatDateTime(item.at)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment form */}
              <div className="border-t pt-4 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Shield className="h-3.5 w-3.5 text-amber-600" />
                    Internal note
                  </label>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={!commentText.trim() || submittingComment}
                    onClick={handleAddComment}
                  >
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (right col) */}
        <div className="space-y-4">
          {/* Details card */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="font-semibold">Details</h2>

              <div className="space-y-3 text-sm">
                {/* Status */}
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Status
                  </span>
                  <Select
                    value={ticket.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Priority
                  </span>
                  <Select
                    value={ticket.priority}
                    onValueChange={handlePriorityChange}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Category
                  </span>
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-teal-600" />
                    <span>{ticket.category || "-"}</span>
                    {ticket.subcategory && (
                      <span className="text-muted-foreground">
                        / {ticket.subcategory}
                      </span>
                    )}
                  </div>
                </div>

                {/* Raised by */}
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Raised by
                  </span>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-500" />
                    <span>{ticket.raised_by}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(ticket.created_at)}
                  </span>
                </div>

                {/* Assigned to */}
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Assigned to
                  </span>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-teal-600" />
                    <span>{ticket.assigned_to || "Unassigned"}</span>
                  </div>
                </div>

                {/* Asset link */}
                {ticket.asset_id && (
                  <div>
                    <span className="text-muted-foreground block mb-1">
                      Linked Asset
                    </span>
                    <Link
                      href={`/estates-compliance/assets/${ticket.asset_id}`}
                      className="text-teal-600 hover:underline text-sm"
                    >
                      View Asset
                    </Link>
                  </div>
                )}

                {/* SLA */}
                {ticket.sla_target && (
                  <div>
                    <span className="text-muted-foreground block mb-1">
                      SLA Target
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDateTime(ticket.sla_target)}</span>
                    </div>
                    {ticket.sla_met !== null &&
                      ticket.sla_met !== undefined && (
                        <Badge
                          className={
                            ticket.sla_met
                              ? "bg-green-100 text-green-800 mt-1"
                              : "bg-red-100 text-red-800 mt-1"
                          }
                        >
                          {ticket.sla_met ? "SLA Met" : "SLA Breached"}
                        </Badge>
                      )}
                  </div>
                )}

                {/* Module */}
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Module
                  </span>
                  <span>{labelFor(ticket.module)}</span>
                </div>

                {/* Updated */}
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Last Updated
                  </span>
                  <span className="text-xs">
                    {formatDateTime(ticket.updated_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
