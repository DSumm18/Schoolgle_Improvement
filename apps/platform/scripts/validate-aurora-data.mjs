#!/usr/bin/env node
/**
 * Aurora Primary School — Data Integrity Validator
 *
 * NON-NEGOTIABLE RULE: All Aurora test data derives from the Arbor XLSX files.
 * This script validates consistency across all data sources.
 *
 * Run: node apps/platform/scripts/validate-aurora-data.mjs
 */

import XLSX from "xlsx";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = join(__dirname, "..", "test-harness", "aurora-primary");
const ARBOR_DIR = join(HARNESS_DIR, "arbor-exports");
const TRACKER_DIR = join(HARNESS_DIR, "tracker-exports");

let errors = 0;
let warnings = 0;
let passes = 0;

function pass(msg) {
  console.log(`  ✅ ${msg}`);
  passes++;
}
function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
  warnings++;
}
function fail(msg) {
  console.log(`  ❌ ${msg}`);
  errors++;
}
function section(msg) {
  console.log(`\n${"═".repeat(60)}\n${msg}\n${"═".repeat(60)}`);
}

function loadSheet(filePath, sheetIndex = 0) {
  if (!existsSync(filePath)) {
    fail(`File not found: ${filePath}`);
    return [];
  }
  const wb = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[sheetIndex]], {
    defval: "",
  });
}

// ═══════════════════════════════════════════════════════════
// Load all data sources
// ═══════════════════════════════════════════════════════════

section("1. LOADING DATA FILES");

const pupils = loadSheet(join(ARBOR_DIR, "arbor_pupil_roll.xlsx"));
const sen = loadSheet(join(ARBOR_DIR, "sen_register_arbor.xlsx"));
const staff = loadSheet(join(ARBOR_DIR, "arbor_staff_export.xlsx"));
const history = loadSheet(join(ARBOR_DIR, "arbor_teacher_class_history.xlsx"));
const attendance = loadSheet(join(ARBOR_DIR, "arbor_attendance_termly.xlsx"));
const behaviour = loadSheet(join(ARBOR_DIR, "arbor_behaviour_export.xlsx"));
const statutory = loadSheet(join(ARBOR_DIR, "arbor_statutory_results.xlsx"));
const tracker = loadSheet(join(TRACKER_DIR, "insight_tracker_export.xlsx"));

console.log(`  Pupil roll: ${pupils.length} records`);
console.log(`  SEN register: ${sen.length} records`);
console.log(`  Staff: ${staff.length} records`);
console.log(`  Teacher-class history: ${history.length} records`);
console.log(`  Attendance: ${attendance.length} records`);
console.log(`  Behaviour: ${behaviour.length} records`);
console.log(`  Statutory results: ${statutory.length} records`);
console.log(`  Tracker assessments: ${tracker.length} records`);

// ═══════════════════════════════════════════════════════════
// 2. PUPIL ROLL INTEGRITY
// ═══════════════════════════════════════════════════════════

section("2. PUPIL ROLL INTEGRITY");

const pupilIds = new Set(pupils.map((p) => p["Student ID"]));
const pupilsByClass = {};
const pupilsByYear = {};
for (const p of pupils) {
  const cls = p["Registration Group"];
  const yr = p["Year Group"];
  pupilsByClass[cls] = (pupilsByClass[cls] || 0) + 1;
  pupilsByYear[yr] = (pupilsByYear[yr] || 0) + 1;
}

// Check for duplicate student IDs
if (pupilIds.size === pupils.length)
  pass(`No duplicate Student IDs (${pupils.length} unique)`);
else
  fail(
    `Duplicate Student IDs found: ${pupils.length} records but ${pupilIds.size} unique IDs`,
  );

// Check year group distribution (should be 2FE = ~60 per year)
const expectedYears = [
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
];
for (const yr of expectedYears) {
  const count = pupilsByYear[yr] || 0;
  if (count >= 50 && count <= 70)
    pass(`${yr}: ${count} pupils (expected 55-65 for 2FE)`);
  else if (count > 0) warn(`${yr}: ${count} pupils (unusual for 2FE)`);
  else fail(`${yr}: NO PUPILS`);
}

// Check 2 classes per year group
const classNames = Object.keys(pupilsByClass);
const expectedClasses = {
  Reception: ["R Oak", "R Maple"],
  "Year 1": ["Y1 Birch", "Y1 Elm"],
  "Year 2": ["Y2 Ash", "Y2 Willow"],
  "Year 3": ["Y3 Holly", "Y3 Rowan"],
  "Year 4": ["Y4 Cedar", "Y4 Pine"],
  "Year 5": ["Y5 Beech", "Y5 Chestnut"],
  "Year 6": ["Y6 Hazel", "Y6 Sycamore"],
};

