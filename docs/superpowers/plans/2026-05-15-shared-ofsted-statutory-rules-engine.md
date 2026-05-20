# Shared Ofsted Statutory Rules Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one shared Ofsted/statutory rules engine so website scans, Google Drive scans, Policy Manager evidence and future OneDrive scans judge the same requirement in the same way, while separately surfacing research-backed enhancement suggestions.

**Architecture:** Keep Drive/SharePoint and websites as the source of truth for original evidence. Add a thin rules layer that separates document quality from publication compliance, then feed both website and Drive evidence into the same requirement-level judgement. Keep statutory compliance findings separate from optional research-backed enhancement suggestions so schools are not told they are non-compliant when the real point is “this could be stronger”.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, Supabase service-role routes, existing Google Drive connector, existing website compliance scanner, existing Ofsted findings/task loop.

---

## File Structure

- Create `apps/platform/src/lib/ofsted-readiness/rules/types.ts`
  - Shared input/output types for rule packs, evidence sources, document quality checks, source/publication checks and merged requirement judgements.
- Create `apps/platform/src/lib/ofsted-readiness/rules/rule-pack.ts`
  - Converts `WEBSITE_COMPLIANCE_REQUIREMENTS` plus `LEGISLATION_REGISTRY` into a shared rule pack used by all scanners.
- Create `apps/platform/src/lib/ofsted-readiness/rules/date-validity.ts`
  - Handles academic-year dates, fixed deadlines, due-soon windows and next-review calculation.
- Create `apps/platform/src/lib/ofsted-readiness/rules/evidence-assessor.ts`
  - Checks extracted evidence text against rule requirements: required sections, legislation currency, placeholders, dates, named roles and quality signals.
- Create `apps/platform/src/lib/ofsted-readiness/rules/source-merger.ts`
  - Merges evidence from multiple sources and separates “evidence exists” from “published where required”.
- Create `apps/platform/src/lib/ofsted-readiness/rules/research-suggestions.ts`
  - Maps compliant/partial evidence to optional EEF and high-trust research suggestions without changing the statutory judgement.
- Create `apps/platform/src/lib/ofsted-readiness/rules/index.ts`
  - Public exports for website scanner, Drive scanner, Policy Manager and tests.
- Create `apps/platform/src/lib/ofsted-readiness/rules/*.test.ts`
  - Focused tests for PE premium, pupil premium, safeguarding, and internal-vs-public evidence.
- Modify `apps/platform/src/lib/website-compliance/phase2-assessor.ts`
  - Replace local currency logic with shared `date-validity.ts` and attach rule metadata to stored results.
- Modify `apps/platform/src/app/api/ofsted/connections/scan/route.ts`
  - Classify Drive files to requirement keys, not just broad Ofsted categories.
- Modify `apps/platform/src/app/api/ofsted/inspect/route.ts`
  - Use OAuth access tokens for connected Drive files and call the shared evidence assessor before/alongside AI inspection.
- Modify `apps/platform/src/components/website-compliance/WebsiteComplianceResults.tsx`
  - Show separate result labels where useful: “document quality”, “website publication”, “next due”.
- Optional later migration: `apps/platform/supabase/migrations/YYYYMMDD_ofsted_rule_assessments.sql`
  - Only add if existing `website_requirement_assessments`, `ofsted_document_checks` and `ofsted_findings` cannot store the required metadata cleanly.

---

### Task 1: Add Shared Rule Types

**Files:**
- Create: `apps/platform/src/lib/ofsted-readiness/rules/types.ts`
- Test: `apps/platform/src/lib/ofsted-readiness/rules/rule-pack.test.ts`

- [ ] **Step 1: Write the type expectations test**

