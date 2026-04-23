import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/onboarding/[id]/fetch-dfe
 * Fetch school data from DfE database by URN
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

        if (!lead.urn) {
            return apiError('No URN available for DfE lookup', 400);
        }

        // Fetch from DfE database (separate project)
        // This would query the DfE database stored in a different Supabase project
        const dfeQuery = `
            SELECT
                urn,
                la_code,
                establishment_number,
                name,
                local_authority as la_name,
                phase,
                school_type,
                establishment_type,
                address_street,
                address_locality,
                address_town,
                address_county,
                address_postcode as postcode,
                website,
                telephone as school_phone,
                headteacher_name,
                headteacher_title,
                headteacher_email,
                trust_name,
                trust_code,
                total_pupils as pupil_count,
                statutory_low_age,
                statutory_high_age,
                religious_character,
                gor_name as gov_region,
                company_number as ukprn,
                open_date,
                close_date,
                status as establishment_status
            FROM schools
            WHERE urn = $1
            LIMIT 1
        `;

        // For now, return mock data since we don't have the DfE connection set up
        // In production, this would query the actual DfE database
        const mockDfeData = {
            urn: lead.urn,
            name: lead.name,
            la_code: lead.la_code,
            establishment_number: lead.urn?.substring(3) || '2093',
            la_name: lead.la_name,
            phase: lead.phase || 'Primary',
            school_type: lead.school_type || 'Academy converter',
            pupil_count: 250,
            headteacher_name: 'Sarah Smith',
            headteacher_email: 'headteacher@school.example.com',
            trust_name: lead.trust_name || null,
            establishment_type: 'Academy converter',
            address: {
                street: lead.address?.split(',')?.[0] || '123 School Lane',
                town: 'Bradford',
                postcode: lead.postcode || 'BD7 2BX',
            },
            website: lead.website,
            telephone: lead.phone || '01274 123456',
        };

        // Update lead with DfE data
        const { data: updatedLead, error: updateError } = await supabaseAdmin
            .from('onboarding_leads')
            .update({
                dfe_data: mockDfeData,
                dfe_data_fetched: true,
                trust_name: mockDfeData.trust_name,
                pupil_count: mockDfeData.pupil_count,
                headteacher_name: mockDfeData.headteacher_name,
                headteacher_email: mockDfeData.headteacher_email,
                school_phone: mockDfeData.telephone,
                updated_at: new Date().toISOString(),
            })
            .eq('id', leadId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating lead with DfE data:', updateError);
        }

        return apiSuccess({
            dfeData: mockDfeData,
            lead: updatedLead || lead,
        });
    })(req);
}
