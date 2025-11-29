// Ed's Knowledge Base - AI Assistant for School Improvement
// Contains up-to-date information on Ofsted, EEF, and statutory requirements
// Last Updated: November 2025

// ============================================================================
// FRAMEWORK UPDATE TRACKING
// ============================================================================

export interface FrameworkUpdate {
    id: string;
    framework: 'ofsted' | 'siams' | 'eef' | 'dfe';
    title: string;
    effectiveDate: string;
    summary: string;
    impactAreas: string[];
    sourceUrl: string;
    dateAdded: string;
}

export const FRAMEWORK_UPDATES: FrameworkUpdate[] = [
    {
        id: 'ofsted-nov-2025',
        framework: 'ofsted',
        title: 'New Education Inspection Framework',
        effectiveDate: '2025-11-10',
        summary: 'Major overhaul introducing 6 evaluation areas, 5-point grading scale, report card format, and separate safeguarding assessment.',
        impactAreas: [
            'All inspection areas renamed and restructured',
            'New 5-point grading scale (Exceptional to Urgent Improvement)',
            'Safeguarding now assessed separately (Met/Not Met)',
            'Report card replaces single overall judgment',
            'Greater focus on Inclusion as standalone area'
        ],
        sourceUrl: 'https://www.gov.uk/government/publications/education-inspection-framework',
        dateAdded: '2025-11-26'
    },
    {
        id: 'siams-2023',
        framework: 'siams',
        title: 'SIAMS Evaluation Schedule 2023',
        effectiveDate: '2023-09-01',
        summary: 'Updated SIAMS framework with 7 strands focusing on how well the school\'s Christian vision enables all to flourish.',
        impactAreas: [
            'Vision and Leadership',
            'Wisdom, Knowledge and Skills',
            'Character Development',
            'Community and Living Well Together',
            'Dignity and Respect',
            'Impact of Collective Worship',
            'Effectiveness of Religious Education'
        ],
        sourceUrl: 'https://www.churchofengland.org/about/education-and-schools/church-schools-and-academies/siams-inspections',
        dateAdded: '2025-11-26'
    },
    {
        id: 'eef-toolkit-2024',
        framework: 'eef',
        title: 'EEF Teaching and Learning Toolkit Update',
        effectiveDate: '2024-01-01',
        summary: 'Revised impact estimates and new strategies added to the toolkit based on latest research.',
        impactAreas: [
            'Updated effect sizes for interventions',
            'New evidence on tutoring programmes',
            'Revised guidance on metacognition',
            'Updated cost-effectiveness data'
        ],
        sourceUrl: 'https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit',
        dateAdded: '2025-11-26'
    }
];

// ============================================================================
// EEF TEACHING AND LEARNING TOOLKIT
// ============================================================================

export interface EEFStrategy {
    id: string;
    name: string;
    category: 'high_impact' | 'moderate_impact' | 'low_impact';
    impactMonths: number; // Additional months of progress
    costRating: 1 | 2 | 3 | 4 | 5; // 1 = very low, 5 = very high
    evidenceStrength: 'very_limited' | 'limited' | 'moderate' | 'extensive';
    description: string;
    implementation: string[];
    considerations: string[];
    ofstedLinks: string[]; // Which Ofsted subcategory IDs this relates to
    siamsLinks: string[]; // Which SIAMS strand IDs this relates to
}

