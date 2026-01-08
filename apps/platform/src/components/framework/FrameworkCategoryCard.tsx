"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info, Brain, Sparkles, AlertCircle } from 'lucide-react';
import { AssessmentData } from './types';

interface FrameworkCategoryCardProps {
    category: {
        id: string;
        name: string;
        description: string;
        color: string;
        guidanceSummary?: string;
    };
    isExpanded: boolean;
    onToggle: () => void;
    userScore: number;
    aiScore: number;
    children: React.ReactNode;
    onInfoClick: (e: React.MouseEvent) => void;
    openEdAnalysis: (name: string, rating?: string, evidenceCount?: number) => void;
}

const CATEGORY_COLOR_CONFIG: Record<string, { border: string; accent: string; bg: string; text: string }> = {
    'rose': { border: 'border-rose-500/50', accent: 'bg-rose-500', bg: 'bg-rose-50/50', text: 'text-rose-900' },
    'teal': { border: 'border-teal-500/50', accent: 'bg-teal-500', bg: 'bg-teal-50/50', text: 'text-teal-900' },
    'orange': { border: 'border-orange-500/50', accent: 'bg-orange-500', bg: 'bg-orange-50/50', text: 'text-orange-900' },
    'violet': { border: 'border-violet-500/50', accent: 'bg-violet-500', bg: 'bg-violet-50/50', text: 'text-violet-900' },
    'blue': { border: 'border-blue-500/50', accent: 'bg-blue-500', bg: 'bg-blue-50/50', text: 'text-blue-900' },
    'gray': { border: 'border-gray-500/50', accent: 'bg-gray-500', bg: 'bg-gray-50/50', text: 'text-gray-900' },
};

export const FrameworkCategoryCard: React.FC<FrameworkCategoryCardProps> = ({
    category,
    isExpanded,
    onToggle,
    userScore,
    aiScore,
    children,
    onInfoClick,
    openEdAnalysis
}) => {
    const config = CATEGORY_COLOR_CONFIG[category.color] || CATEGORY_COLOR_CONFIG.gray;

    return (
        <motion.div
            layout
            className={`glass-card rounded-2xl overflow-hidden mb-6 border-l-4 ${config.border} transition-all duration-300`}
            initial={false}
        >
            <button
                onClick={onToggle}
                className="w-full text-left p-6 flex items-center justify-between group hover:bg-slate-50/10 transition-colors"
            >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl ${config.bg} ${config.text} group-hover:scale-110 transition-transform duration-300`}>
                        <Sparkles size={24} className="opacity-80" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                            {category.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 opacity-80">
                            {category.description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-8 ml-4">
                    {/* Readiness Stats */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Self Score</span>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${userScore}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{userScore}%</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                                <Brain size={10} className="text-purple-500" />
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Confidence</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500"
                                        style={{ width: `${aiScore}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{aiScore}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onInfoClick(e);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                            <Info size={20} />
                        </button>
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: 'backOut' }}
                            className="p-2 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                        >
                            <ChevronDown size={24} />
                        </motion.div>
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className="px-6 pb-8 border-t border-slate-100 dark:border-slate-800/50 pt-6">
                            {category.guidanceSummary && (
                                <div className="mb-8 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20 rounded-xl flex gap-3 items-start">
                                    <AlertCircle className="text-blue-500 mt-0.5 shrink-0" size={18} />
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-1">Inspector's Focus</h4>
                                        <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed italic">
                                            {category.guidanceSummary}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {children}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => openEdAnalysis(category.name)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
                                >
                                    <Brain size={16} />
                                    Analyze with AI Assistant
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
