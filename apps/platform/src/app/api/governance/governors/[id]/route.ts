import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Governor, GovernorForm } from '@/lib/governance';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteContext {
    params: { id: string };
}

/**
 * GET /api/governance/governors/[id]
 * Get a specific governor by ID
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

        const { data: governor, error } = await supabase
            .from('governors')
            .select('*')
            .eq('id', id)
            .eq('organization_id', organizationId)
            .single();

        if (error || !governor) {
            return NextResponse.json(
                { error: 'Governor not found' },
                { status: 404 }
            );
        }

        // Get governor's training records
        const { data: training } = await supabase
            .from('governor_training')
            .select('*')
            .eq('governor_id', id)
            .order('completed_date', { ascending: false });

        // Get governor's attendance at meetings
        const today = new Date();
        const pastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

        const { data: meetings } = await supabase
            .from('governor_meetings')
            .select('id, title, scheduled_date, status, attended_governors')
            .eq('organization_id', organizationId)
            .gte('scheduled_date', pastYear.toISOString())
            .contains('attended_governors', [id])
            .order('scheduled_date', { ascending: false });

        const attendedMeetings = meetings?.filter(m =>
            m.attended_governors?.includes(id)
        ).length || 0;

        return NextResponse.json({
            governor: {
                ...governor,
                training_records: training || [],
                meetings_attended_this_year: attendedMeetings,
            }
        });

    } catch (error: any) {
        console.error('Governor detail API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/governance/governors/[id]
 * Update a specific governor
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
        } & Partial<Governor>;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: governor, error } = await supabase
            .from('governors')
            .update({
                ...changes,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error || !governor) {
            return NextResponse.json(
                { error: 'Governor not found or update failed' },
                { status: 404 }
            );
        }

        return NextResponse.json({ governor });

    } catch (error: any) {
        console.error('Governor update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/governance/governors/[id]
 * Delete a governor (soft delete by setting status to inactive)
 */
export async function DELETE(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = context.params;
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const hard = searchParams.get('hard') === 'true';

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        if (hard) {
            // Permanent delete
            const { error } = await supabase
                .from('governors')
                .delete()
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) {
                console.error('Error deleting governor:', error);
                return NextResponse.json(
                    { error: 'Failed to delete governor' },
                    { status: 500 }
                );
            }
        } else {
            // Soft delete - set to inactive
            const { error } = await supabase
                .from('governors')
                .update({
                    status: 'inactive',
                    end_date: new Date().toISOString().split('T')[0],
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) {
                console.error('Error deactivating governor:', error);
                return NextResponse.json(
                    { error: 'Failed to deactivate governor' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Governor deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