```ts
import { describe, expect, it } from "vitest";
import { getOfstedRuleByKey } from "./rule-pack";

describe("Ofsted rule pack", () => {
  it("exposes PE premium as one rule with both evidence and publication expectations", () => {
    const rule = getOfstedRuleByKey("pe_sport_premium");

    expect(rule?.key).toBe("pe_sport_premium");
    expect(rule?.sourceExpectations.publicWebsiteRequired).toBe(true);
    expect(rule?.sourceExpectations.internalEvidenceAccepted).toBe(true);
    expect(rule?.dateRule.kind).toBe("fixed_deadline");
    expect(rule?.dateRule.deadline).toBe("31 July");
    expect(rule?.ruleVersion).toMatch(/^\d{4}\.\d{2}$/);
  });
});
```

- [ ] **Step 2: Add shared type definitions**

```ts
export type EvidenceSourceType =
  | "website"
  | "drive"
  | "policy_manager"
  | "trust_website"
  | "manual";

export type RuleSeverity =
  | "statutory"
  | "recommended"
  | "good_practice";

export type DateValidityStatus =
  | "current"
  | "due_soon"
  | "possibly_outdated"
  | "outdated"
  | "unknown";

export interface OfstedSourceExpectations {
  publicWebsiteRequired: boolean;
  internalEvidenceAccepted: boolean;
  trustLevelAccepted: boolean;
  explanation: string;
}

export interface OfstedDateRule {
  kind: "as_needed" | "annual" | "fixed_deadline" | "every_4_years";
  deadline?: string;
  dueSoonDays: number;
  explanation: string;
}

export interface OfstedRule {
  key: string;
  name: string;
  category: string;
  ofstedCategory?: string;
  ofstedSubcategory?: string;
  severity: RuleSeverity;
  ruleVersion: string;
  sourceUrls: string[];
  lastVerified: string;
  nextRuleReview: string;
  sourceExpectations: OfstedSourceExpectations;
  dateRule: OfstedDateRule;
  requiredChecks: string[];
  qualityChecks: string[];
  redFlags: string[];
  legislation: Array<{
    key: string;
    title: string;
    currentVersion: string;
    supersededVersions: string[];
  }>;
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/ofsted-readiness/rules/rule-pack.test.ts`

Expected: FAIL because `rule-pack.ts` does not exist.

---

### Task 2: Seed Rules From Existing Requirements

**Files:**
- Create: `apps/platform/src/lib/ofsted-readiness/rules/rule-pack.ts`
- Modify: `apps/platform/src/lib/ofsted-readiness/rules/rule-pack.test.ts`

- [ ] **Step 1: Implement rule pack conversion**

