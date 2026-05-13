"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Eye, FileDown, LockKeyhole, Mic, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import type { AssessmentSubject } from "@/lib/assessment-intelligence/types";

type SnapshotRow = {
  id: string;
  pupilHash?: string;
  source?: string;
  pupilLabel: string;
  yearGroupAtAssessment: string;
  rawLevel: string;
  teacherComment: string;
  voiceTranscript: string;
  uncertaintyFlag: boolean;
};

type AssessmentClassPupil = {
  id: string;
  pupilHash: string;
  displayLabel: string;
  yearGroup: string;
  source: string;
  attainment?: Partial<Record<AssessmentSubject, string | null>>;
};

type AssessmentClassSource = {
  id: string;
  className: string;
  yearGroup: string;
  academicYear: string;
  schoolUrn: number | null;
  schoolName: string | null;
  pupils: AssessmentClassPupil[];
};

type AssessmentSubmissionEvent = {
  pupilHash: string;
  yearGroupAtAssessment: string | null;
  subject: string | null;
  rawLevel: string | null;
  canonicalLevel: string | null;
  isAtExpected: boolean | null;
  isGreaterDepth: boolean | null;
  teacherComment: string | null;
  uncertaintyFlag: boolean | null;
  moderationStatus: string | null;
};

type AssessmentSubmission = {
  id: string;
  sourceKind: string;
  sourceLabel: string;
  validationTier: string;
  assessmentPeriod: string;
  academicYearStart: number;
  assessmentDate: string | null;
  lockedAt: string | null;
  classId: string | null;
  className: string | null;
  subject: string | null;
  eventCount: number;
  pupilCount: number;
  atExpectedPct: number | null;
  greaterDepthPct: number | null;
  needsModerationCount: number;
  events: AssessmentSubmissionEvent[];
};

const SUBJECTS: Array<{ id: AssessmentSubject; label: string }> = [
  { id: "reading", label: "Reading" },
  { id: "writing", label: "Writing" },
  { id: "maths", label: "Maths" },
  { id: "science", label: "Science" },
  { id: "spag", label: "SPaG" },
];

const LEVELS = [
  { id: "below", label: "Below" },
  { id: "WTS", label: "Working towards" },
  { id: "EXS", label: "Expected" },
  { id: "GDS", label: "Greater depth" },
];

const YEAR_GROUPS = ["Reception", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];

const SCHEDULED_PERIODS = ["Autumn 1", "Autumn 2", "Spring 1", "Spring 2", "Summer 1", "Summer 2"];
const ADDITIONAL_PERIOD = "__additional__";

function newRow(index: number): SnapshotRow {
  return {
    id: crypto.randomUUID(),
    pupilLabel: `Pupil ${index}`,
    yearGroupAtAssessment: "Year 6",
    rawLevel: "EXS",
    teacherComment: "",
    voiceTranscript: "",
    uncertaintyFlag: false,
  };
}

