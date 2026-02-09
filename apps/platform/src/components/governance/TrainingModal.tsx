"use client";

import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
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
import {
    GovernorTraining,
    GovernorTrainingForm,
    TrainingType,
} from '@/lib/governance';

interface TrainingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    organizationId: string;
    initialData?: GovernorTraining | null;
}

const TRAINING_OPTIONS: { value: TrainingType; label: string }[] = [
    { value: 'induction', label: 'Induction' },
    { value: 'safeguarding', label: 'Safeguarding' },
    { value: 'finance', label: 'Finance' },
    { value: 'data_protection', label: 'Data Protection' },
    { value: 'SEND', label: 'SEND' },
    { value: 'health_and_safety', label: 'Health & Safety' },
    { value: 'safer_recruitment', label: 'Safer Recruitment' },
    { value: 'complaints', label: 'Complaints Handling' },
    { value: 'other', label: 'Other' },
];

export default function TrainingModal({
    isOpen,
    onClose,
    onSave,
    organizationId,
    initialData,
}: TrainingModalProps) {
    const [formData, setFormData] = useState<GovernorTrainingForm>({
        title: '',
        provider: '',
        training_type: 'induction',
        completed_date: '',
        expiry_date: '',
        duration_hours: null,
        certificate_url: '',
        notes: '',
    });

    const [governors, setGovernors] = useState<any[]>([]);
    const [selectedGovernorId, setSelectedGovernorId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditing = !!initialData;

    useEffect(() => {
        if (isOpen) {
            // Fetch governors when modal opens
            fetchGovernors();

            if (initialData) {
                setFormData({
                    title: initialData.title,
                    provider: initialData.provider || '',
                    training_type: initialData.training_type,
                    completed_date: initialData.completed_date || '',
                    expiry_date: initialData.expiry_date || '',
                    duration_hours: initialData.duration_hours,
                    certificate_url: initialData.certificate_url || '',
                    notes: initialData.notes || '',
                });
                setSelectedGovernorId(initialData.governor_id);
            } else {
                setFormData({
                    title: '',
                    provider: '',
                    training_type: 'induction',
                    completed_date: '',
                    expiry_date: '',
                    duration_hours: null,
                    certificate_url: '',
                    notes: '',
                });
                setSelectedGovernorId('');
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
            const url = '/api/governance/training';

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    governorId: selectedGovernorId,
                    training: formData,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save training record');
            }

            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save training record');
        } finally {
            setSaving(false);
        }
    };

    // Auto-calculate expiry date for common training types
    const calculateExpiryDate = (trainingType: TrainingType, completedDate: string) => {
        if (!completedDate) return;

        const expiryMonths: Record<TrainingType, number> = {
            induction: 48, // 4 years
            safeguarding: 36, // 3 years
            finance: 36,
            data_protection: 24,
            SEND: 24,
            health_and_safety: 36,
            safer_recruitment: 60, // 5 years
            complaints: 24,
            other: 24,
        };

        const completed = new Date(completedDate);
        completed.setMonth(completed.getMonth() + expiryMonths[trainingType]);

        setFormData({
            ...formData,
            training_type: trainingType,
            expiry_date: completed.toISOString().split('T')[0],
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        {isEditing ? 'Edit Training' : 'Record Training'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update training record details.'
                            : 'Record a new training completion for a governor.'}
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
                        <Select
                            value={selectedGovernorId}
                            onValueChange={setSelectedGovernorId}
                            disabled={isEditing || loading}
                        >
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

                    {/* Training Details */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Training Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="e.g., Safeguarding Level 1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="training_type">Type *</Label>
                            <Select
                                value={formData.training_type}
                                onValueChange={(value: TrainingType) => {
                                    calculateExpiryDate(value, formData.completed_date);
                                }}
                            >
                                <SelectTrigger id="training_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TRAINING_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration_hours">Duration (hours)</Label>
                            <Input
                                id="duration_hours"
                                type="number"
                                value={formData.duration_hours || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        duration_hours: e.target.value ? parseFloat(e.target.value) : null,
                                    })
                                }
                                min="0"
                                step="0.5"
                                placeholder="e.g., 2"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="provider">Provider</Label>
                        <Input
                            id="provider"
                            value={formData.provider || ''}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                            placeholder="e.g., Local Authority"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="completed_date">Completion Date</Label>
                            <Input
                                id="completed_date"
                                type="date"
                                value={formData.completed_date || ''}
                                onChange={(e) => {
                                    setFormData({ ...formData, completed_date: e.target.value });
                                    calculateExpiryDate(formData.training_type, e.target.value);
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiry_date">Expiry Date</Label>
                            <Input
                                id="expiry_date"
                                type="date"
                                value={formData.expiry_date || ''}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="certificate_url">Certificate URL</Label>
                        <Input
                            id="certificate_url"
                            type="url"
                            value={formData.certificate_url || ''}
                            onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any additional notes..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? 'Saving...' : 'Save Record'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
