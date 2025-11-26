import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(req: NextRequest) {
    try {
        const { organizationId, userId, newRole, requestedBy } = await req.json();

        if (!organizationId || !userId || !newRole || !requestedBy) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate role
        if (!['admin', 'teacher', 'slt'].includes(newRole)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check if requester is admin
        const { data: requesterMember } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', requestedBy)
            .single();

        if (!requesterMember || requesterMember.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can update roles' }, { status: 403 });
        }

        // Prevent removing the last admin
        if (newRole !== 'admin') {
            const { data: admins } = await supabase
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', organizationId)
                .eq('role', 'admin');

            if (admins && admins.length === 1 && admins[0].user_id === userId) {
                return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 });
            }
        }

        // Update role
        const { error } = await supabase
            .from('organization_members')
            .update({ role: newRole })
            .eq('organization_id', organizationId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating role:', error);
            return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update role API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const userId = searchParams.get('userId');
        const requestedBy = searchParams.get('requestedBy');

        if (!organizationId || !userId || !requestedBy) {
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
            return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
        }

        // Prevent removing the last admin
        const { data: targetMember } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .single();

        if (targetMember?.role === 'admin') {
            const { data: admins } = await supabase
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', organizationId)
                .eq('role', 'admin');

            if (admins && admins.length === 1) {
                return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 });
            }
        }

        // Remove member
        const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('organization_id', organizationId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error removing member:', error);
            return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Remove member API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

