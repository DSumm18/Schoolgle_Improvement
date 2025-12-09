import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createOrganizationSchema, validateRequest } from '@/lib/validations';
import { standardLimiter } from '@/lib/rateLimit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
    try {
        // Rate limiting check
        const rateLimitResult = await standardLimiter.check(req);
        if (!rateLimitResult.allowed) {
            return rateLimitResult.response!;
        }

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

        // Parse and validate request body
        const body = await req.json();
        const validation = validateRequest(createOrganizationSchema, body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { name, userId } = validation.data;

        // First ensure the user exists in the users table
        const { error: userError } = await supabase
            .from('users')
            .upsert({ id: userId }, { onConflict: 'id' });

        if (userError) {
            console.error('Error ensuring user exists:', userError);
            return NextResponse.json({ error: `User sync failed: ${userError.message}` }, { status: 500 });
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
