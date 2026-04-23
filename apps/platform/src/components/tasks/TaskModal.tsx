"use client";

import { useState, useEffect } from "react";
import { Plus, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  UnifiedTask,
  ActionForm,
  TaskStatus,
  TaskType,
  TaskPriority,
  SiamsStrandId,
} from "@/lib/tasks";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  organizationId: string;
  initialData?: UnifiedTask | null;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "general", label: "General" },
  { value: "compliance", label: "Compliance" },
  { value: "safeguarding", label: "Safeguarding" },
  { value: "estates", label: "Estates" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "HR" },
  { value: "teaching", label: "Teaching & Learning" },
  { value: "siams", label: "SIAMS" },
];

const DEPARTMENT_OPTIONS = [
  "Leadership",
  "Teaching & Learning",
  "Pastoral",
  "Safeguarding",
  "Finance",
  "HR",
  "Estates",
  "Governance",
  "Admin",
];

const SIAMS_STRANDS: { value: SiamsStrandId; label: string }[] = [
  { value: "vision", label: "Vision" },
  { value: "wisdom", label: "Wisdom" },
  { value: "character", label: "Character Development" },
  { value: "community", label: "Community" },
  { value: "dignity", label: "Dignity & Respect" },
  { value: "worship", label: "Worship" },
  { value: "re", label: "Religious Education" },
];

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  organizationId,
  initialData,
}: TaskModalProps) {
  const [formData, setFormData] = useState<ActionForm>({
    title: "",
    description: "",
    task_type: "general",
    priority: "medium",
    status: "not_started",
    due_date: "",
    start_date: "",
    assignee_id: "",
    team_id: "",
    estimated_hours: undefined,
    checklist: [],
  } as ActionForm);

  const [checklistItems, setChecklistItems] = useState<string[]>([""]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || "",
          description: initialData.description || "",
          task_type: initialData.task_type || "general",
          priority: initialData.priority || "medium",
          status: initialData.status || "not_started",
          due_date: initialData.due_date || "",
          start_date: initialData.start_date || "",
          assignee_id: initialData.assignee_id || "",
          team_id: initialData.team_id || "",
          department: initialData.department || undefined,
          estimated_hours: initialData.estimated_hours || undefined,
          checklist: initialData.checklist || [],
        });
        setChecklistItems(
          (initialData.checklist || []).map((c: any) => c.title || c),
        );
      } else {
        setFormData({
          title: "",
          description: "",
          task_type: "general",
          priority: "medium",
          status: "not_started",
          due_date: "",
          start_date: "",
          assignee_id: "",
          team_id: "",
          estimated_hours: undefined,
          checklist: [],
        } as ActionForm);
        setChecklistItems([""]);
      }
      setError(null);

      // Fetch users and teams
      fetchUsersAndTeams();
    }
  }, [initialData, isOpen]);

  const fetchUsersAndTeams = async () => {
    try {
      const [usersRes, teamsRes] = await Promise.all([
        authFetch(`/api/governance/governors?organizationId=${organizationId}`, { organizationId }),
        authFetch(`/api/teams?organizationId=${organizationId}`, { organizationId }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setSelectedUsers(data.governors || []);
      }

      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setSelectedTeams(data.teams || []);
      }
    } catch (error) {
      console.error("Failed to fetch users and teams:", error);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    // Build checklist with IDs
    const checklist = checklistItems
      .filter((item) => item.trim())
      .map((item, idx) => ({
        id:
          isEditing && formData.checklist?.[idx]?.id
            ? formData.checklist[idx].id
            : `check-${Date.now()}-${idx}`,
        title: item,
        completed: false,
      }));

    try {
      const response = await authFetch("/api/tasks", {
        method: "POST",
        organizationId,
        body: JSON.stringify({
          organizationId,
          userId: null, // Would come from auth context
          task: {
            ...formData,
            checklist,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save task");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, ""]);
  };

  const updateChecklistItem = (index: number, value: string) => {
    const newItems = [...checklistItems];
    newItems[index] = value;
    setChecklistItems(newItems);
  };

  const removeChecklistItem = (index: number) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update task details and assignments."
              : "Create a new task and assign it to team members."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="e.g., Complete safeguarding audit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_type">Task Type</Label>
              <Select
                value={formData.task_type}
                onValueChange={(value: TaskType) =>
                  setFormData({ ...formData, task_type: value })
                }
              >
                <SelectTrigger id="task_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add details about this task..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {formData.start_date
                      ? format(new Date(formData.start_date), "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.start_date
                        ? new Date(formData.start_date)
                        : undefined
                    }
                    onSelect={(date) =>
                      date &&
                      setFormData({
                        ...formData,
                        start_date: format(date, "yyyy-MM-dd"),
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {formData.due_date
                      ? format(new Date(formData.due_date), "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.due_date
                        ? new Date(formData.due_date)
                        : undefined
                    }
                    onSelect={(date) =>
                      date &&
                      setFormData({
                        ...formData,
                        due_date: format(date, "yyyy-MM-dd"),
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select
                value={formData.assignee_id || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, assignee_id: value })
                }
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {selectedUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={formData.team_id || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, team_id: value })
                }
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="No team" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value as any })
                }
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                value={formData.estimated_hours || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_hours: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                min="0"
                step="0.5"
                placeholder="e.g., 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siams_strand">SIAMS Strand</Label>
              <Select
                value={formData.siams_strand_id || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, siams_strand_id: value })
                }
              >
                <SelectTrigger id="siams_strand">
                  <SelectValue placeholder="Not linked" />
                </SelectTrigger>
                <SelectContent>
                  {SIAMS_STRANDS.map((strand) => (
                    <SelectItem key={strand.value} value={strand.value}>
                      {strand.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Checklist</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChecklistItem}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateChecklistItem(idx, e.target.value)}
                    placeholder={`Item ${idx + 1}`}
                  />
                  {checklistItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklistItem(idx)}
                    >
                      <X className="w-4 h-4 text-rose-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
