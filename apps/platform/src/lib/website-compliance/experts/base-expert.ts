/**
 * Base interface for compliance expert assessors.
 *
 * Each expert handles one or more requirements with focused logic —
 * some are pure structural checks (no AI), others use targeted AI prompts.
 * Experts can also be invoked by Ed to help schools fix specific issues.
 */

import type OpenAI from "openai";
import type { ComplianceStatus } from "../assessor";

/** Pre-matched pages and keywords from the structural phase */
export interface StructuralMatch {
  requirement: {
    key: string;
    name: string;
    description: string;
    legislation: string[];
    searchKeywords: string[];
    urlPatterns: string[];
    documentPatterns: string[];
    complianceCriteria: string[];
    qualityCriteria: string[];
    redFlags: string[];
    subItems?: string[];
    category: string;
    severity: string;
    typicallyTrustLevel?: boolean;
  };
  matchingPages: {
    url: string;
    title: string;
    content: string;
    contentType?: "html" | "pdf" | "document";
    links?: string[];
  }[];
  keywordsFound: string[];
  datesFound: string[];
  documentLinksFound: string[];
}

export type PIIMode = "full_mask" | "preserve_names" | "no_mask";

export interface ExpertConfig {
  /** Requirement key(s) this expert handles */
  requirementKeys: string[];
  /** PII masking mode */
  piiMode: PIIMode;
  /** Whether this expert needs AI */
  needsAI: boolean;
}

export interface ExpertResult {
  status: ComplianceStatus;
  complianceScore: number;
  qualityScore: number;
  clarityScore: number;
  evidenceQuotes: string[];
  gaps: string[];
  recommendations: string[];
  redFlags: string[];
  confidence: number;
}

export interface ComplianceExpert {
  config: ExpertConfig;
  assess(
    match: StructuralMatch,
    openai: OpenAI | null,
  ): Promise<ExpertResult | null>;
}
