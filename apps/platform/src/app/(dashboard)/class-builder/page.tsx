"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import QRCode from "qrcode";
import { useAuth } from "@/context/SupabaseAuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductHowToGuide } from "@/components/product-guides/ProductHowToGuide";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  buildDefaultDestinationClasses,
  classBuilderCohortLabel,
  classBuilderYearLabel,
  formatClassBuilderCohortYearGroups,
  type ClassBuilderDestinationClass,
} from "@/lib/class-builder";
import { classBuilderHowToGuide } from "@/lib/product-guides/class-builder";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Grip,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Users,
  Wand2,
  XCircle,
  QrCode,
  Lock,
  Unlock,
} from "lucide-react";

type Session = {
  id: string;
  title: string;
  year_group: string;
  current_class: string | null;
  status: "draft" | "open" | "closed";
  target_class_count: number;
  destination_structure?: ClassBuilderDestinationClass[] | null;
  survey_code: string;
  created_at: string;
  response_count?: number;
};

type Pupil = {
  id: string;
  first_name: string;
  last_name: string;
  year_group: string;
  current_class: string | null;
  gender: string | null;
  send_status: string | null;
  ehcp: boolean | null;
  primary_need: string | null;
  eal: boolean;
  pupil_premium: boolean;
  pass_codename: string | null;
  pass_colour: string | null;
  pass_animal: string | null;
  pass_badge: string | null;
  pass_url: string | null;
};

type ResponseRow = {
  id: string;
  pupil_id: string;
  submitted_at: string;
  class_builder_choices: Array<{
    chosen_pupil_id: string;
    choice_type: "friendship" | "work_well";
    rank: number;
  }>;
};

type GroupRow = {
  id: string;
  name: string;
  pupil_ids: string[];
  summary: any;
  created_at: string;
};

type ClassRecord = {
  id: string;
  year_group: string;
  class_name: string;
  room: string | null;
  academic_year: string | null;
  staff_class_assignments?: Array<{
    staff_name: string | null;
    role: string | null;
    is_primary_teacher: boolean | null;
  }>;
};

type SeatingPlanSeat = {
  id: string;
  pupilId: string | null;
  groupName: string;
  pupil?: Pupil;
};

type SeatingPlanTable = {
  id: string;
  label: string;
  groupName: string;
  x?: number;
  y?: number;
  seats: SeatingPlanSeat[];
};

type SeatingPlan = {
  layout: string;
  seatsPerTable: number;
  tables: SeatingPlanTable[];
  locked?: boolean;
  lockedAt?: string;
};

type TableDetail = {
  label: string;
  groupName: string;
  pupils: Array<{
    pupil: Pupil;
    reason: string;
    selectionCount: number;
    response?: ResponseRow;
    friendNames: string[];
    workWellNames: string[];
  }>;
};

