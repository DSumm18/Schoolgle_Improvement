"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
    SIAMS_FRAMEWORK, SIAMS_RATINGS, SIAMS_EVIDENCE_KEYWORDS,
    calculateStrandReadiness, calculateOverallSiamsReadiness,
    SiamsStrand, SiamsActionItem
} from '@/lib/siams-framework';
import { 
    ChevronDown, ChevronRight, AlertTriangle, CheckCircle, FileText, 
    Plus, Edit2, Calendar, User, Info, ExternalLink, X, 
    GraduationCap, Sparkles, Church, BookOpen, Heart, Users,
    Star, Cross
} from 'lucide-react';
import EdAnalysisPanel from './EdAnalysisPanel';

interface LocalEvidenceMatch {
    fileId: string;
    fileName: string;
    filePath: string;
    frameworkArea: string;
    frameworkAreaLabel: string;
    confidence: number;
    matchedKeywords: string[];
    relevantExcerpt: string;
}

interface SiamsFrameworkViewProps {
    assessments?: Record<string, any>;
    setAssessments?: (assessments: Record<string, any>) => void;
    localEvidence?: Record<string, LocalEvidenceMatch[]>;
}

const STRAND_COLOR_MAP: Record<string, string> = {
    'purple': 'bg-white border-l-4 border-purple-500 text-purple-900 hover:bg-purple-50',
    'blue': 'bg-white border-l-4 border-blue-500 text-blue-900 hover:bg-blue-50',
    'orange': 'bg-white border-l-4 border-orange-500 text-orange-900 hover:bg-orange-50',
    'teal': 'bg-white border-l-4 border-teal-500 text-teal-900 hover:bg-teal-50',
    'rose': 'bg-white border-l-4 border-rose-500 text-rose-900 hover:bg-rose-50',
    'violet': 'bg-white border-l-4 border-violet-500 text-violet-900 hover:bg-violet-50',
    'emerald': 'bg-white border-l-4 border-emerald-500 text-emerald-900 hover:bg-emerald-50',
};

const STRAND_ICONS: Record<string, any> = {
    'vision': Cross,
    'wisdom': BookOpen,
    'character': Star,
    'community': Users,
    'dignity': Heart,
    'worship': Church,
    're': BookOpen,
};

