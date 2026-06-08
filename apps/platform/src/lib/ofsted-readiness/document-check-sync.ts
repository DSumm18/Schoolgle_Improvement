import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  EXPECTED_OFSTED_DOCUMENTS,
  resolveOfstedDocumentEvidence,
  type DriveEvidenceFile,
  type ResolvedDocumentEvidenceResult,
  type ResolvedDocumentFound,
  type ResolvedDocumentMissing,
  type WebsiteDocumentEvidence,
  type WebsiteRequirementEvidence,
} from "./policy-evidence-resolver";
import { buildSafeguardingActionDrafts } from "./safeguarding-tasks";

export interface LatestWebsiteScan {
  session_id: string;
  status: string;
  website_url: string;
  trust_url: string | null;
  scraped_at: string | null;
  assessed_at: string | null;
}

export interface WebsiteEvidenceForDocumentChecks {
  scan: LatestWebsiteScan | null;
  assessments: WebsiteRequirementEvidence[];
  documents: WebsiteDocumentEvidence[];
}

export interface ResolvedOfstedDocumentCheckRow {
  organization_id: string;
  connection_id: null;
  evaluation_area: string;
  expected_document: string;
  found: boolean;
  found_filename: string | null;
  found_path: string | null;
  found_modified_at: string | null;
  priority: "required" | "recommended";
  checked_at: string;
  inspection_verdict: string | null;
  inspection_summary: string | null;
  inspection_actions: string[] | null;
  inspection_detail: WebsiteInspectionDetail | null;
  inspected_at: string | null;
}

interface WebsiteInspectionDetail {
  rating: "expected_standard" | "needs_attention";
  confidence: "high" | "medium";
  summary: string;
  actions_required: Array<{
    action: string;
    priority: "high" | "medium";
    rationale: string;
    sef_impact: string;
  }>;
  checkpoint_results: Array<{
    checkpoint: string;
    met: boolean;
    evidence: string;
    severity: "critical" | "important";
  }>;
  red_flags: string[];
  date_check: {
    is_current: boolean;
    date_found: string | null;
    review_due_at?: string | null;
    reminder_due_at?: string | null;
    reminder_lead_months?: number | null;
    note: string;
  };
  legislation_check: {
    references_current: boolean;
    missing_references: string[];
  };
  sef_contribution: string;
}

export async function resolveAndSyncOfstedDocumentChecks({
  organizationId,
  driveFiles = [],
  sessionId,
}: {
  organizationId: string;
  driveFiles?: DriveEvidenceFile[];
  sessionId?: string;
}): Promise<{
  resolved: ResolvedDocumentEvidenceResult;
  websiteEvidence: WebsiteEvidenceForDocumentChecks;
  savedDocumentChecksCount: number;
}> {
  const websiteEvidence = await loadLatestWebsiteEvidence(organizationId, sessionId);
  const resolved = resolveOfstedDocumentEvidence({
    driveFiles,
    websiteAssessments: websiteEvidence.assessments,
    websiteDocuments: websiteEvidence.documents,
  });
  const savedDocumentChecksCount = await syncResolvedDocumentChecks({
    organizationId,
    resolved,
  });

  return { resolved, websiteEvidence, savedDocumentChecksCount };
}

