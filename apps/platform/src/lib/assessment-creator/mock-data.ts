import type { AssessmentPupilPass, EvidencePassport, MarkingProposal, PaperQuestion } from "./types";

export const MOCK_PUPIL_HASHES = ["pupil-hash-001", "pupil-hash-002", "pupil-hash-003"];

export const MOCK_PUPIL_PASSES: Array<Pick<AssessmentPupilPass, "pupilHash" | "displayLabel" | "passCodename" | "passRoute">> = [
  {
    pupilHash: "pupil-hash-001",
    displayLabel: "Pupil 001",
    passCodename: "Purple Panda Star",
    passRoute: "/pupil/start?t=class-builder-pass-token-001",
  },
  {
    pupilHash: "pupil-hash-002",
    displayLabel: "Pupil 002",
    passCodename: "Blue Fox",
    passRoute: "/pupil/start?t=class-builder-pass-token-002",
  },
  {
    pupilHash: "pupil-hash-003",
    displayLabel: "Pupil 003",
    passCodename: "Green Owl Moon",
    passRoute: "/pupil/start?t=class-builder-pass-token-003",
  },
];

export function createMockQuestions(assessmentId: string): PaperQuestion[] {
  return [
    {
      id: "q1",
      assessmentId,
      number: 1,
      prompt: "Circle the fraction equivalent to 1/2.",
      marks: 1,
      objectiveId: "fractions",
      answerType: "multiple_choice",
      choices: [
        { label: "A", text: "1/4" },
        { label: "B", text: "2/4" },
        { label: "C", text: "2/3" },
        { label: "D", text: "3/4" },
      ],
      misconceptionTags: ["fractions_equivalence_confuses_numerator_denominator"],
      markScheme: {
        correctAnswer: "2/4",
        acceptedAnswers: ["2/4", "two quarters"],
        partialCreditRules: [],
        commonMisconceptions: [
          {
            tag: "fractions_equivalence_confuses_numerator_denominator",
            description: "Pupil changes only the numerator or denominator when finding an equivalent fraction.",
            feedbackPrompt: "Use a fraction wall or bar model to show why both parts scale together.",
          },
        ],
      },
    },
    {
      id: "q2",
      assessmentId,
      number: 2,
      prompt: "Explain how you know 0.4 is the same as 4/10.",
      marks: 2,
      objectiveId: "place-value-decimals",
      answerType: "short_answer",
      misconceptionTags: ["place_value_tenths_hundredths_reversal"],
      markScheme: {
        correctAnswer: "0.4 means four tenths, which is 4/10.",
        acceptedAnswers: ["four tenths", "4 tenths", "4/10"],
        partialCreditRules: [{ label: "Identifies four tenths without full explanation", marks: 1, pattern: "four tenths" }],
        commonMisconceptions: [
          {
            tag: "place_value_tenths_hundredths_reversal",
            description: "Pupil treats tenths and hundredths as interchangeable.",
            feedbackPrompt: "Return to place-value grids and ask pupils to build 0.4 with counters.",
          },
        ],
      },
    },
    {
      id: "q3",
      assessmentId,
      number: 3,
      prompt: "Write 3,406 in words.",
      marks: 1,
      objectiveId: "place-value-reading-numbers",
      answerType: "short_answer",
      misconceptionTags: ["place_value_zero_placeholder_omitted"],
      markScheme: {
        correctAnswer: "three thousand four hundred and six",
        acceptedAnswers: ["three thousand four hundred and six", "three thousand, four hundred and six"],
        partialCreditRules: [],
        commonMisconceptions: [
          {
            tag: "place_value_zero_placeholder_omitted",
            description: "Pupil omits the zero placeholder and reads the number as 346 or 3,460.",
            feedbackPrompt: "Return to place-value counters and ask pupils to explain the empty tens column.",
          },
        ],
      },
    },
    {
      id: "q4",
      assessmentId,
      number: 4,
      prompt: "Calculate 4,208 + 3,175. Show your working.",
      marks: 2,
      objectiveId: "formal-addition",
      answerType: "working_out",
      misconceptionTags: ["formal_addition_exchange_misaligned_columns"],
      markScheme: {
        correctAnswer: "7383",
        acceptedAnswers: ["7383", "7,383"],
        partialCreditRules: [{ label: "Correct method with one arithmetic slip", marks: 1, pattern: "column addition" }],
        commonMisconceptions: [
          {
            tag: "formal_addition_exchange_misaligned_columns",
            description: "Pupil misaligns columns or does not exchange accurately.",
            feedbackPrompt: "Use squared paper and ask pupils to annotate each place-value column before calculating.",
          },
        ],
      },
    },
    {
      id: "q5",
      assessmentId,
      number: 5,
      prompt: "Which number is 100 times greater than 0.07?",
      marks: 1,
      objectiveId: "decimal-place-value-scaling",
      answerType: "multiple_choice",
      choices: [
        { label: "A", text: "0.7" },
        { label: "B", text: "7" },
        { label: "C", text: "70" },
        { label: "D", text: "700" },
      ],
      misconceptionTags: ["decimal_scaling_moves_digits_instead_of_place_value"],
      markScheme: {
        correctAnswer: "7",
        acceptedAnswers: ["7"],
        partialCreditRules: [],
        commonMisconceptions: [
          {
            tag: "decimal_scaling_moves_digits_instead_of_place_value",
            description: "Pupil moves digits mechanically without tracking the value of each digit.",
            feedbackPrompt: "Use a place-value chart and move the value two columns to the left.",
          },
        ],
      },
    },
    {
      id: "q6",
      assessmentId,
      number: 6,
      prompt: "A ribbon is 2.4 m long. It is cut into 6 equal pieces. How long is each piece?",
      marks: 2,
      objectiveId: "division-decimals-context",
      answerType: "working_out",
      misconceptionTags: ["decimal_division_context_units_lost"],
      markScheme: {
        correctAnswer: "0.4 m",
        acceptedAnswers: ["0.4 m", "0.4 metres", "40 cm"],
        partialCreditRules: [{ label: "Correct calculation without unit", marks: 1, pattern: "0.4" }],
        commonMisconceptions: [
          {
            tag: "decimal_division_context_units_lost",
            description: "Pupil calculates with decimals but loses the measure context or unit.",
            feedbackPrompt: "Ask pupils to estimate first: six pieces must each be less than half a metre.",
          },
        ],
      },
    },
    {
      id: "q7",
      assessmentId,
      number: 7,
      prompt: "Put these numbers in order from smallest to largest: 0.52, 0.5, 0.205, 0.25.",
      marks: 2,
      objectiveId: "ordering-decimals",
      answerType: "short_answer",
      misconceptionTags: ["decimal_ordering_more_digits_assumed_larger"],
      markScheme: {
        correctAnswer: "0.205, 0.25, 0.5, 0.52",
        acceptedAnswers: ["0.205 0.25 0.5 0.52", "0.205, 0.25, 0.5, 0.52"],
        partialCreditRules: [{ label: "Two adjacent values correctly ordered", marks: 1, pattern: "partial decimal ordering" }],
        commonMisconceptions: [
          {
            tag: "decimal_ordering_more_digits_assumed_larger",
            description: "Pupil assumes the decimal with more digits is larger.",
            feedbackPrompt: "Align decimals in a place-value table and compare tenths first, then hundredths.",
          },
        ],
      },
    },
    {
      id: "q8",
      assessmentId,
      number: 8,
      prompt: "A pupil says 3/5 is greater than 0.7 because 5 is bigger than 7. Explain whether they are correct.",
      marks: 3,
      objectiveId: "fraction-decimal-reasoning",
      answerType: "extended_response",
      misconceptionTags: ["fraction_decimal_comparison_denominator_size"],
      markScheme: {
        correctAnswer: "They are not correct. 3/5 is 0.6, so 0.7 is greater.",
        acceptedAnswers: ["3/5 is 0.6", "0.7 is greater", "three fifths is six tenths"],
        partialCreditRules: [
          { label: "Identifies 0.7 is greater without full conversion", marks: 1, pattern: "0.7 greater" },
          { label: "Converts 3/5 to 0.6 but gives limited explanation", marks: 2, pattern: "0.6" },
        ],
        commonMisconceptions: [
          {
            tag: "fraction_decimal_comparison_denominator_size",
            description: "Pupil compares digits or denominators rather than the size of the values.",
            feedbackPrompt: "Use a bar model or tenths grid to show 3/5 as 6/10 before comparing.",
          },
        ],
      },
    },
  ];
}

