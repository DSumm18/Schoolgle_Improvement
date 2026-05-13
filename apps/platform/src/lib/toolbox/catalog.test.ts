import { describe, expect, it } from "vitest";
import {
  TOOLBOX_CATEGORIES,
  TOOLBOX_ITEMS,
  filterToolboxItems,
  getToolboxStats,
} from "./catalog";

describe("Toolbox catalogue", () => {
  it("contains subscriber mini apps, curated resources and customer ideas", () => {
    expect(TOOLBOX_ITEMS.some((item) => item.source === "schoolgle" && item.id === "class-builder")).toBe(true);
    expect(TOOLBOX_ITEMS.some((item) => item.source === "external")).toBe(true);
    expect(TOOLBOX_ITEMS.some((item) => item.source === "customer-idea")).toBe(true);
  });

  it("supports category and text filtering for the app-store view", () => {
    const classTools = filterToolboxItems({ category: "Classroom", query: "class" });
    expect(classTools.map((item) => item.id)).toContain("class-builder");

    const sendTools = filterToolboxItems({ category: "SEND", query: "reader" });
    expect(sendTools.some((item) => item.name.includes("Immersive Reader"))).toBe(true);
  });

  it("summarises live, resource and idea counts", () => {
    const stats = getToolboxStats(TOOLBOX_ITEMS);
    expect(stats.miniApps).toBeGreaterThanOrEqual(1);
    expect(stats.resources).toBeGreaterThanOrEqual(1);
    expect(stats.ideas).toBeGreaterThanOrEqual(1);
    expect(TOOLBOX_CATEGORIES).toContain("All");
  });
});
