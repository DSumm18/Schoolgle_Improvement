'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, MapPin, CheckCircle2, AlertCircle, Camera, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';

export default function InspectionsPage() {
    const { organization, loading: authLoading } = useAuth();
    const organizationId = organization?.id;
    const [step, setStep] = useState(1); // 1: Select Location, 2: Perform Inspection
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const [checklist, setChecklist] = useState([
        { id: 1, task: 'Fire Extinguisher Check', status: 'pending' },
        { id: 2, task: 'Emergency Lighting Test', status: 'pending' },
        { id: 3, task: 'Legionella Temperature Check', status: 'pending' },
        { id: 4, task: 'General Hazards Scan', status: 'pending' },
    ]);

    useEffect(() => {
        if (!authLoading && organizationId) {
            fetchLocations();
        }
    }, [organizationId, authLoading]);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('estates_locations')
                .select('*')
                .eq('organization_id', organizationId)
                .order('name');

            if (error) throw error;
            setLocations(data || []);
        } catch (err) {
            console.error('Error fetching locations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLocation = (loc: any) => {
        setSelectedLocation(loc);
        setStep(2);
    };

    const toggleTask = (taskId: number) => {
        const updated = checklist.map(t =>
            t.id === taskId
                ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
                : t
        );
        setChecklist(updated);

        const completed = updated.filter(t => t.status === 'completed').length;
        setProgress((completed / updated.length) * 100);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-20 dark:bg-slate-950">
            {/* Mobile-Friendly Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
                {step === 2 ? (
                    <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="h-8 w-8">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                ) : (
                    <Link href="/estates-compliance">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                )}
                <div className="flex-1">
                    <h1 className="font-bold text-lg leading-none">On-Site Inspection</h1>
                    {selectedLocation && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {selectedLocation.name}
                        </p>
                    )}
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Mobile Mode
                </Badge>
            </header>

            <main className="p-4 flex-1">
                {step === 1 ? (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Select Location</CardTitle>
                                <CardDescription>Tap a room or area to begin inspection</CardDescription>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                {loading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
                                    </div>
                                ) : locations.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground text-sm">No locations found. Use the desktop dashboard to map your site.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {locations.map(loc => (
                                            <Button
                                                key={loc.id}
                                                variant="outline"
                                                className="h-auto py-4 justify-between text-left hover:bg-blue-50 hover:border-blue-200"
                                                onClick={() => handleSelectLocation(loc)}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold">{loc.name}</span>
                                                    <span className="text-[10px] uppercase text-muted-foreground tracking-tighter">{loc.type}</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-100">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">✨</div>
                                <div>
                                    <p className="text-sm font-bold">Pro-Tip</p>
                                    <p className="text-xs text-muted-foreground">Inspections are synced in real-time to the main Compliance Dashboard.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        {/* Progress Tracker */}
                        <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-bold">Overall Progress</span>
                                <span className="text-sm font-mono">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        {/* Checklist items */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">Compliance Tasks</h3>
                            {checklist.map(item => (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-slate-900 transition-all ${item.status === 'completed' ? 'border-green-200 bg-green-50/20 dark:bg-green-900/10' : ''
                                        }`}
                                    onClick={() => toggleTask(item.id)}
                                >
                                    <div className={`h-6 w-6 rounded-md border flex items-center justify-center transition-colors ${item.status === 'completed' ? 'bg-green-500 border-green-600 text-white' : 'bg-slate-50'
                                        }`}>
                                        {item.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                            {item.task}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                        <Camera className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Quick Note / Issue Report */}
                        <Card className="border-red-100 bg-red-50/5 dark:bg-red-950/5">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <CardTitle className="text-sm">Report Issue</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <textarea
                                    className="w-full min-h-[100px] text-sm p-3 rounded-lg border bg-white dark:bg-slate-800 placeholder:text-muted-foreground focus:ring-1 focus:ring-red-300 outline-none"
                                    placeholder="Describe any failures or hazards discovered in this location..."
                                />
                                <Button variant="outline" className="w-full mt-3 text-red-600 border-red-200 hover:bg-red-50">
                                    Submit Maintenance Ticket
                                </Button>
                            </CardContent>
                        </Card>

                        <Button className="w-full py-6 text-base font-bold shadow-lg" onClick={() => setStep(1)}>
                            <Save className="h-4 w-4 mr-2" />
                            Finalize Inspection
                        </Button>
                    </div>
                )}
            </main>

            {/* Persistent Bottom Bar */}
            <footer className="fixed bottom-0 inset-x-0 h-16 bg-white dark:bg-slate-900 border-t flex items-center justify-around px-6 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col items-center gap-1 text-primary">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Inspections</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-muted-foreground opacity-50">
                    <MapPin className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Map</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-muted-foreground opacity-50">
                    <Camera className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Gallery</span>
                </div>
            </footer>
        </div>
    );
}
