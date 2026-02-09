/**
 * Compliance Tasks Database Layer
 *
 * Functions for interacting with estates_compliance_tasks table.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ComplianceTask,
  TaskPriority,
  TaskStatus,
  RecurrencePattern,
  ComplianceDomain,
} from '@/types/estates-compliance';

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
  pagination?: PaginationOptions
): Promise<PaginatedResponse<ComplianceTask>> {
  const supabase = await createClient();

  let query = supabase
    .from('estates_compliance_tasks')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('due_date', { ascending: true });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.domain) {
    query = query.eq('compliance_domain', filters.domain);
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  if (filters?.due_before) {
    query = query.lte('due_date', filters.due_before.toISOString());
  }
  if (filters?.due_after) {
    query = query.gte('due_date', filters.due_after.toISOString());
  }
  if (filters?.overdue_only) {
    query = query.lt('due_date', new Date().toISOString()).eq('status', 'pending');
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Apply pagination
  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching compliance tasks:', error);
    throw new Error('Failed to fetch compliance tasks');
  }

  const totalPages = pagination ? Math.ceil((count || 0) / pagination.pageSize) : 1;

  return {
    data: data || [],
    total: count || 0,
    page: pagination?.page || 1,
    pageSize: pagination?.pageSize || (data?.length || 0),
    totalPages,
  };
}

/**
 * Get a single compliance task by ID
 */
export async function getComplianceTaskById(taskId: string): Promise<ComplianceTask | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estates_compliance_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('Error fetching compliance task:', error);
    return null;
  }

  return data;
}

/**
 * Input for creating a task
 */
export interface CreateTaskInput {
  organization_id: string;
  title: string;
  description?: string;
  task_type: 'inspection' | 'maintenance' | 'testing' | 'review' | 'certification' | 'monitoring';
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

/**
 * Create a new compliance task
 */
export async function createComplianceTask(input: CreateTaskInput): Promise<ComplianceTask> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estates_compliance_tasks')
    .insert({
      ...input,
      status: input.status || 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating compliance task:', error);
    throw new Error('Failed to create compliance task');
  }

  return data;
}

/**
 * Input for updating a task
 */
export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'organization_id'>> & {
  status?: TaskStatus;
  completion_notes?: string;
  completed_at?: string;
  completed_by?: string;
};

/**
 * Update a compliance task
 */
export async function updateComplianceTask(
  taskId: string,
  updates: UpdateTaskInput
): Promise<ComplianceTask> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estates_compliance_tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating compliance task:', error);
    throw new Error('Failed to update compliance task');
  }

  return data;
}

/**
 * Delete a compliance task
 */
export async function deleteComplianceTask(taskId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('estates_compliance_tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting compliance task:', error);
    throw new Error('Failed to delete compliance task');
  }
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks(
  organizationId: string,
  pagination?: PaginationOptions
): Promise<PaginatedResponse<ComplianceTask>> {
  return getComplianceTasks(
    organizationId,
    { overdue_only: true },
    pagination
  );
}

/**
 * Get upcoming tasks (due within next N days)
 */
export async function getUpcomingTasks(
  organizationId: string,
  daysAhead: number = 7,
  pagination?: PaginationOptions
): Promise<PaginatedResponse<ComplianceTask>> {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  return getComplianceTasks(
    organizationId,
    {
      due_after: now,
      due_before: future,
      status: 'pending',
    },
    pagination
  );
}
