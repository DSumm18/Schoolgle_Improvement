"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Building2, Wrench, Flame, Droplet, Zap, Lightbulb, 
    AlertTriangle, CheckCircle, Clock, Plus, Search,
    Ticket, BarChart3, ArrowLeft, ChevronRight
} from 'lucide-react';
import OrigamiParticles from '@/components/OrigamiParticles';

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
    { id: '1', name: 'Fire Alarm Test', category: 'Fire Safety', icon: Flame, lastCompleted: '2025-11-25', nextDue: '2025-12-02', status: 'compliant', frequency: 'Weekly' },
    { id: '2', name: 'Legionella Temperature Check', category: 'Water Safety', icon: Droplet, lastCompleted: '2025-10-28', nextDue: '2025-11-28', status: 'overdue', frequency: 'Monthly' },
    { id: '3', name: 'Emergency Lighting Test', category: 'Electrical', icon: Lightbulb, lastCompleted: '2025-10-15', nextDue: '2025-11-15', status: 'overdue', frequency: 'Monthly' },
    { id: '4', name: 'PAT Testing', category: 'Electrical', icon: Zap, lastCompleted: '2025-09-01', nextDue: '2026-09-01', status: 'compliant', frequency: 'Annual' },
    { id: '5', name: 'Fire Drill', category: 'Fire Safety', icon: Flame, lastCompleted: '2025-09-15', nextDue: '2025-12-15', status: 'due_soon', frequency: 'Termly' }
];

const energyData = {
    thisMonth: { kwh: 24500, cost: 4900, trend: -8 },
    lastMonth: { kwh: 26600, cost: 5320, trend: 0 },
    yearToDate: { kwh: 245000, cost: 49000, trend: -12 }
};

