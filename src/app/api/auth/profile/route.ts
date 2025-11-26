import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { userId, email, displayName } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Sync User to Supabase
        const { error: userError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                email: email,
                display_name: displayName,
                // created_at will be set on insert, ignored on update if not specified? 
                // actually upsert updates all columns provided. We might want to preserve created_at.
                // But for now simple upsert is fine.
            }, { onConflict: 'id' });

        if (userError) {
            console.error('Error syncing user:', userError);
            return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
        }

        // 2. Fetch Organization
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
            .single();

        if (memberError && memberError.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
            console.error('Error fetching member:', memberError);
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
