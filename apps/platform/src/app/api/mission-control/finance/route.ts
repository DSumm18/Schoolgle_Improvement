import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isMCAuthError } from "@/lib/mission-control/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isMCAuthError(auth)) return auth;

  try {
    const supabase = createServiceRoleClient();

    // 1. Fetch Invoices with related Contract & Organization Data
    const { data: invoices, error: invoiceError } = await supabase
      .from("mc_invoices")
      .select(`
        id,
        invoice_number,
        status,
        issue_date,
        due_date,
        total_amount,
        organization_id,
        mc_contracts ( contract_type, active_modules )
      `)
      .order('issue_date', { ascending: false });

    if (invoiceError) throw invoiceError;

    // 2. Fetch Organizations just to get the names for the invoices
    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id, name");

    if (orgError) throw orgError;

    const orgMap = new Map();
    (orgs || []).forEach(o => orgMap.set(o.id, o.name));

    // Combine invoice data with org names
    const enrichedInvoices = (invoices || []).map(inv => ({
      ...inv,
      organization_name: orgMap.get(inv.organization_id) || "Unknown Organization",
    }));

    // 3. Compute High-Level Metrics
    let totalMRR = 0;
    let overdueCount = 0;
    let unpaidTotal = 0;

    enrichedInvoices.forEach(inv => {
      if (inv.status === "overdue") {
        overdueCount++;
        unpaidTotal += Number(inv.total_amount);
      } else if (inv.status === "sent") {
        unpaidTotal += Number(inv.total_amount);
      }
    });

    return NextResponse.json({
      metrics: {
        overdueCount,
        unpaidTotal
      },
      invoices: enrichedInvoices
    });

  } catch (error: unknown) {
    console.error("[MC Finance] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch finance data" },
      { status: 500 },
    );
  }
}
