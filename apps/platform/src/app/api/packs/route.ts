import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, apiError, apiSuccess } from '@/lib/api-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    return withErrorHandling(async () => {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('organizationId');

        if (!orgId) {
            return apiError('organizationId is required', 400);
        }

        const { data, error } = await supabase
            .from('packs')
            .select('*, pack_templates(name)')
            .eq('organization_id', orgId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return apiSuccess({ packs: data });
    }, 'Packs GET');
}

export async function POST(request: NextRequest) {
    return withErrorHandling(async () => {
        const body = await request.json();
        const {
            organizationId,
            templateId,
            title,
            userId,
            sections
        } = body;

        if (!organizationId || !templateId || !title || !userId) {
            return apiError('Missing required fields', 400);
        }

        const { data, error } = await supabase
            .from('packs')
            .insert({
                organization_id: organizationId,
                template_id: templateId,
                title,
                status: 'draft',
                sections: sections || [],
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;

        // Create an audit log/timeline entry
        await supabase.from('timeline_entries').insert({
            organization_id: organizationId,
            created_by: userId,
            title: `Pack created: ${title}`,
            description: `New governor pack started from template`,
            entry_type: 'pack_created',
            source_type: 'pack',
            source_id: data.id
        });

        return apiSuccess(data);
    }, 'Packs POST');
}
