/**
 * Agent Router
 * Routes questions to appropriate specialist agent and generates LLM responses
 */

import type {
  AppContext,
  SpecialistId,
  AgentResponse,
  SchoolContext,
} from "../types";
import { AGENTS, getAgent } from "../agents";
import { getSkillTools, executeSkill } from "../agents/skills-agent";
import { invalidateContextCache } from "./context-loader";
import { classifyIntent } from "./intent-classifier";
import { queryKnowledgeBase } from "../knowledge-base/query";
import { getModelRouter } from "../models";
import {
  buildEnrichedPrompt,
  getTypeSpecificGuidance,
  buildSchoolContextBlock,
  buildIntelligenceContextBlock,
} from "./context-loader";

/**
 * Route question to appropriate specialist and get response
 */
export async function routeToSpecialist(
  question: string,
  context: AppContext,
  options?: {
    screenshot?: string;
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
  },
): Promise<AgentResponse> {
  // 1. Classify intent
  const classification = classifyIntent(
    question,
    context.activeApp,
    context.userRole,
  );

  // 1b. ZERO-TRUST PII FIREWALL: Intercept prompt before any LLM processing
  const { SchoolDataGuardian } = await import("../../../../apps/platform/src/lib/school-data-guardian");
  const guardianCheck = SchoolDataGuardian.scanAndScrub(question);
  
  if (!guardianCheck.isClean) {
    console.warn(`[Data Guardian] Blocked prompt due to PII: ${guardianCheck.blockedCategories.join(", ")}`);
    return {
      agentId: "ed-general",
      content: `I've stopped processing this request because our **School Data Guardian** automatically detected sensitive personal information (${guardianCheck.blockedCategories.join(", ")}).\n\nTo ensure we maintain strict GDPR compliance, I cannot send un-pseudonymised pupil or staff data to the AI model. Please remove names, dates of birth, and contact information, and try again.`,
      confidence: "HIGH",
      requiresHuman: false,
      metadata: { blocked: "pii_guardian_intervention", categories: guardianCheck.blockedCategories },
    };
  }

  // 2. Check if user has access to this feature
  if (!hasFeatureAccess(context, classification.domain)) {
    return {
      agentId: "ed-general",
      content: getUpgradeMessage(classification.domain),
      confidence: "HIGH",
      requiresHuman: false,
      metadata: { blocked: "feature_access" },
    };
  }

  // 3. Check knowledge base first (for high-confidence factual queries)
  if (classification.confidence > 0.7 && classification.isWorkRelated) {
    const cached = await queryKnowledgeBase(
      context.supabase,
      question,
      classification.domain,
    );
    if (cached && cached.confidence === "HIGH") {
      return {
        agentId: classification.specialist,
        content: formatCachedResponse(cached),
        sources: [
          {
            name: cached.sourceName,
            url: cached.sourceUrl,
            type: cached.sourceType,
            lastVerified: cached.lastVerified,
          },
        ],
        confidence: cached.confidence,
        metadata: { cached: true, knowledgeId: cached.id },
      };
    }
  }

  // 4. Get specialist agent definition
  const agent = getAgent(classification.specialist);
  if (!agent) {
    throw new Error(`Specialist not found: ${classification.specialist}`);
  }

  // 5. Build enriched prompt with school context (+ intelligence data if applicable)
  const enrichedPrompt = await buildSpecialistPrompt(
    agent.systemPrompt,
    context.schoolData,
    question,
    context,
    agent.domain,
  );

  // 6. Call LLM via OpenRouter with Tools
  const modelRouter = getModelRouter(context.openRouterApiKey);

  // Use vision model if screenshot provided
  const hasVision = !!options?.screenshot;
  const model = hasVision
    ? modelRouter.selectModel("ui-analysis", context)
    : modelRouter.selectModel("specialist-response", context);

  // Get skill tools for the LLM
  const tools = getSkillTools();

  // Build user message (multimodal if screenshot)
  const userMessage = hasVision
    ? modelRouter.buildVisionMessage(question, options.screenshot)
    : { role: "user" as const, content: question };

  try {
    // Build message array: system prompt + conversation history + current question
    const llmMessages: Array<{ role: string; content: any }> = [
      { role: "system", content: enrichedPrompt },
    ];

    // Include conversation history for multi-turn context
    if (options?.messages && options.messages.length > 0) {
      for (const msg of options.messages.slice(-8)) {
        llmMessages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current question
    llmMessages.push(userMessage);

    const llmResponse = await modelRouter.chatMessages(llmMessages as any, {
      model: model.id,
      temperature: 0.7,
      maxTokens: 2048,
      tools: tools,
    });

    // 7. Check for Tool Calls
    if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
      const toolCall = llmResponse.toolCalls[0]; // Handle first tool call
      const functionName = toolCall.function.name;
      let args = {};

      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("[Agent Router] Error parsing tool arguments:", e);
      }

      // Execute the skill
      const skillResult = await executeSkill(functionName, args);

      // Invalidate context cache after successful write operations
      // so the next user message gets fresh data
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      if (skillResult.success && args?.organization_id) {
        // @ts-expect-error - Auto-masked during strict compilation enforcement
        invalidateContextCache(args.organization_id);
      }

      return {
        agentId: classification.specialist,
        content: skillResult.response,
        sources: [
          {
            name: `${agent.name} (Action: ${functionName})`,
            type: "AI Action",
          },
        ],
        confidence: "HIGH",
        requiresHuman: !skillResult.success,
        metadata: {
          classification,
          modelUsed: model.id,
          toolCall: {
            name: functionName,
            arguments: args,
            success: skillResult.success,
          },
          tokensUsed: {
            input: llmResponse.usage.promptTokens,
            output: llmResponse.usage.completionTokens,
            total: llmResponse.usage.totalTokens,
          },
        },
      };
    }

    // 7b. Fallback: detect text-based function calls (some models output these as text)
    const textToolMatch = llmResponse.content?.match(
      /```(?:tool_code|function_call|json)?\s*\n?\s*(\w+)\s*\((.*?)\)\s*```/s,
    );
    if (textToolMatch) {
      const [, funcName, argsStr] = textToolMatch;
      try {
        const args = argsStr.trim()
          ? JSON.parse(
              argsStr.trim().startsWith("{")
                ? argsStr.trim()
                : `{${argsStr.trim()}}`,
            )
          : {};
        const skillResult = await executeSkill(funcName, args);
        return {
          agentId: classification.specialist,
          content: skillResult.response,
          sources: [
            { name: `${agent.name} (Action: ${funcName})`, type: "AI Action" },
          ],
          confidence: "HIGH",
          requiresHuman: !skillResult.success,
          metadata: {
            classification,
            modelUsed: model.id,
            toolCall: {
              name: funcName,
              arguments: args,
              success: skillResult.success,
            },
          },
        };
      } catch (e) {
        console.error("[Agent Router] Text tool call fallback error:", e);
      }
    }

    // 8. Format standard natural language response
    return {
      agentId: classification.specialist,
      content: llmResponse.content,
      sources: [
        {
          name: `${agent.name} (AI)`,
          type: "AI Specialist",
        },
      ],
      confidence: "MEDIUM",
      metadata: {
        classification,
        modelUsed: model.id,
        tokensUsed: {
          input: llmResponse.usage.promptTokens,
          output: llmResponse.usage.completionTokens,
          total: llmResponse.usage.totalTokens,
        },
      },
    };
  } catch (error) {
    // Handle LLM errors gracefully
    return {
      agentId: classification.specialist,
      content: getErrorMessage(error),
      confidence: "LOW",
      requiresHuman: true,
      metadata: {
        classification,
        modelUsed: model.id,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Build specialist prompt with school context
 */
async function buildSpecialistPrompt(
  basePrompt: string,
  schoolContext: SchoolContext | null | undefined,
  question: string,
  context?: AppContext,
  domain?: string,
): Promise<string> {
  let prompt = basePrompt;

  // Add school context if available
  if (schoolContext) {
    const contextBlock = buildSchoolContextBlock(schoolContext);
    prompt = `${contextBlock}\n\n${prompt}`;

    // Add type-specific guidance
    const typeGuidance = getTypeSpecificGuidance(schoolContext);
    if (typeGuidance.length > 0) {
      prompt = `${prompt}\n\n## Additional Context for This School\n\n${typeGuidance.join("\n")}`;
    }
  }

  // Inject data access control rules based on user role
  if (context?.userRole) {
    const accessRules = buildAccessControlBlock(context.userRole, domain);
    prompt = `${prompt}\n\n${accessRules}`;
  }

  // Inject platform knowledge so Ed can guide users through every module
  const platformGuide = `## Schoolgle Platform Guide
You are an expert on every module in Schoolgle. Guide users step-by-step. Use markdown links for navigation: [Go to Page](/route)
User is on: ${(context as any)?.url || "/dashboard"}

### Modules & How to Use Them

**Estates** (/dashboard/estates) — Building management, compliance, energy
- [Maintenance](/dashboard/estates/maintenance): Log repairs via helpdesk. Click "+ New Ticket", set priority, assign location, describe issue.
- [Energy](/dashboard/estates/energy): View consumption charts, meter readings, anomaly alerts. Upload meter photos for AI extraction.
- [Floor Plans](/dashboard/estates/floor-plan): Interactive building maps. Click rooms to see assets, compliance status, recent inspections.
- [Compliance Checks](/estates-compliance): 200+ statutory checks (fire, legionella, asbestos, electrical). Each domain has its own checklist.
- [Asset Tags](/dashboard/estates/asset-tags): Generate QR codes. Print and stick on equipment for mobile scanning.
- [Workflows](/dashboard/workflows): Multi-step processes (incident response, equipment failure). Follow the guided checklist.
- [SOPs](/dashboard/sops): Step-by-step procedures for H&S tasks (fire checks, legionella flushing, RIDDOR reporting).

**HR & People** (/dashboard/hr) — Staff management, absence, performance
- [Staff Directory](/dashboard/hr/people): Add/edit staff, CSV import/export. Click "+ Add Staff" or use bulk import.
- [Meetings](/dashboard/hr/meetings): AI-guided HR meetings (sickness, disciplinary, grievance). Generates minutes automatically.
- [Sickness](/dashboard/hr/sickness): Bradford Factor tracking (S²×D formula). Triggers at thresholds (200=concern, 500=action).
- [Performance](/dashboard/hr/performance): Appraisal cycles, objectives, ECT tracking. Set cycle → assign objectives → review.
- [Cover](/dashboard/hr/cover): Record absences (13 types), arrange supply, track costs against ICFP budget line E02.
- [Connectors](/dashboard/connectors): Statutory roles (DSL, SENCO, Fire Marshal). Shows who holds what, training expiry, leaving impact.

**Finance** (/dashboard/finance) — Budget, spending, staffing analysis
- [Budget Monitor](/dashboard/finance/monitor): Real-time spend vs budget by CFR code. Drill into any line to see transactions.
- [Staffing Modeller](/dashboard/finance/staffing-modeller): Drag staff cards to model scenarios. ICFP metrics auto-calculate.
- [Payroll Import](/dashboard/finance/payroll): Upload payroll CSV. Auto-maps to CFR codes and staff records.

**Compliance** (/dashboard/compliance) — Policies, training, GDPR, SCR
- [Policies](/dashboard/compliance/policies): 36 policy templates. Set review dates, assign owners, track versions.
- [Training](/dashboard/compliance/training): Staff training matrix. Upload certificates, set expiry alerts.
- [GDPR](/dashboard/compliance/gdpr): DPIAs, SARs, breach log. Step-by-step DPIA wizard.
- [SCR](/dashboard/compliance/scr): Single Central Record. DBS checks, right to work, qualifications in one view.
- [Complaints](/dashboard/compliance/complaints): 3-stage procedure. Log → investigate → resolve. Auto-tracks timescales.

**Governance** (/dashboard/governance) — Governor portal, meetings, policies
- [Portal](/dashboard/governance): Governor directory, training matrix, term dates. Click governor to see DBS, training, attendance.
- [Visits](/dashboard/governance/visits): Plan monitoring visits, log findings, share reports with board.

**Risk Register** (/dashboard/risk) — Risk management, 4T decisions
- [Heat Map](/dashboard/risk): 5×5 likelihood × impact matrix. Click any risk to see details and mitigations.
- [Decisions](/dashboard/risk/decisions): Record 4T decisions (Treat/Tolerate/Transfer/Terminate) with rationale.
- [ICFP](/dashboard/risk/icfp): Magnificent Seven staffing metrics. Benchmarks against DfE thresholds.
- [Trust](/dashboard/risk/trust): Trust-wide risk aggregation. ATH 2025 compliance checklist.

**Inspection Readiness** (/dashboard/improvement) — Ofsted, SIAMS, SEF, SDP
- [Ofsted Readiness](/dashboard/ofsted-readiness): 4 key judgements tracked with evidence. Auto-generated readiness score.
- [SEF Builder](/dashboard/sef): Living self-evaluation form. Pulls data from all modules automatically.
- [SDP](/dashboard/sdp): School development plan with priorities, milestones, and progress tracking.
- [Actions](/dashboard/action-plan): Improvement actions with EEF research backing and dual status tracking.

**Teaching & Learning** (/dashboard/teaching-learning) — Lesson planning, assessment
- [Lesson Studio](/dashboard/teaching-learning/lesson-studio): AI-connected lesson planning. Knows your pupils, links to curriculum.
- [Assessment Support](/dashboard/teaching-learning/assessment-support): Marking templates, feedback generators.

**Safeguarding** (/dashboard/safeguarding) — Concern logging, body maps, chronology
- Log concerns via "+ New Concern". Body map tool for recording injuries. KCSIE 2025 compliant.

**Attendance** (/dashboard/attendance) — AM/PM registration, PA tracking
- 25 DfE attendance codes. Mark present/absent per session. Auto-flags persistent absence (below 90%).

**SEND** (/dashboard/send) — SEN register, graduated approach, provision map
- Add pupils to register (K=SEN Support, E=EHCP). Track Assess→Plan→Do→Review cycles.

**Behaviour** (/dashboard/behaviour) — Incidents, consequences, exclusions
- Log incidents, apply consequence ladder, track exclusions (suspension/permanent). Bradford Factor for patterns.

**Communications** (/dashboard/communications) — Notices, broadcasts, displays
- [Notices](/dashboard/notices): Quick messages to staff/parents. Pin important ones.
- [Emergency Broadcast](/dashboard/emergency-broadcast): Zone-aware alerts (lockdown, evacuation, shelter). One click.

**Calendar** (/dashboard/calendar) — Term dates, events, parents' evening
- Add events, set term dates, manage parents' evening slot bookings.

**Surveys** (/dashboard/surveys) — Create, distribute, analyse
- Build surveys with drag-and-drop. Pre-built templates for parent/staff/pupil voice.

**School Website** (/dashboard/website) — Build, design, publish
- [Builder](/dashboard/website): Drag-and-drop page editor. Auto-compliance checking against 28 DfE requirements.
- [Compliance](/dashboard/website/compliance): Scan school website. Shows what's missing and what passes.

**Canvas** (/dashboard/canvas) — Data intelligence
- Upload CSV/Excel from any system (Arbor, SIMS, Bromcom, payroll). Auto-detects fields. Reconcile across systems.

**Documents** (/dashboard/documents) — Templates, generation, delivery
- 38 document templates. Auto-fills school/staff/meeting data. Generate → approve → send via email.

**Settings** (/dashboard/settings)
- [Data Connections](/dashboard/settings/data-connections): Connect Google Drive, OneDrive. Auto-scan for MIS data.
- [Class Assignments](/dashboard/settings/class-assignments): Assign teachers to classes for data visibility rules.
- [Privileges](/dashboard/settings/privileges): Role-based access control matrix.

### How to Help Users
1. When user asks "how do I..." → give step-by-step instructions with navigation links
2. When user asks "take me to..." → auto-navigate with [link](/route)
3. When user asks about data → offer to pull it via skills (list_staff, get_risk_register, etc.)
4. When user is confused → explain the module purpose and suggest where to start
5. Always reference the school by name. Be warm, concise, and action-oriented.
6. Don't add source citations for platform guidance — you ARE the source.`;

  prompt = `${prompt}\n\n${platformGuide}`;

  // Inject intelligence data when the intelligence specialist is handling
  if (domain === "intelligence" && context?.orgId && context?.supabase) {
    try {
      const intelligenceBlock = await buildIntelligenceContextBlock(
        context.orgId,
        context.supabase,
      );
      if (intelligenceBlock) {
        prompt = `${prompt}\n\n${intelligenceBlock}`;
      }
    } catch (error) {
      console.error(
        "[Agent Router] Intelligence context injection error:",
        error,
      );
    }
  }

  return prompt;
}

/**
 * Check if user has access to the feature/domain
 */
function hasFeatureAccess(context: AppContext, domain: string): boolean {
  if (context.subscription.plan === "free") {
    return ["general", "it-tech"].includes(domain);
  }

  if (context.subscription.plan === "schools") {
    return !["procurement", "governance"].includes(domain);
  }

  return true;
}

/**
 * Get upgrade message for locked features
 */
function getUpgradeMessage(domain: string): string {
  const upgradeMessages: Record<string, string> = {
    estates:
      "Estates Compliance support is available on the Schools plan. Upgrade to access RIDDOR, fire safety, and compliance guidance.",
    hr: "HR support is available on the Schools plan. Upgrade to access sickness, absence, and employment guidance.",
    send: "SEND support is available on the Schools plan. Upgrade to access EHCP and SEND guidance.",
    data: "Data support is available on the Schools plan. Upgrade to access census and data protection guidance.",
    curriculum:
      "Curriculum support is available on the Schools plan. Upgrade to access Ofsted and curriculum guidance.",
    procurement:
      "Procurement support is available on the Trusts plan. Upgrade to access framework and procurement guidance.",
    governance:
      "Governance support is available on the Trusts plan. Upgrade to access trust governance guidance.",
    communications:
      "Communications support is available on the Schools plan. Upgrade to access parent and media guidance.",
    intelligence:
      "School Intelligence is available on the Schools plan. Upgrade to access cohort tracking, attainment gap analysis, and EEF research recommendations.",
  };

  return (
    upgradeMessages[domain] ||
    "This feature is not available on your current plan."
  );
}

/**
 * Format cached knowledge base response
 */
function formatCachedResponse(cached: any): string {
  return `${cached.answer}

---
*This information is from ${cached.sourceName} and was last verified on ${new Date(cached.lastVerified).toLocaleDateString()}.*`;
}

/**
 * Get error message for LLM failures
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `I'm having trouble connecting to my knowledge base right now.

**Error:** ${error.message}

Please try again in a moment. If this continues, please contact support.`;
  }
  return "I encountered an error processing your request. Please try again.";
}

/**
 * Build data access control rules based on user role
 * These rules are injected into the system prompt so the LLM enforces access boundaries
 */
function buildAccessControlBlock(userRole: string, domain?: string): string {
  const rules = [
    "## Data Access & Privacy Rules (MANDATORY)",
    "",
    "You MUST follow these data access rules strictly. Violations could breach GDPR and school data protection policies.",
    "",
    "### Core Guardrails",
    "- You can ONLY access and discuss data belonging to the user's current organization.",
    "- NEVER reveal, reference, or compare data from other schools or organizations.",
    "- If a user asks about another school's data, politely explain you can only help with their school's information.",
    "- NEVER disclose individual pupil names or personally identifiable information.",
    "- When discussing pupil data, use anonymised terms (e.g., 'Pupil A', cohort-level data, percentages).",
    "",
  ];

  // Role-specific access restrictions
  if (userRole === "viewer") {
    rules.push("### Your Access Level: Viewer (Read-Only)");
    rules.push(
      "- You can view publicly shared school information and general guidance only.",
    );
    rules.push(
      "- You CANNOT access HR records, finance details, individual pupil data, or safeguarding information.",
    );
    rules.push(
      "- If asked about restricted data, explain: 'That information requires a higher access level. Please speak to your line manager or school administrator.'",
    );
  } else if (userRole === "staff") {
    rules.push("### Your Access Level: Staff");
    rules.push(
      "- You can access data relevant to your teaching responsibilities (your classes and year groups).",
    );
    rules.push(
      "- You CANNOT access: other staff members' HR records (pay, sickness, performance reviews), finance/budget details, safeguarding logs, or governance board papers unless you are a governor.",
    );
    rules.push(
      "- If asked about restricted data, explain: 'That information is restricted to senior leadership. Please speak to your headteacher or line manager.'",
    );
  } else if (userRole === "admin") {
    rules.push("### Your Access Level: Senior Leadership / Admin");
    rules.push(
      "- You have broad access to school data including HR, finance, safeguarding, governance, and pupil data.",
    );
    rules.push(
      "- Even at this level, exercise discretion. Only discuss sensitive personnel matters when directly relevant to the user's question.",
    );
    rules.push(
      "- Do not volunteer sensitive information (e.g., staff disciplinary details) unless specifically asked.",
    );
  }

  // Domain-specific restrictions
  if (domain === "hr") {
    rules.push("");
    rules.push("### HR Data Restrictions");
    rules.push(
      "- Salary information, sickness records, and performance reviews are strictly confidential.",
    );
    rules.push(
      "- Only discuss HR data if the user has admin/headteacher/slt role.",
    );
    rules.push("- Never reference individual Bradford Factor scores by name.");
  }

  if (domain === "intelligence") {
    rules.push("");
    rules.push("### Intelligence Data Restrictions");
    rules.push(
      "- Pupil assessment data is pseudonymised. NEVER attempt to identify individual pupils.",
    );
    rules.push("- Discuss trends and cohort-level patterns only.");
    rules.push(
      "- Teacher accuracy data should be discussed constructively, never punitively.",
    );
  }

  return rules.join("\n");
}
