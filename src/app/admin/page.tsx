"use client";

import { useState, useEffect } from 'react';
import {
    Building2, Users, CreditCard, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle, Clock, Search, Filter,
    Download, Mail, MoreVertical, ChevronRight, Activity,
    DollarSign, Zap, BarChart3, PieChart, ArrowUpRight,
    ArrowDownRight, RefreshCw, Eye, Send
} from 'lucide-react';

// Types
interface Subscription {
    id: string;
    organization: {
        id: string;
        name: string;
        type: 'school' | 'trust';
        schoolCount: number;
    };
    plan: 'core' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'past_due';
    paymentMethod: 'card' | 'invoice';
    finalPriceAnnual: number;
    currentPeriodEnd: string;
    startedAt: string;
    health: {
        score: number;
        status: 'healthy' | 'neutral' | 'at_risk' | 'critical';
        lastLogin: string;
        aiSpend: number;
    };
}

interface DashboardMetrics {
    mrr: number;
    arr: number;
    totalCustomers: number;
    activeCustomers: number;
    churnRate: number;
    aiCostsMonth: number;
    aiRevenue: number;
    grossMargin: number;
    atRiskCount: number;
    overdueInvoices: number;
    overdueAmount: number;
}

// Mock data - replace with real API calls
const mockMetrics: DashboardMetrics = {
    mrr: 18500,
    arr: 222000,
    totalCustomers: 89,
    activeCustomers: 84,
    churnRate: 2.3,
    aiCostsMonth: 892,
    aiRevenue: 18500,
    grossMargin: 95.2,
    atRiskCount: 7,
    overdueInvoices: 3,
    overdueAmount: 4497
};

