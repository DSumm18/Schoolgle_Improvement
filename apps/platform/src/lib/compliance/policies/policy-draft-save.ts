export { POLICY_GENERATED_DRAFTS_FOLDER } from "@/lib/schoolgle-connector";
export const POLICY_DRAFT_WORD_MIME_TYPE = "application/msword";

export type PolicyDraftSaveInput = {
  requirementId: string;
  title: string;
  formattedHtml: string;
  downloadFileName: string;
};

export type PolicyDraftSaveValidation =
  | { ok: true; value: PolicyDraftSaveInput }
  | { ok: false; error: string; status: number };

export function validatePolicyDraftSaveInput(
  body: unknown,
): PolicyDraftSaveValidation {
  const input = body as Partial<PolicyDraftSaveInput> | null;

  if (!input || typeof input !== "object") {
    return { ok: false, error: "Missing draft payload", status: 400 };
  }

  if (input.requirementId !== "behaviour-policy") {
    return {
      ok: false,
      error: "No Drive draft pack is available for this policy yet",
      status: 404,
    };
  }

  if (!input.title || typeof input.title !== "string") {
    return { ok: false, error: "Missing draft title", status: 400 };
  }

  if (
    !input.formattedHtml ||
    typeof input.formattedHtml !== "string" ||
    input.formattedHtml.length < 500
  ) {
    return { ok: false, error: "Missing formatted policy draft", status: 400 };
  }

  if (input.formattedHtml.length > 1_500_000) {
    return { ok: false, error: "Policy draft is too large to save", status: 413 };
  }

  if (!input.formattedHtml.includes("schoolgle-policy-cover")) {
    return {
      ok: false,
      error: "Only Schoolgle-formatted policy drafts can be saved",
      status: 400,
    };
  }

  if (!input.downloadFileName || typeof input.downloadFileName !== "string") {
    return { ok: false, error: "Missing draft file name", status: 400 };
  }

  return {
    ok: true,
    value: {
      requirementId: input.requirementId,
      title: input.title,
      formattedHtml: input.formattedHtml,
      downloadFileName: input.downloadFileName,
    },
  };
}

export function buildDrivePolicyDraftFileName(input: {
  downloadFileName: string;
  generatedAt?: Date;
}): string {
  const generatedAt = input.generatedAt || new Date();
  const stamp = generatedAt
    .toISOString()
    .slice(0, 16)
    .replace("T", "-")
    .replace(":", "");
  const baseName = input.downloadFileName
    .replace(/\.(doc|docx|html?)$/i, "")
    .replace(/[^a-zA-Z0-9._ -]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

  return `${baseName || "schoolgle-policy-draft"}-${stamp}.doc`;
}
