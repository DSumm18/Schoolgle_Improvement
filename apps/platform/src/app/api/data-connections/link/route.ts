import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * POST /api/data-connections/link
 * Connect a Google Drive folder via shared link.
 * This is the main school data folder (not just Ofsted evidence).
 */
export const POST = protectedRoute(async (auth, req) => {
  const { folderId, connectedBy } = await req.json();
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !folderId) {
    return apiError("Missing organizationId or folderId", 400);
  }

  if (!GOOGLE_API_KEY) {
    return apiError(
      "Google Drive integration not configured. Contact support.",
      500,
    );
  }

  // Validate folder is accessible
  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?` +
      new URLSearchParams({
        key: GOOGLE_API_KEY,
        fields: "id,name,mimeType",
        supportsAllDrives: "true",
      }),
  );

  if (!driveRes.ok) {
    if (driveRes.status === 404 || driveRes.status === 403) {
      return apiError(
        "Cannot access this folder. Use the secure Google sign-in Connector route, or confirm this fallback folder link has view-only access enabled.",
        403,
      );
    }
    return apiError("Failed to validate folder access", 500);
  }

  const folderData = await driveRes.json();

  if (folderData.mimeType !== "application/vnd.google-apps.folder") {
    return apiError(
      "This link points to a file, not a folder. Please share a folder link.",
      400,
    );
  }

  // Scan subfolder structure to detect data categories
  const detectedFolders = await scanFolderStructure(folderId);
  const totalFolders = Object.keys(detectedFolders).length;

  const supabase = createServiceRoleClient();

  const { data: connection, error: dbError } = await supabase
    .from("school_data_connections")
    .upsert(
      {
        organization_id: orgId,
        provider: "google",
        folder_id: folderId,
        folder_name: folderData.name,
        connected_by: connectedBy || auth.userId || null,
        connected_at: new Date().toISOString(),
        is_active: true,
        scan_status: "complete",
        scan_error: null,
        detected_folders: detectedFolders,
        total_folders: totalFolders,
        access_token_encrypted: null,
        refresh_token_encrypted: null,
      },
      { onConflict: "organization_id,provider" },
    )
    .select("*")
    .single();

  if (dbError) {
    console.error("[DataConnection] DB error:", dbError);
    return apiError("Failed to save connection", 500);
  }

  return apiSuccess({
    connection,
    folderName: folderData.name,
    detectedFolders,
  });
});

// Known folder name patterns mapped to data categories
const FOLDER_PATTERNS: Record<string, string> = {
  "pupil data": "pupils",
  "pupil roll": "pupils",
  attendance: "attendance",
  assessment: "assessments",
  tracker: "assessments",
  behaviour: "behaviour",
  behavior: "behaviour",
  staff: "staff",
  hr: "staff",
  budget: "fms",
  finance: "fms",
  fms: "fms",
  payroll: "payroll",
  energy: "energy",
  utilities: "energy",
  "utility bills": "energy",
  "energy invoices": "energy",
  "electricity invoices": "energy",
  "gas invoices": "energy",
  dfe: "dfe",
  external: "dfe",
  document: "documents",
  policies: "documents",
  governance: "documents",
  ofsted: "documents",
};

async function scanFolderStructure(
  rootFolderId: string,
  parentPath = "",
): Promise<
  Record<string, { category: string; files: number; folderId: string }>
> {
  if (!GOOGLE_API_KEY) return {};

  const result: Record<
    string,
    { category: string; files: number; folderId: string }
  > = {};

  try {
    // List items in this folder
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
        new URLSearchParams({
          key: GOOGLE_API_KEY,
          q: `'${rootFolderId}' in parents and trashed = false`,
          fields: "files(id,name,mimeType)",
          pageSize: "100",
          supportsAllDrives: "true",
          includeItemsFromAllDrives: "true",
        }),
    );

    if (!listRes.ok) return result;

    const listData = await listRes.json();
    const items = listData.files || [];

    let fileCount = 0;
    const subfolders: { id: string; name: string }[] = [];

    for (const item of items) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        subfolders.push({ id: item.id, name: item.name });
      } else {
        fileCount++;
      }
    }

    // Detect category for this folder
    const folderName = parentPath || "root";
    const lowerName = folderName.toLowerCase();
    let detectedCategory = "unknown";

    for (const [pattern, category] of Object.entries(FOLDER_PATTERNS)) {
      if (lowerName.includes(pattern)) {
        detectedCategory = category;
        break;
      }
    }

    // If this folder has files and a detected category, record it
    if (fileCount > 0 && detectedCategory !== "unknown") {
      result[folderName] = {
        category: detectedCategory,
        files: fileCount,
        folderId: rootFolderId,
      };
    }

    // Recurse into subfolders (max 2 levels deep)
    const depth = parentPath.split("/").filter(Boolean).length;
    if (depth < 3) {
      for (const sub of subfolders) {
        const subPath = parentPath ? `${parentPath}/${sub.name}` : sub.name;
        const subResult = await scanFolderStructure(sub.id, subPath);
        Object.assign(result, subResult);
      }
    }
  } catch (err) {
    console.error("[DataConnection] Scan error:", err);
  }

  return result;
}