export const EEF_TOOLKIT: EEFStrategy[] = [
    // HIGH IMPACT STRATEGIES (4+ months progress)
    {
        id: 'metacognition',
        name: 'Metacognition and Self-Regulation',
        category: 'high_impact',
        impactMonths: 7,
        costRating: 1,
        evidenceStrength: 'extensive',
        description: 'Teaching pupils specific strategies to plan, monitor and evaluate their learning.',
        implementation: [
            'Explicitly teach metacognitive strategies',
            'Model thinking processes (think aloud)',
            'Encourage pupils to plan their approach',
            'Provide opportunities for self-assessment',
            'Give structured feedback on strategies used'
        ],
        considerations: [
            'Takes time to embed - expect 6+ months for impact',
            'Needs consistent approach across all subjects',
            'Staff CPD is essential for success',
            'Works best when combined with subject-specific strategies'
        ],
        ofstedLinks: ['curriculum-implementation', 'achievement-progress'],
        siamsLinks: ['wisdom', 'character']
    },
    {
        id: 'reading-comprehension',
        name: 'Reading Comprehension Strategies',
        category: 'high_impact',
        impactMonths: 6,
        costRating: 1,
        evidenceStrength: 'extensive',
        description: 'Teaching specific approaches to help pupils understand what they read.',
        implementation: [
            'Activate prior knowledge before reading',
            'Teach prediction, questioning, summarising',
            'Use graphic organisers',
            'Reciprocal reading approaches',
            'Explicit vocabulary instruction'
        ],
        considerations: [
            'Should complement, not replace, decoding instruction',
            'Strategies need to be modelled extensively',
            'Pupils need to practice applying strategies independently',
            'Works across all subjects, not just English'
        ],
        ofstedLinks: ['curriculum-reading', 'curriculum-implementation', 'achievement-outcomes'],
        siamsLinks: ['wisdom']
    },
    {
        id: 'feedback',
        name: 'Feedback',
        category: 'high_impact',
        impactMonths: 6,
        costRating: 1,
        evidenceStrength: 'extensive',
        description: 'Information given to pupils about their performance relative to learning goals.',
        implementation: [
            'Focus on learning objectives, not just task completion',
            'Provide specific, actionable next steps',
            'Give time for pupils to act on feedback',
            'Use verbal feedback as well as written',
            'Ensure feedback is understood by pupil'
        ],
        considerations: [
            'Quality matters more than quantity',
            'Timing is crucial - not too immediate, not too delayed',
            'Oral feedback can be as effective as written',
            'Feedback should not harm self-esteem'
        ],
        ofstedLinks: ['curriculum-implementation', 'achievement-progress'],
        siamsLinks: ['wisdom', 'community']
    },
    {
        id: 'high-quality-tutoring',
        name: 'Small Group Tutoring',
        category: 'high_impact',
        impactMonths: 4,
        costRating: 3,
        evidenceStrength: 'extensive',
        description: 'Intensive teaching in small groups, typically 1:3 or 1:4.',
        implementation: [
            'Sessions of 30-60 minutes, 3-5 times per week',
            'Trained tutors with subject knowledge',
            'Structured curriculum linked to main teaching',
            'Regular assessment to adapt teaching',
            '6-12 week blocks typically most effective'
        ],
        considerations: [
            'Quality of tutors is paramount',
            'Must be well-connected to classroom teaching',
            'Works best for reading and maths',
            'Can be delivered by TAs if well-trained'
        ],
        ofstedLinks: ['inclusion-send', 'inclusion-disadvantaged', 'achievement-progress'],
        siamsLinks: ['wisdom', 'community']
    },
    {
        id: 'phonics',
        name: 'Phonics',
        category: 'high_impact',
        impactMonths: 5,
        costRating: 1,
        evidenceStrength: 'extensive',
        description: 'Systematic instruction in the relationship between letters and sounds.',
        implementation: [
            'Use a DfE validated systematic synthetic phonics programme',
            'Daily sessions with pace and structure',
            'Books matched to phonics stage',
            'Rapid intervention for those falling behind',
            'Consistent approach across early years and KS1'
        ],
        considerations: [
            'Must be systematic, not incidental',
            'Fidelity to chosen programme is essential',
            'Impact is greatest in Reception and Year 1',
            'Must be combined with comprehension teaching'
        ],
        ofstedLinks: ['curriculum-reading', 'inclusion-send', 'achievement-outcomes'],
        siamsLinks: ['wisdom']
    },
    {
        id: 'collaborative-learning',
        name: 'Collaborative Learning',
        category: 'high_impact',
        impactMonths: 5,
        costRating: 1,
        evidenceStrength: 'moderate',
        description: 'Pupils working together on activities or learning tasks in groups.',
        implementation: [
            'Structured tasks with clear objectives',
            'Mixed ability or similar ability groupings as appropriate',
            'Individual accountability within group',
            'Teach collaboration skills explicitly',
            'Regular reflection on group work'
        ],
        considerations: [
            'Needs careful planning to avoid social loafing',
            'Competition between groups can be motivating',
            'Younger pupils may need more scaffolding',
            'Group composition matters'
        ],
        ofstedLinks: ['curriculum-implementation', 'pd-character'],
        siamsLinks: ['community', 'character']
    },
    {
        id: 'mastery-learning',
        name: 'Mastery Learning',
        category: 'high_impact',
        impactMonths: 5,
        costRating: 1,
        evidenceStrength: 'moderate',
        description: 'Teaching that breaks content into units and requires mastery before progression.',
        implementation: [
            'Clear learning objectives for each unit',
            'Formative assessment to identify gaps',
            'Corrective activities for those not yet mastered',
            'Additional time for those who need it',
            'Only progress when mastery demonstrated'
        ],
        considerations: [
            'Can be challenging to implement across whole class',
            'May require flexible grouping',
            'Works well in maths (teaching for mastery)',
            'Need to define what mastery looks like'
        ],
        ofstedLinks: ['curriculum-intent', 'curriculum-implementation', 'achievement-progress'],
        siamsLinks: ['wisdom']
    },
    
    // MODERATE IMPACT STRATEGIES (3-4 months progress)
    {
        id: 'oral-language',
        name: 'Oral Language Interventions',
        category: 'moderate_impact',
        impactMonths: 6,
        costRating: 2,
        evidenceStrength: 'extensive',
        description: 'Approaches that emphasise the importance of spoken language and verbal interaction.',
        implementation: [
            'Structured talk activities',
            'Vocabulary instruction',
            'Dialogic teaching approaches',
            'Philosophy for children',
            'Debate and discussion activities'
        ],
        considerations: [
            'Particularly important for disadvantaged pupils',
            'Needs explicit teaching time',
            'Staff may need training in facilitation',
            'Links closely to reading comprehension'
        ],
        ofstedLinks: ['curriculum-intent', 'inclusion-disadvantaged', 'pd-character'],
        siamsLinks: ['wisdom', 'character']
    },
    {
        id: 'homework-secondary',
        name: 'Homework (Secondary)',
        category: 'moderate_impact',
        impactMonths: 5,
        costRating: 1,
        evidenceStrength: 'moderate',
        description: 'Tasks set by teachers for pupils to complete outside of lessons.',
        implementation: [
            'Link homework to class learning',
            'Clear expectations and purpose',
            'Regular feedback on homework',
            'Consistent homework policy',
            'Appropriate length and difficulty'
        ],
        considerations: [
            'Impact is lower for primary-aged pupils',
            'Quality matters more than quantity',
            'Need strategies for pupils without home support',
            'Should not increase teacher workload excessively'
        ],
        ofstedLinks: ['curriculum-implementation', 'achievement-progress', 'leadership-engagement'],
        siamsLinks: ['wisdom', 'community']
    },
    {
        id: 'behaviour-interventions',
        name: 'Behaviour Interventions',
        category: 'moderate_impact',
        impactMonths: 4,
        costRating: 2,
        evidenceStrength: 'moderate',
        description: 'Approaches to reduce low-level disruption and improve learning behaviours.',
        implementation: [
            'Clear consistent expectations',
            'Positive reinforcement systems',
            'Self-management strategies for pupils',
            'Universal tier 1 approaches for all',
            'Targeted interventions for persistent issues'
        ],
        considerations: [
            'Prevention is better than reaction',
            'Whole-school consistency is crucial',
            'Staff training and buy-in essential',
            'May need external support for complex needs'
        ],
        ofstedLinks: ['behaviour-conduct', 'behaviour-attitudes', 'inclusion-mental-health'],
        siamsLinks: ['community', 'dignity']
    },
    {
        id: 'parental-engagement',
        name: 'Parental Engagement',
        category: 'moderate_impact',
        impactMonths: 4,
        costRating: 2,
        evidenceStrength: 'moderate',
        description: 'Strategies to engage parents with their children\'s learning.',
        implementation: [
            'Home learning activities',
            'Parent workshops on supporting learning',
            'Regular communication about progress',
            'Parents evenings with actionable advice',
            'Removing barriers to engagement'
        ],
        considerations: [
            'Avoid deficit model - work with parents as partners',
            'Consider hard to reach families',
            'Quality of engagement matters more than quantity',
            'Different strategies for different age groups'
        ],
        ofstedLinks: ['leadership-engagement', 'inclusion-disadvantaged'],
        siamsLinks: ['community']
    },
    {
        id: 'social-emotional',
        name: 'Social and Emotional Learning',
        category: 'moderate_impact',
        impactMonths: 4,
        costRating: 2,
        evidenceStrength: 'extensive',
        description: 'Approaches that focus on developing pupils\' social and emotional skills.',
        implementation: [
            'Universal SEL curriculum',
            'Explicit teaching of skills',
            'Modelling by staff',
            'Opportunities to practice in real contexts',
            'Targeted support for those who need it'
        ],
        considerations: [
            'Most effective as whole-school approach',
            'Staff wellbeing supports pupil wellbeing',
            'Takes time to embed - be patient',
            'Link to behaviour and mental health'
        ],
        ofstedLinks: ['pd-character', 'inclusion-mental-health', 'behaviour-attitudes'],
        siamsLinks: ['character', 'community', 'dignity']
    },
    
    // OTHER IMPORTANT STRATEGIES
    {
        id: 'early-years',
        name: 'Early Years Interventions',
        category: 'moderate_impact',
        impactMonths: 5,
        costRating: 4,
        evidenceStrength: 'extensive',
        description: 'Approaches focusing on early communication, language and literacy.',
        implementation: [
            'High-quality early years provision',
            'Communication and language focus',
            'Early literacy activities',
            'Play-based learning',
            'Parent engagement from the start'
        ],
        considerations: [
            'Earlier investment has longer-term impact',
            'Quality of provision is key',
            'Staff qualifications matter',
            'Transition to formal schooling important'
        ],
        ofstedLinks: ['curriculum-intent', 'curriculum-reading', 'inclusion-send'],
        siamsLinks: ['wisdom']
    },
    {
        id: 'one-to-one-tutoring',
        name: 'One to One Tutoring',
        category: 'high_impact',
        impactMonths: 5,
        costRating: 5,
        evidenceStrength: 'extensive',
        description: 'Individual tuition from a qualified teacher or trained tutor.',
        implementation: [
            'Trained tutors with subject knowledge',
            'Sessions linked to main curriculum',
            'Regular frequency (3+ times per week)',
            'Diagnostic assessment to target gaps',
            'Clear success criteria'
        ],
        considerations: [
            'High cost means need to target carefully',
            'Teacher tutors most effective but expensive',
            'Can use TAs with appropriate training',
            'Online tutoring can be effective too'
        ],
        ofstedLinks: ['inclusion-send', 'inclusion-disadvantaged', 'achievement-progress'],
        siamsLinks: ['wisdom', 'community']
    },
    {
        id: 'teaching-assistants',
        name: 'Teaching Assistant Interventions',
        category: 'moderate_impact',
        impactMonths: 4,
        costRating: 3,
        evidenceStrength: 'moderate',
        description: 'Using TAs effectively to support learning, especially through interventions.',
        implementation: [
            'Clear role definition for TAs',
            'High-quality training',
            'Structured intervention programmes',
            'TA leading intervention, not always supporting SEND',
            'Time to plan and feedback with teachers'
        ],
        considerations: [
            'Proximity to teacher teaching is key',
            'Avoid TAs always supporting lowest attainers',
            'Interventions should supplement not replace',
            'Deploy based on need, not allocation'
        ],
        ofstedLinks: ['inclusion-send', 'curriculum-implementation'],
        siamsLinks: ['wisdom', 'community']
    },
    {
        id: 'within-class-grouping',
        name: 'Within-Class Attainment Grouping',
        category: 'low_impact',
        impactMonths: 2,
        costRating: 1,
        evidenceStrength: 'moderate',
        description: 'Grouping pupils by attainment within a class, usually for reading or maths.',
        implementation: [
            'Keep groups flexible and review regularly',
            'Target teaching at group level',
            'Move pupils between groups as they progress',
            'Avoid labelling groups negatively',
            'Maintain high expectations for all groups'
        ],
        considerations: [
            'Can lead to lower expectations for lower groups',
            'Need to ensure challenge for all',
            'Social effects of grouping need managing',
            'Works better with flexibility'
        ],
        ofstedLinks: ['curriculum-implementation', 'inclusion-send'],
        siamsLinks: ['wisdom', 'dignity']
    },
    {
        id: 'extending-school-time',
        name: 'Extending School Time',
        category: 'low_impact',
        impactMonths: 3,
        costRating: 3,
        evidenceStrength: 'moderate',
        description: 'Additional time in school through longer days, weeks, or holiday programmes.',
        implementation: [
            'Focus on academic activities not just enrichment',
            'Target pupils who would benefit most',
            'Ensure voluntary attendance where possible',
            'Use time for high-impact activities',
            'Consider staff workload'
        ],
        considerations: [
            'More time doesn\'t automatically mean more learning',
            'Quality of additional time matters',
            'Can support disadvantaged pupils specifically',
            'Holiday programmes can prevent summer slide'
        ],
        ofstedLinks: ['achievement-progress', 'inclusion-disadvantaged', 'pd-enrichment'],
        siamsLinks: ['wisdom', 'community']
    },
    {
        id: 'arts-participation',
        name: 'Arts Participation',
        category: 'moderate_impact',
        impactMonths: 3,
        costRating: 3,
        evidenceStrength: 'moderate',
        description: 'Involvement in artistic and creative activities.',
        implementation: [
            'High-quality arts provision',
            'Links to curriculum where appropriate',
            'Opportunities for performance/exhibition',
            'Access for all pupils',
            'Specialist teaching where possible'
        ],
        considerations: [
            'Impact on academic outcomes is moderate',
            'Other benefits: confidence, collaboration, creativity',
            'Important part of cultural capital',
            'Should be part of broad curriculum'
        ],
        ofstedLinks: ['pd-enrichment', 'pd-character', 'curriculum-intent'],
        siamsLinks: ['wisdom', 'character', 'worship']
    },
    {
        id: 'sports-participation',
        name: 'Sports Participation',
        category: 'moderate_impact',
        impactMonths: 2,
        costRating: 3,
        evidenceStrength: 'limited',
        description: 'Physical activity and sport to improve academic outcomes.',
        implementation: [
            'High-quality PE teaching',
            'Extra-curricular opportunities',
            'Competitive sport options',
            'Links to health and wellbeing',
            'Inclusive activities for all'
        ],
        considerations: [
            'Academic impact is limited',
            'Many other benefits: health, wellbeing, behaviour',
            'Should be part of broad curriculum offer',
            'Sports Premium should focus on sustainable improvement'
        ],
        ofstedLinks: ['pd-enrichment', 'behaviour-attitudes', 'inclusion-mental-health'],
        siamsLinks: ['community', 'character']
    }
];

