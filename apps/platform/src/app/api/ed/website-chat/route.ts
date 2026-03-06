import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/ed/website-chat
 * Public chat endpoint for Ed embedded on school websites
 * No user auth - uses school's embed key instead
 */
export async function POST(request: NextRequest) {
  // CORS headers for cross-origin requests from school websites
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const body = await request.json();
  const { question, school_id, page_url, page_title } = body;

  if (!question || !school_id) {
    return NextResponse.json(
      { error: "question and school_id are required" },
      { status: 400, headers },
    );
  }

  // Verify the school has an active embed config
  const { data: config } = await supabaseAdmin
    .from("ed_embed_configs")
    .select("organization_id, school_name, features")
    .eq("organization_id", school_id)
    .eq("is_active", true)
    .single();

  if (!config) {
    return NextResponse.json(
      { error: "School not found or Ed not configured" },
      { status: 404, headers },
    );
  }

  // Check website knowledge first
  const { data: knowledge } = await supabaseAdmin
    .from("ed_website_knowledge")
    .select("content, page_url, page_title")
    .eq("organization_id", config.organization_id)
    .textSearch("content", question.split(" ").slice(0, 5).join(" & "), {
      type: "plain",
    })
    .limit(3);

  // Also check knowledge patterns
  const { data: patterns } = await supabaseAdmin.rpc("search_ed_knowledge", {
    p_query: question,
    p_org_id: config.organization_id,
    p_domain: "general",
    p_limit: 3,
  });

  // Build context from website knowledge
  let websiteContext = "";
  if (knowledge && knowledge.length > 0) {
    websiteContext =
      "\n\nRELEVANT SCHOOL WEBSITE CONTENT:\n" +
      knowledge.map((k: any) => `[${k.page_title}]: ${k.content}`).join("\n\n");
  }

  // Build context from patterns
  let patternContext = "";
  if (patterns && patterns.length > 0) {
    patternContext =
      "\n\nKNOWN ANSWERS:\n" +
      patterns
        .map((p: any) => `Q: ${p.question_pattern}\nA: ${p.answer}`)
        .join("\n\n");
  }

  // Call AI for response
  try {
    const { createOpenRouterClient } =
      await import("@schoolgle/ed-agents/models/openrouter");
    const client = createOpenRouterClient();

    const systemPrompt = `You are Ed, the friendly AI assistant for ${config.school_name}.
You help parents, carers, and visitors with questions about the school.

IMPORTANT RULES:
- Only answer based on the school website content and known information provided below
- If you don't know the answer, say "I'm not sure about that - please contact the school office" and provide contact details if known
- Never make up information about the school
- Be warm, friendly, and professional
- Keep answers concise and helpful
- If asked about safeguarding concerns, always direct to the school's Designated Safeguarding Lead or local authority

${websiteContext}
${patternContext}

The user is currently viewing: ${page_title || "the school website"} (${page_url || "unknown page"})`;

    const response = await client.chatWithSystem(systemPrompt, question, {
      model: "google/gemini-2.0-flash-exp",
      temperature: 0.5,
      maxTokens: 500,
    });

    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        answer: response.content,
        confidence: knowledge && knowledge.length > 0 ? 0.9 : 0.6,
        source: knowledge && knowledge.length > 0 ? "website" : "ai",
        school_name: config.school_name,
      },
      { headers },
    );
  } catch (error) {
    console.error("[Website Chat] Error:", error);
    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        answer: `I'm having trouble right now. Please contact ${config.school_name} directly for help.`,
        confidence: 0,
        source: "fallback",
      },
      { headers },
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
