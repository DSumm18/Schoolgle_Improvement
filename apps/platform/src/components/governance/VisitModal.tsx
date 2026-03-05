"use client";

import { useState, useEffect } from 'react';
import { ClipboardCheck } from 'lucide-react';
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
    GovernorVisitWithGovernor,
    GovernorVisitForm,
    VisitType,
    VisitRating,
} from '@/lib/governance';

interface VisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    organizationId: string;
    initialData?: GovernorVisitWithGovernor | null;
}

const VISIT_TYPES: { value: VisitType; label: string }[] = [
    { value: 'monitoring', label: 'Monitoring Visit' },
    { value: 'subject_link', label: 'Subject Link' },
    { value: 'safeguarding', label: 'Safeguarding' },
    { value: 'SEND', label: 'SEND' },
    { value: 'health_and_safety', label: 'Health & Safety' },
    { value: 'other', label: 'Other' },
];

const YEAR_GROUPS = ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Nursery'];

const COMMON_FOCUS_AREAS = [
    'Teaching & Learning',
    'Behaviour',
    'Safeguarding',
    'Health & Safety',
    'Curriculum',
    'Assessment',
    'Leadership',
    'Attendance',
    'SEND Provision',
    'Early Years',
];

export default function VisitModal({
    isOpen,
    onClose,
    onSave,
    organizationId,
    initialData,
}: VisitModalProps) {
    const [formData, setFormData] = useState<GovernorVisitForm>({
        visit_type: 'monitoring',
        title: '',
        description: '',
        scheduled_date: '',
        start_time: '09:00',
        end_time: '10:30',
        location: '',
        subject: '',
        year_groups: [],
        key_focus: [],
    });

    const [governors, setGovernors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGovernorId, setSelectedGovernorId] = useState<string>('');
    const [visitRating, setVisitRating] = useState<VisitRating | null>(null);
    const [findings, setFindings] = useState('');
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [newRecommendation, setNewRecommendation] = useState('');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditing = !!initialData;

    useEffect(() => {
        if (isOpen) {
            // Fetch governors when modal opens
            fetchGovernors();

            if (initialData) {
                setFormData({
                    visit_type: initialData.visit_type,
                    title: initialData.title,
                    description: initialData.description || '',
                    scheduled_date: initialData.scheduled_date,
                    start_time: initialData.start_time || '09:00',
                    end_time: initialData.end_time || '10:30',
                    location: initialData.location || '',
                    subject: initialData.subject || '',
                    year_groups: initialData.year_groups || [],
                    key_focus: initialData.key_focus || [],
                });
                setSelectedGovernorId(initialData.governor_id);
                setVisitRating(initialData.rating);
                setFindings(initialData.findings || '');
                setRecommendations(initialData.recommendations || []);
            } else {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);

                setFormData({
                    visit_type: 'monitoring',
                    title: '',
                    description: '',
                    scheduled_date: nextWeek.toISOString().split('T')[0],
                    start_time: '09:00',
                    end_time: '10:30',
                    location: '',
                    subject: '',
                    year_groups: [],
                    key_focus: [],
                });
                setSelectedGovernorId('');
                setVisitRating(null);
                setFindings('');
                setRecommendations([]);
            }
            setError(null);
        }
    }, [initialData, isOpen, organizationId]);

    const fetchGovernors = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/governance/governors?organizationId=${organizationId}`);
            if (response.ok) {
                const data = await response.json();
                setGovernors(data.governors || []);
            }
        } catch (err) {
            console.error('Failed to fetch governors:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        if (!selectedGovernorId) {
            setError('Please select a governor');
            setSaving(false);
            return;
        }

        try {
            const url = '/api/governance/visits';

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    governorId: selectedGovernorId,
                    visit: {
                        ...formData,
                        rating: visitRating,
                        findings: findings || null,
                        recommendations: recommendations,
                    },
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save visit');
            }

            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save visit');
        } finally {
            setSaving(false);
        }
    };

    const toggleYearGroup = (year: string) => {
        setFormData((prev) => ({
            ...prev,
            year_groups: prev.year_groups?.includes(year)
                ? prev.year_groups.filter((y) => y !== year)
                : [...(prev.year_groups || []), year],
        }));
    };

    const toggleFocusArea = (area: string) => {
        setFormData((prev) => ({
            ...prev,
            key_focus: prev.key_focus?.includes(area)
                ? prev.key_focus.filter((f) => f !== area)
                : [...(prev.key_focus || []), area],
        }));
    };

    const addRecommendation = () => {
        if (newRecommendation.trim()) {
            setRecommendations([...recommendations, newRecommendation.trim()]);
            setNewRecommendation('');
        }
    };

    const removeRecommendation = (index: number) => {
        setRecommendations(recommendations.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5" />
                        {isEditing ? 'Edit Visit' : 'Schedule Governor Visit'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update visit details and outcomes.'
                            : 'Schedule a monitoring or link visit for a governor.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-lg">
                            <p className="text-sm text-rose-700">{error}</p>
                        </div>
                    )}

                    {/* Governor Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="governor">Governor *</Label>
                        <Select value={selectedGovernorId} onValueChange={setSelectedGovernorId} disabled={isEditing || loading}>
                            <SelectTrigger id="governor">
                                <SelectValue placeholder={loading ? 'Loading governors...' : 'Select a governor'} />
                            </SelectTrigger>
                            <SelectContent>
                                {governors.map((governor) => (
                                    <SelectItem key={governor.id} value={governor.id}>
                                        {governor.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Visit Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="visit_type">Visit Type *</Label>
                            <Select
                                value={formData.visit_type}
                                onValueChange={(value: VisitType) =>
                                    setFormData({ ...formData, visit_type: value })
                                }
                            >
                                <SelectTrigger id="visit_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {VISIT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Visit Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g., Year 6 Maths Monitoring"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the visit purpose..."
                            rows={2}
                        />
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            <Label htmlFor="start_time">Start Time</Label>
                            <Input
                                id="start_time"
                                type="time"
                                value={formData.start_time || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, start_time: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_time">End Time</Label>
                            <Input
                                id="end_time"
                                type="time"
                                value={formData.end_time || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, end_time: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, location: e.target.value })
                                }
                                placeholder="e.g., Classroom 3A"
                            />
                        </div>
                    </div>

                    {/* Focus Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject (if applicable)</Label>
                            <Input
                                id="subject"
                                value={formData.subject || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, subject: e.target.value })
                                }
                                placeholder="e.g., Mathematics"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Year Groups</Label>
                            <div className="flex flex-wrap gap-1 p-2 border rounded-lg max-h-20 overflow-y-auto">
                                {YEAR_GROUPS.map((year) => (
                                    <button
                                        key={year}
                                        type="button"
                                        onClick={() => toggleYearGroup(year)}
                                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                                            formData.year_groups?.includes(year)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Key Focus Areas</Label>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_FOCUS_AREAS.map((area) => (
                                <button
                                    key={area}
                                    type="button"
                                    onClick={() => toggleFocusArea(area)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                        formData.key_focus?.includes(area)
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Outcomes (shown for completed visits) */}
                    {(isEditing || visitRating) && (
                        <>
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-3">Visit Outcomes</h4>

                                <div className="space-y-2">
                                    <Label>Rating</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: 'outstanding', label: 'Outstanding' },
                                            { value: 'good', label: 'Good' },
                                            { value: 'requires_improvement', label: 'Requires Improvement' },
                                            { value: 'inadequate', label: 'Inadequate' },
                                        ].map((rating) => (
                                            <button
                                                key={rating.value}
                                                type="button"
                                                onClick={() => setVisitRating(rating.value as VisitRating)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                                    visitRating === rating.value
                                                        ? 'bg-amber-600 text-white border-amber-600'
                                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {rating.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 mt-3">
                                    <Label htmlFor="findings">Findings</Label>
                                    <Textarea
                                        id="findings"
                                        value={findings}
                                        onChange={(e) => setFindings(e.target.value)}
                                        placeholder="Summary of observations and findings..."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2 mt-3">
                                    <Label>Recommendations</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newRecommendation}
                                            onChange={(e) => setNewRecommendation(e.target.value)}
                                            placeholder="Add a recommendation..."
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addRecommendation();
                                                }
                                            }}
                                        />
                                        <Button type="button" variant="outline" onClick={addRecommendation}>
                                            Add
                                        </Button>
                                    </div>
                                    {recommendations.length > 0 && (
                                        <ul className="space-y-1 mt-2">
                                            {recommendations.map((rec, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded"
                                                >
                                                    <span className="flex-1">{rec}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRecommendation(i)}
                                                        className="text-rose-500 hover:text-rose-700"
                                                    >
                                                        ×
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Schedule Visit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
