import type {
  OfstedCategoryId,
  OfstedSubCategoryId,
} from "@/lib/ofsted/types";
import {
  type ComplianceRequirement,
  type RequirementCategory,
  WEBSITE_COMPLIANCE_REQUIREMENTS,
} from "./requirements";

export type WebsiteEvidenceSourceOwner = "school" | "trust" | "external";
export type WebsiteEvidenceConfidence = "high" | "medium" | "low";
export type WebsiteEvidenceRole = "direct" | "supporting" | "context";

export interface WebsiteEvidenceInput {
  url: string;
  title?: string | null;
  linkText?: string | null;
  foundOnPageUrl?: string | null;
  foundOnPageTitle?: string | null;
  headings?: string[];
  text?: string | null;
  source?: string | null;
}

export interface WebsiteEvidenceRoute {
  sourceUrl: string;
  sourceTitle: string;
  sourceOwner: WebsiteEvidenceSourceOwner;
  foundOnUrl: string | null;
  foundOnTitle: string | null;
  requirementKey: string | null;
  requirementName: string | null;
  requirementCategory: RequirementCategory | null;
  ofstedCategoryId: OfstedCategoryId;
  subcategoryId: OfstedSubCategoryId;
  confidence: WebsiteEvidenceConfidence;
  confidenceScore: number;
  evidenceRole: WebsiteEvidenceRole;
  requiresQualityAssessment: boolean;
  crossCuttingTags: string[];
  signals: string[];
}

export interface WebsiteEvidenceRoutingSummary {
  totalRoutes: number;
  byCategory: Partial<Record<OfstedCategoryId, number>>;
  bySourceOwner: Partial<Record<WebsiteEvidenceSourceOwner, number>>;
  directEvidence: number;
  needsQualityAssessment: number;
  topRoutes: Array<
    Pick<
      WebsiteEvidenceRoute,
      | "sourceUrl"
      | "sourceTitle"
      | "sourceOwner"
      | "foundOnUrl"
      | "requirementKey"
      | "requirementName"
      | "ofstedCategoryId"
      | "subcategoryId"
      | "confidence"
      | "confidenceScore"
      | "evidenceRole"
      | "signals"
    >
  >;
}

interface RequirementScore {
  requirement: ComplianceRequirement;
  score: number;
  signals: string[];
}

const KEYWORD_TO_ROUTE: Array<{
  keywords: string[];
  categoryId: OfstedCategoryId;
  subcategoryId: OfstedSubCategoryId;
  tag?: string;
}> = [
  {
    keywords: ["safeguarding", "child protection", "kcsie", "dsl"],
    categoryId: "leadership-governance",
    subcategoryId: "leadership-governance",
    tag: "safeguarding",
  },
  {
    keywords: ["send", "sen", "special educational needs", "senco"],
    categoryId: "inclusion",
    subcategoryId: "inclusion-send",
  },
  {
    keywords: ["pupil premium", "disadvantaged"],
    categoryId: "inclusion",
    subcategoryId: "inclusion-disadvantaged",
  },
  {
    keywords: ["phonics", "reading", "literacy"],
    categoryId: "curriculum-teaching",
    subcategoryId: "curriculum-reading",
  },
  {
    keywords: ["curriculum", "teaching", "learning", "subject"],
    categoryId: "curriculum-teaching",
    subcategoryId: "curriculum-intent",
  },
  {
    keywords: ["ks2", "results", "performance", "outcomes"],
    categoryId: "achievement",
    subcategoryId: "achievement-outcomes",
  },
  {
    keywords: ["attendance", "absence", "persistent absence"],
    categoryId: "attendance-behaviour",
    subcategoryId: "attendance-overall",
  },
  {
    keywords: ["behaviour", "behavior", "bullying", "exclusion", "suspension"],
    categoryId: "attendance-behaviour",
    subcategoryId: "behaviour-conduct",
  },
  {
    keywords: ["rse", "rshe", "relationships education", "pshe"],
    categoryId: "personal-development",
    subcategoryId: "pd-rse",
  },
  {
    keywords: ["pe and sport", "sport premium", "enrichment", "cultural capital"],
    categoryId: "personal-development",
    subcategoryId: "pd-enrichment",
  },
  {
    keywords: ["governance", "governor", "trustee", "leadership"],
    categoryId: "leadership-governance",
    subcategoryId: "leadership-governance",
  },
];

export function routeWebsiteEvidenceItems(
  items: WebsiteEvidenceInput[],
): WebsiteEvidenceRoute[] {
  return items.map((item) => routeWebsiteEvidenceItem(item));
}

