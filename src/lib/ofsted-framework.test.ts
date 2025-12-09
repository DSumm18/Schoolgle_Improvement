import { describe, it, expect } from 'vitest';
import {
  calculateAIRating,
  calculateCategoryReadiness,
  calculateOverallReadiness,
  OFSTED_RATINGS,
  SAFEGUARDING_STATUS,
  OFSTED_FRAMEWORK,
  type OfstedAssessment,
} from './ofsted-framework';

describe('Ofsted Framework Utilities', () => {
  describe('calculateAIRating', () => {
    it('should return "not_assessed" when evidence count is 0', () => {
      const rating = calculateAIRating(0, 10);
      expect(rating).toBe('not_assessed');
    });

    it('should return "exceptional" when all evidence is found (100%)', () => {
      const rating = calculateAIRating(10, 10);
      expect(rating).toBe('exceptional');
    });

    it('should return "exceptional" when more than required evidence is found', () => {
      const rating = calculateAIRating(12, 10);
      expect(rating).toBe('exceptional');
    });

    it('should return "strong_standard" for 80-99% coverage', () => {
      expect(calculateAIRating(8, 10)).toBe('strong_standard');
      expect(calculateAIRating(9, 10)).toBe('strong_standard');
      expect(calculateAIRating(95, 100)).toBe('strong_standard');
    });

    it('should return "expected_standard" for 60-79% coverage', () => {
      expect(calculateAIRating(6, 10)).toBe('expected_standard');
      expect(calculateAIRating(7, 10)).toBe('expected_standard');
      expect(calculateAIRating(79, 100)).toBe('expected_standard');
    });

    it('should return "needs_attention" for 40-59% coverage', () => {
      expect(calculateAIRating(4, 10)).toBe('needs_attention');
      expect(calculateAIRating(5, 10)).toBe('needs_attention');
      expect(calculateAIRating(59, 100)).toBe('needs_attention');
    });

    it('should return "urgent_improvement" for less than 40% coverage', () => {
      expect(calculateAIRating(1, 10)).toBe('urgent_improvement');
      expect(calculateAIRating(3, 10)).toBe('urgent_improvement');
      expect(calculateAIRating(39, 100)).toBe('urgent_improvement');
    });

    it('should handle decimal ratios correctly', () => {
      expect(calculateAIRating(5, 8)).toBe('expected_standard'); // 62.5%
      expect(calculateAIRating(3, 8)).toBe('needs_attention'); // 37.5%
    });

    it('should handle edge cases at boundaries', () => {
      expect(calculateAIRating(100, 100)).toBe('exceptional'); // Exactly 100%
      expect(calculateAIRating(80, 100)).toBe('strong_standard'); // Exactly 80%
      expect(calculateAIRating(60, 100)).toBe('expected_standard'); // Exactly 60%
      expect(calculateAIRating(40, 100)).toBe('needs_attention'); // Exactly 40%
    });
  });

  describe('calculateCategoryReadiness', () => {
    it('should return 0 scores for invalid category ID', () => {
      const result = calculateCategoryReadiness('invalid_category', {});
      expect(result.userScore).toBe(0);
      expect(result.aiScore).toBe(0);
    });

    it('should return 0 scores when no assessments exist', () => {
      const categoryId = OFSTED_FRAMEWORK[0].id;
      const result = calculateCategoryReadiness(categoryId, {});
      expect(result.userScore).toBe(0);
      expect(result.aiScore).toBe(0);
    });

    it('should calculate user score from assessments', () => {
      const categoryId = OFSTED_FRAMEWORK[0].id;
      const firstSubcategory = OFSTED_FRAMEWORK[0].subcategories[0];

      const assessments: Record<string, OfstedAssessment> = {
        [firstSubcategory.id]: {
          schoolRating: 'exceptional',
          schoolRationale: 'Excellent work',
        },
      };

      const result = calculateCategoryReadiness(categoryId, assessments);
      expect(result.userScore).toBeGreaterThan(0);
    });

    it('should ignore not_assessed ratings', () => {
      const categoryId = OFSTED_FRAMEWORK[0].id;
      const firstSubcategory = OFSTED_FRAMEWORK[0].subcategories[0];

      const assessments: Record<string, OfstedAssessment> = {
        [firstSubcategory.id]: {
          schoolRating: 'not_assessed',
          schoolRationale: '',
        },
      };

      const result = calculateCategoryReadiness(categoryId, assessments);
      expect(result.userScore).toBe(0);
    });

    it('should calculate average score for multiple subcategories', () => {
      const categoryId = OFSTED_FRAMEWORK[0].id;
      const subcategories = OFSTED_FRAMEWORK[0].subcategories;

      if (subcategories.length >= 2) {
        const assessments: Record<string, OfstedAssessment> = {
          [subcategories[0].id]: {
            schoolRating: 'exceptional',
            schoolRationale: 'Great',
          },
          [subcategories[1].id]: {
            schoolRating: 'strong_standard',
            schoolRationale: 'Good',
          },
        };

        const result = calculateCategoryReadiness(categoryId, assessments);
        expect(result.userScore).toBeGreaterThan(0);
        expect(result.userScore).toBeLessThanOrEqual(100);
      }
    });

    it('should handle exceptional rating (score 5)', () => {
      const categoryId = OFSTED_FRAMEWORK[0].id;
      const firstSubcategory = OFSTED_FRAMEWORK[0].subcategories[0];

      const assessments: Record<string, OfstedAssessment> = {
        [firstSubcategory.id]: {
          schoolRating: 'exceptional',
          schoolRationale: 'Exceptional quality',
        },
      };

      const result = calculateCategoryReadiness(categoryId, assessments);
      expect(result.userScore).toBe(100); // 5 * 20 = 100
    });

    it('should handle strong_standard rating (score 4)', () => {
      const categoryId = OFSTED_FRAMEWORK[0].id;
      const firstSubcategory = OFSTED_FRAMEWORK[0].subcategories[0];

      const assessments: Record<string, OfstedAssessment> = {
        [firstSubcategory.id]: {
          schoolRating: 'strong_standard',
          schoolRationale: 'Strong quality',
        },
      };

      const result = calculateCategoryReadiness(categoryId, assessments);
      expect(result.userScore).toBe(80); // 4 * 20 = 80
    });
  });

  describe('calculateOverallReadiness', () => {
    it('should return 0 scores when no assessments exist', () => {
      const result = calculateOverallReadiness({});
      expect(result.userScore).toBe(0);
      expect(result.aiScore).toBe(0);
    });

    it('should calculate average across all categories', () => {
      const category1 = OFSTED_FRAMEWORK[0];
      const category2 = OFSTED_FRAMEWORK[1];

      const assessments: Record<string, OfstedAssessment> = {
        [category1.subcategories[0].id]: {
          schoolRating: 'exceptional',
          schoolRationale: 'Excellent',
        },
        [category2.subcategories[0].id]: {
          schoolRating: 'expected_standard',
          schoolRationale: 'Good',
        },
      };

      const result = calculateOverallReadiness(assessments);
      expect(result.userScore).toBeGreaterThan(0);
      expect(result.userScore).toBeLessThanOrEqual(100);
    });

    it('should handle mixed ratings across categories', () => {
      const assessments: Record<string, OfstedAssessment> = {};

      // Add some assessments
      OFSTED_FRAMEWORK.slice(0, 2).forEach((category, idx) => {
        const rating = idx === 0 ? 'exceptional' : 'strong_standard';
        assessments[category.subcategories[0].id] = {
          schoolRating: rating,
          schoolRationale: 'Test',
        };
      });

      const result = calculateOverallReadiness(assessments);
      expect(result.userScore).toBeGreaterThan(60);
      expect(result.userScore).toBeLessThanOrEqual(100);
    });

    it('should ignore categories with no assessments', () => {
      const category1 = OFSTED_FRAMEWORK[0];

      const assessments: Record<string, OfstedAssessment> = {
        [category1.subcategories[0].id]: {
          schoolRating: 'exceptional',
          schoolRationale: 'Excellent',
        },
      };

      const result = calculateOverallReadiness(assessments);
      // Should only count the one category with assessments
      expect(result.userScore).toBe(100); // One category at exceptional = 100
    });

    it('should return consistent scores for consistent ratings', () => {
      const assessments: Record<string, OfstedAssessment> = {};

      // All categories at the same rating
      OFSTED_FRAMEWORK.forEach((category) => {
        assessments[category.subcategories[0].id] = {
          schoolRating: 'strong_standard',
          schoolRationale: 'Consistent',
        };
      });

      const result = calculateOverallReadiness(assessments);
      expect(result.userScore).toBe(80); // All at strong_standard = 80
    });
  });

  describe('Framework Data Structures', () => {
    describe('OFSTED_RATINGS', () => {
      it('should have all required rating levels', () => {
        expect(OFSTED_RATINGS).toHaveProperty('exceptional');
        expect(OFSTED_RATINGS).toHaveProperty('strong_standard');
        expect(OFSTED_RATINGS).toHaveProperty('expected_standard');
        expect(OFSTED_RATINGS).toHaveProperty('needs_attention');
        expect(OFSTED_RATINGS).toHaveProperty('urgent_improvement');
        expect(OFSTED_RATINGS).toHaveProperty('not_assessed');
      });

      it('should have correct score values', () => {
        expect(OFSTED_RATINGS.exceptional.score).toBe(5);
        expect(OFSTED_RATINGS.strong_standard.score).toBe(4);
        expect(OFSTED_RATINGS.expected_standard.score).toBe(3);
        expect(OFSTED_RATINGS.needs_attention.score).toBe(2);
        expect(OFSTED_RATINGS.urgent_improvement.score).toBe(1);
        expect(OFSTED_RATINGS.not_assessed.score).toBe(0);
      });

      it('should have labels and colors for each rating', () => {
        Object.values(OFSTED_RATINGS).forEach((rating) => {
          expect(rating).toHaveProperty('label');
          expect(rating).toHaveProperty('color');
          expect(rating).toHaveProperty('textColor');
          expect(rating).toHaveProperty('description');
          expect(rating).toHaveProperty('score');
        });
      });
    });

    describe('SAFEGUARDING_STATUS', () => {
      it('should have all required safeguarding statuses', () => {
        expect(SAFEGUARDING_STATUS).toHaveProperty('met');
        expect(SAFEGUARDING_STATUS).toHaveProperty('not_met');
        expect(SAFEGUARDING_STATUS).toHaveProperty('not_assessed');
      });

      it('should have labels and colors for each status', () => {
        Object.values(SAFEGUARDING_STATUS).forEach((status) => {
          expect(status).toHaveProperty('label');
          expect(status).toHaveProperty('color');
          expect(status).toHaveProperty('description');
        });
      });
    });

    describe('OFSTED_FRAMEWORK', () => {
      it('should be an array with categories', () => {
        expect(Array.isArray(OFSTED_FRAMEWORK)).toBe(true);
        expect(OFSTED_FRAMEWORK.length).toBeGreaterThan(0);
      });

      it('should have valid category structure', () => {
        OFSTED_FRAMEWORK.forEach((category) => {
          expect(category).toHaveProperty('id');
          expect(category).toHaveProperty('name');
          expect(category).toHaveProperty('description');
          expect(category).toHaveProperty('color');
          expect(category).toHaveProperty('guidanceSummary');
          expect(category).toHaveProperty('guidanceLink');
          expect(category).toHaveProperty('subcategories');
          expect(Array.isArray(category.subcategories)).toBe(true);
        });
      });

      it('should have valid subcategory structure', () => {
        OFSTED_FRAMEWORK.forEach((category) => {
          category.subcategories.forEach((subcategory) => {
            expect(subcategory).toHaveProperty('id');
            expect(subcategory).toHaveProperty('name');
            expect(subcategory).toHaveProperty('description');
            expect(subcategory).toHaveProperty('evidenceRequired');
            expect(subcategory).toHaveProperty('keyIndicators');
            expect(subcategory).toHaveProperty('inspectionFocus');
            expect(Array.isArray(subcategory.evidenceRequired)).toBe(true);
            expect(Array.isArray(subcategory.keyIndicators)).toBe(true);
            expect(Array.isArray(subcategory.inspectionFocus)).toBe(true);
          });
        });
      });

      it('should have unique category IDs', () => {
        const ids = OFSTED_FRAMEWORK.map((c) => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });

      it('should have unique subcategory IDs within each category', () => {
        OFSTED_FRAMEWORK.forEach((category) => {
          const ids = category.subcategories.map((s) => s.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        });
      });

      it('should have evidence items for each subcategory', () => {
        OFSTED_FRAMEWORK.forEach((category) => {
          category.subcategories.forEach((subcategory) => {
            expect(subcategory.evidenceRequired.length).toBeGreaterThan(0);
          });
        });
      });

      it('should have valid evidence item structure', () => {
        OFSTED_FRAMEWORK.forEach((category) => {
          category.subcategories.forEach((subcategory) => {
            subcategory.evidenceRequired.forEach((evidence) => {
              expect(evidence).toHaveProperty('id');
              expect(evidence).toHaveProperty('name');
              expect(evidence).toHaveProperty('description');
              expect(typeof evidence.id).toBe('string');
              expect(typeof evidence.name).toBe('string');
              expect(typeof evidence.description).toBe('string');
            });
          });
        });
      });
    });
  });
});
