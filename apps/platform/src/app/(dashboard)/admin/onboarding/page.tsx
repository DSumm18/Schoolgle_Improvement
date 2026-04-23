"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import { motion } from "framer-motion";
import {
    Building2, Mail, Phone, User, Calendar, Shield,
    CheckCircle, Clock, AlertCircle, XCircle, Send, X,
    MoreVertical, Search, Filter, ChevronDown, Play,
    RefreshCw, Loader2, ArrowLeft, Zap, FileText
} from "lucide-react";

interface OnboardingLead {
    id: string;
    urn: string | null;
    name: string;
    la_name: string | null;
    phase: string | null;
    school_type: string | null;
    address: string | null;
    postcode: string | null;
    website: string | null;
    contact_name: string;
    contact_email: string;
    contact_phone: string | null;
    contact_role: string | null;
    interested_modules: string[];
    plan_interest: string | null;
    timeline: string | null;
    status: string;
    notes: string | null;
    trial_start: string | null;
    trial_end: string | null;
    trial_organization_id: string | null;
    created_at: string;
    last_contacted_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    contacted: { label: 'Contacted', color: 'bg-purple-100 text-purple-700', icon: Mail },
    trial_started: { label: 'Trial Started', color: 'bg-emerald-100 text-emerald-700', icon: Play },
    trial_active: { label: 'Trial Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    quote_sent: { label: 'Quote Sent', color: 'bg-amber-100 text-amber-700', icon: FileText },
    negotiating: { label: 'Negotiating', color: 'bg-indigo-100 text-indigo-700', icon: Clock },
    converted: { label: 'Converted', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
    not_interested: { label: 'Not Interested', color: 'bg-slate-100 text-slate-700', icon: XCircle },
    unresponsive: { label: 'Unresponsive', color: 'bg-red-100 text-red-700', icon: X },
};

// Solar System Module Names (matches current module registry)
const MODULE_NAMES: Record<string, string> = {
    // Mercury - School Improvement
    'improvement': 'School Improvement',
    'ofsted-readiness': 'School Improvement', // Legacy mapping

    // Venus - Governance
    'governance': 'Governance',

    // Earth - Business Operations
    'estates': 'Business',
    'estates-compliance': 'Business', // Legacy mapping
    'hr-people': 'Business (HR)', // Legacy mapping

    // Mars - Compliance & Safeguarding
    'compliance': 'Compliance',
    'safeguarding': 'Compliance', // Legacy mapping

    // Jupiter - Communications
    'communications': 'Communications',
    'calendar': 'Communications', // Legacy mapping

    // Saturn - Intelligence
    'intelligence': 'Intelligence',
    'school-intelligence': 'Intelligence', // Legacy mapping

    // Uranus - Teaching & Learning
    'teaching': 'Teaching & Learning',

    // Ed AI (not a module, but listed for backwards compatibility)
    'ed-ai': 'Ed AI',
    'actions-hub': 'Actions', // Legacy mapping
};

export default function AdminOnboardingPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
    const [leads, setLeads] = useState<OnboardingLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Fetch leads
    const fetchLeads = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                limit: '50',
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });

            const response = await fetch(`/api/admin/onboarding?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch leads');
            }

            setLeads(data.data || []);

        } catch (err: any) {
            console.error('Fetch leads error:', err);
            setError(err.message || 'Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    // Check super admin access
    useEffect(() => {
        async function checkAccess() {
            if (!user?.id) return;

            try {
                const res = await fetch('/api/admin/onboarding');
                if (res.ok) {
                    setIsSuperAdmin(true);
                    fetchLeads();
                } else {
                    setIsSuperAdmin(false);
                }
            } catch (error) {
                console.error('Error checking access:', error);
                setIsSuperAdmin(false);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading && user) {
            checkAccess();
        }
    }, [user, authLoading, statusFilter]);

    // Update lead status
    const updateStatus = async (leadId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/onboarding/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            fetchLeads();
        } catch (err) {
            console.error('Update status error:', err);
            alert('Failed to update status. Please try again.');
        }
    };

    // Start trial
    const startTrial = async (leadId: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        if (!confirm(`Start trial for ${lead.name}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/onboarding/${leadId}/start-trial`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start trial');
            }

            alert(`Trial started! Organization created: ${data.organization?.name}\nWelcome email sent to: ${lead.contact_email}`);
            fetchLeads();

        } catch (err: any) {
            console.error('Start trial error:', err);
            alert(err.message || 'Failed to start trial. Please try again.');
        }
    };

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.urn?.includes(searchQuery);

        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Format date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-slate-500 dark:text-slate-400">This page is for super admins only.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/admin')}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    Onboarding<span className="text-slate-400 dark:text-slate-600"> Pipeline</span>
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {leads.length} leads in pipeline
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={fetchLeads}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by school, name, email, URN..."
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/20"
                        >
                            <option value="all">All Statuses</option>
                            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            {/* Error state */}
            {error && (
                <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Leads list */}
            <div className="p-6 space-y-4">
                {filteredLeads.length === 0 ? (
                    <div className="text-center py-12">
                        <Building2 className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            {searchQuery || statusFilter !== 'all' ? 'No leads match your filters' : 'No leads yet'}
                        </p>
                    </div>
                ) : (
                    filteredLeads.map((lead) => (
                        <motion.div
                            key={lead.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-6">
                                {/* Main content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-4">
                                        {/* School icon */}
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <button
                                                    onClick={() => router.push(`/admin/onboarding/${lead.id}`)}
                                                    className="text-lg font-bold text-slate-900 dark:text-white truncate hover:text-blue-500 dark:hover:text-blue-400 transition-colors text-left"
                                                >
                                                    {lead.name}
                                                </button>
                                                {getStatusBadge(lead.status)}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                                                {lead.urn && (
                                                    <span className="font-mono">URN: {lead.urn}</span>
                                                )}
                                                {lead.la_name && <span>{lead.la_name}</span>}
                                                {lead.phase && <span>{lead.phase}</span>}
                                                <span>Submitted {formatDate(lead.created_at)}</span>
                                            </div>

                                            {/* Module tags */}
                                            {lead.interested_modules.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {lead.interested_modules.slice(0, 5).map((moduleId) => (
                                                        <span
                                                            key={moduleId}
                                                            className="px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium"
                                                        >
                                                            {MODULE_NAMES[moduleId] || moduleId}
                                                        </span>
                                                    ))}
                                                    {lead.interested_modules.length > 5 && (
                                                        <span className="px-2 py-1 text-slate-400 text-xs">
                                                            +{lead.interested_modules.length - 5} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Contact info */}
                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                    <User className="w-4 h-4" />
                                                    <span>{lead.contact_name}</span>
                                                    {lead.contact_role && <span className="text-slate-400">({lead.contact_role})</span>}
                                                </div>
                                                <a
                                                    href={`mailto:${lead.contact_email}`}
                                                    className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    <span>{lead.contact_email}</span>
                                                </a>
                                                {lead.contact_phone && (
                                                    <a
                                                        href={`tel:${lead.contact_phone}`}
                                                        className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        <span>{lead.contact_phone}</span>
                                                    </a>
                                                )}
                                                {lead.timeline && (
                                                    <span className="text-slate-400">Timeline: {lead.timeline}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    {lead.status === 'new' && (
                                        <button
                                            onClick={() => startTrial(lead.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Start Trial
                                        </button>
                                    )}
                                    {lead.status === 'new' && (
                                        <button
                                            onClick={() => updateStatus(lead.id, 'contacted')}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                            Contacted
                                        </button>
                                    )}
                                    {lead.status === 'trial_started' && (
                                        <button
                                            onClick={() => updateStatus(lead.id, 'trial_active')}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Active
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            const notes = prompt('Add notes:', lead.notes || '');
                                            if (notes !== null) {
                                                // Would need a separate endpoint for updating notes
                                                alert('Notes update not implemented yet');
                                            }
                                        }}
                                        className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Notes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
