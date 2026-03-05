/**
 * Findings Classification System - Quick Test
 *
 * Run with: npm test -- findings-database.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  classifyFinding,
  getRequirementsByDomain,
  getRequirementsByClassification,
  searchRequirements,
  formatClassification,
  getClassificationColor,
  type FindingDomain,
  type FindingClassification
} from './findings-database';

describe('Findings Classification Database', () => {
  describe('Statutory Requirements', () => {
    it('should classify high cold water temperature as statutory', () => {
      const result = classifyFinding('Cold water temperature at outlet is 25°C, exceeding the 20°C limit', 'legionella');

      expect(result.classification).toBe('statutory');
      expect(result.source).toContain('HSE L8');
      expect(result.severity).toBe('high');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should classify missed weekly flushing as statutory', () => {
      const result = classifyFinding('Weekly flushing not completed for outlets unused for 7 days', 'legionella');

      expect(result.classification).toBe('statutory');
      expect(result.source).toContain('HSE L8');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should classify fire alarm testing as statutory', () => {
      const result = classifyFinding('Weekly fire alarm test not completed', 'fire');

      expect(result.classification).toBe('statutory');
      expect(result.source).toContain('RRO 2005');
    });

    it('should classify annual fire risk assessment as statutory', () => {
      const result = classifyFinding('Fire risk assessment review is overdue', 'fire');

      expect(result.classification).toBe('statutory');
      expect(result.severity).toBe('critical');
    });

    it('should classify asbestos register review as statutory', () => {
      const result = classifyFinding('Asbestos register not reviewed in the past year', 'asbestos');

      expect(result.classification).toBe('statutory');
      expect(result.source).toContain('CAR 2012');
    });

    it('should classify gas safety check as statutory', () => {
      const result = classifyFinding('Annual gas safety check not completed', 'gas');

      expect(result.classification).toBe('statutory');
      expect(result.source).toContain('GFSP');
    });
  });

  describe('Good Practice', () => {
    it('should classify sentinel outlets as good practice', () => {
      const result = classifyFinding('Install sentinel outlets on all risers for monitoring', 'legionella');

      expect(result.classification).toBe('good_practice');
      expect(result.source).toContain('HSG274');
    });

    it('should classify daily flushing as good practice (not required)', () => {
      const result = classifyFinding('Flush all outlets daily instead of weekly', 'legionella');

      expect(result.classification).toBe('good_practice');
    });

    it('should classify additional smoke detectors as good practice', () => {
      const result = classifyFinding('Install additional smoke detectors in corridors for enhanced coverage', 'fire');

      expect(result.classification).toBe('good_practice');
    });
  });

  describe('Contractor Suggestions', () => {
    it('should classify equipment replacement as contractor suggestion when no statutory requirement', () => {
      const result = classifyFinding('Cold water tank is 15 years old, recommend replacement', 'legionella');

      expect(result.classification).toBe('contractor_suggestion');
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should classify early extinguisher replacement as contractor suggestion', () => {
      const result = classifyFinding('Fire extinguishers showing signs of age, replace early', 'fire');

      expect(result.classification).toBe('contractor_suggestion');
    });

    it('should classify unknown findings as contractor suggestion by default', () => {
      const result = classifyFinding('Consider installing a new fancy system', 'legionella');

      expect(result.classification).toBe('contractor_suggestion');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Domain Filtering', () => {
    it('should return only legionella requirements', () => {
      const requirements = getRequirementsByDomain('legionella');

      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements.every(req => req.domain === 'legionella')).toBe(true);
    });

    it('should return only fire requirements', () => {
      const requirements = getRequirementsByDomain('fire');

      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements.every(req => req.domain === 'fire')).toBe(true);
    });

    it('should return only statutory requirements', () => {
      const requirements = getRequirementsByClassification('statutory');

      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements.every(req => req.classification === 'statutory')).toBe(true);
    });

    it('should return only good practice requirements', () => {
      const requirements = getRequirementsByClassification('good_practice');

      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements.every(req => req.classification === 'good_practice')).toBe(true);
    });
  });

  describe('Search', () => {
    it('should find requirements by keyword', () => {
      const results = searchRequirements('temperature');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(req => req.description.toLowerCase().includes('temperature'))).toBe(true);
    });

    it('should find requirements by source reference', () => {
      const results = searchRequirements('HSE L8');

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(req => req.source.includes('HSE L8'))).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = searchRequirements('xyznotarealrequirement');

      expect(results).toEqual([]);
    });
  });

  describe('Helper Functions', () => {
    it('should format classifications correctly', () => {
      expect(formatClassification('statutory')).toBe('Statutory Required');
      expect(formatClassification('good_practice')).toBe('Good Practice');
      expect(formatClassification('contractor_suggestion')).toBe('Contractor Suggestion');
    });

    it('should return correct colors', () => {
      expect(getClassificationColor('statutory')).toBe('red');
      expect(getClassificationColor('good_practice')).toBe('amber');
      expect(getClassificationColor('contractor_suggestion')).toBe('blue');
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence for clear statutory matches', () => {
      const result = classifyFinding('Cold water temperature exceeds 20°C limit', 'legionella');

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should have lower confidence for ambiguous findings', () => {
      const result = classifyFinding('Water system looks old', 'legionella');

      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should provide explanation for classification', () => {
      const result = classifyFinding('Cold water temperature at outlet is 25°C', 'legionella');

      expect(result.explanation).toBeDefined();
      expect(result.explanation.length).toBeGreaterThan(0);
    });
  });

  describe('Severity Assignment', () => {
    it('should assign critical severity to missed risk assessments', () => {
      const result = classifyFinding('Fire risk assessment not completed', 'fire');

      expect(result.severity).toBe('critical');
    });

    it('should assign high severity to temperature exceedances', () => {
      const result = classifyFinding('Cold water temperature exceeds 20°C', 'legionella');

      expect(result.severity).toBe('high');
    });

    it('should assign medium or low severity to suggestions', () => {
      const result = classifyFinding('Consider upgrading equipment', 'legionella');

      expect(['medium', 'low']).toContain(result.severity);
    });
  });
});
