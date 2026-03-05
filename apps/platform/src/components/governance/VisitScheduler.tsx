"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardCheck,
    Calendar,
    Clock,
    MapPin,
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Star,
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
import VisitModal from './VisitModal';
import {
    GovernorVisitWithGovernor,
    VisitType,
    VisitStatus,
    VisitRating,
} from '@/lib/governance';

interface VisitSchedulerProps {
    organizationId: string;
    onRefresh?: () => void;
}

export default function VisitScheduler({
    organizationId,
    onRefresh,
}: VisitSchedulerProps) {
    const [visits, setVisits] = useState<GovernorVisitWithGovernor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<VisitType | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<VisitStatus | 'all'>('all');
    const [selectedVisit, setSelectedVisit] = useState<GovernorVisitWithGovernor | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchVisits();
    }, [organizationId, filterType, filterStatus]);

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ organizationId });
            if (filterType !== 'all') params.append('visit_type', filterType);
            if (filterStatus !== 'all') params.append('status', filterStatus);

            const response = await fetch(`/api/governance/visits?${params}`);
            if (response.ok) {
                const data = await response.json();
                setVisits(data.visits || []);
            }
        } catch (error) {
            console.error('Failed to fetch visits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (visitId: string) => {
        if (!confirm('Are you sure you want to delete this visit?')) return;

        try {
            const response = await fetch(
                `/api/governance/visits?organizationId=${organizationId}&ids=${visitId}`,
                { method: 'DELETE' }
            );
            if (response.ok) {
                fetchVisits();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Failed to delete visit:', error);
        }
    };

    const getStatusBadge = (status: VisitStatus) => {
        const styles: Record<VisitStatus, string> = {
            scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
            completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
            postponed: 'bg-amber-100 text-amber-700 border-amber-200',
        };
        return (
            <Badge className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles[status]}`}>
                {status}
            </Badge>
        );
    };

    const getRatingStars = (rating: VisitRating | null) => {
        if (!rating) return null;

        const colors: Record<VisitRating, string> = {
            outstanding: 'text-amber-500',
            good: 'text-emerald-500',
            requires_improvement: 'text-amber-600',
            inadequate: 'text-rose-600',
        };

        return (
            <div className={`flex items-center gap-0.5 ${colors[rating]}`}>
                {[1, 2, 3, 4].map((i) => (
                    <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-current"
                    />
                ))}
                <span className="text-[10px] font-bold uppercase ml-1">{rating.replace('_', ' ')}</span>
            </div>
        );
    };

    const getTypeBadge = (type: VisitType) => {
        const colors: Record<VisitType, string> = {
            monitoring: 'bg-blue-100 text-blue-700',
            subject_link: 'bg-violet-100 text-violet-700',
            safeguarding: 'bg-rose-100 text-rose-700',
            SEND: 'bg-amber-100 text-amber-700',
            health_and_safety: 'bg-emerald-100 text-emerald-700',
            other: 'bg-slate-100 text-slate-700',
        };
        return (
            <Badge className={`text-[10px] font-normal ${colors[type]}`}>
                {type.replace('_', ' ')}
            </Badge>
        );
    };

    const filteredVisits = useMemo(() => {
        return visits.filter((visit) => {
            const matchesSearch =
                !searchQuery ||
                visit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                visit.governor_name.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesSearch;
        });
    }, [visits, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: visits.length,
            scheduled: visits.filter((v) => v.status === 'scheduled').length,
            completed: visits.filter((v) => v.status === 'completed').length,
            thisTerm: visits.filter((v) => {
                const date = new Date(v.scheduled_date);
                const now = new Date();
                const termStart = new Date(now.getFullYear(), 8, 1); // September
                return date >= termStart && date <= now;
            }).length,
        };
    }, [visits]);

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Visits" value={stats.total} icon={ClipboardCheck} color="blue" />
                <StatCard label="Scheduled" value={stats.scheduled} icon={Calendar} color="blue" />
                <StatCard label="Completed" value={stats.completed} icon={ClipboardCheck} color="emerald" />
                <StatCard label="This Term" value={stats.thisTerm} icon={Star} color="amber" />
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
                                    placeholder="Search visits..."
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
                                    <SelectItem value="monitoring">Monitoring</SelectItem>
                                    <SelectItem value="subject_link">Subject Link</SelectItem>
                                    <SelectItem value="safeguarding">Safeguarding</SelectItem>
                                    <SelectItem value="SEND">SEND</SelectItem>
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
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={() => {
                                setSelectedVisit(null);
                                setModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Schedule Visit
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
                                <TableHead>Visit</TableHead>
                                <TableHead>Governor</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Focus</TableHead>
                                <TableHead>Rating</TableHead>
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
                            ) : filteredVisits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-3">
                                            <ClipboardCheck className="w-12 h-12 text-slate-300" />
                                            <p className="text-slate-500 font-semibold">No visits found</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedVisit(null);
                                                    setModalOpen(true);
                                                }}
                                            >
                                                Schedule your first visit
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredVisits.map((visit) => (
                                    <motion.tr
                                        key={visit.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{visit.title}</p>
                                                {visit.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-[200px]">
                                                        {visit.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {visit.governor_name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .slice(0, 2)}
                                                </div>
                                                <span className="text-sm">{visit.governor_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getTypeBadge(visit.visit_type)}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(visit.scheduled_date).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })}
                                                </div>
                                                {visit.start_time && visit.end_time && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Clock className="w-3 h-3" />
                                                        {visit.start_time} - {visit.end_time}
                                                    </div>
                                                )}
                                                {visit.location && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <MapPin className="w-3 h-3" />
                                                        {visit.location}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {visit.subject && (
                                                    <p className="text-xs font-medium">{visit.subject}</p>
                                                )}
                                                {visit.year_groups && visit.year_groups.length > 0 && (
                                                    <p className="text-[10px] text-slate-500">
                                                        {visit.year_groups.join(', ')}
                                                    </p>
                                                )}
                                                {visit.key_focus && visit.key_focus.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {visit.key_focus.slice(0, 2).map((focus, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded"
                                                            >
                                                                {focus}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getRatingStars(visit.rating)}</TableCell>
                                        <TableCell>{getStatusBadge(visit.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedVisit(visit);
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(visit.id)}
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
            <VisitModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={() => {
                    setModalOpen(false);
                    fetchVisits();
                    onRefresh?.();
                }}
                organizationId={organizationId}
                initialData={selectedVisit}
                governors={[]} // TODO: Fetch governors
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
        violet: 'bg-violet-100 text-violet-600',
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
