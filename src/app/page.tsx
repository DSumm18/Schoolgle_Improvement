"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart3, Shield, Building2, Users, PoundSterling, Heart,
    ChevronRight, Check, ArrowRight, Zap, Globe, Clock
} from 'lucide-react';
import OrigamiParticles from '@/components/OrigamiParticles';
import Logo from '@/components/Logo';
import SchoolgleAnimatedLogo from '@/components/SchoolgleAnimatedLogo';

// Product suites with clean styling
const productSuites = [
    {
        id: 'improvement',
        name: 'Schoolgle Improvement',
        tagline: 'Ofsted & SIAMS Inspection Readiness',
        description: 'AI-powered inspection preparation with self-assessment, evidence mapping, and action planning.',
        icon: BarChart3,
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
        description: 'Policy management, risk registers, incident logging, and safeguarding compliance.',
        icon: Shield,
        status: 'coming-soon',
        href: '/modules/compliance',
        apps: [
            { name: 'Policy Hub', status: 'development' },
            { name: 'Risk Register', status: 'development' },
            { name: 'Incident Logger', status: 'development' },
            { name: 'Safeguarding Hub', status: 'development' },
            { name: 'Governor Portal', status: 'planned' },
        ],
        price: 'From £799/year'
    },
    {
        id: 'estates',
        name: 'Schoolgle Estates',
        tagline: 'Facilities & Energy Management',
        description: 'Monitor utilities, track maintenance, and manage statutory compliance.',
        icon: Building2,
        status: 'coming-soon',
        href: '/modules/estates',
        apps: [
            { name: 'Energy Dashboard', status: 'beta' },
            { name: 'Estates Audit', status: 'beta' },
            { name: 'Helpdesk Tickets', status: 'development' },
            { name: 'Carbon Reporting', status: 'planned' },
        ],
        price: 'From £449/year'
    },
    {
        id: 'hr',
        name: 'Schoolgle HR',
        tagline: 'People & Professional Development',
        description: 'Staff management, absence tracking, CPD recording, and recruitment.',
        icon: Users,
        status: 'planned',
        href: '/hr',
        apps: [
            { name: 'Staff Directory', status: 'planned' },
            { name: 'CPD Tracker', status: 'planned' },
            { name: 'Leave Management', status: 'planned' },
        ],
        price: 'From £349/year'
    },
    {
        id: 'finance',
        name: 'Schoolgle Finance',
        tagline: 'Budgeting & Financial Planning',
        description: 'Multi-year budgets, Pupil Premium tracking, and CFR reporting.',
        icon: PoundSterling,
        status: 'planned',
        href: '/finance',
        apps: [
            { name: 'Budget Planner', status: 'planned' },
            { name: 'PP Tracker', status: 'planned' },
        ],
        price: 'Coming 2025'
    },
    {
        id: 'send',
        name: 'Schoolgle SEND',
        tagline: 'Special Needs & Inclusion',
        description: 'EHCP management, provision mapping, and progress tracking.',
        icon: Heart,
        status: 'planned',
        href: '/send',
        apps: [
            { name: 'SEND Tracker', status: 'planned' },
        ],
        price: 'Coming 2025'
    },
];

