import { describe, expect, it } from "vitest";
import {
  buildPolicyAdvisoryTask,
  buildPolicyAdvisoryTaskRequest,
} from "./policy-advisory-task";
import type { PolicyRequirementMatch } from "./policy-matcher";
import type { PolicyQualityCheck } from "./policy-quality-analyser";

const match = {
  requirement: {
    id: "behaviour-policy",
    canonicalName: "Behaviour Policy",
    domain: "behaviour_attendance",
    level: "statutory",
    aliases: [],
    reviewCycle: "annual",
    approvalHint: "Governing body",
  },
  status: "matched",
  score: 100,
  matchedAlias: "Behaviour Policy",
  matchedFile: {
    id: "drive-file-1",
    name: "Behaviour_Policy_2025-26.docx",
    webViewLink: "https://docs.google.com/document/d/drive-file-1/edit",
    folderPath: "Policies",
  },
} satisfies PolicyRequirementMatch;

const check = {
  status: "missing",
  score: 0,
  evidence: [],
  rule: {
    id: "send-equality",
    title: "SEND, equality and reasonable adjustments",
    description:
      "Shows how the policy accounts for SEND, disability, equality duties and reasonable adjustments.",
    severity: "statutory",
    weight: 14,
    missingAction:
      "Add SEND/equality wording explaining reasonable adjustments and individual circumstances.",
    keywordGroups: [],
    sourceRefs: [
      {
        id: "equality-act-2010",
        title: "Equality Act 2010",
        authority: "legislation",
        publisher: "UK Government",
        url: "https://www.legislation.gov.uk/ukpga/2010/15/contents",
        lastChecked: "2026-05-01",
      },
    ],
  },
} satisfies PolicyQualityCheck;

describe("buildPolicyAdvisoryTask", () => {
  it("builds a user-controlled task payload from a policy advisory gap", () => {
    const task = buildPolicyAdvisoryTask({ match, check });

    expect(task.title).toBe(
      "Update Behaviour Policy: SEND, equality and reasonable adjustments",
    );
    expect(task.task_type).toBe("compliance");
    expect(task.department).toBe("senior_leadership");
    expect(task.priority).toBe("high");
    expect(task.source).toBe("policy_manager");
    expect(task.route_path).toBe("/dashboard/compliance/policies");
    expect(task.source_record_id).toBe("behaviour-policy:send-equality");
    expect(task.linked_evidence).toEqual([
      {
        documentId: "drive-file-1",
        documentName: "Behaviour_Policy_2025-26.docx",
        type: "url",
        title: "Behaviour_Policy_2025-26.docx",
        url: "https://docs.google.com/document/d/drive-file-1/edit",
      },
    ]);
    expect(task.description).toContain("Official sources checked");
    expect(task.description).toContain("Equality Act 2010");
    expect(task.checklist?.map((item) => item.title)).toEqual([
      "Review the current Behaviour Policy",
      "Update the policy section for SEND, equality and reasonable adjustments",
      "Check the update against the cited official sources",
      "Send for approval via Governing body",
    ]);
  });

  it("includes organizationId in the task request body for protected routes", () => {
    const request = buildPolicyAdvisoryTaskRequest({
      organizationId: "org-123",
      match,
      check,
    });

    expect(request.organizationId).toBe("org-123");
    expect(request.task.source).toBe("policy_manager");
  });
});
