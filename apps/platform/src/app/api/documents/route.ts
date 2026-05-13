import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  renderDocument,
  type OrgBranding,
} from "@/lib/document-engine/template-renderer";
import { ensureStandardDocumentTemplates } from "@/lib/document-engine/standard-templates";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function stringSetting(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function buildOrgBranding(
  organization: {
    name?: string | null;
    organization_type?: string | null;
    settings?: Record<string, unknown> | null;
  } | null,
): OrgBranding {
  const settings = organization?.settings || {};
  const isTrustLevel =
    organization?.organization_type === "trust" ||
    organization?.organization_type === "local_authority";

  return {
    school_name: organization?.name || "Schoolgle",
    logo_url:
      stringSetting(
        isTrustLevel
          ? settings.trust_logo_url || settings.logo_url
          : settings.logo_url,
      ) || undefined,
    address: stringSetting(settings.address),
    phone: stringSetting(settings.phone),
    email: stringSetting(settings.email),
    primary_color: stringSetting(settings.primary_color),
    secondary_color: stringSetting(settings.secondary_color),
    accent_color: stringSetting(settings.accent_color),
    font_family: stringSetting(settings.font_family),
    footer_text: stringSetting(settings.footer_text),
  };
}

/**
 * GET /api/documents
 * List generated documents with filtering and pagination
 *
 * Query params: organizationId, module, status, recipientType,
 *               contextType, contextId, search, limit, offset
 */
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);

  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const documentModule = searchParams.get("module");
  const status = searchParams.get("status");
  const recipientType = searchParams.get("recipientType");
  const contextType = searchParams.get("contextType");
  const contextId = searchParams.get("contextId");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let query = supabase
    .from("generated_documents")
    .select(
      "*, document_templates(id, name, module, category, document_type)",
      { count: "exact" },
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (recipientType) query = query.eq("recipient_type", recipientType);
  if (contextType) query = query.eq("context_type", contextType);
  if (contextId) query = query.eq("context_id", contextId);
  if (search) {
    query = query.or(
      `subject.ilike.%${search}%,recipient_name.ilike.%${search}%`,
    );
  }

  // Filter by module directly (generated_documents has its own module column)
  if (documentModule) {
    query = query.eq("module", documentModule);
  }

  const { data: documents, error, count } = await query;

  if (error) {
    console.error("Error fetching documents:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({
    documents: documents || [],
    total: count || 0,
    limit,
    offset,
  });
});

/**
 * POST /api/documents
 * Create a generated document from a template.
 */
export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();
  await ensureStandardDocumentTemplates(supabase);

  const {
    templateId,
    title,
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    recipient_type: recipientType,
    recipient_id: recipientId,
    field_values: fieldValues,
    status,
    context_type: contextType,
    context_id: contextId,
  } = body;

  if (!templateId) {
    return apiError("templateId is required", 400, "MISSING_FIELDS");
  }

  const organizationId = auth.organizationId;

  let templateQuery = supabase
    .from("document_templates")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`);

  templateQuery = UUID_PATTERN.test(templateId)
    ? templateQuery.eq("id", templateId)
    : templateQuery.eq("slug", templateId);

  const { data: template, error: templateError } = await templateQuery.single();

  if (templateError || !template) {
    return apiError("Template not found", 404, "NOT_FOUND");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name, organization_type, settings")
    .eq("id", organizationId)
    .single();

  const placeholderValues: Record<string, string> = {
    ...(fieldValues || {}),
    recipient_name: recipientName || fieldValues?.recipient_name || "",
    recipient_email: recipientEmail || fieldValues?.recipient_email || "",
  };

  const rendered = renderDocument(
    {
      ...template,
      placeholders: [],
      default_delivery: "portal",
      requires_approval: false,
    },
    placeholderValues,
    template.use_org_branding === false
      ? undefined
      : buildOrgBranding(organization),
  );

  const documentStatus = status === "finalised" ? "finalised" : "draft";
  const subject = title || rendered.subject || template.name;

  const { data: document, error } = await supabase
    .from("generated_documents")
    .insert({
      organization_id: organizationId,
      template_id: template.id,
      module: template.module,
      document_type: template.document_type || "letter",
      subject,
      body_html: rendered.body,
      placeholder_values: placeholderValues,
      recipient_type: recipientType || "staff",
      recipient_id: recipientId || null,
      recipient_name: recipientName || placeholderValues.recipient_name || "Recipient",
      recipient_email: recipientEmail || placeholderValues.recipient_email || null,
      context_type: contextType || null,
      context_id: contextId || null,
      status: documentStatus,
      created_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating document:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({ document }, 201);
});
