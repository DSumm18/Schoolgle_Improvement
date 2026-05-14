import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("dashboard layout organization switcher", () => {
  it("keeps organization switching visible in single-app mode", () => {
    const source = readFileSync(
      "apps/platform/src/app/(dashboard)/layout.tsx",
      "utf8",
    );
    const orgSwitcherBlock = source.slice(
      source.indexOf("{user && isSidebarExpanded && ("),
      source.indexOf("{/* Navigation with smooth hover-to-scroll */}"),
    );

    expect(orgSwitcherBlock).toContain("<OrgSwitcher");
    expect(orgSwitcherBlock).not.toContain("!isSingleAppMode");
  });
});
