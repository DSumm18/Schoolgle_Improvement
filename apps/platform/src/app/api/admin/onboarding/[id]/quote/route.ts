import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pricing configuration
const PLAN_PRICES: Record<string, { annual: number; monthly: number }> = {
    core: { annual: 149900, monthly: 14990 }, // £1,499/yr or £149.90/mo
    professional: { annual: 249900, monthly: 24990 }, // £2,499/yr or £249.90/mo
    enterprise: { annual: 399900, monthly: 39990 }, // £3,999/yr or £399.90/mo
};

const MODULE_PRICES: Record<string, number> = {
    'ofsted-readiness': 50000,
    'estates-compliance': 40000,
    'hr-people': 30000,
    'governance': 25000,
    'actions-hub': 20000,
    'school-intelligence': 35000,
    'ed-ai': 40000,
    'communications': 20000,
    'calendar': 10000,
    'safeguarding': 30000,
    'attendance': 25000,
    'behaviour': 25000,
    'surveys': 15000,
    'admissions': 20000,
    'school-meals': 15000,
    'cover': 20000,
    'canvas': 30000,
};

/**
 * POST /api/admin/onboarding/[id]/quote
 * Generate a quote for an onboarding lead
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return protectedRoute(async (auth, req: NextRequest) => {
        const { id: leadId } = await params;
        const body = await req.json();
        const { planType = 'core', billingPeriod = 'annual', selectedModules = [], discountCode = '', userLimit = 3 } = body;

        // Get the lead
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('onboarding_leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            return apiError('Lead not found', 404);
        }

        // Calculate base price
        const basePrice = PLAN_PRICES[planType]?.[billingPeriod] || PLAN_PRICES.core.annual;

        // Add module prices
        let modulesTotal = 0;
        const validModules = selectedModules.filter((m: string) => MODULE_PRICES[m]);
        validModules.forEach((m: string) => {
            modulesTotal += MODULE_PRICES[m];
        });

        const subtotal = basePrice + modulesTotal;

        // Check for discount
        let discountAmount = 0;
        let discountPercent = 0;

        if (discountCode) {
            const { data: discount } = await supabaseAdmin
                .from('discount_codes')
                .select('*')
                .eq('code', discountCode.toUpperCase())
                .eq('active', true)
                .single();

            if (discount) {
                const now = new Date();
                const validFrom = new Date(discount.valid_from);
                const validUntil = new Date(discount.valid_until);

                if (now >= validFrom && now <= validUntil) {
                    if (discount.discount_type === 'percentage') {
                        discountPercent = discount.discount_value;
                        discountAmount = Math.round(subtotal * (discountPercent / 100));
                    } else {
                        discountAmount = discount.discount_value * 100; // Convert to pence
                    }
                }
            }
        }

        const total = subtotal - discountAmount;

        // Valid for 30 days
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);

        // Generate quote number
        const { data: quoteNumberResult } = await supabaseAdmin
            .rpc('generate_quote_number');

        const quoteNumber = quoteNumberResult;

        // Create quote record
        const { data: quote, error: quoteError } = await supabaseAdmin
            .from('quotes')
            .insert({
                onboarding_lead_id: leadId,
                quote_number: quoteNumber,
                valid_until: validUntil.toISOString().split('T')[0],
                subtotal,
                discount_amount: discountAmount,
                discount_code: discountCode || null,
                vat_amount: 0, // No VAT for education
                total,
                plan_type: planType,
                billing_period: billingPeriod,
                selected_modules: validModules,
                user_limit: userLimit,
                school_name: lead.name,
                school_urn: lead.urn,
                contact_name: lead.contact_name,
                contact_email: lead.contact_email,
                status: 'sent',
            })
            .select()
            .single();

        if (quoteError) {
            console.error('Error creating quote:', quoteError);
            return apiError('Failed to create quote', 500);
        }

        // Update lead with quote info
        await supabaseAdmin
            .from('onboarding_leads')
            .update({
                quote_amount: total / 100,
                discount_code: discountCode || null,
                discount_amount: discountAmount / 100,
                final_amount: total / 100,
                plan_selected: planType,
                billing_period: billingPeriod,
                quote_generated_at: new Date().toISOString(),
                status: 'quote_sent',
            })
            .eq('id', leadId);

        return apiSuccess({
            quote,
            breakdown: {
                planPrice: basePrice,
                modulesPrice: modulesTotal,
                discount: discountAmount / 100,
                total: total / 100,
            },
        });
    })(req);
}
