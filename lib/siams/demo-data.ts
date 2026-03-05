// Demo data for SIAMS Dashboard
import type { SchoolData } from '@/types/siams/siams';

export const DEMO_SCHOOLS: SchoolData[] = [
  {
    id: 'st-marys-primary',
    name: "St Mary's CE Primary School",
    overallScore: 78.5,
    logoUrl: null,
    categories: [
      {
        categoryName: 'Vision & Leadership',
        average: 85,
        assessments: [
          {
            name: 'Christian Vision Statement',
            score: 100,
            evidence: 'Vision clearly articulated in all documentation',
            evidenceFiles: 'Vision poster, governors minutes, website',
            aiAssessment: 'Strong evidence of embedded Christian vision across school',
          },
          {
            name: 'Leadership Communication',
            score: 75,
            evidence: 'Regular staff briefings and newsletters',
            evidenceFiles: 'Staff meeting notes, parent newsletters',
          },
          {
            name: 'Strategic Planning',
            score: 75,
            evidence: 'Development plan aligns with vision',
          },
        ],
      },
      {
        categoryName: 'Wisdom, Knowledge & Skills',
        average: 80,
        assessments: [
          {
            name: 'Curriculum Design',
            score: 75,
            evidence: 'Curriculum intent statement reflects Christian values',
          },
          {
            name: 'Teaching Quality',
            score: 100,
            evidence: 'Outstanding teaching observed with deep thinking promoted',
          },
          {
            name: 'Pupil Progress',
            score: 75,
            evidence: 'Strong progress data across subjects',
          },
        ],
      },
      {
        categoryName: 'Character Development',
        average: 75,
        assessments: [
          {
            name: 'Hope & Aspiration',
            score: 75,
            evidence: 'Pupils express high aspirations',
          },
          {
            name: 'Courageous Advocacy',
            score: 50,
            evidence: 'Some charity work but could be expanded',
          },
          {
            name: 'Moral Character',
            score: 100,
            evidence: 'Exceptional behaviour and values demonstrated',
          },
        ],
      },
      {
        categoryName: 'Community & Living Together',
        average: 70,
        assessments: [
          {
            name: 'Sense of Community',
            score: 75,
            evidence: 'Strong relationships across school',
          },
          {
            name: 'Diversity Understanding',
            score: 75,
            evidence: 'Good work on community cohesion',
          },
          {
            name: 'Church Partnership',
            score: 50,
            evidence: 'Regular church visits but could deepen links',
          },
        ],
      },
      {
        categoryName: 'Dignity & Respect',
        average: 85,
        assessments: [
          {
            name: 'Treating All with Respect',
            score: 100,
            evidence: 'Exemplary behaviour and pastoral care',
          },
          {
            name: 'Celebrating Diversity',
            score: 75,
            evidence: 'Good inclusion practices',
          },
          {
            name: 'Vulnerable Pupils Flourishing',
            score: 75,
            evidence: 'Strong SEND provision',
          },
        ],
      },
      {
        categoryName: 'Collective Worship',
        average: 72,
        assessments: [
          {
            name: 'Worship Reflects Vision',
            score: 75,
            evidence: 'Clear links between worship themes and vision',
          },
          {
            name: 'Spiritual Engagement',
            score: 75,
            evidence: 'Pupils engage well in worship',
          },
          {
            name: 'Inclusive & Inspiring',
            score: 50,
            evidence: 'Good participation but variety could be increased',
          },
        ],
      },
      {
        categoryName: 'Religious Education',
        average: 82,
        assessments: [
          {
            name: 'RE Curriculum',
            score: 75,
            evidence: 'Well-planned RE curriculum',
          },
          {
            name: 'Critical Thinking in RE',
            score: 100,
            evidence: 'Outstanding questioning and enquiry',
          },
          {
            name: 'Spiritual Development',
            score: 75,
            evidence: 'Good evidence of reflection',
          },
        ],
      },
    ],
  },
  {
    id: 'all-saints-academy',
    name: 'All Saints Church of England Academy',
    overallScore: 65.2,
    logoUrl: null,
    categories: [
      {
        categoryName: 'Vision & Leadership',
        average: 65,
        assessments: [
          {
            name: 'Christian Vision Statement',
            score: 75,
            evidence: 'Vision present but not fully embedded',
          },
          {
            name: 'Leadership Communication',
            score: 50,
            evidence: 'Communication could be more consistent',
          },
          {
            name: 'Strategic Planning',
            score: 75,
            evidence: 'Plans in place',
          },
        ],
      },
      {
        categoryName: 'Wisdom, Knowledge & Skills',
        average: 68,
        assessments: [
          {
            name: 'Curriculum Design',
            score: 75,
            evidence: 'Curriculum developing well',
          },
          {
            name: 'Teaching Quality',
            score: 50,
            evidence: 'Variable teaching quality',
          },
          {
            name: 'Pupil Progress',
            score: 75,
            evidence: 'Progress improving',
          },
        ],
      },
      {
        categoryName: 'Character Development',
        average: 58,
        assessments: [
          {
            name: 'Hope & Aspiration',
            score: 50,
            evidence: 'Work needed on raising aspirations',
          },
          {
            name: 'Courageous Advocacy',
            score: 50,
            evidence: 'Limited social action projects',
          },
          {
            name: 'Moral Character',
            score: 75,
            evidence: 'Good behaviour systems',
          },
        ],
      },
      {
        categoryName: 'Community & Living Together',
        average: 63,
        assessments: [
          {
            name: 'Sense of Community',
            score: 75,
            evidence: 'Community bonds developing',
          },
          {
            name: 'Diversity Understanding',
            score: 50,
            evidence: 'More work needed on diversity',
          },
          {
            name: 'Church Partnership',
            score: 50,
            evidence: 'Church links need strengthening',
          },
        ],
      },
      {
        categoryName: 'Dignity & Respect',
        average: 70,
        assessments: [
          {
            name: 'Treating All with Respect',
            score: 75,
            evidence: 'Good pastoral systems',
          },
          {
            name: 'Celebrating Diversity',
            score: 50,
            evidence: 'Developing inclusion',
          },
          {
            name: 'Vulnerable Pupils Flourishing',
            score: 75,
            evidence: 'Adequate SEND support',
          },
        ],
      },
      {
        categoryName: 'Collective Worship',
        average: 60,
        assessments: [
          {
            name: 'Worship Reflects Vision',
            score: 50,
            evidence: 'Links to vision need strengthening',
          },
          {
            name: 'Spiritual Engagement',
            score: 50,
            evidence: 'Engagement variable',
          },
          {
            name: 'Inclusive & Inspiring',
            score: 75,
            evidence: 'Good variety of worship',
          },
        ],
      },
      {
        categoryName: 'Religious Education',
        average: 72,
        assessments: [
          {
            name: 'RE Curriculum',
            score: 75,
            evidence: 'Curriculum follows syllabus',
          },
          {
            name: 'Critical Thinking in RE',
            score: 50,
            evidence: 'More challenge needed',
          },
          {
            name: 'Spiritual Development',
            score: 75,
            evidence: 'Good reflection opportunities',
          },
        ],
      },
    ],
  },
];
