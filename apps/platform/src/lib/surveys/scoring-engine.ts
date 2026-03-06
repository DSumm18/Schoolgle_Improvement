import type { SurveyQuestion, SurveyAnswer, ScoringConfig } from "./types";

export interface ScoreResult {
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  questionScores: Map<string, number>;
  rangeFeedback: string | null;
}

export function calculateScore(
  questions: SurveyQuestion[],
  answers: Map<string, SurveyAnswer>,
  scoringConfig: ScoringConfig,
): ScoreResult {
  const questionScores = new Map<string, number>();
  let totalScore = 0;
  let maxPossibleScore = 0;

  for (const question of questions) {
    const answer = answers.get(question.id);
    if (!answer) continue;

    const scoring = question.scoring;
    if (!scoring) continue;

    let questionScore = 0;

    if (scoring.points_per_option && answer.answer_choices) {
      for (const choiceId of answer.answer_choices) {
        questionScore += scoring.points_per_option[choiceId] ?? 0;
      }
      maxPossibleScore += Math.max(
        ...Object.values(scoring.points_per_option),
        0,
      );
    } else if (scoring.correct_answer) {
      const correct = Array.isArray(scoring.correct_answer)
        ? scoring.correct_answer
        : [scoring.correct_answer];
      const given =
        answer.answer_choices ??
        (answer.answer_text ? [answer.answer_text] : []);
      const isCorrect =
        correct.length === given.length &&
        correct.every((c) => given.includes(c));
      questionScore = isCorrect ? 1 : 0;
      maxPossibleScore += 1;
    } else if (answer.answer_numeric !== null && question.choices) {
      const choice = question.choices.find((c) => c.score_value !== null);
      if (choice) {
        questionScore = answer.answer_numeric;
        maxPossibleScore += Math.max(
          ...question.choices.map((c) => c.score_value ?? 0),
          0,
        );
      }
    }

    questionScores.set(question.id, questionScore);
    totalScore += questionScore;
  }

  const percentage =
    maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  let rangeFeedback: string | null = null;
  if (scoringConfig.score_ranges) {
    const range = scoringConfig.score_ranges.find(
      (r) => percentage >= r.min && percentage <= r.max,
    );
    rangeFeedback = range?.feedback ?? null;
  }

  return {
    totalScore,
    maxPossibleScore,
    percentage,
    questionScores,
    rangeFeedback,
  };
}
