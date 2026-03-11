/**
 * Expert: Safeguarding Policy
 *
 * Enhanced check for safeguarding — must find the policy PLUS the DSL name.
 * Uses preserve_names PII mode so staff names aren't masked.
 */

import type {
  ComplianceExpert,
  StructuralMatch,
  ExpertResult,
} from "./base-expert";

// Name pattern: optional title (Mrs/Mr/Ms/Miss/Dr/Prof) + capitalised first + last name
const TITLED_NAME = `(?:Mrs?|Ms|Miss|Dr|Prof)\\.?\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?`;
const ANY_NAME = `(?:(?:Mrs?|Ms|Miss|Dr|Prof)\\.?\\s+)?[A-Z][a-z]+\\s+[A-Z][a-z]+`;

const DSL_PATTERNS = [
  // "Designated Safeguarding Lead: Alexandre Summerscales" or "DSL: Mrs Smith"
  new RegExp(
    `(?:Designated\\s+Safeguarding\\s+Lead|DSL)[:\\s]+(?:is\\s+)?${ANY_NAME}`,
    "gi",
  ),
  // "Mrs Smith is our Designated Safeguarding Lead"
  new RegExp(
    `${TITLED_NAME},?\\s+(?:is\\s+)?(?:our\\s+)?(?:Designated\\s+Safeguarding\\s+Lead|DSL)`,
    "gi",
  ),
  // "safeguarding lead: Name" or "child protection lead: Name"
  new RegExp(
    `(?:safeguarding|child\\s*protection)\\s+lead[:\\s]+${ANY_NAME}`,
    "gi",
  ),
  // Table/list format: "Name — DSL" or "Name (DSL)"
  new RegExp(
    `${TITLED_NAME}[^.]{0,20}(?:\\(|–|-|—)\\s*(?:Designated\\s+Safeguarding\\s+Lead|DSL)`,
    "gi",
  ),
  // "DSL — Name" or "DSL: Name" with flexible spacing
  new RegExp(
    `(?:DSL|Designated\\s+Safeguarding\\s+Lead)\\s*(?:–|—|-|:)\\s*${ANY_NAME}`,
    "gi",
  ),
  // "lead for safeguarding is Name"
  new RegExp(
    `(?:lead\\s+for\\s+safeguarding|safeguarding\\s+lead)\\s*(?:–|—|-|:|is)\\s*${ANY_NAME}`,
    "gi",
  ),
];

const DEPUTY_DSL_PATTERNS = [
  // "Deputy Designated Safeguarding Lead: Name" or "Deputy DSL: Name"
  new RegExp(
    `(?:Deputy|Assistant)\\s+(?:Designated\\s+Safeguarding\\s+Lead|DSL)[s:]?\\s+${ANY_NAME}`,
    "gi",
  ),
  // "Deputy Designated Safeguarding Leads: Name1, Name2"
  /(?:Deputy|Assistant)\s+(?:Designated\s+Safeguarding\s+Lead|DSL)s?[:\s]+[A-Z][a-z]+\s+[A-Z][a-z]+/gi,
];

export const safeguardingPolicyExpert: ComplianceExpert = {
  config: {
    requirementKeys: ["safeguarding_policy"],
    piiMode: "preserve_names",
    needsAI: false,
  },

  async assess(match: StructuralMatch): Promise<ExpertResult> {
    let hasPolicy = false;
    let hasDSL = false;
    let hasDeputyDSL = false;
    let dslName = "";
    let policyUrl = "";
    const evidence: string[] = [];

    for (const page of match.matchingPages) {
      const content = page.content || "";
      const contentLower = content.toLowerCase();

      // Check for safeguarding policy content
      const safeguardingKeywords = [
        "safeguarding",
        "child protection",
        "keeping children safe",
      ];
      const hits = safeguardingKeywords.filter((kw) =>
        contentLower.includes(kw),
      );
      if (hits.length >= 1 && content.length > 300) {
        hasPolicy = true;
        policyUrl = policyUrl || page.url;
      }

      // Check for DSL name
      for (const pattern of DSL_PATTERNS) {
        pattern.lastIndex = 0;
        const m = pattern.exec(content);
        if (m) {
          hasDSL = true;
          dslName = m[0].trim();
          evidence.push(`DSL: ${dslName}`);
          policyUrl = policyUrl || page.url;
          break;
        }
      }

      // Check for Deputy DSL
      for (const pattern of DEPUTY_DSL_PATTERNS) {
        pattern.lastIndex = 0;
        const m = pattern.exec(content);
        if (m) {
          hasDeputyDSL = true;
          evidence.push(`Deputy DSL: ${m[0].trim()}`);
          break;
        }
      }
    }

    // Also check document links for safeguarding policy PDFs
    if (
      !hasPolicy &&
      match.documentLinksFound.some(
        (l) =>
          l.toLowerCase().includes("safeguard") ||
          l.toLowerCase().includes("child-protection"),
      )
    ) {
      hasPolicy = true;
      evidence.push(
        `Safeguarding policy document: ${match.documentLinksFound[0]}`,
      );
    }

    if (hasPolicy && hasDSL) {
      const score = hasDeputyDSL ? 100 : 90;
      return {
        status: "compliant",
        complianceScore: score,
        qualityScore: hasDeputyDSL ? 5 : 4,
        clarityScore: 4,
        evidenceQuotes: [...evidence, `Found on ${policyUrl}`],
        gaps: hasDeputyDSL
          ? []
          : ["Deputy DSL name not found (good practice to publish)"],
        recommendations: hasDeputyDSL
          ? []
          : ["Consider listing the Deputy DSL alongside the DSL"],
        redFlags: [],
        confidence: 0.9,
      };
    }

    if (hasPolicy) {
      return {
        status: "partial",
        complianceScore: 60,
        qualityScore: 3,
        clarityScore: 2,
        evidenceQuotes: [
          `Safeguarding policy found on ${policyUrl}`,
          ...evidence,
        ],
        gaps: [
          "Designated Safeguarding Lead (DSL) name not clearly identified on the website",
        ],
        recommendations: [
          "Publish the name of the Designated Safeguarding Lead prominently on the safeguarding page",
        ],
        redFlags: ["DSL name should be easily findable by parents"],
        confidence: 0.8,
      };
    }

    return {
      status: "not_found",
      complianceScore: 0,
      qualityScore: 0,
      clarityScore: 0,
      evidenceQuotes: [],
      gaps: ["No safeguarding policy or DSL details found on the website"],
      recommendations: [
        "Publish the school's safeguarding/child protection policy and clearly name the DSL and Deputy DSL",
      ],
      redFlags: ["Missing statutory safeguarding information — critical gap"],
      confidence: 0.9,
    };
  },
};
