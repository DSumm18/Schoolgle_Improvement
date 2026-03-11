import { SupabaseClient } from "@supabase/supabase-js";
import { DocumentTemplate } from "./types";

export interface ResolverContext {
  organizationId: string;
  staffId?: string;
  meetingId?: string;
  senderId?: string;
  contractorId?: string;
  customValues?: Record<string, string>;
}

export async function resolveFromStaff(
  staffId: string,
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("staff_directory")
    .select("*")
    .eq("id", staffId)
    .single();

  if (!data) return {};

  return {
    staff_name:
      data.display_name ||
      `${data.first_name || ""} ${data.last_name || ""}`.trim(),
    staff_first_name: data.first_name || "",
    staff_last_name: data.last_name || "",
    staff_title: data.job_title || "",
    staff_email: data.email || "",
    staff_dob: data.date_of_birth || "",
    staff_start_date: data.start_date || "",
    staff_role: data.job_title || "",
    staff_department: data.role_category || "",
    staff_phone: data.phone || "",
  };
}

export async function resolveFromOrganization(
  orgId: string,
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (!data) return {};

  const settings = data.settings || {};
  return {
    school_name: data.name || "",
    school_address: settings.address || "",
    school_phone: settings.phone || "",
    school_email: settings.email || "",
    school_website: settings.website || "",
    school_urn: data.urn || settings.urn || "",
    school_type: data.school_type || settings.school_type || "",
    school_headteacher: settings.headteacher || "",
  };
}

export async function resolveFromMeeting(
  meetingId: string,
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  // Try HR meetings first, then governance meetings
  const { data: hrMeeting } = await supabase
    .from("meetings")
    .select("*, meeting_templates(name, category)")
    .eq("id", meetingId)
    .single();

  if (hrMeeting) {
    const meetingDate = hrMeeting.scheduled_at
      ? new Date(hrMeeting.scheduled_at).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
    const meetingTime = hrMeeting.scheduled_at
      ? new Date(hrMeeting.scheduled_at).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return {
      meeting_date: meetingDate,
      meeting_time: meetingTime,
      meeting_location: hrMeeting.location || "",
      meeting_type: hrMeeting.meeting_templates?.name || "",
      meeting_category: hrMeeting.meeting_templates?.category || "",
      attendee_name: hrMeeting.attendee_name || "",
      meeting_purpose: hrMeeting.purpose || "",
    };
  }

  // Fallback to governance meetings
  const { data } = await supabase
    .from("governance_meetings")
    .select("*, governance_board_members(full_name)")
    .eq("id", meetingId)
    .single();

  if (!data) return {};

  const meetingDate = data.date
    ? new Date(data.date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return {
    meeting_date: meetingDate,
    meeting_time: data.time || "",
    meeting_location: data.location || "",
    meeting_type: data.meeting_type || "",
    chair_name: data.governance_board_members?.full_name || "",
  };
}

export async function resolveFromSender(
  userId: string,
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!data) return {};

  return {
    sender_name: data.display_name || data.full_name || "",
    sender_title: data.job_title || "",
    sender_email: data.email || "",
  };
}

export async function resolveFromAbsence(
  staffId: string,
  orgId: string,
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const { data: absences } = await supabase
    .from("sickness_absence_records")
    .select("*")
    .eq("staff_id", staffId)
    .eq("organization_id", orgId)
    .gte("start_date", twelveMonthsAgo.toISOString().split("T")[0]);

  if (!absences || absences.length === 0) {
    return {
      absence_occasions: "0",
      absence_days: "0",
      bradford_score: "0",
      review_period: `${twelveMonthsAgo.toLocaleDateString("en-GB")} - ${new Date().toLocaleDateString("en-GB")}`,
    };
  }

  const occasions = absences.length;
  const totalDays = absences.reduce(
    (sum: number, a: any) => sum + (a.working_days_lost || 0),
    0,
  );
  const bradfordScore = occasions * occasions * totalDays;

  return {
    absence_occasions: String(occasions),
    absence_days: String(totalDays),
    bradford_score: String(bradfordScore),
    review_period: `${twelveMonthsAgo.toLocaleDateString("en-GB")} - ${new Date().toLocaleDateString("en-GB")}`,
  };
}

export async function resolveFromContractor(
  contractorId: string,
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("estates_contractors")
    .select("*")
    .eq("id", contractorId)
    .single();

  if (!data) return {};

  return {
    contractor_name: data.company_name || data.name || "",
    contractor_contact: data.contact_name || "",
    contractor_email: data.email || "",
    contractor_phone: data.phone || "",
  };
}

const DATA_SOURCE_RESOLVERS: Record<
  string,
  (
    ctx: ResolverContext,
    supabase: SupabaseClient,
  ) => Promise<Record<string, string>>
> = {
  staff: (ctx, sb) =>
    ctx.staffId ? resolveFromStaff(ctx.staffId, sb) : Promise.resolve({}),
  organization: (ctx, sb) => resolveFromOrganization(ctx.organizationId, sb),
  meeting: (ctx, sb) =>
    ctx.meetingId ? resolveFromMeeting(ctx.meetingId, sb) : Promise.resolve({}),
  sender: (ctx, sb) =>
    ctx.senderId ? resolveFromSender(ctx.senderId, sb) : Promise.resolve({}),
  absence: (ctx, sb) =>
    ctx.staffId
      ? resolveFromAbsence(ctx.staffId, ctx.organizationId, sb)
      : Promise.resolve({}),
  contractor: (ctx, sb) =>
    ctx.contractorId
      ? resolveFromContractor(ctx.contractorId, sb)
      : Promise.resolve({}),
};

export async function resolvePlaceholders(
  template: DocumentTemplate,
  context: ResolverContext,
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  // Use template data_sources if available, otherwise auto-detect from context
  let sources = (template as any).data_sources || [];
  if (sources.length === 0) {
    // Auto-detect which resolvers to run based on context
    sources = ["organization"];
    if (context.staffId) sources.push("staff", "absence");
    if (context.meetingId) sources.push("meeting");
    if (context.senderId) sources.push("sender");
    if (context.contractorId) sources.push("contractor");
  }
  const resolverPromises = sources
    .filter((source: string) => DATA_SOURCE_RESOLVERS[source])
    .map((source: string) => DATA_SOURCE_RESOLVERS[source](context, supabase));

  const results = await Promise.all(resolverPromises);

  const merged: Record<string, string> = {};
  for (const result of results) {
    Object.assign(merged, result);
  }

  merged.today_date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (context.customValues) {
    Object.assign(merged, context.customValues);
  }

  // Handle both typed PlaceholderDefinition[] and DB string[] format
  const placeholders =
    (template as any).placeholders ||
    (template as any).available_placeholders ||
    [];
  for (const placeholder of placeholders) {
    if (
      typeof placeholder === "object" &&
      placeholder.default_value &&
      !merged[placeholder.key]
    ) {
      merged[placeholder.key] = placeholder.default_value;
    }
  }

  return merged;
}
