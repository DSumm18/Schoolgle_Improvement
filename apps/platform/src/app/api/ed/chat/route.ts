// Ed Chat API - Handles AI questions from browser extension

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

// Import Ed Orchestrator via webpack alias (see next.config.ts)
import {
  createOrchestrator,
  isGreeting,
  getContextualGreeting,
} from "@schoolgle/ed-agents";
import type { OrchestratorConfig } from "@schoolgle/ed-agents/types";

interface ChatRequest {
  question: string;
  image?: string; // Direct image upload (base64)
  context: {
    url: string;
    hostname: string;
    title: string;
    tool?: {
      id: string;
      name: string;
      category: string;
    };
    visibleText: string;
    headings: Array<{ level: number; text: string }>;
    selectedText?: string;
  };
  pageState?: {
    screenshot: string;
    domSnapshot: string;
  };
  // Phase 2: Form mode fields
  formMode?: {
    active: boolean;
    templateId?: string;
    currentField?: string;
    fieldsFilled?: string[];
    template?: any; // Form template from database
  };
  // Phase 2: Language preference
  language?: "en" | "ur" | "cy" | "other";
}

interface ChatResponse {
  id: string;
  answer: string;
  suggestions?: string[];
  confidence: number;
  source: "ai" | "cache" | "fallback" | "automation";
  automation?: {
    sessionId: string;
    actions: number;
    success: boolean;
  };
  // Phase 2: Form mode response fields
  formMode?: {
    active: boolean;
    templateId?: string;
    currentField?: string;
    suggestedWording?: {
      original: string;
      suggested: string;
      reason: string;
    };
    redFlags?: Array<{
      type: string;
      message: string;
      severity: "low" | "medium" | "high";
    }>;
  };
  // Phase 2: Translation support
  translation?: {
    originalText: string;
    originalLanguage: string;
    translatedText: string;
    suggestedWording?: string;
  };
}

// Tool-specific knowledge base for quick responses (retained for compatibility)
const QUICK_ANSWERS: Record<string, Record<string, string>> = {
  sims: {
    "add pupil":
      "To add a new pupil in SIMS: Go to Focus > Pupil > Pupil Details, click New, fill in the required fields (surname, forename, DOB, gender), then Save.",
    "attendance report":
      "To run an attendance report in SIMS: Go to Reports > Attendance Reports, select the report type, set your date range and year groups, then click Run Report.",
    "quick search":
      "Use Ctrl+Q for quick search in SIMS. You can search for pupils, staff, or other records by name.",
  },
  arbor: {
    "mark attendance":
      "To mark attendance in Arbor: Go to Students > Attendance > Mark Attendance, select your class, click each student to mark present or use quick mark buttons, then Save.",
    "send message":
      "To send a message in Arbor: Go to Communications > Messages > New Message, select recipients, choose email/SMS, write your message and send.",
    safeguarding:
      "To log a safeguarding concern in Arbor: Find the student profile, click the Safeguarding tab, click New Concern, complete all fields, and submit for DSL review.",
  },
  cpoms: {
    "log incident":
      "To log an incident in CPOMS: Click Add Incident (+), search for the student, choose the category, write a factual account, tag for DSL attention if urgent, then Submit.",
    "add action":
      "To add an action in CPOMS: Open the incident, click Add Action, select the type, assign to a staff member, set a due date, and Save.",
  },
  "google-classroom": {
    "create assignment":
      "To create an assignment in Google Classroom: Open your class, click Classwork tab, Create > Assignment, add title and instructions, set due date and points, then Assign.",
    "grade work":
      "To grade in Google Classroom: Open the assignment, click a submission, review, add comments, enter the grade, then Return to student.",
  },
  canva: {
    "create poster":
      'To create a poster in Canva: Click Create a Design, search "Poster", choose a template or start blank, add text/images, customise, then download or share.',
    "brand kit":
      "Set up your school's Brand Kit in Settings to maintain consistent colours and fonts across all designs.",
  },
};

