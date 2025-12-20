// Get available subscription plans

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  product: 'ed_pro' | 'ofsted_ready' | 'bundle';
  priceMonthly: number;
  priceAnnual: number;
  minPupils: number | null;
  maxPupils: number | null;
  features: Record<string, any>;
}

export async function GET(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(req.url);
    const product = searchParams.get('product'); // Filter by product type
    const pupilCount = searchParams.get('pupilCount'); // Filter by school size

    let query = supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (product) {
      query = query.eq('product', product);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('[Plans] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    // Filter by pupil count if provided
    let filteredPlans = plans || [];
    if (pupilCount) {
      const count = parseInt(pupilCount);
      filteredPlans = filteredPlans.filter(plan => {
        if (plan.min_pupils === null && plan.max_pupils === null) return true;
        const minOk = plan.min_pupils === null || count >= plan.min_pupils;
        const maxOk = plan.max_pupils === null || count <= plan.max_pupils;
        return minOk && maxOk;
      });
    }

    // Transform to camelCase
    const response: SubscriptionPlan[] = filteredPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      product: plan.product,
      priceMonthly: plan.price_monthly,
      priceAnnual: plan.price_annual,
      minPupils: plan.min_pupils,
      maxPupils: plan.max_pupils,
      features: plan.features || {},
    }));

    return NextResponse.json({ plans: response });

  } catch (error: any) {
    console.error('[Plans] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

