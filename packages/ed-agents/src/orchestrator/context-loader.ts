/**
 * Context Loader
 * Loads school context from DfE database
 */

import type { SchoolContext } from "../types";

/**
 * Load school context from DfE database
 *
 * Note: This is a placeholder implementation. In production, this would:
 * 1. Get the organization's school URN from Supabase
 * 2. Call lookupSchoolByURN from supabase-dfe.ts
 * 3. Transform the result into SchoolContext
 */
export async function loadSchoolContext(
  orgId: string,
  supabase: any,
): Promise<SchoolContext | null> {
  try {
    // Placeholder - in production would be:
    /*
    // Get school URN from organization
    const { data: org } = await supabase
      .from('organizations')
      .select('school_urn')
      .eq('id', orgId)
      .single();

    if (!org?.school_urn) {
      return null;
    }

    // Import and use the DfE lookup function
    const { lookupSchoolByURN } = await import('@schoolgle/platform/lib/supabase-dfe');
    const schoolData = await lookupSchoolByURN(org.school_urn);

    if (!schoolData) {
      return null;
    }

    return transformToSchoolContext(schoolData);
    */

    return null;
  } catch (error) {
    // Don't fail entire request if context loading fails
    return null;
  }
}

/**
 * Transform DfE school data to SchoolContext
 */
function transformToSchoolContext(dfeData: any): SchoolContext {
  return {
    urn: dfeData.urn,
    name: dfeData.name,
    address: dfeData.address || [],
    phone: dfeData.phone,
    email: dfeData.email,
    typeName: dfeData.type_name,
    phaseName: dfeData.phase_name,
    laCode: dfeData.la_code,
    laName: dfeData.la_name,
    trustName: dfeData.trust_name,
    ofstedRating: dfeData.ofsted_rating,
    ofstedLastInspection: dfeData.ofsted_last_inspection
      ? new Date(dfeData.ofsted_last_inspection)
      : undefined,
    imdDecile: dfeData.imd_decile,
    isIndependent: dfeData.type_name?.toLowerCase().includes("independent"),
  };
}

/**
 * Build enriched prompt with school context
 */
export function buildEnrichedPrompt(
  basePrompt: string,
  schoolContext: SchoolContext | null,
): string {
  if (!schoolContext) {
    return basePrompt;
  }

  const contextBlock = buildSchoolContextBlock(schoolContext);

  return `${contextBlock}\n\n${basePrompt}`;
}

/**
 * Build school context block for prompts
 */
export function buildSchoolContextBlock(schoolContext: SchoolContext): string {
  const parts = [
    "## School Context",
    `You are helping **${schoolContext.name}**`,
    "",
  ];

  // Add phase
  if (schoolContext.phaseName) {
    parts.push(`- **Type:** ${schoolContext.phaseName}`);
  }

  // Add trust if applicable
  if (schoolContext.trustName) {
    parts.push(`- **Trust:** ${schoolContext.trustName}`);
  }

  // Add LA info if not a trust
  if (schoolContext.laName && !schoolContext.trustName) {
    parts.push(`- **Local Authority:** ${schoolContext.laName}`);
  }

  // Add Ofsted info if available
  if (schoolContext.ofstedRating) {
    parts.push(`- **Ofsted Rating:** ${schoolContext.ofstedRating}`);
  }

  // Add deprivation context if available
  if (schoolContext.imdDecile !== undefined) {
    const deprivationLevel =
      schoolContext.imdDecile <= 3
        ? "high deprivation area"
        : schoolContext.imdDecile <= 7
          ? "average deprivation"
          : "low deprivation area";
    parts.push(
      `- **Context:** ${deprivationLevel} (IMD decile ${schoolContext.imdDecile}/10)`,
    );
  }

  parts.push("");
  parts.push("Use this context to provide relevant, tailored advice.");
  parts.push("");

  return parts.join("\n");
}

/**
 * Get relevant guidance based on school type
 */
