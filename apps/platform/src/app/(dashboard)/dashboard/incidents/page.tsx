"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  UserCheck,
} from "lucide-react";
import useSWR from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

type TimelineEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

type Incident = {
  id?: string;
  ref: string;
  title: string;
  type: string;
  school: string;
  owner: string;
  risk: RiskLevel;
  status: string;
  due: string;
  actions: number;
  documents: number;
  meetings: number;
  reportedBy: string;
  loggedAt: string;
  nextAction: string;
  waitingFor: string;
  timeline: TimelineEntry[];
};

type ApiChronologyEntry = {
  id: string;
  created_at: string;
  actor_name?: string | null;
  action: string;
  detail?: string | null;
};

type ApiIncident = {
  id: string;
  reference: string;
  title: string;
  summary?: string | null;
  type: string;
  status: string;
  risk_level: "low" | "medium" | "high" | "critical";
  owner_label?: string | null;
  reported_by_name?: string | null;
  logged_at: string;
  due_at?: string | null;
  waiting_for?: string | null;
  next_action?: string | null;
  recommended_document_name?: string | null;
  chronology?: ApiChronologyEntry[];
};

type ConnectorType = {
  id: string;
  name: string;
  slug: string;
  category: string;
  ratio_label?: string | null;
  statutory_basis?: string | null;
};

type ConnectorAssignment = {
  id: string;
  connector_type_id: string;
  staff_name?: string | null;
  coverage_area?: string | null;
  staff?: {
    id: string;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    job_title?: string | null;
    email?: string | null;
  } | null;
};

type ResolvedConnector = {
  connector_type: ConnectorType;
  assignments: ConnectorAssignment[];
  is_configured: boolean;
};

const incidentTypes = [
  "Pupil accident",
  "Safeguarding concern",
  "GDPR incident",
  "Estates hazard",
  "Contractor issue",
  "HR conduct",
  "Parent complaint",
  "Behaviour incident",
];

const owners = ["DSL", "Office Manager", "Estates Lead", "DPO", "HR Lead", "Headteacher"];
const severities = ["Low", "Medium", "High", "Critical"] as const;

const INCIDENT_CONNECTOR_SLUGS = [
  "dsl",
  "deputy-dsl",
  "dpo",
  "senco",
  "first-aider",
  "paediatric-first-aider",
  "health-safety-lead",
  "site-manager",
  "fire-marshal",
] as const;

const playbookSteps = [
  "Register incident",
  "Risk score",
  "Assign owner",
  "Create tasks",
  "Generate documents",
  "Launch meeting",
  "Close with evidence",
];

function riskClasses(risk: RiskLevel) {
  if (risk === "Critical") return "bg-red-600 text-white shadow-red-500/30";
  if (risk === "High") return "bg-orange-500 text-white shadow-orange-500/30";
  if (risk === "Medium") {
    return "bg-amber-300 text-slate-950 shadow-amber-500/20";
  }
  return "bg-emerald-500 text-white shadow-emerald-500/20";
}

function currentStamp() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function createIncidentRef(existingCount: number) {
  const year = new Date().getFullYear();
  return `INC-${year}-${String(existingCount + 1).padStart(4, "0")}`;
}

function titleCaseRisk(risk: ApiIncident["risk_level"]): RiskLevel {
  if (risk === "critical") return "Critical";
  if (risk === "high") return "High";
  if (risk === "low") return "Low";
  return "Medium";
}

