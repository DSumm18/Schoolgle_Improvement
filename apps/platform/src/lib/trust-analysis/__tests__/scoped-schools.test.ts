import { describe, it, expect } from 'vitest';
import { buildAbbrevLookup, resolveSchoolByName, abbreviateSchoolName } from '../scoped-schools';

describe('scoped-schools helpers', () => {
  const scoped = [
    { id: 'o1', name: 'Grove House Primary School', urn: 148201 },
    { id: 'o2', name: 'Clayton Village Primary School', urn: 148869 },
    { id: 'o3', name: 'Lidget Green Primary School', urn: 150016 },
    { id: 'o4', name: "Rawdon St Peter's CE Primary School", urn: 107903 },
  ];

  it('abbreviateSchoolName takes first letter of each significant word', () => {
    expect(abbreviateSchoolName('Grove House Primary School')).toBe('GHPS');
    expect(abbreviateSchoolName('Clayton Village Primary School')).toBe('CVPS');
    expect(abbreviateSchoolName('Lidget Green Primary School')).toBe('LGPS');
  });

  it('abbreviateSchoolName ignores CE / of / the / apostrophes', () => {
    expect(abbreviateSchoolName("Rawdon St Peter's CE Primary School")).toBe('RSPPS');
    expect(abbreviateSchoolName('St Mary of the Angels')).toBe('SMA');
  });

  it('buildAbbrevLookup returns abbrev -> {name, urn, id}', () => {
    const lookup = buildAbbrevLookup(scoped);
    expect(lookup.GHPS).toEqual({ id: 'o1', name: 'Grove House Primary School', urn: 148201 });
    expect(lookup.CVPS).toEqual({ id: 'o2', name: 'Clayton Village Primary School', urn: 148869 });
  });

  it('buildAbbrevLookup disambiguates duplicate abbrevs with a numeric suffix', () => {
    const dup = [
      { id: 'a', name: 'Park Primary School', urn: 1 },
      { id: 'b', name: 'Park Primary School', urn: 2 },
    ];
    const lookup = buildAbbrevLookup(dup);
    expect(Object.keys(lookup).sort()).toEqual(['PPS', 'PPS2']);
  });

  it('resolveSchoolByName fuzzy-matches against filename fragments', () => {
    expect(resolveSchoolByName('GHPS_DATA_SUMMARY_2024.xlsx', scoped)).toEqual(
      expect.objectContaining({ name: 'Grove House Primary School' }),
    );
    expect(resolveSchoolByName('Grove House data.xlsx', scoped)).toEqual(
      expect.objectContaining({ name: 'Grove House Primary School' }),
    );
    expect(resolveSchoolByName('no match.xlsx', scoped)).toBeNull();
  });

  it('resolveSchoolByName is case-insensitive', () => {
    expect(resolveSchoolByName('grove house.xlsx', scoped)?.urn).toBe(148201);
    expect(resolveSchoolByName('CLAYTON village.xlsx', scoped)?.urn).toBe(148869);
  });

  it('resolveSchoolByName does not match abbrev as substring of a longer token', () => {
    const schools = [{ id: 'x', name: 'Grove House Primary School', urn: 1 }];
    // "GHPSA" contains "GHPS" but no boundary after — must NOT match
    expect(resolveSchoolByName('GHPSA_other.xlsx', schools)).toBeNull();
    // "NOT_GHPS_LIKE.xlsx" — abbrev surrounded by _ on both sides = valid boundary
    expect(resolveSchoolByName('NOT_GHPS_LIKE.xlsx', schools)).toEqual(
      expect.objectContaining({ urn: 1 }),
    );
  });

  it('buildAbbrevLookup skips schools with empty abbrev (all ignore-words)', () => {
    const lookup = buildAbbrevLookup([
      { id: 'a', name: 'The Of And', urn: 1 },
      { id: 'b', name: 'Grove House Primary School', urn: 2 },
    ]);
    expect(lookup.GHPS).toBeDefined();
    expect(Object.keys(lookup)).toHaveLength(1);
  });

  it('handles empty schools array gracefully', () => {
    expect(buildAbbrevLookup([])).toEqual({});
    expect(resolveSchoolByName('anything.xlsx', [])).toBeNull();
  });
});
