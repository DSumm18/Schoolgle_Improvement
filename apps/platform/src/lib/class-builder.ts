export type ClassBuilderSessionStatus = "draft" | "open" | "closed";
export type ClassBuilderChoiceType = "friendship" | "work_well";

export interface ClassBuilderPupil {
  id: string;
  first_name: string;
  last_name: string;
  year_group: string;
  current_class: string | null;
  gender: string | null;
  send_status: string | null;
  ehcp: boolean | null;
}

export interface ClassBuilderPupilImportRow {
  first_name: string;
  last_name: string;
  year_group: string;
  current_class: string | null;
  gender: string | null;
  send_status: string | null;
  ehcp: boolean;
}

export interface ClassBuilderPupilImportResult {
  pupils: ClassBuilderPupilImportRow[];
  errors: string[];
}

export interface ClassBuilderSessionState {
  id: string;
  status: ClassBuilderSessionStatus;
}

export interface ClassBuilderChoiceInput {
  chooser_pupil_id: string;
  chosen_pupil_id: string;
  choice_type: ClassBuilderChoiceType;
  rank: number;
}

export interface ClassBuilderValidationInput {
  session: ClassBuilderSessionState;
  pupilId: string;
  cohortPupilIds: string[];
  choices: ClassBuilderChoiceInput[];
}

export interface ClassBuilderValidationResult {
  ok: boolean;
  errors: string[];
}

export interface GeneratedClassGroup {
  name: string;
  pupilIds: string[];
  summary: Record<string, unknown>;
}

export interface MutualChoiceSummary {
  pupilIds: [string, string];
  type: ClassBuilderChoiceType;
  score: number;
}

export interface ClassBuilderGroupSummary {
  mutualFriendshipsKept: MutualChoiceSummary[];
  mutualFriendshipsSplit: MutualChoiceSummary[];
  isolatedPupils: Array<{ pupilId: string; selectionCount: number }>;
  selectionCounts: {
    highDemand: Array<{ pupilId: string; count: number }>;
    lowDemand: Array<{ pupilId: string; count: number }>;
    byPupil: Record<string, number>;
  };
  balance: {
    gender: Record<string, Record<string, number>>;
    send: Record<string, Record<string, number>>;
    ehcp: Record<string, Record<string, number>>;
    currentClass: Record<string, Record<string, number>>;
  };
  tradeOffs: string[];
}

export interface GenerateClassGroupsInput {
  pupils: ClassBuilderPupil[];
  choices: ClassBuilderChoiceInput[];
  targetClassCount: 2 | 3 | number;
}

export interface GenerateClassGroupsResult {
  groups: GeneratedClassGroup[];
  summary: ClassBuilderGroupSummary;
}

export function normaliseClassBuilderYearValue(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (["r", "rec", "reception", "year r", "yr r"].includes(lower)) return "R";
  if (["n", "nursery", "year n", "yr n"].includes(lower)) return "N";
  const match = lower.match(/\d+/);
  return match ? String(Number(match[0])) : raw;
}

export function parseClassBuilderSessionYearGroups(value: string | null | undefined) {
  const parts = String(value || "")
    .split(/[,|+]/)
    .map((part) => normaliseClassBuilderYearValue(part))
    .filter(Boolean);
  return [...new Set(parts)];
}

export function formatClassBuilderCohortYearGroups(values: string[]) {
  return [...new Set(values.map((value) => normaliseClassBuilderYearValue(value)).filter(Boolean))]
    .sort((a, b) => classBuilderYearSortValue(a) - classBuilderYearSortValue(b))
    .join(",");
}

export function classBuilderYearLabel(value: string) {
  const normalised = normaliseClassBuilderYearValue(value);
  return normalised === "R" ? "Reception" : `Year ${normalised}`;
}

export function classBuilderCohortLabel(value: string | null | undefined) {
  const years = parseClassBuilderSessionYearGroups(value);
  if (years.length === 0) return "No cohort";
  if (years.length === 1) return classBuilderYearLabel(years[0]);
  return years.map(classBuilderYearLabel).join(" + ");
}

