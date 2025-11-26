"use client";

import { useState } from 'react';
import { OFSTED_FRAMEWORK, calculateAIRating, calculateCategoryReadiness, calculateOverallReadiness, ActionItem } from '@/lib/ofsted-framework';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, FileText, RefreshCw, Plus, Edit2, Calendar, User, AlertCircle, TrendingUp, Brain, Info, ExternalLink, X } from 'lucide-react';
import ActionModal from './ActionModal';

interface OfstedFrameworkViewProps {
    assessments: Record<string, any>;
    setAssessments: (assessments: Record<string, any>) => void;
}

const HEADER_COLOR_MAP: Record<string, string> = {
    'rose': 'bg-white border-l-4 border-rose-500 text-rose-900 hover:bg-rose-50',
    'teal': 'bg-white border-l-4 border-teal-500 text-teal-900 hover:bg-teal-50',
    'orange': 'bg-white border-l-4 border-orange-500 text-orange-900 hover:bg-orange-50',
    'violet': 'bg-white border-l-4 border-violet-500 text-violet-900 hover:bg-violet-50',
    'blue': 'bg-white border-l-4 border-blue-500 text-blue-900 hover:bg-blue-50',
    'gray': 'bg-white border-l-4 border-gray-500 text-gray-900 hover:bg-gray-50',
};

