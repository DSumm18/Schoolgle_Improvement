"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, X, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APPS, getModuleByPath, canUserAccess, Role } from '@/lib/modules/registry';
import { useAuth } from '@/context/SupabaseAuthContext';

export default function AppLauncher() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { organization } = useAuth();
    const userRole = organization?.role as Role;

    const currentModule = getModuleByPath(pathname);

    // Filter apps to show only those in the current module (or all if not in a module)
    const moduleApps = APPS.filter(app => {
        // If we are in a module, only show apps for that module
        if (currentModule) {
            return app.moduleId === currentModule.id;
        }
        // If not in a module (e.g. root dashboard), show nothing or maybe featured apps?
        // Requirement says "ONLY apps for the current module".
        return false;
    }).filter(app => canUserAccess(app.requiredPermissions, userRole));

    if (!currentModule || moduleApps.length === 0) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center ${isOpen
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-700'
                    }`}
                title="App Launcher"
            >
                {isOpen ? <X size={20} /> : <LayoutGrid size={20} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm"
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute left-0 mt-4 w-80 z-[60] origin-top-left"
                        >
                            <div className="glass-card rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest mb-1">
                                        <Sparkles size={12} /> {currentModule.name} Suite
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Active Apps</h3>
                                </div>

                                <div className="p-4 space-y-2">
                                    {moduleApps.map((app) => (
                                        <Link
                                            key={app.id}
                                            href={app.route}
                                            onClick={() => setIsOpen(false)}
                                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all group ${pathname === app.route
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${pathname === app.route ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                <app.icon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                    {app.name}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 line-clamp-1">
                                                    {app.shortDescription}
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    ))}
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                                    >
                                        Close Launcher
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
