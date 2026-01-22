'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    ArrowLeft, ChevronDown, ChevronRight, Check, Clock, AlertCircle,
    User, Building2, ExternalLink, MoreHorizontal, Plus, FileText,
    Loader2, Filter, Search
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface ComplianceCheck {
    id: string;
    slug: string;
    title: string;
    description: string;
    gems_category: string;
    statutory_flag: string;
    priority: string;
    frequency_days: number;
    legislation_url: string;
    legislation_name: string;
    status?: string;
    last_completed_at?: string;
    next_due?: string;
    assigned_user_id?: string;
    contractor_id?: string;
    contractor_name?: string;
    assigned_name?: string;
    has_steps?: boolean;
}

interface CategoryGroup {
    category: string;
    checks: ComplianceCheck[];
    compliant: number;
    total: number;
    overdue: number;
    expanded: boolean;
}

export default function ComplianceManagePage() {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<CategoryGroup[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch checks with instances
                const { data: checks, error } = await supabase
                    .from('compliance_checks')
                    .select('*')
                    .order('gems_category', { ascending: true })
                    .order('title', { ascending: true });

                if (error) throw error;

                // Get user's school_id
                const { data: { user } } = await supabase.auth.getUser();
                const schoolId = user?.user_metadata?.school_id;

                // Fetch instances
                let instances: any[] = [];
                if (schoolId) {
                    const { data } = await supabase
                        .from('compliance_instances')
                        .select('*')
                        .eq('school_id', schoolId);
                    instances = data || [];
                }

                // Fetch contractors for display
                let contractors: any[] = [];
                if (schoolId) {
                    const { data } = await supabase
                        .from('contractors')
                        .select('id, company_name')
                        .eq('school_id', schoolId);
                    contractors = data || [];
                }

                // Merge data
                const merged = checks.map(check => {
                    const instance = instances.find(i => i.check_id === check.id);
                    const contractor = instance?.contractor_id
                        ? contractors.find(c => c.id === instance.contractor_id)
                        : null;
                    return {
                        ...check,
                        status: instance?.status || 'NOT_STARTED',
                        last_completed_at: instance?.last_completed_at,
                        next_due: instance?.due_date,
                        assigned_user_id: instance?.assigned_user_id,
                        contractor_id: instance?.contractor_id,
                        contractor_name: contractor?.company_name
                    };
                });

                // Group by category
                const categoryMap = new Map<string, ComplianceCheck[]>();
                merged.forEach(check => {
                    const cat = check.gems_category || 'Uncategorized';
                    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
                    categoryMap.get(cat)!.push(check);
                });

                const groups: CategoryGroup[] = Array.from(categoryMap.entries()).map(([category, checks]) => ({
                    category,
                    checks,
                    compliant: checks.filter(c => ['COMPLETED_EVIDENCE_RECEIVED', 'REVIEWED'].includes(c.status)).length,
                    total: checks.length,
                    overdue: checks.filter(c => c.status === 'OVERDUE').length,
                    expanded: false
                }));

                groups.sort((a, b) => b.total - a.total);
                setCategories(groups);
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const toggleCategory = useCallback((cat: string) => {
        setCategories(prev => prev.map(c =>
            c.category === cat ? { ...c, expanded: !c.expanded } : c
        ));
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'REVIEWED':
            case 'COMPLETED_EVIDENCE_RECEIVED':
                return <Check className="h-4 w-4 text-emerald-500" />;
            case 'OVERDUE':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'DUE':
            case 'IN_PROGRESS':
                return <Clock className="h-4 w-4 text-amber-500" />;
            default:
                return <Clock className="h-4 w-4 text-slate-300" />;
        }
    };

    const formatDate = (date: string | undefined) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: '2-digit'
        });
    };

    const formatFrequency = (days: number) => {
        if (days === 0) return 'As needed';
        if (days === 1) return 'Daily';
        if (days === 7) return 'Weekly';
        if (days === 30) return 'Monthly';
        if (days === 90) return 'Quarterly';
        if (days === 120) return 'Termly';
        if (days === 182) return '6-monthly';
        if (days === 365) return 'Annual';
        if (days === 420) return '14 months';
        if (days === 1095) return '3 years';
        return `${days} days`;
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const filteredCategories = categories.map(cat => ({
        ...cat,
        checks: cat.checks.filter(check => {
            const matchesSearch = searchQuery === '' ||
                check.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                check.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'overdue' && check.status === 'OVERDUE') ||
                (filterStatus === 'complete' && ['COMPLETED_EVIDENCE_RECEIVED', 'REVIEWED'].includes(check.status)) ||
                (filterStatus === 'pending' && !['COMPLETED_EVIDENCE_RECEIVED', 'REVIEWED', 'OVERDUE'].includes(check.status));
            return matchesSearch && matchesStatus;
        })
    })).filter(cat => cat.checks.length > 0);

    const totalChecks = categories.reduce((sum, c) => sum + c.total, 0);
    const totalCompliant = categories.reduce((sum, c) => sum + c.compliant, 0);
    const totalOverdue = categories.reduce((sum, c) => sum + c.overdue, 0);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/estates/compliance">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Compliance Management</h2>
                        <p className="text-muted-foreground">
                            {totalCompliant} of {totalChecks} checks complete • {totalOverdue} overdue
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search checks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border bg-background text-sm w-64"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-xl border px-3 py-2 text-sm bg-background"
                    >
                        <option value="all">All Status</option>
                        <option value="overdue">Overdue</option>
                        <option value="pending">Pending</option>
                        <option value="complete">Complete</option>
                    </select>
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
                {filteredCategories.map((cat) => (
                    <div key={cat.category} className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(cat.category)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <motion.div
                                    animate={{ rotate: cat.expanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </motion.div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-lg">{cat.category}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {cat.checks.length} checks • {cat.compliant} complete
                                        {cat.overdue > 0 && (
                                            <span className="text-red-500 ml-2">• {cat.overdue} overdue</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-32">
                                    <Progress
                                        value={cat.total > 0 ? (cat.compliant / cat.total) * 100 : 0}
                                        className="h-2"
                                    />
                                </div>
                                <span className="text-sm font-semibold w-12 text-right">
                                    {cat.total > 0 ? Math.round((cat.compliant / cat.total) * 100) : 0}%
                                </span>
                            </div>
                        </button>

                        {/* Category Content */}
                        <AnimatePresence>
                            {cat.expanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="border-t">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            <div className="col-span-1"></div>
                                            <div className="col-span-3">Check</div>
                                            <div className="col-span-1">Type</div>
                                            <div className="col-span-1">Frequency</div>
                                            <div className="col-span-1">Last Done</div>
                                            <div className="col-span-1">Next Due</div>
                                            <div className="col-span-2">Assigned</div>
                                            <div className="col-span-1">Legislation</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        {/* Check Rows */}
                                        {cat.checks.map((check, idx) => (
                                            <div
                                                key={check.slug}
                                                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/20 transition-colors ${idx !== cat.checks.length - 1 ? 'border-b border-muted' : ''
                                                    }`}
                                            >
                                                {/* Status */}
                                                <div className="col-span-1 flex justify-center">
                                                    {getStatusIcon(check.status || '')}
                                                </div>

                                                {/* Title */}
                                                <div className="col-span-3">
                                                    <Link href={`/dashboard/estates/compliance/${check.slug}`} className="hover:text-indigo-600">
                                                        <span className="font-medium">{check.title}</span>
                                                    </Link>
                                                    {check.has_steps && (
                                                        <Badge variant="outline" className="ml-2 text-[10px]">Steps</Badge>
                                                    )}
                                                </div>

                                                {/* Type */}
                                                <div className="col-span-1">
                                                    <Badge
                                                        variant="outline"
                                                        className={check.statutory_flag === 'S'
                                                            ? 'border-indigo-300 text-indigo-600 text-[10px]'
                                                            : 'border-teal-300 text-teal-600 text-[10px]'
                                                        }
                                                    >
                                                        {check.statutory_flag === 'S' ? 'Statutory' : 'Best Prac'}
                                                    </Badge>
                                                </div>

                                                {/* Frequency */}
                                                <div className="col-span-1 text-sm text-muted-foreground">
                                                    {formatFrequency(check.frequency_days)}
                                                </div>

                                                {/* Last Done */}
                                                <div className="col-span-1 text-sm">
                                                    {formatDate(check.last_completed_at)}
                                                </div>

                                                {/* Next Due */}
                                                <div className="col-span-1">
                                                    <span className={`text-sm ${check.status === 'OVERDUE' ? 'text-red-600 font-semibold' : ''
                                                        }`}>
                                                        {formatDate(check.next_due)}
                                                    </span>
                                                </div>

                                                {/* Assigned */}
                                                <div className="col-span-2 text-sm">
                                                    {check.contractor_name ? (
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Building2 className="h-3 w-3" />
                                                            {check.contractor_name}
                                                        </span>
                                                    ) : check.assigned_user_id ? (
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <User className="h-3 w-3" />
                                                            Assigned
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/50">Unassigned</span>
                                                    )}
                                                </div>

                                                {/* Legislation */}
                                                <div className="col-span-1">
                                                    {check.legislation_url && (
                                                        <a
                                                            href={check.legislation_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="col-span-1 flex justify-end">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}
