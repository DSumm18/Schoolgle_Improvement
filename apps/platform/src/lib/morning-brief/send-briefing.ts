/**
 * Morning Brief Email Delivery
 *
 * Sends the morning briefing as a clean HTML email to the head's
 * registered email address via Resend.
 */

import { sendEmail } from "@/lib/email-service";
import type { BriefSections, RAGStatus } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://schoolgle.co.uk";

// ─── RAG colour mapping ────────────────────────────────────────────

const ragColors: Record<RAGStatus, { bg: string; text: string; label: string }> = {
  green: { bg: "#f0fdf4", text: "#16a34a", label: "All clear" },
  amber: { bg: "#fffbeb", text: "#d97706", label: "Watch" },
  red: { bg: "#fef2f2", text: "#dc2626", label: "Urgent" },
};

const sectionLabels: Record<string, string> = {
  safeguarding: "Safeguarding",
  estates: "Estates & Compliance",
  staffing: "Staffing & HR",
  governance: "Governance",
  finance: "Finance",
  teaching: "Teaching & Learning",
  ofsted: "Ofsted Readiness",
};

const sectionIcons: Record<string, string> = {
  safeguarding: "&#128721;",
  estates: "&#127970;",
  staffing: "&#128101;",
  governance: "&#128220;",
  finance: "&#128176;",
  teaching: "&#127891;",
  ofsted: "&#128269;",
};

// ─── HTML template ─────────────────────────────────────────────────

function buildSectionCard(key: string, section: { rag: RAGStatus; count: number; summary: string }): string {
  if (section.summary.includes("not yet connected") || section.summary.includes("No data available")) {
    return "";
  }

  const rag = ragColors[section.rag];
  const label = sectionLabels[key] ?? key;
  const icon = sectionIcons[key] ?? "";

  return `
    <div style="background:white;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid ${rag.text};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:18px;">${icon}</span>
        <span style="font-weight:600;color:#0f172a;font-size:15px;">${label}</span>
        <span style="background:${rag.bg};color:${rag.text};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;margin-left:auto;">${rag.label}</span>
      </div>
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.5;">${section.summary}</p>
    </div>`;
}

export function buildBriefingEmailHtml(params: {
  schoolName: string;
  date: string;
  script: string;
  sections: BriefSections;
  briefId: string;
}): string {
  const { schoolName, date, script, sections, briefId } = params;

  const sectionCards = Object.entries(sections)
    .map(([key, section]) => buildSectionCard(key, section))
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#06B6D4,#3B82F6);padding:24px 32px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:32px;">&#129417;</span>
        <div>
          <h1 style="margin:0;color:white;font-size:20px;font-family:'Poppins',sans-serif;">Ed's Morning Briefing</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${schoolName} &mdash; ${date}</p>
        </div>
      </div>
    </div>

    <div style="padding:24px 32px;">
      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;white-space:pre-line;">${script}</p>
      </div>

      <h3 style="color:#0f172a;font-size:14px;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.05em;">Section Details</h3>
      ${sectionCards}

      <div style="text-align:center;margin-top:24px;">
        <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#3B82F6;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Full Dashboard</a>
      </div>
    </div>

    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
        Sent by Schoolgle &mdash; AI-powered school improvement
        &nbsp;&middot;&nbsp;
        <a href="${BASE_URL}/dashboard/settings/notifications" style="color:#94a3b8;">Manage preferences</a>
      </p>
    </div>
  </div>
</div>
</body></html>`;
}

// ─── Send function ─────────────────────────────────────────────────

export async function sendBriefingEmail(params: {
  to: string | string[];
  schoolName: string;
  date: string;
  script: string;
  sections: BriefSections;
  briefId: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const html = buildBriefingEmailHtml(params);

  return sendEmail({
    to: params.to,
    subject: `\uD83E\uDD89 Ed's Morning Briefing \u2014 ${params.date}`,
    html,
    text: params.script,
    tags: [
      { name: "type", value: "morning_briefing" },
      { name: "brief_id", value: params.briefId },
    ],
  });
}
