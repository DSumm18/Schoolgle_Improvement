"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    DollarSign,
    User,
    Calendar,
    Save,
    Sparkles,
    CheckCircle,
    ArrowRight,
    Flag
} from 'lucide-react';
import { SDPPriorityData, SDPMilestone } from '@/lib/sdp-generator';

interface SDPBuilderProps {
    initialPriorities: SDPPriorityData[];
    onSave: (priorities: SDPPriorityData[]) => void;
}

export default function SDPBuilder({ initialPriorities, onSave }: SDPBuilderProps) {
    const [priorities, setPriorities] = useState<SDPPriorityData[]>(initialPriorities);
    const [expandedPriority, setExpandedPriority] = useState<string | null>(null);

    const addPriority = () => {
        const newP: SDPPriorityData = {
            id: crypto.randomUUID(),
            number: priorities.length + 1,
            title: "New Strategic Priority",
            description: "",
            rationale: "",
            ofstedCategoryId: "quality-of-education",
            leadPerson: "",
            budget: 0,
            successCriteria: [""],
            milestones: []
        };
        setPriorities([...priorities, newP]);
        setExpandedPriority(newP.id);
    };

    const updatePriority = (id: string, updates: Partial<SDPPriorityData>) => {
        setPriorities(priorities.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const removePriority = (id: string) => {
        setPriorities(priorities.filter(p => p.id !== id).map((p, i) => ({ ...p, number: i + 1 })));
    };

    const addMilestone = (priorityId: string) => {
        const newM: SDPMilestone = {
            id: crypto.randomUUID(),
            title: "New Milestone",
            targetDate: new Date().toISOString().split('T')[0],
            status: 'pending'
        };
        const p = priorities.find(p => p.id === priorityId);
        if (p) {
            updatePriority(priorityId, { milestones: [...p.milestones, newM] });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Strategic Priorities</h3>
                    <p className="text-slate-500 font-bold text-sm">Define and track your high-level school improvement goals</p>
                </div>
                <button
                    onClick={addPriority}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                >
                    <Plus size={18} /> Add Priority
                </button>
            </div>

            <div className="space-y-4">
                {priorities.map((p) => (
                    <motion.div
                        key={p.id}
                        layout
                        className={`bg-white dark:bg-slate-900/50 rounded-[2.5rem] border transition-all ${expandedPriority === p.id ? 'border-blue-500 ring-4 ring-blue-50 shadow-2xl' : 'border-slate-100 dark:border-slate-800 shadow-lg'}`}
                    >
                        <div
                            onClick={() => setExpandedPriority(expandedPriority === p.id ? null : p.id)}
                            className="p-8 flex items-center justify-between cursor-pointer group"
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${expandedPriority === p.id ? 'bg-blue-600 text-white shadow-xl rotate-3' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-blue-500'}`}>
                                    {p.number}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{p.title || "Untitled Priority"}</h4>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                            <Flag size={12} /> {p.ofstedCategoryId}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                            <DollarSign size={12} /> £{p.budget?.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                            <CheckCircle size={12} /> {p.milestones.length} Milestones
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); removePriority(p.id); }}
                                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={20} />
                                </button>
                                {expandedPriority === p.id ? <ChevronUp className="text-blue-500" /> : <ChevronDown className="text-slate-300" />}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedPriority === p.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-slate-50 dark:border-slate-800"
                                >
                                    <div className="p-10 space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Title</label>
                                                <input
                                                    value={p.title}
                                                    onChange={(e) => updatePriority(p.id, { title: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-blue-500 transition-all shadow-inner"
                                                    placeholder="e.g., Redefine the Foundation Curriculum"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Lead</label>
                                                <div className="relative">
                                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input
                                                        value={p.leadPerson}
                                                        onChange={(e) => updatePriority(p.id, { leadPerson: e.target.value })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 pl-14 pr-6 py-4 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-blue-500 transition-all shadow-inner"
                                                        placeholder="Name or Role"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocated Budget (£)</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input
                                                        type="number"
                                                        value={p.budget}
                                                        onChange={(e) => updatePriority(p.id, { budget: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 pl-14 pr-6 py-4 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-blue-500 transition-all shadow-inner"
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Rationale</label>
                                                <textarea
                                                    value={p.rationale}
                                                    onChange={(e) => updatePriority(p.id, { rationale: e.target.value })}
                                                    rows={1}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-blue-500 transition-all shadow-inner resize-none"
                                                    placeholder="Why is this a priority now?"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                                                    <Sparkles size={16} /> Strategic Milestones
                                                </h5>
                                                <button
                                                    onClick={() => addMilestone(p.id)}
                                                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all"
                                                >
                                                    + Add Milestone
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {p.milestones.map((m, mIdx) => (
                                                    <div key={m.id} className="flex gap-4 items-center">
                                                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl flex items-center justify-between gap-6 border border-slate-100 dark:border-slate-800">
                                                            <input
                                                                value={m.title}
                                                                onChange={(e) => {
                                                                    const newMs = [...p.milestones];
                                                                    newMs[mIdx].title = e.target.value;
                                                                    updatePriority(p.id, { milestones: newMs });
                                                                }}
                                                                className="flex-1 bg-transparent font-bold text-slate-700 dark:text-white border-none outline-none"
                                                            />
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex items-center gap-2 text-slate-400">
                                                                    <Calendar size={14} />
                                                                    <input
                                                                        type="date"
                                                                        value={m.targetDate}
                                                                        onChange={(e) => {
                                                                            const newMs = [...p.milestones];
                                                                            newMs[mIdx].targetDate = e.target.value;
                                                                            updatePriority(p.id, { milestones: newMs });
                                                                        }}
                                                                        className="bg-transparent font-bold text-xs outline-none"
                                                                    />
                                                                </div>
                                                                <select
                                                                    value={m.status}
                                                                    onChange={(e) => {
                                                                        const newMs = [...p.milestones];
                                                                        newMs[mIdx].status = e.target.value as any;
                                                                        updatePriority(p.id, { milestones: newMs });
                                                                    }}
                                                                    className="bg-white dark:bg-slate-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none border border-slate-100 dark:border-slate-600"
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="in_progress">Active</option>
                                                                    <option value="completed">Done</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const newMs = p.milestones.filter(x => x.id !== m.id);
                                                                updatePriority(p.id, { milestones: newMs });
                                                            }}
                                                            className="p-3 text-slate-300 hover:text-rose-500 transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-end pt-10">
                <button
                    onClick={() => onSave(priorities)}
                    className="flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all group"
                >
                    <Save size={20} className="group-hover:scale-110 transition-all" />
                    Commit Strategy to SQL
                </button>
            </div>
        </div>
    );
}
