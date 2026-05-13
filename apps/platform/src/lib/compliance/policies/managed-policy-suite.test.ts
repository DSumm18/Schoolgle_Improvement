import { describe, expect, it } from "vitest";
import { matchPolicyFilesToRequirements } from "./policy-matcher";
import {
  buildManagedPolicyLifecycle,
  buildManagedPolicySuiteSummary,
  getManagedPolicyPackStatus,
  listManagedPolicyPacks,
} from "./managed-policy-suite";

describe("managed policy suite", () => {
  const result = matchPolicyFilesToRequirements({
    context: "maintained_primary",
    files: [
      {
        id: "behaviour-source",
        name: "Behaviour_Policy_2025-26.docx",
        folderPath: "Policies/Current Policies",
      },
    ],
  });

  it("treats Behaviour Policy as a production-ready Schoolgle pack", () => {
    expect(getManagedPolicyPackStatus("behaviour-policy")).toEqual(
      expect.objectContaining({
        status: "production_ready",
        confidence: "source_backed",
        targetVersion: "v1.0",
        outputModes: expect.arrayContaining(["html", "pdf", "word"]),
        readyForCustomerGeneration: true,
      }),
    );
  });

  it("makes every maintained-primary policy available as a starter draft pack", () => {
    const packs = listManagedPolicyPacks();
    const productionReady = packs.filter((pack) => pack.status === "production_ready");
    const sourceBacked = packs.filter((pack) => pack.confidence === "source_backed");

    expect(packs).toHaveLength(20);
    expect(productionReady).toHaveLength(20);
    expect(sourceBacked).toHaveLength(20);
    expect(
      packs.every((pack) => pack.readyForCustomerGeneration === true),
    ).toBe(true);
  });

  it("summarises the suite as connected source files plus baseline packs", () => {
    const summary = buildManagedPolicySuiteSummary(result.requirements);

    expect(summary.totalRequirements).toBe(20);
    expect(summary.connectedSourceFiles).toBe(1);
    expect(summary.productionReadyPacks).toBe(20);
    expect(summary.baselineQueue).toBe(0);
    expect(summary.sourceBackedPacks).toBe(20);
    expect(summary.catalogueOnlyPacks).toBe(0);
    expect(summary.managedDraftsReady).toBe(20);
  });

  it("builds a lifecycle that separates source evidence from managed versions", () => {
    const behaviour = result.requirements.find(
      (match) => match.requirement.id === "behaviour-policy",
    );

    expect(behaviour).toBeDefined();
    const lifecycle = buildManagedPolicyLifecycle(behaviour!);

    expect(lifecycle.currentVersion.label).toBe("v0 source");
    expect(lifecycle.nextVersion?.label).toBe("v1.0 Schoolgle draft");
    expect(lifecycle.approvalRoute).toBe("Governing body");
    expect(lifecycle.auditTrail[0].title).toBe("Source file connected");
    expect(lifecycle.auditTrail.some((event) => event.title === "HTML draft available")).toBe(
      true,
    );
  });
});
