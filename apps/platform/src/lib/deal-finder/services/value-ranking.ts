import type { ProductMatch } from "../types";

export function hasVerifiedSaving(match: Pick<ProductMatch, "saving_gbp" | "unit_saving_gbp">): boolean {
  return (
    (match.saving_gbp !== null && match.saving_gbp > 0) ||
    (match.unit_saving_gbp !== null && match.unit_saving_gbp > 0)
  );
}

export function selectBestValueMatch<T extends Pick<ProductMatch, "saving_gbp" | "unit_saving_gbp" | "value_score">>(
  matches: T[],
): T | null {
  const savingMatches = matches.filter(hasVerifiedSaving);
  if (!savingMatches.length) return null;

  return savingMatches.reduce((best, candidate) =>
    candidate.value_score > best.value_score ? candidate : best,
  );
}
