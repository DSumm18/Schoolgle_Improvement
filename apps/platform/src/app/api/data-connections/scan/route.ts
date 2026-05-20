import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { ensureConnectorFolderStructure } from "@/lib/google-drive-connector";
import { getEnabledConnectorAppKeys } from "@/lib/connectors/connector-entitlements";
import { getConnectorFoldersForAppKeys } from "@/lib/schoolgle-connector";
import {
  getGoogleReauthoriseMessage,
  getValidGoogleAccessToken,
} from "@/lib/google-oauth-tokens";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * POST /api/data-connections/scan
 * Re-scan the connected folder to detect new/changed files
 */
export const POST = protectedRoute(async (auth, req) => {
  const { connectionId } = await req.json();
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

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

  let accessToken: string | null = null;
  try {
    accessToken = await getValidGoogleAccessToken({
      supabase,
      connection: conn,
    });
  } catch (err) {
    const rawMessage =
      err instanceof Error ? err.message : "Google Drive token refresh failed";
    const message = rawMessage.includes("invalid_grant")
      ? getGoogleReauthoriseMessage()
      : rawMessage;

    await supabase
      .from("school_data_connections")
      .update({
        scan_status: "error",
        scan_error: message,
      })
      .eq("id", connectionId);

    return apiError(message, 401);
  }

  if (!GOOGLE_API_KEY && !accessToken) {
    return apiError("Google Drive access is not configured", 500);
  }

  // Update status to scanning
  await supabase
    .from("school_data_connections")
    .update({ scan_status: "scanning", scan_error: null })
    .eq("id", connectionId);

  try {
    const enabledConnectorAppKeys = await getEnabledConnectorAppKeys(
      supabase,
      orgId,
    );
    const enabledFolderNames = getConnectorFoldersForAppKeys(
      enabledConnectorAppKeys,
    ).map((folder) => folder.name);

    if (accessToken) {
      await ensureConnectorFolderStructure(accessToken, conn.folder_id, {
        appKeys: enabledConnectorAppKeys,
      });
    }

    // Recursively list only the app folders this school is entitled to use.
    const scanContents = await listEnabledAppContents(
      conn.folder_id,
      enabledFolderNames,
      accessToken,
    );
    const allFiles = scanContents.files;

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
        total_folders: scanContents.folderCount,
        last_modified_file: mostRecent,
      })
      .eq("id", connectionId);

    return apiSuccess({
      totalFiles: allFiles.length,
      totalFolders: scanContents.folderCount,
      detectedFolders,
      lastModified: mostRecent,
    });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : "Scan failed";
    const message =
      rawMessage.includes("insufficient") ||
      rawMessage.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
      rawMessage.includes("Invalid Credentials") ||
      rawMessage.includes("UNAUTHENTICATED")
        ? "This Connector needs to be re-authorised so Schoolgle can create and maintain its dedicated folder structure. Disconnect and connect with Google again."
        : rawMessage;
    await supabase
      .from("school_data_connections")
      .update({
        scan_status: "error",
        scan_error: message,
      })
      .eq("id", connectionId);

    return apiError(message, 500);
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

type DriveScanContents = {
  files: DriveFile[];
  folderCount: number;
};

async function listEnabledAppContents(
  rootFolderId: string,
  enabledFolderNames: string[],
  accessToken?: string | null,
): Promise<DriveScanContents> {
  if (enabledFolderNames.length === 0) {
    return { files: [], folderCount: 0 };
  }

  const enabledFolders = new Set(enabledFolderNames);
  const rootItems = await listFolderChildren(rootFolderId, accessToken);
  const files: DriveFile[] = [];
  let folderCount = 0;

  for (const item of rootItems) {
    const isFolder = item.mimeType === "application/vnd.google-apps.folder";
    if (!isFolder || !enabledFolders.has(item.name)) continue;

    folderCount += 1;
    const subContents = await listAllContents(
      item.id,
      item.name,
      1,
      accessToken,
    );
    folderCount += subContents.folderCount;
    files.push(...subContents.files);
  }

  return { files, folderCount };
}

async function listFolderChildren(
  folderId: string,
  accessToken?: string | null,
): Promise<DriveFile[]> {
  if (!GOOGLE_API_KEY && !accessToken) return [];

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,modifiedTime)",
    pageSize: "200",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  if (!accessToken && GOOGLE_API_KEY) params.set("key", GOOGLE_API_KEY);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.files || [];
}

async function listAllContents(
  folderId: string,
  folderPath = "",
  depth = 0,
  accessToken?: string | null,
): Promise<DriveScanContents> {
  if ((!GOOGLE_API_KEY && !accessToken) || depth > 4) {
    return { files: [], folderCount: 0 };
  }

  const files: DriveFile[] = [];
  let folderCount = 0;

  try {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,modifiedTime)",
      pageSize: "200",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (!accessToken && GOOGLE_API_KEY) params.set("key", GOOGLE_API_KEY);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    );

    if (!res.ok) return { files, folderCount };

    const data = await res.json();
    const items = data.files || [];

    for (const item of items) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        folderCount += 1;
        const subPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        const subContents = await listAllContents(
          item.id,
          subPath,
          depth + 1,
          accessToken,
        );
        folderCount += subContents.folderCount;
        files.push(...subContents.files);
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

  return { files, folderCount };
}

const FOLDER_PATTERNS: Record<string, string> = {
  archive: "archive",
  archived: "archive",
  superseded: "archive",
  "do not scan": "archive",
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
  ofsted: "documents",
  "ofsted readiness": "documents",
  siams: "documents",
  "siams readiness": "documents",
  "religious education": "documents",
  "collective worship": "documents",
  trust: "assessments",
  "trust assessor": "assessments",
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
