import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/ed/knowledge?q=...&domain=...&system=...
 * Search knowledge patterns (no auth required for global, auth for org-specific)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const domain = searchParams.get("domain");
  const system = searchParams.get("system");
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter q is required" },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();

  // Get user's org for school-specific knowledge
  let orgId: string | null = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();
    orgId = member?.organization_id || null;
  }

  const { data, error } = await supabase.rpc("search_ed_knowledge", {
    p_query: query,
    p_org_id: orgId,
    p_domain: domain,
    p_system: system,
    p_limit: Math.min(limit, 20),
  });

  if (error) {
    console.error("[Ed Knowledge] Search error:", error);
    return NextResponse.json({ results: [] });
  }

  return NextResponse.json({ results: data || [] });
}

/**
 * POST /api/ed/knowledge
 * Store a new knowledge pattern (from Ed's learning)
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const {
    domain,
    system_name,
    question_pattern,
    answer,
    trigger_phrases,
    source,
    organization_id,
  } = body;

  if (!domain || !question_pattern || !answer) {
    return NextResponse.json(
      { error: "domain, question_pattern, and answer are required" },
      { status: 400 },
    );
  }

  // Validate no PII in the knowledge pattern
  const piiPatterns = [
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/, // Full names (rough check)
    /\b\d{2}\/\d{2}\/\d{4}\b/, // DOB format
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{10,11}\b/, // Phone numbers
  ];

  const contentToCheck = `${question_pattern} ${answer}`;
  for (const pattern of piiPatterns) {
    if (pattern.test(contentToCheck)) {
      return NextResponse.json(
        {
          error:
            "Knowledge patterns must not contain personal data (names, emails, phone numbers, dates of birth)",
        },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabase
    .from("ed_knowledge_patterns")
    .insert({
      organization_id: organization_id || null, // null = global
      domain,
      system_name: system_name || null,
      question_pattern,
      answer,
      trigger_phrases: trigger_phrases || [question_pattern.toLowerCase()],
      source: source || "ai_learned",
      confidence: source === "admin_verified" ? 0.9 : 0.5,
    })
    .select()
    .single();

  if (error) {
    console.error("[Ed Knowledge] Insert error:", error);
    return NextResponse.json(
      { error: "Failed to store knowledge" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, knowledge: data });
}

/**
 * PATCH /api/ed/knowledge
 * Feedback on knowledge (helpful/not helpful)
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const body = await request.json();
  const { knowledge_id, helpful } = body;

  if (!knowledge_id || typeof helpful !== "boolean") {
    return NextResponse.json(
      { error: "knowledge_id and helpful (boolean) are required" },
      { status: 400 },
    );
  }

  const { error } = await supabase.rpc("ed_knowledge_feedback", {
    p_knowledge_id: knowledge_id,
    p_helpful: helpful,
  });

  if (error) {
    console.error("[Ed Knowledge] Feedback error:", error);
    return NextResponse.json(
      { error: "Failed to record feedback" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