export function classBuilderYearStorageAliases(values: string[]) {
  const aliases = new Set<string>();
  for (const value of values) {
    const normalised = normaliseClassBuilderYearValue(value);
    if (!normalised) continue;
    aliases.add(normalised);
    if (normalised === "R") {
      aliases.add("Reception");
      aliases.add("Year R");
      aliases.add("Rec");
    } else {
      aliases.add(`Year ${normalised}`);
      aliases.add(`Y${normalised}`);
    }
  }
  return [...aliases];
}

function classBuilderYearSortValue(value: string) {
  if (normaliseClassBuilderYearValue(value) === "R") return 0;
  const numeric = Number(normaliseClassBuilderYearValue(value));
  return Number.isFinite(numeric) ? numeric : 99;
}

export function validateClassBuilderSubmission(
  input: ClassBuilderValidationInput,
): ClassBuilderValidationResult {
  const errors: string[] = [];
  const cohort = new Set(input.cohortPupilIds);

  if (input.session.status !== "open") {
    errors.push("This survey session is closed.");
  }

  if (!cohort.has(input.pupilId)) {
    errors.push("The selected pupil is not in this session cohort.");
  }

  for (const type of ["friendship", "work_well"] as const) {
    const typeChoices = input.choices.filter(
      (choice) => choice.choice_type === type,
    );
    const chosenIds = typeChoices.map((choice) => choice.chosen_pupil_id);
    const uniqueChosenIds = new Set(chosenIds);

    if (typeChoices.length > 3) {
      errors.push(
        type === "friendship"
          ? "Choose no more than 3 friends."
          : "Choose no more than 3 pupils you work well with.",
      );
    }

    if (uniqueChosenIds.size !== chosenIds.length) {
      errors.push(
        type === "friendship"
          ? "Each friendship choice must name a different pupil."
          : "Each work-well choice must name a different pupil.",
      );
    }
  }

  for (const choice of input.choices) {
    if (choice.chooser_pupil_id !== input.pupilId) {
      errors.push("Choice chooser must match the submitting pupil.");
    }

    if (choice.chosen_pupil_id === input.pupilId) {
      errors.push("Pupils cannot choose themselves.");
    }

    if (!cohort.has(choice.chosen_pupil_id)) {
      errors.push("Choices can only include pupils in this session cohort.");
    }

    if (![1, 2, 3].includes(choice.rank)) {
      errors.push("Choice ranks must be between 1 and 3.");
    }
  }

  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

export function generateClassGroups(
  input: GenerateClassGroupsInput,
): GenerateClassGroupsResult {
  const targetClassCount = Math.min(
    3,
    Math.max(2, Math.floor(input.targetClassCount || 2)),
  );
  const groups = Array.from({ length: targetClassCount }, (_, index) => ({
    name: `Class ${index + 1}`,
    pupilIds: [] as string[],
    summary: {},
  }));
  const pupilMap = new Map(input.pupils.map((pupil) => [pupil.id, pupil]));
  const selectionCounts = countSelections(input.pupils, input.choices);
  const mutualLinks = findMutualLinks(input.choices);
  const assigned = new Set<string>();
  const tradeOffs: string[] = [];

  for (const link of mutualLinks.filter((link) => link.type === "friendship")) {
    const [firstId, secondId] = link.pupilIds;
    if (assigned.has(firstId) || assigned.has(secondId)) continue;
    const targetGroup = chooseBestGroup(groups, input.pupils, [
      pupilMap.get(firstId),
      pupilMap.get(secondId),
    ]);
    targetGroup.pupilIds.push(firstId, secondId);
    assigned.add(firstId);
    assigned.add(secondId);
  }

  const remaining = [...input.pupils]
    .filter((pupil) => !assigned.has(pupil.id))
    .sort((a, b) => {
      const demandDiff = selectionCounts[b.id] - selectionCounts[a.id];
      if (demandDiff !== 0) return demandDiff;
      return pupilName(a).localeCompare(pupilName(b));
    });

  for (const pupil of remaining) {
    const targetGroup = chooseBestGroup(groups, input.pupils, [pupil]);
    targetGroup.pupilIds.push(pupil.id);
    assigned.add(pupil.id);
  }

  for (const group of groups) {
    group.summary = summarizeGroup(group.pupilIds, pupilMap);
  }

  const kept = mutualLinks.filter((link) =>
    groups.some((group) =>
      link.pupilIds.every((pupilId) => group.pupilIds.includes(pupilId)),
    ),
  );
  const split = mutualLinks.filter(
    (link) =>
      !groups.some((group) =>
        link.pupilIds.every((pupilId) => group.pupilIds.includes(pupilId)),
      ),
  );

  if (split.length > 0) {
    tradeOffs.push(
      `${split.length} mutual link${split.length === 1 ? " was" : "s were"} split to preserve class balance.`,
    );
  }

  const summary: ClassBuilderGroupSummary = {
    mutualFriendshipsKept: kept.filter((link) => link.type === "friendship"),
    mutualFriendshipsSplit: split.filter((link) => link.type === "friendship"),
    isolatedPupils: input.pupils
      .filter((pupil) => selectionCounts[pupil.id] === 0)
      .map((pupil) => ({ pupilId: pupil.id, selectionCount: 0 })),
    selectionCounts: {
      highDemand: demandBand(selectionCounts, "high"),
      lowDemand: demandBand(selectionCounts, "low"),
      byPupil: selectionCounts,
    },
    balance: buildBalanceSummary(groups, pupilMap),
    tradeOffs,
  };

  return { groups, summary };
}

export function buildClassBuilderCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvCell(row[header])).join(","),
    ),
  ];
  return lines.join("\n");
}

