import type {
  Meeting,
  MeetingChecklistItem,
  MeetingTemplate,
  MinutesContent,
  MinutesSection,
} from "./types";

export function generateMinutesContent(
  meeting: Meeting,
  template: MeetingTemplate,
  checklistItems: MeetingChecklistItem[],
): MinutesContent {
  const grouped = new Map<string, MeetingChecklistItem[]>();
  for (const item of checklistItems) {
    const category = item.category || "General";
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category)!.push(item);
  }

  const sections: MinutesSection[] = Array.from(grouped.entries()).map(
    ([title, items]) => ({
      title,
      items: items
        .sort((a, b) => a.order_index - b.order_index)
        .map((item) => {
          const covered = item.status === "green" || item.manually_ticked;
          return {
            phrase: item.phrase,
            covered,
            notes: covered
              ? "Covered or confirmed during the meeting."
              : item.is_critical
                ? "Critical item not yet evidenced in the captured notes or transcript."
                : "Not yet evidenced in the captured notes or transcript.",
          };
        }),
    }),
  );

  const total = checklistItems.length;
  const covered = checklistItems.filter(
    (item) => item.status === "green" || item.manually_ticked,
  ).length;
  const score = total > 0 ? Math.round((covered / total) * 100) : 0;

  const notes = Array.isArray(meeting.notes)
    ? meeting.notes.map((note) => note.text)
    : [];
  const hasDetailedCapture = notes.length > 0;

  return {
    title: `${template.name} — Meeting Minutes`,
    date: meeting.scheduled_at,
    location: meeting.location,
    leader: "",
    attendee: meeting.attendee_name,
    attendee_role: meeting.attendee_role,
    purpose: meeting.purpose,
    opening: [
      `This meeting was held using the ${template.name} template.`,
      hasDetailedCapture
        ? "The draft minutes below combine the captured meeting notes with the required checklist coverage."
        : "No transcript or detailed meeting notes were captured, so these draft minutes record the meeting setup and checklist coverage only.",
    ],
    sections,
    notes,
    closing: [
      hasDetailedCapture
        ? "The meeting closed with the recorded points and checklist coverage noted above."
        : "These draft minutes should be reviewed and expanded before finalising or sharing.",
    ],
    compliance_summary: { total, covered, score },
  };
}

export function renderMinutesHtml(
  content: MinutesContent,
  branding?: {
    logo_url?: string | null;
    school_name?: string;
    primary_color?: string | null;
    footer_text?: string | null;
  },
): string {
  const headingColor = branding?.primary_color || "#1e293b";
  const appName = branding?.school_name || "Meeting Companion";
  const date = new Date(content.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const time = new Date(content.date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const sectionHtml = content.sections
    .map(
      (section) => `
    <h3 style="margin-top:1.5em;color:${headingColor};border-bottom:1px solid #e2e8f0;padding-bottom:4px;">${escapeHtml(section.title)}</h3>
    <ul style="list-style:none;padding:0;">
      ${section.items
        .map(
          (item) => `
        <li style="padding:6px 0;border-bottom:1px solid #f1f5f9;">
          <span style="display:inline-block;width:20px;text-align:center;margin-right:8px;">${item.covered ? "\u2705" : "\u274c"}</span>
          <span style="${!item.covered ? "color:#dc2626;" : ""}">${escapeHtml(item.phrase)}</span>
          ${item.notes ? `<p style="margin:4px 0 0 32px;color:#64748b;font-size:0.95em;">${escapeHtml(item.notes)}</p>` : ""}
        </li>`,
        )
        .join("")}
    </ul>`,
    )
    .join("");

  const notesHtml =
    content.notes.length > 0
      ? `
    <h3 style="margin-top:1.5em;color:${headingColor};border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Meeting Notes</h3>
    <ul>${content.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
      : "";

  const logoHtml = branding?.logo_url
    ? `<div style="margin-bottom:1em;"><img src="${escapeHtml(branding.logo_url)}" alt="" style="max-height:60px;display:block;" /></div>`
    : "";

  const footerText =
    branding?.footer_text ||
    "These minutes were generated using Meeting Companion. They should be reviewed and approved by the meeting leader before distribution.";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(content.title)}</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:2em;color:#334155;line-height:1.6;">
  ${logoHtml}
  <h1 style="color:${headingColor};margin-bottom:0;">${escapeHtml(content.title)}</h1>
  <p style="color:#64748b;margin-top:4px;">Generated by ${escapeHtml(appName)}</p>

  <table style="width:100%;border-collapse:collapse;margin:1.5em 0;">
    <tr><td style="padding:4px 12px;font-weight:600;color:#475569;">Date</td><td style="padding:4px 12px;">${date} at ${time}</td></tr>
    ${content.location ? `<tr><td style="padding:4px 12px;font-weight:600;color:#475569;">Location</td><td style="padding:4px 12px;">${escapeHtml(content.location)}</td></tr>` : ""}
    ${content.leader ? `<tr><td style="padding:4px 12px;font-weight:600;color:#475569;">Meeting Leader</td><td style="padding:4px 12px;">${escapeHtml(content.leader)}</td></tr>` : ""}
    <tr><td style="padding:4px 12px;font-weight:600;color:#475569;">Attendee</td><td style="padding:4px 12px;">${escapeHtml(content.attendee)}${content.attendee_role ? ` (${escapeHtml(content.attendee_role)})` : ""}</td></tr>
    ${content.purpose ? `<tr><td style="padding:4px 12px;font-weight:600;color:#475569;">Purpose</td><td style="padding:4px 12px;">${escapeHtml(content.purpose)}</td></tr>` : ""}
  </table>

  <h3 style="margin-top:1.5em;color:${headingColor};border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Opening Statement</h3>
  ${content.opening.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}

  <h2 style="margin-top:2em;color:${headingColor};">Compliance Checklist</h2>
  <p style="color:#64748b;">Coverage: <strong>${content.compliance_summary.covered}/${content.compliance_summary.total}</strong> items (${content.compliance_summary.score}%)</p>
  ${sectionHtml}

  ${notesHtml}

  <h3 style="margin-top:1.5em;color:${headingColor};border-bottom:1px solid #e2e8f0;padding-bottom:4px;">Closing Statement</h3>
  ${content.closing.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}

  <h2 style="margin-top:2em;color:${headingColor};">Signatures</h2>
  <div style="display:flex;gap:2em;margin-top:1em;">
    <div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:1.5em;">
      <p style="font-weight:600;color:#475569;margin-top:0;">Meeting Leader</p>
      <p style="margin-top:2em;border-bottom:1px solid #334155;padding-bottom:4px;">Signed: ___________________________</p>
      <p style="margin-top:1em;border-bottom:1px solid #334155;padding-bottom:4px;">Date: ___________________________</p>
    </div>
    <div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:1.5em;">
      <p style="font-weight:600;color:#475569;margin-top:0;">Attendee</p>
      <p style="margin-top:2em;border-bottom:1px solid #334155;padding-bottom:4px;">Signed: ___________________________</p>
      <p style="margin-top:1em;border-bottom:1px solid #334155;padding-bottom:4px;">Date: ___________________________</p>
    </div>
  </div>

  <hr style="margin-top:2em;border:none;border-top:1px solid #e2e8f0;">
  <p style="color:#94a3b8;font-size:0.85em;">${escapeHtml(footerText)}</p>
</body>
</html>`.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
