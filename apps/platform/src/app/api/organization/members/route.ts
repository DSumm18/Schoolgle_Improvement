import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
        }

        // Fetch members with user details
        const { data: members, error } = await supabase
            .from('organization_members')
            .select(`
                role,
                created_at,
                user:users (
                    id,
                    email,
                    display_name
                )
            `)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error fetching members:', error);
            return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
        }

        return NextResponse.json({ members });

    } catch (error: any) {
        console.error('Members API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
