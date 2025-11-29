// SIAMS (Statutory Inspection of Anglican and Methodist Schools) Framework
// Based on the Church of England Education Office SIAMS Evaluation Schedule

export interface SiamsInspectionQuestion {
    id: string;
    question: string;
    guidance: string;
    evidenceRequired: string[];
}

export interface SiamsStrand {
    id: string;
    name: string;
    shortName: string;
    description: string;
    color: string;
    inspectionQuestions: SiamsInspectionQuestion[];
    keyIndicators: string[];
}

export interface SiamsActionItem {
    id: string;
    title: string;
    description: string;
    strandId: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    owner: string;
    status: 'not_started' | 'in_progress' | 'completed';
}

// The SIAMS Inspection Schedule (2023 onwards)
export const SIAMS_FRAMEWORK: SiamsStrand[] = [
    {
        id: 'vision',
        name: 'Vision and Leadership',
        shortName: 'Vision',
        description: 'How well does the school\'s Christian vision drive its work, enabling all to flourish?',
        color: 'purple',
        inspectionQuestions: [
            {
                id: 'vision-1',
                question: 'How clearly is the school\'s Christian vision articulated and understood by all?',
                guidance: 'The vision should be theologically rooted, distinctive, and clearly expressed in school documentation and practice.',
                evidenceRequired: ['Vision statement', 'School website', 'Policies referencing vision', 'Staff understanding']
            },
            {
                id: 'vision-2',
                question: 'How effectively does the vision shape the strategic direction of the school?',
                guidance: 'School improvement plans should explicitly link to the Christian vision.',
                evidenceRequired: ['School Development Plan', 'Strategic priorities', 'Governor minutes']
            },
            {
                id: 'vision-3',
                question: 'How well do leaders at all levels model and promote the vision?',
                guidance: 'Leaders should be able to articulate how their decisions connect to the vision.',
                evidenceRequired: ['Leadership interviews', 'Decision-making processes', 'Staff feedback']
            },
            {
                id: 'vision-4',
                question: 'How effectively does governance support and challenge the school\'s Christian foundation?',
                guidance: 'Foundation governors should understand their distinctive role.',
                evidenceRequired: ['Governor meeting minutes', 'Governor training records', 'Challenge evidence']
            }
        ],
        keyIndicators: [
            'Vision is theologically rooted and clearly Christian',
            'Vision explicitly drives all school policies and decisions',
            'All stakeholders can articulate the vision and its impact',
            'Foundation governors provide effective support and challenge'
        ]
    },
    {
        id: 'wisdom',
        name: 'Wisdom, Knowledge and Skills',
        shortName: 'Curriculum',
        description: 'How well does the curriculum enable all pupils to flourish?',
        color: 'blue',
        inspectionQuestions: [
            {
                id: 'wisdom-1',
                question: 'How does the curriculum reflect the school\'s Christian vision?',
                guidance: 'Curriculum design should explicitly connect to Christian values and the vision.',
                evidenceRequired: ['Curriculum overview', 'Subject policies', 'Long-term plans']
            },
            {
                id: 'wisdom-2',
                question: 'How well does the curriculum enable pupils to develop spiritually?',
                guidance: 'Spiritual development should be planned across the curriculum, not just in RE and worship.',
                evidenceRequired: ['SMSC mapping', 'Lesson observations', 'Pupil work']
            },
            {
                id: 'wisdom-3',
                question: 'How effectively does the curriculum prepare pupils for life in modern Britain?',
                guidance: 'British Values and respect for diversity should be embedded.',
                evidenceRequired: ['British Values mapping', 'PSHE curriculum', 'Pupil understanding']
            },
            {
                id: 'wisdom-4',
                question: 'How well do all pupils achieve academically, especially the vulnerable?',
                guidance: 'Outcomes for all groups should demonstrate that all are enabled to flourish.',
                evidenceRequired: ['Attainment data', 'Progress data', 'Disadvantaged outcomes']
            }
        ],
        keyIndicators: [
            'Curriculum explicitly reflects Christian vision',
            'Spiritual development is planned and evident',
            'All pupils make good progress regardless of background',
            'Curriculum prepares pupils for diverse modern Britain'
        ]
    },
    {
        id: 'character',
        name: 'Character Development',
        shortName: 'Character',
        description: 'How well does the school develop character through hope, aspiration and courageous advocacy?',
        color: 'orange',
        inspectionQuestions: [
            {
                id: 'character-1',
                question: 'How well does the school develop pupils\' character?',
                guidance: 'Character education should be explicit and linked to Christian values.',
                evidenceRequired: ['Character education programme', 'Behaviour policy', 'Recognition systems']
            },
            {
                id: 'character-2',
                question: 'How effectively does the school instil hope and aspiration in all pupils?',
                guidance: 'Pupils should believe they can achieve and make a difference.',
                evidenceRequired: ['Pupil voice', 'Destination data', 'Careers education']
            },
            {
                id: 'character-3',
                question: 'How well do pupils engage in social action and courageous advocacy?',
                guidance: 'Pupils should be active in making a difference locally and globally.',
                evidenceRequired: ['Charity work', 'Community projects', 'Pupil leadership']
            },
            {
                id: 'character-4',
                question: 'How well do pupils understand ethical concepts and make ethical choices?',
                guidance: 'Pupils should be able to discuss ethical dilemmas and demonstrate moral reasoning.',
                evidenceRequired: ['RE lessons', 'PSHE', 'Pupil discussions', 'Behaviour evidence']
            }
        ],
        keyIndicators: [
            'Explicit character education programme linked to vision',
            'Pupils demonstrate hope and high aspirations',
            'Active engagement in social action at all levels',
            'Pupils can articulate ethical reasoning'
        ]
    },
    {
        id: 'community',
        name: 'Community and Living Well Together',
        shortName: 'Community',
        description: 'How well do relationships reflect the school\'s Christian vision?',
        color: 'teal',
        inspectionQuestions: [
            {
                id: 'community-1',
                question: 'How well do relationships across the school community reflect the Christian vision?',
                guidance: 'Relationships should be characterised by forgiveness, reconciliation, and respect.',
                evidenceRequired: ['Behaviour policy', 'Restorative approaches', 'Staff/pupil relationships']
            },
            {
                id: 'community-2',
                question: 'How effectively does the school support mental health and wellbeing?',
                guidance: 'Wellbeing should be prioritised for all members of the school community.',
                evidenceRequired: ['Wellbeing policy', 'Support systems', 'Staff wellbeing']
            },
            {
                id: 'community-3',
                question: 'How strong are partnerships with parents, church, and community?',
                guidance: 'Church school partnership should be active and mutually beneficial.',
                evidenceRequired: ['Church links', 'Parent engagement', 'Community partnerships']
            },
            {
                id: 'community-4',
                question: 'How inclusive is the school community?',
                guidance: 'All should feel welcomed, valued, and able to participate fully.',
                evidenceRequired: ['Inclusion policy', 'SEND provision', 'Vulnerable groups support']
            }
        ],
        keyIndicators: [
            'Relationships exemplify Christian values of forgiveness and reconciliation',
            'Mental health and wellbeing are prioritised for all',
            'Strong, active church school partnership',
            'Genuinely inclusive community where all belong'
        ]
    },
    {
        id: 'dignity',
        name: 'Dignity and Respect',
        shortName: 'Dignity',
        description: 'How well does the school ensure dignity and respect for all?',
        color: 'rose',
        inspectionQuestions: [
            {
                id: 'dignity-1',
                question: 'How well does the school ensure all are treated with dignity?',
                guidance: 'Every person should be valued as made in the image of God.',
                evidenceRequired: ['Equality policy', 'Anti-bullying policy', 'Incident records']
            },
            {
                id: 'dignity-2',
                question: 'How effectively does the school tackle prejudice and discrimination?',
                guidance: 'There should be clear processes and zero tolerance for discrimination.',
                evidenceRequired: ['Discrimination incidents', 'Response procedures', 'Training records']
            },
            {
                id: 'dignity-3',
                question: 'How well do pupils understand and respect difference and diversity?',
                guidance: 'Pupils should celebrate diversity as reflecting God\'s creation.',
                evidenceRequired: ['Curriculum coverage', 'Pupil voice', 'Displays and resources']
            },
            {
                id: 'dignity-4',
                question: 'How well are protected characteristics respected and understood?',
                guidance: 'Age-appropriate teaching about all protected characteristics.',
                evidenceRequired: ['RSE curriculum', 'PSHE coverage', 'Staff training']
            }
        ],
        keyIndicators: [
            'All treated with dignity as made in image of God',
            'Prejudice and discrimination actively challenged',
            'Diversity celebrated and respected',
            'Protected characteristics taught appropriately'
        ]
    },
    {
        id: 'worship',
        name: 'Impact of Collective Worship',
        shortName: 'Worship',
        description: 'How well does collective worship enable all to flourish spiritually?',
        color: 'violet',
        inspectionQuestions: [
            {
                id: 'worship-1',
                question: 'How central is collective worship to the life of the school?',
                guidance: 'Worship should be the heartbeat of the school community.',
                evidenceRequired: ['Worship timetable', 'Worship policy', 'Planning documents']
            },
            {
                id: 'worship-2',
                question: 'How well does worship reflect the school\'s Christian vision and Anglican/Methodist tradition?',
                guidance: 'Worship should be distinctively Christian and reflect denominational tradition.',
                evidenceRequired: ['Worship themes', 'Use of liturgy', 'Christian calendar']
            },
            {
                id: 'worship-3',
                question: 'How inclusive and invitational is collective worship?',
                guidance: 'All should be able to participate while respecting individual beliefs.',
                evidenceRequired: ['Withdrawal procedures', 'Inclusive language', 'Visitor feedback']
            },
            {
                id: 'worship-4',
                question: 'How well do pupils engage with and respond to worship?',
                guidance: 'Pupils should be actively engaged, not passive observers.',
                evidenceRequired: ['Pupil-led worship', 'Prayer spaces', 'Pupil voice on worship']
            },
            {
                id: 'worship-5',
                question: 'How effectively does worship contribute to spiritual development?',
                guidance: 'Worship should provide opportunities for stillness, reflection, and encounter.',
                evidenceRequired: ['Reflection opportunities', 'Impact evidence', 'Spiritual development']
            }
        ],
        keyIndicators: [
            'Worship is central heartbeat of school',
            'Distinctively Christian in Anglican/Methodist tradition',
            'Inclusive and invitational to all',
            'Pupils actively engaged and lead worship',
            'Clear impact on spiritual development'
        ]
    },
    {
        id: 're',
        name: 'Effectiveness of Religious Education',
        shortName: 'RE',
        description: 'How effective is Religious Education in enabling pupils to flourish?',
        color: 'emerald',
        inspectionQuestions: [
            {
                id: 're-1',
                question: 'How well does RE reflect the Church of England Statement of Entitlement?',
                guidance: 'RE should be academically rigorous, have a significant Christian content, and enable pupils to engage with questions of meaning.',
                evidenceRequired: ['RE policy', 'Curriculum overview', 'Statement of Entitlement audit']
            },
            {
                id: 're-2',
                question: 'How high quality is RE teaching?',
                guidance: 'RE should be taught by confident, well-trained staff using effective pedagogy.',
                evidenceRequired: ['Lesson observations', 'Pupil work', 'Teacher subject knowledge']
            },
            {
                id: 're-3',
                question: 'How well do pupils achieve in RE?',
                guidance: 'Outcomes in RE should be at least in line with core subjects.',
                evidenceRequired: ['RE assessment data', 'Progress tracking', 'GCSE results if applicable']
            },
            {
                id: 're-4',
                question: 'How well does RE prepare pupils to live in diverse society?',
                guidance: 'Pupils should learn about Christianity and other worldviews.',
                evidenceRequired: ['Curriculum coverage', 'World religion content', 'Pupil understanding']
            },
            {
                id: 're-5',
                question: 'How effectively does RE enable pupils to engage with big questions?',
                guidance: 'RE should provoke curiosity and enable theological thinking.',
                evidenceRequired: ['Discussion evidence', 'Written work', 'Pupil voice']
            }
        ],
        keyIndicators: [
            'RE meets Statement of Entitlement requirements',
            'High-quality teaching by confident staff',
            'Strong pupil outcomes comparable to core subjects',
            'Good coverage of Christianity and other worldviews',
            'Pupils can engage theologically with big questions'
        ]
    }
];

