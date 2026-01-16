"use client";

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Search,
    Filter,
    LayoutGrid,
    List,
    Plus,
    MoreVertical,
    Download,
    Trash2,
    Calendar,
    Tag,
    ExternalLink,
    ChevronRight,
    Brain,
    Clock,
    Target
} from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { EVIDENCE_CATEGORIES, EvidenceItem } from '@/lib/evidence/types';
import EvidenceUploader from '@/components/evidence/EvidenceUploader';

export default function EvidenceLibraryPage() {
    const { organizationId, user } = useAuth();
    const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedFileType, setSelectedFileType] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);

    const fetchEvidence = async () => {
        if (!organizationId) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                organizationId,
                limit: '100'
            });
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (selectedFileType !== 'all') params.append('file_type', selectedFileType);
            if (searchTerm) params.append('search', searchTerm);

            const response = await fetch(`/api/evidence?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setEvidence(data.evidence || []);
            }

            // Fetch actions to check links
            const { data: actionsData } = await supabase
                .from('actions')
                .select('id, description, linked_evidence')
                .eq('organization_id', organizationId);
            setActions(actionsData || []);
        } catch (err) {
            console.error('Error fetching evidence:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvidence();
    }, [organizationId, selectedCategory, selectedFileType]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEvidence();
    };

    const getCategoryColor = (catId: string) => {
        const cat = EVIDENCE_CATEGORIES.find(c => c.id === catId);
        return cat ? `bg-${cat.color}-100 text-${cat.color}-700` : 'bg-gray-100 text-gray-700';
    };

    const getCategoryLabel = (catId: string) => {
        const cat = EVIDENCE_CATEGORIES.find(c => c.id === catId);
        return cat ? cat.label : 'Uncategorized';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} />
                        Evidence Library
                    </h1>
                    <p className="text-gray-500 mt-1">Centralized store for all inspection readiness evidence.</p>
                </div>
                <button
                    onClick={() => setIsUploaderOpen(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={20} />
                    Upload New Evidence
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <form onSubmit={handleSearch} className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search evidence by title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </form>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                    <Filter className="text-gray-400 mr-1 flex-shrink-0" size={18} />
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        All Areas
                    </button>
                    {EVIDENCE_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            {cat.label}
                        </button>
                    ))}

                    <div className="w-[1px] h-6 bg-gray-200 mx-2 flex-shrink-0" />

                    <select
                        value={selectedFileType}
                        onChange={(e) => setSelectedFileType(e.target.value)}
                        className="bg-gray-50 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium outline-none cursor-pointer hover:bg-gray-100"
                    >
                        <option value="all">All Types</option>
                        <option value="document">Documents</option>
                        <option value="image">Images</option>
                    </select>
                </div>

                <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-100 ml-auto flex-shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Selection Toolbar */}
            {selectedIds.length > 0 && (
                <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-5">
                    <div className="flex items-center gap-4">
                        <span className="font-bold">{selectedIds.length} items selected</span>
                        <button onClick={() => setSelectedIds([])} className="text-blue-100 hover:text-white text-xs font-bold uppercase tracking-widest px-3 py-1 bg-blue-500 rounded-lg">Clear Selection</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-2 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                            <Download size={14} /> Download Bulk
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                            <Trash2 size={14} /> Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading your evidence...</p>
                </div>
            ) : evidence.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-gray-400" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No evidence found</h3>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                        {searchTerm || selectedCategory !== 'all' || selectedFileType !== 'all'
                            ? "We couldn't find any evidence matching your filters. Try adjusting your search."
                            : "Your library is empty. Upload your first piece of evidence to get started."}
                    </p>
                    {!searchTerm && selectedCategory === 'all' && selectedFileType === 'all' && (
                        <button
                            onClick={() => setIsUploaderOpen(true)}
                            className="mt-6 text-blue-600 font-bold hover:underline flex items-center justify-center gap-2 mx-auto"
                        >
                            <Plus size={18} />
                            Add Evidence Now
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {evidence.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => {
                                if (selectedIds.includes(item.id)) {
                                    setSelectedIds(selectedIds.filter(id => id !== item.id));
                                } else {
                                    setSelectedIds([...selectedIds, item.id]);
                                }
                            }}
                            className={`bg-white rounded-2xl border transition-all duration-300 group overflow-hidden flex flex-col cursor-pointer ${selectedIds.includes(item.id) ? 'ring-4 ring-blue-500 border-blue-500 shadow-xl' : 'border-gray-100 shadow-sm hover:shadow-xl'}`}
                        >
                            {/* Thumbnail Area */}
                            <div className="aspect-video bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                                {item.file_type === 'image' ? (
                                    <img src={item.file_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                                        <FileText className="text-blue-500" size={48} />
                                    </div>
                                )}

                                {/* Overlay actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <a href={item.file_url} target="_blank" className="p-2 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform shadow-lg">
                                        <ExternalLink size={20} />
                                    </a>
                                    <button className="p-2 bg-white rounded-full text-red-600 hover:scale-110 transition-transform shadow-lg">
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(item.category || '')}`}>
                                    {getCategoryLabel(item.category || '')}
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-4 flex-1 flex flex-col">
                                <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.title}</h4>
                                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{item.description || 'No description provided.'}</p>

                                {actions.filter(a => a.linked_evidence?.some((le: any) => le.documentId === item.id)).length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                                            <Target size={10} /> Linked Actions
                                        </div>
                                        <div className="space-y-1">
                                            {actions.filter(a => a.linked_evidence?.some((le: any) => le.documentId === item.id)).slice(0, 2).map((a, i) => (
                                                <div key={i} className="text-[10px] font-bold text-slate-500 truncate bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                                    {a.description}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <Clock size={12} />
                                        {formatDate(item.created_at)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                                        {item.file_type}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">File</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Area</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Source</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date Added</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {evidence.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                                                {item.file_type === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{item.title}</div>
                                                <div className="text-xs text-gray-400">{(item.file_size_bytes ? (item.file_size_bytes / 1024).toFixed(0) : 0)} KB • {item.file_type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getCategoryColor(item.category || '')}`}>
                                            {getCategoryLabel(item.category || '')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                            <Tag size={14} className="text-gray-400" />
                                            {item.source_type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-gray-400" />
                                            {formatDate(item.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={item.file_url} target="_blank" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <ExternalLink size={18} />
                                            </a>
                                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Uploader Modal Overlay */}
            {isUploaderOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <EvidenceUploader
                        organizationId={organizationId || ''}
                        userId={user?.id || ''}
                        onUploadComplete={() => {
                            fetchEvidence();
                        }}
                        onClose={() => setIsUploaderOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}
