"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ClipboardCheck, FileText, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { BlueprintReview } from "./BlueprintReview";
import { CreateAssessmentPanel } from "./CreateAssessmentPanel";
import { CurriculumSourcePanel } from "./CurriculumSourcePanel";
import { EvidencePassportPanel } from "./EvidencePassportPanel";
import { MarkingReviewPanel } from "./MarkingReviewPanel";
import { ManualSnapshotPanel } from "./ManualSnapshotPanel";
import { PaperPackPreview } from "./PaperPackPreview";
import { ScanUploadPanel } from "./ScanUploadPanel";
import type { AssessmentBlueprint, AssessmentPupilPass, EvidencePassport, MarkingProposal, PaperQuestion, ScanPageMatch } from "@/lib/assessment-creator/types";
import type { CreateAssessmentInput } from "./CreateAssessmentPanel";
import { useAuth } from "@/context/SupabaseAuthContext";

type Step = "create" | "blueprint" | "paper" | "scan" | "marking" | "passport";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "create", label: "Create" },
  { id: "blueprint", label: "Blueprint" },
  { id: "paper", label: "Paper pack" },
  { id: "scan", label: "Scans" },
  { id: "marking", label: "Review" },
  { id: "passport", label: "Passport" },
];

const DEMO_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000001";

