"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart3, Shield, Building2, Users, PoundSterling, BookOpen, Heart,
    ChevronRight, Star, Sparkles, Check, ArrowRight, Zap, Globe,
    Lock, AlertTriangle, Clock, TrendingUp
} from 'lucide-react';

// Product suites
const productSuites = [
    {
        id: 'improvement',
        name: 'Schoolgle Improvement',
        tagline: 'Ofsted & SIAMS Inspection Readiness',
        description: 'AI-powered inspection preparation with self-assessment, evidence mapping, and action planning.',
        icon: BarChart3,
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50',
        status: 'live',
        featured: true,
        href: '/dashboard',
        apps: [
            { name: 'Ofsted Framework', status: 'live', included: true },
            { name: 'SIAMS Framework', status: 'live', included: true },
            { name: 'Ed AI Coach', status: 'live', included: true },
            { name: 'Action Planning', status: 'live', included: true },
            { name: 'Mock Inspector', status: 'live', addon: true },
            { name: 'Voice Observation', status: 'live', addon: true },
            { name: 'One-Click Reports', status: 'live', addon: true },
        ],
        price: 'From £2,499/year'
    },
    {
        id: 'compliance',
        name: 'Schoolgle Compliance',
        tagline: 'Governance, Risk & Safeguarding',
        description: 'Complete compliance management - policies, risk registers, incident logging, and safeguarding.',
        icon: Shield,
        color: 'from-red-500 to-rose-600',
        bgColor: 'bg-red-50',
        status: 'coming-soon',
        href: '/compliance',
        apps: [
            { name: 'Policy Hub', status: 'development', description: 'Version control & staff acknowledgment' },
            { name: 'Risk Register', status: 'development', description: 'Track & mitigate risks' },
            { name: 'Incident Logger', status: 'development', description: 'Auto risk assessment' },
            { name: 'Safeguarding Hub', status: 'development', description: 'SCR & concern logging' },
            { name: 'Governor Portal', status: 'planned', description: 'Board papers & minutes' },
            { name: 'Website Monitor', status: 'beta', description: 'DfE/Ofsted compliance checker' },
        ],
        price: 'From £799/year'
    },
    {
        id: 'estates',
        name: 'Schoolgle Estates',
        tagline: 'Facilities & Energy Management',
        description: 'Monitor utilities, track maintenance, manage compliance, and report on carbon emissions.',
        icon: Building2,
        color: 'from-cyan-500 to-teal-600',
        bgColor: 'bg-cyan-50',
        status: 'coming-soon',
        href: '/estates',
        apps: [
            { name: 'Energy Dashboard', status: 'beta', description: 'Real-time utility monitoring' },
            { name: 'Estates Audit', status: 'beta', description: 'Facilities compliance' },
            { name: 'Carbon Reporting', status: 'development', description: 'DfE-compliant reporting' },
            { name: 'Maintenance Tracker', status: 'planned', description: 'Work orders & PPM' },
        ],
        price: 'From £449/year'
    },
    {
        id: 'hr',
        name: 'Schoolgle HR',
        tagline: 'People & Professional Development',
        description: 'Staff management, absence tracking, CPD recording, and recruitment tools.',
        icon: Users,
        color: 'from-purple-500 to-violet-600',
        bgColor: 'bg-purple-50',
        status: 'coming-soon',
        href: '/hr',
        apps: [
            { name: 'Staff Directory', status: 'development', description: 'Central staff database' },
            { name: 'CPD Tracker', status: 'development', description: 'Training & development' },
            { name: 'Leave Management', status: 'planned', description: 'Absence tracking' },
            { name: 'Minute Taker AI', status: 'beta', description: 'AI meeting minutes' },
        ],
        price: 'From £349/year'
    },
    {
        id: 'finance',
        name: 'Schoolgle Finance',
        tagline: 'Budgeting & Financial Planning',
        description: 'Multi-year budgets, Pupil Premium tracking, and CFR reporting.',
        icon: PoundSterling,
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-50',
        status: 'planned',
        href: '/finance',
        apps: [
            { name: 'Budget Planner', status: 'planned', description: '3-year forecasting' },
            { name: 'PP Tracker', status: 'planned', description: 'Pupil Premium impact' },
        ],
        price: 'Coming 2025'
    },
    {
        id: 'send',
        name: 'Schoolgle SEND',
        tagline: 'Special Needs & Inclusion',
        description: 'EHCP management, provision mapping, and progress tracking for SEND students.',
        icon: Heart,
        color: 'from-pink-500 to-rose-600',
        bgColor: 'bg-pink-50',
        status: 'planned',
        href: '/send',
        apps: [
            { name: 'SEND Tracker', status: 'planned', description: 'EHCP & provision mapping' },
        ],
        price: 'Coming 2025'
    },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'live':
            return { text: 'Live', bg: 'bg-green-100 text-green-700', icon: Check };
        case 'beta':
            return { text: 'Beta', bg: 'bg-blue-100 text-blue-700', icon: Zap };
        case 'development':
            return { text: 'In Development', bg: 'bg-yellow-100 text-yellow-700', icon: Clock };
        case 'planned':
            return { text: 'Planned', bg: 'bg-gray-100 text-gray-600', icon: Clock };
        case 'coming-soon':
            return { text: 'Coming Soon', bg: 'bg-amber-100 text-amber-700', icon: Sparkles };
        default:
            return { text: status, bg: 'bg-gray-100 text-gray-600', icon: Clock };
    }
};

