// Ofsted Education Inspection Framework (EIF)
// Updated for November 2025 changes
// Reference: https://www.gov.uk/government/publications/education-inspection-framework

export interface EvidenceItem {
    id: string;
    name: string;
    description: string;
}

export interface SubCategory {
    id: string;
    name: string;
    description: string;
    evidenceRequired: EvidenceItem[];
    keyIndicators: string[];
    inspectionFocus: string[];
    guidanceSummary?: string;
    guidanceLink?: string;
}

export interface Category {
    id: string;
    name: string;
    description: string;
    color: string;
    guidanceSummary: string;
    guidanceLink: string;
    subcategories: SubCategory[];
}

export interface ActionItem {
    id: string;
    title?: string;
    description: string;
    rationale?: string;
    category?: string;
    subCategory?: string;
    evidenceItem?: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    startDate?: string;
    owner?: string;
    assignee?: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'open';
    notes?: any[];
    createdAt?: string;
    updatedAt?: string;
}

// NEW 5-Point Grading Scale (November 2025)
export const OFSTED_RATINGS = {
    'exceptional': { 
        label: 'Exceptional', 
        color: 'bg-purple-500', 
        textColor: 'text-purple-700',
        description: 'Highest quality provision',
        score: 5
    },
    'strong_standard': { 
        label: 'Strong Standard', 
        color: 'bg-green-500', 
        textColor: 'text-green-700',
        description: 'Above expected standards',
        score: 4
    },
    'expected_standard': { 
        label: 'Expected Standard', 
        color: 'bg-blue-500', 
        textColor: 'text-blue-700',
        description: 'Meets all required standards',
        score: 3
    },
    'needs_attention': { 
        label: 'Needs Attention', 
        color: 'bg-yellow-500', 
        textColor: 'text-yellow-700',
        description: 'Some aspects inconsistent or limited',
        score: 2
    },
    'urgent_improvement': { 
        label: 'Urgent Improvement', 
        color: 'bg-red-500', 
        textColor: 'text-red-700',
        description: 'Requires immediate action',
        score: 1
    },
    'not_assessed': { 
        label: 'Not Assessed', 
        color: 'bg-gray-400', 
        textColor: 'text-gray-600',
        description: 'Awaiting assessment',
        score: 0
    }
};

// Safeguarding is now assessed separately
export const SAFEGUARDING_STATUS = {
    'met': { label: 'Met', color: 'bg-green-500', description: 'Safeguarding requirements are met' },
    'not_met': { label: 'Not Met', color: 'bg-red-500', description: 'Safeguarding requirements are NOT met' },
    'not_assessed': { label: 'Not Assessed', color: 'bg-gray-400', description: 'Awaiting assessment' }
};

