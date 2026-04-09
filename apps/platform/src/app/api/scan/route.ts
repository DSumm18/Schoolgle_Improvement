import { NextRequest, NextResponse } from "next/server";
import {
  listGoogleFilesRecursive,
  listOneDriveFilesRecursive,
  getGoogleFileContent,
  getOneDriveFileContent,
  exportGoogleDoc,
  shouldRescanFile,
  type FileMetadataExtended,
  type ScanProgress,
} from "@/lib/cloud-service";
import { createClient } from "@supabase/supabase-js";
import { parseDocx, parseExcel, parseImage } from "@/lib/extractors";
// @ts-expect-error - Auto-masked during strict compilation enforcement
import { matchDocumentToEvidenceRequirements } from "@schoolgle/core-ai/ai-evidence-matcher";
import {
  updateAssessmentsFromEvidence,
  generateCategorySummaries,
} from "@/lib/assessment-updater";
import {
  assessAllAreas,
  qualityResultToAssessmentUpdate,
  type DfEBenchmarkData,
} from "@/lib/ai-quality-assessor";
import { generateSmartTasks } from "@/lib/smart-task-generator";
import { generateEmbedding } from "@/lib/embeddings";
import { scanRequestSchema, validateRequest } from "@/lib/validations";
import { scanLimiter } from "@/lib/rateLimit";
import { logger, createOperationLogger } from "@/lib/logger";
import { withAuth } from "@/lib/auth-middleware";

// --- Types ---

interface ScanRequest {
  provider: "google.com" | "microsoft.com";
  accessToken: string;
  folderId?: string; // Single folder (deprecated, use folderIds)
  folderIds?: string[]; // Multiple folders
  organizationId: string; // Mandatory for multi-tenancy
  userId?: string;
  authId?: string;
  recursive?: boolean; // Default true
  maxFiles?: number; // Limit for testing
  useAI?: boolean; // Default true
}

interface ScanResult {
  status: "complete" | "partial" | "error";
  stats: {
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    evidenceMatches: number;
  };
  assessmentUpdates?: Record<string, any>;
  categorySummaries?: any[];
  errors?: string[];
}

// --- Helper Functions ---

/**
 * Extract text from file buffer based on MIME type
 */
async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileId: string,
  accessToken: string,
  provider: string,
): Promise<string> {
  const extractLogger = createOperationLogger("extractTextFromFile", {
    fileId,
    mimeType,
    provider,
  });

  try {
    // Handle Google Workspace files (export as text)
    if (provider === "google.com" && mimeType.includes("vnd.google-apps")) {
      extractLogger.debug("Exporting Google Workspace file");
      return await exportGoogleDoc(accessToken, fileId, mimeType);
    }

    // Handle DOCX
    if (mimeType.includes("wordprocessingml") || mimeType.includes("docx")) {
      extractLogger.debug("Parsing DOCX file");
      return await parseDocx(buffer);
    }

    // Handle XLSX
    if (mimeType.includes("spreadsheetml") || mimeType.includes("xlsx")) {
      extractLogger.debug("Parsing Excel file");
      return await parseExcel(buffer);
    }

    // Handle images (OCR)
    if (mimeType.includes("image")) {
      extractLogger.debug("Parsing image with OCR");
      return await parseImage(buffer, mimeType);
    }

    // Fallback: Try as plain text
    extractLogger.debug("Attempting plain text extraction");
    return buffer.toString("utf-8").substring(0, 10000);
  } catch (error) {
    extractLogger.error("Text extraction failed", undefined, error);
    return "";
  }
}

/**
 * Check if file should be processed (deduplication)
 */
