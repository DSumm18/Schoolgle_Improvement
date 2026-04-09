import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/** Internal base URL for calling the inspect API during scan */
const INTERNAL_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3002");

// Ofsted EIF 2025 evidence categories with keywords
// 6 Key Judgement Areas + Safeguarding (assessed separately)
// Matched against BOTH folder names and file names (case-insensitive)
const EVIDENCE_CATEGORIES: Record<string, string[]> = {
  Inclusion: [
    "SEND",
    "SEN",
    "special educational needs",
    "inclusion",
    "SENCO",
    "EHC",
    "EHCP",
    "graduated approach",
    "provision map",
    "pupil premium",
    "disadvantaged",
    "intervention",
    "differentiation",
    "adaptive teaching",
    "EAL",
    "more able",
    "catch up",
    "tutoring",
    "mental health",
    "wellbeing",
    "well-being",
    "SEMH",
    "nurture",
    "ELSA",
    "thrive",
    "zones of regulation",
    "mental health lead",
  ],
  "Curriculum and Teaching": [
    "curriculum",
    "teaching",
    "learning",
    "assessment",
    "phonics",
    "reading",
    "literacy",
    "maths",
    "mathematics",
    "english",
    "science",
    "pedagogy",
    "CPD",
    "moderation",
    "marking",
    "feedback",
    "homework",
    "subject leader",
    "medium term plan",
    "long term plan",
    "scheme of work",
    "knowledge organiser",
    "lesson observation",
    "work scrutiny",
  ],
  Achievement: [
    "progress",
    "attainment",
    "achievement",
    "outcomes",
    "KS2 results",
    "KS1 results",
    "EYFS",
    "GLD",
    "baseline",
    "data",
    "transition",
    "destinations",
    "secondary ready",
    "phonics results",
  ],
  "Attendance and Behaviour": [
    "behaviour",
    "behavior",
    "attendance",
    "exclusion",
    "suspension",
    "bullying",
    "anti-bullying",
    "pastoral",
    "conduct",
    "uniform",
    "rewards",
    "sanctions",
    "positive handling",
    "restraint",
    "de-escalation",
    "lates",
    "persistent absence",
    "CME",
    "children missing",
    "relationships",
  ],
  "Personal Development and Well-being": [
    "SMSC",
    "spiritual",
    "moral",
    "social",
    "cultural",
    "British values",
    "careers",
    "CEIAG",
    "enrichment",
    "extra-curricular",
    "trips",
    "visits",
    "character",
    "resilience",
    "citizenship",
    "RSE",
    "RSHE",
    "PSHE",
    "assembly",
    "collective worship",
    "charity",
    "volunteering",
    "student voice",
    "pupil voice",
    "school council",
    "eco",
    "healthy eating",
    "physical activity",
    "sport premium",
    "personal development",
  ],
  "Leadership and Governance": [
    "SDP",
    "school development plan",
    "SEF",
    "self-evaluation",
    "governor",
    "governance",
    "staff development",
    "performance management",
    "appraisal",
    "budget",
    "finance",
    "strategic",
    "school vision",
    "improvement plan",
    "action plan",
    "monitoring",
    "quality assurance",
    "minutes",
    "headteacher report",
    "staff wellbeing",
    "workload",
    "recruitment",
    "retention",
    "induction",
    "ECT",
    "NQT",
    "succession",
    "equality",
    "diversity",
    "accessibility",
    "complaints",
    "whistleblowing",
    "admissions",
    "GDPR",
    "data protection",
    "privacy",
    "FOI",
    "leadership",
  ],
  Safeguarding: [
    "safeguarding",
    "child protection",
    "DBS",
    "SCR",
    "single central record",
    "DSL",
    "designated safeguarding lead",
    "KCSIE",
    "keeping children safe",
    "prevent",
    "FGM",
    "CSE",
    "county lines",
    "online safety",
    "e-safety",
    "risk assessment",
    "fire",
    "first aid",
    "health and safety",
    "medical",
    "allergy",
    "anaphylaxis",
    "intimate care",
    "safer recruitment",
    "low level concerns",
    "allegation",
    "LADO",
    "section 175",
    "section 157",
    "CPOMS",
    "MyConcern",
    "operation encompass",
    "early help",
    "MASH",
    "referral",
    "TAF",
    "CIN",
    "LAC",
    "looked after",
    "young carer",
  ],
};

