import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { TaskComment, TaskCommentForm, CommentAttachment } from '@/lib/tasks';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/tasks/[id]/comments
 * Get comments for a task
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const taskId = params.id;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: comments, error } = await supabase
            .from('task_comments')
            .select(`
                *,
                user:users!task_comments_user_id_fkey (
                    id,
                    email,
                    raw_user_meta_data->>'full_name' as full_name,
                    raw_user_meta_data->>'avatar_url' as avatar_url
                )
            `)
            .eq('organization_id', organizationId)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return NextResponse.json(
                { error: 'Failed to fetch comments' },
                { status: 500 }
            );
        }

        // Enrich with parent/child relationships
        const enrichedComments = (comments || []).map((comment: any) => ({
            ...comment,
            user_name: comment.user?.full_name || comment.user?.email || 'System',
            user_email: comment.user?.email || null,
            user_avatar: comment.user?.avatar_url || null,
        }));

        return NextResponse.json({ comments: enrichedComments });

    } catch (error: any) {
        console.error('Task Comments API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tasks/[id]/comments
 * Add a comment to a task
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const {
            organizationId,
            taskSource,
            content,
            comment_type,
            parent_comment_id,
            attachments,
            userId,
        } = body as TaskCommentForm & { organizationId: string; userId?: string };

        if (!organizationId || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, content' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: comment, error } = await supabase
            .from('task_comments')
            .insert({
                id: uuidv4(),
                organization_id: organizationId,
                task_id: params.id,
                task_source: taskSource || 'actions',
                content,
                comment_type: comment_type || 'comment',
                attachments: attachments || [],
                parent_comment_id: parent_comment_id || null,
                user_id: userId || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating comment:', error);
            return NextResponse.json(
                { error: 'Failed to create comment' },
                { status: 500 }
            );
        }

        // Update task's updated_at timestamp
        const tableName = taskSource || 'actions';
        await supabase
            .from(tableName)
            .update({ updated_at: new Date().toISOString() })
            .eq('id', params.id)
            .eq('organization_id', organizationId);

        return NextResponse.json({ comment }, { status: 201 });

    } catch (error: any) {
        console.error('Comment creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tasks/[id]/comments
 * Delete a comment
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const commentId = searchParams.get('commentId');

        if (!organizationId || !commentId) {
            return NextResponse.json(
                { error: 'Missing required parameters: organizationId, commentId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabase
            .from('task_comments')
            .delete()
            .eq('id', commentId)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error deleting comment:', error);
            return NextResponse.json(
                { error: 'Failed to delete comment' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Comment deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
