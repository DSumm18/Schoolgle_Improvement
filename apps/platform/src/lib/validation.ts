import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Validate request body against a Zod schema.
 * Returns parsed data on success, or a 400 error response.
 */
export function validateBody<T extends z.ZodType>(
  body: unknown,
  schema: T,
):
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validate query parameters against a Zod schema.
 * Extracts params from URLSearchParams into a plain object first.
 */
export function validateQuery<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T,
):
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validateBody(params, schema);
}

// ─── Common Schemas ──────────────────────────────────────────────────

/** UUID v4 string */
export const uuidSchema = z.string().uuid();

/** Organization ID (required in most requests) */
export const organizationIdSchema = z.string().uuid();

/** Pagination params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Common query with organizationId */
export const orgQuerySchema = z.object({
  organizationId: organizationIdSchema,
});

// ─── Domain Schemas ──────────────────────────────────────────────────

export const staffCreateSchema = z.object({
  organizationId: organizationIdSchema,
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  salutation: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  avatar_url: z.string().url().optional(),
  employee_id: z.string().max(50).optional(),
  job_title: z.string().min(1).max(200),
  role_category: z.string().min(1),
  is_super_user: z.boolean().default(false),
  is_active: z.boolean().default(true),
  accessible_modules: z.array(z.string()).optional(),
  created_by: z.string().uuid().optional(),
});

export const staffUpdateSchema = z.object({
  id: uuidSchema,
  salutation: z.string().max(20).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  phone: z.string().max(30).optional().or(z.null()),
  avatar_url: z.string().url().optional().or(z.null()),
  employee_id: z.string().max(50).optional().or(z.null()),
  job_title: z.string().min(1).max(200).optional(),
  role_category: z.string().min(1).optional(),
  is_super_user: z.boolean().optional(),
  is_active: z.boolean().optional(),
  accessible_modules: z.array(z.string()).optional(),
});

export const actionCreateSchema = z.object({
  organizationId: organizationIdSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().optional(),
  eef_strategy: z.string().optional(),
  estimated_cost: z.number().min(0).optional(),
  framework_ref: z.string().optional(),
});

export const governorCreateSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  role: z.string().min(1),
  type: z.string().optional(),
  appointed_date: z.string().optional(),
  term_end_date: z.string().optional(),
  committees: z.array(z.string()).optional(),
  dbs_checked: z.boolean().optional(),
  training_completed: z.array(z.string()).optional(),
});

export const complianceItemCreateSchema = z.object({
  organizationId: organizationIdSchema,
  title: z.string().min(1).max(500),
  type: z.string().min(1),
  category: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  review_date: z.string().optional(),
  content: z.string().optional(),
  template_id: z.string().uuid().optional(),
});

export const estateAssetCreateSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1).max(300),
  asset_type: z.string().min(1),
  location: z.string().optional(),
  status: z.string().optional(),
  serial_number: z.string().max(100).optional(),
  purchase_date: z.string().optional(),
  warranty_expiry: z.string().optional(),
  next_service_date: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

export const meetingCreateSchema = z.object({
  organizationId: organizationIdSchema,
  title: z.string().min(1).max(500),
  type: z.string().optional(),
  date: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().max(300).optional(),
  attendees: z.array(z.string()).optional(),
  agenda: z.string().max(10000).optional(),
  template_id: z.string().uuid().optional(),
});

export const surveyCreateSchema = z.object({
  organizationId: organizationIdSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  anonymous: z.boolean().optional(),
  target_audience: z.string().optional(),
});
