import { describe, expect, it } from "vitest";
import {
  buildSchoolglePolicyItemPayload,
  buildSchoolglePolicyVersionPayload,
  validateSchoolglePolicyDraftInput,
} from "./schoolgle-draft-version";

const formattedHtml = `<html><body><section class="schoolgle-policy-cover">${"x".repeat(
  520,
)}</section></body></html>`;

describe("Schoolgle managed policy draft versioning", () => {
  it("validates a Schoolgle-formatted draft for managed saving", () => {
    const result = validateSchoolglePolicyDraftInput({
      organizationId: "org-1",
      requirementId: "behaviour-policy",
      policyTitle: "Behaviour Policy",
      draftTitle: "Improved Behaviour Policy draft",
      formattedHtml,
      markdown: "# Behaviour Policy",
      sourceFileName: "Behaviour_Policy_2025-26.docx",
    });

    expect(result.ok).toBe(true);
  });

  it("builds a compliance item payload that keeps the Drive file as source evidence", () => {
    const payload = buildSchoolglePolicyItemPayload({
      requirementId: "behaviour-policy",
      policyTitle: "Behaviour Policy",
      sourceFileName: "Behaviour_Policy_2025-26.docx",
      approvalRoute: "Governing body",
      reviewCycle: "annual",
    });

    expect(payload.type).toBe("policy");
    expect(payload.title).toBe("Behaviour Policy");
    expect(payload.status).toBe("draft");
    expect(payload.metadata).toMatchObject({
      policyRequirementId: "behaviour-policy",
      sourceMode: "drive_original_schoolgle_managed_draft",
      sourceFileName: "Behaviour_Policy_2025-26.docx",
      currentSchoolgleVersion: "v1.0-draft",
    });
  });

  it("builds a v1.0 draft version payload with source checks and advisory status", () => {
    const payload = buildSchoolglePolicyVersionPayload({
      markdown: "# Behaviour Policy",
      formattedHtml,
      sources: [
        {
          id: "dfe-behaviour-in-schools-2024",
          title: "Behaviour in schools",
          authority: "dfe_advice",
          publisher: "Department for Education",
          url: "https://www.gov.uk/government/publications/behaviour-in-schools--2",
          lastChecked: "2026-05-01",
        },
      ],
      assumptions: ["This is a school-review draft, not legal advice."],
      changeSummary: "Created Schoolgle-managed v1.0 draft from source-backed Behaviour Policy pack.",
    });

    expect(payload.version_number).toBe(1);
    expect(payload.content_format).toBe("html");
    expect(payload.content_html).toContain("schoolgle-policy-cover");
    expect(payload.change_summary).toContain("v1.0 draft");
    expect(payload.metadata).toMatchObject({
      semanticVersion: "v1.0-draft",
      approvalStatus: "draft",
      advisoryOnly: true,
    });
    expect(payload.metadata.sourceChecks[0].publisher).toBe(
      "Department for Education",
    );
  });
});
