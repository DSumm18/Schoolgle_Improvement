import { describe, expect, it } from "vitest";

import {
  buildCustomMeetingTemplatePayload,
  cloneMeetingTemplateToCustomPayload,
  parseDiscussionItems,
} from "./custom-template-builder";
import { DEFAULT_MEETING_TEMPLATES } from "./meeting-template-catalog";

describe("meeting template catalogue", () => {
  it("includes cross-department default templates", () => {
    const categories = new Set(DEFAULT_MEETING_TEMPLATES.map((t) => t.category));

    expect(categories).toEqual(
      expect.objectContaining({
        has: expect.any(Function),
      }),
    );
    expect(categories.has("hr")).toBe(true);
    expect(categories.has("governance")).toBe(true);
    expect(categories.has("safeguarding")).toBe(true);
    expect(categories.has("send")).toBe(true);
    expect(categories.has("operational")).toBe(true);
  });

  it("includes assurance-style estates and finance templates", () => {
    const names = DEFAULT_MEETING_TEMPLATES.map((t) => t.name);

    expect(names).toContain("Estates Contractor Pre-start Assurance");
    expect(names).toContain("Finance Budget Monitoring Review");
  });
});

describe("custom template builder", () => {
  it("turns user discussion lines into checklist items", () => {
    expect(parseDiscussionItems("Confirm asbestos register\n\nAgree actions"))
      .toEqual(["Confirm asbestos register", "Agree actions"]);
  });

  it("builds a reusable custom meeting template payload", () => {
    const payload = buildCustomMeetingTemplatePayload({
      name: "My site meeting",
      category: "operational",
      description: "Weekly contractor catch-up",
      discussionItemsText: "Confirm risks\nAgree owners",
      policyRefsText: "CDM 2015\nSchool contractor policy",
    });

    expect(payload).toMatchObject({
      name: "My site meeting",
      category: "operational",
      is_custom: true,
      compliance_items: [
        {
          phrase: "Confirm risks",
          category: "Discussion point",
          is_critical: true,
          order_index: 0,
        },
        {
          phrase: "Agree owners",
          category: "Discussion point",
          is_critical: true,
          order_index: 1,
        },
      ],
      preparation_guide: {
        policy_refs: ["CDM 2015", "School contractor policy"],
      },
    });
  });

  it("clones a standard template while preserving scripts and preparation prompts", () => {
    const standardTemplate = DEFAULT_MEETING_TEMPLATES.find(
      (template) => template.name === "Estates Contractor Pre-start Assurance",
    );

    expect(standardTemplate).toBeDefined();

    const payload = cloneMeetingTemplateToCustomPayload({
      template: {
        ...standardTemplate!,
        id: "standard-template-id",
        is_custom: false,
        organization_id: null,
        created_by: null,
        created_at: "2026-04-27T00:00:00.000Z",
        updated_at: "2026-04-27T00:00:00.000Z",
      },
      name: "Trust contractor pre-start",
      description: "Tweaked for our trust estates provider",
      discussionItemsText: "Confirm DBS arrangements\nConfirm site segregation",
      policyRefsText: "Trust contractor handbook",
    });

    expect(payload.name).toBe("Trust contractor pre-start");
    expect(payload.is_custom).toBe(true);
    expect(payload.opening_script).toEqual(standardTemplate!.opening_script);
    expect(payload.closing_script).toEqual(standardTemplate!.closing_script);
    expect(payload.preparation_guide.context_prompts).toEqual(
      standardTemplate!.preparation_guide.context_prompts,
    );
    expect(payload.preparation_guide.policy_refs).toEqual([
      "Trust contractor handbook",
    ]);
    expect(payload.compliance_items.map((item) => item.phrase)).toEqual([
      "Confirm DBS arrangements",
      "Confirm site segregation",
    ]);
  });
});
