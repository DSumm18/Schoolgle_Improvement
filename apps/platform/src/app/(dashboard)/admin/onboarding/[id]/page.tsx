"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import { motion } from "framer-motion";
import {
    ArrowLeft, Building2, Mail, Phone, User, Calendar, Shield,
    CheckCircle, Clock, AlertCircle, X, Send, Play, Edit3, Save,
    MapPin, Globe, FileText, RefreshCw, Loader2, Zap, CreditCard,
    DollarSign, Users, CheckSquare, Square, Download, Search,
    FileSignature, Receipt, Building, Database
} from "lucide-react";

interface OnboardingLead {
    id: string;
    urn: string | null;
    name: string;
    la_name: string | null;
    la_code: string | null;
    phase: string | null;
    school_type: string | null;
    address: string | null;
    postcode: string | null;
    website: string | null;
    phone: string | null;
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
    converted_to_subscription_id: string | null;
    dfe_data_fetched: boolean;
    dfe_data: any;
    created_at: string;
    updated_at: string;
    last_contacted_at: string | null;
    // New fields for full onboarding
    trust_name: string | null;
    pupil_count: number | null;
    headteacher_name: string | null;
    headteacher_email: string | null;
    school_phone: string | null;
    billing_contact_name: string | null;
    billing_contact_email: string | null;
    approver_name: string | null;
    approver_email: string | null;
    company_number: string | null;
    dpo_name: string | null;
    dpo_email: string | null;
    payment_method: string | null;
    quote_amount: number | null;
    discount_code: string | null;
    discount_amount: number | null;
    final_amount: number | null;
    plan_selected: string | null;
    billing_period: string | null;
    quote_generated_at: string | null;
    contract_sent_at: string | null;
    contract_signed_at: string | null;
    docusign_envelope_id: string | null;
    invoice_id: string | null;
    invoice_sent_at: string | null;
    invoice_paid_at: string | null;
    details_completed_at: string | null;
    completion_token: string | null;
}

