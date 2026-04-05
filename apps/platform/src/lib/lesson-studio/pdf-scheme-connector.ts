/**
 * Lesson Studio — PDF Scheme Connector
 *
 * Imports lesson plans from PDF scheme documents (Twinkl, White Rose
 * Maths, Hamilton Trust, and similar UK curriculum providers).
 *
 * Extracts text via the existing parsePDF utility, then applies
 * heuristic section detection to identify objectives, activities,
 * resources, and vocabulary.
 */

import { parsePDF } from "../extractors";
import type {
  LessonConnector,
  ConnectorFetchOptions,
  ConnectorSearchResult,
  LessonInput,
  LessonActivity,
  LessonResource,
} from "./connector-registry";
import { registerConnector } from "./connector-registry";

// ---------------------------------------------------------------------------
// Section-heading patterns (case-insensitive)
//
// These cover common headings used by Twinkl, White Rose Maths,
// Hamilton Trust, PlanBee, Kapow Primary, and generic UK schemes.
// ---------------------------------------------------------------------------

const OBJECTIVE_PATTERNS = [
  /learning\s*objectives?/i,
  /lesson\s*objectives?/i,
  /objectives?\s*:/i,
  /intended?\s*outcomes?/i,
  /pupils?\s*(should|will|can)\s*(be\s*able\s*to)?/i,
  /success\s*criteria/i,
  /learning\s*intentions?/i,
  /i\s*can\s*statements?/i,
  /national\s*curriculum/i,
  /curriculum\s*links?/i,
];

const ACTIVITY_PATTERNS = [
  /main\s*activit(y|ies)/i,
  /activit(y|ies)\s*:/i,
  /lesson\s*steps?/i,
  /teaching\s*sequence/i,
  /teaching\s*input/i,
  /introduction/i,
  /starter/i,
  /main\s*teaching/i,
  /independent\s*(?:work|practice|task)/i,
  /guided\s*practice/i,
  /plenary/i,
  /mini[\s-]*plenary/i,
  /group\s*work/i,
  /whole[\s-]*class/i,
  /paired?\s*work/i,
  /challenge/i,
  /extension/i,
  /differentiat(?:ed|ion)/i,
  /greater\s*depth/i,
  /working\s*towards/i,
  /expected\s*standard/i,
];

const RESOURCE_PATTERNS = [
  /resources?\s*(?:needed|required|list)?/i,
  /you\s*will\s*need/i,
  /equipment/i,
  /materials?/i,
  /worksheets?/i,
  /printable/i,
  /appendix/i,
  /slide\s*deck/i,
  /powerpoint/i,
];

const KEYWORD_PATTERNS = [
  /key\s*vocabulary/i,
  /vocabulary/i,
  /key\s*words?/i,
  /keywords?/i,
  /glossary/i,
  /key\s*terms?/i,
  /subject[\s-]*specific\s*vocab/i,
];

const MISCONCEPTION_PATTERNS = [
  /misconceptions?/i,
  /common\s*errors?/i,
  /common\s*mistakes?/i,
  /things?\s*to\s*(?:look|watch)\s*(?:out\s*)?for/i,
  /potential\s*difficulties/i,
  /pitfalls?/i,
];

// ---------------------------------------------------------------------------
// Text-section parser
// ---------------------------------------------------------------------------

interface TextSection {
  heading: string;
  body: string;
  category:
    | "objective"
    | "activity"
    | "resource"
    | "keyword"
    | "misconception"
    | "other";
}

function categoriseLine(line: string): TextSection["category"] | null {
  if (OBJECTIVE_PATTERNS.some((p) => p.test(line))) return "objective";
  if (ACTIVITY_PATTERNS.some((p) => p.test(line))) return "activity";
  if (RESOURCE_PATTERNS.some((p) => p.test(line))) return "resource";
  if (KEYWORD_PATTERNS.some((p) => p.test(line))) return "keyword";
  if (MISCONCEPTION_PATTERNS.some((p) => p.test(line))) return "misconception";
  return null;
}

/**
 * Heuristic: a line that is short (<120 chars), mostly words, and matches
 * a heading pattern is treated as a section heading.
 */
function isHeadingLike(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 120) return false;
  // Lines starting with bullet markers are body text, not headings
  if (/^[•\-\*]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) return false;
  // ALL CAPS or ends with colon or matches a section-heading pattern
  return (
    trimmed === trimmed.toUpperCase() ||
    trimmed.endsWith(":") ||
    categoriseLine(trimmed) !== null
  );
}

