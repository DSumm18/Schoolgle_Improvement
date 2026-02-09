import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { TaskTimeEntry, TaskTimeEntryForm, TaskTimeSummary } from '@/lib/tasks';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/tasks/[id]/time
 * Get time entries for a task
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

        const { data: timeEntries, error } = await supabase
            .from('task_time_entries')
            .select(`
                *,
                user:users!task_time_entries_user_id_fkey (
                    id,
                    email,
                    raw_user_meta_data->>'full_name' as full_name
                )
            `)
            .eq('organization_id', organizationId)
            .eq('task_id', taskId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching time entries:', error);
            return NextResponse.json(
                { error: 'Failed to fetch time entries' },
                { status: 500 }
            );
        }

        // Enrich with user info
        const enrichedEntries = (timeEntries || []).map((entry: any) => ({
            ...entry,
            user_name: entry.user?.full_name || entry.user?.email || 'Unknown',
            user_email: entry.user?.email || null,
        }));

        // Calculate summary
        const totalMinutes = enrichedEntries.reduce((sum, e) => sum + e.minutes, 0);
        const totalHours = totalMinutes / 60;

        const byUser = enrichedEntries.reduce((acc: any, entry) => {
            if (!acc[entry.user_id]) {
                acc[entry.user_id] = {
                    user_id: entry.user_id,
                    user_name: entry.user_name,
                    minutes: 0,
                    entries: 0,
                };
            }
            acc[entry.user_id].minutes += entry.minutes;
            acc[entry.user_id].entries += 1;
            return acc;
        }, {});

        const summary: TaskTimeSummary = {
            task_id: taskId,
            total_minutes: totalMinutes,
            total_hours: Math.round(totalHours * 100) / 100,
            entries: enrichedEntries.length,
            by_user: Object.values(byUser).map((u) => ({
                user_id: u.user_id,
                user_name: u.user_name,
                minutes: u.minutes,
                hours: Math.round((u.minutes / 60) * 100) / 100,
            })),
        };

        return NextResponse.json({
            time_entries: enrichedEntries,
            summary,
        });

    } catch (error: any) {
        console.error('Task Time Entries API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tasks/[id]/time
 * Add a time entry to a task
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
            minutes,
            description,
            date,
            userId,
        } = body as TaskTimeEntryForm & { organizationId: string; userId?: string };

        if (!organizationId || !minutes || minutes <= 0 || !date) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, minutes (positive number), date' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: timeEntry, error } = await supabase
            .from('task_time_entries')
            .insert({
                id: uuidv4(),
                organization_id: organizationId,
                task_id: params.id,
                task_source: taskSource || 'actions',
                user_id: userId || null,
                minutes,
                description: description || null,
                date,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating time entry:', error);
            return NextResponse.json(
                { error: 'Failed to create time entry' },
                { status: 500 }
            );
        }

        // Update task's actual_hours if in actions table
        if (taskSource !== 'estates_compliance_tasks') {
            // Get current total
            const { data: existingEntries } = await supabase
                .from('task_time_entries')
                .select('minutes')
                .eq('organization_id', organizationId)
                .eq('task_id', params.id);

            const totalMinutes = existingEntries?.reduce((sum: number, e: any) => sum + e.minutes, minutes) || 0;
            const totalHours = totalMinutes / 60;

            await supabase
                .from('actions')
                .update({ actual_hours: totalHours })
                .eq('id', params.id)
                .eq('organization_id', organizationId);
        }

        return NextResponse.json({ time_entry: timeEntry }, { status: 201 });

    } catch (error: any) {
        console.error('Time entry creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/tasks/[id]/time
 * Update a time entry
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const timeEntryId = searchParams.get('timeEntryId');
        const body = await req.json();

        if (!organizationId || !timeEntryId) {
            return NextResponse.json(
                { error: 'Missing required parameters: organizationId, timeEntryId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: timeEntry, error } = await supabase
            .from('task_time_entries')
            .update({
                ...body,
            })
            .eq('id', timeEntryId)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error || !timeEntry) {
            return NextResponse.json(
                { error: 'Time entry not found or update failed' },
                { status: 404 }
            );
        }

        // Recalculate task's actual_hours
        if (timeEntry.task_source !== 'estates_compliance_tasks') {
            const { data: allEntries } = await supabase
                .from('task_time_entries')
                .select('minutes')
                .eq('organization_id', organizationId)
                .eq('task_id', timeEntry.task_id);

            const totalMinutes = allEntries?.reduce((sum: number, e: any) => sum + e.minutes, 0) || 0;
            const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

            await supabase
                .from('actions')
                .update({ actual_hours: totalHours })
                .eq('id', timeEntry.task_id)
                .eq('organization_id', organizationId);
        }

        return NextResponse.json({ time_entry: timeEntry });

    } catch (error: any) {
        console.error('Time entry update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tasks/[id]/time
 * Delete a time entry
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const timeEntryId = searchParams.get('timeEntryId');

        if (!organizationId || !timeEntryId) {
            return NextResponse.json(
                { error: 'Missing required parameters: organizationId, timeEntryId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabase
            .from('task_time_entries')
            .delete()
            .eq('id', timeEntryId)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error deleting time entry:', error);
            return NextResponse.json(
                { error: 'Failed to delete time entry' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Time entry deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
