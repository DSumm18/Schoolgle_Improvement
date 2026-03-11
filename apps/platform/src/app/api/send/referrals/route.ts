import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// Demo referrals
const DEMO_REFERRALS = [
  {
    id: "demo-ref-1",
    pupil_id: "demo-3",
    referral_type: "SALT",
    referral_date: "2025-10-15",
    referred_by: "SENCO",
    referral_reason:
      "Expressive language delay. Limited vocabulary for age. Difficulty following multi-step instructions.",
    status: "waiting_list",
    expected_wait_weeks: 12,
    agency_name: "NHS Community SALT Service",
    agency_contact: "salt.referrals@nhs.trust.uk",
    outcome: null,
    outcome_date: null,
    next_action: "Chase referral if no response by Jan 2026",
    notes: "GP referral form completed. School report attached.",
    created_at: "2025-10-15T00:00:00Z",
  },
  {
    id: "demo-ref-2",
    pupil_id: "demo-6",
    referral_type: "CAMHS",
    referral_date: "2025-10-20",
    referred_by: "SENCO",
    referral_reason:
      "Significant emotional dysregulation. Possible attachment difficulties. Not responding to school-based SEMH support alone.",
    status: "submitted",
    expected_wait_weeks: 26,
    agency_name: "CAMHS Tier 2",
    agency_contact: "camhs.referrals@nhs.trust.uk",
    outcome: null,
    outcome_date: null,
    next_action: "Await acknowledgement. Continue school-based support.",
    notes: "Parents consent obtained. School evidence pack sent.",
    created_at: "2025-10-20T00:00:00Z",
  },
  {
    id: "demo-ref-3",
    pupil_id: "demo-8",
    referral_type: "EHCP Assessment",
    referral_date: "2025-11-25",
    referred_by: "SENCO",
    referral_reason:
      "Despite 2 cycles of graduated approach at SEN K, needs remain significant. ASD diagnosis. Requires specialist provision beyond school resources.",
    status: "assessment",
    expected_wait_weeks: 20,
    agency_name: "Local Authority SEND Team",
    agency_contact: "ehcp@la.gov.uk",
    outcome: null,
    outcome_date: null,
    next_action: "Provide additional evidence if requested. Prepare for panel.",
    notes:
      "Parental request supported by school. EP report attached. 2 graduated approach cycles documented.",
    created_at: "2025-11-25T00:00:00Z",
  },
  {
    id: "demo-ref-4",
    pupil_id: "demo-7",
    referral_type: "OT",
    referral_date: "2025-09-05",
    referred_by: "SENCO",
    referral_reason:
      "Annual OT review due. Need updated programme for this academic year.",
    status: "report_received",
    expected_wait_weeks: 8,
    agency_name: "NHS Occupational Therapy",
    agency_contact: "ot.paediatrics@nhs.trust.uk",
    outcome:
      "New OT programme provided. Updated exercises for fine and gross motor skills.",
    outcome_date: "2025-11-10",
    next_action: "Implement new programme. TA training on exercises.",
    notes: "OT visited school 10 Nov. Observed pupil in class and playground.",
    created_at: "2025-09-05T00:00:00Z",
  },
  {
    id: "demo-ref-5",
    pupil_id: "demo-9",
    referral_type: "EP",
    referral_date: "2025-09-25",
    referred_by: "SENCO",
    referral_reason:
      "Request for dyslexia assessment. Positive screening result. Need formal assessment for exam access arrangements.",
    status: "waiting_list",
    expected_wait_weeks: 16,
    agency_name: "Educational Psychology Service",
    agency_contact: "ep.referrals@la.gov.uk",
    outcome: null,
    outcome_date: null,
    next_action: "Continue Toe by Toe. Gather evidence for EP visit.",
    notes: "Traded service - 2 EP days remaining this year.",
    created_at: "2025-09-25T00:00:00Z",
  },
  {
    id: "demo-ref-6",
    pupil_id: "demo-11",
    referral_type: "Sensory",
    referral_date: "2025-09-01",
    referred_by: "SENCO",
    referral_reason:
      "Annual Teacher of the Deaf review and audiological assessment.",
    status: "report_received",
    expected_wait_weeks: 4,
    agency_name: "Sensory Support Service",
    agency_contact: "sensory.support@la.gov.uk",
    outcome:
      "Hearing levels stable. FM system working well. Continue current support.",
    outcome_date: "2025-10-01",
    next_action: "No changes needed. Next review Spring 2026.",
    notes: "ToD visits fortnightly. Good partnership with family.",
    created_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "demo-ref-7",
    pupil_id: "demo-4",
    referral_type: "Paediatrician",
    referral_date: "2025-12-01",
    referred_by: "Parent (school supported)",
    referral_reason:
      "Medication review for ADHD. Current dose may need adjusting - increased restlessness noted.",
    status: "draft",
    expected_wait_weeks: 10,
    agency_name: "Community Paediatrics",
    agency_contact: null,
    outcome: null,
    outcome_date: null,
    next_action: "Complete referral form with parent. Attach behaviour log.",
    notes:
      "Parent to make GP appointment. School to provide supporting letter.",
    created_at: "2025-12-01T00:00:00Z",
  },
  {
    id: "demo-ref-8",
    pupil_id: "demo-14",
    referral_type: "Physio",
    referral_date: "2025-11-01",
    referred_by: "SENCO",
    referral_reason:
      "Annual physiotherapy review. Need updated handling plan and equipment check.",
    status: "assessment",
    expected_wait_weeks: 6,
    agency_name: "Paediatric Physiotherapy",
    agency_contact: "physio.paeds@nhs.trust.uk",
    outcome: null,
    outcome_date: null,
    next_action: "Physio visit booked for 15 Jan 2026.",
    notes: "Equipment check also needed - wheelchair and standing frame.",
    created_at: "2025-11-01T00:00:00Z",
  },
];