export default function ClassBuilderPage() {
  const { organization, session } = useAuth();
  const organizationId = organization?.id || "";
  const accessToken = session?.access_token || "";
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    session: Session;
    pupils: Pupil[];
    responses: ResponseRow[];
    groups: GroupRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("Class Builder Survey");
  const [yearGroup, setYearGroup] = useState("4");
  const [selectedYearGroups, setSelectedYearGroups] = useState<string[]>(["4"]);
  const [currentClass, setCurrentClass] = useState("");
  const [surveyScope, setSurveyScope] = useState<"year" | "class" | "school">("year");
  const [targetClassCount, setTargetClassCount] = useState("2");
  const [classStructureMode, setClassStructureMode] = useState<
    "balanced" | "mixed-transition"
  >("mixed-transition");
  const [seatingLayout, setSeatingLayout] = useState("tables-4");
  const [selectedPassPupil, setSelectedPassPupil] = useState<Pupil | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableDetail | null>(null);
  const [selectedPassQr, setSelectedPassQr] = useState("");

  useEffect(() => {
    if (organizationId) {
      fetchSessions();
      fetchClasses();
    }
  }, [organizationId, accessToken]);

  useEffect(() => {
    if (selectedId && organizationId) fetchDetail(selectedId);
  }, [selectedId, organizationId, accessToken]);

  useEffect(() => {
    let active = true;
    async function buildQr() {
      if (!selectedPassPupil?.pass_url) {
        setSelectedPassQr("");
        return;
      }
      const qr = await QRCode.toDataURL(selectedPassPupil.pass_url, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 260,
        color: { dark: "#020617", light: "#ffffff" },
      });
      if (active) setSelectedPassQr(qr);
    }
    buildQr();
    return () => {
      active = false;
    };
  }, [selectedPassPupil]);

  function authHeaders(): Record<string, string> {
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }

  async function fetchSessions() {
    setLoading(true);
    const res = await fetch(
      `/api/class-builder/sessions?organizationId=${organizationId}`,
      { headers: authHeaders() },
    );
    const data = await res.json();
    if (res.ok) {
      setSessions(data);
      setSelectedId((current) => current ?? data[0]?.id ?? null);
    }
    setLoading(false);
  }

  async function fetchClasses() {
    const res = await fetch(
      `/api/data-upload/classes?organizationId=${organizationId}`,
      { headers: authHeaders() },
    );
    const data = await res.json().catch(() => ({}));
    if (res.ok) setClasses(data.classes ?? []);
  }

  async function fetchDetail(id: string) {
    const res = await fetch(
      `/api/class-builder/sessions/${id}?organizationId=${organizationId}`,
      { headers: authHeaders() },
    );
    const data = await res.json();
    if (res.ok) setDetail(data);
  }

  async function createSession() {
    if (surveyScope === "school") {
      toast.info("Whole-school surveys need the general survey module. Class Builder is year/class scoped.");
      return;
    }
    setBusy(true);
    const storedYearGroup =
      surveyScope === "class"
        ? yearGroup
        : formatClassBuilderCohortYearGroups(selectedYearGroups);
    const destinationClasses =
      classStructureMode === "mixed-transition" && surveyScope === "year"
        ? buildDefaultDestinationClasses(storedYearGroup, Number(targetClassCount))
        : buildBalancedDestinationClasses(Number(targetClassCount));
    const res = await fetch("/api/class-builder/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        organizationId,
        title,
        yearGroup: storedYearGroup,
        cohortYearGroups: surveyScope === "class" ? [yearGroup] : selectedYearGroups,
        currentClass: surveyScope === "class" ? currentClass.trim() || null : null,
        targetClassCount: Number(targetClassCount),
        destinationClasses,
        status: "draft",
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.error || "Could not create session");
      return;
    }
    toast.success("Class Builder session created");
    setSessions((prev) => [data, ...prev]);
    setSelectedId(data.id);
  }

  async function updateStatus(status: "open" | "closed") {
    if (!detail) return;
    setBusy(true);
    const res = await fetch(`/api/class-builder/sessions/${detail.session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ organizationId, status }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success(status === "open" ? "Session opened" : "Session closed");
      await fetchSessions();
      await fetchDetail(detail.session.id);
    }
  }

  async function generateGroups() {
    if (!detail) return;
    setBusy(true);
    const res = await fetch(
      `/api/class-builder/sessions/${detail.session.id}/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ organizationId }),
      },
    );
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.error || "Could not generate groups");
      return;
    }
    toast.success("Draft groups generated");
    await fetchDetail(detail.session.id);
  }

  async function resetResponse(pupilId: string) {
    if (!detail) return;
    const res = await fetch(
      `/api/class-builder/sessions/${detail.session.id}/responses/${pupilId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ organizationId }),
      },
    );
    if (res.ok) {
      toast.success("Response reset");
      await fetchDetail(detail.session.id);
    }
  }

  async function exportCsv() {
    if (!detail) return;
    const res = await fetch(
      `/api/class-builder/sessions/${detail.session.id}/export?organizationId=${organizationId}`,
      { headers: authHeaders() },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not export CSV");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${detail.session.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-class-builder.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Class Builder CSV exported");
  }

  async function lockSeatingPlan(seatingPlan: SeatingPlan) {
    if (!detail) return;
    const res = await fetch(
      `/api/class-builder/sessions/${detail.session.id}/seating`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ organizationId, seatingPlan }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Could not lock seating plan");
      return;
    }
    toast.success("Seating plan locked in");
    await fetchDetail(detail.session.id);
  }

  const pupilById = useMemo(
    () => new Map((detail?.pupils ?? []).map((pupil) => [pupil.id, pupil])),
    [detail?.pupils],
  );
  const responseByPupil = useMemo(
    () =>
      new Map(
        (detail?.responses ?? []).map((response) => [
          response.pupil_id,
          response,
        ]),
      ),
    [detail?.responses],
  );
  const missing = (detail?.pupils ?? []).filter(
    (pupil) => !responseByPupil.has(pupil.id),
  );
  const selectionCountByPupil = useMemo(() => {
    const counts = new Map<string, number>();
    for (const response of detail?.responses ?? []) {
      for (const choice of response.class_builder_choices) {
        counts.set(
          choice.chosen_pupil_id,
          (counts.get(choice.chosen_pupil_id) ?? 0) + 1,
        );
      }
    }
    return counts;
  }, [detail?.responses]);
  const latestExplanation = detail?.groups?.[0]?.summary?.explanation;
  const savedSeatingPlan = detail?.groups?.[0]?.summary?.seatingPlan as
    | SeatingPlan
    | undefined;
  const pupilSurveyUrl = detail ? getSurveyUrl(detail.session) : "";
  const transitionLabel = detail
    ? `${classBuilderCohortLabel(detail.session.year_group)} cohort to draft classes`
    : "Current cohort to next year classes";
  const availableYearGroups = useMemo(
    () => buildYearGroupOptions(classes, detail?.pupils ?? []),
    [classes, detail?.pupils],
  );
  const classesForYearGroup = useMemo(
    () =>
      classes.filter(
        (classRecord) =>
          normaliseYearValue(classRecord.year_group) === normaliseYearValue(yearGroup),
      ),
    [classes, yearGroup],
  );
  const cohortPupilCount = useMemo(
    () => countPupilsForScope(detail?.pupils ?? [], selectedYearGroups, yearGroup, currentClass, surveyScope),
    [detail?.pupils, selectedYearGroups, yearGroup, currentClass, surveyScope],
  );
  const scopeDescription =
    surveyScope === "class"
      ? currentClass
        ? `Only pupils currently in ${currentClass} will appear in this survey.`
        : "Choose a class so only that class sees its own pupil list."
      : surveyScope === "year"
        ? `${selectedYearGroups.map(classBuilderYearLabel).join(" + ")} pupils will appear in this Class Builder survey. Use this for mixed-age transition groups.`
        : "Whole-school surveys belong in the wider Surveys module, not Class Builder.";
  const canGenerateGroups = Boolean(detail && detail.responses.length > 0 && !busy);

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-[1900px] mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Toolbox
          </p>
          <h1 className="text-3xl font-black text-foreground">Class Builder</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Collect pupil choices and create explainable draft class groupings.
            </p>
            {detail && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {transitionLabel}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ProductHowToGuide
            guide={classBuilderHowToGuide}
            triggerLabel="Watch guide"
          />
          {detail && (
            <>
            <Button variant="outline" onClick={() => openSurvey(detail.session)}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open pupil survey
            </Button>
            <Button variant="outline" onClick={() => copySurveyLink(detail.session)}>
              <Link2 className="w-4 h-4 mr-2" />
              Copy pupil survey link
            </Button>
            <Button
              variant="outline"
              onClick={exportCsv}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={generateGroups} disabled={!canGenerateGroups}>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate draft groups
            </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="w-4 h-4" />
                Create session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Survey scope</Label>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant={surveyScope === "year" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => {
                      setSurveyScope("year");
                      setCurrentClass("");
                    }}
                  >
                    Cohort / transition survey
                  </Button>
                  <Button
                    type="button"
                    variant={surveyScope === "class" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSurveyScope("class")}
                  >
                    Class survey
                  </Button>
                  <Button
                    type="button"
                    variant={surveyScope === "school" ? "default" : "outline"}
                    className="justify-start opacity-70"
                    onClick={() => setSurveyScope("school")}
                  >
                    Whole-school survey
                  </Button>
                </div>
                <div
                  className={`mt-2 rounded-lg border p-3 text-xs ${
                    surveyScope === "school"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-blue-200 bg-blue-50 text-blue-900"
                  }`}
                >
                  <p className="font-bold">{scopeDescription}</p>
                  <p className="mt-1">
                    Estimated pupils in scope:{" "}
                    <span className="font-black">{cohortPupilCount}</span>
                  </p>
                </div>
              </div>
              <div>
                <Label>{surveyScope === "class" ? "Year transition" : "Survey year groups"}</Label>
                {surveyScope !== "class" ? (
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {[
                      { label: "Reception + Year 1", values: ["R", "1"] },
                      { label: "Year 2 + Year 3", values: ["2", "3"] },
                      { label: "Year 4 + Year 5", values: ["4", "5"] },
                    ].map((preset) => {
                      const isActive =
                        selectedYearGroups.length === preset.values.length &&
                        preset.values.every((value) => selectedYearGroups.includes(value));
                      return (
                        <Button
                          key={preset.label}
                          type="button"
                          variant={isActive ? "default" : "outline"}
                          className="justify-start text-xs"
                          onClick={() => {
                            setSelectedYearGroups(preset.values);
                            setYearGroup(preset.values[0]);
                            setCurrentClass("");
                          }}
                        >
                          {preset.label}
                        </Button>
                      );
                    })}
                  </div>
                ) : null}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {availableYearGroups.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        surveyScope === "class"
                          ? yearGroup === option.value
                            ? "default"
                            : "outline"
                          : selectedYearGroups.includes(option.value)
                            ? "default"
                            : "outline"
                      }
                      className="justify-start text-xs"
                      onClick={() => {
                        if (surveyScope === "class") {
                          setYearGroup(option.value);
                          setSelectedYearGroups([option.value]);
                          setCurrentClass("");
                        } else {
                          setSelectedYearGroups((current) => {
                            const exists = current.includes(option.value);
                            const next = exists
                              ? current.filter((value) => value !== option.value)
                              : [...current, option.value];
                            const sorted = next.sort((a, b) => yearSortValue(a) - yearSortValue(b));
                            setYearGroup(sorted[0] ?? option.value);
                            return sorted.length > 0 ? sorted : [option.value];
                          });
                        }
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                {surveyScope !== "class" ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Select one or more current year groups. For Rawdon St Peter&apos;s
                    mixed-age planning, use Reception + Year 1, Year 2 + Year 3,
                    or Year 4 + Year 5.
                  </p>
                ) : null}
              </div>
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{surveyScope === "class" ? "Year group" : "Stored cohort"}</Label>
                  <Input
                    value={
                      surveyScope === "class"
                        ? yearGroup
                        : formatClassBuilderCohortYearGroups(selectedYearGroups)
                    }
                    disabled={surveyScope !== "class"}
                    onChange={(e) => {
                      setYearGroup(e.target.value);
                      setSelectedYearGroups([e.target.value]);
                    }}
                  />
                </div>
                <div>
                  <Label>Current class</Label>
                  <Select
                    value={currentClass || "__all__"}
                    onValueChange={(value) =>
                      setCurrentClass(value === "__all__" ? "" : value)
                    }
                    disabled={surveyScope !== "class"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Year {yearGroup}</SelectItem>
                      {classesForYearGroup.map((classRecord) => (
                        <SelectItem
                          key={classRecord.id}
                          value={classRecord.class_name}
                        >
                          {classRecord.class_name}
                          {classRecord.room ? ` · ${classRecord.room}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Draft classes</Label>
                <Select
                  value={targetClassCount}
                  onValueChange={setTargetClassCount}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 classes</SelectItem>
                    <SelectItem value="3">3 classes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class structure</Label>
                <Select
                  value={classStructureMode}
                  onValueChange={(value) =>
                    setClassStructureMode(value as "balanced" | "mixed-transition")
                  }
                  disabled={surveyScope === "class"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed-transition">
                      Mixed-year transition
                    </SelectItem>
                    <SelectItem value="balanced">
                      Same-year balanced classes
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                  {classStructureMode === "mixed-transition" && surveyScope === "year" ? (
                    <>
                      <p className="font-bold">Destination classes:</p>
                      <p>
                        {buildDefaultDestinationClasses(
                          formatClassBuilderCohortYearGroups(selectedYearGroups),
                          Number(targetClassCount),
                        )
                          .map((destinationClass) => destinationClass.name)
                          .join(" · ")}
                      </p>
                    </>
                  ) : (
                    <p>
                      Creates {targetClassCount} balanced classes from the selected
                      cohort without year-specific destination rules.
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={createSession}
                disabled={busy || surveyScope === "school" || (surveyScope === "class" && !currentClass)}
                className="w-full"
              >
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How this works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="font-semibold text-foreground">1. Pick the cohort</p>
                <p>
                  Choose a year-group survey for Class Builder, or a class survey
                  for a single teacher/class seating exercise.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="font-semibold text-foreground">2. Open the survey</p>
                <p>Share the pupil link while the session is open.</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="font-semibold text-foreground">3. Generate groups</p>
                <p>
                  Once enough pupils have submitted, generate draft classes,
                  review the explanation, tweak seating and lock the final plan.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="w-4 h-4" />
                Pupil list
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Class Builder uses the named pupil roll from Settings. Upload
                pupils once there and Schoolgle creates reprintable Pupil Pass
                QR codes for child-friendly access.
              </p>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                Trust Assessor CTF analytics stay pseudonymised. This app uses
                the operational pupil roll because pupils need recognisable
                passes and class/year grouping.
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.assign("/dashboard/settings/data-upload")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage pupil upload and passes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions yet.</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedId(session.id)}
                    className={`w-full text-left rounded-lg border p-3 transition ${
                      selectedId === session.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{session.title}</span>
                      <StatusBadge status={session.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {classBuilderCohortLabel(session.year_group)}
                      {session.current_class ? `, ${session.current_class}` : ""}
                      {" · "}
                      {session.response_count ?? 0} responses
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classes for Year {yearGroup}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {classesForYearGroup.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No uploaded class records for this year group yet.
                </p>
              ) : (
                classesForYearGroup.map((classRecord) => (
                  <div key={classRecord.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold">{classRecord.class_name}</p>
                      {classRecord.room && (
                        <Badge variant="outline">{classRecord.room}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {primaryTeacherName(classRecord) || "No teacher linked yet"}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {!detail ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Select or create a session to begin.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{detail.session.title}</h2>
                    <StatusBadge status={detail.session.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Code {detail.session.survey_code} · {detail.pupils.length} pupils ·{" "}
                    {detail.responses.length} submitted
                  </p>
                </div>
                <div className="flex gap-2">
                  {detail.session.status !== "open" && (
                    <Button onClick={() => updateStatus("open")} disabled={busy}>
                      Open session
                    </Button>
                  )}
                  {detail.session.status !== "closed" && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus("closed")}
                      disabled={busy}
                    >
                      Close session
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => fetchDetail(detail.session.id)}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-blue-950">
                  <Link2 className="h-4 w-4" />
                  Pupil survey access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {detail.session.status !== "open" ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    This session is not open yet. Click <strong>Open session</strong> before pupils can submit choices.
                  </div>
                ) : (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                    This survey is open. Pupils can now use the link below.
                  </div>
                )}
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                  <Input
                    readOnly
                    value={pupilSurveyUrl}
                    className="bg-white font-mono text-xs"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <Button variant="outline" onClick={() => copySurveyLink(detail.session)}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Copy link
                  </Button>
                  <Button onClick={() => openSurvey(detail.session)}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open survey
                  </Button>
                </div>
                <p className="text-sm text-blue-950/80">
                  A pupil selects their own name, then chooses up to three friends and up to three people they work well with. They cannot pick themselves, cannot duplicate choices, and never see staff results.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Stat label="Pupils" value={detail.pupils.length} />
              <Stat label="Submitted" value={detail.responses.length} />
              <Stat label="Waiting" value={missing.length} />
              <Stat label="Target classes" value={detail.session.target_class_count} />
            </div>

            <Card className="border-slate-200 bg-slate-50/80">
              <CardHeader>
                <CardTitle className="text-base">Staff checklist</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <ChecklistItem
                  complete={detail.session.status === "open" || detail.session.status === "closed"}
                  title="1. Open survey"
                  text={
                    detail.session.status === "draft"
                      ? "Open the session before pupils start."
                      : "Survey link is ready to share."
                  }
                />
                <ChecklistItem
                  complete={detail.responses.length > 0}
                  title="2. Collect choices"
                  text={`${detail.responses.length}/${detail.pupils.length} pupils have submitted.`}
                />
                <ChecklistItem
                  complete={detail.groups.length > 0}
                  title="3. Generate classes"
                  text={
                    detail.groups.length > 0
                      ? "Draft groups and explanations are available."
                      : "Generate draft groups when ready."
                  }
                />
                <ChecklistItem
                  complete={Boolean(savedSeatingPlan?.locked)}
                  title="4. Tweak seating"
                  text={
                    savedSeatingPlan?.locked
                      ? "Seating plan is locked."
                      : "Drag pupils, inspect tables and lock when happy."
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  Completion and choices
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {detail.pupils.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold">No named pupils found for this cohort yet.</p>
                        <p className="mt-1">
                          Grove House does have Trust Assessor CTF assessment
                          data, but that route intentionally returns
                          pseudonymised pupils only. Use the MIS sync or upload
                          a pupil-list CSV before opening the survey.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="py-2">Pupil</th>
                        <th>Status</th>
                        <th>Friends</th>
                        <th>Works well with</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.pupils.map((pupil) => {
                        const response = responseByPupil.get(pupil.id);
                        return (
                          <tr key={pupil.id} className="border-t">
                            <td className="py-3 font-medium">{nameOf(pupil)}</td>
                            <td>
                              {response ? (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  Submitted
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Waiting</Badge>
                              )}
                            </td>
                            <td>{choiceNames(response, "friendship", pupilById)}</td>
                            <td>{choiceNames(response, "work_well", pupilById)}</td>
                            <td className="text-right">
                              {response && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => resetResponse(pupil.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reset
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {detail.groups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Draft groups and explanation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {detail.groups.slice(0, detail.session.target_class_count).map((group) => {
                      const groupPupils = group.pupil_ids
                        .map((id) => pupilById.get(id))
                        .filter((pupil): pupil is Pupil => Boolean(pupil));
                      return (
                      <div key={group.id} className="rounded-lg border p-4">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-bold">{group.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {group.pupil_ids.length} pupils
                            </p>
                          </div>
                          <YearGroupBalance pupils={groupPupils} />
                        </div>
                        <div className="space-y-1">
                          {group.pupil_ids.map((id) => {
                            const pupil = pupilById.get(id);
                            return (
                              <div key={id} className="flex items-center gap-2 text-sm">
                                {pupil && <YearGroupChip yearGroup={pupil.year_group} />}
                                <span>{pupil ? nameOf(pupil) : id}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                  {latestExplanation && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <Explain
                        title="Mutual friendships kept"
                        items={(latestExplanation.mutualFriendshipsKept ?? []).map(
                          (item: any) => pairName(item.pupilIds, pupilById),
                        )}
                      />
                      <Explain
                        title="Pupils with no selections"
                        items={(latestExplanation.isolatedPupils ?? []).map(
                          (item: any) => nameOf(pupilById.get(item.pupilId)),
                        )}
                      />
                      <Explain
                        title="High selection counts"
                        items={(latestExplanation.selectionCounts?.highDemand ?? []).map(
                          (item: any) =>
                            `${nameOf(pupilById.get(item.pupilId))}: ${item.count}`,
                        )}
                      />
                      <Explain
                        title="Trade-offs"
                        items={latestExplanation.tradeOffs ?? []}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {detail.groups.length > 0 && (
              <Card className="xl:-ml-[304px]">
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Inclusive classroom seating planner
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Full-width classroom view using the spare setup-panel space.
                      </p>
                    </div>
                    <Select value={seatingLayout} onValueChange={setSeatingLayout}>
                      <SelectTrigger className="w-full md:w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tables-2">Paired desks</SelectItem>
                        <SelectItem value="tables-4">Tables of 4</SelectItem>
                        <SelectItem value="tables-6">Tables of 6</SelectItem>
                        <SelectItem value="rows">Rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      {transitionLabel}. Schoolgle starts from the draft groups,
                      then shows visible SEND/EHCP/EAL/PP tags and a plain-English
                      reason for each placement. Teachers can use this as the
                      evidence-informed starting point before manual moves.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                      <p className="font-bold">Benefit</p>
                      <p>
                        Positive work-well links are used to create supportive
                        tables without hiding access needs.
                      </p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
                      <p className="font-bold">Inclusion lens</p>
                      <p>
                        SEND, EHCP, EAL and pupil premium tags stay visible so
                        staff can check opportunity and support are balanced.
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                      <p className="font-bold">Evidence reference</p>
                      <p>
                        Based on EEF SEND/oral-language guidance and UDL access
                        principles: know the child, support interaction, remove
                        barriers.
                      </p>
                    </div>
                  </div>
                  <SeatingPreview
                    groups={detail.groups.slice(0, detail.session.target_class_count)}
                    pupilById={pupilById}
                    responseByPupil={responseByPupil}
                    selectionCountByPupil={selectionCountByPupil}
                    layout={seatingLayout}
                    savedPlan={savedSeatingPlan}
                    onOpenPass={setSelectedPassPupil}
                    onLockPlan={lockSeatingPlan}
                    onOpenTable={setSelectedTable}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      <PupilPassDialog
        pupil={selectedPassPupil}
        qrDataUrl={selectedPassQr}
        onOpenChange={(open) => {
          if (!open) setSelectedPassPupil(null);
        }}
      />
      <TableDetailDialog
        table={selectedTable}
        onOpenChange={(open) => {
          if (!open) setSelectedTable(null);
        }}
        onOpenPass={setSelectedPassPupil}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: Session["status"] }) {
  const className =
    status === "open"
      ? "bg-emerald-100 text-emerald-700"
      : status === "closed"
        ? "bg-slate-200 text-slate-700"
        : "bg-amber-100 text-amber-700";
  return <Badge className={className}>{status}</Badge>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  complete,
  title,
  text,
}: {
  complete: boolean;
  title: string;
  text: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        complete
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid h-5 w-5 place-items-center rounded-full text-xs font-black ${
            complete
              ? "bg-emerald-600 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          {complete ? "✓" : "!"}
        </span>
        <p className="font-bold">{title}</p>
      </div>
      <p className="mt-2 text-xs opacity-80">{text}</p>
    </div>
  );
}

function Explain({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      {items.length === 0 ? (
        <p className="text-muted-foreground">None flagged.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function nameOf(pupil?: Pupil) {
  if (!pupil) return "Unknown pupil";
  return `${pupil.first_name} ${pupil.last_name}`;
}

function shortNameOf(pupil?: Pupil) {
  if (!pupil) return "Unknown";
  return pupil.first_name || nameOf(pupil);
}

function buildYearGroupOptions(classes: ClassRecord[], pupils: Pupil[]) {
  const values = new Set<string>();
  ["R", "1", "2", "3", "4", "5", "6"].forEach((value) => values.add(value));
  for (const classRecord of classes) {
    const value = normaliseYearValue(classRecord.year_group);
    if (value) values.add(value);
  }
  for (const pupil of pupils) {
    const value = normaliseYearValue(pupil.year_group);
    if (value) values.add(value);
  }
  return [...values]
    .sort((a, b) => yearSortValue(a) - yearSortValue(b))
    .map((value) => ({
      value,
      label: `Current ${yearLabel(value)}`,
    }));
}

function buildBalancedDestinationClasses(
  targetClassCount: number,
): ClassBuilderDestinationClass[] {
  const classCount = Math.min(
    3,
    Math.max(2, Math.floor(targetClassCount || 2)),
  );
  return Array.from({ length: classCount }, (_, index) => ({
    name: `Class ${index + 1}`,
    allowedYearGroups: [],
  }));
}

function normaliseYearValue(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (["r", "rec", "reception"].includes(lower)) return "R";
  const match = lower.match(/\d+/);
  return match ? String(Number(match[0])) : raw;
}

function yearSortValue(value: string) {
  if (normaliseYearValue(value) === "R") return 0;
  const numeric = Number(normaliseYearValue(value));
  return Number.isFinite(numeric) ? numeric : 99;
}

function yearLabel(value: string) {
  const normalised = normaliseYearValue(value);
  return normalised === "R" ? "Reception" : `Year ${normalised}`;
}

function yearChipLabel(value: string | null | undefined) {
  const normalised = normaliseYearValue(value);
  return normalised === "R" ? "YR" : normalised ? `Y${normalised}` : "Y?";
}

function yearChipClassName(value: string | null | undefined) {
  const normalised = normaliseYearValue(value);
  const classes: Record<string, string> = {
    R: "border-pink-200 bg-pink-50 text-pink-800",
    "1": "border-sky-200 bg-sky-50 text-sky-800",
    "2": "border-emerald-200 bg-emerald-50 text-emerald-800",
    "3": "border-amber-200 bg-amber-50 text-amber-800",
    "4": "border-blue-200 bg-blue-50 text-blue-800",
    "5": "border-purple-200 bg-purple-50 text-purple-800",
    "6": "border-rose-200 bg-rose-50 text-rose-800",
  };
  return classes[normalised] ?? "border-slate-200 bg-slate-50 text-slate-700";
}

function YearGroupChip({
  yearGroup,
  compact = false,
}: {
  yearGroup: string | null | undefined;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border font-black ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      } ${yearChipClassName(yearGroup)}`}
      title={`Current ${yearLabel(yearGroup || "")}`}
    >
      {yearChipLabel(yearGroup)}
    </span>
  );
}

function YearGroupBalance({
  pupils,
  compact = false,
}: {
  pupils: Pupil[];
  compact?: boolean;
}) {
  const counts = pupils.reduce<Record<string, number>>((acc, pupil) => {
    const year = normaliseYearValue(pupil.year_group) || "?";
    acc[year] = (acc[year] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(counts)
        .sort(([a], [b]) => yearSortValue(a) - yearSortValue(b))
        .map(([year, count]) => (
          <span
            key={year}
            className={`inline-flex items-center rounded-full border font-black ${
              compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"
            } ${yearChipClassName(year)}`}
            title={`${yearLabel(year)} pupils in this group`}
          >
            {yearChipLabel(year)} {count}
          </span>
        ))}
    </div>
  );
}

function primaryTeacherName(classRecord: ClassRecord) {
  return (
    classRecord.staff_class_assignments?.find(
      (assignment) => assignment.is_primary_teacher,
    )?.staff_name ||
    classRecord.staff_class_assignments?.find((assignment) =>
      assignment.role?.toLowerCase().includes("teacher"),
    )?.staff_name ||
    null
  );
}

function countPupilsForScope(
  pupils: Pupil[],
  selectedYearGroups: string[],
  yearGroup: string,
  currentClass: string,
  scope: "year" | "class" | "school",
) {
  if (scope === "school") return pupils.length;
  const selectedYears = new Set(
    (scope === "class" ? [yearGroup] : selectedYearGroups).map(normaliseYearValue),
  );
  return pupils.filter((pupil) => {
    const yearMatches = selectedYears.has(normaliseYearValue(pupil.year_group));
    if (!yearMatches) return false;
    if (scope === "class") return pupil.current_class === currentClass;
    return true;
  }).length;
}

function choiceNames(
  response: ResponseRow | undefined,
  type: "friendship" | "work_well",
  pupilById: Map<string, Pupil>,
) {
  if (!response) return "Not submitted yet";
  return choiceNamesArray(response, type, pupilById).join(", ");
}

function choiceNamesArray(
  response: ResponseRow | undefined,
  type: "friendship" | "work_well",
  pupilById: Map<string, Pupil>,
) {
  if (!response) return [];
  return response.class_builder_choices
    .filter((choice) => choice.choice_type === type)
    .sort((a, b) => a.rank - b.rank)
    .map((choice) => nameOf(pupilById.get(choice.chosen_pupil_id)));
}

function pairName(ids: string[], pupilById: Map<string, Pupil>) {
  return ids.map((id) => nameOf(pupilById.get(id))).join(" and ");
}

function SeatingPreview({
  groups,
  pupilById,
  responseByPupil,
  selectionCountByPupil,
  layout,
  savedPlan,
  onOpenPass,
  onLockPlan,
  onOpenTable,
}: {
  groups: GroupRow[];
  pupilById: Map<string, Pupil>;
  responseByPupil: Map<string, ResponseRow>;
  selectionCountByPupil: Map<string, number>;
  layout: string;
  savedPlan?: SeatingPlan;
  onOpenPass: (pupil: Pupil) => void;
  onLockPlan: (plan: SeatingPlan) => Promise<void>;
  onOpenTable: (table: TableDetail) => void;
}) {
  const [plan, setPlan] = useState<SeatingPlan>(() =>
    buildSeatingPlan(groups, pupilById, layout, savedPlan),
  );
  const [draggedSeatId, setDraggedSeatId] = useState<string | null>(null);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlan(buildSeatingPlan(groups, pupilById, layout, savedPlan));
  }, [groups, pupilById, layout, savedPlan]);

  function moveSeat(targetSeatId: string) {
    if (!draggedSeatId || draggedSeatId === targetSeatId || plan.locked) return;
    setPlan((current) => swapSeats(current, draggedSeatId, targetSeatId));
    setDraggedSeatId(null);
  }

  function moveTable(event: DragEvent<HTMLDivElement>, groupName: string) {
    const tableId = event.dataTransfer.getData("application/schoolgle-table") || draggedTableId;
    if (!tableId || plan.locked) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - bounds.left - 130) / bounds.width) * 100, 1, 72);
    const y = clamp(((event.clientY - bounds.top - 28) / bounds.height) * 100, 8, 82);
    setPlan((current) => ({
      ...current,
      locked: false,
      lockedAt: undefined,
      tables: current.tables.map((table) =>
        table.id === tableId && table.groupName === groupName ? { ...table, x, y } : table,
      ),
    }));
    setDraggedTableId(null);
  }

  async function lockPlan() {
    setSaving(true);
    try {
      await onLockPlan(plan);
    } finally {
      setSaving(false);
    }
  }

  function unlockForEditing() {
    setPlan((current) => ({ ...current, locked: false, lockedAt: undefined }));
  }

  const tables = plan.tables.map((table) => ({
    ...table,
    seats: table.seats.map((seat) => ({
      ...seat,
      pupil: seat.pupilId ? pupilById.get(seat.pupilId) : undefined,
    })),
  }));
  const tableSections = groupTablesByClass(tables);

  return (
    <div className="rounded-[1.75rem] border bg-gradient-to-b from-slate-50 to-white p-4 space-y-4">
      <div className="rounded-2xl border border-slate-300 bg-slate-900 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.2em] text-white shadow-sm">
        Whiteboard / front of classroom
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 text-xs">
          <NeedLegend label="SEND" className="bg-violet-100 text-violet-800" />
          <NeedLegend label="EHCP" className="bg-red-100 text-red-800" />
          <NeedLegend label="EAL" className="bg-cyan-100 text-cyan-800" />
          <NeedLegend label="PP" className="bg-amber-100 text-amber-800" />
          <NeedLegend label="F/M/?" className="bg-slate-100 text-slate-800" />
          <NeedLegend label="High demand" className="bg-emerald-100 text-emerald-800" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {plan.locked ? (
            <>
              <Badge className="bg-emerald-100 text-emerald-800">
                <Lock className="mr-1 h-3 w-3" />
                Locked
              </Badge>
              <Button type="button" variant="outline" size="sm" onClick={unlockForEditing}>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock to tweak
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" onClick={lockPlan} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Lock seating plan
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag table handles to place tables around the classroom. Drag pupil cards onto each other to swap seats.
        Locking saves both the room layout and the pupil seating arrangement.
      </p>
      <div className="space-y-8">
        {tableSections.map((section) => {
          const sectionPupils = section.tables.flatMap((table) =>
            table.seats.map((seat) => seat.pupil).filter(Boolean) as Pupil[],
          );
          return (
            <div
              key={section.groupName}
              className="rounded-[1.5rem] border-2 border-slate-300 bg-white/85 p-4 shadow-sm"
            >
              <div className="mb-4 flex flex-col gap-2 border-b pb-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-black text-foreground">{section.groupName}</p>
                  <p className="text-xs text-muted-foreground">
                    Drag the tables around this classroom canvas. The whiteboard, door and teacher desk are visual anchors only.
                  </p>
                </div>
                <ClassBalance pupils={sectionPupils} />
              </div>
              <div
                className="relative min-h-[680px] overflow-hidden rounded-[1.5rem] border-2 border-slate-400 bg-white shadow-inner"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => moveTable(event, section.groupName)}
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              >
                <div className="absolute left-1/2 top-3 z-10 w-[72%] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.25em] text-white shadow">
                  Whiteboard / front
                </div>
                <div className="absolute right-5 top-16 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
                  Teacher desk
                </div>
                <div className="absolute bottom-0 left-8 h-12 w-28 rounded-t-xl border-x border-t border-amber-400 bg-amber-100 px-2 pt-2 text-center text-[10px] font-black uppercase text-amber-800">
                  Door
                </div>
                <div className="absolute bottom-4 right-5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-900 shadow-sm">
                  Tip: use two-seat tables for pairs, four-seat tables for grouped desks, or six-seat tables for larger tables.
                </div>

                {section.tables.map((table) => {
                  const tablePupils = table.seats
                    .map((seat) => seat.pupil)
                    .filter(Boolean) as Pupil[];
                  const tableDetails = table.seats
                    .filter((seat) => seat.pupil)
                    .map((seat) => {
                      const pupil = seat.pupil!;
                      const reason = getSeatReason({
                        pupil,
                        tablePupils,
                        response: responseByPupil.get(pupil.id),
                        selectionCount: selectionCountByPupil.get(pupil.id) ?? 0,
                      });
                      return {
                        pupil,
                        reason,
                        selectionCount: selectionCountByPupil.get(pupil.id) ?? 0,
                        response: responseByPupil.get(pupil.id),
                        friendNames: choiceNamesArray(responseByPupil.get(pupil.id), "friendship", pupilById),
                        workWellNames: choiceNamesArray(responseByPupil.get(pupil.id), "work_well", pupilById),
                      };
                    });
                  const tableWidth = plan.seatsPerTable <= 2 ? 220 : plan.seatsPerTable >= 6 ? 310 : 260;
                  return (
                    <div
                      key={table.id}
                      className="absolute rounded-2xl border border-slate-400 bg-slate-50/95 p-3 shadow-xl"
                      style={{
                        left: `${table.x ?? 8}%`,
                        top: `${table.y ?? 18}%`,
                        width: tableWidth,
                      }}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <button
                            type="button"
                            className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-primary"
                            onClick={() =>
                              onOpenTable({
                                label: table.label,
                                groupName: section.groupName,
                                pupils: tableDetails,
                              })
                            }
                          >
                            {table.label} ? expand
                          </button>
                          <TableBalance pupils={tablePupils} />
                        </div>
                        <button
                          type="button"
                          draggable={!plan.locked}
                          onDragStart={(event) => {
                            event.dataTransfer.setData("application/schoolgle-table", table.id);
                            setDraggedTableId(table.id);
                          }}
                          onClick={() =>
                            onOpenTable({
                              label: table.label,
                              groupName: section.groupName,
                              pupils: tableDetails,
                            })
                          }
                          className={`rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-primary ${
                            plan.locked ? "cursor-pointer" : "cursor-move"
                          }`}
                          title={plan.locked ? `Open ${table.label} details` : `Drag ${table.label} around the room`}
                        >
                          <Grip className="w-4 h-4" />
                        </button>
                      </div>
                      <div
                        className={
                          layout === "rows"
                            ? "grid grid-cols-2 gap-2"
                            : layout === "tables-2"
                              ? "grid grid-cols-2 gap-2"
                              : layout === "tables-6"
                                ? "grid grid-cols-2 md:grid-cols-3 gap-2"
                                : "grid grid-cols-2 gap-2"
                        }
                      >
                        {table.seats.map((seat) => {
                          const reason = seat.pupil
                            ? getSeatReason({
                                pupil: seat.pupil,
                                tablePupils,
                                response: responseByPupil.get(seat.pupil.id),
                                selectionCount: selectionCountByPupil.get(seat.pupil.id) ?? 0,
                              })
                            : "Empty seat.";

                          return (
                            <button
                              type="button"
                              key={seat.id}
                              draggable={!plan.locked}
                              onDragStart={(event) => {
                                event.dataTransfer.setData("application/schoolgle-seat", seat.id);
                                setDraggedSeatId(seat.id);
                              }}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                if (event.dataTransfer.getData("application/schoolgle-table")) return;
                                moveSeat(seat.id);
                              }}
                              onClick={() => seat.pupil && onOpenPass(seat.pupil)}
                              title={reason}
                              className={`min-h-[76px] rounded-lg border bg-card px-2 py-2 text-left text-xs shadow-sm transition hover:border-primary hover:bg-primary/5 ${
                                draggedSeatId === seat.id ? "ring-2 ring-primary" : ""
                              } ${plan.locked ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {seat.pupil && <CharacterBadge pupil={seat.pupil} size="sm" />}
                                    <p className="max-w-[118px] truncate font-semibold">
                                      {seat.pupil ? shortNameOf(seat.pupil) : "Empty"}
                                    </p>
                                    {seat.pupil && <YearGroupChip yearGroup={seat.pupil.year_group} compact />}
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  {seat.pupil && <GenderChip gender={seat.pupil.gender} />}
                                  {seat.pupil?.pass_url && <QrCode className="h-3.5 w-3.5 text-blue-600" />}
                                </div>
                              </div>
                              {seat.pupil && <NeedTags pupil={seat.pupil} compact />}
                              <div className="mt-1.5 rounded-md bg-muted/50 px-1.5 py-1 text-[10px] font-medium leading-tight text-muted-foreground">
                                {shortSeatReason(reason)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildSeatingPlan(
  groups: GroupRow[],
  pupilById: Map<string, Pupil>,
  layout: string,
  savedPlan?: SeatingPlan,
): SeatingPlan {
  const seatsPerTable =
    layout === "tables-2" ? 2 : layout === "tables-6" ? 6 : layout === "rows" ? 5 : 4;
  if (
    savedPlan?.tables?.length &&
    savedPlan.layout === layout &&
    savedPlan.seatsPerTable === seatsPerTable &&
    seatingPlanMatchesGroups(savedPlan, groups)
  ) {
    return savedPlan;
  }

  const tables = groups.flatMap((group) => {
    const groupSeats = group.pupil_ids.map((id, index) => ({
      id: `${group.id}-${id}-${index}`,
      pupilId: pupilById.has(id) ? id : null,
      groupName: group.name,
    }));
    return chunk(groupSeats, seatsPerTable).map((seats, index) => {
      const position = defaultTablePosition(index, layout);
      return {
        id: `${group.id}-${layout}-${index + 1}`,
        label: layout === "rows" ? `Row ${index + 1}` : `Table ${index + 1}`,
        groupName: group.name,
        x: position.x,
        y: position.y,
        seats,
      };
    });
  });

  return { layout, seatsPerTable, tables, locked: false };
}

function defaultTablePosition(index: number, layout: string) {
  if (layout === "rows") {
    return {
      x: 8 + (index % 2) * 42,
      y: 18 + Math.floor(index / 2) * 17,
    };
  }
  return {
    x: 5 + (index % 3) * 31,
    y: 18 + Math.floor(index / 3) * 22,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function seatingPlanMatchesGroups(plan: SeatingPlan, groups: GroupRow[]) {
  const expected = new Set(groups.map((group) => group.name));
  const actual = new Set(plan.tables.map((table: any) => table.groupName));
  if (expected.size !== actual.size) return false;
  for (const groupName of expected) {
    if (!actual.has(groupName)) return false;
  }
  return plan.tables.every((table: any) =>
    table.seats.every((seat: SeatingPlanSeat) => seat.groupName === table.groupName),
  );
}

function groupTablesByClass(
  tables: Array<SeatingPlanTable & { groupName?: string; seats: Array<SeatingPlanSeat & { pupil?: Pupil }> }>,
) {
  const sections: Array<{
    groupName: string;
    tables: Array<SeatingPlanTable & { groupName?: string; seats: Array<SeatingPlanSeat & { pupil?: Pupil }> }>;
  }> = [];

  for (const table of tables) {
    const groupName = table.groupName || table.seats[0]?.groupName || "Draft class";
    let section = sections.find((item) => item.groupName === groupName);
    if (!section) {
      section = { groupName, tables: [] };
      sections.push(section);
    }
    section.tables.push(table);
  }

  return sections;
}

function swapSeats(plan: SeatingPlan, fromSeatId: string, toSeatId: string) {
  const nextTables = plan.tables.map((table) => ({
    ...table,
    seats: table.seats.map((seat) => ({ ...seat })),
  }));
  let fromSeat: SeatingPlanSeat | undefined;
  let toSeat: SeatingPlanSeat | undefined;

  for (const table of nextTables) {
    for (const seat of table.seats) {
      if (seat.id === fromSeatId) fromSeat = seat;
      if (seat.id === toSeatId) toSeat = seat;
    }
  }

  if (!fromSeat || !toSeat) return plan;
  const fromPupilId = fromSeat.pupilId;
  fromSeat.pupilId = toSeat.pupilId;
  toSeat.pupilId = fromPupilId;

  return { ...plan, tables: nextTables, locked: false, lockedAt: undefined };
}

function ClassBalance({ pupils }: { pupils: Pupil[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold">
      <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-800">
        {pupils.length} pupils
      </span>
      <TableBalance pupils={pupils} />
    </div>
  );
}

function TableBalance({ pupils }: { pupils: Pupil[] }) {
  const counts = pupils.reduce(
    (acc, pupil) => {
      const gender = normaliseGenderForDisplay(pupil.gender);
      acc[gender] = (acc[gender] ?? 0) + 1;
      if (pupil.send_status) acc.send += 1;
      if (pupil.ehcp) acc.ehcp += 1;
      if (pupil.eal) acc.eal += 1;
      return acc;
    },
    { F: 0, M: 0, O: 0, "?": 0, send: 0, ehcp: 0, eal: 0 } as Record<
      string,
      number
    >,
  );

  return (
    <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold">
      <YearGroupBalance pupils={pupils} compact />
      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-700">
        F {counts.F ?? 0}
      </span>
      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-700">
        M {counts.M ?? 0}
      </span>
      {(counts.O ?? 0) + (counts["?"] ?? 0) > 0 && (
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-700">
          Other/? {(counts.O ?? 0) + (counts["?"] ?? 0)}
        </span>
      )}
      {counts.send > 0 && (
        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-violet-800">
          SEND {counts.send}
        </span>
      )}
      {counts.ehcp > 0 && (
        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-red-800">
          EHCP {counts.ehcp}
        </span>
      )}
      {counts.eal > 0 && (
        <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-cyan-800">
          EAL {counts.eal}
        </span>
      )}
    </div>
  );
}

function GenderChip({ gender }: { gender: string | null }) {
  const label = normaliseGenderForDisplay(gender);
  return (
    <span
      className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-slate-700"
      title={`Gender: ${label}`}
    >
      {label}
    </span>
  );
}

function normaliseGenderForDisplay(gender: string | null) {
  const value = (gender || "").trim().toLowerCase();
  if (["f", "female", "girl"].includes(value)) return "F";
  if (["m", "male", "boy"].includes(value)) return "M";
  if (["o", "other", "non-binary", "non binary"].includes(value)) return "O";
  return "?";
}

function NeedLegend({ label, className }: { label: string; className: string }) {
  return (
    <span className={`rounded-full px-2 py-1 font-semibold ${className}`}>
      {label}
    </span>
  );
}

function NeedTags({ pupil, compact = false }: { pupil: Pupil; compact?: boolean }) {
  const tags = getNeedTags(pupil);
  if (tags.length === 0) return null;
  return (
    <div className={`${compact ? "mt-1.5" : "mt-2"} flex flex-wrap gap-1`}>
      {tags.map((tag) => (
        <span
          key={tag.label}
          className={`rounded-full px-1.5 py-0.5 ${
            compact ? "text-[9px]" : "text-[10px]"
          } font-bold ${tag.className}`}
          title={tag.title}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}

function getNeedTags(pupil: Pupil) {
  const tags: Array<{ label: string; className: string; title: string }> = [];
  if (pupil.send_status) {
    tags.push({
      label: "SEND",
      className: "bg-violet-100 text-violet-800",
      title: pupil.primary_need
        ? `SEND support: ${pupil.primary_need}`
        : `SEND status: ${pupil.send_status}`,
    });
  }
  if (pupil.ehcp) {
    tags.push({
      label: "EHCP",
      className: "bg-red-100 text-red-800",
      title: "EHCP/access needs should be checked by staff.",
    });
  }
  if (pupil.eal) {
    tags.push({
      label: "EAL",
      className: "bg-cyan-100 text-cyan-800",
      title: "EAL: consider language-rich peer support.",
    });
  }
  if (pupil.pupil_premium) {
    tags.push({
      label: "PP",
      className: "bg-amber-100 text-amber-800",
      title: "Pupil premium: check opportunity and support are balanced.",
    });
  }
  return tags;
}

function getSeatReason({
  pupil,
  tablePupils,
  response,
  selectionCount,
}: {
  pupil: Pupil;
  tablePupils: Pupil[];
  response?: ResponseRow;
  selectionCount: number;
}) {
  const reasons: string[] = [];
  if (pupil.ehcp) {
    reasons.push("EHCP flagged: staff should check access and adult-support needs.");
  } else if (pupil.send_status) {
    reasons.push(
      pupil.primary_need
        ? `SEND flagged (${pupil.primary_need}): support needs kept visible.`
        : "SEND flagged: support needs kept visible.",
    );
  }
  if (pupil.eal) {
    reasons.push("EAL flagged: language-rich peer interaction should be considered.");
  }
  if (pupil.pupil_premium) {
    reasons.push("PP flagged: helps staff check fair access to support.");
  }
  const workChoices = new Set(
    (response?.class_builder_choices ?? [])
      .filter((choice) => choice.choice_type === "work_well")
      .map((choice) => choice.chosen_pupil_id),
  );
  const friendChoices = new Set(
    (response?.class_builder_choices ?? [])
      .filter((choice) => choice.choice_type === "friendship")
      .map((choice) => choice.chosen_pupil_id),
  );
  const nearbyWork = tablePupils.filter((peer) => workChoices.has(peer.id));
  const nearbyFriends = tablePupils.filter((peer) => friendChoices.has(peer.id));
  if (nearbyWork.length > 0) {
    reasons.push(
      `Near work-well peer${nearbyWork.length > 1 ? "s" : ""}: ${nearbyWork
        .map(nameOf)
        .join(", ")}.`,
    );
  } else if (nearbyFriends.length > 0) {
    reasons.push(
      `Near friendship choice${nearbyFriends.length > 1 ? "s" : ""}: ${nearbyFriends
        .map(nameOf)
        .join(", ")}.`,
    );
  }
  if (selectionCount >= 8) {
    reasons.push("High-demand pupil: placement helps avoid one table carrying every popular link.");
  }
  return reasons.length > 0
    ? reasons.slice(0, 3).join(" ")
    : "Balanced placement from the draft class group; teacher can manually adjust.";
}

function shortSeatReason(reason: string) {
  if (reason.includes("work-well peer")) return "Work-well peer nearby";
  if (reason.includes("friendship choice")) return "Friendship choice nearby";
  if (reason.includes("EHCP")) return "EHCP/access check";
  if (reason.includes("SEND")) return "SEND needs visible";
  if (reason.includes("EAL")) return "EAL peer support";
  if (reason.includes("High-demand")) return "High-demand balance";
  if (reason.includes("PP")) return "Opportunity check";
  return "Balanced placement";
}

function PupilPassDialog({
  pupil,
  qrDataUrl,
  onOpenChange,
}: {
  pupil: Pupil | null;
  qrDataUrl: string;
  onOpenChange: (open: boolean) => void;
}) {
  const open = Boolean(pupil);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pupil pass</DialogTitle>
        </DialogHeader>
        {pupil && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex gap-4">
                <div className="relative h-36 w-36 shrink-0 rounded-2xl border bg-white p-2 shadow-sm">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR code for ${pupil.pass_codename || nameOf(pupil)}`}
                      className="h-full w-full rounded-xl"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      <QrCode className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-white shadow">
                    <CharacterBadge pupil={pupil} size="lg" />
                  </div>
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="text-xl font-black">{pupil.pass_codename || "Basic QR pass"}</p>
                  <p className="font-semibold">{nameOf(pupil)}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Year {pupil.year_group}, {pupil.current_class || "No class"} · moving to Year{" "}
                    {nextYearGroup(pupil.year_group)}
                  </p>
                  <NeedTags pupil={pupil} />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
              <p className="font-bold">How this is used</p>
              <p>
                The QR identifies this pupil in the backend. The visible character
                name helps the pupil recognise their own pass without putting
                sensitive details into the QR design.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TableDetailDialog({
  table,
  onOpenChange,
  onOpenPass,
}: {
  table: TableDetail | null;
  onOpenChange: (open: boolean) => void;
  onOpenPass: (pupil: Pupil) => void;
}) {
  const open = Boolean(table);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {table?.groupName} · {table?.label}
          </DialogTitle>
        </DialogHeader>
        {table && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Expanded table view
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Full names and reasons are shown here so similar names are
                    easier to check before locking the seating plan.
                  </p>
                </div>
                <TableBalance pupils={table.pupils.map((item) => item.pupil)} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {table.pupils.map(({ pupil, reason, selectionCount, friendNames, workWellNames }) => (
                <div
                  key={pupil.id}
                  className="rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CharacterBadge pupil={pupil} size="md" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black">{nameOf(pupil)}</p>
                          <YearGroupChip yearGroup={pupil.year_group} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Current {pupil.current_class || "No class"} · Year{" "}
                          {pupil.year_group}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <GenderChip gender={pupil.gender} />
                      {pupil.pass_url && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenPass(pupil)}
                        >
                          <QrCode className="mr-1 h-3.5 w-3.5" />
                          Pass
                        </Button>
                      )}
                    </div>
                  </div>
                  <NeedTags pupil={pupil} />
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
                    <p className="font-bold">Why this seat?</p>
                    <p>{reason}</p>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="font-bold">Friends chosen</p>
                      <p className="text-muted-foreground">
                        {friendNames.length > 0 ? friendNames.join(", ") : "None"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="font-bold">Works well with</p>
                      <p className="text-muted-foreground">
                        {workWellNames.length > 0 ? workWellNames.join(", ") : "None"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="font-bold">Selection count</p>
                      <p className="text-muted-foreground">
                        Chosen by {selectionCount} pupil
                        {selectionCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CharacterBadge({
  pupil,
  size = "md",
}: {
  pupil: Pupil;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions =
    size === "lg" ? "h-10 w-10" : size === "sm" ? "h-5 w-5" : "h-8 w-8";
  const badgeDataUrl = characterBadgeDataUrl(
    pupil.pass_animal,
    pupil.pass_colour,
    pupil.pass_badge,
  );
  return (
    <img
      src={badgeDataUrl}
      alt={pupil.pass_codename || "Pupil character badge"}
      title={pupil.pass_codename || "Pupil character badge"}
      className={`${dimensions} shrink-0 rounded-full border border-white bg-white object-cover shadow-sm`}
    />
  );
}

function passColourHex(colour: string | null) {
  const colours: Record<string, string> = {
    Blue: "#3b82f6",
    Green: "#22c55e",
    Purple: "#8b5cf6",
    Yellow: "#eab308",
    Red: "#ef4444",
    Orange: "#f97316",
    Pink: "#ec4899",
    Teal: "#14b8a6",
  };
  return colour ? colours[colour] || "#0ea5e9" : "#0ea5e9";
}

function characterBadgeDataUrl(
  animal: string | null,
  colour: string | null,
  badge: string | null,
) {
  const fill = passColourHex(colour);
  const animalSvg = animalFaceSvg(animal, fill);
  const badgeSvg = badgeMarkSvg(badge);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.25"/>
      </filter>
    </defs>
    <circle cx="60" cy="60" r="56" fill="${fill}"/>
    <circle cx="60" cy="60" r="48" fill="#ffffff" opacity="0.92" filter="url(#shadow)"/>
    ${animalSvg}
    ${badgeSvg}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function animalFaceSvg(animal: string | null, colour: string) {
  switch (animal) {
    case "Fox":
      return `<path d="M25 34 45 20l15 20 15-20 20 14-8 48-27 18-27-18z" fill="${colour}"/>
        <path d="M38 58 60 95l22-37-22 10z" fill="#fff7ed"/>
        <circle cx="48" cy="58" r="5" fill="#0f172a"/><circle cx="72" cy="58" r="5" fill="#0f172a"/>
        <path d="M55 75h10l-5 6z" fill="#0f172a"/>`;
    case "Panda":
      return `<circle cx="37" cy="34" r="16" fill="#0f172a"/><circle cx="83" cy="34" r="16" fill="#0f172a"/>
        <circle cx="60" cy="62" r="36" fill="#f8fafc"/>
        <ellipse cx="47" cy="58" rx="11" ry="14" fill="#0f172a"/><ellipse cx="73" cy="58" rx="11" ry="14" fill="#0f172a"/>
        <circle cx="47" cy="57" r="4" fill="#fff"/><circle cx="73" cy="57" r="4" fill="#fff"/>
        <path d="M55 77h10l-5 7z" fill="#0f172a"/>`;
    case "Owl":
      return `<path d="M28 36 44 22h32l16 14v36c0 20-15 34-32 34S28 92 28 72z" fill="${colour}"/>
        <circle cx="48" cy="58" r="15" fill="#fff"/><circle cx="72" cy="58" r="15" fill="#fff"/>
        <circle cx="48" cy="58" r="6" fill="#0f172a"/><circle cx="72" cy="58" r="6" fill="#0f172a"/>
        <path d="M55 76h10l-5 9z" fill="#f59e0b"/>`;
    case "Turtle":
      return `<ellipse cx="60" cy="66" rx="34" ry="28" fill="${colour}"/>
        <circle cx="60" cy="31" r="14" fill="#86efac"/>
        <circle cx="42" cy="67" r="6" fill="#bbf7d0"/><circle cx="60" cy="67" r="8" fill="#bbf7d0"/><circle cx="78" cy="67" r="6" fill="#bbf7d0"/>
        <circle cx="55" cy="29" r="3" fill="#0f172a"/><circle cx="65" cy="29" r="3" fill="#0f172a"/>`;
    case "Bee":
      return `<ellipse cx="60" cy="66" rx="28" ry="34" fill="#facc15"/>
        <path d="M35 52h50M34 66h52M39 80h42" stroke="#0f172a" stroke-width="8"/>
        <circle cx="50" cy="40" r="5" fill="#0f172a"/><circle cx="70" cy="40" r="5" fill="#0f172a"/>
        <ellipse cx="38" cy="50" rx="15" ry="24" fill="#dbeafe" opacity=".85"/><ellipse cx="82" cy="50" rx="15" ry="24" fill="#dbeafe" opacity=".85"/>`;
    case "Lion":
      return `<circle cx="60" cy="60" r="42" fill="#b45309"/>
        <circle cx="60" cy="64" r="30" fill="#f59e0b"/>
        <circle cx="49" cy="57" r="5" fill="#0f172a"/><circle cx="71" cy="57" r="5" fill="#0f172a"/>
        <path d="M54 73h12l-6 7z" fill="#0f172a"/>`;
    case "Otter":
      return `<ellipse cx="60" cy="62" rx="34" ry="38" fill="${colour}"/>
        <ellipse cx="60" cy="72" rx="20" ry="17" fill="#fed7aa"/>
        <circle cx="48" cy="55" r="5" fill="#0f172a"/><circle cx="72" cy="55" r="5" fill="#0f172a"/>
        <path d="M55 68h10l-5 7z" fill="#0f172a"/><path d="M42 76h36" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>`;
    case "Robin":
      return `<circle cx="60" cy="58" r="34" fill="${colour}"/>
        <circle cx="60" cy="72" r="22" fill="#fb7185"/>
        <path d="M83 55 103 64 83 73z" fill="#f59e0b"/>
        <circle cx="50" cy="50" r="5" fill="#0f172a"/>`;
    default:
      return `<circle cx="60" cy="60" r="34" fill="${colour}"/>
        <path d="M60 28 70 51l25 2-19 16 6 24-22-13-22 13 6-24-19-16 25-2z" fill="#ffffff"/>`;
  }
}

function badgeMarkSvg(badge: string | null) {
  if (!badge) return "";
  const marks: Record<string, string> = {
    Star: `<path d="M93 20 98 31l12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#facc15" stroke="#fff" stroke-width="3"/>`,
    Moon: `<path d="M102 24c-11 3-18 13-15 25 2 8 8 14 16 17-15 3-29-6-32-21-3-16 8-31 31-21z" fill="#fde68a" stroke="#fff" stroke-width="3"/>`,
    Rocket: `<path d="M88 20c12 3 18 9 21 21L94 56 73 35z" fill="#f97316" stroke="#fff" stroke-width="3"/><circle cx="92" cy="37" r="5" fill="#dbeafe"/>`,
    Leaf: `<path d="M108 22C84 22 75 35 78 56c20 1 32-10 30-34z" fill="#22c55e" stroke="#fff" stroke-width="3"/>`,
    Bolt: `<path d="M94 18 76 52h15l-8 30 29-42H96z" fill="#fde047" stroke="#fff" stroke-width="3"/>`,
    Heart: `<path d="M93 62S73 50 73 35c0-8 10-13 20-4 10-9 20-4 20 4 0 15-20 27-20 27z" fill="#fb7185" stroke="#fff" stroke-width="3"/>`,
  };
  return marks[badge] || "";
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function nextYearGroup(yearGroup: string) {
  const numeric = Number(yearGroup);
  if (Number.isFinite(numeric)) return String(numeric + 1);
  if (yearGroup.toLowerCase() === "r" || yearGroup.toLowerCase() === "reception") {
    return "1";
  }
  return "next year";
}

function getSurveyPath(session: Session) {
  return `/class-builder/s/${session.survey_code}`;
}

function getSurveyUrl(session: Session) {
  if (typeof window === "undefined") return getSurveyPath(session);
  return `${window.location.origin}${getSurveyPath(session)}`;
}

function openSurvey(session: Session) {
  window.open(getSurveyPath(session), "_blank");
}

function copySurveyLink(session: Session) {
  navigator.clipboard.writeText(getSurveyUrl(session));
  toast.success("Pupil survey link copied");
}
