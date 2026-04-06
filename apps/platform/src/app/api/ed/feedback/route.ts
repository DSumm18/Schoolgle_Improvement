import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase-server";

interface FeedbackRequest {
  feedback_id: string;
  rating: number;
  category?:
    | "wrong_info"
    | "misunderstood"
    | "too_complex"
    | "too_vague"
    | "not_actionable"
    | "great_answer"
    | "other";
  category_detail?: string;
  implicit_signals?: Record<string, unknown>;
}

/**
 * POST /api/ed/feedback
 *
 * Updates an existing ed_feedback row (created during chat logging)
 * with the user's rating and category.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: FeedbackRequest = await request.json();

    if (!body.feedback_id || !body.rating) {
      return NextResponse.json(
        { error: "feedback_id and rating are required" },
        { status: 400 }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceRoleClient();

    // Verify the feedback row belongs to this user
    const { data: existing } = await serviceClient
      .from("ed_feedback")
      .select("id, user_id")
      .eq("id", body.feedback_id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Feedback entry not found" },
        { status: 404 }
      );
    }

    if (existing.user_id && existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Cannot update another user's feedback" },
        { status: 403 }
      );
    }

    // Update with rating and category
    const updateData: Record<string, unknown> = {
      rating: body.rating,
    };

    if (body.category) {
      updateData.category = body.category;
    }

    if (body.category_detail) {
      updateData.category_detail = body.category_detail;
    }

    if (body.implicit_signals) {
      updateData.implicit_signals = body.implicit_signals;
    }

    const { error } = await serviceClient
      .from("ed_feedback")
      .update(updateData)
      .eq("id", body.feedback_id);

    if (error) {
      console.error("[ed-feedback] Update error:", error);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ed-feedback] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