export default function HomePage() {
    const router = useRouter();
    const [expandedSuite, setExpandedSuite] = useState<string | null>('improvement');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🏫</span>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Schoolgle</h1>
                                <p className="text-xs text-gray-500">AI-Powered School Management</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <a href="/login" className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900">
                                Sign In
                            </a>
                            <a href="/signup" className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800">
                                Get Started
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero */}
                <section className="bg-gradient-to-b from-white to-gray-50 py-16">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Now Live: Ofsted Framework with Ed AI Coach
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Everything your school needs.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                                One platform.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                            From inspection readiness to compliance, estates to HR — Schoolgle brings it all together with AI-powered tools built for UK schools.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <a 
                                href="/signup" 
                                className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 flex items-center gap-2"
                            >
                                Start with Improvement <ArrowRight className="w-5 h-5" />
                            </a>
                            <a 
                                href="/demo"
                                className="px-6 py-3 text-gray-700 font-semibold hover:text-gray-900"
                            >
                                Book a Demo
                            </a>
                        </div>
                    </div>
                </section>

                {/* Product Suites */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">The Schoolgle Suite</h2>
                            <p className="text-gray-600">Choose the products you need. Add more as you grow.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {productSuites.map(suite => {
                                const status = getStatusBadge(suite.status);
                                const isExpanded = expandedSuite === suite.id;
                                
                                return (
                                    <div 
                                        key={suite.id}
                                        className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                                            suite.featured 
                                                ? 'border-blue-200 shadow-lg shadow-blue-100' 
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {suite.featured && (
                                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center py-2 text-sm font-medium">
                                                🚀 Available Now — Start Your Free Trial
                                            </div>
                                        )}
                                        
                                        <div className="p-6">
                                            {/* Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${suite.color} flex items-center justify-center flex-shrink-0`}>
                                                    <suite.icon className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-xl font-bold text-gray-900">{suite.name}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg}`}>
                                                            {status.text}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{suite.tagline}</p>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm mb-4">{suite.description}</p>

                                            {/* Apps List */}
                                            <button 
                                                onClick={() => setExpandedSuite(isExpanded ? null : suite.id)}
                                                className="w-full text-left"
                                            >
                                                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {suite.apps.length} apps included
                                                    </span>
                                                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                                    {suite.apps.map((app, i) => {
                                                        const appStatus = getStatusBadge(app.status);
                                                        return (
                                                            <div key={i} className="flex items-center justify-between py-2">
                                                                <div className="flex items-center gap-2">
                                                                    {app.status === 'live' ? (
                                                                        <Check className="w-4 h-4 text-green-500" />
                                                                    ) : app.status === 'beta' ? (
                                                                        <Zap className="w-4 h-4 text-blue-500" />
                                                                    ) : (
                                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                                    )}
                                                                    <span className={`text-sm ${app.status === 'live' ? 'text-gray-900' : 'text-gray-500'}`}>
                                                                        {app.name}
                                                                    </span>
                                                                    {app.included && (
                                                                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Included</span>
                                                                    )}
                                                                    {app.addon && (
                                                                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Add-on</span>
                                                                    )}
                                                                </div>
                                                                <span className={`text-xs px-2 py-0.5 rounded ${appStatus.bg}`}>
                                                                    {appStatus.text}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Price & CTA */}
                                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                                                <span className="font-semibold text-gray-900">{suite.price}</span>
                                                {suite.status === 'live' ? (
                                                    <a 
                                                        href={suite.href}
                                                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                                                    >
                                                        Start Free Trial
                                                    </a>
                                                ) : suite.status === 'coming-soon' ? (
                                                    <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg cursor-default">
                                                        Notify Me
                                                    </button>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Coming Soon</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Why Schoolgle */}
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Schools Choose Schoolgle</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Globe className="w-7 h-7 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Built for UK Schools</h3>
                                <p className="text-gray-600 text-sm">
                                    Not generic software. Every feature designed around DfE, Ofsted, and UK education requirements.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp className="w-7 h-7 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Affordable for All</h3>
                                <p className="text-gray-600 text-sm">
                                    From single schools to large MATs. No per-user pricing traps. Transparent annual costs.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-7 h-7 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">AI That Actually Helps</h3>
                                <p className="text-gray-600 text-sm">
                                    Ed, your AI assistant, trained on EEF research and inspection frameworks. Not generic ChatGPT.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to simplify school management?
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Join schools across the UK who are saving hours every week with Schoolgle.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <a 
                                href="/signup"
                                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100"
                            >
                                Get Started Free
                            </a>
                            <a 
                                href="/contact-sales"
                                className="px-6 py-3 text-white font-semibold border border-white/30 rounded-xl hover:bg-white/10"
                            >
                                Talk to Sales
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🏫</span>
                            <span className="font-bold text-gray-900">Schoolgle</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            © 2025 Schoolgle Ltd. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
