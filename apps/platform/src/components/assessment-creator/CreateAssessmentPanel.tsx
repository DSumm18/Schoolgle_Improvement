"use client";

import { useMemo, useState } from "react";
import { BookOpen, Calculator, ClipboardCheck, ExternalLink, FileQuestion, FileUp, FlaskConical, History, Layers3, PenLine, ScanLine, School, Sparkles, TimerReset } from "lucide-react";
import { buildCurriculumUploadSummary, createOakCurriculumSource } from "@/lib/assessment-creator/curriculum-source";
import type { AssessmentMode, AssessmentSubject, AssessmentTerm, AssessmentYearGroup, CurriculumSchemeRef } from "@/lib/assessment-creator/types";

export interface CreateAssessmentInput {
  classId: string;
  className: string;
  subject: AssessmentSubject;
  yearGroup: AssessmentYearGroup;
  term: AssessmentTerm;
  mode: AssessmentMode;
  curriculumScheme: CurriculumSchemeRef;
}

interface CreateAssessmentPanelProps {
  creating: boolean;
  onCreate: (input: CreateAssessmentInput) => void;
}

const CLASSES = [
  { id: "reception", label: "Reception", helper: "EYFS baseline and early learning checks", yearGroup: "EYFS" as const },
  { id: "y1-ash", label: "Year 1 Ash", helper: "Phonics, number and early writing", yearGroup: "Year 1" as const },
  { id: "y2-beech", label: "Year 2 Beech", helper: "KS1-style evidence and retention", yearGroup: "Year 2" as const },
  { id: "y3-cedar", label: "Year 3 Cedar", helper: "Lower KS2 transition checks", yearGroup: "Year 3" as const },
  { id: "y4-maple", label: "Year 4 Maple", helper: "MTC, fluency and wider curriculum", yearGroup: "Year 4" as const },
  { id: "y5-oak", label: "Year 5 Oak", helper: "Retention and upper KS2 readiness", yearGroup: "Year 5" as const },
  { id: "y6-elm", label: "Year 6 Elm", helper: "Secure evidence before SATs pressure", yearGroup: "Year 6" as const },
];

const SUBJECTS: Array<{ id: AssessmentSubject; label: string; helper: string; Icon: typeof Calculator }> = [
  { id: "maths", label: "Maths", helper: "Fluency, reasoning and retained number facts", Icon: Calculator },
  { id: "reading", label: "Reading", helper: "Retrieval, inference and evidence from text", Icon: BookOpen },
  { id: "writing", label: "Writing", helper: "Teacher judgement prompts and moderation evidence", Icon: PenLine },
  { id: "spag", label: "SPaG", helper: "Grammar, punctuation and spelling checks", Icon: FileQuestion },
  { id: "science", label: "Science", helper: "Knowledge recall and working scientifically", Icon: FlaskConical },
];

const TERMS: AssessmentTerm[] = ["Autumn 1", "Autumn 2", "Spring 1", "Spring 2", "Summer 1", "Summer 2"];

const MODES: Array<{ id: Exclude<AssessmentMode, "statutory_readiness">; label: string; helper: string; Icon: typeof TimerReset }> = [
  { id: "quick_check", label: "Quick Check", helper: "5-10 minutes to check today or this week", Icon: TimerReset },
  { id: "unit_check", label: "Unit Check", helper: "A fuller end-of-unit paper with coverage map", Icon: ClipboardCheck },
  { id: "retention_check", label: "Retention Check", helper: "Prior learning and likely forgotten knowledge", Icon: History },
];

const CURRICULUM_SCHEMES: CurriculumSchemeRef[] = [
  {
    id: "school-maths-map",
    name: "School maths curriculum map",
    provider: "School uploaded",
    source: "school_uploaded",
    status: "active",
    coverageNote: "The school’s own taught sequence, mapped against national curriculum expectations.",
  },
  {
    id: "schoolgle-sample-sequence",
    name: "Schoolgle sample curriculum sequence",
    provider: "Sample/test harness",
    source: "sample_pack",
    status: "sample",
    coverageNote: "For prototype testing only. Replace with the school’s own taught curriculum before live use.",
  },
  createOakCurriculumSource(),
  {
    id: "national-curriculum-baseline",
    name: "National Curriculum baseline",
    provider: "Public framework",
    source: "public_framework",
    status: "needs_mapping",
    coverageNote: "Fallback public objectives when a school scheme has not yet been uploaded.",
  },
];

