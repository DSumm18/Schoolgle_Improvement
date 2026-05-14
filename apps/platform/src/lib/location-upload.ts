import { normalisePupilName } from "./pupil-data-normalise";
import { buildStyledTemplateExcelHtml } from "./upload-template-excel";

export const LOCATION_TYPES = [
  "Classroom",
  "Office",
  "Hall",
  "Kitchen",
  "Toilet",
  "Accessible Toilet",
  "Corridor",
  "Store Room",
  "Staff Room",
  "Meeting Room",
  "Library",
  "Dining Hall",
  "Entrance / Reception",
  "SEN / Intervention Room",
  "Medical / First Aid Room",
  "ICT / Computing Room",
  "Art / DT Room",
  "Music Room",
  "Science Room",
  "Changing Room",
  "Cleaner’s Store",
  "Plant Room",
  "Boiler Room",
  "Electrical / Switch Room",
  "Server / Comms Room",
  "Caretaker / Site Office",
  "Workshop",
  "Playground",
  "Field",
  "MUGA / Sports Court",
  "Car Park",
  "Path / External Route",
  "Boundary / Fence Line",
  "Roof",
  "External Store",
  "Bin Store",
  "Site",
  "Building / Block",
  "Extension",
  "Modular Building",
  "Floor",
  "Stairwell",
  "TBC / Other",
];

export type LocationUploadRow = {
  location_code: string;
  location_name: string;
  location_type: string;
  broad_type: "site" | "building" | "floor" | "room" | "exterior";
  parent_location_code: string | null;
  building_or_block: string | null;
  floor: string | null;
  current_use: string | null;
  area_sqm: number | null;
  capacity: number | null;
  year_built: string | null;
  notes: string | null;
  active: boolean;
};

export function locationUploadTemplate() {
  const { descriptions, fields, examples } = getLocationUploadTemplateRows();
  return [descriptions, fields, ...examples].map(toCsvRow).join("\n");
}

export function locationUploadExcelTemplate() {
  const { descriptions, fields, examples } = getLocationUploadTemplateRows();
  return buildStyledTemplateExcelHtml({
    title: "Schoolgle Locations Upload Template",
    guidance: "Rows 1-3 are guidance, row 4 explains the columns, row 5 is the exact import header. Start real location data on row 6.",
    tip: "Tip: location_type is controlled. Use Classroom, Office, Hall, Kitchen, Toilet or TBC / Other; names can be specific, e.g. Headteacher Office.",
    descriptions,
    headers: fields,
    rows: examples,
  });
}

export async function locationUploadXlsxTemplate(locationRows?: string[][]) {
  const JSZip = (await import("jszip")).default;
  const { descriptions, fields, examples } = getLocationUploadTemplateRows();
  const rows = [
    [`Schoolgle Locations Upload Template`],
    [`Rows 1-3 are guidance, row 4 explains the columns, row 5 is the exact import header. Start real location data on row 6.`],
    [`Tip: location_type is controlled. Use the dropdown in column C. Blank or odd values import as TBC / Other.`],
    descriptions,
    fields,
    ...(locationRows?.length ? locationRows : examples),
  ];
  const zip = new JSZip();

  zip.file("[Content_Types].xml", contentTypesXml());
  zip.folder("_rels")?.file(".rels", rootRelsXml());
  zip.folder("xl")?.file("workbook.xml", workbookXml());
  zip.folder("xl/_rels")?.file("workbook.xml.rels", workbookRelsXml());
  zip.folder("xl/worksheets")?.file("sheet1.xml", worksheetXml(rows));
  zip.folder("xl/worksheets")?.file("sheet2.xml", listsWorksheetXml());
  zip.folder("xl")?.file("styles.xml", stylesXml());

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export function parseLocationUploadCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (lines.length < 2) return { locations: [] as LocationUploadRow[], errors: ["CSV needs a header row and at least one location row."] };

  const required = ["location_code", "location_name"];
  const { headers, headerIndex, missing } = findHeader(lines, required);
  if (missing.length > 0) return { locations: [] as LocationUploadRow[], errors: [`Missing required columns: ${missing.join(", ")}`] };

  const locations: LocationUploadRow[] = [];
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

    const locationType = normaliseLocationType(raw.location_type);
    locations.push({
      location_code: raw.location_code.trim().toUpperCase(),
      location_name: normalisePupilName(raw.location_name),
      location_type: locationType,
      broad_type: broadLocationType(locationType),
      parent_location_code: raw.parent_location_code ? raw.parent_location_code.trim().toUpperCase() : null,
      building_or_block: raw.building_or_block ? normalisePupilName(raw.building_or_block) : null,
      floor: raw.floor || null,
      current_use: raw.current_use || null,
      area_sqm: parseAreaSqm(raw.area_sqm || raw.area || raw.size),
      capacity: raw.capacity ? Number.parseInt(raw.capacity, 10) || null : null,
      year_built: raw.year_built || null,
      notes: raw.notes || null,
      active: raw.active ? toBool(raw.active) : true,
    });
  });

  return { locations, errors };
}

