"use client";

import { useState, useMemo } from 'react';
import { Action, getStatusMatrix, UserStatus, AIStatus } from '@/lib/actions-hub';
import { eefStrategies } from '@/lib/eef-toolkit';
import {
    Search,
    Filter,
    CheckCircle,
    AlertCircle,
    Clock,
    Calendar,
    User,
    LayoutList,
    BarChart2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    MoreVertical,
    Edit3,
    DollarSign,
    BookOpen,
    Sparkles,
    Calendar,
} from 'lucide-react';
import ActionsGanttChart from './ActionsGanttChart';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionsDashboardProps {
    actions: Action[];
    onUpdateAction: (action: Action) => void;
    onEditAction: (action: Action) => void;
}

const COST_RATINGS = ['£', '££', '£££', '££££', '£££££'];
const EVIDENCE_COLORS = {
    5: 'text-emerald-600',
    4: 'text-emerald-500',
    3: 'text-blue-600',
    2: 'text-amber-600',
    1: 'text-rose-600',
};

type SortKey = 'title' | 'user_status' | 'ai_status' | 'dueDate' | 'priority' | 'estimated_cost';

export default function ActionsDashboard({ actions, onUpdateAction, onEditAction }: ActionsDashboardProps) {
    const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
    const [filterUserStatus, setFilterUserStatus] = useState<string>('all');
    const [filterAIStatus, setFilterAIStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCosts, setShowCosts] = useState(true);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
        key: 'dueDate',
        direction: 'asc'
    });

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredActions = useMemo(() => {
        let result = actions.filter(action => {
            if (filterUserStatus !== 'all' && action.user_status !== filterUserStatus) return false;
            if (filterAIStatus !== 'all' && action.ai_status !== filterAIStatus) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    action.title?.toLowerCase().includes(query) ||
                    action.description?.toLowerCase().includes(query) ||
                    action.owner_name?.toLowerCase().includes(query) ||
                    action.eef_strategy?.toLowerCase().includes(query)
                );
            }
            return true;
        });

        return result.sort((a, b) => {
            const { key, direction } = sortConfig;
            let valueA: any = a[key as keyof Action];
            let valueB: any = b[key as keyof Action];

            if (key === 'dueDate') {
                valueA = valueA ? new Date(valueA).getTime() : Infinity;
                valueB = valueB ? new Date(valueB).getTime() : Infinity;
            } else if (key === 'priority') {
                const priorityMap = { critical: 4, high: 3, medium: 2, low: 1 };
                valueA = priorityMap[valueA as keyof typeof priorityMap] || 0;
                valueB = priorityMap[valueB as keyof typeof priorityMap] || 0;
            } else if (key === 'estimated_cost') {
                valueA = valueA || 0;
                valueB = valueB || 0;
            } else {
                valueA = (valueA || '').toString().toLowerCase();
                valueB = (valueB || '').toString().toLowerCase();
            }

            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [actions, filterUserStatus, filterAIStatus, searchQuery, sortConfig]);

    const getStatusDisplay = (action: Action) => {
        const matrix = getStatusMatrix(action.user_status, action.ai_status);
        if (!matrix) {
            return { display: action.user_status, color: 'bg-slate-100 text-slate-600' };
        }
        const colorMap: Record<string, string> = {
            rose: 'bg-rose-50 text-rose-700 border-rose-200',
            amber: 'bg-amber-50 text-amber-700 border-amber-200',
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return { display: matrix.display, color: colorMap[matrix.color] || colorMap.gray };
    };

    const getPriorityStyles = (priority: string) => {
        const styles: Record<string, string> = {
            critical: 'bg-rose-600 text-white',
            high: 'bg-rose-100 text-rose-700 border-rose-300',
            medium: 'bg-amber-100 text-amber-700 border-amber-300',
            low: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        };
        return styles[priority] || styles.medium;
    };

    const getEEFStrategy = (eefId?: string) => {
        if (!eefId) return null;
        return eefStrategies.find(s => s.id === eefId);
    };

    const SortableHeader = ({ label, columnKey }: { label: string; columnKey: SortKey }) => (
        <th
            className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors group select-none"
            onClick={() => handleSort(columnKey)}
        >
            <div className="flex items-center gap-2">
                {label}
                {sortConfig.key === columnKey && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                )}
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search actions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <select
                        value={filterUserStatus}
                        onChange={(e) => setFilterUserStatus(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="complete">Complete</option>
                    </select>

                    <select
                        value={filterAIStatus}
                        onChange={(e) => setFilterAIStatus(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium"
                    >
                        <option value="all">All AI Status</option>
                        <option value="not_met">Not Met</option>
                        <option value="partially_met">Partially Met</option>
                        <option value="met">Met</option>
                        <option value="not_assessed">Not Assessed</option>
                    </select>

                    <button
                        onClick={() => setShowCosts(!showCosts)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showCosts ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <DollarSign size={16} /> Costs
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-1.5 rounded-xl flex border border-slate-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutList size={16} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('gantt')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <BarChart2 size={16} /> Gantt
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <SortableHeader label="Action" columnKey="title" />
                                        <SortableHeader label="Owner" columnKey="owner_name" />
                                        {showCosts && <SortableHeader label="Est. Cost" columnKey="estimated_cost" />}
                                        <SortableHeader label="EEF Strategy" columnKey="eef_strategy" />
                                        <SortableHeader label="Priority" columnKey="priority" />
                                        <SortableHeader label="Status" columnKey="user_status" />
                                        <SortableHeader label="Due" columnKey="dueDate" />
                                        <th className="px-4 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredActions.length === 0 ? (
                                        <tr>
                                            <td colSpan={showCosts ? 8 : 7} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Search size={32} className="text-slate-300 mx-auto" />
                                                    <p className="text-slate-500 font-medium">No actions found</p>
                                                    <button
                                                        onClick={() => { setSearchQuery(''); setFilterUserStatus('all'); setFilterAIStatus('all'); }}
                                                        className="text-blue-600 text-sm font-medium hover:underline"
                                                    >
                                                        Clear filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredActions.map((action, idx) => {
                                            const statusDisplay = getStatusDisplay(action);
                                            const eefStrategy = getEEFStrategy(action.eef_strategy);

                                            return (
                                                <tr
                                                    key={action.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                    onClick={() => onEditAction(action)}
                                                >
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-900 group-hover:text-blue-600">{action.title}</span>
                                                            {action.description && (
                                                                <span className="text-xs text-slate-500 line-clamp-1 mt-1 max-w-md">{action.description}</span>
                                                            )}
                                                            {action.eef_strategy && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <Sparkles size={12} className="text-purple-500" />
                                                                    <span className="text-[10px] text-purple-600 font-medium">{eefStrategy?.name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {action.owner_name ? (
                                                            <div className="flex items-center gap-2">
                                                                <User size={16} className="text-slate-400" />
                                                                <span className="text-sm font-medium">{action.owner_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-sm">Unassigned</span>
                                                        )}
                                                    </td>
                                                    {showCosts && (
                                                        <td className="px-4 py-4">
                                                            {action.estimated_cost ? (
                                                                <div className="text-sm font-medium">
                                                                    £{action.estimated_cost.toLocaleString()}
                                                                    {action.actual_cost && (
                                                                        <span className="text-xs text-slate-400 ml-1">
                                                                            (spent: £{action.actual_cost.toLocaleString()})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 text-sm">-</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-4">
                                                        {eefStrategy ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-bold uppercase ${EVIDENCE_COLORS[eefStrategy.evidenceStrength] || 'text-slate-500'}`}>
                                                                    {eefStrategy.evidenceStrength}/5
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {COST_RATINGS[eefStrategy.costRating - 1]}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-sm">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 py-1 text-[10px] font-medium rounded-lg ${getPriorityStyles(action.priority)}`}>
                                                            {action.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-3 py-1 text-[10px] font-medium rounded-lg ${statusDisplay.color}`}>
                                                            {statusDisplay.display}
                                                        </span>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                            {action.user_status.replace('_', ' ')} / {action.ai_status.replace('_', ' ')}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {action.due_date ? (
                                                            <div className={`flex items-center gap-1.5 text-sm font-medium ${new Date(action.due_date) < new Date() && action.user_status !== 'complete' ? 'text-rose-600' : 'text-slate-700'}`}>
                                                                <Calendar size={14} className="opacity-50" />
                                                                {new Date(action.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-sm">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit3 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="gantt"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        <ActionsGanttChart
                            actions={filteredActions}
                            onUpdateDates={(id, start, due) => {
                                const action = actions.find(a => a.id === id);
                                if (action) {
                                    onUpdateAction({ ...action, due_date: due });
                                }
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
