import type { PolicyReviewCycle } from "./policy-catalogue";

export type PolicyReviewStatus =
  | "overdue"
  | "due_30"
  | "due_90"
  | "current"
  | "no_date";

export type PolicyReviewConfidence = "high" | "medium" | "low";

export type ExtractedPolicyDates = {
  approvedDate: string | null;
  effectiveDate: string | null;
  lastReviewedDate: string | null;
  nextReviewDate: string | null;
};

export type PolicyReviewAnalysis = {
  status: PolicyReviewStatus;
  confidence: PolicyReviewConfidence;
  daysUntilDue: number | null;
  extractedDates: ExtractedPolicyDates;
  derivedNextReviewDate: string | null;
  evidence: string[];
  tags: string[];
};

const EMPTY_DATES: ExtractedPolicyDates = {
  approvedDate: null,
  effectiveDate: null,
  lastReviewedDate: null,
  nextReviewDate: null,
};

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export function analysePolicyReview({
  text,
  defaultReviewCycle,
  asOf = new Date(),
}: {
  text: string;
  defaultReviewCycle: PolicyReviewCycle;
  asOf?: Date;
}): PolicyReviewAnalysis {
  const { dates, evidence } = extractPolicyDates(text);
  const derivedNextReviewDate =
    dates.nextReviewDate ||
    deriveNextReviewDate(dates.lastReviewedDate || dates.approvedDate, defaultReviewCycle);
  const dueDate = derivedNextReviewDate ? parseIsoDate(derivedNextReviewDate) : null;
  const daysUntilDue = dueDate ? daysBetween(startOfDay(asOf), dueDate) : null;
  const status = getReviewStatus(daysUntilDue);
  const confidence = getConfidence(dates, Boolean(derivedNextReviewDate), evidence.length);

  return {
    status,
    confidence,
    daysUntilDue,
    extractedDates: dates,
    derivedNextReviewDate,
    evidence,
    tags: buildReviewTags(status, defaultReviewCycle, confidence),
  };
}

function extractPolicyDates(text: string): {
  dates: ExtractedPolicyDates;
  evidence: string[];
} {
  const dates = { ...EMPTY_DATES };
  const evidence: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 120);

  for (const line of lines) {
    const lower = line.toLowerCase();
    const date = extractDateFromLine(line);
    if (!date) continue;

    if (!dates.nextReviewDate && isNextReviewLine(lower)) {
      dates.nextReviewDate = date;
      evidence.push(line);
      continue;
    }

    if (!dates.lastReviewedDate && isLastReviewedLine(lower)) {
      dates.lastReviewedDate = date;
      evidence.push(line);
      continue;
    }

    if (!dates.approvedDate && isApprovedLine(lower)) {
      dates.approvedDate = date;
      evidence.push(line);
      continue;
    }

    if (!dates.effectiveDate && isEffectiveLine(lower)) {
      dates.effectiveDate = date;
      evidence.push(line);
    }
  }

  return { dates, evidence: evidence.slice(0, 5) };
}

function isNextReviewLine(line: string): boolean {
  return (
    line.includes("next review") ||
    line.includes("review due") ||
    line.includes("review date") ||
    line.includes("date of review")
  );
}

function isLastReviewedLine(line: string): boolean {
  return (
    line.includes("last reviewed") ||
    line.includes("reviewed on") ||
    line.includes("date reviewed") ||
    line.includes("reviewed:")
  );
}

function isApprovedLine(line: string): boolean {
  return (
    line.includes("approved") ||
    line.includes("ratified") ||
    line.includes("adopted")
  );
}

function isEffectiveLine(line: string): boolean {
  return line.includes("effective") || line.includes("commencement");
}

function extractDateFromLine(line: string): string | null {
  const numeric = line.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    const year = normaliseYear(Number(numeric[3]));
    return toIsoDate(new Date(Date.UTC(year, month, day)));
  }

  const iso = line.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    return toIsoDate(
      new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))),
    );
  }

  const written = line.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(20\d{2})\b/,
  );
  if (written) {
    const month = MONTHS[written[2].toLowerCase()];
    if (month === undefined) return null;
    return toIsoDate(new Date(Date.UTC(Number(written[3]), month, Number(written[1]))));
  }

  const monthYear = line.match(/\b([A-Za-z]+)\s+(20\d{2})\b/);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    if (month === undefined) return null;
    return toIsoDate(new Date(Date.UTC(Number(monthYear[2]), month, 1)));
  }

  return null;
}

function deriveNextReviewDate(
  baseDate: string | null,
  cycle: PolicyReviewCycle,
): string | null {
  if (!baseDate) return null;
  const date = parseIsoDate(baseDate);

  if (cycle === "annual") date.setUTCFullYear(date.getUTCFullYear() + 1);
  if (cycle === "two_yearly") date.setUTCFullYear(date.getUTCFullYear() + 2);
  if (cycle === "three_yearly") date.setUTCFullYear(date.getUTCFullYear() + 3);
  if (cycle === "on_change") return null;

  return toIsoDate(date);
}

function getReviewStatus(daysUntilDue: number | null): PolicyReviewStatus {
  if (daysUntilDue === null) return "no_date";
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 30) return "due_30";
  if (daysUntilDue <= 90) return "due_90";
  return "current";
}

function getConfidence(
  dates: ExtractedPolicyDates,
  hasDueDate: boolean,
  evidenceCount: number,
): PolicyReviewConfidence {
  if (dates.nextReviewDate) return "high";
  if (hasDueDate && (dates.lastReviewedDate || dates.approvedDate)) return "medium";
  if (evidenceCount > 0) return "medium";
  return "low";
}

function buildReviewTags(
  status: PolicyReviewStatus,
  cycle: PolicyReviewCycle,
  confidence: PolicyReviewConfidence,
): string[] {
  const tags = [`review-${cycle.replace("_", "-")}`];
  if (status === "overdue") tags.push("overdue");
  if (status === "due_30") tags.push("due-30-days");
  if (status === "due_90") tags.push("due-90-days");
  if (status === "current") tags.push("current");
  if (status === "no_date") tags.push("review-date-missing");
  if (confidence !== "high") tags.push(`date-confidence-${confidence}`);
  return tags;
}

function normaliseYear(year: number): number {
  if (year < 100) return year >= 70 ? 1900 + year : 2000 + year;
  return year;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function toIsoDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
