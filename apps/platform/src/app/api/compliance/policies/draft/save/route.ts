import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { uploadToGoogleDrive } from "@/lib/cloud-service";
import {
  createDriveFolder,
  ensureConnectorFolderStructure,
  findChildFolder,
} from "@/lib/google-drive-connector";
import {
  getGoogleReauthoriseMessage,
  getValidGoogleAccessToken,
} from "@/lib/google-oauth-tokens";
import {
  POLICY_DRAFT_WORD_MIME_TYPE,
  POLICY_GENERATED_DRAFTS_FOLDER,
  buildDrivePolicyDraftFileName,
  validatePolicyDraftSaveInput,
} from "@/lib/compliance/policies/policy-draft-save";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const orgId = auth.organizationId;
  if (!orgId) return apiError("Missing organization", 400);

  const validation = validatePolicyDraftSaveInput(await request.json());
  if (!validation.ok) {
    return apiError(validation.error, validation.status);
  }

  const supabase = createServiceRoleClient();
  const { data: connection, error } = await supabase
    .from("school_data_connections")
    .select(
      "id,provider,folder_id,folder_name,is_active,access_token_encrypted,refresh_token_encrypted,token_expiry",
    )
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("last_scan_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) return apiError("Failed to fetch connector", 500);
  if (!connection) {
    return apiError(
      "No active data connection. Please connect your Schoolgle folder first.",
      404,
    );
  }

  if (connection.provider !== "google") {
    return apiError(
      "Saving generated policy drafts is currently available for Google Drive connections only.",
      400,
    );
  }

  let accessToken: string | null = null;
  try {
    accessToken = await getValidGoogleAccessToken({
      supabase,
      connection,
    });
  } catch {
    return apiError(getGoogleReauthoriseMessage(), 401);
  }

  if (!accessToken || !connection.folder_id) {
    return apiError("Google Drive access is not configured", 500);
  }

  const draftsFolder = await ensurePolicyDraftsFolder(
    accessToken,
    connection.folder_id,
  );
  const fileName = buildDrivePolicyDraftFileName({
    downloadFileName: validation.value.downloadFileName,
  });
  const file = await uploadToGoogleDrive(
    accessToken,
    fileName,
    validation.value.formattedHtml,
    POLICY_DRAFT_WORD_MIME_TYPE,
    draftsFolder.id,
  );

  return apiSuccess({
    fileId: file.id,
    fileName: file.name,
    webViewLink: file.webViewLink,
    folderId: draftsFolder.id,
    folderName: POLICY_GENERATED_DRAFTS_FOLDER,
    createdAt: new Date().toISOString(),
    sourcePolicyChanged: false,
  });
});

async function ensurePolicyDraftsFolder(
  accessToken: string,
  rootFolderId: string,
) {
  await ensureConnectorFolderStructure(accessToken, rootFolderId, {
    appKeys: ["policy-manager"],
  });

  const policiesFolder =
    (await findChildFolder(accessToken, rootFolderId, "Policies")) ||
    (await createDriveFolder(accessToken, {
      name: "Policies",
      parentId: rootFolderId,
    }));

  return (
    (await findChildFolder(
      accessToken,
      policiesFolder.id,
      POLICY_GENERATED_DRAFTS_FOLDER,
    )) ||
    (await createDriveFolder(accessToken, {
      name: POLICY_GENERATED_DRAFTS_FOLDER,
      parentId: policiesFolder.id,
    }))
  );
}
