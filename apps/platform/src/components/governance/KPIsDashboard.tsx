"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Users,
    ClipboardCheck,
    BookOpen,
    FileText,
    AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    GetGovernanceKpiResponse,
    GovernanceStatistics,
    GovernanceKpiSnapshot,
    SkillsCoverage,
} from '@/lib/governance';

interface KPIsDashboardProps {
    organizationId: string;
}

export default function KPIsDashboard({ organizationId }: KPIsDashboardProps) {
    const [kpiData, setKpiData] = useState<GetGovernanceKpiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'term' | 'year' | 'all'>('term');

    useEffect(() => {
        fetchKPIs();
    }, [organizationId, timeRange]);

    const fetchKPIs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ organizationId });
            const response = await fetch(`/api/governance/kpis?${params}`);
            if (response.ok) {
                const data = await response.json();
                setKpiData(data);
            }
        } catch (error) {
            console.error('Failed to fetch KPIs:', error);
        } finally {
            setLoading(false);
        }
    };

    const createSnapshot = async () => {
        try {
            const response = await fetch('/api/governance/kpis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId }),
            });

            if (response.ok) {
                fetchKPIs();
            }
        } catch (error) {
            console.error('Failed to create snapshot:', error);
        }
    };

    const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="w-4 h-4 text-emerald-600" />;
            case 'declining':
                return <TrendingDown className="w-4 h-4 text-rose-600" />;
            default:
                return <Minus className="w-4 h-4 text-slate-400" />;
        }
    };

    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 90) return 'text-emerald-600 bg-emerald-50';
        if (percentage >= 75) return 'text-amber-600 bg-amber-50';
        return 'text-rose-600 bg-rose-50';
    };

    const getSkillsCoverageColor = (covered: number, required: number) => {
        const percentage = (covered / required) * 100;
        if (percentage >= 80) return 'bg-emerald-500';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const stats = kpiData?.current;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Governance KPIs & Performance</h2>
                    <p className="text-sm text-slate-500">Track key governance metrics over time</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="term">This Term</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={createSnapshot}>
                        Create Snapshot
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Board Composition"
                    value={`${stats?.active_governors || 0}/${stats?.total_governors || 0}`}
                    subtitle={`${stats?.vacant_positions || 0} vacancies`}
                    icon={Users}
                    color="blue"
                />
                <KPICard
                    title="Attendance Rate"
                    value={`${stats?.average_attendance_rate || 0}%`}
                    subtitle="Average meeting attendance"
                    icon={ClipboardCheck}
                    color="emerald"
                />
                <KPICard
                    title="Training Compliance"
                    value={`${stats?.training_completion_rate || 0}%`}
                    subtitle={`${stats?.expired_training_count || 0} expired`}
                    icon={BookOpen}
                    color="amber"
                />
                <KPICard
                    title="Policy Compliance"
                    value={`${stats?.policies_current || 0}/${stats?.statutory_policies || 0}`}
                    subtitle={`${stats?.policies_overdue || 0} overdue`}
                    icon={FileText}
                    color="violet"
                />
            </div>

            {/* Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TrendCard
                    title="Attendance Trend"
                    trend={kpiData?.trends.attendance_trend}
                    description="Meeting attendance over time"
                />
                <TrendCard
                    title="Training Trend"
                    trend={kpiData?.trends.training_trend}
                    description="Training completion over time"
                />
                <TrendCard
                    title="Policy Compliance Trend"
                    trend={kpiData?.trends.policy_compliance_trend}
                    description="Policy review timeliness"
                />
            </div>

            {/* Skills Coverage */}
            {kpiData?.skills_coverage && kpiData.skills_coverage.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Skills Coverage Matrix</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {kpiData.skills_coverage.map((skill) => (
                                <div key={skill.skill} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{skill.skill}</span>
                                            <span className="text-xs text-slate-500">
                                                {skill.governors.length} governor{skill.governors.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getSkillsCoverageColor(
                                                    skill.governors.length,
                                                    skill.required ? 3 : 0
                                                )} transition-all`}
                                                style={{
                                                    width: `${Math.min(
                                                        (skill.governors.length / (skill.required ? 3 : 1)) * 100,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex -space-x-1">
                                        {skill.governors.slice(0, 3).map((governor) => (
                                            <div
                                                key={governor}
                                                className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white text-[8px] font-bold text-white flex items-center justify-center"
                                                title={governor}
                                            >
                                                {governor.charAt(0)}
                                            </div>
                                        ))}
                                        {skill.governors.length > 3 && (
                                            <div className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white text-[8px] font-bold text-slate-600 flex items-center justify-center">
                                                +{skill.governors.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    {skill.required && skill.governors.length === 0 && (
                                        <Badge variant="outline" className="text-rose-600 border-rose-200">
                                            Required
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Historical Snapshots */}
            {kpiData?.historical && kpiData.historical.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Historical Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-3">Date</th>
                                        <th className="text-right py-2 px-3">Governors</th>
                                        <th className="text-right py-2 px-3">Attendance</th>
                                        <th className="text-right py-2 px-3">Training</th>
                                        <th className="text-right py-2 px-3">Policies</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kpiData.historical.slice(-6).map((snapshot) => (
                                        <tr key={snapshot.id} className="border-b border-slate-100">
                                            <td className="py-2 px-3">
                                                {new Date(snapshot.snapshot_date).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="text-right py-2 px-3">
                                                {snapshot.active_governors}/{snapshot.total_governors}
                                            </td>
                                            <td className="text-right py-2 px-3">
                                                <span
                                                    className={`px-2 py-0.5 rounded ${getAttendanceColor(
                                                        snapshot.attendance_percentage
                                                    )}`}
                                                >
                                                    {snapshot.attendance_percentage}%
                                                </span>
                                            </td>
                                            <td className="text-right py-2 px-3">
                                                {snapshot.training_completion_rate}%
                                            </td>
                                            <td className="text-right py-2 px-3">
                                                {snapshot.policies_current}/{snapshot.policies_outstanding_review}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
}: {
    title: string;
    value: string | number;
    subtitle: string;
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
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">{title}</p>
                        <p className="text-xl font-bold">{value}</p>
                        <p className="text-xs text-slate-500">{subtitle}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TrendCard({
    title,
    trend,
    description,
}: {
    title: string;
    trend: 'improving' | 'stable' | 'declining';
    description: string;
}) {
    const trendStyles: Record<string, string> = {
        improving: 'bg-emerald-50 border-emerald-200',
        stable: 'bg-slate-50 border-slate-200',
        declining: 'bg-rose-50 border-rose-200',
    };

    const trendLabels: Record<string, string> = {
        improving: 'Improving',
        stable: 'Stable',
        declining: 'Declining',
    };

    return (
        <Card className={trendStyles[trend]}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500">{title}</p>
                        <p className="text-sm font-semibold mt-1 capitalize">{trendLabels[trend]}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    </div>
                    {trend === 'improving' && <TrendingUp className="w-5 h-5 text-emerald-600" />}
                    {trend === 'declining' && <TrendingDown className="w-5 h-5 text-rose-600" />}
                    {trend === 'stable' && <Minus className="w-5 h-5 text-slate-400" />}
                </div>
            </CardContent>
        </Card>
    );
}
