"use client";

import { ActionItem, OFSTED_FRAMEWORK } from '@/lib/ofsted-framework';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Layers, List, Download, Maximize2, Move, Zap, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionsGanttChartProps {
    actions: ActionItem[];
    onUpdateDates?: (id: string, start: string, due: string) => void;
}

const COLOR_MAP: Record<string, { bar: string, text: string, border: string }> = {
    'rose': { bar: 'bg-rose-500/10 hover:bg-rose-500/20', text: 'text-rose-700', border: 'border-rose-500/30' },
    'teal': { bar: 'bg-teal-500/10 hover:bg-teal-500/20', text: 'text-teal-700', border: 'border-teal-500/30' },
    'orange': { bar: 'bg-orange-500/10 hover:bg-orange-500/20', text: 'text-orange-700', border: 'border-orange-500/30' },
    'violet': { bar: 'bg-violet-500/10 hover:bg-violet-500/20', text: 'text-violet-700', border: 'border-violet-500/30' },
    'blue': { bar: 'bg-blue-500/10 hover:bg-blue-500/20', text: 'text-blue-700', border: 'border-blue-500/30' },
    'gray': { bar: 'bg-gray-500/10 hover:bg-gray-500/20', text: 'text-gray-700', border: 'border-gray-500/30' },
};

