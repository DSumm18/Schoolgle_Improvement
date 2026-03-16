/**
 * Helpdesk Risk Service
 *
 * AI-powered risk assessment for estates helpdesk tickets.
 * When a ticket is created, this service:
 * 1. Calls Gemini 2.0 Flash to assess likelihood × impact
 * 2. Creates a risk_register entry linked via source_task_id
 * 3. Records initial risk_score_history for the audit trail
 *
 * Uses the same pattern as createRiskFromIncident() in risk-integration.ts.
 */

import { openrouter } from "@/lib/ai-openrouter";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  generateRiskRef,
  getRiskBand,
  type RiskCategory,
} from "@/lib/risk-engine";

// ─── Types ───────────────────────────────────────────────

export interface TicketRiskAssessment {
  likelihood: number;
  impact: number;
  score: number;
  risk_band: string;
  risk_categories: RiskCategory[];
  reasoning: string;
  suggested_mitigations: string[];
}

interface AssessTicketInput {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  location?: string;
}

// ─── AI Risk Assessment ──────────────────────────────────

const RISK_ASSESSMENT_PROMPT = `You are a UK school estates risk assessor with NEBOSH and IOSH qualifications.
Given a helpdesk ticket from a school, assess the risk using a 5×5 likelihood × impact matrix.

Consider:
- Child safety and safeguarding (highest priority)
- HSE regulatory obligations (RIDDOR, COSHH, LOLER, etc.)
- Operational disruption to teaching and learning
- Financial impact and insurance implications
- Reputational damage

Likelihood scale:
1 = Rare (<5% chance, exceptional circumstances)
2 = Unlikely (5-25%, could happen but not expected)
3 = Possible (25-50%, might occur at some point)
4 = Likely (50-75%, will probably occur)
5 = Almost Certain (>75%, expected to occur, or has already occurred)

Impact scale:
1 = Negligible (minimal disruption, no injuries, <£100 cost)
2 = Minor (some disruption, first aid only, <£1,000 cost)
3 = Moderate (significant disruption, medical attention needed, <£10,000)
4 = Major (severe disruption, serious injury, >£10,000, regulatory action)
5 = Catastrophic (school closure, death/life-changing injury, prosecution)

Risk categories (pick 1-3 that apply):
h_and_s, safeguarding, operational, financial, reputational, legal, staffing, educational, cyber, governance, strategic, equality

Respond with ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "likelihood": <1-5>,
  "impact": <1-5>,
  "risk_categories": ["<category1>", "<category2>"],
  "reasoning": "<one clear sentence explaining the assessment>",
  "suggested_mitigations": ["<action1>", "<action2>", "<action3>"]
}

Examples:
- "Fence blown over near main road" → likelihood:5, impact:5, categories:["safeguarding","h_and_s"]
- "Child sick in classroom" → likelihood:5, impact:1, categories:["h_and_s"]
- "Dripping tap in staff kitchen" → likelihood:2, impact:1, categories:["operational"]
- "Gas smell in boiler room" → likelihood:4, impact:5, categories:["h_and_s","safeguarding"]
- "Lightbulb out in Year 3" → likelihood:1, impact:1, categories:["operational"]`;

