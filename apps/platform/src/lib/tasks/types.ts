// =====================================================
// Unified Task System TypeScript Types
// Phase 1.3: Unified Task System
// =====================================================

// =====================================================
// COMMON TYPES
// =====================================================

export type TaskType =
  | "general"
  | "estates"
  | "compliance"
  | "governance"
  | "siams"
  | "ofsted"
  | "safeguarding"
  | "finance"
  | "hr"
  | "teaching";

export type SiamsStrandId =
  | "vision"
  | "wisdom"
  | "character"
  | "community"
  | "dignity"
  | "worship"
  | "re";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type TaskStatus =
  | "not_started"
  | "draft"
  | "open"
  | "in_progress"
  | "review"
  | "blocked"
  | "awaiting_contractor"
  | "contractor_scheduled"
  | "completed"
  | "overdue"
  | "skipped"
  | "cancelled";

export type TaskApprovalStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected";

export type TaskSource = "actions" | "estates_compliance_tasks";

export type Department =
  | "senior_leadership"
  | "teaching"
  | "admin"
  | "premises"
  | "governors"
  | "finance"
  | "hr"
  | "send"
  | "safeguarding";

export type TeamType =
  | "department"
  | "committee"
  | "working_group"
  | "project_team";

export type CommentType = "comment" | "system" | "approval" | "status_change";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

// =====================================================
// ACTIONS TABLE TYPES (Enhanced)
// =====================================================

/**
 * Base Action interface (matches enhanced actions table)
 */
export interface Action {
  id: string;
  organization_id: string;
  user_id: string;

  // Basic Info
  title: string;
  description: string;
  rationale: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  module: string | null;

  // Classification
  task_type: TaskType;
  team_id: string | null;
  department: Department | null;

  // Priority & Status
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0-100

  // Dates
  due_date: string | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;

  // Assignment
  owner_name: string | null;
  assignee_id: string | null;

  // Dependencies
  dependencies: string[]; // Array of task IDs

  // Evidence & Notes
  linked_evidence: ActionLinkedEvidence[];
  notes: ActionNote[];

  // Approval
  approval_status: TaskApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;

  // Completion
  completed_at: string | null;
  completed_by: string | null;

  // Template & Recurrence
  template_id: string | null;
  parent_task_id: string | null;
  recurrence_rule: RecurrenceRule | null;
  recurrence_id: string | null;

  // Checklist
  checklist: ActionChecklistItem[];

  // SIAMS Framework (in addition to Ofsted)
  siams_strand_id: string | null;
  siams_question_id: string | null;
}

/**
 * Evidence linked to an action
 */
export interface ActionLinkedEvidence {
  documentId: string;
  documentName: string;
  matchedAt: string;
}

/**
 * Note on an action
 */
export interface ActionNote {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
}

/**
 * Checklist item for an action
 */
export interface ActionChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

/**
 * Recurrence rule for recurring tasks
 */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  until?: string; // ISO date string
  count?: number; // Maximum occurrences
}

/**
 * Form for creating/updating an action
 */
export interface ActionForm {
  title: string;
  description: string;
  rationale?: string;
  category_id?: string;
  subcategory_id?: string;
  module?: string;
  task_type?: TaskType;
  team_id?: string;
  department?: Department;
  priority: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  start_date?: string;
  assignee_id?: string;
  dependencies?: string[];
  checklist?: Partial<ActionChecklistItem>[];
  estimated_hours?: number;
  siams_strand_id?: string;
  siams_question_id?: string;
  parent_task_id?: string;
  recurrence_rule?: RecurrenceRule;
}

/**
 * Form response for creating from template
 */
export interface ActionFromTemplateForm {
  template_id: string;
  custom_due_date?: string;
  assignee_id?: string;
  team_id?: string;
}

// =====================================================
// TEAMS TABLE TYPES
// =====================================================

/**
 * teams table
 */
export interface Team {
  id: string;
  organization_id: string;

  // Team Details
  name: string;
  description: string | null;
  color: string;
  icon: string | null;

  // Classification
  department: Department | null;
  type: TeamType;

  // Leadership
  leader_id: string | null;
  deputy_leader_id: string | null;

  // Members
  members: TeamMember[];

  // Permissions
  can_create_tasks: boolean;
  can_assign_tasks: boolean;
  can_approve_tasks: boolean;

  created_at: string;
  updated_at: string;
}

/**
 * Team member with role
 */
