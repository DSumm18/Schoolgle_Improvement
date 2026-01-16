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
        const { userId, organizationId } = body;

        if (!userId) return apiError('userId is required', 400);

        // 1. Get current pack state
        const { data: pack, error: fetchError } = await supabase
            .from('packs')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !pack) return apiError('Pack not found', 404);
        if (pack.status === 'submitted' || pack.status === 'approved') {
            return apiError('Pack is already submitted or approved', 400);
        }

        // 2. Update pack status
        const { error: updateError } = await supabase
            .from('packs')
            .update({ status: 'submitted', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) throw updateError;

        // 3. Create version
        const { data: lastVersion } = await supabase
            .from('pack_versions')
            .select('version_number')
            .eq('pack_id', id)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextVersion = (lastVersion?.version_number || 0) + 1;

        await supabase.from('pack_versions').insert({
            pack_id: id,
            version_number: nextVersion,
            sections: pack.sections,
            trigger_type: 'submit',
            changed_by: userId,
            change_summary: 'Submitted for approval'
        });

        // 4. Create approval record
        await supabase.from('pack_approvals').insert({
            pack_id: id,
            version_number: nextVersion,
            action: 'submitted',
            submitted_by: userId,
            submitted_at: new Date().toISOString()
        });

        // 5. Add timeline entry
        await supabase.from('timeline_entries').insert({
            organization_id: organizationId || pack.organization_id,
            created_by: userId,
            title: `Pack Submitted: ${pack.title}`,
            description: `Sent to governors for formal review`,
            entry_type: 'system',
            source_type: 'pack',
            source_id: id
        });

        // 6. Notification placeholder (In a real app, this would trigger an email/push)
        console.log(`Notification: Pack ${id} submitted for approval by ${userId}`);

        return apiSuccess({ status: 'submitted', version: nextVersion });
    }, 'Pack Submit POST');
}
