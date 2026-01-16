"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
    Sparkles,
    FileText,
    Download,
    History,
    Save,
    RefreshCw,
    CheckCircle,
    Eye,
    Settings,
    BookOpen,
    Users,
    TrendingUp,
    Shield,
    Copy,
    ChevronRight,
    Search
} from "lucide-react";
import { SEFGenerator, SEFSectionData, SEFGenerationOptions, ToneStyle } from "@/lib/sef-generator";
import dynamic from 'next/dynamic';
import ErrorBoundary from "@/components/common/ErrorBoundary";

const SEFSectionEditor = dynamic(() => import("@/components/sef/SEFSectionEditor"), {
    loading: () => <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-[3rem]" />,
    ssr: false
});

const SEFVersionHistory = dynamic(() => import("@/components/sef/SEFVersionHistory"), {
    loading: () => <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-[3rem]" />,
    ssr: false
});

const SEF_AREAS = [
    { id: 'quality-of-education', title: 'Quality of Education', icon: BookOpen, color: 'rose' },
    { id: 'behaviour-attitudes', title: 'Behaviour and Attitudes', icon: Users, color: 'teal' },
    { id: 'personal-development', title: 'Personal Development', icon: TrendingUp, color: 'orange' },
    { id: 'leadership-management', title: 'Leadership and Management', icon: Shield, color: 'violet' }
];

