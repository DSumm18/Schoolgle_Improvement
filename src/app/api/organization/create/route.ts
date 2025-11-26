import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { name, userId } = await req.json();

        if (!name || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({ name })
            .select()
            .single();

        if (orgError) {
            console.error('Error creating organization:', orgError);
            return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
        }

        // 2. Add User as Admin
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: org.id,
                user_id: userId,
                role: 'admin'
            });

        if (memberError) {
            console.error('Error adding member:', memberError);
            // Rollback org creation? Ideally yes, but for now we'll just error.
            return NextResponse.json({ error: 'Failed to add member to organization' }, { status: 500 });
        }

        return NextResponse.json({ organization: org });

    } catch (error: any) {
        console.error('Create Org API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
