"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ChevronLeft,
    Save,
    CheckCircle,
    Clock,
    FileText,
    Plus,
    Trash2,
    AlertCircle,
    Loader2,
    ExternalLink,
    Brain,
    MessageSquare,
    History,
    Download,
    Eye,
    ShieldCheck,
    CheckCircle2,
    Lock,
    ImageIcon
} from 'lucide-react';
import { Pack, PackSection, PackStatus } from '@/lib/packs/types';
import { EvidenceItem } from '@/lib/evidence/types';
import EvidencePicker from '@/components/evidence/EvidencePicker';
import VersionHistory from '@/components/packs/VersionHistory';
import ApprovalPanel from '@/components/packs/ApprovalPanel';

interface PackEditorProps {
    pack: Pack;
    userId: string;
    userRole: 'admin' | 'headteacher' | 'sbm' | 'staff' | 'governor';
    onSave: (updatedPack: Pack) => Promise<void>;
    onClose: () => void;
}

export default function PackEditor({ pack, userId, userRole, onSave, onClose }: PackEditorProps) {
    const [activeSectionId, setActiveSectionId] = useState(pack.sections[0]?.id || '');
    const [sections, setSections] = useState<PackSection[]>(pack.sections);
    const [currentStatus, setCurrentStatus] = useState<PackStatus>(pack.status);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isEvidencePickerOpen, setIsEvidencePickerOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [linkedEvidence, setLinkedEvidence] = useState<Record<string, EvidenceItem>>({});

    const activeSection = sections.find(s => s.id === activeSectionId);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isLocked = currentStatus === 'approved' || currentStatus === 'submitted';

    useEffect(() => {
        const fetchLinkedEvidence = async () => {
            const allEvidenceIds = sections.flatMap(s => s.evidence_ids || []);
            if (allEvidenceIds.length === 0) return;

            try {
                const uniqueIds = Array.from(new Set(allEvidenceIds));
                const params = new URLSearchParams({ organizationId: pack.organization_id, limit: '100' });
                const response = await fetch(`/api/evidence?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    const evidenceMap: Record<string, EvidenceItem> = {};
                    data.evidence.forEach((item: EvidenceItem) => {
                        if (uniqueIds.includes(item.id)) evidenceMap[item.id] = item;
                    });
                    setLinkedEvidence(evidenceMap);
                }
            } catch (err) {
                console.error('Error fetching linked evidence metadata:', err);
            }
        };
        fetchLinkedEvidence();
    }, [pack.organization_id, sections]);

    const handleUpdateSection = (id: string, updates: Partial<PackSection>) => {
        if (isLocked) return;
        const newSections = sections.map(s => s.id === id ? { ...s, ...updates } : s);
        setSections(newSections);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            handleManualSave(newSections);
        }, 2000);
    };

    const handleManualSave = async (sectionsToSave = sections) => {
        if (isLocked) return;
        setIsSaving(true);
        try {
            await onSave({ ...pack, sections: sectionsToSave, status: currentStatus });
            setLastSaved(new Date());
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async (format: 'pdf' | 'docx') => {
        try {
            const response = await fetch(`/api/packs/${pack.id}/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format, userId, organizationId: pack.organization_id })
            });

            if (response.ok) {
                if (format === 'pdf') {
                    setIsPreviewOpen(true);
                    setTimeout(() => window.print(), 500);
                } else {
                    alert("DOCX Export metadata recorded. Mock file download initiated.");
                }
            }
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const currentWordCount = activeSection?.content.split(/\s+/).filter(w => w.length > 0).length || 0;

    if (isPreviewOpen) {
        return (
            <div className="bg-white min-h-screen p-12 print:p-0">
                <div className="max-w-4xl mx-auto print:max-w-none">
                    <div className="flex justify-between items-center mb-12 print:hidden">
                        <button onClick={() => setIsPreviewOpen(false)} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold">Close Preview</button>
                        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                            <Download size={18} /> Print to PDF
                        </button>
                    </div>

                    <div className="text-center mb-20">
                        <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter">GOVERNOR PACK</h1>
                        <h2 className="text-3xl font-bold text-gray-700">{pack.title}</h2>
                        <p className="mt-8 text-gray-500 font-bold uppercase tracking-widest">
                            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    <div className="space-y-20">
                        {sections.map((section, si) => (
                            <div key={si} className="page-break-after-always">
                                <h3 className="text-2xl font-black border-b-4 border-gray-900 pb-2 mb-6 uppercase tracking-tight">
                                    {String(si + 1).padStart(2, '0')}. {section.title}
                                </h3>
                                <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap mb-10">
                                    {section.content || 'No content provided for this section.'}
                                </div>

                                {section.evidence_ids.length > 0 && (
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Supporting Evidence Ref:</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {section.evidence_ids.map(id => (
                                                <div key={id} className="text-xs font-bold text-blue-600 flex items-center gap-2">
                                                    <CheckCircle2 size={12} /> {linkedEvidence[id]?.title || 'Linked Evidence ID: ' + id.slice(0, 8)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar - Sections */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Navigator Editor</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                            {isSaving ? (
                                <>
                                    <Loader2 size={10} className="animate-spin" />
                                    Saving...
                                </>
                            ) : lastSaved ? (
                                <>
                                    <Clock size={10} />
                                    Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </>
                            ) : isLocked ? (
                                <>
                                    <Lock size={10} />
                                    Locked (Review)
                                </>
                            ) : (
                                'Draft'
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="px-2 mb-4">
                        <h1 className="text-xl font-black text-gray-900 leading-tight truncate" title={pack.title}>
                            {pack.title}
                        </h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Status: {currentStatus}</p>
                    </div>

                    <div className="space-y-1">
                        <span className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</span>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-white border-2 border-transparent hover:border-blue-100 rounded-2xl transition-all"
                            >
                                <History size={18} className="text-blue-600" />
                                <span className="text-[9px] font-black uppercase">History</span>
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-white border-2 border-transparent hover:border-blue-100 rounded-2xl transition-all"
                            >
                                <Download size={18} className="text-emerald-600" />
                                <span className="text-[9px] font-black uppercase">Export</span>
                            </button>
                        </div>

                        <span className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sections</span>
                        {sections.map((section, idx) => {
                            const isActive = activeSectionId === section.id;
                            const hasContent = section.content.length > 10;
                            const hasEvidence = section.evidence_ids.length > 0;

                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSectionId(section.id)}
                                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 ${isActive ? 'bg-white border-blue-600 shadow-xl shadow-blue-50' : 'bg-transparent border-transparent hover:bg-gray-100'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <span className={`text-[10px] font-black ${isActive ? 'text-blue-600' : 'text-gray-300'}`}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        {hasContent && <CheckCircle className="text-emerald-500" size={12} />}
                                    </div>
                                    <h3 className={`text-sm font-bold mt-1 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {section.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        {hasEvidence && (
                                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                                                {section.evidence_ids.length} Evidence
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    {!isLocked ? (
                        <button
                            onClick={() => handleManualSave()}
                            disabled={isSaving}
                            className="w-full bg-gray-900 text-white p-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            FORCE SAVE
                        </button>
                    ) : (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2 text-amber-700">
                            <Lock size={16} />
                            <span className="text-[10px] font-bold uppercase">Locked for Review</span>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl z-0 overflow-y-auto custom-scrollbar">
                {activeSection ? (
                    <div className="flex-1 flex flex-col p-12 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
                        {/* Section Header */}
                        <div className="mb-8 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="text-blue-600" size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Active Section Editing</span>
                                </div>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                                    {activeSection.title}
                                </h2>
                                {activeSection.word_guide && (
                                    <div className="flex items-center gap-2 mt-4 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 w-fit">
                                        <AlertCircle size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">{activeSection.word_guide}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsPreviewOpen(true)}
                                    className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-2xl transition-all"
                                    title="Print Preview"
                                >
                                    <Eye size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content Controls */}
                        <div className="flex-1 flex flex-col gap-8">
                            {/* Text Area */}
                            <div className="flex flex-col flex-1 gap-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Narrative</label>
                                    <span className={`text-[10px] font-black uppercase ${currentWordCount > 500 ? 'text-amber-600' : 'text-gray-400'}`}>
                                        Words: {currentWordCount}
                                    </span>
                                </div>
                                <div className="relative flex-1 flex flex-col">
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
                                            <div className="bg-white/90 px-4 py-2 rounded-full border border-gray-100 shadow-xl flex items-center gap-2">
                                                <Lock size={14} className="text-amber-600" />
                                                <span className="text-xs font-black uppercase text-gray-900">Read Only</span>
                                            </div>
                                        </div>
                                    )}
                                    <textarea
                                        value={activeSection.content}
                                        onChange={(e) => handleUpdateSection(activeSection.id, { content: e.target.value })}
                                        disabled={isLocked}
                                        placeholder="Draft your section narrative here..."
                                        className="w-full h-[400px] p-8 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-3xl text-gray-800 leading-relaxed text-lg outline-none transition-all shadow-inner font-medium placeholder:text-gray-300"
                                    />
                                </div>

                                {/* Section Review Comments */}
                                {activeSection.comments && (
                                    <div className="mt-4 p-6 bg-amber-50 rounded-2xl border-2 border-amber-100 italic text-sm text-amber-900 whitespace-pre-wrap relative">
                                        <div className="absolute top-0 left-6 translate-y-[-50%] bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                                            <MessageSquare size={10} /> REVIEWER FEEDBACK
                                        </div>
                                        {activeSection.comments}
                                    </div>
                                )}
                            </div>

                            {/* Linked Evidence */}
                            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Linked Evidence Library</h4>
                                        <p className="text-xs text-gray-500 font-medium mt-1">High-fidelity evidence attached to this section for governors.</p>
                                    </div>
                                    {!isLocked && (
                                        <button
                                            onClick={() => setIsEvidencePickerOpen(true)}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Plus size={16} />
                                            ATTACH EVIDENCE
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {activeSection.evidence_ids.length > 0 ? (
                                        activeSection.evidence_ids.map(id => {
                                            const item = linkedEvidence[id];
                                            return (
                                                <div key={id} className="group relative bg-gray-50 rounded-2xl p-4 border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                                            {item?.file_type === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-gray-900 truncate">{item?.title || 'Unknown Item'}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item?.category || 'General'}</p>
                                                        </div>
                                                        {!isLocked && (
                                                            <button
                                                                onClick={() => {
                                                                    handleUpdateSection(activeSection.id, {
                                                                        evidence_ids: activeSection.evidence_ids.filter(eid => eid !== id)
                                                                    });
                                                                }}
                                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                            <p className="text-sm text-gray-400 font-bold">No evidence linked yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 font-bold">
                        Select a section to begin editing.
                    </div>
                )}
            </main>

            {/* Right Sidebar - AI + Approval */}
            <aside className="w-96 bg-gray-900 p-8 flex flex-col gap-6 text-white overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="text-blue-400" size={32} />
                    <h3 className="text-xl font-black tracking-tight">GOVERNANCE PANEL</h3>
                </div>

                <ApprovalPanel
                    pack={pack}
                    userId={userId}
                    userRole={userRole}
                    onStatusChange={(status) => {
                        setCurrentStatus(status);
                        handleManualSave(); // Auto save status change
                    }}
                />

                <div className="mt-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Brain className="text-blue-400" size={24} />
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">VISION INSIGHTS</h4>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 italic text-xs text-gray-300 leading-relaxed">
                        "Snapshot v{pack.current_version || 1} shows strong alignment with latest governance reporting standards."
                    </div>
                </div>
            </aside>

            {/* Overlays */}
            {isEvidencePickerOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <EvidencePicker
                        organizationId={pack.organization_id}
                        allowedCategories={activeSection?.evidence_categories || []}
                        selectedIds={activeSection?.evidence_ids || []}
                        onSelect={(ids) => handleUpdateSection(activeSectionId, { evidence_ids: ids })}
                        onClose={() => setIsEvidencePickerOpen(false)}
                    />
                </div>
            )}

            {isHistoryOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <VersionHistory
                        packId={pack.id}
                        organizationId={pack.organization_id}
                        userId={userId}
                        onRestore={(restoredPack) => {
                            setSections(restoredPack.sections);
                            setCurrentStatus(restoredPack.status);
                            setLastSaved(new Date());
                        }}
                        onClose={() => setIsHistoryOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}
