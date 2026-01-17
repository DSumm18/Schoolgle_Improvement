import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CompliancePage() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/estates">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Statutory Compliance</h1>
                    <p className="text-slate-500 font-medium">Monitor Fire Safety, Asbestos, Legionella and more.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Fire Safety', status: 'Compliant', color: 'emerald' },
                    { label: 'Legionella', status: 'Overdue', color: 'rose' },
                    { label: 'Asbestos', status: 'Reviewing', color: 'amber' },
                    { label: 'Lifts', status: 'Compliant', color: 'emerald' }
                ].map((item, i) => (
                    <Card key={i} className={`border-0 shadow-lg shadow-slate-200/50 rounded-[2rem] bg-${item.color}-50 dark:bg-${item.color}-900/10 border-l-4 border-${item.color}-500`}>
                        <CardHeader className="pb-2 text-center">
                            <CardTitle className={`text-[10px] font-black uppercase tracking-widest text-${item.color}-600 mb-2`}>{item.label}</CardTitle>
                            <CardTitle className={`text-xl font-black text-${item.color}-900`}>{item.status}</CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 glass-card rounded-[3rem]">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <ShieldCheck size={32} />
                </div>
                <div className="space-y-1">
                    <p className="font-black text-slate-900 text-lg">Compliance Tracking Engine</p>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                        Automated statutory reminders and document storage system is currently being integrated with the single central register.
                    </p>
                </div>
            </div>
        </div>
    );
}
