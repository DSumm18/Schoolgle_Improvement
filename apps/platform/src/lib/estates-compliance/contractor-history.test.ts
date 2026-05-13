import { describe, expect, it } from "vitest";
import { buildContractorHistory } from "./contractor-history";

describe("buildContractorHistory", () => {
  it("builds a newest-first relationship timeline across contracts, services, and tickets", () => {
    const history = buildContractorHistory({
      contractorId: "contractor-1",
      contracts: [
        {
          id: "contract-1",
          title: "Boiler service contract",
          status: "active",
          start_date: "2025-09-01",
          end_date: "2026-08-31",
          annual_cost: 1800,
          compliance_domains: ["gas", "mechanical"],
        },
      ],
      serviceRecords: [
        {
          id: "service-1",
          service_date: "2026-03-10",
          service_type: "Annual boiler service",
          compliance_domain: "gas",
          total_cost: 450,
          overall_result: "advisory",
          asset_count: 2,
        },
      ],
      tickets: [
        {
          id: "ticket-1",
          ticket_number: "EST-001",
          title: "Boiler leaking",
          priority: "high",
          status: "resolved",
          created_at: "2026-04-01T09:00:00Z",
          actual_cost: 220,
        },
      ],
    });

    expect(history.metrics.totalSpend).toBe(2470);
    expect(history.metrics.activeContracts).toBe(1);
    expect(history.metrics.serviceVisits).toBe(1);
    expect(history.metrics.ticketCount).toBe(1);
    expect(history.timeline[0].type).toBe("ticket");
    expect(history.timeline[0].title).toBe("EST-001 — Boiler leaking");
  });

  it("flags restricted contractors and high-priority open tickets", () => {
    const history = buildContractorHistory({
      contractorId: "contractor-1",
      contractorStatus: "restricted",
      contracts: [],
      serviceRecords: [],
      tickets: [
        {
          id: "ticket-1",
          ticket_number: "EST-002",
          title: "Fire alarm fault",
          priority: "critical",
          status: "open",
          created_at: "2026-04-01T09:00:00Z",
        },
      ],
    });

    expect(history.risks).toContain("Contractor is restricted.");
    expect(history.risks).toContain("1 high-priority open ticket needs review.");
  });

  it("detects upcoming contract renewals", () => {
    const history = buildContractorHistory({
      contractorId: "contractor-1",
      now: new Date("2026-04-27T12:00:00Z"),
      contracts: [
        {
          id: "contract-1",
          title: "Fire alarm maintenance",
          status: "active",
          start_date: "2025-05-01",
          end_date: "2026-05-31",
          renewal_date: "2026-05-15",
          annual_cost: 1200,
          compliance_domains: ["fire"],
        },
      ],
      serviceRecords: [],
      tickets: [],
    });

    expect(history.metrics.renewalsDueSoon).toBe(1);
    expect(history.risks.join(" ")).toContain("renewal");
  });
});
