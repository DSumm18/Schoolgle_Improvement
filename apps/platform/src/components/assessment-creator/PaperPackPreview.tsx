"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { ExternalLink, Printer, QrCode } from "lucide-react";
import type { AssessmentBlueprint, AssessmentPupilPass, PaperQuestion } from "@/lib/assessment-creator/types";

interface PaperPackPreviewProps {
  blueprint: AssessmentBlueprint;
  questions: PaperQuestion[];
  papers: AssessmentPupilPass[];
  onContinue: () => void;
}

export function PaperPackPreview({ blueprint, questions, papers, onContinue }: PaperPackPreviewProps) {
  const totalMarks = useMemo(() => questions.reduce((sum, question) => sum + question.marks, 0), [questions]);

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm print:border-0 print:p-0 print:shadow-none">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          header,
          nav,
          aside,
          .no-print,
          [data-print-hidden="true"] {
            display: none !important;
          }

          .schoolgle-print-pack {
            display: block !important;
          }

          .schoolgle-print-page {
            break-after: page;
            page-break-after: always;
            min-height: 275mm;
          }

          .schoolgle-print-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>

      <h2 className="text-xl font-semibold text-foreground">Assessment document preview</h2>
      <p className="mt-1 text-sm text-gray-600">
        This is the live pack generated from the teacher-approved blueprint. Each pupil has an individual printable paper with a scan QR at the top.
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <SummaryTile label="Class" value={blueprint.classId.replaceAll("-", " ")} />
        <SummaryTile label="Assessment" value={`${blueprint.subject.toUpperCase()} · ${blueprint.term}`} />
        <SummaryTile label="Pack" value={`${papers.length} pupil papers · ${questions.length} questions · ${totalMarks} marks`} />
      </div>

      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <span className="font-semibold">Source label:</span> Generated from the approved Assessment Creator blueprint using the selected curriculum source:{" "}
        <span className="font-semibold">{blueprint.curriculumScheme.name}</span>. Teacher approval is required before issue; AI suggestions are not final judgements.
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-950">Questions to issue</h3>
            <p className="mt-1 text-xs text-blue-900">
              Teacher-approved questions, mark allocation and misconception tags. These are repeated on every pupil paper in the printable pack below.
            </p>
          </div>
          {questions.map((question) => (
            <div key={question.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-semibold text-foreground">Q{question.number}. {question.prompt}</p>
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{question.marks} mark{question.marks === 1 ? "" : "s"}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">Misconception: {question.misconceptionTags.join(", ")}</p>
            </div>
          ))}
        </div>

        <aside className="rounded-lg border border-dashed border-border p-4 no-print">
          <h3 className="text-sm font-semibold text-foreground">Class Builder Pupil Passes</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            These are stable pupil passes. The printed paper QR below contains the assessment, pupil and page marker for scan matching.
          </p>
          <div className="mt-3 space-y-2">
            {papers.map((paper) => (
              <div key={paper.pupilHash} className="rounded-md bg-muted p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-blue-700">
                    <QrCode size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{paper.displayLabel}</p>
                    <p className="text-xs font-semibold text-blue-800">{paper.passCodename}</p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">{paper.passRoute}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
            Online mode uses the pupil pass route; paper mode uses the scan marker at the top of each printed page.
          </div>
        </aside>
      </div>

      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 no-print">
        <h3 className="text-base font-semibold text-emerald-950">Printable pupil assessment pack</h3>
        <p className="mt-1 text-sm text-emerald-900">
          Scroll below to check the generated papers. Press print to issue one page per pupil with the QR scan marker at the top.
        </p>
      </div>

      <div className="schoolgle-print-pack mt-4 space-y-4">
        {papers.map((paper, index) => (
          <PupilPaper
            key={paper.pupilHash}
            blueprint={blueprint}
            paper={paper}
            questions={questions}
            paperNumber={index + 1}
            paperCount={papers.length}
            totalMarks={totalMarks}
          />
        ))}
      </div>

      <div className="no-print mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
          <Printer size={16} />
          Print pupil papers
        </button>
        <button type="button" disabled className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground" title="This preview is now printable; server-side PDF export is still the next delivery step.">
          Download PDF export coming next
        </button>
        <button type="button" onClick={onContinue} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Continue to scan upload
        </button>
      </div>
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize text-foreground">{value}</p>
    </div>
  );
}

function PupilPaper({
  blueprint,
  paper,
  questions,
  paperNumber,
  paperCount,
  totalMarks,
}: {
  blueprint: AssessmentBlueprint;
  paper: AssessmentPupilPass;
  questions: PaperQuestion[];
  paperNumber: number;
  paperCount: number;
  totalMarks: number;
}) {
  const scanPayload = paper.pages[0]?.qrPayload ?? paper.passRoute;

  return (
    <article className="schoolgle-print-page rounded-xl border border-border bg-white p-6 text-slate-950 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Schoolgle Assessment Intelligence</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-950">{blueprint.subject.toUpperCase()} Assessment</h3>
          <p className="mt-1 text-sm text-slate-600">
            {blueprint.yearGroup} · {blueprint.term} · {blueprint.mode.replaceAll("_", " ")} · {blueprint.durationMinutes} minutes
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Pupil: {paper.displayLabel} <span className="font-normal text-slate-500">({paper.passCodename})</span>
          </p>
        </div>
        <div className="w-32 text-center">
          <QrImage value={scanPayload} label={`Scan QR for ${paper.displayLabel}`} />
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Scan to match</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-xs md:grid-cols-3">
        <PrintMeta label="Curriculum source" value={blueprint.curriculumScheme.name} />
        <PrintMeta label="Paper" value={`${paperNumber} of ${paperCount}`} />
        <PrintMeta label="Total marks" value={`${totalMarks}`} />
      </div>

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-950">
        Teacher-approved paper generated from the assessment blueprint. AI can suggest content, but the teacher remains responsible for approving the assessment before it is issued.
      </div>

      <div className="mt-6 space-y-5">
        {questions.map((question) => (
          <div key={`${paper.pupilHash}-${question.id}`} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold text-slate-950">
                Q{question.number}. {question.prompt}
              </p>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {question.marks} mark{question.marks === 1 ? "" : "s"}
              </span>
            </div>
            <AnswerSpace question={question} />
            <p className="mt-2 text-[10px] text-slate-400">
              Marker note: objective {question.objectiveId}; common misconception tag {question.misconceptionTags.join(", ")}.
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-3 text-[10px] text-slate-500">
        <span>{scanPayload}</span>
        <span className="inline-flex items-center gap-1">
          Online route <ExternalLink size={10} /> {paper.passRoute}
        </span>
      </div>
    </article>
  );
}

function PrintMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-2">
      <p className="font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AnswerSpace({ question }: { question: PaperQuestion }) {
  if (question.answerType === "multiple_choice") {
    const choices = question.choices?.length
      ? question.choices
      : ["A", "B", "C", "D"].map((label) => ({ label, text: "Teacher-approved option" }));

    return (
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
        {choices.map((choice) => (
          <div key={choice.label} className="rounded-md border border-slate-200 p-3">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 font-semibold">{choice.label}</span>
            {choice.text}
          </div>
        ))}
      </div>
    );
  }

  const lineCount = question.answerType === "extended_response" ? 8 : question.answerType === "working_out" ? 6 : 4;

  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: lineCount }).map((_, index) => (
        <div key={index} className="h-6 border-b border-slate-300" />
      ))}
    </div>
  );
}

function QrImage({ value, label }: { value: string; label: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 128,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    }).then((dataUrl) => {
      if (!cancelled) setSrc(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!src) {
    return (
      <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
        <QrCode size={28} aria-label={label} />
      </div>
    );
  }

  return <img src={src} alt={label} className="mx-auto h-28 w-28 rounded-lg border border-slate-200 bg-white p-1" />;
}