export default function EstatesModulePage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'helpdesk' | 'compliance' | 'energy'>('overview');

    const ticketStats = {
        open: mockTickets.filter(t => t.status === 'open').length,
        inProgress: mockTickets.filter(t => t.status === 'in_progress').length,
        urgent: mockTickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length
    };

    const complianceStats = {
        total: mockComplianceChecks.length,
        compliant: mockComplianceChecks.filter(c => c.status === 'compliant').length,
        overdue: mockComplianceChecks.filter(c => c.status === 'overdue').length
    };

    const getRiskColor = (score: number) => {
        if (score >= 15) return 'bg-red-500';
        if (score >= 10) return 'bg-orange-500';
        if (score >= 5) return 'bg-amber-500';
        return 'bg-gray-300';
    };

    return (
        <div className="min-h-screen bg-white relative">
            <OrigamiParticles text="Estates" opacity={0.3} shape="house" />
            
            {/* Header */}
            <header className="relative z-10 border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/modules" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm">Modules</span>
                        </Link>
                        <div className="w-px h-6 bg-gray-200" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900">Estates</span>
                        </div>
                    </div>
                    <Link href="/dashboard" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        Dashboard
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Hero */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-medium tracking-tight text-gray-900 mb-3">
                        Estates & Facilities
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl">
                        Maintenance, statutory compliance & energy management. 
                        DfE GEMS aligned, with evidence feeding into Safeguarding.
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Ticket className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-500">Open Tickets</p>
                        </div>
                        <p className="text-3xl font-medium text-gray-900">{ticketStats.open + ticketStats.inProgress}</p>
                        {ticketStats.urgent > 0 && <p className="text-xs text-amber-600 mt-1">{ticketStats.urgent} high priority</p>}
                    </div>
                    <div className={`bg-gray-50 rounded-2xl p-5 ${complianceStats.overdue > 0 ? 'border border-red-100' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-500">Overdue Checks</p>
                        </div>
                        <p className={`text-3xl font-medium ${complianceStats.overdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{complianceStats.overdue}</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-500">Energy This Month</p>
                        </div>
                        <p className="text-3xl font-medium text-gray-900">{energyData.thisMonth.kwh.toLocaleString()}<span className="text-lg text-gray-400"> kWh</span></p>
                        <p className="text-xs text-green-600 mt-1">{energyData.thisMonth.trend}% vs last month</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-500">Compliance Rate</p>
                        </div>
                        <p className="text-3xl font-medium text-gray-900">{Math.round((complianceStats.compliant / complianceStats.total) * 100)}%</p>
                    </div>
                </motion.div>

                {/* Tabs */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="border-b border-gray-100 mb-8"
                >
                    <nav className="flex gap-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'helpdesk', label: 'Helpdesk', icon: Ticket },
                            { id: 'compliance', label: 'Compliance', icon: CheckCircle },
                            { id: 'energy', label: 'Energy', icon: Lightbulb }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2 py-4 border-b-2 font-medium transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </motion.div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Tickets */}
                            <div className="bg-gray-50 rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                    <h3 className="font-medium text-gray-900">Recent Tickets</h3>
                                    <button onClick={() => setActiveTab('helpdesk')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                                        View All →
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {mockTickets.map(ticket => (
                                        <div key={ticket.id} className="px-6 py-4 hover:bg-white transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{ticket.title}</p>
                                                    <p className="text-sm text-gray-500">{ticket.location}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {ticket.riskScore && (
                                                        <div className={`w-6 h-6 rounded-md ${getRiskColor(ticket.riskScore)} text-white text-xs flex items-center justify-center font-bold`}>
                                                            {ticket.riskScore}
                                                        </div>
                                                    )}
                                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                        ticket.priority === 'high' ? 'bg-amber-50 text-amber-700' :
                                                        ticket.priority === 'urgent' ? 'bg-red-50 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {ticket.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Compliance Status */}
                            <div className="bg-gray-50 rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                    <h3 className="font-medium text-gray-900">Compliance Status</h3>
                                    <button onClick={() => setActiveTab('compliance')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                                        View All →
                                    </button>
                                </div>
                                <div className="p-4 space-y-3">
                                    {mockComplianceChecks.map(check => (
                                        <div key={check.id} className="flex items-center justify-between px-2 py-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    check.status === 'compliant' ? 'bg-gray-100' :
                                                    check.status === 'due_soon' ? 'bg-amber-50' : 'bg-red-50'
                                                }`}>
                                                    <check.icon className={`w-4 h-4 ${
                                                        check.status === 'compliant' ? 'text-gray-600' :
                                                        check.status === 'due_soon' ? 'text-amber-600' : 'text-red-600'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{check.name}</p>
                                                    <p className="text-xs text-gray-500">Due: {new Date(check.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                check.status === 'compliant' ? 'bg-gray-100 text-gray-700' :
                                                check.status === 'due_soon' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                                {check.status === 'compliant' ? 'OK' : check.status === 'due_soon' ? 'Due Soon' : 'Overdue'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* DfE Alignment */}
                        <div className="bg-gray-900 rounded-2xl p-8">
                            <h3 className="text-lg font-medium text-white mb-4">DfE Good Estate Management for Schools (GEMS) Aligned</h3>
                            <p className="text-gray-400 mb-6">
                                Pre-configured checks for Fire, Legionella, Asbestos, Gas, Electrical and all HSE requirements.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['HSE L8 (Legionella)', 'RIDDOR', 'COSHH', 'LOLER', 'Fire Safety Order 2005'].map(tag => (
                                    <span key={tag} className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-gray-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Helpdesk Tab */}
                {activeTab === 'helpdesk' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" placeholder="Search tickets..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-gray-200" />
                            </div>
                            <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" /> New Ticket
                            </button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {mockTickets.map(ticket => (
                                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                            <td className="px-6 py-5 text-sm font-mono text-gray-400">{ticket.id}</td>
                                            <td className="px-6 py-5">
                                                <p className="font-medium text-gray-900">{ticket.title}</p>
                                                <p className="text-sm text-gray-500">{ticket.location}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                {ticket.riskScore && (
                                                    <div className={`w-8 h-8 rounded-lg ${getRiskColor(ticket.riskScore)} text-white flex items-center justify-center font-bold text-sm`}>
                                                        {ticket.riskScore}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                                    ticket.priority === 'high' ? 'bg-amber-50 text-amber-700' :
                                                    ticket.priority === 'urgent' ? 'bg-red-50 text-red-700' :
                                                    ticket.priority === 'low' ? 'bg-gray-50 text-gray-500' : 'bg-gray-100 text-gray-600'
                                                }`}>{ticket.priority}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                                    ticket.status === 'completed' ? 'bg-green-50 text-green-700' :
                                                    ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                }`}>{ticket.status.replace('_', ' ')}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Compliance Tab */}
                {activeTab === 'compliance' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mockComplianceChecks.map(check => (
                            <div key={check.id} className={`bg-white rounded-2xl p-5 border ${
                                check.status === 'overdue' ? 'border-red-100' :
                                check.status === 'due_soon' ? 'border-amber-100' : 'border-gray-100'
                            }`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        check.status === 'compliant' ? 'bg-gray-100' :
                                        check.status === 'due_soon' ? 'bg-amber-50' : 'bg-red-50'
                                    }`}>
                                        <check.icon className={`w-5 h-5 ${
                                            check.status === 'compliant' ? 'text-gray-600' :
                                            check.status === 'due_soon' ? 'text-amber-600' : 'text-red-600'
                                        }`} />
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                        check.status === 'compliant' ? 'bg-gray-100 text-gray-700' :
                                        check.status === 'due_soon' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                    }`}>{check.status === 'compliant' ? 'Compliant' : check.status === 'due_soon' ? 'Due Soon' : 'Overdue'}</span>
                                </div>
                                <h4 className="font-medium text-gray-900 mb-1">{check.name}</h4>
                                <p className="text-sm text-gray-500 mb-3">{check.category} • {check.frequency}</p>
                                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                                    <span>Last: {new Date(check.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                    <span>Due: {new Date(check.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Energy Tab */}
                {activeTab === 'energy' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-2xl p-6">
                                <p className="text-sm text-gray-500 mb-2">This Month</p>
                                <p className="text-4xl font-medium text-gray-900">{energyData.thisMonth.kwh.toLocaleString()}<span className="text-xl text-gray-400"> kWh</span></p>
                                <p className="text-lg text-gray-600 mt-1">£{energyData.thisMonth.cost.toLocaleString()}</p>
                                <p className="text-sm text-green-600 mt-2">{energyData.thisMonth.trend}% vs last month</p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-6">
                                <p className="text-sm text-gray-500 mb-2">Last Month</p>
                                <p className="text-4xl font-medium text-gray-900">{energyData.lastMonth.kwh.toLocaleString()}<span className="text-xl text-gray-400"> kWh</span></p>
                                <p className="text-lg text-gray-600 mt-1">£{energyData.lastMonth.cost.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-6">
                                <p className="text-sm text-gray-500 mb-2">Year to Date</p>
                                <p className="text-4xl font-medium text-gray-900">{energyData.yearToDate.kwh.toLocaleString()}<span className="text-xl text-gray-400"> kWh</span></p>
                                <p className="text-lg text-gray-600 mt-1">£{energyData.yearToDate.cost.toLocaleString()}</p>
                                <p className="text-sm text-green-600 mt-2">{energyData.yearToDate.trend}% vs last year</p>
                            </div>
                        </div>
                        <div className="bg-gray-900 rounded-2xl p-8 text-center">
                            <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-white mb-2">Full Energy Dashboard</h3>
                            <p className="text-gray-400">Anomaly detection, carbon reporting, and utility integration coming soon.</p>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