// NEW Ofsted Framework - 6 Evaluation Areas (November 2025)
export const OFSTED_FRAMEWORK: Category[] = [
    {
        id: 'inclusion',
        name: 'Inclusion',
        description: 'How well the school ensures all pupils, including those with SEND and disadvantaged pupils, receive the support they need',
        color: 'teal',
        guidanceSummary: 'Inspectors evaluate how effectively the school identifies and supports pupils with additional needs, including those with SEND, disadvantaged pupils, and those with mental health needs. This includes the quality of the graduated approach and how well the curriculum is adapted.',
        guidanceLink: 'https://www.gov.uk/government/publications/education-inspection-framework',
        subcategories: [
            {
                id: 'inclusion-send',
                name: 'SEND Provision',
                description: 'Support for pupils with special educational needs and disabilities',
                evidenceRequired: [
                    { id: 'send-1', name: 'SEND Policy', description: 'Current SEND policy and information report' },
                    { id: 'send-2', name: 'Graduated Approach', description: 'Evidence of assess, plan, do, review cycle' },
                    { id: 'send-3', name: 'Provision Map', description: 'Mapping of interventions and support' },
                    { id: 'send-4', name: 'EHCP Reviews', description: 'Annual review documentation' },
                    { id: 'send-5', name: 'SENCO Role', description: 'Evidence of SENCO leadership and impact' }
                ],
                keyIndicators: [
                    'Pupils with SEND achieve well from their starting points',
                    'Early identification of needs is effective',
                    'High-quality targeted support is in place',
                    'Staff have appropriate training for SEND',
                    'Parents are engaged as partners'
                ],
                inspectionFocus: [
                    'How quickly are needs identified?',
                    'Is the graduated approach implemented effectively?',
                    'Do pupils with SEND access the full curriculum?',
                    'What is the impact of interventions?'
                ]
            },
            {
                id: 'inclusion-disadvantaged',
                name: 'Disadvantaged Pupils',
                description: 'Support and outcomes for disadvantaged pupils including those eligible for Pupil Premium',
                evidenceRequired: [
                    { id: 'pp-1', name: 'Pupil Premium Strategy', description: 'Current PP strategy statement' },
                    { id: 'pp-2', name: 'PP Outcomes', description: 'Progress and attainment data for PP pupils' },
                    { id: 'pp-3', name: 'Intervention Impact', description: 'Evidence of impact of PP spending' },
                    { id: 'pp-4', name: 'Attendance Data', description: 'Attendance comparison for PP pupils' }
                ],
                keyIndicators: [
                    'Disadvantaged pupils achieve as well as others nationally',
                    'Gaps are closing over time',
                    'PP strategy is evidence-based (EEF)',
                    'Barriers to learning are addressed effectively'
                ],
                inspectionFocus: [
                    'What are the barriers for disadvantaged pupils?',
                    'How is PP funding used to address barriers?',
                    'What is the impact on outcomes?',
                    'How are attendance gaps addressed?'
                ]
            },
            {
                id: 'inclusion-mental-health',
                name: 'Mental Health & Wellbeing Support',
                description: 'Support for pupils with mental health needs and promotion of wellbeing',
                evidenceRequired: [
                    { id: 'mh-1', name: 'Mental Health Lead', description: 'Trained senior mental health lead' },
                    { id: 'mh-2', name: 'Wellbeing Curriculum', description: 'How wellbeing is taught' },
                    { id: 'mh-3', name: 'Support Systems', description: 'Referral pathways and support available' },
                    { id: 'mh-4', name: 'Staff Training', description: 'Mental health awareness training' }
                ],
                keyIndicators: [
                    'Pupils mental health needs are identified early',
                    'Effective support systems are in place',
                    'Staff are trained to recognise signs of mental ill health',
                    'Pupils know how to access support'
                ],
                inspectionFocus: [
                    'How are mental health needs identified?',
                    'What support is available?',
                    'How is pupil wellbeing promoted?',
                    'Is there a whole-school approach?'
                ]
            }
        ]
    },
    {
        id: 'curriculum-teaching',
        name: 'Curriculum and Teaching',
        description: 'The quality, breadth and ambition of the curriculum and how effectively it is taught',
        color: 'rose',
        guidanceSummary: 'Inspectors evaluate how well the curriculum is designed, sequenced and taught. This includes whether it is ambitious for all pupils, how well it builds knowledge over time, and the quality of pedagogy.',
        guidanceLink: 'https://www.gov.uk/government/publications/education-inspection-framework',
        subcategories: [
            {
                id: 'curriculum-intent',
                name: 'Curriculum Intent',
                description: 'The design and ambition of the curriculum',
                evidenceRequired: [
                    { id: 'intent-1', name: 'Curriculum Overview', description: 'Whole-school curriculum map' },
                    { id: 'intent-2', name: 'Subject Policies', description: 'Intent statements for each subject' },
                    { id: 'intent-3', name: 'Progression Maps', description: 'How knowledge builds over time' },
                    { id: 'intent-4', name: 'Cultural Capital', description: 'How curriculum builds cultural capital' }
                ],
                keyIndicators: [
                    'Curriculum is ambitious for all pupils including SEND',
                    'Clear progression of knowledge and skills',
                    'National Curriculum coverage is secure',
                    'Local context is reflected appropriately'
                ],
                inspectionFocus: [
                    'What is the curriculum intent?',
                    'How is the curriculum sequenced?',
                    'How does it build cultural capital?',
                    'Is it ambitious for all?'
                ]
            },
            {
                id: 'curriculum-implementation',
                name: 'Teaching Quality',
                description: 'How effectively the curriculum is taught',
                evidenceRequired: [
                    { id: 'teach-1', name: 'Lesson Observations', description: 'Recent observation evidence' },
                    { id: 'teach-2', name: 'Work Scrutiny', description: 'Analysis of pupil work over time' },
                    { id: 'teach-3', name: 'Assessment Policy', description: 'How assessment informs teaching' },
                    { id: 'teach-4', name: 'CPD Records', description: 'Staff development and impact' },
                    { id: 'teach-5', name: 'Feedback Policy', description: 'Approach to feedback' }
                ],
                keyIndicators: [
                    'Teachers have strong subject knowledge',
                    'Effective pedagogical approaches are used',
                    'Assessment is used to adapt teaching',
                    'Feedback helps pupils improve',
                    'Teaching is adapted for different learners'
                ],
                inspectionFocus: [
                    'How is the curriculum taught?',
                    'Do teachers have secure subject knowledge?',
                    'How is assessment used?',
                    'Is teaching adapted for all learners?'
                ]
            },
            {
                id: 'curriculum-reading',
                name: 'Reading and Literacy',
                description: 'The teaching of reading including phonics',
                evidenceRequired: [
                    { id: 'read-1', name: 'Phonics Programme', description: 'DfE validated SSP programme' },
                    { id: 'read-2', name: 'Reading Curriculum', description: 'Approach to reading across school' },
                    { id: 'read-3', name: 'Book Matching', description: 'How books are matched to phonics stage' },
                    { id: 'read-4', name: 'Intervention Data', description: 'Keep-up/catch-up intervention impact' },
                    { id: 'read-5', name: 'Phonics Results', description: 'Phonics screening check outcomes' }
                ],
                keyIndicators: [
                    'Validated SSP programme implemented with fidelity',
                    'Books are matched to pupils phonics knowledge',
                    'Rapid intervention for those falling behind',
                    'Reading for pleasure is promoted',
                    'Strong phonics outcomes'
                ],
                inspectionFocus: [
                    'What phonics programme is used?',
                    'Are books decodable and matched?',
                    'How quickly are struggling readers supported?',
                    'Do pupils read fluently and with comprehension?'
                ]
            }
        ]
    },
    {
        id: 'achievement',
        name: 'Achievement',
        description: 'The outcomes pupils achieve and the progress they make',
        color: 'blue',
        guidanceSummary: 'Inspectors evaluate the outcomes pupils achieve, including national test and examination results, and the progress pupils make from their starting points. This includes outcomes for different groups of pupils.',
        guidanceLink: 'https://www.gov.uk/government/publications/education-inspection-framework',
        subcategories: [
            {
                id: 'achievement-outcomes',
                name: 'Academic Outcomes',
                description: 'Attainment and progress in national assessments',
                evidenceRequired: [
                    { id: 'out-1', name: 'KS2 Results', description: 'End of KS2 outcomes and progress' },
                    { id: 'out-2', name: 'Phonics Results', description: 'Year 1 phonics screening outcomes' },
                    { id: 'out-3', name: 'EYFS Outcomes', description: 'GLD and prime area data' },
                    { id: 'out-4', name: 'Progress Data', description: 'In-year progress tracking' },
                    { id: 'out-5', name: 'Group Analysis', description: 'Outcomes by pupil group' }
                ],
                keyIndicators: [
                    'Outcomes are at least in line with national',
                    'Progress is strong from starting points',
                    'All groups achieve well',
                    'Outcomes are improving over time'
                ],
                inspectionFocus: [
                    'What are the outcomes in national tests?',
                    'How do outcomes compare to national?',
                    'Are all groups achieving well?',
                    'What is the trend over time?'
                ]
            },
            {
                id: 'achievement-progress',
                name: 'Progress from Starting Points',
                description: 'How well pupils progress relative to their starting points',
                evidenceRequired: [
                    { id: 'prog-1', name: 'Baseline Data', description: 'Starting point assessments' },
                    { id: 'prog-2', name: 'Progress Measures', description: 'How progress is tracked' },
                    { id: 'prog-3', name: 'Value Added', description: 'Progress scores where available' },
                    { id: 'prog-4', name: 'Cohort Analysis', description: 'Tracking cohorts over time' }
                ],
                keyIndicators: [
                    'Pupils make strong progress from their starting points',
                    'Progress is consistent across the curriculum',
                    'Lower attainers catch up',
                    'Higher attainers are stretched'
                ],
                inspectionFocus: [
                    'What progress do pupils make?',
                    'Is progress consistent across subjects?',
                    'Do all groups make expected progress?',
                    'How is progress measured?'
                ]
            },
            {
                id: 'achievement-destinations',
                name: 'Preparation for Next Stage',
                description: 'How well pupils are prepared for the next stage of education',
                evidenceRequired: [
                    { id: 'dest-1', name: 'Transition Data', description: 'Outcomes at transition points' },
                    { id: 'dest-2', name: 'Secondary Ready', description: 'Preparation for secondary school' },
                    { id: 'dest-3', name: 'Careers Guidance', description: 'Where applicable' }
                ],
                keyIndicators: [
                    'Pupils are well-prepared for next stage',
                    'Transition arrangements are effective',
                    'Academic and personal readiness'
                ],
                inspectionFocus: [
                    'Are pupils ready for secondary school?',
                    'What transition support is provided?',
                    'Do pupils have appropriate skills and knowledge?'
                ]
            }
        ]
    },
    {
        id: 'attendance-behaviour',
        name: 'Attendance and Behaviour',
        description: 'Pupils attendance, behaviour, attitudes to learning and conduct',
        color: 'orange',
        guidanceSummary: 'Inspectors evaluate attendance levels including persistent absence, the effectiveness of strategies to improve attendance, behaviour in lessons and around school, and pupils attitudes to learning.',
        guidanceLink: 'https://www.gov.uk/government/publications/education-inspection-framework',
        subcategories: [
            {
                id: 'attendance-overall',
                name: 'Attendance',
                description: 'Overall attendance and persistent absence rates',
                evidenceRequired: [
                    { id: 'att-1', name: 'Attendance Data', description: 'Current attendance rates' },
                    { id: 'att-2', name: 'PA Data', description: 'Persistent absence rates and trends' },
                    { id: 'att-3', name: 'Attendance Policy', description: 'School attendance policy' },
                    { id: 'att-4', name: 'Intervention Evidence', description: 'Impact of attendance strategies' },
                    { id: 'att-5', name: 'Group Breakdown', description: 'Attendance by pupil group' }
                ],
                keyIndicators: [
                    'Attendance is at least in line with national (96%+)',
                    'Persistent absence is reducing',
                    'Same-day response to absence',
                    'Gaps for disadvantaged are closing',
                    'Strong attendance culture'
                ],
                inspectionFocus: [
                    'What is overall attendance?',
                    'What is the PA rate?',
                    'How quickly does the school respond to absence?',
                    'Are there gaps between groups?'
                ]
            },
            {
                id: 'behaviour-conduct',
                name: 'Behaviour and Conduct',
                description: 'Behaviour in lessons and around school',
                evidenceRequired: [
                    { id: 'beh-1', name: 'Behaviour Policy', description: 'Behaviour and relationships policy' },
                    { id: 'beh-2', name: 'Exclusion Data', description: 'Fixed term and permanent exclusions' },
                    { id: 'beh-3', name: 'Behaviour Logs', description: 'Incident recording and trends' },
                    { id: 'beh-4', name: 'Restorative Approaches', description: 'How relationships are repaired' }
                ],
                keyIndicators: [
                    'High expectations consistently applied',
                    'Behaviour is at least good',
                    'Low-level disruption is rare',
                    'Exclusions are low and reducing',
                    'Bullying is rare and dealt with effectively'
                ],
                inspectionFocus: [
                    'What is behaviour like in lessons?',
                    'How is behaviour managed?',
                    'Are expectations consistently applied?',
                    'What is the exclusion rate?'
                ]
            },
            {
                id: 'behaviour-attitudes',
                name: 'Attitudes to Learning',
                description: 'Pupils engagement and attitudes in lessons',
                evidenceRequired: [
                    { id: 'atl-1', name: 'Pupil Voice', description: 'What pupils say about learning' },
                    { id: 'atl-2', name: 'Lesson Observations', description: 'Evidence of engagement' },
                    { id: 'atl-3', name: 'Work Scrutiny', description: 'Evidence of effort and pride' }
                ],
                keyIndicators: [
                    'Pupils are engaged and focused',
                    'Positive attitudes to learning',
                    'Pupils take pride in their work',
                    'Resilience when facing challenges'
                ],
                inspectionFocus: [
                    'Are pupils engaged in lessons?',
                    'Do pupils want to succeed?',
                    'How do pupils respond to challenge?'
                ]
            }
        ]
    },
    {
        id: 'personal-development',
        name: 'Personal Development and Well-being',
        description: 'The broader development of pupils as individuals and citizens',
        color: 'violet',
        guidanceSummary: 'Inspectors evaluate how well the school develops pupils character, resilience, confidence and independence. This includes PSHE, RSE, British Values, and enrichment opportunities.',
        guidanceLink: 'https://www.gov.uk/government/publications/education-inspection-framework',
        subcategories: [
            {
                id: 'pd-character',
                name: 'Character and Resilience',
                description: 'Development of character, confidence and resilience',
                evidenceRequired: [
                    { id: 'char-1', name: 'Character Education', description: 'How character is developed' },
                    { id: 'char-2', name: 'PSHE Curriculum', description: 'Personal development curriculum' },
                    { id: 'char-3', name: 'Pupil Leadership', description: 'Opportunities for leadership' }
                ],
                keyIndicators: [
                    'Character is explicitly developed',
                    'Pupils show resilience',
                    'Confidence is built',
                    'Pupils can self-regulate'
                ],
                inspectionFocus: [
                    'How is character developed?',
                    'Do pupils show resilience?',
                    'Are pupils confident?'
                ]
            },
            {
                id: 'pd-citizenship',
                name: 'Citizenship and British Values',
                description: 'Preparation for life in modern Britain',
                evidenceRequired: [
                    { id: 'bv-1', name: 'British Values Mapping', description: 'How BV are taught' },
                    { id: 'bv-2', name: 'Democracy', description: 'Understanding of democracy' },
                    { id: 'bv-3', name: 'Rule of Law', description: 'Understanding of rules and laws' },
                    { id: 'bv-4', name: 'Tolerance', description: 'Respect for diversity' }
                ],
                keyIndicators: [
                    'British Values are embedded',
                    'Pupils understand democracy',
                    'Respect for diversity',
                    'Prepared for life in modern Britain'
                ],
                inspectionFocus: [
                    'How are British Values taught?',
                    'Do pupils understand diversity?',
                    'Are pupils prepared for modern Britain?'
                ]
            },
            {
                id: 'pd-enrichment',
                name: 'Enrichment and Wider Opportunities',
                description: 'Extra-curricular and enrichment provision',
                evidenceRequired: [
                    { id: 'enrich-1', name: 'Enrichment Offer', description: 'Clubs, trips, experiences' },
                    { id: 'enrich-2', name: 'Participation Data', description: 'Who accesses enrichment' },
                    { id: 'enrich-3', name: 'Cultural Capital', description: 'Experiences offered' }
                ],
                keyIndicators: [
                    'Rich enrichment offer',
                    'All pupils can access',
                    'Builds cultural capital',
                    'Develops talents and interests'
                ],
                inspectionFocus: [
                    'What enrichment is offered?',
                    'Do all pupils access it?',
                    'How does it build cultural capital?'
                ]
            },
            {
                id: 'pd-rse',
                name: 'RSE and Health Education',
                description: 'Relationships, sex and health education',
                evidenceRequired: [
                    { id: 'rse-1', name: 'RSE Policy', description: 'Current RSE policy' },
                    { id: 'rse-2', name: 'RSE Curriculum', description: 'Coverage and progression' },
                    { id: 'rse-3', name: 'Parent Consultation', description: 'Evidence of consultation' }
                ],
                keyIndicators: [
                    'Statutory RSE is delivered',
                    'Age-appropriate content',
                    'Parents consulted',
                    'Pupils understand healthy relationships'
                ],
                inspectionFocus: [
                    'Is RSE delivered effectively?',
                    'Is content age-appropriate?',
                    'Have parents been consulted?'
                ]
            }
        ]
    },
    {
        id: 'leadership-governance',
        name: 'Leadership and Governance',
        description: 'The effectiveness of leadership at all levels including governance',
        color: 'gray',
        guidanceSummary: 'Inspectors evaluate how effectively leaders and governors ensure the school provides a high quality education, how they develop staff, manage workload and wellbeing, and engage with parents and the community.',
        guidanceLink: 'https://www.gov.uk/government/publications/education-inspection-framework',
        subcategories: [
            {
                id: 'leadership-vision',
                name: 'Vision and Strategy',
                description: 'Clarity and ambition of school vision',
                evidenceRequired: [
                    { id: 'vis-1', name: 'Vision Statement', description: 'School vision and values' },
                    { id: 'vis-2', name: 'School Development Plan', description: 'Strategic improvement priorities' },
                    { id: 'vis-3', name: 'Self-Evaluation', description: 'Accurate self-knowledge' }
                ],
                keyIndicators: [
                    'Clear and ambitious vision',
                    'Staff understand and share the vision',
                    'Accurate self-evaluation',
                    'Strategic priorities are right'
                ],
                inspectionFocus: [
                    'What is the school vision?',
                    'Is self-evaluation accurate?',
                    'Are priorities appropriate?'
                ]
            },
            {
                id: 'leadership-governance',
                name: 'Governance',
                description: 'Effectiveness of governance and oversight',
                evidenceRequired: [
                    { id: 'gov-1', name: 'Governor Minutes', description: 'Evidence of support and challenge' },
                    { id: 'gov-2', name: 'Governor Training', description: 'Training and development' },
                    { id: 'gov-3', name: 'Monitoring Visits', description: 'Governor monitoring activity' }
                ],
                keyIndicators: [
                    'Governors know the school well',
                    'Effective support and challenge',
                    'Hold leaders to account',
                    'Statutory duties fulfilled'
                ],
                inspectionFocus: [
                    'How do governors know the school?',
                    'Do governors challenge effectively?',
                    'Are statutory duties met?'
                ]
            },
            {
                id: 'leadership-staff',
                name: 'Staff Development and Wellbeing',
                description: 'How leaders develop staff and manage workload',
                evidenceRequired: [
                    { id: 'staff-1', name: 'CPD Programme', description: 'Staff development offer' },
                    { id: 'staff-2', name: 'Workload Policy', description: 'How workload is managed' },
                    { id: 'staff-3', name: 'Staff Voice', description: 'What staff say' }
                ],
                keyIndicators: [
                    'Effective professional development',
                    'Workload is manageable',
                    'Staff wellbeing prioritised',
                    'High staff morale'
                ],
                inspectionFocus: [
                    'How is CPD quality assured?',
                    'Is workload reasonable?',
                    'How is staff wellbeing supported?'
                ]
            },
            {
                id: 'leadership-engagement',
                name: 'Parent and Community Engagement',
                description: 'Relationships with parents and the wider community',
                evidenceRequired: [
                    { id: 'parent-1', name: 'Parent Survey', description: 'Parent views and feedback' },
                    { id: 'parent-2', name: 'Communication', description: 'How parents are kept informed' },
                    { id: 'parent-3', name: 'Complaints', description: 'Complaints handling' }
                ],
                keyIndicators: [
                    'Strong parent partnerships',
                    'Effective communication',
                    'Parents engaged in learning',
                    'Complaints handled well'
                ],
                inspectionFocus: [
                    'What do parents think?',
                    'How are parents engaged?',
                    'Is communication effective?'
                ]
            }
        ]
    }
];

