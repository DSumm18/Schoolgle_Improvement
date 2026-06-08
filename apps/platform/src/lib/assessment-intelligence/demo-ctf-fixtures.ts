import { XMLBuilder, XMLParser } from "fast-xml-parser";

export interface SyntheticCtfFixtureOptions {
  fixtureId: string;
  demoSchoolName: string;
  demoSchoolUrn: string;
  demoLea: string;
  demoEstab: string;
  academicYearStart: number;
  blockedSourceValues?: Iterable<string>;
}

export interface SyntheticCtfFixtureManifest {
  isDemo: true;
  safetyModel: "synthetic_twin";
  fixtureId: string;
  schoolName: string;
  schoolUrn: string;
  pupilCount: number;
  rewrittenFields: string[];
}

export interface SyntheticCtfFixtureResult {
  xml: string;
  manifest: SyntheticCtfFixtureManifest;
}

type XmlNode = Record<string, unknown>;

const SENSITIVE_POOLS: Record<string, string[]> = {
  ethnicity: ["SYN-A", "SYN-B", "SYN-C", "SYN-D"],
  firstlanguage: ["SYN-EN", "SYN-ML", "SYN-AL"],
  language: ["SYN-EN", "SYN-ML", "SYN-AL"],
  senprovision: ["N", "K", "E"],
  fsm: ["false", "true"],
  fsmeligibility: ["false", "true"],
  servicechild: ["false", "true"],
};

const REWRITTEN_FIELDS = [
  "UPN",
  "FormerUPN",
  "pupil names",
  "DOB",
  "addresses",
  "contact details",
  "school identifiers",
  "document metadata",
  "sensitive row-level characteristics",
];

export function createSyntheticCtfFixture(
  xml: string,
  options: SyntheticCtfFixtureOptions,
): SyntheticCtfFixtureResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false,
  });
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    suppressEmptyNode: false,
  });

  const doc = parser.parse(xml) as XmlNode;
  const pupils = collectPupilNodes(doc);
  const pupilSet = new WeakSet<XmlNode>(pupils);
  const blockedSourceValues = collectLeafTextValues(doc);
  for (const value of options.blockedSourceValues ?? []) {
    const text = String(value ?? "").trim();
    if (text.length >= 3) blockedSourceValues.add(text);
  }
  const sensitiveAssignments = buildSensitiveAssignments(pupils);

  sanitiseGlobalNode(doc, options, pupilSet);
  pupils.forEach((pupil, index) => {
    sanitisePupilNode(pupil, {
      index,
      options,
      blockedSourceValues,
      sensitiveAssignments: sensitiveAssignments.get(index) ?? new Map(),
    });
  });

  const sanitisedXml = `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(doc)}`;

  return {
    xml: sanitisedXml,
    manifest: {
      isDemo: true,
      safetyModel: "synthetic_twin",
      fixtureId: options.fixtureId,
      schoolName: options.demoSchoolName,
      schoolUrn: options.demoSchoolUrn,
      pupilCount: pupils.length,
      rewrittenFields: REWRITTEN_FIELDS,
    },
  };
}

function collectPupilNodes(node: unknown): XmlNode[] {
  if (!isRecord(node)) return [];
  const pupils: XmlNode[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (key === "Pupil") {
      const pupilValues = Array.isArray(value) ? value : [value];
      for (const pupil of pupilValues) {
        if (isRecord(pupil)) pupils.push(pupil);
      }
      continue;
    }
    if (isRecord(value) || Array.isArray(value)) {
      pupils.push(...collectPupilNodes(value));
    }
  }

  return pupils;
}

function sanitiseGlobalNode(
  node: unknown,
  options: SyntheticCtfFixtureOptions,
  pupilSet: WeakSet<XmlNode>,
): void {
  if (Array.isArray(node)) {
    node.forEach((child) => sanitiseGlobalNode(child, options, pupilSet));
    return;
  }
  if (!isRecord(node) || pupilSet.has(node)) return;

  for (const [key, value] of Object.entries(node)) {
    if (isRecord(value) && pupilSet.has(value)) continue;
    if (Array.isArray(value) && value.some((item) => isRecord(item) && pupilSet.has(item))) {
      continue;
    }

    if (isRecord(value) || Array.isArray(value)) {
      sanitiseGlobalNode(value, options, pupilSet);
      continue;
    }

    const replacement = sanitiseGlobalValue(key, options);
    if (replacement !== null) node[key] = replacement;
  }
}

function sanitiseGlobalValue(
  key: string,
  options: SyntheticCtfFixtureOptions,
): string | null {
  const normalisedKey = normaliseKey(key);
  if (normalisedKey === "documentname") {
    return `Schoolgle synthetic demo data - ${options.fixtureId}`;
  }
  if (normalisedKey === "datetime" || normalisedKey === "createdatetime") {
    return `${options.academicYearStart + 1}-01-15T09:00:00`;
  }
  if (normalisedKey === "schoolname" || normalisedKey === "sourceschoolname") {
    return options.demoSchoolName;
  }
  if (normalisedKey === "urn" || normalisedKey === "sourceschoolurn") {
    return options.demoSchoolUrn;
  }
  if (normalisedKey === "lea" || normalisedKey === "la") {
    return options.demoLea;
  }
  if (normalisedKey === "estab" || normalisedKey === "establishment") {
    return options.demoEstab;
  }
  return null;
}

