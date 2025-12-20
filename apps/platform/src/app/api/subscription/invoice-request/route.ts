// Request an invoice for subscription (bank transfer option)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { organizationId, userId, planId } = await req.json();

    if (!organizationId || !userId || !planId) {
      return NextResponse.json({ error: 'organizationId, userId, and planId required' }, { status: 400 });
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

    // Get user email for billing
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // Generate invoice number
    const { data: invoiceNum } = await supabase.rpc('generate_invoice_number');
    const invoiceNumber = invoiceNum || `INV-${Date.now()}`;

    // Calculate dates
    const issuedDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: organizationId,
        invoice_number: invoiceNumber,
        amount: plan.price_annual,
        currency: 'GBP',
        description: `${plan.name} - Annual Subscription`,
        status: 'sent',
        issued_date: issuedDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        billing_email: user?.email,
        billing_name: org.name,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('[Invoice Request] Error creating invoice:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Create pending subscription (will activate when payment received)
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        organization_id: organizationId,
        plan_id: planId,
        status: 'past_due', // Will become active when paid
        payment_method: 'invoice',
        created_by: userId,
      });

    if (subError) {
      console.error('[Invoice Request] Error creating subscription:', subError);
    }

    // Log the action
    await supabase
      .from('subscription_audit_log')
      .insert({
        organization_id: organizationId,
        action: 'invoice_requested',
        new_plan_id: planId,
        amount: plan.price_annual,
        notes: `Invoice ${invoiceNumber} created for ${plan.name}`,
        performed_by: userId,
        performed_by_type: 'user',
      });

    // TODO: Send invoice email

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.amount,
        paymentReference: invoice.payment_reference,
        dueDate: invoice.due_date,
      },
    });

  } catch (error: any) {
    console.error('[Invoice Request] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

