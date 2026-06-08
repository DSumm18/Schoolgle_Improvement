/**
 * POST /api/imports/assessment-xml
 *
 * Imports pupil assessment data from XML files (CTF or Assessment Manager format)
 * found in the school's connected Google Drive assessments folder.
 *
 * Body: {
 *   organizationId?: string   // defaults to auth org
 *   folderId?: string         // override: use specific Drive folder ID instead of detected one
 *   fileId?: string           // import a single specific file by Drive ID
 *   dryRun?: boolean          // parse + report, don't write to DB (default: false)
 *   isDemo?: boolean          // marks a synthetic demo import
 *   demoFixtureId?: string    // reusable fixture id for demo imports
 * }
 *
 * GET /api/imports/assessment-xml?organizationId=xxx
 * Lists available XML files in the connected Google Drive assessments folder.
 *
 * Design notes:
 * - Uses GOOGLE_API_KEY (public Drive API key) — no OAuth needed for shared folders
 * - Pseudonymisation: HMAC-SHA256(UPN, organizationId) — server-side deterministic salt
 * - Writes to: school_assessment_imports + pupil_assessments_pseudo
 * - Batch inserts: 500 records per batch to stay within Supabase limits
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { parseAssessmentXML } from "@/lib/ctf-xml-parser";
import type { ParsedAssessmentRecord } from "@/lib/ctf-xml-parser";
import { mapCtfRecordsToAssessmentSpine } from "@/lib/assessment-intelligence/spine-adapter";
import { NextRequest } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const BATCH_SIZE = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

interface ImportFileResult {
  file_name: string;
  file_id: string;
  status: "complete" | "error" | "skipped_no_records" | "dry_run";
  format?: string;
  pupil_count?: number;
  record_count?: number;
  inserted_count?: number;
  import_id?: string;
  warnings?: string[];
  error?: string;
}

// ─── Drive Helpers ────────────────────────────────────────────────────────────

async function listXMLFilesInFolder(folderId: string): Promise<DriveFile[]> {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");

  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    // Match XML by mimeType or by file extension in the name
    q: `'${folderId}' in parents and trashed = false and (mimeType = 'text/xml' or mimeType = 'application/xml' or name contains '.xml')`,
    fields: "files(id,name,mimeType,modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: "50",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive list error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.files ?? []) as DriveFile[];
}

async function downloadDriveFile(fileId: string): Promise<Buffer> {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`,
  );

  if (!res.ok) {
    throw new Error(`Drive download error ${res.status}: ${res.statusText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// ─── Find Assessments Folder ──────────────────────────────────────────────────

async function findAssessmentsFolder(
  organizationId: string,
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<{ folderId: string } | null> {
  const { data } = await supabase
    .from("school_data_connections")
    .select("folder_id, detected_folders")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .eq("provider", "google")
    .single();

  if (!data) return null;

  const detected = (data.detected_folders ?? {}) as Record<
    string,
    { category: string; files: number; folderId: string }
  >;

  // Prefer the detected "assessments" subfolder
  for (const info of Object.values(detected)) {
    if (info.category === "assessments") {
      return { folderId: info.folderId };
    }
  }

  // Fallback: scan the root folder
  return { folderId: data.folder_id };
}

// ─── GET — List available XML files ──────────────────────────────────────────

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) return apiError("Missing organizationId", 400);
  if (!GOOGLE_API_KEY)
    return apiError("Google Drive integration not configured", 500);

  const supabase = createServiceRoleClient();
  const conn = await findAssessmentsFolder(organizationId, supabase);

  if (!conn) {
    return apiError(
      "No Google Drive connection found. Connect your school Drive in Settings → Data Connections.",
      404,
    );
  }

  try {
    const files = await listXMLFilesInFolder(conn.folderId);
    return apiSuccess({
      folderId: conn.folderId,
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        modifiedTime: f.modifiedTime,
      })),
      count: files.length,
    });
  } catch (err) {
    return apiError(
      `Failed to list files: ${err instanceof Error ? err.message : "Unknown error"}`,
      500,
    );
  }
});

// ─── POST — Import XML assessments ───────────────────────────────────────────

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const dryRun = body.dryRun === true;
  const singleFileId = body.fileId as string | undefined;
  const folderIdOverride = body.folderId as string | undefined;
  const isDemo = body.isDemo === true || typeof body.demoFixtureId === "string";
  const demoFixtureId =
    typeof body.demoFixtureId === "string" && body.demoFixtureId.trim()
      ? body.demoFixtureId.trim()
      : null;

  if (!organizationId) return apiError("Missing organizationId", 400);
  if (!GOOGLE_API_KEY)
    return apiError("Google Drive integration not configured", 500);

  const supabase = createServiceRoleClient();

  // Resolve which Drive folder to scan
  let folderId: string;
  if (folderIdOverride) {
    folderId = folderIdOverride;
  } else {
    const conn = await findAssessmentsFolder(organizationId, supabase);
    if (!conn) {
      return apiError(
        "No Google Drive connection found. Connect your school Drive in Settings → Data Connections.",
        404,
      );
    }
    folderId = conn.folderId;
  }

  // Get list of XML files to process
  let filesToProcess: DriveFile[];
  try {
    if (singleFileId) {
      filesToProcess = [
        {
          id: singleFileId,
          name: singleFileId,
          mimeType: "text/xml",
          modifiedTime: new Date().toISOString(),
        },
      ];
    } else {
      filesToProcess = await listXMLFilesInFolder(folderId);
    }
  } catch (err) {
    return apiError(
      `Failed to list XML files: ${err instanceof Error ? err.message : "Unknown error"}`,
      500,
    );
  }

  if (filesToProcess.length === 0) {
    return apiSuccess({
      message:
        "No XML files found in the assessments folder. Upload CTF or Assessment Manager XML exports to your Google Drive Assessments folder.",
      folderId,
      imports: [],
      summary: {
        files_processed: 0,
        files_complete: 0,
        files_errored: 0,
        total_records_inserted: 0,
        dry_run: dryRun,
      },
    });
  }

  const importResults: ImportFileResult[] = [];

  for (const file of filesToProcess) {
    const fileResult: ImportFileResult = {
      file_name: file.name,
      file_id: file.id,
      status: "error",
    };

    try {
      // Download + parse the XML
      const buffer = await downloadDriveFile(file.id);
      const parsed = parseAssessmentXML(buffer, organizationId);

      fileResult.format = parsed.format;
      fileResult.pupil_count = parsed.pupil_count;
      fileResult.record_count = parsed.records.length;
      fileResult.warnings = parsed.warnings;

      if (dryRun) {
        fileResult.status = "dry_run";
        importResults.push(fileResult);
        continue;
      }

      if (parsed.records.length === 0) {
        fileResult.status = "skipped_no_records";
        importResults.push(fileResult);
        continue;
      }

      // Derive academic_year_start + assessment_period from parsed records
      const years = parsed.records
        .map((r) => r.assessment_year)
        .filter((y): y is number => y !== null);
      const academicYearStart =
        years.length > 0 ? Math.max(...years) : new Date().getFullYear();

      const periodCounts = parsed.records
        .map((r) => r.assessment_period)
        .filter((p): p is string => Boolean(p))
        .reduce(
          (acc, p) => {
            acc[p] = (acc[p] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
      const assessmentPeriod =
        Object.entries(periodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "unknown";

      const subjects = [
        ...new Set(parsed.records.map((r) => r.subject).filter(Boolean)),
      ];
      const yearGroups = [
        ...new Set(
          parsed.records
            .map((r) => r.year_group)
            .filter((y): y is number => y !== null),
        ),
      ];

      // Create the import record
      const { data: importRecord, error: importError } = await supabase
        .from("school_assessment_imports")
        .insert({
          organization_id: organizationId,
          file_name: file.name,
          source_system: `xml_${parsed.format}`,
          academic_year_start: academicYearStart,
          assessment_period: assessmentPeriod,
          year_groups_included: yearGroups,
          total_pupils: parsed.pupil_count,
          total_records: parsed.records.length,
          subjects_included: subjects,
          status: "pseudonymised",
          pseudonymisation_method: "sha256_hmac",
          salt_hint:
            "Server-side: organizationId used as HMAC salt (deterministic, consistent across imports)",
          is_demo: isDemo,
          demo_fixture_id: demoFixtureId,
          source_display_name: isDemo ? "Synthetic demo CTF import" : "CTF assessment import",
          source_layer: "pupil_level",
        })
        .select("id")
        .single();

      if (importError || !importRecord) {
        fileResult.error = `Import record creation failed: ${importError?.message ?? "no data"}`;
        importResults.push(fileResult);
        continue;
      }

      fileResult.import_id = importRecord.id;

      // Batch-insert pseudonymised assessment records
      let insertedCount = 0;

      for (let i = 0; i < parsed.records.length; i += BATCH_SIZE) {
        const batch = parsed.records
          .slice(i, i + BATCH_SIZE)
          .map((r: ParsedAssessmentRecord) => ({
            organization_id: organizationId,
            import_id: importRecord.id,
            pupil_hash: r.pupil_hash,
            year_group: r.year_group,
            // Demographics not available in CTF/XML — populated from MIS data separately
            is_fsm: null,
            is_send: null,
            send_type: null,
            is_eal: null,
            is_pp: null,
            gender: null,
            subject: r.subject,
            assessment_period: r.assessment_period ?? assessmentPeriod,
            academic_year_start: r.assessment_year ?? academicYearStart,
            attainment_level: r.attainment_level,
            scaled_score: r.scaled_score,
            raw_score: r.raw_score,
            teacher_assessment: r.attainment_level, // mirrors attainment in teacher_assessment field
            progress_score: null,
            prior_attainment_band: null,
          }));

        const { error: batchError } = await supabase
          .from("pupil_assessments_pseudo")
          .insert(batch);

        if (batchError) {
          console.error(
            `[assessment-xml] Batch insert error (batch ${Math.floor(i / BATCH_SIZE)}):`,
            batchError,
          );
          fileResult.warnings = [
            ...(fileResult.warnings ?? []),
            `Batch ${Math.floor(i / BATCH_SIZE)} failed: ${batchError.message}`,
          ];
        } else {
          insertedCount += batch.length;
        }
      }

      // Update import status
      await supabase
        .from("school_assessment_imports")
        .update({ status: "complete" })
        .eq("id", importRecord.id);

      const spineMapping = mapCtfRecordsToAssessmentSpine({
        organizationId,
        importId: importRecord.id,
        fileName: file.name,
        parsed,
        isDemo,
        demoFixtureId,
      });

      const { data: sourceBatch, error: sourceBatchError } = await supabase
        .from("assessment_source_batches")
        .insert(spineMapping.batchInsert)
        .select("id")
        .single();

      if (sourceBatchError || !sourceBatch?.id) {
        fileResult.warnings = [
          ...(fileResult.warnings ?? []),
          `Assessment spine batch was not created: ${sourceBatchError?.message ?? "no batch id returned"}`,
        ];
      } else {
        for (let i = 0; i < spineMapping.eventInserts.length; i += BATCH_SIZE) {
          const spineBatch = spineMapping.eventInserts
            .slice(i, i + BATCH_SIZE)
            .map((event) => ({
              ...event,
              source_batch_id: sourceBatch.id,
            }));

          if (spineBatch.length === 0) continue;

          const { error: spineEventError } = await supabase
            .from("pupil_assessment_events")
            .insert(spineBatch);

          if (spineEventError) {
            fileResult.warnings = [
              ...(fileResult.warnings ?? []),
              `Assessment spine event batch ${Math.floor(i / BATCH_SIZE)} failed: ${spineEventError.message}`,
            ];
          }
        }
      }

      fileResult.inserted_count = insertedCount;
      fileResult.status = "complete";
    } catch (err) {
      fileResult.error = err instanceof Error ? err.message : "Unknown error";
      console.error(`[assessment-xml] Failed to process ${file.name}:`, err);
    }

    importResults.push(fileResult);
  }

  const totalInserted = importResults.reduce(
    (sum, r) => sum + (r.inserted_count ?? 0),
    0,
  );

  return apiSuccess({
    summary: {
      files_processed: filesToProcess.length,
      files_complete: importResults.filter((r) => r.status === "complete")
        .length,
      files_errored: importResults.filter((r) => r.status === "error").length,
      total_records_inserted: totalInserted,
      dry_run: dryRun,
    },
    imports: importResults,
  });
});
