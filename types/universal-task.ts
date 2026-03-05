// =====================================================
// UNIVERSAL TASK SYSTEM TYPES
// "Never Miss a Deadline" - Schoolgle Universal Task Management
// =====================================================

export type Module = 'estates' | 'teaching' | 'finance' | 'hr' | 'compliance';
export type Priority = 'urgent' | 'high' | 'normal' | 'low';
export type Status = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type Visibility = 'personal' | 'team' | 'school' | 'trust';

// Base universal task interface
export interface UniversalTask {
  id: string;
  request_title: string;
  description?: string;
  module: Module;
  task_type: string;
  priority: Priority;
  status: Status;
  visibility: Visibility;
  assigned_to_user_id?: string;
  assigned_to_team?: string;
  due_date?: Date;
  estimated_duration_minutes?: number;
  context_data: Record<string, any>;
  created_at: Date;
  updated_at?: Date;
  completed_at?: Date;
  completion_notes?: string;
  
  // Legacy fields from maintenance_requests
  school_id?: string;
  requested_by_user_id?: string;
  location_details?: string;
  category?: string;
  risk_likelihood?: number;
  risk_impact?: number;
  attachment_paths?: string[];
}

// Task type definition for each module
export interface TaskType {
  module: Module;
  task_type: string;
  display_name: string;
  icon: string;
  description: string;
  default_priority: Priority;
  default_visibility: Visibility;
  default_estimated_duration?: number;
  context_fields: Record<string, any>;
}

// Module-specific context data
export interface EstatesTaskContext {
  location_required?: boolean;
  contractor_required?: boolean;
  risk_assessment?: boolean;
  safety_critical?: boolean;
  supplies_required?: boolean;
}

export interface TeachingTaskContext {
  subject_required?: boolean;
  class_required?: boolean;
  curriculum_links?: boolean;
  assessment_type?: boolean;
  parent_name?: boolean;
  meeting_type?: boolean;
  agenda_required?: boolean;
  training_type?: boolean;
  provider?: boolean;
  certification?: boolean;
  resource_type?: boolean;
}

export interface FinanceTaskContext {
  budget_period?: boolean;
  department?: boolean;
  amount?: boolean;
  supplier?: boolean;
  invoice_number?: boolean;
  items?: boolean;
  budget_code?: boolean;
  report_type?: boolean;
  period?: boolean;
  recipients?: boolean;
  claimant?: boolean;
  receipts?: boolean;
  contract?: boolean;
}

export interface HRTaskContext {
  position?: boolean;
  candidates?: boolean;
  employee?: boolean;
  appraisal_type?: boolean;
  reviewer?: boolean;
  training_type?: boolean;
  policy_type?: boolean;
  stakeholders?: boolean;
  issue_type?: boolean;
  hr_involved?: boolean;
  new_employee?: boolean;
  induction_type?: boolean;
  mentor?: boolean;
}

export interface ComplianceTaskContext {
  location_required?: boolean;
  check_type?: boolean;
  contractor_required?: boolean;
  risk_assessment?: boolean;
  data_type?: boolean;
  review_type?: boolean;
  audit_type?: boolean;
  auditor?: boolean;
  scope?: boolean;
  department?: boolean;
  regulation?: boolean;
  deadline?: boolean;
}

// Universal task creation request
export interface CreateTaskRequest {
  title: string;
  description?: string;
  module: Module;
  task_type: string;
  priority?: Priority;
  visibility?: Visibility;
  assigned_to_user_id?: string;
  assigned_to_team?: string;
  due_date?: Date;
  estimated_duration_minutes?: number;
  context_data?: Record<string, any>;
  school_id?: string;
  requested_by_user_id?: string;
}

// Task update request
export interface UpdateTaskRequest {
  id: string;
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  visibility?: Visibility;
  assigned_to_user_id?: string;
  assigned_to_team?: string;
  due_date?: Date;
  estimated_duration_minutes?: number;
  context_data?: Record<string, any>;
  completion_notes?: string;
}

// Task filter options
export interface TaskFilters {
  module?: Module;
  task_type?: string;
  priority?: Priority;
  status?: Status;
  visibility?: Visibility;
  assigned_to_user_id?: string;
  school_id?: string;
  due_date_from?: Date;
  due_date_to?: Date;
  overdue?: boolean;
}

// Task statistics
export interface TaskStats {
  total: number;
  overdue: number;
  due_today: number;
  completed_this_week: number;
  by_module: Record<Module, number>;
  by_priority: Record<Priority, number>;
  by_status: Record<Status, number>;
}

// Ed AI task functions
export interface EdTaskFunction {
  name: string;
  description: string;
  parameters: {
    module: Module;
    title: string;
    description?: string;
    priority?: Priority;
    assigned_to?: string;
    due_date?: string;
    context_data?: Record<string, any>;
  };
}

// Calendar export formats
export interface CalendarExport {
  format: 'ics' | 'google' | 'outlook' | 'apple';
  url?: string;
  content?: string;
  filename?: string;
}

// Task with calendar export
export interface TaskWithCalendar extends UniversalTask {
  calendar_exports: CalendarExport[];
}

// Team task view
export interface TeamTaskView {
  team_members: string[];
  tasks: UniversalTask[];
  stats: TaskStats;
  filters: TaskFilters;
}

// Module configuration
export interface ModuleConfig {
  module: Module;
  display_name: string;
  icon: string;
  color: string;
  task_types: TaskType[];
  default_visibility: Visibility;
  features: string[];
}

// Universal task system configuration
export interface TaskSystemConfig {
  modules: ModuleConfig[];
  default_priority: Priority;
  default_visibility: Visibility;
  calendar_integration: boolean;
  ed_ai_enabled: boolean;
  team_collaboration: boolean;
}

// Task templates for common workflows
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  module: Module;
  task_type: string;
  priority: Priority;
  visibility: Visibility;
  estimated_duration_minutes: number;
  context_template: Record<string, any>;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_by: string;
  is_public: boolean;
}

// Task delegation
export interface TaskDelegation {
  task_id: string;
  delegated_to: string;
  delegated_by: string;
  delegated_at: Date;
  delegation_notes?: string;
  original_assignee: string;
}

// Task escalation
export interface TaskEscalation {
  task_id: string;
  escalated_at: Date;
  escalated_by: string;
  escalation_reason: string;
  escalated_to: string;
  original_priority: Priority;
  new_priority: Priority;
}

// Task dependencies
export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'blocks' | 'precedes' | 'related';
  created_at: Date;
}

// Task comments/notes
export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: Date;
  updated_at?: Date;
  is_internal: boolean;
}

// Task attachments
export interface TaskAttachment {
  id: string;
  task_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: Date;
}

// Task notification preferences
export interface TaskNotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  task_assigned: boolean;
  task_due_soon: boolean;
  task_overdue: boolean;
  task_completed: boolean;
  team_task_updates: boolean;
}

// Task analytics
export interface TaskAnalytics {
  user_id?: string;
  school_id?: string;
  period_start: Date;
  period_end: Date;
  total_tasks_created: number;
  total_tasks_completed: number;
  average_completion_time_hours: number;
  overdue_tasks: number;
  completion_rate: number;
  most_common_task_types: Array<{
    module: Module;
    task_type: string;
    count: number;
  }>;
  productivity_trends: Array<{
    date: Date;
    tasks_completed: number;
    tasks_created: number;
  }>;
}