export async function loadLatestWebsiteEvidence(
  organizationId: string,
  sessionId?: string,
): Promise<WebsiteEvidenceForDocumentChecks> {
  const supabase = createServiceRoleClient();
  let sessionQuery = supabase
    .from("website_scan_sessions")
    .select(
      "id,status,website_url,trust_url,scrape_completed_at,assess_completed_at,created_at",
    )
    .eq("organization_id", organizationId);

  if (sessionId) {
    sessionQuery = sessionQuery.eq("id", sessionId);
  }

  const { data: session, error: sessionError } = await sessionQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    console.warn(
      "[Ofsted Document Check] Website scan lookup failed:",
      sessionError.message,
    );
    return { scan: null, assessments: [], documents: [] };
  }

  if (!session) {
    return { scan: null, assessments: [], documents: [] };
  }

  const [assessmentResult, documentResult, pageResult] = await Promise.all([
    supabase
      .from("website_requirement_assessments")
      .select(
        "requirement_key,requirement_name,status,compliance_score,quality_score,currency_status,evidence_urls,evidence_quotes,gaps,recommendations,red_flags,review_date_found,assessed_at",
      )
      .eq("session_id", session.id),
    supabase
      .from("website_scraped_documents")
      .select(
        "url,filename,title,link_text,found_on_page_url,file_type,extracted_text,extraction_method,extraction_error,word_count,dates_found,source",
      )
      .eq("session_id", session.id),
    supabase
      .from("website_scraped_pages")
      .select("url,title,extracted_text,word_count,source")
      .eq("session_id", session.id),
  ]);

  if (assessmentResult.error) {
    console.warn(
      "[Ofsted Document Check] Website assessment lookup failed:",
      assessmentResult.error.message,
    );
  }

  if (documentResult.error) {
    console.warn(
      "[Ofsted Document Check] Website document lookup failed:",
      documentResult.error.message,
    );
  }

  if (pageResult.error) {
    console.warn(
      "[Ofsted Document Check] Website page lookup failed:",
      pageResult.error.message,
    );
  }

  const pageEvidence: WebsiteDocumentEvidence[] = (pageResult.data ?? []).map(
    (page) => ({
      url: page.url,
      filename: null,
      title: page.title,
      link_text: page.title,
      found_on_page_url: page.url,
      file_type: "html_page",
      extracted_text: page.extracted_text,
      word_count: page.word_count,
      source: page.source,
    }),
  );

  return {
    scan: {
      session_id: session.id,
      status: session.status,
      website_url: session.website_url,
      trust_url: session.trust_url,
      scraped_at: session.scrape_completed_at,
      assessed_at: session.assess_completed_at,
    },
    assessments: (assessmentResult.data ?? []) as WebsiteRequirementEvidence[],
    documents: [
      ...((documentResult.data ?? []) as WebsiteDocumentEvidence[]),
      ...pageEvidence,
    ],
  };
}

export async function syncResolvedDocumentChecks({
  organizationId,
  resolved,
  checkedAt = new Date().toISOString(),
}: {
  organizationId: string;
  resolved: ResolvedDocumentEvidenceResult;
  checkedAt?: string;
}): Promise<number> {
  const rows = buildOfstedDocumentCheckRows({
    organizationId,
    resolved,
    checkedAt,
  });

  if (rows.length === 0) return 0;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("ofsted_document_checks").upsert(rows, {
    onConflict: "organization_id,evaluation_area,expected_document",
  });

  if (error) {
    console.warn(
      "[Ofsted Document Check] Could not persist resolved document checks:",
      error.message,
    );
    return 0;
  }

  await syncSafeguardingActionDrafts({
    supabase,
    organizationId,
    checkedAt,
  });

  return rows.length;
}

export function buildOfstedDocumentCheckRows({
  organizationId,
  resolved,
  checkedAt,
}: {
  organizationId: string;
  resolved: ResolvedDocumentEvidenceResult;
  checkedAt: string;
}): ResolvedOfstedDocumentCheckRow[] {
  const priorityByDocument = new Map(
    EXPECTED_OFSTED_DOCUMENTS.map((document) => [
      document.name,
      document.priority,
    ]),
  );

  return [
    ...resolved.documents_found.map((document) =>
      buildFoundDocumentCheckRow({
        organizationId,
        document,
        priority: priorityByDocument.get(document.matched_to),
        checkedAt,
      }),
    ),
    ...resolved.documents_missing.map((document) =>
      buildMissingDocumentCheckRow({ organizationId, document, checkedAt }),
    ),
  ];
}

