"use client";

import { useState, useEffect } from 'react';
import { 
    GraduationCap, Sparkles, AlertTriangle, CheckCircle2, 
    HelpCircle, ChevronRight, BookOpen, Target, Users,
    Lightbulb, ClipboardList, ThumbsUp, ThumbsDown, Edit3,
    Clock, User, ArrowRight, X, Loader2, Eye, FileText
} from 'lucide-react';
import { getRelevantStrategies, EEFStrategy } from '@/lib/eef-toolkit';

interface Gap {
    id: string;
    area: string;
    subcategory: string;
    description: string;
    severity: 'critical' | 'moderate' | 'minor';
    currentRating?: string;
}

interface CriticalQuestion {
    id: string;
    question: string;
    area: string;
    ifNo: string; // What action to recommend if answer is No
    ifYes: string; // What to check next if answer is Yes
}

interface DraftAction {
    id: string;
    title: string;
    description: string;
    eefStrategy?: string;
    eefImpact?: number;
    dueDate?: string;
    suggestedOwner?: string;
    priority: 'high' | 'medium' | 'low';
    status: 'draft' | 'approved' | 'rejected';
}

interface EdAnalysisPanelProps {
    selectedCategory?: string;
    selectedSubcategory?: string;
    currentRating?: string;
    evidenceCount?: number;
    gaps?: Gap[];
    onCreateAction?: (action: DraftAction) => void;
    onClose?: () => void;
}

// Critical questions for root cause analysis
const CRITICAL_QUESTIONS: Record<string, CriticalQuestion[]> = {
    'reading': [
        {
            id: 'scheme-validated',
            question: 'Is your phonics/reading scheme DfE validated?',
            area: 'reading',
            ifNo: 'Consider switching to a validated systematic synthetic phonics programme (e.g., Little Wandle, Read Write Inc)',
            ifYes: 'Scheme is appropriate - check implementation'
        },
        {
            id: 'staff-trained',
            question: 'Have all staff delivering reading had recent CPD on the scheme?',
            area: 'reading',
            ifNo: 'Book CPD session for staff on phonics/reading scheme delivery',
            ifYes: 'Training is in place - check classroom practice'
        },
        {
            id: 'lessons-observed',
            question: 'Have SLT observed reading lessons this term?',
            area: 'reading',
            ifNo: 'Schedule lesson observations focused on reading delivery',
            ifYes: 'Observations done - review findings'
        },
        {
            id: 'books-matched',
            question: 'Are reading books matched to children\'s phonics stage?',
            area: 'reading',
            ifNo: 'Audit reading books and implement book-banding system',
            ifYes: 'Books are matched - check home reading consistency'
        },
        {
            id: 'interventions-place',
            question: 'Are rapid interventions in place for children falling behind?',
            area: 'reading',
            ifNo: 'Implement same-day keep-up interventions for struggling readers',
            ifYes: 'Interventions exist - check impact data'
        }
    ],
    'maths': [
        {
            id: 'mastery-approach',
            question: 'Are you using a mastery approach (e.g., White Rose, Power Maths)?',
            area: 'maths',
            ifNo: 'Consider adopting a mastery curriculum approach',
            ifYes: 'Mastery in place - check implementation fidelity'
        },
        {
            id: 'fluency-practice',
            question: 'Do children get daily fluency practice (times tables, number bonds)?',
            area: 'maths',
            ifNo: 'Implement daily fluency sessions (e.g., Times Tables Rock Stars)',
            ifYes: 'Fluency in place - check coverage'
        },
        {
            id: 'concrete-resources',
            question: 'Do teachers use concrete manipulatives before abstract?',
            area: 'maths',
            ifNo: 'CPD needed on concrete-pictorial-abstract approach',
            ifYes: 'CPA used - check reasoning opportunities'
        }
    ],
    'behaviour': [
        {
            id: 'policy-clear',
            question: 'Is your behaviour policy clear and consistently applied?',
            area: 'behaviour',
            ifNo: 'Review and relaunch behaviour policy with all staff',
            ifYes: 'Policy exists - check consistency'
        },
        {
            id: 'routines-embedded',
            question: 'Are routines and expectations explicitly taught to pupils?',
            area: 'behaviour',
            ifNo: 'Implement explicit teaching of school routines',
            ifYes: 'Routines taught - check reinforcement'
        },
        {
            id: 'root-causes',
            question: 'Do you investigate root causes of behaviour incidents?',
            area: 'behaviour',
            ifNo: 'Implement behaviour analysis process (ABC approach)',
            ifYes: 'Root causes explored - check support plans'
        }
    ],
    'send': [
        {
            id: 'identify-early',
            question: 'Do you identify SEND needs early (within first term)?',
            area: 'send',
            ifNo: 'Implement early identification screening system',
            ifYes: 'Early ID in place - check provision'
        },
        {
            id: 'provision-map',
            question: 'Do you have a clear provision map showing interventions?',
            area: 'send',
            ifNo: 'Create provision map linked to SEND register',
            ifYes: 'Provision mapped - check impact tracking'
        },
        {
            id: 'ta-trained',
            question: 'Are TAs trained on specific SEND interventions?',
            area: 'send',
            ifNo: 'Book targeted CPD for TAs on intervention delivery',
            ifYes: 'TAs trained - check deployment'
        }
    ],
    'teaching': [
        {
            id: 'teaching-observed',
            question: 'Have all teachers been observed this half-term?',
            area: 'teaching',
            ifNo: 'Schedule lesson observations for all staff',
            ifYes: 'Observations done - review quality'
        },
        {
            id: 'feedback-given',
            question: 'Do teachers receive specific, developmental feedback?',
            area: 'teaching',
            ifNo: 'Implement coaching/mentoring conversations post-observation',
            ifYes: 'Feedback given - check follow-up'
        },
        {
            id: 'underperformance-addressed',
            question: 'Is underperformance addressed promptly with support plans?',
            area: 'teaching',
            ifNo: 'Create support plan process for struggling teachers',
            ifYes: 'Support in place - monitor progress'
        }
    ]
};

