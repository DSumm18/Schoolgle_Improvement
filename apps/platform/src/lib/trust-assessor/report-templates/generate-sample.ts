// Sample generator — produces a Grove House Governor Report HTML file for local testing
// Run with: npx tsx src/lib/trust-assessor/report-templates/generate-sample.ts

import { writeFileSync } from 'fs';
import { generateGovernorReportHtml, type GovernorReportData } from './governor-assessment';

const sampleData: GovernorReportData = {
  schoolName: 'Grove House Primary School',
  schoolLogoUrl: null,
  trustName: 'Pennine Academies Yorkshire',
  generatedAt: new Date(),
  reportDate: 'April 2026',
  academicYear: '2025/26',

  y6Combined: 48,
  nationalPercentile: 22,
  nationalRank: { rank: 12286, total: 15751 },
  threeYearAverage: 57,

  fsmPct: 38,
  sendPct: 22,
  trustFsmPct: 30,
  totalPupils: 125,

  dataQualityAlerts: [
    {
      severity: 'high',
      title: '0% Greater Depth Writing across 5 year groups',
      explanation:
        'With 60%+ of pupils reaching Expected Standard in Writing, the statistically expected Greater Depth rate is 8-15%. 0% across multiple year groups suggests systemic moderation bias or data entry error. This pattern occurs in less than 0.1% of UK primary schools.',
    },
    {
      severity: 'medium',
      title: 'Y6 Reading declined 10pp from KS1 baseline',
      explanation:
        'Current Y6 achieved 67% Reading at KS1 in 2022/23. They are now reported at 57% at mid-year Y6. This is a 10pp decline over 4 years — either KS1 was over-moderated or KS2 progress has stalled.',
    },
  ],

  cohortJourney: {
    label: 'Current Y6 cohort journey',
    dataPoints: [
      { year: 2023, yearGroup: 2, reading: 67, writing: 46, maths: 63 },
      { year: 2026, yearGroup: 6, reading: 57, writing: 54, maths: 51 },
    ],
  },

  narrative: {
    verdict: 'Urgent improvement required — Grove House is in the bottom quartile nationally and the current Y6 cohort has declined from their KS1 baseline.',
    severity: 'urgent',
    headline:
      'Grove House Y6 Combined at 48% places the school in the 22nd percentile nationally, worse than 78% of England primary schools. Most concerning, this cohort has declined 10pp in Reading and 12pp in Maths since their KS1 assessments — suggesting either KS1 results were over-moderated or KS2 teaching has not maintained progress.',

    keyFindings: [
      {
        number: '22nd percentile',
        title: 'Below the national average',
        detail:
          'Grove House Y6 Combined at 48% is 13pp below the national average of 61%, placing the school in the bottom quartile of 15,751 England primary schools. The 3-year average is 57%, indicating this year is unusually weak rather than a structural failure.',
      },
      {
        number: '-10pp',
        title: 'KS1 to Y6 decline in Reading',
        detail:
          'The current Y6 cohort achieved 67% Reading at KS1 in 2022/23 but are now at 57% at mid-year Y6. This regression in a single cohort strongly suggests either inflated KS1 moderation or stalled progress in KS2.',
      },
      {
        number: '0% GD',
        title: 'Zero Greater Depth Writing across 5 year groups',
        detail:
          'Statistically, 0% Greater Depth is effectively impossible in a cohort with 60%+ Expected Standard. This pattern, repeated across 5 year groups, indicates a systemic issue with either writing challenge, moderation practices, or data entry.',
      },
    ],

    contextDefence:
      'Grove House has 38% FSM eligibility, 8pp above the trust average and significantly above national (25%). 22% of pupils have identified SEND. When these demographic factors are accounted for, Grove House performs closer to the national average for similarly-disadvantaged schools, which sits around 48%. Removing the 8 SEND pupils from the Y6 cohort shifts Combined from 48% to approximately 62%. The headline figure is explained substantially by cohort composition, not by teaching quality. Governors should focus their challenge on the KS1-to-Y6 regression pattern (which is not demographic) rather than the raw headline number.',

    recommendations: [
      {
        action: 'Target 8 disadvantaged Y6 pupils with structured 1:1 tuition in Reading',
        eefStrategy: 'One-to-one tuition',
        impact: '+5 months',
        cost: 'Moderate',
      },
      {
        action: 'Review Writing moderation practices across all year groups with external moderator',
        eefStrategy: 'Metacognition & self-regulation',
        impact: '+7 months',
        cost: 'Low',
      },
      {
        action: 'Commission external KS1-to-KS2 progress audit to explain the Reading regression',
        eefStrategy: null,
        impact: '+3 months',
        cost: 'Low',
      },
    ],

    questionsForHeadteacher: [
      'What specific evidence supports the KS1 Reading rate of 67% given these pupils are now at 57% four years later? Can we see the 2022/23 moderation records?',
      'Why does Writing show 0% Greater Depth across 5 year groups when Reading and Maths both show consistent GD rates? What changed in Writing curriculum or moderation?',
      'Of the 12 Y6 pupils currently below Expected Standard in Combined, how many are FSM, SEND, or both? What is the Pupil Premium strategy specifically for these children?',
      'The Y5 cohort is reported at 71% Combined — significantly above Y6 at 48%. What accounts for this 23pp difference between consecutive year groups? Is it cohort composition or assessment consistency?',
      'Which three EEF-evidenced strategies will be deployed between now and the KS2 SATs in May, and what is the expected impact for each on the current Y6 cohort?',
    ],
  },

  primaryColor: '#6366f1',
  secondaryColor: '#ec4899',
  includeDataAppendix: false,
  confidential: false,
};

const html = generateGovernorReportHtml(sampleData);
const outPath = '/tmp/grove-house-governor-report.html';
writeFileSync(outPath, html);
console.log(`✅ Grove House Governor Report generated`);
console.log(`   Size: ${(html.length / 1024).toFixed(1)} KB`);
console.log(`   File: ${outPath}`);
console.log(`   Open: open ${outPath}`);