export function ManualSnapshotPanel() {
  const { organization, organizationId, session } = useAuth();
  const [schoolUrn, setSchoolUrn] = useState(organization?.urn || "");
  const [schoolName, setSchoolName] = useState(organization?.organization_type === "school" ? organization.name : "");
  const [classes, setClasses] = useState<AssessmentClassSource[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [className, setClassName] = useState("Year 6");
  const [subject, setSubject] = useState<AssessmentSubject>("writing");
  const [assessmentPeriod, setAssessmentPeriod] = useState("Autumn 1");
  const [customAssessmentPeriod, setCustomAssessmentPeriod] = useState("");
  const [academicYearStart, setAcademicYearStart] = useState(2025);
  const [assessmentDate, setAssessmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<SnapshotRow[]>(() => [newRow(1), newRow(2), newRow(3)]);
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveAssessmentPeriod = assessmentPeriod === ADDITIONAL_PERIOD
    ? customAssessmentPeriod.trim() || "Additional assessment"
    : assessmentPeriod;

  const sourcePreview = useMemo(
    () => `Source: manual teacher judgement, ${effectiveAssessmentPeriod} ${academicYearStart}/${String(academicYearStart + 1).slice(2)}, teacher locked`,
    [academicYearStart, effectiveAssessmentPeriod],
  );

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [selectedSubmissionId, submissions],
  );

  const pupilLabelsByHash = useMemo(() => {
    const labels = new Map<string, string>();
    for (const row of rows) {
      if (row.pupilHash) labels.set(row.pupilHash, row.pupilLabel);
    }
    for (const item of classes.flatMap((source) => source.pupils)) {
      labels.set(item.pupilHash, item.displayLabel);
    }
    return labels;
  }, [classes, rows]);

  useEffect(() => {
    if (!session?.access_token || !organizationId) return;
    let cancelled = false;
    const activeOrganizationId = organizationId;
    const accessToken = session.access_token;

    async function loadClasses() {
      setLoadingClasses(true);
      try {
        const response = await fetch(`/api/assessment-intelligence/classes?organizationId=${encodeURIComponent(activeOrganizationId)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not load imported classes and pupils.");
        if (cancelled) return;

        const nextClasses = (payload.classes || []) as AssessmentClassSource[];
        setClasses(nextClasses);
        if (payload.schoolUrn) setSchoolUrn(String(payload.schoolUrn));
        if (payload.schoolName) setSchoolName(payload.schoolName);
        const firstClassWithPupils = nextClasses.find((item) => item.pupils.length > 0) || nextClasses[0];
        if (firstClassWithPupils) {
          setSelectedClassId(firstClassWithPupils.id);
          applyClass(firstClassWithPupils, subject);
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load imported classes and pupils.");
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    }

    loadClasses();
    return () => {
      cancelled = true;
    };
  }, [organizationId, session?.access_token]);

  useEffect(() => {
    if (!session?.access_token || !organizationId) return;
    let cancelled = false;
    const activeOrganizationId = organizationId;
    const accessToken = session.access_token;

    async function loadSubmissions() {
      setLoadingSubmissions(true);
      try {
        const params = new URLSearchParams({
          academicYearStart: String(academicYearStart),
          organizationId: activeOrganizationId,
          subject,
        });
        if (selectedClassId) params.set("classId", selectedClassId);
        const response = await fetch(`/api/assessment-intelligence/submissions?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not load previous submissions.");
        if (cancelled) return;
        const nextSubmissions = (payload.submissions || []) as AssessmentSubmission[];
        setSubmissions(nextSubmissions);
        setSelectedSubmissionId((current) => current && nextSubmissions.some((item) => item.id === current) ? current : nextSubmissions[0]?.id ?? null);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load previous submissions.");
      } finally {
        if (!cancelled) setLoadingSubmissions(false);
      }
    }

    loadSubmissions();
    return () => {
      cancelled = true;
    };
  }, [academicYearStart, organizationId, selectedClassId, session?.access_token, subject]);

  function updateRow(id: string, patch: Partial<SnapshotRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function applyClass(nextClass: AssessmentClassSource, nextSubject: AssessmentSubject) {
    setClassName(nextClass.className);
    if (nextClass.schoolUrn) setSchoolUrn(String(nextClass.schoolUrn));
    if (nextClass.schoolName) setSchoolName(nextClass.schoolName);
    if (nextClass.pupils.length === 0) {
      setRows([newRow(1), newRow(2), newRow(3)].map((row) => ({ ...row, yearGroupAtAssessment: nextClass.yearGroup })));
      return;
    }
    setRows(
      nextClass.pupils.map((pupil) => ({
        id: pupil.id,
        pupilHash: pupil.pupilHash,
        source: pupil.source,
        pupilLabel: pupil.displayLabel,
        yearGroupAtAssessment: pupil.yearGroup || nextClass.yearGroup,
        rawLevel: pupil.attainment?.[nextSubject] || "EXS",
        teacherComment: "",
        voiceTranscript: "",
        uncertaintyFlag: false,
      })),
    );
  }

  function selectClass(classId: string) {
    setSelectedClassId(classId);
    const nextClass = classes.find((item) => item.id === classId);
    if (nextClass) applyClass(nextClass, subject);
  }

  function selectSubject(nextSubject: AssessmentSubject) {
    setSubject(nextSubject);
    const selectedClass = classes.find((item) => item.id === selectedClassId);
    if (selectedClass?.pupils.length) {
      setRows((current) =>
        current.map((row) => {
          const pupil = selectedClass.pupils.find((item) => item.id === row.id);
          return pupil ? { ...row, rawLevel: pupil.attainment?.[nextSubject] || row.rawLevel } : row;
        }),
      );
    }
  }

  async function saveSnapshot() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (!organizationId) throw new Error("No organisation context is loaded.");
      if (!schoolUrn.trim()) throw new Error("School URN is required so the data joins to DfE and School Improvement reporting.");
      if (rows.some((row) => !row.pupilLabel.trim())) throw new Error("Each row needs a pupil label before hashing.");

      const hashedRows = await Promise.all(
        rows.map(async (row) => ({
          pupilHash: row.pupilHash || await hashPupilLabel({
            organizationId,
            schoolUrn: schoolUrn.trim(),
            className,
            pupilLabel: row.pupilLabel,
          }),
          yearGroupAtAssessment: row.yearGroupAtAssessment,
          rawLevel: row.rawLevel,
          teacherComment: row.teacherComment.trim() || undefined,
          voiceTranscript: row.voiceTranscript.trim() || undefined,
          uncertaintyFlag: row.uncertaintyFlag,
        })),
      );

      const response = await fetch("/api/assessment-intelligence/manual-snapshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          organizationId,
          schoolUrn: schoolUrn.trim(),
          schoolName: schoolName.trim() || null,
          classId: selectedClassId || slugify(className),
          className,
          subject,
          assessmentPeriod: effectiveAssessmentPeriod,
          academicYearStart,
          assessmentDate,
          rows: hashedRows,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not save the assessment snapshot.");
      setMessage(`${payload.eventCount ?? rows.length} pupil judgement${rows.length === 1 ? "" : "s"} locked into the Assessment Intelligence spine.`);
      setSubmissions((current) => [
        {
          id: payload.batch?.id || crypto.randomUUID(),
          sourceKind: "manual_snapshot",
          sourceLabel: payload.sourceLabel || sourcePreview,
          validationTier: "teacher_locked",
          assessmentPeriod: effectiveAssessmentPeriod,
          academicYearStart,
          assessmentDate,
          lockedAt: new Date().toISOString(),
          classId: selectedClassId || slugify(className),
          className,
          subject,
          eventCount: payload.eventCount ?? rows.length,
          pupilCount: rows.length,
          atExpectedPct: null,
          greaterDepthPct: null,
          needsModerationCount: rows.filter((row) => row.uncertaintyFlag).length,
          events: hashedRows.map((row, index) => ({
            pupilHash: row.pupilHash,
            yearGroupAtAssessment: row.yearGroupAtAssessment,
            subject,
            rawLevel: row.rawLevel,
            canonicalLevel: null,
            isAtExpected: ["EXS", "GDS"].includes(row.rawLevel),
            isGreaterDepth: row.rawLevel === "GDS",
            teacherComment: row.teacherComment ?? null,
            uncertaintyFlag: row.uncertaintyFlag,
            moderationStatus: row.uncertaintyFlag ? "needs_moderation" : "not_moderated",
          })),
        },
        ...current,
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the assessment snapshot.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Assessment Intelligence spine</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Quick teacher judgement snapshot</h2>
          <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
            Fast class-level entry using imported classes and pupils where available. Pupil names stay in the browser; the snapshot stores the pupil hash, level, optional comment and evidence confidence only.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-card px-4 py-3 text-sm text-emerald-900">
          <div className="flex items-center gap-2 font-semibold">
            <LockKeyhole size={16} />
            {sourcePreview}
          </div>
          <p className="mt-1 text-xs">This is the same source label School Improvement and Ofsted Readiness consume.</p>
        </div>
      </div>

      <AssessmentSubmissionTracker
        academicYearStart={academicYearStart}
        assessmentPeriod={effectiveAssessmentPeriod}
        loading={loadingSubmissions}
        selectedSubmission={selectedSubmission}
        selectedSubmissionId={selectedSubmissionId}
        submissions={submissions}
        pupilLabelsByHash={pupilLabelsByHash}
        onSelectSubmission={setSelectedSubmissionId}
        onStartPeriod={(period) => {
          setAssessmentPeriod(period);
          setCustomAssessmentPeriod("");
          setMessage(null);
          setError(null);
        }}
        onAddAdditional={() => {
          setAssessmentPeriod(ADDITIONAL_PERIOD);
          setCustomAssessmentPeriod("");
          setMessage(null);
          setError(null);
        }}
      />

      <div className="mt-5 grid gap-3 lg:grid-cols-6">
        <Field label="Imported class">
          <select value={selectedClassId} onChange={(event) => selectClass(event.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" disabled={loadingClasses || classes.length === 0}>
            {classes.length === 0 ? (
              <option>{loadingClasses ? "Loading classes..." : "No imported classes found"}</option>
            ) : (
              classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.className} ({item.pupils.length} pupils)
                </option>
              ))
            )}
          </select>
        </Field>
        <Field label="School URN">
          <input value={schoolUrn} onChange={(event) => setSchoolUrn(event.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="e.g. 148201" />
        </Field>
        <Field label="School name">
          <input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="Optional" />
        </Field>
        <Field label="Class">
          <input value={className} onChange={(event) => setClassName(event.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </Field>
        <Field label="Subject">
          <select value={subject} onChange={(event) => selectSubject(event.target.value as AssessmentSubject)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
            {SUBJECTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Period">
          <select value={assessmentPeriod} onChange={(event) => setAssessmentPeriod(event.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
            {SCHEDULED_PERIODS.map((period) => <option key={period} value={period}>{period}</option>)}
            <option value={ADDITIONAL_PERIOD}>Additional assessment...</option>
          </select>
        </Field>
        {assessmentPeriod === ADDITIONAL_PERIOD && (
          <Field label="Additional name">
            <input value={customAssessmentPeriod} onChange={(event) => setCustomAssessmentPeriod(event.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" placeholder="e.g. Post-intervention check" />
          </Field>
        )}
        <Field label="Snapshot date">
          <input type="date" value={assessmentDate} onChange={(event) => setAssessmentDate(event.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </Field>
      </div>

      <div className="mt-3 max-w-xs">
        <Field label="Academic year start">
          <input type="number" value={academicYearStart} onChange={(event) => setAcademicYearStart(Number(event.target.value))} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        </Field>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-blue-100 bg-card">
        <div className="hidden border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1.1fr_0.7fr_0.8fr_0.8fr_1.6fr_0.8fr_auto] md:gap-2">
          <span>Pupil</span>
          <span>Source</span>
          <span>Year group</span>
          <span>Level</span>
          <span>Optional comment / voice note</span>
          <span>Needs moderation?</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div key={row.id} className="grid gap-3 border-b border-border px-3 py-4 last:border-b-0 md:grid-cols-[1.1fr_0.7fr_0.8fr_0.8fr_1.6fr_0.8fr_auto] md:items-start md:gap-2 md:py-3">
            <RowField label="Pupil">
              <input value={row.pupilLabel} onChange={(event) => updateRow(row.id, { pupilLabel: event.target.value, pupilHash: undefined, source: "manual" })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" aria-label={`Pupil label ${index + 1}`} />
            </RowField>
            <RowField label="Source">
              <span className="flex min-h-10 items-center rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
              {row.source === "lesson_studio" ? "LS" : row.source === "pupils_master" ? "Import" : "Manual"}
              </span>
            </RowField>
            <RowField label="Year group">
              <select value={row.yearGroupAtAssessment} onChange={(event) => updateRow(row.id, { yearGroupAtAssessment: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {YEAR_GROUPS.map((yearGroup) => <option key={yearGroup}>{yearGroup}</option>)}
              </select>
            </RowField>
            <RowField label="Level">
              <select value={row.rawLevel} onChange={(event) => updateRow(row.id, { rawLevel: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                {LEVELS.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}
              </select>
            </RowField>
            <RowField label="Optional comment / voice note">
              <div className="flex flex-col gap-2 sm:flex-row">
                <textarea value={row.teacherComment} onChange={(event) => updateRow(row.id, { teacherComment: event.target.value })} className="min-h-20 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm md:min-h-10" placeholder="Optional rationale, misconception, or moderation note" />
                <VoiceButton onTranscript={(text) => updateRow(row.id, { voiceTranscript: text, teacherComment: appendTranscript(row.teacherComment, text) })} />
              </div>
            </RowField>
            <RowField label="Needs moderation?">
              <label className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground md:justify-center md:border-0 md:bg-transparent md:px-0">
                <input type="checkbox" checked={row.uncertaintyFlag} onChange={(event) => updateRow(row.id, { uncertaintyFlag: event.target.checked })} className="h-4 w-4 rounded border-border" />
                <span className="md:sr-only">Teacher is unsure / needs moderation</span>
              </label>
            </RowField>
            <div className="flex justify-end md:block">
              <button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted" aria-label="Remove row">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setRows((current) => [...current, newRow(current.length + 1)])} className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-card px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50">
          <Plus size={16} />
          Add pupil row
        </button>
        <button type="button" onClick={saveSnapshot} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saving ? "Locking snapshot..." : "Lock snapshot into intelligence spine"}
        </button>
      </div>

      {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</div>}
      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    </section>
  );
}

function AssessmentSubmissionTracker({
  academicYearStart,
  assessmentPeriod,
  loading,
  selectedSubmission,
  selectedSubmissionId,
  submissions,
  pupilLabelsByHash,
  onSelectSubmission,
  onStartPeriod,
  onAddAdditional,
}: {
  academicYearStart: number;
  assessmentPeriod: string;
  loading: boolean;
  selectedSubmission: AssessmentSubmission | null;
  selectedSubmissionId: string | null;
  submissions: AssessmentSubmission[];
  pupilLabelsByHash: Map<string, string>;
  onSelectSubmission: (id: string | null) => void;
  onStartPeriod: (period: string) => void;
  onAddAdditional: () => void;
}) {
  const scheduledRows = SCHEDULED_PERIODS.map((period) => {
    const matching = submissions.filter((submission) => submission.assessmentPeriod === period);
    const latestSubmission = matching[0] ?? null;
    const dueDate = getScheduledPeriodDueDate(period, academicYearStart);
    const status = latestSubmission
      ? "done"
      : period === assessmentPeriod
        ? "active"
        : getScheduledPeriodStatus(dueDate);
    return {
      period,
      dueDate,
      submission: latestSubmission,
      status,
    };
  });
  const additionalSubmissions = submissions.filter((submission) => !SCHEDULED_PERIODS.includes(submission.assessmentPeriod));

  return (
    <div className="mt-5 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-blue-600" />
            <h3 className="text-base font-semibold text-foreground">My assessment submissions</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track scheduled termly submissions, add extra checks, and reopen previous teacher-locked levels for this class and subject.
          </p>
        </div>
        <button type="button" onClick={onAddAdditional} className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100">
          <Plus size={15} />
          Add additional assessment
        </button>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-6">
        {scheduledRows.map((row) => (
          <button
            key={row.period}
            type="button"
            onClick={() => {
              onStartPeriod(row.period);
              if (row.submission) onSelectSubmission(row.submission.id);
            }}
            className={`rounded-lg border p-3 text-left transition-colors ${
              row.status === "done"
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : row.status === "active"
                  ? "border-blue-300 bg-blue-50 text-blue-950"
                  : row.status === "overdue"
                    ? "border-red-200 bg-red-50 text-red-950"
                    : row.status === "due_soon"
                      ? "border-amber-200 bg-amber-50 text-amber-950"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{row.period}</span>
              {row.status === "done" ? <CheckCircle2 size={15} /> : row.status === "active" || row.status === "overdue" || row.status === "due_soon" ? <AlertTriangle size={15} /> : <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
            </div>
            <div className="mt-1 text-xs">
              {renderScheduledRowDetail(row)}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Previous locked submissions</div>
              <div className="text-xs text-muted-foreground">{loading ? "Loading..." : `${submissions.length} found for ${academicYearStart}/${String(academicYearStart + 1).slice(2)}`}</div>
            </div>
            <span className="rounded-full border border-border bg-muted/40 px-2 py-1 text-xs font-semibold text-muted-foreground">
              Source-labelled
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {submissions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No submissions yet for this class/subject. The first locked snapshot will appear here automatically.
              </div>
            ) : (
              submissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => onSelectSubmission(submission.id)}
                  className={`block w-full px-4 py-3 text-left hover:bg-muted/35 ${selectedSubmissionId === submission.id ? "bg-blue-50/80" : "bg-background"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-foreground">{submission.assessmentPeriod}</div>
                    <div className="text-xs text-muted-foreground">{submission.assessmentDate || submission.lockedAt?.slice(0, 10) || "No date"}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {submission.className || "Class"} - {formatSubject(submission.subject)} - {submission.pupilCount} pupils - {submission.validationTier.replace(/_/g, " ")}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground/80">{submission.sourceLabel}</div>
                </button>
              ))
            )}
          </div>
          {additionalSubmissions.length > 0 && (
            <div className="border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
              Additional checks recorded: {additionalSubmissions.map((submission) => submission.assessmentPeriod).join(", ")}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          {selectedSubmission ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{selectedSubmission.assessmentPeriod}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedSubmission.sourceLabel}
                  </p>
                </div>
                <button type="button" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground" title="MIS export adapter placeholder">
                  <FileDown size={13} />
                  Export later
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label="Expected+" value={formatNullablePercent(selectedSubmission.atExpectedPct)} />
                <Metric label="Greater depth" value={formatNullablePercent(selectedSubmission.greaterDepthPct)} />
                <Metric label="Moderation" value={String(selectedSubmission.needsModerationCount)} />
              </div>
              <div className="mt-4 max-h-64 overflow-y-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Pupil</th>
                      <th className="px-3 py-2 text-left font-semibold">Level</th>
                      <th className="px-3 py-2 text-left font-semibold">Comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedSubmission.events.map((event) => (
                      <tr key={`${event.pupilHash}-${event.subject}`}>
                        <td className="px-3 py-2 font-medium text-foreground">{pupilLabelsByHash.get(event.pupilHash) || `Pupil ${event.pupilHash.slice(0, 6)}`}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatLevel(event.rawLevel || event.canonicalLevel)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{event.teacherComment || (event.uncertaintyFlag ? "Needs moderation" : "-")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Eye size={22} className="mb-2" />
              Select a previous submission to see the pupil levels, comments and moderation flags.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderScheduledRowDetail(row: {
  dueDate: string;
  status: string;
  submission: AssessmentSubmission | null;
}) {
  if (row.submission) {
    return `${row.submission.pupilCount} pupils - ${formatNullablePercent(row.submission.atExpectedPct)} expected+`;
  }
  if (row.status === "active") return "Currently selected";
  if (row.status === "overdue") return `Overdue from ${formatShortDate(row.dueDate)}`;
  if (row.status === "due_soon") return `Due by ${formatShortDate(row.dueDate)}`;
  return `Due ${formatShortDate(row.dueDate)}`;
}

function getScheduledPeriodDueDate(period: string, academicYearStart: number) {
  const dates: Record<string, string> = {
    "Autumn 1": `${academicYearStart}-10-31`,
    "Autumn 2": `${academicYearStart}-12-20`,
    "Spring 1": `${academicYearStart + 1}-02-28`,
    "Spring 2": `${academicYearStart + 1}-04-10`,
    "Summer 1": `${academicYearStart + 1}-05-31`,
    "Summer 2": `${academicYearStart + 1}-07-20`,
  };
  return dates[period] || `${academicYearStart + 1}-07-20`;
}

function getScheduledPeriodStatus(dueDate: string) {
  const due = new Date(`${dueDate}T23:59:59`);
  const now = new Date();
  const daysUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 14) return "due_soon";
  return "not_started";
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatNullablePercent(value: number | null) {
  return value === null ? "-" : `${value}%`;
}

function formatSubject(value: string | null) {
  const subject = SUBJECTS.find((item) => item.id === value);
  return subject?.label || value || "assessment";
}

function formatLevel(value: string | null | undefined) {
  const level = LEVELS.find((item) => item.id === value);
  return level?.label || value || "-";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2 text-center">
      <div className="text-base font-bold text-foreground">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function RowField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 text-sm md:space-y-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:sr-only">{label}</span>
      {children}
    </div>
  );
}

function VoiceButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const statusId = useId();
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("Voice typing is not available in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setStatus("Listening...");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onTranscript(transcript);
        setStatus("Voice note added.");
      }
    };
    recognition.onerror = (event: any) => {
      const message = event?.error === "not-allowed"
        ? "Microphone permission was blocked."
        : event?.error === "no-speech"
          ? "No speech detected. Try again."
          : "Voice typing stopped before anything was captured.";
      setStatus(message);
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.start();
  }

  return (
    <div className="flex flex-col gap-1 sm:w-28">
      <button type="button" onClick={startVoice} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70" aria-label="Voice type comment" aria-describedby={status ? statusId : undefined} aria-pressed={listening} disabled={listening}>
        <Mic size={16} />
        <span>{listening ? "Listening" : "Voice"}</span>
      </button>
      {status && <span id={statusId} className="text-xs text-muted-foreground">{status}</span>}
    </div>
  );
}

function appendTranscript(existing: string, transcript: string) {
  const cleanTranscript = transcript.trim();
  if (!cleanTranscript) return existing;
  const cleanExisting = existing.trim();
  return cleanExisting ? `${cleanExisting}\n${cleanTranscript}` : cleanTranscript;
}

async function hashPupilLabel(input: { organizationId: string; schoolUrn: string; className: string; pupilLabel: string }) {
  const normalised = `${input.organizationId}|${input.schoolUrn}|${input.className}|${input.pupilLabel.trim().toLowerCase()}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalised));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "class";
}
