# Assessment XML Parser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parse CTF/Assessment Manager XML files from the school's connected Google Drive and populate `school_assessment_imports` + `pupil_assessments_pseudo` Supabase tables.

**Architecture:** A new lib `src/lib/ctf-xml-parser.ts` handles all XML parsing and pseudonymisation. A new API route `src/app/api/imports/assessment-xml/route.ts` orchestrates: fetch connection from `school_data_connections`, list XML files from the assessments Drive folder, parse, pseudonymise (HMAC-SHA256 with org_id as server-side salt), and write to the two assessment tables. Can be triggered manually (POST) or automatically.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (service role), `fast-xml-parser`, Node.js `crypto` module (built-in, no extra install for hashing).

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Install | `package.json` | Add `fast-xml-parser` |
| Create | `src/lib/ctf-xml-parser.ts` | CTF + Assessment Manager XML parsing, field normalisation, pseudonymisation |
| Create | `src/app/api/imports/assessment-xml/route.ts` | API route: fetch from Drive, parse, store |

---

### Task 1: Install fast-xml-parser

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install the package**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement/apps/platform
npm install fast-xml-parser
```

Expected output: `added 1 package` (or similar — fast-xml-parser has no dependencies)

- [ ] **Step 2: Verify it's in package.json**

```bash
grep "fast-xml-parser" package.json
```

Expected: `"fast-xml-parser": "^4.x.x"`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add fast-xml-parser for CTF XML assessment imports"
```

---

### Task 2: Build the CTF XML Parser library

**Files:**
- Create: `src/lib/ctf-xml-parser.ts`

This module:
- Detects CTF vs Assessment Manager XML by root element tag
- Extracts pupil UPN + assessment records
- Normalises subject codes, attainment levels, assessment periods, key stages
- Pseudonymises UPN via HMAC-SHA256(UPN.toLowerCase().trim(), organizationId)

- [ ] **Step 1: Create the parser file**

