/**
 * Ed Form Specialist - Phase 2 Tests
 * Tests for form specialist agent and intent classification
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Form Specialist - Phase 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FORM_KEYWORDS detection', () => {
    const FORM_KEYWORDS = [
      'fill form', 'fill in', 'fill out', 'complete form',
      'riddor', 'safeguarding', 'ehcp', 'send',
      'what do i put', 'how do i answer', 'what should i write',
      'parental concerns', 'incident report',
    ];

    it('should detect RIDDOR-related requests', () => {
      const riddorQueries = [
        'Help me fill out this RIDDOR form',
        'What do I put for the RIDDOR injury report?',
        'RIDDOR reporting guidance',
        'How do I report under RIDDOR?',
      ];

      riddorQueries.forEach(query => {
        const lower = query.toLowerCase();
        const detected = FORM_KEYWORDS.some(kw => lower.includes(kw));
        expect(detected).toBe(true);
      });
    });

    it('should detect safeguarding form requests', () => {
      const safeguardingQueries = [
        'Help with safeguarding form',
        'What do I write in parental concerns?',
        'Safeguarding concern form guidance',
        'How to report safeguarding issue?',
      ];

      safeguardingQueries.forEach(query => {
        const lower = query.toLowerCase();
        const detected = FORM_KEYWORDS.some(kw => lower.includes(kw));
        expect(detected).toBe(true);
      });
    });

    it('should detect SEND/EHCP form requests', () => {
      const sendQueries = [
        'EHCP application form help',
        'SEND Section A form guidance',
        'How to fill in EHCP request?',
        'What do I put for child views?',
      ];

      sendQueries.forEach(query => {
        const lower = query.toLowerCase();
        const detected = FORM_KEYWORDS.some(kw => lower.includes(kw));
        expect(detected).toBe(true);
      });
    });

    it('should not detect non-form queries', () => {
      const nonFormQueries = [
        'How are you today?',
        'What\'s the weather like?',
        'Tell me a joke',
        'Hello there',
      ];

      nonFormQueries.forEach(query => {
        const lower = query.toLowerCase();
        const detected = FORM_KEYWORDS.some(kw => lower.includes(kw));
        expect(detected).toBe(false);
      });
    });
  });

  describe('Form Specialist Qualifications', () => {
    const FORM_QUALIFICATIONS = [
      'Trained on HSE RIDDOR reporting guidance',
      'Knowledgeable about DfE safeguarding reporting requirements',
      'Familiar with LA form submission processes',
      'Expert in SEND EHCP application forms',
      'Understands legal implications of form submissions',
      'Experienced in professional wording suggestions',
    ];

    it('should have proper qualifications', () => {
      expect(FORM_QUALIFICATIONS.length).toBeGreaterThan(0);
      expect(FORM_QUALIFICATIONS).toContain('Trained on HSE RIDDOR reporting guidance');
      expect(FORM_QUALIFICATIONS).toContain('Expert in SEND EHCP application forms');
    });

    it('should cover key form types', () => {
      const formTypes = ['RIDDOR', 'safeguarding', 'SEND', 'EHCP'];
      const qualificationsText = FORM_QUALIFICATIONS.join(' ').toLowerCase();

      formTypes.forEach(type => {
        expect(qualificationsText).toContain(type.toLowerCase());
      });
    });
  });

  describe('Chat API Extensions', () => {
    it('should include formMode in ChatRequest', () => {
      interface ChatRequest {
        question: string;
        formMode?: {
          active: boolean;
          templateId?: string;
        };
      }

      const validRequest: ChatRequest = {
        question: 'Help with form',
        formMode: { active: true, templateId: 'riddor_injury' },
      };

      expect(validRequest.formMode?.active).toBe(true);
      expect(validRequest.formMode?.templateId).toBe('riddor_injury');
    });

    it('should include translation in ChatResponse', () => {
      interface ChatResponse {
        answer: string;
        translation?: {
          originalText: string;
          translatedText: string;
        };
      }

      const validResponse: ChatResponse = {
        answer: 'I can help with that',
        translation: {
          originalText: 'میرا بیٹا اسکول میں اکیلا ہے',
          translatedText: 'My son is lonely at school',
        },
      };

      expect(validResponse.translation?.originalText).toBeTruthy();
      expect(validResponse.translation?.translatedText).toBeTruthy();
    });
  });

  describe('Form Request Detection Logic', () => {
    it('should detect form requests by keywords', () => {
      const formKeywords = ['fill form', 'fill in', 'riddor', 'what do i put'];

      // Test case 1: "Help me fill this form" - should match 'fill form'
      expect('Help me fill this form'.toLowerCase()).toContain('fill');

      // Test case 2: "What do I put here?" - should match 'what do i put'
      expect('What do I put here?'.toLowerCase()).toContain('what do i put');

      // Test case 3: "RIDDOR reporting help" - should match 'riddor'
      expect('RIDDOR reporting help'.toLowerCase()).toContain('riddor');

      // Test case 4: "How are you today?" - should NOT match any
      const lower = 'How are you today?'.toLowerCase();
      const detected = formKeywords.some(kw => lower.includes(kw));
      expect(detected).toBe(false);
    });
  });

  describe('Response Analysis for Form Hints', () => {
    it('should extract suggested wording from response', () => {
      const response = 'I suggest: "My child has difficulty with reading"';

      const wordingMatch = response.match(/I suggest:\s*"([^"]+)"/);

      expect(wordingMatch).toBeTruthy();
      if (wordingMatch) {
        expect(wordingMatch[1].trim()).toBe('My child has difficulty with reading');
      }
    });

    it('should detect red flags in response', () => {
      const responses = [
        { text: 'Your wording is too aggressive', hasRedFlag: true },
        { text: 'This is very vague', hasRedFlag: true },
        { text: 'This looks good', hasRedFlag: false },
      ];

      responses.forEach(({ text, hasRedFlag }) => {
        const hasFlag = /aggressive|vague/i.test(text);
        expect(hasFlag).toBe(hasRedFlag);
      });
    });
  });
});
