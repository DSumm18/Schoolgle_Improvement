/**
 * POST /api/canvas/migration — Generate MIS Migration Readiness Report
 *
 * Accepts two pre-analysed datasets (source and target MIS),
 * generates a comprehensive migration readiness report.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { generateMigrationReport } from "@/lib/canvas/migration-report";
import type { EntityType, FieldMapping } from "@/lib/canvas/types";

interface MigrationRequest {
  sourceSystem: {
    name: string;
    headers: string[];
    rows: Record<string, string | number | null | undefined>[];
    mappings: Array<{
      sourceColumn: string;
      targetEntity: string;
      targetField: string;
      confidence: number;
    }>;
  };
  targetSystem: {
    name: string;
    headers: string[];
    rows: Record<string, string | number | null | undefined>[];
    mappings: Array<{
      sourceColumn: string;
      targetEntity: string;
      targetField: string;
      confidence: number;
    }>;
  };
  entityType: EntityType;
}

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = (await request.json()) as MigrationRequest;

  if (!body.sourceSystem || !body.targetSystem) {
    return apiError("Both source and target system data required", 400);
  }

  if (!body.sourceSystem.rows?.length || !body.targetSystem.rows?.length) {
    return apiError("Both datasets must contain at least one row", 400);
  }

  // Convert mapping format
  const toFieldMappings = (
    mappings: MigrationRequest["sourceSystem"]["mappings"],
  ): FieldMapping[] =>
    mappings.map((m) => ({
      sourceColumn: m.sourceColumn,
      targetEntity: m.targetEntity as FieldMapping["targetEntity"],
      targetField: m.targetField,
      confidence: m.confidence,
      detectionMethod: "user_confirmed" as const,
    }));

  const report = generateMigrationReport({
    sourceSystem: {
      name: body.sourceSystem.name,
      headers: body.sourceSystem.headers,
      rows: body.sourceSystem.rows,
      mappings: toFieldMappings(body.sourceSystem.mappings),
    },
    targetSystem: {
      name: body.targetSystem.name,
      headers: body.targetSystem.headers,
      rows: body.targetSystem.rows,
      mappings: toFieldMappings(body.targetSystem.mappings),
    },
    entityType: body.entityType,
  });

  return apiSuccess({ report });
});
