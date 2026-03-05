/**
 * TaskService - Business logic for compliance task management
 */

import {
  getComplianceTasks,
  getComplianceTaskById,
  createComplianceTask,
  updateComplianceTask,
  deleteComplianceTask,
  getOverdueTasks,
  getUpcomingTasks,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskFilters,
  type PaginatedResponse,
} from '../database/tasks';
import type { ComplianceTask, TaskStatus, RecurrencePattern } from '@/types/estates-compliance';

/**
 * Service class for managing compliance tasks
 */
export class TaskService {
  /**
   * List tasks with optional filters and pagination
   */
  static async list(
    organizationId: string,
    filters?: TaskFilters,
    pagination?: { page: number; pageSize: number }
  ): Promise<PaginatedResponse<ComplianceTask>> {
    return getComplianceTasks(organizationId, filters, pagination);
  }

  /**
   * Get a single task by ID
   */
  static async getById(taskId: string): Promise<ComplianceTask | null> {
    return getComplianceTaskById(taskId);
  }

  /**
   * Create a new task
   */
  static async create(organizationId: string, input: Omit<CreateTaskInput, 'organization_id'>): Promise<ComplianceTask> {
    return createComplianceTask({
      ...input,
      organization_id: organizationId,
    });
  }

  /**
   * Update an existing task
   */
  static async update(taskId: string, updates: UpdateTaskInput): Promise<ComplianceTask> {
    return updateComplianceTask(taskId, updates);
  }

  /**
   * Delete a task
   */
  static async delete(taskId: string): Promise<void> {
    return deleteComplianceTask(taskId);
  }

  /**
   * Mark a task as complete
   */
  static async complete(
    taskId: string,
    userId: string,
    completionNotes?: string
  ): Promise<ComplianceTask> {
    const task = await this.getById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const updatedTask = await updateComplianceTask(taskId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: userId,
      completion_notes: completionNotes,
    });

    // If this is a recurring task, create the next occurrence
    if (task.recurring && task.recurrence_pattern) {
      await this.createNextOccurrence(task);
    }

    return updatedTask;
  }

  /**
   * Create the next occurrence of a recurring task
   */
  private static async createNextOccurrence(previousTask: ComplianceTask): Promise<ComplianceTask | null> {
    const nextDueDate = this.calculateNextDueDate(
      previousTask.due_date,
      previousTask.recurrence_pattern!,
      previousTask.recurrence_interval || 1
    );

    if (!nextDueDate) {
      return null;
    }

    return createComplianceTask({
      organization_id: previousTask.organization_id,
      title: previousTask.title,
      description: previousTask.description,
      task_type: previousTask.task_type,
      compliance_domain: previousTask.compliance_domain,
      priority: previousTask.priority,
      due_date: nextDueDate,
      assigned_to: previousTask.assigned_to,
      asset_id: previousTask.asset_id,
      contractor_id: previousTask.contractor_id,
      recurring: previousTask.recurring,
      recurrence_pattern: previousTask.recurrence_pattern,
      recurrence_interval: previousTask.recurrence_interval,
      checklist_items: previousTask.checklist_items,
    });
  }

  /**
   * Calculate the next due date based on recurrence pattern
   */
  private static calculateNextDueDate(
    currentDueDate: string | null,
    pattern: RecurrencePattern,
    interval: number
  ): string | null {
    if (!currentDueDate) return null;

    const date = new Date(currentDueDate);
    const nextDate = new Date(date);

    switch (pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * interval));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (3 * interval));
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
      default:
        return null;
    }

    return nextDate.toISOString();
  }

  /**
   * Get overdue tasks
   */
  static async getOverdue(
    organizationId: string,
    pagination?: { page: number; pageSize: number }
  ): Promise<PaginatedResponse<ComplianceTask>> {
    return getOverdueTasks(organizationId, pagination);
  }

  /**
   * Get upcoming tasks
   */
  static async getUpcoming(
    organizationId: string,
    daysAhead: number = 7,
    pagination?: { page: number; pageSize: number }
  ): Promise<PaginatedResponse<ComplianceTask>> {
    return getUpcomingTasks(organizationId, daysAhead, pagination);
  }

  /**
   * Get task statistics for dashboard
   */
  static async getStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    upcoming: number;
  }> {
    const [allTasks, overdue, upcoming] = await Promise.all([
      this.list(organizationId, undefined, { page: 1, pageSize: 1000 }),
      this.getOverdue(organizationId, { page: 1, pageSize: 1000 }),
      this.getUpcoming(organizationId, 7, { page: 1, pageSize: 1000 }),
    ]);

    const pending = allTasks.data.filter(t => t.status === 'pending').length;
    const inProgress = allTasks.data.filter(t => t.status === 'in_progress').length;
    const completed = allTasks.data.filter(t => t.status === 'completed').length;

    return {
      total: allTasks.total,
      pending,
      inProgress,
      completed,
      overdue: overdue.total,
      upcoming: upcoming.total,
    };
  }

  /**
   * Bulk create tasks from template
   */
  static async bulkCreate(
    organizationId: string,
    tasks: Array<Omit<CreateTaskInput, 'organization_id'>>
  ): Promise<ComplianceTask[]> {
    const createdTasks: ComplianceTask[] = [];

    for (const task of tasks) {
      const created = await this.create(organizationId, task);
      createdTasks.push(created);
    }

    return createdTasks;
  }

  /**
   * Assign task to a user
   */
  static async assign(taskId: string, userId: string): Promise<ComplianceTask> {
    return this.update(taskId, { assigned_to: userId });
  }

  /**
   * Update task status
   */
  static async updateStatus(taskId: string, status: TaskStatus): Promise<ComplianceTask> {
    return this.update(taskId, { status });
  }
}
