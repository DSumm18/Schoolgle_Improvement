import { NextRequest, NextResponse } from 'next/server';

// Ofsted framework keywords for matching
const FRAMEWORK_KEYWORDS: Record<string, string[]> = {
    'quality-intent': [
        'curriculum', 'intent', 'planning', 'scheme of work', 'progression',
        'knowledge', 'skills', 'sequencing', 'ambitious', 'coverage',
        'national curriculum', 'subject leader', 'long term plan', 'medium term'
    ],
    'quality-implementation': [
        'teaching', 'lesson', 'pedagogy', 'explanation', 'modelling',
        'practice', 'feedback', 'assessment', 'questioning', 'adaptive',
        'scaffolding', 'differentiation', 'challenge', 'support', 'CPD'
    ],
    'quality-impact': [
        'outcomes', 'progress', 'attainment', 'results', 'data',
        'assessment', 'phonics', 'reading', 'writing', 'maths',
        'end of key stage', 'SATs', 'GLD', 'expected standard'
    ],
    'behaviour': [
        'behaviour', 'attendance', 'punctuality', 'exclusion', 'attitude',
        'conduct', 'respect', 'bullying', 'relationships', 'rules',
        'expectations', 'rewards', 'sanctions', 'persistent absence'
    ],
    'personal-development': [
        'PSHE', 'RSE', 'character', 'resilience', 'wellbeing',
        'mental health', 'British values', 'SMSC', 'enrichment',
        'extra-curricular', 'clubs', 'trips', 'visits', 'careers'
    ],
    'leadership': [
        'leadership', 'governance', 'vision', 'strategy', 'monitoring',
        'evaluation', 'CPD', 'staff', 'workload', 'wellbeing',
        'safeguarding', 'SCR', 'single central register', 'policy'
    ],
    'safeguarding': [
        'safeguarding', 'child protection', 'DSL', 'CPOMS', 'concern',
        'disclosure', 'referral', 'LADO', 'DBS', 'safer recruitment',
        'prevent', 'FGM', 'CSE', 'county lines', 'radicalisation'
    ],
    'send': [
        'SEND', 'SEN', 'EHCP', 'IEP', 'provision map', 'intervention',
        'inclusion', 'SENCO', 'graduated approach', 'assess plan do review',
        'additional needs', 'learning support', 'speech and language'
    ],
    'early-years': [
        'EYFS', 'early years', 'reception', 'nursery', 'GLD',
        'prime areas', 'specific areas', 'characteristics of learning',
        'continuous provision', 'adult-led', 'child-initiated', 'outdoor'
    ],
    'reading': [
        'reading', 'phonics', 'decoding', 'fluency', 'comprehension',
        'Little Wandle', 'Read Write Inc', 'book band', 'guided reading',
        'SSP', 'systematic synthetic phonics', 'decodable books'
    ]
};

interface ScannedFile {
    name: string;
    path: string;
    type: string;
    size: number;
    content?: string;
}

interface EvidenceMatch {
    fileId: string;
    fileName: string;
    filePath: string;
    frameworkArea: string;
    frameworkAreaLabel: string;
    confidence: number;
    matchedKeywords: string[];
    relevantExcerpt: string;
}

function analyzeFileForEvidence(file: ScannedFile): EvidenceMatch[] {
    const matches: EvidenceMatch[] = [];
    const content = (file.content || file.name + ' ' + file.path).toLowerCase();
    
    const areaLabels: Record<string, string> = {
        'quality-intent': 'Quality of Education - Intent',
        'quality-implementation': 'Quality of Education - Implementation',
        'quality-impact': 'Quality of Education - Impact',
        'behaviour': 'Behaviour and Attitudes',
        'personal-development': 'Personal Development',
        'leadership': 'Leadership and Management',
        'safeguarding': 'Safeguarding',
        'send': 'SEND Provision',
        'early-years': 'Early Years',
        'reading': 'Reading/Phonics'
    };
    
    for (const [area, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
        const matchedKeywords = keywords.filter(kw => content.includes(kw.toLowerCase()));
        
        if (matchedKeywords.length > 0) {
            // Calculate confidence based on number of keyword matches
            const confidence = Math.min(0.95, 0.3 + (matchedKeywords.length * 0.15));
            
            // Find relevant excerpt
            let excerpt = '';
            for (const kw of matchedKeywords) {
                const idx = content.indexOf(kw.toLowerCase());
                if (idx !== -1) {
                    const start = Math.max(0, idx - 50);
                    const end = Math.min(content.length, idx + kw.length + 50);
                    excerpt = '...' + content.substring(start, end) + '...';
                    break;
                }
            }
            
            matches.push({
                fileId: `local-${file.name}-${Date.now()}`,
                fileName: file.name,
                filePath: file.path,
                frameworkArea: area,
                frameworkAreaLabel: areaLabels[area] || area,
                confidence,
                matchedKeywords,
                relevantExcerpt: excerpt || `File: ${file.name}`
            });
        }
    }
    
    return matches;
}

export async function POST(req: NextRequest) {
    try {
        const { files } = await req.json();
        
        if (!files || !Array.isArray(files)) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }
        
        const allMatches: EvidenceMatch[] = [];
        const processedFiles: string[] = [];
        
        for (const file of files) {
            const matches = analyzeFileForEvidence(file);
            allMatches.push(...matches);
            processedFiles.push(file.name);
        }
        
        // Group matches by framework area
        const matchesByArea: Record<string, EvidenceMatch[]> = {};
        for (const match of allMatches) {
            if (!matchesByArea[match.frameworkArea]) {
                matchesByArea[match.frameworkArea] = [];
            }
            matchesByArea[match.frameworkArea].push(match);
        }
        
        // Sort each area by confidence
        for (const area of Object.keys(matchesByArea)) {
            matchesByArea[area].sort((a, b) => b.confidence - a.confidence);
        }
        
        return NextResponse.json({
            success: true,
            totalFiles: files.length,
            processedFiles: processedFiles.length,
            totalMatches: allMatches.length,
            matchesByArea,
            allMatches
        });
        
    } catch (error: any) {
        console.error('Analysis error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

