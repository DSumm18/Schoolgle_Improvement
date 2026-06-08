import {
  applyRiskControlCompletion,
  buildRiskControlDecisionAudit,
  suggestRiskControlChecks,
} from "./risk-control-checks";

const AURORA_ORG_ID = "00000000-0000-0000-0000-000000000999";
const AURORA_TICKET_ID = "11111111-1111-4111-8111-111111111111";
const AURORA_RISK_ID = "22222222-2222-4222-8222-222222222222";

describe("Estates Risk Control Checks", () => {
  it("suggests domain-specific temporary controls for an Aurora fire ticket", () => {
    const suggestions = suggestRiskControlChecks({
      organizationId: AURORA_ORG_ID,
      ticketId: AURORA_TICKET_ID,
      riskId: AURORA_RISK_ID,
      title: "Fire risk assessment finding - combustible materials by boiler room",
      description:
        "External assessor found cardboard and PE mats stored by the boiler room fire exit. Contractor booked next week.",
      category: "fire",
      riskScore: 16,
    });

    expect(suggestions.domain).toBe("fire");
    expect(suggestions.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Keep combustible materials clear of the boiler room and fire exit",
          frequency: "daily",
          requiresPhoto: true,
          escalationIfFailed: "Escalate to SLT immediately and raise priority to critical.",
        }),
      ]),
    );
    expect(suggestions.recommendations.length).toBeGreaterThanOrEqual(2);
  });

  it("records accepted and declined AI recommendations for leadership audit", () => {
    const suggestions = suggestRiskControlChecks({
      organizationId: AURORA_ORG_ID,
      ticketId: AURORA_TICKET_ID,
      title: "Legionella concern - little used shower not flushed",
      description: "Outlet has not been flushed this week while works are pending.",
      category: "legionella",
      riskScore: 12,
    });

    const audit = buildRiskControlDecisionAudit({
      organizationId: AURORA_ORG_ID,
      ticketId: AURORA_TICKET_ID,
      riskId: AURORA_RISK_ID,
      actorId: "33333333-3333-4333-8333-333333333333",
      acceptedRecommendationIds: [suggestions.recommendations[0].id],
      declinedRecommendationIds: [suggestions.recommendations[1].id],
      declinedReason: "Site manager says contractor is visiting tomorrow",
      suggestions,
      decidedAt: "2026-06-08T08:15:00.000Z",
    });

    expect(audit.accepted).toHaveLength(1);
    expect(audit.declined).toHaveLength(1);
    expect(audit.accepted[0]).toMatchObject({
      organization_id: AURORA_ORG_ID,
      ticket_id: AURORA_TICKET_ID,
      risk_id: AURORA_RISK_ID,
      status: "accepted",
      accepted_by: "33333333-3333-4333-8333-333333333333",
    });
    expect(audit.declined[0]).toMatchObject({
      status: "declined",
      declined_reason: "Site manager says contractor is visiting tomorrow",
    });
    expect(audit.checksToCreate[0]).toMatchObject({
      organization_id: AURORA_ORG_ID,
      ticket_id: AURORA_TICKET_ID,
      risk_id: AURORA_RISK_ID,
      status: "active",
      next_due_date: "2026-06-08",
    });
  });

  it("keeps risk stable when OK, escalates missed checks, and escalates Not OK", () => {
    expect(
      applyRiskControlCompletion({
        currentRiskScore: 16,
        result: "ok",
        dueDate: "2026-06-08",
        completedAt: "2026-06-08T08:30:00.000Z",
      }),
    ).toMatchObject({
      newRiskScore: 16,
      riskDirection: "stable",
      escalationRequired: false,
    });

    expect(
      applyRiskControlCompletion({
        currentRiskScore: 16,
        result: "missed",
        dueDate: "2026-06-08",
        completedAt: "2026-06-09T10:00:00.000Z",
      }),
    ).toMatchObject({
      newRiskScore: 18,
      riskDirection: "worsening",
      escalationRequired: true,
    });

    expect(
      applyRiskControlCompletion({
        currentRiskScore: 16,
        result: "not_ok",
        dueDate: "2026-06-08",
        completedAt: "2026-06-08T08:30:00.000Z",
      }),
    ).toMatchObject({
      newRiskScore: 21,
      riskDirection: "worsening",
      escalationRequired: true,
    });
  });
});
