"use client";

/**
 * Task Detail Sheet
 * Shows full task details with multiple action options
 */

import { useState } from "react";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  Clock,
  Calendar as CalendarIcon,
  FileText,
  ChevronRight,
  X,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuth } from "@/context/SupabaseAuthContext";
export interface TodayTask {
  checkId: string;
  checkName: string;
  domain: import("@/lib/estates-compliance/statutory-checks").ComplianceDomain;
  domainIcon: string;
  domainName: string;
  status: "overdue" | "due_today" | "due_soon";
  frequency: string;
  category: string;
  nextDue?: string;
}

interface TaskDetailSheetProps {
  task: TodayTask;
  onComplete: (checkId: string) => void;
  onSnooze?: (checkId: string) => void;
  onMarkNA?: (checkId: string) => void;
}

type NaReasonCategory =
  | "not_applicable_site"
  | "service_outsourced"
  | "equipment_not_present"
  | "other";

const NA_REASON_OPTIONS: {
  value: NaReasonCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "not_applicable_site",
    label: "Not applicable to this site",
    description: "This statutory check does not apply to your school location",
  },
  {
    value: "service_outsourced",
    label: "Service outsourced",
    description: "This task is handled by an external contractor/provider",
  },
  {
    value: "equipment_not_present",
    label: "Equipment not present",
    description:
      "The equipment or system covered by this check is not installed",
  },
  {
    value: "other",
    label: "Other (please specify)",
    description: "Another reason - please provide details below",
  },
];

