import { describe, expect, it } from "vitest";
import { buildSafeguardingActionDrafts } from "./safeguarding-tasks";

describe("buildSafeguardingActionDrafts", () => {
  it("creates a future policy review task from an in-date safeguarding policy", () => {
    const drafts = buildSafeguardingActionDrafts(
      [
        {
          id: "check-1",
          evaluation_area: "Safeguarding",
          expected_document: "Safeguarding Policy",
          found: true,
          found_filename: "PAY Safeguarding Policy.pdf",
          found_path: "https://drive.google.com/file/d/pay-safeguarding/view",
          inspection_detail: {
            date_check: {
              is_current: true,
              date_found: "September 2027",
              review_due_at: "2027-09-01",
              reminder_due_at: "2027-06-01",
              reminder_lead_months: 3,
              note: "Review date appears to be September 2027.",
            },
          },
        },
      ],
      { today: "2026-05-22" },
    );

    expect(drafts).toEqual([
      expect.objectContaining({
        source_key: "safeguarding_policy_review:check-1",
        title: "Review Safeguarding Policy before September 2027",
        due_date: "2027-06-01",
        priority: "medium",
        approval_status: "pending_approval",
        task_type: "safeguarding",
        source_record_id: "check-1",
        source_table_name: "ofsted_document_checks",
      }),
    ]);
    expect(drafts[0].linked_evidence).toEqual([
      {
        type: "url",
        title: "Current safeguarding policy",
        url: "https://drive.google.com/file/d/pay-safeguarding/view",
      },
    ]);
  });

  it("creates immediate safeguarding evidence tasks for missing SCR, DSL training and safer recruitment", () => {
    const drafts = buildSafeguardingActionDrafts(
      [
        {
          id: "scr-check",
          evaluation_area: "Safeguarding",
          expected_document: "Single Central Record",
          found: false,
        },
        {
          id: "dsl-check",
          evaluation_area: "Safeguarding",
          expected_document: "DSL Training",
          found: false,
        },
        {
          id: "safer-check",
          evaluation_area: "Safeguarding",
          expected_document: "Safer Recruitment",
          found: false,
        },
      ],
      { today: "2026-05-22" },
    );

    expect(drafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source_key: "safeguarding_gap:scr-check",
          title: "Link or upload Single Central Record evidence",
          due_date: "2026-05-29",
          priority: "critical",
        }),
        expect.objectContaining({
          source_key: "safeguarding_gap:dsl-check",
          title: "Add DSL training evidence and expiry dates",
          due_date: "2026-06-05",
          priority: "high",
        }),
        expect.objectContaining({
          source_key: "safeguarding_gap:safer-check",
          title: "Evidence safer recruitment checks",
          due_date: "2026-06-05",
          priority: "high",
        }),
      ]),
    );
  });
});
