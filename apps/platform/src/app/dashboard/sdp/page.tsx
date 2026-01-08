"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
    Flag,
    Download,
    Sparkles,
    ArrowRight,
    TrendingUp,
    Settings,
    Eye,
    ChevronLeft,
    PieChart,
    BarChart3,
    FileText,
    Save
} from "lucide-react";
import { SDPGenerator, SDPPriorityData, SDPDocumentData } from "@/lib/sdp-generator";
import SDPBuilder from "@/components/sdp/SDPBuilder";

export default function SDPPage() {
    const { organization } = useAuth();
    const [sdp, setSdp] = useState<SDPDocumentData>({
        title: `SDP 2023-2024`,
        academicYear: "2023/24",
        priorities: [],
        totalBudget: 0
    });
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (organization?.id) {
            fetchLatestSDP();
        }
    }, [organization?.id]);

    async function fetchLatestSDP() {
        const { data } = await supabase
            .from('sdp_documents')
            .select('*')
            .eq('organization_id', organization?.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setSdp({
                title: data.title,
                academicYear: data.academic_year,
                priorities: data.priorities || [],
                totalBudget: data.total_budget || 0
            });
        }
    }

    const handleSuggestPriorities = async () => {
        setIsGenerating(true);
        try {
            const suggestions = await SDPGenerator.suggestPrioritiesFromData(organization?.id!);
            if (suggestions.length > 0) {
                setSdp(prev => ({
                    ...prev,
                    priorities: suggestions as SDPPriorityData[]
                }));
            } else {
                alert("No specific areas for development found in assessments. Try scanning your evidence first.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async (updatedPriorities?: SDPPriorityData[]) => {
        setIsSaving(true);
        try {
            const finalSDP = {
                ...sdp,
                priorities: updatedPriorities || sdp.priorities
            };
            await SDPGenerator.saveSDP(organization?.id!, finalSDP);
            setSdp(finalSDP);
            alert("School Development Plan Saved Successfully");
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportHTML = () => {
        const html = SDPGenerator.exportToHTML(sdp);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SDP_${sdp.academicYear.replace('/', '-')}.html`;
        a.click();
    };

    return (
        <div className="p-8 max-w-[1700px] mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em] mb-3 bg-indigo-50 dark:bg-indigo-950/40 w-fit px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                        <Flag size={14} className="animate-pulse" />
                        Strategic Planning
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">School Development Plan</h1>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[1.5rem] flex border border-slate-200 dark:border-slate-700 shadow-inner backdrop-blur-xl">
                        {['editor', 'preview'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab === 'editor' && <Settings size={14} />}
                                {tab === 'preview' && <Eye size={14} />}
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExportHTML}
                        className="flex items-center gap-2.5 px-8 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                    >
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Stats Sidebar */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-white/60">Strategic Overview</h4>
                        <div className="space-y-6">
                            <div>
                                <span className="text-3xl font-black block leading-none">£{sdp.priorities.reduce((acc, p) => acc + (p.budget || 0), 0).toLocaleString()}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60 mt-2 block">Total Budget Committed</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                    <span className="text-xl font-black block">{sdp.priorities.length}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-100/60">Priorities</span>
                                </div>
                                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                    <span className="text-xl font-black block">{sdp.priorities.flatMap(p => p.milestones).length}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-100/60">Milestones</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Budget Distribution</h4>
                        <div className="space-y-4">
                            {sdp.priorities.map(p => (
                                <div key={p.id}>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                        <span className="text-slate-500 truncate max-w-[150px]">{p.title}</span>
                                        <span className="text-slate-900 dark:text-white">£{p.budget?.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(p.budget / (sdp.priorities.reduce((acc, x) => acc + (x.budget || 0), 0) || 1)) * 100}%` }}
                                            className="h-full bg-indigo-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {sdp.priorities.length === 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-[2.5rem] p-8 border border-amber-100 dark:border-amber-900/50 shadow-lg">
                            <h4 className="text-xs font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Sparkles size={16} /> Strategy Suggestion
                            </h4>
                            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-500 leading-relaxed mb-6">
                                Based on your recent evidence scan, Ed can identify areas needing attention and suggest strategic priorities for your SDP.
                            </p>
                            <button
                                onClick={handleSuggestPriorities}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                                Identify Priorities
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="min-h-[800px]"
                        >
                            {activeTab === 'editor' ? (
                                <SDPBuilder
                                    initialPriorities={sdp.priorities}
                                    onSave={handleSave}
                                />
                            ) : (
                                <div className="bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/20 shadow-2xl h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-10">
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Strategy Document Preview</h2>
                                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">High-Level Strategic Roadmap</p>
                                        </div>
                                        <button onClick={handleExportHTML} className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                            Prepare for Governors
                                        </button>
                                    </div>
                                    <div className="flex-1 border-4 border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-inner">
                                        <iframe
                                            title="SDP Preview"
                                            srcDoc={SDPGenerator.exportToHTML(sdp)}
                                            className="w-full h-full min-h-[600px] border-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function RefreshCw({ size, className }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>;
}
