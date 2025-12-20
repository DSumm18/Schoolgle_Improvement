// Start a free trial for an organization

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TRIAL_DAYS = 7;

// Product types available for trial
const TRIALABLE_PRODUCTS = ['ed_pro', 'ofsted_ready', 'parent_ed'];

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { organizationId, userId, planId, product } = await req.json();

    if (!organizationId || !userId) {
      return NextResponse.json({ error: 'organizationId and userId required' }, { status: 400 });
    }

    // Default to ed_pro if no product specified
    const targetProduct = product || 'ed_pro';
    
    if (!TRIALABLE_PRODUCTS.includes(targetProduct)) {
      return NextResponse.json({ error: 'Invalid product for trial' }, { status: 400 });
    }

    // Check if organization already has a subscription FOR THIS PRODUCT
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status, product')
      .eq('organization_id', organizationId)
      .eq('product', targetProduct)
      .limit(1)
      .maybeSingle();

    if (existingSubscription) {
      // If they have an active/trialing subscription for this product, don't create another
      if (['active', 'trialing'].includes(existingSubscription.status)) {
        return NextResponse.json({ 
          error: `Organization already has an active ${targetProduct} subscription`,
          subscriptionId: existingSubscription.id 
        }, { status: 409 });
      }
      
      // If trial expired for this product, they need to pay
      if (existingSubscription.status === 'expired') {
        return NextResponse.json({ 
          error: `Trial for ${targetProduct} has already been used. Please subscribe to continue.`,
          requiresPayment: true,
          product: targetProduct
        }, { status: 402 });
      }
    }

    // Get organization to determine default plan based on pupil count
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, urn, settings')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Determine plan based on product and school size
    let selectedPlanId = planId;
    
    if (!selectedPlanId) {
      // Auto-select plan based on product and school size
      const pupilCount = org.settings?.pupil_count || 300;
      
      if (targetProduct === 'ed_pro') {
        if (pupilCount < 200) selectedPlanId = 'ed_pro_small';
        else if (pupilCount <= 500) selectedPlanId = 'ed_pro_medium';
        else selectedPlanId = 'ed_pro_large';
      } else if (targetProduct === 'ofsted_ready') {
        selectedPlanId = 'ofsted_ready_standard';
      } else if (targetProduct === 'parent_ed') {
        selectedPlanId = 'parent_ed_basic';
      }
    }

    // Calculate trial dates
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    // Create subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        organization_id: organizationId,
        plan_id: selectedPlanId,
        product: targetProduct,
        status: 'trialing',
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
        created_by: userId,
      })
      .select()
      .single();

    if (subError) {
      console.error('[Trial Start] Error creating subscription:', subError);
      return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('subscription_audit_log')
      .insert({
        subscription_id: subscription.id,
        organization_id: organizationId,
        action: 'created',
        new_status: 'trialing',
        new_plan_id: selectedPlanId,
        notes: `${TRIAL_DAYS}-day trial started`,
        performed_by: userId,
        performed_by_type: 'user',
      });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        product: targetProduct,
        planId: selectedPlanId,
        trialStart: trialStart.toISOString(),
        trialEnd: trialEnd.toISOString(),
        daysRemaining: TRIAL_DAYS,
      },
    });

  } catch (error: any) {
    console.error('[Trial Start] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

