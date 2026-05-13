"use client";

import { acceptProposal, editProposal, isReviewComplete } from "@/lib/assessment-creator/marking";
import type { MarkingProposal } from "@/lib/assessment-creator/types";

interface MarkingReviewPanelProps {
  proposals: MarkingProposal[];
  onChange: (proposals: MarkingProposal[]) => void;
  onCreatePassport: () => void;
}

export function MarkingReviewPanel({ proposals, onChange, onCreatePassport }: MarkingReviewPanelProps) {
  const complete = isReviewComplete(proposals);
  const pendingCount = proposals.filter((proposal) => proposal.teacherDecision === "pending").length;

  function pupilLabel(pupilHash: string) {
    return pupilHash.replace("pupil-hash-", "Pupil ");
  }

  function questionLabel(questionId: string) {
    return questionId.replace("q", "Q");
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Review proposed marks</h2>
          <p className="mt-1 text-sm text-gray-600">AI proposes. Teachers approve. No mark is final until you confirm it.</p>
        </div>
        <button
          type="button"
          disabled={pendingCount === 0}
          onClick={() => onChange(proposals.map((proposal) => acceptProposal(proposal)))}
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Accept all proposed marks
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pupilLabel(proposal.pupilHash)} · {questionLabel(proposal.questionId)}
                </p>
                <p className="mt-1 text-sm text-gray-600">{proposal.rationale}</p>
                {proposal.misconceptionTag && <p className="mt-1 text-xs font-medium text-amber-700">Misconception: {proposal.misconceptionTag}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{proposal.teacherMarks ?? proposal.proposedMarks}/{proposal.maxMarks}</p>
                <p className="text-xs text-gray-500">Confidence {Math.round(proposal.confidence * 100)}%</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={proposal.teacherDecision === "accepted"}
                onClick={() => onChange(proposals.map((item) => (item.id === proposal.id ? acceptProposal(item) : item)))}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onChange(proposals.map((item) => (item.id === proposal.id ? editProposal(item, Math.min(item.maxMarks, item.proposedMarks + 1)) : item)))}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Edit up
              </button>
              <span
                className={
                  proposal.teacherDecision === "pending"
                    ? "rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
                    : "rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                }
              >
                {proposal.teacherDecision === "pending" ? "Needs teacher check" : "Teacher accepted"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={!complete}
        onClick={onCreatePassport}
        className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Create Evidence Passport
      </button>
    </section>
  );
}
