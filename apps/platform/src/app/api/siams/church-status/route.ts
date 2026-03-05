import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
    SchoolChurchStatus,
    SchoolChurchStatusForm,
    ChurchDenomination,
    SiamsRating,
    SchoolChurchStatusRequest,
    SchoolChurchStatusResponse,
} from '@/lib/siams';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/siams/church-status
 * Get church school status for an organization
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

        const { data: status, error } = await supabase
            .from('school_church_status')
            .select('*')
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching church status:', error);
            return NextResponse.json(
                { error: 'Failed to fetch church status' },
                { status: 500 }
            );
        }

        // If no status exists, return default
        if (!status) {
            const response: SchoolChurchStatusResponse = {
                id: '',
                organization_id: organizationId,
                urn: null,
                school_name: null,
                la_code: null,
                establishment_number: null,
                is_church_school: false,
                church_denomination: null,
                diocese: null,
                parish: null,
                last_siams_date: null,
                last_siams_rating: null,
                next_siams_date: null,
                dfe_data: {},
                updated_at: '',
                display_name: 'Not a Church School',
                icon_name: 'school',
                is_enabled: false,
            };
            return NextResponse.json(response);
        }

        // Create display info
        let displayName = 'Not a Church School';
        let iconName = 'school';

        if (status.is_church_school) {
            switch (status.church_denomination) {
                case 'church_of_england':
                    displayName = 'Church of England';
                    iconName = 'church';
                    break;
                case 'roman_catholic':
                    displayName = 'Roman Catholic';
                    iconName = 'cross';
                    break;
                case 'methodist':
                    displayName = 'Methodist';
                    iconName = 'church';
                    break;
                case 'other_christian':
                    displayName = 'Christian (Other)';
                    iconName = 'place-of-worship';
                    break;
                default:
                    displayName = 'Church School';
                    iconName = 'church';
            }
        }

        const response: SchoolChurchStatusResponse = {
            ...status,
            display_name: displayName,
            icon_name: iconName,
            is_enabled: status.is_church_school,
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Church Status API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/siams/church-status
 * Create or update church school status
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            organizationId,
            urn,
            is_church_school,
            church_denomination,
            diocese,
            parish,
            last_siams_date,
            last_siams_rating,
            next_siams_date,
        } = body as SchoolChurchStatusRequest & { organizationId: string };

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if status exists
        const { data: existing } = await supabase
            .from('school_church_status')
            .select('id')
            .eq('organization_id', organizationId)
            .maybeSingle();

        let status: SchoolChurchStatus;

        if (existing) {
            // Update existing
            const { data, error } = await supabase
                .from('school_church_status')
                .update({
                    urn: urn || null,
                    is_church_school: is_church_school ?? false,
                    church_denomination: church_denomination || null,
                    diocese: diocese || null,
                    parish: parish || null,
                    last_siams_date: last_siams_date || null,
                    last_siams_rating: last_siams_rating || null,
                    next_siams_date: next_siams_date || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('organization_id', organizationId)
                .select()
                .single();

            if (error) {
                console.error('Error updating church status:', error);
                return NextResponse.json(
                    { error: 'Failed to update church status' },
                    { status: 500 }
                );
            }
            status = data;
        } else {
            // Create new
            const { data, error } = await supabase
                .from('school_church_status')
                .insert({
                    id: crypto.randomUUID(),
                    organization_id: organizationId,
                    urn: urn || null,
                    is_church_school: is_church_school ?? false,
                    church_denomination: church_denomination || null,
                    diocese: diocese || null,
                    parish: parish || null,
                    last_siams_date: last_siams_date || null,
                    last_siams_rating: last_siams_rating || null,
                    next_siams_date: next_siams_date || null,
                    dfe_data: {},
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating church status:', error);
                return NextResponse.json(
                    { error: 'Failed to create church status' },
                    { status: 500 }
                );
            }
            status = data;
        }

        // Trigger readiness snapshot creation for historical tracking
        if (is_church_school) {
            await supabase.rpc('create_siams_readiness_snapshot', {
                org_id: organizationId,
            });
        }

        return NextResponse.json({ status, created: !existing });

    } catch (error: any) {
        console.error('Church Status update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/siams/church-status
 * Partial update of church school status
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { organizationId, ...changes } = body as {
            organizationId: string;
        } & Partial<SchoolChurchStatusForm>;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: status, error } = await supabase
            .from('school_church_status')
            .update({
                ...changes,
                updated_at: new Date().toISOString(),
            })
            .eq('organization_id', organizationId)
            .select()
            .maybeSingle();

        if (error) {
            console.error('Error patching church status:', error);
            return NextResponse.json(
                { error: 'Failed to update church status' },
                { status: 500 }
            );
        }

        if (!status) {
            return NextResponse.json(
                { error: 'Church status not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ status });

    } catch (error: any) {
        console.error('Church Status patch error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