export function getTypeSpecificGuidance(
  schoolContext: SchoolContext,
): string[] {
  const guidance: string[] = [];

  // Academy vs LA-maintained differences
  if (schoolContext.trustName) {
    guidance.push(
      "This is an academy trust - check trust policies in addition to national guidance.",
    );
  } else if (
    schoolContext.typeName?.toLowerCase().includes("la-maintained") ||
    schoolContext.typeName?.toLowerCase().includes("local authority")
  ) {
    guidance.push(
      "This is an LA-maintained school - the local authority may provide additional guidance and services.",
    );
  }

  // Independent school considerations
  if (schoolContext.isIndependent) {
    guidance.push(
      "This is an independent school - some statutory requirements may differ, particularly around inspection and curriculum.",
    );
  }

  // Phase-specific guidance
  if (schoolContext.phaseName?.toLowerCase().includes("primary")) {
    guidance.push(
      "Primary school context: Consider early years and key stage 1-2 specific requirements.",
    );
  } else if (schoolContext.phaseName?.toLowerCase().includes("secondary")) {
    guidance.push(
      "Secondary school context: Consider key stage 3-5, GCSE, and post-16 specific requirements.",
    );
  }

  return guidance;
}

/**
 * Inject expert knowledge based on domain and page context
 */
export async function injectExpertKnowledge(
  domain: string,
  supabase: any,
): Promise<string> {
  if (!supabase) return "";

  const detectedDomain = domain.toLowerCase();

  // Try to find knowledge entries for this domain
  const { data: entries } = await supabase
    .from("compliance_knowledge")
    .select("*")
    .eq("domain", detectedDomain)
    .limit(5);

  if (!entries || entries.length === 0) return "";

  const knowledgeBlock = [
    "## Expert Knowledge Base Injected",
    `The following ${detectedDomain} data has been retrieved from the expert knowledge base:`,
    "",
  ];

  entries.forEach((entry: any) => {
    knowledgeBlock.push(`### ${entry.topic}`);
    knowledgeBlock.push(
      `- **Statutory:** ${entry.is_statutory ? "YES" : "NO"}`,
    );
    if (entry.legislation_reference) {
      knowledgeBlock.push(`- **Ref:** ${entry.legislation_reference}`);
    }
    knowledgeBlock.push(`${entry.content}`);
    if (entry.contractor_context) {
      knowledgeBlock.push(
        `- **Contractor Bullshit Filter Tip:** ${entry.contractor_context}`,
      );
    }
    knowledgeBlock.push("");
  });

  return knowledgeBlock.join("\n");
}

/**
 * Map a URL to a compliance domain
 */
export function mapUrlToDomain(url: string): string | null {
  const path = url.toLowerCase();

  // Estates & Compliance
  if (path.includes("legionella") || path.includes("water"))
    return "legionella";
  if (path.includes("fire")) return "fire";
  if (path.includes("asbestos")) return "asbestos";
  if (path.includes("electrical")) return "electrical";
  if (
    path.includes("estates") ||
    path.includes("floor-plan") ||
    path.includes("floorplan")
  )
    return "estates";
  if (path.includes("energy")) return "estates";
  if (path.includes("data-validation")) return "estates";
  if (path.includes("compliance")) return "estates";

  // HR & People
  if (
    path.includes("/hr") ||
    path.includes("staff") ||
    path.includes("people") ||
    path.includes("sickness") ||
    path.includes("cover")
  )
    return "hr";
  if (path.includes("performance") || path.includes("appraisal")) return "hr";

  // SEND
  if (path.includes("send")) return "send";

  // Finance
  if (
    path.includes("finance") ||
    path.includes("budget") ||
    path.includes("staffing-modeller") ||
    path.includes("icfp")
  )
    return "data";

  // Intelligence & Data
  if (
    path.includes("intelligence") ||
    path.includes("pupil-assessment") ||
    path.includes("cohort")
  )
    return "intelligence";
  if (path.includes("attendance")) return "data";
  if (path.includes("behaviour")) return "data";

  // Governance
  if (path.includes("governance") || path.includes("governor"))
    return "governance";

  // Risk
  if (path.includes("risk")) return "risk";

  // Safeguarding
  if (path.includes("safeguard")) return "data";

  // Teaching & Learning
  if (
    path.includes("teaching") ||
    path.includes("curriculum") ||
    path.includes("lesson")
  )
    return "curriculum";

  // Inspection / Improvement
  if (
    path.includes("improvement") ||
    path.includes("ofsted") ||
    path.includes("siams") ||
    path.includes("sef")
  )
    return "curriculum";

  // Communications
  if (path.includes("communication") || path.includes("newsletter"))
    return "communications";

  // Calendar
  if (path.includes("calendar")) return "data";

  // Surveys
  if (path.includes("survey")) return "data";

  // Website
  if (path.includes("website")) return "it-tech";

  // Settings
  if (path.includes("settings")) return "general";

  return null;
}

