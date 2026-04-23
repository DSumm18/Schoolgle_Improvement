"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Building2, Mail, Phone, User, Shield, CheckCircle, AlertCircle,
    Loader2, Save, FileText, CreditCard, School, Users, DollarSign
} from "lucide-react";

interface OnboardingData {
    // Confirm school details
    name: string;
    urn: string;
    la_name: string;
    phase: string;
    school_type: string;
    address: string;
    postcode: string;
    website: string;
    phone: string;

    // Main contact
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    contact_role: string;

    // Headteacher
    headteacher_name: string;
    headteacher_email: string;

    // Billing contact
    billing_contact_name: string;
    billing_contact_email: string;
    billing_contact_phone: string;
    billing_address: string;
    finance_email: string;

    // Contract approver
    approver_name: string;
    approver_role: string;
    approver_email: string;

    // Company info
    company_number: string;

    // Data protection
    dpo_name: string;
    dpo_email: string;

    // Payment preference
    payment_method: string;
}

const PHASES = ['Primary', 'Secondary', 'All-through', 'Nursery', '16-19', 'Alternative Provision'];
const SCHOOL_TYPES = ['Community school', 'Voluntary aided', 'Voluntary controlled', 'Foundation school', 'Academy', 'Academy converter', 'Free school'];
const ROLES = ['Headteacher', 'School Business Manager', 'Finance Director', 'Chair of Governors', 'Clerk to Governors', 'Other'];
const APPROVER_ROLES = ['Headteacher', 'Chair of Governors', 'CEO/Executive Head', 'Finance Director', 'School Business Manager'];

