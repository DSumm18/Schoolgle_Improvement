"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle, Shield, CheckCircle, Brain, Info, Sparkles } from 'lucide-react';
import { AssessmentData } from './types';

interface AssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (subId: string, data: AssessmentData) => void;
    subcategory: {
        id: string;
        name: string;
        description: string;
    };
    initialData: AssessmentData;
}

const RATINGS = [
    { id: 'not_assessed', label: 'Not Assessed', color: 'slate' },
    { id: 'exceptional', label: 'Exceptional', color: 'emerald' },
    { id: 'strong_standard', label: 'Strong Standard', color: 'blue' },
    { id: 'expected_standard', label: 'Expected Standard', color: 'amber' },
    { id: 'needs_attention', label: 'Needs Attention', color: 'orange' },
    { id: 'urgent_improvement', label: 'Urgent Improvement', color: 'rose' },
];

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    subcategory,
    initialData
}) => {
    const [rating, setRating] = useState(initialData.schoolRating || 'not_assessed');
    const [rationale, setRationale] = useState(initialData.schoolRationale || '');

    useEffect(() => {
        if (isOpen) {
            setRating(initialData.schoolRating || 'not_assessed');
            setRationale(initialData.schoolRationale || '');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
                                <Shield size={14} />
                                Self-Assessment Module
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                {subcategory.name}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md">
                                {subcategory.description}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-8">
                        {/* Rating Selection */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                Self-Assessment Rating
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                {RATINGS.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => setRating(r.id)}
                                        className={`px-4 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-2 ${rating === r.id
                                            ? `bg-${r.color}-50 dark:bg-${r.color}-900/20 border-${r.color}-500 text-${r.color}-700 shadow-lg scale-105`
                                            : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${rating === r.id ? `bg-${r.color}-500 animate-pulse` : 'bg-slate-200'}`} />
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rationale */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                    Rationale & Internal Evidence Notes
                                </label>
                                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg flex items-center gap-1">
                                    <Sparkles size={10} />
                                    AI Assist Available
                                </span>
                            </div>
                            <textarea
                                value={rationale}
                                onChange={(e) => setRationale(e.target.value)}
                                placeholder="Detail why this rating was chosen, referencing specific documents or internal audits..."
                                className="w-full h-40 p-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-3xl outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium leading-relaxed"
                            />
                        </div>

                        {/* Info Callout */}
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-4 flex gap-3 items-start">
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                                Ratings should be evidence-based. If your AI Evidence Score is significantly lower than your self-rating, ensure all relevant documents have been scanned.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(subcategory.id, { ...initialData, schoolRating: rating, schoolRationale: rationale })}
                            className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Save size={18} />
                            Commit Assessment
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
