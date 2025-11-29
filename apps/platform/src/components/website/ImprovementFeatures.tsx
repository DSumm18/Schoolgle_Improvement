"use client";

import React from 'react';
import { 
    FileCheck, BookOpen, CheckSquare, FileText, Mic, Search, 
    FileSpreadsheet, Eye, FolderOpen, MessageSquare, TrendingUp,
    BarChart2, Target, Sparkles, LucideIcon
} from 'lucide-react';

interface Feature {
    name: string;
    description: string;
    icon: LucideIcon;
    status: 'live' | 'beta' | 'development';
    category: 'core' | 'assessment' | 'reporting' | 'productivity';
}

const features: Feature[] = [
    // Core Assessment Tools
    {
        name: 'Ofsted Framework',
        description: 'Complete self-assessment against the latest Ofsted framework with evidence mapping and gap analysis.',
        icon: FileCheck,
        status: 'live',
        category: 'assessment'
    },
    {
        name: 'SIAMS Framework',
        description: 'Full SIAMS assessment for church schools with spiritual development tracking.',
        icon: BookOpen,
        status: 'live',
        category: 'assessment'
    },
    {
        name: 'Action Planning',
        description: 'Track improvement actions with Gantt charts, assignees, deadlines, and progress monitoring.',
        icon: CheckSquare,
        status: 'live',
        category: 'core'
    },
    {
        name: 'Actions Gantt Chart',
        description: 'Visual timeline view of all improvement actions with dependencies and milestones.',
        icon: BarChart2,
        status: 'live',
        category: 'productivity'
    },
    
    // Reporting & Documentation
    {
        name: 'SEF Generator',
        description: 'AI-powered Self-Evaluation Form generation with automatic evidence linking and narrative writing.',
        icon: FileText,
        status: 'live',
        category: 'reporting'
    },
    {
        name: 'One-Click Reports',
        description: 'Generate SEF, Pupil Premium Strategy, Sports Premium, SDP, and governor reports in seconds.',
        icon: FileSpreadsheet,
        status: 'live',
        category: 'reporting'
    },
    
    // Evidence & Analysis
    {
        name: 'Evidence Scanner',
        description: 'Scan local folders, OneDrive, and Google Drive to automatically map evidence to framework areas.',
        icon: FolderOpen,
        status: 'live',
        category: 'productivity'
    },
    {
        name: 'Evidence Analysis',
        description: 'AI analysis of your documents to identify strengths, gaps, and evidence quality across all areas.',
        icon: Search,
        status: 'live',
        category: 'productivity'
    },
    
    // Observations & Quality Assurance
    {
        name: 'Lesson Observations',
        description: 'Record and track lesson observations with structured feedback and improvement tracking.',
        icon: Eye,
        status: 'live',
        category: 'productivity'
    },
    {
        name: 'Voice Observations',
        description: 'Record observations hands-free using voice-to-text. Perfect for walkthroughs and quick notes.',
        icon: Mic,
        status: 'live',
        category: 'productivity'
    },
    
    // AI & Assistance
    {
        name: 'Ed AI Coach',
        description: 'Your AI assistant trained on EEF research and inspection frameworks. Ask questions, get guidance.',
        icon: MessageSquare,
        status: 'live',
        category: 'core'
    },
    {
        name: 'Mock Inspector',
        description: 'AI-powered inspection simulation that asks real inspector questions and provides feedback.',
        icon: Search,
        status: 'live',
        category: 'assessment'
    },
    
    // Analytics & Insights
    {
        name: 'Improvement Dashboard',
        description: 'Real-time overview of assessment status, action progress, evidence coverage, and key metrics.',
        icon: TrendingUp,
        status: 'live',
        category: 'core'
    },
];

const categoryLabels = {
    core: 'Core Features',
    assessment: 'Assessment Tools',
    reporting: 'Reporting & Documentation',
    productivity: 'Productivity Tools'
};

const statusColors = {
    live: 'bg-green-100 text-green-700 border-green-200',
    beta: 'bg-blue-100 text-blue-700 border-blue-200',
    development: 'bg-gray-100 text-gray-700 border-gray-200'
};

const ImprovementFeatures = () => {
    const featuresByCategory = features.reduce((acc, feature) => {
        if (!acc[feature.category]) {
            acc[feature.category] = [];
        }
        acc[feature.category].push(feature);
        return acc;
    }, {} as Record<string, Feature[]>);

    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                        Everything you need for inspection readiness
                    </h2>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                        Schoolgle Improvement includes all these features – no add-ons, no hidden costs. Everything works together seamlessly.
                    </p>
                </div>

                {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
                    <div key={category} className="mb-16">
                        <h3 className="text-2xl font-medium text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1 h-8 bg-pink-500 rounded-full"></span>
                            {categoryLabels[category as keyof typeof categoryLabels]}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categoryFeatures.map((feature, index) => {
                                const IconComponent = feature.icon;
                                return (
                                <div
                                    key={index}
                                    className="group p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-100 transition-colors">
                                            <IconComponent size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[feature.status]}`}>
                                                    {feature.status === 'live' ? 'Live' : feature.status === 'beta' ? 'Beta' : 'Coming Soon'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 text-center">
                    <h3 className="text-2xl font-medium text-gray-900 mb-4">
                        All features included. No add-ons required.
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        Every tool in Schoolgle Improvement is included in your subscription. Start using any feature immediately – no extra setup, no additional costs.
                    </p>
                    <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <CheckSquare size={16} className="text-green-600" />
                            <span>{features.filter(f => f.status === 'live').length} Live Features</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-pink-600" />
                            <span>Regular Updates</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Target size={16} className="text-purple-600" />
                            <span>Inspection Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ImprovementFeatures;

