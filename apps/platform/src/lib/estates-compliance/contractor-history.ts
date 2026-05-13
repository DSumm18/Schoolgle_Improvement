export interface ContractorHistoryContract {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date?: string | null;
  renewal_date?: string | null;
  annual_cost?: number | null;
  compliance_domains?: string[] | null;
}

export interface ContractorHistoryServiceRecord {
  id: string;
  service_date: string;
  service_type: string;
  compliance_domain?: string | null;
  total_cost?: number | null;
  overall_result?: string | null;
  asset_count?: number | null;
}

export interface ContractorHistoryTicket {
  id: string;
  ticket_number?: string | null;
  title: string;
  priority?: string | null;
  status?: string | null;
  created_at: string;
  actual_cost?: number | null;
  estimated_cost?: number | null;
}

export interface BuildContractorHistoryInput {
  contractorId: string;
  contractorStatus?: string;
  contracts: ContractorHistoryContract[];
  serviceRecords: ContractorHistoryServiceRecord[];
  tickets: ContractorHistoryTicket[];
  now?: Date;
}

export interface ContractorHistoryItem {
  id: string;
  type: "contract" | "service" | "ticket";
  date: string;
  title: string;
  detail: string;
  status?: string | null;
  cost?: number | null;
  riskLevel: "low" | "medium" | "high";
}

export interface ContractorHistory {
  contractorId: string;
  metrics: {
    activeContracts: number;
    renewalsDueSoon: number;
    serviceVisits: number;
    ticketCount: number;
    openTickets: number;
    highPriorityOpenTickets: number;
    totalSpend: number;
  };
  risks: string[];
  timeline: ContractorHistoryItem[];
}

const OPEN_TICKET_STATUSES = new Set([
  "open",
  "assigned",
  "in_progress",
  "awaiting_parts",
  "awaiting_contractor",
  "reopened",
  "on_hold",
]);

function daysUntil(from: Date, value?: string | null): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - from.getTime()) / 86_400_000);
}

function toTime(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function money(value?: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function ticketRisk(ticket: ContractorHistoryTicket): "low" | "medium" | "high" {
  if (
    ticket.priority === "critical" ||
    (ticket.priority === "high" && OPEN_TICKET_STATUSES.has(ticket.status || "open"))
  ) {
    return "high";
  }
  if (OPEN_TICKET_STATUSES.has(ticket.status || "open")) return "medium";
  return "low";
}

function serviceRisk(
  service: ContractorHistoryServiceRecord,
): "low" | "medium" | "high" {
  if (service.overall_result === "fail") return "high";
  if (service.overall_result === "advisory" || service.overall_result === "mixed") {
    return "medium";
  }
  return "low";
}

export function buildContractorHistory(
  input: BuildContractorHistoryInput,
): ContractorHistory {
  const now = input.now || new Date();
  const activeContracts = input.contracts.filter(
    (contract) => contract.status === "active",
  );
  const renewalsDueSoon = input.contracts.filter((contract) => {
    const renewalDays = daysUntil(now, contract.renewal_date || contract.end_date);
    return (
      contract.status === "active" &&
      renewalDays !== null &&
      renewalDays >= 0 &&
      renewalDays <= 90
    );
  });
  const openTickets = input.tickets.filter((ticket) =>
    OPEN_TICKET_STATUSES.has(ticket.status || "open"),
  );
  const highPriorityOpenTickets = openTickets.filter(
    (ticket) => ticket.priority === "critical" || ticket.priority === "high",
  );

  const totalSpend =
    input.contracts.reduce((sum, contract) => sum + money(contract.annual_cost), 0) +
    input.serviceRecords.reduce((sum, record) => sum + money(record.total_cost), 0) +
    input.tickets.reduce(
      (sum, ticket) => sum + money(ticket.actual_cost ?? ticket.estimated_cost),
      0,
    );

  const risks: string[] = [];
  if (input.contractorStatus === "restricted") {
    risks.push("Contractor is restricted.");
  }
  if (highPriorityOpenTickets.length > 0) {
    risks.push(
      `${highPriorityOpenTickets.length} high-priority open ticket${
        highPriorityOpenTickets.length === 1 ? "" : "s"
      } needs review.`,
    );
  }
  if (renewalsDueSoon.length > 0) {
    risks.push(
      `${renewalsDueSoon.length} contract renewal${
        renewalsDueSoon.length === 1 ? "" : "s"
      } due within 90 days.`,
    );
  }

  const timeline: ContractorHistoryItem[] = [
    ...input.contracts.map((contract): ContractorHistoryItem => ({
      id: contract.id,
      type: "contract",
      date: contract.start_date,
      title: contract.title,
      detail: [
        contract.status,
        contract.compliance_domains?.length
          ? contract.compliance_domains.join(", ")
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      status: contract.status,
      cost: contract.annual_cost,
      riskLevel: renewalsDueSoon.some((renewal) => renewal.id === contract.id)
        ? "medium"
        : "low",
    })),
    ...input.serviceRecords.map((service): ContractorHistoryItem => ({
      id: service.id,
      type: "service",
      date: service.service_date,
      title: service.service_type,
      detail: [
        service.compliance_domain,
        service.overall_result,
        service.asset_count
          ? `${service.asset_count} asset${service.asset_count === 1 ? "" : "s"}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      status: service.overall_result,
      cost: service.total_cost,
      riskLevel: serviceRisk(service),
    })),
    ...input.tickets.map((ticket): ContractorHistoryItem => ({
      id: ticket.id,
      type: "ticket",
      date: ticket.created_at,
      title: `${ticket.ticket_number ? `${ticket.ticket_number} — ` : ""}${ticket.title}`,
      detail: [ticket.priority, ticket.status].filter(Boolean).join(" · "),
      status: ticket.status,
      cost: ticket.actual_cost ?? ticket.estimated_cost,
      riskLevel: ticketRisk(ticket),
    })),
  ].sort((a, b) => toTime(b.date) - toTime(a.date));

  return {
    contractorId: input.contractorId,
    metrics: {
      activeContracts: activeContracts.length,
      renewalsDueSoon: renewalsDueSoon.length,
      serviceVisits: input.serviceRecords.length,
      ticketCount: input.tickets.length,
      openTickets: openTickets.length,
      highPriorityOpenTickets: highPriorityOpenTickets.length,
      totalSpend: Math.round(totalSpend * 100) / 100,
    },
    risks,
    timeline,
  };
}