export function CreateAssessmentPanel({ creating, onCreate }: CreateAssessmentPanelProps) {
  const [classId, setClassId] = useState("y5-oak");
  const [subject, setSubject] = useState<AssessmentSubject>("maths");
  const [term, setTerm] = useState<AssessmentTerm>("Spring 1");
  const [mode, setMode] = useState<AssessmentMode>("retention_check");
  const [curriculumSchemeId, setCurriculumSchemeId] = useState("school-maths-map");
  const [uploadedCurriculumFiles, setUploadedCurriculumFiles] = useState<string[]>([]);

  const selectedClass = useMemo(() => CLASSES.find((item) => item.id === classId) ?? CLASSES[5], [classId]);
  const selectedSubject = SUBJECTS.find((item) => item.id === subject) ?? SUBJECTS[0];
  const selectedMode = MODES.find((item) => item.id === mode);
  const selectedScheme = CURRICULUM_SCHEMES.find((scheme) => scheme.id === curriculumSchemeId) ?? CURRICULUM_SCHEMES[0];
  const uploadSummary = buildCurriculumUploadSummary(uploadedCurriculumFiles);
  const assessmentScheme =
    uploadedCurriculumFiles.length > 0
      ? {
          id: "uploaded-curriculum-pack",
          name: "Uploaded curriculum pack",
          provider: "Uploaded this session",
          source: "school_uploaded",
          status: "needs_mapping",
          coverageNote: `${uploadSummary.fileCount} file${uploadSummary.fileCount === 1 ? "" : "s"} ready to map into the school's taught curriculum sequence.`,
        } satisfies CurriculumSchemeRef
      : selectedScheme;

  const submitCurrentSetup = () =>
    onCreate({
      classId: selectedClass.id,
      className: selectedClass.label,
      subject,
      yearGroup: selectedClass.yearGroup,
      term,
      mode,
      curriculumScheme: assessmentScheme,
    });

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Teacher controlled</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Create assessment check</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Set up the check the way a teacher would: class first, then subject, term and purpose. Schoolgle creates the blueprint before any pupil sees a paper.
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          <div className="flex items-center gap-2 font-semibold">
            <ScanLine size={16} />
            Paper-first MVP
          </div>
          <p className="mt-1 text-xs">Print, scan, review proposed marks, then approve.</p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-950">Ready to demo</p>
            <p className="mt-1 text-sm text-emerald-900">
              Current setup: {selectedClass.label} - {selectedSubject.label} - {term} - {selectedMode?.label ?? "Retention Check"}.
            </p>
          </div>
          <button
            type="button"
            disabled={creating}
            onClick={submitCurrentSetup}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={16} />
            {creating ? "Creating blueprint..." : "Create demo assessment"}
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <GuideCard
          title="1. Pick the class and purpose"
          text="Start from the teacher's class. The year group follows automatically, but can be changed later when real class data is wired in."
        />
        <GuideCard
          title="2. Review the blueprint"
          text="You see coverage, retrieval mix, pressure and workload before Schoolgle creates the paper."
        />
        <GuideCard
          title="3. Teacher signs off"
          text="AI can propose questions and marks. Teachers approve the paper and confirm every final mark."
        />
      </div>

      <div className="space-y-6">
        <SetupGroup
          title="Class"
          description="Choose the class who will sit this assessment."
          items={CLASSES}
          selectedId={classId}
          onSelect={(id) => setClassId(id)}
          renderIcon={() => <School size={18} />}
        />

        <SetupGroup
          title="Subject"
          description="Select the area you want evidence for."
          items={SUBJECTS.map(({ id, label, helper, Icon }) => ({ id, label, helper, Icon }))}
          selectedId={subject}
          onSelect={(id) => setSubject(id as AssessmentSubject)}
          renderIcon={(item) => {
            const Icon = "Icon" in item ? item.Icon : Sparkles;
            return <Icon size={18} />;
          }}
        />

        <SetupGroup
          title="Curriculum source"
          description="Choose the scheme/map this assessment should be based on. In production this comes from the school’s uploaded curriculum setup."
          items={CURRICULUM_SCHEMES.map((scheme) => ({
            id: scheme.id,
            label: scheme.name,
            helper: `${scheme.provider} · ${scheme.coverageNote}`,
          }))}
          selectedId={curriculumSchemeId}
          onSelect={setCurriculumSchemeId}
          renderIcon={() => <Layers3 size={18} />}
        />

        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-950">
                <FileUp size={17} />
                Upload curriculum pack
              </div>
              <p className="mt-1 max-w-3xl text-sm text-blue-900">
                Drop in the Oak public curriculum download, your own school map, or exported medium-term plans. We store the source privately, then map it into a neutral school curriculum sequence.
              </p>
              <p className="mt-2 text-xs text-blue-800">
                Accepted: CSV, XLSX, XLS, PDF, DOCX, JSON. Do not upload commercial scheme files unless the school has permission to use them this way.
              </p>
            </div>
            <a
              href="https://www.thenational.academy/teachers/curriculum/maths-primary/downloads"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-card px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
            >
              Oak maths downloads
              <ExternalLink size={14} />
            </a>
          </div>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-card px-4 py-6 text-center transition hover:border-primary hover:bg-blue-50">
            <FileUp className="text-blue-700" size={24} />
            <span className="mt-2 text-sm font-semibold text-blue-950">Choose curriculum files</span>
            <span className="mt-1 text-xs text-blue-800">For now this prepares the upload pack for mapping; storage/parsing comes next.</span>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.pdf,.docx,.json"
              className="sr-only"
              onChange={(event) => {
                const fileNames = Array.from(event.target.files ?? []).map((file) => file.name);
                setUploadedCurriculumFiles(fileNames);
                if (fileNames.length > 0) {
                  setCurriculumSchemeId("oak-public-curriculum-sample");
                }
              }}
            />
          </label>
          {uploadedCurriculumFiles.length > 0 && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
              <p className="font-semibold">
                {uploadSummary.fileCount} curriculum file{uploadSummary.fileCount === 1 ? "" : "s"} selected
                {uploadSummary.acceptedTypes.length > 0 ? ` (${uploadSummary.acceptedTypes.join(", ")})` : ""}
              </p>
              <p className="mt-1 text-xs text-emerald-900">{uploadSummary.nextStep}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadedCurriculumFiles.slice(0, 6).map((fileName) => (
                  <span key={fileName} className="rounded-full bg-card px-2 py-1 text-xs text-emerald-900">
                    {fileName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">Term</h3>
            <p className="text-sm text-muted-foreground">Use half terms so the assessment lines up with what has actually been taught.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {TERMS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTerm(item)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${term === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <SetupGroup
          title="Assessment mode"
          description="Choose the level of pressure. Statutory readiness is deliberately held back until the low-stakes workflow is trusted."
          items={MODES.map(({ id, label, helper, Icon }) => ({ id, label, helper, Icon }))}
          selectedId={mode}
          onSelect={(id) => setMode(id as AssessmentMode)}
          renderIcon={(item) => {
            const Icon = "Icon" in item ? item.Icon : Sparkles;
            return <Icon size={18} />;
          }}
        />
      </div>

      <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h3 className="text-sm font-semibold text-blue-950">Current setup</h3>
        <p className="mt-1 text-sm text-blue-900">
          {selectedClass.label} - {selectedSubject.label} - {term} - {selectedMode?.label ?? "Retention Check"}. This will create a teacher-reviewable blueprint, not a final paper.
        </p>
        <p className="mt-2 text-xs text-blue-800">
          Curriculum source: {assessmentScheme.name}. {assessmentScheme.status === "sample" ? "Sample only; replace with the school’s own taught curriculum before live use." : assessmentScheme.coverageNote}
        </p>
      </div>

      <button
        type="button"
        disabled={creating}
        onClick={submitCurrentSetup}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles size={16} />
        {creating ? "Creating blueprint..." : "Create blueprint"}
      </button>
    </section>
  );
}

function GuideCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function SetupGroup<T extends { id: string; label: string; helper: string }>({
  title,
  description,
  items,
  selectedId,
  onSelect,
  renderIcon,
}: {
  title: string;
  description: string;
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  renderIcon: (item: T) => React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${selected ? "border-primary bg-blue-50 shadow-sm" : "border-border bg-card hover:bg-muted"}`}
            >
              <span className={`mt-0.5 rounded-md p-2 ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {renderIcon(item)}
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{item.helper}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