export default function SiamsFrameworkView({ 
    assessments = {}, 
    setAssessments = () => {},
    localEvidence = {}
}: SiamsFrameworkViewProps) {
    const { user } = useAuth();
    const [expandedStrands, setExpandedStrands] = useState<Set<string>>(new Set());
    const [activeInfo, setActiveInfo] = useState<string | null>(null);
    const [showBanner, setShowBanner] = useState(true);

    // Ed Analysis Panel State
    const [showEdPanel, setShowEdPanel] = useState(false);
    const [edSelectedStrand, setEdSelectedStrand] = useState<string>('');
    const [edSelectedRating, setEdSelectedRating] = useState<string>('');

    // Calculate Overall Scores
    const { userScore: overallUserScore, totalEvidence } = calculateOverallSiamsReadiness(assessments);

    // Map SIAMS areas to evidence areas
    const SIAMS_TO_EVIDENCE: Record<string, string[]> = {
        'vision': ['leadership', 'vision'],
        'wisdom': ['quality-intent', 'quality-implementation', 'quality-impact'],
        'character': ['personal-development', 'character'],
        'community': ['behaviour', 'community'],
        'dignity': ['dignity', 'equality'],
        'worship': ['worship', 'collective-worship'],
        're': ['re', 'religious-education'],
    };

    const getEvidenceCountForStrand = (strandId: string): number => {
        const areas = SIAMS_TO_EVIDENCE[strandId] || [strandId];
        let count = 0;
        for (const area of areas) {
            if (localEvidence[area]) {
                count += localEvidence[area].length;
            }
        }
        return count;
    };

    const getEvidenceForStrand = (strandId: string): LocalEvidenceMatch[] => {
        const areas = SIAMS_TO_EVIDENCE[strandId] || [strandId];
        let evidence: LocalEvidenceMatch[] = [];
        for (const area of areas) {
            if (localEvidence[area]) {
                evidence = [...evidence, ...localEvidence[area]];
            }
        }
        return evidence;
    };

    const toggleStrand = (strandId: string) => {
        const newExpanded = new Set(expandedStrands);
        if (newExpanded.has(strandId)) {
            newExpanded.delete(strandId);
        } else {
            newExpanded.add(strandId);
        }
        setExpandedStrands(newExpanded);
    };

    const toggleInfo = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveInfo(activeInfo === id ? null : id);
    };

    const handleRatingChange = (questionId: string, rating: string) => {
        setAssessments({
            ...assessments,
            [questionId]: { ...assessments[questionId], rating }
        });
    };

    const handleRationaleChange = (questionId: string, rationale: string) => {
        setAssessments({
            ...assessments,
            [questionId]: { ...assessments[questionId], rationale }
        });
    };

    const openEdAnalysis = (strandName: string, rating?: string) => {
        setEdSelectedStrand(strandName);
        setEdSelectedRating(rating || 'Not Assessed');
        setShowEdPanel(true);
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 40) return 'text-amber-600';
        return 'text-red-600';
    };

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case 'excellent': return 'bg-green-100 text-green-700 border-green-300';
            case 'good': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'requires_improvement': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'ineffective': return 'bg-red-100 text-red-700 border-red-300';
            default: return 'bg-gray-100 text-gray-600 border-gray-300';
        }
    };

    return (
        <div className="space-y-4">
            {/* Top-Level Guidance Banner */}
            {showBanner && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6 relative">
                    <button
                        onClick={() => setShowBanner(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-start gap-4 pr-8">
                        <div className="flex-shrink-0 mt-0.5">
                            <Church className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-purple-900 text-lg mb-2">
                                About SIAMS Inspection
                            </h3>
                            <p className="text-purple-800 text-sm leading-relaxed mb-3">
                                SIAMS (Statutory Inspection of Anglican and Methodist Schools) evaluates how well a church school's 
                                Christian vision enables pupils and adults to flourish. The framework focuses on 7 strands covering 
                                vision, curriculum, character, community, dignity, worship, and RE.
                            </p>
                            <a
                                href="https://www.churchofengland.org/about/education-and-schools/church-schools-and-academies/siams-inspections"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors"
                            >
                                <ExternalLink size={16} />
                                View official SIAMS guidance
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Church className="text-purple-600" />
                            SIAMS Inspection Framework
                        </h2>
                        <p className="text-gray-600">
                            Statutory Inspection of Anglican and Methodist Schools
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-gray-400">School Readiness</div>
                            <div className={`text-2xl font-bold ${getScoreColor(overallUserScore)}`}>{overallUserScore}%</div>
                        </div>
                        <div className="text-right border-l border-gray-200 pl-4">
                            <div className="text-[10px] uppercase font-bold text-gray-400">Evidence Items</div>
                            <div className="text-2xl font-bold text-purple-600">{totalEvidence}</div>
                        </div>
                    </div>
                </div>

                {/* Strands */}
                <div className="space-y-3">
                    {SIAMS_FRAMEWORK.map((strand) => {
                        const { userScore, evidenceCount } = calculateStrandReadiness(strand.id, assessments);
                        const localEvidenceCount = getEvidenceCountForStrand(strand.id);
                        const StrandIcon = STRAND_ICONS[strand.id] || Church;

                        return (
                            <div key={strand.id} className={`mb-4 border rounded-lg overflow-hidden transition-all duration-200 ${expandedStrands.has(strand.id) ? 'shadow-md' : 'shadow-sm'}`}>
                                {/* Strand Header */}
                                <div className={`transition-colors ${STRAND_COLOR_MAP[strand.color] || STRAND_COLOR_MAP['purple']}`}>
                                    <div className="flex items-center justify-between w-full p-4">
                                        <button
                                            onClick={() => toggleStrand(strand.id)}
                                            className="flex items-center gap-3 flex-1 text-left"
                                        >
                                            <span className="text-lg text-gray-400">
                                                {expandedStrands.has(strand.id) ? '▼' : '▶'}
                                            </span>
                                            <StrandIcon size={24} className="text-purple-500" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900">{strand.name}</h3>
                                                    <div
                                                        onClick={(e) => toggleInfo(e, strand.id)}
                                                        className="text-gray-400 hover:text-purple-600 cursor-pointer p-1 rounded-full hover:bg-white/50 transition-colors"
                                                        title="Click for guidance"
                                                    >
                                                        <Info size={16} />
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600">{strand.description}</p>
                                            </div>
                                        </button>

                                        {/* Strand Scores */}
                                        <div className="flex items-center gap-4 mr-4">
                                            {/* Evidence Count */}
                                            {localEvidenceCount > 0 && (
                                                <div className="text-right border-r border-gray-200 pr-4">
                                                    <div className="text-[10px] uppercase font-bold text-gray-400">Evidence</div>
                                                    <div className="text-lg font-bold text-purple-600 flex items-center gap-1">
                                                        <FileText size={14} />
                                                        {localEvidenceCount}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase font-bold text-gray-400">Readiness</div>
                                                <div className={`text-lg font-bold ${getScoreColor(userScore)}`}>{userScore}%</div>
                                            </div>
                                        </div>
                                        
                                        {/* Ask Ed Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEdAnalysis(
                                                    strand.name,
                                                    userScore >= 90 ? 'Excellent' : userScore >= 70 ? 'Good' : userScore >= 40 ? 'Requires Improvement' : 'Ineffective'
                                                );
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors shadow-sm"
                                            title="Get Ed's analysis and recommendations"
                                        >
                                            <GraduationCap size={16} />
                                            <span className="hidden lg:inline">Ask Ed</span>
                                        </button>
                                    </div>

                                    {/* Strand Guidance Info Box */}
                                    {activeInfo === strand.id && (
                                        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="bg-white/80 p-3 rounded-md border border-gray-200 text-sm shadow-inner">
                                                <div className="flex gap-2">
                                                    <Info className="text-purple-500 flex-shrink-0 mt-0.5" size={16} />
                                                    <div>
                                                        <p className="text-gray-800 font-medium mb-2">Key Indicators:</p>
                                                        <ul className="text-gray-600 space-y-1">
                                                            {strand.keyIndicators.map((indicator, idx) => (
                                                                <li key={idx} className="flex items-start gap-2">
                                                                    <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                                    {indicator}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Expanded Content */}
                                {expandedStrands.has(strand.id) && (
                                    <div className="p-4 bg-white space-y-6 border-t border-gray-100">
                                        {/* Local Evidence Section */}
                                        {localEvidenceCount > 0 && (
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                                                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                                    <FileText size={18} className="text-purple-600" />
                                                    Local Evidence Files ({localEvidenceCount})
                                                </h4>
                                                <div className="space-y-2">
                                                    {getEvidenceForStrand(strand.id).map((evidence, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-purple-100">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{evidence.fileName}</p>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {evidence.matchedKeywords.slice(0, 3).map((kw, i) => (
                                                                        <span key={i} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                                                            {kw}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                                                                evidence.confidence >= 0.7 ? 'bg-green-100 text-green-700' :
                                                                evidence.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {Math.round(evidence.confidence * 100)}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-purple-600 mt-2">
                                                    📁 Scanned from local folder
                                                </p>
                                            </div>
                                        )}

                                        {/* Inspection Questions */}
                                        {strand.inspectionQuestions.map((question) => {
                                            const assessment = assessments[question.id] || {};
                                            const rating = assessment.rating || 'not_assessed';
                                            const rationale = assessment.rationale || '';

                                            return (
                                                <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-gray-900 text-lg">{question.question}</h4>
                                                            <p className="text-sm text-gray-600 mt-1">{question.guidance}</p>
                                                        </div>
                                                    </div>

                                                    {/* Rating Selection */}
                                                    <div className="mb-4">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Assessment</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(SIAMS_RATINGS).map(([key, value]) => (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => handleRatingChange(question.id, key)}
                                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                                                        rating === key
                                                                            ? getRatingColor(key)
                                                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    {value.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Rationale */}
                                                    <div className="mb-4">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Evidence & Rationale</label>
                                                        <textarea
                                                            value={rationale}
                                                            onChange={(e) => handleRationaleChange(question.id, e.target.value)}
                                                            placeholder="Describe your evidence for this rating..."
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                                        />
                                                    </div>

                                                    {/* Evidence Required */}
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Evidence Required:</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {question.evidenceRequired.map((evidence, idx) => (
                                                                <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-600">
                                                                    {evidence}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Ed Analysis Panel - Fixed Right Sidebar */}
            {showEdPanel && (
                <div className="fixed right-6 top-32 w-96 z-40 animate-in slide-in-from-right">
                    <EdAnalysisPanel
                        selectedCategory={edSelectedStrand}
                        currentRating={edSelectedRating}
                        onClose={() => setShowEdPanel(false)}
                    />
                </div>
            )}

            {/* Ed Quick Access Button */}
            {!showEdPanel && (
                <button
                    onClick={() => setShowEdPanel(true)}
                    className="fixed right-6 top-32 bg-gradient-to-r from-purple-500 to-violet-600 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 z-40"
                >
                    <GraduationCap size={20} />
                    <span className="font-medium">Analyze with Ed</span>
                    <Sparkles size={16} className="text-yellow-300" />
                </button>
            )}
        </div>
    );
}
