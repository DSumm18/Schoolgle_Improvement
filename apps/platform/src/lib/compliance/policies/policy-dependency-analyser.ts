import type {
  PolicyRequirementMatch,
  PolicyMatchStatus,
} from "./policy-matcher";

export type LinkedPolicyStatus = "present" | "needs_confirmation" | "missing";

export type LinkedPolicy = {
  requirementId: string;
  title: string;
  status: LinkedPolicyStatus;
  matchedFileName: string | null;
  matchedAlias: string;
};

export type PolicyDependencyAnalysis = {
  linkedPolicies: LinkedPolicy[];
  summary: {
    present: number;
    needsConfirmation: number;
    missing: number;
  };
  tags: string[];
};

const EXTRA_REFERENCE_ALIASES: Record<string, string[]> = {
  "suspension-exclusion": [
    "suspension and exclusion",
    "suspensions and exclusions",
    "permanent exclusion",
    "exclusion guidance",
    "exclusions guidance",
  ],
};

export function analysePolicyDependencies({
  requirementId,
  text,
  allMatches,
}: {
  requirementId: string;
  text: string;
  allMatches: PolicyRequirementMatch[];
}): PolicyDependencyAnalysis {
  const normalisedText = normalise(text);
  const linkedPolicies = allMatches
    .filter((match) => match.requirement.id !== requirementId)
    .map((match) => {
      const matchedAlias = findReferencedAlias(match, normalisedText);
      if (!matchedAlias) return null;

      return {
        requirementId: match.requirement.id,
        title: match.requirement.canonicalName,
        status: toLinkedStatus(match.status),
        matchedFileName: match.matchedFile?.name || null,
        matchedAlias,
      } satisfies LinkedPolicy;
    })
    .filter((policy): policy is LinkedPolicy => Boolean(policy))
    .sort((a, b) => sortStatus(a.status) - sortStatus(b.status));

  const summary = {
    present: linkedPolicies.filter((policy) => policy.status === "present").length,
    needsConfirmation: linkedPolicies.filter(
      (policy) => policy.status === "needs_confirmation",
    ).length,
    missing: linkedPolicies.filter((policy) => policy.status === "missing").length,
  };

  return {
    linkedPolicies,
    summary,
    tags: buildDependencyTags(summary),
  };
}

function findReferencedAlias(
  match: PolicyRequirementMatch,
  normalisedText: string,
): string | null {
  const aliases = [
    match.requirement.canonicalName,
    ...match.requirement.aliases,
    ...(EXTRA_REFERENCE_ALIASES[match.requirement.id] || []),
  ];

  const scoredAliases = aliases
    .map((alias) => ({
      alias,
      normalisedAlias: normalise(alias),
    }))
    .filter(({ normalisedAlias }) => normalisedAlias.length > 2)
    .filter(({ normalisedAlias }) => normalisedText.includes(normalisedAlias))
    .sort((a, b) => b.normalisedAlias.length - a.normalisedAlias.length);

  return scoredAliases[0]?.alias || null;
}

function toLinkedStatus(status: PolicyMatchStatus): LinkedPolicyStatus {
  if (status === "matched") return "present";
  if (status === "needs_confirmation") return "needs_confirmation";
  return "missing";
}

function buildDependencyTags(summary: PolicyDependencyAnalysis["summary"]): string[] {
  const tags = ["linked-policies"];
  if (summary.missing > 0) tags.push("linked-policy-gaps");
  if (summary.needsConfirmation > 0) tags.push("linked-policy-check-needed");
  if (summary.missing === 0 && summary.needsConfirmation === 0 && summary.present > 0) {
    tags.push("linked-policies-present");
  }
  return tags;
}

function sortStatus(status: LinkedPolicyStatus): number {
  if (status === "missing") return 0;
  if (status === "needs_confirmation") return 1;
  return 2;
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
