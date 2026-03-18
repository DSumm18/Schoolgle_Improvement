import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * POST /api/data-connections/scan
 * Re-scan the connected folder to detect new/changed files
 */
export const POST = protectedRoute(async (auth, req) => {
  const { organizationId, connectionId } = await req.json();
  const orgId = organizationId || auth.organizationId;

  if (!orgId || !connectionId) {
    return apiError("Missing organizationId or connectionId", 400);
  }

  const supabase = createServiceRoleClient();

  // Get the connection
  const { data: conn, error: connErr } = await supabase
    .from("school_data_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .single();

  if (connErr || !conn) {
    return apiError("Connection not found", 404);
  }

  if (!GOOGLE_API_KEY) {
    return apiError("Google API key not configured", 500);
  }

  // Update status to scanning
  await supabase
    .from("school_data_connections")
    .update({ scan_status: "scanning", scan_error: null })
    .eq("id", connectionId);

  try {
    // Recursively list all files
    const allFiles = await listAllFiles(conn.folder_id);

    // Categorise files by folder path
    const detectedFolders: Record<
      string,
      { category: string; files: number; folderId: string }
    > = {};

    for (const file of allFiles) {
      const folderPath = file.folderPath || "root";
      if (!detectedFolders[folderPath]) {
        detectedFolders[folderPath] = {
          category: detectCategory(folderPath),
          files: 0,
          folderId: file.parentId || conn.folder_id,
        };
      }
      detectedFolders[folderPath].files++;
    }

    // Find most recent file
    const mostRecent = allFiles.reduce(
      (latest, f) => {
        if (!f.modifiedTime) return latest;
        if (!latest) return f.modifiedTime;
        return f.modifiedTime > latest ? f.modifiedTime : latest;
      },
      null as string | null,
    );

    // Update connection with results
    await supabase
      .from("school_data_connections")
      .update({
        scan_status: "complete",
        scan_error: null,
        last_scan_at: new Date().toISOString(),
        detected_folders: detectedFolders,
        total_files: allFiles.length,
        total_folders: Object.keys(detectedFolders).length,
        last_modified_file: mostRecent,
      })
      .eq("id", connectionId);

    return apiSuccess({
      totalFiles: allFiles.length,
      detectedFolders,
      lastModified: mostRecent,
    });
  } catch (err: any) {
    await supabase
      .from("school_data_connections")
      .update({
        scan_status: "error",
        scan_error: err.message || "Scan failed",
      })
      .eq("id", connectionId);

    return apiError(err.message || "Scan failed", 500);
  }
});

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  folderPath?: string;
  parentId?: string;
}

async function listAllFiles(
  folderId: string,
  folderPath = "",
  depth = 0,
): Promise<DriveFile[]> {
  if (!GOOGLE_API_KEY || depth > 4) return [];

  const files: DriveFile[] = [];

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
        new URLSearchParams({
          key: GOOGLE_API_KEY,
          q: `'${folderId}' in parents and trashed = false`,
          fields: "files(id,name,mimeType,modifiedTime)",
          pageSize: "200",
          supportsAllDrives: "true",
          includeItemsFromAllDrives: "true",
        }),
    );

    if (!res.ok) return files;

    const data = await res.json();
    const items = data.files || [];

    for (const item of items) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        const subPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        const subFiles = await listAllFiles(item.id, subPath, depth + 1);
        files.push(...subFiles);
      } else {
        files.push({
          ...item,
          folderPath: folderPath || "root",
          parentId: folderId,
        });
      }
    }
  } catch (err) {
    console.error("[Scan] Error listing files:", err);
  }

  return files;
}

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
  dfe: "dfe",
  external: "dfe",
  document: "documents",
  policies: "documents",
  governance: "documents",
};

function detectCategory(folderPath: string): string {
  const lower = folderPath.toLowerCase();
  for (const [pattern, category] of Object.entries(FOLDER_PATTERNS)) {
    if (lower.includes(pattern)) return category;
  }
  return "unknown";
}
