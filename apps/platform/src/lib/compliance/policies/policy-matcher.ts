import {
  getPolicyRequirementsForContext,
  type PolicyRequirement,
  type SchoolPolicyContext,
} from "./policy-catalogue";
import type { PolicyReviewAnalysis } from "./policy-review-analyser";
import type { PolicyQualityAnalysis } from "./policy-quality-analyser";
import type { PolicyDependencyAnalysis } from "./policy-dependency-analyser";

export type PolicySourceFile = {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
  size?: string | number;
  webViewLink?: string;
  folderPath?: string;
};

export type PolicyMatchStatus = "matched" | "needs_confirmation" | "missing";

export type PolicyRequirementMatch = {
  requirement: PolicyRequirement;
  status: PolicyMatchStatus;
  score: number;
  matchedFile: PolicySourceFile | null;
  matchedAlias: string | null;
  reviewAnalysis?: PolicyReviewAnalysis | null;
  qualityAnalysis?: PolicyQualityAnalysis | null;
  dependencyAnalysis?: PolicyDependencyAnalysis | null;
};

export type UnmatchedPolicyFile = PolicySourceFile & {
  suggestedCategory: "school_custom" | "review_required";
};

export type PolicyMatchResult = {
  context: SchoolPolicyContext;
  requirements: PolicyRequirementMatch[];
  unmatchedFiles: UnmatchedPolicyFile[];
  summary: {
    totalRequirements: number;
    matched: number;
    needsConfirmation: number;
    missing: number;
    unmatchedFiles: number;
  };
};

export function matchPolicyFilesToRequirements({
  context,
  files,
}: {
  context: SchoolPolicyContext;
  files: PolicySourceFile[];
}): PolicyMatchResult {
  const requirements = getPolicyRequirementsForContext(context);
  const usedFileIds = new Set<string>();

  const matches = requirements.map((requirement) => {
    const candidates = files
      .filter((file) => !usedFileIds.has(file.id))
      .map((file) => ({
        file,
        ...scorePolicyFile(requirement, file),
      }))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || best.score < 45) {
      return {
        requirement,
        status: "missing" as const,
        score: 0,
        matchedFile: null,
        matchedAlias: null,
      };
    }

    usedFileIds.add(best.file.id);

    return {
      requirement,
      status: best.score >= 75 ? ("matched" as const) : ("needs_confirmation" as const),
      score: best.score,
      matchedFile: best.file,
      matchedAlias: best.alias,
    };
  });

  const unmatchedFiles = files
    .filter((file) => !usedFileIds.has(file.id))
    .map((file) => ({
      ...file,
      suggestedCategory: "school_custom" as const,
    }));

  return {
    context,
    requirements: matches,
    unmatchedFiles,
    summary: {
      totalRequirements: matches.length,
      matched: matches.filter((match) => match.status === "matched").length,
      needsConfirmation: matches.filter(
        (match) => match.status === "needs_confirmation",
      ).length,
      missing: matches.filter((match) => match.status === "missing").length,
      unmatchedFiles: unmatchedFiles.length,
    },
  };
}

function scorePolicyFile(
  requirement: PolicyRequirement,
  file: PolicySourceFile,
): { score: number; alias: string | null } {
  const haystack = normalize(`${file.name} ${file.folderPath || ""}`);
  const names = [requirement.canonicalName, ...requirement.aliases];
  const scoredAliases = names.map((alias) => {
    const normalizedAlias = normalize(alias);
    const aliasTokens = meaningfulTokens(normalizedAlias);
    const tokenHits = aliasTokens.filter((token) => haystack.includes(token));
    const tokenScore =
      aliasTokens.length === 0
        ? 0
        : Math.round((tokenHits.length / aliasTokens.length) * 70);
    const exactScore = haystack.includes(normalizedAlias) ? 30 : 0;

    return {
      alias,
      score: Math.min(100, tokenScore + exactScore),
    };
  });

  const best = scoredAliases.sort((a, b) => b.score - a.score)[0];
  return { score: best?.score || 0, alias: best?.alias || null };
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningfulTokens(value: string): string[] {
  const stopWords = new Set([
    "and",
    "the",
    "with",
    "for",
    "of",
    "to",
    "in",
    "school",
    "policy",
    "procedure",
    "procedures",
  ]);

  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !stopWords.has(token));
}