/**
 * POST /api/ed/chat
 * Handle chat messages from Ed browser extension
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check - try cookie-based session first, then Bearer token fallback
    let user: any = null;
    const supabase = await createServerSupabaseClient();

    // 1. Try cookie-based session (SSR / same-origin fetch with credentials)
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) user = data.user;
    } catch {
      // Cookie auth failed
    }

    // 2. Fall back to Authorization: Bearer <token> header
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const tokenClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data, error } = await tokenClient.auth.getUser(token);
        if (!error && data.user) user = data.user;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    // Rate limit AI requests (20/min per user)
    const rateLimited = checkRateLimit(
      getRateLimitKey(request, "ed-chat", user.id),
      RATE_LIMITS.ai,
    );
    if (rateLimited) return rateLimited;

    const body: ChatRequest = await request.json();
    const { question, image, context, pageState, formMode, language } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 },
      );
    }

    // Phase 2: Check if this is a form helper request
    const isFormRequest = detectFormRequest(question, context?.url, formMode);
    if (isFormRequest || formMode?.active) {
      console.log(
        "[Ed Chat API] Form request detected, routing to form specialist",
      );
      return await handleFormRequest(body, supabase);
    }

    // Check if this is an automation request
    const needsAutomation = detectAutomationRequest(question);

    if (needsAutomation) {
      try {
        // Get API key from request body if provided (from extension)
        const geminiApiKey = (body as any).geminiApiKey;

        // Call automation API
        const automationResponse = await callAutomationAPI(
          question,
          context,
          pageState,
          geminiApiKey,
        );

        if (automationResponse) {
          return NextResponse.json({
            id: crypto.randomUUID(),
            answer: automationResponse.answer,
            confidence: 0.9,
            source: "automation",
            automation: {
              sessionId: automationResponse.sessionId,
              actions: automationResponse.actions,
              success: automationResponse.success,
            },
          });
        }
      } catch (error) {
        console.error("[Ed Chat API] Automation error:", error);
        // Fall through to regular AI response
      }
    }

    // Vision AI: Detect room scan / image analysis requests
    const isVisionRequest = detectVisionRequest(question, image);
    if (isVisionRequest && image) {
      console.log(
        "[Ed Chat API] Vision request detected, routing to Vision AI",
      );
      return await handleVisionRequest(body, supabase);
    }

    // Check learned knowledge patterns first (self-improving)
    const knowledgeResult = await searchLearnedKnowledge(
      supabase,
      question,
      context?.tool?.id,
    );
    if (knowledgeResult) {
      const response: ChatResponse = {
        id: crypto.randomUUID(),
        answer: knowledgeResult.answer,
        confidence: Math.min(knowledgeResult.confidence, 0.95),
        source: "cache",
      };
      return NextResponse.json(response);
    }

    // Check if this is a tool-specific quick answer first
    const quickAnswer = findQuickAnswer(question, context?.tool?.id);
    if (quickAnswer) {
      const response: ChatResponse = {
        id: crypto.randomUUID(),
        answer: quickAnswer,
        confidence: 0.9,
        source: "cache",
      };
      return NextResponse.json(response);
    }

    // Get user's organization and role via organization_members (proper multi-tenant lookup)
    let organization: any = null;
    let userRole: "admin" | "staff" | "viewer" = "viewer";
    let memberRole: string = "viewer";
    let subscription = {
      plan: "free" as const,
      features: [] as string[],
      creditsRemaining: 1000,
      creditsUsed: 0,
    };

    if (user) {
      // Use service role client for reliable org lookup via organization_members
      const { createServiceRoleClient } = await import("@/lib/supabase-server");
      const serviceClient = createServiceRoleClient();

      // Get user's active organization membership
      const { data: memberData } = await serviceClient
        .from("organization_members")
        .select("organization_id, role, organizations(*)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (memberData) {
        const org = memberData.organizations as any;
        organization = {
          ...org,
          id: memberData.organization_id,
          role: memberData.role,
        };
        memberRole = memberData.role || "viewer";

        // Map detailed role to Ed's simplified role model
        const roleMap: Record<string, "admin" | "staff" | "viewer"> = {
          admin: "admin",
          headteacher: "admin",
          slt: "admin",
          teacher: "staff",
          governor: "staff",
          caretaker: "staff",
          viewer: "viewer",
        };
        userRole = roleMap[memberRole] || "viewer";

        // Get subscription details
        subscription = {
          plan: (org?.subscription_plan as any) || "free",
          features: org?.features || [],
          creditsRemaining: org?.credits_remaining || 1000,
          creditsUsed: org?.credits_used || 0,
        };
      }

      // Check if Ed is enabled for this organization (if setting exists)
      if (organization?.id) {
        try {
          const { data: edSettings } = await serviceClient
            .from("organization_settings")
            .select("value")
            .eq("organization_id", organization.id)
            .eq("key", "ed_enabled")
            .single();

          // If ed_enabled is explicitly set to false, block access
          // Default: Ed is enabled unless explicitly disabled
          if (edSettings && edSettings.value === false) {
            return NextResponse.json(
              {
                error:
                  "Ed is not enabled for your school. An administrator can enable Ed in Settings.",
                code: "ED_DISABLED",
              },
              { status: 403 },
            );
          }
        } catch {
          // Table may not exist yet — default to Ed enabled
        }
      }
    }

    if (!organization?.id) {
      return NextResponse.json(
        { error: "No organization found for your account", code: "NO_ORG" },
        { status: 403 },
      );
    }

    // Determine active app based on context
    let activeApp: any;
    if (context?.tool?.id) {
      const appMap: Record<string, string> = {
        sims: "schoolgle-platform",
        arbor: "schoolgle-platform",
        cpoms: "schoolgle-platform",
      };
      activeApp = appMap[context.tool.id];
    }

    // Resolve user's first name for personalised greeting
    const fullName =
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "there";
    const firstName = fullName.split(" ")[0];

    // Check for greetings first - before any other processing
    if (isGreeting(question)) {
      // Create orchestrator for greeting context
      const greetApiKey = process.env.OPENROUTER_API_KEY || "";
      const greetConfig: OrchestratorConfig = {
        supabase,
        userId: user?.id || "anonymous",
        orgId: organization?.id || "unknown",
        userRole,
        subscription,
        activeApp,
        openRouterApiKey: greetApiKey,
      };

      const orchestrator = await createOrchestrator(greetConfig);
      const { greeting, alerts } = await orchestrator.handleProactiveGreeting({
        url: context?.url,
        title: context?.title,
        userName: firstName,
        userRole: memberRole,
      });

      const response: ChatResponse = {
        id: crypto.randomUUID(),
        answer: greeting,
        confidence: 0.95,
        source: "ai",
        suggestions: alerts.length > 0 ? alerts : undefined,
      };
      return NextResponse.json(response);
    }

    // Create orchestrator config
    const apiKey = process.env.OPENROUTER_API_KEY || "";
    console.log(
      "[Ed Chat API] API Key present:",
      apiKey.length > 0 ? `YES (${apiKey.substring(0, 10)}...)` : "NO",
    );

    const orchestratorConfig: OrchestratorConfig = {
      supabase,
      userId: user?.id || "anonymous",
      orgId: organization?.id || "unknown",
      userRole,
      subscription,
      activeApp,
      enableMultiPerspective: true,
      enableBrowserAutomation: false,
      debug: process.env.NODE_ENV === "development",
      openRouterApiKey: apiKey, // Pass API key explicitly
    };

    // Create orchestrator and process question
    const orchestrator = await createOrchestrator(orchestratorConfig);

    // Get screenshot from either direct image upload or pageState
    const screenshot = image || pageState?.screenshot;

    // Process through agent framework — pass URL so Ed knows which page user is on
    const edResponse = await orchestrator.processQuestion(question, {
      app: activeApp,
      page: context?.title,
      url: context?.url,
      screenshot,
    });

    // Map EdResponse to ChatResponse format
    const response: ChatResponse = {
      id: crypto.randomUUID(),
      answer: edResponse.response,
      confidence:
        edResponse.confidence === "HIGH"
          ? 0.9
          : edResponse.confidence === "MEDIUM"
            ? 0.7
            : 0.5,
      source: "ai",
    };

    // Add suggestions if available
    if (edResponse.warnings && edResponse.warnings.length > 0) {
      response.suggestions = edResponse.warnings;
    }

    // Log conversation topic (lightweight, no PII — just domain + summary)
    if (organization?.id && user?.id) {
      logConversationTopic(
        supabase,
        organization.id,
        user.id,
        edResponse.specialist || "general",
        question,
      ).catch(() => {}); // Fire-and-forget, don't block response
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Ed Chat API] Error:", error);

    // Check for specific error types
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      return NextResponse.json(
        {
          id: crypto.randomUUID(),
          answer:
            "I'm having trouble connecting to my AI services. This might be an API configuration issue. Please try again or contact support.",
          confidence: 0,
          source: "fallback",
        },
        { status: 503 },
      );
    }

    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return NextResponse.json(
        {
          id: crypto.randomUUID(),
          answer:
            "I'm receiving too many requests right now. Please wait a moment and try again.",
          confidence: 0.5,
          source: "fallback",
        },
        { status: 429 },
      );
    }

    // Generic fallback — include error detail in dev for debugging
    const isDev = process.env.NODE_ENV === "development";
    const fallback: ChatResponse = {
      id: crypto.randomUUID(),
      answer: isDev
        ? `[Dev] Ed error: ${errorMessage.substring(0, 200)}`
        : "I'm having trouble processing that right now. Could you try asking in a different way?",
      confidence: 0,
      source: "fallback",
    };

    return NextResponse.json(fallback);
  }
}

/**
 * Find a quick answer from the knowledge base
 */
