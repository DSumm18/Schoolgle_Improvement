export type PolicyQualitySeverity = "statutory" | "expected" | "good_practice";
export type PolicyQualityCheckStatus = "met" | "partial" | "missing";
export type PolicyQualityRating =
  | "strong"
  | "broadly_compliant"
  | "weak"
  | "high_risk"
  | "not_available";

export type PolicySourceAuthority =
  | "legislation"
  | "statutory_guidance"
  | "dfe_advice"
  | "govuk_advice"
  | "sector_good_practice";

export type PolicyQualitySource = {
  id: string;
  title: string;
  authority: PolicySourceAuthority;
  publisher: string;
  url: string;
  lastChecked: string;
};

export type PolicyQualityRule = {
  id: string;
  title: string;
  description: string;
  severity: PolicyQualitySeverity;
  weight: number;
  sourceRefs: PolicyQualitySource[];
  keywordGroups: string[][];
  missingAction: string;
};

export type PolicyQualityCheck = {
  rule: PolicyQualityRule;
  status: PolicyQualityCheckStatus;
  score: number;
  evidence: string[];
};

export type PolicyQualityAnalysis = {
  available: boolean;
  rulePackId: string | null;
  rulePackName: string | null;
  score: number | null;
  rating: PolicyQualityRating;
  checks: PolicyQualityCheck[];
  summary: {
    met: number;
    partial: number;
    missing: number;
    statutoryMissing: number;
  };
  recommendedActions: string[];
};

type PolicyQualityRulePack = {
  id: string;
  requirementId: string;
  name: string;
  rules: PolicyQualityRule[];
};

const BEHAVIOUR_IN_SCHOOLS: PolicyQualitySource = {
  id: "dfe-behaviour-in-schools-2024",
  title: "Behaviour in schools: advice for headteachers and school staff",
  authority: "dfe_advice",
  publisher: "Department for Education",
  url: "https://assets.publishing.service.gov.uk/media/65ce3721e1bdec001a3221fe/Behaviour_in_schools_-_advice_for_headteachers_and_school_staff_Feb_2024.pdf",
  lastChecked: "2026-05-01",
};

const SCHOOL_BEHAVIOUR_EXCLUSIONS: PolicyQualitySource = {
  id: "govuk-school-behaviour-exclusions",
  title: "School behaviour and exclusions",
  authority: "govuk_advice",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/school-behaviour-exclusions",
  lastChecked: "2026-05-01",
};

const SUSPENSION_EXCLUSION_GUIDANCE: PolicyQualitySource = {
  id: "dfe-suspension-permanent-exclusion-2023",
  title:
    "Suspension and permanent exclusion from maintained schools, academies and pupil referral units in England",
  authority: "statutory_guidance",
  publisher: "Department for Education",
  url: "https://www.gov.uk/government/publications/school-exclusion",
  lastChecked: "2026-05-01",
};

const PREVENTING_TACKLING_BULLYING: PolicyQualitySource = {
  id: "dfe-preventing-tackling-bullying",
  title: "Preventing and tackling bullying",
  authority: "dfe_advice",
  publisher: "Department for Education",
  url: "https://www.gov.uk/government/publications/preventing-and-tackling-bullying",
  lastChecked: "2026-05-01",
};

const BULLYING_AT_SCHOOL: PolicyQualitySource = {
  id: "govuk-bullying-at-school",
  title: "Bullying at school",
  authority: "govuk_advice",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/bullying-at-school",
  lastChecked: "2026-05-01",
};

const EQUALITY_ACT_2010: PolicyQualitySource = {
  id: "equality-act-2010",
  title: "Equality Act 2010",
  authority: "legislation",
  publisher: "UK Government",
  url: "https://www.legislation.gov.uk/ukpga/2010/15/contents",
  lastChecked: "2026-05-01",
};

const SEND_CODE_OF_PRACTICE: PolicyQualitySource = {
  id: "send-code-of-practice",
  title: "SEND code of practice: 0 to 25 years",
  authority: "statutory_guidance",
  publisher: "Department for Education / Department of Health",
  url: "https://www.gov.uk/government/publications/send-code-of-practice-0-to-25",
  lastChecked: "2026-05-01",
};

