/**
 * SchoolDataGuardian Adversarial Test Fixtures
 *
 * Red-team exercise: does the Guardian actually scrub what schools would type?
 *
 * HONEST ANNOTATIONS on Guardian coverage (from reading school-data-guardian.ts):
 *
 * WILL catch:
 *   - UPNs: single uppercase letter + 12 digits (e.g. A801234567890)
 *   - NI numbers: 2 letters + 6 digits + A-D letter
 *   - NHS numbers: 10 digits in 3-3-3 or 3-3-4 groups
 *   - Emails: standard email regex
 *   - DOB: d/m/y, d-m-y, d.m.y formats with 19xx/20xx year
 *   - Phone: +44 or 0 prefix, 9-10 more digits
 *   - Postcodes: UK postcode pattern
 *   - Names with role prefix: Mr/Mrs/Ms/Miss/Dr/Headteacher/Principal/Deputy/SENCO/DSL
 *
 * WILL NOT catch (known gaps — documented, not bugs to fix here):
 *   - Bare first names with no role prefix (Tommy, Grace, Amelia, Emily, Jacob...)
 *   - Bare surnames with no role prefix (Smith, Okonkwo...)
 *   - Names in abbreviated form (T.Smith)
 *   - ISO-format dates (2017-03-15 — Guardian only matches d/m/y variants)
 *   - Encoded/obfuscated contact info ("claire dot smith at gmail dot com")
 *   - Medical diagnoses or conditions without names attached
 *   - Social worker first names without role prefix
 *   - Family names in phrases like "the Smith family"
 *
 * This file records all of these gaps HONESTLY so the scorecard reveals the real risk surface.
 */

export interface GuardianTestCase {
  input: string;
  /** PII strings that MUST NOT appear in sanitised output. Empty = no PII expected (test won't crash). */
  piiValues: string[];
  /** Whether the Guardian is EXPECTED to catch all piiValues based on its actual patterns. */
  expectsCatch: boolean;
  category: string;
  difficulty: 'basic' | 'moderate' | 'adversarial';
  description: string;
}