function findQuickAnswer(question: string, toolId?: string): string | null {
  const lowerQuestion = question.toLowerCase();

  // Search in tool-specific answers first
  if (toolId && QUICK_ANSWERS[toolId]) {
    for (const [key, answer] of Object.entries(QUICK_ANSWERS[toolId])) {
      if (lowerQuestion.includes(key)) {
        return answer;
      }
    }
  }

  // Search all tools
  for (const [, answers] of Object.entries(QUICK_ANSWERS)) {
    for (const [key, answer] of Object.entries(answers)) {
      if (lowerQuestion.includes(key)) {
        return answer;
      }
    }
  }

  return null;
}

/**
 * Detect if a request needs browser automation
 */
function detectAutomationRequest(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  const automationKeywords = [
    "fill",
    "click",
    "type",
    "select",
    "navigate",
    "go to",
    "open",
    "submit",
    "enter",
    "do this",
    "perform",
    "execute",
    "automate",
    "complete this",
    "fill in",
    "fill out",
  ];

  return automationKeywords.some((keyword) => lowerQuestion.includes(keyword));
}

/**
 * Call automation API
 */
async function callAutomationAPI(
  question: string,
  context: ChatRequest["context"],
  pageState?: ChatRequest["pageState"],
  geminiApiKey?: string,
): Promise<{
  answer: string;
  sessionId: string;
  actions: number;
  success: boolean;
} | null> {
  try {
    // Get base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const body: any = {
      url: context?.url || "",
      task: question,
    };

    // Add Gemini API key if provided (from extension config)
    if (geminiApiKey) {
      body.geminiApiKey = geminiApiKey;
    }

    // Add pageState if provided
    if (pageState) {
      body.screenshot = pageState.screenshot.replace(
        /^data:image\/\w+;base64,/,
        "",
      );
      body.domSnapshot = pageState.domSnapshot;
    }

    const response = await fetch(`${baseUrl}/api/ed/automate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(
        "[Automation API] Error:",
        response.status,
        await response.text(),
      );
      return null;
    }

    const data = await response.json();

    if (data.success) {
      const completedCount = data.execution.completed.length;
      const failedCount = data.execution.failed.length;

      return {
        answer: `I've completed the task! Executed ${completedCount} action${completedCount !== 1 ? "s" : ""}${failedCount > 0 ? ` (${failedCount} failed)` : ""}.`,
        sessionId: data.sessionId,
        actions: data.actions.length,
        success: true,
      };
    } else {
      return {
        answer: `I tried to complete the task but encountered an error: ${data.error || "Unknown error"}`,
        sessionId: data.sessionId || "",
        actions: 0,
        success: false,
      };
    }
  } catch (error) {
    console.error("[Automation API] Request error:", error);
    return null;
  }
}