export function summariseWebsiteEvidenceRoutes(
  routes: WebsiteEvidenceRoute[],
): WebsiteEvidenceRoutingSummary {
  const usefulRoutes = routes
    .filter((routeItem) => routeItem.confidence !== "low")
    .sort((first, second) => second.confidenceScore - first.confidenceScore);

  return {
    totalRoutes: usefulRoutes.length,
    byCategory: countRoutesByCategory(usefulRoutes),
    bySourceOwner: countRoutesBySourceOwner(usefulRoutes),
    directEvidence: usefulRoutes.filter(
      (routeItem) => routeItem.evidenceRole === "direct",
    ).length,
    needsQualityAssessment: usefulRoutes.filter(
      (routeItem) => routeItem.requiresQualityAssessment,
    ).length,
    topRoutes: usefulRoutes.slice(0, 50).map((routeItem) => ({
      sourceUrl: routeItem.sourceUrl,
      sourceTitle: routeItem.sourceTitle,
      sourceOwner: routeItem.sourceOwner,
      foundOnUrl: routeItem.foundOnUrl,
      requirementKey: routeItem.requirementKey,
      requirementName: routeItem.requirementName,
      ofstedCategoryId: routeItem.ofstedCategoryId,
      subcategoryId: routeItem.subcategoryId,
      confidence: routeItem.confidence,
      confidenceScore: routeItem.confidenceScore,
      evidenceRole: routeItem.evidenceRole,
      signals: routeItem.signals.slice(0, 5),
    })),
  };
}

export function routeWebsiteEvidenceItem(
  item: WebsiteEvidenceInput,
): WebsiteEvidenceRoute {
  const bestMatch = scoreRequirements(item).sort((first, second) => {
    return second.score - first.score;
  })[0];
  const fallbackRoute = inferRouteFromKeywords(item);
  const requirementRoute = bestMatch
    ? mapRequirementToOfsted(bestMatch.requirement, item)
    : null;
  const categoryId =
    requirementRoute?.categoryId || fallbackRoute.categoryId;
  const subcategoryId =
    requirementRoute?.subcategoryId || fallbackRoute.subcategoryId;
  const crossCuttingTags = Array.from(
    new Set([
      ...fallbackRoute.crossCuttingTags,
      ...(requirementRoute?.crossCuttingTags || []),
    ]),
  );
  const confidenceScore = bestMatch?.score || fallbackRoute.score;

  return {
    sourceUrl: item.url,
    sourceTitle: cleanTitle(item.title || item.linkText || item.url),
    sourceOwner: normaliseSourceOwner(item.source),
    foundOnUrl: item.foundOnPageUrl || null,
    foundOnTitle: item.foundOnPageTitle || null,
    requirementKey: bestMatch?.requirement.key || null,
    requirementName: bestMatch?.requirement.name || null,
    requirementCategory: bestMatch?.requirement.category || null,
    ofstedCategoryId: categoryId,
    subcategoryId,
    confidence: confidenceFromScore(confidenceScore),
    confidenceScore,
    evidenceRole: evidenceRoleFromScore(confidenceScore, item),
    requiresQualityAssessment: Boolean(bestMatch?.requirement.severity),
    crossCuttingTags,
    signals: Array.from(
      new Set([...(bestMatch?.signals || []), ...fallbackRoute.signals]),
    ),
  };
}

