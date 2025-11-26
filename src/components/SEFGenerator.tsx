"use client";

import { useState } from 'react';
import { 
    FileText, Download, RefreshCw, CheckCircle, AlertTriangle,
    TrendingUp, BookOpen, Users, Shield, Eye, Calendar,
    ChevronDown, ChevronRight, Sparkles, GraduationCap, Copy, Printer
} from 'lucide-react';

interface SEFSection {
    id: string;
    title: string;
    ofstedArea: string;
    currentGrade: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_assessed';
    narrative: string;
    strengths: string[];
    areasForDevelopment: string[];
    evidence: string[];
    actions: string[];
    impact: string;
    nextSteps: string;
}

interface SEFData {
    schoolName: string;
    lastUpdated: string;
    overallEffectiveness: string;
    sections: SEFSection[];
}

interface SEFGeneratorProps {
    schoolName?: string;
    assessments?: Record<string, any>;
    actions?: any[];
    observations?: any[];
    onClose?: () => void;
}

const OFSTED_SECTIONS = [
    {
        id: 'quality-of-education',
        title: 'Quality of Education',
        ofstedArea: 'Quality of Education',
        icon: BookOpen,
        color: 'rose',
        subSections: ['Intent', 'Implementation', 'Impact']
    },
    {
        id: 'behaviour-attitudes',
        title: 'Behaviour and Attitudes',
        ofstedArea: 'Behaviour and Attitudes',
        icon: Users,
        color: 'teal'
    },
    {
        id: 'personal-development',
        title: 'Personal Development',
        ofstedArea: 'Personal Development',
        icon: TrendingUp,
        color: 'orange'
    },
    {
        id: 'leadership-management',
        title: 'Leadership and Management',
        ofstedArea: 'Leadership and Management',
        icon: Shield,
        color: 'violet'
    }
];

const GRADE_COLORS = {
    outstanding: 'bg-green-100 text-green-800 border-green-300',
    good: 'bg-blue-100 text-blue-800 border-blue-300',
    requires_improvement: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    inadequate: 'bg-red-100 text-red-800 border-red-300',
    not_assessed: 'bg-gray-100 text-gray-600 border-gray-300'
};

