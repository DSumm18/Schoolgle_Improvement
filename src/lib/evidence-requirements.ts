// Evidence requirements for each Ofsted area
// Defines what SHOULD be in documents for each area

export interface EvidenceRequirement {
    keyword: string;
    description: string;
    importance: 'critical' | 'important' | 'recommended';
    eefLink?: string; // EEF strategy reference
}

export interface AreaRequirements {
    id: string;
    name: string;
    requirements: EvidenceRequirement[];
    suggestedImprovements: string[];
}

export const EVIDENCE_REQUIREMENTS: Record<string, AreaRequirements> = {
    'behaviour': {
        id: 'behaviour',
        name: 'Behaviour and Attitudes',
        requirements: [
            { keyword: 'attendance', description: 'Clear attendance expectations and procedures', importance: 'critical' },
            { keyword: 'target', description: 'Attendance target (typically 96%+)', importance: 'critical' },
            { keyword: 'persistent absence', description: 'Definition and response to persistent absence', importance: 'critical' },
            { keyword: 'same-day', description: 'Same-day response to unexplained absence', importance: 'important' },
            { keyword: 'intervention', description: 'Intervention strategies for poor attendance', importance: 'important' },
            { keyword: 'safeguarding', description: 'Link between attendance and safeguarding', importance: 'important' },
            { keyword: 'parent', description: 'Parent communication procedures', importance: 'important', eefLink: 'Parental engagement (+4 months)' },
            { keyword: 'reward', description: 'Attendance rewards/recognition system', importance: 'recommended' },
            { keyword: 'punctuality', description: 'Punctuality expectations', importance: 'recommended' },
            { keyword: 'authorised', description: 'Clear guidance on authorised/unauthorised absence', importance: 'recommended' },
        ],
        suggestedImprovements: [
            'Add your school\'s attendance target (national expectation is 96%)',
            'Include same-day response procedures for unexplained absence',
            'Link to safeguarding policy for attendance concerns',
            'Add section on parental engagement strategies (EEF: +4 months progress)',
            'Include data on attendance trends and impact on attainment',
        ]
    },
    'quality-implementation': {
        id: 'quality-implementation',
        name: 'Quality of Education - Implementation',
        requirements: [
            { keyword: 'curriculum', description: 'Clear curriculum structure', importance: 'critical' },
            { keyword: 'sequence', description: 'Learning is sequenced logically', importance: 'critical' },
            { keyword: 'knowledge', description: 'Focus on building knowledge over time', importance: 'critical' },
            { keyword: 'assessment', description: 'Assessment informs teaching', importance: 'critical', eefLink: 'Feedback (+6 months)' },
            { keyword: 'feedback', description: 'Effective feedback practices', importance: 'important', eefLink: 'Feedback (+6 months)' },
            { keyword: 'adaptive', description: 'Teaching adapted for all learners', importance: 'important' },
            { keyword: 'send', description: 'SEND pupils supported effectively', importance: 'important' },
            { keyword: 'cpd', description: 'Staff development/training', importance: 'important' },
            { keyword: 'modelling', description: 'Teachers model learning effectively', importance: 'recommended' },
            { keyword: 'practice', description: 'Opportunities for practice', importance: 'recommended' },
        ],
        suggestedImprovements: [
            'Add examples of how curriculum is sequenced for progression',
            'Include your feedback policy with EEF evidence (+6 months)',
            'Show how teaching is adapted for SEND pupils',
            'Reference metacognition strategies (EEF: +7 months)',
            'Include CPD programme linked to curriculum priorities',
        ]
    },
    'quality-intent': {
        id: 'quality-intent',
        name: 'Quality of Education - Intent',
        requirements: [
            { keyword: 'ambitious', description: 'Ambitious curriculum for all', importance: 'critical' },
            { keyword: 'national curriculum', description: 'Coverage of National Curriculum', importance: 'critical' },
            { keyword: 'progression', description: 'Clear progression model', importance: 'critical' },
            { keyword: 'knowledge', description: 'Knowledge and skills defined', importance: 'important' },
            { keyword: 'vocabulary', description: 'Key vocabulary identified', importance: 'important' },
            { keyword: 'cultural capital', description: 'Building cultural capital', importance: 'important' },
            { keyword: 'disadvantaged', description: 'Provision for disadvantaged pupils', importance: 'important' },
            { keyword: 'send', description: 'Curriculum accessible to SEND', importance: 'important' },
        ],
        suggestedImprovements: [
            'Define how curriculum builds cultural capital',
            'Show how disadvantaged pupils access the full curriculum',
            'Include vocabulary progression across year groups',
            'Add rationale for curriculum choices',
        ]
    },
    'quality-impact': {
        id: 'quality-impact',
        name: 'Quality of Education - Impact',
        requirements: [
            { keyword: 'outcomes', description: 'Pupil outcomes data', importance: 'critical' },
            { keyword: 'progress', description: 'Progress measures', importance: 'critical' },
            { keyword: 'attainment', description: 'Attainment data', importance: 'critical' },
            { keyword: 'reading', description: 'Reading outcomes', importance: 'critical' },
            { keyword: 'phonics', description: 'Phonics results', importance: 'critical' },
            { keyword: 'disadvantaged', description: 'Outcomes for disadvantaged', importance: 'important' },
            { keyword: 'send', description: 'Outcomes for SEND pupils', importance: 'important' },
            { keyword: 'national', description: 'Comparison to national data', importance: 'important' },
        ],
        suggestedImprovements: [
            'Include 3-year trend data for outcomes',
            'Show gap analysis for disadvantaged pupils',
            'Add phonics screening results with comparison to national',
            'Include reading age data and interventions impact',
        ]
    },
    'safeguarding': {
        id: 'safeguarding',
        name: 'Safeguarding',
        requirements: [
            { keyword: 'child protection', description: 'Child protection procedures', importance: 'critical' },
            { keyword: 'dsl', description: 'Designated Safeguarding Lead identified', importance: 'critical' },
            { keyword: 'training', description: 'Staff training requirements', importance: 'critical' },
            { keyword: 'referral', description: 'Referral procedures', importance: 'critical' },
            { keyword: 'record', description: 'Record keeping requirements', importance: 'critical' },
            { keyword: 'concern', description: 'How to report concerns', importance: 'critical' },
            { keyword: 'prevent', description: 'Prevent duty', importance: 'important' },
            { keyword: 'online', description: 'Online safety', importance: 'important' },
            { keyword: 'scr', description: 'Single Central Register', importance: 'important' },
            { keyword: 'safer recruitment', description: 'Safer recruitment practices', importance: 'important' },
        ],
        suggestedImprovements: [
            'Ensure all KCSIE updates are reflected',
            'Add flowchart for reporting concerns',
            'Include online safety procedures',
            'Reference local authority thresholds',
        ]
    },
    'leadership': {
        id: 'leadership',
        name: 'Leadership and Management',
        requirements: [
            { keyword: 'vision', description: 'Clear school vision', importance: 'critical' },
            { keyword: 'strategy', description: 'Improvement strategy', importance: 'critical' },
            { keyword: 'monitoring', description: 'Monitoring and evaluation', importance: 'critical' },
            { keyword: 'governance', description: 'Effective governance', importance: 'critical' },
            { keyword: 'workload', description: 'Staff workload considerations', importance: 'important' },
            { keyword: 'wellbeing', description: 'Staff wellbeing', importance: 'important' },
            { keyword: 'cpd', description: 'Professional development', importance: 'important' },
            { keyword: 'performance', description: 'Performance management', importance: 'recommended' },
        ],
        suggestedImprovements: [
            'Include evidence of impact from monitoring',
            'Show how staff workload is managed',
            'Add governor monitoring visit notes',
            'Link improvement priorities to evidence',
        ]
    },
    'reading': {
        id: 'reading',
        name: 'Reading/Phonics',
        requirements: [
            { keyword: 'phonics', description: 'Systematic synthetic phonics approach', importance: 'critical' },
            { keyword: 'validated', description: 'DfE validated programme', importance: 'critical' },
            { keyword: 'fluency', description: 'Fluency development', importance: 'critical', eefLink: 'Reading comprehension (+6 months)' },
            { keyword: 'comprehension', description: 'Comprehension strategies', importance: 'critical', eefLink: 'Reading comprehension (+6 months)' },
            { keyword: 'decodable', description: 'Decodable books matched to phonics', importance: 'important' },
            { keyword: 'intervention', description: 'Keep-up/catch-up interventions', importance: 'important' },
            { keyword: 'assessment', description: 'Regular phonics assessment', importance: 'important' },
            { keyword: 'home reading', description: 'Home reading expectations', importance: 'recommended' },
        ],
        suggestedImprovements: [
            'Name your validated SSP programme (e.g., Little Wandle)',
            'Include book matching policy',
            'Add same-day intervention procedures',
            'Show phonics screening trends over time',
            'Reference EEF reading comprehension strategies (+6 months)',
        ]
    },
    'send': {
        id: 'send',
        name: 'SEND Provision',
        requirements: [
            { keyword: 'identify', description: 'Early identification procedures', importance: 'critical' },
            { keyword: 'assess', description: 'Assessment of needs', importance: 'critical' },
            { keyword: 'provision', description: 'Provision mapping', importance: 'critical' },
            { keyword: 'review', description: 'Regular review cycle', importance: 'critical' },
            { keyword: 'ehcp', description: 'EHCP processes', importance: 'important' },
            { keyword: 'senco', description: 'SENCO role defined', importance: 'important' },
            { keyword: 'parent', description: 'Parent involvement', importance: 'important' },
            { keyword: 'outcome', description: 'Outcomes for SEND pupils', importance: 'important' },
        ],
        suggestedImprovements: [
            'Include graduated approach flowchart',
            'Add provision map template',
            'Show impact data for interventions',
            'Reference EEF guidance on SEND',
        ]
    },
    'personal-development': {
        id: 'personal-development',
        name: 'Personal Development',
        requirements: [
            { keyword: 'pshe', description: 'PSHE curriculum', importance: 'critical' },
            { keyword: 'rse', description: 'RSE coverage', importance: 'critical' },
            { keyword: 'british values', description: 'British Values taught', importance: 'critical' },
            { keyword: 'character', description: 'Character development', importance: 'important' },
            { keyword: 'enrichment', description: 'Enrichment opportunities', importance: 'important' },
            { keyword: 'wellbeing', description: 'Pupil wellbeing support', importance: 'important' },
            { keyword: 'careers', description: 'Careers guidance (if applicable)', importance: 'recommended' },
        ],
        suggestedImprovements: [
            'Map British Values across curriculum',
            'Include enrichment offer and uptake data',
            'Add pupil voice evidence',
            'Show SMSC development opportunities',
        ]
    },
    'early-years': {
        id: 'early-years',
        name: 'Early Years',
        requirements: [
            { keyword: 'eyfs', description: 'EYFS framework implementation', importance: 'critical' },
            { keyword: 'prime areas', description: 'Prime areas coverage', importance: 'critical' },
            { keyword: 'communication', description: 'Communication and language focus', importance: 'critical' },
            { keyword: 'continuous provision', description: 'Continuous provision', importance: 'important' },
            { keyword: 'assessment', description: 'Ongoing assessment', importance: 'important' },
            { keyword: 'outdoor', description: 'Outdoor learning', importance: 'recommended' },
            { keyword: 'parents', description: 'Parent partnership', importance: 'recommended' },
        ],
        suggestedImprovements: [
            'Include baseline data and progress from starting points',
            'Show GLD trends and comparison to national',
            'Add evidence of communication and language interventions',
            'Include parent engagement strategies',
        ]
    }
};

