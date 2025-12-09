import { describe, it, expect } from 'vitest';
import {
  updateAssessmentsFromEvidence,
  generateCategorySummaries,
  formatAssessmentUpdatesForFrontend,
  generateSummaryReport,
  type AssessmentUpdate,
  type AssessmentUpdates,
} from './assessment-updater';
import type { EvidenceMatch } from './ai-evidence-matcher';

describe('Assessment Updater', () => {
  // Helper function to create mock evidence matches
  const createMockEvidence = (
    subcategoryId: string,
    evidenceItem: string,
    confidence: number = 0.9
  ): EvidenceMatch => ({
    categoryId: 'quality_of_education',
    categoryName: 'Quality of Education',
    subcategoryId,
    subcategoryName: 'Curriculum Intent',
    evidenceItem,
    confidence,
    relevanceExplanation: 'This document provides clear evidence',
    keyQuotes: ['Quote 1', 'Quote 2'],
    documentId: 'doc-123',
    documentName: 'test-doc.pdf',
    documentLink: 'https://example.com/doc',
  });

  describe('updateAssessmentsFromEvidence', () => {
    it('should update assessments when evidence is found', () => {
      const evidenceMatches: EvidenceMatch[] = [
        createMockEvidence('curriculum_intent', 'Curriculum policy documents', 0.95),
        createMockEvidence('curriculum_intent', 'Subject schemes of work', 0.85),
      ];

      const updates = updateAssessmentsFromEvidence(evidenceMatches);

      expect(updates).toHaveProperty('curriculum_intent');
      const update = updates['curriculum_intent'];
      expect(update.subcategoryId).toBe('curriculum_intent');
      expect(update.evidenceCount).toBe(2);
      expect(update.aiRating).toBeDefined();
      expect(['outstanding', 'good', 'requires_improvement', 'inadequate']).toContain(
        update.aiRating
      );
      expect(update.aiRationale).toBeTruthy();
      expect(update.evidencePercentage).toBeGreaterThan(0);
    });

    it('should not create updates for subcategories with no evidence', () => {
      const evidenceMatches: EvidenceMatch[] = [
        createMockEvidence('curriculum_intent', 'Curriculum policy documents'),
      ];

      const updates = updateAssessmentsFromEvidence(evidenceMatches);

      // Only curriculum_intent should have an update
      expect(Object.keys(updates).length).toBe(1);
      expect(updates).toHaveProperty('curriculum_intent');
    });

    it('should count unique evidence items correctly', () => {
      const evidenceMatches: EvidenceMatch[] = [
        createMockEvidence('curriculum_intent', 'Curriculum policy documents', 0.9),
        createMockEvidence('curriculum_intent', 'Curriculum policy documents', 0.85), // Duplicate
        createMockEvidence('curriculum_intent', 'Subject schemes of work', 0.8),
      ];

      const updates = updateAssessmentsFromEvidence(evidenceMatches);
      const update = updates['curriculum_intent'];

      // Should count 2 unique evidence items, not 3
      expect(update.evidenceCount).toBe(2);
    });

    it('should calculate evidence percentage correctly', () => {
      const evidenceMatches: EvidenceMatch[] = [
        createMockEvidence('curriculum_intent', 'Evidence 1'),
        createMockEvidence('curriculum_intent', 'Evidence 2'),
      ];

      const updates = updateAssessmentsFromEvidence(evidenceMatches);
      const update = updates['curriculum_intent'];

      expect(update.evidencePercentage).toBeGreaterThan(0);
      expect(update.evidencePercentage).toBeLessThanOrEqual(100);
      expect(update.evidencePercentage).toBe(
        (update.evidenceCount / update.requiredCount) * 100
      );
    });

    it('should include high-confidence matches in rationale', () => {
      const evidenceMatches: EvidenceMatch[] = [
        createMockEvidence('curriculum_intent', 'Curriculum policy documents', 0.95),
        createMockEvidence('curriculum_intent', 'Subject schemes of work', 0.85),
        createMockEvidence('curriculum_intent', 'Assessment framework', 0.65),
      ];

      const updates = updateAssessmentsFromEvidence(evidenceMatches);
      const update = updates['curriculum_intent'];

      expect(update.aiRationale).toContain('Found Evidence');
      expect(update.aiRationale).toContain('Coverage');
    });

    it('should handle empty evidence array', () => {
      const updates = updateAssessmentsFromEvidence([]);

      expect(Object.keys(updates)).toHaveLength(0);
    });

    it('should generate appropriate AI rating based on evidence coverage', () => {
      // Test with low coverage
      const lowCoverageEvidence: EvidenceMatch[] = [
        createMockEvidence('curriculum_intent', 'Evidence 1'),
      ];

      const lowUpdates = updateAssessmentsFromEvidence(lowCoverageEvidence);
      const lowUpdate = lowUpdates['curriculum_intent'];

      expect(lowUpdate.aiRating).toBeDefined();

      // Test with high coverage (multiple evidence items)
      const highCoverageEvidence: EvidenceMatch[] = [
        createMockEvidence('curriculum_intent', 'Evidence 1'),
        createMockEvidence('curriculum_intent', 'Evidence 2'),
        createMockEvidence('curriculum_intent', 'Evidence 3'),
        createMockEvidence('curriculum_intent', 'Evidence 4'),
        createMockEvidence('curriculum_intent', 'Evidence 5'),
      ];

      const highUpdates = updateAssessmentsFromEvidence(highCoverageEvidence);
      const highUpdate = highUpdates['curriculum_intent'];

      expect(highUpdate.evidenceCount).toBeGreaterThan(lowUpdate.evidenceCount);
    });
  });

  describe('generateCategorySummaries', () => {
    it('should generate summaries for categories with updates', () => {
      const assessmentUpdates: AssessmentUpdates = {
        curriculum_intent: {
          subcategoryId: 'curriculum_intent',
          aiRating: 'good',
          aiRationale: 'Test rationale',
          evidenceCount: 3,
          requiredCount: 5,
          evidencePercentage: 60,
        },
        curriculum_implementation: {
          subcategoryId: 'curriculum_implementation',
          aiRating: 'outstanding',
          aiRationale: 'Excellent implementation',
          evidenceCount: 5,
          requiredCount: 5,
          evidencePercentage: 100,
        },
      };

      const summaries = generateCategorySummaries(assessmentUpdates);

      expect(summaries.length).toBeGreaterThan(0);
      const summary = summaries[0];
      expect(summary).toHaveProperty('categoryId');
      expect(summary).toHaveProperty('categoryName');
      expect(summary).toHaveProperty('subcategoriesUpdated');
      expect(summary).toHaveProperty('averageRating');
      expect(summary).toHaveProperty('totalEvidenceFound');
      expect(summary).toHaveProperty('readinessPercentage');
    });

    it('should calculate average rating correctly', () => {
      const assessmentUpdates: AssessmentUpdates = {
        curriculum_intent: {
          subcategoryId: 'curriculum_intent',
          aiRating: 'outstanding',
          aiRationale: 'Test',
          evidenceCount: 5,
          requiredCount: 5,
          evidencePercentage: 100,
        },
        curriculum_implementation: {
          subcategoryId: 'curriculum_implementation',
          aiRating: 'good',
          aiRationale: 'Test',
          evidenceCount: 3,
          requiredCount: 5,
          evidencePercentage: 60,
        },
      };

      const summaries = generateCategorySummaries(assessmentUpdates);

      if (summaries.length > 0) {
        const summary = summaries[0];
        expect(['Outstanding', 'Good', 'Requires Improvement', 'Inadequate']).toContain(
          summary.averageRating
        );
      }
    });

    it('should skip categories with no updates', () => {
      const assessmentUpdates: AssessmentUpdates = {};
      const summaries = generateCategorySummaries(assessmentUpdates);

      expect(summaries).toHaveLength(0);
    });

    it('should calculate readiness percentage', () => {
      const assessmentUpdates: AssessmentUpdates = {
        curriculum_intent: {
          subcategoryId: 'curriculum_intent',
          aiRating: 'good',
          aiRationale: 'Test',
          evidenceCount: 2,
          requiredCount: 4,
          evidencePercentage: 50,
        },
      };

      const summaries = generateCategorySummaries(assessmentUpdates);

      if (summaries.length > 0) {
        expect(summaries[0].readinessPercentage).toBeGreaterThanOrEqual(0);
        expect(summaries[0].readinessPercentage).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('formatAssessmentUpdatesForFrontend', () => {
    it('should format updates for frontend consumption', () => {
      const assessmentUpdates: AssessmentUpdates = {
        curriculum_intent: {
          subcategoryId: 'curriculum_intent',
          aiRating: 'good',
          aiRationale: 'Test rationale',
          evidenceCount: 3,
          requiredCount: 5,
          evidencePercentage: 60.5,
        },
      };

      const formatted = formatAssessmentUpdatesForFrontend(assessmentUpdates);

      expect(formatted).toHaveProperty('curriculum_intent');
      const formattedUpdate = formatted['curriculum_intent'];
      expect(formattedUpdate.aiRating).toBe('good');
      expect(formattedUpdate.aiRationale).toBe('Test rationale');
      expect(formattedUpdate.evidenceCount).toBe(3);
      expect(formattedUpdate.requiredCount).toBe(5);
      expect(formattedUpdate.evidencePercentage).toBe(61); // Rounded
      expect(formattedUpdate.schoolRating).toBeUndefined();
      expect(formattedUpdate.schoolRationale).toBeUndefined();
    });

    it('should round evidence percentage to integer', () => {
      const assessmentUpdates: AssessmentUpdates = {
        test_subcategory: {
          subcategoryId: 'test_subcategory',
          aiRating: 'good',
          aiRationale: 'Test',
          evidenceCount: 1,
          requiredCount: 3,
          evidencePercentage: 33.333333,
        },
      };

      const formatted = formatAssessmentUpdatesForFrontend(assessmentUpdates);

      expect(formatted['test_subcategory'].evidencePercentage).toBe(33);
    });
  });

  describe('generateSummaryReport', () => {
    it('should generate a complete markdown report', () => {
      const assessmentUpdates: AssessmentUpdates = {
        curriculum_intent: {
          subcategoryId: 'curriculum_intent',
          aiRating: 'good',
          aiRationale: 'Strong curriculum documentation',
          evidenceCount: 3,
          requiredCount: 5,
          evidencePercentage: 60,
        },
      };

      const categorySummaries = generateCategorySummaries(assessmentUpdates);
      const report = generateSummaryReport(assessmentUpdates, categorySummaries);

      expect(report).toContain('# Ofsted Evidence Scan Summary');
      expect(report).toContain('## Overview');
      expect(report).toContain('Subcategories Updated:');
      expect(report).toContain('Total Evidence Found:');
      expect(report).toContain('## Category Summaries');
      expect(report).toContain('## Detailed Evidence Analysis');
    });

    it('should include scan date in report', () => {
      const assessmentUpdates: AssessmentUpdates = {};
      const categorySummaries = generateCategorySummaries(assessmentUpdates);
      const report = generateSummaryReport(assessmentUpdates, categorySummaries);

      expect(report).toContain('**Scan Date:**');
    });

    it('should include evidence counts in report', () => {
      const assessmentUpdates: AssessmentUpdates = {
        curriculum_intent: {
          subcategoryId: 'curriculum_intent',
          aiRating: 'good',
          aiRationale: 'Test',
          evidenceCount: 5,
          requiredCount: 10,
          evidencePercentage: 50,
        },
      };

      const categorySummaries = generateCategorySummaries(assessmentUpdates);
      const report = generateSummaryReport(assessmentUpdates, categorySummaries);

      expect(report).toContain('5 documents');
    });

    it('should include rationale in detailed section', () => {
      const assessmentUpdates: AssessmentUpdates = {
        curriculum_intent: {
          subcategoryId: 'curriculum_intent',
          aiRating: 'outstanding',
          aiRationale: 'Exceptional curriculum planning',
          evidenceCount: 5,
          requiredCount: 5,
          evidencePercentage: 100,
        },
      };

      const categorySummaries = generateCategorySummaries(assessmentUpdates);
      const report = generateSummaryReport(assessmentUpdates, categorySummaries);

      expect(report).toContain('Exceptional curriculum planning');
    });

    it('should handle empty updates', () => {
      const report = generateSummaryReport({}, []);

      expect(report).toContain('# Ofsted Evidence Scan Summary');
      expect(report).toContain('Subcategories Updated: 0');
      expect(report).toContain('Total Evidence Found: 0');
    });
  });
});