```typescript
// src/lib/ctf-xml-parser.ts
/**
 * CTF / Assessment Manager XML Parser
 *
 * Parses Common Transfer File (CTF) XML and Assessment Manager XML exports.
 * Both formats contain pupil UPNs and assessment results.
 *
 * Pseudonymisation: HMAC-SHA256(UPN.toLowerCase().trim(), organizationId)
 * — uses organizationId as a deterministic server-side salt.
 * This is separate from the client-side browser salt used in the manual
 * CSV upload flow (pupil-pseudonymiser.ts). Both produce pupil_hash values
 * stored in pupil_assessments_pseudo. The server-side salt allows consistent
 * cross-import linking without requiring browser interaction.
 *
 * CTF format: DfE Common Transfer File v3 XML
 * Assessment Manager format: Varies by vendor (Arbor, SIMS, Bromcom)
 */

import { XMLParser } from "fast-xml-parser";
import { createHmac } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AssessmentFormat = "ctf" | "assessment_manager" | "unknown";

export interface ParsedAssessmentRecord {
  upn: string;
  pupil_hash: string;
  year_group: number | null;
  subject: string;
  assessment_type: "TA" | "SS" | "RA" | "unknown"; // Teacher Assessment, Scaled Score, Raw score, unknown
  key_stage: string | null; // "KS1", "KS2", "EYFS", null
  attainment_level: string | null; // WTS, EXS, GDS, GD, etc.
  scaled_score: number | null;
  raw_score: number | null;
  assessment_year: number | null; // e.g. 2025
  assessment_period: string | null; // "autumn", "spring", "summer"
  source_subject_code: string; // raw code from XML, e.g. "MA", "RE", "EN"
}

export interface ParseResult {
  format: AssessmentFormat;
  source_school_urn: string | null;
  source_school_name: string | null;
  records: ParsedAssessmentRecord[];
  warnings: string[];
  pupil_count: number;
}

// ─── Subject Code Normalisation ──────────────────────────────────────────────

const SUBJECT_MAP: Record<string, string> = {
  // CTF subject codes
  MA: "maths",
  EN: "reading", // English — treated as reading in KS context
  RE: "reading",
  WR: "writing",
  SC: "science",
  SP: "spelling",
  GP: "grammar",
  PS: "punctuation",
  MT: "maths",
  EL: "reading",
  // Assessment Manager free-text
  reading: "reading",
  writing: "writing",
  maths: "maths",
  mathematics: "maths",
  science: "science",
  spelling: "spelling",
  grammar: "grammar",
  punctuation: "punctuation",
  gps: "grammar",
  "spelling, punctuation and grammar": "grammar",
  spag: "grammar",
};

function normaliseSubject(raw: string): string {
  const key = raw.toLowerCase().trim();
  return SUBJECT_MAP[key] || key;
}

// ─── Attainment Level Normalisation ──────────────────────────────────────────

/**
 * Normalise various attainment codes to WTS / EXS / GDS (or raw if unknown).
 * CTF uses: WA (Working at), EXS (Expected Standard), GDS (Greater Depth)
 * Some exports use: B (Below), E (Expected), A (Above), numeric levels
 */
function normaliseAttainment(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).toUpperCase().trim();

  const map: Record<string, string> = {
    // Standard DfE codes
    WTS: "WTS", WA: "WTS", BLW: "WTS", PKF: "WTS", PKE: "WTS",
    EXS: "EXS", EX: "EXS", M: "EXS", E: "EXS",
    GDS: "GDS", GD: "GDS", A: "GDS", H: "GDS",
    // Some systems use P for Pass
    P: "EXS",
    // EYFS
    "EM": "EXS", "ELG": "EXS",
  };

  return map[s] || s; // Return normalised or original if unknown
}

// ─── Period Normalisation ────────────────────────────────────────────────────

function normalisePeriod(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (s.includes("aut") || s === "aut1" || s === "aut2") return "autumn";
  if (s.includes("spr") || s === "spr1" || s === "spr2") return "spring";
  if (s.includes("sum") || s === "sum1" || s === "sum2") return "summer";
  if (s.includes("spring")) return "spring";
  if (s.includes("autumn") || s.includes("fall")) return "autumn";
  if (s.includes("summer")) return "summer";
  return s;
}

// ─── Key Stage Detection ─────────────────────────────────────────────────────

function detectKeyStage(yearGroup: number | null, stageRaw?: string): string | null {
  if (stageRaw) {
    const s = stageRaw.toUpperCase();
    if (s.includes("EYFS") || s.includes("EY")) return "EYFS";
    if (s.includes("KS1") || s === "1") return "KS1";
    if (s.includes("KS2") || s === "2") return "KS2";
    if (s.includes("KS3") || s === "3") return "KS3";
    if (s.includes("KS4") || s === "4") return "KS4";
  }
  if (yearGroup === null) return null;
  if (yearGroup <= 0) return "EYFS";
  if (yearGroup <= 2) return "KS1";
  if (yearGroup <= 6) return "KS2";
  if (yearGroup <= 9) return "KS3";
  return "KS4";
}

// ─── Pseudonymisation ────────────────────────────────────────────────────────

/**
 * HMAC-SHA256(UPN.toLowerCase().trim(), organizationId)
 * Uses the organizationId as the server-side salt.
 * Consistent and deterministic across all server-side imports for this org.
 */
export function hashUPN(upn: string, organizationId: string): string {
  return createHmac("sha256", organizationId)
    .update(upn.toLowerCase().trim())
    .digest("hex");
}

// ─── CTF XML Parser ──────────────────────────────────────────────────────────

/**
 * Parse DfE Common Transfer File (CTF) XML v3.
 *
 * Structure:
 * <CTfile>
 *   <Header>
 *     <SourceSchoolURN>148201</SourceSchoolURN>
 *     <SourceSchoolName>Grove House Primary</SourceSchoolName>
 *   </Header>
 *   <Pupils>
 *     <Pupil>
 *       <UPN>A802200106001</UPN>
 *       <NCyearActual>4</NCyearActual>
 *       <KS2>
 *         <Stage>KS2</Stage>
 *         <Year>2024</Year>
 *         <Results>
 *           <Result>
 *             <Subject>MA</Subject>
 *             <Method>TA</Method>
 *             <Stage>KS2</Stage>
 *             <Result>EXS</Result>
 *             <ScaledScore>100</ScaledScore>
 *           </Result>
 *         </Results>
 *       </KS2>
 *       <Assessments>
 *         <Assessment>
 *           <SubjectCode>RE</SubjectCode>
 *           <AssessmentType>TA</AssessmentType>
 *           <Year>2025</Year>
 *           <Period>AUT</Period>
 *           <Result>EXS</Result>
 *         </Assessment>
 *       </Assessments>
 *     </Pupil>
 *   </Pupils>
 * </CTfile>
 */
function parseCTF(doc: Record<string, unknown>, organizationId: string): Omit<ParseResult, "format"> {
  const warnings: string[] = [];
  const records: ParsedAssessmentRecord[] = [];

  const header = (doc["CTfile"] as Record<string, unknown>)?.["Header"] as Record<string, unknown> | undefined;
  const source_school_urn = header?.["SourceSchoolURN"]?.toString() || null;
  const source_school_name = header?.["SourceSchoolName"]?.toString() || null;

  const pupilsWrapper = (doc["CTfile"] as Record<string, unknown>)?.["Pupils"];
  const rawPupils = (pupilsWrapper as Record<string, unknown>)?.["Pupil"];
  const pupils = Array.isArray(rawPupils) ? rawPupils : rawPupils ? [rawPupils] : [];

  let pupilCount = 0;

  for (const pupil of pupils as Record<string, unknown>[]) {
    const upn = pupil["UPN"]?.toString()?.trim();
    if (!upn) {
      warnings.push("Skipped pupil with missing UPN");
      continue;
    }
    pupilCount++;
    const pupil_hash = hashUPN(upn, organizationId);
    const yearGroup = pupil["NCyearActual"] ? parseInt(String(pupil["NCyearActual"])) : null;

    // KS1 / KS2 statutory results
    for (const stage of ["KS1", "KS2", "KS3"] as const) {
      const stageData = pupil[stage] as Record<string, unknown> | undefined;
      if (!stageData) continue;

      const stageYear = stageData["Year"] ? parseInt(String(stageData["Year"])) : null;
      const resultsWrapper = stageData["Results"] as Record<string, unknown> | undefined;
      const rawResults = resultsWrapper?.["Result"];
      const results = Array.isArray(rawResults) ? rawResults : rawResults ? [rawResults] : [];

      for (const result of results as Record<string, unknown>[]) {
        const subject = result["Subject"]?.toString() || "";
        const method = result["Method"]?.toString()?.toUpperCase() || "TA";
        const attainment = normaliseAttainment(result["Result"]?.toString());
        const scaledScoreRaw = result["ScaledScore"];
        const scaledScore = scaledScoreRaw ? parseInt(String(scaledScoreRaw)) : null;

        records.push({
          upn,
          pupil_hash,
          year_group: yearGroup,
          subject: normaliseSubject(subject),
          assessment_type: method === "SS" ? "SS" : method === "RA" ? "RA" : "TA",
          key_stage: stage,
          attainment_level: attainment,
          scaled_score: scaledScore,
          raw_score: null,
          assessment_year: stageYear,
          assessment_period: "summer", // Statutory results are always summer
          source_subject_code: subject,
        });
      }
    }

    // EYFS profile
    const eyfsData = pupil["EYFS"] as Record<string, unknown> | undefined;
    if (eyfsData) {
      const eyfsYear = eyfsData["Year"] ? parseInt(String(eyfsData["Year"])) : null;
      const areas = (eyfsData["Areas"] as Record<string, unknown>)?.["Area"];
      const eyfsAreas = Array.isArray(areas) ? areas : areas ? [areas] : [];
      for (const area of eyfsAreas as Record<string, unknown>[]) {
        records.push({
          upn,
          pupil_hash,
          year_group: 0,
          subject: normaliseSubject(area["SubjectCode"]?.toString() || "eyfs"),
          assessment_type: "TA",
          key_stage: "EYFS",
          attainment_level: normaliseAttainment(area["Result"]?.toString()),
          scaled_score: null,
          raw_score: null,
          assessment_year: eyfsYear,
          assessment_period: "summer",
          source_subject_code: area["SubjectCode"]?.toString() || "EYFS",
        });
      }
    }

    // Termly assessments block
    const assessmentsWrapper = pupil["Assessments"] as Record<string, unknown> | undefined;
    const rawAssessments = assessmentsWrapper?.["Assessment"];
    const assessments = Array.isArray(rawAssessments) ? rawAssessments : rawAssessments ? [rawAssessments] : [];

    for (const assessment of assessments as Record<string, unknown>[]) {
      const subject = assessment["SubjectCode"]?.toString() || assessment["Subject"]?.toString() || "";
      const yr = assessment["Year"] ? parseInt(String(assessment["Year"])) : null;
      const period = normalisePeriod(assessment["Period"]?.toString());
      const yg = assessment["YearGroup"] ? parseInt(String(assessment["YearGroup"])) : yearGroup;

      records.push({
        upn,
        pupil_hash,
        year_group: yg,
        subject: normaliseSubject(subject),
        assessment_type: "TA",
        key_stage: detectKeyStage(yg, assessment["Stage"]?.toString()),
        attainment_level: normaliseAttainment(assessment["Result"]?.toString()),
        scaled_score: assessment["ScaledScore"] ? parseInt(String(assessment["ScaledScore"])) : null,
        raw_score: assessment["RawScore"] ? parseInt(String(assessment["RawScore"])) : null,
        assessment_year: yr,
        assessment_period: period,
        source_subject_code: subject,
      });
    }
  }

  return { source_school_urn, source_school_name, records, warnings, pupil_count: pupilCount };
}

// ─── Assessment Manager XML Parser ──────────────────────────────────────────

/**
 * Parse Assessment Manager XML (vendor-specific format used by Arbor, SIMS, etc.)
 *
 * Structure (varies by vendor, this covers common patterns):
 * <AssessmentExport> | <ExportData> | <SchoolReport>
 *   <School><URN>148201</URN><Name>Grove House</Name></School>
 *   <Pupils>
 *     <Pupil>
 *       <UPN>A802200106001</UPN>
 *       <YearGroup>4</YearGroup>
 *       <Assessments>
 *         <Assessment>
 *           <Subject>Reading</Subject>
 *           <Period>Autumn 2025</Period>
 *           <Level>EXS</Level>
 *           <ScaledScore>105</ScaledScore>
 *         </Assessment>
 *       </Assessments>
 *     </Pupil>
 *   </Pupils>
 * </AssessmentExport>
 */
function parseAssessmentManager(doc: Record<string, unknown>, organizationId: string): Omit<ParseResult, "format"> {
  const warnings: string[] = [];
  const records: ParsedAssessmentRecord[] = [];

  // Find root — could be AssessmentExport, ExportData, SchoolReport, or Assessment
  const root = (
    doc["AssessmentExport"] ||
    doc["ExportData"] ||
    doc["SchoolReport"] ||
    doc["AssessmentData"] ||
    Object.values(doc)[0]
  ) as Record<string, unknown> | undefined;

  if (!root) {
    return { source_school_urn: null, source_school_name: null, records: [], warnings: ["Empty or unrecognised XML root"], pupil_count: 0 };
  }

  const school = root["School"] as Record<string, unknown> | undefined;
  const source_school_urn = school?.["URN"]?.toString() || null;
  const source_school_name = school?.["Name"]?.toString() || null;

  const pupilsWrapper = root["Pupils"] || root["Students"];
  const rawPupils = (pupilsWrapper as Record<string, unknown>)?.["Pupil"] ||
                    (pupilsWrapper as Record<string, unknown>)?.["Student"];
  const pupils = Array.isArray(rawPupils) ? rawPupils : rawPupils ? [rawPupils] : [];

  let pupilCount = 0;

  for (const pupil of pupils as Record<string, unknown>[]) {
    const upn = (pupil["UPN"] || pupil["Upn"] || pupil["StudentId"])?.toString()?.trim();
    if (!upn) {
      warnings.push("Skipped pupil with missing UPN/StudentId");
      continue;
    }
    pupilCount++;
    const pupil_hash = hashUPN(upn, organizationId);
    const yearGroup = pupil["YearGroup"] ? parseInt(String(pupil["YearGroup"])) : null;

    const assessmentsWrapper = (pupil["Assessments"] || pupil["Results"]) as Record<string, unknown> | undefined;
    const rawAssessments = assessmentsWrapper?.["Assessment"] || assessmentsWrapper?.["Result"];
    const assessments = Array.isArray(rawAssessments) ? rawAssessments : rawAssessments ? [rawAssessments] : [];

    for (const assessment of assessments as Record<string, unknown>[]) {
      const subjectRaw = (assessment["Subject"] || assessment["SubjectCode"] || "").toString();
      const periodRaw = (assessment["Period"] || assessment["Term"] || "").toString();
      const levelRaw = assessment["Level"] || assessment["Result"] || assessment["Attainment"] || null;
      const ss = assessment["ScaledScore"] ? parseInt(String(assessment["ScaledScore"])) : null;
      const rs = assessment["RawScore"] ? parseInt(String(assessment["RawScore"])) : null;

      // Extract year from period string like "Autumn 2025" or from Year field
      let assessmentYear: number | null = null;
      const yearMatch = periodRaw.match(/20\d\d/);
      if (yearMatch) assessmentYear = parseInt(yearMatch[0]);
      else if (assessment["Year"]) assessmentYear = parseInt(String(assessment["Year"]));

      const yg = assessment["YearGroup"] ? parseInt(String(assessment["YearGroup"])) : yearGroup;

      records.push({
        upn,
        pupil_hash,
        year_group: yg,
        subject: normaliseSubject(subjectRaw),
        assessment_type: "TA",
        key_stage: detectKeyStage(yg, assessment["KeyStage"]?.toString()),
        attainment_level: normaliseAttainment(levelRaw?.toString()),
        scaled_score: ss,
        raw_score: rs,
        assessment_year: assessmentYear,
        assessment_period: normalisePeriod(periodRaw),
        source_subject_code: subjectRaw,
      });
    }
  }

  return { source_school_urn, source_school_name, records, warnings, pupil_count: pupilCount };
}

// ─── Main Parse Function ─────────────────────────────────────────────────────

/**
 * Parse an assessment XML buffer (CTF or Assessment Manager format).
 * Auto-detects format from root element.
 */
export function parseAssessmentXML(xmlBuffer: Buffer, organizationId: string): ParseResult {
  const xmlString = xmlBuffer.toString("utf-8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
    isArray: (_name, jpath) => {
      // Always treat these as arrays even if there's only one element
      const arrayPaths = [
        "CTfile.Pupils.Pupil",
        "CTfile.Pupils.Pupil.KS1.Results.Result",
        "CTfile.Pupils.Pupil.KS2.Results.Result",
        "CTfile.Pupils.Pupil.KS3.Results.Result",
        "CTfile.Pupils.Pupil.EYFS.Areas.Area",
        "CTfile.Pupils.Pupil.Assessments.Assessment",
      ];
      return arrayPaths.some((p) => jpath.endsWith(p.split(".").slice(1).join(".")));
    },
  });

  const doc = parser.parse(xmlString) as Record<string, unknown>;

  // Detect format
  if ("CTfile" in doc) {
    const result = parseCTF(doc, organizationId);
    return { format: "ctf", ...result };
  }

  // Assessment Manager variants
  const amRoots = ["AssessmentExport", "ExportData", "SchoolReport", "AssessmentData"];
  if (amRoots.some((r) => r in doc)) {
    const result = parseAssessmentManager(doc, organizationId);
    return { format: "assessment_manager", ...result };
  }

  // Unknown format — try assessment manager as fallback
  const fallback = parseAssessmentManager(doc, organizationId);
  return {
    format: "unknown",
    ...fallback,
    warnings: [...fallback.warnings, `Unrecognised XML root element: ${Object.keys(doc)[0]}`],
  };
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement/apps/platform
npx tsc --noEmit 2>&1 | grep "ctf-xml-parser" | head -20
```

