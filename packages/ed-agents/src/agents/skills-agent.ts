/**
 * Skills Agent
 *
 * Provides tool definitions for native LLM function-calling and
 * executes platform skills (Staff Directory, Actions Hub, Estates, etc.)
 */

import type { AppContext, SpecialistId } from "../types";
import {
  getFormSkillFunctions,
  FORM_SKILLS,
} from "../skills/handlers/form-skills";

// Try to import platform schemas, but provide fallback for builds
let SCHOOL_FUNCTION_SCHEMAS: any[] = [];
try {
  // @ts-ignore - Optional import for monorepo compatibility
  const schemas = require("@schoolgle/platform/lib/skills/school-skills-registry");
  SCHOOL_FUNCTION_SCHEMAS = schemas.SCHOOL_FUNCTION_SCHEMAS || [];
} catch {
  // Fallback: schemas will be provided at runtime via /api/skills/invoke
  SCHOOL_FUNCTION_SCHEMAS = [];
}

interface SkillExecutionResult {
  success: boolean;
  response: string;
  data?: any;
  error?: string;
}

/**
 * Get available skills as LLM tool definitions
 */
export function getSkillTools() {
  return SCHOOL_FUNCTION_SCHEMAS.map((schema) => ({
    type: "function",
    function: {
      name: schema.name,
      description: schema.description,
      parameters: schema.parameters,
    },
  }));
}

/**
 * Execute a skill chosen via LLM tool-calling
 */
export async function executeSkill(
  functionName: string,
  parameters: Record<string, any>,
  baseUrl?: string,
): Promise<SkillExecutionResult> {
  // Use localhost in development, otherwise use provided URL
  const effectiveBaseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const url = `${effectiveBaseUrl}/api/skills/invoke`;
    console.log(
      "[Skills Agent] Executing Skill:",
      functionName,
      "Params:",
      parameters,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        function: functionName,
        parameters,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Skills Agent] API Error:", errorText);
      return {
        success: false,
        response: `Sorry, I encountered an error calling the skill service (${response.status}).`,
      };
    }

    const result = await response.json();

    if (!result.success) {
      if (result.error?.includes("row-level security")) {
        return {
          success: false,
          response: `I need to verify your permissions to do that. Please make sure you're logged in and try again.`,
        };
      }
      return {
        success: false,
        response: `I couldn't complete that action: ${result.error || "Unknown error"}`,
      };
    }

    // Format success response based on function
    return formatSkillSuccessResponse(functionName, result);
  } catch (error) {
    console.error("[Skills Agent] Execution Exception:", error);
    return {
      success: false,
      response: `I'm having trouble connecting to the skills service. Please try again.`,
    };
  }
}

/**
 * Format skill execution result into a user-friendly response
 */
