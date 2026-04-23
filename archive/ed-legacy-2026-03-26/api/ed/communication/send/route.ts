import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      organizationId,
      to,
      subject,
      body: messageBody,
      channel,
      priority,
    } = body;

    if (!organizationId || !to || !messageBody) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Initialize Orchestrator for this school
    const { createOrchestrator } = await import("@schoolgle/ed-agents");
    const orchestrator = await createOrchestrator({
      supabase,
      userId: user.id,
      orgId: organizationId,
      userRole: "staff",
      subscription: {
        plan: "free" as const,
        features: [],
        creditsRemaining: 1000,
        creditsUsed: 0,
      },
      openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
    } as any);

    const result = await (orchestrator as any).sendMessage({
      to,
      subject,
      body: messageBody,
      channel: channel || "email",
      priority: priority || "normal",
    });

    // If the result indicates the message was queued for approval
    if (result.success && result.status === "queued") {
      return NextResponse.json({
        success: true,
        message: "Message sent for human review.",
        status: "queued",
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Communication API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