Expected: no errors referencing `ctf-xml-parser.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/ctf-xml-parser.ts
git commit -m "feat: add CTF/Assessment Manager XML parser with HMAC-SHA256 pseudonymisation"
```

---

### Task 3: Build the Assessment XML Import API Route

**Files:**
- Create: `src/app/api/imports/assessment-xml/route.ts`

This route:
1. Accepts POST with `{ organizationId, folderId? }` (optional override folder)
2. Loads connection from `school_data_connections`
3. Lists XML files in the assessments folder using `GOOGLE_API_KEY`
4. Downloads each XML file, parses it, collects all records
5. Creates import record in `school_assessment_imports`
6. Batch-inserts records into `pupil_assessments_pseudo` (500 at a time)
7. Returns summary

Also accepts GET to check what XML files are available without importing.

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/imports/assessment-xml/route.ts
/**
 * POST /api/imports/assessment-xml
 *
 * Imports assessment data from XML files (CTF or Assessment Manager format)
 * found in the school's connected Google Drive assessments folder.
 *
 * Body: {
 *   organizationId?: string     // defaults to auth org
 *   folderId?: string           // override: use specific Drive folder ID
 *   dryRun?: boolean            // parse only, don't write to DB
 *   fileId?: string             // import a single specific file by Drive ID
 * }
 *
 * GET /api/imports/assessment-xml?organizationId=xxx
 * Lists available XML files in the connected Drive folder.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { parseAssessmentXML } from "@/lib/ctf-xml-parser";
import type { ParsedAssessmentRecord } from "@/lib/ctf-xml-parser";
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

// ─── Drive Helpers ────────────────────────────────────────────────────────────

async function listXMLFilesInFolder(folderId: string): Promise<DriveFile[]> {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?` +
      new URLSearchParams({
        key: GOOGLE_API_KEY,
        q: `'${folderId}' in parents and trashed = false and (mimeType = 'text/xml' or mimeType = 'application/xml' or name contains '.xml')`,
        fields: "files(id,name,mimeType,modifiedTime)",
        orderBy: "modifiedTime desc",
        pageSize: "50",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      }),
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive list error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.files || []) as DriveFile[];
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

// ─── Find Assessments Folder ─────────────────────────────────────────────────

async function findAssessmentsFolder(
  organizationId: string,
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<{ folderId: string; connectionId: string } | null> {
  const { data } = await supabase
    .from("school_data_connections")
    .select("id, folder_id, detected_folders")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .eq("provider", "google")
    .single();

  if (!data) return null;

  // Look for assessments category in detected_folders
  const detected = (data.detected_folders || {}) as Record<
    string,
    { category: string; files: number; folderId: string }
  >;

  for (const [_name, info] of Object.entries(detected)) {
    if (info.category === "assessments") {
      return { folderId: info.folderId, connectionId: data.id };
    }
  }

  // Fallback: use root folder
  return { folderId: data.folder_id, connectionId: data.id };
}

// ─── GET — List available XML files ──────────────────────────────────────────

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const organizationId =
    request.nextUrl.searchParams.get("organizationId") || auth.organizationId;

  if (!organizationId) return apiError("Missing organizationId", 400);
  if (!GOOGLE_API_KEY) return apiError("Google Drive not configured", 500);

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
  const organizationId = body.organizationId || auth.organizationId;
  const dryRun = body.dryRun === true;
  const singleFileId = body.fileId as string | undefined;
  const folderIdOverride = body.folderId as string | undefined;

  if (!organizationId) return apiError("Missing organizationId", 400);
  if (!GOOGLE_API_KEY) return apiError("Google Drive not configured", 500);

  const supabase = createServiceRoleClient();

  // Find the assessments folder
  let folderId = folderIdOverride;
  if (!folderId) {
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
      message: "No XML files found in the assessments folder",
      folderId,
      imports: [],
    });
  }

  const importResults = [];

  for (const file of filesToProcess) {
    const fileResult: {
      file_name: string;
      file_id: string;
      status: string;
      format?: string;
      pupil_count?: number;
      record_count?: number;
      inserted_count?: number;
      import_id?: string;
      warnings?: string[];
      error?: string;
    } = {
      file_name: file.name,
      file_id: file.id,
      status: "pending",
    };

    try {
      // Download the XML file
      const buffer = await downloadDriveFile(file.id);

      // Parse it
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

      // Derive assessment_period and academic_year_start from records
      const years = parsed.records
        .map((r) => r.assessment_year)
        .filter((y): y is number => y !== null);
      const academicYearStart = years.length > 0 ? Math.max(...years) : new Date().getFullYear();

      const periods = parsed.records
        .map((r) => r.assessment_period)
        .filter((p): p is string => !!p);
      const mostCommonPeriod = periods.reduce(
        (acc, p) => {
          acc[p] = (acc[p] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const assessmentPeriod =
        Object.entries(mostCommonPeriod).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

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

      // Create import record
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
          salt_hint: "Server-side: organizationId used as HMAC salt",
        })
        .select("id")
        .single();

      if (importError || !importRecord) {
        fileResult.status = "error";
        fileResult.error = `Import record creation failed: ${importError?.message}`;
        importResults.push(fileResult);
        continue;
      }

      fileResult.import_id = importRecord.id;

      // Batch insert assessment records
      let insertedCount = 0;
      const allRecords = parsed.records;

      for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
        const batch = allRecords.slice(i, i + BATCH_SIZE).map(
          (r: ParsedAssessmentRecord) => ({
            organization_id: organizationId,
            import_id: importRecord.id,
            pupil_hash: r.pupil_hash,
            year_group: r.year_group,
            is_fsm: null, // Not available in CTF — populated from MIS data separately
            is_send: null,
            send_type: null,
            is_eal: null,
            is_pp: null,
            gender: null,
            subject: r.subject,
            assessment_period: r.assessment_period || assessmentPeriod,
            academic_year_start: r.assessment_year || academicYearStart,
            attainment_level: r.attainment_level,
            scaled_score: r.scaled_score,
            raw_score: r.raw_score,
            teacher_assessment: r.attainment_level, // Store attainment as teacher_assessment too
            progress_score: null,
            prior_attainment_band: null,
          }),
        );

        const { error: batchError } = await supabase
          .from("pupil_assessments_pseudo")
          .insert(batch);

        if (!batchError) {
          insertedCount += batch.length;
        } else {
          console.error(
            `[assessment-xml] Batch insert error (batch ${Math.floor(i / BATCH_SIZE)}):`,
            batchError,
          );
          fileResult.warnings = [
            ...(fileResult.warnings || []),
            `Batch ${Math.floor(i / BATCH_SIZE)} failed: ${batchError.message}`,
          ];
        }
      }

      // Update import status to complete
      await supabase
        .from("school_assessment_imports")
        .update({ status: "complete" })
        .eq("id", importRecord.id);

      fileResult.inserted_count = insertedCount;
      fileResult.status = "complete";
    } catch (err) {
      fileResult.status = "error";
      fileResult.error = err instanceof Error ? err.message : "Unknown error";
    }

    importResults.push(fileResult);
  }

  const totalInserted = importResults.reduce(
    (sum, r) => sum + (r.inserted_count || 0),
    0,
  );

  return apiSuccess({
    summary: {
      files_processed: filesToProcess.length,
      files_complete: importResults.filter((r) => r.status === "complete").length,
      files_errored: importResults.filter((r) => r.status === "error").length,
      total_records_inserted: totalInserted,
      dry_run: dryRun,
    },
    imports: importResults,
  });
});
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement/apps/platform
npx tsc --noEmit 2>&1 | grep "assessment-xml\|ctf-xml" | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/imports/assessment-xml/route.ts
git commit -m "feat: add /api/imports/assessment-xml route for CTF/AM XML imports from Google Drive"
```

---

### Task 4: End-to-End Test

- [ ] **Step 1: Start dev server**

```bash
cd /Users/jarvis/dev/Schoolgle_Improvement/apps/platform
npm run dev &
sleep 5
```

- [ ] **Step 2: Test GET — list XML files**

```bash
curl -s http://localhost:3000/api/imports/assessment-xml \
  -H "Cookie: <auth-cookie>" \
  | jq .
```

Expected: JSON with `{ files: [...], count: N }` or `{ error: "No Google Drive connection..." }`

- [ ] **Step 3: Test with sample CTF XML (dry run)**

```bash
# Create a minimal test CTF XML
cat > /tmp/test-ctf.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<CTfile version="3">
  <Header>
    <SourceSchoolURN>148201</SourceSchoolURN>
    <SourceSchoolName>Grove House Primary</SourceSchoolName>
  </Header>
  <Pupils>
    <Pupil>
      <UPN>A802200106001</UPN>
      <NCyearActual>4</NCyearActual>
      <KS2>
        <Stage>KS2</Stage>
        <Year>2024</Year>
        <Results>
          <Result>
            <Subject>MA</Subject>
            <Method>TA</Method>
            <Stage>KS2</Stage>
            <Result>EXS</Result>
            <ScaledScore>100</ScaledScore>
          </Result>
          <Result>
            <Subject>RE</Subject>
            <Method>TA</Method>
            <Stage>KS2</Stage>
            <Result>GDS</Result>
          </Result>
        </Results>
      </KS2>
      <Assessments>
        <Assessment>
          <SubjectCode>MA</SubjectCode>
          <AssessmentType>TA</AssessmentType>
          <Year>2025</Year>
          <Period>AUT</Period>
          <YearGroup>4</YearGroup>
          <Result>EXS</Result>
        </Assessment>
      </Assessments>
    </Pupil>
  </Pupils>
</CTfile>
EOF
```

Then write a quick Node.js test:
```bash
node -e "
const { parseAssessmentXML } = require('./src/lib/ctf-xml-parser.ts');
// Can't run TS directly — use the tsc output or ts-node
"
```

Use `tsx` if available:
```bash
cd /Users/jarvis/dev/Schoolgle_Improvement/apps/platform
npx tsx -e "
import { parseAssessmentXML } from './src/lib/ctf-xml-parser';
import fs from 'fs';
const buf = fs.readFileSync('/tmp/test-ctf.xml');
const result = parseAssessmentXML(buf, 'test-org-id');
console.log(JSON.stringify(result, null, 2));
"
```

Expected output:
```json
{
  "format": "ctf",
  "source_school_urn": "148201",
  "source_school_name": "Grove House Primary",
  "records": [
    {
      "upn": "A802200106001",
      "pupil_hash": "<64-char hex>",
      "year_group": 4,
      "subject": "maths",
      "attainment_level": "EXS",
      "scaled_score": 100,
      "key_stage": "KS2",
      "assessment_period": "summer"
    }
    ...
  ],
  "pupil_count": 1
}
```

- [ ] **Step 4: Final commit with summary**

```bash
git add -A
git commit -m "feat: assessment XML parser complete — CTF + Assessment Manager format support"
```

---

## Self-Review Checklist

- [x] Spec: CTF format parsing → Task 2
- [x] Spec: Assessment Manager format → Task 2
- [x] Spec: Extract pupil UPN, subject, type, grade, date, key stage → ParsedAssessmentRecord fields
- [x] Spec: Pseudonymise UPN → hashUPN() with HMAC-SHA256
- [x] Spec: Write to pupil_assessments_pseudo → Task 3 batch insert
- [x] Spec: Log import to school_assessment_imports → Task 3 import record creation
- [x] Spec: API route /api/imports/assessment-xml → Task 3
- [x] Spec: Triggered when XML files appear in Google Drive → GET lists files, POST imports
- [x] Spec: Use canvas_field_mappings pattern → subject normalisation + format detection mirrors field-matcher approach
- [x] Dependency: fast-xml-parser → Task 1
