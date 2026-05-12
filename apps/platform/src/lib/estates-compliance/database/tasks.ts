/**
 * Compliance Tasks Database Layer
 *
 * Functions for interacting with estates_compliance_tasks table.
 */

import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  ComplianceTask,
  TaskPriority,
  TaskStatus,
  RecurrencePattern,
  ComplianceDomain,
} from "@/types/estates-compliance";

/**
 * Filters for task queries
 */
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  domain?: ComplianceDomain;
  assigned_to?: string;
  due_before?: Date;
  due_after?: Date;
  overdue_only?: boolean;
  search?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get compliance tasks for an organization
 */
export async function getComplianceTasks(
  organizationId: string,
  filters?: TaskFilters,
  pagination?: PaginationOptions,
): Promise<PaginatedResponse<ComplianceTask>> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("estates_compliance_tasks")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("due_by", { ascending: true });

  // Apply filters
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.domain) {
    query = query.eq("compliance_domain", filters.domain);
  }
  if (filters?.assigned_to) {
    query = query.eq("assigned_to", filters.assigned_to);
  }
  if (filters?.due_before) {
    query = query.lte("due_by", filters.due_before.toISOString());
  }
  if (filters?.due_after) {
    query = query.gte("due_by", filters.due_after.toISOString());
  }
  if (filters?.overdue_only) {
    query = query
      .lt("due_by", new Date().toISOString())
      .eq("status", "pending");
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
    );
  }

  // Apply pagination
  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching compliance tasks:", error);
    throw new Error("Failed to fetch compliance tasks");
  }

  const totalPages = pagination
    ? Math.ceil((count || 0) / pagination.pageSize)
    : 1;

  return {
    data: (data || []).map(normalizeComplianceTaskRow),
    total: count || 0,
    page: pagination?.page || 1,
    pageSize: pagination?.pageSize || data?.length || 0,
    totalPages,
  };
}

/**
 * Get a single compliance task by ID
 */
export async function getComplianceTaskById(
  taskId: string,
): Promise<ComplianceTask | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("estates_compliance_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error) {
    console.error("Error fetching compliance task:", error);
    return null;
  }

  return normalizeComplianceTaskRow(data);
}

/**
 * Input for creating a task
 */
export interface CreateTaskInput {
  organization_id: string;
  title: string;
  description?: string;
  task_type:
    | "inspection"
    | "maintenance"
    | "testing"
    | "review"
    | "certification"
    | "monitoring";
  compliance_domain: ComplianceDomain;
  priority: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
  assigned_to?: string;
  asset_id?: string;
  contractor_id?: string;
  recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurrence_interval?: number;
  checklist_items?: string[];
}

function toDateOnly(value?: string): string {
  if (value) return value.split("T")[0];
  return new Date().toISOString().split("T")[0];
}

function normalizeFrequency(
  pattern?: RecurrencePattern,
  recurring?: boolean,
): ComplianceTask["frequency"] {
  if (!recurring || !pattern) return "ad_hoc";
  if (pattern === "annually") return "annual";
  return pattern;
}

export function buildTaskInsertRow(input: CreateTaskInput) {
  const dueDate = toDateOnly(input.due_date);
  const interval = input.recurrence_interval || 1;
  const recurrencePattern =
    input.recurring && input.recurrence_pattern
      ? { type: input.recurrence_pattern, interval }
      : null;

  return {
    organization_id: input.organization_id,
    task_type: input.task_type,
    compliance_domain: input.compliance_domain,
    task_name: input.title,
    description: input.description || null,
    priority: input.priority || "medium",
    scheduled_for: dueDate,
    due_by: dueDate,
    frequency: normalizeFrequency(input.recurrence_pattern, input.recurring),
    is_recurring: Boolean(input.recurring),
    recurrence_pattern: recurrencePattern,
    task_source: input.contractor_id ? "external" : "internal",
    assigned_to: input.assigned_to || null,
    assigned_contractor_id: input.contractor_id || null,
    asset_id: input.asset_id || null,
    checklist: input.checklist_items || [],
    status: input.status || "pending",
    ai_insights:
      typeof (input as any).metadata === "object" ? (input as any).metadata : {},
  };
}

