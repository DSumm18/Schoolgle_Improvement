"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Link2,
  Edit,
  Trash2,
  MessageSquare,
  Timer,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  UnifiedTask,
  UnifiedTaskWithAssignee,
  TaskComment,
  TaskTimeEntry,
} from "@/lib/tasks";

interface TaskDetailPanelProps {
  organizationId: string;
  task: UnifiedTask | null;
  onClose: () => void;
  onUpdate?: () => void;
  onEdit?: (task: UnifiedTask) => void;
  onDelete?: (task: UnifiedTask) => void;
}

export default function TaskDetailPanel({
  organizationId,
  task,
  onClose,
  onUpdate,
  onEdit,
  onDelete,
}: TaskDetailPanelProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [timeEntries, setTimeEntries] = useState<TaskTimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "comments" | "time">(
    "overview",
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["details"]),
  );

  useEffect(() => {
    if (task) {
      fetchTaskData();
    }
  }, [task]);

  const fetchTaskData = async () => {
    if (!task) return;

    setLoading(true);
    try {
      const [commentsRes, timeRes] = await Promise.all([
        authFetch(`/api/tasks/${task.id}/comments?organizationId=${organizationId}`, { organizationId }),
        authFetch(`/api/tasks/${task.id}/time?organizationId=${organizationId}`, { organizationId }),
      ]);

      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments || []);
      }

      if (timeRes.ok) {
        const data = await timeRes.json();
        setTimeEntries(data.time_entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch task data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const addComment = async (content: string) => {
    if (!task || !content.trim()) return;

    try {
      const response = await authFetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        organizationId,
        body: JSON.stringify({
          organizationId,
          userId: null, // Would come from auth
          content,
        }),
      });

      if (response.ok) {
        fetchTaskData();
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const addTimeEntry = async (minutes: number, description: string) => {
    if (!task) return;

    try {
      const response = await authFetch(`/api/tasks/${task.id}/time`, {
        method: "POST",
        organizationId,
        body: JSON.stringify({
          organizationId,
          userId: null,
          minutes,
          description,
        }),
      });

      if (response.ok) {
        fetchTaskData();
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to add time entry:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "bg-slate-100 text-slate-700",
      in_progress: "bg-blue-100 text-blue-700",
      review: "bg-amber-100 text-amber-700",
      completed: "bg-emerald-100 text-emerald-700",
      blocked: "bg-rose-100 text-rose-700",
      cancelled: "bg-slate-100 text-slate-500",
    };
    return colors[status] || colors.not_started;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-rose-600 text-white",
      high: "bg-rose-100 text-rose-700",
      medium: "bg-amber-100 text-amber-700",
      low: "bg-emerald-100 text-emerald-700",
    };
    return colors[priority] || colors.medium;
  };

  const totalMinutes = timeEntries.reduce(
    (sum, entry) => sum + entry.minutes,
    0,
  );
  const totalHours = totalMinutes / 60;

  if (!task) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-slate-900 border-l shadow-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-bold text-lg truncate">{task.title}</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Button variant="outline" size="sm" onClick={() => onEdit?.(task)}>
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete?.(task)}
          className="text-rose-600 hover:text-rose-700"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="p-4 space-y-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                className={`text-[10px] font-bold uppercase px-2 py-1 ${getStatusColor(task.status)}`}
              >
                {task.status.replace("_", " ")}
              </Badge>
              <Badge
                className={`text-[10px] font-bold uppercase px-2 py-1 ${getPriorityColor(task.priority)}`}
              >
                {task.priority}
              </Badge>
              {task.source_table === "estates_compliance_tasks" && (
                <Badge variant="outline">Estates</Badge>
              )}
            </div>

            {/* Expandable Details */}
            <Section
              title="Task Details"
              expanded={expandedSections.has("details")}
              onToggle={() => toggleSection("details")}
            >
              {task.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {task.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    {task.due_date
                      ? format(new Date(task.due_date), "d MMM yyyy")
                      : "No due date"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    {task.start_date
                      ? format(new Date(task.start_date), "d MMM yyyy")
                      : "Not started"}
                  </span>
                </div>
                {(task as UnifiedTaskWithAssignee).assignee_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      {(task as UnifiedTaskWithAssignee).assignee_name}
                    </span>
                  </div>
                )}
                {task.estimated_hours && (
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      {task.estimated_hours}h estimated
                    </span>
                  </div>
                )}
              </div>
            </Section>

            {/* Progress */}
            <Section
              title="Progress"
              expanded={expandedSections.has("progress")}
              onToggle={() => toggleSection("progress")}
            >
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Completion</span>
                    <span className="font-medium">{task.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        task.status === "completed"
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
                {task.actual_hours && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Time logged</span>
                    <span className="font-medium">{task.actual_hours}h</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Checklist */}
            {task.checklist && task.checklist.length > 0 && (
              <Section
                title={`Checklist (${task.checklist.filter((c: any) => c.completed).length}/${task.checklist.length})`}
                expanded={expandedSections.has("checklist")}
                onToggle={() => toggleSection("checklist")}
              >
                <div className="space-y-2">
                  {task.checklist.map((item: any, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          item.completed
                            ? "bg-emerald-500 text-white"
                            : "border-2 border-slate-300"
                        }`}
                      >
                        {item.completed && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span
                        className={
                          item.completed ? "line-through text-slate-400" : ""
                        }
                      >
                        {item.title || item}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Linked Evidence */}
            {task.linked_evidence && task.linked_evidence.length > 0 && (
              <Section
                title={`Evidence (${task.linked_evidence.length})`}
                expanded={expandedSections.has("evidence")}
                onToggle={() => toggleSection("evidence")}
              >
                <div className="flex flex-wrap gap-2">
                  {task.linked_evidence.map((evidence: any, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Link2 className="w-3 h-3 mr-1" />
                      {evidence.title || evidence}
                    </Badge>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === "comments" && (
          <div className="p-4">
            <CommentList
              comments={comments}
              onAddComment={addComment}
              loading={loading}
            />
          </div>
        )}

        {/* Time Tab */}
        {activeTab === "time" && (
          <div className="p-4">
            <TimeTracking
              timeEntries={timeEntries}
              totalHours={totalHours}
              onAddTime={addTimeEntry}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Footer Tabs */}
      <div className="flex border-t">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "comments"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Comments ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab("time")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "time"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Time ({timeEntries.length})
        </button>
      </div>
    </motion.div>
  );
}

// Section Component
interface SectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, expanded, onToggle, children }: SectionProps) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="text-sm font-medium">{title}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t p-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Comment List Component
interface CommentListProps {
  comments: TaskComment[];
  onAddComment: (content: string) => void;
  loading: boolean;
}

function CommentList({ comments, onAddComment, loading }: CommentListProps) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    await onAddComment(newComment);
    setNewComment("");
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              {(comment.user_name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                {comment.user_name || "User"}
              </span>
              <span className="text-xs text-slate-400">
                {comment.created_at
                  ? format(new Date(comment.created_at), "d MMM yyyy")
                  : ""}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {comment.content}
            </p>
          </div>
        </div>
      ))}

      {comments.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet</p>
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
          className="self-end"
        >
          Post
        </Button>
      </div>
    </div>
  );
}

// Time Tracking Component
interface TimeTrackingProps {
  timeEntries: TaskTimeEntry[];
  totalHours: number;
  onAddTime: (minutes: number, description: string) => void;
  loading: boolean;
}

function TimeTracking({
  timeEntries,
  totalHours,
  onAddTime,
  loading,
}: TimeTrackingProps) {
  const [minutes, setMinutes] = useState("30");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const mins = parseInt(minutes);
    if (!mins || mins <= 0) return;

    setSubmitting(true);
    await onAddTime(mins, description);
    setDescription("");
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total time logged</span>
            <span className="text-xl font-bold">{totalHours.toFixed(1)}h</span>
          </div>
        </CardContent>
      </Card>

      {/* Add Time Entry */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-medium">Log Time</h4>
          <div className="flex gap-2">
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="Minutes"
              min="1"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="flex-1"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Adding..." : "Add Time Entry"}
          </Button>
        </CardContent>
      </Card>

      {/* Time Entries List */}
      <div className="space-y-2">
        {timeEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2 border rounded-lg"
          >
            <div>
              <p className="text-sm font-medium">
                {entry.description || "No description"}
              </p>
              <p className="text-xs text-slate-500">
                {entry.minutes}min •{" "}
                {entry.date ? format(new Date(entry.date), "d MMM") : ""}
              </p>
            </div>
            <span className="text-sm font-medium">{entry.minutes}m</span>
          </div>
        ))}
      </div>

      {timeEntries.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-400">
          <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No time logged yet</p>
        </div>
      )}
    </div>
  );
}
