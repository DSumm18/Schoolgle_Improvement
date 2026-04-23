"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/SupabaseAuthContext';
import {
    Building2, Users, CreditCard, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle, Clock, Search, Filter,
    Download, Mail, MoreVertical, ChevronRight, Activity,
    DollarSign, Zap, BarChart3, PieChart, ArrowUpRight,
    ArrowDownRight, RefreshCw, Eye, Send, UserPlus, ClipboardList,
    FileText, Calendar, Ban, Shield, Plus, Tag
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
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
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

interface Invoice {
    id: string;
    invoice_number: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    organization: {
        id: string;
        name: string;
        urn: string | null;
    };
    total: number;
    amount_due: number;
    invoice_date: string;
    due_date: string;
    paid_at: string | null;
}

interface OnboardingItem {
    id: string;
    status: 'pending' | 'in_progress' | 'awaiting_info' | 'ready' | 'completed' | 'blocked';
    stage: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    organization: {
        id: string;
        name: string;
        urn: string | null;
    };
    checklist: Record<string, boolean>;
    assigned_to: string | null;
    created_at: string;
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

export default function AdminDashboard() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

    const [metrics, setMetrics] = useState<DashboardMetrics>({
        mrr: 0, arr: 0, totalCustomers: 0, activeCustomers: 0,
        churnRate: 0, aiCostsMonth: 0, aiRevenue: 0, grossMargin: 0,
        atRiskCount: 0, overdueInvoices: 0, overdueAmount: 0
    });
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [onboardingQueue, setOnboardingQueue] = useState<OnboardingItem[]>([]);

    const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'revenue' | 'invoices' | 'onboarding'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [healthFilter, setHealthFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    // Check super admin access
    useEffect(() => {
        async function checkSuperAdmin() {
            if (!user?.id) return;

            try {
                const res = await fetch('/api/admin/subscriptions');
                if (res.ok) {
                    setIsSuperAdmin(true);
                    loadData();
                } else {
                    setIsSuperAdmin(false);
                }
            } catch (error) {
                console.error('Error checking super admin:', error);
                setIsSuperAdmin(false);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading && user) {
            checkSuperAdmin();
        }
    }, [user, authLoading]);

    // Load dashboard data
    async function loadData() {
        try {
            // Load subscriptions with summary
            const subRes = await fetch('/api/admin/subscriptions');
            if (subRes.ok) {
                const subData = await subRes.json();
                setSubscriptions(subData.data || []);
                setMetrics({
                    mrr: Math.round((subData.summary?.mrr || 0)),
                    arr: subData.summary?.arr || 0,
                    totalCustomers: subData.summary?.total || 0,
                    activeCustomers: subData.summary?.active || 0,
                    churnRate: 0,
                    aiCostsMonth: 0,
                    aiRevenue: subData.summary?.mrr || 0,
                    grossMargin: 95,
                    atRiskCount: subData.summary?.atRisk || 0,
                    overdueInvoices: 0,
                    overdueAmount: 0
                });
            }

            // Load invoices
            const invRes = await fetch('/api/admin/invoices');
            if (invRes.ok) {
                const invData = await invRes.json();
                setInvoices(invData.data || []);
                setMetrics(prev => ({
                    ...prev,
                    overdueInvoices: invData.summary?.overdue || 0,
                    overdueAmount: invData.summary?.outstanding || 0
                }));
            }

            // Load onboarding queue
            const onboardRes = await fetch('/api/admin/onboarding-queue');
            if (onboardRes.ok) {
                const onboardData = await onboardRes.json();
                setOnboardingQueue(onboardData.data || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

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

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
            </div>
        );
    }

    if (isSuperAdmin === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-4">You don't have permission to access this area.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

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
                        <button
                            onClick={() => router.push('/admin/create-school')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Create School
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button onClick={loadData} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
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
                        { id: 'invoices', label: 'Invoices', icon: FileText },
                        { id: 'onboarding', label: 'Onboarding', icon: ClipboardList },
                        { id: 'revenue', label: 'Revenue', icon: DollarSign },
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
                            {tab.id === 'onboarding' && onboardingQueue.filter(i => i.status === 'pending' || i.status === 'in_progress').length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                                    {onboardingQueue.filter(i => i.status === 'pending' || i.status === 'in_progress').length}
                                </span>
                            )}
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

                {/* Invoices Tab */}
                {activeTab === 'invoices' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search invoices..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="all">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>
                            <button
                                onClick={() => router.push('/admin/invoices/new')}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" /> Create Invoice
                            </button>
                        </div>

                        {/* Invoice Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Outstanding</h3>
                                <p className="text-2xl font-bold text-gray-900">£{invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.amount_due, 0).toFixed(2)}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
                                <p className="text-2xl font-bold text-blue-600">{invoices.filter(i => i.status === 'sent').length}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Overdue</h3>
                                <p className="text-2xl font-bold text-red-600">{invoices.filter(i => i.status === 'overdue').length}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Paid (MTD)</h3>
                                <p className="text-2xl font-bold text-green-600">{invoices.filter(i => i.status === 'paid').length}</p>
                            </div>
                        </div>

                        {/* Invoice List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{inv.invoice_number}</p>
                                                    <p className="text-xs text-gray-500">{inv.invoice_date}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm text-gray-900">{inv.organization.name}</p>
                                                {inv.organization.urn && <p className="text-xs text-gray-500">URN: {inv.organization.urn}</p>}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-medium text-gray-900">£{inv.amount_due.toFixed(2)}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm text-gray-600">{inv.due_date}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                    inv.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-1 hover:bg-gray-100 rounded" title="View">
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    {inv.status === 'sent' || inv.status === 'overdue' ? (
                                                        <button className="p-1 hover:bg-gray-100 rounded" title="Send reminder">
                                                            <Send className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    ) : null}
                                                    {inv.status === 'draft' ? (
                                                        <button className="p-1 hover:bg-gray-100 rounded" title="Send">
                                                            <Send className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {invoices.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No invoices found
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Onboarding Tab */}
                {activeTab === 'onboarding' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search onboarding queue..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    />
                                </div>
                                <select
                                    className="px-4 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="awaiting_info">Awaiting Info</option>
                                    <option value="ready">Ready</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <button
                                    onClick={() => router.push('/admin/onboarding')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    View Pipeline
                                </button>
                                <button
                                    onClick={() => router.push('/admin/discounts')}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                                >
                                    <Tag className="w-4 h-4" />
                                    Discount Codes
                                </button>
                            </div>
                        </div>
                                <select
                                    className="px-4 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="awaiting_info">Awaiting Info</option>
                                    <option value="ready">Ready</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        {/* Onboarding Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
                                <p className="text-2xl font-bold text-yellow-600">{onboardingQueue.filter(i => i.status === 'pending').length}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">In Progress</h3>
                                <p className="text-2xl font-bold text-blue-600">{onboardingQueue.filter(i => i.status === 'in_progress').length}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Awaiting Info</h3>
                                <p className="text-2xl font-bold text-orange-600">{onboardingQueue.filter(i => i.status === 'awaiting_info').length}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Ready</h3>
                                <p className="text-2xl font-bold text-green-600">{onboardingQueue.filter(i => i.status === 'ready').length}</p>
                            </div>
                        </div>

                        {/* Onboarding Queue */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {onboardingQueue.map(item => {
                                        const completedItems = Object.values(item.checklist || {}).filter(v => v === true).length;
                                        const totalItems = Object.keys(item.checklist || {}).length;
                                        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <p className="font-medium text-gray-900 text-sm">{item.organization.name}</p>
                                                    {item.organization.urn && <p className="text-xs text-gray-500">URN: {item.organization.urn}</p>}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-gray-600 capitalize">{item.stage.replace('_', ' ')}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        item.status === 'awaiting_info' ? 'bg-orange-100 text-orange-700' :
                                                        item.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {item.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                        item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                        item.priority === 'low' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {item.priority}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="h-2 rounded-full bg-green-500"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-gray-600">{progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button className="p-1 hover:bg-gray-100 rounded" title="View">
                                                            <Eye className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                        <button className="p-1 hover:bg-gray-100 rounded" title="Assign">
                                                            <UserPlus className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                        <button className="p-1 hover:bg-gray-100 rounded" title="Complete">
                                                            <CheckCircle className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {onboardingQueue.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No onboarding items found
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Usage Tab - DISABLED FOR NOW */}
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

