import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, apiError, apiSuccess } from '@/lib/api-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withErrorHandling(async () => {
        const { id } = params;
        const body = await request.json();
        const { userId, organizationId, comments } = body;

        if (!userId) return apiError('userId is required', 400);

        const { data: pack, error: fetchError } = await supabase
            .from('packs')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !pack) return apiError('Pack not found', 404);

        // Update status to approved
        const { error: updateError } = await supabase
            .from('packs')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) throw updateError;

        // Create approval record
        await supabase.from('pack_approvals').insert({
            pack_id: id,
            version_number: pack.current_version,
            action: 'approved',
            decided_by: userId,
            decided_at: new Date().toISOString(),
            comments
        });

        // Create timeline entry
        await supabase.from('timeline_entries').insert({
            organization_id: organizationId || pack.organization_id,
            created_by: userId,
            title: `Pack Approved: ${pack.title}`,
            description: `Governor review complete. Document is now board-ready.`,
            entry_type: 'pack_approved',
            source_type: 'pack',
            source_id: id
        });

        return apiSuccess({ status: 'approved' });
    }, 'Pack Approve POST');
}
