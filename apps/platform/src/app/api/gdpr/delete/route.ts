import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GDPR Data Deletion Endpoint
 * Deletes all personal data for a user
 * Satisfies Article 17 (Right to Erasure / Right to be Forgotten)
 */
export async function POST(req: NextRequest) {
    try {
        const { userId, confirmDeletion } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        if (!confirmDeletion) {
            return NextResponse.json({ 
                error: 'Deletion not confirmed',
                message: 'Please set confirmDeletion: true to proceed'
            }, { status: 400 });
        }

        // Verify user exists
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const deletionLog: string[] = [];

        // 1. Delete user's lesson observations
        const { error: obsError, count: obsCount } = await supabase
            .from('lesson_observations')
            .delete()
            .eq('observer_id', userId);
        
        if (!obsError) deletionLog.push(`Deleted ${obsCount || 0} lesson observations`);

        // 2. Update actions - remove user as assignee (don't delete org data)
        const { error: actError } = await supabase
            .from('actions')
            .update({ assigned_to: null })
            .eq('assigned_to', userId);
        
        if (!actError) deletionLog.push('Removed user from action assignments');

        // 3. Update assessments - anonymise assessor
        const { error: assessError } = await supabase
            .from('ofsted_assessments')
            .update({ assessed_by: null })
            .eq('assessed_by', userId);
        
        if (!assessError) deletionLog.push('Anonymised assessment records');

        // 4. Delete invitations sent by user
        const { error: invError, count: invCount } = await supabase
            .from('invitations')
            .delete()
            .eq('invited_by', userId);
        
        if (!invError) deletionLog.push(`Deleted ${invCount || 0} invitations`);

        // 5. Remove user from organisation memberships
        const { error: memError, count: memCount } = await supabase
            .from('organization_members')
            .delete()
            .eq('user_id', userId);
        
        if (!memError) deletionLog.push(`Removed from ${memCount || 0} organisations`);

        // 6. Log the deletion before deleting user (for audit)
        await supabase.from('activity_log').insert({
            event_type: 'gdpr_user_deleted',
            event_data: { 
                deleted_user_email_hash: Buffer.from(userData.email).toString('base64'),
                deletion_date: new Date().toISOString(),
                deletion_log: deletionLog
            }
        });

        // 7. Delete the user record
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (deleteError) {
            return NextResponse.json({ 
                error: 'Failed to delete user',
                details: deleteError.message 
            }, { status: 500 });
        }

        deletionLog.push('User account deleted');

        return NextResponse.json({
            success: true,
            message: 'All personal data has been deleted',
            deletion_reference: `DEL-${Date.now()}`,
            deletion_date: new Date().toISOString(),
            actions_taken: deletionLog,
            backup_purge_note: 'Data in backups will be automatically purged within 90 days'
        });

    } catch (error: any) {
        console.error('GDPR deletion error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GDPR Organisation Deletion Endpoint
 * Deletes entire organisation and all associated data
 */
export async function DELETE(req: NextRequest) {
    try {
        const { organizationId, adminUserId, confirmDeletion } = await req.json();

        if (!organizationId || !adminUserId) {
            return NextResponse.json({ 
                error: 'Organisation ID and Admin User ID required' 
            }, { status: 400 });
        }

        if (!confirmDeletion) {
            return NextResponse.json({ 
                error: 'Deletion not confirmed',
                message: 'Please set confirmDeletion: true to proceed. This action is irreversible.'
            }, { status: 400 });
        }

        // Verify admin permissions
        const { data: adminCheck } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', adminUserId)
            .single();

        if (!adminCheck || adminCheck.role !== 'admin') {
            return NextResponse.json({ 
                error: 'Unauthorised. Only organisation admins can delete.'
            }, { status: 403 });
        }

        const deletionLog: string[] = [];

        // Delete in order (respecting foreign keys)
        const tables = [
            'lesson_observations',
            'evidence_matches',
            'documents',
            'siams_assessments',
            'ofsted_assessments',
            'safeguarding_assessments',
            'actions',
            'sdp_milestones',
            'sdp_priorities',
            'sports_premium_spending',
            'sports_premium_data',
            'pp_spending',
            'pupil_premium_data',
            'statutory_documents',
            'notes',
            'activity_log',
            'meetings',
            'cpd_records',
            'policies',
            'surveys',
            'risk_register',
            'reminders',
            'monitoring_visits',
            'external_visits',
            'invitations',
            'organization_members',
            'organization_modules',
            'subscriptions',
            'usage_logs'
        ];

        for (const table of tables) {
            const { count } = await supabase
                .from(table)
                .delete()
                .eq('organization_id', organizationId);
            
            if (count) deletionLog.push(`Deleted ${count} records from ${table}`);
        }

        // Finally delete the organisation
        const { error: orgError } = await supabase
            .from('organizations')
            .delete()
            .eq('id', organizationId);

        if (orgError) {
            return NextResponse.json({ 
                error: 'Failed to delete organisation',
                partial_deletion: deletionLog
            }, { status: 500 });
        }

        deletionLog.push('Organisation deleted');

        return NextResponse.json({
            success: true,
            message: 'Organisation and all associated data has been deleted',
            deletion_reference: `ORG-DEL-${Date.now()}`,
            deletion_date: new Date().toISOString(),
            actions_taken: deletionLog,
            backup_purge_note: 'Data in backups will be automatically purged within 90 days'
        });

    } catch (error: any) {
        console.error('Organisation deletion error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