function getLocationUploadTemplateRows() {
  const descriptions = [
    "Stable unique code, e.g. SITE, MAIN, MAIN-GF, R022. Required.",
    "Display name, e.g. Room 22, Main Hall, Headteacher Office. Required.",
    `Controlled type. Common choices first: ${LOCATION_TYPES.join("; ")}. Blank or unknown imports as TBC / Other.`,
    "Optional parent code, e.g. room parent is floor/building.",
    "Optional building/block label.",
    "Optional floor label or number.",
    "Optional current use, e.g. Year 4 classroom, storage.",
    "Optional area. Use sqm/m2 or sqft/sq ft; stored as sqm.",
    "Optional capacity/headcount.",
    "Optional year built/opened.",
    "Optional notes.",
    "yes/no. Defaults to yes.",
  ];
  const fields = [
    "location_code",
    "location_name",
    "location_type",
    "parent_location_code",
    "building_or_block",
    "floor",
    "current_use",
    "area_sqm",
    "capacity",
    "year_built",
    "notes",
    "active",
  ];
  const examples = [
    ["SITE", "Rawdon St Peter’s", "Site", "", "", "", "Main school site", "", "", "", "", "yes"],
    ["MAIN", "Main Building", "Building / Block", "SITE", "Main Building", "", "Teaching block", "", "", "1890", "", "yes"],
    ["MAIN-GF", "Ground Floor", "Floor", "MAIN", "Main Building", "0", "", "", "", "", "", "yes"],
    ["R022", "Room 22", "Classroom", "MAIN-GF", "Main Building", "0", "Year 4 classroom", "52 sqm", "30", "", "", "yes"],
    ["HT-OFFICE", "Headteacher Office", "Office", "MAIN-GF", "Main Building", "0", "Headteacher office", "14 sqm", "3", "", "", "yes"],
    ["BOILER-1", "Main Boiler Room", "Boiler Room", "MAIN-GF", "Main Building", "0", "Plant", "18 m2", "", "", "", "yes"],
    ["UNKNOWN-1", "Room To Confirm", "", "MAIN-GF", "Main Building", "0", "", "", "", "", "To classify later", "yes"],
  ];
  return { descriptions, fields, examples };
}

export function normaliseLocationType(value: string | null | undefined) {
  const cleaned = value?.trim().replace(/\s+/g, " ") ?? "";
  if (!cleaned) return "TBC / Other";
  const match = LOCATION_TYPES.find((type) => type.toLowerCase() === cleaned.toLowerCase());
  return match ?? "TBC / Other";
}

export function broadLocationType(locationType: string): LocationUploadRow["broad_type"] {
  const lower = locationType.toLowerCase();
  if (lower.includes("site")) return "site";
  if (lower.includes("building") || lower.includes("block") || lower.includes("extension") || lower.includes("modular")) return "building";
  if (lower === "floor") return "floor";
  if (["playground", "field", "muga / sports court", "car park", "path / external route", "boundary / fence line", "roof"].includes(lower)) return "exterior";
  return "room";
}

