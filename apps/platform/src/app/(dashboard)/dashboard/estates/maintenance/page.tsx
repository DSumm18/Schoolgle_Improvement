import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function MaintenancePage() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/estates">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Maintenance & Helpdesk</h1>
                    <p className="text-slate-500 font-medium">Manage reactive repairs and planned preventative maintenance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-[2rem] bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-600">Pending Tasks</Card">12</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs font-bold text-amber-700/60 uppercase">4 high priority</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/10 border-l-4 border-indigo-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-600">Active PPM</CardTitle>
                        <CardTitle className="text-3xl font-black text-indigo-900">18</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs font-bold text-indigo-700/60 uppercase">Scheduled this month</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-600">Completed</CardTitle>
                        <CardTitle className="text-3xl font-black text-emerald-900">45</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs font-bold text-emerald-700/60 uppercase">Last 30 days</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-black">Reactive Maintenance Log</CardTitle>
                            <CardDescription className="text-slate-400 font-medium">Recent helpdesk tickets and repair requests.</CardDescription>
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-6">
                            Raise New Ticket
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Clock size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-black text-slate-900">Feature Coming Soon</p>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">
                                We're building the most advanced school maintenance helpdesk ever seen. Stay tuned for the pilot.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