export function createMockMarkingProposals(assessmentId: string): MarkingProposal[] {
  return MOCK_PUPIL_HASHES.flatMap((pupilHash, pupilIndex) => [
    {
      id: `${assessmentId}-${pupilHash}-q1`,
      questionId: "q1",
      pupilHash,
      proposedMarks: pupilIndex === 2 ? 0 : 1,
      maxMarks: 1,
      confidence: pupilIndex === 2 ? 0.58 : 0.94,
      rationale: pupilIndex === 2 ? "The selected answer appears to be 1/4, but handwriting is unclear." : "The selected answer matches 2/4.",
      misconceptionTag: pupilIndex === 2 ? "fractions_equivalence_confuses_numerator_denominator" : null,
      teacherDecision: "pending",
      teacherMarks: null,
    },
    {
      id: `${assessmentId}-${pupilHash}-q2`,
      questionId: "q2",
      pupilHash,
      proposedMarks: pupilIndex === 0 ? 2 : 1,
      maxMarks: 2,
      confidence: pupilIndex === 0 ? 0.88 : 0.71,
      rationale: pupilIndex === 0 ? "Explanation links 0.4 to four tenths." : "Answer mentions four but not tenths clearly enough for full credit.",
      misconceptionTag: pupilIndex === 1 ? "place_value_tenths_hundredths_reversal" : null,
      teacherDecision: "pending",
      teacherMarks: null,
    },
  ]);
}

export function createMockEvidencePassport(input: {
  assessmentId: string;
  organizationId: string;
  schoolId: string;
  classId: string;
  subject?: EvidencePassport["subject"];
  yearGroup?: EvidencePassport["yearGroup"];
  confidenceReasons: string[];
  evidenceConfidence: EvidencePassport["evidenceConfidence"];
}): EvidencePassport {
  return {
    id: crypto.randomUUID(),
    assessmentId: input.assessmentId,
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    classId: input.classId,
    subject: input.subject ?? "maths",
    yearGroup: input.yearGroup ?? "Year 5",
    evidenceConfidence: input.evidenceConfidence,
    confidenceReasons: input.confidenceReasons,
    objectiveCoverage: 0.82,
    markingReviewCompletion: 1,
    unresolvedUncertainty: 0.08,
    nextTeachingActions: [
      "Reteach equivalent fractions with bar models for pupils with partial credit.",
      "Add a five-minute retention check on tenths and hundredths next week.",
    ],
  };
}