/**
 * Generate proactive context for a domain (The "Wow Factor" greeting)
 */
export async function generateProactiveContext(
  orgId: string,
  domain: string,
  supabase: any,
): Promise<string[]> {
  const alerts: string[] = [];
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 1. Check Compliance Tasks (Overdue & Upcoming)
  const { data: tasks } = await supabase
    .from("estates_compliance_tasks")
    .select("*")
    .eq("organization_id", orgId)
    .eq("domain", domain)
    .or(`status.eq.overdue,due_date.lte.${nextWeek.toISOString()}`);

  if (tasks && tasks.length > 0) {
    tasks.forEach((task: any) => {
      if (task.status === "overdue") {
        alerts.push(
          `ACTION REQUIRED: ${task.title} is OVERDUE (was due ${new Date(task.due_date).toLocaleDateString()}).`,
        );
      } else if (new Date(task.due_date) <= nextWeek) {
        alerts.push(
          `UPCOMING: ${task.title} is due within 7 days (${new Date(task.due_date).toLocaleDateString()}).`,
        );
      }
    });
  }

  // 2. Check Active Helpdesk Tickets
  const { data: tickets } = await supabase
    .from("estates_helpdesk_tickets")
    .select("*")
    .eq("organization_id", orgId)
    .eq("domain", domain)
    .in("status", ["open", "in_progress"]);

  if (tickets && tickets.length > 0) {
    alerts.push(
      `INFO: There are ${tickets.length} active helpdesk tickets related to ${domain}.`,
    );
  }

  // 3. Check Contractor DBS/Accreditation
  const { data: contractors } = await supabase
    .from("estates_contractors")
    .select("*")
    .eq("organization_id", orgId)
    .lte(
      "dbs_expiry_date",
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ); // 30 days buffer

  if (contractors && contractors.length > 0) {
    contractors.forEach((c: any) => {
      alerts.push(
        `WARNING: Contractor ${c.name}'s DBS expires soon (${new Date(c.dbs_expiry_date).toLocaleDateString()}).`,
      );
    });
  }

  // 4. Check Recent Knowledge Base Updates
  const { data: updates } = await supabase
    .from("compliance_knowledge")
    .select("*")
    .eq("domain", domain)
    .gte(
      "last_updated",
      new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    ); // Last 14 days

  if (updates && updates.length > 0) {
    alerts.push(
      `NEW KNOWLEDGE: There are ${updates.length} recent updates to ${domain} guidance.`,
    );
  }

  // 5. Estates spatial/energy proactive context
  if (domain === "estates") {
    const estatesSpatialAlerts = await generateEstatesSpatialContext(
      orgId,
      supabase,
    );
    alerts.push(...estatesSpatialAlerts);
  }

  // 6. Intelligence-specific proactive context
  if (domain === "intelligence") {
    const intelligenceAlerts = await generateIntelligenceContext(
      orgId,
      supabase,
    );
    alerts.push(...intelligenceAlerts);
  }

  // 7. Risk-specific proactive context
  if (domain === "risk") {
    const riskAlerts = await generateRiskContext(orgId, supabase);
    alerts.push(...riskAlerts);
  }

  // 8. Active workflows proactive context
  const workflowAlerts = await generateWorkflowContext(orgId, supabase);
  alerts.push(...workflowAlerts);

  return alerts;
}

