import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";
import { validateBody } from "@/lib/validation";

const createTypeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  category: z.enum([
    "safeguarding", "send", "health_safety", "data_governance",
    "curriculum", "estates", "custom",
  ]),
  min_count: z.number().int().min(0).default(0),
  max_count: z.number().int().min(1).nullable().optional(),
  ratio_numerator: z.number().int().nullable().optional(),
  ratio_denominator: z.number().int().nullable().optional(),
  ratio_against: z.enum(["pupils", "staff", "floors", "eyfs_pupils"]).nullable().optional(),
  must_be_available: z.boolean().default(false),
  requires_training: z.boolean().default(false),
  training_name: z.string().nullable().optional(),
  training_renewal_months: z.number().int().nullable().optional(),
  modules: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  auto_tasks: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    frequency: z.enum(["daily", "weekly", "monthly", "termly", "yearly", "once"]),
    day: z.string().optional(),
    month: z.number().optional(),
    module: z.string().optional(),
  })).default([]),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

// GET /api/connectors/types - List all connector types (statutory + org custom)
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("connector_types")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${auth.organizationId}`)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching connector types:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
});

// POST /api/connectors/types - Create a custom connector type
export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const validated = validateBody(body, createTypeSchema);
    if (!validated.success) return validated.response;

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("connector_types")
      .insert({
        ...validated.data,
        organization_id: auth.organizationId,
        is_statutory: false,
        category: validated.data.category || "custom",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating connector type:", error);
      if (error.code === "23505") {
        return apiError("A connector type with this slug already exists", 409);
      }
      return apiError(error.message, 500);
    }

    return apiSuccess(data, 201);
  },
  { requiredRole: "slt" }
);

// DELETE /api/connectors/types - Delete a custom connector type
export const DELETE = protectedRoute(
  async (auth, request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return apiError("ID is required", 400);

    const supabase = createServiceRoleClient();

    // Cannot delete statutory types
    const { data: existing } = await supabase
      .from("connector_types")
      .select("is_statutory, organization_id")
      .eq("id", id)
      .single();

    if (existing?.is_statutory) {
      return apiError("Cannot delete statutory connector types", 403);
    }

    if (existing?.organization_id !== auth.organizationId) {
      return apiError("Not found", 404);
    }

    const { error } = await supabase
      .from("connector_types")
      .delete()
      .eq("id", id)
      .eq("organization_id", auth.organizationId);

    if (error) {
      console.error("Error deleting connector type:", error);
      return apiError(error.message, 500);
    }

    return apiSuccess({ success: true });
  },
  { requiredRole: "admin" }
);
