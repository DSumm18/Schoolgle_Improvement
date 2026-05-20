import { NextResponse } from "next/server";
import { protectedRoute, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  getGoogleReauthoriseMessage,
  getValidGoogleAccessToken,
} from "@/lib/google-oauth-tokens";
import {
  ensureConnectorFolderStructure,
  findChildFolder,
} from "@/lib/google-drive-connector";
import { matchSiamsEvidence } from "@/lib/siams/evidence-scan";

const SKIP_FILES = new Set([".gitkeep", ".ds_store", "thumbs.db", "desktop.ini"]);
const SKIP_FOLDER_NAMES = new Set(["_archive - do not scan"]);

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

interface ScanConnection {
  id: string;
  folderId: string;
  accessToken: string;
}

interface ScannedFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  folderPath: string;
}

interface QuestionEvidenceGroup {
  strandId: string;
  questionId: string;
  items: Array<{
    documentId: string;
    documentName: string;
    matchedAt: string;
    confidence: string;
  }>;
}

function getErrorMessage(error: unknown, fallback = "SIAMS scan failed"): string {
  return error instanceof Error ? error.message : fallback;
}

async function resolveScanConnection({
  supabase,
  orgId,
  connectionId,
}: {
  supabase: ReturnType<typeof createServiceRoleClient>;
  orgId: string;
  connectionId?: string | null;
}): Promise<ScanConnection> {
  let connectorQuery = supabase
    .from("school_data_connections")
    .select("*")
    .eq("organization_id", orgId)
    .eq("provider", "google")
    .eq("is_active", true);

  connectorQuery = connectionId
    ? connectorQuery.eq("id", connectionId)
    : connectorQuery.order("last_scan_at", { ascending: false }).limit(1);

  const { data: connector, error } = await connectorQuery.maybeSingle();
  if (error) throw error;
  if (!connector) throw new Error("No active Google Drive connector found");

  try {
    const accessToken = await getValidGoogleAccessToken({
      supabase,
      connection: connector,
    });
    if (!accessToken) {
      throw new Error(getGoogleReauthoriseMessage());
    }
    return {
      id: connector.id,
      folderId: connector.folder_id,
      accessToken,
    };
  } catch (err) {
    const rawMessage =
      err instanceof Error ? err.message : "Google Drive token refresh failed";
    throw new Error(
      rawMessage.includes("invalid_grant")
        ? getGoogleReauthoriseMessage()
        : rawMessage,
    );
  }
}

