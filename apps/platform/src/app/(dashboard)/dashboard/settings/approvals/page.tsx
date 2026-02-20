'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    XCircle,
    Clock,
    ShieldAlert,
    ArrowRight,
    MessageSquare,
    ShieldCheck,
    UserCheck,
    Zap,
    Activity,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ApprovalItem {
    id: string;
    skill_id: string;
    skill_name: string;
    status: 'pending' | 'approved' | 'rejected';
    payload: {
        to: string;
        subject: string;
        body: string;
        channel: string;
    };
    confidence: number;
    created_at: string;
}

export default function ApprovalHubPage() {
    const [pendingItems, setPendingItems] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasCriticalIncident, setHasCriticalIncident] = useState(false);
    const [stats, setStats] = useState({
        successRate: 94,
        interventionRate: 12,
        activeSkills: 24
    });

    useEffect(() => {
        // Mock load
        const timer = setTimeout(() => {
            const mockItems: ApprovalItem[] = [
                {
                    id: '1',
                    skill_id: 'safety_emergency_lockdown',
                    skill_name: 'Emergency Lockdown Alert',
                    status: 'pending',
                    confidence: 1.0,
                    created_at: new Date().toISOString(),
                    payload: {
                        to: 'All Staff',
                        subject: 'LOCKDOWN INITIATED',
                        body: 'URGENT: School lockdown initiated. Please follow protocol immediately.',
                        channel: 'sms'
                    }
                },
                {
                    id: '2',
                    skill_id: 'estates_contractor_chase',
                    skill_name: 'Contractor Performance Warning',
                    status: 'pending',
                    confidence: 0.82,
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    payload: {
                        to: 'Apex Maintenance Ltd',
                        subject: 'Contractor Service Level Warning',
                        body: 'Our records indicate multiple SLA breaches in the last 48 hours...',
                        channel: 'email'
                    }
                }
            ];
            setPendingItems(mockItems);
            setHasCriticalIncident(mockItems.some(i => i.skill_id.includes('lockdown')));
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleApprove = (id: string) => {
        setPendingItems(items => items.filter(i => i.id !== id));
        const remaining = pendingItems.filter(i => i.id !== id);
        setHasCriticalIncident(remaining.some(i => i.skill_id.includes('lockdown')));
        toast.success('Message Approved', {
            description: 'Ed has dispatched the communication via the requested channel.'
        });
    };

    const handleDeny = (id: string) => {
        setPendingItems(items => items.filter(i => i.id !== id));
        const remaining = pendingItems.filter(i => i.id !== id);
        setHasCriticalIncident(remaining.some(i => i.skill_id.includes('lockdown')));
        toast.error('Message Rejected', {
            description: 'The communication has been cancelled and logged as rejected.'
        });
    };

    return (
        <div className={`flex-1 space-y-6 p-8 pt-6 min-h-screen transition-colors duration-500 ${hasCriticalIncident ? 'bg-red-950/20' : 'bg-neutral-950'} text-neutral-50 overflow-auto`}>
            {hasCriticalIncident && (
                <div className="fixed top-0 left-0 w-full h-1 bg-red-600 animate-pulse z-50 shadow-[0_0_20px_rgba(220,38,38,0.8)]" />
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-3xl font-bold tracking-tight ${hasCriticalIncident ? 'text-red-500 animate-pulse' : 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'}`}>
                        {hasCriticalIncident ? '🚨 CRITICAL ACTION REQUIRED' : 'Ed Approval Hub'}
                    </h2>
                    <p className="text-neutral-400">
                        {hasCriticalIncident
                            ? 'A high-stakes emergency action has been intercepted and requires immediate verification.'
                            : 'Human-in-the-Loop oversight for Ed\'s autonomous actions.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Safety Settings
                    </Button>
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Success Rate</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.successRate}%</div>
                        <Progress value={stats.successRate} className="h-1 mt-3 bg-neutral-800" />
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl text-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Intervention Rate</CardTitle>
                        <UserCheck className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.interventionRate}%</div>
                        <p className="text-xs text-neutral-500 mt-2">-2% from last week</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-400">Active Skills</CardTitle>
                        <Activity className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeSkills}</div>
                        <p className="text-xs text-neutral-500 mt-2">Running autonomously</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Pending Queue */}
                <div className="md:col-span-4 space-y-4">
                    <div className="flex items-center justify-between bg-neutral-900/80 p-4 rounded-xl border border-neutral-800 shadow-xl">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            Pending Approval Queue
                        </h3>
                        <Badge variant="secondary" className="bg-indigo-900/30 text-indigo-400 border-indigo-500/30">
                            {pendingItems.length} Actions
                        </Badge>
                    </div>

                    {loading ? (
                        Array(2).fill(0).map((_, i) => (
                            <Card key={i} className="bg-neutral-900/40 border-neutral-800">
                                <CardHeader><Skeleton className="h-4 w-1/3 bg-neutral-800" /></CardHeader>
                                <CardContent><Skeleton className="h-20 w-full bg-neutral-800" /></CardContent>
                            </Card>
                        ))
                    ) : pendingItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-neutral-800 rounded-3xl opacity-50">
                            <CheckCircle2 className="w-12 h-12 text-neutral-600 mb-4" />
                            <p>No messages pending approval.</p>
                        </div>
                    ) : (
                        pendingItems.map((item) => {
                            const isCritical = item.skill_id.includes('lockdown') || item.skill_id.includes('emergency');
                            return (
                                <Card key={item.id} className={`relative group overflow-hidden bg-neutral-900/60 border-neutral-800 transition-all duration-300 backdrop-blur-md shadow-2xl ${isCritical
                                        ? 'border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)] bg-red-950/10'
                                        : 'hover:border-indigo-500/50'
                                    }`}>
                                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                                        {isCritical && (
                                            <Badge variant="destructive" className="animate-pulse bg-red-600 text-white border-transparent">
                                                CRITICAL
                                            </Badge>
                                        )}
                                        <Badge className={`${isCritical ? 'bg-red-900/40 text-red-200 border-red-500/30' : 'bg-neutral-800/80 text-neutral-300 border-neutral-700'} capitalize`}>
                                            {item.payload.channel}
                                        </Badge>
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {item.skill_name}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 text-neutral-500">
                                            To: <span className="text-neutral-300 font-mono">{item.payload.to}</span>
                                            <span className="text-neutral-700">|</span>
                                            Confidence:
                                            <span className={`font-bold ${item.confidence > 0.9 ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {Math.round(item.confidence * 100)}%
                                            </span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-neutral-950/50 p-4 rounded-lg border border-neutral-800/50 text-sm font-light italic text-neutral-400 leading-relaxed shadow-inner">
                                            &ldquo;{item.payload.body}&rdquo;
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-2 pt-0">
                                        <Button
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-[0_4px_15px_rgba(79,70,229,0.4)] active:scale-95"
                                            onClick={() => handleApprove(item.id)}
                                        >
                                            Approve
                                        </Button>
                                        <Button variant="outline" className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all active:scale-95">
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="flex-none text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all active:scale-95"
                                            onClick={() => handleDeny(item.id)}
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Sidebar Log / Tiers */}
                <div className="md:col-span-3 space-y-6">
                    <Card className="bg-neutral-900/80 border-neutral-800 shadow-xl overflow-hidden">
                        <CardHeader className="bg-neutral-950/50 border-b border-neutral-800">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-purple-400" />
                                Approval Tier Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4">
                            {[
                                { tier: 'Tier 1: AUTO', desc: 'No intervention. Standard usage.', active: true },
                                { tier: 'Tier 2: SHADOW', desc: 'Ed logs but sends copies for review.', active: false },
                                { tier: 'Tier 3: REVIEW', desc: 'Human must approve every word.', active: true },
                                { tier: 'Tier 4: BLOCKED', desc: 'Killswitch. No comms allowed.', active: false },
                            ].map((t, i) => (
                                <div key={i} className={`p-3 rounded-lg border transition-all ${t.active ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-neutral-950/30 border-neutral-800 opacity-60'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-bold ${t.active ? 'text-indigo-400' : 'text-neutral-500'}`}>{t.tier}</span>
                                        <div className={`w-8 h-4 rounded-full p-1 ${t.active ? 'bg-indigo-600' : 'bg-neutral-800 flex justify-end'}`}>
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-neutral-500 leading-tight">{t.desc}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/80 border-neutral-800 shadow-xl overflow-hidden flex flex-col h-[350px]">
                        <CardHeader className="bg-neutral-950/50 border-b border-neutral-800 shrink-0">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-neutral-400" />
                                Shadow/Auto-Sent Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto divide-y divide-neutral-800 shrink-1 h-full">
                            {[
                                { school: 'St. Judes Primary', skill: 'Staff Absence', time: '10m ago' },
                                { school: 'St. Judes Primary', skill: 'Contractor Chase', time: '2h ago' },
                                { school: 'Schoolgle Empire', skill: 'DBS Update', time: '5h ago' },
                                { school: 'St. Judes Primary', skill: 'Compliance Alert', time: 'Yesterday' },
                            ].map((log, i) => (
                                <div key={i} className="p-3 hover:bg-neutral-800/30 transition-colors flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-neutral-200">{log.skill}</p>
                                        <p className="text-[10px] text-neutral-500">{log.school}</p>
                                    </div>
                                    <span className="text-[10px] text-neutral-600">{log.time}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
