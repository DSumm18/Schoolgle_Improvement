import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

describe("DriveConnectionPanel security copy", () => {
  it("does not instruct schools to make Google Drive folders public", () => {
    const source = readFileSync(
      "apps/platform/src/components/ofsted/DriveConnectionPanel.tsx",
      "utf8",
    );

    expect(source).not.toContain("Anyone with the link");
    expect(source).toContain("/dashboard/settings/data-connections");
  });

  it("keeps the legacy shared-link API route disabled", () => {
    const source = readFileSync(
      "apps/platform/src/app/api/ofsted/connections/link/route.ts",
      "utf8",
    );

    expect(source).not.toContain("Anyone with the link");
    expect(source).not.toContain("GOOGLE_API_KEY");
    expect(source).toContain("Schoolgle Connector");
    expect(source).toContain("Public shared-link folders are not accepted");
  });
});
