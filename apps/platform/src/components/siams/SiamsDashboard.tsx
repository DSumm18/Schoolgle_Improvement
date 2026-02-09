"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    FileText,
    Search,
    Settings,
    ChevronDown,
    ChevronRight,
    Link,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SiamsFrameworkView from './SiamsFrameworkView';
import SiamsReadinessReport from './SiamsReadinessReport';
import SiamsEvidenceMatcher from './SiamsEvidenceMatcher';
import SiamsChurchStatus from './SiamsChurchStatus';
import {
    SiamsStrandId,
    GetSiamsReadinessResponse,
    SchoolChurchStatus,
    STRAND_INFO,
} from '@/lib/siams';

interface SiamsDashboardProps {
    organizationId: string;
}

export default function SiamsDashboard({ organizationId }: SiamsDashboardProps) {
    const [readiness, setReadiness] = useState<GetSiamsReadinessResponse | null>(null);
    const [churchStatus, setChurchStatus] = useState<SchoolChurchStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedStrands, setExpandedStrands] = useState<Set<SiamsStrandId>>(new Set());
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        fetchData();

        return () => {
            // Cleanup: abort any pending fetch requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [organizationId]);

    const fetchData = async () => {
        // Cancel any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        try {
            const [readinessRes, statusRes] = await Promise.all([
                fetch(`/api/siams/readiness?organizationId=${organizationId}`, {
                    signal: controller.signal,
                }),
                fetch(`/api/siams/church-status?organizationId=${organizationId}`, {
                    signal: controller.signal,
                }),
            ]);

            if (controller.signal.aborted) return;

            if (readinessRes.ok) {
                const data = await readinessRes.json();
                setReadiness(data);
            }

            if (statusRes.ok) {
                const data = await statusRes.json();
                setChurchStatus(data);
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
                return;
            }
            console.error('Failed to fetch SIAMS data:', error);
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    };

    const toggleStrand = (strandId: SiamsStrandId) => {
        const newExpanded = new Set(expandedStrands);
        if (newExpanded.has(strandId)) {
            newExpanded.delete(strandId);
        } else {
            newExpanded.add(strandId);
        }
        setExpandedStrands(newExpanded);
    };

    const getReadinessColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50';
        if (score >= 60) return 'text-blue-600 bg-blue-50';
        if (score >= 40) return 'text-amber-600 bg-amber-50';
        return 'text-rose-600 bg-rose-50';
    };

    const getRatingBadge = (rating: string) => {
        const styles: Record<string, string> = {
            excellent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            good: 'bg-blue-100 text-blue-700 border-blue-200',
            requires_improvement: 'bg-amber-100 text-amber-700 border-amber-200',
            ineffective: 'bg-rose-100 text-rose-700 border-rose-200',
            not_assessed: 'bg-slate-100 text-slate-500 border-slate-200',
        };
        return (
            <Badge className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles[rating] || styles.not_assessed}`}>
                {rating.replace('_', ' ')}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const overall = readiness?.overall;
    const overallScore = overall?.overall_score || 0;
    const overallRating = overall?.overall_rating || 'not_assessed';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">SIAMS</h1>
                        {churchStatus?.is_church_school && (
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                                Church School
                            </Badge>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1">
                        Statutory Inspection of Anglican and Methodist Schools
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                    </Button>
                </div>
            </div>

            {/* Church Status Banner */}
            {!churchStatus?.is_church_school && (
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                <div>
                                    <p className="font-semibold text-amber-900">
                                        Church School Status Not Set
                                    </p>
                                    <p className="text-sm text-amber-700">
                                        Configure your church school status to enable SIAMS framework features
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setActiveTab('status')}>
                                Configure
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Overall Readiness Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase text-purple-700">Overall Readiness</p>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-4xl font-black text-purple-900">
                                    {overallScore}%
                                </p>
                                {getRatingBadge(overallRating)}
                            </div>
                            <p className="text-sm text-purple-700 mt-2">
                                {overall?.strands?.filter((s) => s.average_score > 0).length || 0} of{' '}
                                {overall?.strands?.length || 7} strands assessed
                            </p>
                        </div>
                        <div className="text-right">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getReadinessColor(overallScore)}`}>
                                {overallRating === 'excellent' && <CheckCircle className="w-5 h-5" />}
                                {overallRating === 'good' && <TrendingUp className="w-5 h-5" />}
                                {(overallRating === 'requires_improvement' ||
                                    overallRating === 'ineffective') && (
                                    <AlertTriangle className="w-5 h-5" />
                                )}
                                <span className="font-bold capitalize">
                                    {overallRating.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Strand Readiness Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                {(Object.keys(STRAND_INFO) as SiamsStrandId[]).map((strandId, idx) => {
                    const info = STRAND_INFO[strandId];
                    const strandData = overall?.strands?.find((s) => s.strand_id === strandId);
                    const score = strandData?.average_score || 0;

                    return (
                        <motion.div
                            key={strandId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => toggleStrand(strandId)}
                            className="cursor-pointer"
                        >
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-4">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">{info.icon}</div>
                                        <p className="text-xs font-bold uppercase text-slate-500">
                                            {info.name}
                                        </p>
                                        <div className="mt-2">
                                            <p className="text-2xl font-black">{score}%</p>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                                <div
                                                    className="h-full bg-purple-500 transition-all"
                                                    style={{ width: `${score}%` }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2">
                                            {strandData?.total_questions || 0} question{((strandData?.total_questions || 0) !== 1) ? 's' : ''} total
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex h-12">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4">
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="framework" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4">
                        Framework
                    </TabsTrigger>
                    <TabsTrigger value="evidence" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4">
                        Evidence
                    </TabsTrigger>
                    <TabsTrigger value="readiness" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4">
                        Readiness
                    </TabsTrigger>
                    <TabsTrigger value="status" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4">
                        Status
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-bold mb-4">Welcome to SIAMS Readiness</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Use the tabs above to navigate through the SIAMS framework tools.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <h4 className="font-semibold text-purple-900 mb-2">Framework</h4>
                                    <p className="text-sm text-purple-700">Self-assess against the 7 SIAMS strands</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-semibold text-blue-900 mb-2">Evidence</h4>
                                    <p className="text-sm text-blue-700">Link evidence to framework questions</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-lg">
                                    <h4 className="font-semibold text-emerald-900 mb-2">Readiness</h4>
                                    <p className="text-sm text-emerald-700">View gaps and generate reports</p>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-lg">
                                    <h4 className="font-semibold text-amber-900 mb-2">Status</h4>
                                    <p className="text-sm text-amber-700">Configure church school information</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="framework" className="mt-6">
                    <SiamsFrameworkView
                        organizationId={organizationId}
                        onRefresh={fetchData}
                        initialExpandedStrand={Array.from(expandedStrands)[0]}
                    />
                </TabsContent>

                <TabsContent value="evidence" className="mt-6">
                    <SiamsEvidenceMatcher
                        organizationId={organizationId}
                        onRefresh={fetchData}
                    />
                </TabsContent>

                <TabsContent value="readiness" className="mt-6">
                    <SiamsReadinessReport
                        organizationId={organizationId}
                        onRefresh={fetchData}
                    />
                </TabsContent>

                <TabsContent value="status" className="mt-6">
                    <SiamsChurchStatus
                        organizationId={organizationId}
                        onRefresh={fetchData}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
