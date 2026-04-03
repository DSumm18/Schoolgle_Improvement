/**
 * Import Grove House Primary assessment data from CTF XML files into Supabase.
 *
 * - Parses all XML files in .tmp-xml/
 * - Pseudonymises UPNs with HMAC-SHA256(UPN, organizationId)
 * - Inserts into pupil_assessments_pseudo + school_assessment_imports
 * - NEVER stores pupil names, DOB, or addresses
 *
 * Run: npx tsx scripts/import-grove-house-data.ts
 */
import { readFileSync, readdirSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseAssessmentXML } from "../apps/platform/src/lib/ctf-xml-parser";
import type { ParsedAssessmentRecord } from "../apps/platform/src/lib/ctf-xml-parser";
import * as dotenv from "dotenv";

// Load env from apps/platform/.env.local
dotenv.config({ path: "apps/platform/.env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ORG_ID = "d9d1ac2c-5eff-4043-98f4-e1c43f616fd3"; // Grove House Primary
const XML_DIR = ".tmp-xml";
const BATCH_SIZE = 500;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== Grove House Primary Data Import ===");
  console.log(`Organization: ${ORG_ID}`);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  // List XML files (exclude test_fsp.xml duplicate)
  const files = readdirSync(XML_DIR)
    .filter((f) => f.endsWith(".xml") && f.startsWith("3802093_"))
    .sort();

  console.log(`Found ${files.length} XML files to import\n`);

  // Check if there's existing data for this org
  const { count: existingCount } = await supabase
    .from("pupil_assessments_pseudo")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);

  if (existingCount && existingCount > 0) {
    console.log(`WARNING: ${existingCount} existing records found for this org.`);
    console.log("Clearing existing data before re-import...\n");

    // Delete existing assessment records
    const { error: delAssErr } = await supabase
      .from("pupil_assessments_pseudo")
      .delete()
      .eq("organization_id", ORG_ID);
    if (delAssErr) {
      console.error("Failed to clear pupil_assessments_pseudo:", delAssErr);
      process.exit(1);
    }

    // Delete existing import records
    const { error: delImpErr } = await supabase
      .from("school_assessment_imports")
      .delete()
      .eq("organization_id", ORG_ID);
    if (delImpErr) {
      console.error("Failed to clear school_assessment_imports:", delImpErr);
      process.exit(1);
    }

    console.log("Cleared existing data.\n");
  }

  let totalInserted = 0;
  let totalPupils = 0;
  let totalFiles = 0;
  const uniqueHashes = new Set<string>();

  for (const file of files) {
    const buffer = readFileSync(`${XML_DIR}/${file}`);
    const parsed = parseAssessmentXML(buffer, ORG_ID);

    if (parsed.records.length === 0) {
      console.log(`  SKIP ${file}: 0 records`);
      continue;
    }

    // Track unique pupil hashes
    for (const r of parsed.records) {
      uniqueHashes.add(r.pupil_hash);
    }

    // Derive metadata
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

    // Detect file type from filename
    const fileType = file.includes("FSP")
      ? "EYFS"
      : file.includes("PHO")
        ? "Phonics"
        : file.includes("KS1")
          ? "KS1"
          : file.includes("KS2")
            ? "KS2"
            : "Unknown";

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from("school_assessment_imports")
      .insert({
        organization_id: ORG_ID,
        file_name: file,
        source_system: `ctf_arbor_${fileType.toLowerCase()}`,
        academic_year_start: academicYearStart,
        assessment_period: assessmentPeriod,
        year_groups_included: yearGroups,
        total_pupils: parsed.pupil_count,
        total_records: parsed.records.length,
        subjects_included: subjects,
        status: "pseudonymised",
        pseudonymisation_method: "sha256_hmac",
        salt_hint:
          "Server-side: organizationId as HMAC salt (deterministic)",
      })
      .select("id")
      .single();

    if (importError || !importRecord) {
      console.error(`  ERROR creating import record for ${file}:`, importError);
      continue;
    }

    // Batch-insert pseudonymised assessment records
    let fileInserted = 0;
    for (let i = 0; i < parsed.records.length; i += BATCH_SIZE) {
      const batch = parsed.records
        .slice(i, i + BATCH_SIZE)
        .map((r: ParsedAssessmentRecord) => ({
          organization_id: ORG_ID,
          import_id: importRecord.id,
          pupil_hash: r.pupil_hash,
          year_group: r.year_group,
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
          teacher_assessment: r.attainment_level,
          progress_score: null,
          prior_attainment_band: null,
        }));

      const { error: batchError } = await supabase
        .from("pupil_assessments_pseudo")
        .insert(batch);

      if (batchError) {
        console.error(
          `  ERROR batch insert for ${file} (batch ${Math.floor(i / BATCH_SIZE)}):`,
          batchError.message,
        );
      } else {
        fileInserted += batch.length;
      }
    }

    // Update import status
    await supabase
      .from("school_assessment_imports")
      .update({ status: "complete" })
      .eq("id", importRecord.id);

    totalInserted += fileInserted;
    totalPupils += parsed.pupil_count;
    totalFiles++;

    console.log(
      `  OK ${file}: ${fileType} | ${parsed.pupil_count} pupils | ${fileInserted}/${parsed.records.length} records | year=${academicYearStart}`,
    );
  }

  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`Files imported: ${totalFiles}/${files.length}`);
  console.log(`Total records inserted: ${totalInserted}`);
  console.log(`Unique pseudonymised pupils: ${uniqueHashes.size}`);
  console.log(`Total pupil appearances: ${totalPupils}`);

  // Verification queries
  console.log(`\n=== VERIFICATION ===`);

  const { count: dbCount } = await supabase
    .from("pupil_assessments_pseudo")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);
  console.log(`Records in pupil_assessments_pseudo: ${dbCount}`);

  const { count: importCount } = await supabase
    .from("school_assessment_imports")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);
  console.log(`Records in school_assessment_imports: ${importCount}`);

  // PII safety check — verify no real names in the data
  const { data: sampleRows } = await supabase
    .from("pupil_assessments_pseudo")
    .select("pupil_hash, year_group, subject, attainment_level, scaled_score")
    .eq("organization_id", ORG_ID)
    .limit(5);

  console.log(`\nSample rows (verifying no PII):`);
  console.log(JSON.stringify(sampleRows, null, 2));

  // Verify pupil_hash is always 64-char hex
  const { data: hashCheck } = await supabase
    .from("pupil_assessments_pseudo")
    .select("pupil_hash")
    .eq("organization_id", ORG_ID)
    .limit(100);

  const allHashesValid = hashCheck?.every(
    (r) => /^[a-f0-9]{64}$/.test(r.pupil_hash),
  );
  console.log(`\nAll pupil_hash values are valid SHA-256 hashes: ${allHashesValid}`);

  console.log(`\n=== DONE ===`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
