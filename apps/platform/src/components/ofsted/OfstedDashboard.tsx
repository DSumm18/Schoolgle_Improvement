"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    FileText,
    Settings,
    Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    CATEGORY_SUBCATEGORIES,
    CATEGORY_INFO,
} from '@/lib/ofsted';

const RATING_STYLES: Record<string, string> = {
    exceptional: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    strong_standard: 'bg-green-100 text-green-700 border-green-200',
    expected_standard: 'bg-blue-100 text-blue-700 border-blue-200',
    needs_attention: 'bg-amber-100 text-amber-700 border-amber-200',
    urgent_improvement: 'bg-rose-100 text-rose-700 border-rose-200',
    not_assessed: 'bg-slate-100 text-slate-500 border-slate-200',
};

interface OfstedDashboardProps {
    organizationId: string;
}

interface ReadinessData {
    overall_score: number;
    overall_rating: string;
    categories?: Array<{
        category_id: string;
        average_score: number;
        assessed_subcategories: number;
    }>;
    gaps?: Array<{
        category: string;
        issue: string;
    }>;
}

export default function OfstedDashboard({ organizationId }: OfstedDashboardProps) {
    const [readiness, setReadiness] = useState<ReadinessData | null>(null);
    const [loading, setLoading] = useState(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        fetchData();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [organizationId]);

    const fetchData = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        try {
            const response = await fetch(`/api/ofsted/readiness?organizationId=${organizationId}`, {
                signal: controller.signal,
            });

            if (controller.signal.aborted) return;

            if (response.ok) {
                const data = await response.json();
                setReadiness(data.current || data);
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
                return;
            }
            console.error('Failed to fetch Ofsted data:', error);
            // Set default data if API fails
            setReadiness({
                overall_score: 0,
                overall_rating: 'not_assessed',
                categories: []
            });
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    };

    const getReadinessColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50';
        if (score >= 60) return 'text-blue-600 bg-blue-50';
        if (score >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-rose-600 bg-rose-50';
    };

    const getRatingBadge = (rating: string) => {
        return (
            <Badge className={`text-[10px] font-bold uppercase px-2 py-0.5 ${RATING_STYLES[rating] || RATING_STYLES.not_assessed}`}>
                {rating.replace(/_/g, ' ')}
            </Badge>
        );
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

    const overallScore = readiness?.overall_score || 0;
    const overallRating = readiness?.overall_rating || 'not_assessed';
    const categories = readiness?.categories || [];

    return (
        <div className="space-y-6">
            {/* Overall Readiness Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase text-blue-700">Overall Readiness</p>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-4xl font-black text-blue-900">
                                    {overallScore}%
                                </p>
                                {getRatingBadge(overallRating)}
                            </div>
                            <p className="text-sm text-blue-700 mt-2">
                                {categories.filter((c) => c.average_score > 0).length} of {' '}
                                {categories.length || 6} categories assessed
                            </p>
                        </div>
                        <div className="text-right">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getReadinessColor(overallScore)}`}>
                                {overallRating === 'exceptional' && <CheckCircle className="w-5 h-5" />}
                                {(overallRating === 'strong_standard' || overallRating === 'expected_standard') && <TrendingUp className="w-5 h-5" />}
                                {(overallRating === 'needs_attention' ||
                                    overallRating === 'urgent_improvement') && (
                                    <AlertTriangle className="w-5 h-5" />
                                )}
                                <span className="font-bold capitalize">
                                    {overallRating.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category Readiness Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {(Object.keys(CATEGORY_INFO) as string[]).map((categoryId, idx) => {
                    const info = CATEGORY_INFO[categoryId];
                    const categoryData = categories.find((c) => c.category_id === categoryId);
                    const score = categoryData?.average_score || 0;

                    return (
                        <motion.div
                            key={categoryId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-4">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">{info.icon}</div>
                                        <p className="text-[10px] font-bold uppercase text-slate-500">
                                            {info.name}
                                        </p>
                                        <div className="mt-2">
                                            <p className="text-2xl font-black">{score}%</p>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                                <div
                                                    className="h-full bg-blue-500 transition-all"
                                                    style={{ width: `${score}%` }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2">
                                            {categoryData?.assessed_subcategories || 0}/{CATEGORY_SUBCATEGORIES[categoryId]?.length || 3} assessed
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Safeguarding Status Banner */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                            <p className="font-semibold text-blue-900">
                                Safeguarding is assessed separately
                            </p>
                            <p className="text-sm text-blue-700">
                                Ensure your safeguarding arrangements meet all requirements
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Welcome Card */}
            <Card>
                <CardContent className="p-6">
                    <h3 className="font-bold mb-4">Welcome to Ofsted Readiness</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        Track your school's readiness against the Education Inspection Framework (EIF) 2025.
                        Use the tabs above to navigate through different aspects of your preparation.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div>
                            <h4 className="font-semibold mb-2">Getting Started</h4>
                            <ul className="text-sm text-slate-600 space-y-1">
                                <li>1. Review each category in the Framework tab</li>
                                <li>2. Rate your provision against each inspection focus</li>
                                <li>3. Link supporting evidence to subcategories</li>
                                <li>4. Use the Readiness Report to identify gaps</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Key Features</h4>
                            <ul className="text-sm text-slate-600 space-y-1">
                                <li>• AI-powered evidence scanning</li>
                                <li>• Dual assessment (self + AI)</li>
                                <li>• Action planning linked to gaps</li>
                                <li>• PDF report generation</li>
                            </ul>
                        </div>
                    </div>

                    {readiness?.gaps && readiness.gaps.length > 0 && (
                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                            <h4 className="font-semibold text-amber-900 mb-2">Priority Areas for Improvement</h4>
                            <ul className="text-sm text-amber-800 space-y-1">
                                {readiness.gaps.slice(0, 3).map((gap, idx) => (
                                    <li key={idx}>• {gap.category} - {gap.issue}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
