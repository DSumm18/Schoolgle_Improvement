"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    Search, X, ExternalLink, 
    Wrench, ChevronLeft, ChevronRight,
    Globe, Home, MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { Tool } from '@/components/ToolCard';
import EdWidgetWrapper from '@/components/EdWidgetWrapper';
import toolsData from '@/data/tools.json';

// Tool expertise data for Ed's context - keys MUST match tool IDs from tools.json
const TOOL_EXPERTISE: Record<string, string[]> = {
    'canva-edu': ['design templates', 'brand kit setup', 'student collaboration', 'classroom folders'],
    'google-workspace-edu': ['Google Classroom', 'Drive organization', 'admin console', 'student permissions'],
    'every-budget': ['budget forecasting', 'staffing costs', 'scenario planning', 'CFR codes'],
    'schoolbus': ['safeguarding', 'KCSIE', 'model policies', 'statutory compliance'],
    'widgit-online': ['symbol communication', 'visual timetables', 'social stories', 'SEND resources'],
    'immersive-reader': ['text-to-speech', 'line focus', 'syllable highlighting', 'translation'],
    'teachers-pet': ['curriculum resources', 'differentiated materials', 'display materials', 'planning'], // Twinkl
    'smartsurvey': ['survey design', 'GDPR compliance', 'data export', 'parent voice'],
    'tlp-templates': ['HR policies', 'employment contracts', 'absence management', 'grievance procedures'], // The Key HR
    'condition-survey': ['building conditions', 'DfE programmes', 'estates planning', 'maintenance'],
    'risk-assessment-tool': ['risk assessment', 'health and safety', 'school trips', 'event planning'], // HSE
    'analyse-school-performance': ['attainment data', 'progress measures', 'absence analysis', 'SEF writing'], // ASP
};

const CATEGORIES = ['All', 'Finance', 'SEND', 'Teaching', 'HR', 'Estates', 'Compliance', 'Admin', 'Data'] as const;
type Category = typeof CATEGORIES[number];

interface ActiveTool {
    tool: Tool;
    windowRef: Window | null;
}

