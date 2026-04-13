// apps/platform/src/lib/lesson-studio/grading-pipeline.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildGradingPrompt,
  parseGradingResponse,
  computeTriangulation,
} from './grading-pipeline';

describe('buildGradingPrompt', () => {
  it('includes subject, year group, objective, and OCR text', () => {
    const prompt = buildGradingPrompt({
      ocrText: 'The hart pumps blud around the body',
      subject: 'Science',
      yearGroup: 'Year 6',
      learningObjective: 'Identify parts of the circulatory system',
      successCriteria: ['Name 4 chambers', 'Explain artery vs vein'],
      diffGroup: 'scaffold',
      pupilContext: 'EHCP (SEMH), EAL Stage C',
    });
    expect(prompt).toContain('Science');
    expect(prompt).toContain('Year 6');
    expect(prompt).toContain('The hart pumps blud');
    expect(prompt).toContain('scaffold');
    expect(prompt).toContain('EAL');
  });
});

describe('parseGradingResponse', () => {
  it('parses valid JSON response into GradingResult', () => {
    const raw = JSON.stringify({
      grade: 'WTS',
      score: 3,
      total: 6,
      misconceptions: [
        { description: 'Confuses capillaries with veins', severity: 'significant', curriculum_code: 'Y6-SC-2c' }
      ],
      feedback: 'Good effort identifying the heart and arteries.',
      next_steps: 'Use visual bar models to compare capillaries and veins.',
      confidence: 0.78,
    });
    const result = parseGradingResponse(raw);
    expect(result.grade).toBe('WTS');
    expect(result.score).toBe(3);
    expect(result.total).toBe(6);
    expect(result.misconceptions).toHaveLength(1);
    expect(result.misconceptions[0].severity).toBe('significant');
    expect(result.confidence).toBe(0.78);
  });

  it('handles markdown-wrapped JSON', () => {
    const raw = '```json\n{"grade":"EXS","score":5,"total":6,"misconceptions":[],"feedback":"Well done.","next_steps":"Keep going.","confidence":0.9}\n```';
    const result = parseGradingResponse(raw);
    expect(result.grade).toBe('EXS');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseGradingResponse('not json')).toThrow();
  });

  it('throws on missing required fields', () => {
    expect(() => parseGradingResponse(JSON.stringify({ grade: 'EXS' }))).toThrow();
  });

  it('throws on invalid grade', () => {
    expect(() => parseGradingResponse(JSON.stringify({ grade: 'INVALID', score: 1, total: 1, misconceptions: [], feedback: '', next_steps: '', confidence: 0.5 }))).toThrow();
  });
});

describe('computeTriangulation', () => {
  it('returns aligned when all three agree', () => {
    expect(computeTriangulation('EXS', 'EXS', 'EXS')).toBe('aligned');
  });

  it('returns majority when two of three agree', () => {
    expect(computeTriangulation('EXS', 'EXS', 'WTS')).toBe('majority');
    expect(computeTriangulation('EXS', 'WTS', 'EXS')).toBe('majority');
    expect(computeTriangulation('WTS', 'EXS', 'EXS')).toBe('majority');
  });

  it('returns disputed when all three differ', () => {
    expect(computeTriangulation('GDS', 'EXS', 'WTS')).toBe('disputed');
  });

  it('returns pending when moderator is null', () => {
    expect(computeTriangulation('EXS', 'EXS', null)).toBe('pending');
    expect(computeTriangulation('EXS', 'WTS', null)).toBe('pending');
  });
});
