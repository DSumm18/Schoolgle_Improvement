import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { calculateMatchScore } from '@/lib/smart-connectors/similar-schools';
import type { SchoolProfile } from '@/lib/smart-connectors/types';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const url = new URL(req.url);
  const urn = url.searchParams.get('urn');
  const mode = url.searchParams.get('mode') || 'both';
  const radius = parseFloat(url.searchParams.get('radius') || '5');
  const fsmTolerance = parseFloat(url.searchParams.get('fsm_tolerance') || '5');
  const rollTolerance = parseFloat(url.searchParams.get('roll_tolerance') || '20');

  if (!urn) {
    return apiError('Missing urn parameter', 400);
  }

  const urnNum = parseInt(urn, 10);
  if (isNaN(urnNum)) {
    return apiError('Invalid URN', 400);
  }

  const supabase = createServiceRoleClient();

  // Get the target school's profile
  const { data: schoolData, error: schoolError } = await supabase
    .from('schools')
    .select('*')
    .eq('urn', urnNum)
    .single();

  if (schoolError || !schoolData) {
    return apiError('School not found in GIAS data', 404);
  }

  const school: SchoolProfile = {
    urn: schoolData.urn,
    name: schoolData.name,
    laCode: schoolData.la_code,
    laName: schoolData.la_name,
    postcode: schoolData.postcode,
    easting: schoolData.easting,
    northing: schoolData.northing,
    typeName: schoolData.type_name,
    phaseName: schoolData.phase_name,
    statusName: schoolData.status_name,
    schoolCapacity: schoolData.school_capacity,
    numberOfPupils: schoolData.number_of_pupils,
    percentageFsm: parseFloat(schoolData.percentage_fsm) || 0,
    trustName: schoolData.trust_name,
    headFirstName: schoolData.head_first_name,
    headLastName: schoolData.head_last_name,
  };

  const result: Record<string, unknown> = { school };

  // Proximity search — filter in application code since Supabase doesn't support computed column filters
  if (mode === 'proximity' || mode === 'both') {
    const { data: nearbySchools } = await supabase
      .from('schools')
      .select('*')
      .eq('phase_name', school.phaseName)
      .eq('status_name', 'Open')
      .neq('urn', urnNum)
      .not('easting', 'is', null)
      .not('northing', 'is', null);

    const radiusMetres = radius * 1609.34;
    const nearby = (nearbySchools || [])
      .map((s: Record<string, unknown>) => {
        const dx = (s.easting as number) - school.easting;
        const dy = (s.northing as number) - school.northing;
        const distMetres = Math.sqrt(dx * dx + dy * dy);
        return {
          urn: s.urn,
          name: s.name,
          la_name: s.la_name,
          postcode: s.postcode,
          type_name: s.type_name,
          phase_name: s.phase_name,
          number_of_pupils: s.number_of_pupils,
          percentage_fsm: s.percentage_fsm,
          trust_name: s.trust_name,
          distance_miles: Math.round((distMetres / 1609.34) * 100) / 100,
        };
      })
      .filter((s) => s.distance_miles <= radius)
      .sort((a, b) => a.distance_miles - b.distance_miles)
      .slice(0, 30);

    result.proximity = {
      schools: nearby,
      count: nearby.length,
      radiusMiles: radius,
    };
  }

  // Similar schools
  if (mode === 'similar' || mode === 'both') {
    // Get FSM from census for more accurate matching
    const { data: censusData } = await supabase
      .from('census')
      .select('fsm_pct, number_on_roll')
      .eq('urn', urnNum)
      .order('time_period', { ascending: false })
      .limit(1)
      .single();

    const fsmPct = censusData?.fsm_pct ? parseFloat(censusData.fsm_pct) : school.percentageFsm;
    const roll = censusData?.number_on_roll || school.numberOfPupils;

    const rollLower = Math.round(roll * (1 - rollTolerance / 100));
    const rollUpper = Math.round(roll * (1 + rollTolerance / 100));

    // Get census data for potential matches
    const { data: similarCensus } = await supabase
      .from('census')
      .select('urn, fsm_pct, eal_pct, number_on_roll, time_period')
      .eq('time_period', '202425')
      .gte('number_on_roll', rollLower)
      .lte('number_on_roll', rollUpper)
      .neq('urn', urnNum);

    // Filter by FSM tolerance
    const matchingUrns = (similarCensus || [])
      .filter((c: Record<string, unknown>) =>
        Math.abs(parseFloat(c.fsm_pct as string) - fsmPct) <= fsmTolerance,
      )
      .map((c: Record<string, unknown>) => c.urn as number)
      .slice(0, 100);

    if (matchingUrns.length > 0) {
      const { data: schoolDetails } = await supabase
        .from('schools')
        .select('*')
        .in('urn', matchingUrns)
        .eq('phase_name', school.phaseName)
        .eq('status_name', 'Open')
        .eq('la_code', school.laCode);

      const enriched = (schoolDetails || []).map((s: Record<string, unknown>) => {
        const censusMatch = (similarCensus || []).find((c: Record<string, unknown>) => c.urn === s.urn);
        const matchFsm = censusMatch ? parseFloat(censusMatch.fsm_pct as string) : 0;
        const matchRoll = censusMatch ? (censusMatch.number_on_roll as number) : 0;

        return {
          urn: s.urn,
          name: s.name,
          la_name: s.la_name,
          postcode: s.postcode,
          type_name: s.type_name,
          number_of_pupils: s.number_of_pupils,
          percentage_fsm: s.percentage_fsm,
          trust_name: s.trust_name,
          fsm_pct: matchFsm,
          census_roll: matchRoll,
          match_score: calculateMatchScore({
            targetFsm: fsmPct,
            matchFsm,
            targetRoll: roll,
            matchRoll,
            sameLa: (s.la_code as string) === school.laCode,
            samePhase: (s.phase_name as string) === school.phaseName,
            sameType: (s.type_name as string) === school.typeName,
          }),
        };
      }).sort((a, b) => b.match_score - a.match_score);

      result.similar = {
        schools: enriched.slice(0, 30),
        count: enriched.length,
        criteria: { fsmPct, fsmTolerance, roll, rollTolerance, laCode: school.laCode },
      };
    } else {
      result.similar = { schools: [], count: 0, criteria: { fsmPct, fsmTolerance, roll, rollTolerance } };
    }
  }

  return apiSuccess(result);
});
