import type { SurveyQuestion, SurveyAnswer, QuestionSettings } from "./types";

export interface ValidationError {
  questionId: string;
  message: string;
}

export function validateAnswer(
  question: SurveyQuestion,
  answer: SurveyAnswer | undefined,
): ValidationError | null {
  const s = question.settings;

  // Required check
  if (question.is_required) {
    const isEmpty =
      !answer ||
      (answer.answer_text === null &&
        answer.answer_numeric === null &&
        (!answer.answer_choices || answer.answer_choices.length === 0) &&
        answer.answer_date === null &&
        answer.answer_json === null);

    if (isEmpty) {
      return { questionId: question.id, message: "This question is required." };
    }
  }

  if (!answer) return null;

  // Type-specific validation
  switch (question.question_type) {
    case "short_text":
    case "long_text": {
      const text = answer.answer_text ?? "";
      if (s.char_limit && text.length > s.char_limit) {
        return {
          questionId: question.id,
          message: `Maximum ${s.char_limit} characters allowed.`,
        };
      }
      if (s.word_limit) {
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > s.word_limit) {
          return {
            questionId: question.id,
            message: `Maximum ${s.word_limit} words allowed.`,
          };
        }
      }
      if (s.validation_regex) {
        const regex = new RegExp(s.validation_regex);
        if (text && !regex.test(text)) {
          return {
            questionId: question.id,
            message: s.validation_message ?? "Invalid format.",
          };
        }
      }
      if (s.input_type === "email" && text) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          return {
            questionId: question.id,
            message: "Please enter a valid email address.",
          };
        }
      }
      break;
    }

    case "checkbox": {
      const selected = answer.answer_choices?.length ?? 0;
      if (s.min_selections && selected < s.min_selections) {
        return {
          questionId: question.id,
          message: `Please select at least ${s.min_selections} options.`,
        };
      }
      if (s.max_selections && selected > s.max_selections) {
        return {
          questionId: question.id,
          message: `Please select at most ${s.max_selections} options.`,
        };
      }
      break;
    }

    case "slider":
    case "opinion_scale": {
      const num = answer.answer_numeric;
      if (num !== null) {
        if (s.min !== undefined && num < s.min) {
          return {
            questionId: question.id,
            message: `Value must be at least ${s.min}.`,
          };
        }
        if (s.max !== undefined && num > s.max) {
          return {
            questionId: question.id,
            message: `Value must be at most ${s.max}.`,
          };
        }
      }
      break;
    }

    case "continuous_sum": {
      if (answer.answer_json && s.target_sum !== undefined) {
        const values = Object.values(
          answer.answer_json as Record<string, number>,
        );
        const sum = values.reduce(
          (a, b) => a + (typeof b === "number" ? b : 0),
          0,
        );
        if (sum !== s.target_sum) {
          return {
            questionId: question.id,
            message: `Values must total exactly ${s.target_sum}. Current total: ${sum}.`,
          };
        }
      }
      break;
    }

    case "file_upload": {
      if (answer.answer_json) {
        const files = answer.answer_json as {
          files?: Array<{ size: number; type: string }>;
        };
        if (s.max_files && files.files && files.files.length > s.max_files) {
          return {
            questionId: question.id,
            message: `Maximum ${s.max_files} files allowed.`,
          };
        }
      }
      break;
    }
  }

  return null;
}

export function validateAllAnswers(
  questions: SurveyQuestion[],
  answers: Map<string, SurveyAnswer>,
  hiddenQuestionIds: Set<string> = new Set(),
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const question of questions) {
    if (question.question_type === "statement") continue;
    if (hiddenQuestionIds.has(question.id)) continue;

    const answer = answers.get(question.id);
    const error = validateAnswer(question, answer);
    if (error) errors.push(error);
  }

  return errors;
}
