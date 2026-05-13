import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("apps/platform/.env.local") });

const ORG_ID = "d9d1ac2c-5eff-4043-98f4-e1c43f616fd3";
const OUTPUT_DIR = path.resolve("analysis_outputs/grove-house");
const NATIONAL_FILE = path.resolve(
  "analysis_outputs/ks2-characteristics/downloads/ks2_national_pupil_characteristics_2016_to_2025_revised.csv",
);
const SCHOOL_TYPE_FILE = path.resolve(
  "analysis_outputs/ks2-characteristics/downloads/ks2_school_type_and_pupil_characteristics_2025_revised.csv",
);

const BRADFORD_LA_CODE = "E08000032";
const LA_DATASET_ID = "d42e9901-ffd5-0871-87a4-5c99e5ae1f62";
const DFE_RELEASE = {
  title: "DfE Key stage 2 attainment, Academic year 2024/25 Revised",
  published: "2025-12-11T09:30:00Z",
  catalogueUrl:
    "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25-revised",
  nationalDataset:
    "Attainment by pupil characteristics (ks2_national_pupil_characteristics_2016_to_2025_revised.csv)",
  laDataset:
    "Attainment by region, local authority and pupil characteristics",
  schoolTypeDataset:
    "Attainment by school type and pupil characteristics",
};

function pct(n, d) {
  return d ? Math.round((n * 1000) / d) / 10 : null;
}

function gap(value, comparator) {
  if (value === null || value === undefined || comparator === null || comparator === undefined) return null;
  return Math.round((Number(value) - Number(comparator)) * 10) / 10;
}

function isARE(value) {
  return ["EXS", "GDS", "2", "3", "ELG", "M", "E", "P"].includes(
    String(value ?? "").toUpperCase(),
  );
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "" || value === "z" || value === "x") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function groupStats(pupils) {
  const stats = { n: pupils.length, r: 0, w: 0, m: 0, c: 0 };
  for (const pupil of pupils) {
    const reading = isARE(pupil.attainment_reading);
    const writing = isARE(pupil.attainment_writing);
    const maths = isARE(pupil.attainment_maths);
    if (reading) stats.r += 1;
    if (writing) stats.w += 1;
    if (maths) stats.m += 1;
    if (reading && writing && maths) stats.c += 1;
  }
  return {
    pupils: stats.n,
    reading: pct(stats.r, stats.n),
    writing: pct(stats.w, stats.n),
    maths: pct(stats.m, stats.n),
    combinedRwm: pct(stats.c, stats.n),
  };
}

function isTotalRow(row, except = []) {
  const dimensions = [
    "sex",
    "disadvantage_status",
    "fsm_status",
    "ethnicity_major",
    "ethnicity_minor",
    "first_language",
    "month_of_birth",
    "sen_provision",
    "sen_primary_need",
  ];
  return dimensions.every((dimension) => except.includes(dimension) || row[dimension] === "Total");
}

function nationalComparator(rows, dimension, value) {
  const row = rows.find(
    (candidate) =>
      candidate.time_period === "202425" &&
      candidate.subject === "Reading, writing and maths" &&
      candidate[dimension] === value &&
      isTotalRow(candidate, [dimension]),
  );
  return row
    ? {
        expected: numberOrNull(row.expected_standard_pupil_percent),
        eligible: numberOrNull(row.eligible_pupil_count),
        source: DFE_RELEASE.nationalDataset,
      }
    : null;
}

function schoolTypeComparator(rows, establishmentTypeGroup, breakdownTopic, breakdown) {
  const row = rows.find(
    (candidate) =>
      candidate.time_period === "202425" &&
      candidate.establishment_type_group === establishmentTypeGroup &&
      candidate.breakdown_topic === breakdownTopic &&
      candidate.breakdown === breakdown,
  );
  return row
    ? {
        expected: numberOrNull(row.expected_standard_pupil_percent),
        eligible: numberOrNull(row.eligible_pupil_count),
        source: DFE_RELEASE.schoolTypeDataset,
      }
    : null;
}

