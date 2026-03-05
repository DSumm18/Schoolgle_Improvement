// SIAMS Framework Data - The 7 Strands and Key Questions

import { SIAMSStrand } from '@/types/siams/siams';

export const SIAMS_STRANDS: SIAMSStrand[] = [
  {
    id: 'strand-1',
    number: 1,
    title: 'Vision and Leadership',
    description:
      'How effectively is the school\'s distinctive Christian vision established and promoted by leadership at all levels, enabling the school community to flourish?',
    order: 1,
    questions: [
      {
        id: 'q-1-1',
        strandId: 'strand-1',
        text: 'How effectively does the school\'s Christian vision drive decision-making at all levels?',
        guidance:
          'Consider: governance, strategic planning, policy development, resource allocation',
        order: 1,
      },
      {
        id: 'q-1-2',
        strandId: 'strand-1',
        text: 'How well is the Christian vision understood and articulated by all members of the school community?',
        guidance:
          'Evidence from: pupils, staff, governors, parents, community partners',
        order: 2,
      },
      {
        id: 'q-1-3',
        strandId: 'strand-1',
        text: 'How effectively does leadership ensure the vision impacts the whole school experience?',
        guidance:
          'Consider: curriculum, behaviour, wellbeing, relationships, ethos',
        order: 3,
      },
    ],
  },
  {
    id: 'strand-2',
    number: 2,
    title: 'Wisdom, Knowledge and Skills',
    description:
      'How does the curriculum reflect the school\'s Christian vision and enable pupils to develop wisdom, knowledge and skills?',
    order: 2,
    questions: [
      {
        id: 'q-2-1',
        strandId: 'strand-2',
        text: 'How effectively does the curriculum embody and reflect the school\'s Christian vision?',
        guidance:
          'Consider: curriculum design, subject content, teaching approaches, assessment',
        order: 1,
      },
      {
        id: 'q-2-2',
        strandId: 'strand-2',
        text: 'How well does the curriculum enable pupils to develop as wise, knowledgeable and skilled learners?',
        guidance:
          'Evidence: academic outcomes, pupil progress, breadth of learning',
        order: 2,
      },
      {
        id: 'q-2-3',
        strandId: 'strand-2',
        text: 'How effectively does teaching promote deep thinking about big ideas and concepts?',
        guidance:
          'Consider: questioning, philosophical enquiry, critical thinking, creativity',
        order: 3,
      },
    ],
  },
  {
    id: 'strand-3',
    number: 3,
    title: 'Character Development: Hope, Aspiration and Courageous Advocacy',
    description:
      'How does the school enable pupils to develop character, hope, aspiration and courageous advocacy?',
    order: 3,
    questions: [
      {
        id: 'q-3-1',
        strandId: 'strand-3',
        text: 'How effectively does the school nurture hope and aspiration in all pupils?',
        guidance:
          'Evidence: pupil voice, destinations, aspirations, resilience, growth mindset',
        order: 1,
      },
      {
        id: 'q-3-2',
        strandId: 'strand-3',
        text: 'How well does the school develop courageous advocacy and a sense of responsibility for others?',
        guidance:
          'Consider: social action, charity work, awareness of injustice, pupil leadership',
        order: 2,
      },
      {
        id: 'q-3-3',
        strandId: 'strand-3',
        text: 'How effectively does the school support pupils to develop strong moral and spiritual character?',
        guidance:
          'Evidence: values, behaviour, relationships, decision-making, service to others',
        order: 3,
      },
    ],
  },
  {
    id: 'strand-4',
    number: 4,
    title: 'Community and Living Well Together',
    description:
      'How does the school build a strong sense of community and enable all to live well together?',
    order: 4,
    questions: [
      {
        id: 'q-4-1',
        strandId: 'strand-4',
        text: 'How effectively does the school create and sustain a strong sense of community?',
        guidance:
          'Consider: relationships, belonging, inclusion, partnerships with parents and local community',
        order: 1,
      },
      {
        id: 'q-4-2',
        strandId: 'strand-4',
        text: 'How well does the school develop pupils\' understanding of living well together in diverse communities?',
        guidance:
          'Evidence: diversity education, community cohesion, global awareness, British values',
        order: 2,
      },
      {
        id: 'q-4-3',
        strandId: 'strand-4',
        text: 'How effectively does the school work in partnership with the local church and wider Christian community?',
        guidance:
          'Consider: church links, clergy involvement, diocesan partnerships, Christian ethos',
        order: 3,
      },
    ],
  },
  {
    id: 'strand-5',
    number: 5,
    title: 'Dignity and Respect',
    description:
      'How effectively does the school ensure dignity and respect for all, enabling all to flourish?',
    order: 5,
    questions: [
      {
        id: 'q-5-1',
        strandId: 'strand-5',
        text: 'How effectively does the school ensure that all members of the community are treated with dignity and respect?',
        guidance:
          'Consider: behaviour, relationships, anti-bullying, pastoral care, wellbeing',
        order: 1,
      },
      {
        id: 'q-5-2',
        strandId: 'strand-5',
        text: 'How well does the school celebrate and value diversity within its community?',
        guidance:
          'Evidence: inclusion, equality, SEND provision, vulnerable groups, protected characteristics',
        order: 2,
      },
      {
        id: 'q-5-3',
        strandId: 'strand-5',
        text: 'How effectively does the school enable all pupils, including the most vulnerable, to flourish?',
        guidance:
          'Consider: disadvantaged pupils, SEND, wellbeing support, mental health, safeguarding',
        order: 3,
      },
    ],
  },
  {
    id: 'strand-6',
    number: 6,
    title: 'Impact of Collective Worship',
    description:
      'How effective is the impact of collective worship in enabling pupils and adults to flourish spiritually?',
    order: 6,
    questions: [
      {
        id: 'q-6-1',
        strandId: 'strand-6',
        text: 'How effectively does collective worship reflect and promote the school\'s Christian vision?',
        guidance:
          'Consider: worship themes, planning, theological depth, connection to vision',
        order: 1,
      },
      {
        id: 'q-6-2',
        strandId: 'strand-6',
        text: 'How well does collective worship enable pupils and adults to engage spiritually?',
        guidance:
          'Evidence: participation, reflection, prayer, spiritual development, pupil leadership',
        order: 2,
      },
      {
        id: 'q-6-3',
        strandId: 'strand-6',
        text: 'How effectively is collective worship inclusive, invitational and inspiring?',
        guidance:
          'Consider: accessibility, inclusivity, variety, creativity, pupil voice, Anglican tradition',
        order: 3,
      },
    ],
  },
  {
    id: 'strand-7',
    number: 7,
    title: 'Effectiveness of Religious Education',
    description:
      'How effective is the impact of Religious Education (for Voluntary Aided and Academy schools)?',
    order: 7,
    questions: [
      {
        id: 'q-7-1',
        strandId: 'strand-7',
        text: 'How effectively does the RE curriculum enable pupils to develop religious literacy?',
        guidance:
          'Consider: curriculum planning, breadth, depth, theological understanding, world religions',
        order: 1,
      },
      {
        id: 'q-7-2',
        strandId: 'strand-7',
        text: 'How well does RE teaching enable pupils to engage critically with religious and philosophical ideas?',
        guidance:
          'Evidence: questioning, enquiry, critical thinking, pupil work, assessment',
        order: 2,
      },
      {
        id: 'q-7-3',
        strandId: 'strand-7',
        text: 'How effectively does RE support pupils\' spiritual, moral and cultural development?',
        guidance:
          'Consider: pupil voice, personal reflection, respect for diversity, moral reasoning',
        order: 3,
      },
    ],
  },
];

