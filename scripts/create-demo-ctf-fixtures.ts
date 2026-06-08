/**
 * Create reusable synthetic CTF demo fixtures from local XML samples.
 *
 * Usage:
 *   npx tsx scripts/create-demo-ctf-fixtures.ts
 *   npx tsx scripts/create-demo-ctf-fixtures.ts --input=.tmp-xml --output=apps/platform/tests/fixtures/ctf/rochdale-demo-primary
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import path from "path";
import { parseAssessmentXML } from "../apps/platform/src/lib/ctf-xml-parser";
import { createSyntheticCtfFixture } from "../apps/platform/src/lib/assessment-intelligence/demo-ctf-fixtures";

const args = new Map(
  process.argv
    .slice(2)
    .map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key, value ?? "true"] as const;
    }),
);

const inputDir = args.get("input") ?? ".tmp-xml";
const outputDir =
  args.get("output") ?? "apps/platform/tests/fixtures/ctf/rochdale-demo-primary";
const fixtureId = args.get("fixtureId") ?? "rochdale-demo-primary";
const demoSchoolName = args.get("schoolName") ?? "Rochdale Demo Primary School";
const demoSchoolUrn = args.get("urn") ?? "149001";
const demoLea = args.get("lea") ?? "354";
const demoEstab = args.get("estab") ?? "9001";
const academicYearStart = Number(args.get("academicYearStart") ?? 2025);
const demoOrgId = "00000000-0000-4000-8000-000000000001";

mkdirSync(outputDir, { recursive: true });

const files = readdirSync(inputDir)
  .filter((file) => file.toLowerCase().endsWith(".xml"))
  .sort();

if (files.length === 0) {
  throw new Error(`No XML files found in ${inputDir}`);
}

const manifest = {
  fixtureId,
  isDemo: true,
  safetyModel: "synthetic_twin",
  demoSchoolName,
  demoSchoolUrn,
  generatedFrom: inputDir,
  outputDir,
  academicYearStart,
  files: [] as Array<{
    fileName: string;
    originalFileName: string;
    pupilCount: number;
    recordCount: number;
    warnings: string[];
  }>,
};

const blockedSourceValues = new Set<string>();
files.forEach((file) => {
  const sourceXml = readFileSync(path.join(inputDir, file), "utf8");
  for (const match of sourceXml.matchAll(/>([^<>]{3,})</g)) {
    const value = match[1].trim();
    if (value.length >= 3) blockedSourceValues.add(value);
  }
});

files.forEach((file, index) => {
  const sourcePath = path.join(inputDir, file);
  const sourceXml = readFileSync(sourcePath, "utf8");
  const result = createSyntheticCtfFixture(sourceXml, {
    fixtureId,
    demoSchoolName,
    demoSchoolUrn,
    demoLea,
    demoEstab,
    academicYearStart,
    blockedSourceValues,
  });
  const targetName = `${fixtureId}-${String(index + 1).padStart(3, "0")}.xml`;
  const targetPath = path.join(outputDir, targetName);
  writeFileSync(targetPath, result.xml, "utf8");

  const parsed = parseAssessmentXML(Buffer.from(result.xml), demoOrgId);
  manifest.files.push({
    fileName: targetName,
    originalFileName: `source-${String(index + 1).padStart(3, "0")}.xml`,
    pupilCount: parsed.pupil_count,
    recordCount: parsed.records.length,
    warnings: parsed.warnings,
  });
});

writeFileSync(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

writeFileSync(
  path.join(outputDir, "README.md"),
  [
    "# Rochdale Demo Primary CTF Fixtures",
    "",
    "These files are synthetic demo CTF fixtures generated for Schoolgle demonstrations.",
    "",
    "- They preserve realistic assessment record counts and subject/outcome patterns.",
    "- Pupil names, UPNs, DOBs, addresses, school identifiers and filenames are rewritten.",
    "- Sensitive row-level characteristics are regenerated as synthetic values.",
    "- Treat these as demo data only; do not use them as evidence for a real school.",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Created ${manifest.files.length} synthetic CTF fixture files in ${outputDir}`);
