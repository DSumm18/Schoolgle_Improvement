export type ImportVehicleType = "car" | "motorcycle" | "bicycle";

export interface MileageImportRow {
  staff_name: string;
  claim_date: string;
  from_location: string;
  to_location: string;
  miles: number;
  purpose: string | null;
  rate_pence: number;
  vehicle_type: ImportVehicleType;
}

export interface MileageImportResult {
  validRows: MileageImportRow[];
  errors: string[];
}

const HEADER_ALIASES = {
  staff_name: ["staff", "staffname", "staff_name", "staffmember", "employee", "name"],
  claim_date: ["date", "claimdate", "claim_date", "journeydate", "traveldate"],
  from_location: ["from", "fromlocation", "from_location", "start", "origin"],
  to_location: ["to", "tolocation", "to_location", "destination", "end"],
  miles: ["miles", "mileage", "distance", "businessmiles"],
  purpose: ["purpose", "reason", "description", "notes"],
  rate_pence: ["rate", "ratepence", "rate_pence", "ppm", "pencepermile"],
  vehicle_type: ["vehicle", "vehicletype", "vehicle_type", "transport"],
} as const;

function normaliseHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index++;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current.trim());
  return cells;
}

function mapHeaders(headers: string[]) {
  const normalisedHeaders = headers.map(normaliseHeader);
  const mapped: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
    [keyof typeof HEADER_ALIASES, readonly string[]]
  >) {
    const index = normalisedHeaders.findIndex((header) =>
      aliases.includes(header),
    );
    if (index >= 0) mapped[field] = index;
  }

  return mapped;
}

function getCell(
  cells: string[],
  mappedHeaders: Partial<Record<keyof typeof HEADER_ALIASES, number>>,
  field: keyof typeof HEADER_ALIASES,
) {
  const index = mappedHeaders[field];
  return index === undefined ? "" : (cells[index] ?? "").trim();
}

function parseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const ukMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function parseMiles(value: string) {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const miles = Number(cleaned);
  return Number.isFinite(miles) ? miles : 0;
}

function parseRatePence(value: string) {
  if (!value.trim()) return 45;
  const cleaned = value.toLowerCase().replace(/pence|ppm|per mile|\/mile/g, "");
  const numeric = Number(cleaned.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return 45;
  return numeric <= 1 ? numeric * 100 : numeric;
}

function parseVehicleType(value: string): ImportVehicleType {
  const normalised = normaliseHeader(value);
  if (normalised.includes("motor")) return "motorcycle";
  if (normalised.includes("bike") || normalised.includes("cycle")) {
    return "bicycle";
  }
  return "car";
}

export function parseMileageClaimsCsv(csvText: string): MileageImportResult {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { validRows: [], errors: ["CSV file is empty."] };
  }

  const headers = splitCsvLine(lines[0]);
  const mappedHeaders = mapHeaders(headers);
  const validRows: MileageImportRow[] = [];
  const errors: string[] = [];

  for (let index = 1; index < lines.length; index++) {
    const rowNumber = index + 1;
    const cells = splitCsvLine(lines[index]);
    const claimDate = parseDate(getCell(cells, mappedHeaders, "claim_date"));
    const staffName = getCell(cells, mappedHeaders, "staff_name");
    const fromLocation = getCell(cells, mappedHeaders, "from_location");
    const toLocation = getCell(cells, mappedHeaders, "to_location");
    const miles = parseMiles(getCell(cells, mappedHeaders, "miles"));

    if (!claimDate) {
      errors.push(`Row ${rowNumber}: claim date is required.`);
      continue;
    }
    if (!staffName) {
      errors.push(`Row ${rowNumber}: staff name is required.`);
      continue;
    }
    if (!fromLocation || !toLocation) {
      errors.push(`Row ${rowNumber}: from and to locations are required.`);
      continue;
    }
    if (miles <= 0) {
      errors.push(`Row ${rowNumber}: miles must be greater than zero.`);
      continue;
    }

    validRows.push({
      staff_name: staffName,
      claim_date: claimDate,
      from_location: fromLocation,
      to_location: toLocation,
      miles,
      purpose: getCell(cells, mappedHeaders, "purpose") || null,
      rate_pence: parseRatePence(getCell(cells, mappedHeaders, "rate_pence")),
      vehicle_type: parseVehicleType(
        getCell(cells, mappedHeaders, "vehicle_type"),
      ),
    });
  }

  return { validRows, errors };
}
