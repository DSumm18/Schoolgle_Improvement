/**
 * GET /api/canvas/connectors — List all connected data sources for Canvas
 *
 * Combines:
 * 1. Google Drive folders (from school_data_connections)
 * 2. Schoolgle internal tables (always available)
 * 3. DfE national data (always available)
 *
 * Each connector shows what data it provides, when it was last updated,
 * and what Canvas can do with it.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const DFE_SUGGESTIONS: Record<
  string,
  { dfeTable: string; label: string; overlay: string }[]
> = {
  staff: [
    {
      dfeTable: "workforce",
      label: "DfE Workforce Census",
      overlay: "National teacher FTE, QTS rates, pay averages",
    },
  ],
  attendance: [
    {
      dfeTable: "attendance",
      label: "DfE National Attendance",
      overlay: "National absence rates, PA benchmarks by school type",
    },
  ],
  pupils: [
    {
      dfeTable: "census",
      label: "DfE School Census",
      overlay: "National FSM, SEN, EAL demographics",
    },
  ],
  assessments: [
    {
      dfeTable: "ks2_results",
      label: "DfE KS2 Results",
      overlay: "National reading/maths/writing attainment",
    },
  ],
  fms: [
    {
      dfeTable: "workforce",
      label: "DfE Workforce (costs)",
      overlay: "National staff cost benchmarks",
    },
  ],
  behaviour: [
    {
      dfeTable: "exclusions",
      label: "DfE Exclusions Data",
      overlay: "National exclusion rates by school type",
    },
  ],
};

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  // 1. Get Google Drive connection
  const { data: driveConn } = await supabase
    .from("school_data_connections")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .single();

  const driveConnectors: Array<Record<string, unknown>> = [];

  if (driveConn?.detected_folders) {
    const folders = driveConn.detected_folders as Record<
      string,
      {
        files: number;
        category: string;
        folderId: string;
      }
    >;

    for (const [folderName, info] of Object.entries(folders)) {
      if (folderName === "root" || info.category === "unknown") continue;

      const suggestions = DFE_SUGGESTIONS[info.category] || [];

      driveConnectors.push({
        id: info.folderId,
        type: "google_drive",
        name: folderName,
        category: info.category,
        fileCount: info.files,
        folderId: info.folderId,
        status: "active",
        lastScanAt: driveConn.last_scan_at,
        provider: "Google Drive",
        icon: "cloud",
        canIngest: true,
        dfeSuggestions: suggestions,
        description: `${info.files} file${info.files !== 1 ? "s" : ""} in Google Drive`,
      });
    }
  }

  // 2. Schoolgle internal data sources (always available)
  const internalSources = [
    {
      id: "internal_staff",
      name: "Staff Directory",
      category: "staff",
      table: "staff_directory",
      icon: "users",
    },
    {
      id: "internal_attendance",
      name: "Attendance Registers",
      category: "attendance",
      table: "attendance_registers",
      icon: "calendar",
    },
    {
      id: "internal_finance",
      name: "Finance Transactions",
      category: "fms",
      table: "finance_transactions",
      icon: "pound",
    },
    {
      id: "internal_send",
      name: "SEND Register",
      category: "send",
      table: "send_register",
      icon: "target",
    },
    {
      id: "internal_risk",
      name: "Risk Register",
      category: "risk",
      table: "risk_register",
      icon: "alert",
    },
    {
      id: "internal_safeguarding",
      name: "Safeguarding",
      category: "safeguarding",
      table: "safeguarding_concerns",
      icon: "shield",
    },
    {
      id: "internal_estates",
      name: "Estates & Premises",
      category: "estates",
      table: "estates_helpdesk_tickets",
      icon: "building",
    },
  ];

  // Check which internal sources have data
  const internalConnectors = [];
  for (const src of internalSources) {
    const { count } = await supabase
      .from(src.table)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);

    const suggestions = DFE_SUGGESTIONS[src.category] || [];

    internalConnectors.push({
      ...src,
      type: "schoolgle",
      status: (count || 0) > 0 ? "active" : "empty",
      recordCount: count || 0,
      provider: "Schoolgle",
      canIngest: false,
      dfeSuggestions: suggestions,
      description: (count || 0) > 0 ? `${count} records` : "No data yet",
    });
  }

  // 3. DfE national data (always available)
  const dfeConnectors = [
    {
      id: "dfe_attendance",
      name: "DfE Attendance Statistics",
      category: "attendance",
      table: "attendance",
      recordCount: 184000,
      description: "184K national attendance records",
    },
    {
      id: "dfe_census",
      name: "DfE School Census",
      category: "pupils",
      table: "census",
      recordCount: 146000,
      description: "146K demographic records",
    },
    {
      id: "dfe_ks2",
      name: "DfE KS2 Results",
      category: "assessments",
      table: "ks2_results",
      recordCount: 1000000,
      description: "1M+ attainment records",
    },
    {
      id: "dfe_workforce",
      name: "DfE Workforce Census",
      category: "staff",
      table: "workforce",
      recordCount: 164000,
      description: "164K staffing records",
    },
    {
      id: "dfe_exclusions",
      name: "DfE Exclusions",
      category: "behaviour",
      table: "exclusions",
      recordCount: 1100000,
      description: "1.1M exclusion records",
    },
  ].map((d) => ({
    ...d,
    type: "dfe",
    status: "active",
    provider: "Department for Education",
    icon: "government",
    canIngest: false,
  }));

  return apiSuccess({
    drive: {
      connected: !!driveConn,
      folderName: driveConn?.folder_name,
      totalFiles: driveConn?.total_files || 0,
      totalFolders: driveConn?.total_folders || 0,
      lastScanAt: driveConn?.last_scan_at,
      connectors: driveConnectors,
    },
    internal: internalConnectors,
    dfe: dfeConnectors,
    summary: {
      totalSources:
        driveConnectors.length +
        internalConnectors.length +
        dfeConnectors.length,
      driveFiles: driveConn?.total_files || 0,
      activeSources: [
        ...driveConnectors.filter((c) => c.status === "active"),
        ...internalConnectors.filter((c) => c.status === "active"),
        ...dfeConnectors,
      ].length,
    },
  });
});
