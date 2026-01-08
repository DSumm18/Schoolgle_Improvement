"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, RefreshCw, CheckCircle, TrendingUp } from 'lucide-react';
import { SEFSectionData } from '@/lib/sef-generator';

interface SEFSectionEditorProps {
    section: SEFSectionData;
    isGenerating: boolean;
    onRegenerate: () => void;
    onChange: (updated: SEFSectionData) => void;
}

export default function SEFSectionEditor({ section, isGenerating, onRegenerate, onChange }: SEFSectionEditorProps) {
    return (
        <div className="space-y-8 flex-1">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{section.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                            Grade: {section.grade.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onRegenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                    Regenerate Area
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <MessageSquare size={12} /> Narrative Rationale
                        </label>
                        <textarea
                            value={section.narrative}
                            onChange={(e) => onChange({ ...section, narrative: e.target.value })}
                            rows={12}
                            className="w-full bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-sm font-medium leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 dark:text-slate-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Key Strengths</h4>
                            <div className="space-y-2">
                                {section.strengths.map((s, i) => (
                                    <div key={i} className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Areas for Development</h4>
                            <div className="space-y-2">
                                {section.afd.map((a, i) => (
                                    <div key={i} className="bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100 dark:border-rose-800 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                                        {a}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            Evidence Links
                        </h4>
                        <div className="space-y-2 text-wrap break-words">
                            {section.evidence.map((ev, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-600 border border-slate-100 dark:border-slate-800">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    {ev}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            Strategic Actions
                        </h4>
                        <div className="space-y-2">
                            {section.actions.map((act, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-600 border border-slate-100 dark:border-slate-800">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                    {act}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