function parseSections(text: string): TextSection[] {
  const lines = text.split(/\n/);
  const sections: TextSection[] = [];
  let currentHeading = "Introduction";
  let currentCategory: TextSection["category"] = "other";
  let bodyLines: string[] = [];

  function flushSection() {
    if (bodyLines.length > 0 || currentHeading !== "Introduction") {
      sections.push({
        heading: currentHeading,
        body: bodyLines.join("\n").trim(),
        category: currentCategory,
      });
    }
    bodyLines = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (isHeadingLike(trimmed) && trimmed.length > 2) {
      flushSection();
      currentHeading = trimmed.replace(/:$/, "").trim();
      const cat = categoriseLine(trimmed);
      currentCategory = cat ?? "other";
    } else {
      bodyLines.push(trimmed);
    }
  }
  flushSection();

  return sections;
}

// ---------------------------------------------------------------------------
// Structured extraction from sections
// ---------------------------------------------------------------------------

function extractObjectives(sections: TextSection[]): string[] {
  const objs: string[] = [];
  for (const s of sections.filter((s) => s.category === "objective")) {
    // Split on bullet points, numbered lists, or newlines
    const items = s.body
      .split(/(?:\n|[•\*]|(?:^|\n)\s*-\s|\d+[.)]\s)/m)
      .map((i) => i.trim())
      .filter((i) => i.length > 5);
    objs.push(...items);
  }
  return objs;
}

function extractActivities(sections: TextSection[]): LessonActivity[] {
  return sections
    .filter((s) => s.category === "activity")
    .map((s) => ({
      title: s.heading,
      description: s.body.slice(0, 500),
    }));
}

function extractResources(sections: TextSection[]): LessonResource[] {
  const resources: LessonResource[] = [];
  for (const s of sections.filter((s) => s.category === "resource")) {
    const items = s.body
      .split(/(?:\n|[•\*]|(?:^|\n)\s*-\s|\d+[.)]\s)/m)
      .map((i) => i.trim())
      .filter((i) => i.length > 2);
    for (const item of items) {
      resources.push({
        name: item.slice(0, 100),
        type: guessResourceType(item),
      });
    }
  }
  return resources;
}

function guessResourceType(
  text: string
): LessonResource["type"] {
  const lower = text.toLowerCase();
  if (/worksheet|printable|handout/.test(lower)) return "worksheet";
  if (/slide|powerpoint|ppt/.test(lower)) return "slide";
  if (/video|clip|youtube/.test(lower)) return "video";
  if (/https?:\/\//.test(lower)) return "link";
  return "equipment";
}

function extractKeywords(sections: TextSection[]): string[] {
  const kws: string[] = [];
  for (const s of sections.filter((s) => s.category === "keyword")) {
    const items = s.body
      .split(/(?:\n|[•\-\*,;]|\d+[.)]\s)/)
      .map((i) => i.trim())
      .filter((i) => i.length > 1 && i.length < 60);
    kws.push(...items);
  }
  return kws;
}

function extractMisconceptions(sections: TextSection[]): string[] {
  const ms: string[] = [];
  for (const s of sections.filter((s) => s.category === "misconception")) {
    const items = s.body
      .split(/(?:\n|[•\*]|(?:^|\n)\s*-\s|\d+[.)]\s)/m)
      .map((i) => i.trim())
      .filter((i) => i.length > 5);
    ms.push(...items);
  }
  return ms;
}

/** Try to detect subject from text content */
function detectSubject(text: string): string {
  const subjectSignals: [RegExp, string][] = [
    [/\b(maths?|mathematics|arithmetic|fractions?|algebra)\b/i, "Mathematics"],
    [/\b(english|literacy|reading|writing|phonics|grammar|spag)\b/i, "English"],
    [/\b(science|biology|chemistry|physics|experiment)\b/i, "Science"],
    [/\b(history|historical|world\s*war|tudor|victorian)\b/i, "History"],
    [/\b(geography|map\s*skills|climate|continent)\b/i, "Geography"],
    [/\b(computing|coding|algorithm|programming)\b/i, "Computing"],
    [/\b(art|drawing|painting|sculpture|sketch)\b/i, "Art"],
    [/\b(music|rhythm|tempo|melody|compose)\b/i, "Music"],
    [/\b(pe|physical\s*education|gymnastics|athletics)\b/i, "PE"],
    [/\b(re|religious\s*education|christianity|islam|hindu)\b/i, "RE"],
    [/\b(pshe|rse|relationships|wellbeing)\b/i, "PSHE"],
    [/\b(dt|design\s*(?:and|&)\s*technology)\b/i, "DT"],
    [/\b(mfl|french|spanish|german|mandarin)\b/i, "MFL"],
  ];

  const first500 = text.slice(0, 500).toLowerCase();
  for (const [pattern, subject] of subjectSignals) {
    if (pattern.test(first500)) return subject;
  }
  return "Unknown";
}

