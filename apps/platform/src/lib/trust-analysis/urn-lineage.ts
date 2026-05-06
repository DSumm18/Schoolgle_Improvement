import type { SupabaseClient } from '@supabase/supabase-js';

type SchoolLineageRow = {
  urn: number;
  name: string | null;
  la_code: string | number | null;
  laestab: string | number | null;
  establishment_number: string | number | null;
  postcode: string | null;
  phase_name: string | null;
  status_name: string | null;
  type_name: string | null;
  type_group_name: string | null;
  open_date: string | null;
  close_date: string | null;
};

export type UrnLineageLink = {
  currentUrn: number;
  predecessorUrn: number;
  predecessorName: string | null;
  convertedDate: string | null;
  confidence: 'high' | 'medium' | 'static';
  matchReasons: string[];
};

const SCHOOL_SELECT =
  'urn, name, la_code, laestab, establishment_number, postcode, phase_name, status_name, type_name, type_group_name, open_date, close_date';

function asNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const number = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalisePostcode(value: string | null | undefined) {
  return String(value ?? '').replace(/\s+/g, '').toUpperCase();
}

function normaliseSchoolName(value: string | null | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bst\.\b/g, 'st')
    .replace(/\bsaint\b/g, 'st')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !new Set([
      'the',
      'school',
      'primary',
      'academy',
      'community',
      'nursery',
      'infant',
      'junior',
      'voluntary',
      'aided',
      'controlled',
      'foundation',
      'church',
      'england',
      'cofe',
      'ce',
      'c',
      'of',
      'e',
      'roman',
      'catholic',
      'rc',
    ]).has(token))
    .join(' ');
}

function tokenSimilarity(a: string | null | undefined, b: string | null | undefined) {
  const aTokens = new Set(normaliseSchoolName(a).split(/\s+/).filter(Boolean));
  const bTokens = new Set(normaliseSchoolName(b).split(/\s+/).filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union > 0 ? intersection / union : 0;
}

function isAcademy(row: SchoolLineageRow) {
  const typeName = String(row.type_name ?? '').toLowerCase();
  const typeGroup = String(row.type_group_name ?? '').toLowerCase();
  return typeName.includes('academy') || typeGroup.includes('academies');
}

function scoreCandidate(current: SchoolLineageRow, candidate: SchoolLineageRow) {
  const reasons: string[] = [];
  let score = 0;

  const currentLaestab = String(current.laestab ?? '');
  const candidateLaestab = String(candidate.laestab ?? '');
  if (currentLaestab && candidateLaestab && currentLaestab === candidateLaestab) {
    score += 7;
    reasons.push('same LAESTAB');
  }

  const currentEstab = asNumber(current.establishment_number);
  const candidateEstab = asNumber(candidate.establishment_number);
  if (currentEstab !== null && candidateEstab !== null && currentEstab === candidateEstab) {
    score += 5;
    reasons.push('same establishment number');
  }

  const currentPostcode = normalisePostcode(current.postcode);
  const candidatePostcode = normalisePostcode(candidate.postcode);
  if (currentPostcode && candidatePostcode && currentPostcode === candidatePostcode) {
    score += 5;
    reasons.push('same postcode');
  }

  if (String(current.la_code ?? '') && String(current.la_code ?? '') === String(candidate.la_code ?? '')) {
    score += 1;
    reasons.push('same local authority');
  }

  const nameSimilarity = tokenSimilarity(current.name, candidate.name);
  if (nameSimilarity >= 0.35) {
    score += Math.round(nameSimilarity * 5);
    reasons.push(`name similarity ${Math.round(nameSimilarity * 100)}%`);
  }

  if (current.open_date && candidate.close_date) {
    const open = new Date(current.open_date).getTime();
    const close = new Date(candidate.close_date).getTime();
    const days = Math.abs(open - close) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(days) && days <= 400) {
      score += 2;
      reasons.push('close/open dates align');
    }
  }

  const strongIdentity =
    reasons.includes('same LAESTAB') ||
    (reasons.includes('same establishment number') && reasons.includes('same postcode')) ||
    (reasons.includes('same postcode') && nameSimilarity >= 0.35) ||
    (reasons.includes('same establishment number') && nameSimilarity >= 0.35);

  return {
    score,
    reasons,
    accepted: score >= 8 && strongIdentity,
    confidence:
      reasons.includes('same LAESTAB') ||
      (reasons.includes('same establishment number') && reasons.includes('same postcode')) ||
      (reasons.includes('same postcode') && nameSimilarity >= 0.6)
        ? 'high'
        : 'medium',
  } as const;
}

export async function resolveUrnLineage(
  supabase: SupabaseClient,
  currentUrns: number[],
): Promise<Map<number, UrnLineageLink>> {
  const uniqueCurrentUrns = [...new Set(currentUrns.filter((urn) => Number.isFinite(urn)))];
  const links = new Map<number, UrnLineageLink>();
  if (uniqueCurrentUrns.length === 0) return links;

  const { data: currentRows } = await supabase
    .from('schools')
    .select(SCHOOL_SELECT)
    .in('urn', uniqueCurrentUrns);

  const currentSchools = ((currentRows ?? []) as SchoolLineageRow[]);
  const currentByUrn = new Map(currentSchools.map((school) => [Number(school.urn), school] as const));

  const laCodes = [...new Set(currentSchools.map((school) => String(school.la_code ?? '')).filter(Boolean))];
  let closedRows: SchoolLineageRow[] = [];
  if (laCodes.length > 0) {
    const { data } = await supabase
      .from('schools')
      .select(SCHOOL_SELECT)
      .in('la_code', laCodes)
      .eq('status_name', 'Closed')
      .limit(5000);
    closedRows = (data ?? []) as SchoolLineageRow[];
  }

  for (const current of currentSchools) {
    const currentUrn = Number(current.urn);
    if (!isAcademy(current)) continue;

    let best: { candidate: SchoolLineageRow; score: number; reasons: string[]; confidence: 'high' | 'medium' } | null = null;
    for (const candidate of closedRows) {
      if (Number(candidate.urn) === currentUrn) continue;
      if (current.phase_name && candidate.phase_name && current.phase_name !== candidate.phase_name) continue;
      const scored = scoreCandidate(current, candidate);
      if (!scored.accepted) continue;
      if (!best || scored.score > best.score) {
        best = {
          candidate,
          score: scored.score,
          reasons: scored.reasons,
          confidence: scored.confidence,
        };
      }
    }

    if (best) {
      links.set(currentUrn, {
        currentUrn,
        predecessorUrn: Number(best.candidate.urn),
        predecessorName: best.candidate.name,
        convertedDate: current.open_date ?? null,
        confidence: best.confidence,
        matchReasons: best.reasons,
      });
    }
  }

  return links;
}

export function expandUrnsWithLineage(currentUrns: number[], lineage: Map<number, UrnLineageLink>) {
  return [
    ...new Set([
      ...currentUrns,
      ...[...lineage.values()].map((link) => link.predecessorUrn),
    ]),
  ];
}

export function buildOldToCurrentUrnMap(lineage: Map<number, UrnLineageLink>) {
  return new Map([...lineage.values()].map((link) => [link.predecessorUrn, link.currentUrn] as const));
}
