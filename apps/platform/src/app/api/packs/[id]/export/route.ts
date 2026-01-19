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
        const { format, userId, organizationId } = body;

        if (!format) return apiError('format is required (pdf or docx)', 400);

        const { data: pack, error: fetchError } = await supabase
            .from('packs')
            .select('*, pack_templates(*)')
            .eq('id', id)
            .single();

        if (fetchError || !pack) return apiError('Pack not found', 404);

        // In a production environment, we would use a library like jspdf on the server
        // or a lambda function to generate the document and upload to storage.
        // For this MVP, we will:
        // 1. Mark as exported in the database
        // 2. Create an export record
        // 3. Return a "success" - the frontend will handle the actual generation/printing
        //    via the browser printing API which is high quality for PDFs.

        const { data: exportRecord, error: exportError } = await supabase
            .from('pack_exports').insert({
                pack_id: id,
                version_number: pack.current_version,
                format: format,
                file_url: 'browser_print', // Placeholder
                exported_by: userId
            })
            .select()
            .single();

        if (exportError) throw exportError;

        // Timeline entry
        await supabase.from('timeline_entries').insert({
            organization_id: organizationId || pack.organization_id,
            created_by: userId,
            title: `Pack Exported (${format.toUpperCase()}): ${pack.title}`,
            description: `Formal governance document generated for external use.`,
            entry_type: 'pack_exported',
            source_type: 'pack',
            source_id: id,
            tags: ['Governance', 'Board Papers', pack.pack_templates?.pack_type || 'General']
        });

        return apiSuccess({
            exportId: exportRecord.id,
            message: 'Export metadata recorded successfully',
            nextAction: 'trigger_browser_print'
        });
    }, 'Pack Export POST');
}