async function shouldProcessFile(
  file: FileMetadataExtended,
  supabase: any,
  organizationId?: string,
  userId?: string,
): Promise<boolean> {
  if (!supabase || !organizationId || !file.modifiedTime) {
    return true; // Process if we can't check
  }

  const dedupLogger = createOperationLogger("shouldProcessFile", {
    fileId: file.id,
    organizationId,
    userId,
  });

  try {
    // Check if file exists in database and hasn't been modified
    // Priority check by organization_id per user's request
    const { data, error } = await supabase
      .from("documents")
      .select("metadata")
      .eq("metadata->>fileId", file.id)
      .eq("organization_id", organizationId)
      .single();

    if (error || !data) {
      dedupLogger.debug(
        "File not found in database for this org, will process",
      );
      return true;
    }

    const lastScannedTime = data.metadata?.scannedAt;
    const shouldRescan = shouldRescanFile(file.modifiedTime, lastScannedTime);

    dedupLogger.debug("Deduplication check complete", undefined, {
      shouldRescan,
      lastScannedTime,
      modifiedTime: file.modifiedTime,
    });

    return shouldRescan;
  } catch (error) {
    dedupLogger.error(
      "Error checking file for deduplication",
      undefined,
      error,
    );
    return true;
  }
}

// --- Main Handler ---