export interface TeamMember {
  userId: string;
  role: string;
  joined_at: string;
}

/**
 * Form for creating/updating a team
 */
export interface TeamForm {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  department?: Department;
  type?: TeamType;
  leader_id?: string;
  deputy_leader_id?: string;
  members?: Omit<TeamMember, "joined_at">[];
  can_create_tasks?: boolean;
  can_assign_tasks?: boolean;
  can_approve_tasks?: boolean;
}

/**
 * Team workload data
 */
export interface TeamWorkload {
  user_id: string;
  user_name: string;
  user_email: string | null;
  total_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  total_estimated_hours: number;
  total_actual_hours: number;
  utilization_rate: number; // percentage
}

/**
 * Team summary statistics
 */
export interface TeamSummary {
  team_id: string;
  team_name: string;
  total_members: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

// =====================================================
// TASK TEMPLATES TABLE TYPES
// =====================================================

/**
 * task_templates table
 */
export interface TaskTemplate {
  id: string;
  organization_id: string | null; // null for public templates

  // Template Details
  name: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;

  // Default Values
  default_priority: TaskPriority;
  default_due_days: number;
  estimated_hours: number | null;

  // Template Content
  checklist_template: Partial<ActionChecklistItem>[];
  default_assignee_type: "user" | "team" | "role" | null;
  default_assignee_id: string | null;

  // Approval Workflow
  requires_approval: boolean;
  approval_workflow: ApprovalWorkflowStep[];

  // Organization
  is_public: boolean;
  is_statutory: boolean;

  // Creator
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Approval workflow step
 */
export interface ApprovalWorkflowStep {
  role: string;
  order: number;
  auto_approve_after_days?: number;
}

/**
 * Form for creating/updating a template
 */
export interface TaskTemplateForm {
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  default_priority?: TaskPriority;
  default_due_days?: number;
  estimated_hours?: number;
  checklist_template?: Partial<ActionChecklistItem>[];
  default_assignee_type?: "user" | "team" | "role";
  default_assignee_id?: string;
  requires_approval?: boolean;
  approval_workflow?: ApprovalWorkflowStep[];
  is_public?: boolean;
  is_statutory?: boolean;
}

// =====================================================
// TASK COMMENTS TABLE TYPES
// =====================================================

/**
 * task_comments table
 */
export interface TaskComment {
  id: string;
  organization_id: string;
  task_id: string;
  task_source: TaskSource;

  // Comment Details
  content: string;
  comment_type: CommentType;

  // Attachments
  attachments: CommentAttachment[];

  // Thread support
  parent_comment_id: string | null;

  // User
  user_id: string | null;
  user_name?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Attachment on a comment
 */
export interface CommentAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

/**
 * Form for creating a comment
 */
export interface TaskCommentForm {
  task_id: string;
  task_source?: TaskSource;
  content: string;
  comment_type?: CommentType;
  parent_comment_id?: string;
  attachments?: Omit<CommentAttachment, "size">[];
}

/**
 * Comment with user info populated
 */
export interface TaskCommentWithUser extends TaskComment {
  user_name: string;
  user_email: string | null;
  user_avatar_url: string | null;
}

// =====================================================
// TASK TIME ENTRIES TABLE TYPES
// =====================================================

/**
 * task_time_entries table
 */
export interface TaskTimeEntry {
  id: string;
  organization_id: string;
  task_id: string;
  task_source: TaskSource;

  // Time Entry
  user_id: string | null;
  minutes: number;

  // Details
  description: string | null;
  date: string; // YYYY-MM-DD format

  // Metadata
  created_at: string;
}

/**
 * Form for creating a time entry
 */
export interface TaskTimeEntryForm {
  task_id: string;
  task_source?: TaskSource;
  minutes: number;
  description?: string;
  date: string;
}

/**
 * Time entry with user info
 */
export interface TaskTimeEntryWithUser extends TaskTimeEntry {
  user_name: string;
  user_email: string | null;
}

/**
 * Aggregated time data for a task
 */
export interface TaskTimeSummary {
  task_id: string;
  total_minutes: number;
  total_hours: number;
  entries: number;
  by_user: Array<{
    user_id: string;
    user_name: string;
    minutes: number;
  }>;
}

// =====================================================
// TASK SUBTASKS TABLE TYPES
// =====================================================

/**
 * task_subtasks table
 */
export interface TaskSubtask {
  id: string;
  organization_id: string;
  parent_task_id: string;