function cleanDebugLabel(value) {
  if (!value) return null;
  return String(value)
    .replace(/^[^:]+ :: /, "")
    .replace(/ \(code = .*$/, "")
    .trim();
}

function debugMap(record) {
  const output = {};
  for (const [key, value] of Object.entries(record.filters ?? {})) {
    const name = key.replace(/^[^:]+ :: /, "");
    output[name] = cleanDebugLabel(value);
  }
  return output;
}

function valueMap(record) {
  const output = {};
  for (const [key, value] of Object.entries(record.values ?? {})) {
    const name = key.replace(/^[^:]+ :: /, "");
    output[name] = value;
  }
  return output;
}

function isBradfordTotal(filters, except = []) {
  const dimensions = [
    "sex",
    "sen_provision",
    "first_language",
    "disadvantage_status",
    "fsm_status",
    "ethnicity_minor",
  ];
  return dimensions.every((dimension) => except.includes(dimension) || filters[dimension] === "Total");
}

async function fetchBradfordRows() {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await fetch(
      `https://api.education.gov.uk/statistics/v1/data-sets/${LA_DATASET_ID}/query`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          criteria: {
            locations: {
              eq: { level: "LA", code: BRADFORD_LA_CODE },
            },
          },
          debug: true,
          page,
          pageSize: 10000,
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Bradford API query failed: ${response.status}`);
    }
    const json = await response.json();
    totalPages = json.paging.totalPages;
    rows.push(...json.results);
    page += 1;
  } while (page <= totalPages);
  return rows;
}

function bradfordComparator(rows, dimension, value) {
  const record = rows.find((candidate) => {
    if (candidate.timePeriod?.period !== "2024/2025") return false;
    const filters = debugMap(candidate);
    return (
      filters.subject === "Reading, writing and maths" &&
      filters[dimension] === value &&
      isBradfordTotal(filters, [dimension])
    );
  });
  if (!record) return null;
  const values = valueMap(record);
  return {
    expected: numberOrNull(values.expected_standard_pupil_percent),
    eligible: numberOrNull(values.eligible_pupil_count),
    establishments: numberOrNull(values.establishment_count),
    source: DFE_RELEASE.laDataset,
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const [{ data: pupils, error }, { data: org }] = await Promise.all([
    supabase
      .from("ls_pupils")
      .select(
        "pupil_ref,year_group,gender,has_ehcp,has_send_support,send_primary_need,is_pupil_premium,is_eal,attainment_reading,attainment_writing,attainment_maths",
      )
      .eq("organization_id", ORG_ID)
      .limit(1000),
    supabase.from("organizations").select("id,name,urn,local_authority").eq("id", ORG_ID).single(),
  ]);
  if (error) throw error;

  const nationalRows = parse(fs.readFileSync(NATIONAL_FILE), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
  });
  const schoolTypeRows = parse(fs.readFileSync(SCHOOL_TYPE_FILE), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
  });
  const bradfordRows = await fetchBradfordRows();

  const groups = {
    all: pupils,
    nonSend: pupils.filter((pupil) => !(pupil.has_send_support || pupil.has_ehcp)),
    send: pupils.filter((pupil) => pupil.has_send_support || pupil.has_ehcp),
    senSupport: pupils.filter((pupil) => pupil.has_send_support && !pupil.has_ehcp),
    ehcp: pupils.filter((pupil) => pupil.has_ehcp),
    pp: pupils.filter((pupil) => pupil.is_pupil_premium),
    nonPp: pupils.filter((pupil) => !pupil.is_pupil_premium),
    eal: pupils.filter((pupil) => pupil.is_eal),
    nonEal: pupils.filter((pupil) => !pupil.is_eal),
    boys: pupils.filter((pupil) => pupil.gender === "M"),
    girls: pupils.filter((pupil) => pupil.gender === "F"),
  };

  const groupComparators = {
    all: {
      national: nationalComparator(nationalRows, "sen_provision", "Total"),
      bradford: bradfordComparator(bradfordRows, "sen_provision", "Total"),
      maintainedNational: schoolTypeComparator(
        schoolTypeRows,
        "Local authority maintained",
        "Characteristics of each group",
        "Total",
      ),
    },
    nonSend: {
      national: nationalComparator(nationalRows, "sen_provision", "No SEN provision"),
      bradford: bradfordComparator(bradfordRows, "sen_provision", "No SEN provision"),
    },
    send: {
      national: nationalComparator(nationalRows, "sen_provision", "All SEN provision"),
      bradford: bradfordComparator(bradfordRows, "sen_provision", "All SEN provision"),
    },
    senSupport: {
      national: nationalComparator(
        nationalRows,
        "sen_provision",
        "SEN support / SEN without an EHC plan",
      ),
      bradford: bradfordComparator(
        bradfordRows,
        "sen_provision",
        "SEN support / SEN without an EHC plan",
      ),
    },
    ehcp: {
      national: nationalComparator(nationalRows, "sen_provision", "Education, health and care plan"),
      bradford: bradfordComparator(bradfordRows, "sen_provision", "Education, health and care plan"),
    },
    pp: {
      national: nationalComparator(nationalRows, "fsm_status", "FSM eligible"),
      bradford: bradfordComparator(bradfordRows, "fsm_status", "FSM eligible"),
    },
    nonPp: {
      national: nationalComparator(nationalRows, "fsm_status", "Not known to be FSM eligible"),
      bradford: bradfordComparator(bradfordRows, "fsm_status", "Not known to be FSM eligible"),
    },
    eal: {
      national: nationalComparator(
        nationalRows,
        "first_language",
        "Known or believed to be other than English",
      ),
      bradford: bradfordComparator(
        bradfordRows,
        "first_language",
        "Known or believed to be other than English",
      ),
    },
    nonEal: {
      national: nationalComparator(nationalRows, "first_language", "Known or believed to be English"),
      bradford: bradfordComparator(bradfordRows, "first_language", "Known or believed to be English"),
    },
    boys: {
      national: nationalComparator(nationalRows, "sex", "Boys"),
      bradford: bradfordComparator(bradfordRows, "sex", "Boys"),
    },
    girls: {
      national: nationalComparator(nationalRows, "sex", "Girls"),
      bradford: bradfordComparator(bradfordRows, "sex", "Girls"),
    },
  };

  const analysis = Object.fromEntries(
    Object.entries(groups).map(([key, value]) => {
      const stats = groupStats(value);
      const comparators = groupComparators[key] ?? {};
      return [
        key,
        {
          ...stats,
          comparators,
          gapToNational: gap(stats.combinedRwm, comparators.national?.expected),
          gapToBradford: gap(stats.combinedRwm, comparators.bradford?.expected),
        },
      ];
    }),
  );

  const keyMessages = [
    `Grove House current profile shows ${analysis.nonSend.combinedRwm}% combined RWM for non-SEND pupils against exact DfE national non-SEN comparator ${analysis.nonSend.comparators.national?.expected}% and Bradford non-SEN comparator ${analysis.nonSend.comparators.bradford?.expected}%.`,
    `Grove House SEND/EHCP pupils show ${analysis.send.combinedRwm}% combined RWM against exact DfE national SEN provision comparator ${analysis.send.comparators.national?.expected}% and Bradford SEN provision comparator ${analysis.send.comparators.bradford?.expected}%.`,
    `SEN Support pupils show ${analysis.senSupport.combinedRwm}% combined RWM against national ${analysis.senSupport.comparators.national?.expected}% and Bradford ${analysis.senSupport.comparators.bradford?.expected}%.`,
    `EHCP pupils show ${analysis.ehcp.combinedRwm}% combined RWM against national ${analysis.ehcp.comparators.national?.expected}% and Bradford ${analysis.ehcp.comparators.bradford?.expected}%.`,
    `EAL pupils show ${analysis.eal.combinedRwm}% combined RWM against national EAL ${analysis.eal.comparators.national?.expected}% and Bradford EAL ${analysis.eal.comparators.bradford?.expected}%.`,
  ];

  const result = {
    generatedAt: new Date().toISOString(),
    organization: org,
    sources: DFE_RELEASE,
    bradfordApiRowsFetched: bradfordRows.length,
    analysis,
    keyMessages,
  };

  const jsonPath = path.join(OUTPUT_DIR, "grove-house-ks2-characteristic-comparator-analysis.json");
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

  const md = [
    "# Grove House KS2 Characteristic Comparator Analysis",
    "",
    `Generated: ${result.generatedAt}`,
    "",
    "## Sources",
    `- School pupil/profile data: \`ls_pupils\`, Grove House organisation \`${ORG_ID}\`.`,
    `- DfE national comparator: ${DFE_RELEASE.nationalDataset}, ${DFE_RELEASE.title}, published ${DFE_RELEASE.published}.`,
    `- DfE Bradford comparator: ${DFE_RELEASE.laDataset}, API dataset \`${LA_DATASET_ID}\`, ${DFE_RELEASE.title}, published ${DFE_RELEASE.published}.`,
    `- DfE source URL: ${DFE_RELEASE.catalogueUrl}`,
    "",
    "## Key Messages",
    ...keyMessages.map((message) => `- ${message}`),
    "",
    "## Comparator Table",
    "| Group | Grove House pupils | GH current combined RWM | National comparator | Gap to national | Bradford comparator | Gap to Bradford |",
    "|---|---:|---:|---:|---:|---:|---:|",
    ...Object.entries(analysis).map(([key, row]) => {
      return `| ${key} | ${row.pupils} | ${row.combinedRwm ?? ""}% | ${row.comparators.national?.expected ?? ""}% | ${row.gapToNational ?? ""}pp | ${row.comparators.bradford?.expected ?? ""}% | ${row.gapToBradford ?? ""}pp |`;
    }),
    "",
    "## Product Interpretation",
    "- The DfE comparator layer changes the narrative from headline attainment to subgroup accountability.",
    "- Grove House non-SEND pupils should not be judged against all-pupil national alone; the exact non-SEN comparator is materially higher.",
    "- Grove House SEND, SEN Support and EHCP cohorts need separate narrative because the expected comparator differs sharply by provision level.",
    "- This should feed Trust Assessor and Ofsted Readiness as a source-labelled explanation layer, not as an unlabelled judgement.",
  ];

  const mdPath = path.join(OUTPUT_DIR, "grove-house-ks2-characteristic-comparator-analysis.md");
  fs.writeFileSync(mdPath, md.join("\n"));
  console.log(JSON.stringify({ jsonPath, mdPath, keyMessages }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
