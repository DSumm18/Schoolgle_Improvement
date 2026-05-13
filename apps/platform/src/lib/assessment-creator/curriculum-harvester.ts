export type CurriculumSourceKind = "website_page" | "website_document";
export type CurriculumReviewStatus = "ready_for_review" | "needs_more_evidence" | "not_curriculum";

export interface WebsiteCurriculumPageRow {
  id: string;
  url: string;
  title: string | null;
  extracted_text: string | null;
  headings?: unknown;
  crawled_at?: string | null;
}

export interface WebsiteCurriculumDocumentRow {
  id: string;
  url: string;
  filename: string | null;
  title: string | null;
  link_text: string | null;
  found_on_page_url: string | null;
  file_type: string | null;
  extracted_text: string | null;
  crawled_at?: string | null;
}

export interface HarvestedCurriculumSource {
  id: string;
  kind: CurriculumSourceKind;
  title: string;
  url: string;
  sourceLabel: string;
  scannedAt: string | null;
  confidence: number;
  reviewStatus: CurriculumReviewStatus;
  subjects: string[];
  yearGroups: string[];
  terms: string[];
  curriculumSignals: string[];
  topicSignals: string[];
  sourceNote: string;
}

export interface CurriculumHarvestResult {
  sourceCount: number;
  usableSourceCount: number;
  highConfidenceCount: number;
  reviewRequiredCount: number;
  subjects: string[];
  yearGroups: string[];
  terms: string[];
  recommendedNextAction: string;
  sources: HarvestedCurriculumSource[];
}

interface HarvestInput {
  pages: WebsiteCurriculumPageRow[];
  documents: WebsiteCurriculumDocumentRow[];
}

const SUBJECT_PATTERNS: Array<[string, RegExp]> = [
  ["Maths", /\b(maths|mathematics|arithmetic|number|fractions?|decimals?|percentages?|algebra|ratio|geometry|statistics)\b/i],
  ["Reading", /\b(reading|comprehension|phonics|fluency|book|novel)\b/i],
  ["Writing", /\b(writing|grammar|punctuation|composition|spag|sentence|text type)\b/i],
  ["Science", /\b(science|scientists?|light|electricity|evolution|inheritance|materials|forces|plants|animals)\b/i],
  ["History", /\b(history|historical|democracy|magna carta|monarchy|civilisation|ancient)\b/i],
  ["Geography", /\b(geography|geographical|climate|time zones?|latitude|longitude|arctic|antarctic|maps?)\b/i],
  ["Computing", /\b(computing|coding|programming|online safety|e-safety|graphing|blogging)\b/i],
  ["Art/DT", /\b(art|design technology|dt|structures?|designer|make|evaluate)\b/i],
  ["PSHE/RHE", /\b(pshe|rhe|relationship|health|wellbeing|protected characteristics)\b/i],
];

const YEAR_GROUP_PATTERNS: Array<[string, RegExp]> = [
  ["EYFS", /\b(eyfs|early years|reception|nursery)\b/i],
  ["Year 1", /\b(year\s*1|y1)\b/i],
  ["Year 2", /\b(year\s*2|y2)\b/i],
  ["Year 3", /\b(year\s*3|y3)\b/i],
  ["Year 4", /\b(year\s*4|y4)\b/i],
  ["Year 5", /\b(year\s*5|y5)\b/i],
  ["Year 6", /\b(year\s*6|year six|y6)\b/i],
];

const TERM_PATTERNS: Array<[string, RegExp]> = [
  ["Autumn 1", /\b(autumn\s*1|au1)\b/i],
  ["Autumn 2", /\b(autumn\s*2|aut2)\b/i],
  ["Spring 1", /\b(spring\s*1|sp1)\b/i],
  ["Spring 2", /\b(spring\s*2|sp2)\b/i],
  ["Summer 1", /\b(summer\s*1|su1)\b/i],
  ["Summer 2", /\b(summer\s*2|su2)\b/i],
  ["Autumn", /\bautumn\b/i],
  ["Spring", /\bspring\b/i],
  ["Summer", /\bsummer\b/i],
];

const CURRICULUM_SIGNALS: Array<[string, RegExp]> = [
  ["curriculum intent", /\b(curriculum we offer|curriculum intent|curriculum rationale|curriculum statement)\b/i],
  ["curriculum map", /\bcurriculum\s+map\b/i],
  ["medium term plan", /\b(medium\s+term\s+plan|mtp)\b/i],
  ["long term plan", /\b(long\s+term\s+plan|ltp)\b/i],
  ["curriculum overview", /\bcurriculum\s+overview\b/i],
  ["scheme of learning", /\b(scheme of learning|adapted from|bespoke to suit|progression document)\b/i],
  ["taught objectives", /\b(objectives?|i can|to know|to describe|to investigate|to explain|to use)\b/i],
  ["prior learning", /\b(prior learning|retrieval|recap|remember more|links to prior)\b/i],
  ["statutory/national curriculum", /\b(national curriculum|statutory|sats|ks2)\b/i],
];

