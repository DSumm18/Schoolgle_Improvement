import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * POST /api/documents/newsletter
 * Generate a school newsletter from sections
 *
 * Body: {
 *   organizationId?: string,
 *   title: string,
 *   week_ending?: string (YYYY-MM-DD),
 *   sections: Array<{
 *     type: 'headteacher_message' | 'safeguarding' | 'dates' | 'celebrations'
 *       | 'curriculum' | 'attendance' | 'notices' | 'pta' | 'custom',
 *     title?: string,
 *     content: string (HTML),
 *     icon?: string,
 *   }>,
 *   auto_include?: {
 *     attendance?: boolean,     // Pull this week's attendance stats
 *     upcoming_dates?: boolean, // Pull calendar dates for next 2 weeks
 *     celebrations?: boolean,   // Pull recent house points / star of the week
 *   },
 *   send_to?: 'draft' | 'email' | 'both',
 *   recipient_list_id?: string, // optional mailing list ID
 * }
 */
export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    organizationId,
    title,
    week_ending,
    sections,
    auto_include,
    send_to,
  } = body;

  if (!title || !sections || sections.length === 0) {
    return apiError(
      "Missing required fields: title, sections (at least one)",
      400,
      "MISSING_FIELDS",
    );
  }

  const orgId = organizationId || auth.organizationId;

  // Fetch org branding for newsletter header
  const { data: org } = await supabase
    .from("organizations")
    .select("name, settings")
    .eq("id", orgId)
    .single();

  const settings = org?.settings || {};
  const schoolName = org?.name || "School";
  const primaryColor = settings.primary_color || "#0ea5e9";
  const logoUrl = settings.logo_url || "";

  // Auto-include data sections if requested
  const autoSections: typeof sections = [];

  if (auto_include?.attendance) {
    const attendanceHtml = await buildAttendanceSection(supabase, orgId);
    if (attendanceHtml) {
      autoSections.push({
        type: "attendance",
        title: "Attendance This Week",
        content: attendanceHtml,
        icon: "📊",
      });
    }
  }

  if (auto_include?.upcoming_dates) {
    const datesHtml = await buildUpcomingDatesSection(supabase, orgId);
    if (datesHtml) {
      autoSections.push({
        type: "dates",
        title: "Dates for Your Diary",
        content: datesHtml,
        icon: "📅",
      });
    }
  }

  // Auto-include safeguarding reminder if no safeguarding section provided (Ofsted evidence)
  const hasSafeguarding = sections.some((s: any) => s.type === "safeguarding");
  if (!hasSafeguarding) {
    // Fetch DSL name from org settings or staff directory
    let dslName = settings.designated_safeguarding_lead || "";
    if (!dslName) {
      const { data: dslStaff } = await supabase
        .from("staff_directory")
        .select("display_name, first_name, last_name")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .or(
          "job_title.ilike.%safeguard%,job_title.ilike.%DSL%,role_category.eq.headteacher",
        )
        .limit(1)
        .single();
      if (dslStaff) {
        dslName =
          dslStaff.display_name ||
          `${dslStaff.first_name || ""} ${dslStaff.last_name || ""}`.trim();
      }
    }

    autoSections.push({
      type: "safeguarding",
      title: "Safeguarding Reminder",
      content: `<p>The safety and wellbeing of every child is our highest priority. If you have any concerns about a child's welfare, please speak to our Designated Safeguarding Lead${dslName ? `, <strong>${escapeHtml(dslName)}</strong>,` : ""} or any member of staff in confidence.</p>
<p style="color:#64748b;font-size:13px;">In an emergency, contact the police on 999. You can also contact the NSPCC Helpline on <strong>0808 800 5000</strong> or Childline on <strong>0800 1111</strong>.</p>`,
      icon: "🛡️",
    });
  }

  // Merge manual sections + auto sections
  const allSections = [...sections, ...autoSections];

  // Build the newsletter HTML
  const weekEndingDate = week_ending
    ? new Date(week_ending).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const sectionIcons: Record<string, string> = {
    headteacher_message: "✉️",
    safeguarding: "🛡️",
    dates: "📅",
    celebrations: "🌟",
    curriculum: "📚",
    attendance: "📊",
    notices: "📢",
    pta: "🤝",
    custom: "📌",
  };

  const sectionsHtml = allSections
    .map((section: any) => {
      const icon = section.icon || sectionIcons[section.type] || "📌";
      const sectionTitle = section.title || formatSectionType(section.type);
      return `
      <div style="margin-bottom:28px;">
        <h2 style="margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid ${primaryColor}20;font-size:18px;color:#0f172a;">
          ${icon} ${escapeHtml(sectionTitle)}
        </h2>
        <div style="color:#334155;font-size:15px;line-height:1.7;">
          ${section.content}
        </div>
      </div>`;
    })
    .join("");

  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(schoolName)}" style="max-height:70px;max-width:220px;" />`
    : "";

  const newsletterHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:680px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,${escapeHtml(primaryColor)},${escapeHtml(primaryColor)}dd);padding:32px;text-align:center;">
      ${logoBlock}
      <h1 style="margin:12px 0 4px 0;font-size:24px;color:white;font-weight:700;">${escapeHtml(title)}</h1>
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">
        ${escapeHtml(schoolName)} &middot; Week ending ${escapeHtml(weekEndingDate)}
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      ${sectionsHtml}
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0 0 4px 0;color:#64748b;font-size:13px;font-weight:600;">${escapeHtml(schoolName)}</p>
      ${settings.address ? `<p style="margin:0 0 4px 0;color:#94a3b8;font-size:12px;">${escapeHtml(settings.address)}</p>` : ""}
      ${settings.phone || settings.email ? `<p style="margin:0;color:#94a3b8;font-size:12px;">${[settings.phone, settings.email].filter(Boolean).map(escapeHtml).join(" | ")}</p>` : ""}
      ${settings.website ? `<p style="margin:4px 0 0 0;color:#94a3b8;font-size:12px;">${escapeHtml(settings.website)}</p>` : ""}
    </div>
  </div>
  <p style="text-align:center;color:#cbd5e1;font-size:11px;margin-top:16px;">
    Generated by Schoolgle &middot; <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://schoolgle.co.uk"}" style="color:#cbd5e1;">schoolgle.co.uk</a>
  </p>