const BEHAVIOUR_POLICY_RULE_PACK: PolicyQualityRulePack = {
  id: "behaviour-policy-dfe-2024",
  requirementId: "behaviour-policy",
  name: "Behaviour Policy content check",
  rules: [
    {
      id: "behaviour-expectations",
      title: "Behaviour rules and expectations",
      description:
        "Sets out the school rules, expected pupil conduct and the standard of behaviour pupils should meet.",
      severity: "statutory",
      weight: 12,
      sourceRefs: [BEHAVIOUR_IN_SCHOOLS, SCHOOL_BEHAVIOUR_EXCLUSIONS],
      keywordGroups: [["rule", "rules", "expectation", "expected"], ["conduct", "behaviour"]],
      missingAction:
        "Add a clear section describing school rules and expected pupil conduct.",
    },
    {
      id: "rewards-sanctions",
      title: "Rewards, consequences and sanctions",
      description:
        "Explains rewards, consequences, sanctions and how staff apply them consistently.",
      severity: "statutory",
      weight: 12,
      sourceRefs: [BEHAVIOUR_IN_SCHOOLS, SCHOOL_BEHAVIOUR_EXCLUSIONS],
      keywordGroups: [["reward", "praise"], ["sanction", "consequence", "detention"]],
      missingAction:
        "Explain the rewards and sanctions ladder, including how consequences are applied fairly.",
    },
    {
      id: "bullying",
      title: "Bullying prevention and response",
      description:
        "Covers what the school does to prevent and respond to bullying.",
      severity: "expected",
      weight: 10,
      sourceRefs: [BULLYING_AT_SCHOOL, PREVENTING_TACKLING_BULLYING],
      keywordGroups: [["bullying", "anti bullying", "anti-bullying"]],
      missingAction:
        "Add or cross-reference the anti-bullying approach and response process.",
    },
    {
      id: "outside-online-behaviour",
      title: "Outside-school and online behaviour",
      description:
        "Explains when the school may respond to behaviour outside school or online behaviour affecting pupils.",
      severity: "expected",
      weight: 10,
      sourceRefs: [BEHAVIOUR_IN_SCHOOLS, SCHOOL_BEHAVIOUR_EXCLUSIONS],
      keywordGroups: [["online", "cyber"], ["outside school", "off-site", "to and from school"]],
      missingAction:
        "Clarify how online behaviour and behaviour outside school are handled.",
    },
    {
      id: "send-equality",
      title: "SEND, equality and reasonable adjustments",
      description:
        "Shows how the policy accounts for SEND, disability, equality duties and reasonable adjustments.",
      severity: "statutory",
      weight: 14,
      sourceRefs: [EQUALITY_ACT_2010, SEND_CODE_OF_PRACTICE, BEHAVIOUR_IN_SCHOOLS],
      keywordGroups: [
        ["send", "sen", "special educational needs", "disability"],
        ["reasonable adjustment", "reasonable adjustments", "equality"],
      ],
      missingAction:
        "Add SEND/equality wording explaining reasonable adjustments and individual circumstances.",
    },
    {
      id: "behaviour-powers",
      title: "Behaviour powers and interventions",
      description:
        "Covers relevant powers/interventions such as detention, removal, searching, confiscation or reasonable force.",
      severity: "expected",
      weight: 10,
      sourceRefs: [BEHAVIOUR_IN_SCHOOLS],
      keywordGroups: [["detention", "removal", "reasonable force", "search", "confiscation"]],
      missingAction:
        "Set out relevant behaviour powers and when they may be used.",
    },
    {
      id: "suspension-exclusion",
      title: "Suspension and permanent exclusion",
      description:
        "Links serious or persistent breaches to suspension/permanent exclusion and statutory process.",
      severity: "statutory",
      weight: 14,
      sourceRefs: [SUSPENSION_EXCLUSION_GUIDANCE],
      keywordGroups: [["suspension", "suspend"], ["permanent exclusion", "exclusion"]],
      missingAction:
        "Add suspension and permanent exclusion wording linked to statutory guidance and process.",
    },
    {
      id: "roles-responsibilities",
      title: "Roles and responsibilities",
      description:
        "Names responsibilities for leaders, staff, governors, pupils and parents/carers.",
      severity: "expected",
      weight: 10,
      sourceRefs: [BEHAVIOUR_IN_SCHOOLS],
      keywordGroups: [["headteacher", "staff", "governor"], ["parent", "pupil"]],
      missingAction:
        "Add responsibilities for leaders, staff, governors, pupils and parents/carers.",
    },
    {
      id: "review-publication",
      title: "Approval, review and publication",
      description:
        "Includes approval/review information and supports publication on the school website.",
      severity: "good_practice",
      weight: 8,
      sourceRefs: [SCHOOL_BEHAVIOUR_EXCLUSIONS, BEHAVIOUR_IN_SCHOOLS],
      keywordGroups: [["review", "approved", "ratified"], ["website", "publish", "published", "governor"]],
      missingAction:
        "Add approval/review details and make clear the policy is published or available to parents.",
    },
  ],
};

