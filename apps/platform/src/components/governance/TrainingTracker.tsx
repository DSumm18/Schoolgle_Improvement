"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    AlertTriangle,
    CheckCircle,
    Plus,
    Filter,
    Search,
    Calendar,
    Clock,
    Award,
    Trash2,
    Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TrainingModal from './TrainingModal';
import {
    GovernorTraining,
    TrainingType,
} from '@/lib/governance';

interface TrainingTrackerProps {
    organizationId: string;
    onRefresh?: () => void;
}

export default function TrainingTracker({
    organizationId,
    onRefresh,
}: TrainingTrackerProps) {
    const [training, setTraining] = useState<GovernorTraining[]>([]);
    const [governors, setGovernors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<TrainingType | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');
    const [selectedTraining, setSelectedTraining] = useState<GovernorTraining | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [organizationId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trainingRes, governorsRes] = await Promise.all([
                fetch(`/api/governance/training?organizationId=${organizationId}`),
                fetch(`/api/governance/governors?organizationId=${organizationId}&status=active`),
            ]);

            if (trainingRes.ok) {
                const data = await trainingRes.json();
                setTraining(data.training || []);
            }

            if (governorsRes.ok) {
                const data = await governorsRes.json();
                setGovernors(data.governors || []);
            }
        } catch (error) {
            console.error('Failed to fetch training data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (trainingId: string) => {
        if (!confirm('Are you sure you want to delete this training record?')) return;

        try {
            const response = await fetch(
                `/api/governance/training?organizationId=${organizationId}&ids=${trainingId}`,
                { method: 'DELETE' }
            );
            if (response.ok) {
                fetchData();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Failed to delete training:', error);
        }
    };

    const getTrainingStatus = (record: GovernorTraining) => {
        if (!record.completed_date) return { status: 'pending', label: 'Not Started', color: 'bg-slate-100 text-slate-600' };

        if (!record.expiry_date) return { status: 'valid', label: 'Complete', color: 'bg-emerald-100 text-emerald-700' };

        const now = new Date();
        const expiry = new Date(record.expiry_date);
        const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
            return { status: 'expired', label: 'Expired', color: 'bg-rose-100 text-rose-700' };
        }
        if (daysUntil < 30) {
            return { status: 'expiring', label: `Expires in ${daysUntil} days`, color: 'bg-amber-100 text-amber-700' };
        }
        return { status: 'valid', label: 'Valid', color: 'bg-emerald-100 text-emerald-700' };
    };

    const getTrainingTypeBadge = (type: TrainingType) => {
        const colors: Record<TrainingType, string> = {
            induction: 'bg-blue-100 text-blue-700',
            safeguarding: 'bg-rose-100 text-rose-700',
            finance: 'bg-emerald-100 text-emerald-700',
            data_protection: 'bg-purple-100 text-purple-700',
            SEND: 'bg-amber-100 text-amber-700',
            health_and_safety: 'bg-orange-100 text-orange-700',
            safer_recruitment: 'bg-red-100 text-red-700',
            complaints: 'bg-indigo-100 text-indigo-700',
            other: 'bg-slate-100 text-slate-700',
        };
        return (
            <Badge className={`text-[10px] font-normal ${colors[type]}`}>
                {type.replace('_', ' ')}
            </Badge>
        );
    };

    const enrichedTraining = useMemo(() => {
        return training.map((record) => {
            const governor = governors.find((g) => g.id === record.governor_id);
            const status = getTrainingStatus(record);
            return {
                ...record,
                governor_name: governor?.full_name || 'Unknown',
                status,
            };
        });
    }, [training, governors]);

    const filteredTraining = useMemo(() => {
        return enrichedTraining.filter((record) => {
            const matchesSearch =
                !searchQuery ||
                record.governor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.title.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = filterType === 'all' || record.training_type === filterType;

            const matchesStatus =
                filterStatus === 'all' || record.status.status === filterStatus;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [enrichedTraining, searchQuery, filterType, filterStatus]);

    // Summary stats
    const stats = useMemo(() => {
        const total = training.length;
        const valid = enrichedTraining.filter((t) => t.status.status === 'valid').length;
        const expiring = enrichedTraining.filter((t) => t.status.status === 'expiring').length;
        const expired = enrichedTraining.filter((t) => t.status.status === 'expired').length;

        return { total, valid, expiring, expired };
    }, [enrichedTraining, training.length]);

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Records"
                    value={stats.total}
                    icon={BookOpen}
                    color="blue"
                />
                <StatCard
                    label="Valid"
                    value={stats.valid}
                    icon={CheckCircle}
                    color="emerald"
                />
                <StatCard
                    label="Expiring Soon"
                    value={stats.expiring}
                    icon={AlertTriangle}
                    color="amber"
                />
                <StatCard
                    label="Expired"
                    value={stats.expired}
                    icon={AlertTriangle}
                    color="rose"
                />
            </div>

            {/* Controls */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search training..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="induction">Induction</SelectItem>
                                    <SelectItem value="safeguarding">Safeguarding</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                    <SelectItem value="data_protection">
                                        Data Protection
                                    </SelectItem>
                                    <SelectItem value="health_and_safety">
                                        Health & Safety
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="valid">Valid</SelectItem>
                                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={() => {
                                setSelectedTraining(null);
                                setModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Training
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Governor</TableHead>
                                <TableHead>Training</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Completed</TableHead>
                                <TableHead>Expiry</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTraining.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-3">
                                            <BookOpen className="w-12 h-12 text-slate-300" />
                                            <p className="text-slate-500 font-semibold">No training records found</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedTraining(null);
                                                    setModalOpen(true);
                                                }}
                                            >
                                                Add your first training record
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTraining.map((record) => (
                                    <motion.tr
                                        key={record.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                    {record.governor_name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .slice(0, 2)}
                                                </div>
                                                <span className="font-medium text-sm">{record.governor_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{record.title}</p>
                                                {record.provider && (
                                                    <p className="text-xs text-slate-500">{record.provider}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getTrainingTypeBadge(record.training_type)}</TableCell>
                                        <TableCell>
                                            {record.completed_date ? (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(record.completed_date).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {record.expiry_date ? (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(record.expiry_date).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">No expiry</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {record.duration_hours ? (
                                                <span className="text-sm">{record.duration_hours}h</span>
                                            ) : (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] font-bold uppercase px-2 py-0.5 ${record.status.color}`}>
                                                {record.status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedTraining(record);
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(record.id)}
                                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal */}
            <TrainingModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={() => {
                    setModalOpen(false);
                    fetchData();
                    onRefresh?.();
                }}
                organizationId={organizationId}
                initialData={selectedTraining}
                governors={governors}
            />
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: any;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
        rose: 'bg-rose-100 text-rose-600',
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
