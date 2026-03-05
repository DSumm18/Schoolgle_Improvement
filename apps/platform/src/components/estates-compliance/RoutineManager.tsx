'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Clock, Calendar, AlertCircle, GripVertical, Settings2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';
import { type Routine, type DailyCheckItem } from '@/lib/estates-compliance/daily-checks';

export function RoutineManager() {
    const { organizationId, session } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRoutine, setEditingRoutine] = useState<Partial<Routine> | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (organizationId) {
            fetchRoutines();
        }
    }, [organizationId]);

    const fetchRoutines = async () => {
        try {
            const response = await fetch(`/api/estates-compliance/routines?organization_id=${organizationId}`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setRoutines(data.routines || []);
            }
        } catch (error) {
            console.error('Error fetching routines:', error);
            toast.error('Failed to load routines');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRoutine = async () => {
        if (!editingRoutine?.name) {
            toast.error('Routine name is required');
            return;
        }

        setIsSaving(true);
        try {
            const method = editingRoutine.id ? 'PATCH' : 'POST';
            const url = editingRoutine.id
                ? `/api/estates-compliance/routines/${editingRoutine.id}`
                : `/api/estates-compliance/routines`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    ...editingRoutine,
                    organization_id: organizationId,
                }),
            });

            if (response.ok) {
                toast.success(editingRoutine.id ? 'Routine updated' : 'Routine created');
                setDialogOpen(false);
                fetchRoutines();
            } else {
                toast.error('Failed to save routine');
            }
        } catch (error) {
            console.error('Error saving routine:', error);
            toast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRoutine = async (id: string) => {
        if (!confirm('Are you sure you want to delete this routine?')) return;

        try {
            const response = await fetch(`/api/estates-compliance/routines/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });

            if (response.ok) {
                toast.success('Routine deleted');
                fetchRoutines();
            } else {
                toast.error('Failed to delete routine');
            }
        } catch (error) {
            console.error('Error deleting routine:', error);
            toast.error('An error occurred');
        }
    };

    const addEmptyItem = () => {
        const newItem: Partial<DailyCheckItem> = {
            name: '',
            description: '',
            category: 'facilities',
            icon: '📋',
        };
        setEditingRoutine({
            ...editingRoutine,
            items: [...(editingRoutine?.items || []), newItem as DailyCheckItem],
        });
    };

    const updateItem = (index: number, field: keyof DailyCheckItem, value: any) => {
        const newItems = [...(editingRoutine?.items || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditingRoutine({ ...editingRoutine, items: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = [...(editingRoutine?.items || [])];
        newItems.splice(index, 1);
        setEditingRoutine({ ...editingRoutine, items: newItems });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="p-1.5 bg-primary/10 rounded-lg text-primary">✨</span>
                        Bespoke Routines
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Configure custom daily or weekly routines for your site staff</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingRoutine({
                            name: '',
                            description: '',
                            type: 'custom',
                            recurrence: 'daily',
                            is_active: true,
                            items: [],
                        });
                        setDialogOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/90 shadow-sm font-semibold"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Routine
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {routines.map((routine) => (
                    <Card key={routine.id} className="relative transition-all hover:shadow-lg border-2 border-primary/5 hover:border-primary/20 overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-[10px] uppercase tracking-wider font-bold">
                                {routine.type}
                            </Badge>
                        </div>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-gray-800">{routine.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-xs font-medium">{routine.description || 'No description provided'}</CardDescription>
                                </div>
                                {!routine.is_active && (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-400 text-[10px] py-0 px-1.5 h-5">Inactive</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 text-xs font-bold">
                                <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2 py-1 rounded-md">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span className="capitalize">{routine.recurrence}</span>
                                </div>
                                {routine.deadline_time && (
                                    <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>By {routine.deadline_time.slice(0, 5)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex -space-x-1.5">
                                    {routine.items?.slice(0, 4).map((item, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[10px] shadow-sm">
                                            {item.icon || '📋'}
                                        </div>
                                    ))}
                                    {(routine.items?.length || 0) > 4 && (
                                        <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400 shadow-sm">
                                            +{(routine.items?.length || 0) - 4}
                                        </div>
                                    )}
                                    {(routine.items?.length || 0) === 0 && (
                                        <span className="text-[10px] text-muted-foreground italic">No checks</span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingRoutine(routine);
                                        setDialogOpen(true);
                                    }} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5">
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteRoutine(routine.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {routines.length === 0 && (
                <div className="text-center py-20 bg-gradient-to-br from-gray-50/50 to-white rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-primary/30" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No custom routines found</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Create bespoke daily or weekly checklists tailored to your school's specific requirements.</p>
                    <Button onClick={() => setDialogOpen(true)} className="px-6 rounded-full font-bold shadow-md shadow-primary/20">
                        Get Started
                    </Button>
                </div>
            )}

            {/* Routine Editor Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-4 border-b">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <span className="p-1 bg-primary/10 rounded text-primary">
                                {editingRoutine?.id ? <Settings2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </span>
                            {editingRoutine?.id ? 'Edit Routine' : 'Create Routine'}
                        </DialogTitle>
                        <DialogDescription className="font-medium text-xs">
                            Configure the items, frequency and deadline for this routine.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Routine Name</label>
                                <Input
                                    placeholder="e.g., Morning Gate Protocol"
                                    value={editingRoutine?.name}
                                    onChange={(e) => setEditingRoutine({ ...editingRoutine, name: e.target.value })}
                                    className="bg-gray-50/50 border-gray-200 focus-visible:ring-primary/20 focus-visible:border-primary h-11 transition-all rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                                <Select
                                    value={editingRoutine?.type}
                                    onValueChange={(v) => setEditingRoutine({ ...editingRoutine, type: v as any })}
                                >
                                    <SelectTrigger className="bg-gray-50/50 border-gray-200 h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="opening">Opening Routine</SelectItem>
                                        <SelectItem value="closing">Closing Routine</SelectItem>
                                        <SelectItem value="custom">General / Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                            <Textarea
                                placeholder="Brief summary of what this routine involves..."
                                value={editingRoutine?.description || ''}
                                onChange={(e) => setEditingRoutine({ ...editingRoutine, description: e.target.value })}
                                className="bg-gray-50/50 border-gray-200 focus-visible:ring-primary/20 focus-visible:border-primary min-h-[80px] rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Frequency
                                </label>
                                <Select
                                    value={editingRoutine?.recurrence}
                                    onValueChange={(v) => setEditingRoutine({ ...editingRoutine, recurrence: v as any })}
                                >
                                    <SelectTrigger className="bg-white border-white shadow-sm h-10 rounded-lg font-bold text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Every Day</SelectItem>
                                        <SelectItem value="weekly">Every Week</SelectItem>
                                        <SelectItem value="monthly">Every Month</SelectItem>
                                        <SelectItem value="once">Once Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-orange-600/70 flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5" />
                                    Target Deadline
                                </label>
                                <Input
                                    type="time"
                                    value={editingRoutine?.deadline_time || ''}
                                    onChange={(e) => setEditingRoutine({ ...editingRoutine, deadline_time: e.target.value })}
                                    className="bg-white border-white shadow-sm h-10 rounded-lg font-bold text-xs"
                                />
                            </div>
                        </div>

                        {/* Items Editor */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    Checklist Items
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-gray-100 text-gray-500 border-none">{editingRoutine?.items?.length || 0}</Badge>
                                </h3>
                                <Button variant="outline" size="sm" onClick={addEmptyItem} className="h-8 rounded-full border-primary/30 text-primary hover:bg-primary/5 px-4 font-bold text-xs">
                                    <Plus className="h-3 w-3 mr-1.5" />
                                    Add Check
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {editingRoutine?.items?.map((item, idx) => (
                                    <div key={idx} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm relative group hover:border-primary/20 transition-colors">
                                        <div className="flex items-start gap-4 mb-4">
                                            <Input
                                                value={item.icon || '📋'}
                                                onChange={(e) => updateItem(idx, 'icon', e.target.value)}
                                                className="w-11 h-11 text-center p-0 text-xl border-none bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl"
                                                placeholder="📋"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <Input
                                                    placeholder="What needs to be checked?"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                                    className="font-bold h-7 border-none p-0 shadow-none focus-visible:ring-0 text-gray-800 placeholder:text-gray-300"
                                                />
                                                <Input
                                                    placeholder="Instructions or detail..."
                                                    value={item.description || ''}
                                                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                    className="text-xs text-muted-foreground h-5 border-none p-0 shadow-none focus-visible:ring-0 placeholder:text-gray-300"
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(idx)}
                                                className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-red-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                            <div className="flex items-center gap-4">
                                                <Select
                                                    value={item.category}
                                                    onValueChange={(v) => updateItem(idx, 'category', v)}
                                                >
                                                    <SelectTrigger className="h-7 w-28 text-[10px] font-bold bg-gray-50 border-none shadow-none rounded-lg px-2">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="security">Security</SelectItem>
                                                        <SelectItem value="safety">Safety</SelectItem>
                                                        <SelectItem value="facilities">Facilities</SelectItem>
                                                        <SelectItem value="environmental">Environment</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.requiresPhoto}
                                                        onChange={(e) => updateItem(idx, 'requiresPhoto', e.target.checked)}
                                                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all"
                                                    />
                                                    Requires Photo
                                                </label>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tight py-0 px-1 border-gray-200 text-gray-400">Step {idx + 1}</Badge>
                                                <div className="flex flex-col gap-0.5 ml-1">
                                                    <GripVertical className="h-3 w-3 text-gray-300 cursor-grab active:cursor-grabbing" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!editingRoutine?.items || editingRoutine.items.length === 0) && (
                                    <div className="py-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center px-4">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-50">
                                            <AlertCircle className="h-6 w-6 text-primary/20" />
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-800">No checks added</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Add items to this routine to create a completion checklist.</p>
                                        <Button variant="ghost" size="sm" onClick={addEmptyItem} className="mt-4 text-xs font-bold text-primary hover:bg-primary/5">
                                            Add first item
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t bg-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={editingRoutine?.is_active}
                                    onChange={(e) => setEditingRoutine({ ...editingRoutine, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded-full border-gray-300 text-green-500 focus:ring-green-500/20 transition-all"
                                />
                                Active Routine
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="font-bold text-xs h-10 px-6 rounded-xl hover:bg-gray-50">Cancel</Button>
                            <Button
                                onClick={handleSaveRoutine}
                                disabled={isSaving}
                                className="font-bold text-xs h-10 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 min-w-[140px]"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    editingRoutine?.id ? 'Udpate Routine' : 'Create Routine'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