export default function HomePage() {
    const router = useRouter();
    const [expandedSuite, setExpandedSuite] = useState<string | null>('improvement');

    return (
        <div className="min-h-screen bg-white relative">
            {/* Origami Background - Logo in top-left */}
            <OrigamiParticles text="Schoolgle" opacity={0.2} shape="crane" position="top-left" size="medium" />
            
            {/* Header */}
            <header className="relative z-10 border-b border-gray-100 bg-white/95 backdrop-blur-sm overflow-visible">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-between h-24">
                        <div className="flex items-center relative" style={{ minHeight: '96px' }}>
                            {/* Container for logo text - center point for orbits */}
                            <a href="/dashboard" className="relative z-10 flex items-center justify-center" style={{ width: '140px', position: 'relative' }}>
                                <span className="text-2xl font-semibold text-gray-900 whitespace-nowrap">
                                    Schoolgle
                                </span>
                                {/* Animated planets orbiting around the center of "Schoolgle" text */}
                                <div 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible pointer-events-none" 
                                    style={{ 
                                        width: 300, 
                                        height: 300
                                    }}
                                >
                                    <SchoolgleAnimatedLogo size={300} showText={false} />
                                </div>
                            </a>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="/login" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
                                Sign In
                            </a>
                            <a href="/signup" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
                                Get Started
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 bg-white">
                {/* Hero */}
                <section className="py-20">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm font-medium mb-8">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Now Live: Ofsted Framework with Ed AI Coach
                        </div>
                        <h1 className="text-5xl md:text-6xl font-medium text-gray-900 tracking-tight mb-6">
                            Everything your school needs.
                            <br />
                            <span className="text-gray-400">One platform.</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
                            From inspection readiness to compliance, estates to HR — Schoolgle brings it all together with AI-powered tools built for UK schools.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <a 
                                href="/signup" 
                                className="px-8 py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 flex items-center gap-2 transition-colors"
                            >
                                Start with Improvement <ArrowRight className="w-5 h-5" />
                            </a>
                            <a 
                                href="/demo"
                                className="px-8 py-4 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                            >
                                Book a Demo
                            </a>
                        </div>
                    </div>
                </section>

                {/* Product Suites */}
                <section className="py-16 bg-gray-50">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-medium text-gray-900 mb-3">The Schoolgle Suite</h2>
                            <p className="text-gray-500">Choose the products you need. Add more as you grow.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {productSuites.map(suite => {
                                const isExpanded = expandedSuite === suite.id;
                                const isLive = suite.status === 'live';
                                
                                return (
                                    <div 
                                        key={suite.id}
                                        className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                                            suite.featured 
                                                ? 'border-gray-900 shadow-sm' 
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {suite.featured && (
                                            <div className="bg-gray-900 text-white text-center py-2 text-sm font-medium">
                                                Available Now
                                            </div>
                                        )}
                                        
                                        <div className="p-6">
                                            {/* Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <suite.icon className="w-6 h-6 text-gray-700" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-semibold text-gray-900">{suite.name}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            isLive ? 'bg-green-100 text-green-700' :
                                                            suite.status === 'coming-soon' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {isLive ? 'Live' : suite.status === 'coming-soon' ? 'Coming Soon' : 'Planned'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{suite.tagline}</p>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm mb-4">{suite.description}</p>

                                            {/* Apps List Toggle */}
                                            <button 
                                                onClick={() => setExpandedSuite(isExpanded ? null : suite.id)}
                                                className="w-full text-left"
                                            >
                                                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                                    <span className="text-sm text-gray-600">
                                                        {suite.apps.length} apps included
                                                    </span>
                                                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                                    {suite.apps.map((app, i) => (
                                                        <div key={i} className="flex items-center justify-between py-1.5">
                                                            <div className="flex items-center gap-2">
                                                                {app.status === 'live' ? (
                                                                    <Check className="w-4 h-4 text-gray-700" />
                                                                ) : app.status === 'beta' ? (
                                                                    <Zap className="w-4 h-4 text-gray-500" />
                                                                ) : (
                                                                    <Clock className="w-4 h-4 text-gray-300" />
                                                                )}
                                                                <span className={`text-sm ${app.status === 'live' ? 'text-gray-900' : 'text-gray-500'}`}>
                                                                    {app.name}
                                                                </span>
                                                                {app.included && (
                                                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Core</span>
                                                                )}
                                                                {app.addon && (
                                                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Add-on</span>
                                                                )}
                                                            </div>
                                                            <span className={`text-xs ${
                                                                app.status === 'live' ? 'text-green-600' :
                                                                app.status === 'beta' ? 'text-gray-500' :
                                                                'text-gray-400'
                                                            }`}>
                                                                {app.status === 'live' ? '●' : app.status === 'beta' ? 'Beta' : ''}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Price & CTA */}
                                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                                                <span className="font-medium text-gray-900">{suite.price}</span>
                                                {isLive ? (
                                                    <a 
                                                        href={suite.href}
                                                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                                                    >
                                                        Get Started
                                                    </a>
                                                ) : suite.status === 'coming-soon' ? (
                                                    <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
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
                <section className="py-20 bg-white">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-medium text-gray-900">Why Schools Choose Schoolgle</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="text-center">
                                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <Globe className="w-6 h-6 text-gray-700" />
                                </div>
                                <h3 className="font-medium text-gray-900 mb-2">Built for UK Schools</h3>
                                <p className="text-gray-500 text-sm">
                                    Every feature designed around DfE, Ofsted, and UK education requirements.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <PoundSterling className="w-6 h-6 text-gray-700" />
                                </div>
                                <h3 className="font-medium text-gray-900 mb-2">Affordable for All</h3>
                                <p className="text-gray-500 text-sm">
                                    From single schools to large MATs. No per-user pricing. Transparent annual costs.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <Zap className="w-6 h-6 text-gray-700" />
                                </div>
                                <h3 className="font-medium text-gray-900 mb-2">AI That Actually Helps</h3>
                                <p className="text-gray-500 text-sm">
                                    Ed, your AI assistant, trained on EEF research and inspection frameworks.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-gray-900">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <h2 className="text-3xl font-medium text-white mb-4">
                            Ready to simplify school management?
                        </h2>
                        <p className="text-gray-400 mb-10">
                            Join schools across the UK who are saving hours every week.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <a 
                                href="/signup"
                                className="px-8 py-4 bg-white text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Get Started Free
                            </a>
                            <a 
                                href="/contact"
                                className="px-8 py-4 text-white font-medium border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                Talk to Sales
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative z-10 bg-white border-t border-gray-100 py-8">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <Logo size="sm" />
                        <p className="text-sm text-gray-400">
                            © 2025 Schoolgle Ltd. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