export default function OnboardingCompletePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [leadExists, setLeadExists] = useState(false);

    const [formData, setFormData] = useState<OnboardingData>({
        name: '',
        urn: '',
        la_name: '',
        phase: '',
        school_type: '',
        address: '',
        postcode: '',
        website: '',
        phone: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        contact_role: '',
        headteacher_name: '',
        headteacher_email: '',
        billing_contact_name: '',
        billing_contact_email: '',
        billing_contact_phone: '',
        billing_address: '',
        finance_email: '',
        approver_name: '',
        approver_role: '',
        approver_email: '',
        company_number: '',
        dpo_name: '',
        dpo_email: '',
        payment_method: 'invoice',
    });

    const [step, setStep] = useState(1);

    // Load lead data by token
    useEffect(() => {
        async function loadLead() {
            if (!token) {
                setError('Invalid or missing token');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/onboarding/load?token=${token}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to load onboarding data');
                }

                if (!data.lead) {
                    setError('Onboarding link not found or expired');
                    setLoading(false);
                    return;
                }

                setLeadExists(true);
                // Pre-fill form with existing data
                setFormData({
                    ...formData,
                    ...data.lead,
                    // Map field names if needed
                    name: data.lead.name || '',
                    urn: data.lead.urn || '',
                    la_name: data.lead.la_name || '',
                    phase: data.lead.phase || '',
                    school_type: data.lead.school_type || '',
                    address: data.lead.address || '',
                    postcode: data.lead.postcode || '',
                    website: data.lead.website || '',
                    phone: data.lead.phone || '',
                    contact_name: data.lead.contact_name || '',
                    contact_email: data.lead.contact_email || '',
                    contact_phone: data.lead.contact_phone || '',
                    contact_role: data.lead.contact_role || '',
                    headteacher_name: data.lead.headteacher_name || '',
                    headteacher_email: data.lead.headteacher_email || '',
                    billing_contact_name: data.lead.billing_contact_name || '',
                    billing_contact_email: data.lead.billing_contact_email || '',
                    billing_contact_phone: data.lead.billing_contact_phone || '',
                    billing_address: data.lead.billing_address || '',
                    finance_email: data.lead.finance_email || '',
                    approver_name: data.lead.approver_name || '',
                    approver_role: data.lead.approver_role || '',
                    approver_email: data.lead.approver_email || '',
                    company_number: data.lead.company_number || '',
                    dpo_name: data.lead.dpo_name || '',
                    dpo_email: data.lead.dpo_email || '',
                    payment_method: data.lead.payment_method || 'invoice',
                });
            } catch (err: any) {
                console.error('Load lead error:', err);
                setError(err.message || 'Failed to load onboarding data');
            } finally {
                setLoading(false);
            }
        }

        loadLead();
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/api/onboarding/details/complete?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save details');
            }

            setSuccess(true);
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || 'Failed to save details');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error && !leadExists) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Not Found</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h1>
                    <p className="text-slate-600 mb-6">
                        Your onboarding details have been saved. Our team will be in touch shortly with your quote and contract.
                    </p>
                    <div className="bg-emerald-50 rounded-lg p-4 text-left text-sm text-emerald-800">
                        <p className="font-medium mb-2">Next steps:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>We'll prepare your personalized quote</li>
                            <li>You'll receive a contract for electronic signature</li>
                            <li>Once signed, we'll send your invoice</li>
                            <li>After payment, your account will be activated</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-slate-700" />
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Schoolgle Onboarding</h1>
                            <p className="text-sm text-slate-500">Complete your school details</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                    s === step ? 'bg-blue-600 text-white' : s < step ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                    {s < step ? '✓' : s}
                                </div>
                                {s < 4 && (
                                    <div className={`w-12 h-1 ${s < step ? 'bg-green-500' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {/* Step 1: School Details */}
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm p-8"
                        >
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <School className="w-6 h-6 text-blue-600" />
                                School Details
                            </h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">School Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">URN</label>
                                        <input
                                            type="text"
                                            value={formData.urn}
                                            onChange={(e) => setFormData({ ...formData, urn: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Local Authority</label>
                                        <input
                                            type="text"
                                            value={formData.la_name}
                                            onChange={(e) => setFormData({ ...formData, la_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phase</label>
                                        <select
                                            value={formData.phase}
                                            onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select phase...</option>
                                            {PHASES.map((p) => <option key={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">School Type</label>
                                        <select
                                            value={formData.school_type}
                                            onChange={(e) => setFormData({ ...formData, school_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select type...</option>
                                            {SCHOOL_TYPES.map((t) => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                                        <input
                                            type="text"
                                            value={formData.postcode}
                                            onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">School Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Contacts */}
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm p-8"
                        >
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Users className="w-6 h-6 text-blue-600" />
                                Contact Details
                            </h2>

                            <div className="space-y-6">
                                {/* Main Contact */}
                                <div className="border-b border-slate-200 pb-6">
                                    <h3 className="font-medium text-slate-900 mb-4">Main Contact</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.contact_name}
                                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.contact_email}
                                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.contact_phone}
                                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                            <select
                                                value={formData.contact_role}
                                                onChange={(e) => setFormData({ ...formData, contact_role: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select role...</option>
                                                {ROLES.map((r) => <option key={r}>{r}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Headteacher */}
                                <div className="border-b border-slate-200 pb-6">
                                    <h3 className="font-medium text-slate-900 mb-4">Headteacher</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={formData.headteacher_name}
                                                onChange={(e) => setFormData({ ...formData, headteacher_name: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={formData.headteacher_email}
                                                onChange={(e) => setFormData({ ...formData, headteacher_email: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Contact */}
                                <div className="border-b border-slate-200 pb-6">
                                    <h3 className="font-medium text-slate-900 mb-4">Billing Contact</h3>
                                    <p className="text-sm text-slate-500 mb-4">Leave blank if same as main contact</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={formData.billing_contact_name}
                                                onChange={(e) => setFormData({ ...formData, billing_contact_name: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={formData.billing_contact_email}
                                                onChange={(e) => setFormData({ ...formData, billing_contact_email: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.billing_contact_phone}
                                                onChange={(e) => setFormData({ ...formData, billing_contact_phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Finance Email</label>
                                            <input
                                                type="email"
                                                value={formData.finance_email}
                                                onChange={(e) => setFormData({ ...formData, finance_email: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Billing Address</label>
                                            <textarea
                                                value={formData.billing_address}
                                                onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                                                rows={2}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 text-slate-600 hover:text-slate-900"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Contract & Payment */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm p-8"
                        >
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-blue-600" />
                                Contract & Payment
                            </h2>

                            <div className="space-y-6">
                                {/* Contract Approver */}
                                <div className="border-b border-slate-200 pb-6">
                                    <h3 className="font-medium text-slate-900 mb-4">Contract Approver</h3>
                                    <p className="text-sm text-slate-500 mb-4">Who will sign the contract?</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.approver_name}
                                                onChange={(e) => setFormData({ ...formData, approver_name: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                                            <select
                                                value={formData.approver_role}
                                                onChange={(e) => setFormData({ ...formData, approver_role: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select role...</option>
                                                {APPROVER_ROLES.map((r) => <option key={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.approver_email}
                                                onChange={(e) => setFormData({ ...formData, approver_email: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Company Number */}
                                <div className="border-b border-slate-200 pb-6">
                                    <h3 className="font-medium text-slate-900 mb-4">Company Information</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Companies House Number (Academies only)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.company_number}
                                            onChange={(e) => setFormData({ ...formData, company_number: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                                            placeholder="e.g., 12345678"
                                        />
                                    </div>
                                </div>

                                {/* Data Protection */}
                                <div className="border-b border-slate-200 pb-6">
                                    <h3 className="font-medium text-slate-900 mb-4">Data Protection Officer</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={formData.dpo_name}
                                                onChange={(e) => setFormData({ ...formData, dpo_name: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={formData.dpo_email}
                                                onChange={(e) => setFormData({ ...formData, dpo_email: e.target.value })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <h3 className="font-medium text-slate-900 mb-4">Payment Method</h3>
                                    <div className="flex gap-4">
                                        {['invoice', 'bacs', 'card'].map((method) => (
                                            <label key={method} className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                                formData.payment_method === method
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="payment_method"
                                                    value={method}
                                                    checked={formData.payment_method === method}
                                                    onChange={(e) => setFormData({ ...formData, payment_method: method })}
                                                    className="sr-only"
                                                />
                                                <div className="text-center">
                                                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                                                    <p className="font-medium text-slate-900 capitalize">{method === 'invoice' ? 'Bank Invoice' : method.toUpperCase()}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {method === 'invoice' ? 'We\'ll send an invoice' : method === 'bacs' ? 'Bank transfer' : 'Card payment'}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="px-6 py-3 text-slate-600 hover:text-slate-900"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(4)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                                >
                                    Review
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm p-8"
                        >
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Shield className="w-6 h-6 text-blue-600" />
                                Review & Submit
                            </h2>

                            <div className="space-y-6">
                                <div className="bg-slate-50 rounded-lg p-6">
                                    <h3 className="font-medium text-slate-900 mb-4">School Details</h3>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <dt className="text-slate-500">Name</dt>
                                            <dd className="text-slate-900 font-medium">{formData.name}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Phase</dt>
                                            <dd className="text-slate-900">{formData.phase || '-'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Type</dt>
                                            <dd className="text-slate-900">{formData.school_type || '-'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Contact</dt>
                                            <dd className="text-slate-900">{formData.contact_name} ({formData.contact_email})</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Headteacher</dt>
                                            <dd className="text-slate-900">{formData.headteacher_name || '-'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Approver</dt>
                                            <dd className="text-slate-900">{formData.approver_name} ({formData.approver_role})</dd>
                                        </div>
                                        <div>
                                            <dt className="text-slate-500">Payment</dt>
                                            <dd className="text-slate-900 capitalize">{formData.payment_method}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        id="confirm"
                                        required
                                        className="mt-1"
                                    />
                                    <label htmlFor="confirm" className="text-sm text-slate-600">
                                        I confirm that the information provided is accurate and I have the authority to submit this on behalf of the school. *
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="px-6 py-3 text-slate-600 hover:text-slate-900"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Submit Details
                                </button>
                            </div>
                        </motion.div>
                    )}
                </form>
            </main>
        </div>
    );
}