  // Subtask Details
  title: string;
  description: string | null;
  status: TaskStatus;
  completed_at: string | null;
  completed_by: string | null;

  // Order
  sort_order: number;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Form for creating a subtask
 */
export interface TaskSubtaskForm {
  title: string;
  description?: string;
  sort_order?: number;
}

// =====================================================
// UNIFIED VIEW TYPES
// =====================================================

/**
 * Unified task view (combines actions and estates_compliance_tasks)
 */
export interface UnifiedTask {
  id: string;
  organization_id: string;
  source_table: TaskSource;

  // Common fields
  task_type: TaskType;
  title: string;
  description: string;
  category: string | null;
  subcategory: string | null;
  module: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  due_date: string | null;
  start_date: string | null;
  owner: string | null;
  assignee_id: string | null;
  team_id: string | null;
  department: Department | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  parent_task_id: string | null;
  dependencies: string[];
  checklist: ActionChecklistItem[];
  linked_evidence: ActionLinkedEvidence[];
  notes: ActionNote[] | null;
  approval_status: TaskApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  template_id: string | null;
  recurrence_rule: RecurrenceRule | null;
  recurrence_id: string | null;
  siams_strand_id: string | null;
  siams_question_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Unified task with assignee info populated
 */
export interface UnifiedTaskWithAssignee extends UnifiedTask {
  assignee_name: string | null;
  assignee_email: string | null;
  assignee_avatar: string | null;
  team_name: string | null;
}

// =====================================================
// ORGANIZATION TASK SUMMARY TYPES
// =====================================================

/**
 * Organization task summary statistics
 */
export interface OrgTaskSummary {
  total_tasks: number;
  by_status: Record<TaskStatus, number>;
  by_priority: Record<TaskPriority, number>;
  by_type: Record<TaskType, number>;
  overdue_count: number;
  due_this_week: number;
  completion_rate: number;
}

/**
 * Extended task statistics for dashboard
 */
export interface TaskStatistics extends OrgTaskSummary {
  my_tasks: number;
  my_overdue: number;
  my_completed_this_week: number;
  team_workload: TeamWorkload[];
  recent_activity: TaskComment[];
  upcoming_deadlines: Array<{
    task_id: string;
    title: string;
    due_date: string;
    days_until: number;
    assignee: string | null;
  }>;
}

// =====================================================
// KANBAN BOARD TYPES
// =====================================================

/**
 * Kanban column configuration
 */
export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  limit?: number;
  task_count: number;
}

/**
 * Kanban board data
 */
export interface KanbanBoard {
  columns: KanbanColumn[];
  tasks: Record<TaskStatus, UnifiedTask[]>;
  filters: TaskFilterOptions;
  sort_by: TaskSortOption;
}

/**
 * Task filter options
 */
export interface TaskFilterOptions {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  task_type?: TaskType[];
  assignee_id?: string[];
  team_id?: string[];
  department?: Department[];
  due_before?: string;
  due_after?: string;
  search?: string;
  has_gaps?: boolean;
  is_overdue?: boolean;
}

/**
 * Task sort options
 */
export type TaskSortOption =
  | "due_date_asc"
  | "due_date_desc"
  | "priority_desc"
  | "priority_asc"
  | "created_desc"
  | "created_asc"
  | "title_asc"
  | "title_desc";

// =====================================================
// GANTT CHART TYPES
// =====================================================

/**
 * Task for Gantt chart display
 */
export interface GanttTask {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  progress: number;
  status: TaskStatus;
  assignee: string | null;
  dependencies: string[];
  color: string;
  strand?: string;
}

/**
 * Gantt chart data
 */
export interface GanttChart {
  tasks: GanttTask[];
  date_range: {
    start: string;
    end: string;
  };
  view: "day" | "week" | "month";
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Request to get tasks (unified)
 */
export interface GetTasksRequest {
  organization_id: string;
  source?: TaskSource[];
  status?: TaskStatus[];
  task_type?: TaskType[];
  assignee_id?: string;
  team_id?: string;
  department?: Department[];
  search?: string;
  sort?: TaskSortOption;
  limit?: number;
  offset?: number;
}

/**
 * Response with tasks
 */
export interface GetTasksResponse {
  tasks: UnifiedTaskWithAssignee[];
  total: number;
  summary: OrgTaskSummary;
}

/**
 * Request to create/update a task
 */
export interface UpsertTaskRequest {
  organization_id: string;
  user_id?: string;
  task: ActionForm;
  task_id?: string;
}

/**
 * Response after upserting a task
 */
export interface UpsertTaskResponse {
  task: UnifiedTask;
  created: boolean;
  message?: string;
}

/**
 * Request to bulk update tasks
 */
export interface BulkUpdateTasksRequest {
  organization_id: string;
  task_ids: string[];
  updates: Partial<ActionForm>;
}

/**
 * Response from bulk update
 */
export interface BulkUpdateTasksResponse {
  updated: number;
  failed: number;
  errors: string[];
}

/**
 * Request to get team workload
 */
export interface GetTeamWorkloadRequest {
  organization_id: string;
  team_id?: string;
  department?: Department;
}

/**
 * Response with team workload
 */
export interface GetTeamWorkloadResponse {
  workload: TeamWorkload[];
  summary: {
    total_users: number;
    total_tasks: number;
    total_hours_allocated: number;
    total_hours_spent: number;
  };
}

/**
 * Request to create a task from template
 */
export interface CreateTaskFromTemplateRequest {
  template_id: string;
  organization_id: string;
  user_id: string;
  custom_due_date?: string;
  assignee_id?: string;
  team_id?: string;
}

/**
 * Response from creating task from template
 */
export interface CreateTaskFromTemplateResponse {
  task_id: string;
  task: UnifiedTask;
  message?: string;
}

/**
 * Request to get task templates
 */
export interface GetTaskTemplatesRequest {
  organization_id?: string;
  category?: string;
  is_public?: boolean;
  is_statutory?: boolean;
  search?: string;
}

/**
 * Response with task templates
 */
export interface GetTaskTemplatesResponse {
  templates: TaskTemplate[];
  total: number;
}

// =====================================================
// NOTIFICATION TYPES (Task-related)
// =====================================================

/**
 * Task notification types
 */
export type TaskNotificationType =
  | "task_assigned"
  | "task_updated"
  | "task_completed"
  | "task_approved"
  | "task_rejected"
  | "task_due_soon"
  | "task_overdue"
  | "task_comment_added"
  | "checklist_completed";

/**
 * Task notification payload
 */
export interface TaskNotification {
  id: string;
  organization_id: string;
  user_id: string;
  type: TaskNotificationType;
  title: string;
  message: string;
  link: string;
  data: {
    task_id: string;
    task_title: string;
    from_user_id?: string;
    from_user_name?: string;
  };
  read: boolean;
  created_at: string;
}

// =====================================================
// HELPER FUNCTIONS & CONSTANTS
// =====================================================

/**
 * Task status colors for UI
 */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: "bg-gray-100 text-gray-700",
  draft: "bg-gray-100 text-gray-500",
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  review: "bg-amber-100 text-amber-700",
  blocked: "bg-rose-100 text-rose-700",
  awaiting_contractor: "bg-purple-100 text-purple-700",
  contractor_scheduled: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  skipped: "bg-gray-50 text-gray-400",
  cancelled: "bg-gray-50 text-gray-400 line-through",
} as const;

/**
 * Task priority colors for UI
 */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: "bg-rose-100 text-rose-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
} as const;

/**
 * Default checklist templates for common tasks
 */
export const DEFAULT_CHECKLIST_TEMPLATES: Record<
  string,
  Partial<ActionChecklistItem>[]
> = {
  policy_review: [
    { id: "1", title: "Review current policy", completed: false },
    { id: "2", title: "Identify required updates", completed: false },
    { id: "3", title: "Draft revised policy", completed: false },
    {
      id: "4",
      title: "Share with stakeholders for feedback",
      completed: false,
    },
    { id: "5", title: "Present to governing body", completed: false },
    { id: "6", title: "Update and publish", completed: false },
  ],
  document_creation: [
    { id: "1", title: "Create draft document", completed: false },
    { id: "2", title: "Review and refine", completed: false },
    { id: "3", title: "Get approval", completed: false },
    { id: "4", title: "Publish and distribute", completed: false },
  ],
  meeting_preparation: [
    { id: "1", title: "Set agenda", completed: false },
    { id: "2", title: "Book venue", completed: false },
    { id: "3", title: "Send invitations", completed: false },
    { id: "4", title: "Prepare documents", completed: false },
  ],
};

// =====================================================
// SIMPLE FILTER & STATS TYPES (Legacy compatibility)
// =====================================================

export interface TaskFilter {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  module?: string | "all";
  assignee_id?: string;
  search?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  due_today: number;
  due_this_week: number;
}
