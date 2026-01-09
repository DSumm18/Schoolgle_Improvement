"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Send, Lock, ShieldCheck } from 'lucide-react';

const CTASection = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <section id="early-access" className="py-32 px-6 bg-lp-bg relative overflow-hidden">
            {/* Background radial glow */}
            <div className="absolute inset-x-0 bottom-0 h-[500px] bg-lp-accent/10 blur-[120px] rounded-[100%] translate-y-1/2 pointer-events-none" />

            <div className="container max-w-5xl mx-auto relative z-10 px-6 py-20 rounded-[4rem] border border-lp-border shadow-2xl pilot-gradient overflow-hidden">
                <div className="text-center max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="w-16 h-16 rounded-2xl bg-lp-accent/20 border border-lp-accent/30 flex items-center justify-center mx-auto mb-8"
                    >
                        <Send className="text-lp-accent" size={24} />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-6xl font-black text-lp-text outfit tracking-tight leading-tight mb-8"
                    >
                        Ready to shape the <br /><span className="text-lp-accent">Future of Readiness?</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-lp-text-sec font-medium mb-12"
                    >
                        Join 20+ forward-thinking UK schools in our Early Access Pilot. No commitment, just a smarter way to lead.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="max-w-md mx-auto"
                    >
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="relative group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your school email"
                                    required
                                    className="w-full pl-6 pr-40 py-5 bg-lp-bg border-2 border-lp-border rounded-2xl text-lp-text font-bold placeholder:text-lp-text-muted focus:outline-none focus:border-lp-accent transition-all group-hover:border-lp-border-hover"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-2 bottom-2 px-6 bg-lp-accent text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all btn-scale shadow-lg shadow-blue-500/20"
                                >
                                    Join the Pilot
                                </button>
                            </form>
                        ) : (
                            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center gap-4">
                                <CheckCircle2 className="text-emerald-500" size={40} />
                                <p className="text-lp-text font-bold">Thank you! We've added you to the list.</p>
                            </div>
                        )}

                        {/* Trust Badges */}
                        <div className="flex flex-wrap justify-center gap-6 mt-10">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-lp-text-muted">
                                <CheckCircle2 size={12} className="text-emerald-500" /> Free during pilot
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-lp-text-muted">
                                <Lock size={12} className="text-lp-amber" /> Cancel anytime
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-lp-text-muted">
                                <ShieldCheck size={12} className="text-lp-accent" /> UK Data Hosted
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