interface OrganizationInfo {
    id: string;
    name: string;
    urn: string | null;
    trial_ends_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    contacted: { label: 'Contacted', color: 'bg-purple-100 text-purple-700', icon: Mail },
    trial_started: { label: 'Trial Started', color: 'bg-emerald-100 text-emerald-700', icon: Play },
    trial_active: { label: 'Trial Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    quote_sent: { label: 'Quote Sent', color: 'bg-amber-100 text-amber-700', icon: FileText },
    negotiating: { label: 'Negotiating', color: 'bg-indigo-100 text-indigo-700', icon: Clock },
    converted: { label: 'Converted', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
    not_interested: { label: 'Not Interested', color: 'bg-slate-100 text-slate-700', icon: X },
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
    'estates': 'Business Operations',
    'estates-compliance': 'Business Operations', // Legacy mapping
    'hr-people': 'Business Operations (HR)', // Legacy mapping

    // Mars - Compliance & Safeguarding
    'compliance': 'Compliance & Safeguarding',
    'safeguarding': 'Compliance & Safeguarding', // Legacy mapping

    // Jupiter - Communications
    'communications': 'Communications',
    'calendar': 'Communications (Calendar)', // Legacy mapping

    // Saturn - Intelligence
    'intelligence': 'Schoolgle Intelligence',
    'school-intelligence': 'Schoolgle Intelligence', // Legacy mapping
    'canvas': 'Schoolgle Intelligence', // Canvas is part of Intelligence

    // Uranus - Teaching & Learning
    'teaching': 'Teaching & Learning',

    // Ed AI (not a module, but listed for backwards compatibility)
    'ed-ai': 'Ed AI Assistant',
};

const PLAN_NAMES: Record<string, string> = {
    core: 'Core (£1,499/yr)',
    professional: 'Professional (£2,499/yr)',
    enterprise: 'Enterprise (£3,999/yr)',
    not_sure: 'Not Sure',
};

export default function LeadDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const leadId = params.id as string;

    const [lead, setLead] = useState<OnboardingLead | null>(null);
    const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

    // Editing states
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState('');

    // Modal states
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [convertData, setConvertData] = useState({
        plan: 'core',
        discountPercent: 0,
        paymentMethod: 'invoice',
        userLimit: 3,
    });

    // Quote/Contract/Invoice states
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [quoteData, setQuoteData] = useState({
        planType: 'core',
        billingPeriod: 'annual',
        selectedModules: [] as string[],
        discountCode: '',
        userLimit: 3,
    });
    const [generatedQuote, setGeneratedQuote] = useState<any>(null);
    const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
    const [dfeData, setDfeData] = useState<any>(null);
    const [fetchingDfe, setFetchingDfe] = useState(false);

    // Check access and load lead
    useEffect(() => {
        async function checkAndLoad() {
            if (!user?.id) return;

            try {
                const res = await fetch('/api/admin/onboarding');
                if (res.ok) {
                    setIsSuperAdmin(true);
                    await loadLead();
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

        if (user) checkAndLoad();
    }, [user, leadId]);

    async function loadLead() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/onboarding/${leadId}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to load lead');
            }

            setLead(data.data);
            setNotesValue(data.data?.notes || '');

            // Load organization if trial started
            if (data.data?.trial_organization_id) {
                await loadOrganization(data.data.trial_organization_id);
            }
        } catch (err: any) {
            console.error('Load lead error:', err);
            setError(err.message || 'Failed to load lead');
        } finally {
            setLoading(false);
        }
    }

    async function loadOrganization(orgId: string) {
        try {
            const res = await fetch(`/api/organization/${orgId}`);
            if (res.ok) {
                const data = await res.json();
                setOrganization(data.data);
            }
        } catch (err) {
            console.error('Load org error:', err);
        }
    }

    async function updateStatus(newStatus: string) {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/onboarding/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update status');
            }

            await loadLead();
        } catch (err: any) {
            alert(err.message || 'Failed to update status');
        } finally {
            setSaving(false);
        }
    }

    async function saveNotes() {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/onboarding/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: notesValue }),
            });

            if (!res.ok) {
                throw new Error('Failed to save notes');
            }

            setEditingNotes(false);
            await loadLead();
        } catch (err) {
            alert('Failed to save notes');
        } finally {
            setSaving(false);
        }
    }

    async function startTrial() {
        if (!lead) return;
        if (!confirm(`Start 30-day trial for ${lead.name}?`)) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/onboarding/${leadId}/start-trial`, {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to start trial');
            }

            alert(`Trial started!\n\nOrganization: ${data.organization?.name}\nWelcome email sent to: ${lead.contact_email}`);
            await loadLead();
        } catch (err: any) {
            alert(err.message || 'Failed to start trial');
        } finally {
            setSaving(false);
        }
    }

    async function convertToPaid() {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/onboarding/${leadId}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(convertData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to convert');
            }

            alert(`Converted to paid subscription!\n\nPlan: ${convertData.plan}\nPrice: £${(convertData.discountPercent ? (1499 * (1 - convertData.discountPercent / 100)).toFixed(0) : '1499')}/year`);
            setShowConvertModal(false);
            await loadLead();
        } catch (err: any) {
            alert(err.message || 'Failed to convert');
        } finally {
            setSaving(false);
        }
    }

    // Fetch DfE data by URN
    async function fetchDfeData() {
        if (!lead?.urn) {
            alert('No URN available for DfE lookup');
            return;
        }

        setFetchingDfe(true);
        try {
            const res = await fetch(`/api/admin/onboarding/${leadId}/fetch-dfe`, {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch DfE data');
            }

            setDfeData(data.dfeData);
            alert(`DfE data fetched!\n\n${data.dfeData?.name}\nPupils: ${data.dfeData?.pupil_count || 'N/A'}\nHeadteacher: ${data.dfeData?.headteacher_name || 'N/A'}`);
            await loadLead();
        } catch (err: any) {
            alert(err.message || 'Failed to fetch DfE data');
        } finally {
            setFetchingDfe(false);
        }
    }

    // Generate quote
    async function generateQuote() {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/onboarding/${leadId}/quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quoteData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate quote');
            }

            setGeneratedQuote(data.quote);
            setShowQuoteModal(false);
            await loadLead();
            alert(`Quote generated!\n\nQuote Number: ${data.quote?.quote_number}\nTotal: £${(data.quote?.total / 100).toFixed(2)}\nValid until: ${new Date(data.quote?.valid_until).toLocaleDateString('en-GB')}`);
        } catch (err: any) {
            alert(err.message || 'Failed to generate quote');
        } finally {
            setSaving(false);
        }
    }

    // Generate invoice
    async function generateInvoice() {
        if (!generatedQuote) {
            alert('Please generate a quote first');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/onboarding/${leadId}/invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteId: generatedQuote.id,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate invoice');
            }

            setGeneratedInvoice(data.invoice);
            await loadLead();
            alert(`Invoice generated!\n\nInvoice Number: ${data.invoice?.invoice_number}\nTotal: £${(data.invoice?.total / 100).toFixed(2)}\nDue: ${new Date(data.invoice?.due_date).toLocaleDateString('en-GB')}`);
        } catch (err: any) {
            alert(err.message || 'Failed to generate invoice');
        } finally {
            setSaving(false);
        }
    }

    // Send completion email (link to form)
    async function sendCompletionEmail() {
        if (!lead?.completion_token) {
            // Generate token if not exists
            try {
                const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                await fetch(`/api/admin/onboarding/${leadId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completion_token: token }),
                });
                await loadLead();
            } catch (err) {
                alert('Failed to generate completion token');
                return;
            }
        }

        const completionUrl = `${window.location.origin}/onboarding/complete?token=${lead.completion_token}`;

        // Copy to clipboard and open email
        navigator.clipboard.writeText(completionUrl);
        window.location.href = `mailto:${lead.contact_email}?subject=Complete Your Schoolgle Onboarding&body=Hi ${lead.contact_name},%0D%0A%0D%0APlease complete your onboarding details here:%0D%0A%0D%0A${completionUrl}%0D%0A%0D%0AThis link will allow you to verify your school details and provide billing information.%0D%0A%0D%0AThanks,%0D%0ASchoolgle Team`;
    }

    // Send contract via DocuSign
    async function sendContract() {
        if (!lead?.approver_email) {
            alert('Approver email required. Please ask the school to provide this.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/onboarding/${leadId}/contract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send contract');
            }

            await loadLead();
            alert(`Contract sent for signature!\n\nDocuSign envelope sent to: ${lead.approver_email}\nThey can sign electronically.`);
        } catch (err: any) {
            alert(err.message || 'Failed to send contract');
        } finally {
            setSaving(false);
        }
    }

    function formatDate(dateStr: string | null) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    function getStatusBadge(status: string) {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <Icon className="w-4 h-4" />
                {config.label}
            </span>
        );
    }

    if (loading || isSuperAdmin === null) {
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
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-slate-500">Super admin only</p>
                </div>
            </div>
        );
    }

    if (!lead && !loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Lead Not Found</h1>
                    <button onClick={() => router.push('/admin/onboarding')} className="mt-4 text-blue-500">
                        Back to Pipeline
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/admin/onboarding')}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{lead?.name}</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {lead?.urn && `URN: ${lead.urn} • `}
                                    Lead ID: {leadId.slice(0, 8)}...
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(lead?.status || 'new')}
                            <button
                                onClick={loadLead}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            >
                                <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-6 max-w-7xl mx-auto space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Organization Alert if trial active */}
                {organization && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <p className="font-medium text-emerald-900 dark:text-emerald-100">
                                        Trial Active
                                    </p>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                        Organization: {organization.name}
                                        {organization.trial_ends_at && ` • Ends: ${formatDate(organization.trial_ends_at)}`}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`/admin/customer/${organization.id}`}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                            >
                                View Customer
                            </a>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - School & Contact Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* School Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                School Details
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">School Name</p>
                                    <p className="text-slate-900 dark:text-white font-medium">{lead?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">URN</p>
                                    <p className="font-mono text-slate-900 dark:text-white">{lead?.urn || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Phase</p>
                                    <p className="text-slate-900 dark:text-white">{lead?.phase || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">School Type</p>
                                    <p className="text-slate-900 dark:text-white">{lead?.school_type || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Local Authority</p>
                                    <p className="text-slate-900 dark:text-white">{lead?.la_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">LA Code</p>
                                    <p className="font-mono text-slate-900 dark:text-white">{lead?.la_code || '-'}</p>
                                </div>
                                {lead?.address && (
                                    <div className="col-span-2">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Address</p>
                                        <p className="text-slate-900 dark:text-white flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {lead.address} {lead.postcode}
                                        </p>
                                    </div>
                                )}
                                {lead?.website && (
                                    <div className="col-span-2">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Website</p>
                                        <a
                                            href={lead.website}
                                            target="_blank"
                                            rel="noopener"
                                            className="text-blue-500 hover:underline flex items-center gap-1"
                                        >
                                            <Globe className="w-4 h-4" />
                                            {lead.website}
                                        </a>
                                    </div>
                                )}
                                {lead?.phone && (
                                    <div className="col-span-2">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">School Phone</p>
                                        <p className="text-slate-900 dark:text-white">{lead.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Contact Details
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Name</p>
                                    <p className="text-slate-900 dark:text-white font-medium">{lead?.contact_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Role</p>
                                    <p className="text-slate-900 dark:text-white">{lead?.contact_role || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Email</p>
                                    <a
                                        href={`mailto:${lead?.contact_email}`}
                                        className="text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                        <Mail className="w-4 h-4" />
                                        {lead?.contact_email}
                                    </a>
                                </div>
                                {lead?.contact_phone && (
                                    <div className="col-span-2">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Phone</p>
                                        <a
                                            href={`tel:${lead.contact_phone}`}
                                            className="text-slate-900 dark:text-white flex items-center gap-1"
                                        >
                                            <Phone className="w-4 h-4" />
                                            {lead.contact_phone}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Module Interest */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <CheckSquare className="w-5 h-5" />
                                Interested Modules ({lead?.interested_modules.length})
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {lead?.interested_modules.map((moduleId) => (
                                    <span
                                        key={moduleId}
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
                                    >
                                        {MODULE_NAMES[moduleId] || moduleId}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Actions & Meta */}
                    <div className="space-y-6">
                        {/* Pipeline Status */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pipeline</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Status</span>
                                    {getStatusBadge(lead?.status || 'new')}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Created</span>
                                    <span className="text-slate-900 dark:text-white">{formatDate(lead?.created_at || null)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Details Completed</span>
                                    <span className={lead?.details_completed_at ? 'text-green-600' : 'text-slate-400'}>
                                        {lead?.details_completed_at ? formatDate(lead.details_completed_at) : 'Pending'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Quote Generated</span>
                                    <span className={lead?.quote_generated_at ? 'text-green-600' : 'text-slate-400'}>
                                        {lead?.quote_generated_at ? formatDate(lead.quote_generated_at) : 'Pending'}
                                    </span>
                                </div>
                                {lead?.quote_amount && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Quote Amount</span>
                                        <span className="text-slate-900 dark:text-white font-medium">
                                            £{lead.quote_amount?.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Contract</span>
                                    <span className={lead?.contract_signed_at ? 'text-green-600' : lead?.contract_sent_at ? 'text-amber-600' : 'text-slate-400'}>
                                        {lead?.contract_signed_at ? 'Signed' : lead?.contract_sent_at ? 'Sent' : 'Pending'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Invoice</span>
                                    <span className={lead?.invoice_paid_at ? 'text-green-600' : lead?.invoice_sent_at ? 'text-amber-600' : 'text-slate-400'}>
                                        {lead?.invoice_paid_at ? 'Paid' : lead?.invoice_sent_at ? 'Sent' : 'Pending'}
                                    </span>
                                </div>
                                {lead?.final_amount && (
                                    <div className="flex justify-between font-bold pt-2 border-t border-slate-200 dark:border-white/10">
                                        <span className="text-slate-900 dark:text-white">Total</span>
                                        <span className="text-slate-900 dark:text-white">£{lead.final_amount.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Actions</h2>
                            <div className="space-y-2">
                                {/* DfE Fetch */}
                                <button
                                    onClick={fetchDfeData}
                                    disabled={fetchingDfe || !lead?.urn}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {fetchingDfe ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                    {lead?.dfe_data_fetched ? 'Refresh DfE Data' : 'Fetch DfE Data'}
                                </button>

                                {/* Send completion form link */}
                                <button
                                    onClick={sendCompletionEmail}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    Send Details Form
                                </button>

                                {/* Generate Quote */}
                                <button
                                    onClick={() => setShowQuoteModal(true)}
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    <FileText className="w-4 h-4" />
                                    Generate Quote
                                </button>

                                {/* Send Contract */}
                                {lead?.contract_signed_at ? (
                                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                                        <CheckCircle className="w-4 h-4" />
                                        Contract Signed
                                    </div>
                                ) : (
                                    <button
                                        onClick={sendContract}
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        <FileSignature className="w-4 h-4" />
                                        Send Contract
                                    </button>
                                )}

                                {/* Generate Invoice */}
                                <button
                                    onClick={generateInvoice}
                                    disabled={saving || !generatedQuote}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    <Receipt className="w-4 h-4" />
                                    Generate Invoice
                                </button>

                                {/* Convert to Paid */}
                                {lead?.invoice_paid_at ? (
                                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                                        <CheckCircle className="w-4 h-4" />
                                        Invoice Paid - Active
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowConvertModal(true)}
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Convert to Paid
                                    </button>
                                )}

                                <div className="border-t border-slate-200 dark:border-white/10 pt-2 mt-2">
                                    {lead?.status === 'new' && (
                                        <button
                                            onClick={() => updateStatus('contacted')}
                                            disabled={saving}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            Mark Contacted
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Email Actions */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Email</h2>
                            <div className="space-y-2">
                                <a
                                    href={`mailto:${lead?.contact_email}`}
                                    className="block w-full text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Email Contact
                                </a>
                                <a
                                    href={`https://schoolgle.co.uk/search?q=${encodeURIComponent(lead?.name || '')}`}
                                    target="_blank"
                                    className="block w-full text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Search Web for School
                                </a>
                                {lead?.urn && (
                                    <a
                                        href={`https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/${lead.urn}`}
                                        target="_blank"
                                        className="block w-full text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        View on DfE Register
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Notes
                        </h2>
                        {!editingNotes ? (
                            <button
                                onClick={() => setEditingNotes(true)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Edit3 className="w-4 h-4 text-slate-500" />
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingNotes(false);
                                        setNotesValue(lead?.notes || '');
                                    }}
                                    className="px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveNotes}
                                    disabled={saving}
                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save
                                </button>
                            </div>
                        )}
                    </div>
                    {!editingNotes ? (
                        <div className="min-h-[100px] whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                            {lead?.notes || <span className="text-slate-400 italic">No notes yet</span>}
                        </div>
                    ) : (
                        <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            placeholder="Add notes about this lead..."
                            rows={6}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}
                </div>

                {/* DfE Data Section */}
                {(lead?.dfe_data_fetched || dfeData) && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            DfE Data {lead?.dfe_data_fetched && <span className="text-xs text-green-600">(Fetched)</span>}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(dfeData || lead?.dfe_data) && (
                                <>
                                    {dfeData?.pupil_count && (
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase">Pupils</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{dfeData.pupil_count}</p>
                                        </div>
                                    )}
                                    {dfeData?.headteacher_name && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-medium text-slate-500 uppercase">Headteacher</p>
                                            <p className="text-slate-900 dark:text-white">{dfeData.headteacher_name}</p>
                                        </div>
                                    )}
                                    {dfeData?.trust_name && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-medium text-slate-500 uppercase">Trust</p>
                                            <p className="text-slate-900 dark:text-white">{dfeData.trust_name}</p>
                                        </div>
                                    )}
                                    {dfeData?.phase && (
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase">Phase</p>
                                            <p className="text-slate-900 dark:text-white">{dfeData.phase}</p>
                                        </div>
                                    )}
                                    {dfeData?.establishment_type && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-medium text-slate-500 uppercase">Type</p>
                                            <p className="text-slate-900 dark:text-white">{dfeData.establishment_type}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Convert to Paid Modal */}
            {showConvertModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Convert to Paid Subscription
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Plan
                                </label>
                                <select
                                    value={convertData.plan}
                                    onChange={(e) => setConvertData({ ...convertData, plan: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                    <option value="core">Core (£1,499/yr)</option>
                                    <option value="professional">Professional (£2,499/yr)</option>
                                    <option value="enterprise">Enterprise (£3,999/yr)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Discount (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={convertData.discountPercent}
                                    onChange={(e) => setConvertData({ ...convertData, discountPercent: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={convertData.paymentMethod}
                                    onChange={(e) => setConvertData({ ...convertData, paymentMethod: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                    <option value="invoice">Invoice</option>
                                    <option value="bacs">BACS</option>
                                    <option value="card">Card</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    User Limit
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={convertData.userLimit}
                                    onChange={(e) => setConvertData({ ...convertData, userLimit: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Base Price:</span>
                                    <span className="text-slate-900 dark:text-white">£1,499</span>
                                </div>
                                {convertData.discountPercent > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Discount ({convertData.discountPercent}%):</span>
                                        <span className="text-red-500">-£{(1499 * convertData.discountPercent / 100).toFixed(0)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-slate-200 dark:border-white/10">
                                    <span className="text-slate-900 dark:text-white">Annual Price:</span>
                                    <span className="text-slate-900 dark:text-white">
                                        £{(1499 * (1 - convertData.discountPercent / 100)).toFixed(0)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowConvertModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={convertToPaid}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                    Convert
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
