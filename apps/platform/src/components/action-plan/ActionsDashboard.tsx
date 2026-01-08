"use client";

import { useState, useMemo } from 'react';
import { ActionItem, OFSTED_FRAMEWORK } from '@/lib/ofsted-framework';
import {
    Search,
    Filter,
    CheckCircle,
    AlertCircle,
    Clock,
    Calendar,
    User,
    ArrowRight,
    LayoutList,
    BarChart2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    MoreVertical,
    Edit3,
    Trash2,
    Check
} from 'lucide-react';
import ActionsGanttChart from './ActionsGanttChart';
import ActionModal from './ActionModal';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionsDashboardProps {
    actions: ActionItem[];
    onUpdateAction: (action: ActionItem) => void;
}

const BADGE_COLOR_MAP: Record<string, string> = {
    'rose': 'bg-rose-50 border-rose-100 text-rose-700',
    'teal': 'bg-teal-50 border-teal-100 text-teal-700',
    'orange': 'bg-orange-50 border-orange-100 text-orange-700',
    'violet': 'bg-violet-50 border-violet-100 text-violet-700',
    'blue': 'bg-blue-50 border-blue-100 text-blue-700',
    'gray': 'bg-gray-50 border-gray-100 text-gray-700',
};

type SortKey = 'description' | 'category' | 'assignee' | 'dueDate' | 'priority' | 'status';

export default function ActionsDashboard({ actions, onUpdateAction }: ActionsDashboardProps) {
    const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'draft'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [hideCompleted, setHideCompleted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
        key: 'dueDate',
        direction: 'asc'
    });

    const categories = useMemo(() => {
        const cats = new Set(actions.map(a => a.category).filter(Boolean));
        return Array.from(cats);
    }, [actions]);

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleEdit = (action: ActionItem) => {
        setSelectedAction(action);
        setIsModalOpen(true);
    };

    const filteredActions = useMemo(() => {
        let result = actions.filter(action => {
            if (hideCompleted && action.status === 'completed') return false;
            if (filterStatus !== 'all' && action.status !== filterStatus) return false;
            if (action.status === 'draft' && filterStatus !== 'draft' && filterStatus !== 'all') return false;
            // Hide drafts by default in 'all' if user wants cleaner view? No, let's show them if filter is all.
            if (filterCategory !== 'all' && action.category !== filterCategory) return false;
            if (searchQuery && !action.description.toLowerCase().includes(searchQuery.toLowerCase()) && !action.assignee?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });

        return result.sort((a, b) => {
            const { key, direction } = sortConfig;
            let valueA: any = a[key as keyof ActionItem];
            let valueB: any = b[key as keyof ActionItem];

            if (key === 'dueDate') {
                valueA = valueA ? new Date(valueA).getTime() : Infinity;
                valueB = valueB ? new Date(valueB).getTime() : Infinity;
            } else if (key === 'priority') {
                const priorityMap = { high: 3, medium: 2, low: 1 };
                valueA = priorityMap[valueA as keyof typeof priorityMap] || 0;
                valueB = priorityMap[valueB as keyof typeof priorityMap] || 0;
            } else {
                valueA = (valueA || '').toString().toLowerCase();
                valueB = (valueB || '').toString().toLowerCase();
            }

            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [actions, hideCompleted, filterStatus, filterCategory, searchQuery, sortConfig]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'open': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'draft': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-rose-700 bg-rose-50 border-rose-200';
            case 'critical': return 'text-white bg-rose-600 border-rose-700';
            case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'low': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    const getCategoryBadgeStyle = (categoryName: string) => {
        const category = OFSTED_FRAMEWORK.find(c => c.name === categoryName || c.id === categoryName);
        const colorName = category?.color || 'gray';
        return BADGE_COLOR_MAP[colorName] || BADGE_COLOR_MAP['gray'];
    };

    const SortableHeader = ({ label, columnKey }: { label: string, columnKey: SortKey }) => (
        <th
            className="px-6 py-4 text-left text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors group select-none"
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
        <div className="space-y-8">
            {/* Control Bar */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Find an action..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-transparent border-none text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="draft">AI Suggestions</option>
                    </select>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-transparent border-none text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer max-w-[150px]"
                    >
                        <option value="all">Every Category</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat as string}>{cat}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setHideCompleted(!hideCompleted)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${hideCompleted ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {hideCompleted ? <Check size={14} /> : null}
                        {hideCompleted ? 'Showing Active' : 'Hide Completed'}
                    </button>
                </div>

                <div className="flex items-center gap-3 self-end xl:self-auto">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.25rem] flex border border-slate-200 dark:border-slate-700 shadow-inner">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutList size={16} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('gantt')}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
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
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                        <SortableHeader label="Description" columnKey="description" />
                                        <SortableHeader label="Category" columnKey="category" />
                                        <SortableHeader label="Assignee" columnKey="assignee" />
                                        <SortableHeader label="Due Date" columnKey="dueDate" />
                                        <SortableHeader label="Progress" columnKey="status" />
                                        <SortableHeader label="Priority" columnKey="priority" />
                                        <SortableHeader label="Status" columnKey="status" />
                                        <th className="px-6 py-4 border-b border-slate-100"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredActions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300">
                                                        <Search size={32} />
                                                    </div>
                                                    <p className="text-slate-500 font-bold">No matching actions found</p>
                                                    <button
                                                        onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterCategory('all'); }}
                                                        className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline mt-2"
                                                    >
                                                        Reset All Filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredActions.map((action, idx) => (
                                            <motion.tr
                                                key={action.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                onClick={() => handleEdit(action)}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{action.description}</span>
                                                        {action.rationale && (
                                                            <span className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-1 max-w-md">{action.rationale}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${getCategoryBadgeStyle(action.category || '')}`}>
                                                        {action.category || 'Core'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {action.assignee ? (
                                                        <div className="flex items-center gap-2 tooltip" title={action.assignee}>
                                                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-md">
                                                                {action.assignee.charAt(0)}
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{action.assignee}</span>
                                                        </div>
                                                    ) : (
                                                        <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">
                                                            <User size={12} /> Assign
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    {action.dueDate ? (
                                                        <div className="flex flex-col">
                                                            <div className={`flex items-center gap-1.5 text-xs font-bold ${new Date(action.dueDate) < new Date() && action.status !== 'completed' ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                <Calendar size={14} className="opacity-50" />
                                                                {new Date(action.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                            </div>
                                                            {new Date(action.dueDate) < new Date() && action.status !== 'completed' && (
                                                                <span className="text-[9px] font-black text-rose-500 uppercase mt-0.5 animate-pulse">OVERDUE</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="w-24 space-y-1">
                                                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                                                            <span>{action.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${action.progress || 0}%` }}
                                                                className={`h-full ${action.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-lg border ${getPriorityStyles(action.priority)} shadow-sm`}>
                                                        {action.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getStatusStyles(action.status)}`}>
                                                        {action.status === 'in_progress' ? 'Running' :
                                                            action.status === 'completed' ? 'Done' :
                                                                action.status === 'draft' ? 'Suggestion' : 'Open'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {action.status === 'draft' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onUpdateAction({ ...action, status: 'open' });
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-md"
                                                            >
                                                                <Check size={14} /> Accept
                                                            </button>
                                                        )}
                                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
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
                                    onUpdateAction({ ...action, startDate: start, dueDate: due });
                                }
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <ActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(updatedAction) => {
                    onUpdateAction(updatedAction);
                    setIsModalOpen(false);
                }}
                subCategoryName={selectedAction?.subCategory || 'General'}
                initialData={selectedAction || undefined}
                allActions={actions}
            />
        </div>
    );
}