// Safeguarding - Now assessed separately (November 2025)
export const SAFEGUARDING_FRAMEWORK = {
    id: 'safeguarding',
    name: 'Safeguarding',
    description: 'The effectiveness of safeguarding arrangements',
    color: 'red',
    guidanceSummary: 'Safeguarding is now assessed separately from the main evaluation areas. It is judged as either "Met" or "Not Met". A "Not Met" judgment is serious and will trigger immediate action.',
    requirements: [
        { id: 'sg-1', name: 'Safeguarding Policy', description: 'Current policy reflecting KCSIE' },
        { id: 'sg-2', name: 'Single Central Record', description: 'Compliant and up to date SCR' },
        { id: 'sg-3', name: 'DSL Arrangements', description: 'Trained DSL and deputies' },
        { id: 'sg-4', name: 'Staff Training', description: 'All staff trained on safeguarding' },
        { id: 'sg-5', name: 'Referral Procedures', description: 'Clear and followed procedures' },
        { id: 'sg-6', name: 'Safer Recruitment', description: 'Robust recruitment practices' },
        { id: 'sg-7', name: 'CPOMS/Recording', description: 'Effective concern recording' },
        { id: 'sg-8', name: 'Prevent Duty', description: 'Prevent duty implemented' },
        { id: 'sg-9', name: 'Online Safety', description: 'Effective online safety measures' },
        { id: 'sg-10', name: 'Site Security', description: 'Appropriate site security' }
    ],
    keyIndicators: [
        'Culture of safeguarding is embedded',
        'All staff know how to report concerns',
        'DSL arrangements are robust',
        'SCR is compliant',
        'Referrals are timely and appropriate',
        'Pupils feel safe'
    ]
};

