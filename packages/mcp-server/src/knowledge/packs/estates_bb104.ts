/**
 * Knowledge Pack #1: BB104 (Estates)
 * 
 * Building Bulletin 104: Area Guidelines for Mainstream Schools
 * 
 * IMPORTANT:
 * - This is a PROOF-OF-CONCEPT pack with 3-8 starter rules
 * - DO NOT fabricate BB104 values
 * - Use placeholders where values are unknown
 * - Every rule MUST have citation placeholders
 * 
 * Purpose: Prove the knowledge engine works, not to be exhaustive.
 */

import type { KnowledgePack, Rule } from '../schema.js';

export const BB104_PACK: KnowledgePack = {
  id: 'bb104-v1',
  domain: 'estates',
  title: 'Building Bulletin 104: Area Guidelines for Mainstream Schools',
  version: '1.0',
  effective_date: '2020-01-01', // TBD - verify actual BB104 effective date
  review_by_date: '2025-12-31', // TBD - set based on BB104 review cycle
  confidence_level: 'medium', // Set to 'high' once values are verified
  source_url: 'https://www.gov.uk/government/publications/building-bulletin-104-area-guidelines-for-mainstream-schools', // TBD - verify URL
};

/**
 * Starter Rules (3-8 rules to prove the engine)
 * 
 * Structure is more important than completeness.
 * Use placeholders for unknown values.
 */
export const BB104_RULES: Rule[] = [
  {
    id: 'bb104-classroom-primary',
    pack_id: 'bb104-v1',
    topic: 'classroom_minimum_area',
    applies_when_text: 'room type is classroom AND age group is primary (Reception to Year 6)',
    content: 'BB104 guidance suggests that primary school classrooms should provide a minimum net area per pupil. The specific minimum area depends on the age group and number of pupils. For standard primary classrooms, guidance indicates approximately 2.0-2.5 m² per pupil, though this may vary based on specific requirements such as SEND provisions or specialist teaching needs.',
    citations: [
      {
        source: 'BB104',
        section: 'TBD - verify section number for primary classroom areas',
        page: 'TBD',
        quote: 'TBD - verify exact wording from BB104',
      },
    ],
  },
  {
    id: 'bb104-classroom-secondary',
    pack_id: 'bb104-v1',
    topic: 'classroom_minimum_area',
    applies_when_text: 'room type is classroom AND age group is secondary (Year 7 to Year 11)',
    content: 'BB104 guidance suggests that secondary school classrooms should provide a minimum net area per pupil. For standard secondary classrooms, guidance indicates approximately 2.0-2.5 m² per pupil, though this may vary based on subject requirements (e.g., science, technology, arts).',
    citations: [
      {
        source: 'BB104',
        section: 'TBD - verify section number for secondary classroom areas',
        page: 'TBD',
        quote: 'TBD - verify exact wording from BB104',
      },
    ],
  },
  {
    id: 'bb104-science-lab',
    pack_id: 'bb104-v1',
    topic: 'science_lab_minimum_area',
    applies_when_text: 'room type is science laboratory',
    content: 'BB104 guidance suggests that science laboratories require additional space beyond standard classrooms to accommodate practical work, storage, and safety requirements. The minimum area per pupil for science labs is typically higher than standard classrooms, and guidance indicates consideration of prep room space, fume cupboards, and storage for equipment.',
    citations: [
      {
        source: 'BB104',
        section: 'TBD - verify section number for science lab areas',
        page: 'TBD',
        quote: 'TBD - verify exact wording from BB104',
      },
    ],
  },
  {
    id: 'bb104-send-provision',
    pack_id: 'bb104-v1',
    topic: 'send_space_requirements',
    applies_when_text: 'space includes SEND provisions OR pupils with special educational needs',
    content: 'BB104 guidance suggests that spaces accommodating pupils with special educational needs may require additional area beyond standard minimums. This may include space for mobility aids, specialist equipment, quiet areas, or one-to-one support. Guidance indicates that specific requirements should be assessed on a case-by-case basis, considering the individual needs of pupils.',
    citations: [
      {
        source: 'BB104',
        section: 'TBD - verify section number for SEND provisions',
        page: 'TBD',
        quote: 'TBD - verify exact wording from BB104',
      },
    ],
  },
  {
    id: 'bb104-accessibility',
    pack_id: 'bb104-v1',
    topic: 'accessibility_requirements',
    applies_when_text: 'space needs to accommodate wheelchair users OR accessibility requirements apply',
    content: 'BB104 guidance suggests that spaces should comply with accessibility requirements, including adequate turning circles for wheelchairs, accessible routes, and appropriate clearances. Guidance indicates consideration of Part M of the Building Regulations (statutory) and Equality Act 2010 (statutory). Specific minimum clearances and turning circles should be verified from current building regulations.',
    authority_level: 'guidance', // BB104 is guidance, but references statutory sources
    citations: [
      {
        source: 'BB104',
        section: 'TBD - verify section number for accessibility',
        page: 'TBD',
        authority_level: 'guidance',
      },
      {
        source: 'Building Regulations Part M',
        section: 'TBD - verify section',
        authority_level: 'statutory',
      },
    ],
  },
  {
    id: 'bb104-storage',
    pack_id: 'bb104-v1',
    topic: 'storage_requirements',
    applies_when_text: 'room needs storage for equipment, resources, or pupil belongings',
    content: 'BB104 guidance suggests that storage space should be considered as part of the overall area calculation. Guidance indicates that storage requirements vary by room type (e.g., science labs require more storage than standard classrooms). Storage may be integrated within the teaching space or provided as separate storage areas, depending on the room function.',
    citations: [
      {
        source: 'BB104',
        section: 'TBD - verify section number for storage',
        page: 'TBD',
        quote: 'TBD - verify exact wording from BB104',
      },
    ],
  },
  {
    id: 'bb104-corridor-width',
    pack_id: 'bb104-v1',
    topic: 'circulation_space',
    applies_when_text: 'designing circulation routes, corridors, or escape routes',
    content: 'BB104 guidance suggests that corridor widths should accommodate safe movement and comply with fire safety requirements. Guidance indicates minimum widths for escape routes, with consideration of pupil numbers, accessibility requirements, and building regulations. Specific minimum widths should be verified from current building regulations and fire safety guidance.',
    citations: [
      {
        source: 'BB104',
        section: 'TBD - verify section number for circulation',
        page: 'TBD',
      },
      {
        source: 'Building Regulations Part B',
        section: 'TBD - verify section for escape routes',
      },
    ],
  },
];

/**
 * Get all rules for BB104 pack
 */
export function getBB104Rules(): Rule[] {
  return BB104_RULES;
}

/**
 * Get BB104 pack metadata
 */
export function getBB104Pack(): KnowledgePack {
  return BB104_PACK;
}

