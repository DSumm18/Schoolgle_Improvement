import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock the supabase client before importing the module under test
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { syncAssessmentToIntelligence } from "./intelligence-bridge";
import { supabase } from "@/lib/supabase";

const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({ insert: mockInsert }));

beforeEach(() => {
  vi.clearAllMocks();
  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);
  mockInsert.mockResolvedValue({ error: null });
});

const BASE_PARAMS = {
  organizationId: "org-abc",
  pupilId: "pupil-123",
  lessonPlanId: "plan-456",
  subject: "Maths",
  verifiedGrade: "EXS",
  aiSuggestedGrade: "EXS",
  wasOverridden: false,
  misconceptions: [],
  assessedAt: "2026-04-14T10:00:00.000Z",
};

describe("syncAssessmentToIntelligence", () => {
  test("inserts into pupil_analysis_insights with correct shape", async () => {
    await syncAssessmentToIntelligence(BASE_PARAMS);

    expect(supabase.from).toHaveBeenCalledWith("pupil_analysis_insights");
    expect(mockInsert).toHaveBeenCalledOnce();

    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted.organization_id).toBe("org-abc");
    expect(inserted.pupil_id).toBe("pupil-123");
    expect(inserted.insight_type).toBe("lesson_assessment");
    expect(inserted.subject).toBe("Maths");
    expect(inserted.data.lesson_plan_id).toBe("plan-456");
    expect(inserted.data.verified_grade).toBe("EXS");
    expect(inserted.data.ai_suggested_grade).toBe("EXS");
    expect(inserted.data.was_overridden).toBe(false);
  });

  test("sets severity to info when not overridden", async () => {
    await syncAssessmentToIntelligence({ ...BASE_PARAMS, wasOverridden: false });
    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted.severity).toBe("info");
  });

  test("sets severity to warning when teacher overrides AI grade", async () => {
    await syncAssessmentToIntelligence({
      ...BASE_PARAMS,
      wasOverridden: true,
      verifiedGrade: "GDS",
      aiSuggestedGrade: "EXS",
    });
    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted.severity).toBe("warning");
    expect(inserted.data.was_overridden).toBe(true);
    expect(inserted.data.verified_grade).toBe("GDS");
    expect(inserted.data.ai_suggested_grade).toBe("EXS");
  });

  test("includes misconceptions in data payload", async () => {
    const misconceptions = [
      { description: "Confuses carrying in column addition", severity: "high" },
    ];
    await syncAssessmentToIntelligence({ ...BASE_PARAMS, misconceptions });
    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted.data.misconceptions).toEqual(misconceptions);
  });

  test("does not throw when Supabase insert returns an error", async () => {
    mockInsert.mockResolvedValue({ error: { message: "relation does not exist" } });
    // Should resolve silently — fire-and-forget
    await expect(
      syncAssessmentToIntelligence(BASE_PARAMS),
    ).resolves.toBeUndefined();
  });

  test("does not throw when Supabase throws an exception", async () => {
    mockInsert.mockRejectedValue(new Error("network error"));
    await expect(
      syncAssessmentToIntelligence(BASE_PARAMS),
    ).resolves.toBeUndefined();
  });
});
