/**
 * Pupil Data API
 *
 * Returns aggregated pupil statistics from parsed census data.
 * This is what the Pupil Intelligence Dashboard consumes.
 *
 * GET /api/intelligence/pupils
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { userId, organizationId } = auth;

  if (!organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const searchParams = req.nextUrl.searchParams;
  const organizationIdParam = searchParams.get("organizationId");

  const supabase = createClient();

  // Get the most recent census data
  const { data: censusSource, error } = await supabase
    .from("intelligence_data_sources")
    .select("*")
    .eq("organization_id", organizationIdParam)
    .eq("source_type", "census_xml")
    .eq("status", "connected")
    .order("file_modified_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !censusSource) {
    return NextResponse.json(
      { error: "No census data found. Please scan your files first." },
      { status: 404 }
    );
  }

  // Extract data from the cached summary
  const summary = censusSource.data_summary || {};

  return NextResponse.json({
    totalPupils: summary.totalPupils || 0,
    censusDate: summary.censusDate,
    sen: {
      count: summary.senCount || 0,
      percentage: summary.senPercentage || 0,
    },
    fsm: {
      count: summary.fsmCount || 0,
      percentage: summary.fsmPercentage || 0,
    },
    eal: {
      count: summary.ealCount || 0,
      percentage: summary.ealPercentage || 0,
    },
    assessmentYears: [], // TODO: Extract from assessment sources
  });
});
