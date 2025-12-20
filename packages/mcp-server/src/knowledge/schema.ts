/**
 * Generic Knowledge Pack Schema
 * 
 * Domain-agnostic schema for storing deterministic guidance.
 * Used by all knowledge packs: Estates, SEND, KCSIE, HR, Finance, Compliance.
 * 
 * Design Principles:
 * - No domain-specific assumptions
 * - Versioned and citable
 * - Lifecycle controlled
 * - Advisory language only
 */

export type KnowledgeDomain = 
  | 'estates' 
  | 'send' 
  | 'hr' 
  | 'finance' 
  | 'compliance'
  | 'research';

export type ConfidenceLevel = 'high' | 'medium' | 'draft';

/**
 * Knowledge Pack Metadata
 * 
 * Represents a collection of rules from a single source (e.g., BB104, KCSIE).
 * Lifecycle metadata ensures outdated guidance is flagged.
 */
export interface KnowledgePack {
  id: string;
  domain: KnowledgeDomain;
  title: string;
  version: string;
  effective_date: string; // ISO date string
  review_by_date: string; // ISO date string
  confidence_level: ConfidenceLevel;
  source_url?: string;
  superseded_by?: string; // ID of newer version if this is outdated
}

/**
 * Rule
 * 
 * A single piece of guidance with conditions and citations.
 * Rules are retrieved deterministically (no LLM calls).
 */
export interface Rule {
  id: string;
  pack_id: string; // References KnowledgePack.id
  topic: string; // e.g., 'classroom_minimum_area', 'safeguarding_reporting'
  applies_when_text: string; // Human-readable condition (e.g., "room type is classroom AND age group is primary")
  applies_when_predicate?: Record<string, any>; // Optional machine-readable predicate (JSON) for future structured matching
  content: string; // Advisory language only: "suggests", "considers", "guidance indicates"
  citations: Citation[];
  authority_level?: 'statutory' | 'guidance' | 'local_policy' | 'trust_standard'; // Overall authority level (highest from citations if not set)
}

/**
 * Citation
 * 
 * Source reference for auditability.
 * Every rule must have at least one citation.
 */
export interface Citation {
  source: string; // e.g., "BB104", "KCSIE Part 1", "ACAS Code"
  section: string; // e.g., "Section 3.2", "Paragraph 4.1", "Table 2"
  page?: string; // Optional page number
  quote?: string; // Max 25 words - direct quote if relevant
  url?: string; // Optional URL to source document
  authority_level?: 'statutory' | 'guidance' | 'local_policy' | 'trust_standard'; // Authority level of this citation
}

/**
 * Knowledge Pack Query Result
 * 
 * Returned by consult_knowledge_pack tool.
 * Includes warnings if confidence is low or guidance is outdated.
 */
export interface KnowledgeQueryResult {
  rules: Rule[];
  pack: KnowledgePack;
  warnings: string[]; // e.g., ["Guidance may be outdated", "Confidence level is 'draft'"]
  retrieved_at: string; // ISO timestamp
  // Citation filtering metadata
  missing_citations_count?: number;
  missing_rule_ids?: string[];
  missing_rule_topics?: string[];
  citation_filter_message?: string; // "X rules were excluded because they have no citations. Add citations to include them."
}

/**
 * Helper: Check if pack is outdated
 */
export function isPackOutdated(pack: KnowledgePack): boolean {
  const today = new Date();
  const reviewDate = new Date(pack.review_by_date);
  return reviewDate < today && pack.confidence_level !== 'high';
}

/**
 * Helper: Generate warnings for pack
 */
export function generatePackWarnings(pack: KnowledgePack): string[] {
  const warnings: string[] = [];
  
  if (pack.superseded_by) {
    warnings.push(`This guidance has been superseded by version ${pack.superseded_by}. Please use the latest version.`);
  }
  
  if (isPackOutdated(pack)) {
    warnings.push(`Guidance review date (${pack.review_by_date}) has passed. Verify current requirements.`);
  }
  
  if (pack.confidence_level === 'draft') {
    warnings.push('This guidance is marked as "draft" - verify before implementation.');
  } else if (pack.confidence_level === 'medium') {
    warnings.push('Confidence level is "medium" - cross-reference with official sources.');
  }
  
  return warnings;
}

