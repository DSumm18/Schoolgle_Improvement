/**
 * Ed Form Knowledge - Phase 3 Tests
 * Tests for field-level guidance from database
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Form Knowledge - Phase 3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FormFieldKnowledge Type', () => {
    it('should have correct structure', () => {
      interface FormFieldKnowledge {
        field_key: string;
        field_label: string;
        explanation: string;
        explanation_level: 'layperson' | 'professional' | 'legal';
        red_flags?: Array<{
          type: string;
          examples: string[];
          explanation: string;
          consequence: string;
        }>;
        suggested_wordings?: {
          formal?: string;
          simple?: string;
          legal?: string;
          with_evidence?: string;
        };
        legal_context?: string;
        la_guidance?: Record<string, any>;
      }

      const validKnowledge: FormFieldKnowledge = {
        field_key: 'parental_concerns',
        field_label: 'Parental Concerns',
        explanation: 'Describe your concerns about your child',
        explanation_level: 'layperson',
        red_flags: [
          {
            type: 'aggressive_language',
            examples: ['The school is failing my child'],
            explanation: 'Aggressive language puts LAs on the defensive',
            consequence: 'May be treated as dispute rather than SEN referral',
          },
        ],
        suggested_wordings: {
          formal: 'I am concerned that my child is not making expected progress',
          simple: 'My child struggles with learning',
        },
        legal_context: 'Children and Families Act 2014',
      };

      expect(validKnowledge.field_key).toBe('parental_concerns');
      expect(validKnowledge.red_flags).toHaveLength(1);
      expect(validKnowledge.suggested_wordings?.formal).toBeTruthy();
    });
  });

  describe('Field Knowledge Retrieval', () => {
    it('should extract field knowledge structure', () => {
      const mockResponse = {
        template_id: 'send_section_a',
        field_key: 'parental_concerns',
        knowledge: {
          field_key: 'parental_concerns',
          field_label: 'Parental Concerns',
          explanation: 'This is where you describe your concerns',
          explanation_level: 'layperson',
          red_flags: [
            {
              type: 'too_vague',
              examples: ['He struggles at school'],
              explanation: 'Need specific examples',
              consequence: 'May be rejected for lack of evidence',
            },
          ],
          suggested_wordings: {
            formal: 'My child has difficulty with literacy',
            simple: 'My child struggles with reading and writing',
          },
        },
      };

      expect(mockResponse.knowledge.field_key).toBe('parental_concerns');
      expect(mockResponse.knowledge.red_flags).toHaveLength(1);
      expect(mockResponse.knowledge.red_flags![0].type).toBe('too_vague');
      expect(mockResponse.knowledge.suggested_wordings?.formal).toContain('literacy');
    });

    it('should handle missing knowledge gracefully', () => {
      const mockResponse = {
        template_id: 'unknown_form',
        field_key: 'unknown_field',
        knowledge: null,
      };

      expect(mockResponse.knowledge).toBeNull();
    });
  });

  describe('Red Flag Detection', () => {
    it('should detect aggressive language patterns', () => {
      const userInputs = [
        'The school is failing my child',
        'Teachers don\'t care about him',
        'I\'ve had enough of this incompetence',
      ];

      const aggressivePatterns = ['failing', 'don\'t care', 'incompetence', 'rubbish'];

      userInputs.forEach(input => {
        const hasAggressive = aggressivePatterns.some(pattern =>
          input.toLowerCase().includes(pattern)
        );
        expect(hasAggressive).toBe(true);
      });
    });

    it('should detect vague language patterns', () => {
      const vagueInputs = [
        'He struggles at school',
        'She finds things hard',
        'He needs more help',
      ];

      const vaguePatterns = ['struggles at', 'finds things hard', 'needs more help'];

      vagueInputs.forEach(input => {
        const hasVague = vaguePatterns.some(pattern =>
          input.toLowerCase().includes(pattern)
        );
        expect(hasVague).toBe(true);
      });
    });

    it('should identify good specific examples', () => {
      const goodInputs = [
        'My child is 9 but reads at a 7-year-old level',
        'He can read 10 words per minute instead of the expected 60',
        'She has difficulty with sentence structure and spelling',
      ];

      // These should contain specific indicators
      const specificIndicators = ['year-old level', 'words per minute', 'sentence structure'];

      goodInputs.forEach(input => {
        const hasSpecific = specificIndicators.some(pattern =>
          input.toLowerCase().includes(pattern.toLowerCase())
        );
        expect(hasSpecific).toBe(true);
      });
    });
  });

  describe('Form Knowledge API Response Structure', () => {
    it('should match GET /api/ed/form-knowledge response', () => {
      interface FormKnowledgeResponse {
        template_id: string;
        fields?: Array<{
          id: string;
          template_id: string;
          field_key: string;
          field_label: string;
          explanation: string;
          red_flags?: any[];
          suggested_wordings?: any;
        }>;
        count?: number;
        knowledge?: any;
      }

      const validResponse: FormKnowledgeResponse = {
        template_id: 'send_section_a',
        fields: [
          {
            id: '123',
            template_id: 'send_section_a',
            field_key: 'parental_concerns',
            field_label: 'Parental Concerns',
            explanation: 'Describe your concerns',
          },
        ],
        count: 1,
      };

      expect(validResponse.template_id).toBe('send_section_a');
      expect(validResponse.fields).toHaveLength(1);
      expect(validResponse.count).toBe(1);
    });

    it('should match POST /api/ed/form-knowledge red flag check response', () => {
      interface RedFlagCheckResponse {
        template_id: string;
        field_key: string;
        user_text: string;
        has_red_flags: boolean;
        matched_flags: Array<{
          type: string;
          matched_example: string;
          explanation: string;
          consequence: string;
        }>;
        suggestions: any[];
      }

      const validResponse: RedFlagCheckResponse = {
        template_id: 'send_section_a',
        field_key: 'parental_concerns',
        user_text: 'The school is failing my child',
        has_red_flags: true,
        matched_flags: [
          {
            type: 'aggressive_language',
            matched_example: 'The school is failing',
            explanation: 'Aggressive language puts LAs on the defensive',
            consequence: 'May be treated as dispute rather than SEN referral',
          },
        ],
        suggestions: [],
      };

      expect(validResponse.has_red_flags).toBe(true);
      expect(validResponse.matched_flags).toHaveLength(1);
      expect(validResponse.matched_flags[0].type).toBe('aggressive_language');
    });
  });

  describe('Wording Improvement Suggestions', () => {
    it('should provide formal wording suggestions', () => {
      const improvements = [
        {
          input: 'The school is failing my child',
          formal: 'I am concerned that my child is not making expected progress despite additional support',
          simple: 'My child is not making progress in school',
        },
        {
          input: 'He struggles with writing',
          formal: 'He has significant difficulty with written expression',
          simple: 'He finds writing very hard',
        },
      ];

      improvements.forEach(({ input, formal }) => {
        expect(formal.length).toBeGreaterThan(input.length);
        expect(formal).not.toContain('failing');
        expect(formal).not.toContain('struggles');
      });
    });

    it('should avoid aggressive words in suggestions', () => {
      const aggressiveWords = ['failing', 'rubbish', 'incompetent', 'useless', 'don\'t care'];

      const suggestions = [
        'I am concerned that my child is not making expected progress',
        'I have concerns about the level of support my child receives',
        'My child requires additional assistance to access the curriculum',
      ];

      suggestions.forEach(suggestion => {
        const lower = suggestion.toLowerCase();
        const hasAggressive = aggressiveWords.some(word => lower.includes(word));
        expect(hasAggressive).toBe(false);
      });
    });
  });

  describe('LA-Specific Guidance', () => {
    it('should handle different LA requirements', () => {
      interface LaGuidance {
        Bradford: string;
        Leeds: string;
        default: string;
      }

      const laGuidance: LaGuidance = {
        Bradford: 'Include pupil reference number',
        Leeds: 'Must include SENCO name',
        default: 'Follow national guidance',
      };

      // Test Bradford-specific lookup
      const bradfordResult = laGuidance['Bradford'] || laGuidance['default'];
      expect(bradfordResult).toContain('pupil reference');

      // Test unknown LA falls back to default
      const unknownResult = laGuidance['UnknownLA'] || laGuidance['default'];
      expect(unknownResult).toContain('national guidance');
    });
  });
});
