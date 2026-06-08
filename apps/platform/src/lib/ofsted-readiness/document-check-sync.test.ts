import { describe, expect, it } from "vitest";
import {
  buildOfstedDocumentCheckRows,
  type ResolvedOfstedDocumentCheckRow,
} from "./document-check-sync";
import type { ResolvedDocumentEvidenceResult } from "./policy-evidence-resolver";

describe("buildOfstedDocumentCheckRows", () => {
  it("turns resolved website evidence into saved document check rows", () => {
    const resolved: ResolvedDocumentEvidenceResult = {
      documents_found: [
        {
          name: "PAY SEND Policy.pdf",
          path: "https://drive.google.com/file/d/pay-send/view?usp=drive_web",
          area: "Inclusion",
          matched_to: "SEND Policy",
          source: "website_document",
          source_label: "Website document",
          evidence_url:
            "https://drive.google.com/file/d/pay-send/view?usp=drive_web",
          found_on_url: "https://grovehouseprimary.co.uk/policies-and-documents/",
          readiness_status: "ready",
          website_status: null,
          compliance_score: 100,
          quality_score: 100,
          currency_status: "current",
          evidence_quotes: ["Review date appears to be September 2027."],
          gaps: [],
          recommendations: [],
          red_flags: [],
          notes: [
            "Website document text was assessed against 11 SEND Policy checkpoints.",
            "11/11 content checkpoints met.",
            "Review date appears to be September 2027.",
          ],
          action_required: false,
          policy_review: {
            date_found: "September 2027",
            review_due_at: "2027-09-01",
            reminder_due_at: "2027-06-01",
            reminder_lead_months: 3,
            review_note: "Review date appears to be September 2027.",
            reminder_note:
              "Next review reminder should be scheduled for 1 Jun 2027.",
          },
        },
      ],
      documents_missing: [
        {
          expected_name: "SEND Register",
          area: "Inclusion",
          priority: "critical",
          reason: "Not found in the connected evidence folder.",
          website_expected: false,
          suggested_action: "Upload or link SEND Register.",
        },
      ],
      coverage_by_area: {
        Inclusion: { found: 1, expected: 2, percentage: 50 },
      },
      overall_coverage: 50,
      total_files_scanned: 0,
      total_website_sources_scanned: 1,
      action_required_count: 1,
    };

    const rows = buildOfstedDocumentCheckRows({
      organizationId: "org-1",
      resolved,
      checkedAt: "2026-05-22T08:00:00.000Z",
    }) as ResolvedOfstedDocumentCheckRow[];

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      organization_id: "org-1",
      evaluation_area: "Inclusion",
      expected_document: "SEND Policy",
      found: true,
      found_filename: "PAY SEND Policy.pdf",
      found_path: "https://drive.google.com/file/d/pay-send/view?usp=drive_web",
      inspection_verdict: "expected_standard",
      inspection_summary:
        "SEND Policy was found on the website and met the current website compliance checks.",
      inspected_at: "2026-05-22T08:00:00.000Z",
    });
    expect(rows[0].inspection_detail).toMatchObject({
      rating: "expected_standard",
      confidence: "high",
      summary:
        "SEND Policy was found on the website and met the current website compliance checks.",
      date_check: {
        is_current: true,
        date_found: "September 2027",
        review_due_at: "2027-09-01",
        reminder_due_at: "2027-06-01",
        reminder_lead_months: 3,
      },
    });
    expect(rows[1]).toMatchObject({
      organization_id: "org-1",
      evaluation_area: "Inclusion",
      expected_document: "SEND Register",
      found: false,
      inspection_detail: null,
    });
  });
});