export async function POST(req: NextRequest) {
  // Authenticate first — orgId comes from session, not body
  return withAuth(req, async (auth) => {
    const organizationId = auth.organizationId;
    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          const sendUpdate = (data: any) => {
            controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
          };

          const scanLogger = createOperationLogger("scan-api", {
            endpoint: "/api/scan",
          });

          try {
            // Rate limiting check
            const rateLimitResult = await scanLimiter.check(req);
            if (!rateLimitResult.allowed) {
              scanLogger.warn("Rate limit exceeded");
              sendUpdate({ type: "error", message: "Rate limit exceeded" });
              controller.close();
              return;
            }

            // Parse and validate request body
            const body = await req.json();
            const validation = validateRequest(scanRequestSchema, body);

            if (!validation.success) {
              scanLogger.warn("Invalid request", undefined, undefined, {
                validationError: validation.error,
              });
              sendUpdate({
                type: "error",
                message: "Invalid request parameters",
              });
              controller.close();
              return;
            }

            const {
              provider,
              accessToken,
              folderId,
              folderIds,
              userId: bodyUserId,
              authId,
              recursive,
              maxFiles,
              useAI,
            } = validation.data;

            // Use authenticated userId, fall back to body for backward compat
            const userId = auth.userId || bodyUserId;

          // Determine which folders to scan
          const foldersToScan =
            folderIds && folderIds.length > 0
              ? folderIds
              : folderId
                ? [folderId]
                : ["root"];

          sendUpdate({
            type: "progress",
            message: `Initializing scan of ${foldersToScan.length} folder${foldersToScan.length !== 1 ? "s" : ""}...`,
            stats: {
              totalFiles: 0,
              processedFiles: 0,
              evidenceMatches: 0,
              skippedFiles: 0,
              failedFiles: 0,
            },
          });

          // Initialize Supabase
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          let supabase = null;

          if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
          }

          // Scan folder structure - support multiple folders
          let allFiles: FileMetadataExtended[] = [];

          sendUpdate({
            type: "progress",
            message: "Scanning folder structure...",
          });

          if (recursive) {
            const scanFunc =
              provider === "google.com"
                ? listGoogleFilesRecursive
                : listOneDriveFilesRecursive;

            // Scan each folder and collect all files
            for (let i = 0; i < foldersToScan.length; i++) {
              const currentFolderId = foldersToScan[i];
              sendUpdate({
                type: "progress",
                message: `Scanning folder ${i + 1}/${foldersToScan.length}...`,
              });

              const folderFiles = await scanFunc(
                accessToken,
                currentFolderId,
                (progress: ScanProgress) => {
                  sendUpdate({
                    type: "progress",
                    message: `Scanning: Found ${progress.totalFiles} files so far`,
                  });
                },
              );

              // Add folder info to distinguish files from different folders
              const filesWithFolderInfo = folderFiles.map((f) => ({
                ...f,
                folderPath:
                  currentFolderId === "root"
                    ? f.folderPath || "Root"
                    : `${currentFolderId}/${f.folderPath || ""}`,
              }));

              allFiles.push(...filesWithFolderInfo);
            }
          } else {
            const { listGoogleFiles, listOneDriveFiles } =
              await import("@/lib/cloud-service");

            // Scan each folder non-recursively
            for (let i = 0; i < foldersToScan.length; i++) {
              const currentFolderId = foldersToScan[i];
              const files =
                provider === "google.com"
                  ? await listGoogleFiles(accessToken, currentFolderId)
                  : await listOneDriveFiles(accessToken, currentFolderId);

              const filesWithInfo = files.map((f) => ({
                ...f,
                folderPath:
                  currentFolderId === "root" ? "Root" : currentFolderId,
                isFolder: false,
              }));

              allFiles.push(...filesWithInfo);
            }
          }

          const filesToProcess = allFiles
            .filter((f) => !f.isFolder)
            .slice(0, maxFiles);

          const stats = {
            totalFiles: filesToProcess.length,
            processedFiles: 0,
            skippedFiles: 0,
            failedFiles: 0,
            evidenceMatches: 0,
          };

          sendUpdate({
            type: "progress",
            message: `Found ${filesToProcess.length} files to analyze.`,
            stats,
          });

          const errors: string[] = [];
          const allEvidenceMatches: any[] = [];

          for (const file of filesToProcess) {
            try {
              sendUpdate({
                type: "progress",
                message: `Analyzing: ${file.name}`,
                stats,
              });

              // Check if file should be processed
              const shouldProcess = await shouldProcessFile(
                file,
                supabase,
                organizationId,
                userId,
              );

              if (!shouldProcess) {
                stats.skippedFiles++;
                sendUpdate({
                  type: "progress",
                  message: `Skipped (unchanged): ${file.name}`,
                  stats,
                });
                continue;
              }

              // Download file
              let buffer: Buffer;
              try {
                if (provider === "google.com") {
                  buffer = await getGoogleFileContent(accessToken, file.id);
                } else {
                  buffer = await getOneDriveFileContent(accessToken, file.id);
                }
              } catch (downloadError) {
                stats.failedFiles++;
                errors.push(`Failed to download ${file.name}`);
                continue;
              }

              // Extract text
              const text = await extractTextFromFile(
                buffer,
                file.mimeType,
                file.id,
                accessToken,
                provider,
              );

              if (!text || text.length < 50) {
                stats.skippedFiles++;
                continue;
              }

              // AI Matching
              let evidenceMatches: any[] = [];
              if (useAI) {
                try {
                  const matchResult = await matchDocumentToEvidenceRequirements(
                    text,
                    {
                      filename: file.name,
                      fileId: file.id,
                      mimeType: file.mimeType,
                      foldername: file.folderPath,
                      webViewLink: file.webViewLink,
                      modifiedTime: file.modifiedTime,
                    },
                  );

                  evidenceMatches = matchResult.matches;
                  stats.evidenceMatches += evidenceMatches.length;
                  allEvidenceMatches.push(...evidenceMatches);
                } catch (aiError: any) {
                  errors.push(
                    `AI matching failed for ${file.name}: ${aiError.message}`,
                  );
                }
              }

              // Generate embedding
              let embedding: number[] = [];
              try {
                embedding = await generateEmbedding(text.substring(0, 8000));
              } catch (e) {
                embedding = new Array(1536).fill(0);
              }

              // Store in DB
              if (supabase) {
                const { data: docData } = await supabase
                  .from("documents")
                  .upsert(
                    {
                      organization_id: organizationId,
                      user_id: userId,
                      auth_id:
                        authId || (userId?.includes("-") ? userId : null),
                      content: text.substring(0, 50000),
                      metadata: {
                        filename: file.name,
                        fileId: file.id,
                        mimeType: file.mimeType,
                        provider: provider,
                        folderPath: file.folderPath,
                        webViewLink: file.webViewLink,
                        size: file.size,
                        scannedAt: new Date().toISOString(),
                      },
                      name: file.name,
                      file_type: file.mimeType,
                      file_size: file.size,
                      provider:
                        provider === "google.com" ? "google_drive" : "onedrive",
                      external_id: file.id,
                      web_view_link: file.webViewLink,
                      folder_path: file.folderPath,
                      embedding: embedding,
                    },
                    { onConflict: "organization_id,external_id" },
                  )
                  .select("id")
                  .single();

                if (docData && evidenceMatches.length > 0) {
                  const evidenceRecords = evidenceMatches.map((match) => ({
                    organization_id: organizationId,
                    user_id: userId,
                    auth_id: authId || (userId?.includes("-") ? userId : null),
                    document_id: docData.id,
                    framework_type: "ofsted",
                    category_id: match.categoryId,
                    category_name: match.categoryName,
                    subcategory_id: match.subcategoryId,
                    subcategory_name: match.subcategoryName,
                    confidence: match.confidence,
                    matched_keywords: match.triggeredKeywords, // Using standard column name
                    relevance_explanation: match.relevanceExplanation,
                    key_quotes: match.keyQuotes,
                    document_link: file.webViewLink,
                  }));

                  await supabase
                    .from("evidence_matches")
                    .upsert(evidenceRecords, {
                      onConflict: "organization_id,document_id,subcategory_id",
                    });
                }
              }

              stats.processedFiles++;
              sendUpdate({
                type: "progress",
                message: `Processed: ${file.name} (${evidenceMatches.length} matches)`,
                stats,
              });
            } catch (fileError: any) {
              stats.failedFiles++;
              errors.push(
                `Error processing ${file.name}: ${fileError.message}`,
              );
            }
          }

          // Assessment Updates — Two-Phase:
          // Phase 1: Count-based assessment (fast, from evidence matches)
          // Phase 2: Quality-based assessment (AI specialist prompts per area)
          let assessmentUpdates = {};
          let categorySummaries: any[] = [];
          let qualityResults: any[] = [];

          if (useAI && allEvidenceMatches.length > 0) {
            // Phase 1: Count-based (backward compatible)
            assessmentUpdates =
              updateAssessmentsFromEvidence(allEvidenceMatches);
            categorySummaries = generateCategorySummaries(assessmentUpdates);

            // Phase 2: Quality assessment with area-specific AI prompts
            sendUpdate({
              type: "progress",
              message: "Running quality assessment against Ofsted criteria...",
              stats,
            });

            try {
              // Group document texts by category for quality assessment
              // We need to get the stored document content for each category's evidence
              const evidenceByArea: Record<
                string,
                { filename: string; text: string; confidence: number }[]
              > = {};

              // Build evidence-by-area from allEvidenceMatches + stored document content
              if (supabase) {
                // Get unique document IDs from evidence matches
                const docIds = [
                  ...new Set(allEvidenceMatches.map((m: any) => m.documentId)),
                ];

                // Fetch stored document content (we stored it earlier in the scan)
                const { data: docs } = await supabase
                  .from("documents")
                  .select("external_id, content, name")
                  .eq("organization_id", organizationId)
                  .in("external_id", docIds);

                const docContentMap = new Map<
                  string,
                  { content: string; name: string }
                >();
                if (docs) {
                  docs.forEach((d: any) => {
                    docContentMap.set(d.external_id, {
                      content: d.content || "",
                      name: d.name || "",
                    });
                  });
                }

                // Group by category
                for (const match of allEvidenceMatches) {
                  const catId = (match as any).categoryId;
                  if (!evidenceByArea[catId]) {
                    evidenceByArea[catId] = [];
                  }

                  const doc = docContentMap.get((match as any).documentId);
                  if (
                    doc &&
                    !evidenceByArea[catId].some((e) => e.filename === doc.name)
                  ) {
                    evidenceByArea[catId].push({
                      filename: doc.name,
                      text: doc.content.substring(0, 5000),
                      confidence: (match as any).confidence || 0.5,
                    });
                  }
                }
              }

              // Fetch DfE benchmark data if available
              let benchmarkData: DfEBenchmarkData | undefined;
              if (supabase) {
                try {
                  const { data: orgData } = await supabase
                    .from("organizations")
                    .select("school_urn")
                    .eq("id", organizationId)
                    .single();

                  if (orgData?.school_urn) {
                    // Try to get attendance data
                    const { data: attData } = await supabase
                      .from("dfe_attendance")
                      .select("overall_absence_rate, persistent_absence_rate")
                      .eq("urn", orgData.school_urn)
                      .order("time_period", { ascending: false })
                      .limit(1)
                      .single();

                    // Try to get census data
                    const { data: censusData } = await supabase
                      .from("dfe_census")
                      .select(
                        "headcount, percentage_fsm, percentage_send, percentage_eal",
                      )
                      .eq("urn", orgData.school_urn)
                      .order("time_period", { ascending: false })
                      .limit(1)
                      .single();

                    benchmarkData = {};
                    if (attData) {
                      benchmarkData.attendance = {
                        overall: 100 - (attData.overall_absence_rate || 5),
                        persistentAbsence:
                          attData.persistent_absence_rate || 18,
                        nationalAverage: 95.7,
                        nationalPA: 17.7,
                      };
                    }
                    if (censusData) {
                      benchmarkData.census = {
                        totalPupils: censusData.headcount || 0,
                        fsmPercentage: censusData.percentage_fsm || 0,
                        sendPercentage: censusData.percentage_send || 0,
                        ealPercentage: censusData.percentage_eal || 0,
                      };
                    }
                  }
                } catch (benchErr) {
                  scanLogger.warn("Could not fetch DfE benchmark data");
                }
              }

              // Run quality assessment
              qualityResults = await assessAllAreas(
                evidenceByArea,
                benchmarkData,
                (area, index, total) => {
                  sendUpdate({
                    type: "progress",
                    message: `Quality assessment: ${area} (${index}/${total})`,
                    stats,
                  });
                },
              );

              // Override count-based ratings with quality-based ratings
              for (const qr of qualityResults) {
                const update = qualityResultToAssessmentUpdate(qr);
                // Find all subcategories in this category and apply the quality rating
                const existing = Object.values(
                  assessmentUpdates as Record<string, any>,
                ).filter((u: any) =>
                  allEvidenceMatches.some(
                    (m: any) =>
                      m.categoryId === qr.categoryId &&
                      m.subcategoryId === u.subcategoryId,
                  ),
                );
                for (const sub of existing) {
                  (sub as any).aiRatingRaw = update.aiRating;
                  (sub as any).aiRationale = update.aiRationale;
                }
              }

              scanLogger.info(
                `Quality assessment completed for ${qualityResults.length} areas`,
              );
            } catch (qualityError: any) {
              scanLogger.error(
                "Quality assessment failed, using count-based ratings",
                undefined,
                qualityError,
              );
              errors.push(`Quality assessment failed: ${qualityError.message}`);
            }

            // Store assessments in DB
            if (supabase) {
              const assessmentRecords = Object.values(assessmentUpdates).map(
                (update: any) => ({
                  organization_id: organizationId,
                  subcategory_id: update.subcategoryId,
                  ai_rating: update.aiRatingRaw,
                  ai_rationale: update.aiRationale,
                  evidence_count: update.evidenceCount,
                  assessed_by: userId,
                  assessed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }),
              );

              if (assessmentRecords.length > 0) {
                await supabase
                  .from("ofsted_assessments")
                  .upsert(assessmentRecords, {
                    onConflict: "organization_id,subcategory_id",
                  });
              }

              // Generate and store smart tasks
              const smartTasks = generateSmartTasks(
                assessmentUpdates as any,
                allEvidenceMatches,
                { organizationId, userId: userId || "", authId },
              );

              if (smartTasks.length > 0) {
                await supabase.from("actions").insert(smartTasks);

                scanLogger.info(`Generated ${smartTasks.length} smart tasks`);
              }
            }
          }

          sendUpdate({
            type: "complete",
            stats,
            assessmentUpdates,
            categorySummaries,
            qualityAssessments:
              qualityResults.length > 0 ? qualityResults : undefined,
            errors: errors.length > 0 ? errors : undefined,
          });

          // Track scan completion in analytics
          try {
            await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/analytics/track`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "evidence_scan_completed",
                  properties: {
                    organizationId,
                    provider,
                    stats,
                    hasErrors: errors.length > 0,
                  },
                  timestamp: new Date().toISOString(),
                }),
              },
            );
          } catch (trackError) {
            console.error("Failed to track scan analytics:", trackError);
          }
        } catch (error: any) {
          scanLogger.error("Fatal error in scan", undefined, error);
          sendUpdate({
            type: "error",
            message: error.message || "Internal Server Error",
          });
        } finally {
          controller.close();
        }
      },
    }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    ) as any; // ReadableStream Response is compatible with NextResponse
  });
}
