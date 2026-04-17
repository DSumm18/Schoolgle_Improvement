/**
 * Governor Assessment Report Template — Unit Tests
 *
 * Tests that the HTML generator produces valid, complete, self-contained
 * output for various data scenarios.
 */

import { describe, it, expect } from 'vitest';
import { generateGovernorReportHtml, GovernorReportData } from './governor-assessment';

// ─── Minimal fixture ──────────────────────────────────────────────────────────

const baseNarrative: GovernorReportData['narrative'] = {
  verdict: 'This school is performing at a secure level with Y6 Combined at 65%.',
  severity: 'secure',
  headline: 'Year 6 Combined is 65%, 4pp above the national average. Writing remains the weakest subject at 58%.',
  keyFindings: [
    { number: '65%', title: 'Y6 Combined ARE', detail: 'Above the national average of ~61%. Strong reading scores of 73% are driving outcomes.' },
    { number: '58%', title: 'Writing concern', detail: 'Writing at 58% is the drag on Combined. Greater Depth in Writing is 0% across 4 year groups.' },
    { number: '34%', title: 'FSM context', detail: 'High disadvantage school achieving above national average. Pupil Premium strategy appears effective.' },
  ],
  contextDefence: 'With 34% of pupils eligible for Free School Meals, this school sits in the top quartile for disadvantage nationally. Achieving 65% Combined in this context is genuinely impressive and reflects strong Pupil Premium targeting and quality first teaching.',
  recommendations: [
    { action: 'Implement structured writing programme', eefStrategy: 'Literacy interventions', impact: 'High', cost: 'Low' },
    { action: 'Introduce Greater Depth moderation sessions', eefStrategy: null, impact: 'Medium', cost: 'Very low' },
    { action: 'Review writing assessment criteria with all teachers', eefStrategy: 'Teacher professional development', impact: 'High', cost: 'Low' },
  ],
  questionsForHeadteacher: [
    'What specific evidence supports 65% Combined ARE at this stage of the year?',
    'Why is Greater Depth in Writing 0% across 4 year groups when ARE is 58%?',
    'How is Pupil Premium funding being used to support the 34% of disadvantaged pupils?',
    'What intervention is in place for the Year 6 cohort before SATs?',
    'How does teacher moderation compare to LA moderation of writing standards?',
  ],
};

