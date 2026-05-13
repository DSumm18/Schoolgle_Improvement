import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  getGoogleReauthoriseMessage,
  getValidGoogleAccessToken,
} from "@/lib/google-oauth-tokens";
import {
  matchPolicyFilesToRequirements,
  type PolicySourceFile,
} from "@/lib/compliance/policies/policy-matcher";
import type { SchoolPolicyContext } from "@/lib/compliance/policies/policy-catalogue";
import { analysePolicyReview } from "@/lib/compliance/policies/policy-review-analyser";
import { analysePolicyQuality } from "@/lib/compliance/policies/policy-quality-analyser";
import { analysePolicyDependencies } from "@/lib/compliance/policies/policy-dependency-analyser";
import {
  isConnectorArchivePath,
  isConnectorGeneratedDraftPath,
} from "@/lib/schoolgle-connector";
import { parseDocx, parsePDF } from "@/lib/extractors";

type DetectedFolder = {
  category?: string;
  files?: number;
  folderId?: string;
};

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = auth.organizationId;
  const context =
    (req.nextUrl.searchParams.get("context") as SchoolPolicyContext | null) ||
    "maintained_primary";

  if (!orgId) return apiError("Missing organization", 400);

  const supabase = createServiceRoleClient();
  const { data: connection, error } = await supabase
    .from("school_data_connections")
    .select(
      "id,provider,folder_id,folder_name,is_active,access_token_encrypted,refresh_token_encrypted,token_expiry,detected_folders,last_scan_at",
    )
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("last_scan_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) return apiError("Failed to fetch connector", 500);

  if (!connection) {
    return apiSuccess({
      files: [],
      matchResult: matchPolicyFilesToRequirements({ context, files: [] }),
      connector: null,
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

  if (!accessToken) {
    return apiError("Google Drive access is not configured", 500);
  }

  const policyFolders = getPolicyFolders(
    (connection.detected_folders || {}) as Record<string, DetectedFolder>,
  );
  const files = await listPolicyFiles(accessToken, policyFolders);
  const matchResult = matchPolicyFilesToRequirements({ context, files });
  const enrichedMatchResult = {
    ...matchResult,
    requirements: await enrichMatchesWithReviewAnalysis(
      accessToken,
      matchResult.requirements,
    ),
  };

  return apiSuccess({
    files,
    matchResult: enrichedMatchResult,
    connector: {
      id: connection.id,
      provider: connection.provider,
      folderName: connection.folder_name,
      lastScanAt: connection.last_scan_at,
      policyFolders: policyFolders.map((folder) => folder.path),
    },
  });
});

function getPolicyFolders(
  detectedFolders: Record<string, DetectedFolder>,
): Array<{ path: string; folderId: string }> {
  return Object.entries(detectedFolders)
    .filter(([path, info]) => {
      const normalisedPath = path.toLowerCase();
      return (
        !!info.folderId &&
        normalisedPath !== "root" &&
        !isConnectorArchivePath(path) &&
        !isConnectorGeneratedDraftPath(path) &&
        normalisedPath.split("/").some((part) => part.trim() === "policies")
      );
    })
    .map(([path, info]) => ({
      path,
      folderId: info.folderId!,
    }));
}

async function listPolicyFiles(
  accessToken: string,
  policyFolders: Array<{ path: string; folderId: string }>,
): Promise<PolicySourceFile[]> {
  const files: PolicySourceFile[] = [];
  const seen = new Set<string>();

  for (const folder of policyFolders) {
    const params = new URLSearchParams({
      q: `'${folder.folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: "files(id,name,mimeType,modifiedTime,size,webViewLink)",
      pageSize: "100",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      orderBy: "modifiedTime desc",
    });

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) continue;

    const data = await response.json();
    for (const file of data.files || []) {
      if (seen.has(file.id)) continue;
      seen.add(file.id);
      files.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        size: file.size,
        webViewLink: file.webViewLink,
        folderPath: folder.path,
      });
    }
  }

  return files;
}

async function enrichMatchesWithReviewAnalysis(
  accessToken: string,
  matches: ReturnType<typeof matchPolicyFilesToRequirements>["requirements"],
) {
  const enriched = [];
  const matchesToInspect = matches
    .filter((match) => match.matchedFile)
    .slice(0, 12);
  const inspectIds = new Set(
    matchesToInspect.map((match) => match.requirement.id),
  );

  for (const match of matches) {
    if (!match.matchedFile || !inspectIds.has(match.requirement.id)) {
      enriched.push({
        ...match,
        reviewAnalysis: null,
        qualityAnalysis: null,
        dependencyAnalysis: null,
      });
      continue;
    }

    const text = await extractPolicyText(accessToken, match.matchedFile);
    const reviewAnalysis = text
      ? analysePolicyReview({
          text,
          defaultReviewCycle: match.requirement.reviewCycle,
        })
      : null;
    const qualityAnalysis = text
      ? analysePolicyQuality({
          requirementId: match.requirement.id,
          text,
        })
      : null;
    const dependencyAnalysis = text
      ? analysePolicyDependencies({
          requirementId: match.requirement.id,
          text,
          allMatches: matches,
        })
      : null;

    enriched.push({
      ...match,
      reviewAnalysis,
      qualityAnalysis,
      dependencyAnalysis,
    });
  }

  return enriched;
}

async function extractPolicyText(
  accessToken: string,
  file: PolicySourceFile,
): Promise<string | null> {
  const size = Number(file.size || 0);
  if (size > 15 * 1024 * 1024) return null;

  const buffer = await downloadPolicyBuffer(accessToken, file);
  if (!buffer) return null;

  if (file.mimeType === "application/vnd.google-apps.document") {
    return buffer.toString("utf-8");
  }

  if (
    file.mimeType === "text/plain" ||
    file.name.toLowerCase().endsWith(".txt") ||
    file.name.toLowerCase().endsWith(".md")
  ) {
    return buffer.toString("utf-8");
  }

  if (
    file.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    return parseDocx(buffer);
  }

  if (file.mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return parsePDF(buffer);
  }

  return null;
}

async function downloadPolicyBuffer(
  accessToken: string,
  file: PolicySourceFile,
): Promise<Buffer | null> {
  const isGoogleDoc = file.mimeType === "application/vnd.google-apps.document";
  const url = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?${new URLSearchParams(
        { mimeType: "text/plain" },
      )}`
    : `https://www.googleapis.com/drive/v3/files/${file.id}?${new URLSearchParams(
        { alt: "media" },
      )}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}