```ts
import {
  WEBSITE_COMPLIANCE_REQUIREMENTS,
  type ComplianceRequirement,
} from "@/lib/website-compliance/requirements";
import { getLegislationForCategory } from "@/lib/website-compliance/rubrics/legislation-registry";
import type { OfstedDateRule, OfstedRule, OfstedSourceExpectations } from "./types";

export const CURRENT_OFSTED_RULE_VERSION = "2026.05";

function buildDateRule(requirement: ComplianceRequirement): OfstedDateRule {
  if (requirement.updateFrequency === "by_date") {
    return {
      kind: "fixed_deadline",
      deadline: requirement.deadline,
      dueSoonDays: 90,
      explanation: `This requirement must be updated by ${requirement.deadline}.`,
    };
  }

  if (requirement.updateFrequency === "annually") {
    return {
      kind: "annual",
      dueSoonDays: 60,
      explanation: "This requirement should be reviewed annually.",
    };
  }

  if (requirement.updateFrequency === "every_4_years") {
    return {
      kind: "every_4_years",
      dueSoonDays: 180,
      explanation: "This requirement should be reviewed at least every 4 years.",
    };
  }

  return {
    kind: "as_needed",
    dueSoonDays: 60,
    explanation: "This requirement should be updated when the underlying information changes.",
  };
}

function buildSourceExpectations(
  requirement: ComplianceRequirement,
): OfstedSourceExpectations {
  const publicWebsiteRequired =
    requirement.severity === "statutory" &&
    !["safeguarding"].includes(requirement.category);

  return {
    publicWebsiteRequired,
    internalEvidenceAccepted: true,
    trustLevelAccepted: Boolean(requirement.typicallyTrustLevel),
    explanation: publicWebsiteRequired
      ? "Evidence may exist internally, but this requirement should also be published on the school website or clearly linked from it."
      : "Internal evidence can support Ofsted readiness; public publication is checked separately where required.",
  };
}

export function buildOfstedRule(
  requirement: ComplianceRequirement,
): OfstedRule {
  const legislation = getLegislationForCategory(requirement.category).map(
    (entry) => ({
      key: entry.key,
      title: entry.title,
      currentVersion: entry.currentVersion,
      supersededVersions: entry.supersededVersions,
    }),
  );

  return {
    key: requirement.key,
    name: requirement.name,
    category: requirement.category,
    ofstedCategory: requirement.ofstedCategory,
    ofstedSubcategory: requirement.ofstedSubcategory,
    severity: requirement.severity,
    ruleVersion: CURRENT_OFSTED_RULE_VERSION,
    sourceUrls: requirement.legislation,
    lastVerified: "2026-05-15",
    nextRuleReview: "2026-07-31",
    sourceExpectations: buildSourceExpectations(requirement),
    dateRule: buildDateRule(requirement),
    requiredChecks: requirement.complianceCriteria,
    qualityChecks: requirement.qualityCriteria,
    redFlags: requirement.redFlags,
    legislation,
  };
}

export const OFSTED_RULE_PACK = WEBSITE_COMPLIANCE_REQUIREMENTS.map(buildOfstedRule);

export function getOfstedRuleByKey(key: string): OfstedRule | undefined {
  return OFSTED_RULE_PACK.find((rule) => rule.key === key);
}
```

- [ ] **Step 2: Run the rule pack test**

Run: `npx vitest run src/lib/ofsted-readiness/rules/rule-pack.test.ts`

Expected: PASS.

- [ ] **Step 3: Review public website exceptions**

Check the resulting rules and set explicit overrides in `buildSourceExpectations` for requirements where the source-of-truth can legitimately sit at trust level, such as academy accounts and governance information.

---

### Task 3: Move Date Validity Into Shared Engine

**Files:**
- Create: `apps/platform/src/lib/ofsted-readiness/rules/date-validity.ts`
- Create: `apps/platform/src/lib/ofsted-readiness/rules/date-validity.test.ts`
- Modify: `apps/platform/src/lib/website-compliance/phase2-assessor.ts`
- Modify: `apps/platform/src/lib/website-compliance/document-currency.test.ts`

- [ ] **Step 1: Write date validity tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { assessEvidenceDateValidity } from "./date-validity";
import { getOfstedRuleByKey } from "./rule-pack";

describe("assessEvidenceDateValidity", () => {
  it("treats 2024-25 PE report as current but due soon before 31 July 2026", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T12:00:00Z"));

    const result = assessEvidenceDateValidity({
      rule: getOfstedRuleByKey("pe_sport_premium")!,
      datesFound: ["24-25"],
    });

    expect(result.status).toBe("due_soon");
    expect(result.nextDueDate).toBe("2026-07-31");
    expect(result.explanation).toContain("currently acceptable");
  });

  it("treats 2024-25 PE report as outdated after 31 July 2026", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00Z"));

    const result = assessEvidenceDateValidity({
      rule: getOfstedRuleByKey("pe_sport_premium")!,
      datesFound: ["24-25"],
    });

    expect(result.status).toBe("outdated");
    expect(result.explanation).toContain("deadline has passed");
  });

  it("treats 2022-23 pupil premium as outdated in 2026", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T12:00:00Z"));

    const result = assessEvidenceDateValidity({
      rule: getOfstedRuleByKey("pupil_premium_strategy")!,
      datesFound: ["2022 – 23"],
    });

    expect(result.status).toBe("outdated");
  });
});
```

- [ ] **Step 2: Implement date validity helper**

Move the academic-year parsing and deadline cycle logic currently in `phase2-assessor.ts` into `date-validity.ts`, keeping the public API as:

```ts
export function assessEvidenceDateValidity(input: {
  rule: OfstedRule;
  datesFound: string[];
  now?: Date;
}): {
  status: DateValidityStatus;
  nextDueDate: string | null;
  explanation: string;
};
```

- [ ] **Step 3: Adapt website assessor**

In `phase2-assessor.ts`, convert `ComplianceRequirement` to `OfstedRule` with `getOfstedRuleByKey(req.key)` and call `assessEvidenceDateValidity`. Keep the database value as `"current"` when status is `"due_soon"` if the existing DB constraint does not yet support `due_soon`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npx vitest run src/lib/ofsted-readiness/rules/date-validity.test.ts src/lib/website-compliance/document-currency.test.ts
```

