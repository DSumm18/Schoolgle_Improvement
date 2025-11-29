import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { email, role, organizationId, invitedBy } = await req.json();

        if (!email || !role || !organizationId || !invitedBy) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user is already a member
        // (Optional check, but good UX)

        // Create invitation
        const { data: invitation, error } = await supabase
            .from('invitations')
            .insert({
                email,
                role,
                organization_id: organizationId,
                invited_by: invitedBy,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating invitation:', error);
            return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
        }

        // In a real app, we would send an email here using SendGrid/Resend.
        // For now, we return the invitation so the frontend can show a link.

        return NextResponse.json({ invitation });

    } catch (error: any) {
        console.error('Invite API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
