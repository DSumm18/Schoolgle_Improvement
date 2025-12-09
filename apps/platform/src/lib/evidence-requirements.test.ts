import { describe, it, expect } from 'vitest';
import {
  EVIDENCE_REQUIREMENTS,
  type EvidenceRequirement,
  type AreaRequirements,
} from './evidence-requirements';

describe('Evidence Requirements', () => {
  describe('Data Structure Validation', () => {
    it('should have evidence requirements defined', () => {
      expect(EVIDENCE_REQUIREMENTS).toBeDefined();
      expect(typeof EVIDENCE_REQUIREMENTS).toBe('object');
      expect(Object.keys(EVIDENCE_REQUIREMENTS).length).toBeGreaterThan(0);
    });

    it('should have all required areas', () => {
      const expectedAreas = [
        'behaviour',
        'quality-implementation',
        'quality-intent',
        'quality-impact',
      ];

      expectedAreas.forEach((area) => {
        expect(EVIDENCE_REQUIREMENTS).toHaveProperty(area);
      });
    });

    it('should have valid structure for each area', () => {
      Object.values(EVIDENCE_REQUIREMENTS).forEach((area: AreaRequirements) => {
        expect(area).toHaveProperty('id');
        expect(area).toHaveProperty('name');
        expect(area).toHaveProperty('requirements');
        expect(area).toHaveProperty('suggestedImprovements');

        expect(typeof area.id).toBe('string');
        expect(typeof area.name).toBe('string');
        expect(Array.isArray(area.requirements)).toBe(true);
        expect(Array.isArray(area.suggestedImprovements)).toBe(true);
      });
    });

    it('should have valid requirement structure', () => {
      Object.values(EVIDENCE_REQUIREMENTS).forEach((area: AreaRequirements) => {
        area.requirements.forEach((req: EvidenceRequirement) => {
          expect(req).toHaveProperty('keyword');
          expect(req).toHaveProperty('description');
          expect(req).toHaveProperty('importance');

          expect(typeof req.keyword).toBe('string');
          expect(typeof req.description).toBe('string');
          expect(['critical', 'important', 'recommended']).toContain(req.importance);

          if (req.eefLink) {
            expect(typeof req.eefLink).toBe('string');
          }
        });
      });
    });
  });

  describe('Behaviour and Attitudes Requirements', () => {
    const behaviour = EVIDENCE_REQUIREMENTS['behaviour'];

    it('should have correct area ID and name', () => {
      expect(behaviour.id).toBe('behaviour');
      expect(behaviour.name).toBe('Behaviour and Attitudes');
    });

    it('should have requirements array', () => {
      expect(behaviour.requirements.length).toBeGreaterThan(0);
    });

    it('should have critical attendance requirements', () => {
      const criticalReqs = behaviour.requirements.filter((r) => r.importance === 'critical');
      expect(criticalReqs.length).toBeGreaterThan(0);

      const attendanceReq = criticalReqs.find((r) => r.keyword === 'attendance');
      expect(attendanceReq).toBeDefined();
      expect(attendanceReq?.description).toContain('attendance');
    });

    it('should have attendance target requirement', () => {
      const targetReq = behaviour.requirements.find((r) => r.keyword === 'target');
      expect(targetReq).toBeDefined();
      expect(targetReq?.importance).toBe('critical');
    });

    it('should have persistent absence requirement', () => {
      const absenceReq = behaviour.requirements.find((r) => r.keyword === 'persistent absence');
      expect(absenceReq).toBeDefined();
      expect(absenceReq?.importance).toBe('critical');
    });

    it('should have parent engagement with EEF link', () => {
      const parentReq = behaviour.requirements.find((r) => r.keyword === 'parent');
      expect(parentReq).toBeDefined();
      expect(parentReq?.eefLink).toBeDefined();
      expect(parentReq?.eefLink).toContain('Parental engagement');
    });

    it('should have suggested improvements', () => {
      expect(behaviour.suggestedImprovements.length).toBeGreaterThan(0);
      expect(behaviour.suggestedImprovements[0]).toContain('attendance');
    });
  });

  describe('Quality of Education - Implementation', () => {
    const implementation = EVIDENCE_REQUIREMENTS['quality-implementation'];

    it('should have correct area details', () => {
      expect(implementation.id).toBe('quality-implementation');
      expect(implementation.name).toBe('Quality of Education - Implementation');
    });

    it('should have critical curriculum requirements', () => {
      const curriculumReq = implementation.requirements.find((r) => r.keyword === 'curriculum');
      expect(curriculumReq).toBeDefined();
      expect(curriculumReq?.importance).toBe('critical');
    });

    it('should have feedback requirement with EEF evidence', () => {
      const feedbackReq = implementation.requirements.find((r) => r.keyword === 'feedback');
      expect(feedbackReq).toBeDefined();
      expect(feedbackReq?.eefLink).toBeDefined();
      expect(feedbackReq?.eefLink).toContain('Feedback');
      expect(feedbackReq?.eefLink).toContain('+6 months');
    });

    it('should have assessment requirement with EEF link', () => {
      const assessmentReq = implementation.requirements.find((r) => r.keyword === 'assessment');
      expect(assessmentReq).toBeDefined();
      expect(assessmentReq?.importance).toBe('critical');
      expect(assessmentReq?.eefLink).toBeDefined();
    });

    it('should have SEND support requirement', () => {
      const sendReq = implementation.requirements.find((r) => r.keyword === 'send');
      expect(sendReq).toBeDefined();
      expect(sendReq?.importance).toBe('important');
    });

    it('should include CPD requirement', () => {
      const cpdReq = implementation.requirements.find((r) => r.keyword === 'cpd');
      expect(cpdReq).toBeDefined();
    });
  });

  describe('Quality of Education - Intent', () => {
    const intent = EVIDENCE_REQUIREMENTS['quality-intent'];

    it('should have ambitious curriculum as critical', () => {
      const ambitiousReq = intent.requirements.find((r) => r.keyword === 'ambitious');
      expect(ambitiousReq).toBeDefined();
      expect(ambitiousReq?.importance).toBe('critical');
    });

    it('should require National Curriculum coverage', () => {
      const ncReq = intent.requirements.find((r) => r.keyword === 'national curriculum');
      expect(ncReq).toBeDefined();
      expect(ncReq?.importance).toBe('critical');
    });

    it('should have progression requirement', () => {
      const progressionReq = intent.requirements.find((r) => r.keyword === 'progression');
      expect(progressionReq).toBeDefined();
      expect(progressionReq?.importance).toBe('critical');
    });

    it('should include cultural capital requirement', () => {
      const culturalReq = intent.requirements.find((r) => r.keyword === 'cultural capital');
      expect(culturalReq).toBeDefined();
      expect(culturalReq?.importance).toBe('important');
    });

    it('should have vocabulary requirement', () => {
      const vocabReq = intent.requirements.find((r) => r.keyword === 'vocabulary');
      expect(vocabReq).toBeDefined();
    });
  });

  describe('Quality of Education - Impact', () => {
    const impact = EVIDENCE_REQUIREMENTS['quality-impact'];

    it('should have critical outcomes requirements', () => {
      const criticalReqs = impact.requirements.filter((r) => r.importance === 'critical');
      expect(criticalReqs.length).toBeGreaterThanOrEqual(3);
    });

    it('should require outcomes data', () => {
      const outcomesReq = impact.requirements.find((r) => r.keyword === 'outcomes');
      expect(outcomesReq).toBeDefined();
      expect(outcomesReq?.importance).toBe('critical');
    });

    it('should require progress measures', () => {
      const progressReq = impact.requirements.find((r) => r.keyword === 'progress');
      expect(progressReq).toBeDefined();
      expect(progressReq?.importance).toBe('critical');
    });

    it('should require reading outcomes', () => {
      const readingReq = impact.requirements.find((r) => r.keyword === 'reading');
      expect(readingReq).toBeDefined();
      expect(readingReq?.importance).toBe('critical');
    });

    it('should require phonics results', () => {
      const phonicsReq = impact.requirements.find((r) => r.keyword === 'phonics');
      expect(phonicsReq).toBeDefined();
      expect(phonicsReq?.importance).toBe('critical');
    });

    it('should track disadvantaged outcomes', () => {
      const disadvantagedReq = impact.requirements.find((r) => r.keyword === 'disadvantaged');
      expect(disadvantagedReq).toBeDefined();
    });
  });

  describe('Importance Levels', () => {
    it('should have critical requirements in all areas', () => {
      Object.values(EVIDENCE_REQUIREMENTS).forEach((area) => {
        const critical = area.requirements.filter((r) => r.importance === 'critical');
        expect(critical.length).toBeGreaterThan(0);
      });
    });

    it('should have mix of importance levels', () => {
      Object.values(EVIDENCE_REQUIREMENTS).forEach((area) => {
        const importanceLevels = new Set(area.requirements.map((r) => r.importance));
        expect(importanceLevels.size).toBeGreaterThan(1); // Should have variety
      });
    });

    it('should prioritize critical over important over recommended', () => {
      const area = EVIDENCE_REQUIREMENTS['behaviour'];
      const critical = area.requirements.filter((r) => r.importance === 'critical').length;
      const important = area.requirements.filter((r) => r.importance === 'important').length;

      // Should have a balanced mix, but critical items should exist
      expect(critical).toBeGreaterThan(0);
      expect(important).toBeGreaterThan(0);
    });
  });

  describe('EEF Links', () => {
    it('should have EEF links for evidence-based strategies', () => {
      let eefLinkCount = 0;

      Object.values(EVIDENCE_REQUIREMENTS).forEach((area) => {
        area.requirements.forEach((req) => {
          if (req.eefLink) {
            eefLinkCount++;
          }
        });
      });

      expect(eefLinkCount).toBeGreaterThan(0);
    });

    it('should have EEF link for feedback strategy', () => {
      const implementation = EVIDENCE_REQUIREMENTS['quality-implementation'];
      const feedbackReq = implementation.requirements.find((r) => r.keyword === 'feedback');

      expect(feedbackReq?.eefLink).toBeDefined();
      expect(feedbackReq?.eefLink).toContain('+6 months');
    });

    it('should have EEF link for parental engagement', () => {
      const behaviour = EVIDENCE_REQUIREMENTS['behaviour'];
      const parentReq = behaviour.requirements.find((r) => r.keyword === 'parent');

      expect(parentReq?.eefLink).toBeDefined();
      expect(parentReq?.eefLink).toContain('+4 months');
    });
  });

  describe('Suggested Improvements', () => {
    it('should have suggestions for all areas', () => {
      Object.values(EVIDENCE_REQUIREMENTS).forEach((area) => {
        expect(area.suggestedImprovements.length).toBeGreaterThan(0);
      });
    });

    it('should have actionable suggestions', () => {
      const behaviour = EVIDENCE_REQUIREMENTS['behaviour'];

      behaviour.suggestedImprovements.forEach((suggestion) => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(10); // Should be meaningful
      });
    });

    it('should reference EEF evidence in suggestions where applicable', () => {
      const implementation = EVIDENCE_REQUIREMENTS['quality-implementation'];
      const hasEefReference = implementation.suggestedImprovements.some((s) =>
        s.includes('EEF')
      );

      expect(hasEefReference).toBe(true);
    });

    it('should provide specific improvement guidance', () => {
      const behaviour = EVIDENCE_REQUIREMENTS['behaviour'];
      const targetSuggestion = behaviour.suggestedImprovements.find((s) =>
        s.includes('attendance target')
      );

      expect(targetSuggestion).toBeDefined();
      expect(targetSuggestion).toContain('96%'); // Specific target mentioned
    });
  });

  describe('Keyword Coverage', () => {
    it('should have unique keywords within each area', () => {
      Object.values(EVIDENCE_REQUIREMENTS).forEach((area) => {
        const keywords = area.requirements.map((r) => r.keyword);
        const uniqueKeywords = new Set(keywords);

        expect(uniqueKeywords.size).toBe(keywords.length);
      });
    });

    it('should have descriptive keywords', () => {
      Object.values(EVIDENCE_REQUIREMENTS).forEach((area) => {
        area.requirements.forEach((req) => {
          expect(req.keyword.length).toBeGreaterThan(0);
          expect(req.keyword).not.toBe('');
        });
      });
    });

    it('should have matching descriptions for keywords', () => {
      Object.values(EVIDENCE_REQUIREMENTS).forEach((area) => {
        area.requirements.forEach((req) => {
          expect(req.description.length).toBeGreaterThan(req.keyword.length);
        });
      });
    });
  });
});
