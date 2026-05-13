import type { MarkingProposal } from "./types";

export function acceptProposal(proposal: MarkingProposal): MarkingProposal {
  return {
    ...proposal,
    teacherDecision: "accepted",
    teacherMarks: proposal.proposedMarks,
  };
}

export function editProposal(proposal: MarkingProposal, teacherMarks: number): MarkingProposal {
  return {
    ...proposal,
    teacherDecision: "edited",
    teacherMarks: Math.max(0, Math.min(proposal.maxMarks, teacherMarks)),
  };
}

export function isReviewComplete(proposals: MarkingProposal[]): boolean {
  return proposals.length > 0 && proposals.every((proposal) => proposal.teacherDecision === "accepted" || proposal.teacherDecision === "edited");
}
