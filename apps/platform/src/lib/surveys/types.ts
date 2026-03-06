// ============================================================================
// Survey Module - TypeScript Types
// ============================================================================

export type SurveyStatus =
  | "draft"
  | "active"
  | "paused"
  | "closed"
  | "archived";
export type SurveyType =
  | "standard"
  | "nps"
  | "pulse"
  | "poll"
  | "quiz"
  | "assessment"
  | "feedback_360";
export type AudienceType =
  | "parent"
  | "staff"
  | "student"
  | "governor"
  | "mixed"
  | "public";

export type QuestionType =
  | "multiple_choice"
  | "checkbox"
  | "dropdown"
  | "short_text"
  | "long_text"
  | "rating"
  | "nps"
  | "likert_scale"
  | "matrix"
  | "ranking"
  | "slider"
  | "date_picker"
  | "file_upload"
  | "image_choice"
  | "yes_no"
  | "opinion_scale"
  | "continuous_sum"
  | "semantic_differential"
  | "contact_info"
  | "statement";

export type ConditionType =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "is_answered"
  | "is_not_answered"
  | "between"
  | "starts_with"
  | "ends_with";

export type LogicActionType =
  | "skip_to_page"
  | "skip_to_question"
  | "hide_question"
  | "show_question"
  | "hide_page"
  | "end_survey"
  | "set_variable"
  | "trigger_email";

export type ResponseStatus = "in_progress" | "completed" | "disqualified";
export type DistributionChannel =
  | "email"
  | "sms"
  | "link"
  | "qr_code"
  | "embed"
  | "parentmail_integration";
export type DistributionStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed";
export type TemplateCategory =
  | "parent_satisfaction"
  | "staff_wellbeing"
  | "student_voice"
  | "governor_feedback"
  | "event_feedback"
  | "ofsted_prep"
  | "safeguarding"
  | "curriculum"
  | "facilities"
  | "communication"
  | "custom";
export type CollaboratorRole = "editor" | "viewer" | "analyst";

// ============================================================================
// Core Entities
// ============================================================================

export interface SurveySettings {
  welcome_message?: string;
  thank_you_message?: string;
  thank_you_redirect_url?: string;
  save_and_continue?: boolean;
  response_limit?: number;
  start_date?: string;
  end_date?: string;
  allow_multiple_responses?: boolean;
  require_auth?: boolean;
  show_progress_bar?: boolean;
  randomise_questions?: boolean;
  randomise_options?: boolean;
  auto_close_on_limit?: boolean;
  password_protection?: string;
  custom_domain_slug?: string;
  locale?: "en" | "cy";
  time_estimate_minutes?: number;
  conversational_mode?: boolean;
}

export interface SurveyBranding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  background_image_url?: string;
  custom_css?: string;
}

export interface ScoringConfig {
  enable_scoring?: boolean;
  show_score_to_respondent?: boolean;
  score_ranges?: Array<{
    min: number;
    max: number;
    label: string;
    feedback: string;
  }>;
}

export interface Survey {
  id: string;
  organization_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  status: SurveyStatus;
  survey_type: SurveyType;
  audience_type: AudienceType;
  is_anonymous: boolean;
  is_toolbox: boolean;
  slug: string | null;
  settings: SurveySettings;
  branding: SurveyBranding;
  scoring_config: ScoringConfig;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined
  pages?: SurveyPage[];
  response_count?: number;
  completion_rate?: number;
}

export interface SurveyPage {
  id: string;
  survey_id: string;
  title: string | null;
  description: string | null;
  sort_order: number;
  is_random: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  questions?: SurveyQuestion[];
}

export interface QuestionSettings {
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  validation_regex?: string;
  validation_message?: string;
  word_limit?: number;
  char_limit?: number;
  allow_other?: boolean;
  other_label?: string;
  randomise_choices?: boolean;
  carry_forward_from?: string;
  image_url?: string;
  video_url?: string;
  rating_icon?: "star" | "heart" | "smiley";
  rating_count?: number;
  matrix_rows?: string[];
  matrix_columns?: string[];
  scale_labels?: Record<string, string>;
  nps_labels?: Record<string, string>;
  date_format?: string;
  file_types?: string[];
  max_file_size?: number;
  max_files?: number;
  min_label?: string;
  max_label?: string;
  min_selections?: number;
  max_selections?: number;
  // Contact info
  contact_fields?: Array<"name" | "email" | "phone" | "organisation">;
  // Semantic differential
  left_label?: string;
  right_label?: string;
  // Continuous sum
  target_sum?: number;
  sum_fields?: string[];
  // Statement
  acknowledge_checkbox?: boolean;
  acknowledge_label?: string;
  // Validation
  input_type?: "text" | "email" | "phone" | "number" | "url";
}