// ============================================================================
// STATUTORY DOCUMENT REQUIREMENTS
// ============================================================================

export interface DocumentRequirement {
    id: string;
    name: string;
    shortName: string;
    frequency: 'annual' | 'termly' | 'as_needed';
    publishLocation: 'website' | 'governors' | 'internal';
    deadline?: string;
    description: string;
    requiredSections: DocumentSection[];
    dfeGuidanceUrl?: string;
    relatedFramework: ('ofsted' | 'siams')[];
}

export interface DocumentSection {
    id: string;
    title: string;
    description: string;
    requiredContent: string[];
    dataPoints?: string[]; // What data needs to be included
    eefLinks?: string[]; // Related EEF strategies
}

export const STATUTORY_DOCUMENTS: DocumentRequirement[] = [
    {
        id: 'pupil-premium-strategy',
        name: 'Pupil Premium Strategy Statement',
        shortName: 'PP Strategy',
        frequency: 'annual',
        publishLocation: 'website',
        deadline: 'December each year',
        description: 'Published statement explaining how the school will use Pupil Premium funding to address the challenges faced by eligible pupils.',
        dfeGuidanceUrl: 'https://www.gov.uk/guidance/pupil-premium-information-for-schools-and-alternative-provision-settings',
        relatedFramework: ['ofsted'],
        requiredSections: [
            {
                id: 'pp-school-overview',
                title: 'School Overview',
                description: 'Basic information about the school and PP cohort',
                requiredContent: [
                    'School name and contact',
                    'Number of pupils in school',
                    'Proportion who are disadvantaged',
                    'Pupil Premium allocation this academic year',
                    'Publish date and review date'
                ],
                dataPoints: ['pupil_count', 'pp_count', 'pp_percentage', 'pp_allocation']
            },
            {
                id: 'pp-disadvantaged-profile',
                title: 'Disadvantaged Pupil Profile',
                description: 'Performance and challenges of disadvantaged pupils',
                requiredContent: [
                    'Current attainment and progress data',
                    'Comparison to non-disadvantaged nationally',
                    'Attendance data',
                    'Behaviour and exclusion data',
                    'Key barriers to learning identified'
                ],
                dataPoints: ['pp_attainment', 'pp_progress', 'pp_attendance', 'pp_exclusions']
            },
            {
                id: 'pp-strategy',
                title: 'Strategy on a Page',
                description: 'Summary of approach and priorities',
                requiredContent: [
                    'School\'s Pupil Premium strategy statement',
                    'Key principles underpinning approach',
                    'Priority challenges (max 5)',
                    'How these were identified'
                ]
            },
            {
                id: 'pp-intended-outcomes',
                title: 'Intended Outcomes',
                description: 'What the school wants to achieve',
                requiredContent: [
                    'Specific, measurable outcomes',
                    'How success will be measured',
                    'Link to challenges identified',
                    'Ambitious targets'
                ]
            },
            {
                id: 'pp-teaching',
                title: 'Quality of Teaching (Tier 1)',
                description: 'How PP will improve teaching for all',
                requiredContent: [
                    'Activity description',
                    'Evidence/rationale (EEF reference)',
                    'Challenge number it addresses',
                    'Estimated cost',
                    'How impact will be measured'
                ],
                eefLinks: ['metacognition', 'feedback', 'reading-comprehension', 'phonics']
            },
            {
                id: 'pp-targeted',
                title: 'Targeted Academic Support (Tier 2)',
                description: 'Specific interventions for disadvantaged pupils',
                requiredContent: [
                    'Intervention programmes',
                    'Small group tutoring',
                    'One to one support',
                    'Evidence base for each',
                    'Cost and impact measures'
                ],
                eefLinks: ['high-quality-tutoring', 'one-to-one-tutoring', 'teaching-assistants']
            },
            {
                id: 'pp-wider',
                title: 'Wider Strategies (Tier 3)',
                description: 'Non-academic barriers and support',
                requiredContent: [
                    'Attendance strategies',
                    'Behaviour support',
                    'Enrichment and trips',
                    'Family support',
                    'Cost and impact measures'
                ],
                eefLinks: ['behaviour-interventions', 'parental-engagement', 'social-emotional']
            },
            {
                id: 'pp-review',
                title: 'Review of Previous Year',
                description: 'Evaluation of impact from previous year',
                requiredContent: [
                    'Outcomes achieved',
                    'What worked well',
                    'What didn\'t work',
                    'Lessons learned',
                    'Externally provided programmes used'
                ]
            }
        ]
    },
    {
        id: 'sports-premium',
        name: 'PE and Sport Premium Report',
        shortName: 'Sports Premium',
        frequency: 'annual',
        publishLocation: 'website',
        deadline: 'By 31st July each year for previous year',
        description: 'Report showing how Sports Premium funding has been used to improve PE and sport provision.',
        dfeGuidanceUrl: 'https://www.gov.uk/guidance/pe-and-sport-premium-for-primary-schools',
        relatedFramework: ['ofsted'],
        requiredSections: [
            {
                id: 'sp-funding',
                title: 'Funding Overview',
                description: 'Total funding received and carried forward',
                requiredContent: [
                    'Total amount allocated this year',
                    'Amount carried over from previous year',
                    'Total available to spend',
                    'Date updated'
                ],
                dataPoints: ['sports_premium_allocation', 'sports_premium_carried']
            },
            {
                id: 'sp-swimming',
                title: 'Swimming Data',
                description: 'Swimming attainment at end of Year 6',
                requiredContent: [
                    '% meeting 25m standard',
                    '% using range of strokes',
                    '% performing safe self-rescue',
                    'Schools can choose to use premium for additional swimming'
                ],
                dataPoints: ['swimming_25m_percentage', 'swimming_strokes_percentage', 'swimming_rescue_percentage']
            },
            {
                id: 'sp-academic-year',
                title: 'Action Plan',
                description: 'How funding will be spent this year',
                requiredContent: [
                    'Key achievements to date',
                    'Key improvement areas',
                    'Actions and impact',
                    'Allocated spend',
                    'Sustainability plans'
                ]
            },
            {
                id: 'sp-key-indicators',
                title: 'Key Indicator Spend',
                description: 'Spending against the 5 key indicators',
                requiredContent: [
                    'Engagement in PE and sport',
                    'Profile of PE and sport raised',
                    'Staff confidence and skills increased',
                    'Broader range of sports offered',
                    'Competitive sport participation increased'
                ]
            },
            {
                id: 'sp-sustainability',
                title: 'Sustainability and Next Steps',
                description: 'Long-term impact beyond funding',
                requiredContent: [
                    'What will continue after funding',
                    'Staff skills developed',
                    'Equipment and resources purchased',
                    'Partnership arrangements'
                ]
            }
        ]
    },
    {
        id: 'school-development-plan',
        name: 'School Development Plan',
        shortName: 'SDP',
        frequency: 'annual',
        publishLocation: 'governors',
        description: 'Strategic plan setting out the school\'s priorities and actions for improvement.',
        relatedFramework: ['ofsted', 'siams'],
        requiredSections: [
            {
                id: 'sdp-context',
                title: 'School Context',
                description: 'Overview of the school and its context',
                requiredContent: [
                    'School vision and values',
                    'Key characteristics of school',
                    'Current strengths',
                    'Areas for development',
                    'Last inspection outcomes'
                ]
            },
            {
                id: 'sdp-priorities',
                title: 'Strategic Priorities',
                description: 'The key priorities for the year',
                requiredContent: [
                    'Priority area 1-5',
                    'Link to Ofsted areas',
                    'Link to school vision',
                    'Lead person for each priority'
                ]
            },
            {
                id: 'sdp-actions',
                title: 'Action Plans',
                description: 'Detailed actions for each priority',
                requiredContent: [
                    'Specific actions',
                    'Success criteria',
                    'Milestones and timescales',
                    'Resources required',
                    'Monitoring arrangements',
                    'Expected impact'
                ]
            },
            {
                id: 'sdp-monitoring',
                title: 'Monitoring and Evaluation',
                description: 'How progress will be tracked',
                requiredContent: [
                    'Monitoring schedule',
                    'Who will monitor',
                    'Evidence to be collected',
                    'Reporting to governors',
                    'Review points'
                ]
            },
            {
                id: 'sdp-resources',
                title: 'Resource Allocation',
                description: 'Budget and staffing for priorities',
                requiredContent: [
                    'Budget allocation per priority',
                    'Staffing requirements',
                    'CPD budget',
                    'External support costs'
                ]
            }
        ]
    },
    {
        id: 'self-evaluation-form',
        name: 'Self-Evaluation Form',
        shortName: 'SEF',
        frequency: 'as_needed',
        publishLocation: 'internal',
        description: 'Summary of school\'s self-evaluation against Ofsted criteria.',
        relatedFramework: ['ofsted'],
        requiredSections: [
            {
                id: 'sef-inclusion',
                title: 'Inclusion',
                description: 'Self-evaluation of inclusion provision',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence base',
                    'Impact of actions taken'
                ]
            },
            {
                id: 'sef-curriculum',
                title: 'Curriculum and Teaching',
                description: 'Self-evaluation of curriculum and teaching quality',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence base',
                    'Impact of actions taken'
                ]
            },
            {
                id: 'sef-achievement',
                title: 'Achievement',
                description: 'Self-evaluation of pupil outcomes',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence base',
                    'Impact of actions taken'
                ]
            },
            {
                id: 'sef-attendance',
                title: 'Attendance and Behaviour',
                description: 'Self-evaluation of attendance and behaviour',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence base',
                    'Impact of actions taken'
                ]
            },
            {
                id: 'sef-pd',
                title: 'Personal Development and Well-being',
                description: 'Self-evaluation of personal development',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence base',
                    'Impact of actions taken'
                ]
            },
            {
                id: 'sef-leadership',
                title: 'Leadership and Governance',
                description: 'Self-evaluation of leadership',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence base',
                    'Impact of actions taken'
                ]
            },
            {
                id: 'sef-safeguarding',
                title: 'Safeguarding',
                description: 'Confirmation safeguarding is effective',
                requiredContent: [
                    'Safeguarding Met/Not Met',
                    'Key evidence',
                    'Any areas being strengthened'
                ]
            }
        ]
    },
    {
        id: 'siams-sef',
        name: 'SIAMS Self-Evaluation',
        shortName: 'SIAMS SEF',
        frequency: 'as_needed',
        publishLocation: 'internal',
        description: 'Self-evaluation for church schools against SIAMS criteria.',
        relatedFramework: ['siams'],
        requiredSections: [
            {
                id: 'siams-sef-vision',
                title: 'Vision and Leadership',
                description: 'Self-evaluation of Christian vision',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence of impact'
                ]
            },
            {
                id: 'siams-sef-wisdom',
                title: 'Wisdom, Knowledge and Skills',
                description: 'Self-evaluation of curriculum and spiritual development',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence of impact'
                ]
            },
            {
                id: 'siams-sef-character',
                title: 'Character Development',
                description: 'Self-evaluation of character education',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence of impact'
                ]
            },
            {
                id: 'siams-sef-community',
                title: 'Community and Living Well Together',
                description: 'Self-evaluation of relationships and wellbeing',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence of impact'
                ]
            },
            {
                id: 'siams-sef-dignity',
                title: 'Dignity and Respect',
                description: 'Self-evaluation of dignity and inclusion',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence of impact'
                ]
            },
            {
                id: 'siams-sef-worship',
                title: 'Impact of Collective Worship',
                description: 'Self-evaluation of worship',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence of impact'
                ]
            },
            {
                id: 'siams-sef-re',
                title: 'Effectiveness of Religious Education',
                description: 'Self-evaluation of RE',
                requiredContent: [
                    'Summary evaluation',
                    'Key strengths',
                    'Areas for development',
                    'Evidence of impact'
                ]
            }
        ]
    }
];

