"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    History,
    Search,
    Filter,
    User,
    ArrowRight,
    Eye,
    Tag,
    Calendar,
    ChevronDown,
    ChevronUp,
    Shield,
    Database,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

interface AuditEntry {
    id: string;
    event_type: string;
    event_category: string;
    actor_email: string;
    resource_type: string;
    action: string;
    before_state: any;
    after_state: any;
    metadata: any;
    created_at: string;
}

export default function AuditLogPage() {
    const { organization } = useAuth();
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (organization?.id) {
            fetchLogs();
        }
    }, [organization?.id, filterCategory]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('audit_log')
                .select('*')
                .eq('organization_id', organization?.id)
                .order('created_at', { ascending: false });

            if (filterCategory !== "all") {
                query = query.eq('event_category', filterCategory);
            }

            const { data, error } = await query.limit(100);

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLoading(false);
        }
    };

    const getEventIcon = (category: string) => {
        switch (category) {
            case 'auth': return <Shield className="text-rose-500" size={18} />;
            case 'action': return <CheckCircle2 className="text-blue-500" size={18} />;
            case 'evidence': return <FileText className="text-emerald-500" size={18} />;
            case 'sef': return <Eye className="text-violet-500" size={18} />;
            default: return <Database className="text-slate-500" size={18} />;
        }
    };

    const filteredLogs = logs.filter(log =>
        log.actor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource_type?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 min-h-screen">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] mb-3 bg-emerald-50 dark:bg-emerald-950/40 w-fit px-4 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                        <Shield size={14} className="animate-pulse" />
                        System Integrity Audit
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                        <History className="text-blue-600" size={48} />
                        Audit Timeline
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by user or action..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold w-72 focus:ring-2 ring-blue-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-6 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 ring-blue-500 transition-all shadow-sm"
                    >
                        <option value="all">All Activities</option>
                        <option value="auth">Security & Auth</option>
                        <option value="action">Strategic Actions</option>
                        <option value="evidence">Evidence Vault</option>
                        <option value="sef">SEF Generation</option>
                    </select>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
                        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Reconstructing timeline...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">No entries found</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Try adjusting your filters or search query to find specific events.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="group">
                                <div
                                    className={`p-6 flex items-center gap-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all ${expandedId === log.id ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                                        {getEventIcon(log.event_category)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-black text-slate-900 dark:text-white text-sm truncate">
                                                {log.action}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                {log.resource_type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 min-w-0">
                                            <span className="flex items-center gap-1.5 shrink-0">
                                                <User size={12} className="text-blue-500" />
                                                {log.actor_email}
                                            </span>
                                            <span className="flex items-center gap-1.5 shrink-0">
                                                <Clock size={12} className="text-slate-400" />
                                                {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                                        {expandedId === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedId === log.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800"
                                        >
                                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                        Previous State
                                                    </h5>
                                                    <pre className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-[10px] font-mono overflow-auto max-h-[300px] shadow-inner text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        {JSON.stringify(log.before_state || 'No previous state recorded', null, 2)}
                                                    </pre>
                                                </div>
                                                <div className="space-y-4">
                                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        Resulting State
                                                    </h5>
                                                    <pre className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 text-[10px] font-mono overflow-auto max-h-[300px] shadow-inner text-slate-600 dark:text-slate-400 leading-relaxed ring-4 ring-emerald-50/30 dark:ring-emerald-900/10">
                                                        {JSON.stringify(log.after_state || log.metadata || 'No detailed state recorded', null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <footer className="flex items-center justify-between text-slate-400 px-4">
                <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Shield size={12} className="text-emerald-500" />
                    Immutable Audit Trail Locked & Verified
                </p>
                <p className="text-[10px] font-bold">Showing last 100 entries</p>
            </footer>
        </div>
    );
}
