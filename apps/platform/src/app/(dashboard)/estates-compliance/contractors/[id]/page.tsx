"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  FileText,
  Mail,
  Phone,
  PoundSterling,
  ShieldCheck,
  Ticket,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import type { Contractor } from "@/types/estates-compliance";
import type {
  ContractorHistory,
  ContractorHistoryItem,
} from "@/lib/estates-compliance/contractor-history";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = value.split("T")[0];
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function statusClass(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "restricted":
      return "bg-red-100 text-red-800 border-red-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-amber-100 text-amber-800 border-amber-200";
  }
}

function riskClass(risk: ContractorHistoryItem["riskLevel"]) {
  switch (risk) {
    case "high":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

export default function ContractorDetailPage() {
  const params = useParams();
  const contractorId = params.id as string;
  const { session } = useAuth();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [history, setHistory] = useState<ContractorHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!session?.access_token || !contractorId) return;
      setLoading(true);
      setError(null);

      try {
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const [contractorRes, historyRes] = await Promise.all([
          fetch(`/api/estates/contractors/${contractorId}`, { headers }),
          fetch(`/api/estates/contractors/${contractorId}/history`, {
            headers,
          }),
        ]);

        if (!contractorRes.ok) throw new Error("Failed to load contractor");
        if (!historyRes.ok) throw new Error("Failed to load contractor history");

        const contractorBody = await contractorRes.json();
        const historyBody = await historyRes.json();

        if (!cancelled) {
          setContractor(contractorBody.data || null);
          setHistory(historyBody.history || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [contractorId, session?.access_token]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading contractor history...
        </div>
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="p-6">
        <Link
          href="/estates-compliance/contractors"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contractors
        </Link>
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          {error || "Contractor not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/estates-compliance/contractors"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contractors
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                {contractor.company_name}
              </h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(contractor.status)}`}
              >
                {contractor.status.replace("_", " ")}
              </span>
              {contractor.preferred && (
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                  Preferred
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/estates-compliance/contractors/${contractor.id}/edit`}
            className="rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Edit Contractor
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Contact" icon={<Phone className="h-4 w-4" />}>
          <InfoLine label="Name" value={contractor.contact_name || "—"} />
          <InfoLine label="Phone" value={contractor.phone || contractor.mobile || "—"} />
          <InfoLine label="Email" value={contractor.email || "—"} mailto />
        </InfoCard>
        <InfoCard title="Compliance Docs" icon={<ShieldCheck className="h-4 w-4" />}>
          <InfoLine
            label="Accreditations"
            value={(contractor.accreditations?.length || 0).toString()}
          />
          <InfoLine
            label="Insurance docs"
            value={(contractor.insurance_certificates?.length || 0).toString()}
          />
          <InfoLine
            label="Safeguarding docs"
            value={(contractor.safeguarding_docs?.length || 0).toString()}
          />
        </InfoCard>
        <InfoCard title="Services" icon={<Wrench className="h-4 w-4" />}>
          {contractor.services?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {contractor.services.map((service) => (
                <span
                  key={service.service_type}
                  className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  {service.service_type.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No services recorded.</p>
          )}
        </InfoCard>
      </div>

      {history && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MetricCard label="Spend" value={formatCurrency(history.metrics.totalSpend)} />
            <MetricCard label="Contracts" value={history.metrics.activeContracts.toString()} />
            <MetricCard label="Renewals" value={history.metrics.renewalsDueSoon.toString()} />
            <MetricCard label="Services" value={history.metrics.serviceVisits.toString()} />
            <MetricCard label="Tickets" value={history.metrics.ticketCount.toString()} />
            <MetricCard label="Open" value={history.metrics.openTickets.toString()} />
          </div>

          {history.risks.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                Relationship risks to review
              </h2>
              <ul className="mt-2 space-y-1">
                {history.risks.map((risk) => (
                  <li key={risk} className="text-sm text-amber-800 dark:text-amber-200">
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <CalendarClock className="h-5 w-5 text-primary" />
                Relationship timeline
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Contracts, service visits, tickets, costs, and risk signals in one place.
              </p>
            </div>
            {history.timeline.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No relationship history recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {history.timeline.map((item) => (
                  <TimelineItem key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        {icon}
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoLine({
  label,
  value,
  mailto,
}: {
  label: string;
  value: string;
  mailto?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {mailto && value !== "—" ? (
        <a
          href={`mailto:${value}`}
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <Mail className="h-3.5 w-3.5" />
          {value}
        </a>
      ) : (
        <span className="font-medium text-foreground">{value}</span>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function TimelineItem({ item }: { item: ContractorHistoryItem }) {
  const icon =
    item.type === "contract" ? (
      <FileText className="h-4 w-4" />
    ) : item.type === "service" ? (
      <BadgeCheck className="h-4 w-4" />
    ) : (
      <Ticket className="h-4 w-4" />
    );

  return (
    <div className="flex gap-3 p-4">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${riskClass(item.riskLevel)}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
            {typeof item.cost === "number" && item.cost > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                <PoundSterling className="h-3 w-3" />
                {formatCurrency(item.cost)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
