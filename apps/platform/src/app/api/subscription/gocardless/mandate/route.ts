// Create GoCardless mandate for Direct Debit
// Placeholder - implement when GoCardless is set up

import { NextRequest, NextResponse } from 'next/server';

const gocardlessEnabled = process.env.GOCARDLESS_ENABLED !== 'false';
const gocardlessToken = process.env.GOCARDLESS_ACCESS_TOKEN;

export async function POST(req: NextRequest) {
  try {
    if (!gocardlessToken || !gocardlessEnabled) {
      return NextResponse.json({
        error: 'Direct Debit payments are not currently available. Please use card or invoice payment.',
        code: 'GOCARDLESS_NOT_CONFIGURED',
        availableMethods: ['card', 'invoice']
      }, { status: 503 });
    }

    // TODO: Implement GoCardless mandate creation
    // 1. Create redirect flow
    // 2. Get customer bank details
    // 3. Create mandate
    // 4. Store mandate_id in subscription

    return NextResponse.json({ 
      error: 'GoCardless integration not yet implemented',
      message: 'This feature will be available soon'
    }, { status: 501 });

  } catch (error: any) {
    console.error('[GoCardless Mandate] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

