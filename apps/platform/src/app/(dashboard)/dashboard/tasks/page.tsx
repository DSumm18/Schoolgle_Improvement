"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Sparkles, ListTodo, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { UnifiedTaskList } from '@/components/tasks';
import { TaskModal } from '@/components/tasks';
import { TaskDetailPanel } from '@/components/tasks';
import { WorkloadView } from '@/components/tasks';
import type { UnifiedTask } from '@/lib/tasks';

type View = 'list' | 'kanban' | 'workload';

export default function TasksPage() {
    const { organization } = useAuth();
    const [view, setView] = useState<View>('list');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
    const [editingTask, setEditingTask] = useState<UnifiedTask | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const organizationId = organization?.id || '';

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleEditTask = (task: UnifiedTask) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleDeleteTask = (task: UnifiedTask) => {
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
            // Delete logic would be handled in the component
            handleRefresh();
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
            >
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-2xl">
                        <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
                            <Sparkles size={14} className="animate-pulse" />
                            Unified Task Management
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Tasks
                        </h1>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button
                        onClick={() => setView('list')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            view === 'list'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <ListTodo className="w-4 h-4" />
                        <span className="hidden sm:inline">List</span>
                    </button>
                    <button
                        onClick={() => setView('kanban')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            view === 'kanban'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Kanban</span>
                    </button>
                    <button
                        onClick={() => setView('workload')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            view === 'workload'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Workload</span>
                    </button>
                </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
                key={`${view}-${refreshKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {view === 'workload' ? (
                    <WorkloadView organizationId={organizationId} />
                ) : (
                    <UnifiedTaskList
                        key={refreshKey}
                        organizationId={organizationId}
                        defaultView={view}
                        onAddTask={() => {
                            setEditingTask(null);
                            setIsTaskModalOpen(true);
                        }}
                        onSelectTask={setSelectedTask}
                    />
                )}
            </motion.div>

            {/* Task Modal */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
                }}
                onSave={() => {
                    handleRefresh();
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
                }}
                organizationId={organizationId}
                initialData={editingTask}
            />

            {/* Task Detail Panel */}
            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailPanel
                        organizationId={organizationId}
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={handleRefresh}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
