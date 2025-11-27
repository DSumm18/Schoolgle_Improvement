"use client";

import { useState } from 'react';
import {
    Building2, Wrench, Flame, Droplet, Zap, Lightbulb, 
    AlertTriangle, CheckCircle, Clock, Plus, Search,
    Ticket, BarChart3, Calendar, FileText, Users, 
    ThermometerSun, Activity, ClipboardCheck
} from 'lucide-react';

// Types
interface MaintenanceTicket {
    id: string;
    title: string;
    category: string;
    priority: 'urgent' | 'high' | 'normal' | 'low';
    status: 'open' | 'in_progress' | 'completed';
    location: string;
    reportedBy: string;
    reportedAt: string;
    assignedTo?: string;
    riskScore?: number;
}

interface ComplianceCheck {
    id: string;
    name: string;
    category: string;
    icon: React.ElementType;
    lastCompleted: string;
    nextDue: string;
    status: 'compliant' | 'due_soon' | 'overdue';
    frequency: string;
}

// Mock data
const mockTickets: MaintenanceTicket[] = [
    {
        id: 'T001',
        title: 'Radiator not heating in Year 3 classroom',
        category: 'Heating',
        priority: 'high',
        status: 'in_progress',
        location: 'Block B, Room 12',
        reportedBy: 'Mrs. Thompson',
        reportedAt: '2025-11-26',
        assignedTo: 'Site Team',
        riskScore: 12
    },
    {
        id: 'T002',
        title: 'Light flickering in main hall',
        category: 'Electrical',
        priority: 'normal',
        status: 'open',
        location: 'Main Hall',
        reportedBy: 'Mr. Davies',
        reportedAt: '2025-11-27',
        riskScore: 6
    },
    {
        id: 'T003',
        title: 'Tap dripping in staff toilet',
        category: 'Plumbing',
        priority: 'low',
        status: 'open',
        location: 'Staff Room',
        reportedBy: 'Reception',
        reportedAt: '2025-11-25',
        riskScore: 3
    }
];

const mockComplianceChecks: ComplianceCheck[] = [
    {
        id: '1',
        name: 'Fire Alarm Test',
        category: 'Fire Safety',
        icon: Flame,
        lastCompleted: '2025-11-25',
        nextDue: '2025-12-02',
        status: 'compliant',
        frequency: 'Weekly'
    },
    {
        id: '2',
        name: 'Legionella Temperature Check',
        category: 'Water Safety',
        icon: Droplet,
        lastCompleted: '2025-10-28',
        nextDue: '2025-11-28',
        status: 'overdue',
        frequency: 'Monthly'
    },
    {
        id: '3',
        name: 'Emergency Lighting Test',
        category: 'Electrical',
        icon: Lightbulb,
        lastCompleted: '2025-10-15',
        nextDue: '2025-11-15',
        status: 'overdue',
        frequency: 'Monthly'
    },
    {
        id: '4',
        name: 'PAT Testing',
        category: 'Electrical',
        icon: Zap,
        lastCompleted: '2025-09-01',
        nextDue: '2026-09-01',
        status: 'compliant',
        frequency: 'Annual'
    },
    {
        id: '5',
        name: 'Fire Drill',
        category: 'Fire Safety',
        icon: Flame,
        lastCompleted: '2025-09-15',
        nextDue: '2025-12-15',
        status: 'due_soon',
        frequency: 'Termly'
    }
];

// Energy mock data
const energyData = {
    thisMonth: { kwh: 24500, cost: 4900, trend: -8 },
    lastMonth: { kwh: 26600, cost: 5320, trend: 0 },
    yearToDate: { kwh: 245000, cost: 49000, trend: -12 }
};

