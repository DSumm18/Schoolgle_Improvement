"use client";

import React from 'react';
import { motion } from 'framer-motion';
import EarlyAccessForm from '@/components/website/EarlyAccessForm';

const EarlyAccessPage = () => {
    return (
        <main className="pt-24 min-h-screen bg-background transition-colors duration-700">
            {/* Hero Section */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Demo Registration</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
                        Book a <br />
                        <span className="text-slate-400 dark:text-slate-600">Demo.</span>
                    </h1>

                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        We're working with a small group of UK primary schools, trusts, and MATs to shape the future of school improvement.
                    </p>
                </div>
            </section>

            {/* Form Section */}
            <section className="pb-32 px-6">
                <div className="max-w-4xl mx-auto bg-slate-50/50 dark:bg-white/5 rounded-[4rem] p-4 border border-slate-100 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10" />
                    <EarlyAccessForm />
                </div>
            </section>

            {/* What happens next? */}
            <section className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-100 dark:border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { title: "Personal Demo", desc: "We'll show you how Schoolgle works with your specific context and systems." },
                        { title: "Safe Setup", desc: "We guide you through the process of setting up Ed with your school's data and policies." },
                        { title: "Continuous Support", desc: "As a pilot school, you get direct access to our founding team and influence our roadmap." }
                    ].map((item, i) => (
                        <div key={i} className="space-y-4">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{item.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
};

export default EarlyAccessPage;
