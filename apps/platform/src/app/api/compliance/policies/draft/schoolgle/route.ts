import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildSchoolglePolicyItemPayload,
  buildSchoolglePolicyVersionPayload,
  validateSchoolglePolicyDraftInput,
} from "@/lib/compliance/policies/schoolgle-draft-version";

export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const orgId = auth.organizationId;
    if (!orgId) return apiError("Missing organization", 400);

    const validation = validateSchoolglePolicyDraftInput(await request.json());
    if (!validation.ok) return apiError(validation.error, validation.status);

    const draft = validation.value;
    const supabase = createServiceRoleClient();
    const itemPayload = buildSchoolglePolicyItemPayload({
      requirementId: draft.requirementId,
      policyTitle: draft.policyTitle,
      sourceFileName: draft.sourceFileName,
      approvalRoute: draft.approvalRoute,
      reviewCycle: draft.reviewCycle,
    });

    const { data: existingItem, error: lookupError } = await supabase
      .from("compliance_items")
      .select("id,title,metadata")
      .eq("organization_id", orgId)
      .eq("type", "policy")
      .contains("metadata", { policyRequirementId: draft.requirementId })
      .maybeSingle();

    if (lookupError) {
      console.error("Error looking up managed policy item:", lookupError);
      return apiError("Failed to check existing managed policy", 500);
    }

    const item = existingItem
      ? await updateExistingItem(supabase, existingItem.id, itemPayload)
      : await createNewItem(supabase, orgId, itemPayload);

    if (!item.data || item.error) {
      console.error("Error saving managed policy item:", item.error);
      return apiError("Failed to save managed policy record", 500);
    }

    const versionPayload = buildSchoolglePolicyVersionPayload({
      formattedHtml: draft.formattedHtml,
      markdown: draft.markdown,
      sources: draft.sources,
      assumptions: draft.assumptions,
      changeSummary: `Created Schoolgle-managed v1.0 draft for ${draft.policyTitle}.`,
    });

    const { data: version, error: versionError } = await supabase
      .from("compliance_versions")
      .insert({
        compliance_item_id: item.data.id,
        version_number: await getNextVersionNumber(supabase, item.data.id),
        content_format: versionPayload.content_format,
        content_html: versionPayload.content_html,
        content_md: versionPayload.content_md,
        created_by_user_id: auth.userId,
        change_summary: versionPayload.change_summary,
        content_hash: buildContentHash(versionPayload.content_html),
        metadata: versionPayload.metadata,
      })
      .select()
      .single();

    if (versionError) {
      console.error("Error saving managed policy version:", versionError);
      return apiError("Failed to save managed policy version", 500);
    }

    await supabase.from("compliance_audit_log").insert({
      organization_id: orgId,
      entity_type: "compliance_version",
      entity_id: version.id,
      action: "schoolgle_draft_created",
      actor_user_id: auth.userId,
      metadata: {
        compliance_item_id: item.data.id,
        policyRequirementId: draft.requirementId,
        semanticVersion: versionPayload.metadata.semanticVersion,
        sourceFileName: draft.sourceFileName || null,
      },
    });

    return apiSuccess(
      {
        item: item.data,
        version,
        semanticVersion: versionPayload.metadata.semanticVersion,
        sourcePolicyChanged: false,
      },
      201,
    );
  },
  { requiredRole: "slt" },
);

async function createNewItem(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  itemPayload: ReturnType<typeof buildSchoolglePolicyItemPayload>,
) {
  return supabase
    .from("compliance_items")
    .insert({
      organization_id: organizationId,
      ...itemPayload,
    })
    .select()
    .single();
}

async function updateExistingItem(
  supabase: ReturnType<typeof createServiceRoleClient>,
  itemId: string,
  itemPayload: ReturnType<typeof buildSchoolglePolicyItemPayload>,
) {
  return supabase
    .from("compliance_items")
    .update({
      title: itemPayload.title,
      status: "draft",
      tags: itemPayload.tags,
      metadata: itemPayload.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select()
    .single();
}

async function getNextVersionNumber(
  supabase: ReturnType<typeof createServiceRoleClient>,
  itemId: string,
): Promise<number> {
  const { data } = await supabase
    .from("compliance_versions")
    .select("version_number")
    .eq("compliance_item_id", itemId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.version_number || 0) + 1;
}

function buildContentHash(content: string): string {
  return Buffer.from(content).toString("base64").slice(0, 40);
}
