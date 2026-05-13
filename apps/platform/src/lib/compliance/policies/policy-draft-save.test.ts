import { describe, expect, it } from "vitest";
import {
  POLICY_GENERATED_DRAFTS_FOLDER,
  buildDrivePolicyDraftFileName,
  validatePolicyDraftSaveInput,
} from "./policy-draft-save";

describe("policy draft saving", () => {
  it("uses a dedicated generated drafts folder", () => {
    expect(POLICY_GENERATED_DRAFTS_FOLDER).toBe(
      "Drafts - Schoolgle Generated",
    );
  });

  it("validates only Schoolgle-formatted behaviour policy drafts", () => {
    const result = validatePolicyDraftSaveInput({
      requirementId: "behaviour-policy",
      title: "Improved Behaviour Policy draft",
      formattedHtml: `<html><body><section class="schoolgle-policy-cover">${"x".repeat(
        520,
      )}</section></body></html>`,
      downloadFileName: "Behaviour Policy Draft.doc",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects draft saves that are not tied to an available pack", () => {
    const result = validatePolicyDraftSaveInput({
      requirementId: "attendance-policy",
      title: "Attendance Policy draft",
      formattedHtml: `<html><body><section class="schoolgle-policy-cover">${"x".repeat(
        520,
      )}</section></body></html>`,
      downloadFileName: "Attendance Policy Draft.doc",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("creates versioned Word-compatible draft file names", () => {
    expect(
      buildDrivePolicyDraftFileName({
        downloadFileName:
          "rawdon-st-peters-c-of-e-primary-school-behaviour-policy-draft.doc",
        generatedAt: new Date("2026-05-01T14:35:00.000Z"),
      }),
    ).toBe(
      "rawdon-st-peters-c-of-e-primary-school-behaviour-policy-draft-2026-05-01-1435.doc",
    );
  });
});
