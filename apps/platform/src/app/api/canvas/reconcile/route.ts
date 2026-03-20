/**
 * POST /api/canvas/reconcile — Cross-System Data Reconciliation
 *
 * Accepts two datasets (already ingested and mapped), reconciles them,
 * and returns a conflict report with recommendations.
 *
 * POST /api/canvas/reconcile/approve — Log reconciliation decisions
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  reconcileDatasets,
  buildDataset,
  generateHealthAlerts,
} from "@/lib/canvas/reconciliation-engine";
import type {
  EntityType,
  BusinessArea,
  ReconciliationDecision,
} from "@/lib/canvas/types";

interface ReconcileRequest {
  sourceA: {
    name: string;
    entityType: EntityType;
    rows: Record<string, string | number | null | undefined>[];
    mappings: Array<{ sourceColumn: string; targetField: string }>;
    trustRanking?: number;
  };
  sourceB: {
    name: string;
    entityType: EntityType;
    rows: Record<string, string | number | null | undefined>[];
    mappings: Array<{ sourceColumn: string; targetField: string }>;
    trustRanking?: number;
  };
  businessArea: BusinessArea;
  sessionId?: string;
}

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = (await request.json()) as ReconcileRequest;

  if (!body.sourceA || !body.sourceB) {
    return apiError("Two data sources required for reconciliation", 400);
  }

  // Build canonical datasets from raw data + mappings
  const datasetA = buildDataset(
    body.sourceA.name,
    body.sourceA.entityType,
    body.sourceA.rows,
    body.sourceA.mappings,
    body.sourceA.trustRanking,
  );

  const datasetB = buildDataset(
    body.sourceB.name,
    body.sourceB.entityType,
    body.sourceB.rows,
    body.sourceB.mappings,
    body.sourceB.trustRanking,
  );

  // Load any custom trust rankings for this org
  const supabase = createServiceRoleClient();
  const { data: sources } = await supabase
    .from("data_sources")
    .select("system_name, trust_ranking")
    .eq("organization_id", auth.organizationId)
    .not("trust_ranking", "is", null);

  const customRankings: Record<string, number> = {};
  for (const s of sources || []) {
    if (s.trust_ranking) customRankings[s.system_name] = s.trust_ranking;
  }

  // Run reconciliation
  const result = reconcileDatasets(datasetA, datasetB, customRankings);

  // Generate health alerts for each dataset
  const alertsA = generateHealthAlerts(datasetA, body.businessArea);
  const alertsB = generateHealthAlerts(datasetB, body.businessArea);

  // Update session if provided
  if (body.sessionId) {
    await supabase
      .from("canvas_sessions")
      .update({
        stage: "RECONCILIATION",
        reconciliation_findings: {
          conflicts: result.conflicts.length,
          matched: result.matchedRecords,
          sourceA: result.sourceASummary,
          sourceB: result.sourceBSummary,
        },
      })
      .eq("id", body.sessionId)
      .eq("organization_id", auth.organizationId);
  }

  return apiSuccess({
    reconciliation: result,
    healthAlerts: [...alertsA, ...alertsB],
  });
});
