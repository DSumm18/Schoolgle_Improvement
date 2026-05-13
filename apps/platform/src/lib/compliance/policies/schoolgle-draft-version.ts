import type { PolicyQualitySource } from "./policy-quality-analyser";
import { getStarterPolicyRequirement } from "./packs/starter-policy-pack";

export type SchoolglePolicyDraftInput = {
  organizationId?: string;
  requirementId?: string;
  policyTitle?: string;
  draftTitle?: string;
  formattedHtml?: string;
  markdown?: string;
  sourceFileName?: string;
  approvalRoute?: string;
  reviewCycle?: string;
  sources?: PolicyQualitySource[];
  assumptions?: string[];
};

export type ValidSchoolglePolicyDraftInput = Required<
  Pick<
    SchoolglePolicyDraftInput,
    "requirementId" | "policyTitle" | "draftTitle" | "formattedHtml"
  >
> &
  Pick<
    SchoolglePolicyDraftInput,
    | "organizationId"
    | "markdown"
    | "sourceFileName"
    | "approvalRoute"
    | "reviewCycle"
    | "sources"
    | "assumptions"
  >;

export type SchoolglePolicyDraftValidation =
  | { ok: true; value: ValidSchoolglePolicyDraftInput }
  | { ok: false; error: string; status: number };

export function validateSchoolglePolicyDraftInput(
  body: unknown,
): SchoolglePolicyDraftValidation {
  const input = body as SchoolglePolicyDraftInput | null;

  if (!input || typeof input !== "object") {
    return { ok: false, error: "Missing policy draft payload", status: 400 };
  }

  if (!input.requirementId || !getStarterPolicyRequirement(input.requirementId)) {
    return {
      ok: false,
      error: "Unknown policy requirement",
      status: input.requirementId ? 404 : 400,
    };
  }

  if (!input.policyTitle || typeof input.policyTitle !== "string") {
    return { ok: false, error: "Missing policy title", status: 400 };
  }

  if (!input.draftTitle || typeof input.draftTitle !== "string") {
    return { ok: false, error: "Missing draft title", status: 400 };
  }

  if (
    !input.formattedHtml ||
    typeof input.formattedHtml !== "string" ||
    input.formattedHtml.length < 500
  ) {
    return { ok: false, error: "Missing formatted policy draft", status: 400 };
  }

  if (
    !input.formattedHtml.includes("schoolgle-policy-cover") &&
    !input.formattedHtml.includes("Schoolgle Managed Policy Draft")
  ) {
    return {
      ok: false,
      error: "Only Schoolgle-formatted policy drafts can be saved",
      status: 400,
    };
  }

  return {
    ok: true,
    value: {
      organizationId: input.organizationId,
      requirementId: input.requirementId,
      policyTitle: input.policyTitle,
      draftTitle: input.draftTitle,
      formattedHtml: input.formattedHtml,
      markdown: input.markdown,
      sourceFileName: input.sourceFileName,
      approvalRoute: input.approvalRoute,
      reviewCycle: input.reviewCycle,
      sources: input.sources || [],
      assumptions: input.assumptions || [],
    },
  };
}

export function buildSchoolglePolicyItemPayload(input: {
  requirementId: string;
  policyTitle: string;
  sourceFileName?: string;
  approvalRoute?: string;
  reviewCycle?: string;
}) {
  return {
    type: "policy",
    title: input.policyTitle,
    status: "draft",
    category: "school_custom",
    confidentiality_level: "public_internal",
    tags: ["schoolgle-managed", input.requirementId],
    metadata: {
      policyRequirementId: input.requirementId,
      sourceMode: "drive_original_schoolgle_managed_draft",
      sourceFileName: input.sourceFileName || null,
      approvalRoute: input.approvalRoute || null,
      reviewCycle: input.reviewCycle || "annual",
      currentSchoolgleVersion: "v1.0-draft",
      managedBy: "policy-manager",
    },
  };
}

export function buildSchoolglePolicyVersionPayload(input: {
  formattedHtml: string;
  markdown?: string;
  sources?: PolicyQualitySource[];
  assumptions?: string[];
  changeSummary?: string;
}) {
  return {
    version_number: 1,
    content_format: "html",
    content_html: input.formattedHtml,
    content_md: input.markdown,
    change_summary:
      input.changeSummary ||
      "Created Schoolgle-managed v1.0 draft from source-backed policy pack.",
    metadata: {
      semanticVersion: "v1.0-draft",
      approvalStatus: "draft",
      advisoryOnly: true,
      sourceChecks: input.sources || [],
      assumptions: input.assumptions || [],
      createdByWorkflow: "policy-manager-schoolgle-draft",
    },
  };
}