function scoreRequirements(item: WebsiteEvidenceInput): RequirementScore[] {
  return WEBSITE_COMPLIANCE_REQUIREMENTS.map((requirement) => {
    const signals: string[] = [];
    let score = 0;
    const label = signalLabel(requirement);
    const primaryContext = normaliseSearchText([
      item.title,
      item.linkText,
      item.url,
      ...(item.headings || []),
    ]);
    const foundOnContext = normaliseSearchText([
      item.foundOnPageUrl,
      item.foundOnPageTitle,
    ]);
    const documentContext = normaliseSearchText([
      item.title,
      item.linkText,
      item.url,
    ]);
    const contentContext = normaliseSearchText([item.text]);

    for (const pattern of requirement.documentPatterns) {
      if (containsPhrase(documentContext, pattern)) {
        score += 18;
        signals.push(`document title matched ${label}`);
      }
    }

    for (const pattern of requirement.urlPatterns) {
      if (containsUrlPattern(item.url, pattern)) {
        score += 6;
        signals.push(`source url matched ${label}`);
      }
      if (
        item.foundOnPageUrl &&
        containsUrlPattern(item.foundOnPageUrl, pattern)
      ) {
        score += 5;
        signals.push(`found-on page matched ${label}`);
      }
    }

    for (const keyword of requirement.searchKeywords) {
      if (containsPhrase(primaryContext, keyword)) {
        score += 5;
        signals.push(`page context matched ${normaliseKeyword(keyword)}`);
      }
      if (containsPhrase(foundOnContext, keyword)) {
        score += 4;
        signals.push(`found-on page matched ${normaliseKeyword(keyword)}`);
      }
      if (containsPhrase(contentContext, keyword)) {
        score += 2;
      }
    }

    if (requirement.category === "send" && containsPhrase(foundOnContext, "send")) {
      score += 8;
      signals.push("found-on page matched send");
    }

    if (
      requirement.category === "safeguarding" &&
      containsPhrase(documentContext, "safeguarding")
    ) {
      score += 8;
      signals.push("document title matched safeguarding");
    }

    if (requirement.typicallyTrustLevel && item.source === "trust") {
      score += 4;
      signals.push("trust-hosted statutory requirement");
    }

    return {
      requirement,
      score,
      signals,
    };
  }).filter((match) => match.score > 0);
}

function inferRouteFromKeywords(item: WebsiteEvidenceInput) {
  const context = normaliseSearchText([
    item.url,
    item.title,
    item.linkText,
    item.foundOnPageUrl,
    item.foundOnPageTitle,
    ...(item.headings || []),
    item.text,
  ]);

  for (const route of KEYWORD_TO_ROUTE) {
    const matchedKeyword = route.keywords.find((keyword) =>
      containsPhrase(context, keyword),
    );
    if (matchedKeyword) {
      return {
        categoryId: route.categoryId,
        subcategoryId: route.subcategoryId,
        crossCuttingTags: route.tag ? [route.tag] : [],
        score: 8,
        signals: [`keyword matched ${normaliseKeyword(matchedKeyword)}`],
      };
    }
  }

  return {
    categoryId: "leadership-governance" as OfstedCategoryId,
    subcategoryId: "leadership-governance" as OfstedSubCategoryId,
    crossCuttingTags: [],
    score: 1,
    signals: ["defaulted to leadership and governance"],
  };
}

function mapRequirementToOfsted(
  requirement: ComplianceRequirement,
  item: WebsiteEvidenceInput,
): {
  categoryId: OfstedCategoryId;
  subcategoryId: OfstedSubCategoryId;
  crossCuttingTags: string[];
} {
  if (requirement.key === "send_information_report") {
    return route("inclusion", "inclusion-send");
  }

  if (requirement.key === "pupil_premium_statement") {
    return route("inclusion", "inclusion-disadvantaged");
  }

  if (requirement.key === "phonics_reading") {
    return route("curriculum-teaching", "curriculum-reading");
  }

  if (requirement.key === "curriculum_content") {
    return route("curriculum-teaching", "curriculum-intent");
  }

  if (requirement.key === "safeguarding_policy") {
    return route("leadership-governance", "leadership-governance", [
      "safeguarding",
    ]);
  }

  if (requirement.key === "behaviour_policy") {
    return route("attendance-behaviour", "behaviour-conduct");
  }

  if (requirement.key.includes("attendance")) {
    return route("attendance-behaviour", "attendance-overall");
  }

  if (requirement.category === "send") {
    return route("inclusion", "inclusion-send");
  }

  if (requirement.category === "pupil_premium") {
    return route("inclusion", "inclusion-disadvantaged");
  }

  if (requirement.category === "curriculum") {
    return route("curriculum-teaching", "curriculum-intent");
  }

  if (requirement.category === "safeguarding") {
    return route("leadership-governance", "leadership-governance", [
      "safeguarding",
    ]);
  }

  if (requirement.category === "performance_data") {
    return route("achievement", "achievement-outcomes");
  }

  if (
    requirement.category === "pe_sport_premium" ||
    requirement.category === "careers"
  ) {
    return route("personal-development", "pd-enrichment");
  }

  if (requirement.category === "policies") {
    return inferPolicyRoute(item);
  }

  return mapLegacyOfstedCategory(requirement);
}

