#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

const args = parseArgs(process.argv.slice(2));
const input = args.input
  ? path.resolve(args.input)
  : path.resolve(process.cwd(), "../../analysis_outputs/sen/downloads/school-level-underlying-data-2025.csv");
const batchSize = Number(args.batchSize ?? 500);

if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const SOURCE_URL =
  args.sourceUrl ??
  "https://explore-education-statistics.service.gov.uk/find-statistics/special-educational-needs-in-england/2024-25";

const NEED_COLUMNS = [
  ["SPLD", "Specific Learning Difficulty", "Prov_SPLD"],
  ["MLD", "Moderate Learning Difficulty", "Prov_MLD"],
  ["SLD", "Severe Learning Difficulty", "Prov_SLD"],
  ["PMLD", "Profound and Multiple Learning Difficulty", "Prov_PMLD"],
  ["SEMH", "Social, Emotional and Mental Health", "Prov_SEMH"],
  ["SLCN", "Speech, Language and Communication Needs", "prov_slcn"],
  ["HI", "Hearing Impairment", "prov_hi"],
  ["VI", "Visual Impairment", "prov_vi"],
  ["MSI", "Multi-Sensory Impairment", "prov_msi"],
  ["PD", "Physical Disability", "prov_pd"],
  ["ASD", "Autistic Spectrum Disorder", "prov_asd"],
  ["OTH", "Other Difficulty/Disability", "prov_oth"],
];

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function numberValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value) {
  if (!value) return null;
  const [day, month, year] = String(value).split("/");
  if (!day || !month || !year) return null;
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function provisionNeeds(record) {
  return NEED_COLUMNS
    .map(([code, label, column]) => ({
      code,
      label,
      count: numberValue(record[column]) ?? 0,
    }))
    .filter((need) => need.count > 0);
}

function profileFromRecord(record, fetchedAt) {
  const urn = numberValue(record.URN);
  if (!urn) return null;

  const senUnitFlag = numberValue(record.SEN_Unit) ?? 0;
  const resourceProvisionFlag = numberValue(record.RP_Unit) ?? 0;
  const needs = provisionNeeds(record);
  const hasProvision = senUnitFlag > 0 || resourceProvisionFlag > 0;
  const totalPupils = numberValue(record["Total pupils"]);
  const senSupport = numberValue(record["SEN support"]);
  const ehcPlan = numberValue(record["EHC plan"]);

  const provisionType = hasProvision
    ? [
        resourceProvisionFlag > 0 ? "Resourced provision" : null,
        senUnitFlag > 0 ? "SEN unit" : null,
      ]
        .filter(Boolean)
        .join(" and ")
    : null;

  const notes = [
    "Imported from DfE Special educational needs in England school-level underlying data 2024/25.",
    "SEN_Unit and RP_Unit are source flags; capacity and GIAS named provision details require GIAS extended/bulk confirmation where available.",
  ];

  if (hasProvision && needs.length === 0) {
    notes.push("DfE file flags a provision, but provision need breakdown columns are zero or suppressed.");
  }

  return {
    urn,
    school_name: record.school_name || null,
    sen_provision_type: needs.length > 0 ? needs.map((need) => `${need.code} - ${need.label}`).join("; ") : null,
    resourced_provision_type: provisionType,
    resourced_provision_on_roll: null,
    resourced_provision_capacity: null,
    sen_unit_on_roll: null,
    sen_unit_capacity: null,
    gias_last_confirmed: dateValue(record.open_date),
    source_url: SOURCE_URL,
    source_method: "bulk_export",
    source_fetched_at: fetchedAt,
    confidence_status: hasProvision ? "verified" : "missing",
    validation_notes: notes,
    raw_snapshot: {
      time_period: record.time_period,
      la_name: record.la_name,
      new_la_code: record.new_la_code,
      phase_type_grouping: record.phase_type_grouping,
      type_of_establishment: record.type_of_establishment,
      total_pupils: totalPupils,
      sen_support: senSupport,
      ehc_plan: ehcPlan,
      sen_unit_flag: senUnitFlag,
      resource_provision_flag: resourceProvisionFlag,
      provision_needs: needs,
      primary_need_counts: Object.fromEntries(
        Object.keys(record)
          .filter((key) => key.startsWith("EHC_Primary_need_") || key.startsWith("SUP_Primary_need_"))
          .map((key) => [key, numberValue(record[key]) ?? 0]),
      ),
    },
  };
}

async function main() {
  const csv = fs.readFileSync(input);
  const records = parse(csv, { columns: true, bom: true, skip_empty_lines: true });
  const fetchedAt = new Date().toISOString();
  const rows = records
    .map((record) => profileFromRecord(record, fetchedAt))
    .filter(Boolean);

  let upserted = 0;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await supabase
      .from("school_gias_extended_profiles")
      .upsert(batch, { onConflict: "urn" });
    if (error) {
      console.error(`Failed batch ${index}-${index + batch.length}:`, error);
      process.exit(1);
    }
    upserted += batch.length;
    console.log(`Upserted ${upserted}/${rows.length}`);
  }

  const provisionRows = rows.filter((row) => row.resourced_provision_type !== null).length;
  console.log(
    JSON.stringify(
      {
        input,
        totalRecords: records.length,
        upserted,
        provisionRows,
        sourceUrl: SOURCE_URL,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
