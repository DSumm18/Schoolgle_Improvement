import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/onboarding/details/complete?token=xxx
 * Save completed onboarding form data (separate from create-school)
 */
export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const body = await req.json();

    // Verify the lead exists
    const { data: lead, error: leadError } = await supabaseAdmin
        .from('onboarding_leads')
        .select('*')
        .eq('completion_token', token)
        .single();

    if (leadError || !lead) {
        return Response.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    // Update lead with completed data
    const { data: updatedLead, error: updateError } = await supabaseAdmin
        .from('onboarding_leads')
        .update({
            // School details
            name: body.name || lead.name,
            urn: body.urn || lead.urn,
            la_name: body.la_name || lead.la_name,
            phase: body.phase || lead.phase,
            school_type: body.school_type || lead.school_type,
            address: body.address || lead.address,
            postcode: body.postcode || lead.postcode,
            website: body.website || lead.website,
            phone: body.phone || lead.phone,

            // Contacts
            contact_name: body.contact_name || lead.contact_name,
            contact_email: body.contact_email || lead.contact_email,
            contact_phone: body.contact_phone || lead.contact_phone,
            contact_role: body.contact_role || lead.contact_role,

            // Headteacher
            headteacher_name: body.headteacher_name || lead.headteacher_name,
            headteacher_email: body.headteacher_email || lead.headteacher_email,

            // Billing
            billing_contact_name: body.billing_contact_name || lead.billing_contact_name,
            billing_contact_email: body.billing_contact_email || lead.billing_contact_email,
            billing_contact_phone: body.billing_contact_phone || lead.billing_contact_phone,
            billing_address: body.billing_address || lead.billing_address,
            finance_email: body.finance_email || lead.finance_email,

            // Contract
            approver_name: body.approver_name || lead.approver_name,
            approver_role: body.approver_role || lead.approver_role,
            approver_email: body.approver_email || lead.approver_email,
            company_number: body.company_number || lead.company_number,

            // Data protection
            dpo_name: body.dpo_name || lead.dpo_name,
            dpo_email: body.dpo_email || lead.dpo_email,

            // Payment
            payment_method: body.payment_method || lead.payment_method,

            // Mark as completed
            details_completed_at: new Date().toISOString(),
            status: 'contacted', // Move to contacted status
            updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating lead:', updateError);
        return Response.json({ error: 'Failed to save details' }, { status: 500 });
    }

    return Response.json({
        success: true,
        lead: updatedLead,
    });
}