const mockSubscriptions: Subscription[] = [
    {
        id: '1',
        organization: { id: 'o1', name: 'St Mary\'s Primary School', type: 'school', schoolCount: 1 },
        plan: 'professional',
        status: 'active',
        paymentMethod: 'invoice',
        finalPriceAnnual: 2499,
        currentPeriodEnd: '2025-11-15',
        startedAt: '2024-11-15',
        health: { score: 92, status: 'healthy', lastLogin: '2 hours ago', aiSpend: 12.45 }
    },
    {
        id: '2',
        organization: { id: 'o2', name: 'Inspire Academy Trust', type: 'trust', schoolCount: 8 },
        plan: 'enterprise',
        status: 'active',
        paymentMethod: 'card',
        finalPriceAnnual: 25592,
        currentPeriodEnd: '2025-08-20',
        startedAt: '2024-08-20',
        health: { score: 78, status: 'neutral', lastLogin: '3 days ago', aiSpend: 89.23 }
    },
    {
        id: '3',
        organization: { id: 'o3', name: 'Oakwood Academy', type: 'school', schoolCount: 1 },
        plan: 'core',
        status: 'active',
        paymentMethod: 'invoice',
        finalPriceAnnual: 1499,
        currentPeriodEnd: '2025-12-01',
        startedAt: '2024-12-01',
        health: { score: 34, status: 'at_risk', lastLogin: '21 days ago', aiSpend: 0.12 }
    },
    {
        id: '4',
        organization: { id: 'o4', name: 'Riverside Primary', type: 'school', schoolCount: 1 },
        plan: 'professional',
        status: 'past_due',
        paymentMethod: 'invoice',
        finalPriceAnnual: 2499,
        currentPeriodEnd: '2025-10-15',
        startedAt: '2024-10-15',
        health: { score: 18, status: 'critical', lastLogin: '45 days ago', aiSpend: 0 }
    },
];

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics>(mockMetrics);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions);
    const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'revenue' | 'usage'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [healthFilter, setHealthFilter] = useState<string>('all');

    const filteredSubscriptions = subscriptions.filter(sub => {
        const matchesSearch = sub.organization.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
        const matchesHealth = healthFilter === 'all' || sub.health.status === healthFilter;
        return matchesSearch && matchesStatus && matchesHealth;
    });

    const getHealthColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-100 text-green-700';
            case 'neutral': return 'bg-blue-100 text-blue-700';
            case 'at_risk': return 'bg-yellow-100 text-yellow-700';
            case 'critical': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-gray-100 text-gray-700';
            case 'past_due': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl">🏫</span>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Schoolgle Admin</h1>
                            <p className="text-sm text-gray-500">Subscription & Usage Management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <nav className="flex gap-6">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'customers', label: 'Customers', icon: Building2 },
                        { id: 'revenue', label: 'Revenue', icon: DollarSign },
                        { id: 'usage', label: 'Usage & AI Costs', icon: Activity }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                                activeTab === tab.id 
                                    ? 'border-gray-900 text-gray-900' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <main className="p-6 space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-sm">MRR</span>
                                    <span className="text-green-500 text-xs flex items-center">
                                        <ArrowUpRight className="w-3 h-3" /> +12%
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    £{metrics.mrr.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">ARR: £{metrics.arr.toLocaleString()}</p>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-sm">Customers</span>
                                    <span className="text-green-500 text-xs flex items-center">
                                        <ArrowUpRight className="w-3 h-3" /> +5
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</p>
                                <p className="text-sm text-gray-500">{metrics.activeCustomers} active</p>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-sm">AI Costs (MTD)</span>
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    £{metrics.aiCostsMonth.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Margin: {metrics.grossMargin}%
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-sm">At Risk</span>
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                </div>
                                <p className="text-2xl font-bold text-red-600">{metrics.atRiskCount}</p>
                                <p className="text-sm text-gray-500">Need attention</p>
                            </div>
                        </div>

                        {/* Alerts */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h2 className="font-semibold text-gray-900 mb-4">⚠️ Requires Attention</h2>
                            <div className="space-y-3">
                                {metrics.overdueInvoices > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-5 h-5 text-red-500" />
                                            <div>
                                                <p className="font-medium text-gray-900">{metrics.overdueInvoices} overdue invoices</p>
                                                <p className="text-sm text-gray-500">£{metrics.overdueAmount.toLocaleString()} outstanding</p>
                                            </div>
                                        </div>
                                        <button className="text-red-600 text-sm font-medium hover:underline">
                                            View all →
                                        </button>
                                    </div>
                                )}
                                {subscriptions.filter(s => s.health.status === 'critical').map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                            <div>
                                                <p className="font-medium text-gray-900">{sub.organization.name}</p>
                                                <p className="text-sm text-gray-500">No login for 45+ days • Health score: {sub.health.score}</p>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium hover:bg-yellow-200">
                                            <Mail className="w-4 h-4 inline mr-1" /> Reach out
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Customers */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900">Recent Customers</h2>
                                <button className="text-gray-600 text-sm font-medium hover:underline">
                                    View all →
                                </button>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {subscriptions.slice(0, 5).map(sub => (
                                    <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                sub.organization.type === 'trust' ? 'bg-purple-100' : 'bg-blue-100'
                                            }`}>
                                                <Building2 className={`w-5 h-5 ${
                                                    sub.organization.type === 'trust' ? 'text-purple-600' : 'text-blue-600'
                                                }`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{sub.organization.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {sub.plan} • £{sub.finalPriceAnnual.toLocaleString()}/yr
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getHealthColor(sub.health.status)}`}>
                                                {sub.health.score}% health
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(sub.status)}`}>
                                                {sub.status}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Customers Tab */}
                {activeTab === 'customers' && (
                    <>
                        {/* Filters */}
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search customers..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="past_due">Past Due</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select
                                value={healthFilter}
                                onChange={(e) => setHealthFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg"
                            >
                                <option value="all">All Health</option>
                                <option value="healthy">Healthy</option>
                                <option value="neutral">Neutral</option>
                                <option value="at_risk">At Risk</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        {/* Customer List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Spend</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSubscriptions.map(sub => (
                                        <tr key={sub.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        sub.organization.type === 'trust' ? 'bg-purple-100' : 'bg-blue-100'
                                                    }`}>
                                                        <Building2 className={`w-4 h-4 ${
                                                            sub.organization.type === 'trust' ? 'text-purple-600' : 'text-blue-600'
                                                        }`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{sub.organization.name}</p>
                                                        {sub.organization.type === 'trust' && (
                                                            <p className="text-xs text-gray-500">{sub.organization.schoolCount} schools</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-gray-900 capitalize">{sub.plan}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm font-medium text-gray-900">
                                                    £{sub.finalPriceAnnual.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-gray-500">/yr</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full ${
                                                                sub.health.score >= 70 ? 'bg-green-500' :
                                                                sub.health.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${sub.health.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-600">{sub.health.score}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-gray-600">{sub.health.lastLogin}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-gray-900">£{sub.health.aiSpend.toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(sub.status)}`}>
                                                    {sub.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-1 hover:bg-gray-100 rounded" title="View">
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button className="p-1 hover:bg-gray-100 rounded" title="Email">
                                                        <Mail className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button className="p-1 hover:bg-gray-100 rounded" title="More">
                                                        <MoreVertical className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Usage Tab */}
                {activeTab === 'usage' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Total AI Spend (MTD)</h3>
                                <p className="text-3xl font-bold text-gray-900">£{metrics.aiCostsMonth}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Revenue: £{metrics.aiRevenue.toLocaleString()} | Margin: {metrics.grossMargin}%
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">AI Queries (MTD)</h3>
                                <p className="text-3xl font-bold text-gray-900">12,847</p>
                                <p className="text-sm text-gray-500 mt-1">Avg £0.069 per query</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Most Used Feature</h3>
                                <p className="text-3xl font-bold text-gray-900">Ed Chat</p>
                                <p className="text-sm text-gray-500 mt-1">8,234 queries this month</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h2 className="font-semibold text-gray-900 mb-4">AI Cost by Customer (Top 10)</h2>
                            <div className="space-y-3">
                                {[
                                    { name: 'Inspire Academy Trust', spend: 89.23, queries: 1247 },
                                    { name: 'Excellence Education Group', spend: 67.45, queries: 892 },
                                    { name: 'St Mary\'s Primary', spend: 12.45, queries: 234 },
                                    { name: 'Hillside Secondary', spend: 8.90, queries: 156 },
                                    { name: 'Parkview Academy', spend: 6.34, queries: 98 },
                                ].map((customer, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500 w-6">{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                                                <span className="text-sm text-gray-900">£{customer.spend.toFixed(2)}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-500 h-2 rounded-full"
                                                    style={{ width: `${(customer.spend / 89.23) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500 w-20 text-right">{customer.queries} queries</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h2 className="font-semibold text-gray-900 mb-4">Feature Usage Breakdown</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { feature: 'Ed AI Chat', count: 8234, icon: '💬' },
                                    { feature: 'Mock Inspector', count: 1847, icon: '🔍' },
                                    { feature: 'Voice Observations', count: 923, icon: '🎤' },
                                    { feature: 'Report Generation', count: 456, icon: '📄' },
                                    { feature: 'Action Planning', count: 2341, icon: '✅' },
                                    { feature: 'Self Assessment', count: 1892, icon: '📊' },
                                    { feature: 'Evidence Upload', count: 734, icon: '📁' },
                                    { feature: 'SEF Generation', count: 89, icon: '📝' },
                                ].map((item, i) => (
                                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                                        <span className="text-2xl">{item.icon}</span>
                                        <p className="font-medium text-gray-900 mt-2">{item.feature}</p>
                                        <p className="text-sm text-gray-500">{item.count.toLocaleString()} uses</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Revenue Tab */}
                {activeTab === 'revenue' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Recurring Revenue</h3>
                                <p className="text-3xl font-bold text-gray-900">£{metrics.mrr.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Annual Run Rate</h3>
                                <p className="text-3xl font-bold text-gray-900">£{metrics.arr.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Overdue Invoices</h3>
                                <p className="text-3xl font-bold text-red-600">£{metrics.overdueAmount.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">{metrics.overdueInvoices} invoices</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Churn Rate</h3>
                                <p className="text-3xl font-bold text-gray-900">{metrics.churnRate}%</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h2 className="font-semibold text-gray-900 mb-4">Revenue by Plan</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <p className="text-sm text-gray-500">Core (£1,499)</p>
                                    <p className="text-2xl font-bold text-gray-900">23 customers</p>
                                    <p className="text-sm text-gray-600">£34,477 ARR</p>
                                </div>
                                <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                                    <p className="text-sm text-gray-500">Professional (£2,499)</p>
                                    <p className="text-2xl font-bold text-gray-900">52 customers</p>
                                    <p className="text-sm text-gray-600">£129,948 ARR</p>
                                </div>
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <p className="text-sm text-gray-500">Enterprise (£3,999)</p>
                                    <p className="text-2xl font-bold text-gray-900">14 customers</p>
                                    <p className="text-sm text-gray-600">£55,986 ARR</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h2 className="font-semibold text-gray-900 mb-4">Upcoming Renewals (Next 30 Days)</h2>
                            <div className="space-y-3">
                                {subscriptions.filter(s => s.status === 'active').slice(0, 5).map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{sub.organization.name}</p>
                                            <p className="text-sm text-gray-500">Renews {sub.currentPeriodEnd}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">£{sub.finalPriceAnnual.toLocaleString()}</p>
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                sub.paymentMethod === 'card' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {sub.paymentMethod === 'card' ? 'Auto-charge' : 'Invoice pending'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

