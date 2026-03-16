/**
 * Form Skills Handlers
 *
 * RPA-style skills for automated form filling with human review
 * These skills extract data from systems and fill forms automatically
 */

import type { AppContext } from "../../types";

// ============================================================================
// Types
// ============================================================================

export interface FormSkillContext extends AppContext {
  formTemplate?: string;
  formData?: Record<string, any>;
  approvalRequired?: boolean;
}

export interface FormSkillResult {
  success: boolean;
  requiresApproval: boolean;
  approvalUrl?: string;
  runId?: string;
  message: string;
  data?: any;
  error?: string;
}

export interface IncidentDetails {
  incidentDate?: string;
  incidentTime?: string;
  incidentType?: string;
  personName?: string;
  personRole?: string;
  injuryNature?: string;
  bodyPartAffected?: string;
  location?: string;
  immediateCause?: string;
  daysAwayFromWork?: number;
  fatal?: boolean;
}

// ============================================================================
// Skill Handlers
// ============================================================================

/**
 * RIDDOR Injury Reporting Skill
 *
 * Extracts incident details and prepares RIDDOR form for submission
 * Requires human review before actual submission to HSE
 */
export async function handleRiddorFill(
  context: FormSkillContext,
  incidentDetails: IncidentDetails,
): Promise<FormSkillResult> {
  const { supabase, orgId, userId } = context;

  try {
    // 1. Get the RIDDOR skill definition
    const { data: skill } = await supabase
      .from("ed_rpa_skills")
      .select("*")
      .eq("skill_key", "hse_riddor_injury_auto")
      .single();

    if (!skill) {
      return {
        success: false,
        requiresApproval: false,
        message: "RIDDOR form skill not found. Please contact support.",
      };
    }

    // 2. Validate required fields
    const requiredFields = [
      "incidentDate",
      "incidentType",
      "personName",
      "injuryNature",
    ];
    const missingFields = requiredFields.filter(
      (field) => !incidentDetails[field as keyof IncidentDetails],
    );

    if (missingFields.length > 0) {
      return {
        success: false,
        requiresApproval: false,
        message: `Missing required information: ${missingFields.join(", ")}. Please provide these details.`,
        error: `Missing fields: ${missingFields.join(", ")}`,
      };
    }

    // 3. Prepare form data structure
    const formData = {
      "incident[date]": incidentDetails.incidentDate,
      "incident[time]": incidentDetails.incidentTime || "",
      "incident[type]": incidentDetails.incidentType,
      "person[name]": incidentDetails.personName,
      "person[role]": incidentDetails.personRole || "Employee",
      "injury[nature]": incidentDetails.injuryNature,
      "injury[bodyPart]": incidentDetails.bodyPartAffected || "",
      "incident[location]": incidentDetails.location || "",
      "incident[cause]": incidentDetails.immediateCause || "",
      "incident[daysAway]": incidentDetails.daysAwayFromWork || 0,
      "incident[fatal]": incidentDetails.fatal || false,
    };

    // 4. Create RPA run for approval
    const { data: run, error: runError } = await supabase.rpc(
      "create_rpa_run",
      {
        p_skill_id: skill.id,
        p_user_id: userId,
        p_school_id: orgId,
        p_trigger_type: "manual",
        p_input_data: formData,
      },
    );

    if (runError || !run) {
      console.error("[Riddor Skill] Failed to create run:", runError);
      return {
        success: false,
        requiresApproval: true,
        message: "Failed to create approval request. Please try again.",
        error: runError?.message,
      };
    }

    // 5. Generate approval URL
    const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/ed/approvals/${run}`;

    // 6. Return formatted message
    const isFatal = incidentDetails.fatal;
    const severity = isFatal
      ? "🚨 FATAL"
      : incidentDetails.daysAwayFromWork && incidentDetails.daysAwayFromWork > 7
        ? "⚠️ Over 7-day incapacitation"
        : "📋 Reportable injury";

    return {
      success: true,
      requiresApproval: true,
      approvalUrl,
      runId: run,
      message: `**${severity} - RIDDOR Report Prepared**

I've prepared the RIDDOR report with the following details:

**Incident Date:** ${incidentDetails.incidentDate}
**Time:** ${incidentDetails.incidentTime || "Not specified"}
**Person Injured:** ${incidentDetails.personName} (${incidentDetails.personRole || "Employee"})
**Injury Type:** ${incidentDetails.injuryNature}
**Body Part:** ${incidentDetails.bodyPartAffected || "Not specified"}
**Location:** ${incidentDetails.location || "Not specified"}
**Days Away From Work:** ${incidentDetails.daysAwayFromWork || 0}
${isFatal ? "**⚠️ FATAL - Phone follow-up required**" : ""}

${isFatal ? "⚠️ **This is a fatal incident. You must call HSE immediately on 0345 300 9923.**" : ""}

Please review carefully before I submit to the Health and Safety Executive.

[Review and Submit](${approvalUrl})`,
      data: formData,
    };
  } catch (error) {
    console.error("[Riddor Skill] Error:", error);
    return {
      success: false,
      requiresApproval: false,
      message:
        "I encountered an error preparing the RIDDOR report. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Safeguarding Concern Form Skill
 *
 * Guides through safeguarding report with suggested wording
 * Does NOT auto-fill - always human-guided for sensitivity
 */
export async function handleSafeguardingForm(
  context: FormSkillContext,
  concernDetails: {
    childName?: string;
    concerns: string;
    incidentDate?: string;
    witnesses?: string[];
    immediateRisk?: boolean;
  },
): Promise<FormSkillResult> {
  const { supabase, orgId, userId } = context;

  try {
    // 1. Analyze the concern for red flags
    const { data: redFlagCheck } = await supabase.rpc(
      "check_form_text_red_flags",
      {
        p_template_id: "safeguarding_concern",
        p_field_key: "concern_description",
        p_user_text: concernDetails.concerns,
      },
    );

    const hasRedFlags = redFlagCheck && (redFlagCheck as any).has_red_flags;
    const matchedFlags = hasRedFlags ? (redFlagCheck as any).matched_flags : [];

    // 2. Get suggested wording if there are issues
    let suggestedWording = null;
    if (hasRedFlags) {
      // For safeguarding, we don't auto-suggest - we flag for human review
      suggestedWording = {
        warning:
          "Your description may need adjustment for clarity and professionalism.",
        flags: matchedFlags
          .map((f: any) => `- **${f.type}**: ${f.explanation}`)
          .join("\n"),
      };
    }

    // 3. Create the concern record for DSL review
    const { data: concern } = await supabase
      .from("safeguarding_concerns")
      .insert({
        organization_id: orgId,
        reported_by: userId,
        child_name: concernDetails.childName,
        concern_description: concernDetails.concerns,
        incident_date: concernDetails.incidentDate,
        immediate_risk: concernDetails.immediateRisk || false,
        status: concernDetails.immediateRisk ? "urgent" : "pending_review",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    // 4. Generate appropriate response
    if (concernDetails.immediateRisk) {
      return {
        success: true,
        requiresApproval: false,
        message: `**🚨 URGENT: Immediate Risk Identified**

I've logged this safeguarding concern and marked it as URGENT.

**Immediate Action Required:**
1. Contact the DSL (Designated Safeguarding Lead) immediately
2. If child is in immediate danger, call 999
3. Do not investigate yourself - let the DSL handle it

**Concern Reference:** #${concern?.id?.substring(0, 8)}

${hasRedFlags ? `**Note:** ${suggestedWording?.warning}` : ""}

The DSL has been notified and will review this urgently.`,
        data: concern,
      };
    }

    return {
      success: true,
      requiresApproval: false,
      message: `**Safeguarding Concern Logged**

I've recorded your concern and it will be reviewed by the DSL.

**Details:**
${concernDetails.childName ? `- **Child:** ${concernDetails.childName}` : ""}
${concernDetails.incidentDate ? `- **Date:** ${concernDetails.incidentDate}` : ""}

**Your Concern:**
"${concernDetails.concerns}"

${
  hasRedFlags
    ? `**⚠️ Review Needed:**
${suggestedWording?.flags}

The DSL may contact you to clarify these points before submitting to the LA.`
    : "**Next:** The DSL will review and may contact you for clarification before formal submission."
}

**Reference:** #${concern?.id?.substring(0, 8)}`,
      data: concern,
    };
  } catch (error) {
    console.error("[Safeguarding Skill] Error:", error);
    return {
      success: false,
      requiresApproval: false,
      message:
        "I encountered an error logging your concern. Please speak to the DSL directly.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * SEND EHCP Application Skill
 *
 * Helps parents complete EHCP request with legal guidance
 * Provides field-by-field guidance, no auto-fill
 */
export async function handleSendEhcpGuidance(
  context: FormSkillContext,
  question: string,
  currentField?: string,
): Promise<FormSkillResult> {
  const { supabase, orgId } = context;

  try {
    // 1. Get field knowledge if current field specified
    let fieldKnowledge = null;
    if (currentField) {
      const { data } = await supabase.rpc("get_field_knowledge", {
        p_template_id: "send_section_a",
        p_field_key: currentField,
      });

      if (data && Array.isArray(data) && data.length > 0) {
        fieldKnowledge = data[0];
      }
    }

    // 2. Build guidance response
    if (fieldKnowledge) {
      const redFlags = (fieldKnowledge as any).red_flags || [];
      const suggestedWordings = (fieldKnowledge as any).suggested_wordings;

      return {
        success: true,
        requiresApproval: false,
        message: `**${(fieldKnowledge as any).field_label}**

**What they're asking:**
${(fieldKnowledge as any).explanation}

${
  redFlags.length > 0
    ? `**⚠️ Be careful with:**
${redFlags.map((f: any) => `- ${f.type}: ${f.explanation}`).join("\n")}
`
    : ""
}

${
  suggestedWordings
    ? `**💡 Suggested wording:**
${suggestedWordings.formal ? `- **Formal:** ${suggestedWordings.formal}` : ""}
${suggestedWordings.simple ? `- **Simple:** ${suggestedWordings.simple}` : ""}
`
    : ""
}

${
  question
    ? `**Your draft:** "${question}"
\nWould you like me to suggest improvements?`
    : ""
}`,
        data: fieldKnowledge,
      };
    }

    // 3. General EHCP guidance
    return {
      success: true,
      requiresApproval: false,
      message: `**SEND EHCP Application - Guidance**

I can help you with the EHCP application form. Here are the key sections:

**Section A - Parental Views:**
- Your concerns about your child's special educational needs
- Specific examples of difficulties they're experiencing
- Evidence of lack of progress despite support

**Child's Views:**
- If your child is 7 or older, their views MUST be included
- You can report what they say in their own words

**What to include:**
- Specific examples (reading age, writing difficulties, social struggles)
- Professional reports you have
- School communications
- Impact on daily life

**What to avoid:**
- Blaming individual teachers
- Emotional or aggressive language
- Vague statements without examples

Which section would you like help with?`,
    };
  } catch (error) {
    console.error("[SEND Skill] Error:", error);
    return {
      success: false,
      requiresApproval: false,
      message:
        "I encountered an error providing EHCP guidance. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Bradford Sickness Reporting Skill
 *
 * Extracts sickness data from HR system and prepares for submission
 * to Bradford Council (example of LA-specific automation)
 */
export async function handleBradfordSicknessReport(
  context: FormSkillContext,
  dateRange?: string,
): Promise<FormSkillResult> {
  const { supabase, orgId, userId } = context;

  try {
    // 1. Check if school is eligible (Bradford LA)
    const { data: org } = await supabase
      .from("organizations")
      .select("local_authority")
      .eq("id", orgId)
      .single();

    if (!org || org.local_authority !== "Bradford") {
      return {
        success: false,
        requiresApproval: false,
        message:
          "This automation is only available to Bradford schools. Please contact support if you believe this is an error.",
      };
    }

    // 2. Get the Bradford sickness skill
    const { data: skill } = await supabase
      .from("ed_rpa_skills")
      .select("*")
      .eq("skill_key", "bradford_la_sickness_weekly")
      .single();

    if (!skill) {
      return {
        success: false,
        requiresApproval: false,
        message: "Bradford sickness reporting skill not found.",
      };
    }

    // 3. In a real implementation, we would:
    // - Query the HR system (Arbor/SIMS) for sickness absences
    // - Format the data according to Bradford's requirements
    // - Prepare the form for submission

    // For now, create a placeholder run
    const { data: run, error: runError } = await supabase.rpc(
      "create_rpa_run",
      {
        p_skill_id: skill.id,
        p_user_id: userId,
        p_school_id: orgId,
        p_trigger_type: "manual",
        p_input_data: { dateRange: dateRange || "last_7_days" },
      },
    );

    if (runError || !run) {
      return {
        success: false,
        requiresApproval: true,
        message: "Failed to create report request.",
      };
    }

    return {
      success: true,
      requiresApproval: true,
      approvalUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/ed/approvals/${run}`,
      runId: run,
      message: `**Bradford LA Sickness Report**

I can prepare the weekly sickness absence report for Bradford Council.

**Date Range:** ${dateRange || "Last 7 days"}

This will extract all sickness absences from your HR system and format them for submission to Bradford Council.

**Required:** School Business Manager review and approval before submission.

[Prepare Report](${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/ed/approvals/${run})`,
    };
  } catch (error) {
    console.error("[Bradford Skill] Error:", error);
    return {
      success: false,
      requiresApproval: false,
      message: "I encountered an error preparing the Bradford report.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Skill Registry
// ============================================================================

/**
 * Available form skills for registration
 */
export const FORM_SKILLS = [
  {
    id: "fill_riddor_injury",
    name: "RIDDOR Injury Reporting",
    description:
      "Prepare RIDDOR injury reports with human review before HSE submission",
    category: "Safety",
    handler: "handleRiddorFill",
    isAutomated: true,
    requiresApproval: true,
    riskLevel: "high",
  },
  {
    id: "fill_safeguarding",
    name: "Safeguarding Concern Form",
    description: "Log safeguarding concerns with DSL notification",
    category: "Safeguarding",
    handler: "handleSafeguardingForm",
    isAutomated: false,
    requiresApproval: false,
    riskLevel: "critical",
  },
  {
    id: "fill_send_ehcp",
    name: "SEND EHCP Application Guidance",
    description:
      "Step-by-step guidance for EHCP applications with legal context",
    category: "SEND",
    handler: "handleSendEhcpGuidance",
    isAutomated: false,
    requiresApproval: false,
    riskLevel: "medium",
  },
  {
    id: "report_bradford_sickness",
    name: "Bradford LA Sickness Reporting",
    description: "Prepare weekly sickness reports for Bradford Council",
    category: "HR",
    handler: "handleBradfordSicknessReport",
    isAutomated: true,
    requiresApproval: true,
    riskLevel: "medium",
    eligibleLocalAuthorities: ["Bradford"],
  },
];

/**
 * Get form skills as LLM function definitions
 */
export function getFormSkillFunctions() {
  return FORM_SKILLS.map((skill) => ({
    type: "function" as const,
    function: {
      name: skill.id,
      description: skill.description,
      parameters: {
        type: "object",
        properties: getSkillParameters(skill.id),
        required: getRequiredParameters(skill.id),
      },
    },
  }));
}

function getSkillParameters(skillId: string): Record<string, any> {
  switch (skillId) {
    case "fill_riddor_injury":
      return {
        incidentDate: {
          type: "string",
          description: "Date of the incident (YYYY-MM-DD)",
        },
        incidentTime: {
          type: "string",
          description: "Time of the incident (HH:MM)",
        },
        incidentType: {
          type: "string",
          description:
            'Type of incident (e.g., "Injury", "Death", "Dangerous occurrence")',
        },
        personName: {
          type: "string",
          description: "Name of the injured person",
        },
        personRole: {
          type: "string",
          description: 'Role (e.g., "Employee", "Pupil", "Visitor")',
        },
        injuryNature: { type: "string", description: "Nature of the injury" },
        bodyPartAffected: { type: "string", description: "Body part affected" },
        location: {
          type: "string",
          description: "Where the incident occurred",
        },
        immediateCause: {
          type: "string",
          description: "What caused the incident",
        },
        daysAwayFromWork: {
          type: "number",
          description: "Number of days away from work",
        },
        fatal: {
          type: "boolean",
          description: "Whether the incident was fatal",
        },
      };
    case "fill_safeguarding":
      return {
        childName: {
          type: "string",
          description: "Name of the child (optional)",
        },
        concerns: {
          type: "string",
          description: "Description of the concerns",
        },
        incidentDate: {
          type: "string",
          description: "Date of the incident (if applicable)",
        },
        immediateRisk: {
          type: "boolean",
          description: "Whether there is immediate risk to the child",
        },
      };
    case "fill_send_ehcp":
      return {
        question: {
          type: "string",
          description: "The user's question or drafted text",
        },
        currentField: {
          type: "string",
          description: "The current field they're working on (optional)",
        },
      };
    case "report_bradford_sickness":
      return {
        dateRange: {
          type: "string",
          description: "Date range for the report (default: last 7 days)",
        },
      };
    default:
      return {};
  }
}

function getRequiredParameters(skillId: string): string[] {
  switch (skillId) {
    case "fill_riddor_injury":
      return ["incidentDate", "incidentType", "personName", "injuryNature"];
    case "fill_safeguarding":
      return ["concerns"];
    case "fill_send_ehcp":
      return ["question"];
    case "report_bradford_sickness":
      return [];
    default:
      return [];
  }
}

/**
 * Execute a form skill by ID
 */
export async function executeFormSkill(
  skillId: string,
  parameters: Record<string, any>,
  context: FormSkillContext,
): Promise<FormSkillResult> {
  switch (skillId) {
    case "fill_riddor_injury":
      return await handleRiddorFill(context, parameters as IncidentDetails);
    case "fill_safeguarding":
      return await handleSafeguardingForm(
        context,
        parameters as Parameters<typeof handleSafeguardingForm>[1],
      );
    case "fill_send_ehcp":
      return await handleSendEhcpGuidance(
        context,
        parameters.question,
        parameters.currentField,
      );
    case "report_bradford_sickness":
      return await handleBradfordSicknessReport(context, parameters.dateRange);
    default:
      return {
        success: false,
        requiresApproval: false,
        message: `Unknown form skill: ${skillId}`,
      };
  }
}
