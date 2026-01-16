"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, ChevronRight, CheckCircle2, Layout, Plus, Loader2, X } from 'lucide-react';
import { PackTemplate } from '@/lib/packs/types';

interface PackTemplateSelectorProps {
    onSelect: (template: PackTemplate) => void;
    onClose: () => void;
}

export default function PackTemplateSelector({ onSelect, onClose }: PackTemplateSelectorProps) {
    const [templates, setTemplates] = useState<PackTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<PackTemplate | null>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch('/api/packs/templates');
                if (response.ok) {
                    const data = await response.json();
                    setTemplates(data.templates || []);
                }
            } catch (err) {
                console.error('Failed to fetch templates:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl w-[600px]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-gray-500 font-bold tracking-tight">Loading Governor Templates...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        <Shield className="text-blue-600" size={32} />
                        CHOOSE PACK TEMPLATE
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Navigator Governor Pack Lite (v1.0)</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white/50 transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Template List */}
                <div className="w-full lg:w-1/2 border-r border-gray-100 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => setSelectedTemplate(template)}
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${selectedTemplate?.id === template.id ? 'border-blue-600 bg-white shadow-xl shadow-blue-100' : 'border-white bg-white hover:border-blue-200 hover:shadow-lg'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                                    <Layout size={20} />
                                </div>
                                {selectedTemplate?.id === template.id && <CheckCircle2 className="text-blue-600" size={20} />}
                            </div>
                            <h3 className="font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                {template.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2 font-medium">
                                {template.description || 'Standard reporting template for governors.'}
                            </p>
                            <div className="mt-4 flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                    {template.sections.length} Sections
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                    Regulatory Aligned
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Template Preview */}
                <div className="flex-1 bg-white p-8 overflow-y-auto">
                    {selectedTemplate ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="text-amber-500" size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Template Details</span>
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-4">
                                    {selectedTemplate.name}
                                </h3>
                                <p className="text-gray-600 leading-relaxed font-medium">
                                    {selectedTemplate.description}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Included Sections</h4>
                                {selectedTemplate.sections.map((section, idx) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <div className="text-xs font-black text-blue-300 w-4 pt-1">{idx + 1}.</div>
                                        <div className="flex-1">
                                            <h5 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{section.title}</h5>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {section.evidence_categories.map((cat, ci) => (
                                                    <span key={ci} className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12">
                                <button
                                    onClick={() => onSelect(selectedTemplate)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] group"
                                >
                                    START THIS PACK
                                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-50">
                            <div className="bg-gray-100 p-8 rounded-full mb-6">
                                <Layout className="text-gray-400" size={64} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Select a template</h3>
                            <p className="text-sm text-gray-500 font-medium mt-2">Pick a reporting framework from the left to see the structure and evidence requirements.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