export function buildTaskUpdateRow(updates: UpdateTaskInput) {
  const row: Record<string, unknown> = {};

  if (updates.title !== undefined) row.task_name = updates.title;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.task_type !== undefined) row.task_type = updates.task_type;
  if (updates.compliance_domain !== undefined) {
    row.compliance_domain = updates.compliance_domain;
  }
  if (updates.priority !== undefined) row.priority = updates.priority;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.due_date !== undefined) row.due_by = toDateOnly(updates.due_date);
  if (updates.assigned_to !== undefined) row.assigned_to = updates.assigned_to;
  if (updates.asset_id !== undefined) row.asset_id = updates.asset_id;
  if (updates.contractor_id !== undefined) {
    row.assigned_contractor_id = updates.contractor_id;
    row.task_source = updates.contractor_id ? "external" : "internal";
  }
  if (updates.recurring !== undefined) row.is_recurring = updates.recurring;
  if (updates.recurrence_pattern !== undefined) {
    row.frequency = normalizeFrequency(updates.recurrence_pattern, true);
    row.recurrence_pattern = {
      type: updates.recurrence_pattern,
      interval: updates.recurrence_interval || 1,
    };
  }
  if (updates.checklist_items !== undefined) {
    row.checklist = updates.checklist_items;
  }
  if (updates.completion_notes !== undefined) {
    row.completion_notes = updates.completion_notes;
  }
  if (updates.completed_at !== undefined) row.completed_at = updates.completed_at;
  if (updates.completed_by !== undefined) row.completed_by = updates.completed_by;
  if (updates.findings !== undefined) row.findings = updates.findings;
  if (updates.photo_urls !== undefined) row.photo_urls = updates.photo_urls;
  if (updates.metadata !== undefined) {
    row.ai_insights = {
      ...(typeof updates.metadata === "object" ? updates.metadata : {}),
    };
  }

  return row;
}

export function normalizeComplianceTaskRow(row: any): ComplianceTask {
  return {
    ...row,
    title: row.title || row.task_name,
    due_date: row.due_date || row.due_by,
  } as ComplianceTask;
}

/**
 * Create a new compliance task
 */
export async function createComplianceTask(
  input: CreateTaskInput,
): Promise<ComplianceTask> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("estates_compliance_tasks")
    .insert(buildTaskInsertRow(input))
    .select()
    .single();

  if (error) {
    console.error("Error creating compliance task:", error);
    throw new Error("Failed to create compliance task");
  }

  return normalizeComplianceTaskRow(data);
}

/**
 * Input for updating a task
 */
export type UpdateTaskInput = Partial<
  Omit<CreateTaskInput, "organization_id">
> & {
  status?: TaskStatus;
  completion_notes?: string;
  completed_at?: string;
  completed_by?: string;
  findings?: any[];
  photo_urls?: string[];
  metadata?: Record<string, any>;
};

/**
 * Update a compliance task
 */
export async function updateComplianceTask(
  taskId: string,
  updates: UpdateTaskInput,
): Promise<ComplianceTask> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("estates_compliance_tasks")
    .update({
      ...buildTaskUpdateRow(updates),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Error updating compliance task:", error);
    throw new Error("Failed to update compliance task");
  }

  return normalizeComplianceTaskRow(data);
}

/**
 * Delete a compliance task
 */
export async function deleteComplianceTask(taskId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("estates_compliance_tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Error deleting compliance task:", error);
    throw new Error("Failed to delete compliance task");
  }
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks(
  organizationId: string,
  pagination?: PaginationOptions,
): Promise<PaginatedResponse<ComplianceTask>> {
  return getComplianceTasks(organizationId, { overdue_only: true }, pagination);
}

/**
 * Get upcoming tasks (due within next N days)
 */
export async function getUpcomingTasks(
  organizationId: string,
  daysAhead: number = 7,
  pagination?: PaginationOptions,
): Promise<PaginatedResponse<ComplianceTask>> {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  return getComplianceTasks(
    organizationId,
    {
      due_after: now,
      due_before: future,
      status: "pending",
    },
    pagination,
  );
}
