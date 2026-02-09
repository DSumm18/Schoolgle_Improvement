import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
    GovernanceBoard,
    GetBoardRequest,
    GetBoardResponse,
} from '@/lib/governance';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/governance/board
 * Get governance board details and statistics for an organization
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get or create board
        let { data: board, error: boardError } = await supabase
            .from('governance_boards')
            .select('*')
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (boardError) {
            console.error('Error fetching board:', boardError);
            return NextResponse.json(
                { error: 'Failed to fetch board details' },
                { status: 500 }
            );
        }

        // Create board if it doesn't exist
        if (!board) {
            const { data: newBoard, error: createError } = await supabase
                .from('governance_boards')
                .insert({
                    organization_id: organizationId,
                    name: 'Governing Body',
                    type: 'maintained',
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating board:', createError);
                return NextResponse.json(
                    { error: 'Failed to create board' },
                    { status: 500 }
                );
            }
            board = newBoard;
        }

        // Get governors count by status
        const { data: governorsData } = await supabase
            .from('governors')
            .select('status, governor_type')
            .eq('organization_id', organizationId);

        const totalGovernors = governorsData?.length || 0;
        const activeGovernors = governorsData?.filter((g: any) => g.status === 'active').length || 0;
        const governorTypes = governorsData?.reduce((acc: any, g: any) => {
            acc[g.governor_type] = (acc[g.governor_type] || 0) + 1;
            return acc;
        }, {}) || {};

        // Get upcoming meetings
        const today = new Date().toISOString().split('T')[0];
        const { data: upcomingMeetings } = await supabase
            .from('governor_meetings')
            .select('*')
            .eq('organization_id', organizationId)
            .gte('scheduled_date', today)
            .order('scheduled_date', { ascending: true })
            .limit(3);

        // Get recent meetings
        const { data: recentMeetings } = await supabase
            .from('governor_meetings')
            .select('*')
            .eq('organization_id', organizationId)
            .lt('scheduled_date', today)
            .order('scheduled_date', { ascending: false })
            .limit(5);

        // Calculate statistics
        const statistics = {
            total_governors: totalGovernors,
            active_governors: activeGovernors,
            vacant_positions: 0, // Will be calculated based on target positions
            governor_types: governorTypes,
            upcoming_meetings: upcomingMeetings?.length || 0,
            past_meetings_this_year: recentMeetings?.length || 0,
            average_attendance_rate: 0, // Will be calculated from governor attendance
        };

        const response: GetBoardResponse = {
            board,
            statistics,
            recent_meetings: recentMeetings || [],
            upcoming_meetings: upcomingMeetings || [],
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Board API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/governance/board
 * Update board details
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { organizationId, name, type } = body as {
            organizationId: string;
            name?: string;
            type?: 'maintained' | 'academy' | 'church';
        };

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;

        const { data, error } = await supabase
            .from('governance_boards')
            .update(updateData)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) {
            console.error('Error updating board:', error);
            return NextResponse.json(
                { error: 'Failed to update board' },
                { status: 500 }
            );
        }

        return NextResponse.json({ board: data });

    } catch (error: any) {
        console.error('Board update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
