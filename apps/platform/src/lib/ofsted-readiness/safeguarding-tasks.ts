import type {
  ActionChecklistItem,
  ActionLinkedEvidence,
  TaskPriority,
} from "@/lib/tasks/types";

type SafeguardingTaskType = "safeguarding";

interface SafeguardingDateCheck {
  is_current?: boolean;
  date_found?: string | null;
  review_due_at?: string | null;
  reminder_due_at?: string | null;
  reminder_lead_months?: number | null;
  note?: string | null;
}

export interface SafeguardingSourceCheck {
  id?: string | null;
  evaluation_area: string;
  expected_document: string;
  found: boolean;
  found_filename?: string | null;
  found_path?: string | null;
  inspection_detail?: {
    date_check?: SafeguardingDateCheck | null;
  } | null;
}

export interface SafeguardingActionDraft
{
  source_key: string;
  title: string;
  description: string;
  success_criteria?: string;
  framework_type: "ofsted";
  category_id: "safeguarding";
  subcategory_id: string;
  module: "ofsted-readiness";
  task_type: SafeguardingTaskType;
  priority: TaskPriority;
  status: "not_started";
  user_status: "draft";
  ai_status: "not_assessed";
  approval_status: "pending_approval";
  due_date: string;
  source: string;
  route_path: string;
  source_record_id: string;
  source_table_name: "ofsted_document_checks";
  linked_evidence: Partial<ActionLinkedEvidence>[];
  checklist: ActionChecklistItem[];
}

interface BuildOptions {
  today?: string | Date;
}

export function buildSafeguardingActionDrafts(
  checks: SafeguardingSourceCheck[],
  options: BuildOptions = {},
): SafeguardingActionDraft[] {
  const today = normaliseDateOnly(options.today ?? new Date());
  const drafts: SafeguardingActionDraft[] = [];

  for (const check of checks) {
    if (!isSafeguardingCheck(check)) continue;

    const expected = normaliseExpectedDocument(check.expected_document);
    if (expected === "safeguarding policy" && check.found) {
      const reviewDraft = buildPolicyReviewDraft(check);
      if (reviewDraft) drafts.push(reviewDraft);
      continue;
    }

    if (!check.found) {
      const gapDraft = buildMissingEvidenceDraft(check, expected, today);
      if (gapDraft) drafts.push(gapDraft);
    }
  }

  return drafts;
}

function isSafeguardingCheck(check: SafeguardingSourceCheck): boolean {
  return check.evaluation_area.toLowerCase() === "safeguarding";
}

