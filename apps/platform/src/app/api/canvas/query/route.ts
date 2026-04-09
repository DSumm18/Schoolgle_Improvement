/**
 * POST /api/canvas/query — Dynamic query API for the Canvas report builder.
 * GET /api/canvas/query — Returns the field registry metadata.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  DATA_SOURCES,
  getDataSource,
  validateFields,
} from "@/lib/canvas/field-registry";

export const GET = protectedRoute(async () => {
  return apiSuccess({
    sources: DATA_SOURCES.map((s) => ({
      id: s.id,
      table: s.table,
      label: s.label,
      icon: s.icon,
      color: s.color,
      category: s.category,
      defaultChartType: s.defaultChartType,
      fields: s.fields,
    })),
  });
});

interface QueryRequest {
  source: string;
  dimensions: string[];
  metrics: Array<{ field: string; aggregation: string; alias?: string }>;
  filters?: Array<{
    field: string;
    operator: string;
    value: string | string[] | number | boolean;
  }>;
  dateBin?: string;
  limit?: number;
}

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = (await request.json()) as QueryRequest;
  const { source, dimensions, metrics, filters, dateBin, limit } = body;

  const sourceDef = getDataSource(source);
  if (!sourceDef) return apiError(`Unknown source: ${source}`, 400);

  const allFields = [
    ...dimensions,
    ...metrics.map((m) => m.field),
    ...(filters || []).map((f) => f.field),
  ];
  if (!validateFields(source, allFields))
    return apiError("Invalid field names for this source", 400);

  if (dimensions.length === 0)
    return apiError("At least one dimension is required", 400);

  const supabase = createServiceRoleClient();
  const selectFields = new Set<string>();
  for (const d of dimensions) selectFields.add(d);
  for (const m of metrics) selectFields.add(m.field);

  let query = supabase
    .from(sourceDef.table)
    .select([...selectFields].join(", "));

  if (sourceDef.orgScoped) {
    query = query.eq("organization_id", auth.organizationId);
  }

  if (filters) {
    for (const f of filters) {
      if (f.value === "" || f.value === null || f.value === undefined) continue;
      if (f.field === "is_income") {
        query = query.eq(
          f.field,
          f.value === "Income" || f.value === "true" || f.value === true,
        );
        continue;
      }
      if (f.field === "is_active") {
        query = query.eq(f.field, f.value === "true" || f.value === true);
        continue;
      }
      switch (f.operator) {
        case "eq":
          query = query.eq(f.field, f.value);
          break;
        case "neq":
          query = query.neq(f.field, f.value);
          break;
        case "gt":
          query = query.gt(f.field, f.value);
          break;
        case "lt":
          query = query.lt(f.field, f.value);
          break;
        case "in":
          if (Array.isArray(f.value)) query = query.in(f.field, f.value);
          break;
      }
    }
  }

  query = query.limit(10000);
  const { data: rows, error } = await query;

  if (error) return apiError(`Query failed: ${error.message}`, 500);
  if (!rows || rows.length === 0) {
    return apiSuccess({
      data: [],
      meta: { source, dimensions, metrics, rowCount: 0, totalRows: 0 },
    });
  }

  // Aggregate in JS
  const groups = new Map<string, Record<string, unknown>[]>();
  // @ts-expect-error - Auto-masked during strict compilation enforcement
  for (const row of rows as Record<string, unknown>[]) {
    const keyParts: string[] = [];
    for (const dim of dimensions) {
      let val = row[dim];
      const fieldDef = sourceDef.fields.find((f) => f.field === dim);
      if (fieldDef?.dataType === "date" && val && dateBin) {
        val = binDate(String(val), dateBin);
      }
      if (Array.isArray(val)) val = val[0] || "Unknown";
      // Prettify text values: title case
      if (
        fieldDef?.dataType === "text" &&
        typeof val === "string" &&
        val.length > 0
      ) {
        val = val
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
      keyParts.push(String(val ?? "Unknown"));
    }
    const key = keyParts.join("|||");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const result: Record<string, unknown>[] = [];
  for (const [key, groupRows] of groups) {
    const keyParts = key.split("|||");
    const row: Record<string, unknown> = {};
    for (let i = 0; i < dimensions.length; i++)
      row[dimensions[i]] = keyParts[i];

    for (const m of metrics) {
      const alias = m.alias || `${m.aggregation}_${m.field}`;
      const mFieldDef = sourceDef.fields.find((f) => f.field === m.field);
      const useAbsolute = mFieldDef?.dataType === "currency";
      const values = groupRows
        .map((r) => parseFloat(String(r[m.field] ?? "")))
        .filter((v) => !isNaN(v))
        .map((v) => (useAbsolute ? Math.abs(v) : v));
      switch (m.aggregation) {
        case "count":
          row[alias] = groupRows.length;
          break;
        case "sum":
          row[alias] =
            Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
          break;
        case "avg":
          row[alias] =
            values.length > 0
              ? Math.round(
                  (values.reduce((a, b) => a + b, 0) / values.length) * 100,
                ) / 100
              : 0;
          break;
        case "min":
          row[alias] = values.length > 0 ? Math.min(...values) : 0;
          break;
        case "max":
          row[alias] = values.length > 0 ? Math.max(...values) : 0;
          break;
        default:
          row[alias] = groupRows.length;
      }
    }
    if (metrics.length === 0) row["count"] = groupRows.length;
    result.push(row);
  }

  // Sort by first metric desc, or first dimension asc
  const sortKey =
    metrics.length > 0
      ? metrics[0].alias || `${metrics[0].aggregation}_${metrics[0].field}`
      : dimensions[0];
  const sortDir = metrics.length > 0 ? -1 : 1;
  result.sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number")
      return (av - bv) * sortDir;
    return String(av).localeCompare(String(bv)) * sortDir;
  });

  const resultLimit = Math.min(limit || 100, 500);
  return apiSuccess({
    data: result.slice(0, resultLimit),
    meta: {
      source,
      dimensions,
      metrics: metrics.map((m) => ({
        ...m,
        alias: m.alias || `${m.aggregation}_${m.field}`,
      })),
      rowCount: result.length,
      totalRows: rows.length,
    },
  });
});

function binDate(dateStr: string, bin: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  switch (bin) {
    case "day":
      return dateStr.slice(0, 10);
    case "week": {
      const monday = new Date(d);
      const day = monday.getDay();
      monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
      return monday.toISOString().slice(0, 10);
    }
    case "month":
      return dateStr.slice(0, 7);
    case "term": {
      const month = d.getMonth();
      if (month >= 8) return `${d.getFullYear()} Autumn`;
      if (month <= 3) return `${d.getFullYear()} Spring`;
      return `${d.getFullYear()} Summer`;
    }
    case "year":
      return String(d.getFullYear());
    default:
      return dateStr.slice(0, 7);
  }
}
