import { describe, expect, it } from "vitest";

import { isApprovedModelId } from "./model-policy";
import {
  AI_MODEL_REGISTRY,
  getAiModelRegistrySummary,
} from "./model-registry";

describe("AI_MODEL_REGISTRY", () => {
  it("contains unique, auditable application and skill entries", () => {
    const ids = AI_MODEL_REGISTRY.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(AI_MODEL_REGISTRY.length).toBeGreaterThanOrEqual(12);

    for (const entry of AI_MODEL_REGISTRY) {
      expect(entry.area).toBeTruthy();
      expect(entry.capability).toBeTruthy();
      expect(entry.owner).toBeTruthy();
      expect(entry.sourceFiles.length).toBeGreaterThan(0);
      expect(entry.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("only lists approved primary and fallback models", () => {
    for (const entry of AI_MODEL_REGISTRY) {
      expect(isApprovedModelId(entry.primaryModel), entry.area).toBe(true);

      for (const fallbackModel of entry.fallbackModels) {
        expect(isApprovedModelId(fallbackModel), entry.area).toBe(true);
      }
    }
  });

  it("covers the key product surfaces we need to govern", () => {
    expect(AI_MODEL_REGISTRY.some((entry) => entry.id === "ed-specialist-responses")).toBe(true);
    expect(AI_MODEL_REGISTRY.some((entry) => entry.id === "estates-energy-invoices")).toBe(true);
    expect(AI_MODEL_REGISTRY.some((entry) => entry.id === "ofsted-evidence-matching")).toBe(true);
    expect(AI_MODEL_REGISTRY.some((entry) => entry.id === "estates-contractor-reports")).toBe(true);
  });

  it("summarises active models for admin reporting", () => {
    const summary = getAiModelRegistrySummary();

    expect(summary.totalEntries).toBe(AI_MODEL_REGISTRY.length);
    expect(summary.activeEntries).toBeGreaterThan(0);
    expect(summary.providerFamilies).toContain("Google");
    expect(summary.providerFamilies).toContain("OpenAI");
    expect(summary.providerFamilies).toContain("Anthropic");
  });
});
