import { describe, expect, it } from "vitest";
import {
  ESTATES_FUNCTION_SCHEMAS,
  getFunctionSchema,
  getSkillForFunction,
} from "./school-skills-registry";

describe("school skills registry estates strategy tools", () => {
  it("exposes estate finding triage and strategy item creation to Ed", () => {
    const names = ESTATES_FUNCTION_SCHEMAS.map((schema) => schema.name);

    expect(names).toContain("triage_estate_finding");
    expect(names).toContain("create_estate_strategy_item");
    expect(getSkillForFunction("create_estate_strategy_item")).toBe("estates");
  });

  it("requires enough information to create an estate strategy item safely", () => {
    const schema = getFunctionSchema("create_estate_strategy_item");

    expect(schema?.parameters.required).toEqual(
      expect.arrayContaining(["title", "estimated_cost", "year"]),
    );
    expect(schema?.parameters.properties).toHaveProperty("consequence_if_unfunded");
    expect(schema?.parameters.properties).toHaveProperty("source_entity_id");
  });
});
