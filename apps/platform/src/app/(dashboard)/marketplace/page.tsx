"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, ChevronRight, Star, Download, Check, Lock,
    Building2, Users, FileText, Shield, Zap, BarChart3,
    Leaf, ClipboardCheck, BookOpen, Globe, Mic, Heart,
    PoundSterling, Wrench, Calendar, AlertTriangle, Brain
} from 'lucide-react';

// Business Areas (Modules)
const businessAreas = [
    {
        id: 'school-improvement',
        name: 'School Improvement',
        description: 'Ofsted & SIAMS inspection readiness',
        icon: BarChart3,
        color: 'from-blue-500 to-indigo-600',
        featured: true
    },
    {
        id: 'compliance',
        name: 'Compliance & Governance',
        description: 'Policies, risk, safeguarding',
        icon: Shield,
        color: 'from-red-500 to-rose-600',
        featured: true
    },
    {
        id: 'estates',
        name: 'Estates & Facilities',
        description: 'Buildings, energy, maintenance',
        icon: Building2,
        color: 'from-cyan-500 to-teal-600'
    },
    {
        id: 'finance',
        name: 'Finance & Budget',
        description: 'Budgeting, reporting, procurement',
        icon: PoundSterling,
        color: 'from-green-500 to-emerald-600'
    },
    {
        id: 'hr',
        name: 'HR & People',
        description: 'Staff management, CPD, recruitment',
        icon: Users,
        color: 'from-purple-500 to-violet-600'
    },
    {
        id: 'teaching',
        name: 'Teaching & Learning',
        description: 'Lesson planning, resources',
        icon: BookOpen,
        color: 'from-amber-500 to-orange-600'
    },
    {
        id: 'send',
        name: 'SEND & Inclusion',
        description: 'Special needs tracking & support',
        icon: Heart,
        color: 'from-pink-500 to-rose-600'
    }
];

