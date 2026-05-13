import { describe, expect, it } from "vitest";
import { APPS } from "./registry";

describe("compliance navigation grouping", () => {
  it("keeps FOI accessible but hides it from top-level compliance app noise", () => {
    const foi = APPS.find((app) => app.id === "compliance-foi");
    const gdpr = APPS.find((app) => app.id === "compliance-gdpr");

    expect(foi).toMatchObject({
      route: "/dashboard/compliance/foi",
      pilotHidden: true,
    });
    expect(gdpr?.name).toBe("Information Governance");
  });
});