export interface QuestionScoring {
  points_per_option?: Record<string, number>;
  correct_answer?: string | string[];
  feedback_correct?: string;
  feedback_incorrect?: string;
}

export interface SurveyQuestion {
  id: string;
  page_id: string;
  survey_id: string;
  question_type: QuestionType;
  title: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
  settings: QuestionSettings;
  scoring: QuestionScoring;
  piping_source: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  choices?: SurveyChoice[];
}

export interface SurveyChoice {
  id: string;
  question_id: string;
  label: string;
  value: string | null;
  image_url: string | null;
  sort_order: number;
  is_other: boolean;
  score_value: number | null;
  created_at: string;
}

export interface SurveyLogicRule {
  id: string;
  survey_id: string;
  source_question_id: string;
  condition_type: ConditionType;
  condition_value: string | null;
  action_type: LogicActionType;
  target_id: string | null;
  action_config: Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

// ============================================================================
// Response Entities
// ============================================================================

export interface SurveyResponse {
  id: string;
  survey_id: string;
  respondent_id: string | null;
  session_id: string | null;
  status: ResponseStatus;
  started_at: string;
  completed_at: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  total_score: number | null;
  time_taken_seconds: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  answers?: SurveyAnswer[];
}

export interface SurveyAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string | null;
  answer_choices: string[] | null;
  answer_numeric: number | null;
  answer_date: string | null;
  answer_json: Record<string, unknown> | null;
  score: number | null;
  answered_at: string;
}

// ============================================================================
// Distribution & Templates
// ============================================================================