/**
 * Phase 2: Detect if a request is form-related
 */
function detectFormRequest(
  question: string,
  url?: string,
  formMode?: ChatRequest["formMode"],
): boolean {
  // If already in form mode, continue
  if (formMode?.active) {
    return true;
  }

  const lowerQuestion = question.toLowerCase();
  const lowerUrl = url?.toLowerCase() || "";

  // Form-related keywords
  const formKeywords = [
    "fill form",
    "fill in",
    "fill out",
    "complete form",
    "form help",
    "help with form",
    "form guidance",
    "what do i put",
    "how do i answer",
    "what should i write",
    "riddor",
    "safeguarding form",
    "ehcp",
    "send form",
    "incident report",
    "accident report",
  ];

  // Check for form keywords
  const hasFormKeyword = formKeywords.some(
    (keyword) => lowerQuestion.includes(keyword) || lowerUrl.includes(keyword),
  );

  return hasFormKeyword;
}

/**
 * Phase 2: Handle form-related requests
 * Phase 3: Enhanced with field knowledge from database
 */
async function handleFormRequest(
  body: ChatRequest,
  supabase: any,
): Promise<NextResponse<ChatResponse>> {
  const { question, context, formMode, language } = body;

  console.log("[Ed Chat API] Handling form request:", {
    question,
    formMode,
    language,
  });

  // Get form template if provided or fetch from URL
  let template = formMode?.template;
  if (!template && context?.url) {
    template = await getFormTemplateForUrl(supabase, context.url);
  }

  // Phase 3: Fetch field knowledge from database
  let fieldKnowledge: any[] = [];
  let currentFieldKnowledge = null;
  let redFlagCheckResult = null;

  if (template?.form_key) {
    // Get all field knowledge for this template
    const knowledgeResponse = await fetchFieldKnowledge(
      supabase,
      template.form_key,
    );
    if (knowledgeResponse) {
      fieldKnowledge = knowledgeResponse.fields || [];
    }

    // If we know the current field, get specific knowledge
    if (formMode?.currentField) {
      const specificKnowledge = await fetchFieldKnowledge(
        supabase,
        template.form_key,
        formMode.currentField,
      );
      if (specificKnowledge?.knowledge) {
        currentFieldKnowledge = specificKnowledge.knowledge;
      }
    }

    // Phase 3: Check user input for red flags
    if (question && formMode?.currentField) {
      redFlagCheckResult = await checkForRedFlags(
        supabase,
        template.form_key,
        formMode.currentField,
        question,
      );
    }
  }

  // Build form-specific context with knowledge
  let formContext = "";
  if (template) {
    formContext = `
FORM CONTEXT: You are helping with the "${template.form_name}" form.
Form description: ${template.description || "No description available"}
Form category: ${template.form_category}
Estimated time: ${template.estimated_time_minutes || 5} minutes

The user is currently viewing this form. Guide them through it step by step.
`;
  }

  // Phase 3: Add field knowledge to context
  if (currentFieldKnowledge) {
    formContext += `\nCURRENT FIELD GUIDANCE:\n`;
    formContext += `Field: ${currentFieldKnowledge.field_label}\n`;
    formContext += `Explanation: ${currentFieldKnowledge.explanation}\n`;

    if (
      currentFieldKnowledge.red_flags &&
      currentFieldKnowledge.red_flags.length > 0
    ) {
      formContext += `\nRed flags to watch for:\n`;
      for (const flag of currentFieldKnowledge.red_flags) {
        formContext += `- ${flag.type}: ${flag.explanation}\n`;
      }
    }

    if (currentFieldKnowledge.legal_context) {
      formContext += `\nLegal context: ${currentFieldKnowledge.legal_context}\n`;
    }
  } else if (fieldKnowledge.length > 0) {
    formContext += `\nAvailable fields with guidance: ${fieldKnowledge.map((f: any) => f.field_label).join(", ")}\n`;
  }

  // Get user for organization context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Create orchestrator with form-specialist
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  const orchestratorConfig = {
    supabase,
    userId: user?.id || "anonymous",
    orgId: user?.user_metadata?.orgId || "unknown",
    userRole: "staff" as const,
    subscription: {
      plan: "schools" as const,
      features: [],
      creditsRemaining: 1000,
      creditsUsed: 0,
    },
    openRouterApiKey: apiKey,
  };

  const { createOrchestrator } = await import("@schoolgle/ed-agents");
  const orchestrator = await createOrchestrator(orchestratorConfig);

  // Process with form specialist
  // Add form context to the question
  const enhancedQuestion = formContext + `\n\nUser question: ${question}`;

  const edResponse = await orchestrator.processQuestion(enhancedQuestion, {
    app: "form-helper",
    page: context?.title,
  } as any);

  // Check for red flags and suggested wording in the response
  const formModeResponse = analyzeResponseForFormHints(
    edResponse.response,
    question,
  );

  // Phase 3: Include red flag check results in response
  if (redFlagCheckResult?.has_red_flags) {
    formModeResponse.redFlags = [
      ...(formModeResponse.redFlags || []),
      ...redFlagCheckResult.matched_flags.map((flag: any) => ({
        type: flag.type,
        message: flag.explanation,
        severity: "high" as const,
      })),
    ];
  }

  const response: ChatResponse = {
    id: crypto.randomUUID(),
    answer: edResponse.response,
    confidence: edResponse.confidence === "HIGH" ? 0.9 : 0.7,
    source: "ai",
    formMode: {
      active: true,
      templateId: template?.form_key,
      currentField: formMode?.currentField,
      ...formModeResponse,
    },
  };

  return NextResponse.json(response);
}

