import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - List pending invitations
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('invitations')
            .select(`
                id,
                email,
                role,
                status,
                created_at,
                expires_at,
                invited_by_user:users!invited_by (
                    email,
                    display_name
                )
            `)
            .eq('organization_id', organizationId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invitations:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ invitations: data || [] });

    } catch (error: any) {
        console.error('Invitations API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Cancel/revoke invitation
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const invitationId = searchParams.get('invitationId');
        const organizationId = searchParams.get('organizationId');
        const requestedBy = searchParams.get('requestedBy');

        if (!invitationId || !organizationId || !requestedBy) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if requester is admin
        const { data: requesterMember } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', requestedBy)
            .single();

        if (!requesterMember || requesterMember.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can cancel invitations' }, { status: 403 });
        }

        // Delete invitation
        const { error } = await supabase
            .from('invitations')
            .delete()
            .eq('id', invitationId)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error canceling invitation:', error);
            return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Cancel invitation API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Resend invitation (update expires_at)
export async function POST(req: NextRequest) {
    try {
        const { invitationId, organizationId, requestedBy } = await req.json();

        if (!invitationId || !organizationId || !requestedBy) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if requester is admin
        const { data: requesterMember } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', requestedBy)
            .single();

        if (!requesterMember || requesterMember.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can resend invitations' }, { status: 403 });
        }

        // Update invitation expiry
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 7);

        const { error } = await supabase
            .from('invitations')
            .update({ 
                expires_at: newExpiry.toISOString(),
                status: 'pending'
            })
            .eq('id', invitationId)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error resending invitation:', error);
            return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Resend invitation API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

