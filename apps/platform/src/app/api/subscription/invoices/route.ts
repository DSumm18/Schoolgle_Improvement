// Get invoices for an organization

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Invoices] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // Transform to camelCase
    const response = (invoices || []).map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      amount: inv.amount,
      currency: inv.currency,
      description: inv.description,
      status: inv.status,
      issuedDate: inv.issued_date,
      dueDate: inv.due_date,
      paidDate: inv.paid_date,
      paymentReference: inv.payment_reference,
      pdfUrl: inv.pdf_url,
      billingEmail: inv.billing_email,
      createdAt: inv.created_at,
    }));

    return NextResponse.json({ invoices: response });

  } catch (error: any) {
    console.error('[Invoices] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

