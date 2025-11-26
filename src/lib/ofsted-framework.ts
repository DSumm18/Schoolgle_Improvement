import { FileText, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

// --- Types ---

export interface ActionNote {
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: Date;
    type: 'user_note' | 'system_update';
}

export interface ActionItem {
    id: string;
    description: string;
    rationale?: string; // Why is this action needed?
    assignee?: string;
    startDate?: string;
    dueDate?: string;
    priority: 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'completed';
    category?: string; // Linked to Ofsted Category
    createdAt: string;
    updatedAt: string;
    notes?: ActionNote[];
}

export interface OfstedSubCategory {
    id: string;
    name: string;
    description: string;
    evidenceRequired: string[];
    guidanceSummary?: string;
    guidanceLink?: string;
}

export interface OfstedCategory {
    id: string;
    name: string;
    description: string;
    grade: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_assessed';
    color: string;
    subcategories: OfstedSubCategory[];
    guidanceSummary?: string;
    guidanceLink?: string;
}

// --- Data ---

const BASE_GOV_URL = "https://www.gov.uk/government/publications/education-inspection-framework/education-inspection-framework";

export const OFSTED_FRAMEWORK: OfstedCategory[] = [
    {
        id: 'quality_of_education',
        name: 'Quality of Education',
        description: 'The quality of education provided to all pupils',
        grade: 'not_assessed',
        color: 'rose',
        guidanceSummary: "This is the core of the inspection. It focuses on the '3 Is': Intent (what you want pupils to learn), Implementation (how you teach and assess it), and Impact (what pupils actually achieve).",
        guidanceLink: BASE_GOV_URL,
        subcategories: [
            {
                id: 'curriculum_intent',
                name: 'Curriculum Intent',
                description: 'Is the curriculum ambitious and designed to give all learners the knowledge and cultural capital they need to succeed in life?',
                guidanceSummary: "Your curriculum must be ambitious for all pupils, including those with SEND. It should be coherently planned and sequenced towards cumulatively sufficient knowledge and skills.",
                evidenceRequired: [
                    'Curriculum policy documents',
                    'Subject progression maps',
                    'Lesson plans showing sequence',
                    'Minutes from curriculum planning meetings'
                ]
            },
            {
                id: 'curriculum_implementation',
                name: 'Curriculum Implementation',
                description: 'How is the curriculum taught and assessed in order to support pupils to build their knowledge and to apply that knowledge as skills?',
                guidanceSummary: "Teachers should have good subject knowledge and present matter clearly. Assessment should be used to check understanding and inform teaching, not just for data collection.",
                evidenceRequired: [
                    'Lesson observations',
                    'Work scrutiny samples',
                    'Teacher CPD records',
                    'Assessment data analysis'
                ]
            },
            {
                id: 'curriculum_impact',
                name: 'Curriculum Impact',
                description: 'What do pupils know and remember? How well are they prepared for the next stage of education?',
                guidanceSummary: "Pupils should develop detailed knowledge and skills across the curriculum and achieve well. They should be ready for the next stage of education, employment, or training.",
                evidenceRequired: [
                    'Internal assessment results',
                    'National test results (SATs/GCSEs)',
                    'Destinations data',
                    'Pupil voice surveys'
                ]
            }
        ]
    },
    {
        id: 'behaviour_and_attitudes',
        name: 'Behaviour and Attitudes',
        description: 'The behaviour and attitudes of pupils',
        grade: 'not_assessed',
        color: 'teal',
        guidanceSummary: "This judgement focuses on creating a calm, safe, and orderly environment. It looks at how leaders and staff create a culture where bullying is not tolerated and attendance is high.",
        guidanceLink: BASE_GOV_URL,
        subcategories: [
            {
                id: 'behaviour_policy',
                name: 'Behaviour Policy & Practice',
                description: 'Is there a positive environment where bullying is not tolerated?',
                guidanceSummary: "Leaders must have high expectations for behaviour. Staff should apply the policy consistently and fairly. Bullying must be dealt with quickly and effectively.",
                evidenceRequired: [
                    'Behaviour policy',
                    'Incident logs (bullying/racism)',
                    'Exclusion data',
                    'Attendance records'
                ]
            },
            {
                id: 'attendance',
                name: 'Attendance & Punctuality',
                description: 'Do pupils attend regularly and on time?',
                guidanceSummary: "Schools must have clear and effective strategies to promote high attendance and reduce persistent absence.",
                evidenceRequired: [
                    'Attendance registers',
                    'Absence analysis reports',
                    'Case studies of intervention'
                ]
            }
        ]
    },
    {
        id: 'personal_development',
        name: 'Personal Development',
        description: 'The personal development of pupils',
        grade: 'not_assessed',
        color: 'orange',
        guidanceSummary: "This is about preparing pupils for life in modern Britain. It covers citizenship, character building, physical and mental health, and spiritual, moral, social, and cultural (SMSC) development.",
        guidanceLink: BASE_GOV_URL,
        subcategories: [
            {
                id: 'spiritual_moral_social_cultural',
                name: 'SMSC Development',
                description: 'Provision for spiritual, moral, social and cultural development.',
                guidanceSummary: "The curriculum should extend beyond the academic to support pupils' broader development, enabling them to be responsible, respectful, and active citizens.",
                evidenceRequired: [
                    'Assembly schedules',
                    'PSHE curriculum plans',
                    'Trip and visit logs',
                    'Student council minutes'
                ]
            },
            {
                id: 'careers_guidance',
                name: 'Careers Guidance',
                description: 'Unbiased careers advice and guidance.',
                guidanceSummary: "Secondary schools must provide effective careers guidance (Gatsby Benchmarks). All schools should prepare pupils for future success.",
                evidenceRequired: [
                    'Careers programme',
                    'Work experience records',
                    'Gatsby benchmark analysis'
                ]
            }
        ]
    },
    {
        id: 'leadership_and_management',
        name: 'Leadership and Management',
        description: 'The effectiveness of leadership and management',
        grade: 'not_assessed',
        color: 'violet',
        guidanceSummary: "Leaders must have a clear and ambitious vision. They should engage with staff and consider their wellbeing. Governance must be effective, and safeguarding is a critical priority.",
        guidanceLink: BASE_GOV_URL,
        subcategories: [
            {
                id: 'safeguarding',
                name: 'Safeguarding',
                description: 'Is safeguarding effective?',
                guidanceSummary: "There must be a culture of vigilance. Staff must be trained to identify risks, and referrals must be timely and effective.",
                evidenceRequired: [
                    'Single Central Record (SCR)',
                    'Safeguarding policy',
                    'Staff training records',
                    'Referral logs'
                ]
            },
            {
                id: 'staff_wellbeing',
                name: 'Staff Wellbeing',
                description: 'Engagement with staff and concern for their wellbeing.',
                guidanceSummary: "Leaders should be conscious of staff workload and take realistic steps to manage it. Staff should feel supported.",
                evidenceRequired: [
                    'Staff surveys',
                    'Wellbeing policy',
                    'Workload reduction initiatives'
                ]
            },
            {
                id: 'governance',
                name: 'Governance',
                description: 'Effectiveness of the governing body.',
                guidanceSummary: "Governors must ensure clarity of vision, hold leaders to account for educational performance, and oversee financial performance.",
                evidenceRequired: [
                    'Governor meeting minutes',
                    'Governor visit reports',
                    'Headteacher reports to governors'
                ]
            }
        ]
    },
    {
        id: 'early_years',
        name: 'Early Years Provision',
        description: 'The quality of early years education',
        grade: 'not_assessed',
        color: 'blue',
        guidanceSummary: "For schools with nursery/reception. It focuses on the EYFS curriculum, communication and language, and physical, personal, social, and emotional development.",
        guidanceLink: BASE_GOV_URL,
        subcategories: [
            {
                id: 'early_years_curriculum',
                name: 'EYFS Curriculum',
                description: 'Curriculum coherence and sequencing in Early Years.',
                guidanceSummary: "The EYFS curriculum must be ambitious and designed to give children the knowledge, self-belief, and cultural capital they need to succeed.",
                evidenceRequired: [
                    'EYFS curriculum maps',
                    'Learning journey samples',
                    'Baseline assessment data'
                ]
            }
        ]
    }
];

// --- Helpers ---

export const calculateAIRating = (evidenceCount: number, requiredCount: number): 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' => {
    const percentage = (evidenceCount / requiredCount) * 100;

    if (percentage >= 90) return 'outstanding';
    if (percentage >= 70) return 'good';
    if (percentage >= 40) return 'requires_improvement';
    return 'inadequate';
};