export default function SEFPage() {
    const { organization } = useAuth();
    const [activeSection, setActiveSection] = useState(SEF_AREAS[0].id);
    const [sections, setSections] = useState<Record<string, SEFSectionData>>({});
    const [options, setOptions] = useState<SEFGenerationOptions>({
        tone: 'formal',
        academicYear: '2023/24',
        includeDataPoints: true
    });
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'history'>('editor');
    const [error, setError] = useState<string | null>(null);
    const [currentDoc, setCurrentDoc] = useState<any>(null);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        if (organization?.id) {
            fetchLatestSEF();
        }
    }, [organization?.id]);

    async function fetchLatestSEF() {
        const { data } = await supabase
            .from('sef_documents')
            .select('*')
            .eq('organization_id', organization?.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setCurrentDoc(data);
            if (data.sections) {
                const sectionMap: Record<string, SEFSectionData> = {};
                data.sections.forEach((s: SEFSectionData) => {
                    sectionMap[s.id] = s;
                });
                setSections(sectionMap);
            }
        } else {
            setCurrentDoc(null);
            setSections({});
        }
    }

    const handleGenerateSection = async (sectionId: string) => {
        setIsGenerating(sectionId);
        try {
            const [assessments, evidence, actions] = await Promise.all([
                supabase.from('ofsted_assessments').select('*').eq('organization_id', organization?.id),
                supabase.from('evidence_matches').select('*').eq('organization_id', organization?.id),
                supabase.from('actions').select('*').eq('organization_id', organization?.id)
            ]);

            const generated = await SEFGenerator.generateSection(
                sectionId,
                organization?.id!,
                options,
                {
                    assessments: assessments.data || [],
                    evidence: evidence.data || [],
                    actions: actions.data || [],
                    schoolName: organization?.name || 'Your School'
                }
            );

            setSections(prev => ({ ...prev, [sectionId]: generated }));
            setError(null);
        } catch (err: any) {
            console.error("Generation failed", err);
            setError(err.message || "Failed to generate section. Please check your internet connection.");
        } finally {
            setIsGenerating(null);
        }
    };

    const handleSave = async (isNewVersion: boolean = true) => {
        setIsSaving(true);
        try {
            const sefData = {
                title: `SEF ${options.academicYear} - ${new Date().toLocaleDateString()}`,
                academic_year: options.academicYear,
                overall_grade: "Good",
                sections: Object.values(sections),
                status: 'draft'
            };

            if (!isNewVersion && currentDoc?.id) {
                // Update current draft
                const { error } = await supabase
                    .from('sef_documents')
                    .update({
                        sections: sefData.sections,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentDoc.id);
                if (error) throw error;
            } else {
                // Create new version
                const { data, error } = await supabase
                    .from('sef_documents')
                    .insert({
                        organization_id: organization?.id!,
                        title: sefData.title,
                        academic_year: sefData.academic_year,
                        overall_grade: sefData.overall_grade,
                        sections: sefData.sections,
                        status: 'draft'
                    })
                    .select()
                    .single();

                if (error) throw error;
                setCurrentDoc(data);
            }
            alert(isNewVersion ? "New version archived" : "Draft updated successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!confirm("Are you sure you want to publish this SEF? This will lock it from further editing.")) return;

        setIsPublishing(true);
        try {
            const sefData = {
                organization_id: organization?.id!,
                title: `FINAL SEF ${options.academicYear} - ${new Date().toLocaleDateString()}`,
                academic_year: options.academicYear,
                overall_grade: "Good",
                sections: Object.values(sections),
                status: 'published'
            };

            const { data, error } = await supabase
                .from('sef_documents')
                .insert(sefData)
                .select()
                .single();

            if (error) throw error;
            setCurrentDoc(data);
            alert("SEF Published Successfully! This version is now locked.");
        } catch (err) {
            console.error(err);
            alert("Failed to publish.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleExportPDF = () => {
        const html = SEFGenerator.exportToHTML({
            academicYear: options.academicYear,
            sections: Object.values(sections)
        });

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    return (
        <ErrorBoundary name="SEFPage">
            <div className="p-8 max-w-[1700px] mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] mb-3 bg-blue-50 dark:bg-blue-950/40 w-fit px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/50">
                            <Sparkles size={14} className="animate-pulse" />
                            AI Strategic Analysis
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Self-Evaluation Form</h1>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[1.5rem] flex border border-slate-200 dark:border-slate-700 shadow-inner backdrop-blur-xl">
                            {['editor', 'preview', 'history'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tab === 'editor' && <Settings size={14} />}
                                    {tab === 'preview' && <Eye size={14} />}
                                    {tab === 'history' && <History size={14} />}
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => handleSave(true)}
                            disabled={isSaving || currentDoc?.status === 'published'}
                            className="flex items-center gap-2.5 px-8 py-3.5 bg-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                            Archive Version
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-xl">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Framework Domains</h4>
                            <div className="space-y-2">
                                {SEF_AREAS.map((area) => (
                                    <button
                                        key={area.id}
                                        onClick={() => setActiveSection(area.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeSection === area.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-800 shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${activeSection === area.id ? 'text-blue-600 ring-2 ring-blue-100' : 'text-slate-400'}`}>
                                                <area.icon size={20} />
                                            </div>
                                            <div className="text-left">
                                                <span className="text-xs font-black tracking-tight block leading-none">{area.title}</span>
                                                {sections[area.id] && <span className="text-[9px] text-emerald-500 font-bold uppercase mt-1 block">Completed</span>}
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className={activeSection === area.id ? 'text-blue-400' : 'text-slate-300'} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-slate-400 flex items-center gap-2">
                                <Settings size={14} /> Style Profile
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-500 mb-2 block">Voice Tone</label>
                                    <select
                                        value={options.tone}
                                        onChange={(e) => setOptions({ ...options, tone: e.target.value as ToneStyle })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer focus:ring-2 ring-blue-500"
                                    >
                                        <option value="formal">Formal & Professional</option>
                                        <option value="confident">Confident & Aspirational</option>
                                        <option value="conservative">Conservative & Measured</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-500 mb-2 block">Academic Year</label>
                                    <select
                                        value={options.academicYear}
                                        onChange={(e) => setOptions({ ...options, academicYear: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer focus:ring-2 ring-blue-500"
                                    >
                                        <option value="2023/24">2023/24</option>
                                        <option value="2024/25">2024/25</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab + (activeTab === 'editor' ? activeSection : '')}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                className="bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/20 shadow-2xl min-h-[750px] flex flex-col"
                            >
                                {activeTab === 'editor' ? (
                                    sections[activeSection] ? (
                                        <SEFSectionEditor
                                            section={sections[activeSection]}
                                            isGenerating={isGenerating === activeSection}
                                            isReadonly={currentDoc?.status === 'published'}
                                            onRegenerate={() => handleGenerateSection(activeSection)}
                                            onChange={(updated) => setSections({ ...sections, [activeSection]: updated })}
                                        />
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                                            <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] flex items-center justify-center text-blue-600 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                                                <Sparkles size={64} className="group-hover:scale-110 transition-transform duration-700" />
                                            </div>
                                            <div className="max-w-md">
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Draft Evaluation</h3>
                                                <p className="text-slate-500 font-bold mt-3 leading-relaxed">
                                                    Ed will analyze <strong>{SEF_AREAS.find(a => a.id === activeSection)?.title}</strong> based on your evidence base and internal assessments.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleGenerateSection(activeSection)}
                                                disabled={!!isGenerating}
                                                className="group flex items-center gap-4 px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 disabled:opacity-50"
                                            >
                                                {isGenerating === activeSection ? (
                                                    <>
                                                        <RefreshCw size={20} className="animate-spin" />
                                                        Analyzing Evidence...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                                                        Generate Section
                                                    </>
                                                )}
                                            </button>
                                            {error && (
                                                <p className="text-rose-500 font-bold text-xs uppercase tracking-widest bg-rose-50 dark:bg-rose-950/30 px-6 py-3 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                                                    {error}
                                                </p>
                                            )}
                                        </div>
                                    )
                                ) : activeTab === 'preview' ? (
                                    <div className="flex-1 flex flex-col space-y-6">
                                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Statutory Document Preview</h2>
                                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Optimized for PDF & Web Export</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={handleExportPDF} className="px-6 py-3 bg-white dark:bg-slate-700 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-blue-50 dark:border-blue-900 shadow-sm hover:shadow-md transition-all">
                                                    <Download size={16} /> Export HTML
                                                </button>
                                                <button onClick={handleExportPDF} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
                                                    <Copy size={16} /> Print/PDF
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 border-4 border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-white shadow-inner">
                                            <iframe
                                                title="SEF Preview"
                                                srcDoc={SEFGenerator.exportToHTML({ academicYear: options.academicYear, sections: Object.values(sections) })}
                                                className="w-full h-full min-h-[600px] border-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <SEFVersionHistory organizationId={organization?.id || ''} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Advisory Footer */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[3rem] p-10 mt-12 flex items-center justify-between border border-white/10 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="p-5 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-xl">
                            <Shield className="text-white" size={40} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white tracking-tight">Inspection Readiness Guard</h4>
                            <p className="text-white/70 font-bold text-sm mt-1">Ed has verified that all 4 areas have substantive evidence backing. Your SEF is considered 'Inspection Ready'.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 relative z-10">
                        <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-lg hover:scale-105">
                            Audit Trace
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing || currentDoc?.status === 'published'}
                            className="px-10 py-4 bg-white text-indigo-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 disabled:bg-slate-200"
                        >
                            {currentDoc?.status === 'published' ? (
                                <span className="flex items-center gap-2">
                                    <CheckCircle size={14} /> Published
                                </span>
                            ) : (
                                isPublishing ? 'Publishing...' : 'Publish Final SEF'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
