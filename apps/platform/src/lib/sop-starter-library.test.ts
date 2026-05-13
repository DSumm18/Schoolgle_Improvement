import { describe, expect, it } from "vitest";
import {
  getBuiltInSopTemplate,
  getRecommendedSopsForPolicy,
  listBuiltInSopTemplates,
  mergeBuiltInSopTemplates,
  toSopTemplateSeed,
} from "./sop-starter-library";

describe("SOP starter library", () => {
  it("provides a robust starter library across operational domains", () => {
    const templates = listBuiltInSopTemplates();

    expect(templates.length).toBeGreaterThanOrEqual(20);
    expect(templates.some((template) => template.category === "estates")).toBe(true);
    expect(templates.some((template) => template.category === "safeguarding")).toBe(true);
    expect(templates.some((template) => template.category === "compliance")).toBe(true);
    expect(
      templates.every(
        (template) =>
          template.steps.length >= 4 &&
          template.setup_questions.length >= 3 &&
          template.source_refs.length >= 1 &&
          template.visual_flow.length >= 4,
      ),
    ).toBe(true);
  });

  it("links policy requirements to practical SOP starters", () => {
    expect(getRecommendedSopsForPolicy("health-safety-policy").length).toBeGreaterThanOrEqual(7);
    expect(getRecommendedSopsForPolicy("child-protection-safeguarding").length).toBeGreaterThanOrEqual(4);
    expect(getRecommendedSopsForPolicy("behaviour-policy").map((sop) => sop.template_id)).toContain("behaviour_incident_response");
    expect(getRecommendedSopsForPolicy("attendance-policy").map((sop) => sop.template_id)).toContain("attendance_concern_support");
    expect(getRecommendedSopsForPolicy("send-policy").map((sop) => sop.template_id)).toContain("send_graduated_response_review");
    expect(getRecommendedSopsForPolicy("data-protection-policy").map((sop) => sop.template_id)).toContain("data_breach_triage");
    expect(getRecommendedSopsForPolicy("complaints-procedure").map((sop) => sop.template_id)).toContain("complaint_intake");
  });

  it("can seed a built-in template into the existing SOP database schema", () => {
    const template = getBuiltInSopTemplate("legionella_monitoring");

    expect(template).toBeTruthy();
    const seed = toSopTemplateSeed(template!);

    expect(seed).toEqual(
      expect.objectContaining({
        template_id: "legionella_monitoring",
        category: "estates",
        frequency: "weekly",
        is_active: true,
      }),
    );
    expect(seed).not.toHaveProperty("setup_questions");
    expect(seed.steps.length).toBeGreaterThanOrEqual(4);
  });

  it("merges database templates without losing Schoolgle metadata", () => {
    const merged = mergeBuiltInSopTemplates([
      {
        id: "db-legionella",
        template_id: "legionella_monitoring",
        name: "Local Legionella Monitoring",
        description: "Local override",
        category: "estates",
        frequency: "weekly",
        steps: [],
        estimated_time_minutes: 15,
        owner_role: "caretaker",
        is_active: true,
      },
    ]);
    const legionella = merged.find(
      (template) => template.template_id === "legionella_monitoring",
    );

    expect(legionella?.name).toBe("Local Legionella Monitoring");
    expect(legionella?.source).toBe("schoolgle_builtin");
    expect(legionella?.setup_questions.length).toBeGreaterThanOrEqual(3);
    expect(legionella?.source_refs.some((source) => source.url.includes("hse.gov.uk"))).toBe(true);

    const localOnly = mergeBuiltInSopTemplates([
      {
        id: "db-custom",
        template_id: "local_keyholder_handover",
        name: "Local Keyholder Handover",
        description: "School-defined SOP",
        category: "estates",
        frequency: "ad_hoc",
        steps: [],
        estimated_time_minutes: 10,
        owner_role: "business_manager",
        is_active: true,
      },
    ]).find((template) => template.template_id === "local_keyholder_handover");

    expect(localOnly?.source).toBe("database");
  });
});
