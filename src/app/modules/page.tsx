"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart3, Shield, Building2, Users, PoundSterling, Heart,
    ChevronRight, Lock, Check, Zap, ArrowRight, ExternalLink,
    FileText, AlertTriangle, Wrench, Lightbulb
} from 'lucide-react';

// Module definitions
const modules = [
    {
        id: 'improvement',
        name: 'School Improvement',
        description: 'Ofsted & SIAMS inspection readiness with Ed AI',
        icon: BarChart3,
        color: 'blue',
        gradient: 'from-blue-500 to-indigo-600',
        status: 'active',
        href: '/dashboard',
        isPrimary: true,
        valueProps: [
            'Self-assessment against EIF 2025',
            'Action planning with deadlines',
            'Evidence mapping to judgement areas',
            'Ed AI coach for inspection prep'
        ]
    },
    {
        id: 'compliance',
        name: 'Compliance',
        description: 'Policies, statutory compliance & governance',
        icon: Shield,
        color: 'red',
        gradient: 'from-red-500 to-rose-600',
        status: 'available',
        href: '/modules/compliance',
        feedsInto: 'improvement',
        valueProps: [
            'Policy management with version control',
            'Staff acknowledgment tracking',
            'Auto-feeds into Ofsted evidence',
            'Never miss a review deadline'
        ],
        ofstedLink: 'Policies in our system = instant evidence for Leadership & Management'
    },
    {
        id: 'estates',
        name: 'Estates',
        description: 'Facilities, energy & statutory compliance',
        icon: Building2,
        color: 'cyan',
        gradient: 'from-cyan-500 to-teal-600',
        status: 'available',
        href: '/modules/estates',
        feedsInto: 'improvement',
        valueProps: [
            'DfE GEMS aligned compliance tracking',
            'Energy monitoring & carbon reporting',
            'Helpdesk for staff requests',
            'Auto-feeds H&S evidence to Ofsted'
        ],
        ofstedLink: 'Statutory compliance evidence feeds directly to Safeguarding judgement'
    },
    {
        id: 'hr',
        name: 'HR & People',
        description: 'Staff management, CPD & wellbeing',
        icon: Users,
        color: 'purple',
        gradient: 'from-purple-500 to-violet-600',
        status: 'coming-soon',
        href: '/modules/hr',
        feedsInto: 'improvement',
        valueProps: [
            'CPD tracking linked to school priorities',
            'Staff wellbeing monitoring',
            'Performance management',
            'Recruitment & onboarding'
        ],
        ofstedLink: 'CPD evidence feeds into Quality of Education & Leadership'
    },
    {
        id: 'finance',
        name: 'Finance',
        description: 'Budgets, Pupil Premium & sports premium',
        icon: PoundSterling,
        color: 'green',
        gradient: 'from-green-500 to-emerald-600',
        status: 'coming-soon',
        href: '/modules/finance',
        feedsInto: 'improvement',
        valueProps: [
            'Pupil Premium impact tracking',
            'Sports Premium reporting',
            'Budget planning & forecasting',
            'Auto-generate statutory reports'
        ],
        ofstedLink: 'PP & Sports Premium impact feeds directly to judgement evidence'
    },
    {
        id: 'send',
        name: 'SEND',
        description: 'Special needs tracking & provision mapping',
        icon: Heart,
        color: 'pink',
        gradient: 'from-pink-500 to-rose-600',
        status: 'coming-soon',
        href: '/modules/send',
        feedsInto: 'improvement',
        valueProps: [
            'EHCP management',
            'Provision mapping',
            'Progress tracking',
            'Funding allocation'
        ],
        ofstedLink: 'SEND provision evidence feeds into all judgement areas'
    }
];