</div>
</body></html>`;

  // Save as a generated document
  const { data: doc, error: docErr } = await supabase
    .from("generated_documents")
    .insert({
      organization_id: orgId,
      module: "general",
      document_type: "newsletter",
      created_by: auth.userId,
      recipient_type: "parent",
      recipient_name: "All Parents/Carers",
      subject: title,
      body_html: newsletterHtml,
      placeholder_values: {
        week_ending: weekEndingDate,
        section_count: allSections.length,
        sections: allSections.map((s: any) => ({
          type: s.type,
          title: s.title || formatSectionType(s.type),
        })),
      },
      status: send_to === "email" || send_to === "both" ? "finalised" : "draft",
    })
    .select()
    .single();

  if (docErr) {
    console.error("Error creating newsletter:", docErr);
    return apiError(docErr.message, 500);
  }

  return apiSuccess(
    {
      id: doc.id,
      subject: doc.subject,
      status: doc.status,
      section_count: allSections.length,
      week_ending: weekEndingDate,
      view_url: `/dashboard/documents/${doc.id}`,
    },
    201,
  );
});

/**
 * GET /api/documents/newsletter
 * Get recent newsletters for the org
 */
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);

  const orgId = searchParams.get("organizationId") || auth.organizationId;
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const { data: newsletters, error } = await supabase
    .from("generated_documents")
    .select("id, subject, status, created_at, sent_at, placeholder_values")
    .eq("organization_id", orgId)
    .eq("document_type", "newsletter")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(newsletters || []);
});

// ─── Helpers ─────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSectionType(type: string): string {
  const labels: Record<string, string> = {
    headteacher_message: "Message from the Head",
    safeguarding: "Safeguarding Update",
    dates: "Dates for Your Diary",
    celebrations: "Celebrations & Achievements",
    curriculum: "Curriculum News",
    attendance: "Attendance",
    notices: "Notices",
    pta: "PTA / Friends Update",
    custom: "Update",
  };
  return (
    labels[type] ||
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

async function buildAttendanceSection(
  supabase: any,
  orgId: string,
): Promise<string | null> {
  // Try to pull this week's attendance summary from sickness_absence_records
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: absences } = await supabase
    .from("sickness_absence_records")
    .select("id")
    .eq("organization_id", orgId)
    .gte("start_date", oneWeekAgo.toISOString().split("T")[0]);

  if (!absences) return null;

  const absenceCount = absences.length;

  // Get total staff for percentage
  const { count: staffCount } = await supabase
    .from("staff_directory")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const total = staffCount || 1;
  const attendanceRate = (((total - absenceCount) / total) * 100).toFixed(1);

  const rate = parseFloat(attendanceRate);
  let attendanceMessage: string;
  if (rate >= 96) {
    attendanceMessage =
      "Excellent — we're above our target of 96%. Thank you for your support!";
  } else if (rate >= 95) {
    attendanceMessage =
      "We're close to our 96% target. Every day in school counts!";
  } else {
    // DfE threshold: below 95% triggers specific messaging
    attendanceMessage =
      "We are below the national expectation of 95%. Good attendance is essential for learning — please ensure your child attends every day unless they are genuinely unwell.";
  }

  return `<p>Staff attendance this week: <strong>${attendanceRate}%</strong> (${absenceCount} absence${absenceCount !== 1 ? "s" : ""} from ${total} staff).</p>
<p style="color:#64748b;font-size:13px;">${attendanceMessage}</p>`;
}

async function buildUpcomingDatesSection(
  supabase: any,
  orgId: string,
): Promise<string | null> {
  // Pull meetings/events for the next 14 days
  const today = new Date().toISOString().split("T")[0];
  const twoWeeks = new Date();
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  const twoWeeksStr = twoWeeks.toISOString().split("T")[0];

  const { data: meetings } = await supabase
    .from("meetings")
    .select("title, scheduled_at, location")
    .eq("organization_id", orgId)
    .gte("scheduled_at", today)
    .lte("scheduled_at", twoWeeksStr)
    .order("scheduled_at", { ascending: true })
    .limit(10);

  if (!meetings || meetings.length === 0) return null;

  const items = meetings
    .map((m: any) => {
      const date = new Date(m.scheduled_at).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const time = new Date(m.scheduled_at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `<li><strong>${date}</strong> at ${time} — ${escapeHtml(m.title || "Event")}${m.location ? ` (${escapeHtml(m.location)})` : ""}</li>`;
    })
    .join("");

  return `<ul style="padding-left:20px;margin:0;">${items}</ul>`;
}
