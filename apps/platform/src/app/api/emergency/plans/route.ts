/**
 * Emergency Plans API
 *
 * GET  /api/emergency/plans - List plans for organization
 * POST /api/emergency/plans - Create a new emergency plan
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");

  let query = supabase
    .from("emergency_plans")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (type) {
    query = query.eq("plan_type", type);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Emergency Plans] GET error:", error);
    return apiError("Failed to fetch emergency plans", 500);
  }

  // If no data, return demo data
  if (!data || data.length === 0) {
    return apiSuccess({ plans: getDemoPlans(), isDemo: true });
  }

  return apiSuccess({ plans: data, isDemo: false });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    plan_type,
    title,
    status = "draft",
    description,
    procedures,
    assembly_points,
    communication_tree,
    post_incident_checklist,
    key_contacts,
    review_frequency_months = 12,
  } = body;

  if (!plan_type || !title) {
    return apiError("plan_type and title are required", 400);
  }

  const validTypes = [
    "fire_evacuation",
    "lockdown",
    "shelter_in_place",
    "bomb_threat",
    "intruder",
    "flood",
    "gas_leak",
    "pandemic",
  ];

  if (!validTypes.includes(plan_type)) {
    return apiError(
      `Invalid plan_type. Must be one of: ${validTypes.join(", ")}`,
      400,
    );
  }

  const nextReview = new Date();
  nextReview.setMonth(nextReview.getMonth() + review_frequency_months);

  const { data, error } = await supabase
    .from("emergency_plans")
    .insert({
      organization_id: organizationId,
      plan_type,
      title,
      status,
      description,
      procedures: procedures || [],
      assembly_points: assembly_points || [],
      communication_tree: communication_tree || [],
      post_incident_checklist: post_incident_checklist || [],
      key_contacts: key_contacts || [],
      review_frequency_months,
      last_reviewed_at: new Date().toISOString(),
      next_review_due: nextReview.toISOString(),
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[Emergency Plans] POST error:", error);
    return apiError("Failed to create emergency plan", 500);
  }

  return apiSuccess(data, 201);
});

// ─── Demo Data ──────────────────────────────────────────────────────

function getDemoPlans() {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const twoMonthsFromNow = new Date(now);
  twoMonthsFromNow.setMonth(now.getMonth() + 2);
  const threeMonthsFromNow = new Date(now);
  threeMonthsFromNow.setMonth(now.getMonth() + 3);
  const nineMonthsFromNow = new Date(now);
  nineMonthsFromNow.setMonth(now.getMonth() + 9);
  const pastDue = new Date(now);
  pastDue.setMonth(now.getMonth() - 1);

  return [
    {
      id: "demo-plan-1",
      plan_type: "fire_evacuation",
      title: "Fire Evacuation Plan",
      status: "active",
      description:
        "Comprehensive fire evacuation procedures for all school buildings including main school, annex, and sports hall. Covers all scenarios including during lessons, break times, and before/after school clubs.",
      procedures: [
        {
          step: 1,
          action:
            "On discovering a fire, activate the nearest fire alarm call point",
          responsible: "Any staff member",
        },
        {
          step: 2,
          action:
            "Call 999 and request Fire Service. Give school address and location of fire",
          responsible: "Office Manager",
        },
        {
          step: 3,
          action:
            "All staff escort pupils to designated assembly points via nearest safe exit",
          responsible: "All teaching staff",
        },
        {
          step: 4,
          action:
            "Class teachers take registers and report to Fire Marshal at assembly point",
          responsible: "Class teachers",
        },
        {
          step: 5,
          action:
            "Fire Marshal confirms all areas swept and all persons accounted for",
          responsible: "Fire Marshal",
        },
        {
          step: 6,
          action: "Headteacher liaises with Fire Service on arrival",
          responsible: "Headteacher",
        },
        {
          step: 7,
          action:
            "Do NOT re-enter the building until Fire Service gives all clear",
          responsible: "All staff",
        },
        {
          step: 8,
          action: "Complete post-incident report and notify LA if required",
          responsible: "Headteacher",
        },
      ],
      assembly_points: [
        {
          name: "Main Playground",
          location: "South side of main building",
          capacity: 300,
          primary: true,
        },
        {
          name: "Sports Field",
          location: "Behind sports hall",
          capacity: 500,
          primary: false,
        },
        {
          name: "Car Park (overflow)",
          location: "Front car park",
          capacity: 150,
          primary: false,
        },
      ],
      communication_tree: [
        {
          role: "Headteacher",
          notifies: ["Deputy Head", "Chair of Governors", "LA Emergency Line"],
        },
        { role: "Deputy Head", notifies: ["Phase Leaders", "Office Manager"] },
        { role: "Phase Leaders", notifies: ["Class Teachers in phase"] },
        {
          role: "Office Manager",
          notifies: ["Parents via ParentMail", "School website update"],
        },
      ],
      post_incident_checklist: [
        "Complete fire incident report form",
        "Record evacuation time and any issues",
        "Check all fire safety equipment is reset",
        "Debrief with staff within 24 hours",
        "Notify LA safeguarding team if pupils affected",
        "Update risk assessment if needed",
        "Review and update plan if deficiencies found",
        "File report with governors at next meeting",
      ],
      key_contacts: [
        {
          role: "Fire Marshal",
          name: "Mr James Thompson",
          phone: "07700 900123",
          email: "j.thompson@school.edu",
        },
        {
          role: "Deputy Fire Marshal",
          name: "Mrs Sarah Wilson",
          phone: "07700 900124",
          email: "s.wilson@school.edu",
        },
      ],
      last_reviewed_at: threeMonthsAgo.toISOString(),
      next_review_due: nineMonthsFromNow.toISOString(),
      review_frequency_months: 12,
      created_at: oneYearAgo.toISOString(),
      updated_at: threeMonthsAgo.toISOString(),
    },
    {
      id: "demo-plan-2",
      plan_type: "lockdown",
      title: "Lockdown Procedure",
      status: "active",
      description:
        "Full lockdown procedures for threats including intruder on site, dangerous person in vicinity, or police instruction. Includes partial and full lockdown options.",
      procedures: [
        {
          step: 1,
          action:
            "Trigger lockdown: continuous alarm tone / tannoy announcement 'LOCKDOWN LOCKDOWN LOCKDOWN'",
          responsible: "SLT member",
        },
        {
          step: 2,
          action: "Lock all external doors and windows immediately",
          responsible: "Site Manager",
        },
        {
          step: 3,
          action:
            "Staff lock classroom doors, move pupils away from windows and doors",
          responsible: "All staff",
        },
        {
          step: 4,
          action: "Turn off lights, close blinds, keep pupils calm and quiet",
          responsible: "All staff",
        },
        {
          step: 5,
          action: "Call 999 if not already done. Do not use fire alarm.",
          responsible: "Headteacher / Office",
        },
        {
          step: 6,
          action:
            "Account for all pupils using class registers. Text/email report to SLT",
          responsible: "Class teachers",
        },
        {
          step: 7,
          action:
            "Do NOT open doors until 'ALL CLEAR' given by Headteacher or Police",
          responsible: "All staff",
        },
        {
          step: 8,
          action: "Communicate with parents ONLY after police authorisation",
          responsible: "Headteacher",
        },
      ],
      assembly_points: [
        {
          name: "Classrooms (in-place)",
          location: "All teaching rooms - stay in place",
          capacity: 30,
          primary: true,
        },
        {
          name: "Hall (if caught in corridor)",
          location: "Main hall - nearest secure room",
          capacity: 200,
          primary: false,
        },
      ],
      communication_tree: [
        {
          role: "Headteacher",
          notifies: ["Police (999)", "Chair of Governors"],
        },
        {
          role: "Deputy Head",
          notifies: ["All staff via tannoy/walkie-talkie"],
        },
        {
          role: "Office Manager",
          notifies: ["Parents (ONLY when authorised by police)"],
        },
      ],
      post_incident_checklist: [
        "Debrief with police",
        "Staff debrief and wellbeing check",
        "Pupil welfare assessment",
        "Parent communication (letter home)",
        "Counselling referrals if needed",
        "Complete incident report",
        "Review and update lockdown plan",
        "Report to governors",
      ],
      key_contacts: [
        {
          role: "Lockdown Lead",
          name: "Mrs Helen Carter (Headteacher)",
          phone: "07700 900100",
          email: "h.carter@school.edu",
        },
        {
          role: "Deputy Lead",
          name: "Mr David Brown (Deputy Head)",
          phone: "07700 900101",
          email: "d.brown@school.edu",
        },
      ],
      last_reviewed_at: sixMonthsAgo.toISOString(),
      next_review_due: twoMonthsFromNow.toISOString(),
      review_frequency_months: 12,
      created_at: oneYearAgo.toISOString(),
      updated_at: sixMonthsAgo.toISOString(),
    },
    {
      id: "demo-plan-3",
      plan_type: "shelter_in_place",
      title: "Shelter-in-Place Plan",
      status: "active",
      description:
        "Procedures for sheltering in place during environmental hazards such as chemical spill, severe weather, or air quality emergency. Pupils and staff remain indoors with ventilation sealed.",
      procedures: [
        {
          step: 1,
          action:
            "Announce 'SHELTER IN PLACE' via tannoy. Bring all outdoor pupils inside immediately",
          responsible: "SLT member",
        },
        {
          step: 2,
          action: "Close and seal all external doors, windows, and vents",
          responsible: "Site Manager",
        },
        {
          step: 3,
          action: "Turn off HVAC systems and air handling units",
          responsible: "Site Manager",
        },
        {
          step: 4,
          action:
            "Move all occupants to internal rooms away from external walls where possible",
          responsible: "All staff",
        },
        {
          step: 5,
          action: "Take registers and account for all pupils",
          responsible: "Class teachers",
        },
        {
          step: 6,
          action:
            "Monitor emergency broadcasts and liaise with emergency services",
          responsible: "Headteacher",
        },
        {
          step: 7,
          action:
            "Provide water and comfort breaks. Prepare for extended stay if needed",
          responsible: "All staff",
        },
        {
          step: 8,
          action: "ALL CLEAR only when emergency services confirm it is safe",
          responsible: "Headteacher",
        },
      ],
      assembly_points: [
        {
          name: "Main Hall (interior)",
          location: "Centre of main building",
          capacity: 400,
          primary: true,
        },
        {
          name: "Classrooms (sealed)",
          location: "Interior classrooms preferred",
          capacity: 30,
          primary: false,
        },
      ],
      communication_tree: [
        {
          role: "Headteacher",
          notifies: [
            "Emergency Services",
            "LA Emergency Line",
            "Chair of Governors",
          ],
        },
        { role: "Office Manager", notifies: ["Parents via ParentMail"] },
      ],
      post_incident_checklist: [
        "Ventilate building once all clear given",
        "Check all pupils and staff for symptoms",
        "Complete incident report",
        "Notify parents of any health concerns",
        "Review plan effectiveness",
      ],
      key_contacts: [],
      last_reviewed_at: oneYearAgo.toISOString(),
      next_review_due: pastDue.toISOString(),
      review_frequency_months: 12,
      created_at: oneYearAgo.toISOString(),
      updated_at: oneYearAgo.toISOString(),
    },
    {
      id: "demo-plan-4",
      plan_type: "bomb_threat",
      title: "Bomb Threat Response Plan",
      status: "active",
      description:
        "Response procedures for bomb threats received by phone, email, letter, or suspicious package discovery. Follows NaCTSO guidance for schools.",
      procedures: [
        {
          step: 1,
          action:
            "If threat received by phone: keep caller talking, use bomb threat checklist card, signal colleague to call 999",
          responsible: "Receiver of call",
        },
        {
          step: 2,
          action:
            "Do NOT use mobile phones or two-way radios within 15m of suspicious item",
          responsible: "All staff",
        },
        {
          step: 3,
          action:
            "Police will advise whether to evacuate. Follow their instruction.",
          responsible: "Headteacher",
        },
        {
          step: 4,
          action:
            "If evacuation ordered: use routes AWAY from suspect area. Do NOT use fire alarm.",
          responsible: "All staff",
        },
        {
          step: 5,
          action:
            "Evacuate to distant assembly point (sports field, NOT playground)",
          responsible: "All staff",
        },
        {
          step: 6,
          action:
            "Take registers at assembly point. Report any missing persons to police immediately",
          responsible: "Class teachers",
        },
        {
          step: 7,
          action: "Do NOT re-enter until police give explicit all clear",
          responsible: "All staff",
        },
        {
          step: 8,
          action:
            "Arrange alternative accommodation if building cannot be re-entered",
          responsible: "Headteacher / LA",
        },
      ],
      assembly_points: [
        {
          name: "Sports Field (far end)",
          location: "Maximum distance from buildings",
          capacity: 500,
          primary: true,
        },
        {
          name: "Local Church Hall",
          location: "St Mary's Church, 200m from school",
          capacity: 300,
          primary: false,
        },
      ],
      communication_tree: [
        {
          role: "Headteacher",
          notifies: [
            "Police (999)",
            "LA Emergency",
            "Chair of Governors",
            "DfE if prolonged",
          ],
        },
        {
          role: "Office Manager",
          notifies: [
            "Parents - collect children from church hall if evacuated",
          ],
        },
      ],
      post_incident_checklist: [
        "Full debrief with police",
        "Staff and pupil welfare checks",
        "Parent communication",
        "Review security arrangements",
        "Update risk assessment",
        "Report to governors",
        "Consider counselling support",
      ],
      key_contacts: [
        {
          role: "NaCTSO Helpline",
          name: "Counter-Terrorism Police",
          phone: "0800 789 321",
          email: "",
        },
      ],
      last_reviewed_at: sixMonthsAgo.toISOString(),
      next_review_due: threeMonthsFromNow.toISOString(),
      review_frequency_months: 12,
      created_at: oneYearAgo.toISOString(),
      updated_at: sixMonthsAgo.toISOString(),
    },
  ];
}
