/**
 * Calculate distance between two OS grid reference points in miles.
 * Uses Pythagorean distance on easting/northing (1 unit = 1 metre).
 * Accurate enough for school proximity within a few miles.
 */
export function calculateDistanceMiles(
  easting1: number, northing1: number,
  easting2: number, northing2: number,
): number {
  const dx = easting1 - easting2;
  const dy = northing1 - northing2;
  const distanceMetres = Math.sqrt(dx * dx + dy * dy);
  return distanceMetres / 1609.34;
}

export interface ProximityQueryParams {
  easting: number;
  northing: number;
  radiusMiles: number;
  phaseName?: string;
  excludeUrn?: number;
  limit?: number;
}

/**
 * Build SQL query to find schools within a radius of a point.
 * Returns schools ordered by distance with distance_miles column.
 */
export function buildProximityQuery(params: ProximityQueryParams): string {
  const { easting, northing, radiusMiles, phaseName, excludeUrn, limit = 50 } = params;
  const radiusMetres = radiusMiles * 1609.34;

  let where = `
    s.status_name = 'Open'
    AND s.easting IS NOT NULL
    AND s.northing IS NOT NULL
    AND SQRT(POWER(s.easting - ${easting}, 2) + POWER(s.northing - ${northing}, 2)) <= ${radiusMetres}
  `;

  if (phaseName) {
    where += `\n    AND s.phase_name = '${phaseName}'`;
  }

  if (excludeUrn) {
    where += `\n    AND s.urn != ${excludeUrn}`;
  }

  return `
    SELECT s.urn, s.name, s.la_code, s.la_name, s.postcode,
           s.easting, s.northing, s.type_name, s.phase_name,
           s.status_name, s.school_capacity, s.number_of_pupils,
           s.percentage_fsm, s.trust_name,
           s.head_first_name, s.head_last_name,
           SQRT(POWER(s.easting - ${easting}, 2) + POWER(s.northing - ${northing}, 2)) / 1609.34 AS distance_miles
    FROM schools s
    WHERE ${where}
    ORDER BY distance_miles ASC
    LIMIT ${limit}
  `;
}
