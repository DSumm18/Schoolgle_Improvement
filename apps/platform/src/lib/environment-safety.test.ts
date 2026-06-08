import { describe, expect, it } from "vitest";

import {
  filterOrganizationsForRuntimeAccess,
  getOrganizationRuntimeAccessBlock,
} from "./environment-safety";

const groveOrgId = "grove-house-org";
const rawdonOrgId = "rawdon-st-peters-org";

describe("environment safety guard", () => {
  it("blocks protected live organizations in local or UAT runtimes", () => {
    const block = getOrganizationRuntimeAccessBlock({
      organizationId: rawdonOrgId,
      method: "GET",
      env: {
        NODE_ENV: "development",
        SCHOOLGLE_PROTECTED_LIVE_ORG_IDS: rawdonOrgId,
      },
    });

    expect(block).toEqual({
      code: "PROTECTED_LIVE_ORG_BLOCKED",
      message:
        "This organization is protected from local/UAT access. Switch to a test organization or use the production app.",
    });
  });

  it("allows explicitly listed UAT test organizations", () => {
    const block = getOrganizationRuntimeAccessBlock({
      organizationId: groveOrgId,
      method: "PATCH",
      env: {
        SCHOOLGLE_DB_ENV: "uat",
        SCHOOLGLE_LOCAL_ALLOWED_ORG_IDS: groveOrgId,
      },
    });

    expect(block).toBeNull();
  });

  it("blocks organizations outside the local allow-list", () => {
    const block = getOrganizationRuntimeAccessBlock({
      organizationId: rawdonOrgId,
      method: "PATCH",
      env: {
        SCHOOLGLE_DB_ENV: "uat",
        SCHOOLGLE_LOCAL_ALLOWED_ORG_IDS: groveOrgId,
      },
    });

    expect(block?.code).toBe("LOCAL_ORG_NOT_ALLOWED");
  });

  it("does not block protected organizations in production runtime", () => {
    const block = getOrganizationRuntimeAccessBlock({
      organizationId: rawdonOrgId,
      method: "PATCH",
      env: {
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        SCHOOLGLE_PROTECTED_LIVE_ORG_IDS: rawdonOrgId,
      },
    });

    expect(block).toBeNull();
  });

  it("filters protected and disallowed organizations from switch lists", () => {
    const organizations = filterOrganizationsForRuntimeAccess(
      [
        { id: groveOrgId, name: "Grove House Primary School" },
        { id: rawdonOrgId, name: "Rawdon St Peters" },
        { id: "aurora-org", name: "Aurora Primary" },
      ],
      {
        NODE_ENV: "development",
        SCHOOLGLE_PROTECTED_LIVE_ORG_IDS: rawdonOrgId,
        SCHOOLGLE_LOCAL_ALLOWED_ORG_IDS: `${groveOrgId},aurora-org`,
      },
    );

    expect(organizations.map((organization) => organization.id)).toEqual([
      groveOrgId,
      "aurora-org",
    ]);
  });
});
