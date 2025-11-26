"use client";

import { useState } from 'react';
import { 
    X, Eye, Save, Clock, User, BookOpen, Target, 
    CheckCircle, AlertTriangle, TrendingUp, MessageSquare,
    Star, ThumbsUp, ThumbsDown, Lightbulb, GraduationCap
} from 'lucide-react';

interface ObservationData {
    id?: string;
    date: string;
    teacher: string;
    subject: string;
    yearGroup: string;
    focusArea: string;
    duration: number;
    
    // Ratings (1-4 scale matching Ofsted)
    ratings: {
        subjectKnowledge: number;
        pedagogicalSkills: number;
        adaptiveTeaching: number;
        assessment: number;
        behaviour: number;
        engagement: number;
    };
    
    // Qualitative
    strengths: string;
    areasForDevelopment: string;
    nextSteps: string;
    
    // Teaching quality flags
    isSchemeFollowed: boolean;
    isCPDNeeded: boolean;
    isSupportPlanNeeded: boolean;
    
    // Overall
    overallJudgement: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate';
    
    // Meta
    observerId: string;
    observerName: string;
    linkedFrameworkArea?: string;
}

interface LessonObservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (observation: ObservationData) => void;
    initialData?: Partial<ObservationData>;
    currentUser?: { id: string; name: string };
}

const FOCUS_AREAS = [
    'Quality of Education - Intent',
    'Quality of Education - Implementation', 
    'Quality of Education - Impact',
    'Reading/Phonics',
    'Mathematics',
    'Behaviour Management',
    'SEND Provision',
    'Assessment for Learning',
    'Adaptive Teaching',
    'Subject Knowledge',
];

const SUBJECTS = [
    'English', 'Mathematics', 'Science', 'History', 'Geography',
    'Art', 'Music', 'PE', 'Computing', 'RE', 'PSHE', 'MFL',
    'Phonics', 'Reading', 'Writing', 'Foundation Subjects'
];

const YEAR_GROUPS = [
    'Nursery', 'Reception', 'Year 1', 'Year 2', 'Year 3',
    'Year 4', 'Year 5', 'Year 6'
];

const RATING_LABELS = {
    1: { label: 'Inadequate', color: 'bg-red-500', description: 'Significant concerns' },
    2: { label: 'Requires Improvement', color: 'bg-yellow-500', description: 'Not yet good' },
    3: { label: 'Good', color: 'bg-blue-500', description: 'Effective practice' },
    4: { label: 'Outstanding', color: 'bg-green-500', description: 'Exceptional practice' },
};