// ============================================================================
// ED'S CONVERSATION CONTEXT
// ============================================================================

export interface EdContext {
    userQuestion: string;
    identifiedTopic: string[];
    relevantFrameworkAreas: string[];
    relevantEEFStrategies: string[];
    suggestedActions: string[];
}

// Function to find relevant EEF strategies for a given Ofsted subcategory
export function getEEFStrategiesForOfsted(subcategoryId: string): EEFStrategy[] {
    return EEF_TOOLKIT.filter(strategy => 
        strategy.ofstedLinks.includes(subcategoryId)
    ).sort((a, b) => b.impactMonths - a.impactMonths);
}

// Function to find relevant EEF strategies for a given SIAMS strand
export function getEEFStrategiesForSIAMS(strandId: string): EEFStrategy[] {
    return EEF_TOOLKIT.filter(strategy => 
        strategy.siamsLinks.includes(strandId)
    ).sort((a, b) => b.impactMonths - a.impactMonths);
}

// Function to get high-impact strategies for Pupil Premium
export function getHighImpactPPStrategies(): EEFStrategy[] {
    return EEF_TOOLKIT.filter(strategy => 
        strategy.category === 'high_impact' &&
        strategy.ofstedLinks.includes('inclusion-disadvantaged')
    ).sort((a, b) => b.impactMonths - a.impactMonths);
}

