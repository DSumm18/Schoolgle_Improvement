import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UnifiedTask, ActionForm } from '@/lib/tasks';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteContext {
    params: { id: string };
}

/**
 * GET /api/tasks/[id]
 * Get a specific task by ID
 */
export async function GET(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = context.params;
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Try to find in actions first
        const { data: task, error } = await supabase
            .from('actions')
            .select(`
                *,
                assignee:users!actions_assignee_id_fkey (
                    id,
                    email,
                    raw_user_meta_data->>'full_name' as full_name
                ),
                approver:users!actions_approved_by_fkey (
                    id,
                    email,
                    raw_user_meta_data->>'full_name' as full_name
                )
            `)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (task) {
            // Enrich with subtasks if parent
            let subtasks: any[] = [];
            if (task.parent_task_id) {
                // This is a subtask, get siblings
                const { data: siblings } = await supabase
                    .from('actions')
                    .select('id, title, status, progress')
                    .eq('parent_task_id', task.parent_task_id)
                    .order('sort_order', { ascending: true });
                subtasks = siblings || [];
            } else {
                // This is a parent task, get its subtasks
                const { data: subtasksData } = await supabase
                    .from('task_subtasks')
                    .select('*')
                    .eq('parent_task_id', id)
                    .order('sort_order', { ascending: true });
                subtasks = subtasksData || [];
            }

            return NextResponse.json({
                task: {
                    ...task,
                    source_table: 'actions',
                    assignee_name: task.assignee?.full_name || task.assignee?.email || null,
                    approver_name: task.approver?.full_name || task.approver?.email || null,
                    subtasks,
                },
            });
        }

        // Try estates compliance tasks
        const { data: estatesTask, error: estatesError } = await supabase
            .from('estates_compliance_tasks')
            .select(`
                *,
                assignee:users!estates_compliance_tasks_assigned_to_id_fkey (
                    id,
                    email,
                    raw_user_meta_data->>'full_name' as full_name
                )
            `)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (estatesTask) {
            return NextResponse.json({
                task: {
                    ...estatesTask,
                    source_table: 'estates_compliance_tasks',
                    assignee_name: estatesTask.assignee?.full_name || estatesTask.assignee?.email || null,
                },
            });
        }

        return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
        );

    } catch (error: any) {
        console.error('Task detail API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/tasks/[id]
 * Update a specific task
 */
export async function PATCH(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = context.params;
        const body = await req.json();
        const { organizationId, ...changes } = body as {
            organizationId: string;
        } & Partial<ActionForm>;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Prepare update data
        let updateData: any = { ...changes };

        // Handle checklist updates
        if (changes.checklist) {
            updateData.checklist = changes.checklist.map((item) => ({
                ...item,
                id: item.id || uuidv4(),
            }));
        }

        // Auto-calculate progress from checklist
        if (changes.checklist) {
            const completedCount = changes.checklist.filter((c) => c.completed).length;
            updateData.progress = Math.round((completedCount / changes.checklist.length) * 100);
        }

        // Handle completion
        if (changes.status === 'completed' && !updateData.completed_at) {
            updateData.completed_at = new Date().toISOString();
            // Set completed_by to current user if available
            // (would need userId in request body)
        }

        updateData.updated_at = new Date().toISOString();

        // Update in actions table
        const { data: task, error } = await supabase
            .from('actions')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .maybeSingle();

        if (error) {
            // Try estates compliance tasks
            const estatesUpdateData: any = {};
            if (changes.status === 'completed') {
                estatesUpdateData.completed_at = new Date().toISOString();
                estatesUpdateData.progress = 100;
            }

            const { data: estatesTask, error: estatesError } = await supabase
                .from('estates_compliance_tasks')
                .update(estatesUpdateData)
                .eq('id', id)
                .eq('organization_id', organizationId)
                .select()
                .maybeSingle();

            if (estatesError || !estatesTask) {
                return NextResponse.json(
                    { error: 'Task not found or update failed' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ task: estatesTask, source: 'estates_compliance_tasks' });
        }

        return NextResponse.json({ task, source: 'actions' });

    } catch (error: any) {
        console.error('Task update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export async function DELETE(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = context.params;
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Try actions first
        const { error: actionsError } = await supabase
            .from('actions')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (!actionsError) {
            return NextResponse.json({ success: true });
        }

        // Try estates compliance tasks
        const { error: estatesError } = await supabase
            .from('estates_compliance_tasks')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (estatesError) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Task deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tasks/[id]/complete
 * Mark a task as complete
 */
export async function POST(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = context.params;
        const body = await req.json();
        const { organizationId, userId, completionNotes } = body as {
            organizationId: string;
            userId?: string;
            completionNotes?: string;
        };

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const now = new Date().toISOString();

        // Update in actions table
        const { data: task, error } = await supabase
            .from('actions')
            .update({
                status: 'completed',
                progress: 100,
                completed_at: now,
                completed_by: userId || null,
                updated_at: now,
            })
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .maybeSingle();

        if (error) {
            // Try estates compliance tasks
            const { data: estatesTask, error: estatesError } = await supabase
                .from('estates_compliance_tasks')
                .update({
                    status: 'completed',
                    progress: 100,
                    completed_at: now,
                    completed_by: userId || null,
                    updated_at: now,
                })
                .eq('id', id)
                .eq('organization_id', organizationId)
                .select()
                .maybeSingle();

            if (estatesError || !estatesTask) {
                return NextResponse.json(
                    { error: 'Task not found' },
                    { status: 404 }
                );
            }

            // Add completion note as a comment if estates task
            if (completionNotes) {
                await supabase.from('task_comments').insert({
                    id: uuidv4(),
                    organization_id: organizationId,
                    task_id: id,
                    task_source: 'estates_compliance_tasks',
                    content: completionNotes,
                    comment_type: 'system',
                    user_id: userId || null,
                    created_at: now,
                });
            }

            return NextResponse.json({ task: estatesTask });
        }

        // Add completion note if provided
        if (completionNotes) {
            await supabase.from('task_comments').insert({
                id: uuidv4(),
                organization_id: organizationId,
                task_id: id,
                task_source: 'actions',
                content: completionNotes,
                comment_type: 'system',
                user_id: userId || null,
                created_at: now,
            });
        }

        return NextResponse.json({ task });

    } catch (error: any) {
        console.error('Task completion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