function mapPriorityForDocumentCheck(
  priority?: string,
): "required" | "recommended" {
  return priority === "recommended" ? "recommended" : "required";
}

function buildFoundDocumentCheckRow({
  organizationId,
  document,
  priority,
  checkedAt,
}: {
  organizationId: string;
  document: ResolvedDocumentFound;
  priority?: string;
  checkedAt: string;
}): ResolvedOfstedDocumentCheckRow {
  const inspection = buildWebsiteInspectionDetail(document);

  return {
    organization_id: organizationId,
    connection_id: null,
    evaluation_area: document.area,
    expected_document: document.matched_to,
    found: true,
    found_filename: document.name,
    found_path: document.evidence_url || document.path || null,
    found_modified_at: null,
    priority: mapPriorityForDocumentCheck(priority),
    checked_at: checkedAt,
    inspection_verdict: inspection?.rating ?? null,
    inspection_summary: inspection?.summary ?? null,
    inspection_actions:
      inspection?.actions_required?.map((action) => action.action) ?? null,
    inspection_detail: inspection,
    inspected_at: inspection ? checkedAt : null,
  };
}

function buildMissingDocumentCheckRow({
  organizationId,
  document,
  checkedAt,
}: {
  organizationId: string;
  document: ResolvedDocumentMissing;
  checkedAt: string;
}): ResolvedOfstedDocumentCheckRow {
  return {
    organization_id: organizationId,
    connection_id: null,
    evaluation_area: document.area,
    expected_document: document.expected_name,
    found: false,
    found_filename: null,
    found_path: null,
    found_modified_at: null,
    priority: mapPriorityForDocumentCheck(document.priority),
    checked_at: checkedAt,
    inspection_verdict: null,
    inspection_summary: null,
    inspection_actions: null,
    inspection_detail: null,
    inspected_at: null,
  };
}

function buildWebsiteInspectionDetail(
  document: ResolvedDocumentFound,
): WebsiteInspectionDetail | null {
  if (document.source === "drive") return null;

  if (
    document.source === "website_document" &&
    document.compliance_score === null &&
    document.quality_score === null
  ) {
    return null;
  }

  const passed = document.readiness_status === "ready";
  const score = document.compliance_score ?? 0;
  const gaps = document.gaps.length > 0 ? document.gaps : document.red_flags;
  const recommendations =
    document.recommendations.length > 0
      ? document.recommendations
      : document.action_required
        ? [
            `Review ${document.matched_to} and update the published website evidence.`,
          ]
        : [];
  const current = !["outdated", "possibly_outdated"].includes(
    document.currency_status ?? "",
  );
  const policyReview = document.policy_review;
  const reviewCheckpoint = policyReview
    ? [
        {
          checkpoint: "Policy review schedule captured",
          met: true,
          evidence: `Review due ${policyReview.date_found}; reminder due ${formatDateOnly(policyReview.reminder_due_at)}.`,
          severity: "important" as const,
        },
      ]
    : [];

  return {
    rating: passed ? "expected_standard" : "needs_attention",
    confidence: passed ? "high" : "medium",
    summary: passed
      ? `${document.matched_to} was found on the website and met the current website compliance checks.`
      : `${document.matched_to} was found on the website but needs review (${document.website_status ?? "needs review"}${score ? `, score ${score}%` : ""}).`,
    actions_required: recommendations.map((action) => ({
      action,
      priority: document.red_flags.length > 0 ? "high" : "medium",
      rationale: "Generated from the latest website compliance scan.",
      sef_impact:
        "Keep the published evidence trail accurate before inspection.",
    })),
    checkpoint_results: [
      {
        checkpoint: "Published website evidence found",
        met: true,
        evidence: document.evidence_url ?? document.found_on_url ?? document.name,
        severity: "important",
      },
      ...reviewCheckpoint,
      ...gaps.map((gap) => ({
        checkpoint: gap,
        met: false,
        evidence: "Website compliance scan",
        severity: document.red_flags.includes(gap)
          ? ("critical" as const)
          : ("important" as const),
      })),
    ],
    red_flags: document.red_flags,
    date_check: {
      is_current: current,
      date_found: policyReview?.date_found ?? document.currency_status ?? null,
      review_due_at: policyReview?.review_due_at ?? null,
      reminder_due_at: policyReview?.reminder_due_at ?? null,
      reminder_lead_months: policyReview?.reminder_lead_months ?? null,
      note:
        policyReview?.review_note ??
        (document.currency_status
          ? `Website scan currency status: ${document.currency_status}`
          : "No explicit renewal date was extracted."),
    },
    legislation_check: {
      references_current: document.red_flags.length === 0,
      missing_references: document.red_flags,
    },
    sef_contribution:
      "Website-published statutory evidence has been checked and linked into the Ofsted readiness evidence trail.",
  };
}

