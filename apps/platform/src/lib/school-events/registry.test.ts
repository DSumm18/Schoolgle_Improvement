import { describe, it, expect } from 'vitest';
import {
  EVENT_TYPES,
  CATEGORY_COLORS,
  SEVERITY_COLORS,
  SOURCE_LABELS,
  isValidEventType,
  getEventType,
  type SchoolEventCategory,
  type SchoolEventSeverity,
  type SchoolEventSource,
} from './registry';

describe('School Events Registry', () => {

  describe('EVENT_TYPES', () => {
    it('contains all required Trust Assessor event types', () => {
      expect(EVENT_TYPES['ta.forensic-finding']).toBeDefined();
      expect(EVENT_TYPES['ta.national-percentile']).toBeDefined();
      expect(EVENT_TYPES['ta.predictive-accuracy-gap']).toBeDefined();
      expect(EVENT_TYPES['ta.research-kpi-failed']).toBeDefined();
      expect(EVENT_TYPES['ta.cohort-mismatch']).toBeDefined();
      expect(EVENT_TYPES['ta.statistical-alert']).toBeDefined();
      expect(EVENT_TYPES['ta.eal-trajectory-concern']).toBeDefined();
      expect(EVENT_TYPES['ta.demographic-expectation-breach']).toBeDefined();
    });

    it('contains Ofsted Readiness stubs', () => {
      expect(EVENT_TYPES['ofsted.action-created']).toBeDefined();
      expect(EVENT_TYPES['ofsted.action-status-changed']).toBeDefined();
      expect(EVENT_TYPES['ofsted.framework-rating-updated']).toBeDefined();
      expect(EVENT_TYPES['ofsted.evidence-added']).toBeDefined();
    });

    it('contains Lesson Studio stubs', () => {
      expect(EVENT_TYPES['lesson.observation-completed']).toBeDefined();
      expect(EVENT_TYPES['lesson.intervention-launched']).toBeDefined();
      expect(EVENT_TYPES['lesson.quest-completed']).toBeDefined();
    });

    it('contains system events', () => {
      expect(EVENT_TYPES['dfe.ofsted-inspection-published']).toBeDefined();
      expect(EVENT_TYPES['staff.leadership-change']).toBeDefined();
    });

    it('every event type has required fields', () => {
      for (const [key, def] of Object.entries(EVENT_TYPES)) {
        expect(def.id, `${key}.id`).toBe(key);
        expect(def.label, `${key}.label`).toBeTruthy();
        expect(def.description, `${key}.description`).toBeTruthy();
        expect(def.category, `${key}.category`).toBeTruthy();
        expect(def.defaultSeverity, `${key}.defaultSeverity`).toBeTruthy();
        expect(def.icon, `${key}.icon`).toBeTruthy();
      }
    });

    it('every event category is a valid CATEGORY_COLORS key', () => {
      const validCategories = Object.keys(CATEGORY_COLORS);
      for (const [key, def] of Object.entries(EVENT_TYPES)) {
        expect(validCategories, `${key}.category valid`).toContain(def.category);
      }
    });

    it('every event defaultSeverity is a valid SEVERITY_COLORS key', () => {
      const validSeverities = Object.keys(SEVERITY_COLORS);
      for (const [key, def] of Object.entries(EVENT_TYPES)) {
        expect(validSeverities, `${key}.defaultSeverity valid`).toContain(def.defaultSeverity);
      }
    });
  });

  describe('CATEGORY_COLORS', () => {
    const expectedCategories: SchoolEventCategory[] = [
      'leadership', 'curriculum', 'pupil_support', 'safeguarding',
      'finance', 'intervention', 'assessment', 'data_quality',
      'staffing', 'governance',
    ];

    it('has all 10 categories', () => {
      for (const cat of expectedCategories) {
        expect(CATEGORY_COLORS[cat], `category ${cat}`).toBeDefined();
      }
    });

    it('each category has bg, text, border, dot', () => {
      for (const [cat, colors] of Object.entries(CATEGORY_COLORS)) {
        expect(colors.bg, `${cat}.bg`).toBeTruthy();
        expect(colors.text, `${cat}.text`).toBeTruthy();
        expect(colors.border, `${cat}.border`).toBeTruthy();
        expect(colors.dot, `${cat}.dot`).toBeTruthy();
      }
    });

    it('uses Tailwind semantic classes, not raw hex', () => {
      for (const [cat, colors] of Object.entries(CATEGORY_COLORS)) {
        expect(colors.bg, `${cat}.bg no hex`).not.toMatch(/#[0-9a-fA-F]/);
        expect(colors.text, `${cat}.text no hex`).not.toMatch(/#[0-9a-fA-F]/);
      }
    });
  });

  describe('SEVERITY_COLORS', () => {
    const expectedSeverities: SchoolEventSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];

    it('has all 5 severities', () => {
      for (const sev of expectedSeverities) {
        expect(SEVERITY_COLORS[sev], `severity ${sev}`).toBeDefined();
      }
    });

    it('each severity has label', () => {
      for (const [sev, colors] of Object.entries(SEVERITY_COLORS)) {
        expect(colors.label, `${sev}.label`).toBeTruthy();
      }
    });
  });

  describe('SOURCE_LABELS', () => {
    const expectedSources: SchoolEventSource[] = [
      'trust-assessor', 'ofsted-readiness', 'lesson-studio',
      'school-intelligence', 'governance', 'system', 'manual',
    ];

    it('has human-readable labels for all 7 sources', () => {
      for (const src of expectedSources) {
        expect(SOURCE_LABELS[src], `source ${src}`).toBeTruthy();
      }
    });
  });

  describe('isValidEventType', () => {
    it('returns true for known types', () => {
      expect(isValidEventType('ta.forensic-finding')).toBe(true);
      expect(isValidEventType('lesson.quest-completed')).toBe(true);
    });

    it('returns false for unknown types', () => {
      expect(isValidEventType('unknown.type')).toBe(false);
      expect(isValidEventType('')).toBe(false);
    });
  });

  describe('getEventType', () => {
    it('returns definition for known type', () => {
      const def = getEventType('ta.forensic-finding');
      expect(def).not.toBeNull();
      expect(def?.id).toBe('ta.forensic-finding');
    });

    it('returns null for unknown type', () => {
      expect(getEventType('nonexistent')).toBeNull();
    });
  });

});
