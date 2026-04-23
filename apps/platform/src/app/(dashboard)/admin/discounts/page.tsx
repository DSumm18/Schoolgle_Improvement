"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
    ArrowLeft, Plus, Tag, CheckCircle, XCircle, Clock, Percent,
    PoundSterling, Calendar, Users, Trash2, Edit2, Eye, Loader2,
    RefreshCw, Shield
} from "lucide-react";

interface DiscountCode {
    id: string;
    code: string;
    description: string | null;
    discount_type: string;
    discount_value: number;
    applies_to: string[];
    max_uses: number | null;
    uses_count: number;
    unique_organizations: number;
    max_uses_per_user: number;
    valid_from: string;
    valid_until: string | null;
    active: boolean;
    archived: boolean;
    created_at: string;
    is_expired: boolean;
}

const PLAN_NAMES = {
    core: 'Core',
    professional: 'Professional',
    enterprise: 'Enterprise',
};

export default function DiscountCodesPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
    const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percent',
        discountValue: 10,
        maxUses: '',
        validUntil: '',
        appliesTo: ['core', 'professional', 'enterprise'],
    });

    // Check access and load
    useEffect(() => {
        async function checkAndLoad() {
            if (!user?.id) return;

            try {
                const res = await fetch('/api/admin/discounts');
                if (res.ok) {
                    setIsSuperAdmin(true);
                    const data = await res.json();
                    setDiscounts(data.data || []);
                } else {
                    setIsSuperAdmin(false);
                }
            } catch (error) {
                console.error('Error:', error);
                setIsSuperAdmin(false);
            } finally {
                setLoading(false);
            }
        }

        if (user) checkAndLoad();
    }, [user]);

    async function createDiscount() {
        const res = await fetch('/api/admin/discounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: formData.code,
                description: formData.description,
                discountType: formData.discountType,
                discountValue: parseInt(formData.discountValue.toString()),
                maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
                validUntil: formData.validUntil || null,
                appliesTo: formData.appliesTo,
            }),
        });

        if (res.ok) {
            setShowCreateModal(false);
            setFormData({
                code: '',
                description: '',
                discountType: 'percent',
                discountValue: 10,
                maxUses: '',
                validUntil: '',
                appliesTo: ['core', 'professional', 'enterprise'],
            });

            // Reload
            const dataRes = await fetch('/api/admin/discounts');
            const data = await dataRes.json();
            setDiscounts(data.data || []);
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to create discount code');
        }
    }

    async function toggleActive(id: string, active: boolean) {
        const res = await fetch(`/api/admin/discounts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active }),
        });

        if (res.ok) {
            setDiscounts(discounts.map(d =>
                d.id === id ? { ...d, active } : d
            ));
        }
    }

    async function archiveDiscount(id: string) {
        if (!confirm('Archive this discount code?')) return;

        const res = await fetch(`/api/admin/discounts/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            setDiscounts(discounts.map(d =>
                d.id === id ? { ...d, archived: true } : d
            ));
        }
    }

    function togglePlanApplies(plan: string) {
        setFormData(prev => ({
            ...prev,
            appliesTo: prev.appliesTo.includes(plan)
                ? prev.appliesTo.filter(p => p !== plan)
                : [...prev.appliesTo, plan],
        }));
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
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/admin')}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase">
                                    Discount<span className="text-slate-400"> Codes</span>
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {discounts.filter(d => !d.archived).length} active codes
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            New Code
                        </button>
                    </div>
                </div>
            </header>

            {/* Codes list */}
            <div className="p-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Applies To</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Usage</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Valid Until</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                            {discounts.map((discount) => (
                                <tr key={discount.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${discount.archived ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-slate-400" />
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                {discount.code}
                                            </span>
                                        </div>
                                        {discount.description && (
                                            <p className="text-xs text-slate-500 mt-1">{discount.description}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {discount.discount_type === 'percent' ? (
                                            <span className="flex items-center gap-1 text-slate-900 dark:text-white">
                                                <Percent className="w-4 h-4" />
                                                {discount.discount_value}% off
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-slate-900 dark:text-white">
                                                <PoundSterling className="w-4 h-4" />
                                                {(discount.discount_value / 100).toFixed(2)} off
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {discount.applies_to.map(plan => (
                                                <span key={plan} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                                                    {PLAN_NAMES[plan as keyof typeof PLAN_NAMES] || plan}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Users className="w-4 h-4" />
                                            <span>{discount.uses_count}</span>
                                            {discount.max_uses && (
                                                <span className="text-slate-400">/ {discount.max_uses}</span>
                                            )}
                                            <span className="text-xs text-slate-400">
                                                ({discount.unique_organizations} orgs)
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {discount.valid_until ? (
                                            <span className={`text-sm ${discount.is_expired ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {new Date(discount.valid_until).toLocaleDateString('en-GB')}
                                                {discount.is_expired && ' (expired)'}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-slate-400">No limit</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                            discount.archived
                                                ? 'bg-slate-100 text-slate-500'
                                                : discount.active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                        }`}>
                                            {discount.archived ? 'Archived' : discount.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {!discount.archived && (
                                                <button
                                                    onClick={() => toggleActive(discount.id, !discount.active)}
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                                    title={discount.active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {discount.active ? (
                                                        <XCircle className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => archiveDiscount(discount.id)}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
                                                title="Archive"
                                            >
                                                <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Create Discount Code
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Code
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="WELCOME10"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Welcome discount for new customers"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        <option value="percent">Percentage</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Value
                                    </label>
                                    <div className="relative">
                                        {formData.discountType === 'percent' ? (
                                            <>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={formData.discountValue}
                                                    onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-4 py-2 pl-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                />
                                                <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            </>
                                        ) : (
                                            <>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.discountValue}
                                                    onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-4 py-2 pl-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                />
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Applies To
                                </label>
                                <div className="flex gap-2">
                                    {(['core', 'professional', 'enterprise'] as const).map(plan => (
                                        <button
                                            key={plan}
                                            type="button"
                                            onClick={() => togglePlanApplies(plan)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                formData.appliesTo.includes(plan)
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            {PLAN_NAMES[plan]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Max Uses (optional)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.maxUses}
                                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                        placeholder="Unlimited"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Valid Until (optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createDiscount}
                                    disabled={!formData.code}
                                    className="flex-1 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90 disabled:opacity-50"
                                >
                                    Create Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
