"use client";

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Layout,
    Clock,
    CheckCircle,
    FileText,
    ArrowRight,
    Loader2,
    Lock,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Pack, PackTemplate, PackStatus } from '@/lib/packs/types';
import PackTemplateSelector from '@/components/packs/PackTemplateSelector';
import PackEditor from '@/components/packs/PackEditor';

export default function PacksPage() {
    const { organizationId, user, organization } = useAuth();
    const [packs, setPacks] = useState<Pack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
    const [editingPack, setEditingPack] = useState<Pack | null>(null);

    const fetchPacks = async () => {
        if (!organizationId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/packs?organizationId=${organizationId}`);
            if (response.ok) {
                const data = await response.json();
                setPacks(data.packs || []);
            }
        } catch (err) {
            console.error('Error fetching packs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPacks();
    }, [organizationId]);

    const handleCreatePack = async (template: PackTemplate) => {
        if (!organizationId || !user) return;

        try {
            // Prompt for title
            const title = window.prompt("Enter a title for this Governor Pack:", `${template.name} - ${new Date().toLocaleDateString()}`);
            if (!title) return;

            const response = await fetch('/api/packs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    templateId: template.id,
                    title,
                    userId: user.id,
                    sections: template.sections.map(s => ({
                        ...s,
                        content: '',
                        evidence_ids: []
                    }))
                })
            });

            if (response.ok) {
                const newPack = await response.json();
                setPacks([newPack, ...packs]);
                setIsTemplateSelectorOpen(false);
                setEditingPack(newPack);
            }
        } catch (err) {
            console.error('Create pack error:', err);
        }
    };

    const handleSavePack = async (updatedPack: Pack) => {
        try {
            const response = await fetch(`/api/packs/${updatedPack.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updatedPack,
                    userId: user?.id,
                    organizationId
                })
            });

            if (response.ok) {
                const savedData = await response.json();
                setPacks(packs.map(p => p.id === savedData.id ? savedData : p));
                setEditingPack(savedData);
            }
        } catch (err) {
            console.error('Save pack error:', err);
        }
    };

    const getStatusBadge = (status: PackStatus) => {
        switch (status) {
            case 'draft': return <span className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded tracking-widest">Draft</span>;
            case 'submitted': return <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-widest">Submitted</span>;
            case 'approved': return <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded tracking-widest">Approved</span>;
            case 'exported': return <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-widest">Exported</span>;
            default: return null;
        }
    };

    if (editingPack) {
        return (
            <PackEditor
                pack={editingPack}
                userId={user?.id || ''}
                userRole={(organization as any)?.role || 'staff'}
                onSave={handleSavePack}
                onClose={() => setEditingPack(null)}
            />
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-600 p-2 rounded-xl text-white">
                            <Shield size={20} />
                        </div>
                        <span className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase">Governor Packs</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">
                        BOARD-READY <br />
                        <span className="text-gray-400">INTELLIGENCE.</span>
                    </h1>
                    <p className="text-gray-500 mt-4 max-w-lg font-medium">
                        Generate high-fidelity governor packs and statutory reports aligned with updated DfE and Ofsted requirements.
                    </p>
                </div>
                <button
                    onClick={() => setIsTemplateSelectorOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 group"
                >
                    <Plus size={24} />
                    CREATE NEW PACK
                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Statistics / Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Packs', value: packs.length, color: 'blue' },
                    { label: 'Awaiting Approval', value: packs.filter(p => p.status === 'submitted').length, color: 'amber' },
                    { label: 'Export Ready', value: packs.filter(p => p.status === 'approved').length, color: 'emerald' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border-2 border-gray-50 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        <p className={`text-4xl font-black mt-1 text-${stat.color}-600`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Packs Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Active Documents</h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:border-blue-200 rounded-xl text-sm outline-none transition-all w-64"
                            />
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                        <p className="text-gray-500 font-bold tracking-tight">Accessing Secure Storage...</p>
                    </div>
                ) : packs.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <div className="bg-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="text-gray-400" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">No document history</h3>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium">
                            Start your first professional governor pack by choosing from our research-backed templates.
                        </p>
                        <button
                            onClick={() => setIsTemplateSelectorOpen(true)}
                            className="mt-8 text-blue-600 font-black uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto"
                        >
                            <Plus size={18} />
                            Browse Templates
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packs.map((pack) => (
                            <div
                                key={pack.id}
                                onClick={() => setEditingPack(pack)}
                                className="bg-white rounded-[2.5rem] border-2 border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-blue-100 hover:border-blue-100 transition-all duration-500 p-8 cursor-pointer group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                    {getStatusBadge(pack.status)}
                                </div>

                                <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                    {pack.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">
                                    Template: {pack.pack_templates?.name || 'Standard'}
                                </p>

                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${(pack.sections.filter(s => s.content.length > 50).length / pack.sections.length) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400">
                                            {Math.round((pack.sections.filter(s => s.content.length > 50).length / pack.sections.length) * 100)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 flex items-center justify-between border-t border-gray-50 mt-8">
                                    <div className="flex items-center gap-2">
                                        <Clock className="text-gray-300" size={14} />
                                        <p className="text-[10px] font-black text-gray-400 uppercase text-right">
                                            {new Date(pack.updated_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                        {pack.status === 'draft' ? 'Continue' : 'Open'} <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Template Selector Modal */}
            {isTemplateSelectorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <PackTemplateSelector
                        onSelect={handleCreatePack}
                        onClose={() => setIsTemplateSelectorOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}
