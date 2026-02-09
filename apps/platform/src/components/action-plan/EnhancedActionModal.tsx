"use client";

import { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    User,
    Save,
    Sparkles,
    Hash,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    DollarSign,
    BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type {
    Action,
    UserStatus,
    AIStatus,
    ActionPriority,
    FrameworkType,
} from '@/lib/actions-hub';
import { STATUS_MATRIX, FUNDING_SOURCES, getFinancialYears } from '@/lib/actions-hub';
import { EEF_STRATEGIES } from '@/lib/eef-toolkit';

interface ActionNote {
    id: string;
    author: string;
    timestamp: string;
    content: string;
}

interface EnhancedActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (action: Partial<Action>) => Promise<void>;
    action?: Action;
    mode: 'create' | 'edit';
    organizationId: string;
    allActions?: Action[];
    staffMembers?: Array<{ id: string; display_name: string; job_title: string }>;
}

const USER_STATUSES: { value: UserStatus; label: string; color: string }[] = [
    { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
    { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
    { value: 'pending_review', label: 'Pending Review', color: 'bg-purple-100 text-purple-700' },
    { value: 'complete', label: 'Complete', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-rose-100 text-rose-700' },
];

const AI_STATUSES: { value: AIStatus; label: string; icon: string; color: string }[] = [
    { value: 'not_met', label: 'Not Met', icon: '🔴', color: 'bg-rose-100 text-rose-700' },
    { value: 'partially_met', label: 'Partially Met', icon: '🟡', color: 'bg-amber-100 text-amber-700' },
    { value: 'met', label: 'Met', icon: '🟢', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'not_assessed', label: 'Not Assessed', icon: '⚪', color: 'bg-slate-100 text-slate-700' },
];

export default function EnhancedActionModal({
    isOpen,
    onClose,
    onSave,
    action,
    mode,
    organizationId,
    allActions = [],
    staffMembers = [],
}: EnhancedActionModalProps) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        success_criteria: '',
        framework_type: 'ofsted' as FrameworkType,
        category_id: '',
        subcategory_id: '',

        // Dual Status
        user_status: 'draft' as UserStatus,
        ai_status: 'not_assessed' as AIStatus,
        ai_rationale: '',

        // Assignment
        owner_id: '',
        owner_name: '',
        assigned_date: '',
        due_date: '',
        completed_date: '',
        implementation_date: '',

        // Priority
        priority: 'medium' as ActionPriority,

        // Costs
        estimated_cost: '',
        actual_cost: '',
        funding_source: '',
        financial_year: '',

        // EEF
        eef_strategy: '',
        eef_impact_months: '',

        // Notes
        notes: [] as ActionNote[],
        newNote: '',

        // Dependencies
        dependencies: [] as string[],
    });

    useEffect(() => {
        if (isOpen) {
            if (action && mode === 'edit') {
                setFormData({
                    title: action.title || '',
                    description: action.description || '',
                    success_criteria: action.success_criteria || '',
                    framework_type: action.framework_type || 'ofsted',
                    category_id: action.category_id || '',
                    subcategory_id: action.subcategory_id || '',
                    user_status: action.user_status || 'draft',
                    ai_status: action.ai_status || 'not_assessed',
                    ai_rationale: action.ai_rationale || '',
                    owner_id: action.owner_id || '',
                    owner_name: action.owner_name || '',
                    assigned_date: action.assigned_date
                        ? new Date(action.assigned_date).toISOString().split('T')[0]
                        : '',
                    due_date: action.due_date
                        ? new Date(action.due_date).toISOString().split('T')[0]
                        : '',
                    completed_date: action.completed_date
                        ? new Date(action.completed_date).toISOString().split('T')[0]
                        : '',
                    implementation_date: action.implementation_date
                        ? new Date(action.implementation_date).toISOString().split('T')[0]
                        : '',
                    priority: action.priority || 'medium',
                    estimated_cost: action.estimated_cost?.toString() || '',
                    actual_cost: action.actual_cost?.toString() || '',
                    funding_source: action.funding_source || '',
                    financial_year: action.financial_year || '',
                    eef_strategy: action.eef_strategy || '',
                    eef_impact_months: action.eef_impact_months?.toString() || '',
                    notes: action.notes || [],
                    newNote: '',
                    dependencies: action.dependencies || [],
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    success_criteria: '',
                    framework_type: 'ofsted',
                    category_id: '',
                    subcategory_id: '',
                    user_status: 'draft',
                    ai_status: 'not_met',
                    ai_rationale: '',
                    owner_id: '',
                    owner_name: '',
                    assigned_date: new Date().toISOString().split('T')[0],
                    due_date: '',
                    completed_date: '',
                    implementation_date: '',
                    priority: 'medium',
                    estimated_cost: '',
                    actual_cost: '',
                    funding_source: '',
                    financial_year: '',
                    eef_strategy: '',
                    eef_impact_months: '',
                    notes: [],
                    newNote: '',
                    dependencies: [],
                });
            }
        }
    }, [isOpen, action, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            return;
        }

        setSaving(true);
        try {
            // Add new note if present
            let finalNotes = [...formData.notes];
            if (formData.newNote.trim()) {
                finalNotes.push({
                    id: crypto.randomUUID(),
                    author: 'Staff Member',
                    timestamp: new Date().toISOString(),
                    content: formData.newNote,
                });
            }

            const dataToSave = {
                ...formData,
                organization_id: organizationId,
                notes: finalNotes,
                estimated_cost: formData.estimated_cost
                    ? parseFloat(formData.estimated_cost)
                    : null,
                actual_cost: formData.actual_cost
                    ? parseFloat(formData.actual_cost)
                    : null,
                eef_impact_months: formData.eef_impact_months
                    ? parseInt(formData.eef_impact_months)
                    : null,
            };

            await onSave(dataToSave);
            onClose();
        } catch (error) {
            console.error('Error saving action:', error);
        } finally {
            setSaving(false);
        }
    };

    const getStatusDisplay = () => {
        const matrix = STATUS_MATRIX.find(
            (m) =>
                m.user_status === formData.user_status &&
                m.ai_status === formData.ai_status
        );
        return matrix || { display: 'Custom Status', color: 'bg-slate-100 text-slate-700', icon: '⚪' };
    };

    const selectedEEF = EEF_STRATEGIES.find((s) => s.id === formData.eef_strategy);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Create Action' : 'Edit Action'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? 'Add a new action to your improvement plan.'
                            : 'Update action details and progress.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Title */}
                        <div className="md:col-span-2">
                            <Label htmlFor="title">
                                Action Title <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="Brief description of the action..."
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={3}
                                placeholder="Detailed description of what needs to be done..."
                            />
                        </div>

                        {/* Success Criteria */}
                        <div className="md:col-span-2">
                            <Label htmlFor="success_criteria">Success Criteria</Label>
                            <Textarea
                                id="success_criteria"
                                value={formData.success_criteria}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        success_criteria: e.target.value,
                                    })
                                }
                                rows={2}
                                placeholder="How will we know this action is complete?"
                            />
                        </div>

                        {/* Framework Type */}
                        <div>
                            <Label htmlFor="framework_type">Framework</Label>
                            <Select
                                value={formData.framework_type}
                                onValueChange={(value: FrameworkType) =>
                                    setFormData({ ...formData, framework_type: value })
                                }
                            >
                                <SelectTrigger id="framework_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ofsted">Ofsted</SelectItem>
                                    <SelectItem value="siams">SIAMS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div>
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value: ActionPriority) =>
                                    setFormData({ ...formData, priority: value })
                                }
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* DUAL STATUS SECTION */}
                        <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                Dual Status
                            </h4>

                            {/* Status Display */}
                            <div className="mb-4 p-3 bg-white dark:bg-slate-900 rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Current Status:</span>
                                    <Badge className={getStatusDisplay().color}>
                                        {getStatusDisplay().icon} {getStatusDisplay().display}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* User Status */}
                                <div>
                                    <Label htmlFor="user_status">Your Status</Label>
                                    <Select
                                        value={formData.user_status}
                                        onValueChange={(value: UserStatus) =>
                                            setFormData({ ...formData, user_status: value })
                                        }
                                    >
                                        <SelectTrigger id="user_status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {USER_STATUSES.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* AI Status */}
                                <div>
                                    <Label htmlFor="ai_status">AI Assessment</Label>
                                    <Select
                                        value={formData.ai_status}
                                        onValueChange={(value: AIStatus) =>
                                            setFormData({ ...formData, ai_status: value })
                                        }
                                    >
                                        <SelectTrigger id="ai_status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AI_STATUSES.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.icon} {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* AI Rationale */}
                            <div className="mt-4">
                                <Label htmlFor="ai_rationale">AI Rationale</Label>
                                <Textarea
                                    id="ai_rationale"
                                    value={formData.ai_rationale}
                                    onChange={(e) =>
                                        setFormData({ ...formData, ai_rationale: e.target.value })
                                    }
                                    rows={2}
                                    placeholder="Explanation for AI assessment (auto-filled or manual)..."
                                />
                            </div>
                        </div>

                        {/* ASSIGNMENT & DATES */}
                        <div>
                            <Label htmlFor="owner_id">Assigned To</Label>
                            <Select
                                value={formData.owner_id || 'unassigned'}
                                onValueChange={(value) => {
                                    const member = staffMembers.find((m) => m.id === value);
                                    setFormData({
                                        ...formData,
                                        owner_id: value === 'unassigned' ? '' : value,
                                        owner_name: member?.display_name || '',
                                    });
                                }}
                            >
                                <SelectTrigger id="owner_id">
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {staffMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.display_name} ({member.job_title})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="assigned_date">Assigned Date</Label>
                            <Input
                                id="assigned_date"
                                type="date"
                                value={formData.assigned_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, assigned_date: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={formData.due_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, due_date: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="implementation_date">Implementation Date</Label>
                            <Input
                                id="implementation_date"
                                type="date"
                                value={formData.implementation_date}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        implementation_date: e.target.value,
                                    })
                                }
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                                When the EEF strategy was implemented
                            </p>
                        </div>

                        {/* COSTS SECTION */}
                        <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Cost Tracking
                            </h4>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label htmlFor="estimated_cost">Estimated (£)</Label>
                                    <Input
                                        id="estimated_cost"
                                        type="number"
                                        step="0.01"
                                        value={formData.estimated_cost}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                estimated_cost: e.target.value,
                                            })
                                        }
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="actual_cost">Actual (£)</Label>
                                    <Input
                                        id="actual_cost"
                                        type="number"
                                        step="0.01"
                                        value={formData.actual_cost}
                                        onChange={(e) =>
                                            setFormData({ ...formData, actual_cost: e.target.value })
                                        }
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="funding_source">Funding Source</Label>
                                    <Select
                                        value={formData.funding_source}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, funding_source: value })
                                        }
                                    >
                                        <SelectTrigger id="funding_source">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FUNDING_SOURCES.map((source) => (
                                                <SelectItem key={source.value} value={source.value}>
                                                    {source.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="financial_year">Financial Year</Label>
                                    <Select
                                        value={formData.financial_year}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, financial_year: value })
                                        }
                                    >
                                        <SelectTrigger id="financial_year">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getFinancialYears().map((year) => (
                                                <SelectItem key={year} value={year}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* EEF STRATEGY SECTION */}
                        <div className="md:col-span-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                EEF Research Backing
                            </h4>

                            <div>
                                <Label htmlFor="eef_strategy">Linked Strategy</Label>
                                <Select
                                    value={formData.eef_strategy}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, eef_strategy: value })
                                    }
                                >
                                    <SelectTrigger id="eef_strategy">
                                        <SelectValue placeholder="Select an EEF strategy..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {EEF_STRATEGIES.map((strategy) => (
                                            <SelectItem key={strategy.id} value={strategy.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{strategy.name}</span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] h-4 ml-2"
                                                    >
                                                        {strategy.cost}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedEEF && (
                                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg text-sm">
                                    <p className="font-medium">{selectedEEF.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Strength: {selectedEEF.strength} · Cost: {selectedEEF.cost}
                                    </p>
                                </div>
                            )}

                            <div className="mt-4">
                                <Label htmlFor="eef_impact_months">
                                    Expected Impact Timeline (months)
                                </Label>
                                <Input
                                    id="eef_impact_months"
                                    type="number"
                                    value={formData.eef_impact_months}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            eef_impact_months: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., 12"
                                    min="1"
                                    max="60"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Based on EEF guidance for this strategy
                                </p>
                            </div>
                        </div>

                        {/* NOTES SECTION */}
                        <div className="md:col-span-2 p-4 border rounded-lg">
                            <h4 className="text-sm font-semibold mb-3">Notes & Updates</h4>

                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.newNote}
                                        onChange={(e) =>
                                            setFormData({ ...formData, newNote: e.target.value })
                                        }
                                        placeholder="Add a note..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && formData.newNote.trim()) {
                                                e.preventDefault();
                                                setFormData({
                                                    ...formData,
                                                    notes: [
                                                        ...formData.notes,
                                                        {
                                                            id: crypto.randomUUID(),
                                                            author: 'You',
                                                            timestamp: new Date().toISOString(),
                                                            content: formData.newNote.trim(),
                                                        },
                                                    ],
                                                    newNote: '',
                                                });
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            if (formData.newNote.trim()) {
                                                setFormData({
                                                    ...formData,
                                                    notes: [
                                                        ...formData.notes,
                                                        {
                                                            id: crypto.randomUUID(),
                                                            author: 'You',
                                                            timestamp: new Date().toISOString(),
                                                            content: formData.newNote.trim(),
                                                        },
                                                    ],
                                                    newNote: '',
                                                });
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </div>

                                {formData.notes.length > 0 && (
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {formData.notes.map((note) => (
                                            <div
                                                key={note.id}
                                                className="text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded"
                                            >
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>{note.author}</span>
                                                    <span>
                                                        {new Date(note.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="mt-1">{note.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {mode === 'create' ? 'Create Action' : 'Save Changes'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
