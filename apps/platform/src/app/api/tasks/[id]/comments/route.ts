import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { TaskCommentForm } from "@/lib/tasks";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/tasks/[id]/comments
 * Get comments for a task
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const segments = req.nextUrl.pathname.split("/");
  const taskId = segments[segments.indexOf("tasks") + 1];

  const supabase = createServiceRoleClient();

  const { data: comments, error } = await supabase
    .from("task_comments")
    .select(
      `
            *,
            user:users!task_comments_user_id_fkey (
                id,
                email,
                raw_user_meta_data->>'full_name' as full_name,
                raw_user_meta_data->>'avatar_url' as avatar_url
            )
        `,
    )
    .eq("organization_id", organizationId)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return apiError("Failed to fetch comments", 500);
  }

  // Enrich with parent/child relationships
  const enrichedComments = (comments || []).map((comment: any) => ({
    ...comment,
    user_name: comment.user?.full_name || comment.user?.email || "System",
    user_email: comment.user?.email || null,
    user_avatar: comment.user?.avatar_url || null,
  }));

  return apiSuccess({ comments: enrichedComments });
});

/**
 * POST /api/tasks/[id]/comments
 * Add a comment to a task
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const {
    task_source: taskSource,
    content,
    comment_type,
    parent_comment_id,
    attachments,
    userId,
  } = body as TaskCommentForm & {
    userId?: string;
    taskSource?: string;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;
  const segments = req.nextUrl.pathname.split("/");
  const taskId = segments[segments.indexOf("tasks") + 1];

  if (!content) {
    return apiError("Missing required fields: content", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: comment, error } = await supabase
    .from("task_comments")
    .insert({
      id: uuidv4(),
      organization_id: orgId,
      task_id: taskId,
      task_source: taskSource || "actions",
      content,
      comment_type: comment_type || "comment",
      attachments: attachments || [],
      parent_comment_id: parent_comment_id || null,
      user_id: userId || auth.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    return apiError("Failed to create comment", 500);
  }

  // Update task's updated_at timestamp
  const tableName = taskSource || "actions";
  await supabase
    .from(tableName)
    .update({ updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("organization_id", orgId);

  return apiSuccess({ comment }, 201);
});

/**
 * DELETE /api/tasks/[id]/comments
 * Delete a comment
 */
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const commentId = searchParams.get("commentId");

  if (!commentId) {
    return apiError("Missing required parameters: commentId", 400);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", commentId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error deleting comment:", error);
    return apiError("Failed to delete comment", 500);
  }

  return apiSuccess({ success: true });
});
