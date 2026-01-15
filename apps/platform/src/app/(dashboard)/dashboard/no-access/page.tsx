"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

export default function NoAccessPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full glass-card rounded-[3rem] p-12 text-center space-y-8"
            >
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <ShieldAlert size={40} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Restricted</h1>
                    <p className="text-slate-500 font-medium">
                        Your account role does not have permission to view this specific app or module.
                    </p>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Link
                        href="/dashboard"
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                    >
                        <Home size={16} /> Return to Dashboard
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full py-4 bg-white text-slate-500 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                    >
                        <ArrowLeft size={16} /> Go Back
                    </button>
                </div>

                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Contact your administrator if you believe this is an error.
                </p>
            </motion.div>
        </div>
    );
}
