"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    FileText,
    Download,
    AlertCircle,
    CheckCircle,
    Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    OfstedRating,
    CATEGORY_INFO,
} from '@/lib/ofsted';

interface OfstedReadinessReportProps {
    organizationId: string;
    onRefresh?: () => void;
}

interface OfstedReadinessResponse {
    current: {
        overall_score: number;
        overall_rating: OfstedRating;
        assessed_questions: number;
        total_questions: number;
        total_evidence: number;
        category_scores: Array<{
            category_id: string;
            average_score: number;
            assessed_subcategories: number;
        }>;
        question_scores: Array<{
            question_id: string;
            category_id: string;
            question: string;
            current_score: number;
            recommendation?: string;
        }>;
        gaps: Array<{
            category_id: string;
            question_id: string;
            question: string;
            current_score: number;
            recommendation?: string;
        }>;
    };
    historical?: Array<{
        id: string;
        snapshot_date: string;
        overall_score: number;
        overall_rating: OfstedRating;
        category_scores?: Array<{
            category_id: string;
            average_score: number;
        }>;
    }>;
}

export default function OfstedReadinessReport({
    organizationId,
    onRefresh,
}: OfstedReadinessReportProps) {
    const [readiness, setReadiness] = useState<OfstedReadinessResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

    useEffect(() => {
        fetchReadiness();
    }, [organizationId]);

    const fetchReadiness = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/ofsted/readiness?organizationId=${organizationId}`
            );
            if (response.ok) {
                const data = await response.json();
                setReadiness(data);
            }
        } catch (error) {
            console.error('Failed to fetch readiness:', error);
        } finally {
            setLoading(false);
        }
    };

    const createSnapshot = async () => {
        try {
            const response = await fetch('/api/ofsted/readiness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId }),
            });

            if (response.ok) {
                fetchReadiness();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Failed to create snapshot:', error);
        }
    };

    const getGapPriority = (score: number) => {
        if (score < 40) return { label: 'Critical', color: 'bg-rose-100 text-rose-700' };
        if (score < 60) return { label: 'High', color: 'bg-amber-100 text-amber-700' };
        if (score < 80) return { label: 'Medium', color: 'bg-blue-100 text-blue-700' };
        return { label: 'Low', color: 'bg-emerald-100 text-emerald-700' };
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-emerald-600" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-rose-600" />;
            default:
                return <Minus className="w-4 h-4 text-slate-400" />;
        }
    };

    const filteredGaps = readiness?.current?.gaps?.filter(
        (gap) => selectedCategory === 'all' || gap.category_id === selectedCategory
    ) || [];

    const filteredQuestions = readiness?.current?.question_scores?.filter(
        (q) => selectedCategory === 'all' || q.category_id === selectedCategory
    ) || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Ofsted Readiness Report</h2>
                    <p className="text-sm text-slate-500">
                        Track your school's readiness for Ofsted inspection
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {Object.keys(CATEGORY_INFO).map((catId) => (
                                <SelectItem key={catId} value={catId}>
                                    {CATEGORY_INFO[catId].icon} {CATEGORY_INFO[catId].name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={createSnapshot}>
                        <Target className="w-4 h-4 mr-2" />
                        Save Snapshot
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Overall Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ScoreCard
                    title="Overall Score"
                    score={readiness?.current.overall_score || 0}
                    rating={readiness?.current.overall_rating}
                />
                <ScoreCard
                    title="Categories Assessed"
                    score={readiness?.current.assessed_questions || 0}
                    total={readiness?.current.total_questions || 6}
                    isCount
                />
                <ScoreCard
                    title="Evidence Linked"
                    score={readiness?.current.total_evidence || 0}
                    isCount
                />
                <ScoreCard
                    title="Action Items"
                    score={filteredGaps.length}
                    isCount
                    highlight={filteredGaps.length > 0}
                />
            </div>

            {/* Category Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {(readiness?.current.category_scores || []).map((category, idx) => {
                            const info = CATEGORY_INFO[category.category_id];
                            const gapCount = filteredGaps.filter(
                                (g) => g.category_id === category.category_id
                            ).length;

                            return (
                                <div key={category.category_id} className="flex items-center gap-4">
                                    <div className="text-2xl w-8 text-center">{info.icon}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{info.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold">{category.average_score}%</span>
                                                {gapCount > 0 && (
                                                    <Badge variant="outline" className="text-rose-600 border-rose-200">
                                                        {gapCount} gap{gapCount !== 1 ? 's' : ''}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${category.average_score}%` }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`h-full ${
                                                    category.average_score >= 80
                                                        ? 'bg-emerald-500'
                                                        : category.average_score >= 60
                                                        ? 'bg-blue-500'
                                                        : category.average_score >= 40
                                                        ? 'bg-amber-500'
                                                        : 'bg-rose-500'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Gaps Analysis */}
            {filteredGaps.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Gaps Analysis
                            <Badge variant="outline">{filteredGaps.length} items</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredGaps
                                .sort((a, b) => (a.current_score || 0) - (b.current_score || 0))
                                .map((gap) => {
                                    const info = CATEGORY_INFO[gap.category_id];
                                    const priority = getGapPriority(gap.current_score || 0);

                                    return (
                                        <div
                                            key={`${gap.category_id}-${gap.question_id}`}
                                            className="flex items-start gap-3 p-3 border rounded-lg"
                                        >
                                            <div className="text-xl">{info.icon}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono text-slate-400">
                                                        {gap.question_id}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {info.name}
                                                    </span>
                                                    <Badge className={`text-[9px] ${priority.color}`}>
                                                        {priority.label} Priority
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-medium">{gap.question}</p>
                                                {gap.recommendation && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        💡 {gap.recommendation}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-rose-600">
                                                    {gap.current_score}%
                                                </p>
                                                <p className="text-[10px] text-slate-500">current</p>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Historical Trends */}
            {readiness?.historical && readiness.historical.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Historical Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-3">Date</th>
                                        <th className="text-right py-2 px-3">Overall</th>
                                        <th className="text-right py-2 px-3">Inclusion</th>
                                        <th className="text-right py-2 px-3">Curriculum</th>
                                        <th className="text-right py-2 px-3">Achievement</th>
                                        <th className="text-right py-2 px-3">Attendance</th>
                                        <th className="text-right py-2 px-3">Personal Dev</th>
                                        <th className="text-right py-2 px-3">Leadership</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {readiness.historical.slice(-6).map((snapshot) => (
                                        <tr key={snapshot.id} className="border-b border-slate-100">
                                            <td className="py-2 px-3">
                                                {new Date(snapshot.snapshot_date).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </td>
                                            <td className="text-right py-2 px-3 font-bold">
                                                {snapshot.overall_score}%
                                            </td>
                                            {['inclusion', 'curriculum-teaching', 'achievement', 'attendance-behaviour', 'personal-development', 'leadership-governance'].map(
                                                (catId) => {
                                                    const catData = snapshot.category_scores?.find(
                                                        (c: any) => c.category_id === catId
                                                    );
                                                    return (
                                                        <td key={catId} className="text-right py-2 px-3">
                                                            {catData?.average_score || 0}%
                                                        </td>
                                                    );
                                                }
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {filteredGaps.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-emerald-700 mb-2">
                            All Categories Well Covered!
                        </h3>
                        <p className="text-slate-500">
                            {readiness?.current.assessed_questions === readiness?.current.total_questions
                                ? 'All categories have been assessed with good or excellent ratings.'
                                : 'Complete your assessments to see gaps analysis.'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function ScoreCard({
    title,
    score,
    total,
    rating,
    isCount,
    highlight,
}: {
    title: string;
    score: number;
    total?: number;
    rating?: OfstedRating;
    isCount?: boolean;
    highlight?: boolean;
}) {
    if (isCount) {
        return (
            <Card className={highlight ? 'border-amber-200 bg-amber-50/50' : ''}>
                <CardContent className="p-4">
                    <p className="text-[10px] font-bold uppercase text-slate-500">{title}</p>
                    <p className="text-2xl font-bold mt-1">{score}</p>
                    {total && <p className="text-xs text-slate-500">of {total}</p>}
                </CardContent>
            </Card>
        );
    }

    const getColor = () => {
        if (score >= 80) return 'text-emerald-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-amber-600';
        return 'text-rose-600';
    };

    const getRatingStyle = (rating?: OfstedRating) => {
        switch (rating) {
            case 'exceptional':
                return 'bg-emerald-100 text-emerald-700';
            case 'strong_standard':
                return 'bg-green-100 text-green-700';
            case 'expected_standard':
                return 'bg-blue-100 text-blue-700';
            case 'needs_attention':
                return 'bg-amber-100 text-amber-700';
            case 'urgent_improvement':
                return 'bg-rose-100 text-rose-700';
            default:
                return 'bg-slate-100 text-slate-500';
        }
    };

    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase text-slate-500">{title}</p>
                <p className={`text-2xl font-bold mt-1 ${getColor()}`}>{score}%</p>
                {rating && (
                    <Badge className={`text-[10px] mt-1 ${getRatingStyle(rating)}`}>
                        {rating.replace(/_/g, ' ')}
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
}