for (const [yr, classes] of Object.entries(expectedClasses)) {
  for (const cls of classes) {
    if (classNames.includes(cls))
      pass(`Class ${cls} exists (${pupilsByClass[cls]} pupils)`);
    else fail(`Expected class ${cls} not found in pupil roll`);
  }
}

// Check required fields populated
const requiredFields = [
  "Student ID",
  "UPN",
  "Legal First Name",
  "Legal Last Name",
  "Year Group",
  "Registration Group",
  "SEN Status",
];
for (const field of requiredFields) {
  const empty = pupils.filter((p) => !p[field] && p[field] !== 0);
  if (empty.length === 0) pass(`All pupils have ${field}`);
  else fail(`${empty.length} pupils missing ${field}`);
}

// ═══════════════════════════════════════════════════════════
// 3. SEN REGISTER ↔ PUPIL ROLL
// ═══════════════════════════════════════════════════════════

section("3. SEN REGISTER ↔ PUPIL ROLL CONSISTENCY");

// Every SEN register entry must exist in pupil roll
const senNotInRoll = sen.filter((s) => !pupilIds.has(s["Student ID"]));
if (senNotInRoll.length === 0)
  pass("All SEN register pupils found in pupil roll");
else
  fail(
    `${senNotInRoll.length} SEN pupils NOT in pupil roll: ${senNotInRoll.map((s) => s["Student ID"]).join(", ")}`,
  );

// Every pupil with SEN status K or E in roll should be in SEN register
const senIds = new Set(sen.map((s) => s["Student ID"]));
const rollSEN = pupils.filter(
  (p) =>
    p["SEN Status"] !== "No SEN" &&
    p["SEN Status"] !== "N" &&
    p["SEN Status"] !== "",
);
const senMissing = rollSEN.filter((p) => !senIds.has(p["Student ID"]));
if (senMissing.length === 0)
  pass("All SEN-flagged pupils in roll appear in SEN register");
else
  fail(
    `${senMissing.length} SEN pupils in roll but NOT in SEN register: ${senMissing.map((s) => s["Student ID"] + " " + s["Legal First Name"] + " " + s["Legal Last Name"]).join(", ")}`,
  );

// SEN status should match between files
let senMismatch = 0;
for (const s of sen) {
  const p = pupils.find((p) => p["Student ID"] === s["Student ID"]);
  if (!p) continue;
  const rollStatus = p["SEN Status"];
  const senStatus = s["SEN Status"];
  const rollIsEHCP = rollStatus === "E" || p["EHCP"] === "Yes";
  const senIsEHCP = senStatus === "EHCP" || s["EHCP"] === "Yes";
  const rollIsK = rollStatus === "K" || rollStatus === "SEN Support";
  const senIsK = senStatus === "K" || senStatus === "SEN Support";
  if ((rollIsEHCP && senIsEHCP) || (rollIsK && senIsK)) continue;
  senMismatch++;
  warn(
    `SEN status mismatch for ${s["Student ID"]} ${s["Legal First Name"]} ${s["Legal Last Name"]}: roll=${rollStatus}, register=${senStatus}`,
  );
}
if (senMismatch === 0)
  pass("SEN status matches between pupil roll and SEN register");

// SEN primary need should match
let needMismatch = 0;
for (const s of sen) {
  const p = pupils.find((p) => p["Student ID"] === s["Student ID"]);
  if (!p) continue;
  const rollNeed = p["SEN Primary Need"];
  const senNeed = s["Primary Need"];
  if (rollNeed === senNeed) continue;
  if (!rollNeed && !senNeed) continue;
  needMismatch++;
  warn(
    `Primary need mismatch for ${s["Student ID"]} ${s["Legal First Name"]}: roll=${rollNeed}, register=${senNeed}`,
  );
}
if (needMismatch === 0)
  pass("SEN primary need matches between pupil roll and SEN register");

// Class names match between SEN register and pupil roll
let classMismatch = 0;
for (const s of sen) {
  const p = pupils.find((p) => p["Student ID"] === s["Student ID"]);
  if (!p) continue;
  const rollClass = p["Registration Group"];
  const senClass = s["Class"];
  // SEN register uses short names (Pine), pupil roll uses full (Y4 Pine)
  if (rollClass.includes(senClass)) continue;
  classMismatch++;
  warn(
    `Class mismatch for ${s["Student ID"]}: roll=${rollClass}, register=${senClass}`,
  );
}
if (classMismatch === 0)
  pass("Class names consistent between pupil roll and SEN register");

// ═══════════════════════════════════════════════════════════
// 4. STAFF & CLASS ASSIGNMENTS
// ═══════════════════════════════════════════════════════════

section("4. STAFF & CLASS ASSIGNMENTS");

