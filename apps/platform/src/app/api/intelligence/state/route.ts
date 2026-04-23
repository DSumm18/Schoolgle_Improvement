/**
 * Intelligence State API
 *
 * Returns the current state of data connections and parsed intelligence data.
 * This is the primary endpoint for the Intelligence module.
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

  // TODO: Fetch actual data sources from Supabase data_connections table
  // For now, return mock data structure

  const state = {
    organizationId,
    schoolName: "Your School", // TODO: Fetch from organizations table
    totalPupils: 0, // TODO: Count from census data
    lastRefreshed: new Date().toISOString(),
    dataSources: {
      census_school: {
        type: "census_school",
        status: "missing",
        unlocks: ["Pupil demographics", "SEN analysis", "Attendance trends"],
      },
      census_workforce: {
        type: "census_workforce",
        status: "missing",
        unlocks: ["Staff qualifications", "Absence analysis"],
      },
      assessment_eyfsp: {
        type: "assessment_eyfsp",
        status: "missing",
        unlocks: ["EYFSP trends", "GLD analysis", "Cohort tracking"],
      },
      assessment_phonics: {
        type: "assessment_phonics",
        status: "missing",
        unlocks: ["Phonics pass rates", "Year group comparison"],
      },
      assessment_ks1: {
        type: "assessment_ks1",
        status: "missing",
        unlocks: ["KS1 attainment", "Progress measures"],
      },
      assessment_ks2: {
        type: "assessment_ks2",
        status: "missing",
        unlocks: ["KS2 results", "Progress scores", "National comparison"],
      },
      demographics_csv: {
        type: "demographics_csv",
        status: "missing",
        unlocks: ["Class-level breakdowns", "Summer-born analysis"],
      },
      sen_report: {
        type: "sen_report",
        status: "missing",
        unlocks: ["Detailed SEN provision", "EHCP tracking"],
      },
    },
  };

  // TODO: Check data_connections table for actual connections
  const supabase = createClient();
  const { data: connections, error } = await supabase
    .from("data_connections")
    .select("*")
    .eq("organization_id", organizationIdParam)
    .eq("source_type", "intelligence");

  if (!error && connections) {
    // Update state based on actual connections
    for (const conn of connections) {
      const sourceType = conn.connection_metadata?.sourceType;
      if (sourceType && state.dataSources[sourceType]) {
        state.dataSources[sourceType] = {
          ...state.dataSources[sourceType],
          status: conn.status,
          fileName: conn.connection_metadata?.fileName,
          recordCount: conn.connection_metadata?.recordCount,
          lastModified: conn.last_synced,
        };
      }
    }
  }

  return NextResponse.json(state);
});
