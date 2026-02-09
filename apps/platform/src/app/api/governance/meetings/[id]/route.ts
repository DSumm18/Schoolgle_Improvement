import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { GovernorMeeting } from '@/lib/governance';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteContext {
    params: { id: string };
}

/**
 * GET /api/governance/meetings/[id]
 * Get a specific meeting by ID
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

        const { data: meeting, error } = await supabase
            .from('governor_meetings')
            .select('*')
            .eq('id', id)
            .eq('organization_id', organizationId)
            .single();

        if (error || !meeting) {
            return NextResponse.json(
                { error: 'Meeting not found' },
                { status: 404 }
            );
        }

        // Get governor details
        const governorIds = [
            ...meeting.invited_governors,
            ...meeting.attended_governors,
            ...meeting.apologies_governors,
        ];

        let governorsMap: Record<string, { name: string; email: string | null; photo: string | null }> = {};
        if (governorIds.length > 0) {
            const { data: governors } = await supabase
                .from('governors')
                .select('id, full_name, email, photo_url')
                .in('id', governorIds.slice(0, 100));

            governorsMap = (governors || []).reduce((acc: any, g: any) => {
                acc[g.id] = { name: g.full_name, email: g.email, photo: g.photo_url };
                return acc;
            }, {});
        }

        // Enrich with governor details
        const enrichedMeeting = {
            ...meeting,
            invited_governors_details: meeting.invited_governors?.map((id: string) => governorsMap[id]) || [],
            attended_governors_details: meeting.attended_governors?.map((id: string) => governorsMap[id]) || [],
            apologies_governors_details: meeting.apologies_governors?.map((id: string) => governorsMap[id]) || [],
        };

        return NextResponse.json({ meeting: enrichedMeeting });

    } catch (error: any) {
        console.error('Meeting detail API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/governance/meetings/[id]
 * Update a specific meeting
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
        } & Partial<GovernorMeeting>;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Prepare agenda items if provided
        let updateData: any = { ...changes };
        if (changes.agenda_items) {
            updateData.agenda_items = changes.agenda_items;
        }

        const { data: meeting, error } = await supabase
            .from('governor_meetings')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error || !meeting) {
            return NextResponse.json(
                { error: 'Meeting not found or update failed' },
                { status: 404 }
            );
        }

        return NextResponse.json({ meeting });

    } catch (error: any) {
        console.error('Meeting update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/governance/meetings/[id]
 * Delete a meeting
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

        const { error } = await supabase
            .from('governor_meetings')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error deleting meeting:', error);
            return NextResponse.json(
                { error: 'Failed to delete meeting' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Meeting deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/governance/meetings/[id]/attendance
 * Update meeting attendance
 */
export async function POST(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = context.params;
        const body = await req.json();
        const {
            organizationId,
            attended_governors,
            apologies_governors,
        } = body as {
            organizationId: string;
            attended_governors: string[];
            apologies_governors: string[];
        };

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Update attendance
        const { data: meeting, error } = await supabase
            .from('governor_meetings')
            .update({
                attended_governors,
                apologies_governors,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error || !meeting) {
            return NextResponse.json(
                { error: 'Meeting not found or update failed' },
                { status: 404 }
            );
        }

        // Update individual governor attendance counts
        if (attended_governors.length > 0) {
            // Increment attended count for all attending governors
            await supabase.rpc('calculate_governor_attendance', {
                governor_id: attended_governors[0] // Function will calculate for all
            });
        }

        return NextResponse.json({ meeting });

    } catch (error: any) {
        console.error('Meeting attendance update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
