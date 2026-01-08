"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Edit2, TrendingUp, CheckCircle, AlertTriangle, AlertCircle, Brain } from 'lucide-react';
import { AssessmentData, LocalEvidenceMatch } from './types';

interface SubcategoryAssessmentProps {
    subcategory: {
        id: string;
        name: string;
        description: string;
        evidenceRequired: Array<{ id: string; name: string }>;
    };
    assessment: AssessmentData;
    evidenceMatches: Record<string, LocalEvidenceMatch[]>;
    onEditClick: () => void;
    onAddAction: (e: React.MouseEvent, evidenceId?: string) => void;
    onViewEvidence: (evidenceId: string, evidenceName: string, matches: any[]) => void;
}

const RATING_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
    'exceptional': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle },
    'good': { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', icon: CheckCircle },
    'expected_standard': { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', icon: CheckCircle },
    'requires_improvement': { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
    'inadequate': { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', icon: AlertCircle },
};

export const SubcategoryAssessment: React.FC<SubcategoryAssessmentProps> = ({
    subcategory,
    assessment,
    evidenceMatches,
    onEditClick,
    onAddAction,
    onViewEvidence
}) => {
    const ratingStyle = assessment.schoolRating ? RATING_STYLES[assessment.schoolRating] : null;
    const aiRatingStyle = assessment.aiRating ? RATING_STYLES[assessment.aiRating] : null;

    return (
        <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Metadata & Self-Assessment */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{subcategory.name}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subcategory.description}</p>
                        </div>
                        <button
                            onClick={onEditClick}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm"
                        >
                            <Edit2 size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Self Rating */}
                        <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Self Rating</span>
                            {assessment.schoolRating ? (
                                <div className="flex items-center gap-2">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${ratingStyle?.bg}`}>
                                        {assessment.schoolRating.replace('_', ' ').toUpperCase()}
                                    </div>
                                </div>
                            ) : (
                                <span className="text-sm text-slate-400 italic">Not assessed</span>
                            )}
                        </div>

                        {/* AI Rating */}
                        <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Brain size={32} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                <Brain size={12} className="text-purple-500" />
                                AI Validation
                            </span>
                            {assessment.aiRating ? (
                                <div className="flex items-center gap-2">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${aiRatingStyle?.bg}`}>
                                        {assessment.aiRating.replace('_', ' ').toUpperCase()}
                                    </div>
                                </div>
                            ) : (
                                <span className="text-sm text-slate-400 italic">Scanning required...</span>
                            )}
                        </div>
                    </div>

                    {assessment.schoolRationale && (
                        <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Rationale</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {assessment.schoolRationale}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Evidence Tracker */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Evidence</h5>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full">
                            {subcategory.evidenceRequired.length} items
                        </span>
                    </div>

                    <div className="space-y-2">
                        {subcategory.evidenceRequired.map((item) => {
                            const matches = evidenceMatches[`${subcategory.id}_${item.id}`] || [];
                            const hasEvidence = matches.length > 0;

                            return (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ x: 4 }}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${hasEvidence
                                            ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800/50 shadow-sm'
                                            : 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-700/30 opacity-70 hover:opacity-100'
                                        }`}
                                    onClick={() => onViewEvidence(item.id, item.name, matches)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${hasEvidence ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-200/50 dark:bg-slate-700 text-slate-400'}`}>
                                                <FileText size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                                {item.name}
                                            </span>
                                        </div>
                                        {hasEvidence ? (
                                            <div className="flex items-center gap-1 text-emerald-600">
                                                <CheckCircle size={14} />
                                                <span className="text-[10px] font-bold">{matches.length}</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddAction(e, item.id);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <button
                        onClick={(e) => onAddAction(e)}
                        className="w-full py-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                    >
                        <TrendingUp size={14} />
                        Create Action Point
                    </button>
                </div>
            </div>
        </div>
    );
};