export default function EdAnalysisPanel({
    selectedCategory,
    selectedSubcategory,
    currentRating,
    evidenceCount = 0,
    gaps = [],
    onCreateAction,
    onClose
}: EdAnalysisPanelProps) {
    const [activeTab, setActiveTab] = useState<'analysis' | 'questions' | 'actions'>('analysis');
    const [questionAnswers, setQuestionAnswers] = useState<Record<string, boolean | null>>({});
    const [draftActions, setDraftActions] = useState<DraftAction[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [rootCause, setRootCause] = useState<string | null>(null);
    const [relevantStrategies, setRelevantStrategies] = useState<EEFStrategy[]>([]);

    // Get relevant questions based on category
    const getQuestionsForCategory = (): CriticalQuestion[] => {
        const categoryLower = selectedCategory?.toLowerCase() || '';
        if (categoryLower.includes('reading') || categoryLower.includes('phonics')) {
            return CRITICAL_QUESTIONS['reading'];
        }
        if (categoryLower.includes('maths') || categoryLower.includes('mathematics')) {
            return CRITICAL_QUESTIONS['maths'];
        }
        if (categoryLower.includes('behaviour')) {
            return CRITICAL_QUESTIONS['behaviour'];
        }
        if (categoryLower.includes('send') || categoryLower.includes('inclusion')) {
            return CRITICAL_QUESTIONS['send'];
        }
        // Default to teaching questions
        return CRITICAL_QUESTIONS['teaching'];
    };

    const questions = getQuestionsForCategory();

    // Analyze answers and determine root cause
    useEffect(() => {
        const answeredQuestions = Object.entries(questionAnswers);
        if (answeredQuestions.length >= 3) {
            const noAnswers = answeredQuestions.filter(([_, v]) => v === false);
            if (noAnswers.length > 0) {
                // Find the first "No" answer - this is likely the root cause
                const firstNo = noAnswers[0];
                const question = questions.find(q => q.id === firstNo[0]);
                if (question) {
                    setRootCause(question.ifNo);
                    generateDraftActions(question);
                }
            } else {
                setRootCause('Implementation appears sound. Consider reviewing outcome data for specific cohorts or groups.');
            }
            setAnalysisComplete(true);
        }
    }, [questionAnswers]);

    // Get relevant EEF strategies
    useEffect(() => {
        if (selectedCategory) {
            const strategies = getRelevantStrategies(selectedCategory);
            setRelevantStrategies(strategies.slice(0, 3));
        }
    }, [selectedCategory]);

    const generateDraftActions = (question: CriticalQuestion) => {
        const actions: DraftAction[] = [];
        
        // Generate action from the question
        actions.push({
            id: `action-${Date.now()}-1`,
            title: question.ifNo.split('.')[0],
            description: question.ifNo,
            priority: 'high',
            status: 'draft',
            dueDate: getDefaultDueDate(14),
            suggestedOwner: 'Subject Lead'
        });

        // Add monitoring action
        actions.push({
            id: `action-${Date.now()}-2`,
            title: 'SLT Monitoring Visit',
            description: `Conduct focused monitoring visit to assess implementation of ${question.area} improvements`,
            priority: 'medium',
            status: 'draft',
            dueDate: getDefaultDueDate(28),
            suggestedOwner: 'Deputy Head'
        });

        // Add review action
        actions.push({
            id: `action-${Date.now()}-3`,
            title: 'Review Impact Data',
            description: `Review progress data to measure impact of interventions after 6 weeks`,
            priority: 'medium',
            status: 'draft',
            dueDate: getDefaultDueDate(42),
            suggestedOwner: 'Assessment Lead'
        });

        // Add EEF-backed action if relevant strategy found
        if (relevantStrategies.length > 0) {
            const topStrategy = relevantStrategies[0];
            actions.push({
                id: `action-${Date.now()}-4`,
                title: `Implement: ${topStrategy.name}`,
                description: `EEF research shows +${topStrategy.monthsProgress} months progress. ${topStrategy.description}`,
                eefStrategy: topStrategy.name,
                eefImpact: topStrategy.monthsProgress,
                priority: 'high',
                status: 'draft',
                dueDate: getDefaultDueDate(21),
                suggestedOwner: 'Class Teachers'
            });
        }

        setDraftActions(actions);
    };

    const getDefaultDueDate = (daysFromNow: number): string => {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toISOString().split('T')[0];
    };

    const handleAnswerQuestion = (questionId: string, answer: boolean) => {
        setQuestionAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleApproveAction = (action: DraftAction) => {
        const approvedAction = { ...action, status: 'approved' as const };
        setDraftActions(prev => prev.map(a => a.id === action.id ? approvedAction : a));
        onCreateAction?.(approvedAction);
    };

    const handleRejectAction = (actionId: string) => {
        setDraftActions(prev => prev.map(a => 
            a.id === actionId ? { ...a, status: 'rejected' as const } : a
        ));
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50';
            case 'moderate': return 'text-yellow-600 bg-yellow-50';
            case 'minor': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <GraduationCap size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold">Ed's Analysis</h3>
                            <p className="text-sm text-white/80">
                                {selectedCategory || 'Select an area to analyze'}
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex">
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                            activeTab === 'analysis' 
                                ? 'border-emerald-500 text-emerald-600' 
                                : 'border-transparent text-gray-500'
                        }`}
                    >
                        📊 Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                            activeTab === 'questions' 
                                ? 'border-emerald-500 text-emerald-600' 
                                : 'border-transparent text-gray-500'
                        }`}
                    >
                        ❓ Root Cause
                    </button>
                    <button
                        onClick={() => setActiveTab('actions')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 relative ${
                            activeTab === 'actions' 
                                ? 'border-emerald-500 text-emerald-600' 
                                : 'border-transparent text-gray-500'
                        }`}
                    >
                        🎯 Actions
                        {draftActions.filter(a => a.status === 'draft').length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {draftActions.filter(a => a.status === 'draft').length}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
                {/* Analysis Tab */}
                {activeTab === 'analysis' && (
                    <div className="space-y-4">
                        {/* Current Status */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700">Current Status</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    currentRating === 'Outstanding' ? 'bg-green-100 text-green-700' :
                                    currentRating === 'Good' ? 'bg-blue-100 text-blue-700' :
                                    currentRating === 'Requires Improvement' ? 'bg-yellow-100 text-yellow-700' :
                                    currentRating === 'Inadequate' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {currentRating || 'Not Assessed'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <FileText size={14} />
                                    {evidenceCount} evidence items
                                </span>
                            </div>
                        </div>

                        {/* Identified Gaps */}
                        {gaps.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-yellow-500" />
                                    Identified Gaps
                                </h4>
                                <div className="space-y-2">
                                    {gaps.map(gap => (
                                        <div key={gap.id} className={`p-3 rounded-lg ${getSeverityColor(gap.severity)}`}>
                                            <p className="text-sm font-medium">{gap.area}</p>
                                            <p className="text-xs mt-1">{gap.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* EEF Recommendations */}
                        {relevantStrategies.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <BookOpen size={16} className="text-emerald-500" />
                                    EEF Research Suggests
                                </h4>
                                <div className="space-y-2">
                                    {relevantStrategies.map(strategy => (
                                        <div key={strategy.id} className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-emerald-800">{strategy.name}</span>
                                                <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                                                    +{strategy.monthsProgress} months
                                                </span>
                                            </div>
                                            <p className="text-xs text-emerald-700 mt-1">{strategy.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Call to Action */}
                        <button
                            onClick={() => setActiveTab('questions')}
                            className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 flex items-center justify-center gap-2"
                        >
                            <Lightbulb size={18} />
                            Start Root Cause Analysis
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Questions Tab */}
                {activeTab === 'questions' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Ed says:</strong> "Let me help identify the root cause. 
                                Answer these questions honestly - it helps us fix the right thing!"
                            </p>
                        </div>

                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 mb-3">{q.question}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAnswerQuestion(q.id, true)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        questionAnswers[q.id] === true
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50'
                                                    }`}
                                                >
                                                    ✓ Yes
                                                </button>
                                                <button
                                                    onClick={() => handleAnswerQuestion(q.id, false)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        questionAnswers[q.id] === false
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-red-50'
                                                    }`}
                                                >
                                                    ✗ No
                                                </button>
                                            </div>
                                            {questionAnswers[q.id] === false && (
                                                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                                    <p className="text-xs text-yellow-800">
                                                        <strong>Action needed:</strong> {q.ifNo}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Root Cause Summary */}
                        {analysisComplete && rootCause && (
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
                                    <Target size={16} />
                                    Root Cause Identified
                                </h4>
                                <p className="text-sm text-emerald-700">{rootCause}</p>
                                <button
                                    onClick={() => setActiveTab('actions')}
                                    className="mt-3 w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
                                >
                                    View Recommended Actions →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions Tab */}
                {activeTab === 'actions' && (
                    <div className="space-y-4">
                        {draftActions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Complete the Root Cause analysis to generate actions</p>
                                <button
                                    onClick={() => setActiveTab('questions')}
                                    className="mt-3 text-emerald-600 text-sm font-medium"
                                >
                                    Start Analysis →
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        <strong>Ed says:</strong> "Here are my recommended actions based on EEF research. 
                                        Approve to add to your action plan, or edit as needed."
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {draftActions.map((action, idx) => (
                                        <div 
                                            key={action.id} 
                                            className={`p-4 rounded-lg border ${
                                                action.status === 'approved' ? 'bg-green-50 border-green-200' :
                                                action.status === 'rejected' ? 'bg-gray-50 border-gray-200 opacity-50' :
                                                'bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(action.priority)}`}>
                                                        {action.priority.toUpperCase()}
                                                    </span>
                                                    {action.eefStrategy && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                                                            EEF: +{action.eefImpact}mo
                                                        </span>
                                                    )}
                                                </div>
                                                {action.status === 'approved' && (
                                                    <CheckCircle2 size={18} className="text-green-500" />
                                                )}
                                            </div>

                                            <h5 className="font-medium text-gray-900 text-sm">{action.title}</h5>
                                            <p className="text-xs text-gray-600 mt-1">{action.description}</p>

                                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    Due: {action.dueDate}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User size={12} />
                                                    {action.suggestedOwner}
                                                </span>
                                            </div>

                                            {action.status === 'draft' && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => handleApproveAction(action)}
                                                        className="flex-1 py-2 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 flex items-center justify-center gap-1"
                                                    >
                                                        <ThumbsUp size={14} />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectAction(action.id)}
                                                        className="py-2 px-3 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                                                    >
                                                        <ThumbsDown size={14} />
                                                    </button>
                                                    <button className="py-2 px-3 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">
                                                        <Edit3 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Inspector Note */}
                                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <p className="text-xs text-purple-800">
                                        <strong>📋 Inspector Note:</strong> When approved, these actions will appear in your 
                                        Action Plan and link to your SEF narrative, showing a clear journey of improvement.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