/**
 * Phase 3: Fetch field knowledge from database
 */
async function fetchFieldKnowledge(
  supabase: any,
  templateId: string,
  fieldKey?: string,
): Promise<{ fields?: any[]; knowledge?: any } | null> {
  try {
    if (fieldKey) {
      const { data, error } = await supabase.rpc("get_field_knowledge", {
        p_template_id: templateId,
        p_field_key: fieldKey,
      });

      if (error) {
        console.warn("[Ed Chat API] Field knowledge fetch error:", error);
        return null;
      }

      const knowledge = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { knowledge };
    }

    // Get all fields for template
    const { data, error } = await supabase
      .from("ed_form_field_knowledge")
      .select("*")
      .eq("template_id", templateId)
      .order("field_label", { ascending: true });

    if (error) {
      console.warn("[Ed Chat API] Template knowledge fetch error:", error);
      return null;
    }

    return { fields: data || [] };
  } catch (error) {
    console.warn("[Ed Chat API] Knowledge fetch exception:", error);
    return null;
  }
}

/**
 * Phase 3: Check user input for red flags
 */
async function checkForRedFlags(
  supabase: any,
  templateId: string,
  fieldKey: string,
  userText: string,
): Promise<{
  has_red_flags: boolean;
  matched_flags: any[];
  suggestions: any[];
} | null> {
  try {
    const { data, error } = await supabase.rpc("check_form_text_red_flags", {
      p_template_id: templateId,
      p_field_key: fieldKey,
      p_user_text: userText,
    });

    if (error) {
      console.warn("[Ed Chat API] Red flag check error:", error);
      return null;
    }

    const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return result;
  } catch (error) {
    console.warn("[Ed Chat API] Red flag check exception:", error);
    return null;
  }
}