export const testFixtures: Record<string, GuardianTestCase[]> = {
  // ─────────────────────────────────────────────────────────────
  // 1. PUPIL NAMES
  // ─────────────────────────────────────────────────────────────
  pupil_names: [
    {
      input: 'Tommy Smith is struggling with maths',
      piiValues: ['Tommy Smith'],
      expectsCatch: false, // No role prefix before "Tommy Smith"
      category: 'pupil_names',
      difficulty: 'basic',
      description: 'Full pupil name without role prefix — Guardian will NOT catch bare names',
    },
    {
      input: 'Sophie Hartley-Jones has improved significantly this term',
      piiValues: ['Sophie Hartley-Jones'],
      expectsCatch: false, // No role prefix
      category: 'pupil_names',
      difficulty: 'basic',
      description: 'Hyphenated pupil surname without role prefix — bare name, NOT caught',
    },
    {
      input: "Patrick O'Brien's attendance is poor this half term",
      piiValues: ["Patrick O'Brien"],
      expectsCatch: false, // Apostrophe in surname, no role prefix
      category: 'pupil_names',
      difficulty: 'moderate',
      description: "Irish apostrophe surname without role prefix — NOT caught",
    },
    {
      input: 'Muhammad Al-Rashid needs SEN support with reading and writing',
      piiValues: ['Muhammad Al-Rashid'],
      expectsCatch: false, // No role prefix
      category: 'pupil_names',
      difficulty: 'moderate',
      description: 'Arabic-origin hyphenated name without role prefix — NOT caught',
    },
    {
      input: "I spoke to Amelia's mum yesterday about the incident",
      piiValues: ['Amelia'],
      expectsCatch: false, // Single first name, no role prefix
      category: 'pupil_names',
      difficulty: 'moderate',
      description: 'Possessive first name reference — NOT caught (bare first name)',
    },
    {
      input: "Can you compare Emily and Jacob's progress in reading?",
      piiValues: ['Emily', 'Jacob'],
      expectsCatch: false, // Bare first names
      category: 'pupil_names',
      difficulty: 'moderate',
      description: 'Two bare first names compared — NOT caught',
    },
    {
      input: 'Grace is in Year 3 and her reading age is below average',
      piiValues: ['Grace'],
      expectsCatch: false, // Bare first name that's also a common word
      category: 'pupil_names',
      difficulty: 'adversarial',
      description: 'Name "Grace" is also a common word — bare first name NOT caught',
    },
    {
      input: 'her brother Tommy in Year 6 with the glasses keeps disrupting class',
      piiValues: ['Tommy'],
      expectsCatch: false, // Bare first name in casual phrasing
      category: 'pupil_names',
      difficulty: 'adversarial',
      description: 'Casual reference to pupil first name — NOT caught',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 2. STAFF NAMES
  // ─────────────────────────────────────────────────────────────
  staff_names: [
    {
      input: 'Mrs Johnson said the boiler is broken and needs urgent repair',
      piiValues: ['Mrs Johnson', 'Johnson'],
      expectsCatch: true, // "Mrs Johnson" matches name_with_role pattern
      category: 'staff_names',
      difficulty: 'basic',
      description: 'Staff surname with Mrs prefix — caught by name_with_role pattern',
    },
    {
      input: 'Tell Mr Davies-Williams I need the SEF urgently before Monday',
      piiValues: ['Mr Davies-Williams', 'Davies-Williams'],
      expectsCatch: false, // Hyphenated surnames: regex requires [A-Z][a-z]+ which won't match "Davies-Williams" as one token
      category: 'staff_names',
      difficulty: 'moderate',
      description: 'Hyphenated double-barrel surname with Mr prefix — regex may not match hyphen mid-word',
    },
    {
      input: 'NQT Sarah Thompson starts Monday and needs an induction plan',
      piiValues: ['Sarah Thompson'],
      expectsCatch: false, // No role prefix — "NQT" is not in the Guardian role list
      category: 'staff_names',
      difficulty: 'moderate',
      description: 'Staff name after NQT acronym — NOT a recognised role prefix, NOT caught',
    },
    {
      input: "Ask the SENCO — that's Mrs Kaur about the EHCP documentation",
      piiValues: ['Mrs Kaur', 'Kaur'],
      expectsCatch: true, // "Mrs Kaur" matches name_with_role
      category: 'staff_names',
      difficulty: 'basic',
      description: 'Single-word surname with Mrs prefix — caught by name_with_role',
    },
    {
      input: 'SENCO Mrs Begum is handling the annual review for Year 4',
      piiValues: ['Mrs Begum', 'Begum'],
      expectsCatch: true, // "Mrs Begum" matches name_with_role
      category: 'staff_names',
      difficulty: 'basic',
      description: 'SENCO role then Mrs prefix surname — caught',
    },
    {
      input: 'DSL Mr Ahmed completed the safeguarding training last Thursday',
      piiValues: ['Mr Ahmed', 'Ahmed'],
      expectsCatch: true, // "Mr Ahmed" matches name_with_role
      category: 'staff_names',
      difficulty: 'basic',
      description: 'DSL role prefix with Mr surname — caught',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 3. PARENT / CARER NAMES
  // ─────────────────────────────────────────────────────────────
  parent_carer_names: [
    {
      input: "Tommy's mum Claire rang about absence on Tuesday morning",
      piiValues: ['Claire'],
      expectsCatch: false, // Bare first name, no role prefix
      category: 'parent_carer_names',
      difficulty: 'basic',
      description: 'Parent first name without role prefix — NOT caught',
    },
    {
      input: 'Mr and Mrs Okonkwo want a meeting about the exclusion decision',
      piiValues: ['Mr and Mrs Okonkwo', 'Okonkwo'],
      expectsCatch: true, // "Mrs Okonkwo" part should match; "Mr and Mrs Okonkwo" is compound
      category: 'parent_carer_names',
      difficulty: 'moderate',
      description: '"Mr and Mrs Surname" compound form — Mrs Okonkwo portion likely caught, full phrase may differ',
    },
    {
      input: 'Grandparent Betty Harrison is the emergency contact for Year 2',
      piiValues: ['Betty Harrison'],
      expectsCatch: false, // "Grandparent" not in role prefix list
      category: 'parent_carer_names',
      difficulty: 'moderate',
      description: 'Grandparent as emergency contact — NOT a Guardian role prefix, NOT caught',
    },
    {
      input: 'The carer Mrs Patel called to say the child will be late tomorrow',
      piiValues: ['Mrs Patel', 'Patel'],
      expectsCatch: true, // "Mrs Patel" matches name_with_role
      category: 'parent_carer_names',
      difficulty: 'basic',
      description: 'Carer with Mrs prefix — caught by name_with_role',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 4. UPNs
  // ─────────────────────────────────────────────────────────────
  upns: [
    {
      input: 'UPN A801234567890 is flagged for attendance concerns',
      piiValues: ['A801234567890'],
      expectsCatch: true, // Matches \b[A-Z]\d{12}\b
      category: 'upns',
      difficulty: 'basic',
      description: 'Standard UPN with letter prefix + 12 digits — caught',
    },
    {
      input: 'Check the record for B123456789012 before the review meeting',
      piiValues: ['B123456789012'],
      expectsCatch: true, // Matches \b[A-Z]\d{12}\b
      category: 'upns',
      difficulty: 'basic',
      description: 'UPN inline without label — caught',
    },
    {
      input: 'Temporary UPN X901234567890 assigned to the new arrival from Spain',
      piiValues: ['X901234567890'],
      expectsCatch: true, // Matches \b[A-Z]\d{12}\b
      category: 'upns',
      difficulty: 'basic',
      description: 'Temp UPN with X prefix — caught',
    },
    {
      input: 'Run a comparison for UPNs A801234567890 and B123456789012',
      piiValues: ['A801234567890', 'B123456789012'],
      expectsCatch: true, // Both match
      category: 'upns',
      difficulty: 'moderate',
      description: 'Two UPNs in one sentence — both caught',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 5. DATES OF BIRTH
  // ─────────────────────────────────────────────────────────────
  dates_of_birth: [
    {
      input: 'DOB 15/03/2017 for the pupil in question',
      piiValues: ['15/03/2017'],
      expectsCatch: true, // Matches d/m/y with 20xx year
      category: 'dates_of_birth',
      difficulty: 'basic',
      description: 'Standard d/m/y DOB — caught',
    },
    {
      input: 'Born on 03/03/2017 according to the admission form',
      piiValues: ['03/03/2017'],
      expectsCatch: true, // Matches d/m/y with 20xx year
      category: 'dates_of_birth',
      difficulty: 'basic',
      description: '"Born on" phrase with d/m/y — caught',
    },
    {
      input: 'Date of birth: 2017-03-15 per the MIS system',
      piiValues: ['2017-03-15'],
      expectsCatch: false, // ISO format yyyy-mm-dd — Guardian regex is d/m/y only, NOT caught
      category: 'dates_of_birth',
      difficulty: 'adversarial',
      description: 'ISO 8601 format (yyyy-mm-dd) — Guardian regex does NOT match this format, NOT caught',
    },
    {
      input: 'DOB is 3/3/2017 on the registration form',
      piiValues: ['3/3/2017'],
      expectsCatch: true, // Single-digit d/m/y still matches (0?[1-9] covers 3)
      category: 'dates_of_birth',
      difficulty: 'moderate',
      description: 'Short d/m/y with no leading zeros — caught',
    },
    {
      input: 'Born 15-03-2017 according to passport copy',
      piiValues: ['15-03-2017'],
      expectsCatch: true, // Dash separator also matches
      category: 'dates_of_birth',
      difficulty: 'basic',
      description: 'DOB with dash separators — caught',
    },
    {
      input: 'Her date of birth is 15.03.2017 from the EHCP documentation',
      piiValues: ['15.03.2017'],
      expectsCatch: true, // Dot separator also matches
      category: 'dates_of_birth',
      difficulty: 'moderate',
      description: 'DOB with dot separators — caught',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 6. ADDRESSES / POSTCODES
  // ─────────────────────────────────────────────────────────────
  addresses_postcodes: [
    {
      input: 'Lives at 42 Oak Lane, Bradford BD2 4ED according to census data',
      piiValues: ['BD2 4ED'],
      expectsCatch: true, // Standard UK postcode — caught
      category: 'addresses_postcodes',
      difficulty: 'basic',
      description: 'Postcode within full address — caught',
    },
    {
      input: 'Home address Flat 3, 17 High Street, Leeds LS1 4AP on the system',
      piiValues: ['LS1 4AP'],
      expectsCatch: true, // Matches postcode regex
      category: 'addresses_postcodes',
      difficulty: 'basic',
      description: 'Postcode in formal address string — caught',
    },
    {
      input: 'Just the postcode: BD7 1AH for the home visit log',
      piiValues: ['BD7 1AH'],
      expectsCatch: true, // Matches postcode regex
      category: 'addresses_postcodes',
      difficulty: 'basic',
      description: 'Standalone postcode — caught',
    },
    {
      input: 'The family moved from M1 1AE to WC2N 5DU last summer term',
      piiValues: ['M1 1AE', 'WC2N 5DU'],
      expectsCatch: true, // Both match postcode regex
      category: 'addresses_postcodes',
      difficulty: 'moderate',
      description: 'Two postcodes (short and long form) in one sentence — both caught',
    },
    {
      input: 'Street address: 14 Maple Avenue, Birmingham — no postcode given',
      piiValues: [],
      expectsCatch: true, // No postcode to catch — test that it does not crash
      category: 'addresses_postcodes',
      difficulty: 'basic',
      description: 'Address without a postcode — nothing to catch, no crash',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 7. PHONE NUMBERS
  // ─────────────────────────────────────────────────────────────
  phone_numbers: [
    {
      input: "Mum's mobile: 07712345678 — she prefers texts",
      piiValues: ['07712345678'],
      expectsCatch: true, // 07 prefix + 9 digits = caught
      category: 'phone_numbers',
      difficulty: 'basic',
      description: 'Standard UK mobile (07xxx) — caught',
    },
    {
      input: 'School office: 01274 123456 can be called between 8am and 4pm',
      piiValues: ['01274 123456'],
      expectsCatch: true, // 01 prefix landline with space — 11 digits total caught
      category: 'phone_numbers',
      difficulty: 'basic',
      description: 'UK landline with space separator — caught',
    },
    {
      input: 'Call on +44 7712 345 678 for the parent contact',
      piiValues: ['+44 7712 345 678'],
      expectsCatch: true, // +44 international format — caught
      category: 'phone_numbers',
      difficulty: 'moderate',
      description: 'International +44 format with spaces — caught',
    },
    {
      input: 'Mobile 0771 234 5678 is the emergency contact number',
      piiValues: ['0771 234 5678'],
      expectsCatch: true, // 07xx with spaces — caught
      category: 'phone_numbers',
      difficulty: 'moderate',
      description: 'Mobile with spaces in groups — caught',
    },
    {
      input: 'Landline: 020 7946 0958 rings through to the family directly',
      piiValues: ['020 7946 0958'],
      expectsCatch: true, // London 020 prefix — caught
      category: 'phone_numbers',
      difficulty: 'moderate',
      description: 'London 020 landline with spaces — caught',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 8. EMAIL ADDRESSES
  // ─────────────────────────────────────────────────────────────
  email_addresses: [
    {
      input: 'Email parent at claire.smith@gmail.com regarding the incident',
      piiValues: ['claire.smith@gmail.com'],
      expectsCatch: true, // Standard email — caught
      category: 'email_addresses',
      difficulty: 'basic',
      description: 'Standard Gmail address — caught',
    },
    {
      input: 'Teacher: s.thompson@grovehouse.bradford.sch.uk has the report',
      piiValues: ['s.thompson@grovehouse.bradford.sch.uk'],
      expectsCatch: true, // School email — caught
      category: 'email_addresses',
      difficulty: 'basic',
      description: 'UK school .sch.uk email address — caught',
    },
    {
      input: 'Send to head@school.co.uk and admin@school.co.uk before noon',
      piiValues: ['head@school.co.uk', 'admin@school.co.uk'],
      expectsCatch: true, // Both emails caught
      category: 'email_addresses',
      difficulty: 'moderate',
      description: 'Two emails in one sentence — both caught',
    },
    {
      input: 'email is claire dot smith at gmail dot com — she wrote it strangely',
      piiValues: [], // Encoded form — Guardian regex requires @ symbol, NOT caught
      expectsCatch: false,
      category: 'email_addresses',
      difficulty: 'adversarial',
      description: 'Obfuscated email written in plain English — NOT caught (no @ symbol)',
    },
    {
      input: 'Contact via claire_smith+schoolgle@protonmail.com for secure comms',
      piiValues: ['claire_smith+schoolgle@protonmail.com'],
      expectsCatch: true, // Email with + and _ — caught by regex
      category: 'email_addresses',
      difficulty: 'moderate',
      description: 'Email with + alias and underscore — caught',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 9. SEN / MEDICAL
  // ─────────────────────────────────────────────────────────────
  sen_medical: [
    {
      input: 'Diagnosed ADHD, on medication Ritalin 10mg daily before school',
      piiValues: [], // Medical info without identifying name — Guardian won't catch diagnosis text
      expectsCatch: false,
      category: 'sen_medical',
      difficulty: 'basic',
      description: 'Medical diagnosis without name attached — no PII pattern, NOT caught (intended gap)',
    },
    {
      input: 'Has an EHCP for autism spectrum condition, annual review due in March',
      piiValues: [], // No name — EHCP/diagnosis text alone is not caught
      expectsCatch: false,
      category: 'sen_medical',
      difficulty: 'basic',
      description: 'EHCP and diagnosis category without identifying name — no PII caught',
    },
    {
      input: "Mrs Johnson's son has an epipen for nut allergy — keep in classroom",
      piiValues: ['Mrs Johnson', 'Johnson'],
      expectsCatch: true, // "Mrs Johnson" caught by name_with_role
      category: 'sen_medical',
      difficulty: 'moderate',
      description: 'Medical info combined with named parent — parent name caught',
    },
    {
      input: 'Under CAMHS for anxiety, referred by Dr Patel last September',
      piiValues: ['Dr Patel', 'Patel'],
      expectsCatch: true, // "Dr Patel" caught by name_with_role
      category: 'sen_medical',
      difficulty: 'moderate',
      description: 'Medical referral with named doctor — Dr prefix triggers catch',
    },
    {
      input: 'On the SEN register: dyslexia support, 1:1 reading intervention weekly',
      piiValues: [], // No name in this string
      expectsCatch: false,
      category: 'sen_medical',
      difficulty: 'basic',
      description: 'SEN register entry without pupil name — nothing to catch',
    },
    {
      input: 'Referred to speech and language therapy by Miss Clarke in September',
      piiValues: ['Miss Clarke', 'Clarke'],
      expectsCatch: true, // "Miss Clarke" caught by name_with_role
      category: 'sen_medical',
      difficulty: 'moderate',
      description: 'Therapy referral naming a Miss — caught by name_with_role',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 10. SAFEGUARDING MARKERS
  // ─────────────────────────────────────────────────────────────
  safeguarding: [
    {
      input: 'Child Protection Plan since October — review due next half term',
      piiValues: [], // No name — CPP status alone is not a PII pattern
      expectsCatch: false,
      category: 'safeguarding',
      difficulty: 'basic',
      description: 'CPP status without name — no PII pattern, not caught (context gap)',
    },
    {
      input: 'LAC — placed with foster carer Mrs Williams since the summer holidays',
      piiValues: ['Mrs Williams', 'Williams'],
      expectsCatch: true, // "Mrs Williams" caught by name_with_role
      category: 'safeguarding',
      difficulty: 'moderate',
      description: 'LAC with named foster carer (Mrs prefix) — caught',
    },
    {
      input: "Social worker is Janet from Bradford Children's Services",
      piiValues: ['Janet'],
      expectsCatch: false, // Bare first name, no role prefix in Guardian's list
      category: 'safeguarding',
      difficulty: 'moderate',
      description: 'Social worker first name without role prefix — NOT caught',
    },
    {
      input: 'MASH referral for the Smith family — case number pending',
      piiValues: ['Smith'],
      expectsCatch: false, // Bare surname in "the Smith family" — no role prefix
      category: 'safeguarding',
      difficulty: 'adversarial',
      description: 'Family surname in "the X family" phrasing — NOT caught',
    },
    {
      input: 'Strategy meeting with Principal Davies and DSL Mr Khan on Tuesday',
      piiValues: ['Principal Davies', 'Davies', 'Mr Khan', 'Khan'],
      expectsCatch: true, // "Principal Davies" and "Mr Khan" both match name_with_role
      category: 'safeguarding',
      difficulty: 'moderate',
      description: 'Two named staff in safeguarding context — both caught via role prefixes',
    },
    {
      input: 'Risk assessment reviewed by Headteacher Robinson on 12th March',
      piiValues: ['Headteacher Robinson', 'Robinson'],
      expectsCatch: true, // "Headteacher Robinson" matches name_with_role
      category: 'safeguarding',
      difficulty: 'basic',
      description: 'Headteacher with surname — caught by name_with_role',
    },
  ],

  // ─────────────────────────────────────────────────────────────
  // 11. ADVERSARIAL / MIXED
  // ─────────────────────────────────────────────────────────────
  adversarial_mixed: [
    {
      input: 'Tommy Smith (UPN A801234567890, DOB 15/03/2017) lives at 42 Oak Lane BD2 4ED. Mum Claire (07712345678) says he\'s under CAMHS.',
      piiValues: ['Tommy Smith', 'A801234567890', '15/03/2017', 'BD2 4ED', 'Claire', '07712345678'],
      expectsCatch: false, // Partial catch: UPN, DOB, postcode, phone caught; "Tommy Smith" and "Claire" are bare names NOT caught
      category: 'adversarial_mixed',
      difficulty: 'adversarial',
      description: 'Full mixed record — UPN/DOB/postcode/phone caught, but bare names Tommy/Claire leak through',
    },
    {
      input: 'T.Smith in 4B needs intervention — contact his dad',
      piiValues: ['T.Smith'],
      expectsCatch: false, // Abbreviated name — no role prefix, no pattern match
      category: 'adversarial_mixed',
      difficulty: 'adversarial',
      description: 'Initial + surname abbreviation — NOT caught (no role prefix or pattern)',
    },
    {
      input: 'email is claire dot smith at gmail dot com — unusual format',
      piiValues: [], // Encoded email — no @ symbol, Guardian regex won't catch it
      expectsCatch: false,
      category: 'adversarial_mixed',
      difficulty: 'adversarial',
      description: 'Email encoded in plain English words — NOT caught (requires @ symbol)',
    },
    {
      input: 'Mrs Johnson, Mr Davies, and Miss Patel discussed Tommy\'s progress today',
      piiValues: ['Mrs Johnson', 'Johnson', 'Mr Davies', 'Davies', 'Miss Patel', 'Patel', 'Tommy'],
      expectsCatch: false, // Role-prefixed names caught; "Tommy" (bare) NOT caught
      category: 'adversarial_mixed',
      difficulty: 'adversarial',
      description: 'Multiple staff names (caught via role prefix) plus bare pupil name (NOT caught)',
    },
    {
      input: 'you know Tommy, the lad in Year 4 who moved from Bradford last term',
      piiValues: ['Tommy'],
      expectsCatch: false, // Casual bare first name — no role prefix
      category: 'adversarial_mixed',
      difficulty: 'adversarial',
      description: 'Casual conversational reference to pupil first name — NOT caught',
    },
    {
      input: 'NI number is AB123456C — staff payroll query from Mrs Green',
      piiValues: ['AB123456C', 'Mrs Green', 'Green'],
      expectsCatch: true, // NI matches \b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b; "Mrs Green" matches name_with_role
      category: 'adversarial_mixed',
      difficulty: 'moderate',
      description: 'NI number and staff name together — both caught',
    },
    {
      input: 'NHS number 943 476 5931 for the pupil in the medical room',
      piiValues: ['943 476 5931'],
      expectsCatch: true, // 10-digit NHS number in 3-3-4 format — caught
      category: 'adversarial_mixed',
      difficulty: 'moderate',
      description: 'NHS number in 3-3-4 spaced format — caught',
    },
    {
      input: "DOB: 2019-08-22 and postcode SW1A 2AA — new reception starter's record",
      piiValues: ['2019-08-22', 'SW1A 2AA'],
      expectsCatch: false, // ISO DOB NOT caught; postcode IS caught. Split expectation.
      category: 'adversarial_mixed',
      difficulty: 'adversarial',
      description: 'ISO DOB (NOT caught) and postcode (caught) — partial detection only',
    },
    {
      input: 'Call 07712 345 678 or email tommy.smith@hotmail.com about the trip payment',
      piiValues: ['07712 345 678', 'tommy.smith@hotmail.com'],
      expectsCatch: true, // Phone and email both caught
      category: 'adversarial_mixed',
      difficulty: 'moderate',
      description: 'Phone and email in one message — both caught',
    },
  ],
};

/** Flat list of all test cases for iteration convenience */
export const allFixtures: GuardianTestCase[] = Object.values(testFixtures).flat();
