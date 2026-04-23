/**
 * Debug Organizations API
 *
 * Helps debug the school selector dropdown issue.
 * Shows all organizations and which one is currently active.
 *
 * GET /api/debug/organizations
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { protectedRoute } from "@/lib/api-utils";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { userId, organizationId: currentOrgId } = auth;

  const supabase = createClient();

  // Get all organizations
  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, slug, type, created_at")
    .order("created_at", { ascending: false });

  // Get organizations this user is a member of
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, role, is_primary")
    .eq("user_id", userId);

  // Get onboarding leads (to see Grove House)
  const { data: onboardingLeads } = await supabase
    .from("onboarding_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // Get intelligence data sources for each org
  const { data: intelSources } = await supabase
    .from("intelligence_data_sources")
    .select("organization_id, source_type, file_name, status, record_count")
    .order("file_modified_time", { ascending: false });

  // Get Google Drive connections
  const { data: driveConnections } = await supabase
    .from("school_data_connections")
    .select("*")
    .order("connected_at", { ascending: false });

  return NextResponse.json({
    currentUser: {
      userId,
      currentOrganizationId: currentOrgId,
    },
    organizations: organizations || [],
    memberships: memberships || [],
    onboardingLeads: onboardingLeads || [],
    intelligenceSources: intelSources || [],
    driveConnections: driveConnections || [],
    debug: {
      orgCount: organizations?.length || 0,
      membershipCount: memberships?.length || 0,
      hasIntelData: (intelSources?.length || 0) > 0,
      hasDriveConnection: (driveConnections?.length || 0) > 0,
    }
  });
});