export async function assessTicketRisk(
  input: AssessTicketInput,
): Promise<TicketRiskAssessment> {
  const ticketContext = [
    `Title: ${input.title}`,
    input.description ? `Description: ${input.description}` : null,
    input.category ? `Category: ${input.category}` : null,
    input.priority ? `Reporter priority: ${input.priority}` : null,
    input.location ? `Location: ${input.location}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await openrouter.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: RISK_ASSESSMENT_PROMPT },
        { role: "user", content: ticketContext },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const raw = response.choices[0]?.message?.content || "";
    // Strip markdown fences if present
    const jsonStr = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    const likelihood = Math.max(1, Math.min(5, Math.round(parsed.likelihood)));
    const impact = Math.max(1, Math.min(5, Math.round(parsed.impact)));
    const score = likelihood * impact;

    return {
      likelihood,
      impact,
      score,
      risk_band: getRiskBand(score),
      risk_categories: Array.isArray(parsed.risk_categories)
        ? parsed.risk_categories.slice(0, 3)
        : ["operational"],
      reasoning: parsed.reasoning || "AI assessment completed.",
      suggested_mitigations: Array.isArray(parsed.suggested_mitigations)
        ? parsed.suggested_mitigations.slice(0, 5)
        : [],
    };
  } catch (err) {
    // Fallback: use keyword-based assessment if AI fails
    console.error("[HelpDeskRisk] AI assessment failed, using fallback:", err);
    return fallbackAssessment(input);
  }
}

// ─── Create Risk Register Entry ──────────────────────────

export async function createRiskForTicket(
  ticketId: string,
  organizationId: string,
  assessment: TicketRiskAssessment,
  ticketTitle: string,
): Promise<{ risk_id: string | null; error?: string }> {
  const supabase = createServiceRoleClient();

  // Get school code for risk_ref
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  const schoolCode = org?.name
    ? org.name
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "X")
    : organizationId.substring(0, 3).toUpperCase();

  const primaryCategory = assessment.risk_categories[0] || "operational";
  const { count } = await supabase
    .from("risk_register")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .contains("risk_categories", [primaryCategory]);

  const sequence = (count ?? 0) + 1;
  const riskRef = generateRiskRef(
    primaryCategory as RiskCategory,
    schoolCode,
    sequence,
  );

  const { data: risk, error: riskErr } = await supabase
    .from("risk_register")
    .insert({
      organization_id: organizationId,
      risk_ref: riskRef,
      title: ticketTitle,
      description: `Auto-assessed from helpdesk ticket. ${assessment.reasoning}`,
      tier: "operational",
      status: "identified",
      risk_categories: assessment.risk_categories,
      source_module: "estates",
      source_task_id: ticketId,
      source_table: "estates_helpdesk_tickets",
      inherent_likelihood: assessment.likelihood,
      inherent_impact: assessment.impact,
      inherent_score: assessment.score,
      impact_by_category: {},
      system_residual_likelihood: assessment.likelihood,
      system_residual_impact: assessment.impact,
      effective_residual_score: assessment.score,
    })
    .select("id")
    .single();

  if (riskErr) {
    return {
      risk_id: null,
      error: `Failed to create risk: ${riskErr.message}`,
    };
  }

  // Record initial score history
  await supabase.from("risk_score_history").insert({
    risk_id: risk.id,
    organization_id: organizationId,
    score_type: "system_calculated",
    system_likelihood: assessment.likelihood,
    system_impact: assessment.impact,
    system_score: assessment.score,
    recorded_likelihood: assessment.likelihood,
    recorded_impact: assessment.impact,
    recorded_score: assessment.score,
    trigger_type: "helpdesk_created",
    notes: assessment.reasoning,
  });

  // Log activity on the helpdesk ticket
  await supabase.from("estates_helpdesk_activity").insert({
    ticket_id: ticketId,
    activity_type: "risk_assessed",
    description: `AI risk assessment: ${assessment.risk_band.toUpperCase()} (${assessment.score}) — ${assessment.reasoning}`,
    metadata: {
      risk_id: risk.id,
      risk_ref: riskRef,
      likelihood: assessment.likelihood,
      impact: assessment.impact,
      score: assessment.score,
      risk_band: assessment.risk_band,
      risk_categories: assessment.risk_categories,
      suggested_mitigations: assessment.suggested_mitigations,
    },
  });

  return { risk_id: risk.id };
}

// ─── Status Change → Mitigation ──────────────────────────

export async function handleStatusChangeRisk(
  ticketId: string,
  organizationId: string,
  oldStatus: string,
  newStatus: string,
  actorName?: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  // Find linked risk
  const { data: risk } = await supabase
    .from("risk_register")
    .select("id, inherent_likelihood, inherent_impact, status")
    .eq("source_task_id", ticketId)
    .eq("source_table", "estates_helpdesk_tickets")
    .eq("organization_id", organizationId)
    .neq("status", "closed")
    .maybeSingle();

  if (!risk) return; // No linked risk

  const riskId = risk.id;

  if (newStatus === "assigned" || newStatus === "in_progress") {
    // Create or update mitigation
    const mitigationTitle =
      newStatus === "assigned"
        ? "Staff assigned to investigate"
        : "Active remediation in progress";

    const isOperating = newStatus === "in_progress";
    const effectiveness =
      newStatus === "in_progress" ? "partially_effective" : "not_tested";
    const lReduction = newStatus === "in_progress" ? 1 : 0;
    const iReduction = 0;

    // Upsert: one mitigation per ticket status lifecycle
    const { data: existing } = await supabase
      .from("risk_mitigations")
      .select("id")
      .eq("risk_id", riskId)
      .eq("source_task_id", ticketId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("risk_mitigations")
        .update({
          title: mitigationTitle,
          is_operating: isOperating,
          effectiveness,
          likelihood_reduction: lReduction,
          impact_reduction: iReduction,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("risk_mitigations").insert({
        risk_id: riskId,
        organization_id: organizationId,
        title: mitigationTitle,
        mitigation_type: "corrective",
        source_module: "estates",
        source_task_id: ticketId,
        is_operating: isOperating,
        effectiveness,
        likelihood_reduction: lReduction,
        impact_reduction: iReduction,
      });
    }

    // Update risk status
    if (risk.status === "identified") {
      await supabase
        .from("risk_register")
        .update({ status: "treating" })
        .eq("id", riskId);
    }
  } else if (newStatus === "resolved") {
    // Full mitigation — issue resolved
    const { data: existing } = await supabase
      .from("risk_mitigations")
      .select("id")
      .eq("risk_id", riskId)
      .eq("source_task_id", ticketId)
      .maybeSingle();

    const resolvedData = {
      title: "Issue fully resolved",
      is_operating: true,
      effectiveness: "effective" as const,
      likelihood_reduction: Math.max(1, risk.inherent_likelihood - 1),
      impact_reduction: Math.max(1, risk.inherent_impact - 1),
      last_operated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from("risk_mitigations")
        .update(resolvedData)
        .eq("id", existing.id);
    } else {
      await supabase.from("risk_mitigations").insert({
        risk_id: riskId,
        organization_id: organizationId,
        mitigation_type: "corrective",
        source_module: "estates",
        source_task_id: ticketId,
        ...resolvedData,
      });
    }
  } else if (newStatus === "closed") {
    // Close the risk
    await supabase
      .from("risk_register")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("id", riskId);
  } else if (newStatus === "reopened") {
    // Reopen risk, set mitigations ineffective
    await supabase
      .from("risk_mitigations")
      .update({
        is_operating: false,
        effectiveness: "ineffective",
        likelihood_reduction: 0,
        impact_reduction: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("risk_id", riskId)
      .eq("source_task_id", ticketId);

    await supabase
      .from("risk_register")
      .update({ status: "treating", updated_at: new Date().toISOString() })
      .eq("id", riskId);
  }

  // Recalculate residual score from all mitigations
  await recalculateResidualScore(
    riskId,
    organizationId,
    `Status changed: ${oldStatus} → ${newStatus}`,
  );
}

// ─── Recalculate Residual Score ──────────────────────────

async function recalculateResidualScore(
  riskId: string,
  organizationId: string,
  triggerDescription: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: risk } = await supabase
    .from("risk_register")
    .select("inherent_likelihood, inherent_impact")
    .eq("id", riskId)
    .single();

  if (!risk) return;

  const { data: mitigations } = await supabase
    .from("risk_mitigations")
    .select(
      "likelihood_reduction, impact_reduction, is_operating, effectiveness",
    )
    .eq("risk_id", riskId);

  let totalLReduction = 0;
  let totalIReduction = 0;

  for (const m of mitigations || []) {
    if (!m.is_operating) continue;
    const effectivenessMultiplier =
      m.effectiveness === "effective"
        ? 1.0
        : m.effectiveness === "partially_effective"
          ? 0.5
          : 0;
    totalLReduction += (m.likelihood_reduction || 0) * effectivenessMultiplier;
    totalIReduction += (m.impact_reduction || 0) * effectivenessMultiplier;
  }

  const residualL = Math.max(
    1,
    Math.round(risk.inherent_likelihood - totalLReduction),
  );
  const residualI = Math.max(
    1,
    Math.round(risk.inherent_impact - totalIReduction),
  );
  const residualScore = residualL * residualI;

  await supabase
    .from("risk_register")
    .update({
      system_residual_likelihood: residualL,
      system_residual_impact: residualI,
      effective_residual_score: residualScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", riskId);

  // Record score history
  await supabase.from("risk_score_history").insert({
    risk_id: riskId,
    organization_id: organizationId,
    score_type: "system_calculated",
    system_likelihood: residualL,
    system_impact: residualI,
    system_score: residualScore,
    recorded_likelihood: residualL,
    recorded_impact: residualI,
    recorded_score: residualScore,
    trigger_type: "helpdesk_status_change",
    notes: triggerDescription,
  });
}

// ─── Fallback Assessment (keyword-based) ─────────────────

function fallbackAssessment(input: AssessTicketInput): TicketRiskAssessment {
  const text = `${input.title} ${input.description || ""}`.toLowerCase();

  // Critical keywords
  const criticalPatterns =
    /flood|fire|gas leak|gas smell|collapse|electri.*shock|child.*injur|asbestos.*exposed|serious/;
  const highPatterns =
    /broken.*window|no heating|sewage|blocked.*toilet|alarm|security|roof|playground.*damage|fence/;
  const lowPatterns =
    /lightbulb|light bulb|squeaky|cosmetic|paint|minor|not urgent|no rush/;

  let likelihood = 3;
  let impact = 3;
  const categories: RiskCategory[] = ["operational"];

  if (criticalPatterns.test(text)) {
    likelihood = 5;
    impact = 5;
    categories.unshift("h_and_s");
    if (/child|pupil|safeguard/i.test(text)) categories.push("safeguarding");
  } else if (highPatterns.test(text)) {
    likelihood = 4;
    impact = 3;
    categories.unshift("h_and_s");
  } else if (lowPatterns.test(text)) {
    likelihood = 2;
    impact = 1;
  }

  const score = likelihood * impact;
  return {
    likelihood,
    impact,
    score,
    risk_band: getRiskBand(score),
    risk_categories: categories,
    reasoning: "Assessed using keyword analysis (AI unavailable).",
    suggested_mitigations: [
      "Investigate and assess on site",
      "Secure the area if needed",
    ],
  };
}
