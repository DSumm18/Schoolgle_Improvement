// Stripe webhook handler for subscription events

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify webhook signature
    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // In development without webhook secret, parse directly
      event = JSON.parse(body);
    }

    console.log('[Stripe Webhook] Event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { organizationId, planId } = session.metadata || {};

        if (organizationId && planId) {
          // Create or update subscription
          const periodStart = new Date();
          const periodEnd = new Date();
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);

          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              organization_id: organizationId,
              plan_id: planId,
              status: 'active',
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
              stripe_subscription_id: session.subscription as string,
              stripe_customer_id: session.customer as string,
              payment_method: 'card',
              auto_renew: true,
            }, {
              onConflict: 'organization_id',
            });

          if (error) {
            console.error('[Stripe Webhook] Error updating subscription:', error);
          }

          // Log the action
          await supabase
            .from('subscription_audit_log')
            .insert({
              organization_id: organizationId,
              action: 'payment_received',
              new_status: 'active',
              new_plan_id: planId,
              notes: 'Stripe checkout completed',
              performed_by_type: 'stripe_webhook',
            });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Get subscription metadata
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const { organizationId } = subscription.metadata || {};

          if (organizationId) {
            await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('organization_id', organizationId);

            await supabase
              .from('subscription_audit_log')
              .insert({
                organization_id: organizationId,
                action: 'renewed',
                new_status: 'active',
                amount: invoice.amount_paid,
                notes: `Stripe invoice ${invoice.number} paid`,
                performed_by_type: 'stripe_webhook',
              });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const { organizationId } = subscription.metadata || {};

          if (organizationId) {
            await supabase
              .from('subscriptions')
              .update({ status: 'past_due' })
              .eq('organization_id', organizationId);

            await supabase
              .from('subscription_audit_log')
              .insert({
                organization_id: organizationId,
                action: 'payment_failed',
                new_status: 'past_due',
                notes: `Stripe invoice ${invoice.number} payment failed`,
                performed_by_type: 'stripe_webhook',
              });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const { organizationId } = subscription.metadata || {};

        if (organizationId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            })
            .eq('organization_id', organizationId);

          await supabase
            .from('subscription_audit_log')
            .insert({
              organization_id: organizationId,
              action: 'cancelled',
              new_status: 'cancelled',
              notes: 'Subscription cancelled via Stripe',
              performed_by_type: 'stripe_webhook',
            });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