const RULE_PACKS = [BEHAVIOUR_POLICY_RULE_PACK];

export function analysePolicyQuality({
  requirementId,
  text,
}: {
  requirementId: string;
  text: string;
}): PolicyQualityAnalysis {
  const rulePack = RULE_PACKS.find((pack) => pack.requirementId === requirementId);

  if (!rulePack) {
    return {
      available: false,
      rulePackId: null,
      rulePackName: null,
      score: null,
      rating: "not_available",
      checks: [],
      summary: { met: 0, partial: 0, missing: 0, statutoryMissing: 0 },
      recommendedActions: [],
    };
  }

  const normalisedText = normalise(text);
  const checks = rulePack.rules.map((rule) =>
    scoreRule(rule, normalisedText, text),
  );
  const totalWeight = rulePack.rules.reduce((total, rule) => total + rule.weight, 0);
  const score = Math.round(
    checks.reduce((total, check) => total + check.score, 0) / totalWeight,
  );
  const summary = {
    met: checks.filter((check) => check.status === "met").length,
    partial: checks.filter((check) => check.status === "partial").length,
    missing: checks.filter((check) => check.status === "missing").length,
    statutoryMissing: checks.filter(
      (check) =>
        check.status === "missing" && check.rule.severity === "statutory",
    ).length,
  };

  return {
    available: true,
    rulePackId: rulePack.id,
    rulePackName: rulePack.name,
    score,
    rating: getRating(score, summary.statutoryMissing),
    checks,
    summary,
    recommendedActions: checks
      .filter((check) => check.status !== "met")
      .sort((a, b) => b.rule.weight - a.rule.weight)
      .slice(0, 5)
      .map((check) => check.rule.missingAction),
  };
}

function scoreRule(
  rule: PolicyQualityRule,
  normalisedText: string,
  originalText: string,
): PolicyQualityCheck {
  const groupResults = rule.keywordGroups.map((group) =>
    group.some((keyword) => normalisedText.includes(normalise(keyword))),
  );
  const hits = groupResults.filter(Boolean).length;
  const status: PolicyQualityCheckStatus =
    hits === rule.keywordGroups.length
      ? "met"
      : hits > 0
        ? "partial"
        : "missing";
  const multiplier = status === "met" ? 100 : status === "partial" ? 45 : 0;

  return {
    rule,
    status,
    score: rule.weight * multiplier,
    evidence: extractEvidence(originalText, rule.keywordGroups),
  };
}

function extractEvidence(text: string, keywordGroups: string[][]): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const keywords = keywordGroups.flat().map(normalise);
  const evidence: string[] = [];

  for (const line of lines) {
    const normalisedLine = normalise(line);
    if (keywords.some((keyword) => normalisedLine.includes(keyword))) {
      evidence.push(line);
    }
    if (evidence.length >= 3) break;
  }

  return evidence;
}

function getRating(score: number, statutoryMissing: number): PolicyQualityRating {
  if (statutoryMissing >= 2 || score < 50) return "high_risk";
  if (score < 70) return "weak";
  if (score < 90) return "broadly_compliant";
  return "strong";
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
