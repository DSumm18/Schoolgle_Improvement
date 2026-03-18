#!/usr/bin/env node
/**
 * Enrich Aurora Primary School test data with adaptive teaching fields.
 *
 * Tasks:
 * 1. Fix Louie Baker's key worker in SEN register
 * 2. Fix Freya Kaur's year group in tracker (Year 3 → Year 2)
 * 3. Add adaptive teaching columns to pupil roll
 *
 * Run: node apps/platform/scripts/enrich-aurora-adaptive.mjs
 */

import XLSX from "xlsx";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = join(__dirname, "..", "test-harness", "aurora-primary");
const ARBOR_DIR = join(HARNESS_DIR, "arbor-exports");
const TRACKER_DIR = join(HARNESS_DIR, "tracker-exports");

// Deterministic seeded random for reproducibility
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function gaussianRandom(mean, sd) {
  // Box-Muller transform
  const u1 = seededRandom();
  const u2 = seededRandom();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(mean + z * sd);
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

// ═══════════════════════════════════════════════════════════
// TASK 1: Fix Louie Baker's key worker in SEN register
// ═══════════════════════════════════════════════════════════
console.log("=== TASK 1: Fix Louie Baker key worker ===");

const senPath = join(ARBOR_DIR, "sen_register_arbor.xlsx");
const senWb = XLSX.readFile(senPath);
const senSheet = senWb.Sheets[senWb.SheetNames[0]];
const senData = XLSX.utils.sheet_to_json(senSheet, { defval: "" });

const louie = senData.find((r) => r["Student ID"] === "ARB-100279");
if (louie) {
  console.log(`  Before: Key Worker = "${louie["Key Worker"]}"`);
  louie["Key Worker"] = "Mrs Morris (STF-032)";
  console.log(`  After:  Key Worker = "${louie["Key Worker"]}"`);
} else {
  console.error("  ERROR: Louie Baker (ARB-100279) not found in SEN register!");
}

// Write back SEN register
const senNewSheet = XLSX.utils.json_to_sheet(senData);
senWb.Sheets[senWb.SheetNames[0]] = senNewSheet;
XLSX.writeFile(senWb, senPath);
console.log("  SEN register saved.\n");

// ═══════════════════════════════════════════════════════════
// TASK 2: Fix Freya Kaur's year group in tracker
// ═══════════════════════════════════════════════════════════
console.log("=== TASK 2: Fix Freya Kaur year group in tracker ===");

const trackerPath = join(TRACKER_DIR, "insight_tracker_export.xlsx");
const trackerWb = XLSX.readFile(trackerPath);
const trackerSheet = trackerWb.Sheets[trackerWb.SheetNames[0]];
const trackerData = XLSX.utils.sheet_to_json(trackerSheet, { defval: "" });

let fixCount = 0;
for (const row of trackerData) {
  if (
    row["Pupil Name"] &&
    row["Pupil Name"].includes("Kaur, Freya") &&
    row["Year Group"] === "Year 3"
  ) {
    console.log(
      `  Fixing: ${row["Pupil Name"]} Subject=${row["Subject"]} Year 3 → Year 2`,
    );
    row["Year Group"] = "Year 2";
    fixCount++;
  }
}
console.log(`  Fixed ${fixCount} tracker rows for Freya Kaur.`);

// Write back tracker
const trackerNewSheet = XLSX.utils.json_to_sheet(trackerData);
trackerWb.Sheets[trackerWb.SheetNames[0]] = trackerNewSheet;
XLSX.writeFile(trackerWb, trackerPath);
console.log("  Tracker saved.\n");

// ═══════════════════════════════════════════════════════════
// TASK 3: Add adaptive teaching columns to pupil roll
// ═══════════════════════════════════════════════════════════
console.log("=== TASK 3: Add adaptive teaching columns to pupil roll ===");

const rollPath = join(ARBOR_DIR, "arbor_pupil_roll.xlsx");
const rollWb = XLSX.readFile(rollPath);
const rollSheet = rollWb.Sheets[rollWb.SheetNames[0]];
const rollData = XLSX.utils.sheet_to_json(rollSheet, { defval: "" });

// Reload SEN data for cross-referencing
const senDataFresh = XLSX.utils.sheet_to_json(
  XLSX.readFile(senPath).Sheets[XLSX.readFile(senPath).SheetNames[0]],
  { defval: "" },
);
const senById = {};
for (const s of senDataFresh) {
  senById[s["Student ID"]] = s;
}

// Build tracker attainment lookup (latest reading/maths for each pupil)
const trackerLatest = {};
for (const r of trackerData) {
  const name = r["Pupil Name"];
  const subj = r["Subject"];
  if (subj !== "Reading" && subj !== "Maths") continue;

  const periods = [
    "2025-26 Spr1",
    "2025-26 Aut2",
    "2025-26 Aut1",
    "2024-25 Sum2",
    "2024-25 Sum1",
    "2024-25 Spr2",
    "2024-25 Spr1",
  ];
  let val = "";
  for (const p of periods) {
    if (r[p] && r[p] !== "") {
      val = r[p];
      break;
    }
  }
  if (!trackerLatest[name]) trackerLatest[name] = {};
  trackerLatest[name][subj] = val;
}

// Language → country mapping
const langCountryMap = {
  Punjabi: ["Pakistan", "India"],
  Somali: ["Somalia"],
  Arabic: ["Iraq", "Syria", "Yemen"],
  Polish: ["Poland"],
  Gujarati: ["India"],
  Bengali: ["Bangladesh"],
  Urdu: ["Pakistan"],
  Romanian: ["Romania"],
};

// EAL stage assignment based on admission date
function getEALStage(admissionDate) {
  if (!admissionDate) return "C";
  const admitted = new Date(admissionDate);
  const now = new Date("2026-03-17");
  const yearsInUK = (now - admitted) / (365.25 * 24 * 60 * 60 * 1000);
  if (yearsInUK < 1) return "B";
  if (yearsInUK < 2) return "C";
  if (yearsInUK < 3) return "D";
  return "E";
}

// Attainment → standardised score range
function attainmentToScoreRange(att) {
  switch (att) {
    case "GDS":
    case "EXS+":
      return { min: 110, max: 130, mean: 118, sd: 5 };
    case "EXS":
      return { min: 95, max: 115, mean: 103, sd: 4 };
    case "WTS+":
      return { min: 85, max: 105, mean: 95, sd: 4 };
    case "WTS":
      return { min: 80, max: 100, mean: 90, sd: 4 };
    case "WTS-":
      return { min: 75, max: 92, mean: 83, sd: 4 };
    case "BLW":
      return { min: 70, max: 82, mean: 76, sd: 3 };
    case "PKF":
      return { min: 70, max: 85, mean: 77, sd: 3 };
    default:
      return { min: 85, max: 110, mean: 100, sd: 8 };
  }
}

// Year group → chronological age (in months, as of March 2026)
function yearGroupToAge(yg) {
  switch (yg) {
    case "Reception":
      return 5 * 12;
    case "Year 1":
      return 6 * 12;
    case "Year 2":
      return 7 * 12;
    case "Year 3":
      return 8 * 12;
    case "Year 4":
      return 9 * 12;
    case "Year 5":
      return 10 * 12;
    case "Year 6":
      return 11 * 12;
    default:
      return 8 * 12;
  }
}

function formatAge(months) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y}y ${m}m`;
}

function readingAgeFromScore(standardScore, chronoMonths) {
  // Standardised score 100 = age appropriate, +15 = +1 year
  const deviationYears = (standardScore - 100) / 15;
  const readingMonths = Math.round(chronoMonths + deviationYears * 12);
  return clamp(readingMonths, 48, 180); // 4y to 15y
}

// EHCP provisions by primary need
const ehcpProvisions = {
  ASD: [
    "Visual timetable for all transitions; Pre-teaching key vocabulary 15 mins daily; Quiet space available for sensory regulation; Now/next board on desk; Social stories for new situations and changes",
    "Structured visual schedule; Sensory breaks every 45 minutes; Social communication group x3/week; Noise-cancelling headphones available; Transition warnings 5 and 2 minutes before changes",
    "Individual workstation for independent tasks; Pre-warning of fire drills where possible; Social skills intervention x2/week; Fidget tools available; Reduced language instructions with visual support",
  ],
  PD: [
    "Wheelchair accessible workspace at correct height; Adapted writing equipment (pencil grip, slant board); Extra time 25% for written tasks; Physical breaks every 30 minutes; Scribe available for extended writing",
    "Standing frame available for carpet time; Physiotherapy programme integrated into school day; Laptop for written recording; Modified PE curriculum; Regular liaison with occupational therapist",
    "Adapted scissors and art equipment; Specialist seating with postural support; Rest breaks as needed; Ground floor access ensured; Intimate care plan in place",
    "Wheelchair-accessible workspace; Adapted writing tools and laptop; Physical therapy programme x2/week; Extra time 25% for all written tasks; Modified PE with specialist support",
  ],
  SEMH: [
    "Named safe adult (class TA); Emotion coaching sessions x3/week; Time-out card with agreed safe space; Check-in/check-out system daily; CAMHS referral maintained and reviewed termly",
    "Daily 1:1 check-in with key adult; Zones of Regulation programme; Reduced timetable review half-termly; Nurture group access 3 sessions/week; Play therapy x1/week",
    "Boxall Profile reviewed termly; Calm box on desk; Movement breaks between lessons; Positive behaviour plan with visual rewards; Therapeutic story intervention x2/week",
  ],
  SPLD: [
    "Coloured overlay (yellow) for all reading; Pre-teaching vocabulary for new topics; Text-to-speech software on laptop; Extra time 25% for assessments; Alternative recording methods (voice recorder)",
    "Reading ruler and overlay; Multi-sensory spelling programme x3/week; Dyslexia-friendly font on printed materials; Phonics catch-up intervention daily 15 mins; Modified homework expectations",
    "Touch-typing programme; Word banks for extended writing; Visual mind maps for planning; Extra processing time for verbal instructions; Spelling programme reviewed with SENCO half-termly",
  ],
  SLD: [
    "1:1 TA support full-time; Sensory curriculum adapted from EQUALS; Communication aids (switches, BIGmack); Modified learning objectives linked to Pre-Key Stage standards; Specialist equipment as per OT recommendations",
    "1:1 TA support across all lessons; TEACCH-based workstation; Visual supports throughout; Intensive interaction approach; Modified curriculum objectives from engagement model",
  ],
  HI: [
    "Radio aid system (Phonak Roger) checked daily; Front-of-class seating in all lessons; Visual aids for all verbal instructions; Deaf awareness training for all staff annually; BSL interpreter for assemblies and performances",
    "FM system provided and maintained; Acoustic conditions monitored termly; Pre-teaching vocabulary with visual supports; Subtitles enabled for all video content; Peripatetic Teacher of the Deaf x1/week",
  ],
  SLCN: [
    "SALT programme x2/week in school; Visual supports for communication throughout day; Colourful semantics approach for sentence building; Pre-teaching vocabulary for each topic; Makaton signs reinforced for key words",
    "Speech and language therapy programme x3/week; Word-finding strategies taught and reinforced; Narrative therapy approach; Visual timetable and task boards; Communication-friendly classroom checklist reviewed termly",
  ],
  PMLD: [
    "1:1 TA full-time with intimate care training; Sensory curriculum (TACPAC, Sensory Stories); Specialist seating (moulded chair with tray); Communication aids (eye gaze technology); Modified learning objectives using engagement model",
  ],
  OTH: [
    "Individualised learning plan reviewed half-termly; Key worker support during unstructured times; Multi-agency liaison meeting termly; Flexible arrangements for medical appointments; Environmental modifications as recommended by specialists",
  ],
  MSI: [
    "Multi-sensory teaching approach for all lessons; Environmental audit termly for sensory needs; Communication passport shared with all staff; Specialist advisory teacher visit x1/half-term; Tactile resources for core subjects",
  ],
  MLD: [
    "Small group intervention for literacy and numeracy daily; Pre-teaching of key vocabulary; Visual scaffolds for all tasks; Modified success criteria; Regular review meetings with parents x6/year",
  ],
  VI: [
    "Large print materials (N18 font minimum); High contrast resources; Magnification equipment (CCTV, iPad); Orientation and mobility support; Qualified Teacher of VI consultation x1/fortnight",
  ],
};

// Medical conditions by primary need (only for ~30-40% of SEN)
const medicalByNeed = {
  ASD: [
    "Sensory Processing Disorder",
    "Anxiety disorder",
    "Melatonin prescribed for sleep difficulties",
    "",
  ],
  PD: [
    "Cerebral Palsy",
    "Ehlers-Danlos Syndrome",
    "Spina Bifida",
    "Developmental Coordination Disorder",
  ],
  HI: [
    "Moderate hearing loss - bilateral aids",
    "Severe sensorineural hearing loss - cochlear implant (left)",
    "Moderate conductive hearing loss - bone-anchored aid",
  ],
  VI: ["Nystagmus", "Retinitis Pigmentosa", "Cortical Visual Impairment"],
  SEMH: ["", "", "", "Anxiety disorder", "ADHD (medicated)"],
  SLCN: ["", "", "", "Childhood apraxia of speech"],
  SPLD: ["", "", "", "Irlen syndrome"],
  MLD: ["", "", ""],
  SLD: ["Epilepsy (controlled)", "Global developmental delay", ""],
  PMLD: [
    "Complex epilepsy",
    "Cerebral Palsy with associated respiratory needs",
  ],
  MSI: ["Usher Syndrome", "", ""],
  OTH: ["", "Chronic fatigue syndrome", ""],
};

// Accessibility needs by primary need
const accessByNeed = {
  ASD: [
    "visual_timetable,sensory_breaks,reduced_noise",
    "visual_timetable,now_next_board,sensory_breaks",
    "reduced_transitions,visual_supports,quiet_space",
  ],
  PD: [
    "wheelchair_access,adapted_equipment,extra_time",
    "adapted_equipment,rest_breaks,accessible_toilet",
    "wheelchair_access,specialist_seating,laptop_access",
  ],
  HI: [
    "hearing_loop,front_seating,visual_alerts",
    "radio_aid,front_seating,subtitles",
    "hearing_loop,visual_instructions,reduced_background_noise",
  ],
  VI: [
    "large_print,high_contrast,magnification",
    "large_print,tactile_resources,screen_reader",
    "high_contrast,enlarged_materials,specialist_lighting",
  ],
  SEMH: [
    "quiet_space,emotion_check_ins,safe_adult",
    "calm_zone,movement_breaks,check_in_out",
    "",
  ],
  SLCN: [
    "visual_supports,communication_aids,pre_teaching",
    "makaton_signs,visual_timetable,word_banks",
    "",
  ],
  SPLD: [
    "dyslexia_friendly_font,coloured_overlay,extra_time",
    "text_to_speech,reading_ruler,modified_homework",
    "",
  ],
  MLD: ["visual_scaffolds,simplified_language,extra_time", "", ""],
  SLD: [
    "1_to_1_support,sensory_curriculum,communication_aids",
    "specialist_equipment,modified_objectives,sensory_room",
    "",
  ],
  PMLD: [
    "1_to_1_support,specialist_seating,communication_aids,sensory_curriculum",
    "full_time_support,intimate_care,eye_gaze_technology",
  ],
  MSI: [
    "multi_sensory_resources,environmental_audit,communication_passport",
    "",
  ],
  OTH: ["flexible_arrangements,key_worker_support", ""],
};

// Communication methods for SEN pupils
const commMethodsByNeed = {
  PMLD: ["AAC device", "PECS"],
  SLD: ["Verbal with visual supports", "Makaton signs", "PECS"],
  ASD: ["Verbal with visual supports", "Verbal", "Verbal"],
  SLCN: ["Verbal with visual supports", "Makaton signs", "Verbal"],
  HI: ["BSL", "Verbal with visual supports", "Verbal"],
};

// Track counts
let ealCount = 0;
let medicalCount = 0;
let accessCount = 0;
let ehcpProvCount = 0;
let commCount = 0;
let scoreCount = 0;

for (const pupil of rollData) {
  const id = pupil["Student ID"];
  const yg = pupil["Year Group"];
  const lang = pupil["First Language"];
  const senStatus = pupil["SEN Status"];
  const primaryNeed = pupil["SEN Primary Need"];
  const isEHCP = pupil["EHCP"] === "Yes";
  const isLAC = pupil["In Care (LAC)"] === "Yes";
  const name = `${pupil["Legal Last Name"]}, ${pupil["Legal First Name"]}`;
  const senRec = senById[id];

  // --- EAL Stage ---
  if (lang && lang !== "English") {
    pupil["EAL Stage"] = getEALStage(pupil["Admission Date"]);
    ealCount++;
  } else {
    pupil["EAL Stage"] = "";
  }

  // --- Ever in Care ---
  pupil["Ever in Care"] = isLAC ? "Yes" : "No";

  // --- Country of Birth ---
  if (lang && lang !== "English" && langCountryMap[lang]) {
    pupil["Country of Birth"] = randomChoice(langCountryMap[lang]);
  } else {
    pupil["Country of Birth"] = "United Kingdom";
  }

  // --- Medical Conditions (SEN pupils only, ~30-40%) ---
  if ((senStatus === "K" || senStatus === "E") && primaryNeed) {
    const options = medicalByNeed[primaryNeed] || [""];
    const medical = randomChoice(options);
    pupil["Medical Conditions"] = medical;
    if (medical) medicalCount++;
  } else {
    pupil["Medical Conditions"] = "";
  }

  // --- Accessibility Needs (EHCP and some SEN Support) ---
  if (primaryNeed && (isEHCP || (senStatus === "K" && seededRandom() < 0.4))) {
    const options = accessByNeed[primaryNeed] || [""];
    const validOptions = options.filter((o) => o !== "");
    if (validOptions.length > 0) {
      pupil["Accessibility Needs"] = randomChoice(validOptions);
      accessCount++;
    } else {
      pupil["Accessibility Needs"] = "";
    }
  } else {
    pupil["Accessibility Needs"] = "";
  }

  // --- EHCP Provisions (EHCP pupils only) ---
  if (isEHCP && primaryNeed) {
    const options = ehcpProvisions[primaryNeed] || ehcpProvisions["OTH"];
    // Use a deterministic index based on student ID to make each unique
    const idNum = parseInt(id.replace("ARB-", ""));
    const idx = idNum % options.length;
    pupil["EHCP Provisions"] = options[idx];
    ehcpProvCount++;
  } else {
    pupil["EHCP Provisions"] = "";
  }

  // --- Standardised Scores ---
  const trackerInfo = trackerLatest[name] || {};

  if (yg === "Reception") {
    // No standardised scores for Reception
    pupil["Standardised Score Reading"] = "";
    pupil["Standardised Score Maths"] = "";
    pupil["Reading Age"] = "";
    pupil["Spelling Age"] = "";
  } else {
    const readingAtt = trackerInfo["Reading"] || "";
    const mathsAtt = trackerInfo["Maths"] || "";

    const readRange = attainmentToScoreRange(readingAtt);
    const mathRange = attainmentToScoreRange(mathsAtt);

    let readScore = gaussianRandom(readRange.mean, readRange.sd);
    let mathScore = gaussianRandom(mathRange.mean, mathRange.sd);

    // EAL pupils: reading may be slightly lower but maths unaffected
    if (lang && lang !== "English") {
      const ealStage = pupil["EAL Stage"];
      if (ealStage === "B")
        readScore = Math.max(70, readScore - randomInt(5, 12));
      else if (ealStage === "C")
        readScore = Math.max(70, readScore - randomInt(3, 7));
      else if (ealStage === "D")
        readScore = Math.max(70, readScore - randomInt(0, 4));
    }

    // PD pupils can be academically strong
    // Other SEN pupils may have slightly adjusted scores (already reflected in attainment)

    readScore = clamp(readScore, 70, 135);
    mathScore = clamp(mathScore, 70, 135);

    pupil["Standardised Score Reading"] = readScore;
    pupil["Standardised Score Maths"] = mathScore;
    scoreCount++;

    // Reading Age
    const chronoMonths = yearGroupToAge(yg);
    const readingAgeMonths = readingAgeFromScore(readScore, chronoMonths);
    pupil["Reading Age"] = formatAge(readingAgeMonths);

    // Spelling Age (typically slightly lower than reading age)
    const spellingAgeMonths = clamp(
      readingAgeMonths - randomInt(0, 6),
      48,
      180,
    );
    pupil["Spelling Age"] = formatAge(spellingAgeMonths);
  }

  // --- Communication Method ---
  if (isEHCP && primaryNeed && commMethodsByNeed[primaryNeed]) {
    const options = commMethodsByNeed[primaryNeed];
    pupil["Communication Method"] = randomChoice(options);
    if (pupil["Communication Method"] !== "Verbal") commCount++;
  } else if (
    senStatus === "K" &&
    primaryNeed &&
    commMethodsByNeed[primaryNeed] &&
    seededRandom() < 0.15
  ) {
    const options = commMethodsByNeed[primaryNeed];
    const chosen = randomChoice(options);
    pupil["Communication Method"] = chosen;
    if (chosen !== "Verbal") commCount++;
  } else {
    pupil["Communication Method"] = "Verbal";
  }
}

console.log(`  EAL pupils assigned stage: ${ealCount}`);
console.log(`  Medical conditions assigned: ${medicalCount}`);
console.log(`  Accessibility needs assigned: ${accessCount}`);
console.log(`  EHCP provisions assigned: ${ehcpProvCount}`);
console.log(`  Non-verbal communication methods: ${commCount}`);
console.log(`  Standardised scores assigned: ${scoreCount} (excl. Reception)`);

// Write back pupil roll
const rollNewSheet = XLSX.utils.json_to_sheet(rollData);

// Set column widths for readability
const colWidths = {};
const cols = Object.keys(rollData[0]);
for (let i = 0; i < cols.length; i++) {
  const col = cols[i];
  if (col === "EHCP Provisions") colWidths[i] = { wch: 80 };
  else if (col === "Medical Conditions" || col === "Accessibility Needs")
    colWidths[i] = { wch: 40 };
  else if (col === "Country of Birth") colWidths[i] = { wch: 20 };
  else colWidths[i] = { wch: 18 };
}
rollNewSheet["!cols"] = Object.values(colWidths);

rollWb.Sheets[rollWb.SheetNames[0]] = rollNewSheet;
XLSX.writeFile(rollWb, rollPath);
console.log("  Pupil roll saved.\n");

// ═══════════════════════════════════════════════════════════
// TASK 3 (verification): Check tracker data structure
// ═══════════════════════════════════════════════════════════
console.log("=== TASK 3: Verify tracker data structure ===");

// Check Reception pupils have no 2023-24 data
const receptionTracker = trackerData.filter(
  (r) => r["Year Group"] === "Reception",
);
const reception2324 = receptionTracker.filter((r) => {
  return (
    r["2023-24 Aut1"] ||
    r["2023-24 Aut2"] ||
    r["2023-24 Spr1"] ||
    r["2023-24 Spr2"] ||
    r["2023-24 Sum1"] ||
    r["2023-24 Sum2"]
  );
});
console.log(
  `  Reception pupils with 2023-24 data: ${reception2324.length} (should be 0)`,
);

// Check Y1 pupils
const y1Tracker = trackerData.filter((r) => r["Year Group"] === "Year 1");
const y1_2324 = y1Tracker.filter((r) => {
  return (
    r["2023-24 Aut1"] ||
    r["2023-24 Aut2"] ||
    r["2023-24 Spr1"] ||
    r["2023-24 Spr2"] ||
    r["2023-24 Sum1"] ||
    r["2023-24 Sum2"]
  );
});
console.log(
  `  Y1 pupils with 2023-24 data: ${y1_2324.length} (most should have none — admitted Sept 2024)`,
);
if (y1_2324.length > 0) {
  // Show which Y1 pupils have prior data (could be valid if they started in nursery)
  const names = [...new Set(y1_2324.map((r) => r["Pupil Name"]))];
  console.log(`    Y1 pupils with prior data: ${names.join(", ")}`);
}

// Check 7 missing pupils (tracker vs roll)
const rollNames = new Set(
  rollData.map((p) => `${p["Legal Last Name"]}, ${p["Legal First Name"]}`),
);
const trackerNameSet = new Set(trackerData.map((t) => t["Pupil Name"]));
const inRollNotTracker = [...rollNames].filter((n) => !trackerNameSet.has(n));
const inTrackerNotRoll = [...trackerNameSet].filter((n) => !rollNames.has(n));
console.log(`  Roll pupils NOT in tracker: ${inRollNotTracker.length}`);
if (inRollNotTracker.length > 0) {
  inRollNotTracker.forEach((n) => console.log(`    ${n}`));
}
console.log(`  Tracker pupils NOT in roll: ${inTrackerNotRoll.length}`);
if (inTrackerNotRoll.length > 0) {
  inTrackerNotRoll.forEach((n) => console.log(`    ${n}`));
}

console.log("\n=== ENRICHMENT COMPLETE ===");
console.log("Now run: node apps/platform/scripts/validate-aurora-data.mjs");
