"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Brain, ChevronDown, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface FrameworkScanControlsProps {
    isScanning: boolean;
    accessToken: string | null;
    providerId: string | null;
    showScanConfig: boolean;
    setShowScanConfig: (show: boolean) => void;
    selectedFolderId: string;
    setSelectedFolderId: (id: string) => void;
    onStartScan: () => void;
    onConnect: () => void;
    scanProgress: {
        status: 'idle' | 'scanning' | 'complete' | 'error';
        message?: string;
        stats?: {
            processedFiles: number;
            evidenceMatches: number;
            skippedFiles: number;
            failedFiles: number;
        };
    };
    setScanProgress: (p: any) => void;
}

export const FrameworkScanControls: React.FC<FrameworkScanControlsProps> = ({
    isScanning,
    accessToken,
    providerId,
    showScanConfig,
    setShowScanConfig,
    selectedFolderId,
    setSelectedFolderId,
    onStartScan,
    onConnect,
    scanProgress,
    setScanProgress
}) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Inspection Readiness
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Automated evidence matching across your cloud storage
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {!accessToken ? (
                        <button
                            onClick={onConnect}
                            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                        >
                            <RefreshCw size={20} />
                            Connect Drive to Scan
                        </button>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowScanConfig(!showScanConfig)}
                                disabled={isScanning}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${isScanning
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                    }`}
                            >
                                <RefreshCw size={20} className={isScanning ? 'animate-spin' : ''} />
                                {isScanning ? 'Analyzing...' : 'Scan for Evidence'}
                                <ChevronDown size={18} className={`ml-1 transition-transform ${showScanConfig ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showScanConfig && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-80 glass-card rounded-2xl p-6 z-50 overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Brain size={120} />
                                        </div>

                                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 relative z-10">Scan Configuration</h3>

                                        <div className="space-y-4 relative z-10">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Storage Source</label>
                                                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800">
                                                    <div className={`w-2 h-2 rounded-full ${providerId === 'microsoft.com' ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`} />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {providerId === 'microsoft.com' ? 'Azure OneDrive' : 'Google Workspace'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Folder</label>
                                                <input
                                                    type="text"
                                                    value={selectedFolderId}
                                                    onChange={(e) => setSelectedFolderId(e.target.value)}
                                                    placeholder="root"
                                                    className="w-full p-3 bg-white dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-2 italic px-1">Use "root" or a specific Folder ID to limit scan scope.</p>
                                            </div>

                                            <button
                                                onClick={onStartScan}
                                                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                <Brain size={18} />
                                                Initiate AI Analysis
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Notification */}
            <AnimatePresence>
                {scanProgress.status !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        className={`p-6 rounded-2xl border-2 flex items-start gap-4 shadow-xl ${scanProgress.status === 'error'
                                ? 'bg-rose-50/80 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-400'
                                : scanProgress.status === 'complete'
                                    ? 'bg-emerald-50/80 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-400'
                                    : 'bg-blue-50/80 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-400'
                            }`}
                    >
                        <div className={`p-2 rounded-xl ${scanProgress.status === 'complete' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                scanProgress.status === 'error' ? 'bg-rose-100 dark:bg-rose-900/30' :
                                    'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                            {scanProgress.status === 'scanning' && <RefreshCw className="animate-spin" size={20} />}
                            {scanProgress.status === 'complete' && <CheckCircle size={20} />}
                            {scanProgress.status === 'error' && <AlertTriangle size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm mb-1">{scanProgress.message}</h4>
                            {scanProgress.stats && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                                    <StatItem label="Processed" value={scanProgress.stats.processedFiles} />
                                    <StatItem label="Matches" value={scanProgress.stats.evidenceMatches} />
                                    <StatItem label="Skipped" value={scanProgress.stats.skippedFiles} />
                                    <StatItem label="Failed" value={scanProgress.stats.failedFiles} />
                                </div>
                            )}
                        </div>

                        {scanProgress.status !== 'scanning' && (
                            <button
                                onClick={() => setScanProgress({ status: 'idle' })}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatItem = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold opacity-60 tracking-wider transition-opacity">{label}</span>
        <span className="text-sm font-black">{value}</span>
    </div>
);
