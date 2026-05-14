import { normalisePupilName } from "./pupil-data-normalise";
import { buildStyledTemplateExcelHtml } from "./upload-template-excel";

export const ASSET_TYPES = [
  "building",
  "room",
  "outlet",
  "equipment",
  "fire_extinguisher",
  "emergency_light",
  "lift",
  "playground_equipment",
  "accessibility_equipment",
  "vehicle",
  "furniture",
  "it_equipment",
  "kitchen_equipment",
  "av_equipment",
  "musical_instrument",
  "sports_equipment",
  "grounds_equipment",
  "teaching_resource",
  "signage",
  "security_equipment",
] as const;

export type AssetUploadRow = {
  asset_code: string;
  asset_name: string;
  asset_type: (typeof ASSET_TYPES)[number];
  category: string | null;
  subcategory: string | null;
  location_code: string | null;
  status: "active" | "inactive" | "disposed" | "under_repair" | "retired";
  condition_grade: "A" | "B" | "C" | "D" | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  notes: string | null;
};

export function assetUploadTemplate() {
  const { descriptions, fields, examples } = getAssetUploadTemplateRows();
  return [descriptions, fields, ...examples].map(toCsvRow).join("\n");
}

export function assetUploadExcelTemplate() {
  const { descriptions, fields, examples } = getAssetUploadTemplateRows();
  return buildStyledTemplateExcelHtml({
    title: "Schoolgle Assets Upload Template",
    guidance: "Rows 1-3 are guidance, row 4 explains the columns, row 5 is the exact import header. Start real asset data on row 6.",
    tip: "Tip: upload locations first, then use location_code to place each asset in the right room or area.",
    descriptions,
    headers: fields,
    rows: examples,
  });
}

export function parseAssetUploadCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (lines.length < 2) return { assets: [] as AssetUploadRow[], errors: ["CSV needs a header row and at least one asset row."] };

  const required = ["asset_code", "asset_name", "asset_type"];
  const { headers, headerIndex, missing } = findHeader(lines, required);
  if (missing.length > 0) return { assets: [] as AssetUploadRow[], errors: [`Missing required columns: ${missing.join(", ")}`] };

  const assets: AssetUploadRow[] = [];
  const errors: string[] = [];

  lines.slice(headerIndex + 1).forEach((line, index) => {
    const rowNumber = index + headerIndex + 2;
    const values = splitCsvLine(line);
    const raw: Record<string, string> = {};
    headers.forEach((header, valueIndex) => {
      raw[header] = values[valueIndex]?.trim() ?? "";
    });

    for (const field of required) {
      if (!raw[field]) errors.push(`Row ${rowNumber}: ${field} is required.`);
    }
    if (errors.some((error) => error.startsWith(`Row ${rowNumber}:`))) return;

    const assetType = normaliseAssetType(raw.asset_type);
    if (!assetType) {
      errors.push(`Row ${rowNumber}: asset_type must be one of ${ASSET_TYPES.join(", ")}.`);
      return;
    }

    assets.push({
      asset_code: raw.asset_code.trim().toUpperCase(),
      asset_name: normalisePupilName(raw.asset_name),
      asset_type: assetType,
      category: raw.category ? normalisePupilName(raw.category) : null,
      subcategory: raw.subcategory ? normalisePupilName(raw.subcategory) : null,
      location_code: raw.location_code ? raw.location_code.trim().toUpperCase() : null,
      status: normaliseStatus(raw.status),
      condition_grade: normaliseCondition(raw.condition_grade || raw.condition),
      manufacturer: raw.manufacturer || null,
      model: raw.model || null,
      serial_number: raw.serial_number || null,
      purchase_date: raw.purchase_date || null,
      warranty_expiry: raw.warranty_expiry || null,
      notes: raw.notes || null,
    });
  });

  return { assets, errors };
}

