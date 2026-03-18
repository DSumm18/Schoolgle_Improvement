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

  // Inject app navigation context so Ed can direct users to the right page
  const navContext = `## Navigation
You can help users navigate the platform. When a user asks to go somewhere, include a markdown link they can click.
The user is currently on: ${(context as any)?.url || "the dashboard"}

Key routes:
- Dashboard: /dashboard
- Estates: /dashboard/estates — Energy: /dashboard/estates/energy — Floor Plans: /dashboard/estates/floor-plans
- Finance: /dashboard/finance — Staffing Modeller: /dashboard/finance/staffing-modeller — Suppliers: /dashboard/finance/suppliers
- HR & People: /dashboard/hr — Staff Directory: /dashboard/hr/people — Sickness: /dashboard/hr/sickness — Performance: /dashboard/hr/performance — Cover: /dashboard/hr/cover
- Compliance: /dashboard/compliance — Policies: /dashboard/compliance/policies — SCR: /dashboard/hr/scr — GDPR: /dashboard/compliance/gdpr
- Governance: /dashboard/governance — Meetings: /dashboard/governance/meetings
- Risk Register: /dashboard/risk — Trust Dashboard: /dashboard/risk/trust
- SEND: /dashboard/send
- Attendance: /dashboard/attendance
- Behaviour: /dashboard/behaviour
- Safeguarding: /dashboard/safeguarding
- Teaching & Learning: /dashboard/teaching-learning
- Inspection Readiness: /dashboard/improvement — SEF: /dashboard/improvement/sef — SDP: /dashboard/improvement/sdp
- Calendar: /dashboard/calendar
- Surveys: /dashboard/surveys
- Communications: /dashboard/communications
- Documents: /dashboard/documents
- Settings: /dashboard/settings — Data Connections: /dashboard/settings/data-connections

When suggesting navigation, use format: [Go to Energy Dashboard](/dashboard/estates/energy)
Keep responses concise and helpful. Don't add source citations or confidence ratings for general navigation help.`;

  prompt = `${prompt}\n\n${navContext}`;

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
