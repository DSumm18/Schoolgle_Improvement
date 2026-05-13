import type { PolicyRequirementMatch } from "./policy-matcher";
import { MAINTAINED_PRIMARY_POLICY_REQUIREMENTS } from "./policy-catalogue";
import { getStarterPolicySources } from "./packs/starter-policy-pack";

export type ManagedPolicyPackStatus =
  | "production_ready"
  | "baseline_queue"
  | "source_research_required";

export type ManagedPolicyOutputMode = "html" | "pdf" | "word" | "website";

export type ManagedPolicyPackConfidence =
  | "source_backed"
  | "catalogue_only";

export type ManagedPolicySourceRef = {
  title: string;
  url: string;
  publisher: string;
  status: "verified_source" | "needs_rule_pack";
};

export type ManagedPolicyPack = {
  requirementId: string;
  status: ManagedPolicyPackStatus;
  confidence: ManagedPolicyPackConfidence;
  targetVersion: string;
  outputModes: ManagedPolicyOutputMode[];
  description: string;
  officialSources: ManagedPolicySourceRef[];
  readyForCustomerGeneration: boolean;
};

export type ManagedPolicyVersionSeed = {
  label: string;
  status: "source_only" | "schoolgle_draft" | "approved" | "missing";
  description: string;
};

export type ManagedPolicyAuditEvent = {
  title: string;
  detail: string;
};

export type ManagedPolicyLifecycle = {
  currentVersion: ManagedPolicyVersionSeed;
  nextVersion: ManagedPolicyVersionSeed | null;
  approvalRoute: string;
  primaryAction: string;
  htmlViewerLabel: string;
  auditTrail: ManagedPolicyAuditEvent[];
};

export type ManagedPolicySuiteSummary = {
  totalRequirements: number;
  connectedSourceFiles: number;
  productionReadyPacks: number;
  baselineQueue: number;
  catalogueOnlyPacks: number;
  sourceBackedPacks: number;
  managedDraftsReady: number;
};

export function getManagedPolicyPackStatus(
  requirementId: string,
): ManagedPolicyPack {
  const requirement = MAINTAINED_PRIMARY_POLICY_REQUIREMENTS.find(
    (item) => item.id === requirementId,
  );

  if (!requirement) {
    return {
      requirementId,
      status: "source_research_required",
      confidence: "catalogue_only",
      targetVersion: "v1.0",
      outputModes: ["html", "pdf", "website"],
      description:
        "This policy is not in the maintained-primary starter catalogue yet.",
      officialSources: [],
      readyForCustomerGeneration: false,
    };
  }

  return {
    requirementId: requirement.id,
    status: "production_ready",
    confidence: "source_backed",
    targetVersion: "v1.0",
    outputModes: ["html", "pdf", "word", "website"],
    description:
      requirement.id === "behaviour-policy"
        ? "Source-backed Behaviour Policy pack with richer advisory content checks, HTML preview, export path and approval audit trail."
        : "Source-backed maintained-primary starter pack with HTML preview, local adaptation prompts, SOP prompts and approval audit trail.",
    officialSources: getCatalogueSourceRefs(requirement.id),
    readyForCustomerGeneration: true,
  };
}

export function listManagedPolicyPacks(): ManagedPolicyPack[] {
  return MAINTAINED_PRIMARY_POLICY_REQUIREMENTS.map((requirement) =>
    getManagedPolicyPackStatus(requirement.id),
  );
}

export function buildManagedPolicySuiteSummary(
  matches: PolicyRequirementMatch[],
): ManagedPolicySuiteSummary {
  const packs = matches.map((match) =>
    getManagedPolicyPackStatus(match.requirement.id),
  );

  return {
    totalRequirements: matches.length,
    connectedSourceFiles: matches.filter((match) => Boolean(match.matchedFile))
      .length,
    productionReadyPacks: packs.filter(
      (pack) => pack.status === "production_ready",
    ).length,
    baselineQueue: packs.filter((pack) => pack.status !== "production_ready")
      .length,
    catalogueOnlyPacks: packs.filter((pack) => pack.confidence === "catalogue_only")
      .length,
    sourceBackedPacks: packs.filter((pack) => pack.confidence === "source_backed")
      .length,
    managedDraftsReady: matches.filter(
      (match) =>
        getManagedPolicyPackStatus(match.requirement.id).status ===
        "production_ready",
    ).length,
  };
}

export function buildManagedPolicyLifecycle(
  match: PolicyRequirementMatch,
): ManagedPolicyLifecycle {
  const pack = getManagedPolicyPackStatus(match.requirement.id);
  const currentVersion: ManagedPolicyVersionSeed = match.matchedFile
    ? {
        label: "v0 source",
        status: "source_only",
        description:
          "Original school file connected from Drive/SharePoint. It remains the source evidence until a Schoolgle version is reviewed and approved.",
      }
    : {
        label: "No source file",
        status: "missing",
        description:
          "No matching school policy file has been detected yet. Schoolgle can start from a baseline pack once available.",
      };

  const nextVersion: ManagedPolicyVersionSeed | null =
    pack.status === "production_ready"
      ? {
          label: `${pack.targetVersion} Schoolgle draft`,
          status: "schoolgle_draft",
          description:
            "Enhanced Schoolgle-managed draft ready for HTML view, human review, approval and publication.",
        }
      : {
          label: `${pack.targetVersion} baseline pack`,
          status: "schoolgle_draft",
          description:
            "Template/rule pack still needs to be built before Schoolgle can generate a full managed draft.",
        };

  return {
    currentVersion,
    nextVersion,
    approvalRoute: match.requirement.approvalHint,
    primaryAction:
      pack.status === "production_ready"
        ? match.matchedFile
      ? "Create enhanced Schoolgle draft"
      : "Create missing policy draft"
        : "Research source pack",
    htmlViewerLabel:
      pack.status === "production_ready"
        ? "Open HTML draft"
        : "HTML view pending pack",
    auditTrail: buildAuditTrail(match, pack),
  };
}

function buildAuditTrail(
  match: PolicyRequirementMatch,
  pack: ManagedPolicyPack,
): ManagedPolicyAuditEvent[] {
  const events: ManagedPolicyAuditEvent[] = [];

  if (match.matchedFile) {
    events.push({
      title: "Source file connected",
      detail: `${match.matchedFile.name} is linked as original evidence, not overwritten by Schoolgle.`,
    });
  } else {
    events.push({
      title: "Policy gap identified",
      detail: "No matching source file has been detected in the connected policy folders.",
    });
  }

  events.push({
    title:
      pack.status === "production_ready"
        ? "Baseline pack ready"
        : "Source pack queued",
    detail: pack.description,
  });

  if (pack.status === "production_ready") {
    events.push({
      title: "HTML draft available",
      detail:
        "Schoolgle can produce a clean in-app HTML policy view for review before approval or website publishing.",
    });
  }

  events.push({
    title: "Approval route recorded",
    detail: `${match.requirement.approvalHint}. The approved version should store approver, date, source checks and minute/reference where relevant.`,
  });

  return events;
}

function getCatalogueSourceRefs(requirementId: string): ManagedPolicySourceRef[] {
  return getStarterPolicySources(requirementId).map((source) => ({
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    status: "verified_source",
  }));
}
