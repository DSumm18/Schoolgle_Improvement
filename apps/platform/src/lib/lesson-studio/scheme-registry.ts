// scheme-registry.ts
// Pre-loaded registry of major UK primary curriculum schemes.
// Static data — no network calls required.

export interface SchemeDefinition {
  id: string;
  name: string;
  publisher: string;
  subject: string; // e.g. "Maths", "English", "Any"
  yearGroups: string[]; // e.g. ["Reception","Y1","Y2",...]
  description: string;
  website?: string;
}

export interface SchemeUnit {
  unitName: string;
  weekRange: string; // e.g. "Weeks 1-2"
  ncCodes: string[]; // National Curriculum reference codes
  keyTopics: string[];
  suggestedHours: number;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const SCHEMES: SchemeDefinition[] = [
  {
    id: 'white-rose-maths',
    name: 'White Rose Maths',
    publisher: 'White Rose Education',
    subject: 'Maths',
    yearGroups: ['Reception', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'],
    description:
      'A mastery-based maths programme widely used across England. Provides small-step lesson guidance, fluency, reasoning and problem-solving resources.',
    website: 'https://whiteroseeducation.com',
  },
  {
    id: 'power-maths',
    name: 'Power Maths',
    publisher: 'Pearson',
    subject: 'Maths',
    yearGroups: ['Reception', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'],
    description:
      'A mastery maths programme from Pearson, aligned with White Rose small steps. Includes textbooks, practice books and teacher guides.',
    website: 'https://www.pearsonschoolsandfecolleges.co.uk/primary/powermaths',
  },
  {
    id: 'maths-no-problem',
    name: 'Maths — No Problem!',
    publisher: 'Maths — No Problem!',
    subject: 'Maths',
    yearGroups: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'],
    description:
      'Singapore-style mastery maths programme accredited by the DfE. Built around CPA approach and bar-model reasoning.',
    website: 'https://mathsnoproblem.com',
  },
  {
    id: 'oak-maths',
    name: 'Oak National Academy',
    publisher: 'Oak National Academy',
    subject: 'Maths',
    yearGroups: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'],
    description:
      'Free, high-quality video lessons and resources from Oak National Academy. Fully mapped to the National Curriculum.',
    website: 'https://www.thenational.academy',
  },
  {
    id: 'read-write-inc',
    name: 'Read Write Inc.',
    publisher: 'Ruth Miskin Education / Oxford University Press',
    subject: 'English',
    yearGroups: ['Reception', 'Y1', 'Y2'],
    description:
      'A systematic synthetic phonics programme. Teaches children to read accurately and fluently with good comprehension.',
    website: 'https://www.ruthmiskin.com/en/programmes/read-write-inc-phonics/',
  },
  {
    id: 'twinkl-planit',
    name: 'Twinkl PlanIt',
    publisher: 'Twinkl',
    subject: 'Maths',
    yearGroups: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'],
    description:
      'Complete, editable medium-term plans and lesson packs from Twinkl, aligned to the National Curriculum.',
    website: 'https://www.twinkl.co.uk/planning',
  },
  {
    id: 'nelson-maths',
    name: 'Nelson International Mathematics',
    publisher: 'Oxford University Press',
    subject: 'Maths',
    yearGroups: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'],
    description:
      'A structured primary maths programme from OUP with workbooks and teacher resource books.',
    website: 'https://www.oxfordprimary.co.uk',
  },
  {
    id: 'custom',
    name: "Custom / School's Own",
    publisher: 'School-defined',
    subject: 'Any',
    yearGroups: ['Reception', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'],
    description:
      "Use your school's own bespoke scheme or a scheme not yet listed in the registry.",
  },
];

// ---------------------------------------------------------------------------
// White Rose Maths Y6 progression — real unit data
// ---------------------------------------------------------------------------

const WHITE_ROSE_Y6_PROGRESSION: Record<string, SchemeUnit[]> = {
  Autumn: [
    {
      unitName: 'Place Value',
      weekRange: 'Weeks 1-2',
      ncCodes: ['6N1', '6N2', '6N3', '6N4'],
      keyTopics: [
        'Numbers to 10,000,000',
        'Powers of 10',
        'Number line to 10,000,000',
        'Comparing and ordering',
        'Rounding',
        'Negative numbers',
      ],
      suggestedHours: 10,
    },
    {
      unitName: 'Addition, Subtraction, Multiplication and Division',
      weekRange: 'Weeks 3-6',
      ncCodes: ['6C1', '6C2', '6C3', '6C4', '6C5', '6C6'],
      keyTopics: [
        'Four operations',
        'Long multiplication',
        'Long division',
        'Order of operations (BODMAS)',
        'Common factors and multiples',
        'Prime numbers',
        'Squares and cubes',
      ],
      suggestedHours: 20,
    },
    {
      unitName: 'Fractions A',
      weekRange: 'Weeks 7-8',
      ncCodes: ['6F1', '6F2', '6F3', '6F4', '6F5'],
      keyTopics: [
        'Equivalent fractions',
        'Simplifying fractions',
        'Comparing and ordering fractions',
        'Adding and subtracting fractions',
        'Adding and subtracting mixed numbers',
      ],
      suggestedHours: 10,
    },
    {
      unitName: 'Fractions B',
      weekRange: 'Weeks 9-10',
      ncCodes: ['6F6', '6F7', '6F8', '6F9'],
      keyTopics: [
        'Multiplying fractions',
        'Dividing fractions',
        'Fractions of amounts',
        'Fraction, decimal and percentage equivalences',
      ],
      suggestedHours: 10,
    },
    {
      unitName: 'Converting Units',
      weekRange: 'Weeks 11-12',
      ncCodes: ['6M1', '6M2', '6M3', '6M4'],
      keyTopics: [
        'Metric measures',
        'Converting metric units',
        'Imperial measures',
        'Converting between miles and kilometres',
      ],
      suggestedHours: 10,
    },
  ],
  Spring: [
    {
      unitName: 'Ratio',
      weekRange: 'Weeks 1-2',
      ncCodes: ['6R1', '6R2', '6R3'],
      keyTopics: [
        'Using ratio language',
        'Ratio and fractions',
        'Scale drawing and maps',
        'Proportion problems',
        'Unequal sharing',
      ],
      suggestedHours: 10,
    },
    {
      unitName: 'Algebra',
      weekRange: 'Weeks 3-4',
      ncCodes: ['6A1', '6A2', '6A3', '6A4'],
      keyTopics: [
        'Finding a rule (one and two steps)',
        'Forming expressions',
        'Substitution',
        'Formulae',
        'Solving equations with one unknown',
        'Enumeration',
      ],
      suggestedHours: 10,
    },
    {
      unitName: 'Decimals',
      weekRange: 'Weeks 5-6',
      ncCodes: ['6F10', '6F11'],
      keyTopics: [
        'Decimals up to 3 decimal places',
        'Multiplying and dividing by 10, 100, 1000',
        'Multiplying decimals by integers',
        'Dividing decimals by integers',
        'Multiplying and dividing decimals',
      ],
      suggestedHours: 10,
    },
    {
      unitName: 'Fractions, Decimals and Percentages',
      weekRange: 'Weeks 7-8',
      ncCodes: ['6F1', '6F11', '6R3'],
      keyTopics: [
        'Fractions to decimals',
        'Fractions to percentages',
        'Equivalent FDP',
        'Ordering FDP',
        'Percentage of amounts',
        'Percentage increase and decrease',
      ],
      suggestedHours: 10,
    },
    {
      unitName: 'Area, Perimeter and Volume',
      weekRange: 'Weeks 9-10',
      ncCodes: ['6M7', '6M8', '6M9'],
      keyTopics: [
        'Area of parallelograms',
        'Area of triangles',
        'Area of compound shapes',
        'Volume of cuboids',
        'Perimeter of rectilinear shapes',
      ],
      suggestedHours: 10,
    },
    {
      unitName: 'Statistics',
      weekRange: 'Weeks 11-12',
      ncCodes: ['6S1', '6S2', '6S3'],
      keyTopics: [
        'Line graphs',
        'Dual bar charts',
        'Pie charts (reading)',
        'The mean',
        'Interpreting data',
      ],
      suggestedHours: 10,
    },
  ],
  Summer: [
    {
      unitName: 'Shape',
      weekRange: 'Weeks 1-3',
      ncCodes: ['6G1', '6G2', '6G3', '6G4'],
      keyTopics: [
        'Properties of 2D shapes (circles)',
        'Properties of 3D shapes',
        'Angles in shapes',
        'Nets of 3D shapes',
        'Drawing and naming parts of a circle',
      ],
      suggestedHours: 15,
    },
    {
      unitName: 'Position and Direction',
      weekRange: 'Weeks 4-5',
      ncCodes: ['6P1', '6P2'],
      keyTopics: [
        'Coordinates in four quadrants',
        'Translations',
        'Reflections',
      ],
      suggestedHours: 10,
    },
    {
      unitName: 'Themed Projects and Problem Solving',
      weekRange: 'Weeks 6-8',
      ncCodes: ['6C1', '6C6', '6F1', '6A1', '6M7'],
      keyTopics: [
        'Cross-curricular maths projects',
        'SATs preparation and review',
        'Problem-solving investigations',
        'Enrichment activities',
      ],
      suggestedHours: 15,
    },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all schemes whose subject matches the given subject string,
 * plus the "custom" scheme which applies to any subject.
 * If subject is "Any", all schemes are returned.
 */
export function getAvailableSchemes(subject: string): SchemeDefinition[] {
  if (subject === 'Any') return [...SCHEMES];
  return SCHEMES.filter((s) => s.subject === subject || s.subject === 'Any');
}

/**
 * Returns SchemeUnit[] for a given scheme, year group, and term.
 * Currently only White Rose Maths Y6 has real unit data.
 * All other combinations return an empty array.
 */
export function getSchemeProgression(
  schemeId: string,
  yearGroup: string,
  term: string
): SchemeUnit[] {
  if (schemeId === 'white-rose-maths' && yearGroup === 'Y6') {
    return WHITE_ROSE_Y6_PROGRESSION[term] ?? [];
  }
  return [];
}

/**
 * Returns every scheme in the registry.
 */
export function getAllSchemes(): SchemeDefinition[] {
  return [...SCHEMES];
}