function formatSkillSuccessResponse(
  functionName: string,
  result: { success: boolean; data?: any },
): SkillExecutionResult {
  // Staff Directory
  if (functionName === "create_staff_member") {
    return {
      success: true,
      response: `✅ Staff member created successfully!\n\n**Name:** ${result.data?.name || "Staff"}\n**Job Title:** ${result.data?.job_title || "N/A"}\n\nThey've been added to your staff directory.`,
      data: result.data,
    };
  }

  if (functionName === "list_staff") {
    const count = result.data?.count || result.data?.length || 0;
    return {
      success: true,
      response: `📋 **Staff Directory**\n\nYou have **${count}** staff members in your directory.${
        result.data?.length > 0
          ? "\n\n**Recent entries:**\n" +
            result.data
              .slice(0, 5)
              .map((s: any) => `• ${s.name} (${s.job_title})`)
              .join("\n")
          : ""
      }`,
      data: result.data,
    };
  }

  // Actions Hub
  if (functionName === "create_action") {
    return {
      success: true,
      response: `✅ **Action Created!**\n\n**Title:** ${result.data?.title || "New action"}\n\nThe action has been added to your Actions Hub. You can view it in the dashboard to assign owners and due dates.`,
      data: result.data,
    };
  }

  // Estates Helpdesk
  if (functionName === "create_helpdesk_ticket") {
    return {
      success: true,
      response: `✅ **Helpdesk Ticket Logged!**\n\n**Ticket:** ${result.data?.title || "Maintenance issue"}\n**Priority:** ${result.data?.priority || "medium"}\n**Ref:** #${result.data?.id?.substring(0, 8) || "N/A"}\n\nI've logged this in the Estates Helpdesk. The site team will be notified.`,
      data: result.data,
    };
  }

  if (functionName === "update_helpdesk_ticket") {
    return {
      success: true,
      response: `✅ **Ticket Updated!**\n\nI've updated the ticket status to **${result.data?.status || "updated"}**.`,
      data: result.data,
    };
  }

  if (functionName === "triage_estate_finding") {
    const triage = result.data?.triage;
    return {
      success: true,
      response: `🧭 **Finding Triaged**\n\n**Classification:** ${triage?.classification?.replace(/_/g, " ") || "review required"}\n**Risk:** ${triage?.riskScore || "?"}/5\n**Route:** ${(triage?.recommendedRoutes || []).map((route: string) => route.replace(/_/g, " ")).join(", ") || "manual review"}\n\n${result.data?.user_message || "I've classified the finding so it can be routed without creating unnecessary noise."}`,
      data: result.data,
    };
  }

  if (functionName === "create_estate_strategy_item") {
    return {
      success: true,
      response: `✅ **Estate Strategy Item Added**\n\n**Item:** ${result.data?.item?.title || "Estate strategy item"}\n**Year:** ${result.data?.item?.year || "planned"}\n**Estimated cost:** £${Number(result.data?.item?.estimated_cost || 0).toLocaleString()}\n\n${result.data?.message || "I've added this to the finance-facing estate strategy so it can be reviewed and prioritised."}`,
      data: result.data,
    };
  }

  // Search Contractors
  if (functionName === "search_contractors") {
    const count = result.data?.length || 0;
    return {
      success: true,
      response: `🔍 **Contractor Search**\n\nI found **${count}** contractor${count !== 1 ? "s" : ""} matching your request.${count > 0 ? "\n\n" + result.data.map((c: any) => `• **${c.name}** (${c.service_type || "General"}) - ${c.preferred_status ? "⭐ Preferred" : "Active"}`).join("\n") : "\n\nNo matching contractors found."}`,
      data: result.data,
    };
  }

  // Knowledge Base Search
  if (functionName === "search_knowledge") {
    const count = result.data?.length || 0;
    if (count === 0) {
      return {
        success: true,
        response: `🕵️ **Knowledge Base**\n\nI couldn't find any specific statutory guidance for that query. I'll search my general training data to help you.`,
        data: result.data,
      };
    }
    return {
      success: true,
      response: `📚 **Statutory Guidance Found**\n\nI found the following guidance in my compliance library:\n\n${result.data.map((k: any) => `**${k.topic}**\n${k.content}\n*Ref: ${k.legislation_reference || "General Guidance"}*`).join("\n\n")}`,
      data: result.data,
    };
  }

  // Compliance Tasks
  if (functionName === "list_compliance_tasks") {
    const count = result.data?.length || 0;
    return {
      success: true,
      response: `📋 **Compliance Tasks**\n\nThere are **${count}** compliance tasks for this domain.\n\n${result.data.map((t: any) => `• **${t.title}** (${t.status}) - Due: ${new Date(t.due_date).toLocaleDateString()}`).join("\n")}`,
      data: result.data,
    };
  }

  // Contractor Bullshit Filter
  if (functionName === "validate_contractor_recommendation") {
    const d = result.data;
    const status = d.is_valid
      ? "✅ VALID (Statutory)"
      : "⚠️ NEEDS REVIEW (Potential Upsell)";
    return {
      success: true,
      response: `🛡️ **Contractor Recommendation Analysis**\n\n**Status:** ${status}\n\n**Recommendation:** "${d.recommendation}"\n\n**Analysis:** ${d.reasoning}\n\n${d.statutory_reference ? `**Reference:** ${d.statutory_reference}` : ""}`,
      data: result.data,
    };
  }

  // Intelligence Analysis
  if (functionName === "run_intelligence_analysis") {
    return {
      success: true,
      response: `📊 **Intelligence Analysis Complete!**\n\n${result.data?.summary || "Analysis has been run successfully."}\n\n${result.data?.keyFindings?.length ? "**Key Findings:**\n" + result.data.keyFindings.map((f: any) => `• ${f}`).join("\n") : ""}`,
      data: result.data,
    };
  }

  if (functionName === "get_cohort_journey") {
    const d = result.data;
    return {
      success: true,
      response: `📈 **Cohort Journey: Year ${d?.currentYearGroup || "?"}**\n\n${d?.journey?.length ? d.journey.map((y: any) => `• **${y.year}** (Year ${y.yearGroup}): ${y.summary}`).join("\n") : "No journey data available."}\n\n${d?.covidImpact ? `⚠️ **COVID Impact:** ${d.covidImpact}` : ""}`,
      data: result.data,
    };
  }

  if (functionName === "get_assessment_insights") {
    const insights = result.data?.insights || [];
    const critical = insights.filter(
      (i: any) => i.severity === "critical" || i.severity === "high",
    );
    return {
      success: true,
      response: `🔍 **Assessment Insights**\n\n${critical.length > 0 ? "**Priority Items:**\n" + critical.map((i: any) => `• [${i.severity.toUpperCase()}] ${i.title}: ${i.description}`).join("\n") : "No critical insights found."}\n\n*${insights.length} total insight(s) from pupil assessment analysis.*`,
      data: result.data,
    };
  }

  if (functionName === "get_contextual_factors") {
    const factors = result.data || [];
    return {
      success: true,
      response: `📋 **Active Contextual Factors**\n\n${factors.length > 0 ? factors.map((f: any) => `• **${f.factor_type}**: ${f.description}${f.affected_year_groups?.length ? ` (Year ${f.affected_year_groups.join(", ")})` : ""}`).join("\n") : "No active contextual factors recorded."}`,
      data: result.data,
    };
  }

  if (functionName === "get_dfe_trends") {
    return {
      success: true,
      response: `📊 **DfE Data Trends**\n\n${result.data?.summary || "DfE trend data retrieved successfully."}\n\n${result.data?.highlights?.length ? "**Highlights:**\n" + result.data.highlights.map((h: any) => `• ${h}`).join("\n") : ""}`,
      data: result.data,
    };
  }

  if (functionName === "get_cross_module_signals") {
    const signals = result.data || {};
    const alertCount = Object.values(signals).reduce(
      (sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0),
      0,
    );
    return {
      success: true,
      response: `🔔 **Cross-Module Signals**\n\n${
        alertCount > 0
          ? `Found **${alertCount}** signal(s) across modules that may affect pupil outcomes:\n${Object.entries(
              signals,
            )
              .map(([mod, items]: [string, any]) =>
                items?.length
                  ? `\n**${mod}:**\n${items.map((i: any) => `• ${i}`).join("\n")}`
                  : "",
              )
              .filter(Boolean)
              .join("\n")}`
          : "No cross-module alerts detected."
      }`,
      data: result.data,
    };
  }

  // Document Production
  if (functionName === "list_document_templates") {
    const templates = result.data || [];
    const count = templates.length;
    const byModule: Record<string, number> = {};
    templates.forEach((t: any) => {
      byModule[t.module] = (byModule[t.module] || 0) + 1;
    });
    return {
      success: true,
      response: `📄 **Document Templates**\n\nFound **${count}** template${count !== 1 ? "s" : ""}${
        Object.keys(byModule).length > 0
          ? ":\n" +
            Object.entries(byModule)
              .map(
                ([mod, n]) =>
                  `• **${mod}**: ${n} template${n !== 1 ? "s" : ""}`,
              )
              .join("\n")
          : "."
      }\n\n${templates
        .slice(0, 8)
        .map((t: any) => `• **${t.name}** (${t.module}/${t.document_type})`)
        .join("\n")}${count > 8 ? `\n\n*...and ${count - 8} more*` : ""}`,
      data: result.data,
    };
  }

  if (functionName === "generate_document") {
    const doc = result.data;
    return {
      success: true,
      response: `✅ **Document Generated!**\n\n**Subject:** ${doc?.subject || "Document"}\n**Recipient:** ${doc?.recipient_name || "N/A"}\n**Status:** Draft\n\nYou can review and edit the document at [${doc?.view_url || "/dashboard/documents"}](${doc?.view_url || "/dashboard/documents"}). Once you're happy with it, finalise and send it from there.`,
      data: result.data,
    };
  }

  if (functionName === "list_generated_documents") {
    const docs = result.data || [];
    const count = docs.length;
    return {
      success: true,
      response: `📋 **Recent Documents**\n\n${
        count > 0
          ? docs
              .slice(0, 10)
              .map(
                (d: any) =>
                  `• **${d.subject || "Untitled"}** → ${d.recipient_name} (${d.status}) - ${new Date(d.created_at).toLocaleDateString("en-GB")}`,
              )
              .join("\n")
          : "No documents found matching your criteria."
      }`,
      data: result.data,
    };
  }

  if (functionName === "get_document") {
    const doc = result.data;
    return {
      success: true,
      response: `📄 **Document Details**\n\n**Subject:** ${doc?.subject || "N/A"}\n**Recipient:** ${doc?.recipient_name || "N/A"}\n**Status:** ${doc?.status || "N/A"}\n**Module:** ${doc?.module || "N/A"}\n**Created:** ${doc?.created_at ? new Date(doc.created_at).toLocaleDateString("en-GB") : "N/A"}\n${doc?.sent_at ? `**Sent:** ${new Date(doc.sent_at).toLocaleDateString("en-GB")}` : ""}`,
      data: result.data,
    };
  }

  if (functionName === "send_document") {
    return {
      success: true,
      response: `✅ **Document Sent!**\n\nThe document has been emailed to **${result.data?.recipient_email || "the recipient"}**.`,
      data: result.data,
    };
  }

  if (functionName === "generate_newsletter") {
    const nl = result.data;
    return {
      success: true,
      response: `📰 **Newsletter Generated!**\n\n**Title:** ${nl?.subject || nl?.title || "Newsletter"}\n**Week ending:** ${nl?.week_ending || "This week"}\n**Sections:** ${nl?.section_count || "?"}\n**Status:** Draft\n\nYou can preview and edit it at [${nl?.view_url || "/dashboard/documents"}](${nl?.view_url || "/dashboard/documents"}). Once you're happy, finalise and send it to parents.`,
      data: result.data,
    };
  }

  // Workflow Engine
  if (functionName === "create_workflow") {
    const wf = result.data;
    const phaseCount = wf?.phases?.length || wf?.phase_count || "?";
    const stepCount = wf?.total_steps || wf?.step_count || "?";
    return {
      success: true,
      response: `✅ **Workflow Created!**\n\n**Title:** ${wf?.title || "New workflow"}\n**Template:** ${wf?.template_slug || "custom"}\n**Phases:** ${phaseCount} | **Steps:** ${stepCount}\n\nPhase 1 is now active. Use "get workflow status" to see the full breakdown.`,
      data: result.data,
    };
  }

  if (functionName === "get_workflow_status") {
    const wf = result.data;
    const progress = wf?.progress ?? 0;
    const currentPhase =
      wf?.current_phase?.title || wf?.current_phase_title || "N/A";
    const nextSteps = wf?.next_actions || wf?.actionable_steps || [];
    return {
      success: true,
      response: `📋 **Workflow: ${wf?.title || "Workflow"}**\n\n**Status:** ${wf?.status || "active"}\n**Progress:** ${progress}%\n**Current Phase:** ${currentPhase}\n\n${
        nextSteps.length > 0
          ? "**Next Steps:**\n" +
            nextSteps
              .slice(0, 5)
              .map(
                (s: any) =>
                  `• ${s.title || s.name} (${s.assigned_role || "unassigned"})`,
              )
              .join("\n")
          : "No actionable steps right now."
      }`,
      data: result.data,
    };
  }

  if (functionName === "update_workflow_step") {
    const d = result.data;
    const phaseMsg = d?.phaseAdvanced
      ? `\n\n🎉 Phase advanced to: **${d.newPhase?.title || d.newPhase || "next phase"}**`
      : "";
    return {
      success: true,
      response: `✅ **Step Updated!**\n\nMarked as **${d?.status || "updated"}**.${d?.progress !== undefined ? ` Progress: **${d.progress}%**` : ""}${phaseMsg}`,
      data: result.data,
    };
  }

  if (functionName === "get_my_workflow_tasks") {
    const tasks = result.data?.tasks || result.data || [];
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        success: true,
        response: `📋 **My Workflow Tasks**\n\nNo workflow tasks assigned to you right now.`,
        data: result.data,
      };
    }
    // Group by workflow
    const byWorkflow: Record<string, any[]> = {};
    tasks.forEach((t: any) => {
      const wfTitle = t.workflow_title || t.workflow_id || "Workflow";
      if (!byWorkflow[wfTitle]) byWorkflow[wfTitle] = [];
      byWorkflow[wfTitle].push(t);
    });
    const lines = Object.entries(byWorkflow)
      .map(
        ([wf, items]) =>
          `**${wf}:**\n${items
            .map(
              (t: any) =>
                `• ${t.title || t.step_title} (${t.phase_title || "Phase ?"})${t.urgency ? ` — ${t.urgency}` : ""}`,
            )
            .join("\n")}`,
      )
      .join("\n\n");
    return {
      success: true,
      response: `📋 **My Workflow Tasks** (${tasks.length})\n\n${lines}`,
      data: result.data,
    };
  }

  if (functionName === "advance_workflow") {
    const d = result.data;
    if (d?.workflowComplete || d?.status === "completed") {
      return {
        success: true,
        response: `🎉 **Workflow Complete!**\n\nAll phases have been completed.`,
        data: result.data,
      };
    }
    return {
      success: true,
      response: `✅ **Phase Advanced!**\n\n${d?.previousPhase ? `Phase "${d.previousPhase.title || d.previousPhase}" completed.` : "Previous phase completed."} ${d?.currentPhase ? `**Now active:** ${d.currentPhase.title || d.currentPhase}` : ""}`,
      data: result.data,
    };
  }

  if (functionName === "create_procurement_request") {
    const pr = result.data;
    const amount = pr?.estimated_amount
      ? `£${Number(pr.estimated_amount).toLocaleString("en-GB")}`
      : "TBC";
    return {
      success: true,
      response: `✅ **Procurement Request Created!**\n\n**Title:** ${pr?.title || "Procurement"}\n**Estimated:** ${amount}\n**Quotes Required:** ${pr?.quotes_required || 3}\n${pr?.budget_line_cfr ? `**Budget Line:** ${pr.budget_line_cfr}` : ""}\n\nThe request is now tracked and awaiting quotes.`,
      data: result.data,
    };
  }

  // Terry Taurus — Propose → Approve responses
  if (functionName.startsWith("terry_")) {
    const terryResult = result.data as {
      type: "proposal" | "query_result";
      proposal?: Record<string, unknown>;
      data?: unknown[];
      message?: string;
    };

    if (terryResult?.type === "proposal" && terryResult.proposal) {
      const p = terryResult.proposal;
      const risk = p.risk_assessment as
        | { score?: number; safeguarding_flag?: boolean; reasoning?: string }
        | undefined;
      const riskLine =
        risk
          ? `\n**Risk Score:** ${risk.score ?? "?"}/25${risk.safeguarding_flag ? " — ⚠️ SAFEGUARDING FLAG" : ""}`
          : "";
      return {
        success: true,
        response: `🐂 **Terry's Proposal — ${String(p.action || "").toUpperCase()}**\n\n${String(p.summary || "")}\n${riskLine}\n\n${String(terryResult.message || "")}\n\nChoose: ✅ **Approve** | ✏️ **Edit** | ❌ **Reject**\n\n*Proposal ID: ${String(p.proposal_id || "")}*`,
        data: result.data,
      };
    }

    if (terryResult?.type === "query_result") {
      const count = Array.isArray(terryResult.data) ? terryResult.data.length : 0;
      return {
        success: true,
        response: `🐂 **Terry's Answer**\n\n${String(terryResult.message || `Found ${count} result(s).`)}`,
        data: result.data,
      };
    }
  }

  // Default
  return {
    success: true,
    response: `✅ Action completed successfully.`,
    data: result.data,
  };
}

// ============================================================================
// Phase 4: Form Skills Integration
// ============================================================================

/**
 * Get all available skills including form skills
 */
export function getAllSkillTools() {
  const platformSkills = getSkillTools();
  const formSkills = getFormSkillFunctions();
  return [...platformSkills, ...formSkills];
}

/**
 * Get form skills list for UI display
 */
export function getFormSkillsList() {
  return FORM_SKILLS.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    isAutomated: skill.isAutomated,
    requiresApproval: skill.requiresApproval,
    riskLevel: skill.riskLevel,
  }));
}