function sanitisePupilNode(
  node: unknown,
  context: {
    index: number;
    options: SyntheticCtfFixtureOptions;
    blockedSourceValues: Set<string>;
    sensitiveAssignments: Map<string, string>;
  },
  parentKey = "",
): void {
  if (Array.isArray(node)) {
    node.forEach((child) => sanitisePupilNode(child, context, parentKey));
    return;
  }
  if (!isRecord(node)) return;

  const ncYear = findNcYear(node);
  for (const [key, value] of Object.entries(node)) {
    if (isRecord(value) || Array.isArray(value)) {
      sanitisePupilNode(value, context, key);
      continue;
    }
    const replacement = sanitisePupilValue(key, value, context, ncYear, parentKey);
    if (replacement !== null) node[key] = replacement;
  }
}

function sanitisePupilValue(
  key: string,
  value: unknown,
  context: {
    index: number;
    options: SyntheticCtfFixtureOptions;
    blockedSourceValues: Set<string>;
    sensitiveAssignments: Map<string, string>;
  },
  ncYear: number | null,
  parentKey: string,
): string | null {
  const normalisedKey = normaliseKey(key);
  const index = context.index + 1;
  const padded = String(index).padStart(4, "0");

  if (normalisedKey === "upn") {
    return uniqueSyntheticValue(`Z${String(900000000000 + index)}`, context.blockedSourceValues);
  }
  if (normalisedKey === "formerupn") {
    return uniqueSyntheticValue(`Y${String(800000000000 + index)}`, context.blockedSourceValues);
  }
  if (isPupilIdKey(normalisedKey)) return uniqueSyntheticValue(`SGX-DEMO-${padded}`, context.blockedSourceValues);
  if (isForenameKey(normalisedKey)) return uniqueSyntheticValue(`SGXGiven${padded}`, context.blockedSourceValues);
  if (isSurnameKey(normalisedKey)) return uniqueSyntheticValue(`SGXFamily${padded}`, context.blockedSourceValues);
  if (normalisedKey === "dob" || normalisedKey === "dateofbirth") {
    return fakeDob(ncYear, context.index, context.options.academicYearStart, context.blockedSourceValues);
  }
  if (normalisedKey === "gender" || normalisedKey === "sex") {
    return context.index % 2 === 0 ? "F" : "M";
  }
  if (isAddressKey(normalisedKey) || isContactKey(normalisedKey) || normaliseKey(parentKey) === "address") {
    return fakeAddressValue(normalisedKey, context.index);
  }
  if (isSensitiveCharacteristicKey(normalisedKey)) {
    return context.sensitiveAssignments.get(normalisedKey) ?? synthesiseSensitiveValue(normalisedKey, value, context.index);
  }

  return null;
}

function collectLeafTextValues(node: unknown, values = new Set<string>()): Set<string> {
  if (Array.isArray(node)) {
    node.forEach((child) => collectLeafTextValues(child, values));
    return values;
  }
  if (!isRecord(node)) return values;

  for (const value of Object.values(node)) {
    if (isRecord(value) || Array.isArray(value)) {
      collectLeafTextValues(value, values);
      continue;
    }
    const text = String(value ?? "").trim();
    if (text.length >= 3) values.add(text);
  }

  return values;
}

function buildSensitiveAssignments(pupils: XmlNode[]): Map<number, Map<string, string>> {
  const valuesByKey = new Map<string, Array<{ pupilIndex: number; value: string }>>();

  pupils.forEach((pupil, pupilIndex) => {
    collectSensitiveValues(pupil, pupilIndex, valuesByKey);
  });

  const assignments = new Map<number, Map<string, string>>();
  for (const [key, values] of valuesByKey) {
    const holders = values.map((entry) => entry.pupilIndex);
    const syntheticValues = buildSyntheticValueList(key, values.map((entry) => entry.value));
    if (syntheticValues.length === 0) continue;

    holders.forEach((pupilIndex, position) => {
      const assignment = assignments.get(pupilIndex) ?? new Map<string, string>();
      assignment.set(key, syntheticValues[(position + 1) % syntheticValues.length]);
      assignments.set(pupilIndex, assignment);
    });
  }

  return assignments;
}

function collectSensitiveValues(
  node: unknown,
  pupilIndex: number,
  valuesByKey: Map<string, Array<{ pupilIndex: number; value: string }>>,
): void {
  if (Array.isArray(node)) {
    node.forEach((child) => collectSensitiveValues(child, pupilIndex, valuesByKey));
    return;
  }
  if (!isRecord(node)) return;

  for (const [key, value] of Object.entries(node)) {
    if (isRecord(value) || Array.isArray(value)) {
      collectSensitiveValues(value, pupilIndex, valuesByKey);
      continue;
    }
    const normalisedKey = normaliseKey(key);
    if (!isSensitiveCharacteristicKey(normalisedKey)) continue;
    const valueString = String(value ?? "").trim();
    if (!valueString) continue;
    const current = valuesByKey.get(normalisedKey) ?? [];
    current.push({ pupilIndex, value: valueString });
    valuesByKey.set(normalisedKey, current);
  }
}

