import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isMCAuthError } from "@/lib/mission-control/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  // 1. Enforce Mission Control Super Admin rights
  const auth = await requireAdmin(request);
  if (isMCAuthError(auth)) return auth;

  try {
    const supabase = createServiceRoleClient();

    // 2. Fetch Organizations (Trusts and Schools)
    // We fetch parent_organization_id to reconstruct the MAT tree on the frontend.
    // Note: In 20260110120000_navigator_mvp.sql, the schema uses organization_type, not org_type
    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, organization_type, parent_organization_id, created_at");

    if (orgError) throw orgError;

    // 3. Fetch Contract statuses
    const { data: contracts, error: contractError } = await supabase
      .from("mc_contracts")
      .select("organization_id, contract_type, contract_status, active_modules, annual_value, end_date");

    if (contractError) throw contractError;

    // 4. Fetch Support Tickets / Open Communications
    const { data: comms, error: commsError } = await supabase
      .from("mc_communications")
      .select("organization_id, status")
      .in("status", ["open", "in_progress", "waiting"]);

    if (commsError) throw commsError;

    // 5. Build the CRM Tree Data Structure
    // Map contracts to orgs
    const contractMap = new Map();
    (contracts || []).forEach(c => {
      contractMap.set(c.organization_id, c);
    });

    // Map open support tickets to orgs
    const ticketCountMap = new Map();
    (comms || []).forEach(c => {
      const current = ticketCountMap.get(c.organization_id) || 0;
      ticketCountMap.set(c.organization_id, current + 1);
    });

    // Merge data
    const enrichedOrgs = (orgs || []).map(org => {
      const contract = contractMap.get(org.id);
      return {
        id: org.id,
        name: org.name,
        org_type: org.organization_type, // Normalize column name for the frontend
        parent_organization_id: org.parent_organization_id,
        created_at: org.created_at,
        contract: contract || null,
        open_tickets: ticketCountMap.get(org.id) || 0,
      };
    });

    // We send the flat array down; the UI will handle building the hierarchy (MATs -> Schools)
    return NextResponse.json({ clients: enrichedOrgs });

  } catch (error: unknown) {
    console.error("[MC CRM] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CRM clients" },
      { status: 500 },
    );
  }
}