/**
 * Generate estates spatial, energy, and data validation proactive context
 * Pulls location/room counts, QR-tagged asset counts, energy anomalies, and validation queue size
 */
export async function generateEstatesSpatialContext(
  orgId: string,
  supabase: any,
): Promise<string[]> {
  const alerts: string[] = [];

  try {
    // 1. Count registered locations/rooms
    const { count: locationCount } = await supabase
      .from("estates_locations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);

    if (locationCount != null && locationCount > 0) {
      alerts.push(
        `FLOOR PLAN: ${locationCount} location(s)/room(s) registered in the floor plan.`,
      );
    } else {
      alerts.push(
        "FLOOR PLAN: No locations registered yet. Add rooms and buildings to enable spatial analysis.",
      );
    }

    // 2. Count assets with QR/NFC codes
    const { count: qrAssetCount } = await supabase
      .from("estates_asset_locations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .not("qr_code", "is", null);

    if (qrAssetCount != null && qrAssetCount > 0) {
      alerts.push(
        `ASSET TAGS: ${qrAssetCount} asset(s) have QR/NFC codes assigned for mobile scanning.`,
      );
    }

    // 3. Check pending energy anomalies
    const { count: anomalyCount } = await supabase
      .from("estates_energy_anomalies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["detected", "investigating"]);

    if (anomalyCount != null && anomalyCount > 0) {
      alerts.push(
        `ENERGY: ${anomalyCount} energy anomaly/anomalies pending investigation.`,
      );
    }

    // 4. Check pending data validations
    const { count: validationCount } = await supabase
      .from("estates_data_validations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "pending");

    if (validationCount != null && validationCount > 0) {
      alerts.push(
        `DATA VALIDATION: ${validationCount} item(s) pending human review.`,
      );
    }
  } catch (error) {
    // Don't fail the greeting if spatial context fails
    console.error("[Context Loader] Estates spatial context error:", error);
  }

  return alerts;
}

/**
 * Generate intelligence-specific proactive context
 * Pulls latest analysis findings, active insights, and assessment data status
 */
export async function generateIntelligenceContext(
  orgId: string,
  supabase: any,
): Promise<string[]> {
  const alerts: string[] = [];

  try {
    // 1. Check for latest intelligence analysis
    const { data: latestAnalysis } = await supabase
      .from("school_intelligence_analyses")
      .select("id, created_at, status, focus_areas, summary")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latestAnalysis) {
      const analysisAge = Math.floor(
        (Date.now() - new Date(latestAnalysis.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (analysisAge <= 7) {
        alerts.push(
          `RECENT ANALYSIS: A full intelligence analysis was run ${analysisAge === 0 ? "today" : `${analysisAge} day(s) ago`}. Key findings are available.`,
        );
      } else if (analysisAge > 30) {
        alerts.push(
          `STALE DATA: Last intelligence analysis was ${analysisAge} days ago. Consider running a fresh analysis.`,
        );
      }
    } else {
      alerts.push(
        "NO ANALYSIS: No intelligence analysis has been run yet. Upload pupil assessment data or run the full analysis to get started.",
      );
    }

    // 2. Check for critical/high-severity pupil insights
    const { data: criticalInsights } = await supabase
      .from("pupil_analysis_insights")
      .select("insight_type, title, severity")
      .eq("organization_id", orgId)
      .in("severity", ["critical", "high"])
      .order("created_at", { ascending: false })
      .limit(5);

    if (criticalInsights && criticalInsights.length > 0) {
      alerts.push(
        `ATTENTION: ${criticalInsights.length} high-priority insight(s) from pupil assessment analysis:`,
      );
      criticalInsights.forEach((insight: any) => {
        alerts.push(`  - [${insight.severity.toUpperCase()}] ${insight.title}`);
      });
    }

    // 3. Check for active contextual factors
    const { data: activeFactors } = await supabase
      .from("school_contextual_factors")
      .select("factor_type, description, affected_year_groups")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .limit(5);

    if (activeFactors && activeFactors.length > 0) {
      alerts.push(
        `CONTEXT: ${activeFactors.length} active contextual factor(s) that may affect data:`,
      );
      activeFactors.forEach((factor: any) => {
        const yearGroups = factor.affected_year_groups?.length
          ? ` (Year ${factor.affected_year_groups.join(", ")})`
          : "";
        alerts.push(
          `  - ${factor.factor_type}: ${factor.description}${yearGroups}`,
        );
      });
    }

    // 4. Check for recent assessment imports
    const { data: recentImports } = await supabase
      .from("school_assessment_imports")
      .select(
        "id, source_system, assessment_period, academic_year_start, total_pupils, status, created_at",
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentImports && recentImports.length > 0) {
      const latestImport = recentImports[0];
      alerts.push(
        `ASSESSMENT DATA: Latest upload — ${latestImport.source_system} ${latestImport.assessment_period} ${latestImport.academic_year_start}/${latestImport.academic_year_start + 1} (${latestImport.total_pupils} pupils, status: ${latestImport.status})`,
      );
    } else {
      alerts.push(
        "NO PUPIL DATA: No assessment data has been uploaded yet. Schools can export from Arbor/SIMS and upload via the Intelligence page — data is automatically pseudonymised.",
      );
    }
  } catch (error) {
    // Don't fail the greeting if intelligence context fails
    console.error("[Context Loader] Intelligence context error:", error);
  }

  return alerts;
}

/**
 * Build intelligence context block for specialist prompt enrichment
 * Called when the intelligence specialist is handling a question
 */
export async function buildIntelligenceContextBlock(
  orgId: string,
  supabase: any,
): Promise<string> {
  if (!supabase) return "";

  const parts: string[] = ["## School Intelligence Data Available", ""];

  try {
    // Get latest analysis summary
    const { data: analysis } = await supabase
      .from("school_intelligence_analyses")
      .select("summary, created_at, focus_areas")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (analysis?.summary) {
      parts.push("### Latest Analysis Summary");
      parts.push(analysis.summary);
      parts.push(
        `*Run on ${new Date(analysis.created_at).toLocaleDateString()}*`,
      );
      parts.push("");
    }

    // Get top insights
    const { data: insights } = await supabase
      .from("pupil_analysis_insights")
      .select(
        "insight_type, title, description, severity, data, recommendations",
      )
      .eq("organization_id", orgId)
      .order("severity", { ascending: true })
      .limit(10);

    if (insights && insights.length > 0) {
      parts.push("### Key Insights from Pupil Assessment Analysis");
      insights.forEach((insight: any) => {
        parts.push(
          `- **[${insight.severity}] ${insight.title}**: ${insight.description}`,
        );
        if (insight.recommendations) {
          parts.push(`  - Recommendation: ${insight.recommendations}`);
        }
      });
      parts.push("");
    }

    // Get active contextual factors
    const { data: factors } = await supabase
      .from("school_contextual_factors")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true);

    if (factors && factors.length > 0) {
      parts.push("### Active Contextual Factors");
      factors.forEach((f: any) => {
        const yearGroups = f.affected_year_groups?.length
          ? ` (affecting Year ${f.affected_year_groups.join(", ")})`
          : "";
        parts.push(
          `- **${f.factor_type}**: ${f.description}${yearGroups} (since ${new Date(f.start_date).toLocaleDateString()})`,
        );
      });
      parts.push("");
    }

    // Get import summary
    const { data: imports } = await supabase
      .from("school_assessment_imports")
      .select(
        "source_system, assessment_period, academic_year_start, total_pupils, subjects_included, year_groups_included, status",
      )
      .eq("organization_id", orgId)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .limit(5);

    if (imports && imports.length > 0) {
      parts.push("### Available Assessment Data");
      imports.forEach((imp: any) => {
        parts.push(
          `- ${imp.source_system} — ${imp.assessment_period} ${imp.academic_year_start}/${imp.academic_year_start + 1}: ${imp.total_pupils} pupils, subjects: ${(imp.subjects_included || []).join(", ")}, year groups: ${(imp.year_groups_included || []).join(", ")}`,
        );
      });
      parts.push("");
    }
  } catch (error) {
    console.error("[Context Loader] Intelligence context block error:", error);
  }

  return parts.length > 2 ? parts.join("\n") : "";
}

/**
 * Generate risk-specific proactive context
 * Pulls risk summary counts, above-appetite risks, and overdue mitigations
 */
export async function generateRiskContext(
  orgId: string,
  supabase: any,
): Promise<string[]> {
  const alerts: string[] = [];

  try {
    // 1. Get total risk counts by band
    const { data: risks } = await supabase
      .from("risk_register")
      .select("id, residual_score, residual_band, status")
      .eq("organization_id", orgId)
      .eq("status", "open");

    if (risks && risks.length > 0) {
      const critical = risks.filter(
        (r: any) => r.residual_band === "critical",
      ).length;
      const high = risks.filter((r: any) => r.residual_band === "high").length;
      const medium = risks.filter(
        (r: any) => r.residual_band === "medium",
      ).length;
      const low = risks.filter(
        (r: any) => r.residual_band === "low" || r.residual_band === "very_low",
      ).length;

      alerts.push(
        `RISK REGISTER: ${risks.length} open risks — ${critical} critical, ${high} high, ${medium} medium, ${low} low/very low.`,
      );

      if (critical > 0) {
        alerts.push(
          `CRITICAL: ${critical} risk(s) in the critical band require immediate board attention.`,
        );
      }
    } else {
      alerts.push(
        "RISK REGISTER: No open risks found. Consider running an initial risk assessment.",
      );
    }

    // 2. Check for risks above appetite
    const { data: aboveAppetite } = await supabase
      .from("risk_register")
      .select("id, title, residual_score, categories")
      .eq("organization_id", orgId)
      .eq("status", "open")
      .eq("above_appetite", true);

    if (aboveAppetite && aboveAppetite.length > 0) {
      alerts.push(
        `ABOVE APPETITE: ${aboveAppetite.length} risk(s) are scoring above the board's appetite threshold and require escalation:`,
      );
      aboveAppetite.slice(0, 5).forEach((risk: any) => {
        alerts.push(`  - ${risk.title} (score: ${risk.residual_score})`);
      });
    }

    // 3. Check for overdue mitigations
    const { data: overdueMitigations } = await supabase
      .from("risk_mitigations")
      .select("id, title, risk_id, due_date")
      .eq("organization_id", orgId)
      .eq("status", "in_progress")
      .lt("due_date", new Date().toISOString());

    if (overdueMitigations && overdueMitigations.length > 0) {
      alerts.push(
        `OVERDUE MITIGATIONS: ${overdueMitigations.length} mitigation(s) are past due — this is actively increasing residual risk scores.`,
      );
    }
  } catch (error) {
    // Don't fail the greeting if risk context fails
    console.error("[Context Loader] Risk context error:", error);
  }

  return alerts;
}

/**
 * Generate workflow-specific proactive context
 * Pulls active workflows, current phases, and step counts (todo/blocked)
 */
export async function generateWorkflowContext(
  orgId: string,
  supabase: any,
  userRole?: string,
): Promise<string[]> {
  const alerts: string[] = [];

  try {
    // Get active workflows for the organization
    const { data: workflows } = await supabase
      .from("workflows")
      .select("id, title, status, current_phase")
      .eq("organization_id", orgId)
      .eq("status", "active");

    if (!workflows || workflows.length === 0) {
      return alerts;
    }

    for (const workflow of workflows) {
      // Get phases for this workflow
      const { data: phases } = await supabase
        .from("workflow_phases")
        .select("id, title, phase_order")
        .eq("workflow_id", workflow.id)
        .eq("phase_order", workflow.current_phase)
        .limit(1)
        .single();

      const phaseTitle = phases?.title || `Phase ${workflow.current_phase}`;

      // Get step counts for the current phase
      const { data: steps } = await supabase
        .from("workflow_steps")
        .select("id, status, assigned_role")
        .eq("workflow_id", workflow.id)
        .eq("phase_order", workflow.current_phase);

      const todoCount =
        steps?.filter((s: any) => s.status === "todo").length || 0;
      const blockedCount =
        steps?.filter((s: any) => s.status === "blocked").length || 0;
      const totalRemaining = todoCount + blockedCount;

      let alert = `ACTIVE WORKFLOW: '${workflow.title}' — Phase ${workflow.current_phase}: ${phaseTitle} — ${totalRemaining} step(s) remaining`;
      if (blockedCount > 0) {
        alert += `, ${blockedCount} blocked`;
      }

      // Check if any steps are assigned to the current user's role
      if (userRole && steps) {
        const mySteps = steps.filter(
          (s: any) =>
            s.assigned_role === userRole &&
            (s.status === "todo" || s.status === "blocked"),
        );
        if (mySteps.length > 0) {
          alert += ` (${mySteps.length} assigned to your role)`;
        }
      }

      alerts.push(alert);
    }
  } catch (error) {
    // Don't fail the greeting if workflow context fails
    console.error("[Context Loader] Workflow context error:", error);
  }

  return alerts;
}

/**
 * Build risk context block for specialist prompt enrichment
 * Called when the risk specialist is handling a question
 */
export async function buildRiskContextBlock(
  orgId: string,
  supabase: any,
): Promise<string> {
  if (!supabase) return "";

  const parts: string[] = ["## Risk Register Data Available", ""];

  try {
    // Get risk summary by category
    const { data: risks } = await supabase
      .from("risk_register")
      .select(
        "id, title, categories, residual_likelihood, residual_impact, residual_score, residual_band, status, above_appetite, direction_of_travel",
      )
      .eq("organization_id", orgId)
      .eq("status", "open")
      .order("residual_score", { ascending: false })
      .limit(20);

    if (risks && risks.length > 0) {
      parts.push("### Top Risks (by residual score)");
      risks.forEach((risk: any) => {
        const appetite = risk.above_appetite ? " **ABOVE APPETITE**" : "";
        const direction = risk.direction_of_travel
          ? ` (${risk.direction_of_travel})`
          : "";
        parts.push(
          `- **${risk.title}**: L${risk.residual_likelihood} x I${risk.residual_impact} = ${risk.residual_score} (${risk.residual_band})${appetite}${direction}`,
        );
      });
      parts.push("");

      // Summarize by band
      const critical = risks.filter(
        (r: any) => r.residual_band === "critical",
      ).length;
      const high = risks.filter((r: any) => r.residual_band === "high").length;
      const aboveAppetite = risks.filter((r: any) => r.above_appetite).length;

      parts.push("### Summary");
      parts.push(
        `- Total open risks: ${risks.length} | Critical: ${critical} | High: ${high} | Above appetite: ${aboveAppetite}`,
      );
      parts.push("");
    }

    // Get recent risk decisions
    const { data: decisions } = await supabase
      .from("risk_decisions")
      .select("risk_id, decision, rationale, decided_by, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (decisions && decisions.length > 0) {
      parts.push("### Recent 4T Decisions");
      decisions.forEach((d: any) => {
        parts.push(
          `- ${d.decision.toUpperCase()}: ${d.rationale} (${new Date(d.created_at).toLocaleDateString()})`,
        );
      });
      parts.push("");
    }
  } catch (error) {
    console.error("[Context Loader] Risk context block error:", error);
  }

  return parts.length > 2 ? parts.join("\n") : "";
}
