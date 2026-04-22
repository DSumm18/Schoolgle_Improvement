export interface ScopedSchool {
  id: string;
  name: string;
  urn: number | null;
}

const IGNORE_WORDS = new Set([
  'CE', 'C.E.', 'C.E', 'OF', 'THE', 'AND', '&', 'VA', 'VC', 'FOUNDATION',
]);

/** Generic school-type words excluded from distinctive-word matching. */
const GENERIC_SCHOOL_WORDS = new Set([
  'PRIMARY', 'SECONDARY', 'SCHOOL', 'JUNIOR', 'INFANT', 'ACADEMY',
  'COLLEGE', 'FREE', 'COMMUNITY', 'VOLUNTARY', 'AIDED', 'CONTROLLED',
  'NURSERY', 'SPECIAL', 'UPPER', 'LOWER', 'MIDDLE',
]);

/**
 * Derive a 3–5 letter abbreviation from a school name by taking the first
 * letter of each significant word. e.g. "Grove House Primary School" → "GHPS".
 * Apostrophes are stripped; "of"/"the"/"CE" are dropped.
 */
export function abbreviateSchoolName(name: string): string {
  const tokens = name
    .toUpperCase()
    .replace(/['']/g, '')
    .split(/[\s-]+/)
    .filter((t) => t.length > 0 && !IGNORE_WORDS.has(t));
  return tokens.map((t) => t[0]).join('');
}

/**
 * Build a map of abbrev → { id, name, urn } for the schools in scope.
 * Disambiguates collisions by appending a numeric suffix (GHPS, GHPS2, …).
 * Schools whose abbreviation reduces to an empty string (e.g. all tokens are
 * IGNORE_WORDS) are skipped with a warning — including them would cause every
 * filename to match.
 */
export function buildAbbrevLookup(
  schools: ScopedSchool[],
): Record<string, ScopedSchool> {
  const out: Record<string, ScopedSchool> = {};
  for (const s of schools) {
    const base = abbreviateSchoolName(s.name);
    if (!base) {
      console.warn(
        `[buildAbbrevLookup] Skipping "${s.name}" (urn=${s.urn}): abbreviation is empty (all tokens are ignored words).`,
      );
      continue;
    }
    if (!(base in out)) {
      out[base] = s;
      continue;
    }
    for (let i = 2; i < 100; i++) {
      const candidate = `${base}${i}`;
      if (!(candidate in out)) {
        out[candidate] = s;
        break;
      }
    }
  }
  return out;
}

/**
 * Return the distinctive (non-generic, non-ignored) words from a school name,
 * lower-cased. Strips apostrophes and drops both IGNORE_WORDS and
 * GENERIC_SCHOOL_WORDS so that only the name-bearing tokens remain.
 */
function distinctiveWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .split(/[\s-]+/)
    .filter(
      (t) =>
        t.length > 0 &&
        !IGNORE_WORDS.has(t.toUpperCase()) &&
        !GENERIC_SCHOOL_WORDS.has(t.toUpperCase()),
    );
}

/**
 * Try to resolve which school a filename refers to. First checks each school's
 * abbreviation against the filename (upper-cased); falls back to checking
 * whether every significant word in the school name appears in the filename
 * (case-insensitive).
 */
export function resolveSchoolByName(
  filename: string,
  schools: ScopedSchool[],
): ScopedSchool | null {
  const upper = filename.toUpperCase();
  const lower = filename.toLowerCase();
  for (const s of schools) {
    const abbrev = abbreviateSchoolName(s.name);
    if (!abbrev) continue;
    // Require a non-alphanumeric boundary on at least one side so that e.g.
    // abbrev "GHPS" does not match the token "GHPSA" in "GHPSA_form.xlsx".
    const boundaryRe = new RegExp(
      '(^|[^A-Z0-9])' + abbrev + '([^A-Z0-9]|$)',
    );
    if (boundaryRe.test(upper)) return s;
  }
  for (const s of schools) {
    const words = distinctiveWords(s.name);
    if (words.length > 0 && words.every((w) => lower.includes(w))) return s;
  }
  return null;
}
