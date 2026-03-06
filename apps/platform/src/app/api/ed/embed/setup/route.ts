import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import crypto from "crypto";

/**
 * GET /api/ed/embed/setup
 * Get current embed configuration for the user's school
 */
export async function GET(request: NextRequest) {
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

  // Get user's organization
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 404 },
    );
  }

  const { data: config } = await supabase
    .from("ed_embed_configs")
    .select("*")
    .eq("organization_id", member.organization_id)
    .single();

  const platformUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://schoolgle.co.uk";

  return NextResponse.json({
    config: config || null,
    embedSnippet: config
      ? `<script src="${platformUrl}/api/ed/embed?key=${config.embed_key}" async></script>`
      : null,
  });
}

/**
 * POST /api/ed/embed/setup
 * Create or update embed configuration
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

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single();

  if (!member || !["admin", "slt"].includes(member.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const {
    school_name,
    website_url,
    welcome_message,
    theme,
    position,
    accent_color,
    features,
    allowed_domains,
  } = body;

  if (!school_name) {
    return NextResponse.json(
      { error: "school_name is required" },
      { status: 400 },
    );
  }

  // Extract domains from website URL if not provided
  let domains = allowed_domains || [];
  if (website_url && domains.length === 0) {
    try {
      const url = new URL(
        website_url.startsWith("http") ? website_url : `https://${website_url}`,
      );
      domains = [url.hostname];
    } catch {
      // Invalid URL, skip domain restriction
    }
  }

  // Check for existing config
  const { data: existing } = await supabase
    .from("ed_embed_configs")
    .select("id, embed_key")
    .eq("organization_id", member.organization_id)
    .single();

  const embedKey =
    existing?.embed_key || crypto.randomBytes(16).toString("hex");

  const configData = {
    organization_id: member.organization_id,
    embed_key: embedKey,
    school_name,
    website_url: website_url || null,
    welcome_message:
      welcome_message ||
      "Hi! I'm Ed, your school assistant. How can I help you today?",
    theme: theme || "standard",
    position: position || "bottom-right",
    accent_color: accent_color || "#0ea5e9",
    features: features || ["chat", "voice"],
    allowed_domains: domains,
    is_active: true,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("ed_embed_configs")
      .update(configData)
      .eq("id", existing.id)
      .select()
      .single();
    result = { data, error };
  } else {
    const { data, error } = await supabase
      .from("ed_embed_configs")
      .insert({ ...configData, created_by: user.id })
      .select()
      .single();
    result = { data, error };
  }

  if (result.error) {
    console.error("[Ed Embed] Setup error:", result.error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 },
    );
  }

  const platformUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://schoolgle.co.uk";

  return NextResponse.json({
    success: true,
    config: result.data,
    embedSnippet: `<script src="${platformUrl}/api/ed/embed?key=${embedKey}" async></script>`,
    instructions: {
      step1: "Copy the code snippet below",
      step2: "Paste it just before the </body> tag on your school website",
      step3: "Ed will appear automatically in the bottom-right corner",
      snippet: `<!-- Schoolgle Ed Assistant -->\n<script src="${platformUrl}/api/ed/embed?key=${embedKey}" async></script>`,
    },
  });
}