function formatStamp(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normaliseStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function dueLabel(value?: string | null) {
  if (!value) return "No due date";
  const due = new Date(value);
  const today = new Date();
  const diff = Math.ceil(
    (due.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return "Today";
  if (diff === 1) return "1 day";
  return `${diff} days`;
}

function mapApiIncident(incident: ApiIncident): Incident {
  return {
    id: incident.id,
    ref: incident.reference,
    title: incident.title,
    type: incident.type,
    school: "",
    owner: incident.owner_label || "Unassigned",
    risk: titleCaseRisk(incident.risk_level),
    status: normaliseStatus(incident.status),
    due: dueLabel(incident.due_at),
    actions: 0,
    documents: incident.recommended_document_name ? 1 : 0,
    meetings: 0,
    reportedBy: incident.reported_by_name || "Signed-in user",
    loggedAt: formatStamp(incident.logged_at),
    nextAction: incident.next_action || recommendedNextAction(incident.type),
    waitingFor: incident.waiting_for || incident.owner_label || "Owner",
    timeline: (incident.chronology || []).map((entry) => ({
      id: entry.id,
      at: formatStamp(entry.created_at),
      actor: entry.actor_name || "System",
      action: entry.action,
      detail: entry.detail || "",
    })),
  };
}

function recommendedOwner(type: string) {
  if (type.includes("Safeguarding") || type.includes("Behaviour")) return "DSL";
  if (type.includes("GDPR")) return "DPO";
  if (type.includes("Estates") || type.includes("Contractor")) return "Estates Lead";
  if (type.includes("HR")) return "HR Lead";
  return "Office Manager";
}

function connectorSlugsForIncident(type: string) {
  if (type.includes("Safeguarding") || type.includes("Behaviour")) {
    return ["dsl", "deputy-dsl"];
  }
  if (type.includes("GDPR")) return ["dpo"];
  if (type.includes("Pupil accident")) {
    return ["first-aider", "paediatric-first-aider"];
  }
  if (type.includes("Estates") || type.includes("Contractor")) {
    return ["site-manager", "health-safety-lead", "fire-marshal"];
  }
  return [];
}

function staffDisplayName(assignment: ConnectorAssignment) {
  if (assignment.staff?.display_name) return assignment.staff.display_name;
  const joined = [assignment.staff?.first_name, assignment.staff?.last_name]
    .filter(Boolean)
    .join(" ");
  return joined || assignment.staff_name || "";
}

function ownerOptionsForIncident(
  type: string,
  resolvedConnectors: ResolvedConnector[],
) {
  const slugs = connectorSlugsForIncident(type);
  const options = slugs.flatMap((slug) => {
    const connector = resolvedConnectors.find(
      (item) => item.connector_type.slug === slug,
    );
    if (!connector) return [];

    if (connector.assignments.length === 0) {
      return [
        {
          label: `${connector.connector_type.name} (not assigned)`,
          value: connector.connector_type.name,
          connector,
          assignment: null as ConnectorAssignment | null,
        },
      ];
    }

    return connector.assignments.map((assignment) => {
      const name = staffDisplayName(assignment);
      return {
        label: name
          ? `${name} · ${connector.connector_type.name}`
          : connector.connector_type.name,
        value: name || connector.connector_type.name,
        connector,
        assignment,
      };
    });
  });

  return options.length > 0
    ? options
    : owners.map((owner) => ({
        label: owner,
        value: owner,
        connector: null as ResolvedConnector | null,
        assignment: null as ConnectorAssignment | null,
      }));
}

function recommendedNextAction(type: string) {
  if (type.includes("Pupil accident")) return "Complete accident form";
  if (type.includes("Safeguarding")) return "Complete DSL triage note";
  if (type.includes("GDPR")) return "Complete data incident assessment";
  if (type.includes("Estates")) return "Create linked estates helpdesk ticket";
  if (type.includes("Contractor")) return "Pause works and collect contractor evidence";
  if (type.includes("HR")) return "Create fact-finding meeting";
  return "Assign owner and complete initial review";
}

function inferIncidentType(text: string) {
  const value = text.toLowerCase();
  if (
    /\b(fell|fallen|fall|tripped|slipped|hurt|injur|banged|cut|bleeding|first aid|playground|yard)\b/.test(
      value,
    )
  ) {
    return "Pupil accident";
  }
  if (/\b(disclosure|dsl|safeguard|concern|neglect|abuse|missing|left site)\b/.test(value)) {
    return "Safeguarding concern";
  }
  if (/\b(email|data|gdpr|breach|wrong parent|personal data|information)\b/.test(value)) {
    return "GDPR incident";
  }
  if (/\b(contractor|asbestos|permit|rams|works|unsafe work)\b/.test(value)) {
    return "Contractor issue";
  }
  if (/\b(site|premises|hazard|broken|leak|fire|water|gate|fence)\b/.test(value)) {
    return "Estates hazard";
  }
  return "";
}

function recommendedDocument(type: string) {
  if (type === "Pupil accident") {
    return {
      name: "Pupil Accident / First Aid Report",
      slug: "pupil-accident-first-aid-report",
      reason:
        "The wording suggests a pupil injury or first aid event, so the accident report should be completed before closure.",
    };
  }
  if (type === "GDPR incident") {
    return {
      name: "Data Protection Incident Record",
      slug: "data-protection-incident-record",
      reason:
        "The wording suggests a possible data incident, so the DPO should assess and record containment, risk and next steps.",
    };
  }
  if (type === "Contractor issue") {
    return {
      name: "Contractor Unsafe Work Record",
      slug: "contractor-unsafe-work-record",
      reason:
        "The wording suggests contractor control concerns, so evidence and agreed controls should be recorded.",
    };
  }
  return null;
}

function guidedQuestions(type: string) {
  if (type.includes("Pupil accident")) {
    return [
      "Who was injured?",
      "Where exactly did it happen?",
      "What first aid was given?",
      "Were parents/carers informed?",
      "Did equipment or site condition contribute?",
    ];
  }
  if (type.includes("Safeguarding")) {
    return [
      "Is the child safe now?",
      "Who has been informed?",
      "What was seen/heard directly?",
      "Are there witnesses?",
      "Does the DSL need immediate escalation?",
    ];
  }
  if (type.includes("GDPR")) {
    return [
      "What data was involved?",
      "Who received or accessed it?",
      "Has containment happened?",
      "Could anyone be harmed by the breach?",
      "Does the DPO need same-day review?",
    ];
  }
  if (type.includes("Estates") || type.includes("Contractor")) {
    return [
      "Is the area safe and isolated?",
      "Who is the contractor or responsible person?",
      "What evidence is needed?",
      "Has work been paused if needed?",
      "Does this create a compliance risk?",
    ];
  }
  if (type.includes("HR")) {
    return [
      "Who is involved?",
      "Is this fact-finding or formal action?",
      "Is immediate support needed?",
      "Are there witnesses or documents?",
      "Should a meeting be created?",
    ];
  }
  return [
    "What happened?",
    "Who was involved?",
    "What immediate action was taken?",
    "Who needs to know?",
    "What is still outstanding?",
  ];
}

export default function IncidentHubPage() {
  const { organization, organizationId, displayName, user, session } = useAuth();
  const organizationName = organization?.name || "Your school";
  const reporterName = displayName || user?.email || "Signed-in user";
  const brandingUrl = organizationId
    ? `/api/settings/branding?organizationId=${organizationId}`
    : null;
  const { data: brandingData } = useSWR(
    user && brandingUrl ? brandingUrl : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  const schoolLogo = brandingData?.settings?.logo_url as string | undefined;
  const schoolPrimary = (brandingData?.settings?.primary_color as string) || "#0f766e";
  const { data: connectorData } = useSWR(
    user && organizationId
      ? `/api/connectors/resolve?organizationId=${organizationId}&slugs=${INCIDENT_CONNECTOR_SLUGS.join(",")}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  const resolvedConnectors = (connectorData?.connectors || []) as ResolvedConnector[];
  const authHeaders = useMemo(
    () =>
      session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    [session?.access_token],
  );

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedRef, setSelectedRef] = useState("");
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [incidentError, setIncidentError] = useState("");
  const [savingIncident, setSavingIncident] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [form, setForm] = useState({
    type: "Pupil accident",
    school: organizationName,
    title: "",
    summary: "",
    severity: "Medium" as RiskLevel,
    owner: "Office Manager",
    due: "Today",
  });
  const [note, setNote] = useState("");
  const [newOwner, setNewOwner] = useState("DSL");

  const combinedIncidentText = `${form.title} ${form.summary}`;
  const inferredType = inferIncidentType(combinedIncidentText);
  const recommendedType = inferredType || form.type;
  const documentRecommendation = recommendedDocument(recommendedType);
  const ownerOptions = ownerOptionsForIncident(recommendedType, resolvedConnectors);
  const selectedOwner =
    ownerOptions.find((option) => option.value === form.owner) || ownerOptions[0];
  const ownerOptionValues = ownerOptions.map((option) => option.value).join("|");
  const canCreateIncident = Boolean(form.title.trim()) && !savingIncident;

  useEffect(() => {
    const values = ownerOptionValues.split("|").filter(Boolean);
    if (values.length > 0 && !values.includes(form.owner)) {
      setForm((current) => ({ ...current, owner: values[0] }));
    }
  }, [form.owner, ownerOptionValues]);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    setLoadingIncidents(true);
    setIncidentError("");

    fetch(`/api/incidents?organizationId=${organizationId}`, {
      headers: authHeaders,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const mapped = (data.incidents || []).map(mapApiIncident);
        setIncidents(mapped);
        setSelectedRef((current) => current || mapped[0]?.ref || "");
      })
      .catch((error) => {
        if (!cancelled) {
          setIncidentError(
            error instanceof Error ? error.message : "Failed to load incidents",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingIncidents(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authHeaders, organizationId]);

  const selectedIncident =
    incidents.find((incident) => incident.ref === selectedRef) ?? incidents[0];

  const incidentSchool = (incident: Incident) => incident.school || organizationName;

  const filteredIncidents = incidents.filter((incident) => {
      const schoolName = incident.school || organizationName;
    const matchesSearch =
      `${incident.title} ${incident.type} ${schoolName} ${incident.owner}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || incident.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const openCount = incidents.length;
  const highCount = incidents.filter((incident) =>
    ["High", "Critical"].includes(incident.risk),
  ).length;
  const outstandingActions = incidents.reduce(
    (total, incident) => total + incident.actions,
    0,
  );
  const awaitingApproval = incidents.filter((incident) =>
    ["Trust visible", "Trust Visible", "Awaiting decision", "In review"].includes(
      incident.status,
    ),
  ).length;
  const documentsCreated = incidents.reduce(
    (total, incident) => total + incident.documents,
    0,
  );

  const summaryCards = [
    {
      label: "Open incidents",
      value: String(openCount),
      detail: `${highCount} high priority`,
      icon: Siren,
      accent: "from-rose-500 to-orange-500",
    },
    {
      label: "Outstanding actions",
      value: String(outstandingActions),
      detail: "Dashboard-owned",
      icon: ClipboardList,
      accent: "from-amber-500 to-yellow-400",
    },
    {
      label: "Awaiting approval",
      value: String(awaitingApproval),
      detail: "Leader review",
      icon: UserCheck,
      accent: "from-blue-500 to-cyan-400",
    },
    {
      label: "Documents created",
      value: String(documentsCreated),
      detail: "Linked evidence",
      icon: FileText,
      accent: "from-violet-500 to-fuchsia-500",
    },
  ];

  function updateFormType(type: string) {
    setForm((current) => ({
      ...current,
      type,
      owner: recommendedOwner(type),
    }));
    setShowForm(true);
  }

  async function createIncident() {
    if (!form.title.trim()) return;

    if (!organizationId) {
      setIncidentError("No organisation context available.");
      return;
    }

    setSavingIncident(true);
    setIncidentError("");
    try {
      const incidentType = recommendedType;
      const incidentOwner =
        inferredType && inferredType !== form.type
          ? selectedOwner?.value || recommendedOwner(inferredType)
          : form.owner;
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          organizationId,
          title: form.title.trim(),
          summary: form.summary.trim(),
          type: incidentType,
          risk_level: form.severity.toLowerCase(),
          owner_label: incidentOwner,
          due_label: form.due,
          waiting_for: incidentOwner,
          next_action: recommendedNextAction(incidentType),
          reported_by_name: reporterName,
          recommended_document_slug: documentRecommendation?.slug,
          recommended_document_name: documentRecommendation?.name,
          metadata: {
            connector_slug: selectedOwner?.connector?.connector_type.slug,
            connector_name: selectedOwner?.connector?.connector_type.name,
            connector_assignment_id: selectedOwner?.assignment?.id,
            connector_staff_id: selectedOwner?.assignment?.staff?.id,
          },
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const savedIncident = data.incident
        ? mapApiIncident(data.incident)
        : {
            ref: createIncidentRef(incidents.length),
            title: form.title.trim(),
            type: incidentType,
            school: organizationName,
            owner: incidentOwner,
            risk: form.severity,
            status: form.severity === "Critical" ? "Trust visible" : "New",
            due: form.due,
            actions:
              form.severity === "Critical" ? 6 : form.severity === "High" ? 4 : 3,
            documents: documentRecommendation ? 1 : 0,
            meetings: form.severity === "Critical" || incidentType.includes("HR") ? 1 : 0,
            reportedBy: reporterName,
            loggedAt: currentStamp(),
            nextAction: recommendedNextAction(incidentType),
            waitingFor: incidentOwner,
            timeline: [],
          };

      setIncidents((current) => [savedIncident, ...current]);
      setSelectedRef(savedIncident.ref);
      setNewOwner(savedIncident.owner);
      setShowForm(false);
      setForm({
        type: "Pupil accident",
        school: organizationName,
        title: "",
        summary: "",
        severity: "Medium",
        owner: "Office Manager",
        due: "Today",
      });
    } catch (error) {
      setIncidentError(
        error instanceof Error ? error.message : "Failed to create incident",
      );
    } finally {
      setSavingIncident(false);
    }
  }

  async function addNote() {
    if (!selectedIncident || !note.trim()) return;
    if (!selectedIncident.id || !organizationId) {
      setIncidentError("Save the incident before adding notes.");
      return;
    }

    try {
      const response = await fetch(`/api/incidents/${selectedIncident.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          organizationId,
          note: note.trim(),
          actor_name: reporterName,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const apiEntry = data.chronologyEntry as ApiChronologyEntry;
      const entry: TimelineEntry = {
        id: apiEntry.id,
        at: formatStamp(apiEntry.created_at),
        actor: apiEntry.actor_name || reporterName,
        action: apiEntry.action,
        detail: apiEntry.detail || note.trim(),
      };
      setIncidents((current) =>
        current.map((incident) =>
          incident.ref === selectedIncident.ref
            ? { ...incident, timeline: [entry, ...incident.timeline] }
            : incident,
        ),
      );
      setNote("");
      return;
    } catch (error) {
      setIncidentError(
        error instanceof Error ? error.message : "Failed to add note",
      );
      return;
    }
  }

  function reassignIncident() {
    if (!selectedIncident) return;
    if (!selectedIncident.id || !organizationId) return;

    fetch(`/api/incidents/${selectedIncident.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        organizationId,
        owner_label: newOwner,
        waiting_for: newOwner,
        status: "assigned",
        actor_name: reporterName,
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then((data) => {
        const savedIncident = mapApiIncident(data.incident);
        setIncidents((current) =>
          current.map((incident) =>
            incident.ref === selectedIncident.ref ? savedIncident : incident,
          ),
        );
      })
      .catch((error) => {
        setIncidentError(
          error instanceof Error ? error.message : "Failed to reassign incident",
        );
      });
  }

  function applyInferredType(type: string) {
    setForm((current) => ({
      ...current,
      type,
      owner: recommendedOwner(type),
      severity: type === "Safeguarding concern" ? "High" : current.severity,
    }));
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-slate-950 dark:bg-[#050812] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div className="relative border-t-4 p-8 sm:p-10" style={{ borderColor: schoolPrimary }}>
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-slate-200/50 blur-3xl dark:bg-slate-700/20" />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/10">
                    {schoolLogo ? (
                      <Image
                        src={schoolLogo}
                        alt={`${organizationName} logo`}
                        width={56}
                        height={56}
                        unoptimized
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ShieldCheck className="h-8 w-8 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                      Incident control
                    </span>
                    <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {organizationName}
                    </p>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                    Incident Hub
                  </h1>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                    Raise an incident quickly for {organizationName}. It stays
                    locked to your school context, creates an audit trail, and
                    routes the next action to the right person.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowForm((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                  >
                    <Plus className="h-4 w-4" />
                    Report incident
                  </button>
                  <button
                    onClick={() => updateFormType("Pupil accident")}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                    Guided capture
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-black/20">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      Live assurance
                    </p>
                    <h2 className="mt-1 text-xl font-black">
                      Serious incident workflow
                    </h2>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="space-y-3">
                  {playbookSteps.map((step, index) => (
                    <div
                      key={step}
                      className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-white/10"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        {index + 1}
                      </span>
                      <span className="font-semibold">{step}</span>
                      {index < 3 ? (
                        <Clock className="ml-auto h-4 w-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {showForm ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (canCreateIncident) void createIncident();
            }}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                  Report incident
                </p>
                <h2 className="text-2xl font-black">Quick capture form</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  This creates the register entry for {organizationName}, logs
                  who raised it, suggests the owner and starts the audit trail.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-white/10"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="space-y-2 text-sm font-bold">
                Incident type
                <select
                  value={form.type}
                  onChange={(event) => updateFormType(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-black/20"
                >
                  {incidentTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold">
                School context
                <input
                  value={organizationName}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                />
              </label>
              <label className="space-y-2 text-sm font-bold">
                Suggested risk
                <select
                  value={form.severity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      severity: event.target.value as RiskLevel,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-black/20"
                >
                  {severities.map((severity) => (
                    <option key={severity}>{severity}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold lg:col-span-2">
                Incident headline / what happened?
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Charlie fell in the playground and needed first aid"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-black/20"
                />
              </label>
              <label className="space-y-2 text-sm font-bold">
                Allocate to
                <select
                  value={form.owner}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      owner: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-black/20"
                >
                  {ownerOptions.map((owner) => (
                    <option key={owner.label} value={owner.value}>
                      {owner.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold lg:col-span-2">
                Initial note
                <textarea
                  value={form.summary}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  placeholder="Add key facts, immediate action taken, who was informed, and anything still outstanding."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-black/20"
                />
              </label>
              <label className="space-y-2 text-sm font-bold">
                Due
                <select
                  value={form.due}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      due: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-black/20"
                >
                  <option>Today</option>
                  <option>1 day</option>
                  <option>2 days</option>
                  <option>5 days</option>
                </select>
              </label>
            </div>

            {inferredType && inferredType !== form.type ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-400/20 dark:bg-amber-400/10">
                <p className="font-black text-amber-900 dark:text-amber-100">
                  This sounds like a {inferredType.toLowerCase()}.
                </p>
                <p className="mt-1 text-amber-800 dark:text-amber-100/80">
                  I will save it as {inferredType.toLowerCase()}, assign it to{" "}
                  {selectedOwner?.label || recommendedOwner(inferredType)}, and ask the right questions
                  for that report unless you change the type.
                </p>
                <button
                  type="button"
                  onClick={() => applyInferredType(inferredType)}
                  className="mt-3 rounded-xl bg-amber-900 px-4 py-2 text-xs font-black text-white dark:bg-amber-200 dark:text-amber-950"
                >
                  Use {inferredType}
                </button>
              </div>
            ) : null}

            {connectorSlugsForIncident(recommendedType).length > 0 ? (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-400/20 dark:bg-blue-400/10">
                <p className="font-black text-blue-950 dark:text-blue-100">
                  Responsibility routing
                </p>
                <p className="mt-1 text-blue-900 dark:text-blue-100/80">
                  This incident type is linked to Staff Connectors, so it can
                  route to the live person holding the right school role rather
                  than a hardcoded label.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ownerOptions.map((owner) => (
                    <span
                      key={owner.label}
                      className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-800 shadow-sm dark:bg-white/10 dark:text-blue-100"
                    >
                      {owner.label}
                    </span>
                  ))}
                </div>
                {ownerOptions.some((owner) => !owner.assignment && owner.connector) ? (
                  <p className="mt-3 text-xs font-semibold text-blue-900 dark:text-blue-100">
                    Setup gap: one or more matching connector roles has no staff
                    member assigned yet.
                  </p>
                ) : null}
              </div>
            ) : null}

            {documentRecommendation ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-400/20 dark:bg-emerald-400/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black text-emerald-900 dark:text-emerald-100">
                      Recommended report form
                    </p>
                    <p className="mt-1 font-bold text-emerald-800 dark:text-emerald-100">
                      {documentRecommendation.name}
                    </p>
                    <p className="mt-1 text-emerald-800 dark:text-emerald-100/80">
                      {documentRecommendation.reason}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/documents/new?templateId=${documentRecommendation.slug}`}
                    className="shrink-0 rounded-xl bg-emerald-900 px-4 py-2 text-xs font-black text-white dark:bg-emerald-200 dark:text-emerald-950"
                  >
                    Open form
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/20">
              <p className="text-sm font-black">Helpful prompts for this incident</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                These are the questions the guided capture should ask next, so
                the report is useful and not half-empty.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {guidedQuestions(recommendedType).map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        summary: current.summary
                          ? `${current.summary}\n${question}: `
                          : `${question}: `,
                      }))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!canCreateIncident}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:bg-rose-400 dark:text-slate-950 dark:hover:bg-rose-300 dark:disabled:bg-white/10 dark:disabled:text-white/40"
              >
                <Siren className="h-4 w-4" />
                {savingIncident ? "Saving incident..." : "Create incident"}
              </button>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {form.title.trim()
                  ? `Audit log will record ${reporterName} and the timestamp.`
                  : "Add the incident headline first, then this will create the live register entry."}
              </p>
            </div>
          </form>
        ) : null}

        {incidentError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {incidentError}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                >
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-black">{card.value}</p>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-300">
                    {card.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                  Central register
                </p>
                <h2 className="mt-1 text-2xl font-black">Open incidents</h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-black/20 dark:text-slate-300">
                  <Search className="h-4 w-4" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search"
                    className="w-32 bg-transparent outline-none placeholder:text-slate-400"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold dark:border-white/10 dark:bg-white/10">
                  <Filter className="h-4 w-4" />
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="bg-transparent outline-none"
                  >
                    <option>All</option>
                    {incidentTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              {loadingIncidents ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-black/20">
                  <Clock className="mx-auto h-10 w-10 animate-pulse text-slate-400" />
                  <h3 className="mt-4 text-xl font-black">
                    Loading incidents
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Checking the live register for {organizationName}.
                  </p>
                </div>
              ) : null}

              {!loadingIncidents && filteredIncidents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-white/15 dark:bg-black/20">
                  <Siren className="mx-auto h-10 w-10 text-slate-400" />
                  <h3 className="mt-4 text-xl font-black">
                    No incidents logged yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                    This register will show incidents for {organizationName}.
                    Start with a quick report, then assign ownership, notes,
                    documents, meetings and follow-up tasks from the incident.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950"
                  >
                    <Plus className="h-4 w-4" />
                    Report first incident
                  </button>
                </div>
              ) : null}

              {filteredIncidents.map((incident) => (
                <button
                  key={incident.ref}
                  onClick={() => {
                    setSelectedRef(incident.ref);
                    setNewOwner(incident.owner);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    selectedIncident?.ref === incident.ref
                      ? "border-slate-400 bg-slate-100 dark:border-white/30 dark:bg-white/10"
                      : "border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-black/20"
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                          {incident.ref}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black shadow-lg ${riskClasses(
                            incident.risk,
                          )}`}
                        >
                          {incident.risk}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {incident.type}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-black">
                        {incident.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {incidentSchool(incident)} · Owner: {incident.owner} · Waiting
                        for: {incident.waitingFor} · Due: {incident.due}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full bg-white px-3 py-2 font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {incident.actions} tasks
                      </span>
                      <span className="rounded-full bg-white px-3 py-2 font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {incident.documents} docs
                      </span>
                      <span className="rounded-full bg-white px-3 py-2 font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {incident.meetings} meetings
                      </span>
                      <span className="rounded-full bg-slate-950 p-2 text-white dark:bg-white dark:text-slate-950">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            {selectedIncident ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                  Incident detail
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {selectedIncident.ref}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                  Logged by {selectedIncident.reportedBy} at{" "}
                  {selectedIncident.loggedAt}.
                </p>

                <div className="mt-5 grid gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-black/20">
                    <p className="font-black">Next action</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">
                      {selectedIncident.nextAction}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-black/20">
                    <p className="font-black">Where it is sat</p>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">
                      With {selectedIncident.owner}, waiting for{" "}
                      {selectedIncident.waitingFor}. Due {selectedIncident.due}.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-white/10">
                  <label className="text-sm font-black">Reallocate owner</label>
                  <div className="mt-2 flex gap-2">
                    <select
                      value={newOwner}
                      onChange={(event) => setNewOwner(event.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/20"
                    >
                      {[...new Set([...owners, selectedIncident.owner])].map((owner) => (
                        <option key={owner}>{owner}</option>
                      ))}
                    </select>
                    <button
                      onClick={reassignIncident}
                      className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white dark:bg-white dark:text-slate-950"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-white/10">
                  <label className="text-sm font-black">Add note</label>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    placeholder="Add an update, phone call note, decision, evidence gap or next step..."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-black/20"
                  />
                  <button
                    onClick={addNote}
                    disabled={!note.trim()}
                    className="mt-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                  >
                    Add to audit trail
                  </button>
                </div>

                <div className="mt-5">
                  <h3 className="text-sm font-black">Audit trail</h3>
                  <div className="mt-3 space-y-3">
                    {selectedIncident.timeline.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-black/20"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-black">{entry.action}</span>
                          <span className="text-xs text-slate-400">
                            {entry.at}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {entry.actor}
                        </p>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                          {entry.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                  Incident detail
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Select or create an incident
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                  Once an incident exists, this panel shows who logged it, who
                  owns it, how long it has been waiting, notes, audit trail,
                  tasks, documents and linked meetings.
                </p>
              </div>
            )}

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                Smart capture
              </p>
              <h2 className="mt-2 text-2xl font-black">Start from the event</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                Pick the type and the form opens with the likely owner and next
                action. This is where voice-guided Ed capture will sit.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {incidentTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => updateFormType(type)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-bold transition hover:border-slate-400 hover:bg-slate-100 dark:border-white/10 dark:bg-black/20 dark:hover:bg-white/10"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm dark:border-white/10">
              <AlertTriangle className="h-8 w-8 text-amber-300" />
              <h2 className="mt-4 text-2xl font-black">
                Evidence trail, not inbox chaos.
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Every note, task, document, meeting and approval is attached to
                the incident chronology so leaders can see the full story.
              </p>
              <div className="mt-5 space-y-2 text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-rose-200" />
                  Document Hub forms and letters
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-rose-200" />
                  Meeting Companion minutes
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-rose-200" />
                  Dashboard tasks and reminders
                </div>
              </div>
            </div>
          </aside>
        </section>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
          Live register: incidents are saved to the database for{" "}
          {organizationName}, with the reporter, owner, recommended document and
          chronology attached. See{" "}
          <Link
            href="/dashboard/documents"
            className="font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-100"
          >
            Document Management
          </Link>{" "}
          as the connected document area.
        </div>
      </div>
    </div>
  );
}
