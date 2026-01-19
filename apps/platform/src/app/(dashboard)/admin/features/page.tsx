"use client";

import { useState } from 'react';
import {
    BarChart3, Shield, Building2, Users, PoundSterling, Heart,
    Check, X, AlertTriangle, Eye, EyeOff, Settings, RefreshCw,
    Globe, Zap, Clock, Power, ChevronDown, ChevronRight
} from 'lucide-react';

interface AppFeature {
    id: string;
    name: string;
    suite: string;
    status: 'live' | 'beta' | 'development' | 'disabled' | 'maintenance';
    enabled: boolean;
    visibleToUsers: boolean;
    description: string;
    lastUpdated: string;
    errorRate?: number;
    usageCount?: number;
}

// Feature flags data
const initialFeatures: AppFeature[] = [
    // Schoolgle Improvement
    { id: 'ofsted-framework', name: 'Ofsted Framework', suite: 'improvement', status: 'live', enabled: true, visibleToUsers: true, description: 'Full EIF self-assessment', lastUpdated: '2025-11-27', usageCount: 1247 },
    { id: 'siams-framework', name: 'SIAMS Framework', suite: 'improvement', status: 'live', enabled: true, visibleToUsers: true, description: 'Church school inspection', lastUpdated: '2025-11-27', usageCount: 432 },
    { id: 'ed-ai-coach', name: 'Ed AI Coach', suite: 'improvement', status: 'live', enabled: true, visibleToUsers: true, description: 'AI assistant', lastUpdated: '2025-11-27', usageCount: 3891 },
    { id: 'action-planning', name: 'Action Planning', suite: 'improvement', status: 'live', enabled: true, visibleToUsers: true, description: 'Track improvement actions', lastUpdated: '2025-11-27', usageCount: 2156 },
    { id: 'mock-inspector', name: 'Mock Inspector', suite: 'improvement', status: 'live', enabled: true, visibleToUsers: true, description: 'AI inspection simulation', lastUpdated: '2025-11-27', usageCount: 567 },
    { id: 'voice-observation', name: 'Voice Observation', suite: 'improvement', status: 'live', enabled: true, visibleToUsers: true, description: 'Voice-to-report', lastUpdated: '2025-11-27', usageCount: 234 },
    { id: 'one-click-reports', name: 'One-Click Reports', suite: 'improvement', status: 'live', enabled: true, visibleToUsers: true, description: 'Generate SEF, SDP', lastUpdated: '2025-11-27', usageCount: 892 },
    
    // Schoolgle Compliance
    { id: 'policy-hub', name: 'Policy Hub', suite: 'compliance', status: 'development', enabled: false, visibleToUsers: true, description: 'Policy management', lastUpdated: '2025-11-20' },
    { id: 'risk-register', name: 'Risk Register', suite: 'compliance', status: 'development', enabled: false, visibleToUsers: true, description: 'Risk tracking', lastUpdated: '2025-11-20' },
    { id: 'incident-logger', name: 'Incident Logger', suite: 'compliance', status: 'development', enabled: false, visibleToUsers: true, description: 'Log & track incidents', lastUpdated: '2025-11-20' },
    { id: 'safeguarding', name: 'Safeguarding Hub', suite: 'compliance', status: 'development', enabled: false, visibleToUsers: true, description: 'SCR & concerns', lastUpdated: '2025-11-20' },
    { id: 'website-monitor', name: 'Website Monitor', suite: 'compliance', status: 'beta', enabled: true, visibleToUsers: true, description: 'Compliance checker', lastUpdated: '2025-11-25', usageCount: 45, errorRate: 2.3 },
    { id: 'governor-portal', name: 'Governor Portal', suite: 'compliance', status: 'development', enabled: false, visibleToUsers: false, description: 'Board meetings', lastUpdated: '2025-11-15' },
    
    // Schoolgle Estates
    { id: 'energy-dashboard', name: 'Energy Dashboard', suite: 'estates', status: 'beta', enabled: true, visibleToUsers: true, description: 'Utility monitoring', lastUpdated: '2025-11-26', usageCount: 78, errorRate: 0.5 },
    { id: 'estates-audit', name: 'Estates Audit', suite: 'estates', status: 'beta', enabled: true, visibleToUsers: true, description: 'Facilities compliance', lastUpdated: '2025-11-26', usageCount: 34 },
    { id: 'carbon-reporting', name: 'Carbon Reporting', suite: 'estates', status: 'development', enabled: false, visibleToUsers: true, description: 'DfE carbon reports', lastUpdated: '2025-11-20' },
    { id: 'maintenance-tracker', name: 'Maintenance Tracker', suite: 'estates', status: 'development', enabled: false, visibleToUsers: false, description: 'Work orders', lastUpdated: '2025-11-15' },
    
    // Schoolgle HR
    { id: 'staff-directory', name: 'Staff Directory', suite: 'hr', status: 'development', enabled: false, visibleToUsers: true, description: 'Staff database', lastUpdated: '2025-11-20' },
    { id: 'cpd-tracker', name: 'CPD Tracker', suite: 'hr', status: 'development', enabled: false, visibleToUsers: true, description: 'Training records', lastUpdated: '2025-11-20' },
    { id: 'minute-taker', name: 'Minute Taker AI', suite: 'hr', status: 'beta', enabled: true, visibleToUsers: true, description: 'AI meeting minutes', lastUpdated: '2025-11-25', usageCount: 23 },
    { id: 'leave-management', name: 'Leave Management', suite: 'hr', status: 'development', enabled: false, visibleToUsers: false, description: 'Absence tracking', lastUpdated: '2025-11-15' },
];

