"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { History, Calendar, ArrowRight, FileText, CheckCircle } from 'lucide-react';

interface SEFVersion {
    id: string;
    title: string;
    academic_year: string;
    created_at: string;
    overall_grade: string;
    version: number;
}

export default function SEFVersionHistory({ organizationId }: { organizationId: string }) {
    const [versions, setVersions] = useState<SEFVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (organizationId) {
            fetchVersions();
        }
    }, [organizationId]);

    async function fetchVersions() {
        const { data, error } = await supabase
            .from('sef_documents')
            .select('id, title, academic_year, created_at, overall_grade, version')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (data) setVersions(data);
        setIsLoading(false);
    }

    if (isLoading) return <div className="p-10 text-center text-slate-400">Loading history...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Version History</h2>
            <div className="space-y-4">
                {versions.map((v) => (
                    <div key={v.id} className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-lg transition-all group">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 dark:text-white">{v.title}</h4>
                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 font-bold">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(v.created_at).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Grade: {v.overall_grade}</span>
                                    <span>v{v.version}</span>
                                </div>
                            </div>
                        </div>
                        <button className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <ArrowRight size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
