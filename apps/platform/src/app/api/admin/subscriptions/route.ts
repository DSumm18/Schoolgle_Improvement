import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get all subscriptions with organization and health data
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const plan = searchParams.get('plan');
        const health = searchParams.get('health');

        let query = supabase
            .from('subscriptions')
            .select(`
                *,
                organization:organizations (
                    id,
                    name,
                    type
                ),
                health:customer_health (
                    health_score,
                    health_status,
                    days_since_last_login,
                    ai_spend_last_30_days
                )
            `)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (plan && plan !== 'all') {
            query = query.eq('plan', plan);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter by health if needed
        let filteredData = data;
        if (health && health !== 'all') {
            filteredData = data?.filter(sub => 
                sub.health?.[0]?.health_status === health
            );
        }

        // Calculate summary stats
        const summary = {
            total: filteredData?.length || 0,
            active: filteredData?.filter(s => s.status === 'active').length || 0,
            pastDue: filteredData?.filter(s => s.status === 'past_due').length || 0,
            cancelled: filteredData?.filter(s => s.status === 'cancelled').length || 0,
            mrr: Math.round((filteredData?.filter(s => s.status === 'active')
                .reduce((sum, s) => sum + (s.final_price_annual / 12), 0) || 0)),
            arr: filteredData?.filter(s => s.status === 'active')
                .reduce((sum, s) => sum + s.final_price_annual, 0) || 0,
            atRisk: filteredData?.filter(s => 
                s.health?.[0]?.health_status === 'at_risk' || 
                s.health?.[0]?.health_status === 'critical'
            ).length || 0
        };

        return NextResponse.json({ data: filteredData, summary });
    } catch (error: any) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Create new subscription (from signup)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            organizationId,
            plan,
            paymentMethod,
            basePriceAnnual,
            discountPercent = 0,
            schoolCount = 1,
            contractSignedBy,
            stripeCustomerId,
            stripeSubscriptionId
        } = body;

        const finalPrice = Math.round(basePriceAnnual * schoolCount * (1 - discountPercent / 100));

        // Calculate period end (1 year from now)
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);

        const { data, error } = await supabase
            .from('subscriptions')
            .insert({
                organization_id: organizationId,
                plan,
                status: 'active',
                payment_method: paymentMethod,
                base_price_annual: basePriceAnnual,
                discount_percent: discountPercent,
                final_price_annual: finalPrice,
                school_count: schoolCount,
                current_period_end: periodEnd.toISOString(),
                contract_signed_at: new Date().toISOString(),
                contract_signed_by: contractSignedBy,
                stripe_customer_id: stripeCustomerId,
                stripe_subscription_id: stripeSubscriptionId
            })
            .select()
            .single();

        if (error) throw error;

        // Log to history
        await supabase.from('subscription_history').insert({
            subscription_id: data.id,
            change_type: 'created',
            new_plan: plan,
            new_price: finalPrice
        });

        // Create invoice if payment method is invoice
        if (paymentMethod === 'invoice') {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            const { data: invoice } = await supabase.rpc('generate_invoice_number');
            
            await supabase.from('invoices').insert({
                subscription_id: data.id,
                organization_id: organizationId,
                invoice_number: invoice || `INV-${Date.now()}`,
                status: 'sent',
                subtotal: finalPrice,
                tax: 0, // No VAT for education
                total: finalPrice,
                amount_due: finalPrice,
                description: `Schoolgle ${plan} - Annual Subscription`,
                invoice_date: new Date().toISOString().split('T')[0],
                due_date: dueDate.toISOString().split('T')[0],
                sent_at: new Date().toISOString()
            });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Error creating subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update subscription (upgrade, downgrade, cancel)
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscriptionId, action, newPlan, reason } = body;

        const { data: currentSub, error: fetchError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('id', subscriptionId)
            .single();

        if (fetchError) throw fetchError;

        let updateData: any = { updated_at: new Date().toISOString() };
        let historyEntry: any = { subscription_id: subscriptionId };

        switch (action) {
            case 'cancel':
                updateData.cancel_at_period_end = true;
                updateData.cancelled_at = new Date().toISOString();
                historyEntry.change_type = 'cancelled';
                historyEntry.reason = reason;
                break;

            case 'reactivate':
                updateData.cancel_at_period_end = false;
                updateData.cancelled_at = null;
                historyEntry.change_type = 'reactivated';
                break;

            case 'upgrade':
            case 'downgrade':
                const prices = { core: 1499, professional: 2499, enterprise: 3999 };
                const newPrice = prices[newPlan as keyof typeof prices] * currentSub.school_count;
                
                updateData.plan = newPlan;
                updateData.base_price_annual = prices[newPlan as keyof typeof prices];
                updateData.final_price_annual = newPrice;
                
                historyEntry.change_type = action === 'upgrade' ? 'upgraded' : 'downgraded';
                historyEntry.previous_plan = currentSub.plan;
                historyEntry.new_plan = newPlan;
                historyEntry.previous_price = currentSub.final_price_annual;
                historyEntry.new_price = newPrice;
                break;

            case 'mark_past_due':
                updateData.status = 'past_due';
                historyEntry.change_type = 'payment_failed';
                break;

            case 'mark_active':
                updateData.status = 'active';
                historyEntry.change_type = 'payment_received';
                break;
        }

        const { data, error } = await supabase
            .from('subscriptions')
            .update(updateData)
            .eq('id', subscriptionId)
            .select()
            .single();

        if (error) throw error;

        // Log to history
        await supabase.from('subscription_history').insert(historyEntry);

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

