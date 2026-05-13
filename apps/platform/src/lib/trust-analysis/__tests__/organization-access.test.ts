import { describe, expect, it } from "vitest";
import { resolveTrustAnalysisAccess } from "../organization-access";

describe("resolveTrustAnalysisAccess", () => {
  const authOrganizationId = "trust-paymat";

  it("allows a user to access their own organization", () => {
    expect(
      resolveTrustAnalysisAccess({
        authOrganizationId,
        requestedOrganization: {
          id: "trust-paymat",
          parent_organization_id: null,
        },
      }),
    ).toEqual({ allowed: true, organizationId: "trust-paymat", relationship: "self" });
  });

  it("allows a trust or local authority user to access a direct child school", () => {
    expect(
      resolveTrustAnalysisAccess({
        authOrganizationId,
        requestedOrganization: {
          id: "rawdon-st-peters",
          parent_organization_id: "trust-paymat",
        },
      }),
    ).toEqual({ allowed: true, organizationId: "rawdon-st-peters", relationship: "child" });
  });

  it("blocks unrelated organizations even when their id is supplied in the URL", () => {
    expect(
      resolveTrustAnalysisAccess({
        authOrganizationId,
        requestedOrganization: {
          id: "bradford-council",
          parent_organization_id: null,
        },
      }),
    ).toEqual({ allowed: false, reason: "out-of-scope" });
  });
});
