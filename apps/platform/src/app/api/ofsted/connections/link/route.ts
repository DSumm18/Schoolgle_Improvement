import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * POST /api/ofsted/connections/link
 * Connect a Google Drive folder via shared link (no OAuth needed).
 * Uses Google Drive API with API key to access publicly shared folders.
 */
export const POST = protectedRoute(async (auth, req) => {
  const { organizationId, folderId, folderLink, connectedBy } =
    await req.json();

  const orgId = organizationId || auth.organizationId;

  if (!orgId || !folderId) {
    return apiError("Missing organizationId or folderId", 400);
  }

  if (!GOOGLE_API_KEY) {
    console.error("[DriveLink] GOOGLE_API_KEY not configured");
    return apiError(
      "Google Drive integration not configured. Contact support.",
      500,
    );
  }

  // Validate the folder is accessible via the API key (publicly shared)
  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?` +
      new URLSearchParams({
        key: GOOGLE_API_KEY,
        fields: "id,name,mimeType,shared,capabilities",
        supportsAllDrives: "true",
      }),
  );

  if (!driveRes.ok) {
    const driveError = await driveRes.json().catch(() => ({}));
    console.error("[DriveLink] Folder validation failed:", driveError);

    if (driveRes.status === 404 || driveRes.status === 403) {
      return apiError(
        "Cannot access this folder. Please check it is shared as 'Anyone with the link' with Viewer access.",
        403,
      );
    }

    return apiError("Failed to validate folder access", 500);
  }

  const folderData = await driveRes.json();

  // Check it's actually a folder
  if (folderData.mimeType !== "application/vnd.google-apps.folder") {
    return apiError(
      "This link points to a file, not a folder. Please share a folder link.",
      400,
    );
  }

  // Count files in the folder to give quick feedback
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?` +
      new URLSearchParams({
        key: GOOGLE_API_KEY,
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id)",
        pageSize: "1",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      }),
  );

  let fileCount = 0;
  if (listRes.ok) {
    const listData = await listRes.json();
    fileCount = listData.files?.length || 0;
  }

  const supabase = createServiceRoleClient();

  // Save the connection (upsert on org+provider)
  const { data: connection, error: dbError } = await supabase
    .from("ofsted_drive_connections")
    .upsert(
      {
        organization_id: orgId,
        provider: "google",
        folder_id: folderId,
        folder_name: folderData.name,
        connected_by: connectedBy || auth.userId || null,
        connected_at: new Date().toISOString(),
        is_active: true,
        scan_status: "idle",
        scan_error: null,
        scan_frequency: "manual",
        // No tokens needed - we use API key for shared folders
        access_token_encrypted: null,
        refresh_token_encrypted: null,
      },
      { onConflict: "organization_id,provider" },
    )
    .select(
      "id, provider, folder_id, folder_name, connected_at, last_scan_at, is_active, scan_frequency, scan_status, scan_error, total_files_scanned, total_evidence_found, connected_by",
    )
    .single();

  if (dbError) {
    console.error("[DriveLink] DB error:", dbError);
    return apiError("Failed to save connection", 500);
  }

  return apiSuccess({
    connection,
    folderName: folderData.name,
    filesDetected: fileCount > 0,
  });
});