// SIAMS Ratings
export const SIAMS_RATINGS = {
    'excellent': { label: 'Excellent', color: 'bg-green-500', description: 'Exceptional practice' },
    'good': { label: 'Good', color: 'bg-blue-500', description: 'Effective practice' },
    'requires_improvement': { label: 'Requires Improvement', color: 'bg-yellow-500', description: 'Some weaknesses' },
    'ineffective': { label: 'Ineffective', color: 'bg-red-500', description: 'Significant weaknesses' },
    'not_assessed': { label: 'Not Assessed', color: 'bg-gray-400', description: 'Awaiting assessment' }
};

// Evidence keywords for SIAMS matching
export const SIAMS_EVIDENCE_KEYWORDS: Record<string, string[]> = {
    'vision': [
        'christian vision', 'vision statement', 'theologically rooted', 'flourish',
        'foundation governors', 'strategic direction', 'church school', 'diocese'
    ],
    'wisdom': [
        'spiritual development', 'smsc', 'curriculum', 'british values',
        'cultural capital', 'achievement', 'progress', 'academic'
    ],
    'character': [
        'character education', 'hope', 'aspiration', 'courageous advocacy',
        'social action', 'charity', 'ethical', 'moral', 'values'
    ],
    'community': [
        'relationships', 'forgiveness', 'reconciliation', 'wellbeing',
        'mental health', 'church partnership', 'community', 'inclusion'
    ],
    'dignity': [
        'dignity', 'respect', 'image of god', 'equality', 'diversity',
        'anti-bullying', 'protected characteristics', 'discrimination'
    ],
    'worship': [
        'collective worship', 'assembly', 'prayer', 'reflection',
        'anglican', 'methodist', 'liturgy', 'christian calendar', 'spiritual'
    ],
    're': [
        'religious education', 're curriculum', 'statement of entitlement',
        'christianity', 'world religions', 'theology', 'big questions'
    ]
};

