/**
 * Intent Classifier Tests
 */

import { describe, it, expect } from 'vitest';
import { classifyIntent, isWorkRelated, requiresMultiPerspective } from '../orchestrator/intent-classifier';

describe('Intent Classifier', () => {
  describe('isWorkRelated', () => {
    it('should identify work-related queries with domain keywords', () => {
      const result = isWorkRelated('What temperature should legionella water be?');
      expect(result.isWorkRelated).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should identify chat queries', () => {
      const result = isWorkRelated('tell me a joke');
      expect(result.isWorkRelated).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should default to work-related if unclear', () => {
      const result = isWorkRelated('how does this work');
      expect(result.isWorkRelated).toBe(true);
    });
  });

  describe('classifyIntent - Estates domain', () => {
    it('should route legionella questions to estates specialist', () => {
      const result = classifyIntent('What temperature should legionella water be?');
      expect(result.domain).toBe('estates');
      expect(result.specialist).toBe('estates-specialist');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should route RIDDOR questions to estates specialist', () => {
      const result = classifyIntent('How do I report a RIDDOR incident?');
      expect(result.domain).toBe('estates');
      expect(result.specialist).toBe('estates-specialist');
    });

    it('should route fire safety questions to estates specialist', () => {
      const result = classifyIntent('How often should we do fire drills?');
      expect(result.domain).toBe('estates');
      expect(result.specialist).toBe('estates-specialist');
    });
  });

  describe('classifyIntent - HR domain', () => {
    it('should route sickness absence questions to HR specialist', () => {
      const result = classifyIntent('How do I record staff sickness absence?');
      expect(result.domain).toBe('hr');
      expect(result.specialist).toBe('hr-specialist');
    });

    it('should route maternity questions to HR specialist', () => {
      const result = classifyIntent('What is the maternity leave entitlement?');
      expect(result.domain).toBe('hr');
      expect(result.specialist).toBe('hr-specialist');
    });

    it('should route contract questions to HR specialist', () => {
      const result = classifyIntent('What should be in an employment contract?');
      expect(result.domain).toBe('hr');
      expect(result.specialist).toBe('hr-specialist');
    });
  });

  describe('classifyIntent - SEND domain', () => {
    it('should route EHCP questions to SEND specialist', () => {
      const result = classifyIntent('What is the EHCP assessment timeline?');
      expect(result.domain).toBe('send');
      expect(result.specialist).toBe('send-specialist');
    });

    it('should route SEN support questions to SEND specialist', () => {
      const result = classifyIntent('How do I use the graduated approach for SEN?');
      expect(result.domain).toBe('send');
      expect(result.specialist).toBe('send-specialist');
    });
  });

  describe('classifyIntent - Data domain', () => {
    it('should route census questions to data specialist', () => {
      const result = classifyIntent('When is the spring census deadline?');
      expect(result.domain).toBe('data');
      expect(result.specialist).toBe('data-specialist');
    });

    it('should route attendance questions to data specialist', () => {
      const result = classifyIntent('What is the attendance code for illness?');
      expect(result.domain).toBe('data');
      expect(result.specialist).toBe('data-specialist');
    });

    it('should route GDPR questions to data specialist', () => {
      const result = classifyIntent('How do I handle data protection requests?');
      expect(result.domain).toBe('data');
      expect(result.specialist).toBe('data-specialist');
    });
  });

  describe('classifyIntent - App context routing', () => {
    it('should route to estates when in estates-compliance app', () => {
      const result = classifyIntent(
        'how do I complete this task?',
        'estates-compliance'
      );
      expect(result.domain).toBe('estates');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should route to HR when in HR app', () => {
      const result = classifyIntent(
        'what should I do?',
        'hr'
      );
      expect(result.domain).toBe('hr');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('requiresMultiPerspective', () => {
    it('should return true for decision questions', () => {
      expect(requiresMultiPerspective('Should we switch from SIMS to Arbor?')).toBe(true);
      expect(requiresMultiPerspective('What is the best option for X?')).toBe(true);
      expect(requiresMultiPerspective('Recommend which system to use')).toBe(true);
    });

    it('should return false for factual questions', () => {
      expect(requiresMultiPerspective('What temperature should legionella water be?')).toBe(false);
      expect(requiresMultiPerspective('How do I report RIDDOR?')).toBe(false);
      expect(requiresMultiPerspective('When is the census deadline?')).toBe(false);
    });
  });

  describe('classification metadata', () => {
    it('should include reasoning for classification', () => {
      const result = classifyIntent('What are the RIDDOR requirements?');
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning).toContain('estates');
    });

    it('should indicate when multi-perspective is needed', () => {
      const result = classifyIntent('Should we implement biometric attendance?');
      expect(result.requiresMultiPerspective).toBe(true);
    });
  });
});