export function parseClassBuilderPupilCsv(
  csvText: string,
): ClassBuilderPupilImportResult {
  const rows = parseCsvRows(csvText.trim());
  if (rows.length === 0) {
    return { pupils: [], errors: ["CSV file is empty."] };
  }

  const headers = rows[0].map((header) => normaliseHeader(header));
  const errors: string[] = [];
  const pupils: ClassBuilderPupilImportRow[] = [];

  rows.slice(1).forEach((row, index) => {
    if (row.every((cell) => !cell.trim())) return;
    const rowNumber = index + 2;
    const value = (name: string) => row[headers.indexOf(name)]?.trim() ?? "";
    const firstName = value("first_name");
    const lastName = value("last_name");
    const yearGroup = value("year_group");

    for (const [field, fieldValue] of [
      ["first_name", firstName],
      ["last_name", lastName],
      ["year_group", yearGroup],
    ]) {
      if (!fieldValue) errors.push(`Row ${rowNumber} is missing ${field}.`);
    }

    if (!firstName || !lastName || !yearGroup) return;

    pupils.push({
      first_name: firstName,
      last_name: lastName,
      year_group: yearGroup,
      current_class: value("current_class") || value("class_name") || null,
      gender: value("gender") || null,
      send_status: value("send_status") || value("sen_status") || null,
      ehcp: parseBoolean(value("ehcp")),
    });
  });

  return { pupils, errors };
}

function chooseBestGroup(
  groups: GeneratedClassGroup[],
  allPupils: ClassBuilderPupil[],
  candidates: Array<ClassBuilderPupil | undefined>,
) {
  const usableCandidates = candidates.filter(
    (pupil): pupil is ClassBuilderPupil => Boolean(pupil),
  );
  const idealSize = Math.ceil(allPupils.length / groups.length);
  const pupilMap = new Map(allPupils.map((pupil) => [pupil.id, pupil]));
  const groupsWithinIdealSize = groups.filter(
    (group) => group.pupilIds.length + usableCandidates.length <= idealSize,
  );
  const candidateGroups =
    groupsWithinIdealSize.length > 0 ? groupsWithinIdealSize : groups;

  return [...candidateGroups].sort((a, b) => {
    const sizeDiff =
      scoreGroup(a, usableCandidates, idealSize, pupilMap) -
      scoreGroup(b, usableCandidates, idealSize, pupilMap);
    if (sizeDiff !== 0) return sizeDiff;
    return a.name.localeCompare(b.name);
  })[0];
}

