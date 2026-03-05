import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
    Governor,
    GovernorForm,
    UpsertGovernorRequest,
    GetGovernorsRequest,
    GetGovernorsResponse,
    GovernorStatus,
    GovernorType,
} from '@/lib/governance';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/governance/governors
 * Get list of governors for an organization
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const status = searchParams.get('status') as GovernorStatus | null;
        const governorType = searchParams.get('governorType') as GovernorType | null;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = supabase
            .from('governors')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }
        if (governorType) {
            query = query.eq('governor_type', governorType);
        }

        const { data: governors, error } = await query;

        if (error) {
            console.error('Error fetching governors:', error);
            return NextResponse.json(
                { error: 'Failed to fetch governors' },
                { status: 500 }
            );
        }

        const total = governors?.length || 0;
        const active = governors?.filter((g: Governor) => g.status === 'active').length || 0;
        const vacancies = governors?.filter((g: Governor) =>
            g.status === 'active' && g.end_date && new Date(g.end_date) < new Date()
        ).length || 0;

        const response: GetGovernorsResponse = {
            governors: governors || [],
            total,
            active,
            vacancies,
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Governors API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/governance/governors
 * Create a new governor
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            organizationId,
            userId,
            full_name,
            email,
            phone,
            photo_url,
            governor_type,
            role,
            committee_assignment,
            start_date,
            end_date,
            appointment_date,
            appointing_body,
            skills,
            declarations_of_interest,
        } = body as UpsertGovernorRequest;

        if (!organizationId || !full_name || !governor_type) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, full_name, governor_type' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get or create board
        const { data: board } = await supabase
            .from('governance_boards')
            .select('id')
            .eq('organization_id', organizationId)
            .single();

        // Create governor
        const { data: governor, error } = await supabase
            .from('governors')
            .insert({
                id: uuidv4(),
                organization_id: organizationId,
                board_id: board?.id || null,
                user_id: userId || null,
                full_name,
                email: email || null,
                phone: phone || null,
                photo_url: photo_url || null,
                governor_type,
                role: role || null,
                committee_assignment: committee_assignment || [],
                start_date: start_date || null,
                end_date: end_date || null,
                appointment_date: appointment_date || null,
                appointing_body: appointing_body || null,
                status: 'active',
                skills: skills || [],
                declarations_of_interest: declarations_of_interest || {},
                meetings_attended: 0,
                meetings_total: 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating governor:', error);
            return NextResponse.json(
                { error: 'Failed to create governor' },
                { status: 500 }
            );
        }

        return NextResponse.json({ governor }, { status: 201 });

    } catch (error: any) {
        console.error('Governor creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/governance/governors
 * Bulk update governors (for updating multiple records at once)
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { organizationId, updates } = body as {
            organizationId: string;
            updates: Array<{ id: string; changes: Partial<GovernorForm> }>;
        };

        if (!organizationId || !updates || !Array.isArray(updates)) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, updates (array)' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const results = await Promise.all(
            updates.map(async ({ id, changes }) => {
                const { data, error } = await supabase
                    .from('governors')
                    .update({
                        ...changes,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                    .eq('organization_id', organizationId)
                    .select()
                    .single();

                return { governor: data, error };
            })
        );

        const successCount = results.filter(r => !r.error).length;
        const errors = results.filter(r => r.error).map(r => r.error);

        return NextResponse.json({
            updated: successCount,
            failed: results.length - successCount,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error: any) {
        console.error('Bulk governor update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
