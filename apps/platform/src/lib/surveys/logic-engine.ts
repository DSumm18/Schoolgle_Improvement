import type { SurveyLogicRule, SurveyAnswer, LogicActionType } from "./types";

export interface LogicResult {
  hiddenQuestionIds: Set<string>;
  hiddenPageIds: Set<string>;
  shouldEndSurvey: boolean;
  skipToQuestionId: string | null;
  skipToPageId: string | null;
}

type AnswerMap = Map<string, SurveyAnswer>;

function getAnswerValue(
  answer: SurveyAnswer | undefined,
): string | number | null {
  if (!answer) return null;
  if (answer.answer_numeric !== null) return answer.answer_numeric;
  if (answer.answer_text !== null) return answer.answer_text;
  if (answer.answer_choices && answer.answer_choices.length > 0)
    return answer.answer_choices.join(",");
  return null;
}

function evaluateCondition(rule: SurveyLogicRule, answers: AnswerMap): boolean {
  const answer = answers.get(rule.source_question_id);
  const value = getAnswerValue(answer);
  const condVal = rule.condition_value;

  switch (rule.condition_type) {
    case "is_answered":
      return value !== null && value !== "";
    case "is_not_answered":
      return value === null || value === "";
    case "equals":
      return String(value) === condVal;
    case "not_equals":
      return String(value) !== condVal;
    case "contains":
      return condVal
        ? String(value).toLowerCase().includes(condVal.toLowerCase())
        : false;
    case "greater_than":
      return typeof value === "number" && condVal
        ? value > Number(condVal)
        : false;
    case "less_than":
      return typeof value === "number" && condVal
        ? value < Number(condVal)
        : false;
    case "between": {
      if (typeof value !== "number" || !condVal) return false;
      const [min, max] = condVal.split(",").map(Number);
      return value >= min && value <= max;
    }
    case "starts_with":
      return condVal
        ? String(value).toLowerCase().startsWith(condVal.toLowerCase())
        : false;
    case "ends_with":
      return condVal
        ? String(value).toLowerCase().endsWith(condVal.toLowerCase())
        : false;
    default:
      return false;
  }
}

export function evaluateLogic(
  rules: SurveyLogicRule[],
  currentAnswers: AnswerMap,
): LogicResult {
  const result: LogicResult = {
    hiddenQuestionIds: new Set(),
    hiddenPageIds: new Set(),
    shouldEndSurvey: false,
    skipToQuestionId: null,
    skipToPageId: null,
  };

  const sorted = [...rules].sort((a, b) => a.sort_order - b.sort_order);

  for (const rule of sorted) {
    if (!evaluateCondition(rule, currentAnswers)) continue;

    switch (rule.action_type) {
      case "hide_question":
        if (rule.target_id) result.hiddenQuestionIds.add(rule.target_id);
        break;
      case "show_question":
        if (rule.target_id) result.hiddenQuestionIds.delete(rule.target_id);
        break;
      case "hide_page":
        if (rule.target_id) result.hiddenPageIds.add(rule.target_id);
        break;
      case "skip_to_question":
        result.skipToQuestionId = rule.target_id;
        break;
      case "skip_to_page":
        result.skipToPageId = rule.target_id;
        break;
      case "end_survey":
        result.shouldEndSurvey = true;
        break;
    }
  }

  return result;
}