function scoreGroup(
  group: GeneratedClassGroup,
  candidates: ClassBuilderPupil[],
  idealSize: number,
  pupilMap: Map<string, ClassBuilderPupil>,
) {
  const projectedSize = group.pupilIds.length + candidates.length;
  let score = Math.abs(idealSize - projectedSize) * 12;
  if (projectedSize > idealSize) {
    score += (projectedSize - idealSize) * 100;
  }
  const summary = summarizeGroup(group.pupilIds, pupilMap) as {
    gender: Record<string, number>;
    send: Record<string, number>;
    ehcp: Record<string, number>;
    currentClass: Record<string, number>;
  };
  for (const candidate of candidates) {
    if (candidate.gender) {
      score -= summary.gender[candidate.gender] ?? 0;
    }
    if (candidate.send_status) {
      score -= (summary.send[candidate.send_status] ?? 0) * 2;
    }
    if (candidate.ehcp) {
      score -= (summary.ehcp.true ?? 0) * 3;
    }
    if (candidate.current_class) {
      score -= summary.currentClass[candidate.current_class] ?? 0;
    }
  }
  return score;
}

function summarizeGroup(
  pupilIds: string[],
  pupilMap: Map<string, ClassBuilderPupil>,
) {
  const pupils = pupilIds
    .map((id) => pupilMap.get(id))
    .filter((pupil): pupil is ClassBuilderPupil => Boolean(pupil));
  return {
    size: pupils.length,
    gender: countBy(pupils, (pupil) => pupil.gender || "not_recorded"),
    send: countBy(pupils, (pupil) => pupil.send_status || "none"),
    ehcp: countBy(pupils, (pupil) => (pupil.ehcp ? "true" : "false")),
    currentClass: countBy(
      pupils,
      (pupil) => pupil.current_class || "not_recorded",
    ),
  };
}

function buildBalanceSummary(
  groups: GeneratedClassGroup[],
  pupilMap: Map<string, ClassBuilderPupil>,
) {
  return groups.reduce<ClassBuilderGroupSummary["balance"]>(
    (balance, group) => {
      const summary = summarizeGroup(group.pupilIds, pupilMap) as any;
      balance.gender[group.name] = summary.gender;
      balance.send[group.name] = summary.send;
      balance.ehcp[group.name] = summary.ehcp;
      balance.currentClass[group.name] = summary.currentClass;
      return balance;
    },
    { gender: {}, send: {}, ehcp: {}, currentClass: {} },
  );
}

function findMutualLinks(
  choices: ClassBuilderChoiceInput[],
): MutualChoiceSummary[] {
  const choiceSet = new Set(
    choices.map(
      (choice) =>
        `${choice.choice_type}:${choice.chooser_pupil_id}:${choice.chosen_pupil_id}`,
    ),
  );
  const links: MutualChoiceSummary[] = [];
  const seen = new Set<string>();

  for (const choice of choices) {
    const reverseKey = `${choice.choice_type}:${choice.chosen_pupil_id}:${choice.chooser_pupil_id}`;
    const pairKey = [
      choice.choice_type,
      ...[choice.chooser_pupil_id, choice.chosen_pupil_id].sort(),
    ].join(":");
    if (choiceSet.has(reverseKey) && !seen.has(pairKey)) {
      links.push({
        pupilIds: [choice.chooser_pupil_id, choice.chosen_pupil_id].sort() as [
          string,
          string,
        ],
        type: choice.choice_type,
        score: choice.choice_type === "friendship" ? 10 : 4,
      });
      seen.add(pairKey);
    }
  }

  return links.sort((a, b) => b.score - a.score);
}

function countSelections(
  pupils: ClassBuilderPupil[],
  choices: ClassBuilderChoiceInput[],
) {
  const counts = Object.fromEntries(pupils.map((pupil) => [pupil.id, 0]));
  for (const choice of choices) {
    counts[choice.chosen_pupil_id] = (counts[choice.chosen_pupil_id] ?? 0) + 1;
  }
  return counts;
}

function demandBand(
  counts: Record<string, number>,
  band: "high" | "low",
) {
  const values = Object.values(counts);
  if (values.length === 0) return [];
  const average = values.reduce((total, value) => total + value, 0) / values.length;
  return Object.entries(counts)
    .filter(([, count]) =>
      band === "high" ? count >= Math.ceil(average + 2) : count === 0,
    )
    .map(([pupilId, count]) => ({ pupilId, count }));
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function pupilName(pupil: ClassBuilderPupil) {
  return `${pupil.last_name}, ${pupil.first_name}`;
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index++) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normaliseHeader(header: string) {
  return header.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function parseBoolean(value: string) {
  return ["true", "yes", "y", "1", "ehcp", "e"].includes(
    value.trim().toLowerCase(),
  );
}