const TOPIC_PATTERNS: Array<[string, RegExp]> = [
  ["Place value", /\bplace value\b/i],
  ["Four operations", /\b(addition|subtraction|multiplication|division|multiply|divide)\b/i],
  ["Fractions", /\bfractions?\b/i],
  ["Decimals", /\bdecimals?\b/i],
  ["Percentages", /\bpercentages?\b/i],
  ["Ratio", /\bratio\b/i],
  ["Algebra", /\balgebra\b/i],
  ["Converting units", /\bconverting units|standard units|measurements?\b/i],
  ["Area, perimeter and volume", /\b(area|perimeter|volume)\b/i],
  ["Statistics", /\bstatistics|line graphs?|scatter graphs?|plotting points\b/i],
  ["Shape", /\bshape|geometry\b/i],
  ["Position and direction", /\bposition|direction|coordinates?\b/i],
  ["Light", /\blight|shadows?|reflection|reflected ray\b/i],
  ["Democracy", /\bdemocracy|magna carta|monarchy|prime minister|politicians?\b/i],
  ["Polar regions", /\barctic|antarctic|climate zones?|time zones?|latitude|longitude\b/i],
  ["Structures", /\bstructures?|playground|design|make|evaluate\b/i],
];

export function harvestCurriculumSources(input: HarvestInput): CurriculumHarvestResult {
  const sources = [
    ...input.pages.map((page) => classifyPage(page)),
    ...input.documents.map((document) => classifyDocument(document)),
  ]
    .filter((source) => source.reviewStatus !== "not_curriculum")
    .sort((a, b) => b.confidence - a.confidence || a.title.localeCompare(b.title));

  const subjects = uniqueSorted(sources.flatMap((source) => source.subjects));
  const yearGroups = sortYearGroups(uniqueSorted(sources.flatMap((source) => source.yearGroups)));
  const terms = sortTerms(uniqueSorted(sources.flatMap((source) => source.terms)));
  const usableSourceCount = sources.filter((source) => source.confidence >= 55).length;
  const highConfidenceCount = sources.filter((source) => source.confidence >= 75).length;
  const reviewRequiredCount = sources.filter((source) => source.reviewStatus === "ready_for_review").length;

  return {
    sourceCount: sources.length,
    usableSourceCount,
    highConfidenceCount,
    reviewRequiredCount,
    subjects,
    yearGroups,
    terms,
    recommendedNextAction: buildRecommendedNextAction(sources, subjects, yearGroups),
    sources,
  };
}

function classifyPage(page: WebsiteCurriculumPageRow): HarvestedCurriculumSource {
  const title = cleanTitle(page.title) || titleFromUrl(page.url);
  const identityText = joinForAnalysis(title, page.url);
  const text = joinForAnalysis(identityText, page.extracted_text);
  return classifySource({
    id: page.id,
    kind: "website_page",
    title,
    url: page.url,
    sourceLabel: "School website page",
    scannedAt: page.crawled_at ?? null,
    identityText,
    text,
  });
}

function classifyDocument(document: WebsiteCurriculumDocumentRow): HarvestedCurriculumSource {
  const title = cleanTitle(document.title) || cleanTitle(document.link_text) || cleanTitle(document.filename) || titleFromUrl(document.url);
  const identityText = joinForAnalysis(title, document.url, document.filename, document.link_text);
  const text = joinForAnalysis(identityText, document.extracted_text);
  const fileType = document.file_type?.toUpperCase();
  return classifySource({
    id: document.id,
    kind: "website_document",
    title,
    url: document.url,
    sourceLabel: fileType ? `School website ${fileType}` : "School website document",
    scannedAt: document.crawled_at ?? null,
    identityText,
    text,
  });
}