export const getGradeScore = (grade: string): number => {
    switch (grade) {
        case 'outstanding': return 100;
        case 'good': return 80;
        case 'requires_improvement': return 50;
        case 'inadequate': return 20;
        default: return 0;
    }
};

export const calculateCategoryReadiness = (categoryId: string, assessments: Record<string, any>) => {
    const category = OFSTED_FRAMEWORK.find(c => c.id === categoryId);
    if (!category) return { userScore: 0, aiScore: 0 };

    let totalUserScore = 0;
    let totalAIScore = 0;
    let count = 0;

    category.subcategories.forEach(sub => {
        const assessment = assessments[sub.id] || {};
        totalUserScore += getGradeScore(assessment.schoolRating || 'not_assessed');
        totalAIScore += getGradeScore(assessment.aiRating || 'not_assessed');
        count++;
    });

    return {
        userScore: count > 0 ? Math.round(totalUserScore / count) : 0,
        aiScore: count > 0 ? Math.round(totalAIScore / count) : 0
    };
};

export const calculateOverallReadiness = (assessments: Record<string, any>) => {
    let totalUserScore = 0;
    let totalAIScore = 0;
    let count = 0;

    OFSTED_FRAMEWORK.forEach(cat => {
        const { userScore, aiScore } = calculateCategoryReadiness(cat.id, assessments);
        totalUserScore += userScore;
        totalAIScore += aiScore;
        count++;
    });

    return {
        userScore: count > 0 ? Math.round(totalUserScore / count) : 0,
        aiScore: count > 0 ? Math.round(totalAIScore / count) : 0
    };
};

/**
 * Simple keyword-based matching (legacy - will be replaced by AI matcher)
 * For backward compatibility with existing scan route
 */
export function matchDocumentToCategories(text: string): {
    categoryId: string;
    subcategoryId: string;
    evidenceItem: string;
    confidence: number;
}[] {
    const matches: any[] = [];

    // Simple keyword matching as fallback
    OFSTED_FRAMEWORK.forEach(category => {
        category.subcategories.forEach(sub => {
            sub.evidenceRequired.forEach(evidence => {
                const keywords = evidence.toLowerCase().split(' ').filter(w => w.length > 3);
                const matchCount = keywords.filter(kw =>
                    text.toLowerCase().includes(kw)
                ).length;

                if (matchCount > 2) {
                    matches.push({
                        categoryId: category.id,
                        subcategoryId: sub.id,
                        evidenceItem: evidence,
                        confidence: Math.min(matchCount / keywords.length, 1)
                    });
                }
            });
        });
    });

    return matches;
}
