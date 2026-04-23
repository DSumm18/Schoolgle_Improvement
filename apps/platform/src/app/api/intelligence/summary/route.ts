/**
 * Intelligence Summary API
 *
 * Returns the current state of all domain connectors (Pupil Data, Staff Data).
 * Shows which connectors are active and what data is available.
 *
 * GET /api/intelligence/summary
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

  // Get cloud storage connection
  const { data: cloudConnection } = await supabase
    .from("school_data_connections")
    .select("*")
    .eq("organization_id", organizationIdParam)
    .eq("is_active", true)
    .maybeSingle();

  // Get intelligence data sources
  const { data: sources } = await supabase
    .from("intelligence_data_sources")
    .select("*")
    .eq("organization_id", organizationIdParam);

  // Build Pupil Data Connector state
  const pupilSources = sources?.filter(s =>
    [
      "census_xml",
      "assessment_eyfsp",
      "assessment_phonics",
      "assessment_ks1",
      "assessment_ks2",
      "demographics_csv",
      "sen_report",
    ].includes(s.source_type)
  ) || [];

  const pupilConnector = {
    domain: "PUPIL_DATA" as const,
    connected: pupilSources.some(s => s.status === "connected"),
    provider: cloudConnection?.provider === "google" ? "google_drive" as const :
              cloudConnection?.provider === "onedrive" ? "onedrive" as const : undefined,
    folderName: cloudConnection?.folder_name,
    filesDetected: pupilSources.length,
    dataAvailable: {
      demographics: pupilSources.some(s => s.source_type === "census_xml" && s.status === "connected"),
      assessments: {
        eyfsp: pupilSources.some(s => s.source_type === "assessment_eyfsp" && s.status === "connected"),
        phonics: pupilSources.some(s => s.source_type === "assessment_phonics" && s.status === "connected"),
        ks1: pupilSources.some(s => s.source_type === "assessment_ks1" && s.status === "connected"),
        ks2: pupilSources.some(s => s.source_type === "assessment_ks2" && s.status === "connected"),
      },
      sen: pupilSources.some(s => s.source_type === "census_xml" && s.status === "connected") ||
            pupilSources.some(s => s.source_type === "sen_report" && s.status === "connected"),
      attendance: pupilSources.some(s => s.source_type === "census_xml" && s.status === "connected"),
    },
    sourceOfTruth: {
      demographics: pupilSources.find(s => s.source_type === "census_xml")?.file_name,
      assessments: {
        eyfsp: pupilSources.find(s => s.source_type === "assessment_eyfsp")?.file_name,
        phonics: pupilSources.find(s => s.source_type === "assessment_phonics")?.file_name,
        ks1: pupilSources.find(s => s.source_type === "assessment_ks1")?.file_name,
        ks2: pupilSources.find(s => s.source_type === "assessment_ks2")?.file_name,
      },
      sen: pupilSources.find(s => s.source_type === "sen_report")?.file_name ||
            pupilSources.find(s => s.source_type === "census_xml")?.file_name,
      attendance: pupilSources.find(s => s.source_type === "census_xml")?.file_name,
    },
  };

  // Build Staff Data Connector state (placeholder for now)
  const staffConnector = {
    domain: "STAFF_DATA" as const,
    connected: false, // TODO: Implement staff data detection
    filesDetected: 0,
    dataAvailable: {},
  };

  // Get total pupils from census data
  const totalPupils = pupilSources.find(s => s.source_type === "census_xml")?.record_count || 0;

  return NextResponse.json({
    connectors: [pupilConnector, staffConnector],
    schoolName: "Your School", // TODO: From organizations table
    totalPupils,
    lastRefreshed: new Date().toISOString(),
  });
});