async function syncSafeguardingActionDrafts({
  supabase,
  organizationId,
  checkedAt,
}: {
  supabase: ReturnType<typeof createServiceRoleClient>;
  organizationId: string;
  checkedAt: string;
}): Promise<void> {
  const { data, error } = await supabase
    .from("ofsted_document_checks")
    .select(
      "id,evaluation_area,expected_document,found,found_filename,found_path,inspection_detail",
    )
    .eq("organization_id", organizationId)
    .eq("evaluation_area", "Safeguarding");

  if (error) {
    console.warn(
      "[Ofsted Document Check] Could not load safeguarding checks for tasks:",
      error.message,
    );
    return;
  }

  const drafts = buildSafeguardingActionDrafts(data ?? [], {
    today: checkedAt.slice(0, 10),
  });
  if (drafts.length === 0) return;

  for (const draft of drafts) {
    const { data: existing } = await supabase
      .from("actions")
      .select("id,user_status")
      .eq("organization_id", organizationId)
      .eq("source", draft.source)
      .eq("source_record_id", draft.source_record_id)
      .eq("source_table_name", draft.source_table_name)
      .maybeSingle();

    const payload = {
      organization_id: organizationId,
      title: draft.title,
      description: draft.description,
      success_criteria: draft.success_criteria ?? null,
      framework_type: draft.framework_type,
      category_id: draft.category_id,
      subcategory_id: draft.subcategory_id,
      module: draft.module,
      task_type: draft.task_type,
      priority: draft.priority,
      status: draft.status,
      user_status: draft.user_status,
      ai_status: draft.ai_status,
      due_date: draft.due_date,
      source: draft.source,
      route_path: draft.route_path,
      source_record_id: draft.source_record_id,
      source_table_name: draft.source_table_name,
      linked_evidence: draft.linked_evidence,
      checklist: draft.checklist,
      approval_status: draft.approval_status,
      updated_at: checkedAt,
    };

    if (existing && !["complete", "cancelled"].includes(existing.user_status)) {
      const { error: updateError } = await supabase
        .from("actions")
        .update(payload)
        .eq("id", existing.id);
      if (updateError) {
        console.warn(
          "[Ofsted Document Check] Could not update safeguarding task:",
          updateError.message,
        );
      }
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("actions")
      .insert({
        ...payload,
        evidence_count: draft.linked_evidence.length,
        chase_count: 0,
      })
      .select("id")
      .single();

    if (insertError) {
      console.warn(
        "[Ofsted Document Check] Could not create safeguarding task:",
        insertError.message,
      );
      continue;
    }

    if (inserted?.id) {
      await supabase.from("action_status_history").insert({
        action_id: inserted.id,
        organization_id: organizationId,
        to_status: draft.user_status,
        status_type: "user",
        changed_by: null,
        changed_by_type: "system",
      });
    }
  }
}

function formatDateOnly(dateOnly: string): string {
  return new Date(`${dateOnly}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
