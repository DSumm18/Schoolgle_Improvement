import { describe, expect, it } from "vitest";
import { buildAccessibleOrganizationList } from "./accessible-organizations";

describe("buildAccessibleOrganizationList", () => {
  it("inherits the parent trust role when switching into a target child school", () => {
    const result = buildAccessibleOrganizationList({
      directOrganizations: [
        {
          id: "trust-1",
          name: "Aurora Multi-Academy Trust",
          organization_type: "trust",
          parent_organization_id: null,
          role: "admin",
        },
      ],
      childOrganizations: [
        {
          id: "aurora-primary",
          name: "Aurora Primary",
          organization_type: "school",
          parent_organization_id: "trust-1",
        },
      ],
      targetOrganizationId: "aurora-primary",
    });

    expect(result).toEqual([
      {
        id: "aurora-primary",
        name: "Aurora Primary",
        organization_type: "school",
        parent_organization_id: "trust-1",
        role: "admin",
      },
    ]);
  });
});