const staffIds = new Set(staff.map((s) => s["Staff ID"]));

// Every class should have a teacher assigned for 2025-26
const current = history.filter((h) => h["Academic Year"] === "2025-26");
const teacherClasses = new Set(current.map((h) => h["Class Name"]));
const expectedClassNames = [
  "Oak",
  "Maple",
  "Birch",
  "Elm",
  "Ash",
  "Willow",
  "Holly",
  "Rowan",
  "Cedar",
  "Pine",
  "Beech",
  "Chestnut",
  "Hazel",
  "Sycamore",
];

for (const cls of expectedClassNames) {
  if (teacherClasses.has(cls))
    pass(`Class ${cls} has teacher assigned for 2025-26`);
  else fail(`Class ${cls} has NO teacher for 2025-26`);
}

// Every teacher in history should exist in staff file
for (const h of current) {
  if (staffIds.has(h["Staff ID"]))
    pass(`${h["Staff ID"]} ${h["First Name"]} ${h["Last Name"]} in staff file`);
  else fail(`${h["Staff ID"]} in teacher history but NOT in staff file`);
}

// Every SEN key worker (non-Class Teacher) should exist in staff file
const keyWorkerRefs = new Set();
for (const s of sen) {
  const kw = s["Key Worker"] || "";
  const match = kw.match(/STF-\d+/);
  if (match) keyWorkerRefs.add(match[0]);
}
for (const ref of keyWorkerRefs) {
  if (staffIds.has(ref)) pass(`Key worker ${ref} exists in staff file`);
  else
    fail(`Key worker ${ref} referenced in SEN register but NOT in staff file`);
}

// Check TA coverage: every year group with EHCPs should have a TA
const ehcpByYear = {};
for (const s of sen) {
  if (s["EHCP"] === "Yes") {
    const yr = s["Year Group"];
    ehcpByYear[yr] = (ehcpByYear[yr] || 0) + 1;
  }
}
const taAssignments = staff.filter(
  (s) =>
    s["Role"]?.includes("Teaching Assistant") || s["Role"]?.includes("HLTA"),
);
const taYears = new Set();
for (const ta of taAssignments) {
  const assign = ta["Class Assignment"] || "";
  for (const yr of expectedYears) {
    const shortYr = yr.replace("Reception", "R").replace("Year ", "Y");
    if (assign.includes(shortYr)) taYears.add(yr);
  }
}
for (const [yr, count] of Object.entries(ehcpByYear)) {
  if (taYears.has(yr)) pass(`${yr}: ${count} EHCP pupils — TA allocated`);
  else fail(`${yr}: ${count} EHCP pupils but NO TA allocated`);
}

// ═══════════════════════════════════════════════════════════
// 5. TRACKER ↔ PUPIL ROLL
// ═══════════════════════════════════════════════════════════

section("5. TRACKER ASSESSMENTS ↔ PUPIL ROLL");

// Build name lookup from pupil roll
const rollNameSet = new Set(
  pupils.map((p) => `${p["Legal Last Name"]}, ${p["Legal First Name"]}`),
);
const trackerNames = new Set(tracker.map((t) => t["Pupil Name"]));

const trackerNotInRoll = [...trackerNames].filter((n) => !rollNameSet.has(n));
if (trackerNotInRoll.length === 0)
  pass(`All ${trackerNames.size} tracker pupils found in pupil roll`);
else {
  fail(`${trackerNotInRoll.length} tracker pupils NOT in pupil roll`);
  for (const n of trackerNotInRoll.slice(0, 5))
    console.log(`    Missing: ${n}`);
  if (trackerNotInRoll.length > 5)
    console.log(`    ... and ${trackerNotInRoll.length - 5} more`);
}

// Check tracker class names match pupil roll
const trackerClasses = new Set(tracker.map((t) => t["Class"]));
for (const cls of trackerClasses) {
  if (expectedClassNames.includes(cls)) pass(`Tracker class "${cls}" is valid`);
  else warn(`Tracker class "${cls}" not in expected class list`);
}

// Check tracker year groups match pupil roll year groups for each pupil
let yrMismatch = 0;
for (const t of tracker) {
  const name = t["Pupil Name"]; // "LastName, FirstName"
  const p = pupils.find(
    (p) => `${p["Legal Last Name"]}, ${p["Legal First Name"]}` === name,
  );
  if (!p) continue;
  if (p["Year Group"] !== t["Year Group"]) {
    yrMismatch++;
    if (yrMismatch <= 3)
      warn(
        `Year mismatch: ${name} — roll=${p["Year Group"]}, tracker=${t["Year Group"]}`,
      );
  }
}
if (yrMismatch === 0) pass("All tracker year groups match pupil roll");
else if (yrMismatch <= 3) {
  /* already warned */
} else
  warn(`${yrMismatch} total year group mismatches between tracker and roll`);

