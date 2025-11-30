import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GDPR Data Export Endpoint
 * Returns all personal data for a user in JSON format
 * Satisfies Article 15 (Right of Access) and Article 20 (Data Portability)
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Fetch user data
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch organisation membership
        const { data: membershipData } = await supabase
            .from('organization_members')
            .select(`
                role,
                job_title,
                created_at,
                organization:organizations (
                    id,
                    name,
                    school_type
                )
            `)
            .eq('user_id', userId);

        // Fetch user's assessments (if they created any)
        const { data: assessmentsData } = await supabase
            .from('ofsted_assessments')
            .select('*')
            .eq('assessed_by', userId);

        // Fetch user's actions (if they created any)
        const { data: actionsData } = await supabase
            .from('actions')
            .select('*')
            .or(`created_by.eq.${userId},assigned_to.eq.${userId}`);

        // Fetch user's observations
        const { data: observationsData } = await supabase
            .from('lesson_observations')
            .select('*')
            .eq('observer_id', userId);

        // Fetch invitations sent by user
        const { data: invitationsData } = await supabase
            .from('invitations')
            .select('*')
            .eq('invited_by', userId);

        // Build the export object
        const exportData = {
            export_metadata: {
                export_date: new Date().toISOString(),
                export_type: 'GDPR Subject Access Request',
                format_version: '1.0',
                data_controller: (membershipData?.[0]?.organization as any)?.name || 'Unknown',
                data_processor: 'Schoolgle Ltd'
            },
            data_subject: {
                id: userData.id,
                email: userData.email,
                display_name: userData.display_name,
                avatar_url: userData.avatar_url,
                account_created: userData.created_at,
                account_updated: userData.updated_at
            },
            organisation_memberships: membershipData?.map(m => ({
                organisation_name: (m.organization as any)?.name,
                role: m.role,
                job_title: m.job_title,
                joined_date: m.created_at
            })) || [],
            content_created: {
                assessments: {
                    count: assessmentsData?.length || 0,
                    items: assessmentsData?.map(a => ({
                        id: a.id,
                        subcategory: a.subcategory_id,
                        rating: a.rating,
                        created_at: a.created_at
                    })) || []
                },
                actions: {
                    count: actionsData?.length || 0,
                    items: actionsData?.map(a => ({
                        id: a.id,
                        title: a.title,
                        status: a.status,
                        created_at: a.created_at
                    })) || []
                },
                observations: {
                    count: observationsData?.length || 0,
                    items: observationsData?.map(o => ({
                        id: o.id,
                        date: o.date,
                        teacher_name: o.teacher_name,
                        created_at: o.created_at
                    })) || []
                }
            },
            invitations_sent: invitationsData?.map(i => ({
                email: i.email,
                role: i.role,
                status: i.status,
                created_at: i.created_at
            })) || [],
            data_retention_info: {
                account_data: 'Retained until account deletion + 30 days',
                content_data: 'Retained until deleted by organisation + 30 days',
                activity_logs: 'Retained for 12 months then automatically deleted',
                backups: 'Retained for 90 days then automatically deleted'
            },
            your_rights: {
                rectification: 'You can update your data via Settings',
                erasure: 'You can delete your account via Settings → Privacy → Delete Account',
                restriction: 'Contact dpo@schoolgle.co.uk',
                portability: 'This export satisfies your portability rights',
                complaint: 'Contact the ICO at ico.org.uk'
            }
        };

        // Log the export for audit purposes
        await supabase.from('activity_log').insert({
            organization_id: (membershipData?.[0]?.organization as any)?.id,
            user_id: userId,
            event_type: 'gdpr_data_export',
            event_data: { export_date: new Date().toISOString() }
        });

        return NextResponse.json(exportData);

    } catch (error: any) {
        console.error('GDPR export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

