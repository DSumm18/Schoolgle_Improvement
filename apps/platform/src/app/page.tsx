"use client";

import { useState } from 'react';
import {
    BarChart3, Shield, Building2, Users, PoundSterling, Heart,
    ChevronRight, Check, Zap, Clock
} from 'lucide-react';
import OrigamiParticles from '@/components/OrigamiParticles';
import Navbar from '@/components/website/Navbar';
import Hero from '@/components/website/Hero';
import ProblemStatement from '@/components/website/ProblemStatement';
import Differentiation from '@/components/website/Differentiation';
import HowItWorks from '@/components/website/HowItWorks';
import TrustSection from '@/components/website/TrustSection';
import PreviewModules from '@/components/website/PreviewModules';
import InsightsSection from '@/components/website/InsightsSection';
import EarlyAccessForm from '@/components/website/EarlyAccessForm';
import Footer from '@/components/website/Footer';

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
            { name: 'SEF Generator', status: 'live', included: true },
            { name: 'One-Click Reports', status: 'live', included: true },
            { name: 'Action Planning & Gantt', status: 'live', included: true },
            { name: 'Evidence Scanner', status: 'live', included: true },
            { name: 'Ed AI Coach', status: 'live', included: true },
            { name: 'Mock Inspector', status: 'live', included: true },
            { name: 'Voice Observations', status: 'live', included: true },
            { name: 'Lesson Observations', status: 'live', included: true },
            { name: 'Improvement Dashboard', status: 'live', included: true },
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
    const [expandedSuite, setExpandedSuite] = useState<string | null>('improvement');

    return (
        <div className="min-h-screen bg-white relative">
            {/* Origami Background - subtle branding */}
            <OrigamiParticles text="Schoolgle" opacity={0.15} shape="crane" position="top-left" size="medium" />

            {/* Website Navbar */}
            <Navbar />

            <main className="relative z-10 bg-white">
                {/* Hero Section */}
                <Hero />

                {/* Problem Statement */}
                <ProblemStatement />

                {/* What Makes Schoolgle Different */}
                <Differentiation />

                {/* How It Works */}
                <HowItWorks />

                {/* Trust Building */}
                <TrustSection />

                {/* What We're Building (Preview Mode) */}
                <section id="preview">
                    <PreviewModules />
                </section>

                {/* Insights / Thinking */}
                <InsightsSection />

                {/* Early Access Waitlist */}
                <EarlyAccessForm />

                {/* OLD SECTIONS BELOW - Hidden but preserved for future use */}
                <section className="hidden py-16 bg-gray-50">
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
                                        className={`bg-white rounded-2xl border transition-all overflow-hidden ${suite.featured
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
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isLive ? 'bg-green-100 text-green-700' :
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
                                                                {('included' in app && app.included) ? (
                                                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Core</span>
                                                                ) : null}
                                                                {('addon' in app && app.addon) ? (
                                                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Add-on</span>
                                                                ) : null}
                                                            </div>
                                                            <span className={`text-xs ${app.status === 'live' ? 'text-green-600' :
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

            </main>

            {/* Website Footer */}
            <Footer />
        </div>
    );
}
