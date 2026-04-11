/**
 * Asset Matcher
 *
 * Given a set of extracted asset findings from a contractor report, finds
 * the best match in the school's asset register using a scoring function
 * over serial number, code, manufacturer/model, and location.
 *
 * Returns match candidates with confidence scores so the user can review
 * and correct before the system writes updates.
 */

import { createServiceRoleClient } from "@/lib/supabase-server";
import type { Asset } from "@/types/estates-compliance";
import type { ExtractedAssetFinding } from "./contractor-report-extractor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetMatchCandidate {
  asset: Pick<Asset,
    | "id"
    | "code"
    | "name"
    | "asset_type"
    | "manufacturer"
    | "model"
    | "serial_number"
    | "building"
    | "floor"
    | "room"
    | "warranty_expiry"
    | "warranty_provider"
  >;
  score: number; // 0-1
  match_reasons: string[];
}

export interface AssetMatchResult {
  /** The extracted finding from the report */
  extracted: ExtractedAssetFinding;
  /** Best match (highest score) if above threshold, else null */
  best_match: AssetMatchCandidate | null;
  /** All candidate matches above minimum score */
  candidates: AssetMatchCandidate[];
  /** Whether the match is confident enough to auto-apply without user review */
  auto_match: boolean;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Score a candidate asset against an extracted finding.
 *
 * Weights:
 *  - Serial number exact match: 0.5 (strongest signal)
 *  - Code exact match: 0.3
 *  - Manufacturer match: 0.1
 *  - Model match: 0.1
 *  - Location match (building/room): 0.1
 *  - Name fuzzy contains: 0.1
 *
 * Max possible: ~1.1, clamped to 1.0.
 */
export function scoreAssetMatch(
  asset: Asset,
  finding: ExtractedAssetFinding,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const norm = (s: string | null | undefined): string =>
    (s || "").toLowerCase().trim().replace(/[\s\-_]/g, "");

  // Serial number: strongest signal
  if (
    finding.serial_number &&
    asset.serial_number &&
    norm(asset.serial_number) === norm(finding.serial_number)
  ) {
    score += 0.5;
    reasons.push(`Serial number matches (${asset.serial_number})`);
  }

  // Code match (identifier might be the asset code)
  if (
    finding.identifier &&
    asset.code &&
    norm(asset.code) === norm(finding.identifier)
  ) {
    score += 0.3;
    reasons.push(`Asset code matches (${asset.code})`);
  }

  // Manufacturer match
  if (
    finding.manufacturer &&
    asset.manufacturer &&
    norm(asset.manufacturer).includes(norm(finding.manufacturer))
  ) {
    score += 0.1;
    reasons.push(`Manufacturer matches (${asset.manufacturer})`);
  }

  // Model match
  if (
    finding.model &&
    asset.model &&
    norm(asset.model) === norm(finding.model)
  ) {
    score += 0.1;
    reasons.push(`Model matches (${asset.model})`);
  }

  // Location match
  if (finding.location && (asset.building || asset.room)) {
    const extractedLoc = norm(finding.location);
    const assetLoc = `${norm(asset.building)}${norm(asset.floor)}${norm(asset.room)}`;
    if (assetLoc && extractedLoc) {
      // Check if extracted location mentions building, floor, or room
      const hits = [asset.building, asset.floor, asset.room]
        .filter(Boolean)
        .filter((part) => norm(part as string) && extractedLoc.includes(norm(part as string)))
        .length;
      if (hits > 0) {
        score += 0.1;
        reasons.push(
          `Location matches (${[asset.building, asset.floor, asset.room]
            .filter(Boolean)
            .join(" / ")})`,
        );
      }
    }
  }

  // Name fuzzy contains (extracted identifier contains asset name or vice versa)
  if (finding.identifier && asset.name) {
    const fi = norm(finding.identifier);
    const an = norm(asset.name);
    if (fi.length > 3 && an.length > 3 && (fi.includes(an) || an.includes(fi))) {
      score += 0.1;
      reasons.push(`Asset name fuzzy match`);
    }
  }

  return { score: Math.min(score, 1), reasons };
}

/**
 * Match extracted report findings against the organisation's asset register.
 *
 * @param organizationId - Tenant scope
 * @param findings - Extracted asset findings from the report
 * @param options - Matching options
 * @returns Match results with confidence scores and candidates
 */
export async function matchAssets(
  organizationId: string,
  findings: ExtractedAssetFinding[],
  options?: {
    /** Optional compliance domain filter to narrow the search */
    compliance_domain?: string;
    /** Minimum score to include in candidates list (default 0.2) */
    min_score?: number;
    /** Score threshold above which a match can be auto-applied (default 0.7) */
    auto_match_threshold?: number;
  },
): Promise<AssetMatchResult[]> {
  const minScore = options?.min_score ?? 0.2;
  const autoThreshold = options?.auto_match_threshold ?? 0.7;

  const supabase = createServiceRoleClient();

  // Fetch all assets for the organisation (optionally filtered by domain)
  let query = supabase
    .from("estates_assets")
    .select(
      "id, code, name, asset_type, manufacturer, model, serial_number, building, floor, room, warranty_expiry, warranty_provider, compliance_domains",
    )
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (options?.compliance_domain) {
    query = query.contains("compliance_domains", [options.compliance_domain]);
  }

  const { data: assets, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch assets for matching: ${error.message}`);
  }

  const results: AssetMatchResult[] = [];

  for (const finding of findings) {
    const scored = (assets || [])
      .map((asset) => {
        const { score, reasons } = scoreAssetMatch(asset as Asset, finding);
        return { asset, score, reasons };
      })
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score);

    const candidates: AssetMatchCandidate[] = scored.map((s) => ({
      asset: s.asset,
      score: s.score,
      match_reasons: s.reasons,
    }));

    const best_match = candidates[0] || null;
    const auto_match = best_match !== null && best_match.score >= autoThreshold;

    results.push({
      extracted: finding,
      best_match,
      candidates: candidates.slice(0, 5), // top 5 candidates only
      auto_match,
    });
  }

  return results;
}
