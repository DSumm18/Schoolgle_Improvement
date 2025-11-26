"use client";

import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    TrendingUp, 
    TrendingDown,
    FileText, 
    Users, 
    Calendar,
    AlertCircle,
    Award,
    Target,
    ArrowRight,
    RefreshCw,
    Shield,
    BookOpen,
    ClipboardCheck,
    Zap
} from 'lucide-react';

interface MondayDashboardProps {
    organizationId?: string;
    ofstedAssessments: Record<string, any>;
    siamsAssessments: Record<string, any>;
    actions: any[];
    evidenceCount: number;
    isChurchSchool?: boolean;
    onNavigate: (view: string) => void;
}

interface UrgentItem {
    id: string;
    type: 'deadline' | 'overdue' | 'compliance' | 'gap';
    title: string;
    description: string;
    dueDate?: string;
    priority: 'critical' | 'high' | 'medium';
    action: string;
    link: string;
}

interface WinItem {
    id: string;
    title: string;
    description: string;
    date: string;
    category: string;
}

const MondayDashboard: React.FC<MondayDashboardProps> = ({
    organizationId,
    ofstedAssessments,
    siamsAssessments,
    actions,
    evidenceCount,
    isChurchSchool = false,
    onNavigate
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Calculate Ofsted readiness
    const calculateOfstedReadiness = () => {
        const ratings = Object.values(ofstedAssessments)
            .filter((a: any) => a.schoolRating && a.schoolRating !== 'not_assessed')
            .map((a: any) => {
                switch (a.schoolRating) {
                    case 'exceptional': return 100;
                    case 'strong_standard': return 80;
                    case 'expected_standard': return 60;
                    case 'needs_attention': return 40;
                    case 'urgent_improvement': return 20;
                    default: return 0;
                }
            });
        
        if (ratings.length === 0) return 0;
        return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    };

    // Calculate SIAMS readiness (if church school)
    const calculateSiamsReadiness = () => {
        const ratings = Object.values(siamsAssessments)
            .filter((a: any) => a.rating && a.rating !== 'not_assessed')
            .map((a: any) => {
                switch (a.rating) {
                    case 'excellent': return 100;
                    case 'good': return 75;
                    case 'requires_improvement': return 50;
                    case 'ineffective': return 25;
                    default: return 0;
                }
            });
        
        if (ratings.length === 0) return 0;
        return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    };

    // Get urgent items
    const getUrgentItems = (): UrgentItem[] => {
        const urgent: UrgentItem[] = [];
        const today = new Date();
        
        // Check overdue actions
        actions.forEach(action => {
            if (action.status !== 'completed' && action.dueDate) {
                const dueDate = new Date(action.dueDate);
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysUntilDue < 0) {
                    urgent.push({
                        id: action.id,
                        type: 'overdue',
                        title: action.title,
                        description: `${Math.abs(daysUntilDue)} days overdue`,
                        dueDate: action.dueDate,
                        priority: 'critical',
                        action: 'Update Status',
                        link: 'actions'
                    });
                } else if (daysUntilDue <= 7) {
                    urgent.push({
                        id: action.id,
                        type: 'deadline',
                        title: action.title,
                        description: `Due in ${daysUntilDue} days`,
                        dueDate: action.dueDate,
                        priority: daysUntilDue <= 3 ? 'high' : 'medium',
                        action: 'View Action',
                        link: 'actions'
                    });
                }
            }
        });

        // Check for assessment gaps
        const assessedCount = Object.values(ofstedAssessments)
            .filter((a: any) => a.schoolRating && a.schoolRating !== 'not_assessed').length;
        
        if (assessedCount < 6) {
            urgent.push({
                id: 'assessment-gap',
                type: 'gap',
                title: 'Incomplete Self-Assessment',
                description: `${6 - assessedCount} Ofsted areas not yet assessed`,
                priority: 'high',
                action: 'Complete Assessment',
                link: 'ofsted'
            });
        }

        // Check for low evidence
        if (evidenceCount < 10) {
            urgent.push({
                id: 'evidence-gap',
                type: 'gap',
                title: 'Limited Evidence',
                description: `Only ${evidenceCount} evidence items found`,
                priority: 'medium',
                action: 'Scan Documents',
                link: 'dashboard'
            });
        }

        // Check for urgent improvement areas
        Object.entries(ofstedAssessments).forEach(([key, assessment]: [string, any]) => {
            if (assessment.schoolRating === 'urgent_improvement') {
                urgent.push({
                    id: `urgent-${key}`,
                    type: 'compliance',
                    title: 'Urgent Improvement Needed',
                    description: key.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
                    priority: 'critical',
                    action: 'Create Action Plan',
                    link: 'ofsted'
                });
            }
        });

        return urgent.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    };

    // Get recent wins
    const getWins = (): WinItem[] => {
        const wins: WinItem[] = [];
        
        // Check completed actions
        const recentCompleted = actions
            .filter(a => a.status === 'completed')
            .slice(0, 3);
        
        recentCompleted.forEach(action => {
            wins.push({
                id: action.id,
                title: action.title,
                description: 'Action completed',
                date: action.completedDate || 'Recently',
                category: 'Action'
            });
        });

        // Check for strong ratings
        Object.entries(ofstedAssessments).forEach(([key, assessment]: [string, any]) => {
            if (assessment.schoolRating === 'exceptional' || assessment.schoolRating === 'strong_standard') {
                wins.push({
                    id: `rating-${key}`,
                    title: key.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
                    description: `Rated ${assessment.schoolRating.replace('_', ' ')}`,
                    date: 'Current',
                    category: 'Assessment'
                });
            }
        });

        return wins.slice(0, 5);
    };

    const ofstedReadiness = calculateOfstedReadiness();
    const siamsReadiness = calculateSiamsReadiness();
    const urgentItems = getUrgentItems();
    const wins = getWins();

    // Get greeting based on time
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Get day of week
    const getDayOfWeek = () => {
        return currentTime.toLocaleDateString('en-GB', { weekday: 'long' });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getReadinessColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getReadinessGradient = (score: number) => {
        if (score >= 80) return 'from-green-500 to-emerald-500';
        if (score >= 60) return 'from-blue-500 to-cyan-500';
        if (score >= 40) return 'from-yellow-500 to-amber-500';
        return 'from-red-500 to-rose-500';
    };

    return (
        <div className="space-y-6">
            {/* Header with Greeting */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">{getGreeting()}! 👋</h1>
                        <p className="text-indigo-100">
                            Happy {getDayOfWeek()} - Here's your school improvement snapshot
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-indigo-200">
                            {currentTime.toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                            })}
                        </p>
                        <p className="text-2xl font-bold">
                            {currentTime.toLocaleTimeString('en-GB', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Ofsted Readiness */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className={`text-2xl font-bold ${getReadinessColor(ofstedReadiness)}`}>
                            {ofstedReadiness}%
                        </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Ofsted Readiness</h3>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${getReadinessGradient(ofstedReadiness)}`}
                            style={{ width: `${ofstedReadiness}%` }}
                        />
                    </div>
                    <button 
                        onClick={() => onNavigate('ofsted')}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        View Framework <ArrowRight size={14} />
                    </button>
                </div>

                {/* SIAMS Readiness (if church school) */}
                {isChurchSchool && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className={`text-2xl font-bold ${getReadinessColor(siamsReadiness)}`}>
                                {siamsReadiness}%
                            </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">SIAMS Readiness</h3>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full bg-gradient-to-r ${getReadinessGradient(siamsReadiness)}`}
                                style={{ width: `${siamsReadiness}%` }}
                            />
                        </div>
                        <button 
                            onClick={() => onNavigate('siams')}
                            className="mt-3 text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                            View Framework <ArrowRight size={14} />
                        </button>
                    </div>
                )}

                {/* Actions Status */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <ClipboardCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                            {actions.filter(a => a.status === 'completed').length}/{actions.length}
                        </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Actions Complete</h3>
                    <div className="mt-2 flex gap-1">
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                            {actions.filter(a => a.status === 'in_progress').length} In Progress
                        </span>
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                            {actions.filter(a => a.status === 'draft').length} Draft
                        </span>
                    </div>
                    <button 
                        onClick={() => onNavigate('actions')}
                        className="mt-3 text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                    >
                        View Actions <ArrowRight size={14} />
                    </button>
                </div>

                {/* Evidence Count */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <FileText className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{evidenceCount}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Evidence Items</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Documents matched to framework
                    </p>
                    <button 
                        onClick={() => onNavigate('dashboard')}
                        className="mt-3 text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1"
                    >
                        Scan More <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* Two Column Layout: Urgent Items + Wins */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Urgent Items */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <h2 className="font-semibold text-gray-900">Needs Attention</h2>
                            {urgentItems.length > 0 && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                    {urgentItems.length}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                        {urgentItems.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                <p className="text-gray-600">All caught up! No urgent items.</p>
                            </div>
                        ) : (
                            urgentItems.map(item => (
                                <div 
                                    key={item.id}
                                    className={`p-3 rounded-lg border ${getPriorityColor(item.priority)} flex items-start justify-between`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {item.type === 'overdue' && <Clock className="w-4 h-4" />}
                                            {item.type === 'deadline' && <Calendar className="w-4 h-4" />}
                                            {item.type === 'compliance' && <Shield className="w-4 h-4" />}
                                            {item.type === 'gap' && <AlertCircle className="w-4 h-4" />}
                                            <span className="font-medium text-sm">{item.title}</span>
                                        </div>
                                        <p className="text-xs opacity-80">{item.description}</p>
                                    </div>
                                    <button 
                                        onClick={() => onNavigate(item.link)}
                                        className="ml-3 px-3 py-1 bg-white rounded text-xs font-medium hover:bg-gray-50 border border-current/20"
                                    >
                                        {item.action}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Wins / Achievements */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            <h2 className="font-semibold text-gray-900">Recent Wins</h2>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                        {wins.length === 0 ? (
                            <div className="text-center py-8">
                                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">Complete actions and assessments to see your wins!</p>
                            </div>
                        ) : (
                            wins.map(win => (
                                <div 
                                    key={win.id}
                                    className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 flex items-start gap-3"
                                >
                                    <div className="p-1.5 bg-green-100 rounded-full">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-green-900 text-sm">{win.title}</p>
                                        <p className="text-xs text-green-700">{win.description}</p>
                                    </div>
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                        {win.category}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button 
                        onClick={() => onNavigate('ofsted')}
                        className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center group"
                    >
                        <Target className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                            Update Assessment
                        </span>
                    </button>
                    <button 
                        onClick={() => onNavigate('actions')}
                        className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-center group"
                    >
                        <ClipboardCheck className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-green-500" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                            Add Action
                        </span>
                    </button>
                    <button 
                        onClick={() => onNavigate('sef')}
                        className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-center group"
                    >
                        <FileText className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-purple-500" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                            Generate SEF
                        </span>
                    </button>
                    <button 
                        onClick={() => onNavigate('dashboard')}
                        className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-center group"
                    >
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-amber-500" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-amber-700">
                            Scan Evidence
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MondayDashboard;

