import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CurriculumChecklist } from "./CurriculumChecklist";

// Mock useAuth
vi.mock("@/context/SupabaseAuthContext", () => ({
  useAuth: () => ({
    session: { access_token: "test-token" },
    organizationId: "org-123",
  }),
}));

const mockSubjects = [
  {
    subject: "Mathematics",
    taught_count: 5,
    evidenced_count: 2,
    total: 13,
    strands: [
      {
        strand: "Number & Place Value",
        taught_count: 3,
        evidenced_count: 1,
        total: 5,
        objectives: [
          {
            id: "obj-1",
            objective_code: "Y3-M-NPV-01",
            objective_text:
              "Count from 0 in multiples of 4, 8, 50 and 100",
            strand: "Number & Place Value",
            sub_strand: null,
            display_order: 1,
            status: "taught",
            first_taught_date: "2026-01-15",
            times_taught: 3,
            times_assessed: 0,
            coverage_depth: "practised",
          },
          {
            id: "obj-2",
            objective_code: "Y3-M-NPV-02",
            objective_text:
              "Recognise the place value of each digit in a three-digit number",
            strand: "Number & Place Value",
            sub_strand: null,
            display_order: 2,
            status: "not_started",
            first_taught_date: null,
            times_taught: 0,
            times_assessed: 0,
            coverage_depth: null,
          },
        ],
      },
      {
        strand: "Addition & Subtraction",
        taught_count: 2,
        evidenced_count: 1,
        total: 3,
        objectives: [
          {
            id: "obj-3",
            objective_code: "Y3-M-AS-01",
            objective_text:
              "Add and subtract numbers mentally",
            strand: "Addition & Subtraction",
            sub_strand: null,
            display_order: 5,
            status: "evidenced",
            first_taught_date: "2025-10-01",
            times_taught: 8,
            times_assessed: 2,
            coverage_depth: "assessed",
          },
        ],
      },
    ],
  },
];

describe("CurriculumChecklist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", () => {
    global.fetch = vi.fn(
      () => new Promise(() => {}) // never resolves
    ) as unknown as typeof fetch;

    render(<CurriculumChecklist classId="cls-1" yearGroup="Year 3" />);
    expect(screen.getByText("Loading curriculum objectives...")).toBeTruthy();
  });

  it("renders subject groups and objectives after loading", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: {
              subjects: mockSubjects,
              yearGroup: "Year 3",
              totalObjectives: 13,
            },
          }),
      })
    ) as unknown as typeof fetch;

    render(<CurriculumChecklist classId="cls-1" yearGroup="Year 3" />);

    await waitFor(() => {
      expect(screen.getByText("Curriculum Objectives")).toBeTruthy();
    });

    // "Mathematics" appears as subject header text and filter pill
    expect(screen.getAllByText("Mathematics").length).toBeGreaterThanOrEqual(1);
    // total objectives shown on the subject card
    expect(screen.getByText("13 objectives")).toBeTruthy();
  });

  it("renders empty state when no objectives", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: {
              subjects: [],
              yearGroup: "Year 3",
              totalObjectives: 0,
            },
          }),
      })
    ) as unknown as typeof fetch;

    render(<CurriculumChecklist classId="cls-1" yearGroup="Year 3" />);

    await waitFor(() => {
      expect(
        screen.getByText("No curriculum objectives found for Year 3.")
      ).toBeTruthy();
    });
  });

  it("renders filter pills for subjects", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: {
              subjects: mockSubjects,
              yearGroup: "Year 3",
              totalObjectives: 13,
            },
          }),
      })
    ) as unknown as typeof fetch;

    render(<CurriculumChecklist classId="cls-1" yearGroup="Year 3" />);

    await waitFor(() => {
      expect(screen.getByText("All Subjects")).toBeTruthy();
    });

    expect(screen.getByText("English Reading")).toBeTruthy();
    expect(screen.getByText("English Writing")).toBeTruthy();
    expect(screen.getByText("Science")).toBeTruthy();
  });

  it("shows status legend", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: {
              subjects: mockSubjects,
              yearGroup: "Year 3",
              totalObjectives: 13,
            },
          }),
      })
    ) as unknown as typeof fetch;

    render(<CurriculumChecklist classId="cls-1" yearGroup="Year 3" />);

    await waitFor(() => {
      expect(screen.getByText("Not started")).toBeTruthy();
    });

    expect(screen.getByText("Introduced")).toBeTruthy();
    expect(screen.getByText("Taught")).toBeTruthy();
    expect(screen.getByText("Assessed")).toBeTruthy();
    expect(screen.getByText("Evidenced")).toBeTruthy();
  });

  it("clicking subject filter calls API with subject param", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: {
              subjects: mockSubjects,
              yearGroup: "Year 3",
              totalObjectives: 13,
            },
          }),
      })
    ) as unknown as typeof fetch;
    global.fetch = mockFetch;

    render(<CurriculumChecklist classId="cls-1" yearGroup="Year 3" />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Curriculum Objectives")).toBeTruthy();
    });

    // Click Science filter pill (the button text, not a subject header)
    const scienceButton = screen.getByRole("button", { name: "Science" });
    fireEvent.click(scienceButton);

    await waitFor(() => {
      const calls = (mockFetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);
      const lastCall = calls[calls.length - 1][0] as string;
      expect(lastCall).toContain("subject=Science");
    });
  });
});