/**
 * Get form template for a URL
 */
async function getFormTemplateForUrl(supabase: any, url: string): Promise<any> {
  try {
    const { data } = await supabase.rpc("get_form_template_by_url", { url });
    return data;
  } catch (error) {
    console.warn("[Ed Chat API] Failed to get form template:", error);
    return null;
  }
}

/**
 * Analyze response for form-related hints (red flags, suggested wording)
 */
function analyzeResponseForFormHints(
  response: string,
  originalQuestion: string,
): {
  suggestedWording?: { original: string; suggested: string; reason: string };
  redFlags?: Array<{
    type: string;
    message: string;
    severity: "low" | "medium" | "high";
  }>;
} {
  const result: ReturnType<typeof analyzeResponseForFormHints> = {};

  // Check if response contains suggested wording
  const wordingMatch = response.match(/I suggest:?"(.+?)"/);
  if (wordingMatch) {
    result.suggestedWording = {
      original: originalQuestion,
      suggested: wordingMatch[1],
      reason: "More professional and likely to be more effective",
    };
  }

  // Check for red flags mentioned in response
  const redFlagPatterns = [
    {
      pattern: /aggressive|emotional|accusatory/i,
      severity: "high" as const,
      type: "tone",
    },
    {
      pattern: /vague|specific|example/i,
      severity: "medium" as const,
      type: "clarity",
    },
  ];

  for (const flag of redFlagPatterns) {
    if (flag.pattern.test(response)) {
      result.redFlags = result.redFlags || [];
      result.redFlags.push({
        type: flag.type,
        message: `Consider revising your wording to be more ${flag.type === "tone" ? "neutral" : "specific"}`,
        severity: flag.severity,
      });
    }
  }

  return result;
}