/**
 * GET /api/send/referrals
 * List referrals. Filter by status, referral_type, pupil_id
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const pupilId = url.searchParams.get("pupil_id");

  let query = supabase
    .from("send_referrals")
    .select(
      "*, send_register(pupil_code, first_name, last_name, year_group, primary_need, sen_status)",
    )
    .eq("organization_id", organizationId)
    .order("referral_date", { ascending: false });

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("referral_type", type);
  if (pupilId) query = query.eq("pupil_id", pupilId);

  const { data, error } = await query;

  if (error) {
    console.error("[SEND Referrals GET]", error);
  }

  if (!data || data.length === 0) {
    let filtered = [...DEMO_REFERRALS];
    if (status) filtered = filtered.filter((r) => r.status === status);
    if (type) filtered = filtered.filter((r) => r.referral_type === type);
    if (pupilId) filtered = filtered.filter((r) => r.pupil_id === pupilId);
    return apiSuccess({ data: filtered, demo: true });
  }

  return apiSuccess({ data, demo: false });
});

/**
 * POST /api/send/referrals
 * Create a new referral
 */
export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    pupil_id,
    referral_type,
    referral_reason,
    referred_by,
    agency_name,
    agency_contact,
    expected_wait_weeks,
    notes,
  } = body;

  if (!pupil_id || !referral_type || !referral_reason) {
    return apiError(
      "pupil_id, referral_type, and referral_reason are required",
      400,
    );
  }

  const { data, error } = await supabase
    .from("send_referrals")
    .insert({
      organization_id: organizationId,
      pupil_id,
      referral_type,
      referral_date: new Date().toISOString().split("T")[0],
      referred_by: referred_by || null,
      referral_reason,
      status: "draft",
      agency_name: agency_name || null,
      agency_contact: agency_contact || null,
      expected_wait_weeks: expected_wait_weeks || null,
      notes: notes || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[SEND Referrals POST]", error);
    return apiError("Failed to create referral", 500);
  }

  return apiSuccess(data, 201);
});

/**
 * PUT /api/send/referrals
 * Update a referral status/outcome (using id in body)
 */
export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    id,
    status,
    outcome,
    outcome_date,
    next_action,
    notes,
    agency_name,
    agency_contact,
    expected_wait_weeks,
  } = body;

  if (!id) {
    return apiError("id is required", 400);
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status !== undefined) updates.status = status;
  if (outcome !== undefined) updates.outcome = outcome;
  if (outcome_date !== undefined) updates.outcome_date = outcome_date;
  if (next_action !== undefined) updates.next_action = next_action;
  if (notes !== undefined) updates.notes = notes;
  if (agency_name !== undefined) updates.agency_name = agency_name;
  if (agency_contact !== undefined) updates.agency_contact = agency_contact;
  if (expected_wait_weeks !== undefined)
    updates.expected_wait_weeks = expected_wait_weeks;

  const { data, error } = await supabase
    .from("send_referrals")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    console.error("[SEND Referrals PUT]", error);
    return apiError("Failed to update referral", 500);
  }

  return apiSuccess(data);
});