export const POST = protectedRoute(async (auth, req) => {
  const { connectionId } = await req.json();
  const orgId = auth.organizationId;

  if (!orgId) {
    return apiError("Missing organization context", 400);
  }

  const supabase = createServiceRoleClient();
  let scanConnection: ScanConnection;

  try {
    scanConnection = await resolveScanConnection({
      supabase,
      orgId,
      connectionId,
    });
  } catch (err) {
    return apiError(getErrorMessage(err, "No active Google Drive connector found"), 404);
  }

  await supabase
    .from("school_data_connections")
    .update({ scan_status: "scanning", scan_error: null })
    .eq("id", scanConnection.id);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({
          type: "progress",
          message: "Preparing SIAMS folder structure...",
          filesScanned: 0,
          filesTotal: 0,
          evidenceFound: 0,
        });

        await ensureConnectorFolderStructure(
          scanConnection.accessToken,
          scanConnection.folderId,
          { appKeys: ["siams-readiness"] },
        );

        const siamsFolder = await findChildFolder(
          scanConnection.accessToken,
          scanConnection.folderId,
          "SIAMS Readiness",
        );

        if (!siamsFolder) {
          throw new Error("SIAMS Readiness folder could not be found or created");
        }

        const files: ScannedFile[] = [];
        const foldersToScan: Array<{ id: string; path: string }> = [
          { id: siamsFolder.id, path: "SIAMS Readiness" },
        ];
        const scannedFolders = new Set<string>();
        const detectedFolders: Record<
          string,
          { category: string; files: number; folderId: string }
        > = {};

        while (foldersToScan.length > 0) {
          const { id: currentFolder, path: currentPath } = foldersToScan.pop()!;
          if (scannedFolders.has(currentFolder)) continue;
          scannedFolders.add(currentFolder);

          let pageToken: string | undefined;
          do {
            const params = new URLSearchParams({
              q: `'${currentFolder}' in parents and trashed = false`,
              fields: "nextPageToken,files(id,name,mimeType,modifiedTime,size)",
              pageSize: "100",
              supportsAllDrives: "true",
              includeItemsFromAllDrives: "true",
            });
            if (pageToken) params.set("pageToken", pageToken);

            const response = await fetch(
              `https://www.googleapis.com/drive/v3/files?${params}`,
              {
                headers: {
                  Authorization: `Bearer ${scanConnection.accessToken}`,
                },
              },
            );

            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              throw new Error(
                payload.error?.message || `Drive API error: ${response.status}`,
              );
            }

            const data = await response.json();
            const items: DriveItem[] = data.files || [];

            for (const item of items) {
              const isFolder =
                item.mimeType === "application/vnd.google-apps.folder";
              const itemPath = `${currentPath}/${item.name}`;

              if (isFolder) {
                if (SKIP_FOLDER_NAMES.has(item.name.toLowerCase())) continue;
                foldersToScan.push({ id: item.id, path: itemPath });
                continue;
              }

              if (SKIP_FILES.has(item.name.toLowerCase())) continue;
              if (!detectedFolders[currentPath]) {
                detectedFolders[currentPath] = {
                  category: "documents",
                  files: 0,
                  folderId: currentFolder,
                };
              }
              detectedFolders[currentPath].files++;
              files.push({
                id: item.id,
                name: item.name,
                mimeType: item.mimeType,
                modifiedTime: item.modifiedTime,
                size: item.size,
                folderPath: currentPath,
              });
            }

            pageToken = data.nextPageToken;
          } while (pageToken);

          send({
            type: "progress",
            message: `Scanned ${scannedFolders.size} SIAMS folders, ${files.length} files...`,
            filesScanned: scannedFolders.size,
            filesTotal: scannedFolders.size + foldersToScan.length,
            evidenceFound: files.length,
          });
        }

        let evidenceMatches = 0;
        const questionEvidence = new Map<string, QuestionEvidenceGroup>();

        for (const file of files) {
          const matches = matchSiamsEvidence({
            fileName: file.name,
            folderPath: file.folderPath,
          });

          if (matches.length === 0) continue;

          const documentLink = `https://drive.google.com/open?id=${encodeURIComponent(
            file.id,
          )}`;
          const { data: document, error: documentError } = await supabase
            .from("documents")
            .upsert(
              {
                organization_id: orgId,
                user_id: auth.userId,
                name: file.name,
                file_type: file.mimeType,
                file_size: file.size ? Number(file.size) : null,
                provider: "google_drive",
                external_id: file.id,
                web_view_link: documentLink,
                folder_path: file.folderPath,
                content: null,
                metadata: {
                  appKey: "siams-readiness",
                  source: "schoolgle_connector",
                  modifiedTime: file.modifiedTime || null,
                },
                updated_at: new Date().toISOString(),
              },
              { onConflict: "external_id" },
            )
            .select("id,name,web_view_link,folder_path")
            .maybeSingle();

          if (documentError || !document) {
            console.warn("[SIAMS Scan] Document upsert failed:", documentError);
            continue;
          }

          const evidenceRows = matches.map((match) => ({
            organization_id: orgId,
            document_id: document.id,
            strand_id: match.strand_id,
            question_id: match.question_id,
            confidence: match.confidence,
            matched_keywords: match.matched_keywords,
            relevance_explanation: match.relevance_explanation,
            key_quotes: [],
            document_link: documentLink,
          }));

          const { data: savedMatches, error: evidenceError } = await supabase
            .from("siams_evidence_matches")
            .upsert(evidenceRows, {
              onConflict: "organization_id,document_id,question_id",
            })
            .select("question_id,strand_id,confidence");

          if (evidenceError) {
            console.warn("[SIAMS Scan] Evidence match upsert failed:", evidenceError);
            continue;
          }

          for (const savedMatch of savedMatches || []) {
            evidenceMatches++;
            const key = savedMatch.question_id;
            let current = questionEvidence.get(key);
            if (!current) {
              current = {
                strandId: savedMatch.strand_id,
                questionId: savedMatch.question_id,
                items: [],
              };
              questionEvidence.set(key, current);
            }
            current.items.push({
              documentId: String(document.id),
              documentName: document.name || file.name,
              matchedAt: new Date().toISOString(),
              confidence: savedMatch.confidence,
            });
          }
        }

        for (const question of questionEvidence.values()) {
          await supabase.from("siams_assessments").upsert(
            {
              organization_id: orgId,
              strand_id: question.strandId,
              question_id: question.questionId,
              evidence_count: question.items.length,
              evidence_items: question.items,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "organization_id,question_id" },
          );
        }

        await supabase
          .from("school_data_connections")
          .update({
            scan_status: "complete",
            scan_error: null,
            last_scan_at: new Date().toISOString(),
            total_files: files.length,
            total_folders: scannedFolders.size,
            detected_folders: detectedFolders,
          })
          .eq("id", scanConnection.id);

        send({
          type: "complete",
          message: `SIAMS scan complete. Found ${evidenceMatches} evidence links across ${files.length} files.`,
          filesScanned: scannedFolders.size,
          filesTotal: scannedFolders.size,
          evidenceFound: evidenceMatches,
        });
      } catch (err) {
        const message = getErrorMessage(err);
        console.error("[SIAMS Scan] Error:", err);

        await supabase
          .from("school_data_connections")
          .update({
            scan_status: "error",
            scan_error: message,
          })
          .eq("id", scanConnection.id);

        send({
          type: "error",
          message,
          filesScanned: 0,
          filesTotal: 0,
          evidenceFound: 0,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