function classifySource(input: {
  id: string;
  kind: CurriculumSourceKind;
  title: string;
  url: string;
  sourceLabel: string;
  scannedAt: string | null;
  identityText: string;
  text: string;
}): HarvestedCurriculumSource {
  const identitySubjects = matches(SUBJECT_PATTERNS, input.identityText);
  const identityYearGroups = sortYearGroups(matches(YEAR_GROUP_PATTERNS, input.identityText));
  const identityTerms = sortTerms(matches(TERM_PATTERNS, input.identityText));
  const subjects = identitySubjects.length ? identitySubjects : matches(SUBJECT_PATTERNS, input.text);
  const yearGroups = identityYearGroups.length ? identityYearGroups : sortYearGroups(matches(YEAR_GROUP_PATTERNS, input.text));
  const terms = identityTerms.length ? identityTerms : sortTerms(matches(TERM_PATTERNS, input.text));
  const curriculumSignals = matches(CURRICULUM_SIGNALS, input.text);
  const topicSignals = matches(TOPIC_PATTERNS, input.text);
  const confidence = scoreConfidence({
    kind: input.kind,
    title: input.title,
    text: input.text,
    subjects,
    yearGroups,
    terms,
    curriculumSignals,
    topicSignals,
  });

  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    url: input.url,
    sourceLabel: input.sourceLabel,
    scannedAt: input.scannedAt,
    confidence,
    reviewStatus: confidence >= 55 ? "ready_for_review" : confidence >= 35 ? "needs_more_evidence" : "not_curriculum",
    subjects,
    yearGroups,
    terms,
    curriculumSignals,
    topicSignals,
    sourceNote: buildSourceNote(input.kind, confidence, subjects, yearGroups, terms, curriculumSignals),
  };
}

function scoreConfidence(input: {
  kind: CurriculumSourceKind;
  title: string;
  text: string;
  subjects: string[];
  yearGroups: string[];
  terms: string[];
  curriculumSignals: string[];
  topicSignals: string[];
}) {
  const titleAndUrlBoost = /\b(curriculum|mtp|medium term|long term|overview|year\s*\d|year six|maths|science)\b/i.test(input.title) ? 15 : 0;
  const documentBoost = input.kind === "website_document" ? 8 : 0;
  const objectiveDensityBoost = (input.text.match(/\b(to know|to describe|to investigate|to explain|i can|use|calculate|solve)\b/gi) ?? []).length >= 4 ? 12 : 0;
  const score =
    titleAndUrlBoost +
    documentBoost +
    Math.min(input.curriculumSignals.length * 12, 36) +
    Math.min(input.subjects.length * 7, 21) +
    Math.min(input.yearGroups.length * 8, 16) +
    Math.min(input.terms.length * 6, 12) +
    Math.min(input.topicSignals.length * 3, 18) +
    objectiveDensityBoost;

  return Math.max(0, Math.min(100, score));
}

function buildSourceNote(
  kind: CurriculumSourceKind,
  confidence: number,
  subjects: string[],
  yearGroups: string[],
  terms: string[],
  curriculumSignals: string[],
) {
  if (confidence >= 75) {
    return `High-confidence ${kind === "website_document" ? "document" : "page"}: ${compactSignalSummary(subjects, yearGroups, terms)} with ${curriculumSignals.join(", ")} signals. Curriculum lead should approve before teachers use it.`;
  }
  if (confidence >= 55) {
    return `Likely curriculum source: ${compactSignalSummary(subjects, yearGroups, terms)}. Needs a curriculum lead check because coverage may be partial.`;
  }
  return "Possible curriculum source, but the scan needs stronger subject, year-group or objective evidence before it should drive assessment generation.";
}

function buildRecommendedNextAction(sources: HarvestedCurriculumSource[], subjects: string[], yearGroups: string[]) {
  if (sources.length === 0) {
    return "No curriculum sources found in the latest website scan. Run the Ofsted Readiness website scan or upload/connect curriculum documents before generating curriculum-aligned assessments.";
  }
  if (sources.some((source) => source.confidence >= 75)) {
    return `Review and approve the high-confidence curriculum sources for ${compactSignalSummary(subjects, yearGroups, [])}. Once approved, Assessment Support can generate checks from those mapped objectives.`;
  }
  return "Review the likely curriculum sources and add/upload missing medium-term plans before using them to generate assessments.";
}

function matches(patterns: Array<[string, RegExp]>, text: string) {
  return patterns.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function joinForAnalysis(...values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function cleanTitle(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function titleFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const lastPart = pathname.split("/").filter(Boolean).pop() || "Curriculum source";
    return decodeURIComponent(lastPart).replace(/[-_]+/g, " ").replace(/\.[a-z0-9]+$/i, "");
  } catch {
    return "Curriculum source";
  }
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function sortYearGroups(values: string[]) {
  const order = ["EYFS", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];
  return [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function sortTerms(values: string[]) {
  const order = ["Autumn 1", "Autumn 2", "Autumn", "Spring 1", "Spring 2", "Spring", "Summer 1", "Summer 2", "Summer"];
  return [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function compactSignalSummary(subjects: string[], yearGroups: string[], terms: string[]) {
  const parts = [
    subjects.length ? subjects.join(", ") : null,
    yearGroups.length ? yearGroups.join(", ") : null,
    terms.length ? terms.join(", ") : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "the scanned curriculum evidence";
}
