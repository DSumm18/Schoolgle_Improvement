/**
 * Reminder Service for Estates Compliance Tasks
 *
 * Handles automated reminders for compliance tasks including:
 * - Daily check for upcoming tasks
 * - Email notifications based on reminder settings
 * - Escalation for overdue tasks
 * - Summary notifications (daily/weekly)
 */

import { getComplianceTasks, type ComplianceTask } from "../database/tasks";
import type { TaskFilters } from "@/types/estates-compliance";
import {
  sendEmail,
  complianceReminderHtml,
  dailySummaryHtml,
} from "@/lib/email-service";

// ============================================================================
// Types
// ============================================================================

export interface ReminderConfig {
  taskId: string;
  taskTitle: string;
  dueDate: string;
  assignedTo?: string;
  reminderDays: number[];
  reminderTime: string;
  complianceDomain: string;
  priority: string;
}

export interface ReminderNotification {
  taskId: string;
  taskTitle: string;
  recipientEmail: string;
  recipientName: string;
  dueDate: string;
  daysUntilDue: number;
  reminderType: "upcoming" | "due_today" | "overdue" | "escalation";
  subject: string;
  body: string;
  complianceDomain: string;
  priority: string;
  actionUrl: string;
}

export interface DailySummaryData {
  organizationId: string;
  date: string;
  totalDueToday: number;
  totalDueThisWeek: number;
  totalOverdue: number;
  tasksByDomain: Record<string, number>;
  criticalTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
  }>;
}

// ============================================================================
// Reminder Calculation
// ============================================================================

/**
 * Get tasks that need reminders sent today
 */
export async function getTasksNeedingReminders(
  organizationId: string,
): Promise<ReminderConfig[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all pending and in-progress tasks
  const filters: TaskFilters = {
    status: ["pending", "in_progress"],
  };

  const { data: tasks } = await getComplianceTasks(organizationId, filters, {
    page: 1,
    pageSize: 1000,
  });

  const reminders: ReminderConfig[] = [];

  for (const task of tasks) {
    if (!task.due_date || !task.reminders_enabled) continue;

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);

    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Check if today is a reminder day
    const reminderDays = task.reminder_days || [7, 3, 1];
    if (reminderDays.includes(daysUntilDue)) {
      reminders.push({
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.due_date,
        assignedTo: task.assigned_to || undefined,
        reminderDays,
        reminderTime: task.reminder_time || "09:00",
        complianceDomain: task.compliance_domain || "general",
        priority: task.priority,
      });
    }
  }

  return reminders;
}

/**
 * Get overdue tasks for escalation
 */
export async function getOverdueTasksForEscalation(
  organizationId: string,
): Promise<ReminderConfig[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filters: TaskFilters = {
    status: ["pending", "in_progress"],
  };

  const { data: tasks } = await getComplianceTasks(organizationId, filters, {
    page: 1,
    pageSize: 1000,
  });

  const escalations: ReminderConfig[] = [];

  for (const task of tasks) {
    if (!task.due_date) continue;

    const dueDate = new Date(task.due_date);
    const daysOverdue = Math.ceil(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Escalate tasks that are 1, 3, 7, 14 days overdue
    if (daysOverdue > 0 && [1, 3, 7, 14].includes(daysOverdue)) {
      escalations.push({
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.due_date,
        assignedTo: task.assigned_to || undefined,
        reminderDays: [-daysOverdue], // Negative for overdue
        reminderTime: task.reminder_time || "09:00",
        complianceDomain: task.compliance_domain || "general",
        priority: task.priority,
      });
    }
  }

  return escalations;
}

/**
 * Get daily summary data for notifications
 */
export async function getDailySummaryData(
  organizationId: string,
): Promise<DailySummaryData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Get all tasks
  const { data: allTasks } = await getComplianceTasks(
    organizationId,
    undefined,
    { page: 1, pageSize: 1000 },
  );

  // Tasks due today
  const tasksDueToday = allTasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date).toDateString() === today.toDateString(),
  );

  // Tasks due this week
  const tasksDueThisWeek = allTasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) >= today &&
      new Date(t.due_date) <= weekEnd,
  );

  // Overdue tasks
  const overdueTasks = allTasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < today &&
      !["completed", "cancelled"].includes(t.status),
  );

  // Group by domain
  const tasksByDomain: Record<string, number> = {};
  allTasks.forEach((task) => {
    if (task.compliance_domain) {
      tasksByDomain[task.compliance_domain] =
        (tasksByDomain[task.compliance_domain] || 0) + 1;
    }
  });

  // Critical/high priority tasks
  const criticalTasks = allTasks
    .filter(
      (t) =>
        (t.priority === "critical" || t.priority === "high") &&
        !["completed", "cancelled"].includes(t.status),
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.due_date || "",
      priority: t.priority,
    }));

  return {
    organizationId,
    date: today.toISOString(),
    totalDueToday: tasksDueToday.length,
    totalDueThisWeek: tasksDueThisWeek.length,
    totalOverdue: overdueTasks.length,
    tasksByDomain,
    criticalTasks: criticalTasks.slice(0, 10), // Top 10
  };
}

