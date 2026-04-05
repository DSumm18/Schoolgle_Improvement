/**
 * Lesson Studio — Oak National Academy Connector
 *
 * Fetches lesson content from Oak National Academy's open API
 * (https://open-api.thenational.academy).
 *
 * Requires OAK_API_KEY env var. All content is under the
 * Open Government Licence v3.0.
 */

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
// Config
// ---------------------------------------------------------------------------

const OAK_BASE_URL = "https://open-api.thenational.academy/api";

function getApiKey(): string {
  const key = process.env.OAK_API_KEY;
  if (!key) {
    throw new Error(
      "OAK_API_KEY environment variable is required. " +
        "Request one at https://open-api.thenational.academy/"
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Key-stage mapping helpers
// ---------------------------------------------------------------------------

/** Maps friendly labels to Oak API slugs */
const KEY_STAGE_SLUGS: Record<string, string> = {
  KS1: "ks1",
  KS2: "ks2",
  KS3: "ks3",
  KS4: "ks4",
  ks1: "ks1",
  ks2: "ks2",
  ks3: "ks3",
  ks4: "ks4",
  "Key Stage 1": "ks1",
  "Key Stage 2": "ks2",
  "Key Stage 3": "ks3",
  "Key Stage 4": "ks4",
};

function normaliseKeyStage(ks: string): string {
  return KEY_STAGE_SLUGS[ks] ?? ks.toLowerCase().replace(/\s+/g, "");
}

/** Normalise subject to Oak's slug format (lowercase, hyphens) */
function normaliseSubject(subject: string): string {
  return subject.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ---------------------------------------------------------------------------
// Oak API types (subset of their response shapes)
// ---------------------------------------------------------------------------

interface OakSearchLesson {
  lessonSlug: string;
  lessonTitle: string;
  unitTitle?: string;
  subjectSlug: string;
  subjectTitle: string;
  keyStageSlug: string;
  keyStageTitle: string;
  yearTitle?: string;
  programmeSlug?: string;
}

interface OakLessonSummary {
  lessonSlug: string;
  lessonTitle: string;
  subjectSlug: string;
  subjectTitle: string;
  keyStageSlug: string;
  keyStageTitle: string;
  yearTitle?: string;
  unitTitle?: string;
  pupilLessonOutcome?: string;
  lessonKeywords?: Array<{
    keyword: string;
    description?: string;
  }>;
  misconceptions?: Array<{
    misconception: string;
    response?: string;
  }>;
  lessonEquipmentAndResources?: Array<{
    equipment: string;
  }>;
  starterQuiz?: Array<{
    questionStem: string;
    answers: Array<{ answer: string; correct: boolean }>;
  }>;
  exitQuiz?: Array<{
    questionStem: string;
    answers: Array<{ answer: string; correct: boolean }>;
  }>;
  videoTitle?: string;
  transcriptSentences?: string[];
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function oakFetch<T>(path: string): Promise<T> {
  const apiKey = getApiKey();
  const url = `${OAK_BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Oak API ${response.status} for ${path}: ${body.slice(0, 200)}`
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

async function searchLessons(
  options: ConnectorFetchOptions
): Promise<ConnectorSearchResult[]> {
  const params = new URLSearchParams();

  if (options.query) params.set("q", options.query);
  if (options.limit) params.set("limit", String(options.limit));

  // Build the path based on available filters
  let path: string;

  if (options.keyStage && options.subject) {
    const ks = normaliseKeyStage(options.keyStage);
    const subj = normaliseSubject(options.subject);
    path = `/key-stages/${ks}/subjects/${subj}/lessons`;
  } else if (options.keyStage) {
    const ks = normaliseKeyStage(options.keyStage);
    path = `/key-stages/${ks}/lessons`;
  } else {
    path = `/lessons`;
  }

  const qs = params.toString();
  const fullPath = qs ? `${path}?${qs}` : path;

  const data = await oakFetch<{ lessons?: OakSearchLesson[]; data?: OakSearchLesson[] }>(
    fullPath
  );

  const lessons = data.lessons ?? data.data ?? [];

  return lessons.slice(0, options.limit ?? 20).map((l) => ({
    id: l.lessonSlug,
    title: l.lessonTitle,
    subject: l.subjectTitle ?? l.subjectSlug,
    keyStage: l.keyStageTitle ?? l.keyStageSlug,
    yearGroup: l.yearTitle,
    snippet: l.unitTitle ? `Unit: ${l.unitTitle}` : l.subjectTitle,
  }));
}

// ---------------------------------------------------------------------------
// Fetch full lesson
// ---------------------------------------------------------------------------

async function fetchLesson(lessonSlug: string): Promise<LessonInput> {
  const data = await oakFetch<OakLessonSummary | { data: OakLessonSummary }>(
    `/lessons/${lessonSlug}/summary`
  );

  // Oak may wrap in { data: ... }
  const lesson: OakLessonSummary = "lessonSlug" in data ? data : (data as { data: OakLessonSummary }).data;

  // Build activities from lesson structure
  const activities: LessonActivity[] = [];

  if (lesson.starterQuiz?.length) {
    activities.push({
      title: "Starter Quiz",
      description: lesson.starterQuiz
        .map((q) => q.questionStem)
        .join("; "),
      durationMinutes: 5,
    });
  }

  if (lesson.transcriptSentences?.length) {
    activities.push({
      title: lesson.videoTitle ?? "Main Teaching",
      description: lesson.transcriptSentences.slice(0, 5).join(" ") + "...",
    });
  }

  if (lesson.exitQuiz?.length) {
    activities.push({
      title: "Exit Quiz",
      description: lesson.exitQuiz
        .map((q) => q.questionStem)
        .join("; "),
      durationMinutes: 5,
    });
  }

  // Resources
  const resources: LessonResource[] = (
    lesson.lessonEquipmentAndResources ?? []
  ).map((r) => ({
    name: r.equipment,
    type: "equipment" as const,
  }));

  // Keywords
  const keywords = (lesson.lessonKeywords ?? []).map((k) => k.keyword);

  // Misconceptions
  const misconceptions = (lesson.misconceptions ?? []).map(
    (m) => `${m.misconception}${m.response ? ` → ${m.response}` : ""}`
  );

  // Objectives
  const objectives: string[] = [];
  if (lesson.pupilLessonOutcome) {
    objectives.push(lesson.pupilLessonOutcome);
  }

  // Build raw text for LLM
  const rawTextParts = [
    `Title: ${lesson.lessonTitle}`,
    `Subject: ${lesson.subjectTitle}`,
    `Key Stage: ${lesson.keyStageTitle}`,
    lesson.yearTitle ? `Year: ${lesson.yearTitle}` : "",
    lesson.unitTitle ? `Unit: ${lesson.unitTitle}` : "",
    "",
    objectives.length ? `Objectives:\n${objectives.join("\n")}` : "",
    keywords.length ? `Keywords: ${keywords.join(", ")}` : "",
    misconceptions.length
      ? `Misconceptions:\n${misconceptions.join("\n")}`
      : "",
    "",
    lesson.transcriptSentences?.length
      ? `Transcript:\n${lesson.transcriptSentences.join(" ")}`
      : "",
  ];

  return {
    source: "oak",
    sourceId: lesson.lessonSlug,
    title: lesson.lessonTitle,
    subject: lesson.subjectTitle ?? lesson.subjectSlug,
    keyStage: lesson.keyStageTitle ?? lesson.keyStageSlug,
    yearGroup: lesson.yearTitle,
    objectives,
    activities,
    resources,
    keywords,
    misconceptions,
    rawText: rawTextParts.filter(Boolean).join("\n"),
    metadata: {
      unitTitle: lesson.unitTitle,
      videoTitle: lesson.videoTitle,
      starterQuizCount: lesson.starterQuiz?.length ?? 0,
      exitQuizCount: lesson.exitQuiz?.length ?? 0,
      licence: "Open Government Licence v3.0",
    },
  };
}

// ---------------------------------------------------------------------------
// Connector implementation
// ---------------------------------------------------------------------------

const oakConnector: LessonConnector = {
  id: "oak",
  label: "Oak National Academy",
  supportsSearch: true,

  async search(options: ConnectorFetchOptions): Promise<ConnectorSearchResult[]> {
    return searchLessons(options);
  },

  async fetch(options: ConnectorFetchOptions): Promise<LessonInput> {
    // If a query is provided, treat it as a lesson slug
    const slug = options.query;
    if (!slug) {
      throw new Error(
        "oak connector requires query (lesson slug from search results)"
      );
    }
    return fetchLesson(slug);
  },
};

// Register on import
registerConnector(oakConnector);

export { oakConnector, searchLessons, fetchLesson };
export type { OakSearchLesson, OakLessonSummary };
