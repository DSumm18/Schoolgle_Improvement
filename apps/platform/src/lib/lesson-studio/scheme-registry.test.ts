import { describe, it, expect } from 'vitest';
import {
  getAvailableSchemes,
  getSchemeProgression,
  getAllSchemes,
} from './scheme-registry';

describe('scheme-registry', () => {
  it('lists available schemes for Maths and includes white-rose-maths', () => {
    const schemes = getAvailableSchemes('Maths');
    const ids = schemes.map((s) => s.id);
    expect(ids).toContain('white-rose-maths');
  });

  it('returns progression for White Rose Year 6 Autumn with correct shape', () => {
    const units = getSchemeProgression('white-rose-maths', 'Y6', 'Autumn');
    expect(units.length).toBeGreaterThan(0);
    const first = units[0];
    expect(first).toHaveProperty('unitName');
    expect(first).toHaveProperty('weekRange');
    expect(first).toHaveProperty('ncCodes');
    expect(first).toHaveProperty('keyTopics');
    expect(first).toHaveProperty('suggestedHours');
    expect(Array.isArray(first.ncCodes)).toBe(true);
    expect(Array.isArray(first.keyTopics)).toBe(true);
  });

  it('returns empty array for unknown subject', () => {
    const schemes = getAvailableSchemes('UnknownSubjectXYZ');
    // Only 'custom' should remain since it is "Any subject"
    const nonCustom = schemes.filter((s) => s.id !== 'custom');
    expect(nonCustom.length).toBe(0);
  });

  it('getAllSchemes returns all 8 schemes', () => {
    const all = getAllSchemes();
    expect(all.length).toBe(8);
  });

  it('White Rose Y6 Spring has 6 units', () => {
    const units = getSchemeProgression('white-rose-maths', 'Y6', 'Spring');
    expect(units.length).toBe(6);
  });

  it('White Rose Y6 Summer has 3 units', () => {
    const units = getSchemeProgression('white-rose-maths', 'Y6', 'Summer');
    expect(units.length).toBe(3);
  });
});
