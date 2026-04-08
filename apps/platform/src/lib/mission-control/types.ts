// Mission Control Phase 1 — Type Definitions

export type MCAdminRole = 'super_admin' | 'admin' | 'viewer';

export interface MCAdminUser {
  id: string;
  email: string;
  role: MCAdminRole;
  display_name: string | null;
  added_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SkillExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type SkillExecutionType = 'manual' | 'scheduled' | 'triggered' | 'api';

export interface MCSkillExecution {
  id: string;
  skill_id: string;
  skill_name: string;
  department: string | null;
  execution_type: SkillExecutionType;
  status: SkillExecutionStatus;
  input_params: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  triggered_by: string;
  created_at: string;
}

export type ApprovalItemType = 'social_post' | 'content_publish' | 'skill_output' | 'email_draft' | 'document' | 'other';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type ApprovalPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface MCApprovalItem {
  id: string;
  item_type: ApprovalItemType;
  title: string;
  description: string | null;
  preview_data: Record<string, unknown>;
  source_skill: string | null;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  decided_by: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AuditEventCategory = 'system' | 'skill' | 'approval' | 'admin' | 'security' | 'error';

export interface MCAuditLogEntry {
  id: string;
  event_type: string;
  event_category: AuditEventCategory;
  actor: string;
  description: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export type ScheduledTaskStatus = 'success' | 'failed' | 'skipped';

export interface MCScheduledTask {
  id: string;
  name: string;
  description: string | null;
  skill_id: string | null;
  cron_expression: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: ScheduledTaskStatus | null;
  run_count: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Dashboard aggregated types
export interface MCDashboardStatus {
  jarvis: {
    lastPollTime: string | null;
    activeAgents: number;
    tasksInQueue: number;
  };
  pendingApprovals: number;
  skillsRunToday: number;
  buildHealth: {
    lastBuildStatus: 'success' | 'failed' | 'unknown';
    testCount: number;
    vectorScore: number | null;
  };
}

export interface MCActivityFeedItem {
  id: string;
  timestamp: string;
  type: 'skill_execution' | 'approval' | 'system' | 'security' | 'error';
  icon: string;
  description: string;
  status: string;
  metadata?: Record<string, unknown>;
}
