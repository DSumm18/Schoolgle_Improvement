"use client";

import type { SurveyQuestion, QuestionType } from "@/lib/surveys/types";
import { MultipleChoice } from "./MultipleChoice";
import { Checkbox } from "./Checkbox";
import { Dropdown } from "./Dropdown";
import { ShortText } from "./ShortText";
import { LongText } from "./LongText";
import { Rating } from "./Rating";
import { LikertScale } from "./LikertScale";
import { YesNo } from "./YesNo";
import { OpinionScale } from "./OpinionScale";
import { Statement } from "./Statement";

export interface QuestionComponentProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  preview?: boolean;
}

const QUESTION_COMPONENT_MAP: Partial<
  Record<QuestionType, React.ComponentType<QuestionComponentProps>>
> = {
  multiple_choice: MultipleChoice,
  checkbox: Checkbox,
  dropdown: Dropdown,
  short_text: ShortText,
  long_text: LongText,
  rating: Rating,
  likert_scale: LikertScale,
  yes_no: YesNo,
  opinion_scale: OpinionScale,
  statement: Statement,
};

export function QuestionRenderer({
  question,
  value,
  onChange,
  error,
  disabled,
  preview,
}: QuestionComponentProps) {
  const Component = QUESTION_COMPONENT_MAP[question.question_type];

  if (!Component) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/30 p-4 text-sm text-muted-foreground">
        Unsupported question type: <code>{question.question_type}</code>
      </div>
    );
  }

  return (
    <Component
      question={question}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
      preview={preview}
    />
  );
}
