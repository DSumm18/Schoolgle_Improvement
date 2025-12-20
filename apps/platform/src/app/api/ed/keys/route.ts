// Get API keys for Ed widget (only if user has active subscription)
// These keys are used by the browser extension to initialize the widget

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!membership?.organization_id) {
      return NextResponse.json({ error: 'User not in an organization' }, { status: 403 });
    }

    // Check subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, product, current_period_end, trial_end')
      .eq('organization_id', membership.organization_id)
      .in('status', ['trialing', 'active'])
      .eq('product', 'ed_pro')
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
    }

    // Return API keys (from environment - these are shared keys for all users)
    // In production, you might want to use per-user keys or rate-limited keys
    return NextResponse.json({
      geminiApiKey: process.env.GEMINI_API_KEY || undefined,
      fishAudioApiKey: process.env.FISH_AUDIO_API_KEY || undefined,
    });

  } catch (error: any) {
    console.error('[Ed Keys] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