// Apps within each business area
const apps = [
    // School Improvement
    {
        id: 'ofsted-framework',
        name: 'Ofsted Framework',
        description: 'Full EIF self-assessment, evidence mapping & action planning',
        businessArea: 'school-improvement',
        icon: BarChart3,
        price: 0, // Included in core
        included: true,
        rating: 4.9,
        reviews: 127,
        features: ['Self-assessment', 'Evidence linking', 'Action planning', 'Progress tracking']
    },
    {
        id: 'siams-framework',
        name: 'SIAMS Framework',
        description: 'Church school inspection framework with full strand coverage',
        businessArea: 'school-improvement',
        icon: Star,
        price: 0,
        included: true,
        rating: 4.8,
        reviews: 43,
        features: ['7 strands', 'Self-evaluation', 'Action planning', 'Evidence mapping']
    },
    {
        id: 'ed-ai-coach',
        name: 'Ed AI Coach',
        description: 'AI assistant trained on Ofsted, EEF & education best practice',
        businessArea: 'school-improvement',
        icon: Brain,
        price: 0,
        included: true,
        rating: 4.9,
        reviews: 312,
        features: ['24/7 advice', 'EEF research', 'Inspection tips', 'Document review']
    },
    {
        id: 'mock-inspector',
        name: 'Mock Inspector',
        description: 'AI-powered inspection simulation with realistic questioning',
        businessArea: 'school-improvement',
        icon: ClipboardCheck,
        price: 199,
        rating: 4.7,
        reviews: 89,
        features: ['Deep dive simulation', 'Multiple personas', 'Feedback reports', 'Practice mode']
    },
    {
        id: 'voice-observation',
        name: 'Voice Observation',
        description: 'Record observations hands-free, AI structures the report',
        businessArea: 'school-improvement',
        icon: Mic,
        price: 199,
        rating: 4.8,
        reviews: 156,
        features: ['Voice recording', 'AI transcription', 'Auto-formatting', 'Ofsted alignment']
    },
    {
        id: 'one-click-reports',
        name: 'One-Click Reports',
        description: 'Generate SEF, SDP, Pupil Premium & Sports Premium reports instantly',
        businessArea: 'school-improvement',
        icon: FileText,
        price: 149,
        rating: 4.9,
        reviews: 234,
        features: ['SEF generation', 'SDP templates', 'PP reports', 'Export to Word']
    },

    // Compliance & Governance
    {
        id: 'policy-hub',
        name: 'Policy Hub',
        description: 'Manage, version & distribute school policies',
        businessArea: 'compliance',
        icon: FileText,
        price: 149,
        rating: 4.6,
        reviews: 78,
        features: ['Version control', 'Approval workflows', 'Staff acknowledgment', 'Review reminders']
    },
    {
        id: 'risk-register',
        name: 'Risk Register',
        description: 'Track, assess & mitigate organisational risks',
        businessArea: 'compliance',
        icon: AlertTriangle,
        price: 149,
        rating: 4.5,
        reviews: 45,
        features: ['Risk scoring', 'Mitigation tracking', 'Heat maps', 'Board reports']
    },
    {
        id: 'incident-logger',
        name: 'Incident Logger',
        description: 'Log incidents, auto-generate risk assessments & track follow-ups',
        businessArea: 'compliance',
        icon: Shield,
        price: 199,
        rating: 4.7,
        reviews: 67,
        features: ['Quick logging', 'Auto risk assessment', 'RIDDOR alerts', 'Trend analysis']
    },
    {
        id: 'safeguarding',
        name: 'Safeguarding Hub',
        description: 'SCR management, concern logging & training tracking',
        businessArea: 'compliance',
        icon: Shield,
        price: 249,
        rating: 4.9,
        reviews: 189,
        features: ['SCR tracker', 'Concern logging', 'Training records', 'DBS monitoring']
    },
    {
        id: 'gdpr-toolkit',
        name: 'GDPR Toolkit',
        description: 'Data protection compliance, SARs & breach management',
        businessArea: 'compliance',
        icon: Lock,
        price: 149,
        rating: 4.4,
        reviews: 34,
        features: ['SAR handling', 'Breach log', 'ROPA generator', 'Privacy notices']
    },
    {
        id: 'governor-portal',
        name: 'Governor Portal',
        description: 'Board meetings, papers, minutes & actions',
        businessArea: 'compliance',
        icon: Users,
        price: 199,
        rating: 4.6,
        reviews: 56,
        features: ['Meeting scheduler', 'Paper distribution', 'Action tracking', 'Attendance']
    },

    // Estates & Facilities
    {
        id: 'energy-dashboard',
        name: 'Energy Dashboard',
        description: 'Monitor utilities, track costs & carbon reporting',
        businessArea: 'estates',
        icon: Zap,
        price: 199,
        rating: 4.5,
        reviews: 23,
        features: ['Real-time monitoring', 'Cost tracking', 'Carbon reporting', 'Benchmark compare']
    },
    {
        id: 'estates-audit',
        name: 'Estates Audit',
        description: 'Facilities compliance checks & condition surveys',
        businessArea: 'estates',
        icon: ClipboardCheck,
        price: 199,
        rating: 4.4,
        reviews: 19,
        features: ['Compliance checks', 'Photo evidence', 'Action tracking', 'PDF reports']
    },
    {
        id: 'maintenance-tracker',
        name: 'Maintenance Tracker',
        description: 'Work orders, planned maintenance & contractor management',
        businessArea: 'estates',
        icon: Wrench,
        price: 149,
        rating: 4.3,
        reviews: 28,
        features: ['Work orders', 'PPM scheduling', 'Contractor log', 'Cost tracking']
    },
    {
        id: 'carbon-reporting',
        name: 'Carbon Reporting',
        description: 'DfE-compliant carbon emissions tracking & reporting',
        businessArea: 'estates',
        icon: Leaf,
        price: 99,
        rating: 4.6,
        reviews: 15,
        features: ['Scope 1, 2, 3', 'DfE templates', 'Reduction targets', 'Action plans']
    },

    // Finance
    {
        id: 'budget-planner',
        name: 'Budget Planner',
        description: 'Multi-year budgeting, forecasting & scenario planning',
        businessArea: 'finance',
        icon: PoundSterling,
        price: 299,
        rating: 4.5,
        reviews: 34,
        features: ['3-year forecast', 'Scenarios', 'Cost centres', 'CFR reporting']
    },
    {
        id: 'pupil-premium-tracker',
        name: 'PP Tracker',
        description: 'Pupil Premium spending, impact tracking & reporting',
        businessArea: 'finance',
        icon: BarChart3,
        price: 149,
        rating: 4.7,
        reviews: 89,
        features: ['Spend tracking', 'Impact measures', 'Strategy builder', 'Annual report']
    },

    // HR & People
    {
        id: 'hr-hub',
        name: 'HR Hub',
        description: 'Staff records, absence tracking & performance management',
        businessArea: 'hr',
        icon: Users,
        price: 249,
        rating: 4.4,
        reviews: 45,
        features: ['Staff database', 'Absence tracking', 'Appraisals', 'Contract management']
    },
    {
        id: 'cpd-tracker',
        name: 'CPD Tracker',
        description: 'Professional development planning & training records',
        businessArea: 'hr',
        icon: BookOpen,
        price: 99,
        rating: 4.6,
        reviews: 67,
        features: ['Training log', 'Needs analysis', 'Cost tracking', 'Certificates']
    },
    {
        id: 'minute-taker',
        name: 'Minute Taker AI',
        description: 'AI-powered meeting minutes from audio or notes',
        businessArea: 'hr',
        icon: Mic,
        price: 99,
        rating: 4.8,
        reviews: 123,
        features: ['Voice to text', 'Action extraction', 'Templates', 'Distribution']
    },

    // Teaching & Learning
    {
        id: 'lesson-planner',
        name: 'Lesson Planner',
        description: 'AI-assisted lesson planning with curriculum alignment',
        businessArea: 'teaching',
        icon: BookOpen,
        price: 99,
        rating: 4.5,
        reviews: 234,
        features: ['AI suggestions', 'Curriculum links', 'Differentiation', 'Resource library']
    },

    // SEND
    {
        id: 'send-tracker',
        name: 'SEND Tracker',
        description: 'EHCP management, provision mapping & progress tracking',
        businessArea: 'send',
        icon: Heart,
        price: 249,
        rating: 4.7,
        reviews: 78,
        features: ['EHCP tracker', 'Provision map', 'Progress reports', 'Funding tracker']
    },

    // Website
    {
        id: 'website-monitor',
        name: 'Website Monitor',
        description: 'DfE & Ofsted website compliance checker',
        businessArea: 'compliance',
        icon: Globe,
        price: 99,
        rating: 4.3,
        reviews: 45,
        features: ['Auto scanning', 'Requirement checker', 'Fix suggestions', 'Monthly reports']
    }
];