// Files to skip (placeholders, system files)
const SKIP_FILES = new Set([
  ".gitkeep",
  ".ds_store",
  "thumbs.db",
  "desktop.ini",
]);

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

interface EvidenceMatch {
  name: string;
  driveId: string;
  category: string;
  matchedKeywords: string[];
  confidence: number;
  path: string; // folder path for context
  modifiedTime?: string;
}

/**
 * Match a name against all evidence categories.
 * Returns array of matches (a name can match multiple categories).
 */
function matchName(
  name: string,
): Array<{ category: string; keywords: string[]; confidence: number }> {
  // Normalize: lowercase, replace underscores/hyphens with spaces
  const normalized = name.toLowerCase().replace(/[_-]/g, " ");
  const matches: Array<{
    category: string;
    keywords: string[];
    confidence: number;
  }> = [];

  for (const [category, keywords] of Object.entries(EVIDENCE_CATEGORIES)) {
    const matched = keywords.filter((kw) => {
      const kwLower = kw.toLowerCase();
      // For short keywords (≤4 chars like EAL, ECT, SEN, RSE), use word boundary matching
      // to avoid false positives (e.g. "EAL" matching "hEALth")
      if (kwLower.length <= 4) {
        const wordBoundary = new RegExp(
          `\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        );
        return wordBoundary.test(normalized);
      }
      return (
        normalized.includes(kwLower) ||
        normalized.includes(kwLower.replace(/ /g, ""))
      );
    });

    if (matched.length > 0) {
      // Higher confidence for more keyword matches, and for exact/close matches
      const confidence = Math.min(100, matched.length * 25 + 25);
      matches.push({ category, keywords: matched, confidence });
    }
  }

  return matches;
}

/**
 * POST /api/ofsted/connections/scan
 * Scan a connected Google Drive folder for Ofsted evidence.
 * Matches BOTH folder names and file names against evidence keywords.
 * Returns SSE stream with progress updates.
 */
export const POST = protectedRoute(async (auth, req) => {
  const { connectionId, folderId } = await req.json();

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !folderId) {
    return apiError("Missing organizationId or folderId", 400);
  }

  if (!GOOGLE_API_KEY) {
    return apiError("Google Drive not configured", 500);
  }

  const supabase = createServiceRoleClient();

  if (connectionId) {
    await supabase
      .from("ofsted_drive_connections")
      .update({ scan_status: "scanning", scan_error: null })
      .eq("id", connectionId);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({
          type: "progress",
          message: "Scanning folder structure...",
          filesScanned: 0,
          filesTotal: 0,
          evidenceFound: 0,
        });

        // Walk the entire folder tree, collecting both folders and files
        const allMatches: EvidenceMatch[] = [];
        const foldersToScan: Array<{ id: string; path: string }> = [
          { id: folderId, path: "" },
        ];
        const scannedFolders = new Set<string>();
        let realFiles = 0;

        while (foldersToScan.length > 0) {
          const { id: currentFolder, path: currentPath } = foldersToScan.pop()!;
          if (scannedFolders.has(currentFolder)) continue;
          scannedFolders.add(currentFolder);

          let pageToken: string | undefined;
          do {
            const params = new URLSearchParams({
              key: GOOGLE_API_KEY!,
              q: `'${currentFolder}' in parents and trashed = false`,
              fields: "nextPageToken,files(id,name,mimeType,modifiedTime,size)",
              pageSize: "100",
              supportsAllDrives: "true",
              includeItemsFromAllDrives: "true",
            });
            if (pageToken) params.set("pageToken", pageToken);

            const res = await fetch(
              `https://www.googleapis.com/drive/v3/files?${params}`,
            );
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(
                err.error?.message || `Drive API error: ${res.status}`,
              );
            }

            const data = await res.json();
            const items: DriveItem[] = data.files || [];

            for (const item of items) {
              const isFolder =
                item.mimeType === "application/vnd.google-apps.folder";
              const itemPath = currentPath
                ? `${currentPath}/${item.name}`
                : item.name;

              if (isFolder) {
                // Only recurse into subfolders — folders are NOT evidence
                foldersToScan.push({ id: item.id, path: itemPath });
              } else {
                // Skip placeholder files
                if (SKIP_FILES.has(item.name.toLowerCase())) continue;

                realFiles++;

                // Match file name against evidence categories
                const fileMatches = matchName(item.name);
                for (const m of fileMatches) {
                  allMatches.push({
                    name: item.name,
                    driveId: item.id,
                    category: m.category,
                    matchedKeywords: m.keywords,
                    confidence: m.confidence,
                    path: itemPath,
                    modifiedTime: item.modifiedTime,
                  });
                }

                // Also check parent folder path for context matches
                if (fileMatches.length === 0 && currentPath) {
                  const pathMatches = matchName(currentPath);
                  for (const m of pathMatches) {
                    allMatches.push({
                      name: item.name,
                      driveId: item.id,
                      category: m.category,
                      matchedKeywords: [
                        `(from folder: ${m.keywords.join(", ")})`,
                      ],
                      confidence: Math.max(20, m.confidence - 20), // Lower confidence for path-only matches
                      path: itemPath,
                      modifiedTime: item.modifiedTime,
                    });
                  }
                }
              }
            }

            pageToken = data.nextPageToken;
          } while (pageToken);

          send({
            type: "progress",
            message: `Scanned ${scannedFolders.size} folders, ${realFiles} files...`,
            filesScanned: scannedFolders.size,
            filesTotal: scannedFolders.size + foldersToScan.length,
            evidenceFound: allMatches.length,
          });
        }

        // Deduplicate: unique by (category, name, driveId)
        const uniqueKey = (m: EvidenceMatch) => `${m.category}|${m.driveId}`;
        const seen = new Set<string>();
        const dedupedMatches = allMatches.filter((m) => {
          const key = uniqueKey(m);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        send({
          type: "progress",
          message: `Saving ${dedupedMatches.length} evidence matches...`,
          filesScanned: scannedFolders.size,
          filesTotal: scannedFolders.size,
          evidenceFound: dedupedMatches.length,
        });

        // Store results and collect IDs for auto-inspection
        const savedRecords: Array<{
          id: string;
          driveId: string;
          fileName: string;
          category: string;
          modifiedTime?: string;
          previouslyInspected: boolean;
          modifiedSinceInspection: boolean;
        }> = [];

        for (const match of dedupedMatches) {
          // Check if this document was already inspected and hasn't changed
          const { data: existing } = await supabase
            .from("ofsted_document_checks")
            .select("id, inspected_at, found_modified_at, inspection_verdict")
            .eq("organization_id", orgId)
            .eq("evaluation_area", match.category)
            .eq("expected_document", match.matchedKeywords.join(", "))
            .maybeSingle();

          const wasInspected = !!existing?.inspected_at;
          const modifiedSinceInspection =
            wasInspected &&
            match.modifiedTime &&
            existing?.found_modified_at &&
            new Date(match.modifiedTime) > new Date(existing.found_modified_at);

          const { data: upserted } = await supabase
            .from("ofsted_document_checks")
            .upsert(
              {
                organization_id: orgId,
                connection_id: connectionId || null,
                evaluation_area: match.category,
                expected_document: match.matchedKeywords.join(", "),
                found: true,
                found_filename: match.name,
                found_path: match.driveId,
                found_modified_at: match.modifiedTime || null,
                priority: match.confidence >= 50 ? "required" : "recommended",
                checked_at: new Date().toISOString(),
                // Clear inspection if document was modified since last inspection
                ...(modifiedSinceInspection
                  ? {
                      inspection_verdict: null,
                      inspection_summary: null,
                      inspection_actions: null,
                      inspection_detail: null,
                      inspected_at: null,
                    }
                  : {}),
              },
              {
                onConflict: "organization_id,evaluation_area,expected_document",
              },
            )
            .select("id")
            .single();

          if (upserted) {
            savedRecords.push({
              id: upserted.id,
              driveId: match.driveId,
              fileName: match.name,
              category: match.category,
              modifiedTime: match.modifiedTime,
              previouslyInspected: wasInspected && !modifiedSinceInspection,
              modifiedSinceInspection: !!modifiedSinceInspection,
            });
          }
        }

        // Auto-inspect documents that need it (new or modified since last inspection)
        const toInspect = savedRecords.filter((r) => !r.previouslyInspected);

        if (toInspect.length > 0 && OPENROUTER_API_KEY) {
          send({
            type: "progress",
            message: `Inspecting ${toInspect.length} documents against framework requirements...`,
            filesScanned: scannedFolders.size,
            filesTotal: scannedFolders.size,
            evidenceFound: dedupedMatches.length,
          });

          let inspected = 0;
          for (const record of toInspect) {
            try {
              send({
                type: "progress",
                message: `Inspecting ${record.fileName} (${inspected + 1}/${toInspect.length})...`,
                filesScanned: scannedFolders.size,
                filesTotal: scannedFolders.size,
                evidenceFound: dedupedMatches.length,
              });

              // Call the inspect API internally
              const inspectRes = await fetch(
                `${INTERNAL_BASE_URL}/api/ofsted/inspect`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    organizationId: orgId,
                    driveFileId: record.driveId,
                    fileName: record.fileName,
                    evidenceId: record.id,
                    requirementName: record.category,
                  }),
                },
              );

              if (inspectRes.ok) {
                const result = await inspectRes.json();
                console.log(
                  `[Scan] Inspected ${record.fileName}: ${result.inspection?.verdict || "unknown"}`,
                );
              } else {
                console.error(
                  `[Scan] Inspect failed for ${record.fileName}: ${inspectRes.status}`,
                );
              }
            } catch (inspectErr: any) {
              console.error(
                `[Scan] Inspect error for ${record.fileName}:`,
                inspectErr.message,
              );
            }
            inspected++;
          }
        }

        // Update connection stats
        if (connectionId) {
          await supabase
            .from("ofsted_drive_connections")
            .update({
              scan_status: "idle",
              scan_error: null,
              last_scan_at: new Date().toISOString(),
              total_files_scanned: realFiles,
              total_evidence_found: dedupedMatches.length,
            })
            .eq("id", connectionId);
        }

        const skippedCount = savedRecords.filter(
          (r) => r.previouslyInspected,
        ).length;
        const inspectedCount = toInspect.length;

        send({
          type: "complete",
          message: `Scan complete! Found ${dedupedMatches.length} evidence matches across ${scannedFolders.size} folders and ${realFiles} files.${inspectedCount > 0 ? ` Inspected ${inspectedCount} documents.` : ""}${skippedCount > 0 ? ` Skipped ${skippedCount} unchanged documents.` : ""}`,
          filesScanned: scannedFolders.size,
          filesTotal: scannedFolders.size,
          evidenceFound: dedupedMatches.length,
        });
      } catch (err: any) {
        console.error("[Scan] Error:", err);

        if (connectionId) {
          await supabase
            .from("ofsted_drive_connections")
            .update({
              scan_status: "error",
              scan_error: err.message || "Scan failed",
            })
            .eq("id", connectionId);
        }

        send({
          type: "error",
          message: err.message || "Scan failed",
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