export default function OfstedFrameworkView({ assessments, setAssessments }: OfstedFrameworkViewProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [activeInfo, setActiveInfo] = useState<string | null>(null);
    const [showBanner, setShowBanner] = useState(true);
    const [isScanning, setIsScanning] = useState(false);

    // Action Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentActionSubId, setCurrentActionSubId] = useState<string | null>(null);
    const [currentActionEvidence, setCurrentActionEvidence] = useState<string | null>(null);
    const [currentCategoryName, setCurrentCategoryName] = useState<string | undefined>(undefined);
    const [editingAction, setEditingAction] = useState<ActionItem | undefined>(undefined);

    // Calculate Overall Scores
    const { userScore: overallUserScore, aiScore: overallAIScore } = calculateOverallReadiness(assessments);

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const toggleInfo = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveInfo(activeInfo === id ? null : id);
    };

    const handleRatingChange = (subId: string, rating: string) => {
        setAssessments({
            ...assessments,
            [subId]: { ...assessments[subId], schoolRating: rating }
        });
    };

    const handleRationaleChange = (subId: string, rationale: string) => {
        setAssessments({
            ...assessments,
            [subId]: { ...assessments[subId], schoolRationale: rationale }
        });
    };

    const handleActionCreate = (subId: string, evidenceItem: string, categoryName: string) => {
        setCurrentActionSubId(subId);
        setCurrentActionEvidence(evidenceItem);
        setCurrentCategoryName(categoryName);
        setEditingAction(undefined);
        setIsModalOpen(true);
    };

    const handleActionEdit = (subId: string, action: ActionItem) => {
        setCurrentActionSubId(subId);
        setCurrentActionEvidence(null);
        setEditingAction(action);
        setIsModalOpen(true);
    };

    const handleSaveAction = (action: ActionItem) => {
        if (!currentActionSubId) return;

        const subAssessment = assessments[currentActionSubId] || {};
        const currentActions = subAssessment.actions || [];

        let newActions;
        if (editingAction) {
            newActions = currentActions.map((a: ActionItem) => a.id === action.id ? action : a);
        } else {
            newActions = [...currentActions, action];
        }

        setAssessments({
            ...assessments,
            [currentActionSubId]: { ...subAssessment, actions: newActions }
        });
        setIsModalOpen(false);
    };

    const simulateScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            const newAssessments = { ...assessments };

            OFSTED_FRAMEWORK.forEach(cat => {
                cat.subcategories.forEach(sub => {
                    const foundEvidence = Math.floor(Math.random() * (sub.evidenceRequired.length + 1));
                    const aiRating = calculateAIRating(foundEvidence, sub.evidenceRequired.length);

                    let aiRationale = "Insufficient evidence found to form a judgement.";
                    if (aiRating === 'good') aiRationale = "Sufficient evidence found to meet baseline requirements.";
                    if (aiRating === 'requires_improvement') aiRationale = "Some evidence found, but gaps remain.";
                    if (aiRating === 'inadequate') aiRationale = "Significant evidence gaps detected.";

                    newAssessments[sub.id] = {
                        ...newAssessments[sub.id],
                        evidenceCount: foundEvidence,
                        aiRating: aiRating,
                        aiRationale: aiRationale
                    };
                });
            });

            setAssessments(newAssessments);
            setIsScanning(false);
            setExpandedCategories(new Set([OFSTED_FRAMEWORK[0].id]));
        }, 2000);
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'outstanding': return 'bg-green-100 text-green-800 border-green-300';
            case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'requires_improvement': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'inadequate': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-600 border-gray-300';
        }
    };

    const getGradeLabel = (grade: string) => {
        switch (grade) {
            case 'outstanding': return 'Outstanding';
            case 'good': return 'Good';
            case 'requires_improvement': return 'Requires Improvement';
            case 'inadequate': return 'Inadequate';
            default: return 'Not Assessed';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 40) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-4">
            {/* Top-Level Guidance Banner */}
            {showBanner && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 relative">
                    <button
                        onClick={() => setShowBanner(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-start gap-4 pr-8">
                        <div className="flex-shrink-0 mt-0.5">
                            <Info className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 text-lg mb-2">About the Education Inspection Framework (EIF)</h3>
                            <p className="text-blue-800 text-sm leading-relaxed mb-3">
                                The EIF is the framework used by Ofsted to inspect schools in England. This tool helps you track your school's readiness against the key categories of Quality of Education, Behaviour & Attitudes, Personal Development, and Leadership & Management. For each area, you can self-assess, add evidence, create action plans, and see how AI analysis compares to your judgements.
                            </p>
                            <a
                                href="https://www.gov.uk/government/publications/education-inspection-framework"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                            >
                                <ExternalLink size={16} />
                                View official EIF documentation
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ofsted Inspection Framework</h2>
                        <p className="text-gray-600">
                            Track evidence and readiness against the Education Inspection Framework (EIF)
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={simulateScan}
                            disabled={isScanning}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors ${isScanning ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
                            {isScanning ? 'Scanning Drive...' : 'Scan Evidence'}
                        </button>

                        {/* Overall Scores */}
                        <div className="flex gap-6 border-l border-gray-200 pl-6">
                            <div className="text-right">
                                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                    <TrendingUp size={14} /> School Readiness
                                </div>
                                <div className={`text-3xl font-bold ${getScoreColor(overallUserScore)}`}>
                                    {overallUserScore}%
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                    <Brain size={14} /> AI Evidence Score
                                </div>
                                <div className={`text-3xl font-bold ${getScoreColor(overallAIScore)}`}>
                                    {overallAIScore}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {OFSTED_FRAMEWORK.map((category) => {
                        const { userScore, aiScore } = calculateCategoryReadiness(category.id, assessments);

                        return (
                            <div key={category.id} className={`mb-4 border rounded-lg overflow-hidden transition-all duration-200 ${expandedCategories.has(category.id) ? 'shadow-md' : 'shadow-sm'} ${HEADER_COLOR_MAP[category.color || 'gray'].replace('hover:', '')}`}>
                                {/* Category Header */}
                                <div className={`transition-colors ${HEADER_COLOR_MAP[category.color || 'gray']}`}>
                                    <div className="flex items-center justify-between w-full p-4">
                                        <button
                                            onClick={() => toggleCategory(category.id)}
                                            className="flex items-center gap-3 flex-1 text-left"
                                        >
                                            <span className="text-lg text-gray-400">
                                                {expandedCategories.has(category.id) ? '▼' : '▶'}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                                                    <div
                                                        onClick={(e) => toggleInfo(e, category.id)}
                                                        className="text-gray-400 hover:text-blue-600 cursor-pointer p-1 rounded-full hover:bg-white/50 transition-colors"
                                                        title="Click for guidance"
                                                    >
                                                        <Info size={16} />
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600">{category.description}</p>
                                            </div>
                                        </button>

                                        {/* Category Scores */}
                                        <div className="flex items-center gap-4 mr-4">
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase font-bold text-gray-400">Readiness</div>
                                                <div className={`text-lg font-bold ${getScoreColor(userScore)}`}>{userScore}%</div>
                                            </div>
                                            <div className="text-right border-l border-gray-200 pl-4">
                                                <div className="text-[10px] uppercase font-bold text-gray-400">AI Score</div>
                                                <div className={`text-lg font-bold ${getScoreColor(aiScore)}`}>{aiScore}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Guidance Info Box */}
                                    {activeInfo === category.id && category.guidanceSummary && (
                                        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="bg-white/80 p-3 rounded-md border border-gray-200 text-sm shadow-inner">
                                                <div className="flex gap-2">
                                                    <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                                                    <div>
                                                        <p className="text-gray-800 font-medium mb-1">Ofsted Expectation:</p>
                                                        <p className="text-gray-600 leading-relaxed">{category.guidanceSummary}</p>
                                                        {category.guidanceLink && (
                                                            <a
                                                                href={category.guidanceLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2 hover:underline font-medium"
                                                            >
                                                                Read Official Documentation <ExternalLink size={10} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Subcategories */}
                                {expandedCategories.has(category.id) && (
                                    <div className="p-4 bg-white space-y-6 border-t border-gray-100">
                                        {category.subcategories.map((sub) => {
                                            const assessment = assessments[sub.id] || {};
                                            const schoolRating = assessment.schoolRating || 'not_assessed';
                                            const schoolRationale = assessment.schoolRationale || '';
                                            const aiRating = assessment.aiRating || 'not_assessed';
                                            const aiRationale = assessment.aiRationale || 'AI analysis pending evidence scan.';
                                            const actions: ActionItem[] = assessment.actions || [];

                                            const evidenceCount = assessment.evidenceCount || 0;
                                            const requiredCount = sub.evidenceRequired.length;
                                            const hasGaps = evidenceCount < requiredCount;

                                            return (
                                                <div key={sub.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-gray-900 text-lg">{sub.name}</h4>
                                                                <div
                                                                    onClick={(e) => toggleInfo(e, sub.id)}
                                                                    className="text-gray-400 hover:text-blue-600 cursor-pointer p-1"
                                                                    title="Click for guidance"
                                                                >
                                                                    <Info size={16} />
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-600 text-sm mt-1">{sub.description}</p>

                                                            {/* Subcategory Guidance Info Box */}
                                                            {activeInfo === sub.id && sub.guidanceSummary && (
                                                                <div className="mt-3 bg-blue-50 p-3 rounded-md border border-blue-100 text-sm animate-in fade-in slide-in-from-top-1">
                                                                    <p className="text-blue-900 font-medium mb-1">What Good Looks Like:</p>
                                                                    <p className="text-blue-800">{sub.guidanceSummary}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Dual Ratings */}
                                                        <div className="flex gap-4 ml-4">
                                                            <div className="text-right">
                                                                <div className="text-xs font-semibold text-gray-500 mb-1">AI Assessment</div>
                                                                <div className={`px-3 py-1.5 rounded-md text-sm font-medium border ${getGradeColor(aiRating)}`}>
                                                                    {getGradeLabel(aiRating)}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs font-semibold text-gray-500 mb-1">School Self-Assessment</div>
                                                                <select
                                                                    value={schoolRating}
                                                                    onChange={(e) => handleRatingChange(sub.id, e.target.value)}
                                                                    className={`px-3 py-1.5 rounded-md text-sm font-medium border focus:ring-2 focus:ring-blue-500 outline-none ${getGradeColor(schoolRating)}`}
                                                                >
                                                                    <option value="not_assessed">Not Assessed</option>
                                                                    <option value="outstanding">Outstanding</option>
                                                                    <option value="good">Good</option>
                                                                    <option value="requires_improvement">Requires Improvement</option>
                                                                    <option value="inadequate">Inadequate</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Evidence Section */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                                                                    <FileText size={16} />
                                                                    Evidence Required
                                                                </h5>
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${hasGaps ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                                    {evidenceCount}/{requiredCount} Items
                                                                </span>
                                                            </div>
                                                            <ul className="space-y-2">
                                                                {sub.evidenceRequired.map((evidence, idx) => (
                                                                    <li key={idx} className="flex items-start justify-between group text-sm p-2 rounded hover:bg-gray-50">
                                                                        <span className="text-gray-600 flex-1 mr-2">• {evidence}</span>
                                                                        <button
                                                                            onClick={() => handleActionCreate(sub.id, evidence, category.name)}
                                                                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-all flex items-center gap-1"
                                                                        >
                                                                            <Plus size={12} /> Action
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>

                                                            {/* Actions List */}
                                                            {actions.length > 0 && (
                                                                <div className="mt-6 border-t border-gray-100 pt-4">
                                                                    <h5 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                                                                        <AlertCircle size={16} />
                                                                        Action Plan ({actions.length})
                                                                    </h5>
                                                                    <div className="space-y-2">
                                                                        {actions.map(action => (
                                                                            <div key={action.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                                                                <div className="flex justify-between items-start mb-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(action.priority)}`}>
                                                                                            {action.priority}
                                                                                        </span>
                                                                                        <span className="text-sm font-medium text-gray-900">{action.description}</span>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => handleActionEdit(sub.id, action)}
                                                                                        className="text-gray-400 hover:text-blue-600"
                                                                                    >
                                                                                        <Edit2 size={14} />
                                                                                    </button>
                                                                                </div>
                                                                                {action.rationale && (
                                                                                    <p className="text-xs text-gray-500 mb-2 italic">"{action.rationale}"</p>
                                                                                )}
                                                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                                    {action.assignee && (
                                                                                        <span className="flex items-center gap-1">
                                                                                            <User size={12} /> {action.assignee}
                                                                                        </span>
                                                                                    )}
                                                                                    {action.dueDate && (
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Calendar size={12} /> {new Date(action.dueDate).toLocaleDateString()}
                                                                                        </span>
                                                                                    )}
                                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${action.status === 'completed' ? 'bg-green-100 text-green-700' : action.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                                        {action.status.replace('_', ' ')}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Rationale Section */}
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                    AI Rationale
                                                                </label>
                                                                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700">
                                                                    {aiRationale}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label htmlFor={`rationale-${sub.id}`} className="block text-sm font-semibold text-gray-700 mb-2">
                                                                    School Rationale & Evidence Notes
                                                                </label>
                                                                <textarea
                                                                    id={`rationale-${sub.id}`}
                                                                    value={schoolRationale}
                                                                    onChange={(e) => handleRationaleChange(sub.id, e.target.value)}
                                                                    placeholder="Explain your self-assessment rating and list key evidence..."
                                                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                                                    rows={6}
                                                                />
                                                            </div>
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

            {/* Action Modal */}
            {isModalOpen && (
                <ActionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveAction}
                    categoryName={currentCategoryName}
                    subCategoryName={OFSTED_FRAMEWORK.flatMap(c => c.subcategories).find(s => s.id === currentActionSubId)?.name}
                    evidenceItem={currentActionEvidence || undefined}
                    initialData={editingAction}
                />
            )}
        </div>
    );
}
