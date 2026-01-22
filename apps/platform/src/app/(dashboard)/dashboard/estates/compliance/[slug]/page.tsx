'use client';

import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowLeft, Calendar, Clock, User, Building2, ExternalLink,
    Check, AlertCircle, Plus, MessageSquare, FileText, History,
    Loader2, ChevronRight, Upload, LinkIcon, Settings2,
    CheckCircle2, XCircle, Pencil, Save, X
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ComplianceCheck {
    id: string;
    slug: string;
    title: string;
    description: string;
    gems_category: string;
    statutory_flag: string;
    priority: string;
    frequency_days: number;
    legislation_name: string;
    legislation_url: string;
    training_url: string;
}

interface ComplianceInstance {
    id: string;
    status: string;
    due_date: string;
    last_completed_at: string;
    assigned_user_id: string;
    contractor_id: string;
    notes: string;
}

interface ComplianceNote {
    id: string;
    note_type: string;
    content: string;
    created_at: string;
    created_by: string;
}

interface CheckStep {
    id: string;
    step_order: number;
    description: string;
    location: string;
    completed: boolean;
}

interface Contractor {
    id: string;
    company_name: string;
}

export default function ComplianceItemPage({ params }: { params: { slug: string } }) {
    const slug = params.slug;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [check, setCheck] = useState<ComplianceCheck | null>(null);
    const [instance, setInstance] = useState<ComplianceInstance | null>(null);
    const [notes, setNotes] = useState<ComplianceNote[]>([]);
    const [steps, setSteps] = useState<CheckStep[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [history, setHistory] = useState<any[]>([]);

    const [newNote, setNewNote] = useState('');
    const [noteType, setNoteType] = useState('GENERAL');
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [editingDueDate, setEditingDueDate] = useState(false);
    const [newDueDate, setNewDueDate] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Fetch check definition
                const { data: checkData, error: checkError } = await supabase
                    .from('compliance_checks')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (checkError) {
                    if (checkError.code === 'PGRST116') return setCheck(null);
                    throw checkError;
                }
                setCheck(checkData);

                // 2. Get user's school_id
                const { data: { user } } = await supabase.auth.getUser();
                const schoolId = user?.user_metadata?.school_id;

                if (schoolId) {
                    // 3. Fetch or create instance
                    let { data: instanceData } = await supabase
                        .from('compliance_instances')
                        .select('*')
                        .eq('check_id', checkData.id)
                        .eq('school_id', schoolId)
                        .single();

                    if (!instanceData) {
                        // Create new instance
                        const { data: newInstance } = await supabase
                            .from('compliance_instances')
                            .insert({
                                check_id: checkData.id,
                                school_id: schoolId,
                                period_label: new Date().getFullYear().toString(),
                                due_date: new Date(Date.now() + checkData.frequency_days * 86400000).toISOString().split('T')[0],
                                status: 'DUE'
                            })
                            .select()
                            .single();
                        instanceData = newInstance;
                    }
                    setInstance(instanceData);

                    // 4. Fetch notes
                    if (instanceData) {
                        const { data: notesData } = await supabase
                            .from('compliance_notes')
                            .select('*')
                            .eq('instance_id', instanceData.id)
                            .order('created_at', { ascending: false });
                        setNotes(notesData || []);
                    }

                    // 5. Fetch contractors
                    const { data: contractorsData } = await supabase
                        .from('contractors')
                        .select('id, company_name')
                        .eq('school_id', schoolId)
                        .eq('active', true);
                    setContractors(contractorsData || []);

                    // 6. Fetch check steps
                    const { data: stepsData } = await supabase
                        .from('compliance_check_steps')
                        .select('*')
                        .eq('check_id', checkData.id)
                        .order('step_order', { ascending: true });

                    if (stepsData && stepsData.length > 0 && instanceData) {
                        // Fetch step completions
                        const { data: completions } = await supabase
                            .from('compliance_step_completions')
                            .select('step_id, completed')
                            .eq('instance_id', instanceData.id);

                        const completionMap = new Map(completions?.map(c => [c.step_id, c.completed]) || []);
                        setSteps(stepsData.map(s => ({
                            ...s,
                            completed: completionMap.get(s.id) || false
                        })));
                    }

                    // 7. Fetch history (compliance_logs)
                    const { data: logsData } = await supabase
                        .from('compliance_logs')
                        .select('*')
                        .eq('check_id', checkData.id)
                        .order('created_at', { ascending: false })
                        .limit(10);
                    setHistory(logsData || []);
                }

            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [slug]);

    const handleAddNote = async () => {
        if (!newNote.trim() || !instance) return;

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const schoolId = user?.user_metadata?.school_id;

            const { data, error } = await supabase
                .from('compliance_notes')
                .insert({
                    instance_id: instance.id,
                    school_id: schoolId,
                    note_type: noteType,
                    content: newNote.trim(),
                    created_by: user?.id
                })
                .select()
                .single();

            if (error) throw error;

            setNotes([data, ...notes]);
            setNewNote('');
            setShowNoteForm(false);
        } catch (err) {
            console.error('Add note error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateDueDate = async () => {
        if (!newDueDate || !instance) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('compliance_instances')
                .update({ due_date: newDueDate })
                .eq('id', instance.id);

            if (error) throw error;

            setInstance({ ...instance, due_date: newDueDate });
            setEditingDueDate(false);
        } catch (err) {
            console.error('Update due date error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleAssignContractor = async (contractorId: string) => {
        if (!instance) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('compliance_instances')
                .update({ contractor_id: contractorId || null })
                .eq('id', instance.id);

            if (error) throw error;

            setInstance({ ...instance, contractor_id: contractorId });
        } catch (err) {
            console.error('Assign contractor error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleMarkComplete = async () => {
        if (!instance) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('compliance_instances')
                .update({
                    status: 'COMPLETED_AWAITING_EVIDENCE',
                    last_completed_at: new Date().toISOString()
                })
                .eq('id', instance.id);

            if (error) throw error;

            setInstance({
                ...instance,
                status: 'COMPLETED_AWAITING_EVIDENCE',
                last_completed_at: new Date().toISOString()
            });
        } catch (err) {
            console.error('Mark complete error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStep = async (stepId: string, completed: boolean) => {
        if (!instance) return;

        try {
            // Upsert step completion
            const { error } = await supabase
                .from('compliance_step_completions')
                .upsert({
                    instance_id: instance.id,
                    step_id: stepId,
                    completed,
                    completed_at: completed ? new Date().toISOString() : null
                }, { onConflict: 'instance_id,step_id' });

            if (error) throw error;

            setSteps(steps.map(s => s.id === stepId ? { ...s, completed } : s));
        } catch (err) {
            console.error('Toggle step error:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!check) {
        notFound();
    }

    const formatDate = (date: string | undefined) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatFrequency = (days: number) => {
        if (days === 0) return 'As needed';
        if (days === 1) return 'Daily';
        if (days === 7) return 'Weekly';
        if (days === 30) return 'Monthly';
        if (days === 90) return 'Quarterly';
        if (days === 182) return '6-monthly';
        if (days === 365) return 'Annual';
        return `Every ${days} days`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REVIEWED':
            case 'COMPLETED_EVIDENCE_RECEIVED':
                return 'bg-emerald-500';
            case 'OVERDUE':
                return 'bg-red-500';
            case 'COMPLETED_AWAITING_EVIDENCE':
            case 'IN_PROGRESS':
                return 'bg-amber-500';
            default:
                return 'bg-slate-400';
        }
    };

    const stepsComplete = steps.filter(s => s.completed).length;

    return (
        <div className="flex-1 p-8 pt-6 max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/dashboard/estates/compliance" className="hover:text-indigo-600">Compliance</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/dashboard/estates/compliance/manage" className="hover:text-indigo-600">Manage</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">{check.title}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{check.title}</h1>
                        <Badge variant="outline" className={check.statutory_flag === 'S' ? 'border-indigo-300 text-indigo-600' : 'border-teal-300 text-teal-600'}>
                            {check.statutory_flag === 'S' ? 'Statutory' : 'Best Practice'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">{check.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{check.gems_category}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{formatFrequency(check.frequency_days)}</span>
                        {check.legislation_url && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <a href={check.legislation_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    {check.legislation_name || 'Legislation'}
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* Status Card */}
                <Card className={cn(
                    "min-w-[240px] text-white border-0 shadow-lg",
                    getStatusColor(instance?.status || '')
                )}>
                    <CardContent className="p-6">
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Current Compliance Status</p>
                        <p className="text-2xl font-black mt-1 leading-none">
                            {instance?.status?.replace(/_/g, ' ') || 'NOT STARTED'}
                        </p>
                        {instance?.due_date && (
                            <p className="text-[10px] mt-2 opacity-80 font-medium">
                                {instance.status === 'OVERDUE' ? 'Was due ' : 'Due by '}
                                {new Date(instance.due_date).toLocaleDateString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            <Button
                                onClick={handleMarkComplete}
                                disabled={saving || instance?.status === 'REVIEWED'}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Mark Complete
                            </Button>
                            <Button variant="outline" onClick={() => setShowNoteForm(!showNoteForm)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Add Note
                            </Button>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Evidence
                            </Button>
                            <Button variant="outline">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Create Ticket
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Check Steps / Checklist */}
                    {steps.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Checklist ({stepsComplete}/{steps.length})</CardTitle>
                                    <Progress value={(stepsComplete / steps.length) * 100} className="w-32 h-2" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {steps.map((step) => (
                                        <div
                                            key={step.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${step.completed ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => handleToggleStep(step.id, !step.completed)}
                                        >
                                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${step.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                                                }`}>
                                                {step.completed && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                    {step.description}
                                                </p>
                                                {step.location && (
                                                    <p className="text-xs text-muted-foreground">{step.location}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes Section */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-indigo-500" />
                                Notes & Actions ({notes.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Add Note Form */}
                            <AnimatePresence>
                                {showNoteForm && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mb-4 overflow-hidden"
                                    >
                                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                            <div className="flex gap-2">
                                                <select
                                                    value={noteType}
                                                    onChange={(e) => setNoteType(e.target.value)}
                                                    className="rounded-lg border px-3 py-2 text-sm bg-background"
                                                >
                                                    <option value="GENERAL">General Note</option>
                                                    <option value="REASON_NOT_DONE">Reason Not Done</option>
                                                    <option value="ACTION_REQUIRED">Action Required</option>
                                                    <option value="EVIDENCE_ISSUE">Evidence Issue</option>
                                                </select>
                                            </div>
                                            <Textarea
                                                placeholder="Add a note..."
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                rows={3}
                                            />
                                            <div className="flex gap-2">
                                                <Button onClick={handleAddNote} disabled={saving || !newNote.trim()}>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Note
                                                </Button>
                                                <Button variant="ghost" onClick={() => setShowNoteForm(false)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Notes List */}
                            <div className="space-y-3">
                                {notes.length > 0 ? notes.map((note) => (
                                    <div key={note.id} className="p-3 border rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs">
                                                {note.note_type.replace(/_/g, ' ')}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(note.created_at).toLocaleString('en-GB')}
                                            </span>
                                        </div>
                                        <p className="text-sm">{note.content}</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground italic py-4 text-center">
                                        No notes yet. Add one to document actions or issues.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* History */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5 text-indigo-500" />
                                Compliance History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {history.length > 0 ? (
                                <div className="space-y-2">
                                    {history.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {log.status === 'PASS' ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                ) : log.status === 'FAIL' ? (
                                                    <XCircle className="h-5 w-5 text-red-500" />
                                                ) : (
                                                    <Clock className="h-5 w-5 text-amber-500" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{log.status}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(log.extracted_date)} • Next due: {formatDate(log.next_due_date)}
                                                    </p>
                                                </div>
                                            </div>
                                            {log.evidence_url && (
                                                <a href={log.evidence_url} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="icon">
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic py-4 text-center">
                                    No compliance history yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Due Date */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                                Due Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {editingDueDate ? (
                                <div className="space-y-2">
                                    <input
                                        type="date"
                                        value={newDueDate}
                                        onChange={(e) => setNewDueDate(e.target.value)}
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleUpdateDueDate} disabled={saving}>
                                            <Save className="mr-1 h-3 w-3" />
                                            Save
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingDueDate(false)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className={`text-lg font-semibold ${instance?.status === 'OVERDUE' ? 'text-red-600' : ''
                                        }`}>
                                        {formatDate(instance?.due_date)}
                                    </span>
                                    <Button size="icon" variant="ghost" onClick={() => {
                                        setNewDueDate(instance?.due_date || '');
                                        setEditingDueDate(true);
                                    }}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Last Completed */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-500" />
                                Last Completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-lg font-semibold">
                                {formatDate(instance?.last_completed_at)}
                            </span>
                        </CardContent>
                    </Card>

                    {/* Assigned Contractor */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-indigo-500" />
                                Assigned Contractor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <select
                                value={instance?.contractor_id || ''}
                                onChange={(e) => handleAssignContractor(e.target.value)}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                                disabled={saving}
                            >
                                <option value="">Unassigned</option>
                                {contractors.map((c) => (
                                    <option key={c.id} value={c.id}>{c.company_name}</option>
                                ))}
                            </select>
                            {contractors.length === 0 && (
                                <Link href="/dashboard/estates/contractors" className="text-xs text-indigo-600 hover:underline mt-2 block">
                                    + Add contractors
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-indigo-500" />
                                Check Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Priority</span>
                                <Badge variant="outline">{check.priority || 'Medium'}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Category</span>
                                <span>{check.gems_category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Frequency</span>
                                <span>{formatFrequency(check.frequency_days)}</span>
                            </div>
                            {check.training_url && (
                                <a href={check.training_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline">
                                    <ExternalLink className="h-3 w-3" />
                                    Training Video
                                </a>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