// ═══════════════════════════════════════════════════════════
// 6. EHCP FUNDING VALIDATION
// ═══════════════════════════════════════════════════════════

section("6. EHCP FUNDING & PROVISIONS");

const ehcps = sen.filter((s) => s["EHCP"] === "Yes");
console.log(`  ${ehcps.length} EHCP pupils total`);

let totalFunding = 0;
for (const e of ehcps) {
  const funding = e["Funding"] || "";
  const match = funding.match(/£([\d,]+)/);
  if (match) {
    const amount = parseInt(match[1].replace(",", ""));
    totalFunding += amount;
    if (amount < 3000)
      warn(
        `${e["Legal First Name"]} ${e["Legal Last Name"]}: low top-up £${amount}`,
      );
    if (amount > 25000)
      warn(
        `${e["Legal First Name"]} ${e["Legal Last Name"]}: very high top-up £${amount}`,
      );
  } else {
    warn(
      `${e["Student ID"]} ${e["Legal First Name"]} ${e["Legal Last Name"]}: no funding amount in "${funding}"`,
    );
  }

  if (!e["Annual Review Date"])
    warn(
      `${e["Legal First Name"]} ${e["Legal Last Name"]}: no annual review date`,
    );
  if (!e["Key Worker"] || e["Key Worker"] === "Class Teacher") {
    warn(
      `${e["Legal First Name"]} ${e["Legal Last Name"]}: key worker is "${e["Key Worker"] || "NONE"}" — EHCP pupils should have named 1:1`,
    );
  }
}
pass(`Total EHCP top-up funding: £${totalFunding.toLocaleString()}`);

// ═══════════════════════════════════════════════════════════
// 7. DATA COMPLETENESS FOR ADAPTIVE TEACHING
// ═══════════════════════════════════════════════════════════

section("7. ADAPTIVE TEACHING DATA COMPLETENESS");

// Check what fields exist in pupil roll
const rollCols = Object.keys(pupils[0] || {});
const adaptiveFields = [
  { name: "SEN Status", required: true },
  { name: "SEN Primary Need", required: false },
  { name: "EHCP", required: true },
  { name: "Pupil Premium", required: true },
  { name: "FSM Eligible", required: true },
  { name: "In Care (LAC)", required: true },
  { name: "First Language", required: true },
  { name: "Ethnicity", required: false },
  // Fields we WANT but may not have yet
  { name: "Reading Age", required: false, wanted: true },
  { name: "Spelling Age", required: false, wanted: true },
  { name: "Standardised Score Reading", required: false, wanted: true },
  { name: "Standardised Score Maths", required: false, wanted: true },
  { name: "Medical Conditions", required: false, wanted: true },
  { name: "EHCP Provisions", required: false, wanted: true },
  { name: "Communication Method", required: false, wanted: true },
  { name: "Accessibility Needs", required: false, wanted: true },
  { name: "EAL Stage", required: false, wanted: true },
];

for (const field of adaptiveFields) {
  if (rollCols.includes(field.name)) {
    const filled = pupils.filter(
      (p) => p[field.name] && p[field.name] !== "",
    ).length;
    pass(`${field.name}: present (${filled}/${pupils.length} populated)`);
  } else if (field.wanted) {
    warn(`${field.name}: NOT in pupil roll — needed for adaptive teaching`);
  } else if (field.required) {
    fail(`${field.name}: MISSING from pupil roll (required field)`);
  }
}

// Check SEN register for richer fields
const senCols = Object.keys(sen[0] || {});
const senAdaptiveFields = [
  "Secondary Need",
  "Provision Map",
  "Key Worker",
  "External Agency",
  "Funding",
  "Notes",
];
for (const field of senAdaptiveFields) {
  if (senCols.includes(field)) {
    const filled = sen.filter((s) => s[field] && s[field] !== "").length;
    pass(
      `SEN Register → ${field}: present (${filled}/${sen.length} populated)`,
    );
  } else {
    warn(`SEN Register → ${field}: missing`);
  }
}

// ═══════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════

section("VALIDATION SUMMARY");

console.log(`  ✅ Passed: ${passes}`);
console.log(`  ⚠️  Warnings: ${warnings}`);
console.log(`  ❌ Errors: ${errors}`);
console.log("");

if (errors > 0) {
  console.log("  🔴 VALIDATION FAILED — fix errors before using this data");
  process.exit(1);
} else if (warnings > 0) {
  console.log("  🟡 VALIDATION PASSED WITH WARNINGS — review warnings above");
  process.exit(0);
} else {
  console.log("  🟢 ALL CHECKS PASSED");
  process.exit(0);
}
