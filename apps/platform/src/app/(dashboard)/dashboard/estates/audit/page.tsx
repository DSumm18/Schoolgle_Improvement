"use client";

import { useState, useMemo } from 'react';
import { Building, Settings, ArrowLeft, LayoutDashboard, Database, Info } from 'lucide-react';
import { useGoogleSheetData } from '@/hooks/estates-audit/useGoogleSheetData';
import SchoolDetailView from '@/components/estates-audit/dashboard/SchoolDetailView';
import AllSchoolsView from '@/components/estates-audit/dashboard/AllSchoolsView';
import SettingsModal from '@/components/estates-audit/SettingsModal';
import { config } from '@/lib/estates-audit/config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

function DashboardContent() {
    const { schoolData, loading, error } = useGoogleSheetData();
    const [selectedSchoolId, setSelectedSchoolId] = useState('all');
    const [showSettings, setShowSettings] = useState(false);

    const selectedSchool = useMemo(() => {
        if (selectedSchoolId === 'all') {
            return undefined;
        }
        return schoolData.find((school) => school.id === selectedSchoolId);
    }, [schoolData, selectedSchoolId]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                    <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600 animate-pulse" />
                </div>
                <div className="text-sm font-bold uppercase tracking-widest text-slate-400">Syncing Estates Data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="max-w-2xl mx-auto bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-3xl p-8 shadow-xl shadow-rose-200/20">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="bg-rose-100 p-4 rounded-full">
                            <Info className="h-8 w-8 text-rose-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-rose-900 dark:text-rose-100">Configuration Required</h2>
                            <p className="text-rose-700/80 dark:text-rose-400 font-medium">{error}</p>
                        </div>
                        <Button
                            onClick={() => setShowSettings(true)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-8 h-12 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-rose-200"
                        >
                            Open Connection Settings
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Demo Mode Banner */}
            {config.IS_DEMO_MODE && (
                <div className="relative overflow-hidden bg-amber-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-200">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Info className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="font-bold text-sm">Experience Mode: Viewing Demo Data</span>
                                <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mt-0.5">Connect your live environment via settings</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowSettings(true)}
                            variant="secondary"
                            className="bg-white text-amber-600 hover:bg-amber-50 h-9 font-bold text-xs uppercase tracking-wider"
                        >
                            Configure Live Sync
                        </Button>
                    </div>
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-white/10 to-transparent skew-x-12 transform translate-x-32" />
                </div>
            )}

            {/* Modern Sub-Header / Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                        <LayoutDashboard className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Estates Audit</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Integration v1.0</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Context:</span>
                        <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                            <SelectTrigger className="w-[240px] h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-sm">
                                <SelectValue placeholder="Select context" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all" className="font-bold">Portfolio Overview</SelectItem>
                                {schoolData.map((school) => (
                                    <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={() => setShowSettings(true)}
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all h-11 w-11"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[400px]">
                {selectedSchoolId === 'all' ? (
                    <AllSchoolsView
                        schoolData={schoolData}
                        onSelectSchool={(school) => setSelectedSchoolId(school.id)}
                    />
                ) : (
                    <SchoolDetailView
                        school={selectedSchool!}
                        onBack={() => setSelectedSchoolId('all')}
                    />
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <SettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    onSave={() => {
                        setShowSettings(false);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}

export default function EstatesAuditDashboard() {
    return <DashboardContent />;
}
