import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  getGoogleReauthoriseMessage,
  getValidGoogleAccessToken,
} from "@/lib/google-oauth-tokens";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * GET /api/data-connections/files?organizationId=xxx&category=fms
 * List files in a specific data category from the connected Drive folder
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;
  const category = req.nextUrl.searchParams.get("category");

  if (!orgId) return apiError("Missing organizationId", 400);

  const supabase = createServiceRoleClient();

  // Get the active connection
  const { data: conn } = await supabase
    .from("school_data_connections")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .single();

  if (!conn) {
    return apiError(
      "No active data connection. Please connect your Google Drive first.",
      404,
    );
  }

  let accessToken: string | null = null;
  try {
    accessToken = await getValidGoogleAccessToken({
      supabase,
      connection: conn,
    });
  } catch {
    return apiError(getGoogleReauthoriseMessage(), 401);
  }

  if (!GOOGLE_API_KEY && !accessToken) {
    return apiError("Google Drive access is not configured", 500);
  }

  const detectedFolders = (conn.detected_folders || {}) as Record<
    string,
    { category: string; files: number; folderId: string }
  >;

  // If category specified, find matching folders
  if (category) {
    const matchingFolders = Object.entries(detectedFolders).filter(
      ([_, info]) => info.category === category,
    );

    if (matchingFolders.length === 0) {
      return apiSuccess({
        files: [],
        message: `No ${category} data found in connected folder`,
      });
    }

    // List files in all matching folders
    const allFiles = [];
    for (const [folderPath, info] of matchingFolders) {
      const params = new URLSearchParams({
        q: `'${info.folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
        fields: "files(id,name,mimeType,modifiedTime,size)",
        pageSize: "100",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
        orderBy: "modifiedTime desc",
      });
      if (!accessToken && GOOGLE_API_KEY) params.set("key", GOOGLE_API_KEY);

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?${params}`,
        accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : undefined,
      );

      if (res.ok) {
        const data = await res.json();
        for (const file of data.files || []) {
          allFiles.push({ ...file, folderPath, category: info.category });
        }
      }
    }

    return apiSuccess({ files: allFiles });
  }

  // No category filter — return the folder map
  return apiSuccess({ detectedFolders });
});

// Google Workspace native mimeTypes → export format mapping
const GOOGLE_NATIVE_EXPORT: Record<
  string,
  { exportMime: string; outputMime: string }
> = {
  "application/vnd.google-apps.document": {
    exportMime: "text/plain",
    outputMime: "text/plain",
  },
  "application/vnd.google-apps.spreadsheet": {
    exportMime:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    outputMime:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  "application/vnd.google-apps.presentation": {
    exportMime: "application/pdf",
    outputMime: "application/pdf",
  },
  "application/vnd.google-apps.form": {
    exportMime: "text/plain",
    outputMime: "text/plain",
  },
};

/**
 * POST /api/data-connections/files
 * Download a specific file's content (returns as base64 or parsed data).
 * Handles both binary uploads (xlsx, csv, pdf) and Google native files
 * (Docs, Sheets, Slides) by exporting to a usable format.
 */
export const POST = protectedRoute(async (auth, req) => {
  const { fileId, parse, mimeType } = await req.json();
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !fileId) {
    return apiError("Missing fileId", 400);
  }

  const supabase = createServiceRoleClient();
  const { data: conn } = await supabase
    .from("school_data_connections")
    .select(
      "id,access_token_encrypted,refresh_token_encrypted,token_expiry",
    )
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .single();

  let accessToken: string | null = null;
  if (conn) {
    try {
      accessToken = await getValidGoogleAccessToken({
        supabase,
        connection: conn,
      });
    } catch {
      return apiError(getGoogleReauthoriseMessage(), 401);
    }
  }

  if (!GOOGLE_API_KEY && !accessToken) {
    return apiError("Google Drive access is not configured", 500);
  }

  let buffer: Buffer;
  let contentType: string;

  const exportConfig = mimeType ? GOOGLE_NATIVE_EXPORT[mimeType] : null;

  if (exportConfig) {
    // Google native file → export to a downloadable format
    const params = new URLSearchParams({
      mimeType: exportConfig.exportMime,
    });
    if (!accessToken && GOOGLE_API_KEY) params.set("key", GOOGLE_API_KEY);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?${params}`,
      accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    );

    if (!res.ok) {
      return apiError(
        `Failed to export Google file: ${res.status}`,
        res.status,
      );
    }

    buffer = Buffer.from(await res.arrayBuffer());
    contentType = exportConfig.outputMime;
  } else {
    // Binary file (xlsx, csv, pdf, docx, etc.) → direct download
    const params = new URLSearchParams({ alt: "media" });
    if (!accessToken && GOOGLE_API_KEY) params.set("key", GOOGLE_API_KEY);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?${params}`,
      accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    );

    if (!res.ok) {
      return apiError("Failed to download file", res.status);
    }

    buffer = Buffer.from(await res.arrayBuffer());
    contentType = res.headers.get("content-type") || "application/octet-stream";
  }

  return apiSuccess({
    content: buffer.toString("base64"),
    contentType,
    size: buffer.length,
    exported: !!exportConfig,
  });
});
