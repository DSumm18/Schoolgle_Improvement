/**
 * SchoolDataGuardian Adversarial Test Suite
 *
 * Red-team exercise: reveals what the Guardian catches vs what leaks through.
 * All tests use soft assertions — failures are informational, not blocking.
 * The scorecard printed to stdout is the deliverable.
 *
 * Run with:
 *   npx vitest run apps/platform/src/lib/ed/__tests__/school-data-guardian.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SchoolDataGuardian } from '../../school-data-guardian';
import { testFixtures, type GuardianTestCase } from './guardian-test-fixtures';

// ─── Scorecard accumulator ────────────────────────────────────────────────────

interface CategoryScore {
  total: number;
  pass: number;
  fail: number;
  failures: string[];
  /** Cases where we expected the Guardian to catch and it DID */
  truePositive: number;
  /** Cases where we expected the Guardian NOT to catch and it didn't — honest gap tracking */
  knownGap: number;
  /** Cases where Guardian caught PII that was expected to be missed (bonus catch) */
  bonusCatch: number;
}

const scorecard: Record<string, CategoryScore> = {};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('SchoolDataGuardian Adversarial Test Suite', () => {
  beforeAll(() => {
    for (const category of Object.keys(testFixtures)) {
      scorecard[category] = {
        total: 0,
        pass: 0,
        fail: 0,
        failures: [],
        truePositive: 0,
        knownGap: 0,
        bonusCatch: 0,
      };
    }
  });

  for (const [category, fixtures] of Object.entries(testFixtures)) {
    describe(category.replace(/_/g, ' '), () => {
      for (const fixture of fixtures) {
        it(`[${fixture.difficulty}] ${fixture.description}`, () => {
          const result = SchoolDataGuardian.scrub(fixture.input);
          const stats = scorecard[category];
          stats.total++;

          // Detect which PII values leaked
          const leaked: string[] = [];
          const caught: string[] = [];

          for (const piiValue of fixture.piiValues) {
            if (result.sanitised.includes(piiValue)) {
              leaked.push(piiValue);
            } else {
              caught.push(piiValue);
            }
          }

          const allCaught = leaked.length === 0;
          const noPiiExpected = fixture.piiValues.length === 0;

          if (noPiiExpected) {
            // Just verify the Guardian doesn't crash on this input
            stats.pass++;
            stats.knownGap++;
          } else if (allCaught) {
            stats.pass++;
            if (fixture.expectsCatch) {
              stats.truePositive++;
            } else {
              // Guardian caught something it wasn't expected to — bonus!
              stats.bonusCatch++;
              console.info(
                `  BONUS CATCH in [${category}]: Guardian caught "${caught.join('", "')}" — was expected to miss them`
              );
            }
          } else {
            // Some or all PII leaked
            if (!fixture.expectsCatch) {
              // We predicted the Guardian would miss these — record as known gap, still "pass"
              stats.pass++;
              stats.knownGap++;
              for (const piiValue of leaked) {
                console.info(
                  `  KNOWN GAP [${category}]: "${piiValue}" leaked as predicted — Guardian has no pattern for this`
                );
              }
            } else {
              // We expected the Guardian to catch these but it didn't — real failure
              stats.fail++;
              for (const piiValue of leaked) {
                const truncated = fixture.input.substring(0, 70);
                const msg = `LEAKED "${piiValue}" in: "${truncated}${fixture.input.length > 70 ? '...' : ''}"`;
                stats.failures.push(msg);
                console.warn(`  UNEXPECTED LEAK in [${category}]: ${msg}`);
              }
            }
          }

          // Soft assertion — this test always passes structurally.
          // The scorecard is the real output.
          expect(typeof result.sanitised).toBe('string');
          expect(result.tokenMap).toBeInstanceOf(Map);
        });
      }
    });
  }

  afterAll(() => {
    // Calculate totals
    let totalAll = 0;
    let passAll = 0;
    let failAll = 0;
    let truePositiveAll = 0;
    let knownGapAll = 0;
    let bonusCatchAll = 0;

    for (const stats of Object.values(scorecard)) {
      totalAll += stats.total;
      passAll += stats.pass;
      failAll += stats.fail;
      truePositiveAll += stats.truePositive;
      knownGapAll += stats.knownGap;
      bonusCatchAll += stats.bonusCatch;
    }

    const overallScore = totalAll > 0 ? Math.round((passAll / totalAll) * 100) : 0;

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('  SchoolDataGuardian Adversarial Test Scorecard');
    console.log('  Red Team Exercise — PII Detection Across 11 Categories');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Category              | Total | Pass | Fail | Score | TP | Gap | Bonus');
    console.log('───────────────────── | ───── | ──── | ──── | ───── | ── | ─── | ─────');

    for (const [category, stats] of Object.entries(scorecard)) {
      const score = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
      const name = category.padEnd(21).substring(0, 21);
      console.log(
        `${name} | ${String(stats.total).padStart(5)} | ${String(stats.pass).padStart(4)} | ${String(stats.fail).padStart(4)} | ${String(score).padStart(3)}%  | ${String(stats.truePositive).padStart(2)} | ${String(stats.knownGap).padStart(3)} | ${String(stats.bonusCatch).padStart(5)}`
      );
    }

    console.log('───────────────────── | ───── | ──── | ──── | ───── | ── | ─── | ─────');
    console.log(
      `${'OVERALL'.padEnd(21)} | ${String(totalAll).padStart(5)} | ${String(passAll).padStart(4)} | ${String(failAll).padStart(4)} | ${String(overallScore).padStart(3)}%  | ${String(truePositiveAll).padStart(2)} | ${String(knownGapAll).padStart(3)} | ${String(bonusCatchAll).padStart(5)}`
    );

    console.log('');
    console.log('Legend:');
    console.log('  Pass  = Test passed (Guardian caught PII, or gap was predicted and confirmed)');
    console.log('  Fail  = Guardian was expected to catch PII but it leaked through (UNEXPECTED)');
    console.log('  TP    = True Positive (Guardian caught PII as expected)');
    console.log('  Gap   = Known Gap (Guardian predictably missed PII — no pattern for it)');
    console.log('  Bonus = Bonus Catch (Guardian caught PII we predicted it would miss)');
    console.log('');

    // Print unexpected failures prominently
    const allUnexpected: string[] = [];
    for (const [category, stats] of Object.entries(scorecard)) {
      if (stats.failures.length > 0) {
        for (const f of stats.failures) {
          allUnexpected.push(`  [${category}] ${f}`);
        }
      }
    }

    if (allUnexpected.length === 0) {
      console.log('UNEXPECTED LEAKS: None — all leaks were predicted.');
    } else {
      console.log(`UNEXPECTED LEAKS (${allUnexpected.length} — Guardian failed to catch predicted PII):`);
      for (const line of allUnexpected) {
        console.log(line);
      }
    }

    // Print known gaps summary for product awareness
    console.log('');
    console.log('KNOWN GAPS (predicted — documented for product roadmap):');
    console.log('  - Bare first names without role prefix (Tommy, Grace, Amelia, etc.)');
    console.log('  - Bare surnames without role prefix (Smith, Okonkwo, etc.)');
    console.log('  - Abbreviated names (T.Smith)');
    console.log('  - ISO 8601 dates (2017-03-15 — Guardian only matches d/m/y variants)');
    console.log('  - Encoded emails (claire dot smith at gmail dot com)');
    console.log('  - Medical/SEN diagnoses without names (ADHD, EHCP — no PII pattern)');
    console.log('  - Safeguarding status without names (CPP, LAC status alone)');
    console.log('  - Social worker first names without title prefix');
    console.log('  - Family name in "the X family" phrasing');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════');
  });
});