// Helper functions
export function calculateAIRating(evidenceCount: number, requiredCount: number): string {
    if (evidenceCount === 0) return 'not_assessed';
    const ratio = evidenceCount / requiredCount;
    if (ratio >= 1.0) return 'exceptional';
    if (ratio >= 0.8) return 'strong_standard';
    if (ratio >= 0.6) return 'expected_standard';
    if (ratio >= 0.4) return 'needs_attention';
    return 'urgent_improvement';
}

export interface OfstedAssessment {
    schoolRating?: string;
    schoolRationale?: string;
    aiRating?: string;
    aiRationale?: string;
}

export function calculateCategoryReadiness(categoryId: string, assessments: Record<string, OfstedAssessment>): { userScore: number; aiScore: number } {
    const category = OFSTED_FRAMEWORK.find(c => c.id === categoryId);
    if (!category) return { userScore: 0, aiScore: 0 };
    
    let totalUserScore = 0;
    let totalAIScore = 0;
    let assessedCount = 0;
    
    for (const sub of category.subcategories) {
        const assessment = assessments[sub.id];
        if (assessment?.schoolRating && assessment.schoolRating !== 'not_assessed') {
            assessedCount++;
            const rating = OFSTED_RATINGS[assessment.schoolRating as keyof typeof OFSTED_RATINGS];
            totalUserScore += (rating?.score || 0) * 20; // Convert to percentage
        }
    }
    
    const userScore = assessedCount > 0 ? Math.round(totalUserScore / assessedCount) : 0;
    const aiScore = 0; // Would be calculated from evidence scanning
    
    return { userScore, aiScore };
}

export function calculateOverallReadiness(assessments: Record<string, OfstedAssessment>): { userScore: number; aiScore: number } {
    let totalUserScore = 0;
    let totalAIScore = 0;
    let categoryCount = 0;
    
    for (const category of OFSTED_FRAMEWORK) {
        const { userScore, aiScore } = calculateCategoryReadiness(category.id, assessments);
        if (userScore > 0) {
            totalUserScore += userScore;
            categoryCount++;
        }
        totalAIScore += aiScore;
    }
    
    return {
        userScore: categoryCount > 0 ? Math.round(totalUserScore / categoryCount) : 0,
        aiScore: categoryCount > 0 ? Math.round(totalAIScore / categoryCount) : 0
    };
}

// Export for backwards compatibility
export { OFSTED_FRAMEWORK as default };
