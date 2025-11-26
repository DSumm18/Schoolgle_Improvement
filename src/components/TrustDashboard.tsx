"use client";

import React, { useState } from 'react';
import {
    Building2, School, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle, BarChart3, Users, Target, ChevronRight,
    ArrowUpRight, ArrowDownRight, Minus, Filter, Download,
    Calendar, Award, Clock, Eye
} from 'lucide-react';

interface SchoolData {
    id: string;
    name: string;
    urn: string;
    phase: 'primary' | 'secondary' | 'special';
    isChurchSchool: boolean;
    ofstedReadiness: number;
    siamsReadiness?: number;
    lastUpdated: string;
    actionsOverdue: number;
    actionsTotal: number;
    evidenceCount: number;
    trend: 'up' | 'down' | 'stable';
    riskLevel: 'low' | 'medium' | 'high';
    headteacher: string;
}

interface TrustDashboardProps {
    trustName: string;
    schools: SchoolData[];
    onSelectSchool: (schoolId: string) => void;
}

const TrustDashboard: React.FC<TrustDashboardProps> = ({
    trustName,
    schools,
    onSelectSchool
}) => {
    const [filter, setFilter] = useState<'all' | 'primary' | 'secondary' | 'at-risk'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'readiness' | 'risk'>('readiness');

    // Calculate trust-wide metrics
    const avgOfstedReadiness = Math.round(
        schools.reduce((sum, s) => sum + s.ofstedReadiness, 0) / schools.length
    );
    
    const avgSiamsReadiness = Math.round(
        schools.filter(s => s.isChurchSchool).reduce((sum, s) => sum + (s.siamsReadiness || 0), 0) / 
        schools.filter(s => s.isChurchSchool).length || 0
    );

    const totalActionsOverdue = schools.reduce((sum, s) => sum + s.actionsOverdue, 0);
    const totalActions = schools.reduce((sum, s) => sum + s.actionsTotal, 0);
    const atRiskSchools = schools.filter(s => s.riskLevel === 'high').length;
    const churchSchools = schools.filter(s => s.isChurchSchool).length;

    // Filter and sort schools
    const filteredSchools = schools
        .filter(s => {
            if (filter === 'all') return true;
            if (filter === 'primary') return s.phase === 'primary';
            if (filter === 'secondary') return s.phase === 'secondary';
            if (filter === 'at-risk') return s.riskLevel === 'high';
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'readiness') return b.ofstedReadiness - a.ofstedReadiness;
            if (sortBy === 'risk') {
                const riskOrder = { high: 0, medium: 1, low: 2 };
                return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
            }
            return 0;
        });

    const getReadinessColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-blue-500';
        if (score >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getReadinessBg = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getRiskBadge = (risk: string) => {
        switch (risk) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <ArrowUpRight className="w-4 h-4 text-green-500" />;
            case 'down': return <ArrowDownRight className="w-4 h-4 text-red-500" />;
            default: return <Minus className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Trust Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{trustName}</h1>
                            <p className="text-slate-300">{schools.length} schools • Trust-wide overview</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                        <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Schedule Review
                        </button>
                    </div>
                </div>
            </div>

            {/* Trust-Wide Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Avg Ofsted Readiness */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <Target className="w-5 h-5 text-blue-500" />
                        <span className={`text-2xl font-bold ${getReadinessColor(avgOfstedReadiness)}`}>
                            {avgOfstedReadiness}%
                        </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Avg Ofsted Readiness</h3>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${getReadinessBg(avgOfstedReadiness)}`} style={{ width: `${avgOfstedReadiness}%` }} />
                    </div>
                </div>

                {/* Avg SIAMS Readiness */}
                {churchSchools > 0 && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <Award className="w-5 h-5 text-purple-500" />
                            <span className={`text-2xl font-bold ${getReadinessColor(avgSiamsReadiness)}`}>
                                {avgSiamsReadiness}%
                            </span>
                        </div>
                        <h3 className="font-medium text-gray-900">Avg SIAMS Readiness</h3>
                        <p className="text-xs text-gray-500 mt-1">{churchSchools} church schools</p>
                    </div>
                )}

                {/* Schools At Risk */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className={`text-2xl font-bold ${atRiskSchools > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {atRiskSchools}
                        </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Schools At Risk</h3>
                    <p className="text-xs text-gray-500 mt-1">Requiring urgent attention</p>
                </div>

                {/* Actions Overdue */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <span className={`text-2xl font-bold ${totalActionsOverdue > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                            {totalActionsOverdue}
                        </span>
                    </div>
                    <h3 className="font-medium text-gray-900">Actions Overdue</h3>
                    <p className="text-xs text-gray-500 mt-1">of {totalActions} total actions</p>
                </div>

                {/* Total Schools */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <School className="w-5 h-5 text-teal-500" />
                        <span className="text-2xl font-bold text-gray-900">{schools.length}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">Total Schools</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {schools.filter(s => s.phase === 'primary').length} primary, {schools.filter(s => s.phase === 'secondary').length} secondary
                    </p>
                </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">School Readiness Comparison</h2>
                <div className="space-y-3">
                    {schools.sort((a, b) => b.ofstedReadiness - a.ofstedReadiness).map(school => (
                        <div key={school.id} className="flex items-center gap-4">
                            <div className="w-48 truncate text-sm font-medium text-gray-700">{school.name}</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                                <div 
                                    className={`h-6 rounded-full ${getReadinessBg(school.ofstedReadiness)} transition-all`}
                                    style={{ width: `${school.ofstedReadiness}%` }}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-700">
                                    {school.ofstedReadiness}%
                                </span>
                            </div>
                            <div className="w-16 text-right">
                                {getTrendIcon(school.trend)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* School List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">All Schools</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                            >
                                <option value="all">All Schools</option>
                                <option value="primary">Primary Only</option>
                                <option value="secondary">Secondary Only</option>
                                <option value="at-risk">At Risk</option>
                            </select>
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                        >
                            <option value="readiness">Sort by Readiness</option>
                            <option value="name">Sort by Name</option>
                            <option value="risk">Sort by Risk</option>
                        </select>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {filteredSchools.map(school => (
                        <div
                            key={school.id}
                            onClick={() => onSelectSchool(school.id)}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        school.phase === 'primary' ? 'bg-blue-100' :
                                        school.phase === 'secondary' ? 'bg-purple-100' : 'bg-teal-100'
                                    }`}>
                                        <School className={`w-6 h-6 ${
                                            school.phase === 'primary' ? 'text-blue-600' :
                                            school.phase === 'secondary' ? 'text-purple-600' : 'text-teal-600'
                                        }`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{school.name}</h3>
                                            {school.isChurchSchool && (
                                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Church</span>
                                            )}
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getRiskBadge(school.riskLevel)}`}>
                                                {school.riskLevel} risk
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            URN: {school.urn} • {school.phase} • Head: {school.headteacher}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Ofsted Readiness */}
                                    <div className="text-center">
                                        <div className={`text-xl font-bold ${getReadinessColor(school.ofstedReadiness)}`}>
                                            {school.ofstedReadiness}%
                                        </div>
                                        <div className="text-xs text-gray-500">Ofsted</div>
                                    </div>

                                    {/* SIAMS Readiness */}
                                    {school.isChurchSchool && (
                                        <div className="text-center">
                                            <div className={`text-xl font-bold ${getReadinessColor(school.siamsReadiness || 0)}`}>
                                                {school.siamsReadiness}%
                                            </div>
                                            <div className="text-xs text-gray-500">SIAMS</div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="text-center">
                                        <div className={`text-xl font-bold ${school.actionsOverdue > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
                                            {school.actionsOverdue}/{school.actionsTotal}
                                        </div>
                                        <div className="text-xs text-gray-500">Overdue</div>
                                    </div>

                                    {/* Trend */}
                                    <div className="flex items-center gap-1">
                                        {getTrendIcon(school.trend)}
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
                    <BarChart3 className="w-6 h-6 text-blue-500 mb-2" />
                    <h3 className="font-semibold text-gray-900">Generate Trust Report</h3>
                    <p className="text-sm text-gray-500">Comprehensive overview for governors</p>
                </button>
                <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
                    <Users className="w-6 h-6 text-purple-500 mb-2" />
                    <h3 className="font-semibold text-gray-900">Cross-School CPD</h3>
                    <p className="text-sm text-gray-500">View training needs across trust</p>
                </button>
                <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
                    <Eye className="w-6 h-6 text-teal-500 mb-2" />
                    <h3 className="font-semibold text-gray-900">Best Practice Sharing</h3>
                    <p className="text-sm text-gray-500">See what's working across schools</p>
                </button>
            </div>
        </div>
    );
};

export default TrustDashboard;

