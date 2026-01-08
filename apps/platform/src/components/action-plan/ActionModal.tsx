"use client";

import { useState, useEffect } from 'react';
import { ActionItem, OFSTED_FRAMEWORK } from '@/lib/ofsted-framework';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/SupabaseAuthContext';
import {
    X,
    Calendar,
    User,
    AlignLeft,
    CheckCircle,
    AlertCircle,
    Clock,
    Save,
    MessageSquare,
    Trash2,
    Plus,
    ArrowRight,
    Sparkles,
    Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionNote {
    id: string;
    author: string;
    timestamp: string;
    content: string;
}

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (action: ActionItem) => void;
    categoryName?: string;
    subCategoryName: string;
    evidenceItem?: string;
    initialData?: ActionItem;
    allActions?: ActionItem[];
}

const BADGE_COLOR_MAP: Record<string, string> = {
    'rose': 'bg-rose-50 border-rose-100 text-rose-700',
    'teal': 'bg-teal-50 border-teal-100 text-teal-700',
    'orange': 'bg-orange-50 border-orange-100 text-orange-700',
    'violet': 'bg-violet-50 border-violet-100 text-violet-700',
    'blue': 'bg-blue-50 border-blue-100 text-blue-700',
    'gray': 'bg-slate-50 border-slate-200 text-slate-700',
};
export default function ActionModal({
    isOpen,
    onClose,
    onSave,
    categoryName,
    subCategoryName,
    evidenceItem,
    initialData,
    allActions = []
}: ActionModalProps) {
    const [description, setDescription] = useState('');
    const [rationale, setRationale] = useState('');
    const [assignee, setAssignee] = useState('');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low' | 'critical'>('medium');
    const [status, setStatus] = useState<'open' | 'in_progress' | 'completed' | 'not_started' | 'draft'>('open');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [progress, setProgress] = useState(0);
    const [dependencies, setDependencies] = useState<string[]>([]);
    const [isCritical, setIsCritical] = useState(false);
    const [linkedEvidence, setLinkedEvidence] = useState<{ documentId: string; documentName: string; matchedAt: string }[]>([]);
    const [organizationMembers, setOrganizationMembers] = useState<{ user_id: string; full_name: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Notes State
    const [notes, setNotes] = useState<ActionNote[]>([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setDescription(initialData.description);
                setRationale(initialData.rationale || '');
                setAssignee(initialData.assignee || '');
                setAssigneeId(initialData.assigneeId || '');
                setStartDate(initialData.startDate || '');
                setDueDate(initialData.dueDate || '');
                setPriority(initialData.priority as any);
                setStatus(initialData.status);
                setProgress(initialData.progress || 0);
                setNotes(initialData.notes || []);
                setSelectedCategory(initialData.category || '');
                setDependencies(initialData.dependencies || []);
                setIsCritical(initialData.isCritical || false);
                setLinkedEvidence(initialData.linkedEvidence || []);
            } else {
                setDescription(evidenceItem ? `Address gap: ${evidenceItem}` : '');
                setRationale('');
                setAssignee('');
                setAssigneeId('');
                setStartDate(new Date().toISOString().split('T')[0]);
                setDueDate('');
                setPriority('medium');
                setStatus('open');
                setProgress(0);
                setNotes([]);
                setSelectedCategory(categoryName || '');
                setDependencies([]);
                setIsCritical(false);
                setLinkedEvidence([]);
            }
            setNewNote('');
            setErrors({});
            setIsSaving(false);
        }
    }, [isOpen, initialData, evidenceItem, categoryName]);

    const { organization } = useAuth();

    useEffect(() => {
        if (isOpen && organization?.id) {
            fetchMembers();
        }
    }, [isOpen, organization?.id]);

    async function fetchMembers() {
        try {
            const { data, error } = await supabase
                .from('organization_members')
                .select('user_id, profiles(full_name)')
                .eq('organization_id', organization?.id);

            if (data) {
                const members = data.map((m: any) => ({
                    user_id: m.user_id,
                    full_name: m.profiles?.full_name || 'Staff Member'
                }));
                setOrganizationMembers(members);
            }
        } catch (err) {
            console.error('Error fetching members:', err);
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!description.trim()) newErrors.description = 'Description is required';
        if (!selectedCategory && !categoryName) newErrors.category = 'Please assign a framework area';
        if (!dueDate) newErrors.dueDate = 'Target completion date is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSaving(true);
        try {
            let finalNotes = [...notes];
            if (newNote.trim()) {
                finalNotes.push({
                    id: crypto.randomUUID(),
                    author: 'Staff Member',
                    timestamp: new Date().toISOString(),
                    content: newNote
                });
            }

            const newAction: ActionItem = {
                id: initialData?.id || crypto.randomUUID(),
                description,
                rationale,
                assignee,
                assigneeId,
                startDate,
                dueDate,
                priority: priority as any,
                progress,
                status: progress === 100 ? 'completed' : status,
                category: selectedCategory || categoryName || '',
                subCategory: subCategoryName,
                createdAt: initialData?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                notes: finalNotes,
                dependencies,
                isCritical,
                linkedEvidence
            };

            await onSave(newAction);
            onClose();
        } catch (err) {
            console.error('Failed to save action:', err);
            setErrors({ submit: 'Failed to save action. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const getCategoryBadgeStyle = (catName: string) => {
        const category = OFSTED_FRAMEWORK.find(c => c.name === catName || c.id === catName);
        const colorName = category?.color || 'gray';
        return BADGE_COLOR_MAP[colorName] || BADGE_COLOR_MAP['gray'];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
            >
                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest mb-2">
                            <Hash size={12} />
                            Improvement Record
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {initialData ? 'Update Strategic Action' : 'Define New Strategy'}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2 mt-4">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none ${getCategoryBadgeStyle(selectedCategory)}`}
                            >
                                <option value="">Assign Area</option>
                                {OFSTED_FRAMEWORK.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full capitalize">
                                {subCategoryName}
                            </span>
                        </div>
                        {errors.category && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-widest">{errors.category}</p>}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <form id="action-form" onSubmit={handleSubmit} className="space-y-10">

                        {/* 1. Description & Rationale */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">The Goal</label>
                                <input
                                    type="text"
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 rounded-2xl text-lg font-bold text-slate-900 dark:text-white transition-all outline-none shadow-inner ${errors.description ? 'border-rose-500' : 'border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800'}`}
                                    placeholder="Briefly describe what needs to be achieved..."
                                />
                                {errors.description && <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-widest">{errors.description}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <Sparkles size={12} /> Strategic Context & Rationale
                                </label>
                                <textarea
                                    value={rationale}
                                    onChange={(e) => setRationale(e.target.value)}
                                    rows={3}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-medium text-slate-600 dark:text-white transition-all outline-none resize-none shadow-inner"
                                    placeholder="Explain the 'Why' behind this action. How will it impact inspection outcomes?"
                                />
                            </div>
                        </div>

                        {/* Linked Evidence Section (if any) */}
                        {linkedEvidence.length > 0 && (
                            <div className="space-y-4 bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <Sparkles size={12} /> Supporting Evidence from Scan
                                </label>
                                <div className="space-y-2">
                                    {linkedEvidence.map((ev, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/50 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                                                    <AlignLeft size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{ev.documentName}</p>
                                                    <p className="text-[9px] text-slate-400">Detected on {new Date(ev.matchedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="text-[10px] font-black text-blue-600 hover:underline px-3"
                                            >
                                                View Source
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Critical Status & Assignment Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['not_started', 'in_progress', 'completed', 'open'].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setStatus(s as any)}
                                            className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tighter border-2 transition-all ${status === s
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                                }`}
                                        >
                                            {s.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['critical', 'high', 'medium', 'low'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p as any)}
                                            className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tighter border-2 transition-all ${priority === p
                                                ? p === 'critical' ? 'bg-rose-600 text-white border-rose-600 shadow-lg scale-[1.02]' : 'bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Progress Tracker Slider */}
                        <div className="space-y-4 bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <TrendingUp size={12} /> Granular Progress
                                </label>
                                <span className={`text-xs font-black ${progress === 100 ? 'text-emerald-500' : 'text-blue-600'}`}>
                                    {progress}% Complete
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={progress}
                                onChange={(e) => setProgress(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                <span>Not Started</span>
                                <span>In Progress</span>
                                <span>Ready for Inspection</span>
                            </div>
                        </div>

                        {/* Strategic Dependencies & Critical Toggle */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <Hash size={12} /> Strategic Dependencies
                                </label>
                                <select
                                    multiple
                                    value={dependencies}
                                    onChange={(e) => setDependencies(Array.from(e.target.selectedOptions, option => option.value))}
                                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold shadow-sm focus:border-blue-500 transition-colors outline-none min-h-[100px]"
                                >
                                    {allActions.filter(a => a.id !== initialData?.id).map(a => (
                                        <option key={a.id} value={a.id}>{a.description.substring(0, 40)}...</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 font-medium">Hold Ctrl/Cmd to select multiple predecessor tasks</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <AlertCircle size={12} /> Priority Constraints
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCritical(!isCritical);
                                        if (!isCritical) setPriority('critical');
                                    }}
                                    className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${isCritical
                                        ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-lg shadow-rose-200/50'
                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isCritical ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <Sparkles size={16} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black uppercase tracking-tight">Critical Path Task</p>
                                            <p className="text-[10px] font-bold opacity-60">Prioritize in Gantt & Alerts</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isCritical ? 'bg-rose-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isCritical ? 'translate-x-4' : ''}`} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* 3. Team & Timeline */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <User size={12} /> Lead Assignee
                                </label>
                                <select
                                    value={assigneeId}
                                    onChange={(e) => {
                                        setAssigneeId(e.target.value);
                                        const member = organizationMembers.find(m => m.user_id === e.target.value);
                                        setAssignee(member?.full_name || '');
                                    }}
                                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold shadow-sm focus:border-blue-500 transition-colors outline-none appearance-none"
                                >
                                    <option value="">Unassigned</option>
                                    {organizationMembers.map(member => (
                                        <option key={member.user_id} value={member.user_id}>{member.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <Calendar size={12} /> Target Start
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold shadow-sm focus:border-blue-500 transition-colors outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <Clock size={12} /> Completion Goal
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className={`w-full px-5 py-3.5 bg-white dark:bg-slate-800 border-2 rounded-2xl text-sm font-bold shadow-sm transition-colors outline-none ${errors.dueDate ? 'border-rose-500' : 'border-slate-100 dark:border-slate-700 focus:border-blue-500'}`}
                                />
                                {errors.dueDate && <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-widest">{errors.dueDate}</p>}
                            </div>
                        </div>

                        {/* 4. Notes & History */}
                        <div className="space-y-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <MessageSquare size={14} /> Progress Updates & History
                            </label>

                            <div className="space-y-6">
                                <div className="relative">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Add a new update on progress..."
                                        className="w-full p-6 bg-blue-50/30 dark:bg-blue-900/10 border-2 border-dashed border-blue-100 dark:border-blue-800 rounded-[2rem] text-sm font-medium focus:border-blue-400 transition-all outline-none"
                                        rows={2}
                                    />
                                    <button
                                        type="button"
                                        className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-xl"
                                        title="Add snapshot"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {notes.length > 0 && (
                                    <div className="space-y-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                                        {notes.map(note => (
                                            <div key={note.id} className="relative bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl group/note">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">{note.author}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">{new Date(note.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{note.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-6 bg-slate-50/50 dark:bg-slate-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="submit"
                        form="action-form"
                        disabled={isSaving}
                        className="px-10 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 group disabled:opacity-50"
                    >
                        {isSaving ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} className="group-hover:scale-110 transition-transform" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Strategy'}
                    </button>
                    {errors.submit && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-widest">{errors.submit}</p>}
                </div>
            </motion.div>
        </div>
    );
}
