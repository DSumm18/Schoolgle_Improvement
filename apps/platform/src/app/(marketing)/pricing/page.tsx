"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Shield } from 'lucide-react';
import Link from 'next/link';

const tiers = [
    {
        name: "School",
        price: "Simple",
        desc: "Everything single-form schools need to automate their day-to-day.",
        features: ["All 6 core modules", "Unlimited staff users", "Parent chatbot integration", "Standard EDI integrations"],
        cta: "Book a demo"
    },
    {
        name: "Trust / MAT",
        price: "Strategic",
        desc: "Aggregated insights and shared governance for groups of schools.",
        features: ["Multi-school dashboard", "Shared policy repository", "Trust-wide risk management", "Priority support & training"],
        cta: "Book a demo",
        featured: true
    }
];

export default function PricingPage() {
    return (
        <main className="pt-32 pb-40 px-6 bg-background transition-colors duration-700">
            <div className="max-w-7xl mx-auto">
                <div className="text-center space-y-8 mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Simple & Transparent</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
                        One system. <br />
                        <span className="text-slate-400 dark:text-slate-600">Fair pricing.</span>
                    </h1>

                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        We don't do hidden fees or complex seat-based pricing. Just simple, predictable annual costs based on your school's needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {tiers.map((tier, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-12 rounded-[3.5rem] border transition-all duration-500 ${tier.featured
                                    ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-2xl md:scale-105 relative z-10'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10 text-slate-900 dark:text-white'
                                }`}
                        >
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">{tier.name}</h3>
                                    <h4 className="text-4xl font-black uppercase tracking-tight">{tier.price}</h4>
                                    <p className={`text-sm font-medium ${tier.featured ? 'opacity-80' : 'text-slate-500'}`}>{tier.desc}</p>
                                </div>

                                <ul className="space-y-4">
                                    {tier.features.map((feature, j) => (
                                        <li key={j} className="flex gap-4 items-center">
                                            <Check className={`w-4 h-4 ${tier.featured ? 'text-blue-400 dark:text-blue-600' : 'text-slate-400'}`} />
                                            <span className="text-sm font-black uppercase tracking-widest text-[10px]">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/early-access"
                                    className={`w-full py-5 rounded-full font-black text-xs uppercase tracking-widest text-center block transition-all hover:scale-105 active:scale-95 ${tier.featured
                                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl'
                                        }`}
                                >
                                    {tier.cta}
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-24 p-12 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[4rem] text-center space-y-4">
                    <Shield className="w-8 h-8 mx-auto text-slate-400 mb-4" />
                    <h5 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Built for UK Schools</h5>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-black leading-loose">
                        GDPR Compliant · Secure SSO Integration · DfE Framework Aligned
                    </p>
                </div>
            </div>
        </main>
    );
}
