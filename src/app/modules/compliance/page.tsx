"use client";

import { useState } from 'react';
import {
    Shield, FileText, AlertTriangle, CheckCircle, Clock, Users,
    Plus, Search, Filter, Download, ChevronRight, Calendar,
    Eye, Edit, Trash2, Send, Bell, History, Lock, Globe
} from 'lucide-react';

// Types
interface Policy {
    id: string;
    name: string;
    category: string;
    version: string;
    status: 'current' | 'review_due' | 'overdue' | 'draft';
    lastReviewed: string;
    nextReview: string;
    owner: string;
    approvedBy: string;
    staffAcknowledged: number;
    staffTotal: number;
    isStatutory: boolean;
    ofstedRelevant: boolean;
    documentUrl?: string;
}

interface ComplianceCheck {
    id: string;
    name: string;
    category: string;
    frequency: string;
    lastCompleted: string;
    nextDue: string;
    status: 'compliant' | 'due_soon' | 'overdue';
    assignedTo: string;
    evidence?: string;
}

// Mock data - would come from Supabase
const mockPolicies: Policy[] = [
    {
        id: '1',
        name: 'Safeguarding & Child Protection Policy',
        category: 'Safeguarding',
        version: '3.2',
        status: 'current',
        lastReviewed: '2024-09-01',
        nextReview: '2025-09-01',
        owner: 'Sarah Johnson (DSL)',
        approvedBy: 'Governors - Sep 2024',
        staffAcknowledged: 45,
        staffTotal: 48,
        isStatutory: true,
        ofstedRelevant: true
    },
    {
        id: '2',
        name: 'Behaviour Policy',
        category: 'Behaviour',
        version: '2.1',
        status: 'review_due',
        lastReviewed: '2024-01-15',
        nextReview: '2025-01-15',
        owner: 'Mark Williams (DHT)',
        approvedBy: 'Governors - Jan 2024',
        staffAcknowledged: 48,
        staffTotal: 48,
        isStatutory: true,
        ofstedRelevant: true
    },
    {
        id: '3',
        name: 'SEND Policy',
        category: 'SEND',
        version: '1.4',
        status: 'overdue',
        lastReviewed: '2023-11-01',
        nextReview: '2024-11-01',
        owner: 'Emma Brown (SENCO)',
        approvedBy: 'Governors - Nov 2023',
        staffAcknowledged: 42,
        staffTotal: 48,
        isStatutory: true,
        ofstedRelevant: true
    },
    {
        id: '4',
        name: 'Attendance Policy',
        category: 'Attendance',
        version: '2.0',
        status: 'current',
        lastReviewed: '2024-06-01',
        nextReview: '2025-06-01',
        owner: 'Jane Smith (AHT)',
        approvedBy: 'Governors - Jun 2024',
        staffAcknowledged: 48,
        staffTotal: 48,
        isStatutory: true,
        ofstedRelevant: true
    },
    {
        id: '5',
        name: 'Health & Safety Policy',
        category: 'Health & Safety',
        version: '4.1',
        status: 'current',
        lastReviewed: '2024-08-01',
        nextReview: '2025-08-01',
        owner: 'Tom Davies (SBM)',
        approvedBy: 'Governors - Aug 2024',
        staffAcknowledged: 47,
        staffTotal: 48,
        isStatutory: true,
        ofstedRelevant: true
    }
];

const mockComplianceChecks: ComplianceCheck[] = [
    {
        id: '1',
        name: 'Fire Alarm Test',
        category: 'Fire Safety',
        frequency: 'Weekly',
        lastCompleted: '2025-11-25',
        nextDue: '2025-12-02',
        status: 'compliant',
        assignedTo: 'Site Team'
    },
    {
        id: '2',
        name: 'Fire Drill',
        category: 'Fire Safety',
        frequency: 'Termly',
        lastCompleted: '2025-09-15',
        nextDue: '2025-12-15',
        status: 'due_soon',
        assignedTo: 'SLT'
    },
    {
        id: '3',
        name: 'Legionella Temperature Checks',
        category: 'Water Safety',
        frequency: 'Monthly',
        lastCompleted: '2025-10-28',
        nextDue: '2025-11-28',
        status: 'overdue',
        assignedTo: 'Site Team'
    }
];