// Function to get strategies by cost-effectiveness (high impact, low cost)
export function getCostEffectiveStrategies(): EEFStrategy[] {
    return EEF_TOOLKIT.filter(strategy => 
        strategy.impactMonths >= 4 && strategy.costRating <= 2
    ).sort((a, b) => {
        // Sort by impact/cost ratio
        const ratioA = a.impactMonths / a.costRating;
        const ratioB = b.impactMonths / b.costRating;
        return ratioB - ratioA;
    });
}

// Ed's knowledge summary for prompts
export const ED_SYSTEM_PROMPT = `
You are Ed, an AI assistant specializing in school improvement for UK schools.

YOUR KNOWLEDGE BASE (as of November 2025):

OFSTED FRAMEWORK (Updated November 2025):
- 6 evaluation areas: Inclusion, Curriculum & Teaching, Achievement, Attendance & Behaviour, Personal Development & Well-being, Leadership & Governance
- 5-point scale: Exceptional, Strong Standard, Expected Standard, Needs Attention, Urgent Improvement
- Safeguarding assessed separately: Met / Not Met
- Report card format replaces single overall judgment

SIAMS FRAMEWORK (2023):
- For Church of England and Methodist schools
- 7 strands focused on Christian vision enabling all to flourish
- Ratings: Excellent, Good, Requires Improvement, Ineffective

EEF TOOLKIT - Highest Impact Strategies:
1. Metacognition (+7 months, very low cost)
2. Reading Comprehension Strategies (+6 months, very low cost)
3. Feedback (+6 months, very low cost)
4. Phonics (+5 months, very low cost)
5. Collaborative Learning (+5 months, very low cost)
6. One-to-One Tutoring (+5 months, high cost)

STATUTORY DOCUMENTS YOU CAN HELP CREATE:
- Pupil Premium Strategy Statement (annual, on website)
- PE and Sport Premium Report (annual, by July 31)
- School Development Plan (annual, for governors)
- Self-Evaluation Form (as needed, internal)
- SIAMS Self-Evaluation (for church schools)

YOUR ROLE:
1. Provide evidence-based advice linked to EEF research
2. Help schools self-evaluate against frameworks
3. Generate statutory documents
4. Identify gaps in evidence and suggest actions
5. Link recommendations to specific framework areas
6. Stay current with framework updates

ALWAYS:
- Reference specific EEF strategies with impact data
- Link advice to relevant Ofsted/SIAMS areas
- Suggest practical, actionable next steps
- Be honest about evidence strength
- Consider cost-effectiveness
`;