// Bundles
const bundles = [
    {
        id: 'sbm-complete',
        name: 'SBM Complete',
        description: 'Everything a School Business Manager needs',
        apps: ['policy-hub', 'risk-register', 'incident-logger', 'hr-hub', 'budget-planner', 'estates-audit', 'gdpr-toolkit'],
        originalPrice: 1443,
        bundlePrice: 999,
        savings: 444
    },
    {
        id: 'compliance-suite',
        name: 'Compliance Suite',
        description: 'Full governance & compliance coverage',
        apps: ['policy-hub', 'risk-register', 'incident-logger', 'safeguarding', 'gdpr-toolkit', 'governor-portal', 'website-monitor'],
        originalPrice: 1193,
        bundlePrice: 799,
        savings: 394
    },
    {
        id: 'estates-suite',
        name: 'Estates Suite',
        description: 'Complete facilities management',
        apps: ['energy-dashboard', 'estates-audit', 'maintenance-tracker', 'carbon-reporting'],
        originalPrice: 646,
        bundlePrice: 449,
        savings: 197
    }
];

export default function MarketplacePage() {
    const router = useRouter();
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<string[]>([]);

    const filteredApps = apps.filter(app => {
        const matchesArea = !selectedArea || app.businessArea === selectedArea;
        const matchesSearch = !searchQuery || 
            app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesArea && matchesSearch;
    });

    const addToCart = (appId: string) => {
        if (!cart.includes(appId)) {
            setCart([...cart, appId]);
        }
    };

    const cartTotal = cart.reduce((sum, id) => {
        const app = apps.find(a => a.id === id);
        return sum + (app?.price || 0);
    }, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">🏫</span>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">App Store</h1>
                                <p className="text-sm text-gray-500">Extend your Schoolgle</p>
                            </div>
                        </div>
                        
                        {/* Search */}
                        <div className="flex-1 max-w-md mx-8">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search apps..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Cart */}
                        {cart.length > 0 && (
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full">
                                <span>{cart.length} apps</span>
                                <span className="font-bold">£{cartTotal}/yr</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Business Areas */}
                <section className="mb-12">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Area</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        <button
                            onClick={() => setSelectedArea(null)}
                            className={`p-4 rounded-2xl text-center transition-all ${
                                !selectedArea 
                                    ? 'bg-gray-900 text-white' 
                                    : 'bg-white border border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium">All Apps</span>
                        </button>
                        {businessAreas.map(area => (
                            <button
                                key={area.id}
                                onClick={() => setSelectedArea(area.id)}
                                className={`p-4 rounded-2xl text-center transition-all ${
                                    selectedArea === area.id 
                                        ? 'bg-gray-900 text-white' 
                                        : 'bg-white border border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${area.color} flex items-center justify-center`}>
                                    <area.icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-medium">{area.name.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Featured Bundles */}
                {!selectedArea && !searchQuery && (
                    <section className="mb-12">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 Bundles - Save More</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {bundles.map(bundle => (
                                <div key={bundle.id} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{bundle.name}</h3>
                                            <p className="text-sm text-gray-500">{bundle.apps.length} apps included</p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                            Save £{bundle.savings}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">{bundle.description}</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span className="text-2xl font-bold text-gray-900">£{bundle.bundlePrice}</span>
                                            <span className="text-gray-500">/year</span>
                                            <p className="text-sm text-gray-400 line-through">£{bundle.originalPrice}/year</p>
                                        </div>
                                        <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
                                            Add Bundle
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Apps Grid */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {selectedArea 
                                ? businessAreas.find(a => a.id === selectedArea)?.name 
                                : 'All Apps'
                            }
                        </h2>
                        <span className="text-sm text-gray-500">{filteredApps.length} apps</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredApps.map(app => {
                            const area = businessAreas.find(a => a.id === app.businessArea);
                            const inCart = cart.includes(app.id);
                            
                            return (
                                <div 
                                    key={app.id} 
                                    className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${area?.color} flex items-center justify-center flex-shrink-0`}>
                                            <app.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{app.description}</p>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="text-sm font-medium text-gray-900">{app.rating}</span>
                                        </div>
                                        <span className="text-sm text-gray-400">({app.reviews} reviews)</span>
                                    </div>

                                    {/* Features */}
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {app.features.slice(0, 3).map((feature, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Price & Action */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        {app.included ? (
                                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                <Check className="w-4 h-4" /> Included
                                            </span>
                                        ) : (
                                            <div>
                                                <span className="text-lg font-bold text-gray-900">£{app.price}</span>
                                                <span className="text-gray-500 text-sm">/year</span>
                                            </div>
                                        )}
                                        
                                        {app.included ? (
                                            <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                                                Open
                                            </button>
                                        ) : inCart ? (
                                            <button className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg flex items-center gap-1">
                                                <Check className="w-4 h-4" /> Added
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => addToCart(app.id)}
                                                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* Sticky Cart */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{cart.length} apps selected</p>
                            <p className="text-2xl font-bold text-gray-900">£{cartTotal}<span className="text-base font-normal text-gray-500">/year</span></p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setCart([])}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                Clear
                            </button>
                            <button className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800">
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

