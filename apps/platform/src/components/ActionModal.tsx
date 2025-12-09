"use client";

import { useState, useEffect } from 'react';
import { ActionItem, OFSTED_FRAMEWORK } from '@/lib/ofsted-framework';
import { X, Calendar, User, AlignLeft, CheckCircle, AlertCircle, Clock, Save, MessageSquare, Trash2, Plus, ArrowRight } from 'lucide-react';

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
}

const BADGE_COLOR_MAP: Record<string, string> = {
    'rose': 'bg-white border-rose-200 text-rose-700',
    'teal': 'bg-white border-teal-200 text-teal-700',
    'orange': 'bg-white border-orange-200 text-orange-700',
    'violet': 'bg-white border-violet-200 text-violet-700',
    'blue': 'bg-white border-blue-200 text-blue-700',
    'gray': 'bg-white border-gray-200 text-gray-700',
};

export default function ActionModal({
    isOpen,
    onClose,
    onSave,
    categoryName,
    subCategoryName,
    evidenceItem,
    initialData
}: ActionModalProps) {
    const [description, setDescription] = useState('');
    const [rationale, setRationale] = useState('');
    const [assignee, setAssignee] = useState('');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [status, setStatus] = useState<'open' | 'in_progress' | 'completed' | 'not_started'>('open');

    // Notes State
    const [notes, setNotes] = useState<ActionNote[]>([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setDescription(initialData.description);
                setRationale(initialData.rationale || '');
                setAssignee(initialData.assignee || '');
                setStartDate(initialData.startDate || '');
                setDueDate(initialData.dueDate || '');
                setPriority(initialData.priority);
                setStatus(initialData.status);
                setNotes(initialData.notes || []);
            } else {
                // New Action Defaults
                setDescription(evidenceItem ? `Address gap: ${evidenceItem}` : '');
                setRationale('');
                setAssignee('');
                setStartDate(new Date().toISOString().split('T')[0]); // Default to today
                setDueDate('');
                setPriority('medium');
                setStatus('open');
                setNotes([]);
            }
            setNewNote('');
        }
    }, [isOpen, initialData, evidenceItem]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Add note if exists
        let finalNotes = [...notes];
        if (newNote.trim()) {
            finalNotes.push({
                id: crypto.randomUUID(),
                author: 'You',
                timestamp: new Date().toISOString(),
                content: newNote
            });
        }

        const newAction: ActionItem = {
            id: initialData?.id || crypto.randomUUID(),
            description,
            rationale,
            assignee,
            startDate,
            dueDate,
            priority,
            status,
            category: categoryName || initialData?.category, // Use passed category or existing
            createdAt: initialData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: finalNotes
        };

        onSave(newAction);
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        setNotes([
            ...notes,
            {
                id: crypto.randomUUID(),
                author: 'You',
                timestamp: new Date().toISOString(),
                content: newNote
            }
        ]);
        setNewNote('');
    };

    const getCategoryBadgeStyle = (catName: string) => {
        const category = OFSTED_FRAMEWORK.find(c => c.name === catName);
        const colorName = category?.color || 'gray';
        return BADGE_COLOR_MAP[colorName] || BADGE_COLOR_MAP['gray'];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {initialData ? 'Update Action' : 'Create New Action'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            {categoryName && (
                                <span className={`text-xs px-2 py-0.5 rounded border font-bold ${getCategoryBadgeStyle(categoryName)}`}>
                                    {categoryName}
                                </span>
                            )}
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <span className="text-gray-300">/</span> {subCategoryName}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="action-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. Status & Priority (High Visibility) */}
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                        <CheckCircle size={16} className="text-blue-600" /> Current Status
                                    </label>
                                    <div className="flex gap-2">
                                        {['open', 'in_progress', 'completed'].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setStatus(s as any)}
                                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${status === s
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {s.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full md:w-1/3">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                        <AlertCircle size={16} className="text-amber-600" /> Priority
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white h-[38px]"
                                    >
                                        <option value="high">High Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="low">Low Priority</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Progress Update / Notes (Imperative) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <MessageSquare size={16} className="text-purple-600" />
                                Progress Update / Notes
                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Required for updates</span>
                            </label>

                            <div className="space-y-3">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="What's the latest progress on this action? Add your update here..."
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px] shadow-sm"
                                />

                                {/* Previous Notes */}
                                {notes.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-3 border border-gray-200">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">History</h4>
                                        {notes.map(note => (
                                            <div key={note.id} className="text-sm bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span className="font-medium text-gray-900">{note.author}</span>
                                                    <span>{new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-gray-700">{note.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Core Details (Description) */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Action Description</label>
                                <input
                                    type="text"
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    placeholder="What needs to be done?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <AlignLeft size={14} /> Rationale / Context
                                </label>
                                <textarea
                                    value={rationale}
                                    onChange={(e) => setRationale(e.target.value)}
                                    rows={2}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm text-gray-600"
                                    placeholder="Why is this action needed?"
                                />
                            </div>
                        </div>

                        {/* 4. Logistics (Dates & Assignee) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <User size={14} /> Assignee
                                </label>
                                <input
                                    type="text"
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="e.g. John Smith"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Calendar size={14} /> Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Clock size={14} /> Due Date
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="action-form"
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save & Update
                    </button>
                </div>
            </div>
        </div>
    );
}
