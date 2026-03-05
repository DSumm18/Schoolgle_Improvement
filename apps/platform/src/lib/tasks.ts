/**
 * Unified Task Types
 *
 * Shared types for task-related components and APIs.
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export interface UnifiedTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  progress?: number; // 0-100
  module?: string; // e.g., 'estates', 'hr', 'governance', etc.
  assignee_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TaskFilter {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  module?: string | 'all';
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
