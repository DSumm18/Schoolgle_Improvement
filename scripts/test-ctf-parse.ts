/**
 * Quick test: parse a sample CTF XML file to verify the parser works.
 * Run with: npx tsx scripts/test-ctf-parse.ts
 */
import { readFileSync, readdirSync } from "fs";
import { parseAssessmentXML, hashUPN } from "../apps/platform/src/lib/ctf-xml-parser";

const ORG_ID = "d9d1ac2c-5eff-4043-98f4-e1c43f616fd3"; // Grove House Primary
const XML_DIR = ".tmp-xml";

// List all XML files
const files = readdirSync(XML_DIR).filter(f => f.endsWith(".xml"));
console.log(`\nFound ${files.length} XML files in ${XML_DIR}/\n`);

// Summary counters
let totalPupils = 0;
let totalRecords = 0;
const allWarnings: string[] = [];
const fileResults: Array<{name: string; format: string; pupils: number; records: number}> = [];

for (const file of files) {
  const buffer = readFileSync(`${XML_DIR}/${file}`);
  const result = parseAssessmentXML(buffer, ORG_ID);

  totalPupils += result.pupil_count;
  totalRecords += result.records.length;
  allWarnings.push(...result.warnings);

  fileResults.push({
    name: file,
    format: result.format,
    pupils: result.pupil_count,
    records: result.records.length,
  });

  console.log(`  ${file}: format=${result.format}, pupils=${result.pupil_count}, records=${result.records.length}, warnings=${result.warnings.length}`);
}

console.log(`\n=== SUMMARY ===`);
console.log(`Files parsed: ${files.length}`);
console.log(`Total pupils (across all files, may overlap): ${totalPupils}`);
console.log(`Total assessment records: ${totalRecords}`);
console.log(`Warnings: ${allWarnings.length}`);

if (allWarnings.length > 0) {
  console.log(`\nWarnings:`);
  allWarnings.forEach(w => console.log(`  - ${w}`));
}

// Show sample records (first 3 from first file with records)
const sampleFile = files[0];
const sampleBuffer = readFileSync(`${XML_DIR}/${sampleFile}`);
const sampleResult = parseAssessmentXML(sampleBuffer, ORG_ID);

if (sampleResult.records.length > 0) {
  console.log(`\n=== SAMPLE RECORDS (first 3 from ${sampleFile}) ===`);
  for (const rec of sampleResult.records.slice(0, 3)) {
    console.log(JSON.stringify({
      pupil_hash: rec.pupil_hash.substring(0, 16) + "...",
      year_group: rec.year_group,
      subject: rec.subject,
      key_stage: rec.key_stage,
      attainment_level: rec.attainment_level,
      scaled_score: rec.scaled_score,
      assessment_year: rec.assessment_year,
      // Verify NO PII fields
      has_upn_field: !!rec.upn, // should be true (used internally) but never stored
    }, null, 2));
  }
}

// PII check: verify the hash is NOT the raw UPN
if (sampleResult.records.length > 0) {
  const rec = sampleResult.records[0];
  console.log(`\n=== PII SAFETY CHECK ===`);
  console.log(`pupil_hash looks like a hash (64 hex chars): ${/^[a-f0-9]{64}$/.test(rec.pupil_hash)}`);
  console.log(`pupil_hash !== raw UPN: ${rec.pupil_hash !== rec.upn}`);
  console.log(`Hash length: ${rec.pupil_hash.length}`);
}

// Count by type
const byType: Record<string, number> = {};
for (const fr of fileResults) {
  const type = fr.name.includes("FSP") ? "FSP" : fr.name.includes("PHO") ? "PHO" : fr.name.includes("KS1") ? "KS1" : fr.name.includes("KS2") ? "KS2" : "OTHER";
  byType[type] = (byType[type] ?? 0) + fr.records;
}
console.log(`\n=== RECORDS BY TYPE ===`);
Object.entries(byType).forEach(([k, v]) => console.log(`  ${k}: ${v} records`));
