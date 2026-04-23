import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/onboarding/[id]/invoice
 * Generate an invoice from a quote
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return protectedRoute(async (auth, req: NextRequest) => {
        const { id: leadId } = await params;
        const body = await req.json();
        const { quoteId } = body;

        if (!quoteId) {
            return apiError('quoteId is required', 400);
        }

        // Get the lead
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('onboarding_leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            return apiError('Lead not found', 404);
        }

        // Get the quote
        const { data: quote, error: quoteError } = await supabaseAdmin
            .from('quotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (quoteError || !quote) {
            return apiError('Quote not found', 404);
        }

        // Generate invoice number
        const { data: invoiceNumberResult } = await supabaseAdmin
            .rpc('generate_invoice_number');

        const invoiceNumber = invoiceNumberResult;

        // Due date: 30 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Build line items
        const lineItems = [
            {
                description: `${quote.plan_type.charAt(0).toUpperCase() + quote.plan_type.slice(1)} Plan (${quote.billing_period})`,
                quantity: 1,
                unit_price: quote.subtotal - (quote.modules_total || 0),
                total: quote.subtotal - (quote.modules_total || 0),
            },
        ];

        if (quote.selected_modules && quote.selected_modules.length > 0) {
            quote.selected_modules.forEach((mod: string) => {
                lineItems.push({
                    description: `${mod.charAt(0).toUpperCase() + mod.slice(1)} Module`,
                    quantity: 1,
                    unit_price: 0, // Would calculate from module prices
                    total: 0,
                });
            });
        }

        // Create invoice record
        const { data: invoice, error: invoiceError } = await supabaseAdmin
            .from('invoices')
            .insert({
                onboarding_lead_id: leadId,
                invoice_number: invoiceNumber,
                invoice_date: new Date().toISOString().split('T')[0],
                due_date: dueDate.toISOString().split('T')[0],
                subtotal: quote.subtotal,
                discount_amount: quote.discount_amount,
                vat_amount: quote.vat_amount,
                total: quote.total,
                status: 'sent',
                billing_name: lead.billing_contact_name || lead.contact_name,
                billing_email: lead.billing_contact_email || lead.contact_email,
                billing_address: lead.billing_address || null,
                line_items,
                sent_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (invoiceError) {
            console.error('Error creating invoice:', invoiceError);
            return apiError('Failed to create invoice', 500);
        }

        // Update lead with invoice info
        await supabaseAdmin
            .from('onboarding_leads')
            .update({
                invoice_id: invoice.id,
                invoice_sent_at: new Date().toISOString(),
            })
            .eq('id', leadId);

        return apiSuccess({
            invoice,
            paymentLink: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`,
        });
    })(req);
}