function inferPolicyRoute(item: WebsiteEvidenceInput) {
  const context = normaliseSearchText([
    item.url,
    item.title,
    item.linkText,
    item.text,
  ]);

  if (containsPhrase(context, "attendance")) {
    return route("attendance-behaviour", "attendance-overall");
  }
  if (
    containsPhrase(context, "behaviour") ||
    containsPhrase(context, "bullying")
  ) {
    return route("attendance-behaviour", "behaviour-conduct");
  }
  if (
    containsPhrase(context, "rse") ||
    containsPhrase(context, "relationships")
  ) {
    return route("personal-development", "pd-rse");
  }
  if (containsPhrase(context, "safeguarding")) {
    return route("leadership-governance", "leadership-governance", [
      "safeguarding",
    ]);
  }

  return route("leadership-governance", "leadership-governance");
}

function mapLegacyOfstedCategory(requirement: ComplianceRequirement) {
  if (requirement.ofstedSubcategory === "education-reading") {
    return route("curriculum-teaching", "curriculum-reading");
  }

  if (requirement.ofstedSubcategory === "education-outcomes") {
    return route("achievement", "achievement-outcomes");
  }

  switch (requirement.ofstedCategory) {
    case "inclusion":
      return route("inclusion", "inclusion-send");
    case "quality-of-education":
      return route("curriculum-teaching", "curriculum-intent");
    case "behaviour-attitudes":
      return route("attendance-behaviour", "behaviour-conduct");
    case "personal-development":
    case "personal_development":
      return route("personal-development", "pd-enrichment");
    case "leadership-management":
    case "leadership_management":
      return route("leadership-governance", "leadership-governance");
    case "safeguarding":
      return route("leadership-governance", "leadership-governance", [
        "safeguarding",
      ]);
    default:
      return route("leadership-governance", "leadership-governance");
  }
}

function route(
  categoryId: OfstedCategoryId,
  subcategoryId: OfstedSubCategoryId,
  crossCuttingTags: string[] = [],
) {
  return {
    categoryId,
    subcategoryId,
    crossCuttingTags,
  };
}

function countRoutesByCategory(
  routes: WebsiteEvidenceRoute[],
): Partial<Record<OfstedCategoryId, number>> {
  return routes.reduce<Partial<Record<OfstedCategoryId, number>>>(
    (counts, routeItem) => {
      counts[routeItem.ofstedCategoryId] =
        (counts[routeItem.ofstedCategoryId] || 0) + 1;
      return counts;
    },
    {},
  );
}

function countRoutesBySourceOwner(
  routes: WebsiteEvidenceRoute[],
): Partial<Record<WebsiteEvidenceSourceOwner, number>> {
  return routes.reduce<Partial<Record<WebsiteEvidenceSourceOwner, number>>>(
    (counts, routeItem) => {
      counts[routeItem.sourceOwner] = (counts[routeItem.sourceOwner] || 0) + 1;
      return counts;
    },
    {},
  );
}

function evidenceRoleFromScore(
  score: number,
  item: WebsiteEvidenceInput,
): WebsiteEvidenceRole {
  if (score >= 14) return "direct";
  if (item.text && item.text.length > 500) return "supporting";
  return score >= 8 ? "supporting" : "context";
}

function confidenceFromScore(score: number): WebsiteEvidenceConfidence {
  if (score >= 18) return "high";
  if (score >= 8) return "medium";
  return "low";
}

function normaliseSourceOwner(source?: string | null): WebsiteEvidenceSourceOwner {
  if (source === "trust") return "trust";
  if (source === "external") return "external";
  return "school";
}

function signalLabel(requirement: ComplianceRequirement) {
  if (requirement.category === "send") return "send";
  if (requirement.category === "safeguarding") return "safeguarding";
  if (requirement.key === "phonics_reading") return "reading";
  if (requirement.key === "behaviour_policy") return "behaviour";
  if (requirement.category === "pupil_premium") return "pupil premium";
  return normaliseKeyword(requirement.name);
}

function containsUrlPattern(url: string, pattern: string) {
  const decodedUrl = normaliseSearchText([url]);
  const decodedPattern = normaliseSearchText([pattern]);
  return decodedUrl.includes(decodedPattern);
}

function containsPhrase(text: string, phrase: string) {
  return text.includes(normaliseSearchText([phrase]));
}

function normaliseKeyword(keyword: string) {
  return normaliseSearchText([keyword]).trim();
}

function normaliseSearchText(parts: Array<string | null | undefined>) {
  return parts
    .filter((part): part is string => Boolean(part))
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    })
    .join(" ")
    .toLowerCase()
    .replace(/[_+/%?=&.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(title: string) {
  return title.replace(/\s+/g, " ").trim();
}
