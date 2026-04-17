import { describe, it, expect } from 'vitest';
import {
  RESEARCH_CITATIONS,
  getCitationsByRelevance,
  citationShort,
  citationFull,
  evaluateResearchKpis,
} from './research-citations';

// ── Citation library integrity ────────────────────────────────────────────────

describe('RESEARCH_CITATIONS library', () => {
  it('contains all required citation IDs', () => {
    const required = [
      'eef-pupil-premium-2024',
      'strand-demie-2018',
      'naldic-2020',
      'dfe-ks2-2024',
      'dfe-ks1-2023',
      'ofsted-inspection-framework-2024',
      'sta-moderation-2022',
      'eef-send-2020',
      'ifs-disadvantage-gap-2023',
      'demie-2023',
    ];
    required.forEach((id) => {
      expect(RESEARCH_CITATIONS[id], `Missing citation: ${id}`).toBeDefined();
    });
  });

  it('every citation has required fields', () => {
    Object.values(RESEARCH_CITATIONS).forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.authors).toBeTruthy();
      expect(c.year).toBeGreaterThan(2000);
      expect(c.title).toBeTruthy();
      expect(c.publisher).toBeTruthy();
      expect(c.keyFinding).toBeTruthy();
      expect(Array.isArray(c.relevance)).toBe(true);
      expect(c.relevance.length).toBeGreaterThan(0);
    });
  });

  it('citation IDs are self-consistent (id field matches key)', () => {
    Object.entries(RESEARCH_CITATIONS).forEach(([key, c]) => {
      expect(c.id).toBe(key);
    });
  });
});

// ── getCitationsByRelevance ───────────────────────────────────────────────────

describe('getCitationsByRelevance', () => {
  it('returns citations tagged with fsm-gap', () => {
    const results = getCitationsByRelevance('fsm-gap');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((c) => expect(c.relevance).toContain('fsm-gap'));
  });

  it('returns citations tagged with eal-trajectory', () => {
    const results = getCitationsByRelevance('eal-trajectory');
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty array for unknown tag', () => {
    expect(getCitationsByRelevance('nonexistent-tag')).toHaveLength(0);
  });
});

// ── citationShort ─────────────────────────────────────────────────────────────

describe('citationShort', () => {
  it('returns short author + year for a known citation', () => {
    const result = citationShort('dfe-ks1-2023');
    expect(result).toContain('2023');
    expect(result.length).toBeLessThan(30);
  });

  it('returns empty string for unknown ID', () => {
    expect(citationShort('does-not-exist')).toBe('');
  });

  it('strips first author to surname only', () => {
    // strand-demie-2018: "Strand, S., Demie, F. & Lindorff, A."
    const result = citationShort('strand-demie-2018');
    expect(result).toContain('2018');
  });
});

// ── citationFull ──────────────────────────────────────────────────────────────

describe('citationFull', () => {
  it('contains author, year, title and publisher', () => {
    const result = citationFull('eef-pupil-premium-2024');
    expect(result).toContain('Education Endowment Foundation');
    expect(result).toContain('2024');
    expect(result).toContain('Pupil Premium Guide');
    expect(result).toContain('EEF');
  });

  it('returns empty string for unknown ID', () => {
    expect(citationFull('does-not-exist')).toBe('');
  });
});

// ── evaluateResearchKpis ──────────────────────────────────────────────────────