function parseAreaSqm(value: string | null | undefined) {
  if (!value) return null;
  const numeric = Number.parseFloat(value.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const lower = value.toLowerCase();
  if (lower.includes("sq ft") || lower.includes("sqft") || lower.includes("ft2") || lower.includes("ft²")) {
    return Math.round(numeric * 0.092903 * 100) / 100;
  }
  return numeric;
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

function toBool(value: string | boolean | undefined) {
  if (typeof value === "boolean") return value;
  if (!value) return false;
  return ["true", "yes", "y", "1", "active"].includes(value.trim().toLowerCase());
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

function worksheetXml(rows: string[][]) {
  const maxColumns = 12;
  const paddedRows = rows.map((row) => Array.from({ length: maxColumns }, (_, index) => row[index] ?? ""));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <cols>${Array.from({ length: maxColumns }, (_, index) => `<col min="${index + 1}" max="${index + 1}" width="${index === 2 ? 28 : index < 3 ? 22 : 18}" customWidth="1"/>`).join("")}</cols>
  <sheetData>
    ${paddedRows.map((row, index) => rowXml(index + 1, row)).join("\n")}
  </sheetData>
  <mergeCells count="3">
    <mergeCell ref="A1:L1"/>
    <mergeCell ref="A2:L2"/>
    <mergeCell ref="A3:L3"/>
  </mergeCells>
  <dataValidations count="4">
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="C6:C505">
      <formula1>Lists!$A$1:$A$${LOCATION_TYPES.length}</formula1>
    </dataValidation>
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="L6:L505">
      <formula1>Lists!$B$1:$B$2</formula1>
    </dataValidation>
    <dataValidation type="decimal" operator="greaterThanOrEqual" allowBlank="1" showErrorMessage="1" sqref="H6:H505">
      <formula1>0</formula1>
    </dataValidation>
    <dataValidation type="whole" operator="greaterThanOrEqual" allowBlank="1" showErrorMessage="1" sqref="I6:I505">
      <formula1>0</formula1>
    </dataValidation>
  </dataValidations>
</worksheet>`;
}

function listsWorksheetXml() {
  const yesNo = ["yes", "no"];
  const rowCount = Math.max(LOCATION_TYPES.length, yesNo.length);
  const rows = Array.from({ length: rowCount }, (_, index) => [
    LOCATION_TYPES[index] ?? "",
    yesNo[index] ?? "",
  ]);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rows.map((row, index) => rowXml(index + 1, row)).join("\n")}</sheetData>
</worksheet>`;
}

function rowXml(rowNumber: number, values: string[]) {
  const height = rowNumber === 1 ? 28 : rowNumber <= 3 ? 38 : rowNumber === 4 ? 46 : 20;
  return `<row r="${rowNumber}" ht="${height}" customHeight="1">${values
    .map((value, index) => {
      const cellRef = `${columnName(index + 1)}${rowNumber}`;
      const style = rowNumber <= 3 ? 1 : rowNumber === 4 ? 2 : rowNumber === 5 ? 3 : 0;
      return `<c r="${cellRef}" t="inlineStr"${style ? ` s="${style}"` : ""}><is><t>${escapeXml(value)}</t></is></c>`;
    })
    .join("")}</row>`;
}

function columnName(index: number) {
  let name = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function workbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Locations" sheetId="1" r:id="rId1"/>
    <sheet name="Lists" sheetId="2" state="hidden" r:id="rId2"/>
  </sheets>
</workbook>`;
}

function workbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Aptos"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="14"/><name val="Aptos"/></font>
    <font><i/><color rgb="FF334155"/><sz val="11"/><name val="Aptos"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf numFmtId="49" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
    <xf numFmtId="49" fontId="3" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
