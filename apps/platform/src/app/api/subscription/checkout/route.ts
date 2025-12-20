// Create Stripe checkout session for subscription

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeEnabled = process.env.STRIPE_ENABLED !== 'false'; // Default to enabled if key exists

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!stripeSecretKey || !stripeEnabled) {
      return NextResponse.json({ 
        error: 'Card payments are not currently available. Please use the invoice payment option.',
        code: 'STRIPE_NOT_CONFIGURED',
        availableMethods: ['invoice']
      }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { organizationId, planId, successUrl, cancelUrl } = await req.json();

    if (!organizationId || !planId) {
      return NextResponse.json({ error: 'organizationId and planId required' }, { status: 400 });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check for existing Stripe customer
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: {
          organizationId: organizationId,
        },
      });
      customerId = customer.id;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price_annual, // Annual price in pence
            recurring: {
              interval: 'year',
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?upgraded=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account/upgrade`,
      metadata: {
        organizationId,
        planId,
      },
      subscription_data: {
        metadata: {
          organizationId,
          planId,
        },
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });

  } catch (error: any) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