const suites = [
    { id: 'improvement', name: 'Schoolgle Improvement', icon: BarChart3, color: 'blue' },
    { id: 'compliance', name: 'Schoolgle Compliance', icon: Shield, color: 'red' },
    { id: 'estates', name: 'Schoolgle Estates', icon: Building2, color: 'cyan' },
    { id: 'hr', name: 'Schoolgle HR', icon: Users, color: 'purple' },
];

export default function FeatureFlagsPage() {
    const [features, setFeatures] = useState<AppFeature[]>(initialFeatures);
    const [expandedSuites, setExpandedSuites] = useState<string[]>(['improvement', 'compliance', 'estates', 'hr']);
    const [saving, setSaving] = useState<string | null>(null);

    const toggleEnabled = async (featureId: string) => {
        setSaving(featureId);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setFeatures(prev => prev.map(f => 
            f.id === featureId ? { ...f, enabled: !f.enabled } : f
        ));
        setSaving(null);
    };

    const toggleVisibility = async (featureId: string) => {
        setSaving(featureId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setFeatures(prev => prev.map(f => 
            f.id === featureId ? { ...f, visibleToUsers: !f.visibleToUsers } : f
        ));
        setSaving(null);
    };

    const setStatus = async (featureId: string, newStatus: AppFeature['status']) => {
        setSaving(featureId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setFeatures(prev => prev.map(f => 
            f.id === featureId ? { ...f, status: newStatus } : f
        ));
        setSaving(null);
    };

    const toggleSuite = (suiteId: string) => {
        setExpandedSuites(prev => 
            prev.includes(suiteId) 
                ? prev.filter(s => s !== suiteId)
                : [...prev, suiteId]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live': return 'bg-green-100 text-green-700';
            case 'beta': return 'bg-blue-100 text-blue-700';
            case 'development': return 'bg-yellow-100 text-yellow-700';
            case 'disabled': return 'bg-red-100 text-red-700';
            case 'maintenance': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getSuiteStats = (suiteId: string) => {
        const suiteFeatures = features.filter(f => f.suite === suiteId);
        return {
            total: suiteFeatures.length,
            live: suiteFeatures.filter(f => f.status === 'live').length,
            enabled: suiteFeatures.filter(f => f.enabled).length,
        };
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Feature Management</h1>
                        <p className="text-sm text-gray-500">Control app availability and visibility</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Legend */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Status Legend</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Live</span>
                            <span className="text-sm text-gray-600">Production ready</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Beta</span>
                            <span className="text-sm text-gray-600">Testing with users</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Development</span>
                            <span className="text-sm text-gray-600">In progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">Maintenance</span>
                            <span className="text-sm text-gray-600">Temporarily unavailable</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">Disabled</span>
                            <span className="text-sm text-gray-600">Turned off</span>
                        </div>
                    </div>
                </div>

                {/* Feature Suites */}
                {suites.map(suite => {
                    const stats = getSuiteStats(suite.id);
                    const isExpanded = expandedSuites.includes(suite.id);
                    const suiteFeatures = features.filter(f => f.suite === suite.id);
                    
                    return (
                        <div key={suite.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Suite Header */}
                            <button
                                onClick={() => toggleSuite(suite.id)}
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-${suite.color}-100 flex items-center justify-center`}>
                                        <suite.icon className={`w-5 h-5 text-${suite.color}-600`} />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="font-semibold text-gray-900">{suite.name}</h2>
                                        <p className="text-sm text-gray-500">
                                            {stats.live} live • {stats.enabled} enabled • {stats.total} total
                                        </p>
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* Features Table */}
                            {isExpanded && (
                                <div className="border-t border-gray-200">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled</th>
                                                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visible</th>
                                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Usage</th>
                                                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {suiteFeatures.map(feature => (
                                                <tr key={feature.id} className="hover:bg-gray-50">
                                                    <td className="px-5 py-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{feature.name}</p>
                                                            <p className="text-sm text-gray-500">{feature.description}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <select
                                                            value={feature.status}
                                                            onChange={(e) => setStatus(feature.id, e.target.value as AppFeature['status'])}
                                                            className={`px-2 py-1 rounded text-xs font-medium border-0 ${getStatusColor(feature.status)}`}
                                                        >
                                                            <option value="live">Live</option>
                                                            <option value="beta">Beta</option>
                                                            <option value="development">Development</option>
                                                            <option value="maintenance">Maintenance</option>
                                                            <option value="disabled">Disabled</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <button
                                                            onClick={() => toggleEnabled(feature.id)}
                                                            disabled={saving === feature.id}
                                                            className={`w-12 h-6 rounded-full transition-colors relative ${
                                                                feature.enabled ? 'bg-green-500' : 'bg-gray-300'
                                                            }`}
                                                        >
                                                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                                feature.enabled ? 'left-7' : 'left-1'
                                                            }`} />
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <button
                                                            onClick={() => toggleVisibility(feature.id)}
                                                            disabled={saving === feature.id}
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                feature.visibleToUsers 
                                                                    ? 'bg-blue-100 text-blue-600' 
                                                                    : 'bg-gray-100 text-gray-400'
                                                            }`}
                                                        >
                                                            {feature.visibleToUsers ? (
                                                                <Eye className="w-4 h-4" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {feature.usageCount !== undefined ? (
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-900">{feature.usageCount.toLocaleString()}</span>
                                                                {feature.errorRate !== undefined && feature.errorRate > 1 && (
                                                                    <div className="flex items-center justify-end gap-1 text-xs text-red-500">
                                                                        <AlertTriangle className="w-3 h-3" />
                                                                        {feature.errorRate}% errors
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Emergency Controls */}
                <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                    <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Emergency Controls
                    </h3>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200">
                            Disable All Beta Features
                        </button>
                        <button className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200">
                            Enable Maintenance Mode
                        </button>
                        <button className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200">
                            Disable All AI Features
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

