import { describe, it, expect } from "vitest";
import { generateOfstedNarrative } from "./ofsted-narrative";
import type { LSIntervention, LSInterventionSession } from "@/types/lesson-studio";

const baseIntervention: LSIntervention = {
  id: "int-1",
  organization_id: "org-1",
  pupil_id: "pupil-1",
  class_id: "class-1",
  title: "Maths fractions intervention",
  target: "Move from WTS to EXS in fractions",
  subject: "Maths",
  format: "small_group",
  frequency: "3x per week, 20 minutes",
  duration_weeks: 6,
  delivered_by: "Mrs Jones (TA)",
  eef_strategy_id: "small-group-tuition",
  eef_strategy_name: "Small Group Tuition",
  eef_impact_months: 4,
  success_criteria: "Pupil can add fractions with different denominators independently",
  lesson_adaptations: "Pre-teach vocabulary, concrete manipulatives",
  resources: null,
  status: "active",
  started_at: "2026-03-01",
  target_end_date: "2026-04-12",
  completed_at: null,
  created_by: "teacher-1",
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

const baseSessions: LSInterventionSession[] = [
  {
    id: "sess-1",
    intervention_id: "int-1",
    session_number: 1,
    session_date: "2026-03-03",
    duration_minutes: 20,
    delivered_by: "Mrs Jones",
    focus: "Equivalent fractions with fraction walls",
    observation: "Pupil showed understanding using concrete resources but struggled with pictorial representation.",
    next_session_plan: "Move to pictorial fraction bars",
    progress_note: "Good engagement, needs more practice",
    stage: "concrete",
    created_at: "2026-03-03T10:00:00Z",
  },
  {
    id: "sess-2",
    intervention_id: "int-1",
    session_number: 2,
    session_date: "2026-03-05",
    duration_minutes: 20,
    delivered_by: "Mrs Jones",
    focus: "Pictorial fraction bars for equivalent fractions",
    observation: "Improved confidence with pictorial models. Can identify 1/2 = 2/4 = 3/6.",
    next_session_plan: "Introduce abstract notation",
    progress_note: "Progressing well through CPA",
    stage: "pictorial",
    created_at: "2026-03-05T10:00:00Z",
  },
];

describe("generateOfstedNarrative", () => {
  it("generates a multi-paragraph narrative", () => {
    const result = generateOfstedNarrative({
      pupilName: "Pupil A",
      subject: "Maths",
      currentGrade: "WTS",
      previousGrade: "WTS",
      intervention: baseIntervention,
      sessions: baseSessions,
      assessmentHistory: [
        { date: "2026-01-15", grade: "WTS", source: "Census" },
        { date: "2026-03-01", grade: "WTS", source: "Baseline" },
      ],
    });

    // Should be multiple paragraphs
    const paragraphs = result.split("\n\n");
    expect(paragraphs.length).toBeGreaterThanOrEqual(3);

    // Should mention the pupil
    expect(result).toContain("Pupil A");

    // Should mention the EEF strategy
    expect(result).toContain("Small Group Tuition");
    expect(result).toContain("+4 months");

    // Should mention session count
    expect(result).toContain("2 sessions");

    // Should mention total minutes
    expect(result).toContain("40 minutes");

    // Should mention the observation from the latest session
    expect(result).toContain("pictorial models");

    // Should mention CPA stages
    expect(result).toContain("concrete");
    expect(result).toContain("pictorial");
  });

  it("handles grade improvement", () => {
    const result = generateOfstedNarrative({
      pupilName: "Pupil B",
      subject: "Maths",
      currentGrade: "EXS",
      previousGrade: "WTS",
      intervention: baseIntervention,
      sessions: baseSessions,
      assessmentHistory: [
        { date: "2026-01-15", grade: "WTS", source: "Census" },
      ],
    });

    expect(result).toContain("progressed from WTS to EXS");
    expect(result).toContain("measurable effect");
  });

  it("handles no sessions gracefully", () => {
    const result = generateOfstedNarrative({
      pupilName: "Pupil C",
      subject: "Reading",
      currentGrade: "PKE",
      previousGrade: "PKE",
      intervention: { ...baseIntervention, subject: "Reading" },
      sessions: [],
      assessmentHistory: [
        { date: "2026-01-15", grade: "PKE", source: "Census" },
      ],
    });

    expect(result).toContain("awaiting its first delivery session");
    expect(result).toContain("Pupil C");
  });

  it("includes target end date when set", () => {
    const result = generateOfstedNarrative({
      pupilName: "Pupil D",
      subject: "Maths",
      currentGrade: "WTS",
      previousGrade: "WTS",
      intervention: baseIntervention,
      sessions: baseSessions,
      assessmentHistory: [],
    });

    expect(result).toContain("12 April 2026");
  });

  it("handles completed intervention", () => {
    const completed = { ...baseIntervention, status: "completed" as const, completed_at: "2026-04-10" };
    const result = generateOfstedNarrative({
      pupilName: "Pupil E",
      subject: "Maths",
      currentGrade: "EXS",
      previousGrade: "WTS",
      intervention: completed,
      sessions: baseSessions,
      assessmentHistory: [],
    });

    expect(result).toContain("intervention has been completed");
    expect(result).toContain("monitor sustained impact");
  });
});