function buildSyntheticValueList(key: string, values: string[]): string[] {
  if (values.every(isBooleanish)) {
    const positiveCount = values.filter(isPositiveBooleanish).length;
    const positive = normaliseBooleanOutput(values.find(isPositiveBooleanish) ?? "true");
    const negative = normaliseBooleanOutput(values.find((value) => !isPositiveBooleanish(value)) ?? "false");
    return values.map((_, index) => (index < positiveCount ? positive : negative));
  }

  const pool = SENSITIVE_POOLS[key] ?? ["SYN-A", "SYN-B", "SYN-C", "SYN-D"];
  const frequencies = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .flatMap(([, count], index) => Array.from({ length: count }, () => pool[index % pool.length]));
}

function synthesiseSensitiveValue(key: string, value: unknown, index: number): string {
  if (isBooleanish(String(value ?? ""))) {
    return index % 4 === 0 ? "true" : "false";
  }
  const pool = SENSITIVE_POOLS[key] ?? ["SYN-A", "SYN-B", "SYN-C", "SYN-D"];
  return pool[index % pool.length];
}

function findNcYear(node: unknown): number | null {
  if (!isRecord(node)) return null;
  for (const [key, value] of Object.entries(node)) {
    if (normaliseKey(key) === "ncyearactual") {
      const text = String(value).trim().toUpperCase();
      if (text === "R") return 0;
      const year = parseInt(text, 10);
      return Number.isFinite(year) ? year : null;
    }
    if (isRecord(value) || Array.isArray(value)) {
      const found = findNcYear(value);
      if (found !== null) return found;
    }
  }
  return null;
}

function fakeDob(
  ncYear: number | null,
  index: number,
  academicYearStart: number,
  blockedSourceValues: Set<string>,
): string {
  const yearGroup = ncYear ?? 6;
  const birthYear = academicYearStart - yearGroup - 5;
  for (let attempt = 0; attempt < 366; attempt += 1) {
    const month = 1 + ((index + attempt * 3) % 12);
    const year = month >= 9 ? birthYear : birthYear + 1;
    const day = 3 + ((index * 7 + attempt) % 24);
    const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!blockedSourceValues.has(candidate)) return candidate;
  }
  return `${birthYear + 1}-01-01`;
}

function fakeAddressValue(key: string, index: number): string {
  if (key.includes("postcode")) return `RD${(index % 9) + 1} ${index % 2 === 0 ? "1AA" : "2BB"}`;
  if (key.includes("email")) return `demo.pupil.${index + 1}@example.schoolgle.test`;
  if (key.includes("phone") || key.includes("telephone") || key.includes("mobile")) return "01000 000000";
  return `${index + 1} Schoolgle Demo Street`;
}

function isPupilIdKey(key: string): boolean {
  return /^(admissionnumber|studentid|pupilid|misid|uln|uci|learnid|learnernumber)$/.test(key);
}

function isForenameKey(key: string): boolean {
  return key.includes("forename") || key === "firstname" || key === "givenname";
}

function isSurnameKey(key: string): boolean {
  return key.includes("surname") || key === "lastname" || key === "familyname";
}

function isAddressKey(key: string): boolean {
  return (
    key.includes("address") ||
    key.includes("postcode") ||
    key === "paon" ||
    key === "saon" ||
    key === "street" ||
    key === "locality"
  );
}

function isContactKey(key: string): boolean {
  return key.includes("email") || key.includes("phone") || key.includes("mobile") || key.includes("telephone");
}

function isSensitiveCharacteristicKey(key: string): boolean {
  return (
    key.includes("ethnicity") ||
    key.includes("language") ||
    key.includes("eal") ||
    key.includes("senprovision") ||
    key.includes("sentype") ||
    key.includes("fsm") ||
    key.includes("servicechild") ||
    key.includes("disability") ||
    key.includes("medical")
  );
}

function isBooleanish(value: string): boolean {
  return /^(true|false|yes|no|y|n|1|0)$/i.test(value.trim());
}

function isPositiveBooleanish(value: string): boolean {
  return /^(true|yes|y|1)$/i.test(value.trim());
}

function normaliseBooleanOutput(value: string): string {
  const trimmed = value.trim();
  if (/^[YN]$/i.test(trimmed)) return isPositiveBooleanish(trimmed) ? "Y" : "N";
  if (/^[01]$/.test(trimmed)) return isPositiveBooleanish(trimmed) ? "1" : "0";
  return isPositiveBooleanish(trimmed) ? "true" : "false";
}

function normaliseKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function uniqueSyntheticValue(value: string, blockedSourceValues: Set<string>): string {
  if (!blockedSourceValues.has(value)) return value;
  let suffix = 1;
  while (blockedSourceValues.has(`${value}-${suffix}`)) suffix += 1;
  return `${value}-${suffix}`;
}

function isRecord(value: unknown): value is XmlNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