// Calculate strand readiness
export function calculateStrandReadiness(strandId: string, assessments: Record<string, any>): { userScore: number; evidenceCount: number } {
    const strand = SIAMS_FRAMEWORK.find(s => s.id === strandId);
    if (!strand) return { userScore: 0, evidenceCount: 0 };
    
    let totalScore = 0;
    let assessedCount = 0;
    let evidenceCount = 0;
    
    for (const question of strand.inspectionQuestions) {
        const assessment = assessments[question.id];
        if (assessment?.rating && assessment.rating !== 'not_assessed') {
            assessedCount++;
            const score = assessment.rating === 'excellent' ? 100 :
                         assessment.rating === 'good' ? 75 :
                         assessment.rating === 'requires_improvement' ? 50 : 25;
            totalScore += score;
        }
        if (assessment?.evidenceCount) {
            evidenceCount += assessment.evidenceCount;
        }
    }
    
    const userScore = assessedCount > 0 ? Math.round(totalScore / assessedCount) : 0;
    return { userScore, evidenceCount };
}

// Calculate overall SIAMS readiness
export function calculateOverallSiamsReadiness(assessments: Record<string, any>): { userScore: number; totalEvidence: number } {
    let totalScore = 0;
    let totalEvidence = 0;
    let strandCount = 0;
    
    for (const strand of SIAMS_FRAMEWORK) {
        const { userScore, evidenceCount } = calculateStrandReadiness(strand.id, assessments);
        if (userScore > 0) {
            totalScore += userScore;
            strandCount++;
        }
        totalEvidence += evidenceCount;
    }
    
    return {
        userScore: strandCount > 0 ? Math.round(totalScore / strandCount) : 0,
        totalEvidence
    };
}