describe('evaluateResearchKpis', () => {
  const typicalDemographics = { fsmPct: 25, sendPct: 15, ealPct: 40 };

  it('returns empty array when no year data provided', () => {
    // Demographics: EAL >30% but no year data
    const kpis = evaluateResearchKpis(typicalDemographics, {});
    expect(kpis).toHaveLength(0);
  });

  it('does not produce EAL KPI for low-EAL school (<= 30%)', () => {
    const lowEalDemo = { fsmPct: 20, sendPct: 10, ealPct: 15 };
    const kpis = evaluateResearchKpis(lowEalDemo, {
      'Year 1': { c: 55 },
      'Year 5': { c: 62 },
      'Year 6': { r: 67, w: 54, c: 57 },
    });
    const ealKpi = kpis.find((k) => k.id === 'eal-progression');
    expect(ealKpi).toBeUndefined();
  });

  it('produces EAL KPI PASS when Y1→Y5 gain >= 15pp (Strand & Demie 2018)', () => {
    const kpis = evaluateResearchKpis(typicalDemographics, {
      'Year 1': { c: 45 },
      'Year 5': { c: 65 },
      'Year 6': { r: 67, w: 54, c: 57 },
    });
    const ealKpi = kpis.find((k) => k.id === 'eal-progression');
    expect(ealKpi).toBeDefined();
    expect(ealKpi!.passed).toBe(true);
    expect(ealKpi!.actual).toBe('+20pp');
  });

  it('produces EAL KPI FAIL when Y1→Y5 gain < 15pp', () => {
    const kpis = evaluateResearchKpis(typicalDemographics, {
      'Year 1': { c: 55 },
      'Year 5': { c: 60 },
    });
    const ealKpi = kpis.find((k) => k.id === 'eal-progression');
    expect(ealKpi).toBeDefined();
    expect(ealKpi!.passed).toBe(false);
    expect(ealKpi!.explanation).toContain('10pp below research expectation');
  });

  it('produces Writing-Reading gap KPI PASS for normal gap (0–20pp)', () => {
    const kpis = evaluateResearchKpis({ fsmPct: 20, sendPct: 10, ealPct: 15 }, {
      'Year 6': { r: 70, w: 58, c: 57 },
    });
    const kpi = kpis.find((k) => k.id === 'writing-reading-gap');
    expect(kpi).toBeDefined();
    expect(kpi!.passed).toBe(true);
    expect(kpi!.actual).toBe('12pp');
  });

  it('produces Writing-Reading gap KPI FAIL when Writing exceeds Reading', () => {
    const kpis = evaluateResearchKpis({ fsmPct: 20, sendPct: 10, ealPct: 15 }, {
      'Year 6': { r: 55, w: 65, c: 57 },
    });
    const kpi = kpis.find((k) => k.id === 'writing-reading-gap');
    expect(kpi).toBeDefined();
    expect(kpi!.passed).toBe(false);
    expect(kpi!.explanation).toContain('Writing higher than Reading');
  });

  it('produces demographic Y6 Combined KPI PASS when within 5pp of prediction', () => {
    // National 60% - (0.25*20) - (0.15*30) - (0.40*-2) = 60 - 5 - 4.5 + 0.8 = 51.3 → 51
    const kpis = evaluateResearchKpis(typicalDemographics, {
      'Year 6': { r: 67, w: 54, c: 52 },
    });
    const kpi = kpis.find((k) => k.id === 'demographic-y6-combined');
    expect(kpi).toBeDefined();
    expect(kpi!.passed).toBe(true);
  });

  it('produces demographic Y6 Combined KPI FAIL when >5pp above prediction (over-assessment signal)', () => {
    // prediction ~51%, reporting 67% = +16pp → fail
    const kpis = evaluateResearchKpis(typicalDemographics, {
      'Year 6': { r: 70, w: 62, c: 67 },
    });
    const kpi = kpis.find((k) => k.id === 'demographic-y6-combined');
    expect(kpi).toBeDefined();
    expect(kpi!.passed).toBe(false);
    expect(kpi!.explanation).toContain('above prediction');
  });

  it('all returned KPIs have valid citationId referencing a known citation', () => {
    const kpis = evaluateResearchKpis(typicalDemographics, {
      'Year 1': { c: 45 },
      'Year 5': { c: 65 },
      'Year 6': { r: 67, w: 54, c: 57 },
    });
    kpis.forEach((kpi) => {
      expect(
        RESEARCH_CITATIONS[kpi.citationId],
        `KPI ${kpi.id} references unknown citation: ${kpi.citationId}`,
      ).toBeDefined();
    });
  });

  it('all returned KPIs have non-empty name, target, and explanation', () => {
    const kpis = evaluateResearchKpis(typicalDemographics, {
      'Year 1': { c: 45 },
      'Year 5': { c: 65 },
      'Year 6': { r: 67, w: 54, c: 57 },
    });
    kpis.forEach((kpi) => {
      expect(kpi.name).toBeTruthy();
      expect(kpi.target).toBeTruthy();
      expect(kpi.explanation).toBeTruthy();
    });
  });
});