export default function ComplianceModulePage() {
    const [activeTab, setActiveTab] = useState<'policies' | 'compliance' | 'governance'>('policies');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showAddPolicy, setShowAddPolicy] = useState(false);

    // Filter policies
    const filteredPolicies = mockPolicies.filter(policy => {
        const matchesSearch = policy.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const policyStats = {
        total: mockPolicies.length,
        current: mockPolicies.filter(p => p.status === 'current').length,
        reviewDue: mockPolicies.filter(p => p.status === 'review_due').length,
        overdue: mockPolicies.filter(p => p.status === 'overdue').length,
        acknowledgementRate: Math.round(
            (mockPolicies.reduce((sum, p) => sum + p.staffAcknowledged, 0) / 
            mockPolicies.reduce((sum, p) => sum + p.staffTotal, 0)) * 100
        )
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'current':
            case 'compliant':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Current</span>;
            case 'review_due':
            case 'due_soon':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Review Due</span>;
            case 'overdue':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Overdue</span>;
            case 'draft':
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Draft</span>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Shield className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Compliance & Governance</h1>
                                <p className="text-red-100">Policies, statutory compliance & governance</p>
                            </div>
                        </div>
                        <a href="/modules" className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                            ← All Modules
                        </a>
                    </div>
                </div>
            </header>

            {/* Ofsted Connection Banner */}
            <div className="bg-blue-50 border-b border-blue-200">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-sm text-blue-800">
                            <strong>Ofsted Connection:</strong> All policies stored here automatically feed into your 
                            School Improvement evidence for Leadership & Management and Safeguarding judgements.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Total Policies</p>
                        <p className="text-2xl font-bold text-gray-900">{policyStats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Current</p>
                        <p className="text-2xl font-bold text-green-600">{policyStats.current}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Review Due</p>
                        <p className="text-2xl font-bold text-yellow-600">{policyStats.reviewDue}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 border-red-200 bg-red-50">
                        <p className="text-sm text-gray-500">Overdue</p>
                        <p className="text-2xl font-bold text-red-600">{policyStats.overdue}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Staff Acknowledged</p>
                        <p className="text-2xl font-bold text-gray-900">{policyStats.acknowledgementRate}%</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="border-b border-gray-200">
                    <nav className="flex gap-6">
                        {[
                            { id: 'policies', label: 'Policy Hub', icon: FileText },
                            { id: 'compliance', label: 'Statutory Compliance', icon: Shield },
                            { id: 'governance', label: 'Governance', icon: Users }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-6">
                {/* Policy Hub Tab */}
                {activeTab === 'policies' && (
                    <div className="space-y-6">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search policies..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="all">All Status</option>
                                    <option value="current">Current</option>
                                    <option value="review_due">Review Due</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                            <button 
                                onClick={() => setShowAddPolicy(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Policy
                            </button>
                        </div>

                        {/* Alert for overdue */}
                        {policyStats.overdue > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-red-900">{policyStats.overdue} policy is overdue for review</p>
                                    <p className="text-sm text-red-700">Schools must maintain current policies. Overdue policies create compliance gaps.</p>
                                </div>
                                <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
                                    Review Now
                                </button>
                            </div>
                        )}

                        {/* Policy List */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Review</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Read</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPolicies.map(policy => (
                                        <tr key={policy.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900">{policy.name}</p>
                                                        {policy.isStatutory && (
                                                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Statutory</span>
                                                        )}
                                                        {policy.ofstedRelevant && (
                                                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Ofsted</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{policy.category} • v{policy.version}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {getStatusBadge(policy.status)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm text-gray-900">{new Date(policy.nextReview).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm text-gray-900">{policy.owner}</p>
                                                <p className="text-xs text-gray-500">{policy.approvedBy}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-green-500 h-2 rounded-full"
                                                            style={{ width: `${(policy.staffAcknowledged / policy.staffTotal) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-600">{policy.staffAcknowledged}/{policy.staffTotal}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                                                        <Edit className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Send for Acknowledgment">
                                                        <Send className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Version History">
                                                        <History className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Why this matters */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Why Policy Management Matters for Ofsted</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Instant Evidence</p>
                                        <p className="text-sm text-gray-600">Inspectors can see policies are current with one click</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Staff Know</p>
                                        <p className="text-sm text-gray-600">Acknowledgment tracking proves staff have read policies</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                        <Clock className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">No Gaps</p>
                                        <p className="text-sm text-gray-600">Auto-reminders mean you're never caught non-compliant</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statutory Compliance Tab */}
                {activeTab === 'compliance' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Statutory Compliance Checks</h3>
                            <p className="text-gray-600 mb-4">
                                Track fire safety, water hygiene, electrical testing and all statutory requirements. 
                                Coming soon with full DfE GEMS alignment.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {mockComplianceChecks.map(check => (
                                    <div 
                                        key={check.id}
                                        className={`p-4 rounded-xl border-2 ${
                                            check.status === 'overdue' ? 'border-red-200 bg-red-50' :
                                            check.status === 'due_soon' ? 'border-yellow-200 bg-yellow-50' :
                                            'border-green-200 bg-green-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium text-gray-900">{check.name}</h4>
                                            {getStatusBadge(check.status)}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{check.category} • {check.frequency}</p>
                                        <p className="text-sm text-gray-500">Next due: {new Date(check.nextDue).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Governance Tab */}
                {activeTab === 'governance' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Governance & Board Management</h3>
                            <p className="text-gray-600">
                                Governor portal, meeting management, and board paper distribution. Coming soon.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