function getAssetUploadTemplateRows() {
  const descriptions = [
    "Stable unique asset code. Required. Use school-specific codes, e.g. RSP-FE-001.",
    "Display name. Required.",
    `Pick one: ${ASSET_TYPES.join("; ")}. Required.`,
    "Broad category, e.g. Fire Safety, IT, Furniture.",
    "Optional subcategory, e.g. CO2 extinguisher, laptop trolley.",
    "Location code from the Locations template, e.g. R022.",
    "active, inactive, disposed, under_repair or retired. Defaults to active.",
    "Optional condition grade: A, B, C or D.",
    "Optional manufacturer.",
    "Optional model.",
    "Optional serial number.",
    "Optional purchase date, ideally YYYY-MM-DD.",
    "Optional warranty expiry, ideally YYYY-MM-DD.",
    "Optional notes.",
  ];
  const fields = [
    "asset_code",
    "asset_name",
    "asset_type",
    "category",
    "subcategory",
    "location_code",
    "status",
    "condition_grade",
    "manufacturer",
    "model",
    "serial_number",
    "purchase_date",
    "warranty_expiry",
    "notes",
  ];
  const examples = [
    ["RSP-FE-001", "CO2 Fire Extinguisher", "fire_extinguisher", "Fire Safety", "CO2 extinguisher", "R022", "active", "A", "Chubb", "CO2 2kg", "FE001", "2024-09-01", "2029-09-01", ""],
    ["RSP-AV-004", "Interactive Whiteboard", "av_equipment", "Teaching Technology", "Interactive display", "R022", "active", "B", "Promethean", "ActivPanel", "AV004", "2022-04-01", "2027-04-01", ""],
    ["RSP-BOILER-1", "Main Boiler", "equipment", "Plant", "Boiler", "BOILER-1", "active", "B", "Ideal", "Evomax", "BLR001", "2020-08-01", "2027-08-01", ""],
  ];
  return { descriptions, fields, examples };
}

function normaliseAssetType(value: string): AssetUploadRow["asset_type"] | null {
  const key = value.trim().toLowerCase().replace(/[\s/-]+/g, "_");
  const aliases: Record<string, AssetUploadRow["asset_type"]> = {
    fire_extinguisher: "fire_extinguisher",
    extinguisher: "fire_extinguisher",
    emergency_light: "emergency_light",
    emergency_lighting: "emergency_light",
    playground: "playground_equipment",
    accessibility: "accessibility_equipment",
    furniture: "furniture",
    it: "it_equipment",
    ict: "it_equipment",
    av: "av_equipment",
    audio_visual: "av_equipment",
    kitchen: "kitchen_equipment",
    sports: "sports_equipment",
    grounds: "grounds_equipment",
    teaching_resource: "teaching_resource",
    security: "security_equipment",
  };
  const normalised = aliases[key] ?? key;
  return ASSET_TYPES.includes(normalised as AssetUploadRow["asset_type"])
    ? (normalised as AssetUploadRow["asset_type"])
    : null;
}

function normaliseStatus(value: string | null | undefined): AssetUploadRow["status"] {
  const key = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "inactive" || key === "disposed" || key === "under_repair" || key === "retired") return key;
  return "active";
}

function normaliseCondition(value: string | null | undefined): AssetUploadRow["condition_grade"] {
  const key = value?.trim().toUpperCase();
  return key === "A" || key === "B" || key === "C" || key === "D" ? key : null;
}

function findHeader(lines: string[], required: string[]) {
  for (let index = 0; index < Math.min(lines.length, 6); index += 1) {
    const headers = splitCsvLine(lines[index]).map(normaliseHeader);
    const missing = required.filter((field) => !headers.includes(field));
    if (missing.length === 0) return { headers, headerIndex: index, missing };
  }
  const headers = splitCsvLine(lines[0]).map(normaliseHeader);
  return { headers, headerIndex: 0, missing: required.filter((field) => !headers.includes(field)) };
}

function normaliseHeader(header: string) {
  return header.toLowerCase().trim().replace(/\*/g, "").replace(/[\s-]+/g, "_");
}

function toCsvRow(values: string[]) {
  return values.map((value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)).join(",");
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