Expected: PASS.

---

### Task 4: Add Evidence Content Assessor

**Files:**
- Create: `apps/platform/src/lib/ofsted-readiness/rules/evidence-assessor.ts`
- Create: `apps/platform/src/lib/ofsted-readiness/rules/evidence-assessor.test.ts`

- [ ] **Step 1: Write safeguarding content tests**

```ts
import { describe, expect, it } from "vitest";
import { assessEvidenceContent } from "./evidence-assessor";
import { getOfstedRuleByKey } from "./rule-pack";

describe("assessEvidenceContent", () => {
  it("flags outdated KCSIE and missing filtering content in a safeguarding policy", () => {
    const result = assessEvidenceContent({
      rule: getOfstedRuleByKey("safeguarding_policy")!,
      sourceType: "drive",
      title: "Safeguarding Policy",
      text: "Safeguarding and Child Protection Policy. This policy references Keeping Children Safe in Education 2024. DSL: Jane Smith.",
      datesFound: ["2024"],
    });

    expect(result.qualityStatus).toBe("partial");
    expect(result.gaps).toContain("References superseded Keeping Children Safe in Education version 2024; current version is 2025.");
    expect(result.gaps).toContain("Filtering and monitoring content was not found.");
    expect(result.evidenceQuotes.join(" ")).toContain("DSL");
  });
});
```

- [ ] **Step 2: Implement deterministic content checks first**

```ts
export function assessEvidenceContent(input: {
  rule: OfstedRule;
  sourceType: EvidenceSourceType;
  title: string;
  text: string;
  datesFound: string[];
}): {
  qualityStatus: "strong" | "compliant" | "partial" | "weak" | "not_assessable";
  score: number;
  gaps: string[];
  recommendations: string[];
  redFlags: string[];
  evidenceQuotes: string[];
  confidence: number;
} {
  const textLower = input.text.toLowerCase();
  const gaps: string[] = [];
  const redFlags: string[] = [];
  const evidenceQuotes: string[] = [];

  for (const legislation of input.rule.legislation) {
    for (const oldVersion of legislation.supersededVersions) {
      if (
        textLower.includes(legislation.title.toLowerCase()) &&
        textLower.includes(oldVersion.toLowerCase())
      ) {
        gaps.push(
          `References superseded ${legislation.title} version ${oldVersion}; current version is ${legislation.currentVersion}.`,
        );
      }
    }
  }

  if (input.rule.key === "safeguarding_policy") {
    if (!/\b(DSL|Designated Safeguarding Lead)\b/i.test(input.text)) {
      gaps.push("Designated Safeguarding Lead was not found.");
    } else {
      evidenceQuotes.push("DSL / Designated Safeguarding Lead reference found.");
    }
    if (!/(filtering|monitoring)/i.test(input.text)) {
      gaps.push("Filtering and monitoring content was not found.");
    }
  }

  if (/\[(insert|school name|name)\]/i.test(input.text)) {
    redFlags.push("Placeholder text appears to remain in the document.");
  }

  const score = Math.max(0, 100 - gaps.length * 20 - redFlags.length * 25);
  return {
    qualityStatus:
      input.text.length < 100 ? "not_assessable" : score >= 80 ? "compliant" : "partial",
    score,
    gaps,
    recommendations: gaps.map((gap) => `Review and update: ${gap}`),
    redFlags,
    evidenceQuotes,
    confidence: input.text.length < 100 ? 0.35 : 0.8,
  };
}
```

