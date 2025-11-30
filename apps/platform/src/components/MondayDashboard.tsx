"use client";

import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    FileText, 
    Calendar,
    AlertCircle,
    Award,
    Target,
    ArrowRight,
    Shield,
    BookOpen,
    ClipboardCheck,
    Zap,
    TrendingUp
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

const MondayDashboard: React.FC<MondayDashboardProps> = ({
    organizationId,
    ofstedAssessments,
    siamsAssessments,
    actions,
    evidenceCount,
    isChurchSchool = false,
    onNavigate
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    
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
        return Math.round(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length);
    };

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
        return Math.round(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length);
    };

    const getUrgentItems = (): UrgentItem[] => {
        const urgent: UrgentItem[] = [];
        const today = new Date();
        
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

        return urgent.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    };

    const ofstedReadiness = calculateOfstedReadiness();
    const siamsReadiness = calculateSiamsReadiness();
    const urgentItems = getUrgentItems();
    const completedActions = actions.filter(a => a.status === 'completed').length;
    const inProgressActions = actions.filter(a => a.status === 'in_progress').length;

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getDayOfWeek = () => {
        return currentTime.toLocaleDateString('en-GB', { weekday: 'long' });
    };

    return (
        <div className="space-y-8">
            {/* Clean Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
                        {getGreeting()}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Happy {getDayOfWeek()} · Here's your school improvement snapshot
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">
                        {currentTime.toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                        })}
                    </p>
                    <p className="text-3xl font-light text-gray-900 tabular-nums">
                        {currentTime.toLocaleTimeString('en-GB', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Ofsted Readiness */}
                <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors cursor-pointer"
                     onClick={() => onNavigate('ofsted')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                            <Target className="w-5 h-5 text-gray-700" />
                        </div>
                        <span className="text-3xl font-medium text-gray-900">
                            {ofstedReadiness}%
                        </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Ofsted Readiness</h3>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                            className="h-1.5 rounded-full bg-gray-900 transition-all"
                            style={{ width: `${ofstedReadiness}%` }}
                        />
                    </div>
                    <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                        View Framework <ArrowRight className="w-3 h-3" />
                    </p>
                </div>

                {/* SIAMS Readiness */}
                {isChurchSchool && (
                    <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors cursor-pointer"
                         onClick={() => onNavigate('siams')}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-gray-700" />
                            </div>
                            <span className="text-3xl font-medium text-gray-900">
                                {siamsReadiness}%
                            </span>
                        </div>
                        <h3 className="font-medium text-gray-900">SIAMS Readiness</h3>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                                className="h-1.5 rounded-full bg-gray-900 transition-all"
                                style={{ width: `${siamsReadiness}%` }}
                            />
                        </div>
                        <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                            View Framework <ArrowRight className="w-3 h-3" />
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors cursor-pointer"
                     onClick={() => onNavigate('actions')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5 text-gray-700" />
                        </div>
                        <span className="text-3xl font-medium text-gray-900">
                            {completedActions}/{actions.length}
                        </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Actions Complete</h3>
                    <div className="mt-3 flex gap-2">
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md">
                            {inProgressActions} In Progress
                        </span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md">
                            {actions.length - completedActions - inProgressActions} Draft
                        </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                        View Actions <ArrowRight className="w-3 h-3" />
                    </p>
                </div>

                {/* Evidence */}
                <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-700" />
                        </div>
                        <span className="text-3xl font-medium text-gray-900">
                            {evidenceCount}
                        </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Evidence Items</h3>
                    <p className="text-sm text-gray-500 mt-1">Documents matched to framework</p>
                    <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                        Scan More <ArrowRight className="w-3 h-3" />
                    </p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Needs Attention */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <h2 className="font-medium text-gray-900">Needs Attention</h2>
                        </div>
                        {urgentItems.length > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                {urgentItems.length}
                            </span>
                        )}
                    </div>
                    <div className="divide-y divide-gray-50">
                        {urgentItems.length === 0 ? (
                            <div className="p-8 text-center">
                                <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">All caught up! No urgent items.</p>
                            </div>
                        ) : (
                            urgentItems.slice(0, 5).map((item) => (
                                <div 
                                    key={item.id} 
                                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => onNavigate(item.link)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                item.priority === 'critical' ? 'bg-red-50' :
                                                item.priority === 'high' ? 'bg-amber-50' : 'bg-gray-100'
                                            }`}>
                                                <AlertCircle className={`w-4 h-4 ${
                                                    item.priority === 'critical' ? 'text-red-500' :
                                                    item.priority === 'high' ? 'text-amber-500' : 'text-gray-500'
                                                }`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{item.title}</p>
                                                <p className="text-sm text-gray-500">{item.description}</p>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                                            {item.action}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions / Recent Activity */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gray-400" />
                        <h2 className="font-medium text-gray-900">Quick Actions</h2>
                    </div>
                    <div className="p-4 space-y-2">
                        <button 
                            onClick={() => onNavigate('ofsted')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                    <Target className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Complete Self-Assessment</p>
                                    <p className="text-sm text-gray-500">Review Ofsted judgement areas</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        <button 
                            onClick={() => onNavigate('actions')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                    <ClipboardCheck className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Manage Actions</p>
                                    <p className="text-sm text-gray-500">Track improvement priorities</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                            onClick={() => onNavigate('reports')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Generate Reports</p>
                                    <p className="text-sm text-gray-500">SEF, SDP, Pupil Premium</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                            onClick={() => onNavigate('voice')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Voice Observation</p>
                                    <p className="text-sm text-gray-500">Record lesson observations</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MondayDashboard;
