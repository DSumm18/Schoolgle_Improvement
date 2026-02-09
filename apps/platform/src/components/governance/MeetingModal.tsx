"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    GovernorMeeting,
    GovernorMeetingForm,
    CommitteeType,
    CommitteeName,
} from '@/lib/governance';

interface MeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    organizationId: string;
    initialData?: GovernorMeeting | null;
}

const COMMITTEE_OPTIONS: CommitteeName[] = [
    'finance',
    'staffing',
    'curriculum',
    'premises',
    'safeguarding',
    'ethics',
    'admissions',
];

export default function MeetingModal({
    isOpen,
    onClose,
    onSave,
    organizationId,
    initialData,
}: MeetingModalProps) {
    const [formData, setFormData] = useState<GovernorMeetingForm>({
        title: '',
        meeting_type: 'full_governing_body',
        committee: undefined,
        scheduled_date: '',
        scheduled_time: '15:30',
        duration_minutes: 90,
        location: '',
        meeting_link: '',
        invited_governors: [],
        agenda_items: [],
    });

    const [availableGovernors, setAvailableGovernors] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditing = !!initialData;

    useEffect(() => {
        if (isOpen) {
            fetchGovernors();
            if (initialData) {
                setFormData({
                    title: initialData.title,
                    meeting_type: initialData.meeting_type,
                    committee: initialData.committee || undefined,
                    scheduled_date: initialData.scheduled_date,
                    scheduled_time: initialData.scheduled_time || '15:30',
                    duration_minutes: initialData.duration_minutes,
                    location: initialData.location || '',
                    meeting_link: initialData.meeting_link || '',
                    invited_governors: initialData.invited_governors || [],
                    agenda_items: initialData.agenda_items || [],
                });
            } else {
                // Set default date to next week
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                setFormData({
                    title: '',
                    meeting_type: 'full_governing_body',
                    committee: undefined,
                    scheduled_date: nextWeek.toISOString().split('T')[0],
                    scheduled_time: '15:30',
                    duration_minutes: 90,
                    location: '',
                    meeting_link: '',
                    invited_governors: [],
                    agenda_items: [],
                });
            }
            setError(null);
        }
    }, [initialData, isOpen]);

    const fetchGovernors = async () => {
        try {
            const response = await fetch(
                `/api/governance/governors?organizationId=${organizationId}&status=active`
            );
            if (response.ok) {
                const data = await response.json();
                setAvailableGovernors(data.governors || []);
            }
        } catch (error) {
            console.error('Failed to fetch governors:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const url = isEditing
                ? `/api/governance/meetings/${initialData!.id}`
                : '/api/governance/meetings';

            const response = await fetch(url, {
                method: isEditing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    meeting: formData,
                    ...(isEditing && { id: initialData!.id }),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save meeting');
            }

            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save meeting');
        } finally {
            setSaving(false);
        }
    };

    const addAgendaItem = () => {
        setFormData((prev) => ({
            ...prev,
            agenda_items: [
                ...(prev.agenda_items || []),
                {
                    id: `new-${Date.now()}`,
                    title: '',
                    description: '',
                    owner: '',
                    duration: 10,
                    attachments: [],
                },
            ],
        }));
    };

    const updateAgendaItem = (index: number, field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            agenda_items: prev.agenda_items?.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    const removeAgendaItem = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            agenda_items: prev.agenda_items?.filter((_, i) => i !== index),
        }));
    };

    const toggleGovernorInvite = (governorId: string) => {
        setFormData((prev) => ({
            ...prev,
            invited_governors: prev.invited_governors?.includes(governorId)
                ? prev.invited_governors.filter((id) => id !== governorId)
                : [...(prev.invited_governors || []), governorId],
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {isEditing ? 'Edit Meeting' : 'Schedule Meeting'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update meeting details and agenda.'
                            : 'Schedule a new governing body meeting.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
                            <p className="text-sm text-rose-700">{error}</p>
                        </div>
                    )}

                    {/* Meeting Details */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Meeting Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g., Full Governing Body Meeting"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="meeting_type">Meeting Type *</Label>
                                <Select
                                    value={formData.meeting_type}
                                    onValueChange={(value: CommitteeType) => {
                                        setFormData({ ...formData, meeting_type: value, committee: undefined });
                                    }}
                                >
                                    <SelectTrigger id="meeting_type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full_governing_body">
                                            Full Governing Body
                                        </SelectItem>
                                        <SelectItem value="committee">Committee</SelectItem>
                                        <SelectItem value="sub_committee">
                                            Sub Committee
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(formData.meeting_type === 'committee' ||
                                formData.meeting_type === 'sub_committee') && (
                                <div className="space-y-2">
                                    <Label htmlFor="committee">Committee</Label>
                                    <Select
                                        value={formData.committee || ''}
                                        onValueChange={(value: CommitteeName) =>
                                            setFormData({ ...formData, committee: value })
                                        }
                                    >
                                        <SelectTrigger id="committee">
                                            <SelectValue placeholder="Select committee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COMMITTEE_OPTIONS.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c.charAt(0).toUpperCase() + c.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scheduled_date">Date *</Label>
                                <Input
                                    id="scheduled_date"
                                    type="date"
                                    value={formData.scheduled_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, scheduled_date: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scheduled_time">Start Time</Label>
                                <Input
                                    id="scheduled_time"
                                    type="time"
                                    value={formData.scheduled_time || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, scheduled_time: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={formData.duration_minutes || 90}
                                    onChange={(e) =>
                                        setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                                    }
                                    min="15"
                                    step="15"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, location: e.target.value })
                                    }
                                    placeholder="e.g., Main Hall"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="meeting_link">Meeting Link</Label>
                                <Input
                                    id="meeting_link"
                                    type="url"
                                    value={formData.meeting_link || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, meeting_link: e.target.value })
                                    }
                                    placeholder="https://zoom.us/j/..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invited Governors */}
                    <div className="space-y-3">
                        <Label>Invited Governors</Label>
                        <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                            {availableGovernors.length === 0 ? (
                                <p className="text-sm text-slate-400">No active governors available</p>
                            ) : (
                                <div className="space-y-2">
                                    {availableGovernors.map((governor) => (
                                        <div key={governor.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`gov-${governor.id}`}
                                                checked={formData.invited_governors?.includes(governor.id)}
                                                onCheckedChange={() => toggleGovernorInvite(governor.id)}
                                            />
                                            <label
                                                htmlFor={`gov-${governor.id}`}
                                                className="text-sm cursor-pointer flex-1"
                                            >
                                                {governor.full_name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Agenda Items */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Agenda Items</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addAgendaItem}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.agenda_items?.map((item, index) => (
                                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500">Item {index + 1}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeAgendaItem(index)}
                                            className="h-6 w-6 p-0 text-rose-600"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <Input
                                            value={item.title}
                                            onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                                            placeholder="Item title"
                                            required
                                        />
                                        <Input
                                            type="number"
                                            value={item.duration}
                                            onChange={(e) =>
                                                updateAgendaItem(index, 'duration', parseInt(e.target.value))
                                            }
                                            placeholder="Duration (min)"
                                            min="1"
                                        />
                                    </div>

                                    <Textarea
                                        value={item.description}
                                        onChange={(e) =>
                                            updateAgendaItem(index, 'description', e.target.value)
                                        }
                                        placeholder="Description (optional)"
                                        rows={1}
                                    />

                                    <Input
                                        value={item.owner}
                                        onChange={(e) => updateAgendaItem(index, 'owner', e.target.value)}
                                        placeholder="Lead person"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Schedule Meeting'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