/**
 * Detect if a request is a vision / room scan request
 */
function detectVisionRequest(question: string, image?: string): boolean {
  if (!image) return false;

  const lowerQuestion = question.toLowerCase();
  const visionKeywords = [
    "scan",
    "check this room",
    "room check",
    "what do you see",
    "analyse",
    "analyze",
    "inspect",
    "look at",
    "review this",
    "what's wrong",
    "compliance",
    "safety check",
    "morning check",
    "opening check",
    "closing check",
    "coshh",
    "fire safety",
    "hazard",
    "damage",
    "asset",
    "room",
    "classroom",
    "corridor",
    "hall",
    "toilet",
  ];

  return visionKeywords.some((keyword) => lowerQuestion.includes(keyword));
}

/**
 * Handle vision / room scan requests via Ed
 */
async function handleVisionRequest(
  body: ChatRequest,
  supabase: any,
): Promise<NextResponse> {
  const { question, image, context } = body;

  try {
    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: orgData } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    const organizationId = orgData?.id;
    if (!organizationId || !image) {
      return NextResponse.json({
        id: crypto.randomUUID(),
        answer:
          "I need you to be signed in and share an image for me to analyse a room. Could you try again?",
        confidence: 0.5,
        source: "fallback" as const,
      });
    }

    // Call Vision AI endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const analysisRes = await fetch(`${baseUrl}/api/vision/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contextType: "room-assessment",
        organizationId,
        mediaType: "image",
        media: image,
        mimeType: "image/jpeg",
        metadata: {
          capturedAt: new Date().toISOString(),
          checkType: "ad_hoc",
          userId: user?.id,
        },
      }),
    });

    const analysisData = await analysisRes.json();

    if (!analysisRes.ok) {
      throw new Error(analysisData.error || "Vision analysis failed");
    }

    const result = analysisData.result;
    const dispatches = result.dispatches ?? [];
    const issues = result.compliance?.issues ?? [];

    // Build Ed's conversational summary
    let summary = `I've analysed the image. Here's what I found:\n\n`;
    summary += `**${result.summary}**\n\n`;

    if (result.items && result.items.length > 0) {
      summary += `I detected ${result.items.length} item(s).\n\n`;
    }

    if (issues.length > 0) {
      summary += `**${issues.length} issue(s) flagged:**\n`;
      for (const issue of issues) {
        summary += `- ${issue.description} (${issue.severity})\n`;
      }
      summary += "\n";
    } else {
      summary += "No compliance issues detected.\n\n";
    }

    if (dispatches.length > 0) {
      summary += "**Actions dispatched:**\n";
      for (const d of dispatches) {
        summary += `- ${d.module.replace("_", " ")}: ${d.detail}\n`;
      }
      summary += "\n";
    }

    summary +=
      "Would you like me to log this as a formal room check, or is there anything specific you'd like me to look at more closely?";

    const response: ChatResponse = {
      id: crypto.randomUUID(),
      answer: summary,
      confidence: 0.9,
      source: "ai",
      suggestions: [
        "Log this as an AM opening check",
        "Log this as a PM closing check",
        "Show me the full report",
      ],
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[Ed Chat API] Vision analysis error:", err);
    return NextResponse.json({
      id: crypto.randomUUID(),
      answer:
        "I had trouble analysing that image. Could you try again with a clearer photo? Make sure the room is well-lit.",
      confidence: 0.3,
      source: "fallback" as const,
    });
  }
}