- [ ] **Step 3: Run content tests**

Run: `npx vitest run src/lib/ofsted-readiness/rules/evidence-assessor.test.ts`

Expected: PASS.

---

### Task 5: Merge Website And Drive Evidence Per Requirement

**Files:**
- Create: `apps/platform/src/lib/ofsted-readiness/rules/source-merger.ts`
- Create: `apps/platform/src/lib/ofsted-readiness/rules/source-merger.test.ts`

- [ ] **Step 1: Write internal-vs-public test**

```ts
import { describe, expect, it } from "vitest";
import { mergeRequirementEvidence } from "./source-merger";
import { getOfstedRuleByKey } from "./rule-pack";

describe("mergeRequirementEvidence", () => {
  it("passes document quality but flags website publication when only Drive evidence exists", () => {
    const result = mergeRequirementEvidence({
      rule: getOfstedRuleByKey("pupil_premium_strategy")!,
      evidence: [
        {
          sourceType: "drive",
          url: "drive://file-123",
          title: "Pupil Premium Strategy 2025-26",
          qualityStatus: "compliant",
          score: 90,
          gaps: [],
          recommendations: [],
          redFlags: [],
          evidenceQuotes: ["Funding amount found"],
          confidence: 0.85,
        },
      ],
    });

    expect(result.documentQuality.status).toBe("compliant");
    expect(result.publication.status).toBe("missing_publication");
    expect(result.findings[0]).toContain("found internally");
  });
});
```

- [ ] **Step 2: Implement source merger**

```ts
export function mergeRequirementEvidence(input: {
  rule: OfstedRule;
  evidence: Array<{
    sourceType: EvidenceSourceType;
    url: string;
    title: string;
    qualityStatus: "strong" | "compliant" | "partial" | "weak" | "not_assessable";
    score: number;
    gaps: string[];
    recommendations: string[];
    redFlags: string[];
    evidenceQuotes: string[];
    confidence: number;
  }>;
}) {
  const bestEvidence = [...input.evidence].sort((a, b) => b.score - a.score)[0];
  const publicEvidence = input.evidence.find((item) =>
    ["website", "trust_website"].includes(item.sourceType),
  );

  const publicationMissing =
    input.rule.sourceExpectations.publicWebsiteRequired && !publicEvidence;

  return {
    ruleKey: input.rule.key,
    documentQuality: {
      status: bestEvidence?.qualityStatus || "not_found",
      score: bestEvidence?.score || 0,
      bestSourceUrl: bestEvidence?.url || null,
    },
    publication: {
      status: publicationMissing ? "missing_publication" : "satisfied",
      required: input.rule.sourceExpectations.publicWebsiteRequired,
      sourceUrl: publicEvidence?.url || null,
    },
    findings: publicationMissing && bestEvidence
      ? [
          `${input.rule.name} was found internally and appears usable, but it was not found published on the website where this requirement expects public publication.`,
        ]
      : [],
  };
}
```

- [ ] **Step 3: Run source merger tests**

Run: `npx vitest run src/lib/ofsted-readiness/rules/source-merger.test.ts`

Expected: PASS.

---

### Task 6: Hook Website Scanner Into Shared Rules

**Files:**
- Modify: `apps/platform/src/lib/website-compliance/phase2-assessor.ts`
- Test: `apps/platform/src/lib/website-compliance/document-currency.test.ts`
- Test: `apps/platform/src/lib/website-compliance/funding-results.test.ts`