/** Try to detect key stage from text content */
function detectKeyStage(text: string): string {
  const first500 = text.slice(0, 500);
  if (/\b(?:ks1|key\s*stage\s*1|year\s*[12]|reception)\b/i.test(first500))
    return "KS1";
  if (/\b(?:ks2|key\s*stage\s*2|year\s*[3456])\b/i.test(first500))
    return "KS2";
  if (/\b(?:ks3|key\s*stage\s*3|year\s*[789])\b/i.test(first500))
    return "KS3";
  if (/\b(?:ks4|key\s*stage\s*4|year\s*1[01]|gcse)\b/i.test(first500))
    return "KS4";
  return "Unknown";
}

/** Extract year group from text */
function detectYearGroup(text: string): string | undefined {
  const match = text.slice(0, 500).match(/\b(year\s*\d{1,2}|reception|eyfs)\b/i);
  return match ? match[1] : undefined;
}

/** Extract a title from the first meaningful line or filename */
function extractTitle(text: string, fileName?: string): string {
  // Try filename first (strip extension)
  if (fileName) {
    const name = fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    if (name.length > 3 && name.length < 120) return name;
  }
  // First non-empty line
  const firstLine = text
    .split("\n")
    .find((l) => l.trim().length > 3);
  return firstLine?.trim().slice(0, 120) ?? "Untitled Lesson Plan";
}

// ---------------------------------------------------------------------------
// Main parse function (exported for testing)
// ---------------------------------------------------------------------------

export async function parsePdfScheme(
  fileBuffer: Buffer,
  fileName?: string,
  overrides?: { subject?: string; keyStage?: string; yearGroup?: string }
): Promise<LessonInput> {
  const rawText = await parsePDF(fileBuffer);

  if (!rawText || rawText.startsWith("[")) {
    throw new Error(
      "Could not extract text from PDF. It may be image-based — try uploading a text-based PDF."
    );
  }

  const sections = parseSections(rawText);

  const subject = overrides?.subject ?? detectSubject(rawText);
  const keyStage = overrides?.keyStage ?? detectKeyStage(rawText);
  const yearGroup = overrides?.yearGroup ?? detectYearGroup(rawText);

  return {
    source: "pdf-scheme",
    sourceId: fileName ?? `pdf-${Date.now()}`,
    title: extractTitle(rawText, fileName),
    subject,
    keyStage,
    yearGroup,
    objectives: extractObjectives(sections),
    activities: extractActivities(sections),
    resources: extractResources(sections),
    keywords: extractKeywords(sections),
    misconceptions: extractMisconceptions(sections),
    rawText,
    metadata: {
      fileName,
      pageCount: (rawText.match(/--- Page \d+ ---/g) ?? []).length,
      sectionCount: sections.length,
      detectedSubject: subject,
      detectedKeyStage: keyStage,
    },
  };
}

// ---------------------------------------------------------------------------
// Connector implementation
// ---------------------------------------------------------------------------

const pdfSchemeConnector: LessonConnector = {
  id: "pdf-scheme",
  label: "PDF Scheme Upload (Twinkl, White Rose, Hamilton Trust)",
  supportsSearch: false,

  async search(): Promise<ConnectorSearchResult[]> {
    return [];
  },

  async fetch(options: ConnectorFetchOptions): Promise<LessonInput> {
    if (!options.fileBuffer) {
      throw new Error("pdf-scheme connector requires fileBuffer");
    }
    return parsePdfScheme(options.fileBuffer, options.fileName, {
      subject: options.subject,
      keyStage: options.keyStage,
      yearGroup: options.yearGroup,
    });
  },
};

// Register on import
registerConnector(pdfSchemeConnector);

export { pdfSchemeConnector };