export default function SEFGenerator({
    schoolName = 'Your School',
    assessments = {},
    actions = [],
    observations = [],
    onClose
}: SEFGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSEF, setGeneratedSEF] = useState<SEFData | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quality-of-education']));
    const [activeView, setActiveView] = useState<'generate' | 'preview' | 'export'>('generate');

    const toggleSection = (id: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedSections(newExpanded);
    };

    const generateSEF = async () => {
        setIsGenerating(true);
        
        // Simulate AI generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const sections: SEFSection[] = OFSTED_SECTIONS.map(section => {
            // Calculate grade based on assessments
            let grade: SEFSection['currentGrade'] = 'not_assessed';
            const relatedAssessments = Object.entries(assessments)
                .filter(([key]) => key.toLowerCase().includes(section.id.split('-')[0]));
            
            if (relatedAssessments.length > 0) {
                const avgScore = relatedAssessments.reduce((acc, [_, v]) => {
                    const score = v.schoolRating === 'Outstanding' ? 4 :
                                  v.schoolRating === 'Good' ? 3 :
                                  v.schoolRating === 'Requires Improvement' ? 2 : 1;
                    return acc + score;
                }, 0) / relatedAssessments.length;
                
                grade = avgScore >= 3.5 ? 'outstanding' :
                        avgScore >= 2.5 ? 'good' :
                        avgScore >= 1.5 ? 'requires_improvement' : 'inadequate';
            }
            
            return {
                id: section.id,
                title: section.title,
                ofstedArea: section.ofstedArea,
                currentGrade: grade,
                narrative: generateNarrative(section.id, grade),
                strengths: generateStrengths(section.id),
                areasForDevelopment: generateAFD(section.id),
                evidence: generateEvidenceList(section.id),
                actions: generateActionsList(section.id),
                impact: generateImpact(section.id),
                nextSteps: generateNextSteps(section.id)
            };
        });
        
        setGeneratedSEF({
            schoolName,
            lastUpdated: new Date().toISOString(),
            overallEffectiveness: calculateOverall(sections),
            sections
        });
        
        setIsGenerating(false);
        setActiveView('preview');
    };

    const generateNarrative = (sectionId: string, grade: string): string => {
        const narratives: Record<string, string> = {
            'quality-of-education': `At ${schoolName}, we have developed a curriculum that is ambitious for all pupils, including those with SEND. Our curriculum is carefully sequenced to build knowledge progressively, ensuring pupils develop deep understanding over time.\n\nTeachers demonstrate strong subject knowledge and use effective pedagogical approaches. We have invested in validated schemes (e.g., Little Wandle for phonics, White Rose for mathematics) and ensure these are implemented with fidelity.\n\nPupil outcomes demonstrate that the majority of pupils, including disadvantaged pupils and those with SEND, are achieving well. Our reading outcomes show sustained improvement, with phonics pass rates above national average.`,
            'behaviour-attitudes': `Behaviour at ${schoolName} is consistently good. We have high expectations which are clearly communicated and consistently applied. Pupils understand our behaviour expectations and the vast majority meet them.\n\nAttendance is a priority. We have robust systems to monitor and improve attendance, with particular focus on persistent absence and vulnerable groups. Our attendance figures are in line with or above national averages.\n\nPupils demonstrate positive attitudes to learning. They are engaged, motivated, and take pride in their work.`,
            'personal-development': `${schoolName} provides a rich and varied curriculum that develops pupils' character, resilience, and fundamental British values. Our PSHE curriculum is comprehensive and age-appropriate.\n\nWe provide extensive enrichment opportunities including clubs, visits, and visitors. All pupils have access to these opportunities regardless of background.\n\nPupils are well-prepared for life in modern Britain. They understand and respect diversity, and are equipped to be responsible citizens.`,
            'leadership-management': `Leaders at ${schoolName} have a clear vision for the school and high ambitions for all pupils. We have developed a culture of continuous improvement underpinned by evidence-based practice.\n\nGovernance is strong, with governors providing appropriate support and challenge. Staff workload and wellbeing are priorities, and we have taken effective action to address these.\n\nSafeguarding is effective. All staff understand their responsibilities, and appropriate policies and procedures are in place.`
        };
        return narratives[sectionId] || 'Narrative to be completed.';
    };

    const generateStrengths = (sectionId: string): string[] => {
        const strengths: Record<string, string[]> = {
            'quality-of-education': [
                'Curriculum is ambitious and well-sequenced',
                'Validated schemes implemented with fidelity',
                'Strong phonics outcomes above national average',
                'Teachers demonstrate secure subject knowledge',
                'Effective use of assessment to identify gaps'
            ],
            'behaviour-attitudes': [
                'High expectations consistently applied',
                'Attendance above national average',
                'Positive learning culture embedded',
                'Low exclusion rates',
                'Pupils demonstrate respect and tolerance'
            ],
            'personal-development': [
                'Rich enrichment programme accessible to all',
                'PSHE curriculum is comprehensive',
                'British values explicitly taught',
                'Pupils understand diversity and inclusion',
                'Strong careers guidance (where applicable)'
            ],
            'leadership-management': [
                'Clear vision and high ambitions',
                'Evidence-based approach to improvement',
                'Effective governance',
                'Staff wellbeing prioritised',
                'Safeguarding is effective'
            ]
        };
        return strengths[sectionId] || [];
    };

    const generateAFD = (sectionId: string): string[] => {
        const afd: Record<string, string[]> = {
            'quality-of-education': [
                'Continue to embed new curriculum in foundation subjects',
                'Further develop adaptive teaching for SEND pupils',
                'Improve consistency of feedback practice'
            ],
            'behaviour-attitudes': [
                'Reduce persistent absence for disadvantaged pupils',
                'Further embed restorative approaches'
            ],
            'personal-development': [
                'Extend enrichment offer for all year groups',
                'Develop pupil leadership opportunities'
            ],
            'leadership-management': [
                'Continue to develop middle leader capacity',
                'Further embed research-informed practice'
            ]
        };
        return afd[sectionId] || [];
    };

    const generateEvidenceList = (sectionId: string): string[] => {
        return [
            'Curriculum documentation and long-term plans',
            'Lesson observations and learning walks',
            'Pupil work scrutiny',
            'Assessment data and progress tracking',
            'Pupil and parent voice surveys',
            'Staff CPD records',
            'Governor meeting minutes'
        ];
    };

    const generateActionsList = (sectionId: string): string[] => {
        const relevantActions = actions
            .filter(a => a.category?.toLowerCase().includes(sectionId.split('-')[0]))
            .map(a => a.title || a.description)
            .slice(0, 5);
        
        return relevantActions.length > 0 ? relevantActions : [
            'Actions linked from School Improvement Plan'
        ];
    };

    const generateImpact = (sectionId: string): string => {
        return 'Impact data shows improvement over time. Comparison with previous years demonstrates progress. [Link to data dashboard]';
    };

    const generateNextSteps = (sectionId: string): string => {
        return 'Continue to monitor through half-termly reviews. Adjust provision based on ongoing assessment data.';
    };

    const calculateOverall = (sections: SEFSection[]): string => {
        const grades = sections.map(s => 
            s.currentGrade === 'outstanding' ? 4 :
            s.currentGrade === 'good' ? 3 :
            s.currentGrade === 'requires_improvement' ? 2 : 1
        );
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        
        return avg >= 3.5 ? 'Outstanding' :
               avg >= 2.5 ? 'Good' :
               avg >= 1.5 ? 'Requires Improvement' : 'Inadequate';
    };

    const exportToWord = () => {
        // Create document content
        const content = generatedSEF ? `
SELF-EVALUATION FORM
${generatedSEF.schoolName}
Last Updated: ${new Date(generatedSEF.lastUpdated).toLocaleDateString()}
Overall Effectiveness: ${generatedSEF.overallEffectiveness}

${generatedSEF.sections.map(section => `
${'='.repeat(50)}
${section.title.toUpperCase()}
Current Grade: ${section.currentGrade.replace('_', ' ').toUpperCase()}
${'='.repeat(50)}

NARRATIVE:
${section.narrative}

STRENGTHS:
${section.strengths.map(s => `• ${s}`).join('\n')}

AREAS FOR DEVELOPMENT:
${section.areasForDevelopment.map(a => `• ${a}`).join('\n')}

EVIDENCE:
${section.evidence.map(e => `• ${e}`).join('\n')}

LINKED ACTIONS:
${section.actions.map(a => `• ${a}`).join('\n')}

IMPACT:
${section.impact}

NEXT STEPS:
${section.nextSteps}
`).join('\n\n')}
        ` : '';
        
        // Create blob and download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SEF_${schoolName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async () => {
        if (!generatedSEF) return;
        
        const content = generatedSEF.sections.map(section => 
            `## ${section.title}\n\n${section.narrative}\n\n**Strengths:**\n${section.strengths.map(s => `- ${s}`).join('\n')}`
        ).join('\n\n---\n\n');
        
        await navigator.clipboard.writeText(content);
        alert('SEF content copied to clipboard!');
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">SEF Generator</h2>
                            <p className="text-indigo-200 text-sm">Auto-generate your Self-Evaluation Form</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-yellow-300" />
                        <span className="text-sm">AI-Powered</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
                <nav className="flex">
                    {[
                        { id: 'generate', label: 'Generate', icon: Sparkles },
                        { id: 'preview', label: 'Preview', icon: Eye },
                        { id: 'export', label: 'Export', icon: Download },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as any)}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 ${
                                activeView === tab.id
                                    ? 'border-indigo-500 text-indigo-600 bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Generate Tab */}
                {activeView === 'generate' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-start gap-3">
                                <GraduationCap className="text-blue-600 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-medium text-blue-800">Ed will generate your SEF</h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Based on your framework assessments, evidence, actions, and lesson observations, 
                                        Ed will create a comprehensive SEF document ready for inspection.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Data Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {Object.keys(assessments).length}
                                </div>
                                <div className="text-sm text-gray-600">Assessments</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {actions.length}
                                </div>
                                <div className="text-sm text-gray-600">Actions</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {observations.length}
                                </div>
                                <div className="text-sm text-gray-600">Observations</div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={generateSEF}
                            disabled={isGenerating}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw size={20} className="animate-spin" />
                                    Generating SEF...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Generate SEF Document
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Preview Tab */}
                {activeView === 'preview' && generatedSEF && (
                    <div className="space-y-4">
                        {/* Overall Grade */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{generatedSEF.schoolName}</h3>
                                    <p className="text-sm text-gray-600">
                                        Last updated: {new Date(generatedSEF.lastUpdated).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                                    generatedSEF.overallEffectiveness === 'Outstanding' ? 'bg-green-100 text-green-800' :
                                    generatedSEF.overallEffectiveness === 'Good' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {generatedSEF.overallEffectiveness}
                                </div>
                            </div>
                        </div>

                        {/* Sections */}
                        <div className="space-y-3">
                            {generatedSEF.sections.map(section => (
                                <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleSection(section.id)}
                                        className="w-full p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedSections.has(section.id) ? (
                                                <ChevronDown size={20} className="text-gray-400" />
                                            ) : (
                                                <ChevronRight size={20} className="text-gray-400" />
                                            )}
                                            <span className="font-medium text-gray-900">{section.title}</span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${GRADE_COLORS[section.currentGrade]}`}>
                                            {section.currentGrade.replace('_', ' ')}
                                        </span>
                                    </button>
                                    
                                    {expandedSections.has(section.id) && (
                                        <div className="p-4 space-y-4">
                                            {/* Narrative */}
                                            <div>
                                                <h5 className="text-sm font-medium text-gray-700 mb-2">Narrative</h5>
                                                <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-lg">
                                                    {section.narrative}
                                                </p>
                                            </div>

                                            {/* Strengths */}
                                            <div>
                                                <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                                                    <CheckCircle size={14} />
                                                    Strengths
                                                </h5>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    {section.strengths.map((s, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <span className="text-green-500 mt-1">•</span>
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* AFD */}
                                            <div>
                                                <h5 className="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-1">
                                                    <TrendingUp size={14} />
                                                    Areas for Development
                                                </h5>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    {section.areasForDevelopment.map((a, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <span className="text-yellow-500 mt-1">•</span>
                                                            {a}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Evidence */}
                                            <div>
                                                <h5 className="text-sm font-medium text-gray-700 mb-2">Evidence Sources</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {section.evidence.map((e, i) => (
                                                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                            {e}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Export Tab */}
                {activeView === 'export' && generatedSEF && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Export Options</h4>
                            <p className="text-sm text-gray-600">
                                Download your SEF in various formats for sharing with governors, inspectors, or for your records.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={exportToWord}
                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2"
                            >
                                <Download size={24} className="text-blue-600" />
                                <span className="font-medium text-gray-900">Download as Text</span>
                                <span className="text-xs text-gray-500">Plain text format</span>
                            </button>

                            <button
                                onClick={copyToClipboard}
                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2"
                            >
                                <Copy size={24} className="text-green-600" />
                                <span className="font-medium text-gray-900">Copy to Clipboard</span>
                                <span className="text-xs text-gray-500">Markdown format</span>
                            </button>

                            <button
                                onClick={() => window.print()}
                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-2"
                            >
                                <Printer size={24} className="text-purple-600" />
                                <span className="font-medium text-gray-900">Print</span>
                                <span className="text-xs text-gray-500">Print or save as PDF</span>
                            </button>

                            <button
                                disabled
                                className="p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed flex flex-col items-center gap-2"
                            >
                                <FileText size={24} className="text-gray-400" />
                                <span className="font-medium text-gray-900">Word Document</span>
                                <span className="text-xs text-gray-500">Coming soon</span>
                            </button>
                        </div>

                        {/* Inspector Tips */}
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                                <GraduationCap size={18} />
                                Ed's Inspector Tips
                            </h4>
                            <ul className="text-sm text-purple-700 space-y-1">
                                <li>• Keep your SEF concise - inspectors prefer quality over quantity</li>
                                <li>• Update regularly (at least termly) to show you know your school</li>
                                <li>• Link evidence directly - don't make inspectors search</li>
                                <li>• Be honest about AFDs - inspectors respect self-awareness</li>
                                <li>• Show impact, not just intent - use data and examples</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* No SEF Yet */}
                {activeView !== 'generate' && !generatedSEF && (
                    <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">Generate your SEF first</p>
                        <button
                            onClick={() => setActiveView('generate')}
                            className="mt-4 text-indigo-600 font-medium"
                        >
                            Go to Generate →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

