import { describe, expect, it } from "vitest";
import {
  buildStrategicPlanInsert,
  buildStrategicPlanItemInsert,
  mapStrategicPlanItemForUi,
  mapStrategicPlanForUi,
} from "./estate-strategy";

describe("estate strategy mapping", () => {
  it("defaults estate strategy plans to a three-year capital plan", () => {
    const insert = buildStrategicPlanInsert({
      organizationId: "org-1",
      title: "Estate Strategy",
      academicYearStart: "2026/2027",
      planType: "estates",
    });

    expect(insert).toMatchObject({
      organization_id: "org-1",
      title: "Estate Strategy",
      plan_type: "estates",
      start_year: "2026/2027",
      end_year: "2028/2029",
      status: "draft",
    });
  });

  it("maps database plans to the existing strategic plan UI contract", () => {
    const plan = mapStrategicPlanForUi(
      {
        id: "plan-1",
        title: "Estate Strategy",
        plan_type: "estates",
        start_year: "2026/2027",
        end_year: "2028/2029",
        created_at: "2026-04-27T00:00:00Z",
      },
      [
        { estimated_cost: 100_000 },
        { estimated_cost: 45_000 },
        { estimated_cost: null },
      ],
    );

    expect(plan.type).toBe("estates");
    expect(plan.academic_year_start).toBe("2026/2027");
    expect(plan.duration_years).toBe(3);
    expect(plan.total_estimated_cost).toBe(145_000);
    expect(plan.item_count).toBe(3);
  });

  it("builds strategy item inserts using the actual database schema", () => {
    const item = buildStrategicPlanItemInsert({
      organizationId: "org-1",
      planId: "plan-1",
      title: "Replace serviceable boiler",
      description: "End of life but currently serviceable.",
      estimatedCost: 100_000,
      year: 3,
      riskScore: 20,
      isStatutory: false,
      riskRegisterId: "risk-1",
      sourceModule: "estates",
      sourceEntityId: "finding-1",
    });

    expect(item).toMatchObject({
      organization_id: "org-1",
      strategic_plan_id: "plan-1",
      title: "Replace serviceable boiler",
      category: "estates",
      year: 3,
      estimated_cost: 100_000,
      risk_score: 20,
      is_statutory: false,
      risk_register_id: "risk-1",
      source_module: "estates",
      source_entity_id: "finding-1",
    });
  });

  it("maps planned database items back to draft UI items", () => {
    const item = mapStrategicPlanItemForUi({
      id: "item-1",
      title: "Roof overlay",
      description: "Membrane life-expired.",
      estimated_cost: 45_000,
      priority_band: "should",
      status: "planned",
      risk_score: 15,
      is_statutory: false,
      risk_register_id: "risk-1",
      sdp_priority_id: null,
      priority_rank: 2,
    });

    expect(item).toMatchObject({
      id: "item-1",
      moscow_band: "should",
      estimated_cost: 45_000,
      status: "draft",
      linked_risk_id: "risk-1",
      priority_rank: 2,
    });
  });
});
