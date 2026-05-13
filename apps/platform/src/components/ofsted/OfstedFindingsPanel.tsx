"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { clientAuthFetch } from "@/lib/auth/client-auth-fetch";
import type {
  OfstedFindingActionLevel,
  OfstedFindingSeverity,
  OfstedFindingStatus,
} from "@/lib/ofsted-readiness/findings";
import {
  getFindingBadgeTone,
  getFindingStatusLabel,
  summariseFindings,
} from "@/lib/ofsted-readiness/findings-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OfstedFinding {
  id: string;
  title: string;
  summary: string | null;
  finding_type: string;
  severity: OfstedFindingSeverity;
  action_level: OfstedFindingActionLevel;
  status: OfstedFindingStatus;
  score: number | null;
  confidence: number | null;
  evidence_url: string | null;
  gaps: string[];
  recommendations: string[];
  red_flags: string[];
  recommended_task_title: string | null;
  assigned_task_id: string | null;
  assigned_to: string | null;
  rule_version: string;
  updated_at: string;
}

interface OrganizationMember {
  role: string;
  user: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;
}

interface OfstedFindingsPanelProps {
  compact?: boolean;
  organizationId?: string;
}

const TONE_CLASSES = {
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300",
  amber:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300",
  blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-300",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300",
  slate:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
};

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

export default function OfstedFindingsPanel({
  compact = false,
  organizationId,
}: OfstedFindingsPanelProps) {
  const [findings, setFindings] = useState<OfstedFinding[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const organizationQuery = `organizationId=${encodeURIComponent(
        organizationId,
      )}`;
      const [findingsRes, membersRes] = await Promise.all([
        clientAuthFetch(
          supabase,
          `/api/ofsted/findings?limit=25&${organizationQuery}`,
        ),
        clientAuthFetch(
          supabase,
          `/api/organization/members?${organizationQuery}`,
        ),
      ]);

      if (!findingsRes.ok) {
        const errorPayload = await findingsRes.json().catch(() => ({}));
        throw new Error(
          errorPayload.error ||
            `Failed to load Ofsted findings (${findingsRes.status})`,
        );
      }

      const findingsData = await findingsRes.json();
      const membersData = membersRes.ok ? await membersRes.json() : {};

      setFindings(findingsData.findings || []);
      setMembers(membersData.members || []);
    } catch (error) {
      console.error("[Ofsted Findings] Load failed:", error);
      toast.error("Could not load Ofsted readiness findings");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => summariseFindings(findings), [findings]);
  const assignableMembers = members.filter((member) => member.user?.id);

  const assignFinding = async (finding: OfstedFinding) => {
    const assigneeId = selectedAssignees[finding.id];
    if (!assigneeId) {
      toast.error("Choose who should own this action first");
      return;
    }

    setAssigningId(finding.id);
    try {
      const response = await clientAuthFetch(
        supabase,
        `/api/ofsted/findings/${finding.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignee_id: assigneeId, organizationId }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Assignment failed");
      }

      toast.success("Ofsted action assigned and added to tasks");
      await loadData();
    } catch (error) {
      console.error("[Ofsted Findings] Assignment failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not assign action",
      );
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/70 bg-card">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
              <ClipboardCheck className="h-4 w-4" />
              Living readiness loop
            </div>
            <CardTitle className="mt-2 text-2xl">
              Ofsted findings and actions
            </CardTitle>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Scanner findings are kept as a live record. Leaders can assign
              actions, staff see them on their dashboard, and re-scans verify
              whether the issue is properly resolved.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryTile label="Active" value={summary.active} />
          <SummaryTile label="Critical" value={summary.critical} danger />
          <SummaryTile label="High" value={summary.high} warning />
          <SummaryTile label="Assigned" value={summary.assigned} />
          <SummaryTile label="Verified" value={summary.verified} success />
          <SummaryTile label="Total" value={summary.total} />
        </div>
      </CardHeader>

      {!compact && (
        <CardContent className="space-y-3">
          {findings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <h3 className="mt-3 font-semibold">No live findings yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Run the website scan to populate readiness findings from the
                statutory website and policy checks.
              </p>
            </div>
          ) : (
            findings.map((finding) => (
              <FindingRow
                key={finding.id}
                finding={finding}
                members={assignableMembers}
                selectedAssignee={selectedAssignees[finding.id] || ""}
                onAssigneeChange={(value) =>
                  setSelectedAssignees((current) => ({
                    ...current,
                    [finding.id]: value,
                  }))
                }
                onAssign={() => assignFinding(finding)}
                assigning={assigningId === finding.id}
              />
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}

function SummaryTile({
  label,
  value,
  danger,
  warning,
  success,
}: {
  label: string;
  value: number;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
}) {
  const colour = danger
    ? "text-rose-600 dark:text-rose-300"
    : warning
      ? "text-amber-600 dark:text-amber-300"
      : success
        ? "text-emerald-600 dark:text-emerald-300"
        : "text-foreground";

  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className={`text-2xl font-black ${colour}`}>{value}</div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function FindingRow({
  finding,
  members,
  selectedAssignee,
  onAssigneeChange,
  onAssign,
  assigning,
}: {
  finding: OfstedFinding;
  members: OrganizationMember[];
  selectedAssignee: string;
  onAssigneeChange: (value: string) => void;
  onAssign: () => void;
  assigning: boolean;
}) {
  const hasTask = Boolean(finding.assigned_task_id);

  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={getFindingBadgeTone(finding.severity)}>
              {finding.severity}
            </Badge>
            <Badge tone={getFindingBadgeTone(finding.action_level)}>
              {finding.action_level.replaceAll("_", " ")}
            </Badge>
            <Badge tone={hasTask ? "emerald" : "slate"}>
              {getFindingStatusLabel(finding.status)}
            </Badge>
            {finding.score !== null && (
              <span className="text-xs font-semibold text-muted-foreground">
                Score {finding.score}%
              </span>
            )}
          </div>

          <h3 className="mt-3 text-base font-bold text-foreground">
            {finding.recommended_task_title || finding.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {finding.summary || "Review the evidence and decide the next step."}
          </p>

          {(finding.red_flags?.length > 0 || finding.gaps?.length > 0) && (
            <div className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4" />
                What needs attention
              </div>
              <ul className="list-disc space-y-1 pl-5">
                {[...(finding.red_flags || []), ...(finding.gaps || [])]
                  .slice(0, 3)
                  .map((item) => (
                    <li key={item}>{item}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <div className="w-full shrink-0 space-y-2 lg:w-72">
          {hasTask ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              Already added to tasks
            </div>
          ) : (
            <>
              <Select value={selectedAssignee} onValueChange={onAssigneeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.user!.id} value={member.user!.id}>
                      {member.user!.display_name || member.user!.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={onAssign} disabled={assigning}>
                {assigning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Assign action
              </Button>
            </>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Ruleset v{finding.rule_version}
          </div>
        </div>
      </div>
    </div>
  );
}