export default function LessonObservationModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    currentUser
}: LessonObservationModalProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'ratings' | 'notes' | 'summary'>('details');
    const [observation, setObservation] = useState<Partial<ObservationData>>({
        date: new Date().toISOString().split('T')[0],
        duration: 20,
        ratings: {
            subjectKnowledge: 3,
            pedagogicalSkills: 3,
            adaptiveTeaching: 3,
            assessment: 3,
            behaviour: 3,
            engagement: 3,
        },
        isSchemeFollowed: true,
        isCPDNeeded: false,
        isSupportPlanNeeded: false,
        observerId: currentUser?.id || '',
        observerName: currentUser?.name || '',
        ...initialData
    });

    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const [edInsights, setEdInsights] = useState<string | null>(null);

    if (!isOpen) return null;

    const updateRating = (key: keyof ObservationData['ratings'], value: number) => {
        setObservation(prev => ({
            ...prev,
            ratings: {
                ...prev.ratings!,
                [key]: value
            }
        }));
    };

    const calculateOverallFromRatings = (): ObservationData['overallJudgement'] => {
        const ratings = observation.ratings;
        if (!ratings) return 'requires_improvement';
        
        const values = Object.values(ratings);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        
        if (avg >= 3.5) return 'outstanding';
        if (avg >= 2.5) return 'good';
        if (avg >= 1.5) return 'requires_improvement';
        return 'inadequate';
    };

    const generateEdInsights = async () => {
        setIsGeneratingInsights(true);
        
        // Simulate Ed analyzing the observation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const ratings = observation.ratings;
        const weakAreas = ratings ? Object.entries(ratings)
            .filter(([_, v]) => v <= 2)
            .map(([k, _]) => k.replace(/([A-Z])/g, ' $1').toLowerCase()) : [];
        
        let insight = "**Ed's Analysis:**\n\n";
        
        if (weakAreas.length === 0) {
            insight += "✅ This lesson demonstrates strong practice across all areas. ";
            insight += "Consider sharing this teacher's approaches in CPD sessions.\n\n";
            insight += "**EEF Connection:** High-quality teaching is the most important lever schools have to improve pupil outcomes.";
        } else {
            insight += `⚠️ Areas needing attention: ${weakAreas.join(', ')}.\n\n`;
            
            if (weakAreas.some(a => a.includes('adaptive'))) {
                insight += "**EEF Insight:** Adaptive teaching (differentiation) shows +4 months progress when done well. ";
                insight += "Recommend CPD on responsive teaching strategies.\n\n";
            }
            
            if (weakAreas.some(a => a.includes('assessment'))) {
                insight += "**EEF Insight:** Feedback (+6 months) relies on effective assessment. ";
                insight += "Consider training on formative assessment techniques.\n\n";
            }
            
            if (!observation.isSchemeFollowed) {
                insight += "🚨 **Critical:** Scheme not being followed. This needs immediate leadership intervention. ";
                insight += "If the scheme is validated (e.g., Little Wandle, White Rose), fidelity is essential for impact.\n\n";
            }
        }
        
        if (observation.isSupportPlanNeeded) {
            insight += "\n📋 **Recommendation:** Create a formal support plan with clear targets and weekly monitoring.";
        }
        
        setEdInsights(insight);
        setIsGeneratingInsights(false);
    };

    const handleSave = () => {
        const finalObservation: ObservationData = {
            id: observation.id || `obs-${Date.now()}`,
            date: observation.date || new Date().toISOString().split('T')[0],
            teacher: observation.teacher || '',
            subject: observation.subject || '',
            yearGroup: observation.yearGroup || '',
            focusArea: observation.focusArea || '',
            duration: observation.duration || 20,
            ratings: observation.ratings || {
                subjectKnowledge: 3,
                pedagogicalSkills: 3,
                adaptiveTeaching: 3,
                assessment: 3,
                behaviour: 3,
                engagement: 3,
            },
            strengths: observation.strengths || '',
            areasForDevelopment: observation.areasForDevelopment || '',
            nextSteps: observation.nextSteps || '',
            isSchemeFollowed: observation.isSchemeFollowed ?? true,
            isCPDNeeded: observation.isCPDNeeded ?? false,
            isSupportPlanNeeded: observation.isSupportPlanNeeded ?? false,
            overallJudgement: observation.overallJudgement || calculateOverallFromRatings(),
            observerId: observation.observerId || '',
            observerName: observation.observerName || '',
            linkedFrameworkArea: observation.linkedFrameworkArea,
        };
        
        onSave(finalObservation);
        onClose();
    };

    const RatingSelector = ({ 
        label, 
        value, 
        onChange,
        description 
    }: { 
        label: string; 
        value: number; 
        onChange: (v: number) => void;
        description?: string;
    }) => (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {description && (
                        <p className="text-xs text-gray-500">{description}</p>
                    )}
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                    value === 4 ? 'bg-green-100 text-green-700' :
                    value === 3 ? 'bg-blue-100 text-blue-700' :
                    value === 2 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                }`}>
                    {RATING_LABELS[value as keyof typeof RATING_LABELS].label}
                </span>
            </div>
            <div className="flex gap-2">
                {[1, 2, 3, 4].map(rating => (
                    <button
                        key={rating}
                        onClick={() => onChange(rating)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            value === rating
                                ? `${RATING_LABELS[rating as keyof typeof RATING_LABELS].color} text-white shadow-md`
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {rating}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Eye size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Lesson Observation</h2>
                                <p className="text-violet-200 text-sm">Record teaching quality evidence</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <nav className="flex">
                        {[
                            { id: 'details', label: 'Details', icon: BookOpen },
                            { id: 'ratings', label: 'Ratings', icon: Star },
                            { id: 'notes', label: 'Notes', icon: MessageSquare },
                            { id: 'summary', label: 'Summary', icon: Target },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-violet-500 text-violet-600 bg-white'
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
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={observation.date}
                                        onChange={e => setObservation({ ...observation, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                                    <select
                                        value={observation.duration}
                                        onChange={e => setObservation({ ...observation, duration: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                    >
                                        <option value={10}>10 minutes (Drop-in)</option>
                                        <option value={20}>20 minutes (Learning Walk)</option>
                                        <option value={30}>30 minutes (Part Lesson)</option>
                                        <option value={45}>45 minutes (Full Lesson)</option>
                                        <option value={60}>60 minutes (Extended)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                                <input
                                    type="text"
                                    value={observation.teacher || ''}
                                    onChange={e => setObservation({ ...observation, teacher: e.target.value })}
                                    placeholder="Teacher name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select
                                        value={observation.subject || ''}
                                        onChange={e => setObservation({ ...observation, subject: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                    >
                                        <option value="">Select subject...</option>
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Group</label>
                                    <select
                                        value={observation.yearGroup || ''}
                                        onChange={e => setObservation({ ...observation, yearGroup: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                    >
                                        <option value="">Select year...</option>
                                        {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Focus Area</label>
                                <select
                                    value={observation.focusArea || ''}
                                    onChange={e => setObservation({ ...observation, focusArea: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">Select focus...</option>
                                    {FOCUS_AREAS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Ratings Tab */}
                    {activeTab === 'ratings' && (
                        <div className="space-y-2">
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="text-sm text-gray-600">
                                    <strong>Rating Scale:</strong> 1 = Inadequate, 2 = Requires Improvement, 3 = Good, 4 = Outstanding
                                </p>
                            </div>

                            <RatingSelector
                                label="Subject Knowledge"
                                description="Does the teacher have secure knowledge of the subject?"
                                value={observation.ratings?.subjectKnowledge || 3}
                                onChange={v => updateRating('subjectKnowledge', v)}
                            />
                            
                            <RatingSelector
                                label="Pedagogical Skills"
                                description="Are explanations clear? Is content well-sequenced?"
                                value={observation.ratings?.pedagogicalSkills || 3}
                                onChange={v => updateRating('pedagogicalSkills', v)}
                            />
                            
                            <RatingSelector
                                label="Adaptive Teaching"
                                description="Is teaching adapted for different learners including SEND?"
                                value={observation.ratings?.adaptiveTeaching || 3}
                                onChange={v => updateRating('adaptiveTeaching', v)}
                            />
                            
                            <RatingSelector
                                label="Assessment & Feedback"
                                description="Is assessment used to check understanding? Is feedback effective?"
                                value={observation.ratings?.assessment || 3}
                                onChange={v => updateRating('assessment', v)}
                            />
                            
                            <RatingSelector
                                label="Behaviour Management"
                                description="Are expectations clear? Is behaviour consistently managed?"
                                value={observation.ratings?.behaviour || 3}
                                onChange={v => updateRating('behaviour', v)}
                            />
                            
                            <RatingSelector
                                label="Pupil Engagement"
                                description="Are pupils engaged and making progress in the lesson?"
                                value={observation.ratings?.engagement || 3}
                                onChange={v => updateRating('engagement', v)}
                            />

                            {/* Critical Flags */}
                            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <h4 className="font-medium text-yellow-800 mb-3">Critical Checks</h4>
                                
                                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={observation.isSchemeFollowed}
                                        onChange={e => setObservation({ ...observation, isSchemeFollowed: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                    />
                                    <span className="text-sm text-gray-700">Curriculum scheme is being followed with fidelity</span>
                                </label>
                                
                                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={observation.isCPDNeeded}
                                        onChange={e => setObservation({ ...observation, isCPDNeeded: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                    />
                                    <span className="text-sm text-gray-700">CPD recommended for this teacher</span>
                                </label>
                                
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={observation.isSupportPlanNeeded}
                                        onChange={e => setObservation({ ...observation, isSupportPlanNeeded: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                    />
                                    <span className="text-sm text-gray-700">Formal support plan needed</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === 'notes' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <ThumbsUp size={14} className="inline mr-1 text-green-600" />
                                    Strengths Observed
                                </label>
                                <textarea
                                    value={observation.strengths || ''}
                                    onChange={e => setObservation({ ...observation, strengths: e.target.value })}
                                    placeholder="What went well in this lesson?"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <TrendingUp size={14} className="inline mr-1 text-yellow-600" />
                                    Areas for Development
                                </label>
                                <textarea
                                    value={observation.areasForDevelopment || ''}
                                    onChange={e => setObservation({ ...observation, areasForDevelopment: e.target.value })}
                                    placeholder="What could be improved?"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Target size={14} className="inline mr-1 text-blue-600" />
                                    Next Steps / Actions
                                </label>
                                <textarea
                                    value={observation.nextSteps || ''}
                                    onChange={e => setObservation({ ...observation, nextSteps: e.target.value })}
                                    placeholder="Specific actions for the teacher..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Summary Tab */}
                    {activeTab === 'summary' && (
                        <div className="space-y-4">
                            {/* Overall Judgement */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Overall Judgement</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['outstanding', 'good', 'requires_improvement', 'inadequate'] as const).map(j => (
                                        <button
                                            key={j}
                                            onClick={() => setObservation({ ...observation, overallJudgement: j })}
                                            className={`py-3 rounded-lg text-sm font-medium transition-all ${
                                                observation.overallJudgement === j || (!observation.overallJudgement && calculateOverallFromRatings() === j)
                                                    ? j === 'outstanding' ? 'bg-green-500 text-white' :
                                                      j === 'good' ? 'bg-blue-500 text-white' :
                                                      j === 'requires_improvement' ? 'bg-yellow-500 text-white' :
                                                      'bg-red-500 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {j.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ed's Analysis */}
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={20} className="text-emerald-600" />
                                        <span className="font-medium text-emerald-800">Ed's Analysis</span>
                                    </div>
                                    <button
                                        onClick={generateEdInsights}
                                        disabled={isGeneratingInsights}
                                        className="text-sm px-3 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                                    >
                                        {isGeneratingInsights ? 'Analyzing...' : 'Generate Insights'}
                                    </button>
                                </div>
                                
                                {edInsights ? (
                                    <div className="text-sm text-emerald-900 whitespace-pre-wrap">
                                        {edInsights}
                                    </div>
                                ) : (
                                    <p className="text-sm text-emerald-700">
                                        Click "Generate Insights" for Ed's EEF-backed analysis of this observation.
                                    </p>
                                )}
                            </div>

                            {/* Warning Flags */}
                            {(observation.isCPDNeeded || observation.isSupportPlanNeeded || !observation.isSchemeFollowed) && (
                                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                    <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                                        <AlertTriangle size={18} />
                                        Actions Required
                                    </h4>
                                    <ul className="text-sm text-red-700 space-y-1">
                                        {!observation.isSchemeFollowed && (
                                            <li>• Scheme not being followed - leadership intervention required</li>
                                        )}
                                        {observation.isCPDNeeded && (
                                            <li>• CPD recommended - add to professional development plan</li>
                                        )}
                                        {observation.isSupportPlanNeeded && (
                                            <li>• Formal support plan needed - schedule meeting with teacher</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Link to Framework */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Link to Ofsted Framework Area
                                </label>
                                <select
                                    value={observation.linkedFrameworkArea || ''}
                                    onChange={e => setObservation({ ...observation, linkedFrameworkArea: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">Select area (optional)...</option>
                                    <option value="quality-intent">Quality of Education - Intent</option>
                                    <option value="quality-implementation">Quality of Education - Implementation</option>
                                    <option value="quality-impact">Quality of Education - Impact</option>
                                    <option value="behaviour">Behaviour & Attitudes</option>
                                    <option value="personal-development">Personal Development</option>
                                    <option value="leadership">Leadership & Management</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
                    >
                        <Save size={18} />
                        Save Observation
                    </button>
                </div>
            </div>
        </div>
    );
}

