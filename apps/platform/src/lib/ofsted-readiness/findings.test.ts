import { describe, expect, it } from "vitest";
import {
  buildActionFormFromFinding,
  buildDocumentInspectionFindingDraft,
  buildDocumentInspectionFindingSourceKey,
  buildWebsiteFindingDraft,
  buildWebsiteFindingSourceKey,
} from "./findings";

const statutoryRequirement = {
  key: "safeguarding_policy",
  name: "Safeguarding / Child Protection Policy",
  severity: "statutory" as const,
  category: "safeguarding",
  legislation: ["Keeping Children Safe in Education 2025"],
  updateFrequency: "annually" as const,
  ofstedCategory: "safeguarding",
  ofstedSubcategory: "safeguarding-policy",
};

describe("buildWebsiteFindingDraft", () => {
  it("creates a required action when a statutory requirement is missing", () => {
    const draft = buildWebsiteFindingDraft({
      sessionId: "session-1",
      assessment: {
        requirement_key: "safeguarding_policy",
        requirement_name: "Safeguarding / Child Protection Policy",
        category: "safeguarding",
        status: "not_found",
        compliance_score: 0,
        quality_score: 0,
        clarity_score: 0,
        evidence_urls: [],
        evidence_quotes: [],
        gaps: ["Safeguarding policy was not found on the school website"],
        recommendations: ["Publish the safeguarding policy"],
        red_flags: ["Missing statutory requirement"],
        confidence: 0.9,
      },
      requirement: statutoryRequirement,
    });

    expect(draft).toMatchObject({
      title: "Missing: Safeguarding / Child Protection Policy",
      finding_type: "missing",
      severity: "critical",
      action_level: "required_action",
      status: "identified",
      source_type: "website_scan",
      framework_type: "ofsted",
      category_id: "safeguarding",
      subcategory_id: "safeguarding-policy",
      rule_key: "safeguarding_policy",
      rule_version: "2026.04",
      recommended_task_title:
        "Publish or link Safeguarding / Child Protection Policy",
    });
    expect(draft.checklist).toContain("Publish the safeguarding policy");
    expect(draft.source_key).toBe(
      buildWebsiteFindingSourceKey("session-1", "safeguarding_policy"),
    );
  });

  it("creates a recommended action when a present item is weak", () => {
    const draft = buildWebsiteFindingDraft({
      sessionId: "session-2",
      assessment: {
        requirement_key: "safeguarding_policy",
        requirement_name: "Safeguarding / Child Protection Policy",
        category: "safeguarding",
        status: "partial",
        compliance_score: 58,
        quality_score: 2,
        clarity_score: 3,
        evidence_urls: ["https://school.example/policies/safeguarding.pdf"],
        evidence_quotes: ["Policy references KCSIE 2024."],
        gaps: ["Policy references outdated KCSIE edition"],
        recommendations: ["Update references to KCSIE 2025"],
        red_flags: [],
        confidence: 0.74,
      },
      requirement: statutoryRequirement,
    });

    expect(draft).toMatchObject({
      title: "Improve: Safeguarding / Child Protection Policy",
      finding_type: "quality_gap",
      severity: "high",
      action_level: "recommended_action",
      evidence_url: "https://school.example/policies/safeguarding.pdf",
      recommended_task_title:
        "Improve Safeguarding / Child Protection Policy for Ofsted readiness",
    });
  });

  it("creates a suggested improvement for compliant items with improvement advice", () => {
    const draft = buildWebsiteFindingDraft({
      sessionId: "session-3",
      assessment: {
        requirement_key: "safeguarding_policy",
        requirement_name: "Safeguarding / Child Protection Policy",
        category: "safeguarding",
        status: "compliant",
        compliance_score: 88,
        quality_score: 4,
        clarity_score: 4,
        evidence_urls: ["https://school.example/safeguarding"],
        evidence_quotes: ["DSL and deputy DSLs are named."],
        gaps: [],
        recommendations: ["Add a clearer parent reporting route"],
        red_flags: [],
        confidence: 0.88,
      },
      requirement: statutoryRequirement,
    });

    expect(draft).toMatchObject({
      title: "Strengthen: Safeguarding / Child Protection Policy",
      finding_type: "improvement",
      severity: "low",
      action_level: "suggested_improvement",
    });
  });

  it("returns null when no action or improvement is needed", () => {
    const draft = buildWebsiteFindingDraft({
      sessionId: "session-4",
      assessment: {
        requirement_key: "safeguarding_policy",
        requirement_name: "Safeguarding / Child Protection Policy",
        category: "safeguarding",
        status: "compliant",
        compliance_score: 96,
        quality_score: 5,
        clarity_score: 5,
        evidence_urls: ["https://school.example/safeguarding"],
        evidence_quotes: [],
        gaps: [],
        recommendations: [],
        red_flags: [],
        confidence: 0.95,
      },
      requirement: statutoryRequirement,
    });

    expect(draft).toBeNull();
  });
});

