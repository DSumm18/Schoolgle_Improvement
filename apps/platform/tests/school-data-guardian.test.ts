import { describe, it, expect } from 'vitest';
import { SchoolDataGuardian } from '../src/lib/school-data-guardian';

describe('SchoolDataGuardian — unified privacy shield', () => {
  describe('scrub() — core behaviour', () => {
    it('passes clean text through untouched', () => {
      const input = 'The lesson today covered the circulatory system.';
      const result = SchoolDataGuardian.scrub(input);
      expect(result.isClean).toBe(true);
      expect(result.sanitised).toBe(input);
      expect(result.categoriesDetected).toEqual([]);
    });

    it('scrubs email addresses', () => {
      const input = 'Contact headteacher@my-school.co.uk about the incident.';
      const result = SchoolDataGuardian.scrub(input);
      expect(result.isClean).toBe(false);
      expect(result.sanitised).not.toContain('headteacher@my-school.co.uk');
      expect(result.categoriesDetected).toContain('email');
    });

    it('scrubs UK dates of birth', () => {
      const input = 'Pupil born 12/04/2012 has a severe allergy.';
      const result = SchoolDataGuardian.scrub(input);
      expect(result.sanitised).not.toContain('12/04/2012');
      expect(result.categoriesDetected).toContain('dob');
    });

    it('scrubs UK UPNs', () => {
      const input = 'Transfer UPN Y123456789012 from previous school.';
      const result = SchoolDataGuardian.scrub(input);
      expect(result.sanitised).not.toContain('Y123456789012');
      expect(result.categoriesDetected).toContain('upn');
    });

    it('scrubs UK postcodes (new in unified Guardian)', () => {
      const result = SchoolDataGuardian.scrub('School is at BD2 4ED in Bradford');
      expect(result.sanitised).not.toContain('BD2 4ED');
      expect(result.categoriesDetected).toContain('postcode');
    });

    it('scrubs role-context names (new in unified Guardian)', () => {
      const result = SchoolDataGuardian.scrub('Mrs Alex Summerscales is the head');
      expect(result.sanitised).not.toContain('Alex Summerscales');
      expect(result.categoriesDetected).toContain('name_with_role');
    });

    it('catches multiple violations in one teacher paste', () => {
      const paste = 'Jane was born 15-05-2015. Phone 07700900123. Email mum@google.com. NHS 123 456 7890. Postcode M1 1AA.';
      const result = SchoolDataGuardian.scrub(paste);
      expect(result.isClean).toBe(false);
      expect(result.categoriesDetected).toContain('dob');
      expect(result.categoriesDetected).toContain('phone');
      expect(result.categoriesDetected).toContain('email');
      expect(result.categoriesDetected).toContain('nhs_number');
      expect(result.categoriesDetected).toContain('postcode');
      expect(result.sanitised).not.toContain('15-05-2015');
      expect(result.sanitised).not.toContain('07700900123');
      expect(result.sanitised).not.toContain('mum@google.com');
      expect(result.sanitised).not.toContain('123 456 7890');
      expect(result.sanitised).not.toContain('M1 1AA');
    });
  });

  describe('allowlist — public data passes through', () => {
    it('lets the school name through when allowlisted', () => {
      const result = SchoolDataGuardian.scrub(
        'Grove House Primary School is in Bradford',
        { allowlist: ['Grove House Primary School'] },
      );
      expect(result.sanitised).toContain('Grove House Primary School');
    });

    it('lets the head teacher through when allowlisted', () => {
      const result = SchoolDataGuardian.scrub(
        'Mrs Alex Summerscales is the headteacher',
        { allowlist: ['Mrs Alex Summerscales'] },
      );
      expect(result.sanitised).toContain('Mrs Alex Summerscales');
      expect(result.isClean).toBe(true);
    });
  });

  describe('skipCategories — selective scrubbing', () => {
    it('respects skipCategories option', () => {
      const result = SchoolDataGuardian.scrub(
        'Contact alex@school.uk at BD2 4ED',
        { skipCategories: ['postcode'] },
      );
      expect(result.sanitised).not.toContain('alex@school.uk');
      expect(result.sanitised).toContain('BD2 4ED');
    });
  });

  describe('rehydrate() — reversibility', () => {
    it('restores original values using the token map', () => {
      const scrubbed = SchoolDataGuardian.scrub('Email alex@school.uk please');
      const rehydrated = SchoolDataGuardian.rehydrate(scrubbed.sanitised, scrubbed.tokenMap);
      expect(rehydrated).toBe('Email alex@school.uk please');
    });
  });

  describe('counts — audit metadata', () => {
    it('counts multiple instances per category', () => {
      const result = SchoolDataGuardian.scrub('Email alex@school.uk or admin@school.uk');
      expect(result.counts.email).toBe(2);
    });
  });

  describe('legacy API — backwards compatibility', () => {
    it('scanAndScrub still works for legacy callers', () => {
      const result = SchoolDataGuardian.scanAndScrub('Contact alex@school.uk');
      expect(result.isClean).toBe(false);
      expect(result.sanitizedText).not.toContain('alex@school.uk');
      expect(result.blockedCategories).toContain('email');
    });

    it('maskIdentityPayload strips identity fields from JSON', () => {
      const input = {
        id: 'uuid-123',
        first_name: 'Sarah',
        last_name: 'Connor',
        dob: '1985-04-12',
        email: 'sarah@skynet.com',
        send_status: 'E',
        grades: [9, 8, 7],
      };
      const masked = SchoolDataGuardian.maskIdentityPayload(input) as Record<string, unknown>;
      expect(masked.first_name).toBeUndefined();
      expect(masked.last_name).toBeUndefined();
      expect(masked.identity_token).toBeDefined();
      expect(masked.dob).toBe('[GUARDIAN_MASKED_DOB]');
      expect(masked.email).toBe('[GUARDIAN_MASKED_EMAIL]');
      expect(masked.send_status).toBe('E');
      expect(masked.grades).toEqual([9, 8, 7]);
    });

    it('maskIdentityPayload cascades into nested structures', () => {
      const input = {
        class_id: 'class_1',
        pupils: [
          { name: 'John', dob: '11/11/2011', notes: 'Good' },
          { name: 'Jane', dob: '12/12/2012', notes: 'Excellent' },
        ],
      };
      const masked = SchoolDataGuardian.maskIdentityPayload(input) as Record<string, unknown>;
      const pupils = masked.pupils as Array<Record<string, unknown>>;
      expect(pupils[0].name).toBeUndefined();
      expect(pupils[0].identity_token).toBeDefined();
      expect(pupils[0].notes).toBe('Good');
    });
  });
});
