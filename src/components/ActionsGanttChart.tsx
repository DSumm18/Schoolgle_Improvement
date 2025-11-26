"use client";

import { ActionItem, OFSTED_FRAMEWORK } from '@/lib/ofsted-framework';
import { useMemo, useState } from 'react';
import { Layers, List } from 'lucide-react';

interface ActionsGanttChartProps {
    actions: ActionItem[];
}

const COLOR_MAP: Record<string, string> = {
    'rose': 'bg-rose-100 border-l-4 border-rose-500 text-rose-900',
    'teal': 'bg-teal-100 border-l-4 border-teal-500 text-teal-900',
    'orange': 'bg-orange-100 border-l-4 border-orange-500 text-orange-900',
    'violet': 'bg-violet-100 border-l-4 border-violet-500 text-violet-900',
    'blue': 'bg-blue-100 border-l-4 border-blue-500 text-blue-900',
    'gray': 'bg-gray-100 border-l-4 border-gray-500 text-gray-900',
};

export default function ActionsGanttChart({ actions }: ActionsGanttChartProps) {
    const [groupByCategory, setGroupByCategory] = useState(true);

    // 1. Filter out actions without dates
    const validActions = useMemo(() => actions.filter(a => a.startDate && a.dueDate), [actions]);

    // 2. Determine Date Range
    const { minDate, maxDate, totalDays } = useMemo(() => {
        if (validActions.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 0 };

        const dates = validActions.flatMap(a => [new Date(a.startDate!), new Date(a.dueDate!)]);
        const min = new Date(Math.min(...dates.map(d => d.getTime())));
        const max = new Date(Math.max(...dates.map(d => d.getTime())));

        // Add buffer (1 week before, 1 week after)
        min.setDate(min.getDate() - 7);
        max.setDate(max.getDate() + 7);

        const diffTime = Math.abs(max.getTime() - min.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { minDate: min, maxDate: max, totalDays: diffDays };
    }, [validActions]);

    // 3. Group by Category (or single group)
    const groupedActions = useMemo(() => {
        if (!groupByCategory) {
            return { 'All Actions': validActions.sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()) };
        }

        const groups: Record<string, ActionItem[]> = {};
        validActions.forEach(action => {
            const cat = action.category || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(action);
        });
        return groups;
    }, [validActions, groupByCategory]);

    // Helper to calculate position and width
    const getPosition = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const startDiff = Math.ceil((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const left = (startDiff / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        return { left: `${left}%`, width: `${Math.max(width, 1)}%` }; // Min width 1%
    };

    const getCategoryColor = (categoryName: string) => {
        const category = OFSTED_FRAMEWORK.find(c => c.name === categoryName);
        const colorName = category?.color || 'gray';
        return COLOR_MAP[colorName] || COLOR_MAP['gray'];
    };

    if (validActions.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No actions with valid start and due dates to display.</p>
                <p className="text-xs text-gray-400 mt-1">Edit actions to add dates to see them on the timeline.</p>
            </div>
        );
    }

    // Generate Month Markers
    const monthMarkers = [];
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
        monthMarkers.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1); // Reset to 1st of month
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Project Timeline</h2>
                    <p className="text-sm text-gray-500">Visual overview of action schedules</p>
                </div>

                {/* View Toggle */}
                <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
                    <button
                        onClick={() => setGroupByCategory(true)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${groupByCategory ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layers size={14} /> Grouped
                    </button>
                    <button
                        onClick={() => setGroupByCategory(false)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${!groupByCategory ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List size={14} /> Holistic
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[800px] p-6 relative">
                    {/* Timeline Header */}
                    <div className="flex border-b border-gray-200 pb-2 mb-4 relative h-8">
                        {monthMarkers.map((date, i) => {
                            const left = ((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
                            if (left < 0 || left > 100) return null;
                            return (
                                <div key={i} className="absolute text-xs font-semibold text-gray-500 transform -translate-x-1/2" style={{ left: `${left}%` }}>
                                    {date.toLocaleDateString('default', { month: 'short', year: '2-digit' })}
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid Lines */}
                    <div className="absolute inset-0 top-24 pointer-events-none">
                        {monthMarkers.map((date, i) => {
                            const left = ((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
                            if (left < 0 || left > 100) return null;
                            return (
                                <div key={i} className="absolute top-0 bottom-0 border-l border-gray-100 border-dashed" style={{ left: `${left}%` }} />
                            );
                        })}
                    </div>

                    {/* Groups */}
                    <div className="space-y-8 relative z-10">
                        {Object.entries(groupedActions).map(([category, catActions]) => (
                            <div key={category}>
                                <h3 className="text-sm font-bold text-gray-700 mb-2 sticky left-0 bg-white/80 backdrop-blur-sm inline-block px-2 rounded">
                                    {category}
                                </h3>
                                <div className="space-y-2">
                                    {catActions.map(action => {
                                        const style = getPosition(action.startDate!, action.dueDate!);
                                        return (
                                            <div key={action.id} className="relative h-8 flex items-center group">
                                                {/* Bar */}
                                                <div
                                                    className={`absolute h-6 rounded shadow-sm cursor-pointer transition-all flex items-center px-2 overflow-hidden ${getCategoryColor(action.category || '')}`}
                                                    style={style}
                                                >
                                                    <span className="text-xs font-medium truncate">{action.description}</span>

                                                    {/* Tooltip */}
                                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded p-2 z-20 pointer-events-none transition-opacity shadow-lg">
                                                        <div className="font-bold mb-1">{action.description}</div>
                                                        <div className="text-gray-300 mb-1">{action.category}</div>
                                                        <div className="flex justify-between text-gray-400">
                                                            <span>{new Date(action.startDate!).toLocaleDateString()}</span>
                                                            <span>{new Date(action.dueDate!).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