export const RATING_DESCRIPTORS = {
  outstanding: {
    label: 'Outstanding',
    color: 'green',
    description:
      'Exemplary practice that significantly exceeds expectations and enables exceptional flourishing',
  },
  good: {
    label: 'Good',
    color: 'blue',
    description:
      'Strong practice that meets expectations and enables effective flourishing',
  },
  requires_improvement: {
    label: 'Requires Improvement',
    color: 'amber',
    description:
      'Adequate practice with some areas for development to enable consistent flourishing',
  },
  inadequate: {
    label: 'Inadequate',
    color: 'red',
    description:
      'Practice that does not meet expectations and requires significant improvement',
  },
};

export const EVIDENCE_TYPES = {
  policy: {
    label: 'Policy/Procedure',
    icon: '📄',
    examples: ['Vision statement', 'Behaviour policy', 'RE policy'],
  },
  document: {
    label: 'Document/Report',
    icon: '📋',
    examples: ['Meeting minutes', 'Governor reports', 'Strategic plan'],
  },
  data: {
    label: 'Data/Analysis',
    icon: '📊',
    examples: ['Assessment data', 'Survey results', 'Performance metrics'],
  },
  photo: {
    label: 'Photo/Image',
    icon: '📷',
    examples: ['Display photos', 'Worship images', 'Pupil work'],
  },
  video: {
    label: 'Video/Recording',
    icon: '🎥',
    examples: ['Worship recording', 'Lesson observation', 'Pupil interviews'],
  },
  survey: {
    label: 'Survey/Feedback',
    icon: '📝',
    examples: ['Parent survey', 'Pupil voice', 'Staff feedback'],
  },
};

export function getStrandByNumber(number: number): SIAMSStrand | undefined {
  return SIAMS_STRANDS.find((strand) => strand.number === number);
}

export function getAllQuestions(): Array<{
  question: any;
  strand: SIAMSStrand;
}> {
  return SIAMS_STRANDS.flatMap((strand) =>
    (strand.questions || []).map((question) => ({ question, strand }))
  );
}