export interface SurveyDistribution {
  id: string;
  survey_id: string;
  channel: DistributionChannel;
  config: Record<string, unknown>;
  status: DistributionStatus;
  sent_at: string | null;
  stats: {
    sent_count?: number;
    opened_count?: number;
    completed_count?: number;
    bounced_count?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface SurveyTemplate {
  id: string;
  title: string;
  description: string | null;
  category: TemplateCategory;
  audience_type: AudienceType;
  template_data: {
    pages: Array<{
      title: string;
      questions: Array<{
        type: QuestionType;
        title: string;
        is_required?: boolean;
        settings?: QuestionSettings;
        choices?: string[];
      }>;
    }>;
  };
  is_system: boolean;
  usage_count: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Builder State Types
// ============================================================================

export interface BuilderState {
  survey: Survey;
  pages: SurveyPage[];
  selectedPageId: string | null;
  selectedQuestionId: string | null;
  isDirty: boolean;
  undoStack: BuilderAction[];
  redoStack: BuilderAction[];
}

export type BuilderAction =
  | { type: "ADD_PAGE"; page: SurveyPage }
  | { type: "DELETE_PAGE"; pageId: string }
  | { type: "REORDER_PAGES"; pageIds: string[] }
  | { type: "UPDATE_PAGE"; pageId: string; updates: Partial<SurveyPage> }
  | { type: "ADD_QUESTION"; pageId: string; question: SurveyQuestion }
  | { type: "DELETE_QUESTION"; questionId: string }
  | { type: "REORDER_QUESTIONS"; pageId: string; questionIds: string[] }
  | {
      type: "UPDATE_QUESTION";
      questionId: string;
      updates: Partial<SurveyQuestion>;
    }
  | { type: "ADD_CHOICE"; questionId: string; choice: SurveyChoice }
  | { type: "DELETE_CHOICE"; choiceId: string }
  | { type: "UPDATE_CHOICE"; choiceId: string; updates: Partial<SurveyChoice> }
  | { type: "UPDATE_SURVEY"; updates: Partial<Survey> };

// ============================================================================
// Analytics Types
// ============================================================================

export interface SurveyAnalytics {
  survey_id: string;
  total_responses: number;
  completed_responses: number;
  in_progress_responses: number;
  completion_rate: number;
  average_time_seconds: number | null;
  responses_by_day: Array<{ date: string; count: number }>;
  device_breakdown: Array<{ device: string; count: number }>;
}

export interface QuestionAnalytics {
  question_id: string;
  question_type: QuestionType;
  title: string;
  response_count: number;
  skip_count: number;
  choice_distribution?: Array<{
    choice_id: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  average_numeric?: number;
  median_numeric?: number;
  nps_score?: number;
  nps_breakdown?: { promoters: number; passives: number; detractors: number };
  text_responses?: string[];
}

// ============================================================================
// Question Type Metadata
// ============================================================================

export const QUESTION_TYPE_META: Record<
  QuestionType,
  {
    label: string;
    description: string;
    icon: string;
    category: "choice" | "text" | "scale" | "advanced" | "special";
    hasChoices: boolean;
    isToolboxAvailable: boolean;
  }
> = {
  multiple_choice: {
    label: "Multiple Choice",
    description: "Single select with radio buttons",
    icon: "CircleDot",
    category: "choice",
    hasChoices: true,
    isToolboxAvailable: true,
  },
  checkbox: {
    label: "Checkbox",
    description: "Multi-select with checkboxes",
    icon: "CheckSquare",
    category: "choice",
    hasChoices: true,
    isToolboxAvailable: true,
  },
  dropdown: {
    label: "Dropdown",
    description: "Single select dropdown",
    icon: "ChevronDown",
    category: "choice",
    hasChoices: true,
    isToolboxAvailable: true,
  },
  short_text: {
    label: "Short Text",
    description: "Single-line text input",
    icon: "Type",
    category: "text",
    hasChoices: false,
    isToolboxAvailable: true,
  },
  long_text: {
    label: "Long Text",
    description: "Multi-line text area",
    icon: "AlignLeft",
    category: "text",
    hasChoices: false,
    isToolboxAvailable: true,
  },
  rating: {
    label: "Rating",
    description: "Star/heart/smiley rating",
    icon: "Star",
    category: "scale",
    hasChoices: false,
    isToolboxAvailable: true,
  },
  nps: {
    label: "Net Promoter Score",
    description: "0-10 recommendation scale",
    icon: "Gauge",
    category: "scale",
    hasChoices: false,
    isToolboxAvailable: false,
  },
  likert_scale: {
    label: "Likert Scale",
    description: "Agreement scale",
    icon: "SlidersHorizontal",
    category: "scale",
    hasChoices: false,
    isToolboxAvailable: true,
  },
  matrix: {
    label: "Matrix",
    description: "Grid of rows and columns",
    icon: "Grid3x3",
    category: "advanced",
    hasChoices: false,
    isToolboxAvailable: false,
  },
  ranking: {
    label: "Ranking",
    description: "Drag-and-drop ranking",
    icon: "ArrowUpDown",
    category: "advanced",
    hasChoices: true,
    isToolboxAvailable: false,
  },
  slider: {
    label: "Slider",
    description: "Numeric slider",
    icon: "SlidersHorizontal",
    category: "scale",
    hasChoices: false,
    isToolboxAvailable: false,
  },
  date_picker: {
    label: "Date Picker",
    description: "Date selection",
    icon: "Calendar",
    category: "special",
    hasChoices: false,
    isToolboxAvailable: false,
  },
  file_upload: {
    label: "File Upload",
    description: "Upload files",
    icon: "Upload",
    category: "special",
    hasChoices: false,
    isToolboxAvailable: false,
  },
  image_choice: {
    label: "Image Choice",
    description: "Select from images",
    icon: "Image",
    category: "choice",
    hasChoices: true,
    isToolboxAvailable: false,
  },
  yes_no: {
    label: "Yes / No",
    description: "Binary toggle",
    icon: "ToggleLeft",
    category: "choice",
    hasChoices: false,
    isToolboxAvailable: true,
  },
  opinion_scale: {
    label: "Opinion Scale",
    description: "Numbered scale",
    icon: "Hash",
    category: "scale",
    hasChoices: false,
    isToolboxAvailable: true,
  },
  continuous_sum: {
    label: "Continuous Sum",
    description: "Allocate points",
    icon: "Calculator",
    category: "advanced",
    hasChoices: false,
    isToolboxAvailable: false,
  },
  semantic_differential: {
    label: "Semantic Differential",
    description: "Bipolar adjective scale",
    icon: "ArrowLeftRight",
    category: "advanced",
    hasChoices: false,
    isToolboxAvailable: false,
  },
  contact_info: {
    label: "Contact Info",
    description: "Name, email, phone fields",
    icon: "User",
    category: "special",
    hasChoices: false,
    isToolboxAvailable: false,
  },
  statement: {
    label: "Statement",
    description: "Instructions or consent text",
    icon: "FileText",
    category: "special",
    hasChoices: false,
    isToolboxAvailable: true,
  },
};

export const QUESTION_CATEGORIES = [
  {
    id: "choice",
    label: "Choice",
    types: [
      "multiple_choice",
      "checkbox",
      "dropdown",
      "image_choice",
      "yes_no",
    ],
  },
  { id: "text", label: "Text", types: ["short_text", "long_text"] },
  {
    id: "scale",
    label: "Scale & Rating",
    types: ["rating", "nps", "likert_scale", "opinion_scale", "slider"],
  },
  {
    id: "advanced",
    label: "Advanced",
    types: ["matrix", "ranking", "continuous_sum", "semantic_differential"],
  },
  {
    id: "special",
    label: "Special",
    types: ["date_picker", "file_upload", "contact_info", "statement"],
  },
] as const;

// Default Likert choices
export const LIKERT_DEFAULTS = [
  "Strongly disagree",
  "Disagree",
  "Neither agree nor disagree",
  "Agree",
  "Strongly agree",
];