export function AssessmentCreatorShell() {
  const { organizationId, session } = useAuth();
  const [step, setStep] = useState<Step>("create");
  const [blueprint, setBlueprint] = useState<AssessmentBlueprint | null>(null);
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);
  const [papers, setPapers] = useState<AssessmentPupilPass[]>([]);
  const [matches, setMatches] = useState<ScanPageMatch[]>([]);
  const [proposals, setProposals] = useState<MarkingProposal[]>([]);
  const [passport, setPassport] = useState<EvidencePassport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canOpenStep(targetStep: Step) {
    switch (targetStep) {
      case "create":
        return true;
      case "blueprint":
        return Boolean(blueprint);
      case "paper":
        return questions.length > 0 && papers.length > 0;
      case "scan":
        return papers.length > 0;
      case "marking":
        return proposals.length > 0;
      case "passport":
        return Boolean(passport);
    }
  }

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? "Request failed");
    }
    return response.json() as Promise<T>;
  }

  async function createBlueprint(input: CreateAssessmentInput) {
    setBusy(true);
    setError(null);
    try {
      const nextBlueprint = await postJson<AssessmentBlueprint>("/api/assessment-creator/blueprints", {
        organizationId: organizationId ?? DEMO_ORGANIZATION_ID,
        schoolId: "school-demo",
        ...input,
        taughtObjectives: [
          {
            id: `${input.subject}-${input.yearGroup}-core`,
            label: input.subject === "maths" ? "Compare, explain and apply key number concepts" : `Secure ${input.subject} knowledge from recent teaching`,
            strand: input.subject === "maths" ? "Number and reasoning" : "Core knowledge",
            yearGroup: input.yearGroup,
          },
        ],
      });
      setBlueprint(nextBlueprint);
      setError(null);
      setStep("blueprint");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create blueprint");
    } finally {
      setBusy(false);
    }
  }

  async function approveBlueprint() {
    if (!blueprint) return;
    setBusy(true);
    setError(null);
    try {
      const pack = await postJson<{
        questions: PaperQuestion[];
        papers: AssessmentPupilPass[];
      }>("/api/assessment-creator/paper-pack", { assessmentId: blueprint.id });
      setQuestions(pack.questions);
      setPapers(pack.papers);
      setError(null);
      setStep("paper");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create paper pack");
    } finally {
      setBusy(false);
    }
  }

  async function uploadScan(fileName: string) {
    if (!blueprint) return;
    setBusy(true);
    setError(null);
    try {
      const scan = await postJson<{ matches: ScanPageMatch[] }>("/api/assessment-creator/scan-batches", { assessmentId: blueprint.id, fileName });
      setMatches(scan.matches);
      const marking = await postJson<{ proposals: MarkingProposal[] }>("/api/assessment-creator/marking-proposals", { assessmentId: blueprint.id });
      setProposals(marking.proposals);
      setError(null);
      setStep("marking");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not process scan");
    } finally {
      setBusy(false);
    }
  }

  async function createPassport() {
    if (!blueprint) return;
    setBusy(true);
    setError(null);
    try {
      const nextPassport = await postJson<EvidencePassport>("/api/assessment-creator/evidence-passports", {
        assessmentId: blueprint.id,
        organizationId: blueprint.organizationId || organizationId || DEMO_ORGANIZATION_ID,
        schoolId: blueprint.schoolId,
        classId: blueprint.classId,
        subject: blueprint.subject,
        yearGroup: blueprint.yearGroup,
        proposals,
      });
      setPassport(nextPassport);
      setError(null);
      setStep("passport");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create Evidence Passport");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Sparkles size={16} />
                School Improvement
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Assessment Intelligence</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600">
                Capture teacher-approved assessment evidence and feed Trust Assessor, Ofsted Readiness and school improvement reporting.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck size={16} />
                Teacher approval required
              </div>
              <p className="mt-1 text-xs">No AI mark or judgement is final without review.</p>
            </div>
          </div>
        </header>

        <nav className="grid gap-2 md:grid-cols-6">
          {STEPS.map((item, index) => {
            const activeIndex = STEPS.findIndex((candidate) => candidate.id === step);
            const active = item.id === step;
            const complete = index < activeIndex;
            const available = canOpenStep(item.id);
            return (
              <motion.button
                key={item.id}
                type="button"
                layout
                initial={false}
                animate={{ y: active ? -2 : 0, scale: active ? 1.01 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                disabled={!available}
                onClick={() => {
                  if (available) {
                    setError(null);
                    setStep(item.id);
                  }
                }}
                className={`relative overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition ${active ? "border-blue-300 bg-blue-50 text-blue-950" : complete ? "border-emerald-200 bg-emerald-50 text-emerald-900" : available ? "border-border bg-card text-muted-foreground hover:bg-muted/50" : "border-border bg-muted/40 text-muted-foreground/50"}`}
                aria-current={active ? "step" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="assessment-step-highlight"
                    className="absolute inset-x-0 bottom-0 h-1 bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="flex items-center gap-2">
                  {complete ? <CheckCircle2 size={15} /> : stepIcon(item.id)}
                  <span className="font-medium">{item.label}</span>
                </div>
              </motion.button>
            );
          })}
        </nav>

        <JourneyStrip activeStep={step} />
        <StepInstructionCard step={step} />

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {step === "create" && <CreateAssessmentPanel creating={busy} onCreate={createBlueprint} />}
            {step === "blueprint" && blueprint && <BlueprintReview blueprint={blueprint} onChange={setBlueprint} onBack={() => { setError(null); setStep("create"); }} onApprove={approveBlueprint} />}
            {step === "paper" && blueprint && <PaperPackPreview blueprint={blueprint} questions={questions} papers={papers} onContinue={() => setStep("scan")} />}
            {step === "scan" && <ScanUploadPanel uploading={busy} matches={matches} onUpload={uploadScan} />}
            {step === "marking" && <MarkingReviewPanel proposals={proposals} onChange={setProposals} onCreatePassport={createPassport} />}
            {step === "passport" && passport && <EvidencePassportPanel passport={passport} />}
          </motion.div>
        </AnimatePresence>

        {step === "create" && <SetupEvidencePanels />}
      </div>
    </div>
  );
}

function StepInstructionCard({ step }: { step: Step }) {
  const copy = getStepInstruction(step);

  return (
    <section className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Current step</p>
          <h2 className="mt-1 text-base font-semibold">{copy.title}</h2>
          <p className="mt-1 max-w-4xl text-blue-900">{copy.body}</p>
        </div>
        <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-blue-800">{copy.action}</span>
      </div>
    </section>
  );
}

function SetupEvidencePanels() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <details className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Curriculum sources and research basis
        </summary>
        <div className="mt-4">
          <CurriculumSourcePanel />
        </div>
      </details>

      <details className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Optional: record or review teacher assessment snapshots
        </summary>
        <div className="mt-4">
          <ManualSnapshotPanel />
        </div>
      </details>
    </section>
  );
}

function getStepInstruction(step: Step) {
  switch (step) {
    case "create":
      return {
        title: "Choose class, subject, curriculum source and purpose.",
        body: "Start here. Nothing generates until you press Create blueprint. Curriculum evidence and manual snapshots are available below as optional context, not blocking clutter.",
        action: "Create blueprint next",
      };
    case "blueprint":
      return {
        title: "Review what the assessment will cover before pupils see it.",
        body: "This is the teacher approval point. Tune the weighting, pressure, workload and objectives, then approve to generate the paper pack and question preview.",
        action: "Approve to generate questions",
      };
    case "paper":
      return {
        title: "Questions and pupil paper pack are here.",
        body: "This is the assessment document preview. It shows the generated questions and the pupil pass routing. PDF and online versions should be generated from this same data model.",
        action: "Print or continue to scans",
      };
    case "scan":
      return {
        title: "Upload completed papers and match them to pupil passes.",
        body: "The scan stage should connect each returned page to the right assessment, pupil and page number before any marking proposal is trusted.",
        action: "Upload scans",
      };
    case "marking":
      return {
        title: "Teacher reviews proposed marks and misconceptions.",
        body: "AI can suggest marks and feedback, but the teacher confirms or edits every judgement before it becomes evidence.",
        action: "Approve evidence",
      };
    case "passport":
      return {
        title: "Evidence Passport is the approved output.",
        body: "This is the source-labelled record that can feed Trust Assessor, Ofsted Readiness and pupil/class intelligence.",
        action: "Evidence ready",
      };
  }
}

function JourneyStrip({ activeStep }: { activeStep: Step }) {
  const activeIndex = STEPS.findIndex((step) => step.id === activeStep);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${complete ? "border-emerald-300 bg-emerald-50 text-emerald-700" : active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"}`}>
                {complete ? <CheckCircle2 size={17} /> : stepIcon(step.id)}
                {active && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.35], opacity: [0.4, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </div>
              <span className={`hidden truncate text-xs font-semibold md:block ${active ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
              {index < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded-full ${complete ? "bg-emerald-300" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Follow the journey left to right: set up the check, approve the blueprint, print the paper pack, upload scans, review proposed marks, then create the Evidence Passport.
      </p>
    </div>
  );
}

function stepIcon(step: Step) {
  switch (step) {
    case "create":
      return <ClipboardCheck size={15} />;
    case "blueprint":
      return <Sparkles size={15} />;
    case "paper":
      return <FileText size={15} />;
    case "scan":
      return <ScanLine size={15} />;
    case "marking":
    case "passport":
      return <ShieldCheck size={15} />;
  }
}
