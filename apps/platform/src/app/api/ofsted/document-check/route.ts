import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  listGoogleFilesRecursive,
  listOneDriveFilesRecursive,
} from "@/lib/cloud-service";
import type { FileMetadataExtended } from "@/lib/cloud-service";
import { resolveAndSyncOfstedDocumentChecks } from "@/lib/ofsted-readiness/document-check-sync";

interface DocumentCheckRequest {
  organizationId?: string;
  provider?: "google" | "onedrive";
  access_token?: string;
  folder_id?: string;
}

export const POST = protectedRoute(async (auth, request) => {
  const body = (await request.json()) as DocumentCheckRequest;
  const { provider, access_token: accessToken, folder_id: folderId } = body;
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const driveScanRequested = Boolean(provider || accessToken || folderId);
  if (driveScanRequested && (!provider || !accessToken || !folderId)) {
    return apiError(
      "Provide provider, access_token and folder_id for a cloud scan, or omit all three to check website evidence only.",
      400,
    );
  }

  if (
    driveScanRequested &&
    provider !== "google" &&
    provider !== "onedrive"
  ) {
    return apiError('Invalid provider. Must be "google" or "onedrive".', 400);
  }

  const driveFiles = driveScanRequested
    ? await listDriveFiles(provider!, accessToken!, folderId!)
    : [];
  const { resolved, websiteEvidence, savedDocumentChecksCount } =
    await resolveAndSyncOfstedDocumentChecks({
      organizationId,
      driveFiles,
    });

  return apiSuccess({
    ...resolved,
    website_scan: websiteEvidence.scan,
    saved_document_checks_count: savedDocumentChecksCount,
    source_precedence: [
      "website_assessed_policy",
      "website_document_inventory",
      "connected_drive",
    ],
  });
});

async function listDriveFiles(
  provider: "google" | "onedrive",
  accessToken: string,
  folderId: string,
): Promise<FileMetadataExtended[]> {
  if (provider === "google") {
    return listGoogleFilesRecursive(accessToken, folderId);
  }

  return listOneDriveFilesRecursive(accessToken, folderId);
}
