import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getAllStatutoryChecks } from "../src/lib/estates-compliance/statutory-checks";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: "../../.env.local" });

const TARGET_NAME = "Rawdon St Peter's C of E Primary School";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Supabase environment is not configured");

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function calculateNextDueDate(frequency: string, fromDate: string) {
  const date = new Date(`${fromDate}T00:00:00`);
  const monthIntervals: Record<string, number> = {
    monthly: 1,
    quarterly: 3,
    termly: 3,
    "6_monthly": 6,
  };
  const yearIntervals: Record<string, number> = {
    annual: 1,
    annually: 1,
    "2_yearly": 2,
    "3_yearly": 3,
    "5_yearly": 5,
    "10_yearly": 10,
  };
  if (frequency === "hourly" || frequency === "daily") date.setDate(date.getDate() + 1);
  else if (frequency === "weekly") date.setDate(date.getDate() + 7);
  else if (monthIntervals[frequency]) date.setMonth(date.getMonth() + monthIntervals[frequency]);
  else if (yearIntervals[frequency]) date.setFullYear(date.getFullYear() + yearIntervals[frequency]);
  return date.toISOString().split("T")[0];
}

async function main() {
const { data: organizations, error: organizationError } = await supabase
  .from("organizations")
  .select("id,name")
  .eq("name", TARGET_NAME);
if (organizationError) throw organizationError;
if (organizations?.length !== 1) {
  throw new Error(`Expected one active ${TARGET_NAME} organization, found ${organizations?.length || 0}`);
}
const organizationId = organizations[0].id;

const { data: members, error: memberError } = await supabase
  .from("organization_members")
  .select("user_id")
  .eq("organization_id", organizationId)
  .not("user_id", "is", null);
if (memberError) throw memberError;
const createdBy = members?.[0]?.user_id;
if (!createdBy) throw new Error("Rawdon has no member available to own demo routines");

const teamName = "Estates & Compliance Team";
const { data: existingTeam, error: existingTeamError } = await supabase
  .from("teams")
  .select("id")
  .eq("organization_id", organizationId)
  .eq("name", teamName)
  .maybeSingle();
if (existingTeamError) throw existingTeamError;

let estatesTeamId = existingTeam?.id;
if (!estatesTeamId) {
  const { data: createdTeam, error: teamError } = await supabase
    .from("teams")
    .insert({
      id: randomUUID(),
      organization_id: organizationId,
      name: teamName,
      description: "Team responsible for premises checks, compliance follow-up and linked helpdesk tickets.",
      color: "#0f766e",
      icon: "users",
      department: "Estates",
      type: "department",
      leader_id: createdBy,
      members: (members || []).map((member) => ({
        userId: member.user_id,
        role: member.user_id === createdBy ? "leader" : "member",
        joined_at: new Date().toISOString(),
      })),
      can_create_tasks: true,
      can_assign_tasks: true,
      can_approve_tasks: false,
    })
    .select("id")
    .single();
  if (teamError) throw teamError;
  estatesTeamId = createdTeam.id;
}

const checks = getAllStatutoryChecks();
const { data: existing, error: existingError } = await supabase
  .from("estates_statutory_completions")
  .select("check_id")
  .eq("organization_id", organizationId);
if (existingError) throw existingError;
const existingIds = new Set((existing || []).map((row) => row.check_id));
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const completionRows = checks
  .filter((check) => !existingIds.has(check.id))
  .map((check) => ({
    organization_id: organizationId,
    check_id: check.id,
    compliance_domain: check.domain,
    status: "pending",
    next_due_date: today,
    completion_notes: "Setup baseline required: confirm applicability and the last inspection/certificate date with Rawdon before operational use.",
    documents_received: false,
    evidence_ids: [],
    findings: [],
    rag_status: "amber",
  }));
if (completionRows.length > 0) {
  const { error } = await supabase.from("estates_statutory_completions").insert(completionRows);
  if (error) throw error;
}

await supabase
  .from("estates_statutory_completions")
  .update({
    next_due_date: today,
    completion_notes: "Setup baseline required: confirm applicability and the last inspection/certificate date with Rawdon before operational use.",
  })
  .eq("organization_id", organizationId)
  .eq("status", "pending")
  .is("completed_at", null)
  .not("check_id", "like", "custom_%");

const demoRoutines = [
  {
    name: "Daily Gate and Perimeter Lock Check",
    description: "Confirm the main gate, playground gates and side gates are secure, with defects raised to the helpdesk.",
    compliance_domain: "security",
    frequency: "daily",
    estimated_duration: 10,
    evidence_required: ["Daily security log", "Photo where a defect is found"],
    checklist_items: [
      "Main entrance gate secure",
      "Playground gates secure",
      "Side and service gates secure",
      "Locks and closers free from damage",
      "Any defect raised as a helpdesk ticket",
    ],
    tags: ["rawdon-demo", "good-practice", "security", "daily"],
  },
  {
    name: "Daily Opening Premises Walkaround",
    description: "A short opening check for obvious hazards, access issues, damage and security concerns before pupils arrive.",
    compliance_domain: "security",
    frequency: "daily",
    estimated_duration: 15,
    evidence_required: ["Opening check log"],
    checklist_items: [
      "Escape routes and access routes clear",
      "No obvious overnight damage or forced entry",
      "Paths free from significant slip or trip hazards",
      "External doors and windows appear secure",
      "Any concern raised as a helpdesk ticket",
    ],
    tags: ["rawdon-demo", "good-practice", "opening", "daily"],
  },
];

let customChecksCreated = 0;
for (const routine of demoRoutines) {
  const { data: duplicate, error: duplicateError } = await supabase
    .from("custom_checks")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", routine.name)
    .is("archived_at", null)
    .maybeSingle();
  if (duplicateError) throw duplicateError;
  if (duplicate) continue;

  const { data: customCheck, error } = await supabase
    .from("custom_checks")
    .insert({
      organization_id: organizationId,
      ...routine,
      notes: "Illustrative Rawdon demo routine. Confirm local wording, ownership and timing with the school before operational use.",
      classification: "non_statutory",
      frequency_locked: false,
      visibility: "organization",
      is_template: false,
      usage_count: 0,
      created_by: createdBy,
    })
    .select("id,compliance_domain,frequency")
    .single();
  if (error) throw error;

  const { error: completionError } = await supabase
    .from("estates_statutory_completions")
    .insert({
      organization_id: organizationId,
      check_id: `custom_${customCheck.id}`,
      compliance_domain: customCheck.compliance_domain,
      status: "pending",
      next_due_date: calculateNextDueDate(customCheck.frequency, today),
      documents_received: false,
      evidence_ids: [],
      findings: [],
      rag_status: "amber",
    });
  if (completionError) throw completionError;
  customChecksCreated += 1;
}

const demoContractorName = "Illustrative Water Hygiene Contractor (Demo)";
const { data: existingDemoContractor, error: contractorLookupError } = await supabase
  .from("estates_contractors")
  .select("id")
  .eq("organization_id", organizationId)
  .eq("company_name", demoContractorName)
  .maybeSingle();
if (contractorLookupError) throw contractorLookupError;
let demoContractor = existingDemoContractor;
if (!demoContractor) {
  const { data, error } = await supabase
    .from("estates_contractors")
    .insert({
      organization_id: organizationId,
      company_name: demoContractorName,
      services: ["Legionella monitoring"],
      notes: "Illustrative demo contractor only. Replace with Rawdon's appointed competent contractor before operational use.",
      status: "active",
      preferred: false,
    })
    .select("id")
    .single();
  if (error) throw error;
  demoContractor = data;
}

const { error: scenarioError } = await supabase
  .from("estates_statutory_completions")
  .update({
    status: "awaiting_documentation",
    completed_at: new Date().toISOString(),
    completed_by: createdBy,
    assigned_to: createdBy,
    inspection_date: today,
    next_due_date: calculateNextDueDate("monthly", today),
    documents_received: false,
    contractor_id: demoContractor.id,
    rag_status: "amber",
    completion_notes: "ILLUSTRATIVE DEMO — not a real Rawdon inspection. Contractor attendance and monthly temperature checks recorded; report/certificate is still outstanding.",
  })
  .eq("organization_id", organizationId)
  .eq("check_id", "leg_monthly_temp_check")
  .or("completion_notes.like.Setup baseline required:%,completion_notes.like.ILLUSTRATIVE DEMO%");
if (scenarioError) throw scenarioError;

console.log(JSON.stringify({
  organization: TARGET_NAME,
  statutoryAndGoodPracticeLibrary: checks.length,
  completionRowsCreated: completionRows.length,
  demoRoutinesCreated: customChecksCreated,
  estatesTeamId,
}));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