function normaliseExpectedDocument(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildPolicyReviewDraft(
  check: SafeguardingSourceCheck,
): SafeguardingActionDraft | null {
  const dateCheck = check.inspection_detail?.date_check;
  if (!dateCheck?.review_due_at || !dateCheck.reminder_due_at) return null;

  const sourceRecordId = sourceRecordIdFor(check);
  const reviewLabel = dateCheck.date_found || formatDateOnly(dateCheck.review_due_at);
  const linkedEvidence = buildLinkedEvidence(check, "Current safeguarding policy");

  return {
    source_key: `safeguarding_policy_review:${sourceRecordId}`,
    title: `Review Safeguarding Policy before ${reviewLabel}`,
    description:
      "The safeguarding policy is currently evidenced, but it has a known next review point. Schedule the review early so the school is not caught out during inspection preparation.",
    success_criteria:
      "The published safeguarding policy is reviewed, approved, dated, and re-scanned before the review deadline.",
    framework_type: "ofsted",
    category_id: "safeguarding",
    subcategory_id: "safeguarding-policy",
    module: "ofsted-readiness",
    task_type: "safeguarding",
    priority: dateCheck.is_current === false ? "critical" : "medium",
    status: "not_started",
    user_status: "draft",
    ai_status: "not_assessed",
    approval_status: "pending_approval",
    due_date: dateCheck.reminder_due_at,
    source: "ofsted_safeguarding_review_schedule",
    route_path: "/dashboard/ofsted-readiness?area=Safeguarding",
    source_record_id: sourceRecordId,
    source_table_name: "ofsted_document_checks",
    linked_evidence: linkedEvidence,
    checklist: makeChecklist([
      "Confirm the policy still reflects current KCSIE and Working Together guidance",
      "Update named DSL, deputy DSLs and safeguarding governor/trustee if needed",
      "Record governor/trust approval and publish the reviewed version",
      "Run the website scan again so Schoolgle verifies the new review date",
    ]),
  };
}

function buildMissingEvidenceDraft(
  check: SafeguardingSourceCheck,
  expected: string,
  today: string,
): SafeguardingActionDraft | null {
  const sourceRecordId = sourceRecordIdFor(check);

  if (expected === "single central record") {
    return missingDraft({
      check,
      sourceRecordId,
      sourceKey: `safeguarding_gap:${sourceRecordId}`,
      title: "Link or upload Single Central Record evidence",
      description:
        "Schoolgle has not got a secure evidence link for the Single Central Record. The SCR itself does not need to be public, but Ofsted readiness needs a clear evidence pointer and routine checking trail.",
      priority: "critical",
      dueDate: addDays(today, 7),
      checklist: [
        "Add a secure link to the SCR or upload a redacted audit summary",
        "Confirm the latest SCR check date and responsible person",
        "Check identity, barred list, DBS, prohibition, right to work, references and overseas checks where applicable",
        "Set the recurring SCR self-check rhythm if the school wants Schoolgle to remind them",
      ],
    });
  }

  if (expected === "dsl training") {
    return missingDraft({
      check,
      sourceRecordId,
      sourceKey: `safeguarding_gap:${sourceRecordId}`,
      title: "Add DSL training evidence and expiry dates",
      description:
        "Schoolgle has not found current DSL/deputy DSL training evidence. Add certificates or a secure evidence link so renewal reminders can be created.",
      priority: "high",
      dueDate: addDays(today, 14),
      checklist: [
        "Upload or link DSL and deputy DSL training certificates",
        "Record training dates and expiry/renewal dates",
        "Confirm deputies are trained to the same standard as the DSL",
      ],
    });
  }

  if (expected === "safer recruitment") {
    return missingDraft({
      check,
      sourceRecordId,
      sourceKey: `safeguarding_gap:${sourceRecordId}`,
      title: "Evidence safer recruitment checks",
      description:
        "Schoolgle has not found evidence of safer recruitment process checks. Add a policy link, recruitment checklist, training evidence, or sample audit trail.",
      priority: "high",
      dueDate: addDays(today, 14),
      checklist: [
        "Evidence at least one trained safer recruitment panel member",
        "Evidence references, identity, right to work and qualification checks",
        "Evidence DBS, barred list, prohibition and section 128 checks where applicable",
        "Evidence overseas checks or risk assessments where relevant",
      ],
    });
  }

  return null;
}

function missingDraft({
  check,
  sourceRecordId,
  sourceKey,
  title,
  description,
  priority,
  dueDate,
  checklist,
}: {
  check: SafeguardingSourceCheck;
  sourceRecordId: string;
  sourceKey: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  checklist: string[];
}): SafeguardingActionDraft {
  return {
    source_key: sourceKey,
    title,
    description,
    success_criteria: "Evidence is linked, checked, and visible in the Ofsted readiness evidence trail.",
    framework_type: "ofsted",
    category_id: "safeguarding",
    subcategory_id: normaliseExpectedDocument(check.expected_document).replace(/\s+/g, "-"),
    module: "ofsted-readiness",
    task_type: "safeguarding",
    priority,
    status: "not_started",
    user_status: "draft",
    ai_status: "not_assessed",
    approval_status: "pending_approval",
    due_date: dueDate,
    source: "ofsted_safeguarding_gap",
    route_path: "/dashboard/ofsted-readiness?area=Safeguarding",
    source_record_id: sourceRecordId,
    source_table_name: "ofsted_document_checks",
    linked_evidence: buildLinkedEvidence(check, check.found_filename || check.expected_document),
    checklist: makeChecklist(checklist),
  };
}

function buildLinkedEvidence(
  check: SafeguardingSourceCheck,
  title: string,
): Partial<ActionLinkedEvidence>[] {
  if (!check.found_path || !/^https?:\/\//i.test(check.found_path)) return [];
  return [
    {
      type: "url",
      title,
      url: check.found_path,
    },
  ];
}

function sourceRecordIdFor(check: SafeguardingSourceCheck): string {
  return (
    check.id ||
    normaliseExpectedDocument(check.expected_document).replace(/\s+/g, "-")
  );
}

function normaliseDateOnly(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value.slice(0, 10);
}

function addDays(dateOnly: string, days: number): string {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateOnly(dateOnly: string): string {
  return new Date(`${dateOnly}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function makeChecklist(titles: string[]): ActionChecklistItem[] {
  return titles.map((title, index) => ({
    id: `safeguarding-${index + 1}`,
    title,
    completed: false,
    completed_by: null,
    completed_at: null,
  }));
}
