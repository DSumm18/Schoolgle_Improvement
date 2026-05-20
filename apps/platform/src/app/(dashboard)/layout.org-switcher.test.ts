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

  it("keeps the dashboard shell stable without route-level or sidebar entrance animations", () => {
    const source = readFileSync(
      "apps/platform/src/app/(dashboard)/layout.tsx",
      "utf8",
    );

    expect(source).not.toContain('<AnimatePresence mode="wait">');
    expect(source).not.toContain('key={pathname}');
    expect(source).not.toContain('initial={{ opacity: 0, x: -10 }}');
    expect(source).not.toContain('initial={{ opacity: 0, x: -6 }}');
  });
});