export function TaskDetailSheet({
  task,
  onComplete,
  onSnooze,
  onMarkNA,
}: TaskDetailSheetProps) {
  const [open, setOpen] = useState(false);
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [markNADialogOpen, setMarkNADialogOpen] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>(
    addDays(new Date(), 1),
  );
  const [snoozeReason, setSnoozeReason] = useState("");
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [naReasonCategory, setNaReasonCategory] = useState<
    NaReasonCategory | ""
  >("");
  const [naReason, setNaReason] = useState("");
  const [isMarkingNA, setIsMarkingNA] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { organizationId } = useAuth();

  const handleComplete = () => {
    onComplete(task.checkId);
    setOpen(false);
    toast.success(`${task.checkName} completed`, {
      description: "Task marked as complete",
    });
  };

  const handleSnooze = async () => {
    if (!snoozeDate) {
      toast.error("Please select a date", {
        description: "Choose when this task should be rescheduled to",
      });
      return;
    }

    setIsSnoozing(true);
    try {
      const response = await fetch("/api/estates-compliance/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "snooze",
          organizationId: organizationId,
          check_id: task.checkId,
          new_due_date: snoozeDate.toISOString().split("T")[0],
          reason: snoozeReason || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to snooze task");
      }

      setSnoozeDialogOpen(false);
      setOpen(false);
      setSnoozeReason("");
      setSnoozeDate(addDays(new Date(), 1));

      toast.success(`${task.checkName} snoozed`, {
        description: `Rescheduled to ${format(snoozeDate, "dd MMM yyyy")}`,
      });

      // Refresh the page data
      onSnooze?.(task.checkId);
    } catch (error) {
      console.error("Error snoozing task:", error);
      toast.error("Failed to snooze task", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleMarkNA = async () => {
    if (!naReasonCategory) {
      toast.error("Please select a reason", {
        description: "Choose why this check is not applicable",
      });
      return;
    }

    if (naReasonCategory === "other" && !naReason.trim()) {
      toast.error("Please provide details", {
        description: "Explain why this check is not applicable",
      });
      return;
    }

    setIsMarkingNA(true);
    try {
      const response = await fetch("/api/estates-compliance/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_na",
          organizationId: organizationId,
          check_id: task.checkId,
          reason: naReason.trim(),
          reason_category: naReasonCategory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark task as N/A");
      }

      setMarkNADialogOpen(false);
      setOpen(false);
      setNaReasonCategory("");
      setNaReason("");

      toast.success(`${task.checkName} marked as N/A`, {
        description: "Task will not appear in upcoming checks",
      });

      // Refresh the page data
      onMarkNA?.(task.checkId);
    } catch (error) {
      console.error("Error marking task as N/A:", error);
      toast.error("Failed to mark task as N/A", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsMarkingNA(false);
    }
  };

  const setQuickSnooze = (days: number) => {
    setSnoozeDate(addDays(new Date(), days));
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 animate-pulse">
            ⚠️ Overdue
          </Badge>
        );
      case "due_today":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
            📅 Due Today
          </Badge>
        );
      case "due_soon":
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-200">
            📆 Due Soon
          </Badge>
        );
    }
  };

  const TriggerComponent = isDesktop ? Dialog : Sheet;
  const TriggerContent = isDesktop ? DialogTrigger : SheetTrigger;
  const ContentComponent = isDesktop ? DialogContent : SheetContent;

  return (
    <>
      <TriggerComponent open={open} onOpenChange={setOpen}>
        <TriggerContent asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            data-task-detail={task.checkId}
          >
            View Details
          </Button>
        </TriggerContent>

        <ContentComponent className={isDesktop ? "max-w-lg" : "h-[80vh]"}>
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="text-xl">{task.domainIcon}</span>
                {task.checkName}
              </SheetTitle>
              <SheetDescription>
                {task.domainName} • {task.frequency}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-4">
              {/* Status & Due Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    {task.nextDue
                      ? new Date(task.nextDue).toLocaleDateString()
                      : "Not set"}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Task Description */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Task Details</h4>
                <p className="text-sm text-muted-foreground">
                  This is a {task.category.toLowerCase()} statutory compliance
                  check for {task.domainName.toLowerCase()}.
                  {task.status === "overdue" && (
                    <span className="text-red-600 font-medium">
                      {" "}
                      This task is overdue and requires immediate attention.
                    </span>
                  )}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleComplete}
                    className="w-full justify-start"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete Task
                  </Button>
                  <Button
                    onClick={() => setSnoozeDialogOpen(true)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Snooze
                  </Button>
                  <Button
                    onClick={() => setMarkNADialogOpen(true)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <span className="mr-2">⊘</span>
                    Mark N/A
                  </Button>
                  <Link
                    href={`/estates-compliance/${task.domain}/${task.checkId}/complete`}
                    onClick={() => setOpen(false)}
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Full Form
                    </Button>
                  </Link>
                </div>
              </div>

              {/* View Domain */}
              <div className="border-t pt-4">
                <Link
                  href={`/estates-compliance/${task.domain}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>View all {task.domainName} checks</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </>
        </ContentComponent>
      </TriggerComponent>

      {/* Snooze Dialog */}
      <Dialog open={snoozeDialogOpen} onOpenChange={setSnoozeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Snooze Task
            </DialogTitle>
            <DialogDescription>
              Reschedule &quot;{task.checkName}&quot; to a later date
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick Snooze Options */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickSnooze(1)}
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickSnooze(7)}
              >
                Next Week
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickSnooze(14)}
              >
                2 Weeks
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickSnooze(30)}
              >
                Next Month
              </Button>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Or select a specific date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {snoozeDate ? format(snoozeDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={snoozeDate}
                    onSelect={setSnoozeDate}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Optional Reason */}
            <div className="space-y-2">
              <Label htmlFor="snooze-reason">Reason (optional)</Label>
              <Textarea
                id="snooze-reason"
                placeholder="Why is this task being rescheduled?"
                value={snoozeReason}
                onChange={(e) => setSnoozeReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSnoozeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSnooze} disabled={isSnoozing || !snoozeDate}>
              {isSnoozing ? "Snoozing..." : "Snooze Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark N/A Dialog */}
      <Dialog open={markNADialogOpen} onOpenChange={setMarkNADialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">⊘</span>
              Mark as Not Applicable
            </DialogTitle>
            <DialogDescription>
              This task will be marked as not applicable and won&apos;t appear
              in upcoming checks
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Reason Category */}
            <div className="space-y-2">
              <Label htmlFor="na-reason">Why is this not applicable?</Label>
              <Select
                value={naReasonCategory}
                onValueChange={(value) =>
                  setNaReasonCategory(value as NaReasonCategory)
                }
              >
                <SelectTrigger id="na-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {NA_REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col items-start">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Details (required for "Other") */}
            <div className="space-y-2">
              <Label htmlFor="na-details">
                Details{" "}
                {naReasonCategory === "other" && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Textarea
                id="na-details"
                placeholder={
                  naReasonCategory === "other"
                    ? "Please explain why this check is not applicable..."
                    : "Add any additional context (optional)"
                }
                value={naReason}
                onChange={(e) => setNaReason(e.target.value)}
                rows={3}
                required={naReasonCategory === "other"}
              />
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>Note:</strong> This will mark the task as not applicable.
              You can change this status later from the task details page.
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setMarkNADialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkNA}
              disabled={
                isMarkingNA ||
                !naReasonCategory ||
                (naReasonCategory === "other" && !naReason.trim())
              }
              variant="destructive"
            >
              {isMarkingNA ? "Marking..." : "Mark as N/A"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