- [ ] **Step 1: Replace local date rule call**

Use `getOfstedRuleByKey(req.key)` and `assessEvidenceDateValidity` inside the Phase 2 loop. Keep the existing expert-specific checks but append shared rule metadata:

```ts
const sharedRule = getOfstedRuleByKey(req.key);
const dateValidity = sharedRule
  ? assessEvidenceDateValidity({
      rule: sharedRule,
      datesFound: match.datesFound,
    })
  : null;
```

- [ ] **Step 2: Attach rule metadata to stored assessment**

Add these fields to the existing metadata JSON if present, or include them in the persisted result payload where the table already supports them:

```ts
{
  ruleVersion: sharedRule?.ruleVersion,
  ruleLastVerified: sharedRule?.lastVerified,
  nextRuleReview: sharedRule?.nextRuleReview,
  dateValidity,
  sourceExpectations: sharedRule?.sourceExpectations,
}
```

- [ ] **Step 3: Run website focused tests**

Run:

```bash
npx vitest run src/lib/website-compliance/document-currency.test.ts src/lib/website-compliance/funding-results.test.ts src/lib/website-compliance/financial-link.test.ts
```

Expected: PASS.

---

### Task 7: Add Research-Backed Enhancement Suggestions

**Files:**
- Create: `apps/platform/src/lib/ofsted-readiness/rules/research-suggestions.ts`
- Create: `apps/platform/src/lib/ofsted-readiness/rules/research-suggestions.test.ts`
- Reuse: `apps/platform/src/lib/eef-toolkit.ts`

- [ ] **Step 1: Write tests that keep suggestions separate from compliance**

```ts
import { describe, expect, it } from "vitest";
import { buildResearchSuggestions } from "./research-suggestions";
import { getOfstedRuleByKey } from "./rule-pack";

describe("buildResearchSuggestions", () => {
  it("suggests EEF strategies without changing a compliant judgement", () => {
    const suggestions = buildResearchSuggestions({
      rule: getOfstedRuleByKey("pupil_premium_strategy")!,
      judgementStatus: "compliant",
      gaps: [],
      text: "Pupil premium strategy. Targeted academic support includes small group tuition for disadvantaged pupils.",
    });

    expect(suggestions[0]?.level).toBe("enhancement");
    expect(suggestions[0]?.changesComplianceStatus).toBe(false);
    expect(suggestions[0]?.sourceName).toContain("EEF");
    expect(suggestions[0]?.sourceUrl).toBe(
      "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit",
    );
  });
});
```

- [ ] **Step 2: Implement research suggestion type and matcher**

```ts
import { eefStrategies } from "@/lib/eef-toolkit";
import type { OfstedRule } from "./types";

export interface ResearchSuggestion {
  level: "enhancement" | "consideration";
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  evidenceStrength?: number;
  expectedImpact?: string;
  changesComplianceStatus: false;
}

export function buildResearchSuggestions(input: {
  rule: OfstedRule;
  judgementStatus: "compliant" | "partial" | "not_found" | "outdated";
  gaps: string[];
  text: string;
}): ResearchSuggestion[] {
  const searchText = `${input.rule.name} ${input.rule.category} ${input.gaps.join(" ")} ${input.text}`.toLowerCase();

  const matchingStrategies = eefStrategies
    .filter((strategy) =>
      strategy.keywords.some((keyword) => searchText.includes(keyword.toLowerCase())),
    )
    .sort(
      (a, b) =>
        b.monthsProgress * b.evidenceStrength -
        a.monthsProgress * a.evidenceStrength,
    )
    .slice(0, 3);

  return matchingStrategies.map((strategy) => ({
    level: input.judgementStatus === "compliant" ? "enhancement" : "consideration",
    title: `Consider ${strategy.name}`,
    summary:
      `${strategy.name} is an EEF strategy linked to this area. ` +
      `EEF reports an indicative impact of +${strategy.monthsProgress} months, ` +
      `with evidence strength ${strategy.evidenceStrength}/5 and cost rating ${strategy.costRating}/5. ` +
      `This is a research-informed improvement suggestion, not a compliance failure.`,
    sourceName: "Education Endowment Foundation Teaching and Learning Toolkit",
    sourceUrl:
      "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit",
    evidenceStrength: strategy.evidenceStrength,
    expectedImpact: `+${strategy.monthsProgress} months`,
    changesComplianceStatus: false,
  }));
}
```

