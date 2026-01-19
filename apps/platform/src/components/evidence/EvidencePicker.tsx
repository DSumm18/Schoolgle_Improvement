"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Check, X, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { EvidenceItem, EVIDENCE_CATEGORIES } from '@/lib/evidence/types';

interface EvidencePickerProps {
    organizationId: string;
    allowedCategories: string[];
    selectedIds: string[];
    onSelect: (ids: string[]) => void;
    onClose: () => void;
}

export default function EvidencePicker({
    organizationId,
    allowedCategories,
    selectedIds,
    onSelect,
    onClose
}: EvidencePickerProps) {
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIds, setActiveIds] = useState<string[]>(selectedIds);
    const [selectedFilter, setSelectedFilter] = useState<string>(
        allowedCategories.length === 1 ? allowedCategories[0] : 'all'
    );

    useEffect(() => {
        const fetchEvidence = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ organizationId, limit: '100' });
                if (selectedFilter !== 'all') params.append('category', selectedFilter);
                if (searchTerm) params.append('search', searchTerm);

                const response = await fetch(`/api/evidence?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setEvidence(data.evidence || []);
                }
            } catch (err) {
                console.error('Evidence picker fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvidence();
    }, [organizationId, selectedFilter, searchTerm]);

    const toggleSelection = (id: string) => {
        setActiveIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        onSelect(activeIds);
        onClose();
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="text-blue-600" size={24} />
                        Link Evidence
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Select items to attach to this section.</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-4 border-b border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search your library..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="all">All Categories</option>
                    {EVIDENCE_CATEGORIES.filter(c => allowedCategories.includes(c.id) || allowedCategories.length === 0).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                        <p className="text-sm text-gray-500">Scanning library...</p>
                    </div>
                ) : evidence.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400">No matching evidence found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {evidence.map((item) => {
                            const isSelected = activeIds.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleSelection(item.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {item.file_type === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {item.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                            {item.category}
                                        </p>
                                    </div>
                                    {isSelected && <Check className="text-blue-600" size={20} />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <p className="text-sm text-gray-500 font-medium">
                    {activeIds.length} item{activeIds.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
                    >
                        Attach Selected
                    </button>
                </div>
            </div>
        </div>
    );
}
