import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowLeft, TrendingDown, Leaf } from "lucide-react";
import Link from "next/link";

export default function EnergyPage() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/estates">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Energy & Utilities</h1>
                    <p className="text-slate-500 font-medium">Monitor consumption, carbon footprint, and costs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-0 shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <Zap size={140} />
                    </div>
                    <CardHeader className="p-10 pb-4">
                        <Badge className="bg-amber-500 text-white w-fit mb-4">Live Monitoring</Badge>
                        <CardTitle className="text-4xl font-black tracking-tighter">£4,281.20</CardTitle>
                        <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Estimated billing this month</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0">
                        <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                            <TrendingDown size={16} /> -12% vs last month
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-2xl rounded-[3rem] bg-indigo-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-20">
                        <Leaf size={140} />
                    </div>
                    <CardHeader className="p-10 pb-4">
                        <Badge className="bg-emerald-500 text-white w-fit mb-4">Sustainability</Badge>
                        <CardTitle className="text-4xl font-black tracking-tighter">14.2 Tons</CardTitle>
                        <CardDescription className="text-indigo-200 font-bold uppercase tracking-widest text-[10px]">CO2 Footprint (Current QTR)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 text-indigo-100 font-medium italic">
                        "Your school is performing 8% better than the regional average for energy efficiency."
                    </CardContent>
                </Card>
            </div>

            <div className="text-center py-12">
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Upcoming Insights</p>
                <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">
                    Smart meter integration and billing automation tools are being finalized for the next release.
                </p>
            </div>
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold leading-none ${className}`}>
            {children}
        </span>
    );
}