- [ ] **Step 3: Attach suggestions to assessment metadata**

Where a rule assessment result is stored, include:

```ts
researchSuggestions: buildResearchSuggestions({
  rule: sharedRule,
  judgementStatus: finalStatus,
  gaps: result.gaps,
  text: combinedContent,
})
```

Do not put these into `gaps`, `red_flags` or required actions. They belong in a separate `researchSuggestions` metadata field and a separate UI section.

- [ ] **Step 4: Run research suggestion tests**

Run:

```bash
npx vitest run src/lib/ofsted-readiness/rules/research-suggestions.test.ts
```

Expected: PASS.

---

### Task 8: Hook Drive Scan Into Shared Rules

**Files:**
- Modify: `apps/platform/src/app/api/ofsted/connections/scan/route.ts`
- Modify: `apps/platform/src/app/api/ofsted/inspect/route.ts`
- Test: create `apps/platform/src/lib/ofsted-readiness/rules/drive-classification.test.ts` if classification is extracted into a helper.

- [ ] **Step 1: Extract Drive classification helper**

Create a small helper inside the rules folder:

```ts
export function classifyEvidenceToRule(input: {
  fileName: string;
  folderPath: string;
}): { ruleKey: string; confidence: number; reason: string } | null {
  const search = `${input.fileName} ${input.folderPath}`.toLowerCase();
  if (search.includes("pupil premium")) {
    return { ruleKey: "pupil_premium_strategy", confidence: 90, reason: "Matched pupil premium filename/folder." };
  }
  if (search.includes("sport") && (search.includes("premium") || search.includes("grant"))) {
    return { ruleKey: "pe_sport_premium", confidence: 90, reason: "Matched PE sport premium filename/folder." };
  }
  if (search.includes("safeguarding") || search.includes("child protection")) {
    return { ruleKey: "safeguarding_policy", confidence: 90, reason: "Matched safeguarding filename/folder." };
  }
  return null;
}
```

- [ ] **Step 2: Store requirement key on Drive document checks**

When upserting `ofsted_document_checks`, store:

```ts
expected_document: ruleMatch?.ruleKey || match.matchedKeywords.join(", "),
evaluation_area: matchedRule?.ofstedCategory || match.category,
inspection_detail: {
  ruleKey: ruleMatch?.ruleKey,
  ruleVersion: matchedRule?.ruleVersion,
  sourceType: "drive",
}
```

If `inspection_detail` cannot be safely written during the upsert without overwriting existing inspection details, include these values in the request body to `/api/ofsted/inspect` instead.

- [ ] **Step 3: Use OAuth token in inspect route**

Replace API-key-only Drive download/export calls with the same access token logic used in `data-connections/files/route.ts`. Keep `GOOGLE_API_KEY` only as fallback for legacy public files.

- [ ] **Step 4: Call shared content assessor**

After text extraction:

```ts
const rule = ruleKey ? getOfstedRuleByKey(ruleKey) : null;
const sharedAssessment = rule
  ? assessEvidenceContent({
      rule,
      sourceType: "drive",
      title: resolved.name,
      text: truncatedContent,
      datesFound: extractDates(truncatedContent),
    })
  : null;
```

Store `sharedAssessment` in `inspection_detail.sharedRuleAssessment`.

- [ ] **Step 5: Run Drive-focused checks locally**

