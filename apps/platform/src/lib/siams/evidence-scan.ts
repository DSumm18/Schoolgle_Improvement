import {
  SIAMS_EVIDENCE_KEYWORDS,
  SIAMS_FRAMEWORK,
} from "@/lib/siams-framework";
import type { ConfidenceLevel, SiamsQuestionId, SiamsStrandId } from "@/lib/siams";

export interface SiamsEvidenceScanInput {
  fileName: string;
  folderPath?: string;
  textSnippet?: string;
}

export interface SiamsEvidenceScanMatch {
  strand_id: SiamsStrandId;
  question_id: SiamsQuestionId;
  confidence: ConfidenceLevel;
  matched_keywords: string[];
  relevance_explanation: string;
}

const STRAND_FOLDER_HINTS: Record<string, string[]> = {
  vision: ["christian vision", "vision", "leadership and governance"],
  wisdom: ["curriculum", "spiritual development"],
  character: ["character", "courageous advocacy", "social action"],
  community: ["church and community", "community", "wellbeing", "inclusion"],
  dignity: ["dignity", "respect", "equality", "anti bullying", "anti-bullying"],
  worship: ["collective worship", "worship", "prayer"],
  re: ["religious education", "re"],
};

export function matchSiamsEvidence(
  input: SiamsEvidenceScanInput,
): SiamsEvidenceScanMatch[] {
  const normalisedName = normalise(input.fileName);
  const normalisedFolder = normalise(input.folderPath || "");
  const normalisedText = normalise(input.textSnippet || "");
  const haystack = `${normalisedName} ${normalisedFolder} ${normalisedText}`;
  const matches: SiamsEvidenceScanMatch[] = [];

  for (const strand of SIAMS_FRAMEWORK) {
    const strandKeywords = [
      ...(SIAMS_EVIDENCE_KEYWORDS[strand.id] || []),
      ...(STRAND_FOLDER_HINTS[strand.id] || []),
      strand.name,
      strand.shortName,
    ];
    const strandHits = findKeywordHits(haystack, strandKeywords);
    const folderHits = findKeywordHits(normalisedFolder, [
      ...(STRAND_FOLDER_HINTS[strand.id] || []),
      strand.shortName,
      strand.name,
    ]);

    for (const question of strand.inspectionQuestions) {
      const questionKeywords = [
        ...question.evidenceRequired,
        ...question.question.split(/\W+/).filter((word) => word.length > 5),
        ...question.guidance.split(/\W+/).filter((word) => word.length > 6),
      ];
      const questionHits = findKeywordHits(haystack, questionKeywords);
      const matchedKeywords = Array.from(
        new Set([...folderHits, ...strandHits, ...questionHits]),
      );

      if (!isUsefulMatch({ folderHits, strandHits, questionHits })) continue;

      matches.push({
        strand_id: strand.id as SiamsStrandId,
        question_id: question.id as SiamsQuestionId,
        confidence: classifyConfidence({
          folderHitCount: folderHits.length,
          strandHitCount: strandHits.length,
          questionHitCount: questionHits.length,
        }),
        matched_keywords: matchedKeywords,
        relevance_explanation: buildExplanation({
          fileName: input.fileName,
          folderPath: input.folderPath,
          strandName: strand.name,
          question: question.question,
          matchedKeywords,
        }),
      });
    }
  }

  return dedupeAndLimit(matches);
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[_/\\-]+/g, " ").replace(/\s+/g, " ");
}

function findKeywordHits(haystack: string, keywords: string[]): string[] {
  return keywords
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .filter((keyword) => {
      const normalisedKeyword = normalise(keyword);
      if (normalisedKeyword.length <= 3) {
        return new RegExp(`\\b${escapeRegExp(normalisedKeyword)}\\b`).test(
          haystack,
        );
      }
      return haystack.includes(normalisedKeyword);
    });
}

function isUsefulMatch({
  folderHits,
  strandHits,
  questionHits,
}: {
  folderHits: string[];
  strandHits: string[];
  questionHits: string[];
}): boolean {
  if (folderHits.length > 0 && questionHits.length > 0) return true;
  if (questionHits.length >= 2) return true;
  if (strandHits.length >= 2 && questionHits.length >= 1) return true;
  return false;
}

function classifyConfidence({
  folderHitCount,
  strandHitCount,
  questionHitCount,
}: {
  folderHitCount: number;
  strandHitCount: number;
  questionHitCount: number;
}): ConfidenceLevel {
  const score = folderHitCount * 2 + strandHitCount + questionHitCount * 2;
  if (score >= 7) return "HIGH";
  if (score >= 4) return "MEDIUM";
  return "LOW";
}

function buildExplanation({
  fileName,
  folderPath,
  strandName,
  question,
  matchedKeywords,
}: {
  fileName: string;
  folderPath?: string;
  strandName: string;
  question: string;
  matchedKeywords: string[];
}) {
  const location = folderPath ? ` in ${folderPath}` : "";
  return `${fileName}${location} appears relevant to ${strandName}: ${question} (matched ${matchedKeywords.slice(0, 5).join(", ")}).`;
}

function dedupeAndLimit(matches: SiamsEvidenceScanMatch[]) {
  const bestByQuestion = new Map<string, SiamsEvidenceScanMatch>();
  const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  for (const match of matches) {
    const existing = bestByQuestion.get(match.question_id);
    if (!existing || rank[match.confidence] > rank[existing.confidence]) {
      bestByQuestion.set(match.question_id, match);
    }
  }

  return Array.from(bestByQuestion.values())
    .sort((a, b) => rank[b.confidence] - rank[a.confidence])
    .slice(0, 8);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