/**
 * Search learned knowledge patterns (self-improving knowledge base)
 * Returns high-confidence matches from ed_knowledge_patterns
 */
async function searchLearnedKnowledge(
  supabase: any,
  question: string,
  toolId?: string,
): Promise<{ id: string; answer: string; confidence: number } | null> {
  try {
    const { data, error } = await supabase.rpc("search_ed_knowledge", {
      p_query: question,
      p_org_id: null, // Will match global + user's org via RLS
      p_domain: null,
      p_system: toolId || null,
      p_limit: 1,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    const match = data[0];
    // Only return if confidence is high enough to be useful
    if (match.confidence >= 0.7) {
      return {
        id: match.id,
        answer: match.answer,
        confidence: match.confidence,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Log a lightweight conversation topic for continuity.
 * Stores ONLY the domain and a short topic summary — NO user content, NO PII.
 * Used so Ed can say "last time we talked about X" without storing chat history.
 */
async function logConversationTopic(
  supabase: any,
  organizationId: string,
  userId: string,
  domain: string,
  question: string,
): Promise<void> {
  try {
    // Generate a short, PII-free topic summary from the question
    const topicSummary = summariseTopicSafely(question, domain);

    await supabase.from("ed_conversation_log").insert({
      organization_id: organizationId,
      user_id: userId,
      domain,
      topic_summary: topicSummary,
    });
  } catch {
    // Silently fail — table may not exist yet
  }
}

/**
 * Create a safe, PII-free topic summary from a question.
 * Strips names, numbers, and personal details.
 */
function summariseTopicSafely(question: string, domain: string): string {
  const domainLabels: Record<string, string> = {
    estates: "Estates & Compliance",
    hr: "HR & People",
    send: "SEND",
    data: "Data & Reporting",
    curriculum: "Teaching & Learning",
    "it-tech": "IT & Systems",
    procurement: "Procurement",
    governance: "Governance",
    communications: "Communications",
    intelligence: "School Intelligence",
    risk: "Risk Management",
    general: "General query",
  };

  // Extract topic keywords (remove potential PII)
  const cleaned = question
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|miss|dr|prof)\b\.?\s*\w+/gi, "") // Remove name prefixes
    .replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, "") // Remove proper names
    .replace(/\b\d{5,}\b/g, "") // Remove long numbers (IDs, URNs)
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .trim();

  // Take first ~60 chars as topic
  const topic =
    cleaned.length > 60 ? cleaned.substring(0, 57) + "..." : cleaned;

  return topic || domainLabels[domain] || domain;
}
