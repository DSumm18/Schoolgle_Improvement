"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Building,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Target,
    FileText,
    Download,
    ShieldCheck,
    Zap,
    Accessibility,
    ArrowLeft,
} from 'lucide-react';
import type { SchoolData } from '@/types/estates-audit';

interface SchoolDetailViewProps {
    school: SchoolData;
    onBack?: () => void;
}

export default function SchoolDetailView({ school, onBack }: SchoolDetailViewProps) {
    const totalAssessments = school.categories.reduce((sum, category) => sum + category.assessments.length, 0);
    const averageScore = school.overallScore;
    const categoriesCount = school.categories.length;

    const getCategoryIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('maintenance')) return <Building className="h-4 w-4" />;
        if (n.includes('safety') || n.includes('health')) return <ShieldCheck className="h-4 w-4" />;
        if (n.includes('energy') || n.includes('efficiency')) return <Zap className="h-4 w-4" />;
        if (n.includes('accessibility')) return <Accessibility className="h-4 w-4" />;
        return <Target className="h-4 w-4" />;
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Back Navigation */}
            {onBack && (
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="group text-slate-500 hover:text-indigo-600 p-0"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Back to Portfolio</span>
                </Button>
            )}

            {/* School Header Card */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-800">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                                <School className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">{school.name}</CardTitle>
                                <CardDescription className="font-medium text-slate-500">
                                    Comprehensive Estates Audit Report
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className={averageScore >= 80 ? 'bg-emerald-500' : averageScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}>
                                {averageScore >= 80 ? 'Outstanding' : averageScore >= 60 ? 'Satisfactory' : 'Needs Action'}
                            </Badge>
                            <div className="h-4 w-px bg-slate-200" />
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Target className="h-3 w-3" />
                                {totalAssessments} Data Points
                            </div>
                            <div className="h-4 w-px bg-slate-200" />
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Building className="h-3 w-3" />
                                {categoriesCount} Audit Domains
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                        <div className="text-center">
                            <div className={`text-4xl font-black ${averageScore >= 80 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                {school.overallScore}%
                            </div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">Audit Score</div>
                        </div>
                        <div className="w-px h-12 bg-slate-200" />
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-9 font-bold text-[10px] uppercase tracking-wider">
                                    <Download className="h-3.5 w-3.5 mr-2" /> Export
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-slate-100/80 p-1 rounded-xl h-auto gap-1">
                    {[
                        { value: 'overview', label: 'Domain Analysis' },
                        { value: 'details', label: 'Full Breakdown' },
                        { value: 'actions', label: 'Required Actions' }
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Domain Performance */}
                        <Card className="border-0 shadow-lg shadow-slate-200/50">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Domain Performance</CardTitle>
                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-slate-400">Scores by administrative area</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {school.categories.map((category) => (
                                    <div key={category.categoryName} className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 transition-colors hover:border-indigo-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                                    {getCategoryIcon(category.categoryName)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{category.categoryName}</span>
                                            </div>
                                            <Badge variant="outline" className={`font-black border-0 ${category.average >= 80 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                                {category.average}%
                                            </Badge>
                                        </div>
                                        <Progress value={category.average} className="h-2" />
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>{category.assessments.length} audited items</span>
                                            <span>Target: 100%</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Performance Context */}
                        <div className="space-y-8">
                            <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
                                <CardHeader className="bg-indigo-600 text-white">
                                    <CardTitle className="text-lg font-bold">Priority Successes</CardTitle>
                                    <CardDescription className="text-indigo-100/80">Highest scoring areas of the estate</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {school.categories
                                            .flatMap(cat => cat.assessments.map(a => ({ ...a, cat: cat.categoryName })))
                                            .sort((a, b) => b.score - a.score)
                                            .slice(0, 4)
                                            .map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex gap-3 items-center">
                                                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.cat}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-black text-emerald-600">{item.score}%</div>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
                                <CardHeader className="bg-rose-600 text-white">
                                    <CardTitle className="text-lg font-bold">Improvement Areas</CardTitle>
                                    <CardDescription className="text-rose-100/80">Urgent maintenance or compliance issues</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {school.categories
                                            .flatMap(cat => cat.assessments.map(a => ({ ...a, cat: cat.categoryName })))
                                            .sort((a, b) => a.score - b.score)
                                            .slice(0, 4)
                                            .map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex gap-3 items-center">
                                                        <div className="bg-rose-50 text-rose-600 p-2 rounded-lg">
                                                            <AlertCircle className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.cat}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-black text-rose-600">{item.score}%</div>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 gap-8">
                        {school.categories.map((category) => (
                            <Card key={category.categoryName} className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
                                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 text-indigo-600">
                                                {getCategoryIcon(category.categoryName)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold uppercase tracking-tight">{category.categoryName}</CardTitle>
                                                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    {category.assessments.length} Items Audited
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Average</div>
                                                <div className={`text-lg font-black ${category.average >= 80 ? 'text-emerald-600' : 'text-indigo-600'}`}>{category.average}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                                        {category.assessments.map((assessment, idx) => (
                                            <div key={idx} className="flex flex-col p-6 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{assessment.name}</h4>
                                                    <Badge className={assessment.score >= 80 ? 'bg-emerald-500' : assessment.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}>
                                                        {assessment.score}%
                                                    </Badge>
                                                </div>
                                                <Progress value={assessment.score} className="h-1.5" />
                                                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span>Progress</span>
                                                    <span>{assessment.score}% of 100%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-6 animate-in zoom-in-95 duration-300">
                    <Card className="border-0 shadow-lg shadow-slate-200/50">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Maintenance & Compliance Backlog</CardTitle>
                            <CardDescription className="text-sm font-medium">Critical items requiring immediate management attention</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {school.categories
                                .flatMap(cat => cat.assessments.map(a => ({ ...a, cat: cat.categoryName })))
                                .filter(a => a.score < 75)
                                .sort((a, b) => a.score - b.score)
                                .map((item, idx) => (
                                    <div key={idx} className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-rose-100 hover:bg-rose-50/30 transition-all">
                                        <div className="flex gap-4 items-center">
                                            <div className={`p-3 rounded-xl ${item.score < 50 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                <AlertCircle className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-900">{item.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.cat} Domain</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="hidden sm:block text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Level</div>
                                                <div className={`text-xs font-black uppercase ${item.score < 50 ? 'text-rose-600' : 'text-amber-600'}`}>
                                                    {item.score < 30 ? 'Critical' : item.score < 50 ? 'High' : 'Medium'}
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-8 border-slate-200 hover:bg-white">
                                                Assign Task
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

import { School } from "lucide-react";
