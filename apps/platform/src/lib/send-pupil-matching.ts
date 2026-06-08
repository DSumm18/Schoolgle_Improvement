export type SendPupilMatchRow = {
  pupil_id: string;
  display_name: string;
  date_of_birth?: string | null;
  year_group?: string | null;
  class_name?: string | null;
};

export type CanonicalPupilMatchRow = {
  pupil_id: string;
  source_pupil_ref?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  year_group?: string | null;
  class_name?: string | null;
  current_class?: string | null;
};

type SendPupilMatchMethod =
    | "pupil_id"
    | "source_pupil_ref"
    | "name_date_of_birth"
    | "date_of_birth_last_name"
    | "date_of_birth_first_name_class"
    | "unmatched";

export type MatchedSendRow<T extends SendPupilMatchRow> = Omit<T, "match_method"> & {
  source_pupil_ref: string;
  match_method: SendPupilMatchMethod;
};

export function matchSendRowsToPupils<T extends SendPupilMatchRow>({
  sendRows,
  pupils,
}: {
  sendRows: T[];
  pupils: CanonicalPupilMatchRow[];
}) {
  const byPupilId = new Map(pupils.map((pupil) => [normaliseId(pupil.pupil_id), pupil]));
  const bySourceRef = new Map(
    pupils
      .filter((pupil) => pupil.source_pupil_ref)
      .map((pupil) => [normaliseId(pupil.source_pupil_ref), pupil]),
  );
  const byNameDob = new Map(
    pupils
      .filter((pupil) => pupil.first_name && pupil.last_name && pupil.date_of_birth)
      .map((pupil) => [nameDobKey(pupil.first_name, pupil.last_name, pupil.date_of_birth), pupil]),
  );
  const byDobLast = uniqueIndex(
    pupils.filter((pupil) => pupil.last_name && pupil.date_of_birth),
    (pupil) => dobLastKey(pupil.last_name, pupil.date_of_birth),
  );

  const unmatched: Array<MatchedSendRow<T>> = [];
  const rows = sendRows.map((row) => {
    const id = normaliseId(row.pupil_id);
    const direct = byPupilId.get(id);
    if (direct) return matched(row, direct, "pupil_id");

    const source = bySourceRef.get(id);
    if (source) return matched(row, source, "source_pupil_ref");

    const displayName = splitDisplayName(row.display_name);
    const byIdentity = byNameDob.get(nameDobKey(displayName.first, displayName.last, row.date_of_birth));
    if (byIdentity) return matched(row, byIdentity, "name_date_of_birth", row.pupil_id);

    const byDobAndLastName = byDobLast.get(dobLastKey(displayName.last, row.date_of_birth));
    if (byDobAndLastName) {
      return matched(row, byDobAndLastName, "date_of_birth_last_name", row.pupil_id);
    }

    const byDobFirstAndClass = matchByDobFirstAndClass(row, displayName.first, pupils);
    if (byDobFirstAndClass) {
      return matched(row, byDobFirstAndClass, "date_of_birth_first_name_class", row.pupil_id);
    }

    const fallback = {
      ...row,
      source_pupil_ref: row.pupil_id,
      match_method: "unmatched" as const,
    };
    unmatched.push(fallback);
    return fallback;
  });

  return { rows, unmatched };
}

function matched<T extends SendPupilMatchRow>(
  row: T,
  pupil: CanonicalPupilMatchRow,
  matchMethod: SendPupilMatchMethod,
  sourceRefOverride?: string,
): MatchedSendRow<T> {
  return {
    ...row,
    pupil_id: pupil.pupil_id,
    source_pupil_ref: sourceRefOverride ?? pupil.source_pupil_ref ?? row.pupil_id,
    match_method: matchMethod,
  };
}

function splitDisplayName(name: string) {
  if (name.includes(",")) {
    const [last, first] = name.split(",", 2).map((part) => part.trim());
    return { first, last };
  }
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.at(-1) ?? "" };
}

function nameDobKey(first?: string | null, last?: string | null, dateOfBirth?: string | null) {
  return `${normaliseName(first)}|${normaliseName(last)}|${dateOfBirth ?? ""}`;
}

function dobLastKey(last?: string | null, dateOfBirth?: string | null) {
  return `${normaliseName(last)}|${dateOfBirth ?? ""}`;
}

function normaliseId(value?: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

function normaliseName(value?: string | null) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function matchByDobFirstAndClass(
  row: SendPupilMatchRow,
  firstName: string,
  pupils: CanonicalPupilMatchRow[],
) {
  if (!row.date_of_birth || !firstName) return null;

  const candidates = pupils.filter((pupil) => {
    if (!pupil.date_of_birth || pupil.date_of_birth !== row.date_of_birth) return false;
    if (!namesShareToken(firstName, pupil.first_name)) return false;
    return classOrYearCompatible(row, pupil);
  });

  return candidates.length === 1 ? candidates[0] : null;
}

function namesShareToken(left?: string | null, right?: string | null) {
  const leftTokens = nameTokens(left);
  const rightTokens = nameTokens(right);
  return leftTokens.some((token) => rightTokens.includes(token));
}

function nameTokens(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function classOrYearCompatible(row: SendPupilMatchRow, pupil: CanonicalPupilMatchRow) {
  const rowClass = normaliseClass(row.class_name);
  const pupilClass = normaliseClass(pupil.current_class ?? pupil.class_name);
  if (rowClass && pupilClass && rowClass === pupilClass) return true;

  const rowYear = normaliseYear(row.year_group ?? row.class_name);
  const pupilYear = normaliseYear(pupil.year_group ?? pupil.current_class ?? pupil.class_name);
  return Boolean(rowYear && pupilYear && rowYear === pupilYear);
}

function normaliseClass(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\byear\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normaliseYear(value?: string | null) {
  const text = String(value ?? "").toLowerCase();
  const nursery = text.match(/\bn(?:ursery)?\s*([1-2])?\b/);
  if (nursery) return `n${nursery[1] ?? ""}`;
  const reception = text.match(/\b(?:r|reception)\b/);
  if (reception) return "r";
  const year = text.match(/\b(?:year\s*)?([0-9]{1,2})\b/);
  return year ? year[1] : "";
}

function uniqueIndex<T>(rows: T[], keyForRow: (row: T) => string) {
  const map = new Map<string, T | null>();
  for (const row of rows) {
    const key = keyForRow(row);
    if (!key.trim()) continue;
    map.set(key, map.has(key) ? null : row);
  }

  return {
    get(key: string) {
      return map.get(key) ?? null;
    },
  };
}