describe("buildActionFormFromFinding", () => {
  it("creates a routed Ofsted task linked back to the source finding", () => {
    const task = buildActionFormFromFinding({
      id: "finding-123",
      title: "Missing: Safeguarding / Child Protection Policy",
      recommended_task_title:
        "Publish or link Safeguarding / Child Protection Policy",
      recommended_task_description:
        "Safeguarding policy was not found. Source guidance: KCSIE 2025.",
      category_id: "safeguarding",
      subcategory_id: "safeguarding-policy",
      severity: "critical",
      checklist: [
        "Publish the safeguarding policy",
        "Check the named DSL is current",
      ],
      evidence_url: "https://school.example/safeguarding",
    });

    expect(task).toMatchObject({
      title: "Publish or link Safeguarding / Child Protection Policy",
      description:
        "Safeguarding policy was not found. Source guidance: KCSIE 2025.",
      category_id: "safeguarding",
      subcategory_id: "safeguarding-policy",
      module: "ofsted-readiness",
      task_type: "ofsted",
      priority: "critical",
      status: "not_started",
      created_from_finding_id: "finding-123",
      source_record_id: "finding-123",
      source_table_name: "ofsted_findings",
      route_path: "/dashboard/ofsted-readiness?findingId=finding-123",
    });
    expect(task.checklist).toEqual([
      { title: "Publish the safeguarding policy" },
      { title: "Check the named DSL is current" },
    ]);
    expect(task.linked_evidence).toEqual([
      {
        type: "url",
        title: "Source evidence",
        url: "https://school.example/safeguarding",
      },
    ]);
  });
});

describe("buildDocumentInspectionFindingDraft", () => {
  it("creates a routed finding from a weak connected Drive document", () => {
    const draft = buildDocumentInspectionFindingDraft({
      checkId: "check-123",
      driveFileId: "drive-file-123",
      fileName: "Safeguarding_and_Child_Protection_Policy_2025-26.docx",
      evaluationArea: "Safeguarding",
      expectedDocument: "safeguarding, child protection, KCSIE",
      foundModifiedAt: "2026-05-01T09:00:00.000Z",
      inspection: {
        rating: "needs_attention",
        confidence: "high",
        summary:
          "The policy is present but does not fully evidence current filtering and monitoring arrangements.",
        checkpoint_results: [
          {
            checkpoint: "Filtering and monitoring responsibilities",
            met: false,
            evidence: "No named responsibility or monitoring cycle found",
            severity: "important",
          },
        ],
        legislation_check: {
          references_current: false,
          legislation_found: ["KCSIE 2024"],
          missing_references: ["KCSIE 2025"],
        },
        actions_required: [
          {
            action: "Update the policy to reference KCSIE 2025 and name filtering and monitoring responsibilities",
            priority: "high",
            rationale: "Inspectors will expect current statutory safeguarding references",
            sef_impact: "Strengthens the safeguarding evidence trail",
          },
        ],
        red_flags: [],
      },
    });

    expect(draft).toMatchObject({
      source_key: buildDocumentInspectionFindingSourceKey("check-123"),
      source_type: "document_inspection",
      source_scan_id: null,
      finding_type: "quality_gap",
      severity: "high",
      action_level: "recommended_action",
      category_id: "safeguarding",
      score: 50,
      confidence: 0.85,
      evidence_url: "https://drive.google.com/open?id=drive-file-123",
      recommended_task_title:
        "Improve Safeguarding_and_Child_Protection_Policy_2025-26.docx for Ofsted readiness",
    });
    expect(draft?.checklist).toContain(
      "Update the policy to reference KCSIE 2025 and name filtering and monitoring responsibilities",
    );
    expect(draft?.gaps).toContain(
      "Missing current guidance reference: KCSIE 2025",
    );
  });

  it("returns null for a strong document with no required action", () => {
    const draft = buildDocumentInspectionFindingDraft({
      checkId: "check-456",
      driveFileId: "drive-file-456",
      fileName: "Current_PE_Sports_Premium_2024-25.pdf",
      evaluationArea: "Personal Development and Well-being",
      expectedDocument: "sport premium",
      inspection: {
        rating: "expected_standard",
        confidence: "medium",
        summary: "The document is current and suitable for the current school year.",
        checkpoint_results: [
          {
            checkpoint: "Published statement",
            met: true,
            evidence: "2024-25 grant report published",
            severity: "minor",
          },
        ],
        red_flags: [],
        actions_required: [],
      },
    });

    expect(draft).toBeNull();
  });
});