// Get requirements for an area
export function getRequirementsForArea(areaId: string): AreaRequirements | null {
    return EVIDENCE_REQUIREMENTS[areaId] || null;
}

// Analyze what's present and missing in content
export function analyzeDocumentCompleteness(
    content: string, 
    areaId: string
): {
    found: EvidenceRequirement[];
    missing: EvidenceRequirement[];
    score: number;
    suggestions: string[];
} {
    const requirements = EVIDENCE_REQUIREMENTS[areaId];
    if (!requirements) {
        return { found: [], missing: [], score: 0, suggestions: [] };
    }

    const contentLower = content.toLowerCase();
    const found: EvidenceRequirement[] = [];
    const missing: EvidenceRequirement[] = [];

    for (const req of requirements.requirements) {
        if (contentLower.includes(req.keyword.toLowerCase())) {
            found.push(req);
        } else {
            missing.push(req);
        }
    }

    // Calculate score weighted by importance
    let totalWeight = 0;
    let foundWeight = 0;
    for (const req of requirements.requirements) {
        const weight = req.importance === 'critical' ? 3 : req.importance === 'important' ? 2 : 1;
        totalWeight += weight;
        if (found.includes(req)) {
            foundWeight += weight;
        }
    }

    const score = totalWeight > 0 ? Math.round((foundWeight / totalWeight) * 100) : 0;

    // Get relevant suggestions based on what's missing
    const suggestions: string[] = [];
    const criticalMissing = missing.filter(m => m.importance === 'critical');
    
    if (criticalMissing.length > 0) {
        suggestions.push(`⚠️ CRITICAL: Add ${criticalMissing.map(m => m.description).join(', ')}`);
    }

    // Add EEF-linked suggestions
    const eefMissing = missing.filter(m => m.eefLink);
    for (const m of eefMissing.slice(0, 2)) {
        suggestions.push(`📚 EEF: ${m.description} - ${m.eefLink}`);
    }

    // Add general suggestions from the area
    const generalSuggestions = requirements.suggestedImprovements
        .filter(s => !found.some(f => s.toLowerCase().includes(f.keyword.toLowerCase())))
        .slice(0, 3);
    suggestions.push(...generalSuggestions);

    return { found, missing, score, suggestions };
}

