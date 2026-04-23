/**
 * Ed Chat API - New Simplified Endpoint for the Ed Chatbot UI
 *
 * Handles chat messages from the new Ed chatbot component with streaming support.
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  mode?: "normal" | "inspection";
  module?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limit
    const rateLimited = checkRateLimit(
      getRateLimitKey(request, "ed-chat", user.id),
      RATE_LIMITS.ai,
    );
    if (rateLimited) return rateLimited;

    const body: ChatRequest = await request.json();
    const { messages, mode = "normal", module } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: "No user message found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Import orchestrator and Ed voice system
    const { createOrchestrator } = await import("@schoolgle/ed-agents");
    const { getEdSystemPrompt, getModuleContext } = await import("@/lib/ed");

    // Get user's organization
    const { createServiceRoleClient } = await import("@/lib/supabase-server");
    const serviceClient = createServiceRoleClient();

    const { data: memberData } = await serviceClient
      .from("organization_members")
      .select("organization_id, role, organizations(*)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const organization = memberData?.organizations as any;
    const orgId = memberData?.organization_id || organization?.id;

    if (!orgId) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Map role
    const memberRole = memberData?.role || "viewer";
    const roleMap: Record<string, "admin" | "staff" | "viewer"> = {
      admin: "admin",
      headteacher: "admin",
      slt: "admin",
      teacher: "staff",
      governor: "staff",
      caretaker: "staff",
      viewer: "viewer",
    };
    const userRole = roleMap[memberRole] || "viewer";

    const subscription = {
      plan: ["admin", "headteacher", "slt"].includes(memberRole) ? "trusts" : "schools",
      features: organization?.features || [],
      creditsRemaining: organization?.credits_remaining || 10000,
      creditsUsed: organization?.credits_used || 0,
    };

    // Create orchestrator config
    const apiKey = process.env.OPENROUTER_API_KEY || "";
    const orchestratorConfig = {
      supabase,
      userId: user.id,
      orgId,
      userRole,
      subscription,
      activeApp: "schoolgle-platform",
      enableMultiPerspective: false,
      enableBrowserAutomation: false,
      debug: process.env.NODE_ENV === "development",
      openRouterApiKey: apiKey,
    };

    const orchestrator = await createOrchestrator(orchestratorConfig);

    // Build system prompt with mode and module context
    const systemPrompt = getEdSystemPrompt(mode === "inspection");
    const moduleContext = getModuleContext(module || null);
    const enhancedQuestion = `${systemPrompt}\n\n${moduleContext}\n\nUser's question: ${lastUserMessage.content}`;

    // Process the question
    const edResponse = await orchestrator.processQuestion(enhancedQuestion, {
      app: "schoolgle-platform",
      page: module ? `${module} module` : "Dashboard",
      url: request.url,
      messages: messages.slice(-8),
    });

    // Create streaming response
    const responseText = edResponse.response;

    // Return as streaming (simulated for now - true streaming requires more work)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send the response in chunks for streaming effect
        const words = responseText.split(" ");
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? " " : "");
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          // Small delay for streaming effect
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("[Ed Chat API] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({
      error: "I'm having trouble processing that right now. Could you try again?",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
