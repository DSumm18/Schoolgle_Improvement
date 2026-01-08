import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
    try {
        // Check env vars
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing env vars:', {
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseServiceKey
            });
            return NextResponse.json({
                error: 'Server configuration error - missing Supabase credentials'
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { userId, email, displayName } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Sync User to Supabase
        // auth_id is the canonical UUID from Supabase Auth
        // userId is the legacy ID (currently also the Supabase ID in new setups, but decoupled in schema)
        const { error: userError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                auth_id: userId, // In Supabase flow, the user's ID is the UUID
                email: email,
                display_name: displayName,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (userError) {
            console.error('Error syncing user:', userError);
            return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
        }

        // 2. Fetch Organization (user may not have one yet - that's OK)
        const { data: memberData, error: memberError } = await supabase
            .from('organization_members')
            .select(`
                role,
                organization:organizations (
                    id,
                    name
                )
            `)
            .eq('user_id', userId)
            .maybeSingle();

        // PGRST116 = no rows, which is fine for new users without organizations
        if (memberError && memberError.code !== 'PGRST116') {
            console.error('Error fetching member:', memberError);
            // Don't fail the whole request - user sync succeeded
        }

        const member = memberData as any;
        let orgData = member?.organization;

        if (Array.isArray(orgData)) {
            orgData = orgData[0];
        }

        const organization = orgData ? {
            id: orgData.id,
            name: orgData.name,
            role: member?.role
        } : null;

        return NextResponse.json({
            user: { id: userId, email, displayName },
            organization
        });

    } catch (error: any) {
        console.error('Profile API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