Run:

```bash
npx eslint src/app/api/ofsted/connections/scan/route.ts src/app/api/ofsted/inspect/route.ts src/lib/ofsted-readiness/rules
npx vitest run src/lib/ofsted-readiness/rules
```

Expected: PASS.

---

### Task 9: Display Source-Separated Results And Research Suggestions

**Files:**
- Modify: `apps/platform/src/components/website-compliance/WebsiteComplianceResults.tsx`
- Modify: `apps/platform/src/components/ofsted/WebsiteComplianceTab.tsx` if additional data mapping is needed.

- [ ] **Step 1: Show helpful wording for mixed outcomes**

When a result has internal evidence but missing publication, show:

```text
Document found internally. Publication gap remains: this should also be visible on the school website.
```

When a result is valid but nearing deadline, show:

```text
Current, next due: 31 July 2026.
```

- [ ] **Step 2: Add a separate research suggestions section**

Use wording that does not imply failure:

```text
Research-backed enhancement suggestions
This item appears compliant. These are optional ideas that may strengthen practice or evidence further.
```

Each suggestion should show:

- strategy title;
- source name;
- source link;
- expected impact/evidence strength where available;
- why it is relevant.

- [ ] **Step 2: Keep the existing evidence links clickable**

Ensure source links remain visible as:

- `Open here`
- `New tab`
- `Copy link`

- [ ] **Step 3: Verify labels do not mix compliance and enhancement**

Confirm:

- statutory gaps remain under `Gaps identified`;
- optional EEF suggestions appear under `Research-backed enhancement suggestions`;
- compliant items do not show research suggestions as warnings or failures.

- [ ] **Step 4: Verify in browser**

Open `http://localhost:3000/dashboard/ofsted-readiness`, switch to the Website tab, expand PE & Sport Premium, and confirm the UI separates the compliant document from the deadline reminder.

---

### Task 10: Test With Grove House Drive Document

**Files:**
- No code file required unless a test fixture helper is added.

- [ ] **Step 1: Add a test document manually**

Add a deliberately small test file to the connected Grove House folder:

```text
Schoolgle / Ofsted Readiness / Safeguarding / Safeguarding_and_Child_Protection_Policy_2025-26.docx
```

The document content should include:

```text
Safeguarding and Child Protection Policy
Keeping Children Safe in Education 2025
Designated Safeguarding Lead: Test DSL
Deputy Designated Safeguarding Lead: Test Deputy DSL
Filtering and monitoring arrangements are reviewed by leaders and governors.
Review date: September 2025
```

- [ ] **Step 2: Run the local Drive scan**

Use the existing UI button or POST `/api/ofsted/connections/scan`.

Expected:

- The file is detected from Drive.
- The rule key resolves to `safeguarding_policy`.
- The shared rule assessment is stored under the document inspection detail.
- If the website has an older safeguarding policy, the merged judgement should say the current policy exists internally but the website publication is stale.

- [ ] **Step 3: Remove or archive the test document if it should not remain as school evidence**

If the test file is only for development, move it to:

```text
Schoolgle / Ofsted Readiness / _Archive - Do Not Scan
```

Do not delete customer evidence automatically.

---

## Self-Review

- Spec coverage: Covers one shared rule set, date/deadline validity, content quality, website-vs-internal source separation, Drive integration, UI wording and Grove House test flow.
- Research coverage: Adds optional EEF-backed enhancement suggestions as a separate output so they do not downgrade compliance.
- Placeholder scan: No implementation step relies on a `TBD` or vague “add checks later” instruction.
- Type consistency: `OfstedRule`, `EvidenceSourceType`, `DateValidityStatus`, `assessEvidenceDateValidity`, `assessEvidenceContent`, `mergeRequirementEvidence` and `ResearchSuggestion` are defined before use.
- Local safety: This plan makes local code changes only. Do not commit or push unless the product owner explicitly asks.
