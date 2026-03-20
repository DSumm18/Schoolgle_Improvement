"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
  Building2,
  Users,
  GraduationCap,
  Cloud,
  AlertTriangle,
  ShieldCheck,
  Scale,
  Heart,
  UserCheck,
  Calendar,
  MessageSquare,
  FileText,
  ClipboardCheck,
  Eye,
  BarChart3,
  Shield,
  ChevronRight,
} from "lucide-react";
import { ShowMeShell, type ShowMeStep } from "@/components/show-me/ShowMeShell";
import { useEdChatbot } from "@/components/EdChatbotProvider";

/**
 * Show Me: Your School
 *
 * Shows ONLY what this school actually has — derived from real data.
 * Never shows aspirational steps or features the school hasn't touched.
 * Grouped into: Organisation, Connected Data Sources, Active Modules.
 */

interface SchoolState {
  orgName: string | null;
  staffCount: number;
  pupilCount: number;
  driveConnected: number;
  riskCount: number;
  complianceCount: number;
  governorCount: number;
  meetingCount: number;
  documentCount: number;
  surveyCount: number;
  actionCount: number;
  attendanceReal: boolean;
  sendReal: boolean;
  behaviourReal: boolean;
  estatesTicketCount: number;
  calendarEventCount: number;
}

export default function ShowMeSetupPage() {
  const { organizationId, organization } = useAuth();
  const { openChatWith } = useEdChatbot();
  const [state, setState] = useState<SchoolState | null>(null);
  const [loading, setLoading] = useState(true);

  const checkState = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token)
      headers["Authorization"] = `Bearer ${session.access_token}`;

    const count = async (url: string, field?: string): Promise<number> => {
      try {
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (field) return (data?.[field] || []).length;
        return (
          data?.count || (Array.isArray(data?.data) ? data.data.length : 0)
        );
      } catch {
        return 0;
      }
    };

    const checkDemo = async (url: string): Promise<boolean> => {
      try {
        const res = await fetch(url, { headers });
        const data = await res.json();
        return !(data?.is_demo || data?.demo);
      } catch {
        return false;
      }
    };

    const [
      staffCount,
      pupilCount,
      driveConnected,
      riskCount,
      complianceCount,
      governorCount,
      meetingCount,
      documentCount,
      surveyCount,
      actionCount,
      attendanceReal,
      sendReal,
      behaviourReal,
      estatesTicketCount,
      calendarEventCount,
    ] = await Promise.all([
      count(`/api/staff?organizationId=${organizationId}`, "staff"),
      count(`/api/pupils?organizationId=${organizationId}`),
      count(
        `/api/data-connections?organizationId=${organizationId}`,
        "connections",
      ),
      count(`/api/risk?organizationId=${organizationId}`, "risks"),
      count(
        `/api/compliance/items?organizationId=${organizationId}&type=policy&limit=1`,
      ),
      count(
        `/api/governance/governors?organizationId=${organizationId}`,
        "governors",
      ),
      count(`/api/meetings?organizationId=${organizationId}`, "meetings"),
      count(`/api/documents?organizationId=${organizationId}`, "documents"),
      count(`/api/surveys?organizationId=${organizationId}`, "surveys"),
      count(`/api/risk?organizationId=${organizationId}`, "risks"),
      checkDemo(`/api/attendance/dashboard?organizationId=${organizationId}`),
      checkDemo(`/api/send/register?organizationId=${organizationId}`),
      checkDemo(`/api/behaviour/incidents?organizationId=${organizationId}`),
      count(
        `/api/estates/helpdesk?organizationId=${organizationId}`,
        "tickets",
      ),
      count(`/api/calendar/events?organizationId=${organizationId}`, "events"),
    ]);

    setState({
      orgName: organization?.name || null,
      staffCount,
      pupilCount,
      driveConnected,
      riskCount,
      complianceCount,
      governorCount,
      meetingCount,
      documentCount,
      surveyCount,
      actionCount,
      attendanceReal,
      sendReal,
      behaviourReal,
      estatesTicketCount,
      calendarEventCount,
    });
    setLoading(false);
  }, [organizationId, organization]);

  useEffect(() => {
    checkState();
  }, [checkState]);

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  // Build steps from REAL school state — only include what exists or is relevant
  const steps: ShowMeStep[] = [];

  // === SECTION: Your Organisation ===
  if (state.orgName) {
    steps.push({
      id: "org",
      title: "Your school",
      description: `${state.orgName}`,
      icon: Building2,
      status: "complete",
      href: "/dashboard",
      detail: {
        whatGoodLooksLike:
          "Your school is registered with Schoolgle and linked to DfE data.",
        nextAction: "Go to dashboard",
        nextActionHref: "/dashboard",
      },
    });
  }

  // === SECTION: Connected Data Sources ===
  // Only show sources that exist or are in progress
  if (state.staffCount > 0) {
    steps.push({
      id: "staff-data",
      title: "Staff data",
      description: `${state.staffCount} staff members connected`,
      icon: Users,
      status: state.staffCount >= 3 ? "complete" : "in_progress",
      href: "/dashboard/hr/people",
      count: state.staffCount,
      detail: {
        whatGoodLooksLike:
          "Your staff list is connected with names, roles, and contact details.",
        whatIsMissing:
          state.staffCount < 3
            ? `Only ${state.staffCount} staff — you may want to connect more.`
            : undefined,
        nextAction: "View staff directory",
        nextActionHref: "/dashboard/hr/people",
      },
    });
  } else {
    steps.push({
      id: "staff-data",
      title: "Staff data",
      description: "No staff data connected yet",
      icon: Users,
      status: "not_started",
      href: "/dashboard/hr/people",
      detail: {
        whatGoodLooksLike:
          "Your staff list is connected — Schoolgle uses this for documents, meetings, and Ed.",
        whatIsMissing:
          "Export your staff list from your MIS or HR system as a CSV and connect it.",
        nextAction: "Connect staff data",
        nextActionHref: "/dashboard/hr/people",
      },
    });
  }

  if (state.pupilCount > 0) {
    steps.push({
      id: "pupil-data",
      title: "Pupil data",
      description: `${state.pupilCount} pupils connected`,
      icon: GraduationCap,
      status: state.pupilCount >= 10 ? "complete" : "in_progress",
      href: "/dashboard/pupils",
      count: state.pupilCount,
      detail: {
        whatGoodLooksLike:
          "Your pupil roll is connected with year groups, classes, and SEN status.",
        whatIsMissing:
          state.pupilCount < 10
            ? `Only ${state.pupilCount} pupils — most schools have more.`
            : undefined,
        nextAction: "View pupil data",
        nextActionHref: "/dashboard/pupils",
      },
    });
  } else {
    steps.push({
      id: "pupil-data",
      title: "Pupil data",
      description: "No pupil data connected yet",
      icon: GraduationCap,
      status: "not_started",
      href: "/dashboard/pupils",
      detail: {
        whatGoodLooksLike:
          "Your pupil roll powers attendance, SEND, and behaviour modules.",
        whatIsMissing:
          "Export your pupil roll from your MIS as a CSV and connect it.",
        nextAction: "Connect pupil data",
        nextActionHref: "/dashboard/pupils",
      },
    });
  }

  if (state.driveConnected > 0) {
    steps.push({
      id: "drive",
      title: "Cloud storage",
      description: "Google Drive connected",
      icon: Cloud,
      status: "complete",
      href: "/dashboard/settings/data-connections",
      count: state.driveConnected,
      detail: {
        whatGoodLooksLike:
          "Your school data folder is linked. Schoolgle reads it for staff, pupil, finance, and assessment files.",
        nextAction: "View connected data",
        nextActionHref: "/dashboard/settings/data-connections",
      },
    });
  }
  // Don't show Drive step if school hasn't connected — they may not use Drive

  // === SECTION: Active Modules ===
  // Only show modules the school has actually used

  if (state.riskCount > 0) {
    steps.push({
      id: "risk",
      title: "Risk Register",
      description: `${state.riskCount} risk${state.riskCount !== 1 ? "s" : ""} recorded`,
      icon: AlertTriangle,
      status: "complete",
      href: "/dashboard/risk",
      count: state.riskCount,
      detail: {
        whatGoodLooksLike:
          "Your risk register is active with scored risks, mitigations, and 4T decisions.",
        nextAction: "View risk register",
        nextActionHref: "/dashboard/risk",
      },
    });
  }

  if (state.complianceCount > 0) {
    steps.push({
      id: "compliance",
      title: "Compliance",
      description: `${state.complianceCount} polic${state.complianceCount !== 1 ? "ies" : "y"} tracked`,
      icon: ShieldCheck,
      status: "complete",
      href: "/dashboard/compliance",
      count: state.complianceCount,
      detail: {
        whatGoodLooksLike:
          "Statutory policies are tracked with review dates, versions, and approval workflows.",
        nextAction: "View compliance hub",
        nextActionHref: "/dashboard/compliance",
      },
    });
  }

  if (state.governorCount > 0) {
    steps.push({
      id: "governance",
      title: "Governance",
      description: `${state.governorCount} governor${state.governorCount !== 1 ? "s" : ""} added`,
      icon: Building2,
      status: "complete",
      href: "/dashboard/governance",
      count: state.governorCount,
      detail: {
        whatGoodLooksLike:
          "Your governing body is set up with training, meetings, and visit planning.",
        nextAction: "View governance portal",
        nextActionHref: "/dashboard/governance",
      },
    });
  }

  if (state.meetingCount > 0) {
    steps.push({
      id: "meetings",
      title: "Meetings",
      description: `${state.meetingCount} meeting${state.meetingCount !== 1 ? "s" : ""} recorded`,
      icon: ClipboardCheck,
      status: "complete",
      href: "/dashboard/hr/meetings",
      count: state.meetingCount,
      detail: {
        whatGoodLooksLike:
          "Meetings have agendas, attendees, minutes, and linked actions.",
        nextAction: "View meetings",
        nextActionHref: "/dashboard/hr/meetings",
      },
    });
  }

  if (state.documentCount > 0) {
    steps.push({
      id: "documents",
      title: "Documents",
      description: `${state.documentCount} document${state.documentCount !== 1 ? "s" : ""} generated`,
      icon: FileText,
      status: "complete",
      href: "/dashboard/documents",
      count: state.documentCount,
      detail: {
        whatGoodLooksLike:
          "Documents are generated from templates with live data from staff, meetings, and school records.",
        nextAction: "View documents",
        nextActionHref: "/dashboard/documents",
      },
    });
  }

  if (state.surveyCount > 0) {
    steps.push({
      id: "surveys",
      title: "Surveys",
      description: `${state.surveyCount} survey${state.surveyCount !== 1 ? "s" : ""} created`,
      icon: MessageSquare,
      status: "complete",
      href: "/dashboard/surveys",
      count: state.surveyCount,
      detail: {
        whatGoodLooksLike:
          "Surveys are distributed and collecting responses with analytics.",
        nextAction: "View surveys",
        nextActionHref: "/dashboard/surveys",
      },
    });
  }

  if (state.estatesTicketCount > 0) {
    steps.push({
      id: "estates",
      title: "Estates",
      description: `${state.estatesTicketCount} helpdesk ticket${state.estatesTicketCount !== 1 ? "s" : ""}`,
      icon: Building2,
      status: "complete",
      href: "/dashboard/estates",
      count: state.estatesTicketCount,
      detail: {
        whatGoodLooksLike:
          "Estates compliance tasks, helpdesk tickets, and evidence are being tracked.",
        nextAction: "View estates",
        nextActionHref: "/dashboard/estates",
      },
    });
  }

  if (state.attendanceReal) {
    steps.push({
      id: "attendance",
      title: "Attendance",
      description: "Real attendance data connected",
      icon: UserCheck,
      status: "complete",
      href: "/dashboard/attendance",
      detail: {
        whatGoodLooksLike:
          "Attendance registers are being marked with real pupil data.",
        nextAction: "View attendance",
        nextActionHref: "/dashboard/attendance",
      },
    });
  }

  if (state.sendReal) {
    steps.push({
      id: "send",
      title: "SEND",
      description: "Real SEND data connected",
      icon: Heart,
      status: "complete",
      href: "/dashboard/send",
      detail: {
        whatGoodLooksLike:
          "SEN register has real pupils with provision mapping and graduated approach tracking.",
        nextAction: "View SEND",
        nextActionHref: "/dashboard/send",
      },
    });
  }

  if (state.behaviourReal) {
    steps.push({
      id: "behaviour",
      title: "Behaviour",
      description: "Real behaviour data connected",
      icon: Scale,
      status: "complete",
      href: "/dashboard/behaviour",
      detail: {
        whatGoodLooksLike:
          "Behaviour incidents are logged with real pupil data and pattern tracking.",
        nextAction: "View behaviour",
        nextActionHref: "/dashboard/behaviour",
      },
    });
  }

  if (state.calendarEventCount > 0) {
    steps.push({
      id: "calendar",
      title: "Calendar",
      description: `${state.calendarEventCount} event${state.calendarEventCount !== 1 ? "s" : ""}`,
      icon: Calendar,
      status: "complete",
      href: "/dashboard/calendar",
      count: state.calendarEventCount,
      detail: {
        whatGoodLooksLike:
          "Term dates, events, and parents' evening slots are set up.",
        nextAction: "View calendar",
        nextActionHref: "/dashboard/calendar",
      },
    });
  }

  // Summary line
  const dataSourceCount = [
    state.staffCount > 0,
    state.pupilCount > 0,
    state.driveConnected > 0,
  ].filter(Boolean).length;

  const activeModuleCount = steps.filter(
    (s) =>
      s.status === "complete" &&
      !["org", "staff-data", "pupil-data", "drive"].includes(s.id),
  ).length;

  return (
    <ShowMeShell
      title={`Show Me: ${state.orgName || "Your School"}`}
      subtitle={`${dataSourceCount} data source${dataSourceCount !== 1 ? "s" : ""} connected · ${activeModuleCount} module${activeModuleCount !== 1 ? "s" : ""} active`}
      steps={steps}
      onAskEd={(step) => {
        const prompt =
          step.status === "not_started"
            ? `Help me get started with ${step.title.toLowerCase()}. What do I need to do?`
            : step.status === "in_progress"
              ? `I have started ${step.title.toLowerCase()} but it is not complete yet. What should I do next?`
              : `Tell me about my ${step.title.toLowerCase()} — is everything looking good?`;
        openChatWith(prompt);
      }}
    >
      {/* Link to other Show Me views */}
      <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
          Other views
        </p>
        <a
          href="/dashboard/show-me/compliance"
          className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group"
        >
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Show Me: Compliance
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Policies, training, SCR, complaints, and estates compliance
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
        </a>
        <a
          href="/dashboard/show-me/site"
          className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group mt-2"
        >
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/20">
            <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Show Me: Site
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Interactive floor plan with tickets, compliance, and evacuation
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
        </a>
      </div>
    </ShowMeShell>
  );
}
