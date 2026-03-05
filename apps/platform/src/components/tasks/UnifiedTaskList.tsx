"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    Plus,
    Calendar,
    User,
    Clock,
    AlertCircle,
    CheckCircle,
    LayoutGrid,
    List,
    MoreVertical,
    Edit,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import TaskModal from './TaskModal';
import {
    UnifiedTask,
    TaskStatus,
    TaskType,
    TaskSortOption,
    GetTasksResponse,
    TaskFilterOptions,
} from '@/lib/tasks';

interface UnifiedTaskListProps {
    organizationId: string;
    onRefresh?: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'review', label: 'In Review', color: 'bg-amber-100 text-amber-700' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'blocked', label: 'Blocked', color: 'bg-rose-100 text-rose-700' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-slate-100 text-slate-500' },
];

const PRIORITY_OPTIONS: { value: string; label: string; color: string }[] = [
    { value: 'critical', label: 'Critical', color: 'bg-rose-600 text-white' },
    { value: 'high', label: 'High', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'low', label: 'Low', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

const TYPE_OPTIONS: { value: TaskType; label: string; icon: string }[] = [
    { value: 'general', label: 'General', icon: '📋' },
    { value: 'compliance', label: 'Compliance', icon: '✓' },
    { value: 'safeguarding', label: 'Safeguarding', icon: '🛡️' },
    { value: 'estates', label: 'Estates', icon: '🏫' },
    { value: 'finance', label: 'Finance', icon: '💰' },
    { value: 'hr', label: 'HR', icon: '👥' },
    { value: 'teaching', label: 'Teaching', icon: '📚' },
    { value: 'siams', label: 'SIAMS', icon: '⛪' },
];

export default function UnifiedTaskList({
    organizationId,
    onRefresh,
}: UnifiedTaskListProps) {
    const [tasks, setTasks] = useState<UnifiedTask[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Filters
    const [filters, setFilters] = useState<TaskFilterOptions>({
        status: undefined,
        task_type: undefined,
        assignee_id: undefined,
        team_id: undefined,
        department: undefined,
        is_overdue: false,
    });

    // Sort
    const [sortBy, setSortBy] = useState<TaskSortOption>('due_date_desc');

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTasks();
    }, [organizationId, filters, sortBy]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ organizationId });

            if (filters.status) params.append('status', filters.status.join(','));
            if (filters.task_type) params.append('task_type', filters.task_type.join(','));
            if (filters.assignee_id) params.append('assigneeId', filters.assignee_id);
            if (filters.team_id) params.append('teamId', filters.team_id);
            if (filters.department) params.append('department', filters.department.join(','));
            if (filters.is_overdue) params.append('is_overdue', 'true');
            if (sortBy) params.append('sort', sortBy);

            const response = await fetch(`/api/tasks?${params}`);
            if (response.ok) {
                const data: GetTasksResponse = await response.json();
                setTasks(data.tasks || []);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (task: UnifiedTask) => {
        if (!confirm(`Delete task "${task.title}"?`)) return;

        try {
            const response = await fetch(
                `/api/tasks?organizationId=${organizationId}&ids=${task.id}&source=${task.source_table}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                fetchTasks();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    const toggleTaskComplete = async (task: UnifiedTask) => {
        const newStatus = task.status === 'completed' ? 'not_started' : 'completed';

        try {
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    changes: { status: newStatus },
                }),
            });

            if (response.ok) {
                fetchTasks();
                onRefresh?.();
            }
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [tasks, searchQuery]);

    // Group by status for Kanban
    const kanbanGroups = useMemo(() => {
        const groups: Record<TaskStatus, UnifiedTask[]> = {
            not_started: [],
            in_progress: [],
            review: [],
            completed: [],
            blocked: [],
            cancelled: [],
        };

        filteredTasks.forEach((task) => {
            if (groups[task.status]) {
                groups[task.status].push(task);
            }
        });

        return groups;
    }, [filteredTasks]);

    const getStatusBadge = (status: TaskStatus) => {
        const option = STATUS_OPTIONS.find((o) => o.value === status);
        return (
            <Badge className={`text-[10px] font-bold uppercase px-2 py-0.5 ${option?.color}`}>
                {option?.label}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const option = PRIORITY_OPTIONS.find((o) => o.value === priority);
        if (!option) return null;
        return (
            <Badge className={`text-[10px] font-bold uppercase px-2 py-0.5 ${option.color}`}>
                {option.label}
            </Badge>
        );
    };

    const getTypeBadge = (type: TaskType) => {
        const option = TYPE_OPTIONS.find((o) => o.value === type);
        if (!option) return null;
        return (
            <Badge variant="outline" className="text-[10px]">
                {option?.icon} {option?.label}
            </Badge>
        );
    };

    const isOverdue = (task: UnifiedTask) => {
        if (!task.due_date || task.status === 'completed') return false;
        return new Date(task.due_date) < new Date();
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <Select
                                value={filters.status?.[0] || 'all'}
                                onValueChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        status: value === 'all' ? undefined : [value as TaskStatus],
                                    })
                                }
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.task_type?.[0] || 'all'}
                                onValueChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        task_type: value === 'all' ? undefined : [value as TaskType],
                                    })
                                }
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {TYPE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.icon} {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={(value) => setSortBy(value as TaskSortOption)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Sort by..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="due_date_asc">Due: Soonest</SelectItem>
                                    <SelectItem value="due_date_desc">Due: Latest</SelectItem>
                                    <SelectItem value="priority_desc">Priority</SelectItem>
                                    <SelectItem value="created_desc">Newest</SelectItem>
                                    <SelectItem value="title_asc">A-Z</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="overdue"
                                    checked={filters.is_overdue}
                                    onCheckedChange={(checked) =>
                                        setFilters({ ...filters, is_overdue: !!checked })
                                    }
                                />
                                <label htmlFor="overdue" className="text-sm cursor-pointer">
                                    Overdue only
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                        viewMode === 'list'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <List className="w-4 h-4 inline mr-1" />
                                    List
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                        viewMode === 'kanban'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <LayoutGrid className="w-4 h-4 inline mr-1" />
                                    Kanban
                                </button>
                            </div>

                            <Button
                                onClick={() => {
                                    setSelectedTask(null);
                                    setModalOpen(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Task
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                    <StatCard label="Total" value={summary.total_tasks || 0} />
                    <StatCard label="Active" value={(summary.total_tasks || 0) - (summary.by_status?.completed || 0)} />
                    <StatCard label="Completed" value={summary.by_status?.completed || 0} color="emerald" />
                    <StatCard label="Overdue" value={summary.overdue_count || 0} color="rose" />
                    <StatCard label="Due This Week" value={summary.due_this_week || 0} color="amber" />
                    <StatCard label="Completion" value={`${summary.completion_rate || 0}%`} isPercentage />
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <TaskListView
                    tasks={filteredTasks}
                    loading={loading}
                    onEdit={(task) => {
                        setSelectedTask(task);
                        setModalOpen(true);
                    }}
                    onDelete={handleDelete}
                    onToggleComplete={toggleTaskComplete}
                    getStatusBadge={getStatusBadge}
                    getPriorityBadge={getPriorityBadge}
                    getTypeBadge={getTypeBadge}
                    isOverdue={isOverdue}
                />
            )}

            {/* Kanban View */}
            {viewMode === 'kanban' && (
                <KanbanBoard
                    groups={kanbanGroups}
                    loading={loading}
                    onEdit={(task) => {
                        setSelectedTask(task);
                        setModalOpen(true);
                    }}
                    onToggleComplete={toggleTaskComplete}
                    getStatusBadge={getStatusBadge}
                    getPriorityBadge={getPriorityBadge}
                    getTypeBadge={getTypeBadge}
                    isOverdue={isOverdue}
                />
            )}

            {/* Modal */}
            <TaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={() => {
                    setModalOpen(false);
                    fetchTasks();
                    onRefresh?.();
                }}
                organizationId={organizationId}
                initialData={selectedTask}
            />
        </div>
    );
}

// Task List View Component
interface TaskListViewProps {
    tasks: UnifiedTask[];
    loading: boolean;
    onEdit: (task: UnifiedTask) => void;
    onDelete: (task: UnifiedTask) => void;
    onToggleComplete: (task: UnifiedTask) => void;
    getStatusBadge: (status: TaskStatus) => React.ReactNode;
    getPriorityBadge: (priority: string) => React.ReactNode | null;
    getTypeBadge: (type: TaskType) => React.ReactNode | null;
    isOverdue: (task: UnifiedTask) => boolean;
}

function TaskListView({
    tasks,
    loading,
    onEdit,
    onDelete,
    onToggleComplete,
    getStatusBadge,
    getPriorityBadge,
    getTypeBadge,
    isOverdue,
}: TaskListViewProps) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (tasks.length === 0) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="flex flex-col items-center gap-3">
                        <CheckCircle className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-semibold">No tasks found</p>
                        <p className="text-sm text-slate-400">Adjust your filters or create a new task</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Task</th>
                            <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Priority</th>
                            <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Assignee</th>
                            <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Due</th>
                            <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-500">Progress</th>
                            <th className="text-right py-3 px-4 text-xs font-black uppercase text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr
                                key={task.id}
                                className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <td className="py-3 px-4">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => onToggleComplete(task)}
                                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                task.status === 'completed'
                                                    ? 'bg-emerald-500 border-emerald-500'
                                                    : 'border-slate-300 hover:border-emerald-500'
                                            }`}
                                        >
                                            {task.status === 'completed' && (
                                                <CheckCircle className="w-3 h-3 text-white" />
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(task)}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{task.title}</span>
                                                {task.source_table === 'estates_compliance_tasks' && (
                                                    <Badge variant="outline" className="text-[9px]">
                                                        Estates
                                                    </Badge>
                                                )}
                                                {getTypeBadge(task.task_type)}
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4">{getStatusBadge(task.status)}</td>
                                <td className="py-3 px-4">{getPriorityBadge(task.priority)}</td>
                                <td className="py-3 px-4">
                                    {task.assignee_id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                {(task.assignee_name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs">{task.assignee_name || 'Unassigned'}</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 text-xs">Unassigned</span>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    <div className={`flex items-center gap-1.5 text-xs ${isOverdue(task) ? 'text-rose-600' : 'text-slate-600'}`}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        {task.due_date
                                            ? new Date(task.due_date).toLocaleDateString('en-GB', {
                                                  day: 'numeric',
                                                  month: 'short',
                                              })
                                            : '-'}
                                        {isOverdue(task) && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${
                                                    task.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${task.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-500">{task.progress}%</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(task)}
                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                        >
                                            <Edit className="w-4 h-4 text-slate-500" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(task)}
                                            className="p-1.5 hover:bg-rose-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4 text-rose-500" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}

// Kanban Board Component
interface KanbanBoardProps {
    groups: Record<TaskStatus, UnifiedTask[]>;
    loading: boolean;
    onEdit: (task: UnifiedTask) => void;
    onToggleComplete: (task: UnifiedTask) => void;
    getStatusBadge: (status: TaskStatus) => React.ReactNode;
    getPriorityBadge: (priority: string) => React.ReactNode | null;
    getTypeBadge: (type: TaskType) => React.ReactNode | null;
    isOverdue: (task: UnifiedTask) => boolean;
}

function KanbanBoard({
    groups,
    loading,
    onEdit,
    onToggleComplete,
    getStatusBadge,
    getPriorityBadge,
    getTypeBadge,
    isOverdue,
}: KanbanBoardProps) {
    const columns: { status: TaskStatus; title: string }[] = [
        { status: 'not_started', title: 'Not Started' },
        { status: 'in_progress', title: 'In Progress' },
        { status: 'review', title: 'In Review' },
        { status: 'completed', title: 'Completed' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((column) => (
                <div key={column.status} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold">{column.title}</h3>
                        <span className="bg-slate-200 dark:bg-slate-800 text-xs font-bold px-2 py-0.5 rounded-full">
                            {groups[column.status]?.length || 0}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {groups[column.status]?.map((task) => (
                            <KanbanCard
                                key={task.id}
                                task={task}
                                onEdit={onEdit}
                                onToggleComplete={onToggleComplete}
                                getPriorityBadge={getPriorityBadge}
                                getTypeBadge={getTypeBadge}
                                isOverdue={isOverdue}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Kanban Card Component
interface KanbanCardProps {
    task: UnifiedTask;
    onEdit: (task: UnifiedTask) => void;
    onToggleComplete: (task: UnifiedTask) => void;
    getPriorityBadge: (priority: string) => React.ReactNode | null;
    getTypeBadge: (type: TaskType) => React.ReactNode | null;
    isOverdue: (task: UnifiedTask) => boolean;
}

function KanbanCard({
    task,
    onEdit,
    onToggleComplete,
    getPriorityBadge,
    getTypeBadge,
    isOverdue,
}: KanbanCardProps) {
    const isCompleted = task.status === 'completed';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onEdit(task)}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task);
                    }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isCompleted
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 hover:border-emerald-500'
                    }`}
                >
                    {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                </button>
                {getPriorityBadge(task.priority)}
            </div>

            <h4 className={`text-sm font-medium mb-2 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                {task.title}
            </h4>

            {getTypeBadge(task.task_type)}

            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {task.due_date
                        ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : 'No due date'}
                </div>
                {isOverdue(task) && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
            </div>

            <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${task.progress}%` }}
                    />
                </div>
                <span className="text-[10px] text-slate-500">{task.progress}%</span>
            </div>
        </motion.div>
    );
}

// Stat Card Component
function StatCard({
    label,
    value,
    color,
    isPercentage,
}: {
    label: string;
    value: number | string;
    color?: string;
    isPercentage?: boolean;
}) {
    const colorClasses: Record<string, string> = {
        emerald: 'text-emerald-600 bg-emerald-100',
        rose: 'text-rose-600 bg-rose-100',
        amber: 'text-amber-600 bg-amber-100',
        blue: 'text-blue-600 bg-blue-100',
        slate: 'text-slate-600 bg-slate-100',
    };

    const defaultColor = color || 'slate';

    return (
        <Card>
            <CardContent className="p-3">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${colorClasses[defaultColor]}`}>
                        {isPercentage ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
                        <p className="text-lg font-bold">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
