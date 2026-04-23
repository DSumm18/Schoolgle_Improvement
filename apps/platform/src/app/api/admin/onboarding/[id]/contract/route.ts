import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/onboarding/[id]/contract
 * Send contract for signature via DocuSign
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return protectedRoute(async (auth, req: NextRequest) => {
        const { id: leadId } = await params;

        // Get the lead
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('onboarding_leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            return apiError('Lead not found', 404);
        }

        if (!lead.approver_email) {
            return apiError('Approver email required. Please complete the onboarding form first.', 400);
        }

        // In production, this would:
        // 1. Generate a contract PDF
        // 2. Create a DocuSign envelope
        // 3. Send for signature
        // 4. Store the envelope_id for webhooks

        // For now, simulate the DocuSign flow
        const mockEnvelopeId = `E-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

        // Update lead with contract tracking
        const { data: updatedLead, error: updateError } = await supabaseAdmin
            .from('onboarding_leads')
            .update({
                docusign_envelope_id: mockEnvelopeId,
                contract_sent_at: new Date().toISOString(),
            })
            .eq('id', leadId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating lead:', updateError);
        }

        return apiSuccess({
            envelopeId: mockEnvelopeId,
            message: 'Contract sent for signature',
            // In production, include the DocuSign viewing URL
            // viewingUrl: `https://demo.docusign.net/...`,
        });
    })(req);
}
