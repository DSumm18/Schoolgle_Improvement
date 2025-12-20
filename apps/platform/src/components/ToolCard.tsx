"use client";

import React, { useState } from 'react';
import { ExternalLink, Globe } from 'lucide-react';

export interface Tool {
    id: string;
    name: string;
    url: string;
    category: 'Finance' | 'SEND' | 'Teaching' | 'HR' | 'Estates' | 'Compliance' | 'Admin' | 'Data';
    tags: string[];
    pricing: 'Free' | 'Free tier' | 'Education free';
    summary: string;
    notes?: string;
    source?: string;
}

interface ToolCardProps {
    tool: Tool;
    workspaceMode?: boolean;
    onLaunchInWorkspace?: (tool: Tool) => void;
}

const categoryColors: Record<Tool['category'], { bg: string; text: string; border: string }> = {
    Finance: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    SEND: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
    Teaching: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    HR: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    Estates: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
    Compliance: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
    Admin: { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800' },
    Data: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
};

const pricingColors: Record<Tool['pricing'], string> = {
    'Free': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    'Free tier': 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    'Education free': 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
};

export default function ToolCard({ tool, workspaceMode, onLaunchInWorkspace }: ToolCardProps) {
    const [faviconError, setFaviconError] = useState(false);
    const categoryStyle = categoryColors[tool.category];
    const pricingStyle = pricingColors[tool.pricing];

    // Get favicon via Google S2 service
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(tool.url).hostname)}&sz=32`;

    // Launch tool in workspace popup window
    const handleWorkspaceLaunch = () => {
        if (onLaunchInWorkspace) {
            onLaunchInWorkspace(tool);
        }
    };

    return (
        <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-200">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    {!faviconError ? (
                        <img 
                            src={faviconUrl} 
                            alt="" 
                            className="w-6 h-6"
                            onError={() => setFaviconError(true)}
                        />
                    ) : (
                        <Globe size={20} className="text-gray-400 dark:text-gray-500" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 truncate">
                        {tool.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
                            {tool.category}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${pricingStyle}`}>
                            {tool.pricing}
                        </span>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                {tool.summary}
            </p>

            {/* Notes */}
            {tool.notes && (
                <p className="text-gray-500 dark:text-gray-500 text-xs italic mb-4">
                    {tool.notes}
                </p>
            )}

            {/* Tags */}
            {tool.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {tool.tags.slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded"
                        >
                            {tag}
                        </span>
                    ))}
                    {tool.tags.length > 4 && (
                        <span className="px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500">
                            +{tool.tags.length - 4} more
                        </span>
                    )}
                </div>
            )}

            {/* Action */}
            {workspaceMode ? (
                <button
                    onClick={handleWorkspaceLaunch}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-gray-100 dark:group-hover:text-gray-900"
                >
                    Launch in workspace
                    <ExternalLink size={14} />
                </button>
            ) : (
                <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-gray-100 dark:group-hover:text-gray-900"
                >
                    Open tool
                    <ExternalLink size={14} />
                </a>
            )}
        </div>
    );
}

