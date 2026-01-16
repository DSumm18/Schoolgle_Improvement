import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, TrendingUp, AlertCircle, CheckCircle, ArrowRight, ShieldCheck, Zap, Accessibility } from 'lucide-react';
import Link from 'next/link';

export default function EstatesAuditHome() {
    return (
        <div className="p-8 space-y-12 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-6">
                    <Badge className="bg-indigo-600 text-white border-0 py-1 px-4 uppercase tracking-widest text-[10px] font-black">
                        Available Now
                    </Badge>
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                        Master Your School <br />
                        <span className="text-indigo-600">Estate Digital Audit</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
                        Automate compliance tracking, energy optimization, and maintenance schedules across your entire educational portfolio with real-time Google Sheets integration.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <Link href="/dashboard/estates/audit">
                            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-base font-bold shadow-xl shadow-indigo-200">
                                Launch Audit Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-md">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-indigo-500/10 rounded-[2rem] blur-2xl transform rotate-3" />
                        <Card className="relative border-0 shadow-2xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur">
                            <CardHeader className="bg-indigo-600 p-8">
                                <div className="flex justify-between items-center text-white">
                                    <div className="text-sm font-bold uppercase tracking-widest opacity-80">Portfolio Health</div>
                                    <Badge variant="outline" className="text-white border-white/20">Real-time</Badge>
                                </div>
                                <div className="mt-4 text-4xl font-black text-white">84%</div>
                                <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-[84%]" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                {[
                                    { label: 'Maintenance', score: '92%', color: 'text-emerald-600' },
                                    { label: 'Safety', score: '78%', color: 'text-amber-600' },
                                    { label: 'Efficiency', score: '82%', color: 'text-indigo-600' }
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center group cursor-default">
                                        <span className="font-bold text-slate-700">{item.label}</span>
                                        <span className={`font-black ${item.color} group-hover:scale-110 transition-transform`}>{item.score}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Audit Domains */}
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 border-l-4 border-indigo-600 pl-4 inline-block">Audit Domains</h2>
                    <p className="text-slate-500 font-medium">Comprehensive assessment across 4 critical estates disciplines</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            title: 'Building Fabric',
                            desc: 'Heating, structural integrity, plumbing and electrical infrastructure health.',
                            icon: Building,
                            color: 'indigo'
                        },
                        {
                            title: 'Health & Safety',
                            desc: 'Fire safety, asbestos, legionella, and statutory compliance monitoring.',
                            icon: ShieldCheck,
                            color: 'rose'
                        },
                        {
                            title: 'Energy Efficiency',
                            desc: 'Insulation performance, lighting automation, and renewable energy feasibility.',
                            icon: Zap,
                            color: 'amber'
                        },
                        {
                            title: 'Accessibility',
                            desc: 'Equality Act compliance, DDA requirements, and inclusive environment audits.',
                            icon: Accessibility,
                            color: 'emerald'
                        }
                    ].map((domain, i) => (
                        <Card key={i} className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 shadow-lg shadow-slate-200/50 rounded-2xl p-2">
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-2xl bg-${domain.color}-50 flex items-center justify-center text-${domain.color}-600 mb-2 group-hover:scale-110 transition-transform`}>
                                    <domain.icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-xl font-bold tracking-tight">{domain.title}</CardTitle>
                                <CardDescription className="text-sm font-medium leading-relaxed">
                                    {domain.desc}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

            {/* How it Works / CTA */}
            <Card className="rounded-[3rem] border-0 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/10 blur-[100px]" />
                <CardContent className="p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black">Ready to modernize your estates management?</h3>
                        <p className="text-slate-400 font-medium max-w-xl">
                            Connect your existing spreadsheets or use our intelligent templates to start getting live insights in minutes.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/dashboard/estates/audit">
                            <Button size="xl" className="bg-white text-slate-900 hover:bg-slate-100 font-black px-10 rounded-2xl h-16 shadow-2xl">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