export default function EstatesModulePage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'helpdesk' | 'compliance' | 'energy'>('overview');
    const [showNewTicket, setShowNewTicket] = useState(false);

    // Stats calculations
    const ticketStats = {
        open: mockTickets.filter(t => t.status === 'open').length,
        inProgress: mockTickets.filter(t => t.status === 'in_progress').length,
        urgent: mockTickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length
    };

    const complianceStats = {
        total: mockComplianceChecks.length,
        compliant: mockComplianceChecks.filter(c => c.status === 'compliant').length,
        overdue: mockComplianceChecks.filter(c => c.status === 'overdue').length,
        dueSoon: mockComplianceChecks.filter(c => c.status === 'due_soon').length
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'normal': return 'bg-blue-100 text-blue-700';
            case 'low': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'compliant':
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'due_soon':
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-700';
            case 'overdue':
            case 'open':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 15) return 'bg-red-600';
        if (score >= 10) return 'bg-orange-500';
        if (score >= 5) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Building2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Estates & Facilities</h1>
                                <p className="text-cyan-100">Maintenance, compliance & energy management</p>
                            </div>
                        </div>
                        <a href="/modules" className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                            ← All Modules
                        </a>
                    </div>
                </div>
            </header>

            {/* Ofsted Connection Banner */}
            <div className="bg-blue-50 border-b border-blue-200">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-sm text-blue-800">
                            <strong>Ofsted Connection:</strong> Statutory compliance records feed directly into 
                            Safeguarding and Leadership & Management evidence. Fire drills, H&S audits, risk assessments — all linked.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                            <Ticket className="w-4 h-4 text-cyan-600" />
                            <p className="text-sm text-gray-500">Open Tickets</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{ticketStats.open + ticketStats.inProgress}</p>
                        {ticketStats.urgent > 0 && (
                            <p className="text-xs text-red-600 mt-1">{ticketStats.urgent} high priority</p>
                        )}
                    </div>
                    <div className={`bg-white rounded-xl p-4 border-2 ${complianceStats.overdue > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <p className="text-sm text-gray-500">Overdue Checks</p>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{complianceStats.overdue}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                            <p className="text-sm text-gray-500">Energy This Month</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{energyData.thisMonth.kwh.toLocaleString()} kWh</p>
                        <p className="text-xs text-green-600 mt-1">{energyData.thisMonth.trend}% vs last month</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-sm text-gray-500">Compliance Rate</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {Math.round((complianceStats.compliant / complianceStats.total) * 100)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="border-b border-gray-200">
                    <nav className="flex gap-6">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'helpdesk', label: 'Helpdesk', icon: Ticket },
                            { id: 'compliance', label: 'Statutory Compliance', icon: ClipboardCheck },
                            { id: 'energy', label: 'Energy', icon: Lightbulb }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-cyan-500 text-cyan-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Tickets */}
                            <div className="bg-white rounded-xl border border-gray-200">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900">Recent Tickets</h3>
                                    <button 
                                        onClick={() => setActiveTab('helpdesk')}
                                        className="text-sm text-cyan-600 hover:underline"
                                    >
                                        View All
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {mockTickets.slice(0, 3).map(ticket => (
                                        <div key={ticket.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{ticket.title}</p>
                                                    <p className="text-sm text-gray-500">{ticket.location}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {ticket.riskScore && (
                                                        <div className={`w-6 h-6 rounded-full ${getRiskColor(ticket.riskScore)} text-white text-xs flex items-center justify-center font-bold`}>
                                                            {ticket.riskScore}
                                                        </div>
                                                    )}
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Compliance Status */}
                            <div className="bg-white rounded-xl border border-gray-200">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900">Compliance Status</h3>
                                    <button 
                                        onClick={() => setActiveTab('compliance')}
                                        className="text-sm text-cyan-600 hover:underline"
                                    >
                                        View All
                                    </button>
                                </div>
                                <div className="p-4 space-y-3">
                                    {mockComplianceChecks.map(check => (
                                        <div key={check.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    check.status === 'compliant' ? 'bg-green-100' :
                                                    check.status === 'due_soon' ? 'bg-yellow-100' : 'bg-red-100'
                                                }`}>
                                                    <check.icon className={`w-4 h-4 ${
                                                        check.status === 'compliant' ? 'text-green-600' :
                                                        check.status === 'due_soon' ? 'text-yellow-600' : 'text-red-600'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{check.name}</p>
                                                    <p className="text-xs text-gray-500">Due: {new Date(check.nextDue).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(check.status)}`}>
                                                {check.status === 'compliant' ? 'OK' : check.status === 'due_soon' ? 'Due Soon' : 'Overdue'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* DfE Alignment */}
                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
                            <h3 className="font-semibold mb-3">DfE Good Estate Management for Schools (GEMS) Aligned</h3>
                            <p className="text-gray-300 mb-4">
                                Our statutory compliance templates are built around the DfE Estate Management Standards 2025 
                                and GEMS framework. Pre-configured checks for Fire, Legionella, Asbestos, Gas, Electrical and 
                                all HSE requirements.
                            </p>
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">HSE L8 (Legionella)</span>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">RIDDOR</span>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">COSHH</span>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">LOLER</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Helpdesk Tab */}
                {activeTab === 'helpdesk' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 max-w-md">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tickets..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowNewTicket(true)}
                                className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Ticket
                            </button>
                        </div>

                        {/* Tickets List */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {mockTickets.map(ticket => (
                                        <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer">
                                            <td className="px-4 py-4 text-sm font-mono text-gray-500">{ticket.id}</td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-gray-900">{ticket.title}</p>
                                                <p className="text-sm text-gray-500">{ticket.location}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                {ticket.riskScore && (
                                                    <div className={`w-8 h-8 rounded-full ${getRiskColor(ticket.riskScore)} text-white flex items-center justify-center font-bold text-sm`}>
                                                        {ticket.riskScore}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    ticket.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600">{ticket.assignedTo || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Compliance Tab */}
                {activeTab === 'compliance' && (
                    <div className="space-y-6">
                        <p className="text-gray-600">
                            Full statutory compliance tracking aligned with DfE GEMS. Coming soon with full template library.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mockComplianceChecks.map(check => (
                                <div 
                                    key={check.id}
                                    className={`bg-white rounded-xl border-2 p-4 ${
                                        check.status === 'overdue' ? 'border-red-200' :
                                        check.status === 'due_soon' ? 'border-yellow-200' :
                                        'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${
                                            check.status === 'compliant' ? 'bg-green-100' :
                                            check.status === 'due_soon' ? 'bg-yellow-100' : 'bg-red-100'
                                        }`}>
                                            <check.icon className={`w-5 h-5 ${
                                                check.status === 'compliant' ? 'text-green-600' :
                                                check.status === 'due_soon' ? 'text-yellow-600' : 'text-red-600'
                                            }`} />
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(check.status)}`}>
                                            {check.status === 'compliant' ? 'Compliant' : check.status === 'due_soon' ? 'Due Soon' : 'Overdue'}
                                        </span>
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-1">{check.name}</h4>
                                    <p className="text-sm text-gray-500 mb-2">{check.category} • {check.frequency}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                        <span>Last: {new Date(check.lastCompleted).toLocaleDateString()}</span>
                                        <span>Due: {new Date(check.nextDue).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Energy Tab */}
                {activeTab === 'energy' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <p className="text-sm text-gray-500 mb-1">This Month</p>
                                <p className="text-3xl font-bold text-gray-900">{energyData.thisMonth.kwh.toLocaleString()} kWh</p>
                                <p className="text-lg font-medium text-gray-600">£{energyData.thisMonth.cost.toLocaleString()}</p>
                                <p className={`text-sm mt-2 ${energyData.thisMonth.trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {energyData.thisMonth.trend}% vs last month
                                </p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <p className="text-sm text-gray-500 mb-1">Last Month</p>
                                <p className="text-3xl font-bold text-gray-900">{energyData.lastMonth.kwh.toLocaleString()} kWh</p>
                                <p className="text-lg font-medium text-gray-600">£{energyData.lastMonth.cost.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <p className="text-sm text-gray-500 mb-1">Year to Date</p>
                                <p className="text-3xl font-bold text-gray-900">{energyData.yearToDate.kwh.toLocaleString()} kWh</p>
                                <p className="text-lg font-medium text-gray-600">£{energyData.yearToDate.cost.toLocaleString()}</p>
                                <p className={`text-sm mt-2 ${energyData.yearToDate.trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {energyData.yearToDate.trend}% vs last year
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Energy Dashboard</h3>
                            <p className="text-gray-600">
                                Full energy monitoring with anomaly detection and carbon reporting. Connect your utility 
                                data via CSV upload or API integration. Coming soon.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

