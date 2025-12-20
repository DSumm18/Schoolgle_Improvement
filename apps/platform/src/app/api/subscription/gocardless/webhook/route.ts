// GoCardless webhook handler
// Placeholder - implement when GoCardless is set up

import { NextRequest, NextResponse } from 'next/server';

const gocardlessEnabled = process.env.GOCARDLESS_ENABLED !== 'false';
const gocardlessWebhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    if (!gocardlessWebhookSecret || !gocardlessEnabled) {
      return NextResponse.json({ error: 'GoCardless not configured' }, { status: 503 });
    }

    // TODO: Implement GoCardless webhook handling
    // Events to handle:
    // - mandates.created
    // - payments.confirmed
    // - payments.failed
    // - subscriptions.cancelled

    const body = await req.text();
    const signature = req.headers.get('webhook-signature');

    // Verify signature
    // Process webhook events
    // Update subscription status accordingly

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[GoCardless Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

