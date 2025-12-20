// Check subscription status for an organization or user
// Used by browser extension and platform to verify access

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface ProductSubscription {
  product: string;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  plan: {
    id: string;
    name: string;
    features: Record<string, any>;
  };
  daysRemaining: number | null;
  trialEnds: string | null;
  periodEnds: string | null;
}

export interface SubscriptionStatus {
  hasAccess: boolean;
  // For backward compatibility - primary subscription
  status: 'none' | 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  plan: {
    id: string;
    name: string;
    product: string;
    features: Record<string, any>;
  } | null;
  daysRemaining: number | null;
  trialEnds: string | null;
  periodEnds: string | null;
  school: {
    id: string;
    name: string;
    urn: string | null;
  } | null;
  // All active subscriptions
  subscriptions: ProductSubscription[];
  // Quick access check by product
  activeProducts: string[];
}

export async function GET(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user ID from query or auth header
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');
    const product = searchParams.get('product'); // Optional: filter by specific product
    
    if (!userId && !organizationId) {
      return NextResponse.json({ error: 'userId or organizationId required' }, { status: 400 });
    }

    let orgId = organizationId;
    let schoolInfo = null;

    // If userId provided, get their organization
    if (userId && !orgId) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(id, name, urn)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (membership?.organization_id) {
        orgId = membership.organization_id;
        const org = membership.organizations as any;
        if (org) {
          schoolInfo = {
            id: org.id,
            name: org.name,
            urn: org.urn,
          };
        }
      }
    }

    // No organization found
    if (!orgId) {
      const response: SubscriptionStatus = {
        hasAccess: false,
        status: 'none',
        plan: null,
        daysRemaining: null,
        trialEnds: null,
        periodEnds: null,
        school: null,
        subscriptions: [],
        activeProducts: [],
      };
      return NextResponse.json(response);
    }

    // Get organization info if we don't have it
    if (!schoolInfo) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, urn')
        .eq('id', orgId)
        .single();
      
      if (org) {
        schoolInfo = { id: org.id, name: org.name, urn: org.urn };
      }
    }

    // Build query for subscriptions
    let query = supabase
      .from('subscriptions')
      .select(`
        id,
        product,
        status,
        trial_start,
        trial_end,
        current_period_start,
        current_period_end,
        plan_id,
        subscription_plans (
          id,
          name,
          product,
          features
        )
      `)
      .eq('organization_id', orgId)
      .in('status', ['trialing', 'active', 'past_due'])
      .order('created_at', { ascending: false });

    // Filter by product if specified
    if (product) {
      query = query.or(`product.eq.${product},product.eq.bundle`);
    }

    const { data: subscriptions } = await query;

    // No subscriptions
    if (!subscriptions || subscriptions.length === 0) {
      const response: SubscriptionStatus = {
        hasAccess: false,
        status: 'none',
        plan: null,
        daysRemaining: null,
        trialEnds: null,
        periodEnds: null,
        school: schoolInfo,
        subscriptions: [],
        activeProducts: [],
      };
      return NextResponse.json(response);
    }

    // Build list of all subscriptions
    const allSubscriptions: ProductSubscription[] = subscriptions.map((sub: any) => {
      const plan = sub.subscription_plans;
      const endDate = sub.status === 'trialing' ? sub.trial_end : sub.current_period_end;
      let daysRemaining = null;
      if (endDate) {
        const diff = new Date(endDate).getTime() - Date.now();
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
      return {
        product: sub.product,
        status: sub.status,
        plan: {
          id: plan.id,
          name: plan.name,
          features: plan.features || {},
        },
        daysRemaining,
        trialEnds: sub.trial_end,
        periodEnds: sub.current_period_end,
      };
    });

    // Get active products (expand bundle to individual products)
    const activeProducts: string[] = [];
    for (const sub of allSubscriptions) {
      if (sub.status === 'trialing' || sub.status === 'active') {
        if (sub.product === 'bundle') {
          activeProducts.push('ed_pro', 'ofsted_ready', 'parent_ed');
        } else if (!activeProducts.includes(sub.product)) {
          activeProducts.push(sub.product);
        }
      }
    }

    // Primary subscription (for backward compatibility)
    const primarySub = subscriptions[0];
    const primaryPlan = primarySub.subscription_plans as any;
    const primaryEndDate = primarySub.status === 'trialing' 
      ? primarySub.trial_end 
      : primarySub.current_period_end;
    
    let primaryDaysRemaining = null;
    if (primaryEndDate) {
      const diff = new Date(primaryEndDate).getTime() - Date.now();
      primaryDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // Check access (either by product filter or any active subscription)
    const hasAccess = product 
      ? activeProducts.includes(product)
      : activeProducts.length > 0;

    const response: SubscriptionStatus = {
      hasAccess,
      status: primarySub.status,
      plan: primaryPlan ? {
        id: primaryPlan.id,
        name: primaryPlan.name,
        product: primaryPlan.product,
        features: primaryPlan.features || {},
      } : null,
      daysRemaining: primaryDaysRemaining,
      trialEnds: primarySub.trial_end,
      periodEnds: primarySub.current_period_end,
      school: schoolInfo,
      subscriptions: allSubscriptions,
      activeProducts,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Subscription Check] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