export default function ActionsGanttChart({ actions, onUpdateDates }: ActionsGanttChartProps) {
    const [groupByCategory, setGroupByCategory] = useState(true);
    const [dragging, setDragging] = useState<{
        id: string,
        startX: number,
        type: 'move' | 'resize-start' | 'resize-end',
        originalStart: string,
        originalDue: string
    } | null>(null);
    const [previewActions, setPreviewActions] = useState<Record<string, { start: string, due: string }>>({});
    const chartRef = useRef<HTMLDivElement>(null);

    // 1. Filter out actions without dates (and handle edge cases)
    const validActions = useMemo(() => {
        return actions.map(a => {
            const preview = previewActions[a.id];
            const start = preview?.start || a.startDate || new Date().toISOString();
            const due = preview?.due || a.dueDate || new Date(new Date(start).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
            return { ...a, startDate: start, dueDate: due };
        });
    }, [actions, previewActions]);

    // 2. Determine Date Range
    const { minDate, maxDate, totalDays } = useMemo(() => {
        if (validActions.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 0 };

        const dates = validActions.flatMap(a => [new Date(a.startDate!), new Date(a.dueDate!)]);
        const min = new Date(Math.min(...dates.map(d => d.getTime())));
        const max = new Date(Math.max(...dates.map(d => d.getTime())));

        // Add buffer (7 days before, 14 days after)
        min.setDate(min.getDate() - 7);
        max.setDate(max.getDate() + 14);

        const diffTime = Math.abs(max.getTime() - min.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { minDate: min, maxDate: max, totalDays: diffDays };
    }, [validActions]);

    // 3. Grouping Logic
    const groupedActions = useMemo(() => {
        if (!groupByCategory) {
            return { 'All Actions': [...validActions].sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()) };
        }

        const groups: Record<string, ActionItem[]> = {};
        validActions.forEach(action => {
            const cat = action.category || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(action);
        });
        return groups;
    }, [validActions, groupByCategory]);

    // PRE-CALCULATE Y POSITIONS FOR DEPENDENCIES
    const rowYMap = useMemo(() => {
        const map: Record<string, number> = {};
        let currentY = 72; // Start after header (40px + 32px margin)

        Object.entries(groupedActions).forEach(([cat, catActions]) => {
            currentY += 40; // Approx Header height + margin
            catActions.forEach((action, idx) => {
                map[action.id] = currentY + 20; // Center of 40px row
                currentY += 56; // 40px row + 16px space (space-y-4)
            });
            currentY += 48; // Space-y-12 between categories
        });
        return map;
    }, [groupedActions]);

    // Helper to calculate position and width
    const getPosition = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const startDiff = (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

        const left = (startDiff / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
    };

    const getCategoryStyles = (categoryName: string) => {
        const category = OFSTED_FRAMEWORK.find(c => c.name === categoryName);
        const colorName = category?.color || 'gray';
        return COLOR_MAP[colorName] || COLOR_MAP['gray'];
    };

    // Generating Month/Week Markers
    const timeMarkers = useMemo(() => {
        const markers = [];
        const current = new Date(minDate);
        while (current <= maxDate) {
            markers.push(new Date(current));
            current.setDate(current.getDate() + 7); // Weekly markers
        }
        return markers;
    }, [minDate, maxDate]);

    // --- Interaction Handlers ---

    const handleMouseDown = (e: React.MouseEvent, action: ActionItem, type: 'move' | 'resize-start' | 'resize-end' = 'move') => {
        if (action.status === 'completed') return;
        e.stopPropagation();
        setDragging({
            id: action.id,
            startX: e.clientX,
            type,
            originalStart: action.startDate!,
            originalDue: action.dueDate!
        });
    };

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging || !chartRef.current) return;

            const chartWidth = chartRef.current.offsetWidth;
            const deltaX = e.clientX - dragging.startX;
            const deltaDays = Math.round((deltaX / chartWidth) * totalDays);

            if (deltaDays === 0 && Object.keys(previewActions).length === 0) return;

            const newStart = new Date(dragging.originalStart);
            const newDue = new Date(dragging.originalDue);

            if (dragging.type === 'move') {
                newStart.setDate(newStart.getDate() + deltaDays);
                newDue.setDate(newDue.getDate() + deltaDays);
            } else if (dragging.type === 'resize-start') {
                newStart.setDate(newStart.getDate() + deltaDays);
                if (newStart >= newDue) newStart.setDate(newDue.getDate() - 1);
            } else if (dragging.type === 'resize-end') {
                newDue.setDate(newDue.getDate() + deltaDays);
                if (newDue <= newStart) newDue.setDate(newStart.getDate() + 1);
            }

            setPreviewActions({
                [dragging.id]: {
                    start: formatDate(newStart),
                    due: formatDate(newDue)
                }
            });
        };

        const handleMouseUp = () => {
            if (dragging && previewActions[dragging.id]) {
                const preview = previewActions[dragging.id];
                onUpdateDates?.(dragging.id, preview.start, preview.due);
            }
            setDragging(null);
            setPreviewActions({});
        };

        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, totalDays, previewActions, onUpdateDates]);

    const handleExport = () => {
        // Mock export
        alert("Preparing high-resolution PDF export...");
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap size={20} className="text-blue-600" />
                        Gantt Timeline
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Synchronized project delivery schedule</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-xl flex border border-slate-200 dark:border-slate-700 shadow-sm">
                        <button
                            onClick={() => setGroupByCategory(true)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${groupByCategory ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers size={14} /> Category
                        </button>
                        <button
                            onClick={() => setGroupByCategory(false)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${!groupByCategory ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List size={14} /> Flat
                        </button>
                    </div>

                    <button
                        onClick={handleExport}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 hover:text-blue-600 transition-all shadow-sm group"
                        title="Export to PDF"
                    >
                        <Download size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 hover:text-blue-600 transition-all shadow-sm">
                        <Maximize2 size={18} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar" ref={chartRef}>
                <div className="min-w-[1200px] p-8 relative min-h-[500px]">

                    {/* Date Markers Header */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800 pb-4 mb-8 relative h-10">
                        {timeMarkers.map((date, i) => {
                            const left = ((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
                            if (left < 0 || left > 100) return null;
                            const isMonthStart = date.getDate() <= 7;

                            return (
                                <div key={i} className="absolute flex flex-col items-center transform -translate-x-1/2" style={{ left: `${left}%` }}>
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isMonthStart ? 'text-blue-600' : 'text-slate-400'}`}>
                                        {isMonthStart ? date.toLocaleDateString('en-GB', { month: 'short' }) : `W${Math.ceil(date.getDate() / 7)}`}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-300">{date.getDate()}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Horizontal Grid Lines */}
                    <div className="absolute inset-0 top-24 pointer-events-none opacity-50">
                        {timeMarkers.map((date, i) => {
                            const left = ((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
                            if (left < 0 || left > 100) return null;
                            return (
                                <div key={i} className={`absolute top-0 bottom-0 border-l ${date.getDate() <= 7 ? 'border-slate-200 dark:border-slate-700 border-solid' : 'border-slate-100 dark:border-slate-800 border-dashed'}`} style={{ left: `${left}%` }} />
                            );
                        })}
                    </div>

                    {/* Timeline Today Indicator */}
                    {(() => {
                        const todayLeft = ((new Date().getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
                        if (todayLeft < 0 || todayLeft > 100) return null;
                        return (
                            <div className="absolute top-0 bottom-0 w-0.5 bg-blue-500/30 z-20 pointer-events-none border-l border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ left: `${todayLeft}%` }}>
                                <div className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap">TODAY</div>
                            </div>
                        );
                    })()}

                    {/* Task Dependency SVG Layer (Placeholders for arrows) */}
                    <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" fillOpacity="0.5" />
                            </marker>
                        </defs>
                        {validActions.map(action => {
                            if (!action.dependencies || action.dependencies.length === 0) return null;

                            return action.dependencies.map(depId => {
                                const source = validActions.find(a => a.id === depId);
                                if (!source) return null;

                                const sourcePos = getPosition(source.startDate!, source.dueDate!);
                                const targetPos = getPosition(action.startDate!, action.dueDate!);
                                const targetY = rowYMap[action.id];
                                const sourceY = rowYMap[source.id];

                                if (targetY === undefined || sourceY === undefined) return null;

                                const startX = parseFloat(sourcePos.left) + parseFloat(sourcePos.width);
                                const endX = parseFloat(targetPos.left);

                                // Complex path: Horizontal out -> Vertical -> Horizontal in
                                return (
                                    <motion.path
                                        key={`${source.id}-${action.id}`}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        d={`M ${startX}% ${sourceY} L ${startX + 1}% ${sourceY} L ${startX + 1}% ${targetY} L ${endX}% ${targetY}`}
                                        stroke="#3b82f6"
                                        strokeWidth="1.5"
                                        strokeOpacity="0.4"
                                        fill="none"
                                        markerEnd="url(#arrowhead)"
                                    />
                                );
                            });
                        })}
                    </svg>

                    {/* Rows */}
                    <div className="space-y-12 relative z-20">
                        {Object.entries(groupedActions).map(([category, catActions], groupIdx) => (
                            <motion.div
                                key={category}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: groupIdx * 0.1 }}
                            >
                                <div className="flex items-center gap-3 mb-4 sticky left-0 z-30">
                                    <div className={`w-2 h-6 rounded-full ${getCategoryStyles(category).bar.replace('/10', '')}`} />
                                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                                        {category}
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        {catActions.length} Actions
                                    </span>
                                </div>

                                <div className="space-y-4 ml-2">
                                    {catActions.map((action, actionIdx) => {
                                        const pos = getPosition(action.startDate!, action.dueDate!);
                                        const styles = getCategoryStyles(category);
                                        const isCritical = action.priority === 'high' || action.isCritical;

                                        return (
                                            <div key={action.id} className="relative h-10 flex items-center group">
                                                {/* Connecting line to category */}
                                                <div className="absolute -left-2 w-2 h-px bg-slate-200 dark:border-slate-800" />

                                                {/* Gantt Bar */}
                                                <motion.div
                                                    layoutId={`action-${action.id}`}
                                                    onMouseDown={(e) => handleMouseDown(e, action)}
                                                    className={`absolute h-8 rounded-xl border ${styles.border} ${styles.bar} ${dragging?.id === action.id ? 'z-50 ring-2 ring-blue-500 scale-[1.02]' : ''} ${action.status === 'completed' ? 'opacity-40 grayscale-[0.5]' : ''} cursor-move transition-all flex items-center px-4 group/bar overflow-hidden shadow-sm hover:shadow-md`}
                                                    style={pos}
                                                >
                                                    {isCritical && (
                                                        <Zap size={10} className="text-blue-600 shrink-0 mr-2" />
                                                    )}
                                                    <span className={`text-[11px] font-bold truncate ${styles.text} ${action.status === 'completed' ? 'line-through' : ''}`}>
                                                        {action.description}
                                                    </span>

                                                    {/* Status indicator */}
                                                    <div className={`ml-auto w-1.5 h-1.5 rounded-full ${action.status === 'completed' ? 'bg-emerald-500' : action.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />

                                                    {/* Drag Resizers */}
                                                    <div
                                                        onMouseDown={(e) => handleMouseDown(e, action, 'resize-start')}
                                                        className="absolute inset-y-0 left-0 w-2 hover:bg-blue-500/30 cursor-ew-resize z-30"
                                                    />
                                                    <div
                                                        onMouseDown={(e) => handleMouseDown(e, action, 'resize-end')}
                                                        className="absolute inset-y-0 right-0 w-2 hover:bg-blue-500/30 cursor-ew-resize z-30"
                                                    />
                                                </motion.div>
                                                {/* Dependency Link Indicator */}
                                                {action.dependencies && action.dependencies.length > 0 && (
                                                    <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                                                        <LinkIcon size={10} className="text-blue-400" />
                                                    </div>
                                                )}

                                                {/* Hover Tooltip - Apple Desktop Style */}
                                                <AnimatePresence>
                                                    <motion.div
                                                        className="hidden group-hover:block absolute z-50 pointer-events-none"
                                                        style={{ left: pos.left, top: '100%' }}
                                                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 10 }}
                                                    >
                                                        <div className="bg-slate-900/90 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl border border-white/20 w-72">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{action.category}</span>
                                                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                    {action.priority.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-bold mb-1 leading-tight">{action.description}</h4>
                                                            <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{action.rationale}</p>

                                                            <div className="flex justify-between items-center text-[10px] font-medium text-slate-300 border-t border-white/10 pt-3">
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-500">START</span>
                                                                    <span>{new Date(action.startDate!).toLocaleDateString('en-GB')}</span>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-slate-500">DUE</span>
                                                                    <span className={new Date(action.dueDate!) < new Date() ? 'text-rose-400' : ''}>
                                                                        {new Date(action.dueDate!).toLocaleDateString('en-GB')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 justify-center">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" /> Completed
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-blue-500" /> In Progress
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-slate-200" /> Not Started
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <Zap size={12} className="text-blue-500" /> Critical Path
                </div>
            </div>
        </div>
    );
}
