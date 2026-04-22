import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/organization/schemes
// Returns the school's adopted scheme for each subject, keyed by subject.
// Shape: { schemes: [{ subject, scheme_name, notes, adopted_at, updated_at }] }
export const GET = protectedRoute(async (auth, _req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const { data, error } = await supabase
    .from("organization_schemes")
    .select("subject, scheme_name, notes, adopted_at, updated_at")
    .eq("organization_id", orgId)
    .order("subject");

  if (error) return apiError(error.message, 500);
  return apiSuccess({ schemes: data || [] });
});

// PUT /api/organization/schemes
// Body: { subject: string, scheme_name: string, notes?: string }
// Upserts the school-wide scheme for a subject.
export const PUT = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const body = (await req.json().catch(() => null)) as {
    subject?: string;
    scheme_name?: string;
    notes?: string | null;
  } | null;

  const subject = body?.subject?.trim();
  const schemeName = body?.scheme_name?.trim();
  if (!subject || !schemeName) {
    return apiError("subject and scheme_name are required", 400);
  }

  const { data, error } = await supabase
    .from("organization_schemes")
    .upsert(
      {
        organization_id: orgId,
        subject,
        scheme_name: schemeName,
        notes: body?.notes?.toString().trim() || null,
        adopted_by: auth.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,subject" },
    )
    .select("subject, scheme_name, notes, adopted_at, updated_at")
    .single();

  if (error) return apiError(error.message, 400);
  return apiSuccess(data);
});

// DELETE /api/organization/schemes?subject=Maths
// Removes the school's adopted scheme for one subject.
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const subject = req.nextUrl.searchParams.get("subject")?.trim();
  if (!subject) return apiError("subject query param required", 400);

  const { error } = await supabase
    .from("organization_schemes")
    .delete()
    .eq("organization_id", orgId)
    .eq("subject", subject);

  if (error) return apiError(error.message, 400);
  return apiSuccess({ deleted: subject });
});