export default function ModulesPage() {
    const router = useRouter();
    const [hoveredModule, setHoveredModule] = useState<string | null>(null);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>;
            case 'available':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Available</span>;
            case 'coming-soon':
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Coming Soon</span>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🏫</span>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Schoolgle Modules</h1>
                                <p className="text-sm text-gray-500">Your connected ecosystem</p>
                            </div>
                        </div>
                        <a href="/dashboard" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                            Back to Dashboard
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Value Proposition */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
                    <h2 className="text-2xl font-bold mb-3">The Schoolgle Ecosystem Advantage</h2>
                    <p className="text-blue-100 mb-6 max-w-3xl">
                        Every module feeds data into your School Improvement dashboard. Policies, compliance records, 
                        CPD logs, PP spend — it's all connected. When Ofsted arrives, your evidence is already organised. 
                        Staff can articulate <strong>what you have, why you have it, and the impact</strong>.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-xl p-4">
                            <FileText className="w-6 h-6 mb-2" />
                            <p className="font-medium">No More Folder Scanning</p>
                            <p className="text-sm text-blue-200">Data in Schoolgle = instant evidence</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4">
                            <AlertTriangle className="w-6 h-6 mb-2" />
                            <p className="font-medium">Never Non-Compliant</p>
                            <p className="text-sm text-blue-200">Auto-reminders before deadlines</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4">
                            <Check className="w-6 h-6 mb-2" />
                            <p className="font-medium">Staff Are Prepared</p>
                            <p className="text-sm text-blue-200">They know what's in the system</p>
                        </div>
                    </div>
                </div>

                {/* Ecosystem Diagram */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4 text-center">How It All Connects</h3>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {modules.filter(m => m.id !== 'improvement').map((module, i) => (
                            <div key={module.id} className="flex items-center">
                                <div className={`px-3 py-2 rounded-lg bg-gradient-to-r ${module.gradient} text-white text-sm font-medium`}>
                                    {module.name}
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                            </div>
                        ))}
                        <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold">
                            School Improvement → Ofsted Ready
                        </div>
                    </div>
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {modules.map(module => (
                        <div
                            key={module.id}
                            onMouseEnter={() => setHoveredModule(module.id)}
                            onMouseLeave={() => setHoveredModule(null)}
                            className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                                module.isPrimary 
                                    ? 'border-blue-300 shadow-lg shadow-blue-100' 
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                        >
                            {module.isPrimary && (
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center py-2 text-sm font-medium">
                                    ⭐ Core Module — Your Central Hub
                                </div>
                            )}
                            
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center`}>
                                            <module.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{module.name}</h3>
                                            <p className="text-sm text-gray-500">{module.description}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(module.status)}
                                </div>

                                {/* Value Props */}
                                <ul className="space-y-2 mb-4">
                                    {module.valueProps.map((prop, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            {prop}
                                        </li>
                                    ))}
                                </ul>

                                {/* Ofsted Link */}
                                {module.ofstedLink && (
                                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Ofsted Impact:</strong> {module.ofstedLink}
                                        </p>
                                    </div>
                                )}

                                {/* CTA */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    {module.feedsInto && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <ArrowRight className="w-3 h-3" />
                                            Feeds into School Improvement
                                        </span>
                                    )}
                                    {module.status === 'active' ? (
                                        <a 
                                            href={module.href}
                                            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 ml-auto"
                                        >
                                            Open Module
                                        </a>
                                    ) : module.status === 'available' ? (
                                        <a 
                                            href={module.href}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 ml-auto flex items-center gap-1"
                                        >
                                            <Zap className="w-4 h-4" /> Add Module
                                        </a>
                                    ) : (
                                        <button 
                                            disabled
                                            className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed ml-auto"
                                        >
                                            Coming Soon
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Sales Message */}
                <div className="mt-8 bg-gray-900 rounded-2xl p-8 text-white text-center">
                    <h3 className="text-xl font-bold mb-2">Start with School Improvement. Add modules as you need them.</h3>
                    <p className="text-gray-300 mb-4">
                        Each module is £199-499/year. Average school saves £3,000+ in consultant fees annually.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <a href="/signup" className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100">
                            Get Started
                        </a>
                        <a href="/contact-sales" className="px-6 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10">
                            Talk to Sales
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}

