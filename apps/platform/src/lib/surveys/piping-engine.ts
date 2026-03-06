import type { SurveyAnswer, SurveyQuestion, SurveyChoice } from "./types";

type AnswerMap = Map<string, SurveyAnswer>;
type QuestionMap = Map<string, SurveyQuestion>;

export function resolvePipedText(
  text: string,
  answers: AnswerMap,
  questions: QuestionMap,
  variables?: Map<string, string>,
  respondentName?: string,
): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const trimmed = key.trim();

    // Respondent variables
    if (trimmed === "RESPONDENT.name") return respondentName ?? "Respondent";

    // Custom variables
    if (trimmed.startsWith("VAR.")) {
      const varKey = trimmed.slice(4);
      return variables?.get(varKey) ?? match;
    }

    // Question piping: {{Q_ID}} or {{Q_ID.label}} or {{Q_ID.score}}
    const parts = trimmed.split(".");
    const questionId = parts[0];
    const property = parts[1];

    const answer = answers.get(questionId);
    const question = questions.get(questionId);

    if (!answer || !question) return match;

    if (property === "label") {
      if (answer.answer_choices && question.choices) {
        return answer.answer_choices
          .map(
            (cId) => question.choices?.find((c) => c.id === cId)?.label ?? cId,
          )
          .join(", ");
      }
      return answer.answer_text ?? match;
    }

    if (property === "score") {
      return answer.score !== null ? String(answer.score) : "0";
    }

    // Default: return the raw answer value
    if (answer.answer_text) return answer.answer_text;
    if (answer.answer_numeric !== null) return String(answer.answer_numeric);
    if (answer.answer_choices && question.choices) {
      return answer.answer_choices
        .map((cId) => question.choices?.find((c) => c.id === cId)?.label ?? cId)
        .join(", ");
    }

    return match;
  });
}
