/**
 * Energy invoice folder sync.
 *
 * Finds files in the connected "Energy Invoices" Drive folder, skips anything
 * already imported by source_file_id, and runs the invoice extractor for new PDFs.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { saveEnergyExtraction } from "@/lib/energy/invoice-persistence";
import {
  getGoogleReauthoriseMessage,
  getValidGoogleAccessToken,
} from "@/lib/google-oauth-tokens";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_FOLDER_MIME = "application/vnd.google-apps.folder";
const MAX_FILES_PER_SYNC = 20;

interface DetectedFolder {
  category: string;
  files: number;
  folderId: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  folderPath: string;
}

function hasAiInvoiceExtractorConfig() {
  return Boolean(
    process.env.OPENROUTER_API_KEY ||
      process.env.VITE_OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY,
  );
}

async function listDriveFiles(
  folderId: string,
  folderPath: string,
  accessToken?: string | null,
) {
  if (!GOOGLE_API_KEY && !accessToken) return [];

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false and mimeType != '${GOOGLE_FOLDER_MIME}'`,
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

  if (!res.ok) {
    throw new Error(`Google Drive returned ${res.status}`);
  }

  const data = await res.json();
  return ((data.files ?? []) as Omit<DriveFile, "folderPath">[]).map(
    (file) => ({
      ...file,
      folderPath,
    }),
  );
}

async function listDriveFilesRecursive(
  folderId: string,
  folderPath = "",
  accessToken?: string | null,
  depth = 0,
): Promise<DriveFile[]> {
  if (!GOOGLE_API_KEY && !accessToken) return [];
  if (depth > 6) return [];

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,modifiedTime,size)",
    pageSize: "100",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
    orderBy: "name",
  });
  if (!accessToken && GOOGLE_API_KEY) params.set("key", GOOGLE_API_KEY);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  );

  if (!res.ok) {
    throw new Error(`Google Drive returned ${res.status}`);
  }

  const data = await res.json();
  const files: DriveFile[] = [];

  for (const item of (data.files ?? []) as Omit<DriveFile, "folderPath">[]) {
    const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
    if (item.mimeType === GOOGLE_FOLDER_MIME) {
      files.push(
        ...(await listDriveFilesRecursive(
          item.id,
          itemPath,
          accessToken,
          depth + 1,
        )),
      );
    } else {
      files.push({
        ...item,
        folderPath: folderPath || "root",
      });
    }
  }

  return files;
}

async function downloadDriveFile(fileId: string, accessToken?: string | null) {
  if (!GOOGLE_API_KEY && !accessToken) {
    throw new Error("Google Drive access is not configured");
  }

  const params = new URLSearchParams({ alt: "media" });
  if (!accessToken && GOOGLE_API_KEY) params.set("key", GOOGLE_API_KEY);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?${params}`,
    accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  );

  if (!res.ok) {
    throw new Error(`Failed to download Drive file: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer()).toString("base64");
}

function isSupportedInvoiceFile(file: DriveFile) {
  const lowerName = file.name.toLowerCase();
  return file.mimeType === "application/pdf" || lowerName.endsWith(".pdf");
}

function isAiProviderAuthError(errors?: string[]) {
  return (errors ?? []).some((error) =>
    /401|user not found|unauthorized|invalid api key/i.test(error),
  );
}

export const POST = protectedRoute(async (auth) => {
  const orgId = auth.organizationId;
  if (!orgId) return apiError("Missing organizationId", 400);

  const supabase = createServiceRoleClient();

  const { data: connection } = await supabase
    .from("school_data_connections")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .single();

  if (!connection) {
    return apiSuccess({
      success: true,
      processed: 0,
      skipped: 0,
      failed: 0,
      message:
        "No connected school data folder found. Connect Drive in Settings > Data Connections first.",
      results: [],
    });
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

  if (!GOOGLE_API_KEY && !accessToken) {
    return apiError("Google Drive access is not configured", 500);
  }

  const detectedFolders = (connection.detected_folders ?? {}) as Record<
    string,
    DetectedFolder
  >;
  const energyFolders = Object.entries(detectedFolders).filter(
    ([, folder]) => folder.category === "energy",
  );
  const folderEntries =
    energyFolders.length > 0 ? energyFolders : Object.entries(detectedFolders);

  if (folderEntries.length === 0) {
    return apiSuccess({
      success: true,
      processed: 0,
      skipped: 0,
      failed: 0,
      message:
        "No files have been detected in the connected Schoolgle folder yet. Add invoice PDFs, then rescan the data connection.",
      results: [],
    });
  }

  const allFiles =
    energyFolders.length > 0
      ? (
          await Promise.all(
            folderEntries.map(([folderPath, folder]) =>
              listDriveFiles(folder.folderId, folderPath, accessToken),
            ),
          )
        ).flat()
      : (await listDriveFilesRecursive(
          connection.folder_id,
          "",
          accessToken,
        )).filter((file) => {
          const path = file.folderPath.toLowerCase();
          return (
            path.includes("energy") ||
            path.includes("utilities") ||
            path.includes("utility bills") ||
            path.includes("electricity invoices") ||
            path.includes("gas invoices")
          );
        });

  const supportedFiles = allFiles.filter(isSupportedInvoiceFile);
  const fileIds = supportedFiles.map((file) => file.id);

  const { data: existingRows } =
    fileIds.length > 0
      ? await supabase
          .from("energy_invoices")
          .select("source_file_id")
          .eq("organization_id", orgId)
          .in("source_file_id", fileIds)
      : { data: [] };

  const existingFileIds = new Set(
    (existingRows ?? [])
      .map((row) => row.source_file_id)
      .filter((fileId): fileId is string => Boolean(fileId)),
  );
  const newFiles = supportedFiles
    .filter((file) => !existingFileIds.has(file.id))
    .slice(0, MAX_FILES_PER_SYNC);

  const results: Array<Record<string, unknown>> = [];
  let processed = 0;
  let failed = 0;

  if (newFiles.length === 0) {
    return apiSuccess({
      success: true,
      processed,
      skipped: supportedFiles.length,
      failed,
      available: allFiles.length,
      supported: supportedFiles.length,
      message:
        supportedFiles.length > 0
          ? "No new energy invoice PDFs to import."
          : energyFolders.length > 0
            ? "No PDF invoices were found in the Energy Invoices folder."
            : "No PDF files were found in the connected Schoolgle folders. Put invoice PDFs in Estates / Energy Invoices, then rescan.",
      results,
    });
  }

  if (!hasAiInvoiceExtractorConfig()) {
    return apiError(
      "Energy invoice extraction is not configured on this local server. Add OPENROUTER_API_KEY or OPENAI_API_KEY to apps/platform/.env.local and restart the dev server.",
      500,
    );
  }

  const { extractEnergyInvoice } = await import(
    "@/lib/energy/invoice-extractor"
  );

  for (const file of newFiles) {
    try {
      const pdfBase64 = await downloadDriveFile(file.id, accessToken);
      const extraction = await extractEnergyInvoice(pdfBase64, file.name);
      const saved = await saveEnergyExtraction({
        organizationId: orgId,
        fileId: file.id,
        fileName: file.name,
        result: extraction,
      });

      if (saved.success) processed++;
      else failed++;

      results.push({
        fileId: file.id,
        fileName: file.name,
        folderPath: file.folderPath,
        ...saved,
      });
      if (!saved.success && isAiProviderAuthError(saved.errors)) break;
    } catch (error) {
      const errors = [error instanceof Error ? error.message : "Sync failed"];
      failed++;
      results.push({
        fileId: file.id,
        fileName: file.name,
        folderPath: file.folderPath,
        success: false,
        errors,
      });
      if (isAiProviderAuthError(errors)) break;
    }
  }

  const skipped = supportedFiles.length - newFiles.length;
  const firstError = results
    .flatMap((result) => (result.errors as string[] | undefined) ?? [])
    .find(Boolean);

  return apiSuccess({
    success: true,
    processed,
    skipped,
    failed,
    available: allFiles.length,
    supported: supportedFiles.length,
    message:
      processed > 0
        ? `Imported ${processed} energy invoice${processed === 1 ? "" : "s"}${
            failed > 0 ? `; ${failed} failed extraction.` : "."
          }`
        : failed > 0
          ? `Found ${newFiles.length} invoice PDF${
              newFiles.length === 1 ? "" : "s"
            }, but extraction failed. ${
              firstError ?? "Check the AI provider configuration."
            }`
          : "No new energy invoice PDFs to import.",
    results,
  });
});
