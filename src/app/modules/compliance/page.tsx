"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Shield, FileText, AlertTriangle, CheckCircle, Clock, Users,
    Plus, Search, Eye, Edit, Send, History, ChevronRight, ArrowLeft
} from 'lucide-react';
import OrigamiParticles from '@/components/OrigamiParticles';

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
}

// Mock data
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
        isStatutory: true
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
        isStatutory: true
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
        isStatutory: true
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
        isStatutory: true
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
        isStatutory: true
    }
];

export default function ComplianceModulePage() {
    const [activeTab, setActiveTab] = useState<'policies' | 'compliance' | 'governance'>('policies');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

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

    return (
        <div className="min-h-screen bg-white relative">
            {/* Origami Particle Background */}
            <OrigamiParticles text="Compliance" opacity={0.04} />
            
            {/* Header */}
            <header className="relative z-10 border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/modules" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm">Modules</span>
                        </Link>
                        <div className="w-px h-6 bg-gray-200" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900">Compliance</span>
                        </div>
                    </div>
                    <Link 
                        href="/dashboard"
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Dashboard
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Hero */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-medium tracking-tight text-gray-900 mb-3">
                        Policy Hub
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl">
                        Manage policies with version control and staff acknowledgment tracking. 
                        Everything here feeds directly into your Ofsted evidence.
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
                >
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <p className="text-sm text-gray-500 mb-1">Total Policies</p>
                        <p className="text-3xl font-medium text-gray-900">{policyStats.total}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <p className="text-sm text-gray-500 mb-1">Current</p>
                        <p className="text-3xl font-medium text-gray-900">{policyStats.current}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <p className="text-sm text-gray-500 mb-1">Review Due</p>
                        <p className="text-3xl font-medium text-amber-600">{policyStats.reviewDue}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-red-100">
                        <p className="text-sm text-gray-500 mb-1">Overdue</p>
                        <p className="text-3xl font-medium text-red-600">{policyStats.overdue}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <p className="text-sm text-gray-500 mb-1">Staff Acknowledged</p>
                        <p className="text-3xl font-medium text-gray-900">{policyStats.acknowledgementRate}%</p>
                    </div>
                </motion.div>

                {/* Tabs */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="border-b border-gray-100 mb-8"
                >
                    <nav className="flex gap-8">
                        {[
                            { id: 'policies', label: 'Policy Hub', icon: FileText },
                            { id: 'compliance', label: 'Statutory Compliance', icon: Shield },
                            { id: 'governance', label: 'Governance', icon: Users }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2 py-4 border-b-2 font-medium transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </motion.div>

                {/* Policy Hub Tab */}
                {activeTab === 'policies' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Toolbar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 max-w-md">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search policies..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-gray-200"
                                >
                                    <option value="all">All Status</option>
                                    <option value="current">Current</option>
                                    <option value="review_due">Review Due</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>
                            <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Policy
                            </button>
                        </div>

                        {/* Alert */}
                        {policyStats.overdue > 0 && (
                            <div className="bg-red-50 rounded-2xl p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{policyStats.overdue} policy is overdue for review</p>
                                    <p className="text-sm text-gray-500">Overdue policies create compliance gaps. Review immediately.</p>
                                </div>
                                <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">
                                    Review Now
                                </button>
                            </div>
                        )}

                        {/* Policy List */}
                        <div className="bg-gray-50 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Review</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Read</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {filteredPolicies.map(policy => (
                                        <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900">{policy.name}</p>
                                                        {policy.isStatutory && (
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">Statutory</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{policy.category} • v{policy.version}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`
                                                    inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                                                    ${policy.status === 'current' ? 'bg-gray-100 text-gray-700' : ''}
                                                    ${policy.status === 'review_due' ? 'bg-amber-50 text-amber-700' : ''}
                                                    ${policy.status === 'overdue' ? 'bg-red-50 text-red-700' : ''}
                                                `}>
                                                    {policy.status === 'current' && 'Current'}
                                                    {policy.status === 'review_due' && 'Review Due'}
                                                    {policy.status === 'overdue' && 'Overdue'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm text-gray-900">{new Date(policy.nextReview).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm text-gray-900">{policy.owner}</p>
                                                <p className="text-xs text-gray-500">{policy.approvedBy}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                                        <div 
                                                            className="bg-gray-900 h-1.5 rounded-full"
                                                            style={{ width: `${(policy.staffAcknowledged / policy.staffTotal) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-500">{policy.staffAcknowledged}/{policy.staffTotal}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                                                        <Eye className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                                                        <Edit className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Send">
                                                        <Send className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Ofsted Impact */}
                        <div className="bg-gray-900 rounded-2xl p-8">
                            <h3 className="text-lg font-medium text-white mb-6">Why this matters for Ofsted</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white mb-1">Instant Evidence</p>
                                        <p className="text-sm text-gray-400">Inspectors see policies are current with one click</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white mb-1">Staff Know</p>
                                        <p className="text-sm text-gray-400">Acknowledgment tracking proves staff have read policies</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white mb-1">No Gaps</p>
                                        <p className="text-sm text-gray-400">Auto-reminders mean you're never caught non-compliant</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Other tabs */}
                {activeTab === 'compliance' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-20"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Statutory Compliance</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Full DfE GEMS aligned compliance tracking coming soon. Fire, Legionella, PAT testing and more.
                        </p>
                    </motion.div>
                )}

                {activeTab === 'governance' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-20"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Governance</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Governor portal, meeting management, and board paper distribution coming soon.
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
