import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { parse } from "csv-parse";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("apps/platform/.env.local") });

const DOWNLOAD_DIR = path.resolve("analysis_outputs/ks2-characteristics/downloads");
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const DATASETS = {
  national: {
    pageUrl:
      "https://explore-education-statistics.service.gov.uk/data-catalogue/data-set/8777c80d-8b5f-4f00-b78c-457402a6efe7",
  },
  la: {
    pageUrl:
      "https://explore-education-statistics.service.gov.uk/data-catalogue/data-set/47cf924c-1a94-434d-bef7-e308377da60b",
  },
  schoolType: {
    pageUrl:
      "https://explore-education-statistics.service.gov.uk/data-catalogue/data-set/7c36e8a4-d625-4060-98bb-3f1ce6ca3659",
  },
};

const REQUESTED = new Set(
  (process.argv.find((arg) => arg.startsWith("--datasets="))?.split("=")[1] ??
    "national,schoolType")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = Number(
  process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? "0",
);
const FILTER_LA = process.argv
  .find((arg) => arg.startsWith("--la="))
  ?.split("=")[1]
  ?.trim()
  ?.toLowerCase();

function academicYears(timePeriod) {
  const value = String(timePeriod ?? "");
  if (!/^\d{6}$/.test(value)) return { start: null, end: null };
  return {
    start: Number(value.slice(0, 4)),
    end: Number(`${value.slice(0, 2)}${value.slice(4, 6)}`),
  };
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "" || value === "z" || value === "x") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function textOrNull(value) {
  if (value === undefined || value === null || value === "" || value === "z" || value === "x") {
    return null;
  }
  return String(value);
}

function deriveBreakdown(row) {
  const candidates = [
    ["Special education needs provision", row.sen_provision],
    ["Special education primary need", row.sen_primary_need],
    ["Disadvantage status", row.disadvantage_status],
    ["Free school meal status", row.fsm_status],
    ["First language status", row.first_language],
    ["Sex", row.sex],
    ["Ethnicity major", row.ethnicity_major],
    ["Ethnicity minor", row.ethnicity_minor],
    ["Month of birth", row.month_of_birth],
    ["Characteristics of each group", row.breakdown],
  ];

  const selected =
    candidates.find(([, value]) => value && value !== "Total") ??
    candidates.find(([, value]) => value);

  return {
    topic: selected?.[0] ?? row.breakdown_topic ?? "All pupils",
    value: selected?.[1] ?? row.breakdown ?? "Total",
  };
}

async function getMetadata(datasetKey, pageUrl) {
  const response = await fetch(pageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${pageUrl}: ${response.status}`);
  }
  const html = await response.text();
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) throw new Error(`Could not find __NEXT_DATA__ in ${pageUrl}`);
  const pageProps = JSON.parse(match[1]).props.pageProps;
  const dataSetFile = pageProps.dataSetFile;
  const apiVersion = pageProps.apiDataSetVersion;
  return {
    key: datasetKey,
    datasetId: dataSetFile.api.id,
    datasetTitle: dataSetFile.title,
    datasetVersion: dataSetFile.api.version,
    sourceUrl: pageUrl,
    downloadUrl: `https://content.explore-education-statistics.service.gov.uk/api/data-set-files/${dataSetFile.id}/download`,
    fileName: dataSetFile.file.name,
    releaseTitle: dataSetFile.release.title,
    releaseSlug: dataSetFile.release.slug,
    releasePublishedAt: dataSetFile.release.published,
    apiPublishedAt: apiVersion.published,
    totalResults: apiVersion.totalResults,
  };
}

async function download(metadata) {
  const target = path.join(DOWNLOAD_DIR, metadata.fileName);
  if (fs.existsSync(target) && fs.statSync(target).size > 0) {
    return target;
  }
  const response = await fetch(metadata.downloadUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${metadata.downloadUrl}: ${response.status}`);
  }
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(target));
  return target;
}

function mapRow(row, metadata) {
  const years = academicYears(row.time_period);
  const breakdown = deriveBreakdown(row);
  const mapped = {
    dataset_id: metadata.datasetId,
    dataset_title: metadata.datasetTitle,
    dataset_version: metadata.datasetVersion,
    source_url: metadata.sourceUrl,
    source_file_name: metadata.fileName,
    source_published_at: metadata.apiPublishedAt,
    source_release_title: metadata.releaseTitle,
    source_release_slug: metadata.releaseSlug,
    time_period: row.time_period,
    academic_year_start: years.start,
    academic_year_end: years.end,
    time_identifier: textOrNull(row.time_identifier),
    geographic_level: row.geographic_level,
    country_code: textOrNull(row.country_code),
    country_name: textOrNull(row.country_name),
    region_code: textOrNull(row.region_code),
    region_name: textOrNull(row.region_name),
    old_la_code: textOrNull(row.old_la_code),
    new_la_code: textOrNull(row.new_la_code),
    la_name: textOrNull(row.la_name),
    establishment_type_group: textOrNull(row.establishment_type_group),
    subject: row.subject ?? "Reading, writing and maths",
    breakdown_topic: row.breakdown_topic ?? breakdown.topic,
    breakdown: row.breakdown ?? breakdown.value,
    sex: textOrNull(row.sex),
    disadvantage_status: textOrNull(row.disadvantage_status),
    fsm_status: textOrNull(row.fsm_status),
    ethnicity_major: textOrNull(row.ethnicity_major),
    ethnicity_minor: textOrNull(row.ethnicity_minor),
    first_language: textOrNull(row.first_language),
    month_of_birth: textOrNull(row.month_of_birth),
    sen_provision: textOrNull(row.sen_provision),
    sen_primary_need: textOrNull(row.sen_primary_need),
    establishment_count: numberOrNull(row.establishment_count),
    eligible_pupil_count: numberOrNull(row.eligible_pupil_count),
    expected_standard_pupil_count: numberOrNull(row.expected_standard_pupil_count),
    higher_standard_pupil_count: numberOrNull(row.higher_standard_pupil_count),
    expected_standard_pupil_percent: numberOrNull(row.expected_standard_pupil_percent),
    higher_standard_pupil_percent: numberOrNull(row.higher_standard_pupil_percent),
    average_scaled_score: numberOrNull(row.average_scaled_score),
    progress_measure_score: numberOrNull(row.progress_measure_score),
    progress_measure_lower_conf_interval: numberOrNull(row.progress_measure_lower_conf_interval),
    progress_measure_upper_conf_interval: numberOrNull(row.progress_measure_upper_conf_interval),
    raw_snapshot: row,
  };
  mapped.dedupe_key = [
    mapped.dataset_id,
    mapped.dataset_version,
    mapped.time_period,
    mapped.geographic_level,
    mapped.country_code ?? "",
    mapped.region_code ?? "",
    mapped.new_la_code ?? "",
    mapped.old_la_code ?? "",
    mapped.la_name ?? "",
    mapped.establishment_type_group ?? "",
    mapped.subject,
    mapped.breakdown_topic,
    mapped.breakdown,
  ].join("|");
  return mapped;
}

function includeRow(row, metadata) {
  if (!FILTER_LA || metadata.key !== "la") return true;
  const haystack = [row.la_name, row.new_la_code, row.old_la_code, row.region_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return row.geographic_level === "National" || haystack.includes(FILTER_LA);
}

async function importFile(filePath, metadata, supabase) {
  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: true,
      bom: true,
      skip_empty_lines: true,
    }),
  );

  const batchSize = 1000;
  let batch = [];
  let seen = 0;
  let included = 0;
  let inserted = 0;

  for await (const row of parser) {
    seen += 1;
    if (!includeRow(row, metadata)) continue;
    included += 1;
    batch.push(mapRow(row, metadata));

    if (LIMIT && included >= LIMIT) break;
    if (batch.length >= batchSize) {
      if (!DRY_RUN) {
        const { error } = await supabase
          .from("dfe_ks2_characteristic_comparators")
          .upsert(batch, {
            onConflict: "dedupe_key",
          });
        if (error) throw error;
      }
      inserted += batch.length;
      batch = [];
      console.log(`[${metadata.key}] ${inserted} rows processed for import`);
    }
  }

  if (batch.length) {
    if (!DRY_RUN) {
      const { error } = await supabase
        .from("dfe_ks2_characteristic_comparators")
        .upsert(batch, {
          onConflict: "dedupe_key",
        });
      if (error) throw error;
    }
    inserted += batch.length;
  }

  return { seen, included, inserted: DRY_RUN ? 0 : inserted, dryRun: DRY_RUN };
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const summaries = [];
  for (const [key, config] of Object.entries(DATASETS)) {
    if (!REQUESTED.has(key)) continue;
    const metadata = await getMetadata(key, config.pageUrl);
    console.log(`[${key}] ${metadata.fileName} (${metadata.totalResults} rows)`);
    const filePath = await download(metadata);
    const summary = await importFile(filePath, metadata, supabase);
    summaries.push({ key, filePath, metadata, summary });
  }

  const output = path.resolve("analysis_outputs/ks2-characteristics/import-summary.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), summaries }, null, 2));
  console.log(JSON.stringify({ output, summaries: summaries.map(({ key, summary }) => ({ key, summary })) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
