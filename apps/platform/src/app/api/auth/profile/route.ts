import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, apiError, apiSuccess } from '@/lib/api-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
    return withErrorHandling(async () => {
        // Check env vars
        if (!supabaseUrl || !supabaseServiceKey) {
            return apiError('Server configuration error - missing Supabase credentials', 500, 'ENV_MISSING');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { userId, email, displayName } = await req.json();

        if (!userId || !email) {
            return apiError('Missing required fields', 400);
        }

        // 1. Sync User to Supabase
        const { error: userError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                auth_id: userId,
                email: email,
                display_name: displayName,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (userError) throw userError;

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
            .maybeSingle();

        if (memberError) {
            console.warn('Error fetching member during profile sync:', memberError);
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

        return apiSuccess({
            user: { id: userId, email, displayName },
            organization
        });
    }, 'Auth Profile API');
}
