/**
 * Email Service using Resend
 *
 * Sends transactional emails for compliance reminders,
 * helpdesk ticket updates, and daily summaries.
 */

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
  }
  return _resend;
}

const FROM_EMAIL =
  process.env.EMAIL_FROM || "Schoolgle <notifications@schoolgle.co.uk>";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; id?: string; error?: string }> {
  // In development without API key, just log
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email Service] No RESEND_API_KEY set, logging email:", {
      to: options.to,
      subject: options.subject,
    });
    return { success: true, id: "dev-" + Date.now() };
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      tags: options.tags,
    });

    if (error) {
      console.error("[Email Service] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[Email Service] Exception:", err);
    return { success: false, error: err.message };
  }
}

// --- Email Templates --------------------------------------------------------

export function complianceReminderHtml(params: {
  recipientName: string;
  taskTitle: string;
  dueDate: string;
  daysUntilDue: number;
  priority: string;
  domain: string;
  actionUrl: string;
  reminderType: "upcoming" | "due_today" | "overdue" | "escalation";
}): string {
  const {
    recipientName,
    taskTitle,
    dueDate,
    daysUntilDue,
    priority,
    domain,
    actionUrl,
    reminderType,
  } = params;

  const urgencyColor =
    reminderType === "escalation"
      ? "#dc2626"
      : reminderType === "overdue"
        ? "#ea580c"
        : reminderType === "due_today"
          ? "#d97706"
          : "#2563eb";
  const urgencyLabel =
    reminderType === "escalation"
      ? "ESCALATION"
      : reminderType === "overdue"
        ? "OVERDUE"
        : reminderType === "due_today"
          ? "DUE TODAY"
          : `Due in ${daysUntilDue} days`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#00D4D4,#0ea5e9);padding:24px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;">Schoolgle Compliance</h1>
    </div>
    <div style="padding:32px;">
      <div style="display:inline-block;background:${urgencyColor};color:white;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:16px;">${urgencyLabel}</div>
      <p style="color:#334155;font-size:15px;line-height:1.6;">Hi ${recipientName},</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">${taskTitle}</p>
        <p style="margin:0 0 4px;color:#64748b;font-size:14px;">Domain: ${domain}</p>
        <p style="margin:0 0 4px;color:#64748b;font-size:14px;">Priority: ${priority}</p>
        <p style="margin:0;color:#64748b;font-size:14px;">Due: ${dueDate}</p>
      </div>
      <a href="${actionUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">View Task</a>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Sent by Schoolgle - AI-powered school improvement</p>
    </div>
  </div>
</div>
</body></html>`;
}

export function helpdeskTicketHtml(params: {
  recipientName: string;
  ticketTitle: string;
  ticketId: string;
  priority: string;
  category: string;
  description: string;
  actionUrl: string;
  eventType: "created" | "assigned" | "updated" | "resolved";
}): string {
  const {
    recipientName,
    ticketTitle,
    ticketId,
    priority,
    category,
    description,
    actionUrl,
    eventType,
  } = params;

  const eventLabel =
    eventType === "created"
      ? "New Ticket"
      : eventType === "assigned"
        ? "Assigned to You"
        : eventType === "updated"
          ? "Ticket Updated"
          : "Ticket Resolved";
  const eventColor =
    eventType === "created"
      ? "#2563eb"
      : eventType === "assigned"
        ? "#d97706"
        : eventType === "resolved"
          ? "#16a34a"
          : "#6366f1";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#00D4D4,#0ea5e9);padding:24px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;">Schoolgle Helpdesk</h1>
    </div>
    <div style="padding:32px;">
      <div style="display:inline-block;background:${eventColor};color:white;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:16px;">${eventLabel}</div>
      <p style="color:#334155;font-size:15px;line-height:1.6;">Hi ${recipientName},</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">${ticketTitle}</p>
        <p style="margin:0 0 4px;color:#64748b;font-size:14px;">Ticket: #${ticketId.slice(0, 8)}</p>
        <p style="margin:0 0 4px;color:#64748b;font-size:14px;">Category: ${category}</p>
        <p style="margin:0 0 4px;color:#64748b;font-size:14px;">Priority: ${priority}</p>
        ${description ? `<p style="margin:8px 0 0;color:#475569;font-size:14px;">${description.slice(0, 200)}${description.length > 200 ? "..." : ""}</p>` : ""}
      </div>
      <a href="${actionUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">View Ticket</a>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Sent by Schoolgle - AI-powered school improvement</p>
    </div>
  </div>
</div>
</body></html>`;
}

export function dailySummaryHtml(params: {
  recipientName: string;
  date: string;
  dueToday: number;
  dueThisWeek: number;
  overdue: number;
  criticalTasks: Array<{ title: string; dueDate: string; priority: string }>;
  dashboardUrl: string;
}): string {
  const {
    recipientName,
    date,
    dueToday,
    dueThisWeek,
    overdue,
    criticalTasks,
    dashboardUrl,
  } = params;

  const taskRows = criticalTasks
    .map(
      (t) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:14px;">${t.title}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">${t.dueDate}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;"><span style="background:${t.priority === "critical" ? "#fef2f2" : "#fefce8"};color:${t.priority === "critical" ? "#dc2626" : "#ca8a04"};padding:2px 8px;border-radius:4px;font-size:12px;">${t.priority}</span></td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#00D4D4,#0ea5e9);padding:24px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;">Daily Compliance Summary</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${date}</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#334155;font-size:15px;line-height:1.6;">Hi ${recipientName},</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:20px 0;">
        <div style="background:#f0f9ff;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;color:#0ea5e9;">${dueToday}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Due Today</p>
        </div>
        <div style="background:#fffbeb;border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;color:#d97706;">${dueThisWeek}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">This Week</p>
        </div>
        <div style="background:${overdue > 0 ? "#fef2f2" : "#f0fdf4"};border-radius:8px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;color:${overdue > 0 ? "#dc2626" : "#16a34a"};">${overdue}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Overdue</p>
        </div>
      </div>
      ${
        criticalTasks.length > 0
          ? `
      <h3 style="color:#0f172a;font-size:14px;margin:24px 0 12px;">Priority Tasks</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:12px;">Task</th>
          <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:12px;">Due</th>
          <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:12px;">Priority</th>
        </tr></thead>
        <tbody>${taskRows}</tbody>
      </table>`
          : ""
      }
      <a href="${dashboardUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:20px;">View Dashboard</a>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Sent by Schoolgle - AI-powered school improvement</p>
    </div>
  </div>
</div>
</body></html>`;
}
