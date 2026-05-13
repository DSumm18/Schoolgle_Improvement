import type { EvidenceConfidence } from "./types";

export interface EvidenceConfidenceInput {
  daysOld: number;
  objectiveCoverage: number;
  depthScore: number;
  questionCountPerObjective: number;
  markingReviewCompletion: number;
  teacherOverrideRate: number;
  responseCompleteness: number;
  moderated: boolean;
  submittedJudgementMismatch: boolean;
}

export interface EvidenceConfidenceResult {
  rating: EvidenceConfidence;
  score: number;
  reasons: string[];
}

export function scoreEvidenceConfidence(input: EvidenceConfidenceInput): EvidenceConfidenceResult {
  if (input.submittedJudgementMismatch) {
    return {
      rating: "mismatch",
      score: 0,
      reasons: ["Submitted judgement differs materially from assessment evidence."],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  if (input.daysOld <= 45) {
    score += 20;
    reasons.push("Evidence is recent.");
  }
  if (input.objectiveCoverage >= 0.75) {
    score += 20;
    reasons.push("Objective coverage is broad.");
  }
  if (input.depthScore >= 0.7) {
    score += 15;
    reasons.push("Question depth supports a secure judgement.");
  }
  if (input.questionCountPerObjective >= 3) {
    score += 10;
    reasons.push("There are enough questions per objective.");
  }
  if (input.markingReviewCompletion >= 0.95) {
    score += 15;
    reasons.push("Teacher review is complete.");
  }
  if (input.teacherOverrideRate <= 0.15) {
    score += 5;
    reasons.push("Teacher override rate is low.");
  }
  if (input.responseCompleteness >= 0.9) {
    score += 10;
    reasons.push("Most pupil responses are complete and readable.");
  }
  if (input.moderated) {
    score += 5;
    reasons.push("Evidence has been moderated.");
  }

  if (score >= 80) return { rating: "high", score, reasons };
  if (score >= 50) return { rating: "medium", score, reasons };
  return { rating: "low", score, reasons };
}
