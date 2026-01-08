"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Send, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';

interface FlightData {
    url: string;
    userAgent: string;
    timestamp: string;
    recentActions: string[];
}

export default function SupportWidget() {
    const { user, organization } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recentActions, setRecentActions] = useState<string[]>([]);

    // Simple "Flight Recorder" to track last few clicks/actions
    useEffect(() => {
        const handleAction = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const action = `Clicked: ${target.innerText || target.tagName} (${window.location.pathname})`;
            setRecentActions(prev => [action, ...prev].slice(0, 10));
        };

        window.addEventListener('click', handleAction);
        return () => window.removeEventListener('click', handleAction);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const flightData: FlightData = {
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            recentActions
        };

        try {
            const response = await fetch('/api/support/ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    email: user?.email,
                    orgId: organization?.id,
                    subject,
                    description,
                    priority,
                    flightData
                })
            });

            if (!response.ok) throw new Error('Failed to submit ticket');

            setSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                setSubject('');
                setDescription('');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-96 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Mission Control</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ops Support</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[500px] overflow-y-auto">
                            {submitted ? (
                                <div className="py-12 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                        <Send size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white">Ticket Launched!</h4>
                                        <p className="text-sm text-slate-500 font-bold mt-1">Our ops team has been notified. We'll be in touch shortly.</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subject</label>
                                        <input
                                            required
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Briefly describe the issue"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Details</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Tell us what happened..."
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Priority</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['low', 'medium', 'high'].map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setPriority(p)}
                                                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${priority === p
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                            <AlertCircle size={14} />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        disabled={isSubmitting}
                                        type="submit"
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                        Launch Support Ticket
                                    </button>

                                    <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest">
                                        This will include a snapshot of recent actions to help us debug.
                                    </p>
                                </form>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {isOpen ? <X size={24} /> : <HelpCircle size={24} />}
            </motion.button>
        </div>
    );
}
