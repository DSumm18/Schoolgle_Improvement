import type { Survey, SurveyStatus, QuestionType } from "./types";
import crypto from "crypto";

export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50)
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export function hashIP(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + "schoolgle-survey-salt")
    .digest("hex")
    .slice(0, 16);
}

export function getStatusColor(status: SurveyStatus): string {
  const colors: Record<SurveyStatus, string> = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    active:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    paused:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    closed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    archived:
      "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  };
  return colors[status];
}

export function getStatusLabel(status: SurveyStatus): string {
  const labels: Record<SurveyStatus, string> = {
    draft: "Draft",
    active: "Active",
    paused: "Paused",
    closed: "Closed",
    archived: "Archived",
  };
  return labels[status];
}

export function isToolboxQuestionType(type: QuestionType): boolean {
  const toolboxTypes: QuestionType[] = [
    "multiple_choice",
    "checkbox",
    "dropdown",
    "short_text",
    "long_text",
    "rating",
    "likert_scale",
    "yes_no",
    "opinion_scale",
    "statement",
  ];
  return toolboxTypes.includes(type);
}

export function calculateCompletionRate(
  total: number,
  completed: number,
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function calculateNPS(scores: number[]): number {
  if (scores.length === 0) return 0;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

export function generateSessionId(): string {
  return "sess_" + crypto.randomUUID();
}