const baseData: GovernorReportData = {
  schoolName: 'Northgate Primary School',
  schoolLogoUrl: null,
  trustName: 'Pennine Learning Trust',
  generatedAt: new Date('2026-04-17T10:00:00Z'),
  reportDate: 'April 2026',
  academicYear: '2025/26',
  y6Combined: 65,
  nationalPercentile: 68,
  nationalRank: { rank: 450, total: 1420 },
  threeYearAverage: 62,
  fsmPct: 34,
  sendPct: 14,
  trustFsmPct: 28,
  totalPupils: 312,
  dataQualityAlerts: [],
  cohortJourney: undefined,
  narrative: baseNarrative,
  primaryColor: '#6366f1',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateGovernorReportHtml', () => {
  it('returns a non-empty string', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(1000);
  });

  it('includes DOCTYPE and html tag', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
  });

  it('contains all four pages', () => {
    const html = generateGovernorReportHtml(baseData);
    const pageMatches = html.match(/class="page/g);
    expect(pageMatches?.length).toBeGreaterThanOrEqual(4);
  });

  it('renders school name', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('Northgate Primary School');
  });

  it('renders trust name when provided', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('Pennine Learning Trust');
  });

  it('renders the severity label for "secure"', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('Secure');
  });

  it('renders severity label "Urgent Improvement Required" for urgent', () => {
    const data: GovernorReportData = {
      ...baseData,
      narrative: { ...baseNarrative, severity: 'urgent', verdict: 'Urgent improvement required across all subjects.' },
    };
    const html = generateGovernorReportHtml(data);
    expect(html).toContain('Urgent Improvement Required');
  });

  it('renders all three key findings', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('Y6 Combined ARE');
    expect(html).toContain('Writing concern');
    expect(html).toContain('FSM context');
  });

  it('renders all three recommendations', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('Implement structured writing programme');
    expect(html).toContain('Introduce Greater Depth moderation sessions');
    expect(html).toContain('Review writing assessment criteria');
  });

  it('renders EEF strategy badges for relevant recommendations', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('EEF: Literacy interventions');
    expect(html).toContain('EEF: Teacher professional development');
  });

  it('renders all 5 governor questions', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('What specific evidence supports 65%');
    expect(html).toContain('Why is Greater Depth in Writing 0%');
    expect(html).toContain('How is Pupil Premium funding being used');
    expect(html).toContain('What intervention is in place for the Year 6');
    expect(html).toContain('How does teacher moderation compare');
  });

  it('renders the headline narrative', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('Year 6 Combined is 65%');
  });

  it('renders context defence paragraph', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('top quartile for disadvantage nationally');
  });

  it('shows "No data quality alerts" when alerts array is empty', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('No data quality alerts');
  });

  it('renders data quality alerts when present', () => {
    const data: GovernorReportData = {
      ...baseData,
      dataQualityAlerts: [
        { severity: 'high', title: '0% Greater Depth with 65% ARE', explanation: 'Statistically improbable in cohorts over 10.' },
      ],
    };
    const html = generateGovernorReportHtml(data);
    expect(html).toContain('0% Greater Depth with 65% ARE');
    expect(html).toContain('Statistically improbable');
  });

  it('does NOT add confidential watermark when confidential is false', () => {
    const data: GovernorReportData = { ...baseData, confidential: false };
    const html = generateGovernorReportHtml(data);
    expect(html).not.toContain('CONFIDENTIAL');
  });

  it('adds confidential watermark when confidential is true', () => {
    const data: GovernorReportData = { ...baseData, confidential: true };
    const html = generateGovernorReportHtml(data);
    expect(html).toContain('CONFIDENTIAL');
  });

  it('uses school logo URL when provided', () => {
    const data: GovernorReportData = {
      ...baseData,
      schoolLogoUrl: 'https://example.com/logo.png',
    };
    const html = generateGovernorReportHtml(data);
    expect(html).toContain('https://example.com/logo.png');
  });

  it('uses primary colour in inline styles', () => {
    const data: GovernorReportData = { ...baseData, primaryColor: '#dc2626' };
    const html = generateGovernorReportHtml(data);
    expect(html).toContain('#dc2626');
  });

  it('renders page-break class for pages 2, 3, 4', () => {
    const html = generateGovernorReportHtml(baseData);
    const pageBreakCount = (html.match(/class="page page-break"/g) ?? []).length;
    expect(pageBreakCount).toBe(3);
  });

  it('includes print media query for page breaks', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('@media print');
    expect(html).toContain('page-break-after: always');
  });

  it('is self-contained (no external stylesheet links)', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).not.toMatch(/<link[^>]+stylesheet/i);
  });

  it('has no CDN font references', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
  });

  it('renders sensible SVG chart placeholder when no cohort journey data', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('<svg');
    expect(html).toContain('No cohort journey data available');
  });

  it('renders real SVG chart lines when cohort journey data is provided', () => {
    const data: GovernorReportData = {
      ...baseData,
      cohortJourney: {
        label: '2025/26 cohort',
        dataPoints: [
          { year: 2026, yearGroup: 1, reading: 75, writing: 70, maths: 72 },
          { year: 2026, yearGroup: 2, reading: 73, writing: 68, maths: 70 },
          { year: 2026, yearGroup: 3, reading: 71, writing: 65, maths: 68 },
          { year: 2026, yearGroup: 4, reading: 69, writing: 63, maths: 66 },
          { year: 2026, yearGroup: 5, reading: 67, writing: 61, maths: 64 },
          { year: 2026, yearGroup: 6, reading: 73, writing: 58, maths: 65 },
        ],
      },
    };
    const html = generateGovernorReportHtml(data);
    expect(html).toContain('<path d=');
    expect(html).not.toContain('No cohort journey data available');
  });

  it('renders report date and academic year', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('April 2026');
    expect(html).toContain('2025/26');
  });

  it('renders generation date in footer', () => {
    const html = generateGovernorReportHtml(baseData);
    expect(html).toContain('17 April 2026');
  });

  it('renders N/A gracefully when numeric values are null', () => {
    const data: GovernorReportData = {
      ...baseData,
      y6Combined: null,
      nationalPercentile: null,
      fsmPct: null,
      totalPupils: null,
    };
    const html = generateGovernorReportHtml(data);
    expect(html).toContain('N/A');
  });

  it('handles special HTML characters in school name safely', () => {
    const data: GovernorReportData = {
      ...baseData,
      schoolName: "St Mary's & St John's Primary <Test>",
    };
    const html = generateGovernorReportHtml(data);
    // Should not appear unescaped
    expect(html).not.toContain("St Mary's & St John's Primary <Test>");
    // Should appear escaped
    expect(html).toContain('St Mary&#39;s &amp; St John&#39;s Primary &lt;Test&gt;');
  });
});
