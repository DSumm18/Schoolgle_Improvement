"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BarChart3, Shield, Building2, Users, PoundSterling, Heart,
    ChevronRight, ArrowRight, Check, Sparkles
} from 'lucide-react';
import OrigamiParticles from '@/components/OrigamiParticles';
import Logo from '@/components/Logo';

// Module definitions
const modules = [
    {
        id: 'improvement',
        name: 'School Improvement',
        description: 'Ofsted & SIAMS inspection readiness with Ed AI',
        icon: BarChart3,
        status: 'active',
        href: '/dashboard',
        isPrimary: true,
        features: [
            'Self-assessment against EIF 2025',
            'Action planning with deadlines',
            'Evidence mapping to judgement areas',
            'Ed AI coach for inspection prep'
        ],
        ofstedLink: 'Your central hub for inspection readiness'
    },
    {
        id: 'compliance',
        name: 'Compliance',
        description: 'Policies, statutory compliance & governance',
        icon: Shield,
        status: 'available',
        href: '/modules/compliance',
        features: [
            'Policy management with version control',
            'Staff acknowledgment tracking',
            'Auto-feeds into Ofsted evidence',
            'Never miss a review deadline'
        ],
        ofstedLink: 'Policies in system = instant Leadership & Management evidence'
    },
    {
        id: 'estates',
        name: 'Estates',
        description: 'Facilities, energy & statutory compliance',
        icon: Building2,
        status: 'available',
        href: '/modules/estates',
        features: [
            'DfE GEMS aligned compliance',
            'Energy monitoring & carbon reporting',
            'Helpdesk for staff requests',
            'Auto-feeds H&S evidence'
        ],
        ofstedLink: 'Statutory compliance feeds directly to Safeguarding'
    },
    {
        id: 'hr',
        name: 'HR & People',
        description: 'Staff management, CPD & wellbeing',
        icon: Users,
        status: 'coming-soon',
        href: '/modules/hr',
        features: [
            'CPD tracking linked to priorities',
            'Staff wellbeing monitoring',
            'Performance management',
            'Recruitment & onboarding'
        ],
        ofstedLink: 'CPD evidence feeds into Quality of Education'
    },
    {
        id: 'finance',
        name: 'Finance',
        description: 'Budgets, Pupil Premium & sports premium',
        icon: PoundSterling,
        status: 'coming-soon',
        href: '/modules/finance',
        features: [
            'Pupil Premium impact tracking',
            'Sports Premium reporting',
            'Budget planning & forecasting',
            'Auto-generate statutory reports'
        ],
        ofstedLink: 'PP & Sports Premium impact feeds to judgement evidence'
    },
    {
        id: 'send',
        name: 'SEND',
        description: 'Special needs tracking & provision mapping',
        icon: Heart,
        status: 'coming-soon',
        href: '/modules/send',
        features: [
            'EHCP management',
            'Provision mapping',
            'Progress tracking',
            'Funding allocation'
        ],
        ofstedLink: 'SEND provision feeds into all judgement areas'
    }
];

export default function ModulesPage() {
    const [hoveredModule, setHoveredModule] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-white relative">
            {/* Origami Particle Background */}
            <OrigamiParticles text="Modules" opacity={0.3} shape="crane" />
            
            {/* Header */}
            <header className="relative z-10 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/dashboard">
                        <Logo size="md" />
                    </Link>
                    <Link 
                        href="/dashboard"
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
                {/* Hero Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium mb-6">
                        Your connected ecosystem
                    </span>
                    <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-gray-900 mb-6">
                        Everything feeds into<br />
                        <span className="text-gray-400">School Improvement</span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        Policies, compliance records, CPD logs, PP spend — it's all connected. 
                        When Ofsted arrives, your evidence is already organised.
                    </p>
                </motion.div>

                {/* Flow Diagram */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex items-center justify-center gap-2 mb-20 flex-wrap"
                >
                    {['Compliance', 'Estates', 'HR', 'Finance', 'SEND'].map((name, i) => (
                        <div key={name} className="flex items-center">
                            <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                                {name}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-300 mx-1" />
                        </div>
                    ))}
                    <span className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium">
                        School Improvement → Ofsted Ready
                    </span>
                </motion.div>

                {/* Primary Module */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-8"
                >
                    <Link href="/dashboard">
                        <div className="bg-gray-50 rounded-3xl p-8 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center">
                                        <BarChart3 className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-900">School Improvement</h2>
                                        <p className="text-gray-500">Ofsted & SIAMS inspection readiness with Ed AI</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-medium">
                                    Active
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {modules[0].features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-600">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Your central hub for inspection readiness</span>
                                <span className="flex items-center gap-2 text-gray-900 font-medium">
                                    Open Module <ChevronRight className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.slice(1).map((module, index) => (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 + (index * 0.05) }}
                            onMouseEnter={() => setHoveredModule(module.id)}
                            onMouseLeave={() => setHoveredModule(null)}
                        >
                            <Link href={module.status !== 'coming-soon' ? module.href : '#'}>
                                <div className={`
                                    bg-white rounded-2xl p-6 border border-gray-100 
                                    transition-all duration-300 h-full
                                    ${module.status !== 'coming-soon' ? 'hover:border-gray-200 hover:shadow-lg cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                                `}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                            <module.icon className="w-6 h-6 text-gray-700" />
                                        </div>
                                        <span className={`
                                            px-2 py-1 rounded-full text-xs font-medium
                                            ${module.status === 'available' ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'}
                                        `}>
                                            {module.status === 'available' ? 'Available' : 'Coming Soon'}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{module.name}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{module.description}</p>
                                    
                                    <ul className="space-y-2 mb-4">
                                        {module.features.slice(0, 3).map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <Check className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                                                <span className="text-xs text-gray-500">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    {module.status === 'available' && (
                                        <div className="pt-4 border-t border-gray-50">
                                            <span className="flex items-center gap-1 text-sm text-gray-700 font-medium">
                                                <Sparkles className="w-4 h-4" />
                                                Add Module
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-20 text-center"
                >
                    <div className="bg-gray-900 rounded-3xl p-12 text-center">
                        <h2 className="text-2xl font-medium text-white mb-3">
                            Start with School Improvement. Add modules as you need them.
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Each module is £199-499/year. Average school saves £3,000+ in consultant fees annually.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link 
                                href="/signup"
                                className="px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors"
                            >
                                Get Started
                            </Link>
                            <Link 
                                href="/contact"
                                className="px-8 py-4 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-colors"
                            >
                                Talk to Sales
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