// ============================================================================
// Email Generation
// ============================================================================

/**
 * Generate reminder notification email
 */
export function generateReminderEmail(
  config: ReminderConfig,
  recipientEmail: string,
  recipientName: string,
  baseUrl: string,
): ReminderNotification {
  const dueDate = new Date(config.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  let reminderType: "upcoming" | "due_today" | "overdue" | "escalation" =
    "upcoming";
  if (daysUntilDue === 0) reminderType = "due_today";
  if (daysUntilDue < 0)
    reminderType = daysUntilDue <= -7 ? "escalation" : "overdue";

  const subject = getReminderSubject(
    reminderType,
    config.taskTitle,
    daysUntilDue,
  );
  const body = getReminderBody(reminderType, config, daysUntilDue, baseUrl);

  return {
    taskId: config.taskId,
    taskTitle: config.taskTitle,
    recipientEmail,
    recipientName,
    dueDate: config.dueDate,
    daysUntilDue,
    reminderType,
    subject,
    body,
    complianceDomain: config.complianceDomain,
    priority: config.priority,
    actionUrl: `${baseUrl}/estates-compliance/tasks/${config.taskId}`,
  };
}

/**
 * Get email subject based on reminder type
 */
function getReminderSubject(
  type: "upcoming" | "due_today" | "overdue" | "escalation",
  taskTitle: string,
  daysUntilDue: number,
): string {
  const domain = "Schoolgle Estates Compliance";

  switch (type) {
    case "upcoming":
      if (daysUntilDue === 1) {
        return `[${domain}] Reminder: ${taskTitle} due tomorrow`;
      }
      return `[${domain}] Reminder: ${taskTitle} due in ${daysUntilDue} days`;
    case "due_today":
      return `[${domain}] URGENT: ${taskTitle} due today`;
    case "overdue":
      return `[${domain}] OVERDUE: ${taskTitle} is ${Math.abs(daysUntilDue)} days overdue`;
    case "escalation":
      return `[${domain}] ESCALATION: ${taskTitle} significantly overdue`;
    default:
      return `[${domain}] Compliance Task Reminder`;
  }
}

/**
 * Get email body based on reminder type
 */
function getReminderBody(
  type: "upcoming" | "due_today" | "overdue" | "escalation",
  config: ReminderConfig,
  daysUntilDue: number,
  baseUrl: string,
): string {
  const taskUrl = `${baseUrl}/estates-compliance/tasks/${config.taskId}`;
  const dueDateFormatted = new Date(config.dueDate).toLocaleDateString(
    "en-GB",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  let body = `Dear User,\n\n`;
  body += `This is a reminder about a compliance task that requires your attention:\n\n`;
  body += `**Task:** ${config.taskTitle}\n`;
  body += `**Compliance Domain:** ${config.complianceDomain}\n`;
  body += `**Priority:** ${config.priority}\n`;
  body += `**Due Date:** ${dueDateFormatted}\n\n`;

  switch (type) {
    case "upcoming":
      if (daysUntilDue === 1) {
        body += `This task is due **tomorrow**. Please ensure it is completed on time.\n\n`;
      } else {
        body += `This task is due in **${daysUntilDue} days**. Please plan accordingly.\n\n`;
      }
      break;
    case "due_today":
      body += `This task is **due today**. Please complete it as soon as possible.\n\n`;
      break;
    case "overdue":
      body += `This task is **${Math.abs(daysUntilDue)} days overdue**. Please address this immediately.\n\n`;
      break;
    case "escalation":
      body += `This task is **significantly overdue** and has been escalated to management.\n\n`;
      body += `Immediate action is required to maintain compliance.\n\n`;
      break;
  }

  body += `**Action Required:**\n`;
  body += `Please complete the task or update its status by clicking the link below:\n\n`;
  body += `${taskUrl}\n\n`;

  body += `---\n\n`;
  body += `This is an automated reminder from Schoolgle Estates Compliance.`;
  body += `\nIf you have questions, please contact your estates manager.`;

  return body;
}

/**
 * Generate daily summary email
 */
export function generateDailySummaryEmail(
  data: DailySummaryData,
  recipientEmail: string,
  recipientName: string,
  baseUrl: string,
): { subject: string; body: string } {
  const today = new Date(data.date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let subject = `[Schoolgle] Daily Compliance Summary - ${today}`;
  let body = `Dear ${recipientName},\n\n`;
  body += `Here is your daily compliance summary for **${today}**:\n\n`;

  body += `**Overview:**\n`;
  body += `- Tasks due today: ${data.totalDueToday}\n`;
  body += `- Tasks due this week: ${data.totalDueThisWeek}\n`;
  body += `- Overdue tasks: ${data.totalOverdue}\n\n`;

  if (Object.keys(data.tasksByDomain).length > 0) {
    body += `**Tasks by Domain:**\n`;
    Object.entries(data.tasksByDomain).forEach(([domain, count]) => {
      body += `- ${domain}: ${count}\n`;
    });
    body += `\n`;
  }

  if (data.criticalTasks.length > 0) {
    body += `**High Priority Tasks:**\n`;
    data.criticalTasks.forEach((task) => {
      const dueDate = new Date(task.dueDate).toLocaleDateString("en-GB");
      body += `- ${task.title} (Due: ${dueDate}) [${task.priority}]\n`;
    });
    body += `\n`;
  }

  body += `**View All Tasks:**\n`;
  body += `${baseUrl}/estates-compliance/tasks\n\n`;

  body += `---\n\n`;
  body += `This is an automated daily summary from Schoolgle Estates Compliance.`;

  return { subject, body };
}

// ============================================================================
// Email Sending (via Resend)
// ============================================================================

/**
 * Send reminder email via Resend
 */
export async function sendReminderEmail(
  notification: ReminderNotification,
  organizationId: string,
): Promise<{ success: boolean; error?: string }> {
  const html = complianceReminderHtml({
    recipientName: notification.recipientName,
    taskTitle: notification.taskTitle,
    dueDate: new Date(notification.dueDate).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    daysUntilDue: notification.daysUntilDue,
    priority: notification.priority,
    domain: notification.complianceDomain,
    actionUrl: notification.actionUrl,
    reminderType: notification.reminderType,
  });

  return sendEmail({
    to: notification.recipientEmail,
    subject: notification.subject,
    html,
    text: notification.body,
    tags: [
      { name: "type", value: "compliance-reminder" },
      { name: "org", value: organizationId },
    ],
  });
}

/**
 * Send daily summary email via Resend
 */
export async function sendDailySummary(
  data: DailySummaryData,
  recipientEmail: string,
  recipientName: string,
  baseUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const { subject, body } = generateDailySummaryEmail(
    data,
    recipientEmail,
    recipientName,
    baseUrl,
  );

  const dateFormatted = new Date(data.date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = dailySummaryHtml({
    recipientName,
    date: dateFormatted,
    dueToday: data.totalDueToday,
    dueThisWeek: data.totalDueThisWeek,
    overdue: data.totalOverdue,
    criticalTasks: data.criticalTasks.map((t) => ({
      title: t.title,
      dueDate: new Date(t.dueDate).toLocaleDateString("en-GB"),
      priority: t.priority,
    })),
    dashboardUrl: `${baseUrl}/estates-compliance/tasks`,
  });

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text: body,
    tags: [
      { name: "type", value: "daily-summary" },
      { name: "org", value: data.organizationId },
    ],
  });
}

// ============================================================================
// Scheduled Task Processing
// ============================================================================

/**
 * Process all reminders for a given day
 * Called by scheduled job (cron/API endpoint)
 */
export async function processDailyReminders(
  organizationId: string,
  baseUrl: string,
): Promise<{
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ taskId: string; error: string }>;
}> {
  // Get tasks needing reminders
  const reminderConfigs = await getTasksNeedingReminders(organizationId);

  // Get overdue tasks for escalation
  const escalationConfigs = await getOverdueTasksForEscalation(organizationId);

  const allConfigs = [...reminderConfigs, ...escalationConfigs];
  let sent = 0;
  let failed = 0;
  const errors: Array<{ taskId: string; error: string }> = [];

  for (const config of allConfigs) {
    try {
      // In a real implementation, you would:
      // 1. Look up the assigned user's email from the database
      // 2. Generate the reminder email
      // 3. Send the email

      // For now, we'll log the reminder
      const mockEmail = "user@school.example.uk";
      const mockName = "Site Manager";

      const notification = generateReminderEmail(
        config,
        mockEmail,
        mockName,
        baseUrl,
      );

      const result = await sendReminderEmail(notification, organizationId);

      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push({
          taskId: config.taskId,
          error: result.error || "Unknown error",
        });
      }
    } catch (error: any) {
      failed++;
      errors.push({
        taskId: config.taskId,
        error: error.message || "Unknown error",
      });
    }
  }

  return {
    processed: allConfigs.length,
    sent,
    failed,
    errors,
  };
}

/**
 * Get organizations that need daily processing
 * In a real implementation, this would query your database
 */
export async function getOrganizationsForDailyProcessing(): Promise<string[]> {
  // TODO: Query database for organizations with:
  // - Active compliance tasks
  // - Reminders enabled
  // - Users assigned to tasks

  // Placeholder return
  return [];
}