export default function ToolboxWorkspacePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
    const [edOpen, setEdOpen] = useState(true); // Ed is visible by default in workspace
    const [edMinimized, setEdMinimized] = useState(false);
    const windowCheckInterval = useRef<NodeJS.Timeout | null>(null);

    const tools: Tool[] = toolsData.tools;

    // Update Ed's tool context when active tool changes
    useEffect(() => {
        const edInstance = (window as any).__ED_INSTANCE__;
        if (edInstance && typeof edInstance.setToolContext === 'function') {
            if (activeTool) {
                // Use the exact tool ID from tools.json - no normalization needed
                const toolId = activeTool.tool.id;
                const expertise = TOOL_EXPERTISE[toolId] || ['general guidance', 'best practices'];
                edInstance.setToolContext({
                    name: activeTool.tool.name,
                    category: activeTool.tool.category,
                    url: activeTool.tool.url,
                    expertise,
                });
            } else {
                edInstance.setToolContext(null);
            }
        }
    }, [activeTool]);

    // Filter tools
    const filteredTools = tools.filter((tool) => {
        if (selectedCategory !== 'All' && tool.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return tool.name.toLowerCase().includes(query) || 
                   tool.summary.toLowerCase().includes(query) ||
                   tool.tags.some(tag => tag.toLowerCase().includes(query));
        }
        return true;
    });

    // Select a tool (sets Ed's context) - doesn't auto-open
    const selectTool = (tool: Tool) => {
        // Set tool context so Ed knows what the user is working with
        setActiveTool({ tool, windowRef: null });
    };

    // Actually open the tool in a new tab (user-initiated)
    const openToolInNewTab = () => {
        if (activeTool) {
            window.open(activeTool.tool.url, '_blank', 'noopener,noreferrer');
        }
    };

    // Open tool in popup window (user-initiated)
    const openToolInPopup = () => {
        if (!activeTool) return;

        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        const popupWidth = Math.min(1200, screenWidth * 0.7);
        const popupHeight = screenHeight - 100;
        const popupLeft = screenWidth - popupWidth - 50;
        const popupTop = 50;

        const windowFeatures = `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`;

        const newWindow = window.open(activeTool.tool.url, `schoolgle_workspace_${activeTool.tool.id}`, windowFeatures);
        
        if (newWindow && !newWindow.closed) {
            setActiveTool({ tool: activeTool.tool, windowRef: newWindow });
        }
    };

    // Monitor if popup window is closed
    useEffect(() => {
        if (activeTool?.windowRef) {
            windowCheckInterval.current = setInterval(() => {
                if (activeTool.windowRef?.closed) {
                    setActiveTool(null);
                    if (windowCheckInterval.current) {
                        clearInterval(windowCheckInterval.current);
                    }
                }
            }, 1000);
        }

        return () => {
            if (windowCheckInterval.current) {
                clearInterval(windowCheckInterval.current);
            }
        };
    }, [activeTool]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (activeTool?.windowRef && !activeTool.windowRef.closed) {
                // Optionally close the popup when leaving workspace
                // activeTool.windowRef.close();
            }
        };
    }, []);

    return (
        <div className="h-screen bg-gray-950 flex overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarCollapsed ? 64 : 320 }}
                className="h-full bg-gray-900 border-r border-gray-800 flex flex-col relative"
            >
                {/* Collapse Toggle */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="absolute -right-3 top-6 z-10 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                    {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Header */}
                <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Wrench size={16} className="text-white" />
                        </div>
                        {!sidebarCollapsed && (
                            <div>
                                <h1 className="text-sm font-semibold text-white">Toolbox</h1>
                                <p className="text-xs text-gray-500">Workspace Mode</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search & Filters */}
                {!sidebarCollapsed && (
                    <div className="p-3 border-b border-gray-800 space-y-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search tools..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {CATEGORIES.slice(0, 5).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                        selectedCategory === cat
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tool List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredTools.map((tool) => (
                        <ToolListItem
                            key={tool.id}
                            tool={tool}
                            collapsed={sidebarCollapsed}
                            isActive={activeTool?.tool.id === tool.id}
                            onLaunch={() => selectTool(tool)}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-800">
                    <Link
                        href="/toolbox"
                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <Home size={14} />
                        {!sidebarCollapsed && 'Exit Workspace'}
                    </Link>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col">
                {/* Active Tool Header */}
                {activeTool && (
                    <div className="h-14 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center">
                                <Globe size={14} className="text-gray-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-medium text-white">{activeTool.tool.name}</h2>
                                <p className="text-xs text-gray-500">
                                    {activeTool.windowRef ? 'Running in external window' : 'Popup blocked - open manually'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeTool.windowRef ? (
                                <button
                                    onClick={() => activeTool.windowRef?.focus()}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <ExternalLink size={12} />
                                    Focus Window
                                </button>
                            ) : (
                                <a
                                    href={activeTool.tool.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <ExternalLink size={12} />
                                    Open in New Tab
                                </a>
                            )}
                            <button
                                onClick={() => {
                                    activeTool.windowRef?.close();
                                    setActiveTool(null);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Workspace Content */}
                <div className="flex-1 flex items-center justify-center p-8">
                    {activeTool ? (
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
                                <ExternalLink size={32} className="text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2">
                                {activeTool.tool.name}
                            </h3>
                            <p className="text-sm text-emerald-400 mb-2">{activeTool.tool.category}</p>
                            <p className="text-gray-400 mb-6">
                                {activeTool.tool.summary}
                            </p>
                            
                            {activeTool.windowRef ? (
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <button
                                        onClick={() => activeTool.windowRef?.focus()}
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                                    >
                                        Focus Window
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                                    <button
                                        onClick={openToolInNewTab}
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <ExternalLink size={16} />
                                        Open in New Tab
                                    </button>
                                    <button
                                        onClick={openToolInPopup}
                                        className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Open in Popup
                                    </button>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-gray-800">
                                <p className="text-sm text-gray-500 mb-3">Ed can help you with this tool:</p>
                                <button
                                    onClick={() => (window as any).__ED_INSTANCE__?.open()}
                                    className="px-6 py-2.5 text-sm font-medium text-purple-300 bg-purple-900/30 hover:bg-purple-900/50 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <MessageCircle size={16} />
                                    Ask Ed for help
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-800 flex items-center justify-center">
                                <Wrench size={32} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2">
                                Welcome to Toolbox Workspace
                            </h3>
                            <p className="text-gray-400 mb-2">
                                Select a tool from the sidebar to launch it in a popup window. 
                                Schoolgle stays open here so you can quickly switch between tools.
                            </p>
                            <p className="text-gray-500 text-sm">
                                Ed is available to help you with any tool — just click "Ask Ed".
                            </p>
                        </div>
                    )}
                </div>

                {/* Real Ed Widget - With 3D Particle Orb */}
                <EdWidgetWrapper
                    isOpen={edOpen}
                    onToggle={() => setEdOpen(!edOpen)}
                    isMinimized={edMinimized}
                    onToggleMinimize={() => setEdMinimized(!edMinimized)}
                    mode="user"
                />
            </main>
        </div>
    );
}

// Compact tool list item for sidebar
function ToolListItem({ 
    tool, 
    collapsed, 
    isActive, 
    onLaunch 
}: { 
    tool: Tool; 
    collapsed: boolean; 
    isActive: boolean;
    onLaunch: () => void;
}) {
    const [faviconError, setFaviconError] = useState(false);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(tool.url).hostname)}&sz=32`;

    return (
        <button
            onClick={onLaunch}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors mb-1 ${
                isActive 
                    ? 'bg-emerald-600/20 border border-emerald-500/30' 
                    : 'hover:bg-gray-800'
            }`}
            title={collapsed ? tool.name : undefined}
        >
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                {!faviconError ? (
                    <img 
                        src={faviconUrl} 
                        alt="" 
                        className="w-5 h-5"
                        onError={() => setFaviconError(true)}
                    />
                ) : (
                    <Globe size={16} className="text-gray-500" />
                )}
            </div>
            {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {tool.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{tool.category}</p>
                </div>
            )}
            {!collapsed && isActive && (
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
        </button>
    );
}

