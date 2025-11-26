"use client";

import { useState, useMemo } from 'react';
import { ActionItem, OFSTED_FRAMEWORK } from '@/lib/ofsted-framework';
import { Search, Filter, CheckCircle, AlertCircle, Clock, Calendar, User, ArrowRight, LayoutList, BarChart2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import ActionsGanttChart from './ActionsGanttChart';

interface ActionsDashboardProps {
    actions: ActionItem[];
    onUpdateAction: (action: ActionItem) => void;
}

const BADGE_COLOR_MAP: Record<string, string> = {
    'rose': 'bg-white border-rose-200 text-rose-700',
    'teal': 'bg-white border-teal-200 text-teal-700',
    'orange': 'bg-white border-orange-200 text-orange-700',
    'violet': 'bg-white border-violet-200 text-violet-700',
    'blue': 'bg-white border-blue-200 text-blue-700',
    'gray': 'bg-white border-gray-200 text-gray-700',
};

type SortKey = 'description' | 'category' | 'assignee' | 'dueDate' | 'priority' | 'status';

export default function ActionsDashboard({ actions, onUpdateAction }: ActionsDashboardProps) {
    const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [hideCompleted, setHideCompleted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
        key: 'dueDate',
        direction: 'asc'
    });

    // Extract unique categories for filter
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

    const filteredActions = useMemo(() => {
        let result = actions.filter(action => {
            if (hideCompleted && action.status === 'completed') return false;
            if (filterStatus !== 'all' && action.status !== filterStatus) return false;
            if (filterCategory !== 'all' && action.category !== filterCategory) return false;
            if (searchQuery && !action.description.toLowerCase().includes(searchQuery.toLowerCase()) && !action.assignee?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });

        return result.sort((a, b) => {
            const { key, direction } = sortConfig;
            let valueA: any = a[key as keyof ActionItem];
            let valueB: any = b[key as keyof ActionItem];

            // Handle specific fields
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-700 bg-red-50 border-red-200';
            case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'low': return 'text-green-700 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getCategoryBadgeStyle = (categoryName: string) => {
        const category = OFSTED_FRAMEWORK.find(c => c.name === categoryName);
        const colorName = category?.color || 'gray';
        return BADGE_COLOR_MAP[colorName] || BADGE_COLOR_MAP['gray'];
    };

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400 opacity-0 group-hover:opacity-50" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-blue-600" />
            : <ArrowDown size={14} className="text-blue-600" />;
    };

    const SortableHeader = ({ label, columnKey }: { label: string, columnKey: SortKey }) => (
        <th
            className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none"
            onClick={() => handleSort(columnKey)}
        >
            <div className="flex items-center gap-2">
                {label}
                <SortIcon columnKey={columnKey} />
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Action Plan Dashboard</h2>
                    <p className="text-gray-600">Manage and track all improvement actions across frameworks.</p>
                </div>
                <div className="flex gap-3">
                    {/* View Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutList size={16} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('gantt')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <BarChart2 size={16} /> Timeline
                        </button>
                    </div>

                    <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">Total Actions:</span>
                        <span className="text-lg font-bold text-blue-600">{actions.length}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search actions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="border-none bg-transparent font-medium text-gray-700 focus:ring-0 cursor-pointer text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                        <span className="text-sm text-gray-500">Category:</span>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="border-none bg-transparent font-medium text-gray-700 focus:ring-0 cursor-pointer text-sm max-w-[200px] truncate"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat as string}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={hideCompleted}
                            onChange={(e) => setHideCompleted(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        Hide Completed
                    </label>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'list' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <SortableHeader label="Action" columnKey="description" />
                                <SortableHeader label="Category" columnKey="category" />
                                <SortableHeader label="Assignee" columnKey="assignee" />
                                <SortableHeader label="Due Date" columnKey="dueDate" />
                                <SortableHeader label="Priority" columnKey="priority" />
                                <SortableHeader label="Status" columnKey="status" />
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredActions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No actions found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredActions.map((action) => (
                                    <tr key={action.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{action.description}</span>
                                                {action.rationale && (
                                                    <span className="text-xs text-gray-500 truncate max-w-md">{action.rationale}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs font-bold px-2 py-1 rounded border ${getCategoryBadgeStyle(action.category || '')}`}>
                                                {action.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {action.assignee ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                                        {action.assignee.charAt(0)}
                                                    </div>
                                                    <span className="text-sm text-gray-700">{action.assignee}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {action.dueDate ? (
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Calendar size={14} />
                                                    {new Date(action.dueDate).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded border uppercase ${getPriorityColor(action.priority)}`}>
                                                {action.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded border capitalize ${getStatusColor(action.status)}`}>
                                                {action.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <ActionsGanttChart actions={filteredActions} />
            )}
        </div>
    );
}
