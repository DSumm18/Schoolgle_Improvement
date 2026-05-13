import { describe, expect, it } from "vitest";
import { acceptProposal, editProposal, isReviewComplete } from "../marking";
import type { MarkingProposal } from "../types";

const proposal: MarkingProposal = {
  id: "proposal-1",
  questionId: "question-1",
  pupilHash: "hash-1",
  proposedMarks: 1,
  maxMarks: 2,
  confidence: 0.72,
  rationale: "Answer includes the correct method but incomplete final answer.",
  misconceptionTag: "fractions_equivalence_confuses_numerator_denominator",
  teacherDecision: "pending",
  teacherMarks: null,
};

describe("marking review", () => {
  it("accepts a proposal without changing marks", () => {
    expect(acceptProposal(proposal).teacherMarks).toBe(1);
    expect(acceptProposal(proposal).teacherDecision).toBe("accepted");
  });

  it("edits a proposal with teacher marks", () => {
    const edited = editProposal(proposal, 2);
    expect(edited.teacherMarks).toBe(2);
    expect(edited.teacherDecision).toBe("edited");
  });

  it("requires every proposal to be approved or edited", () => {
    expect(isReviewComplete([proposal])).toBe(false);
    expect(isReviewComplete([acceptProposal(proposal)])).toBe(true);
  });
});
